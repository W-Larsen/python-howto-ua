"""Тести Python-обв'язки сторінки Touch The Globe (globe/web_runner.py).

Знімок проєкту (globe/touch-the-globe.zip) розпаковується в тимчасову
папку - так само, як це робить Pyodide у браузері.
Запуск з кореня репозиторію: python3 -m unittest tests/test_globe_runner.py -v
"""
import json
import pathlib
import sys
import tempfile
import time
import unittest
import zipfile

SITE = pathlib.Path(__file__).resolve().parent.parent
ZIP = SITE / "globe" / "touch-the-globe.zip"


class Snapshot(unittest.TestCase):
    def test_zip_has_core_and_no_secrets(self):
        names = zipfile.ZipFile(ZIP).namelist()
        self.assertIn("Touch_The_Globe/globe_core/engine.py", names)
        self.assertIn("Touch_The_Globe/students/task1.py", names)
        self.assertNotIn("Touch_The_Globe/.env", names)
        self.assertFalse([n for n in names if "fixtures/solutions" in n])


TMP = tempfile.mkdtemp()
zipfile.ZipFile(ZIP).extractall(TMP)
ROOT = pathlib.Path(TMP) / "Touch_The_Globe"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(SITE / "globe"))
import web_runner as W  # noqa: E402

W.setup(str(ROOT))

T1 = (
    "from globe_api import *\n\n"
    "def on_button(number):\n"
    "    if number == 1:\n"
    '        play_sound("UA")\n'
    '        show_country("UA")\n'
    "    elif number == 2:\n"
    '        show_country("JP")\n\n'
    "def hello_screen():\n"
    '    show_text(0, "Hi!")\n'
)
T2 = (
    "def next_target(round):\n"
    '    target("JP", "Tokyo!")\n\n'
    "def on_hit(correct, ms):\n"
    "    if correct:\n"
    '        show_text(3, "Yes")\n'
    "    else:\n"
    '        show_text(3, "No")\n'
)
T5 = (
    "def loading():\n"
    '    bar = ""\n'
    "    for i in range(3):\n"
    '        bar = bar + "#"\n'
    "        show_text(3, bar)\n"
    "        wait(100)\n"
)
BAD = 'def hello_screen():\n    show_text(9, "x")\n'


def src(**tasks):
    return json.dumps({name.replace("_", ".") : code for name, code in tasks.items()})


def frames(result):
    return [e for e in result["events"] if e["kind"] == "frame"]


