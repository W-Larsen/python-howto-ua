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

import json
import os
import random
import re

from globe_core.catalog import load_catalog
from globe_core.cpp_codegen import generate_header
from globe_core.engine import GAME, GlobeEngine
from globe_core.language import Context, analyze_all
from globe_core.problems import has_errors
from globe_core.settings import load_settings
from globe_core.student_loader import compile_task, hook_defaults

# Ті самі правила, що й у pc/cli.py (parse_token, DEFAULT_MS). Сам pc.cli
# не імпортуємо: він тягне за собою звук і ctypes, яких у браузері немає.
TOKEN = re.compile(r"^(\d+)(?:[:@](\d+))?$")
DEFAULT_MS = 1000
BAD_TOKEN = (
    "Не розумію '{}'. Пиши номер кнопки (1, 2, 3...), q - вікторина, "
    "g - гра, а в грі можна вказати час: 2:600"
)

_project = {}
_live = {}


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
            functions = compile_task(
                file, sources[file], api, self.engine.loop_stuck, defaults=hook_defaults(info)
            )
            for name in info.functions:
                hooks[name] = functions[name]
        self.engine.set_hooks(hooks)

    def begin(self, now_ms=None):
        """Нова стрічка. now_ms - справжній час браузера (живий режим)."""
        if now_ms is not None:
            self.clock.now = max(self.clock.now, now_ms / 1000.0)
        self.clock.start = self.clock.now
        self.tape.reset()

    def press(self, token):
        """Одна команда в синтаксисі globe press. Повертає текст помилки або ''."""
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
        if ms is None and self.engine.mode == GAME:
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
    """globe test: проблеми в коді учня."""
    _, problems = _analyze(json.loads(sources_json))
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
    return _live_call(now_ms, lambda globe: globe.press(str(token)))


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
