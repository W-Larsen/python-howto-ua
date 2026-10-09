"""Обв'язка сторінки Touch The Globe: справжній глобус у браузері.

Сторінка #/globe розпаковує знімок проєкту (globe/touch-the-globe.zip) у
Pyodide і викликає звідси те саме ядро, що й make press / make test /
make build. Ядро нічого не знає про браузер: дисплей, колонка й годинник
тут підмінені записувачами, тож кожен виклик повертає «стрічку подій» -
кадри екрана, мигання, звуки й повідомлення з часом у мілісекундах.
JS програє цю стрічку з тими самими паузами, що й на справжньому глобусі.

Усі функції приймають і повертають JSON-рядки: так у JS приходять звичайні
об'єкти, а не проксі Pyodide.
Тести: python3 -m unittest tests/test_globe_runner.py -v
"""

import ast
import json
import os
import random
import re

from globe_core.catalog import Country, ContentError, load_catalog, parse_country_file
from globe_core.cpp_codegen import generate_header
from globe_core.engine import GAME, GlobeEngine
from globe_core.language import Context, analyze_all
from globe_core.problems import WARNING, Problem, has_errors
from globe_core.settings import load_settings
from globe_core.student_loader import (
    GUARD_FUNCTION,
    SAFE_BUILTINS,
    _add_defaults,
    _located,
    _LoopGuard,
    hook_defaults,
)
from globe_core.language import is_api_import

# Ті самі правила, що й у pc/cli.py (parse_token, DEFAULT_MS). Сам pc.cli
# не імпортуємо: він тягне за собою звук і ctypes, яких у браузері немає.
TOKEN = re.compile(r"^(\d+)(?:[:@](\d+))?$")
DEFAULT_MS = 1000
BAD_TOKEN = (
    "Не розумію '{}'. Пиши номер кнопки (1, 2, 3...), q - вікторина, "
    "g - гра, а в грі можна вказати час: 2:600"
)

# Python у браузері працює в тому ж потоці, що й сторінка: цикл на мільярд
# повторів (на платі - просто довга пауза) повісив би вкладку, а після
# перезавантаження сторінка знову ввімкнула б глобус і знову зависла.
# Тому кожен повтор for і while рахується, і після STEP_LIMIT повторів за
# одну команду функція учня зупиняється.
STEP_LIMIT = 2000000
STEP_FUNCTION = "__globe_step__"

_project = {}
_live = {}


class LoopBudget(Exception):
    """Забагато повторів циклів за одну команду."""


class _StepCounter(ast.NodeTransformer):
    """Першим рядком кожного циклу - виклик лічильника повторів."""

    def _count(self, node):
        self.generic_visit(node)
        node.body = _located(ast.parse(STEP_FUNCTION + "()").body, node.lineno) + node.body
        return node

    visit_For = _count
    visit_While = _count


def _compile(file, source, api, on_loop_stuck, defaults, step):
    """Як student_loader.compile_task, але ще з лічильником повторів."""
    tree = ast.parse(source, filename=file)
    tree.body = [node for node in tree.body if not is_api_import(node)]
    if defaults:
        _add_defaults(tree, defaults)
    tree = _LoopGuard(file).visit(tree)
    tree = _StepCounter().visit(tree)
    ast.fix_missing_locations(tree)

    namespace = {"__builtins__": SAFE_BUILTINS, "__name__": file[:-3]}
    namespace.update(api)
    namespace[GUARD_FUNCTION] = on_loop_stuck
    namespace[STEP_FUNCTION] = step
    exec(compile(tree, file, "exec"), namespace)
    return namespace


def setup(root):
    """Читає країни й settings.py зі знімка проєкту. Викликається один раз."""
    settings, settings_problems = load_settings(os.path.join(root, "settings.py"))
    catalog = load_catalog(os.path.join(root, "content", "countries"))
    _project.update(
        root=root,
        settings=settings,
        settings_problems=settings_problems,
        catalog=catalog,
        context=Context(catalog.ids(), settings.button_count),
    )


def _problem(problem):
    return {
        "file": problem.file,
        "line": problem.line,
        "level": problem.level,
        "message": problem.message,
        "text": str(problem),
    }


def _analyze(sources):
    infos, problems = analyze_all(sources, _project["context"])
    return infos, problems


# ---------------------------------------------------------------------------
# Записувачі замість заліза
# ---------------------------------------------------------------------------
class _Clock:
    """Віртуальний час: пауза в коді не чекає, а лише посуває стрілки."""

    def __init__(self):
        self.now = 0.0
        self.start = 0.0

    def __call__(self):
        return self.now

    def sleep(self, seconds):
        if seconds > 0:
            self.now += seconds

    def ms(self):
        return int(round((self.now - self.start) * 1000))