class Runner(unittest.TestCase):
    def test_press_1_shows_ukraine_and_plays_sound(self):
        r = json.loads(W.run_script(src(task1_py=T1), "1"))
        last = frames(r)[-1]
        self.assertEqual(last["rows"][0], "Ukraine")
        self.assertTrue(last["inv"][0])
        self.assertIn("UA", [e["id"] for e in r["events"] if e["kind"] == "sound"])

    def test_boot_shows_hello_screen(self):
        r = json.loads(W.run_script(src(task1_py=T1), ""))
        self.assertEqual(frames(r)[-1]["rows"][0], "Hi!")

    def test_boot_runs_loading_with_time(self):
        r = json.loads(W.run_script(src(task5_py=T5), ""))
        bars = [f["rows"][3] for f in frames(r)]
        self.assertEqual(bars[:3], ["#", "##", "###"])
        self.assertLess(frames(r)[0]["t"], frames(r)[2]["t"])

    def test_check_reports_row_out_of_range_with_line(self):
        p = json.loads(W.check(src(task1_py=BAD)))["problems"]
        self.assertTrue(
            any(x["file"] == "task1.py" and x["line"] == 2 and x["level"] == "error" for x in p), p
        )

    def test_errors_block_running(self):
        r = json.loads(W.run_script(src(task1_py=BAD), "1"))
        self.assertTrue(r["problems"])
        self.assertEqual(r["events"], [])

    def test_endless_while_is_a_warning_not_a_hang(self):
        loop = "def loading():\n    while True:\n        wait(1)\n"
        r = json.loads(W.run_script(src(task5_py=loop), ""))
        self.assertTrue(any(e["kind"] == "warn" and "while" in e["text"] for e in r["events"]))

    def test_bad_token_is_reported(self):
        r = json.loads(W.run_script(src(task1_py=T1), "1 x"))
        self.assertIn("x", r["error"])

    def test_script_game_with_times(self):
        r = json.loads(W.run_script(src(task1_py=T1, task2_py=T2), "g 2:600 1:3000"))
        rows3 = [f["rows"][3] for f in frames(r)]
        self.assertIn("Yes", rows3)
        self.assertIn("No", rows3)

    def test_live_game_timeout_by_tick(self):
        W.live_start(src(task1_py=T1, task2_py=T2), 0)
        W.live_press("g", 0)
        r = json.loads(W.live_tick(60000))
        self.assertTrue(any(e["kind"] == "frame" and e["rows"][3] == "No" for e in r["events"]))

    def test_live_game_measures_real_reaction_time(self):
        t2 = (
            "def next_target(round):\n"
            '    target("JP", "Tokyo!")\n\n'
            "def on_hit(correct, ms):\n"
            "    show_text(3, str(ms))\n"
        )
        W.live_start(src(task1_py=T1, task2_py=t2), 0)
        W.live_press("g", 0)  # відлік 3-2-1 = 1,5 с: раунд починається о 1500 мс
        r = json.loads(W.live_press("2", 1800))
        self.assertIn("300", [f["rows"][3] for f in frames(r)])

    def test_huge_for_loop_is_stopped_not_hanging(self):
        code = "def loading():\n    x = 0\n    for i in range(1000000000):\n        x = x + 1\n"
        started = time.time()
        r = json.loads(W.run_script(src(task5_py=code), ""))
        self.assertLess(time.time() - started, 15)
        self.assertTrue(
            any(e["kind"] == "warn" and "2 000 000 разів - симулятор зупинив функцію, щоб" in e["text"]
                for e in r["events"]),
            r["events"],
        )

    def test_normal_loops_are_not_limited(self):
        code = "def loading():\n    x = 0\n    for i in range(200):\n        for j in range(200):\n            x = x + 1\n    show_text(3, str(x))\n    wait(10)\n"
        r = json.loads(W.run_script(src(task5_py=code), ""))
        self.assertIn("40000", [f["rows"][3] for f in frames(r)])

    def test_live_press_shows_country(self):
        W.live_start(src(task1_py=T1), 0)
        r = json.loads(W.live_press("2", 100))
        self.assertEqual(frames(r)[-1]["rows"][0], "Japan")

    def test_header_matches_make_build(self):
        from tools.build_student_code import render

        d = pathlib.Path(tempfile.mkdtemp())
        (d / "task1.py").write_text(T1, encoding="utf-8")
        (d / "task5.py").write_text(T5, encoding="utf-8")
        expected, _ = render(ROOT, students_dir=d)
        got = json.loads(W.build_header(src(task1_py=T1, task5_py=T5)))
        self.assertIsNotNone(expected)
        self.assertEqual(got["header"], expected)

    def test_untouched_templates_run_without_errors(self):
        templates = {
            "task{}.py".format(n): (ROOT / "students" / "task{}.py".format(n)).read_text(encoding="utf-8")
            for n in range(1, 6)
        }
        r = json.loads(W.run_script(json.dumps(templates), "1 q g"))
        self.assertEqual([p for p in r["problems"] if p["level"] == "error"], [])
        self.assertEqual(r["error"], "")

    def test_print_goes_to_the_tape(self):
        code = 'def on_button(number):\n    print("pressed", number)\n'
        r = json.loads(W.run_script(src(task1_py=code), "3"))
        self.assertIn("pressed 3", [e["text"] for e in r["events"] if e["kind"] == "print"])

    def test_header_refuses_code_with_errors(self):
        got = json.loads(W.build_header(src(task1_py=BAD)))
        self.assertIsNone(got["header"])
        self.assertTrue(got["problems"])


if __name__ == "__main__":
    unittest.main()
