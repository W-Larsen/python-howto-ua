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


# У проєкті лишається лише Україна; Японія - демо-країна, яку тести додають так само,
# як її додав би вчитель на сайті.
JP = {
    "name": "Японія", "capital": "Токіо", "continent": "Азія",
    "lcd_name": "Japan", "lcd_capital": "Tokyo", "text": "Японія - країна суші й аніме.",
}


class WithJapan(unittest.TestCase):
    def setUp(self):
        W.set_extra_countries(json.dumps([{"id": "JP", "fields": JP, "has_audio": False}]))

    def tearDown(self):
        W.set_extra_countries("[]")


def src(**tasks):
    return json.dumps({name.replace("_", ".") : code for name, code in tasks.items()})


def frames(result):
    return [e for e in result["events"] if e["kind"] == "frame"]


class Runner(WithJapan):
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


FR = {
    "name": "Франція", "capital": "Париж", "continent": "Європа",
    "lcd_name": "France", "lcd_capital": "Paris", "text": "Франція - країна сиру й Ейфелевої вежі.",
}


def extra(cid, fields, has_audio=True):
    return {"id": cid, "fields": fields, "has_audio": has_audio}


def catalog():
    return {c["id"]: c for c in json.loads(W.catalog_list())}


class Countries(unittest.TestCase):
    """Країни, які вчитель додав на сайті поверх знімка проєкту."""

    def tearDown(self):
        W.set_extra_countries("[]")

    def test_country_file_round_trips_through_the_parser(self):
        from globe_core.catalog import parse_country_file

        fields, texts = parse_country_file("FR", W.country_file(json.dumps(FR)))
        self.assertEqual(fields["lcd_name"], "France")
        self.assertEqual(texts[0], FR["text"])

    def test_check_country_rejects_cyrillic_and_bad_id(self):
        bad = dict(FR, lcd_name="Франція")
        r = json.loads(W.check_country("FR", json.dumps(bad)))
        self.assertTrue(any("lcd_name" in e for e in r["errors"]), r)
        r = json.loads(W.check_country("fr1x", json.dumps(FR)))
        self.assertTrue(r["errors"])
        self.assertEqual(json.loads(W.check_country("FR", json.dumps(FR)))["errors"], [])

    def test_added_country_is_known_and_shifts_tracks(self):
        before = catalog()["UA"]["track"]
        r = json.loads(W.set_extra_countries(json.dumps([extra("FR", FR)])))
        self.assertEqual(r["skipped"], [])
        now = catalog()
        self.assertTrue(now["FR"]["extra"])
        self.assertFalse(now["FR"]["override"])
        self.assertEqual(now["UA"]["track"], before + 1)
        code = 'def on_button(number):\n    show_country("FR")\n'
        self.assertEqual([p for p in json.loads(W.check(src(task1_py=code)))["problems"] if p["level"] == "error"], [])
        r = json.loads(W.run_script(src(task1_py=code), "1"))
        self.assertEqual(frames(r)[-1]["rows"][0], "France")

    def test_override_and_restore_of_a_project_country(self):
        mine = dict(FR, name="Україна", lcd_name="Ukraina", lcd_capital="Kyiv")
        W.set_extra_countries(json.dumps([extra("UA", mine)]))
        self.assertEqual(catalog()["UA"]["lcd_name"], "Ukraina")
        self.assertTrue(catalog()["UA"]["override"])
        W.set_extra_countries("[]")
        self.assertEqual(catalog()["UA"]["lcd_name"], "Ukraine")
        self.assertFalse(catalog()["UA"]["extra"])
        self.assertNotIn("FR", catalog())

    def test_invalid_country_is_skipped_the_rest_added(self):
        bad = dict(FR, lcd_name="Дуже довга назва країни")
        r = json.loads(W.set_extra_countries(json.dumps([extra("XX", bad), extra("FR", FR)])))
        self.assertEqual([s["id"] for s in r["skipped"]], ["XX"])
        self.assertIn("FR", catalog())
        self.assertNotIn("XX", catalog())

    def test_countries_header_matches_build_arduino_data(self):
        from globe_core.catalog import load_catalog
        from tools.build_arduino_data import render_header

        W.set_extra_countries(json.dumps([extra("FR", FR)]))
        got = json.loads(W.countries_header())
        expected = render_header(load_catalog(str(ROOT / "content" / "countries")))
        self.assertEqual(got["header"], expected)
        self.assertIn('"France"', got["header"])