class _Tape:
    """Стрічка подій одного виклику."""

    def __init__(self, clock):
        self.clock = clock
        self.events = []
        self._last_frame = None

    def add(self, kind, **fields):
        event = {"t": self.clock.ms(), "kind": kind}
        event.update(fields)
        self.events.append(event)

    def reset(self):
        self.events = []
        self._last_frame = None

    # дисплей
    def refresh(self, screen):
        frame = (tuple(screen.rows), tuple(screen.inverted))
        if frame == self._last_frame:
            return
        self._last_frame = frame
        self.add("frame", rows=list(screen.rows), inv=list(screen.inverted))

    def blink(self, times):
        self.add("blink", times=times)
        # після мигання той самий кадр треба показати знову
        self._last_frame = None

    def note(self, text):
        self.add("note", text=text)

    def warn(self, text):
        self.add("warn", text=text)

    def say(self, *args, sep=" ", end="\n"):
        """print() учня: показуємо під дисплеєм, а не в консолі браузера."""
        self.add("print", text=sep.join(str(arg) for arg in args))


class _Speaker:
    def __init__(self, tape):
        self.tape = tape

    def play(self, audio_ref):
        self.tape.add("sound", id=audio_ref)

    def stop(self):
        pass


class _AudioSource:
    """Звук країни = її ID: mp3 бере вже JS із content/audio/ знімка."""

    def resolve(self, country):
        return country.id


class _Globe:
    """Глобус із записувачами та завантаженим кодом учня."""

    def __init__(self, sources, seed=None):
        self.clock = _Clock()
        self.steps = 0
        self.tape = _Tape(self.clock)
        self.engine = GlobeEngine(
            _project["catalog"],
            _project["settings"],
            display=self.tape,
            speaker=_Speaker(self.tape),
            audio_source=_AudioSource(),
            clock=self.clock,
            sleep=self.clock.sleep,
            rng=random.Random(seed),
            on_warning=self.tape.warn,
            on_note=self.tape.note,
        )
        infos, problems = _analyze(sources)
        self.problems = problems
        self.ready = not has_errors(problems)
        if not self.ready:
            return
        api = self.engine.api()
        api["print"] = self.tape.say
        hooks = {}
        for file, info in infos.items():
            functions = _compile(
                file, sources[file], api, self.engine.loop_stuck, hook_defaults(info), self.step
            )
            for name in info.functions:
                hooks[name] = functions[name]
        self.engine.set_hooks(hooks)
        self.problems = problems + self._button_problems()

    def _button_problems(self):
        """task1 проти таблиці вчителя: розбіжність - попередження, не помилка."""
        found = []
        warn = self.engine._on_warning
        self.engine._on_warning = found.append
        try:
            self.engine.check_buttons()
        finally:
            self.engine._on_warning = warn
        return [Problem(text, "task1.py", None, WARNING) for text in found]

    def step(self):
        self.steps += 1
        if self.steps > STEP_LIMIT:
            # щоб і вкладені виклики (show_country -> show_fact) теж зупинились
            self.steps = 0
            raise LoopBudget(
                "цикли повторилися понад {} разів - симулятор зупинив функцію, "
                "щоб сторінка не зависла. Зменш кількість повторів".format(
                    "{:,}".format(STEP_LIMIT).replace(",", " ")
                )
            )

    def begin(self, now_ms=None):
        """Нова стрічка. now_ms - справжній час браузера (живий режим)."""
        if now_ms is not None:
            self.clock.now = max(self.clock.now, now_ms / 1000.0)
        self.clock.start = self.clock.now
        self.steps = 0
        self.tape.reset()

    def press(self, token, live=False):
        """Одна команда в синтаксисі globe press. Повертає текст помилки або ''.

        live - натискання справжньої кнопки: тоді час відповіді в грі глобус
        міряє сам, а 1000 мс за замовчуванням - лише для команд-скриптів."""
        word = token.strip().lower()
        if word == "q":
            self.engine.touch_quiz()
            return ""
        if word == "g":
            self.engine.touch_game()
            return ""
        match = TOKEN.match(word)
        if match is None:
            return BAD_TOKEN.format(token)
        ms = int(match.group(2)) if match.group(2) else None
        if ms is None and self.engine.mode == GAME and not live:
            ms = DEFAULT_MS
        self.engine.touch_button(int(match.group(1)), ms)
        return ""

    def result(self, error=""):
        return json.dumps(
            {
                "events": self.tape.events,
                "problems": [_problem(p) for p in self.problems],
                "error": error,
            },
            ensure_ascii=False,
        )


