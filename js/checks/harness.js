/* ==========================================================================
   Python-обв'язка самостійних робіт. Виконується в Pyodide один раз
   (js/checks/python.js), а в тестах — звичайним python3
   (tests/test_harness.py витягає код із цього файлу).

   check_install / check_test — завдання «функція» (тип code): код учня
   встановлюється в окремий простір імен, функцію проганяють на прихованих
   тестах. check_test рахує, скільки тестів пройдено (для часткового балу).
   Кожен тест виконується у власній порожній тимчасовій папці; необов'язкові
   поля тесту:
     files       — {ім'я: вміст} файли, які лежать у папці до виклику;
     expectFiles — {ім'я: вміст} якими мають бути файли після виклику
                   (\r\n і \n не розрізняються);
     raises      — ім'я винятку, який функція має кинути (або його предка);
     expected    — значення, яке має повернути функція (можна не вказувати,
                   якщо перевіряються лише файли).
   check_try — кнопка «Запустити»: встановлює код у папці з файлами-прикладами
   й повертає те, що код надрукував.
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
import ast, io, json, os, shutil, tempfile
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


def _norm_text(text):
    return text.replace("\r\n", "\n").replace("\r", "\n")


def _raised(error, name):
    return any(cls.__name__ == name for cls in type(error).__mro__)


class _Sandbox:
    # порожня тимчасова папка з файлами; усередині неї — поточна папка
    def __init__(self, files):
        self.files = files or {}

    def __enter__(self):
        self.old = os.getcwd()
        self.dir = tempfile.mkdtemp(prefix="check_")
        os.chdir(self.dir)
        for name, text in self.files.items():
            with open(name, "w", encoding="utf-8", newline="") as f:
                f.write(text)
        return self

    def __exit__(self, *exc):
        os.chdir(self.old)
        shutil.rmtree(self.dir, ignore_errors=True)
        return False


def _files_match(expect_files):
    for name, text in expect_files.items():
        try:
            with open(name, encoding="utf-8", newline="") as f:
                got = f.read()
        except (OSError, UnicodeDecodeError):
            return False
        if _norm_text(got) != _norm_text(text):
            return False
    return True


def _run_test(func, budget, t):
    # True / False; None — функція зациклилась (далі не проганяємо)
    budget.reset()
    with _Sandbox(t.get("files")):
        try:
            with redirect_stdout(io.StringIO()):
                actual = func(*t["args"])
        except _TooLong:
            return None
        except (Exception, _NoInput) as error:
            return "raises" in t and _raised(error, t["raises"])
        if "raises" in t:
            return False
        if "expected" in t and not _check_equal(actual, t["expected"]):
            return False
        return _files_match(t.get("expectFiles") or {})


def check_test(name, tests_json):
    tests = json.loads(tests_json)
    entry = _CHECK_FUNCS.get(name)
    passed = 0
    if entry is not None:
        func, budget = entry
        for t in tests:
            try:
                ok = _run_test(func, budget, t)
            except (Exception, _NoInput, _TooLong):
                ok = False
            if ok is None:
                break
            if ok:
                passed += 1
    return json.dumps({"ok": passed == len(tests), "passed": passed, "total": len(tests)})


def check_try(name, source, files_json="{}"):
    out = io.StringIO()
    with _Sandbox(json.loads(files_json)):
        with redirect_stdout(out):
            error = check_install(name, source)
    return json.dumps({"error": error, "out": out.getvalue()}, ensure_ascii=False)


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