class ButtonCountries(WithJapan):
    """Таблиця «кнопка -> країна» від вчителя: ігри не залежать від task1."""

    def tearDown(self):
        W.set_button_countries("[]")
        WithJapan.tearDown(self)

    def test_table_is_applied_and_written_to_settings_py(self):
        r = json.loads(W.set_button_countries('["UA", "JP"]'))
        self.assertEqual(r["countries"], ["UA", "JP"])
        self.assertEqual(json.loads(W.button_countries()), ["UA", "JP"])
        self.assertIn('BUTTON_COUNTRIES = ["UA", "JP"]', W.settings_text())
        W.set_button_countries("[]")
        self.assertEqual(json.loads(W.button_countries()), [])
        self.assertIn("BUTTON_COUNTRIES = []", W.settings_text())

    def test_bad_ids_are_dropped_not_written(self):
        r = json.loads(W.set_button_countries('["ua", "U1", 5, "", "JP"]'))
        self.assertEqual(r["countries"], ["UA", "", "", "", "JP"])

    def test_settings_py_without_the_line_gets_it(self):
        path = ROOT / "settings.py"
        original = path.read_text(encoding="utf-8")
        try:
            path.write_text(original.replace("BUTTON_COUNTRIES = []\n", ""), encoding="utf-8")
            W.setup(str(ROOT))
            W.set_button_countries('["JP"]')
            self.assertIn('BUTTON_COUNTRIES = ["JP"]', W.settings_text())
            self.assertEqual(json.loads(W.button_countries()), ["JP"])
        finally:
            path.write_text(original, encoding="utf-8")
            W.setup(str(ROOT))

    def test_game_runs_without_task1(self):
        W.set_button_countries('["UA", "JP"]')
        r = json.loads(W.run_script(src(task2_py=T2), "g 2:600 1:3000"))
        rows3 = [f["rows"][3] for f in frames(r)]
        self.assertIn("Yes", rows3)
        self.assertIn("No", rows3)
        self.assertTrue(any(e["kind"] == "note" and "кнопка 2" in e["text"] for e in r["events"]))

    def test_check_warns_when_task1_disagrees_but_does_not_block(self):
        W.set_button_countries('["JP", "UA"]')
        problems = json.loads(W.check(src(task1_py=T1)))["problems"]
        mine = [p for p in problems if p["file"] == "task1.py"]
        self.assertEqual({p["level"] for p in mine}, {"warning"}, problems)
        self.assertEqual(len(mine), 2)
        self.assertIn("кнопка 1 за таблицею вчителя - JP", mine[0]["text"])
        r = json.loads(W.run_script(src(task1_py=T1), "1"))
        self.assertEqual(frames(r)[-1]["rows"][0], "Ukraine")
        self.assertTrue(any(p["level"] == "warning" and p["file"] == "task1.py" for p in r["problems"]))

    def test_check_is_quiet_when_task1_matches_or_no_table(self):
        self.assertEqual(json.loads(W.check(src(task1_py=T1)))["problems"], [])
        W.set_button_countries('["UA", "JP"]')
        self.assertEqual(json.loads(W.check(src(task1_py=T1)))["problems"], [])

    def test_header_carries_the_table_to_the_board(self):
        W.set_button_countries('["UA", "JP"]')
        got = json.loads(W.build_header(src(task1_py=T1)))
        self.assertIn(
            "void student_button_answer(long number) {\n"
            "  if (number == 1) {\n"
            '    show_country("UA");\n'
            "  } else if (number == 2) {\n"
            '    show_country("JP");\n'
            "  }\n"
            "}",
            got["header"],
        )
        self.assertNotIn("BUTTON_COUNTRIES[]", got["header"])


if __name__ == "__main__":
    unittest.main()