def _crash(exc):
    return "{}: {}".format(type(exc).__name__, exc)


# ---------------------------------------------------------------------------
# Те, що викликає сторінка
# ---------------------------------------------------------------------------
def check(sources_json):
    """globe test: проблеми в коді учня, разом зі звіркою task1 із таблицею вчителя."""
    sources = json.loads(sources_json)
    try:
        problems = _Globe(sources).problems
    except Exception:
        # код учня не завантажився - лишаємо хоча б перевірку тексту
        _, problems = _analyze(sources)
    return json.dumps({"problems": [_problem(p) for p in problems]}, ensure_ascii=False)


def run_script(sources_json, command, seed=None):
    """Увімкнути глобус і виконати команди (globe press): '1 2', 'q 2 3 1', 'g 2:600'."""
    try:
        globe = _Globe(json.loads(sources_json), seed)
    except Exception as exc:
        return json.dumps({"events": [], "problems": [], "error": _crash(exc)}, ensure_ascii=False)
    if not globe.ready:
        return globe.result()
    globe.begin()
    try:
        globe.engine.boot()
        for token in command.split():
            error = globe.press(token)
            if error:
                return globe.result(error)
    except Exception as exc:
        return globe.result(_crash(exc))
    return globe.result()


def live_start(sources_json, now_ms):
    """Живий режим: глобус вмикається й чекає на натискання кнопок."""
    _live.clear()
    try:
        globe = _Globe(json.loads(sources_json))
    except Exception as exc:
        return json.dumps({"events": [], "problems": [], "error": _crash(exc)}, ensure_ascii=False)
    if not globe.ready:
        return globe.result()
    _live["globe"] = globe
    globe.begin(now_ms)
    try:
        globe.engine.boot()
    except Exception as exc:
        return globe.result(_crash(exc))
    return globe.result()


def _live_call(now_ms, action):
    globe = _live.get("globe")
    if globe is None:
        return json.dumps({"events": [], "problems": [], "error": "глобус не ввімкнено"})
    globe.begin(now_ms)
    try:
        error = action(globe)
    except Exception as exc:
        error = _crash(exc)
    return globe.result(error or "")


def live_press(token, now_ms):
    return _live_call(now_ms, lambda globe: globe.press(str(token), live=True))


def live_tick(now_ms):
    """Чи не вийшов час раунду гри - плата робить те саме в кожному loop()."""
    return _live_call(now_ms, lambda globe: globe.engine.tick())


def live_mode():
    globe = _live.get("globe")
    return globe.engine.mode if globe is not None else ""


def build_header(sources_json):
    """make build: student_code.h або None, якщо в коді є помилки."""
    infos, problems = _analyze(json.loads(sources_json))
    problems = list(_project["settings_problems"]) + problems
    header = None if has_errors(problems) else generate_header(_project["settings"], infos)
    return json.dumps(
        {"header": header, "problems": [_problem(p) for p in problems]}, ensure_ascii=False
    )


# ---------------------------------------------------------------------------
# Країни, які вчитель додав на сайті (сторінка #/globe-teacher)
# ---------------------------------------------------------------------------
# Вони записуються файлами content/countries/<ID>.txt поверх знімка проєкту -
# так само, як учень додав би країну на своєму комп'ютері, - і далі все
# (перевірка коду, симулятор, countries.h) бачить їх як звичайні країни.
COUNTRY_ID = re.compile(r"^[A-Z]{2,3}$")
HEADER_FIELDS = ("name", "capital", "continent", "lcd_name", "lcd_capital")

_base_files = {}     # ID -> текст файлу країни зі знімка (щоб повернути)
_extra = {}          # ID -> чи є в учителя mp3


def _countries_dir():
    return os.path.join(_project["root"], "content", "countries")


def _file_text(fields):
    lines = []
    for key in HEADER_FIELDS:
        value = " ".join(str(fields.get(key, "")).split())
        if value:
            lines.append("{}: {}".format(key, value))
    lines.append("---")
    lines.append(str(fields.get("text", "")).strip())
    return "\n".join(lines) + "\n"


def country_file(fields_json):
    """Текст файлу <ID>.txt з полів форми."""
    return _file_text(json.loads(fields_json))


def _check(country_id, fields):
    from tools.validate_content import check as validate

    errors, warnings = [], []
    if not COUNTRY_ID.match(country_id or ""):
        errors.append(
            "ID '{}': потрібно 2-3 великі латинські літери, наприклад FR".format(country_id)
        )
        return errors, warnings
    try:
        parsed, texts = parse_country_file(country_id, _file_text(fields))
    except ContentError as exc:
        return [str(exc)], warnings
    found_errors, found_warnings = validate(Country(country_id, parsed, texts))
    return errors + found_errors, warnings + found_warnings


