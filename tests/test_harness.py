"""Тести Python-обв'язки самостійних робіт (js/checks/harness.js).

Обв'язка живе рядком у JS, щоб сайт працював і без сервера; тут вона
витягається з файлу й виконується звичайним CPython.
Запуск з кореня репозиторію: python3 -m unittest tests/test_harness.py -v
"""
import json
import pathlib
import re
import unittest

SRC = pathlib.Path(__file__).resolve().parent.parent / "js" / "checks" / "harness.js"
PY = re.search(r"String\.raw`(.*?)`", SRC.read_text(encoding="utf-8"), re.S).group(1)
H = {}
exec(compile(PY, "harness.py", "exec"), H)


def run(source, inp="", steps=None):
    args = (source, inp) if steps is None else (source, inp, steps)
    return json.loads(H["prog_run"](*args))


class ProgRun(unittest.TestCase):
    def test_reads_input_and_prints(self):
        self.assertEqual(run("a = int(input())\nb = int(input())\nprint(a + b)\n", "2\n3"),
                         {"out": "5\n", "error": ""})

    def test_prompt_is_not_part_of_output(self):
        self.assertEqual(run('n = input("Введи ім\'я: ")\nprint(n)', "Оля")["out"], "Оля\n")

    def test_trailing_newline_in_input_is_ignored(self):
        self.assertEqual(run("a = input()\nb = input()\nprint(a, b)", "x\ny\n")["out"], "x y\n")

    def test_crlf_input(self):
        self.assertEqual(run("print(input())", "5\r\n")["out"], "5\n")

    def test_too_few_inputs(self):
        r = run("a = input()\nb = input()\nprint(a)", "1")
        self.assertEqual(r["error"], H["PROG_NO_INPUT"])

    def test_empty_input_text(self):
        self.assertEqual(run("input()", "")["error"], H["PROG_NO_INPUT"])

    def test_runtime_error_keeps_partial_output(self):
        r = run('print("A")\nx = 1 / 0\nprint("B")')
        self.assertEqual(r["out"], "A\n")
        self.assertTrue(r["error"].startswith("ZeroDivisionError"), r["error"])

    def test_value_error_text(self):
        r = run("n = int(input())", "abc")
        self.assertTrue(r["error"].startswith("ValueError: invalid literal for int()"), r["error"])

    def test_syntax_error(self):
        r = run("if True\n    print(1)")
        self.assertEqual(r["out"], "")
        self.assertTrue(r["error"].startswith("SyntaxError"), r["error"])

    def test_infinite_while_is_stopped(self):
        self.assertEqual(run("while True:\n    pass", steps=1000)["error"], H["PROG_TOO_LONG"])

    def test_infinite_loop_with_bare_except_inside_is_stopped(self):
        src = "while True:\n    try:\n        x = 1\n    except:\n        pass\n"
        self.assertEqual(run(src, steps=1000)["error"], H["PROG_TOO_LONG"])

    def test_catching_everything_around_the_loop_still_terminates(self):
        src = "try:\n    while True:\n        pass\nexcept:\n    print('спіймав')\n"
        self.assertEqual(run(src, steps=1000), {"out": "спіймав\n", "error": ""})

    def test_loop_inside_function_is_counted(self):
        src = "def f():\n    while True:\n        pass\nf()\n"
        self.assertEqual(run(src, steps=1000)["error"], H["PROG_TOO_LONG"])

    def test_legit_long_loop_fits_default_limit(self):
        r = run("t = 0\nfor i in range(100000):\n    t += i\nprint(t)")
        self.assertEqual(r, {"out": "4999950000\n", "error": ""})

    def test_fresh_namespace_each_run(self):
        run("x = 5")
        self.assertTrue(run("print(x)")["error"].startswith("NameError"))

    def test_system_exit_is_a_normal_end(self):
        self.assertEqual(run('print("A")\nraise SystemExit\nprint("B")'), {"out": "A\n", "error": ""})

    def test_random_is_available(self):
        self.assertEqual(run("import random\nprint(random.randint(1, 1))")["out"], "1\n")


class FunctionTasks(unittest.TestCase):
    def install(self, name, src):
        return H["check_install"](name, src)

    def passes(self, name, tests):
        return json.loads(H["check_test"](name, json.dumps(tests)))["ok"]

    def test_correct_function_passes(self):
        self.assertEqual(self.install("double", "def double(x):\n    return x * 2\n"), "")
        self.assertTrue(self.passes("double", [{"args": [2], "expected": 4}, {"args": [0], "expected": 0}]))

    def test_wrong_function_fails(self):
        self.install("double", "def double(x):\n    return x + 1\n")
        self.assertFalse(self.passes("double", [{"args": [2], "expected": 4}, {"args": [0], "expected": 0}]))

    def test_missing_function_message(self):
        self.assertEqual(self.install("double", "def twice(x):\n    return x * 2\n"),
                         "У коді немає функції double(...) — не перейменовуй її.")

    def test_syntax_error_message(self):
        msg = self.install("double", "def double(x)\n    return x\n")
        self.assertTrue(msg.startswith("Помилка в коді — SyntaxError"), msg)

    def test_float_tolerance(self):
        self.install("avg", "def avg(a, b):\n    return (a + b) / 3 * 3 / 2\n")
        self.assertTrue(self.passes("avg", [{"args": [1, 2], "expected": 1.5}]))

    def test_bool_is_not_a_number_match(self):
        self.install("one", "def one():\n    return True\n")
        self.assertFalse(self.passes("one", [{"args": [], "expected": 1.0}]))

    def test_infinite_loop_in_function_fails(self):
        self.install("hang", "def hang():\n    while True:\n        pass\n")
        self.assertFalse(self.passes("hang", [{"args": [], "expected": 1}]))

    def test_input_inside_function_fails_instead_of_blocking(self):
        self.install("ask", "def ask():\n    return input()\n")
        self.assertFalse(self.passes("ask", [{"args": [], "expected": ""}]))

    def test_print_inside_function_is_silenced(self):
        self.install("loud", "def loud():\n    print('шум')\n    return 1\n")
        self.assertTrue(self.passes("loud", [{"args": [], "expected": 1}]))

    def test_unknown_function_fails(self):
        self.assertFalse(self.passes("nope", [{"args": [], "expected": 1}]))


if __name__ == "__main__":
    unittest.main()
