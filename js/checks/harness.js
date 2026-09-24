/* ==========================================================================
   Python-обв'язка самостійних робіт. Виконується в Pyodide один раз
   (js/checks/python.js), а в тестах — звичайним python3
   (tests/test_harness.py витягає код із цього файлу).

   check_install / check_test — завдання «функція» (тип code): код учня
   встановлюється в окремий простір імен, функцію проганяють на прихованих
   тестах.
   prog_run — завдання «програма» (тип program): код щоразу запускається
   з нуля, input() бере рядки з input_text, print() пишеться в буфер.

   Ліміт: у тіло кожного for/while коду учня вставляється виклик __tick__().
   Після MAX_STEPS проходів він кидає _TooLong на КОЖНОМУ наступному —
   навіть голий except: усередині циклу не втримає нескінченний цикл.
   (sys.settrace тут не годиться: після винятку з трасувальника CPython
   вимикає трасування.)

   Код лежить у String.raw — у ньому не можна бектиків і послідовності
   долар+фігурна дужка.
   ========================================================================== */
"use strict";
window.CheckHarness = { PY: String.raw`
import ast, io, json
from contextlib import redirect_stdout

MAX_STEPS = 200000
PROG_NO_INPUT = "Програма просить більше даних, ніж передбачено умовою"
PROG_TOO_LONG = "Схоже, цикл ніколи не закінчується — програма зробила забагато кроків"


class _NoInput(BaseException):
    pass


class _TooLong(BaseException):
    pass


class _Budget:
    # лічильник проходів циклів коду учня
    def __init__(self, max_steps):
        self.max_steps = max_steps
        self.left = max_steps

    def reset(self):
        self.left = self.max_steps

    def __call__(self):
        self.left -= 1
        if self.left < 0:
            raise _TooLong()


class _AddTicks(ast.NodeTransformer):
    def _tick(self, node):
        self.generic_visit(node)
        tick = ast.Expr(ast.Call(ast.Name("__tick__", ast.Load()), [], []))
        node.body.insert(0, ast.copy_location(tick, node))
        return node

    visit_For = _tick
    visit_While = _tick
    visit_AsyncFor = _tick


def _compile(source, filename):
    tree = _AddTicks().visit(ast.parse(source, filename))
    return compile(ast.fix_missing_locations(tree), filename, "exec")


def _error_text(error):
    if isinstance(error, _TooLong):
        return PROG_TOO_LONG
    if isinstance(error, _NoInput):
        return PROG_NO_INPUT
    return f"{type(error).__name__}: {error}"


def _no_input(prompt=""):
    raise _NoInput()


# ---------------------------------------------------------------- «функція»
_CHECK_FUNCS = {}


def check_install(name, source):
    _CHECK_FUNCS.pop(name, None)
    budget = _Budget(MAX_STEPS)
    namespace = {"__tick__": budget, "input": _no_input}
    try:
        exec(_compile(source, f"{name}.py"), namespace)
    except (Exception, _NoInput, _TooLong) as error:
        return f"Помилка в коді — {_error_text(error)}"
    func = namespace.get(name)
    if not callable(func):
        return f"У коді немає функції {name}(...) — не перейменовуй її."
    _CHECK_FUNCS[name] = (func, budget)
    return ""


def _check_equal(actual, expected):
    try:
        if isinstance(expected, float) and isinstance(actual, bool):
            return False  # True == 1.0 у Python, але True — не число
        if isinstance(expected, float) and isinstance(actual, (int, float)):
            return abs(actual - expected) < 1e-6
        return bool(actual == expected)
    except Exception:
        return False


def check_test(name, tests_json):
    entry = _CHECK_FUNCS.get(name)
    if entry is None:
        return json.dumps({"ok": False})
    func, budget = entry
    tests = json.loads(tests_json)
    try:
        for t in tests:
            budget.reset()
            with redirect_stdout(io.StringIO()):
                actual = func(*t["args"])
            if not _check_equal(actual, t["expected"]):
                return json.dumps({"ok": False})
    except (Exception, _NoInput, _TooLong):
        return json.dumps({"ok": False})
    return json.dumps({"ok": True})


# ---------------------------------------------------------------- «програма»
def prog_run(source, input_text, max_steps=MAX_STEPS):
    text = input_text.replace("\r\n", "\n").replace("\r", "\n")
    if text.endswith("\n"):
        text = text[:-1]
    feed = iter(text.split("\n") if text else [])

    def fake_input(prompt=""):
        # підказку не виводимо: у виводі має бути лише те, що друкує print()
        for line in feed:
            return line
        raise _NoInput()

    out = io.StringIO()
    namespace = {"__name__": "__main__", "__tick__": _Budget(max_steps), "input": fake_input}
    try:
        code = _compile(source, "main.py")
    except SyntaxError as error:
        return json.dumps({"out": "", "error": _error_text(error)}, ensure_ascii=False)
    error_text = ""
    try:
        with redirect_stdout(out):
            exec(code, namespace)
    except SystemExit:
        pass
    except (Exception, _NoInput, _TooLong) as error:
        error_text = _error_text(error)
    return json.dumps({"out": out.getvalue(), "error": error_text}, ensure_ascii=False)
` };