def check_country(country_id, fields_json):
    """Ті самі правила, що й tools/validate_content.py."""
    errors, warnings = _check(country_id, json.loads(fields_json))
    return json.dumps({"errors": errors, "warnings": warnings}, ensure_ascii=False)


def set_extra_countries(list_json):
    """Країни вчителя поверх знімка: [{id, fields, has_audio}].

    Попередні країни вчителя прибираються (країни проєкту, які він
    перевизначав, повертаються як були), нові записуються, каталог
    читається заново. Неправильні країни пропускаються з поясненням.
    """
    folder = _countries_dir()
    if not _base_files:
        for name in os.listdir(folder):
            if name.endswith(".txt") and not name.startswith(("_", ".")):
                with open(os.path.join(folder, name), encoding="utf-8") as handle:
                    _base_files[name[:-4]] = handle.read()
    for country_id in list(_extra):
        path = os.path.join(folder, country_id + ".txt")
        if country_id in _base_files:
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(_base_files[country_id])
        elif os.path.exists(path):
            os.remove(path)
    _extra.clear()

    skipped = []
    for item in json.loads(list_json):
        country_id = str(item.get("id", ""))
        fields = item.get("fields") or {}
        errors, _ = _check(country_id, fields)
        if errors:
            skipped.append({"id": country_id, "errors": errors})
            continue
        with open(os.path.join(folder, country_id + ".txt"), "w", encoding="utf-8") as handle:
            handle.write(_file_text(fields))
        _extra[country_id] = bool(item.get("has_audio"))

    setup(_project["root"])
    return json.dumps({"skipped": skipped, "ids": sorted(_extra)}, ensure_ascii=False)


def catalog_list():
    """Усі країни глобуса з номерами треків і позначкою «додав учитель»."""
    return json.dumps(
        [
            {
                "id": c.id,
                "name": c.name,
                "capital": c.capital,
                "continent": c.continent,
                "lcd_name": c.lcd_name,
                "lcd_capital": c.lcd_capital,
                "text": c.text,
                "track": c.track,
                "extra": c.id in _extra,
                "override": c.id in _extra and c.id in _base_files,
                "has_audio": _extra.get(c.id, False),
            }
            for c in _project["catalog"].all()
        ],
        ensure_ascii=False,
    )


def countries_header():
    """countries.h для скетча - як tools/build_arduino_data.py."""
    from tools.build_arduino_data import BuildError, render_header

    try:
        header, error = render_header(_project["catalog"]), ""
    except BuildError as exc:
        header, error = None, str(exc)
    return json.dumps({"header": header, "error": error}, ensure_ascii=False)


# ---------------------------------------------------------------------------
# Країни кнопок: однакова відповідність «кнопка -> країна» для всіх учнів
# ---------------------------------------------------------------------------
# Вчитель задає її на сторінці вчителя. Вона записується в settings.py
# (BUTTON_COUNTRIES) у Pyodide - так само, як її записав би вчитель у своєму
# проєкті, - і далі рушій, перекладач у C++ та архіви бачать її як звичайне
# налаштування.
BUTTON_COUNTRIES_LINE = re.compile(r"^BUTTON_COUNTRIES\s*=.*$", re.M)


def _settings_path():
    return os.path.join(_project["root"], "settings.py")


def settings_text():
    """Поточний settings.py (з країнами кнопок) - для архіву проєкту."""
    with open(_settings_path(), encoding="utf-8") as handle:
        return handle.read()


def button_countries():
    return json.dumps(_project["settings"].button_countries)


def button_count():
    return _project["settings"].button_count


def set_button_countries(list_json):
    """Країни кнопок: ["UA", "AU", ...], "" - кнопку не закріплено.

    Усе, що не схоже на ID країни, стає порожнім місцем. Рушій перевіряє
    ще й те, що така країна є в каталозі.
    """
    clean = []
    for item in json.loads(list_json):
        value = item.strip().upper() if isinstance(item, str) else ""
        clean.append(value if COUNTRY_ID.match(value) else "")
    while clean and not clean[-1]:
        clean.pop()
    line = "BUTTON_COUNTRIES = " + json.dumps(clean, ensure_ascii=False)
    text = settings_text()
    if BUTTON_COUNTRIES_LINE.search(text):
        text = BUTTON_COUNTRIES_LINE.sub(lambda _: line, text, count=1)
    else:
        text = text.rstrip("\n") + "\n" + line + "\n"
    with open(_settings_path(), "w", encoding="utf-8") as handle:
        handle.write(text)
    setup(_project["root"])
    return json.dumps({"countries": clean}, ensure_ascii=False)
