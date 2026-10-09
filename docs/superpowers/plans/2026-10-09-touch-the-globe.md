# Touch The Globe page: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A page `#/globe` where 9th-graders write the 5 Touch The Globe tasks, run them in a Nokia 5110
simulator and save them to a Google Sheet, plus a teacher page `#/globe-teacher` with the class
code and archive downloads (Arduino sketch / Python project).

**Architecture:** The real `globe_core` (pure Python) runs in Pyodide from a snapshot of the project
(`globe/touch-the-globe.zip`, the output of `make student-zip`). A thin glue `globe/web_runner.py` turns
the engine calls into a timeline of events that JS plays back on a canvas LCD. Storage is a Google Apps Script
web app over a Sheet. Archives are built in the browser with JSZip from the same zip.

**Tech Stack:** vanilla JS (IIFE + `window.*`, like the rest of the site), Pyodide 0.26.4 (already in
`js/pyeditor.js`), JSZip 3.10.1 (cdnjs), Google Apps Script, CPython unittest for the glue.

**Spec:** `docs/superpowers/specs/2026-10-09-touch-the-globe-design.md`

## Global Constraints

- Branch `feature/touch-the-globe`; nothing on `main`; at the end a PR into `main`.
- The repo `~/Britanica_School/Touch_The_Globe_v2` is NOT edited; it is only read (`make student-zip`, fixtures for local tests).
- The reference solutions (`tests/fixtures/solutions`) are not copied into the site repo (it is public). Test fixtures are our own minimal code.
- Interface copy in Ukrainian, in the site's style; code comments in Ukrainian, as in neighbouring files.
- Colours only through CSS tokens from `css/base.css` (there is a `tests/test_css_tokens.py` test); dark theme via `[data-theme="dark"]`.
- External scripts are pinned: `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`.
- After changing css/js, bump `?v=` in `index.html` (the convention from the comment in `<head>`).
- localStorage always inside try/catch (the `store` pattern from `js/pages/shop.js:348`).
- LCD: 6 rows × 14 characters, a 6×8 px cell, 84×48 px; the font is glcdfont from Adafruit GFX (BSD; the licence goes in the comment).

## Review Focus

1. **An infinite `while`/a crash in student code**: the page must not freeze. The glue relies on the `LOOP_LIMIT` guard from `student_loader`; a Python exception → a warning in the timeline, not an unhandled JS error. Test in Task 2 (`while True: pass` → warn, the result returns).
2. **Apps Script is not configured or the network fails**: the code must not be lost: a localStorage draft + the status "збережено лише в цьому браузері". Test in Task 4 (fetch rejects → `{ok:false}`, the draft is still there).
3. **Two students with the same name in different classes / an extra space or different letter case in the name**: the key = `class|normalised name`. Test in Task 4 (`normWho`).
4. **The code has errors → download**: the archive is not built, the user sees the list of problems (as in `make build`). Test in Task 2 (`build_header` → `None` + problems) and Task 6.
5. **Opened from `file://` or the zip did not load**: a clear message "відкрий сайт через сервер/інтернет" instead of an infinite spinner. Checked in Task 7 manually (preview with a broken zip path).

---

### Task 1: Project snapshot in the site

**Files:**
- Create: `tools/sync_globe.sh`, `globe/touch-the-globe.zip`
- Test: `tests/test_globe_runner.py` (first test only)

**Interfaces:**
- Produces: `globe/touch-the-globe.zip`, root prefix `Touch_The_Globe/` (from `git archive --prefix`).

- [ ] **Step 1: test that the snapshot is in place and safe**

```python
"""Тести Python-обв'язки сторінки Touch The Globe (globe/web_runner.py).

Знімок проєкту (globe/touch-the-globe.zip) розпаковується в тимчасову
папку - так само, як це робить Pyodide у браузері.
Запуск з кореня репозиторію: python3 -m unittest tests/test_globe_runner.py -v
"""
import pathlib, sys, tempfile, unittest, zipfile

SITE = pathlib.Path(__file__).resolve().parent.parent
ZIP = SITE / "globe" / "touch-the-globe.zip"

class Snapshot(unittest.TestCase):
    def test_zip_has_core_and_no_secrets(self):
        names = zipfile.ZipFile(ZIP).namelist()
        self.assertIn("Touch_The_Globe/globe_core/engine.py", names)
        self.assertIn("Touch_The_Globe/students/task1.py", names)
        self.assertNotIn("Touch_The_Globe/.env", names)
        self.assertFalse([n for n in names if "fixtures/solutions" in n])
```

- [ ] **Step 2:** `python3 -m unittest tests/test_globe_runner.py -v` → FAIL (no zip).
- [ ] **Step 3: script**

```bash
#!/bin/sh
# Оновлює знімок проєкту Touch The Globe, з яким працює сторінка #/globe.
#     tools/sync_globe.sh [шлях до Touch_The_Globe_v2]
# Береться лише закомічене (make student-zip = git archive): без .env,
# еталонних розв'язків і робочих файлів.
set -e
SRC="${1:-$(dirname "$0")/../../Touch_The_Globe_v2}"
make -C "$SRC" student-zip
mkdir -p "$(dirname "$0")/../globe"
mv "$SRC/touch-the-globe-students.zip" "$(dirname "$0")/../globe/touch-the-globe.zip"
echo "Готово: globe/touch-the-globe.zip"
```

- [ ] **Step 4:** `sh tools/sync_globe.sh` → the test PASSES.
- [ ] **Step 5:** commit `Add the Touch The Globe project snapshot and its sync script`.

---

### Task 2: Python glue `globe/web_runner.py`

**Files:**
- Create: `globe/web_runner.py`
- Test: `tests/test_globe_runner.py`

**Interfaces:**
- Consumes: from the zip: `globe_core.{engine,student_loader,language,catalog,settings,cpp_codegen,fakes,hooks,problems}`.
- Produces (all results are JSON strings, so JS gets plain objects):
  - `setup(root: str) -> None`: reads the catalog/settings from `root` (once).
  - `check(sources_json: str) -> str` → `{"problems":[{file,line,level,message,text}]}`
  - `run_script(sources_json: str, command: str, seed: int=1) -> str` →
    `{"problems":[…], "events":[{t, kind:"frame", rows:[6], inv:[6]} | {t, kind:"blink", times} | {t, kind:"sound", id} | {t, kind:"note", text} | {t, kind:"warn", text}], "error": str}`
    `command` uses the `globe press` syntax: tokens `1`, `3:600`/`3@600`, `q`, `g`, separated by spaces; boot always comes first.
  - `live_start(sources_json, now_ms) -> str`, `live_press(token, now_ms) -> str`, `live_tick(now_ms) -> str`
    → `{"events":[…], "problems":[…], "error":""}` (persistent engine between calls).
  - `build_header(sources_json: str) -> str` → `{"header": str|null, "problems":[…]}`
  - `sources_json` = `{"task1.py": "...", ...}` (missing tasks are simply absent).

- [ ] **Step 1: failing tests** (add to `tests/test_globe_runner.py`)

```python
TMP = tempfile.mkdtemp()
zipfile.ZipFile(ZIP).extractall(TMP)
ROOT = pathlib.Path(TMP) / "Touch_The_Globe"
sys.path.insert(0, str(ROOT)); sys.path.insert(0, str(SITE / "globe"))
import json, web_runner as W
W.setup(str(ROOT))

T1 = 'from globe_api import *\n\ndef on_button(number):\n    if number == 1:\n        play_sound("UA")\n        show_country("UA")\n    elif number == 2:\n        show_country("JP")\n\ndef hello_screen():\n    show_text(0, "Hi!")\n'
T5 = 'def loading():\n    bar = ""\n    for i in range(3):\n        bar = bar + "#"\n        show_text(3, bar)\n        wait(100)\n'

def frames(r): return [e for e in r["events"] if e["kind"] == "frame"]

class Runner(unittest.TestCase):
    def test_press_1_shows_ukraine_and_plays_sound(self):
        r = json.loads(W.run_script(json.dumps({"task1.py": T1}), "1"))
        last = frames(r)[-1]
        self.assertEqual(last["rows"][0], "Ukraine"); self.assertTrue(last["inv"][0])
        self.assertIn({"kind": "sound", "id": "UA"}, [{"kind": e["kind"], "id": e.get("id")} for e in r["events"] if e["kind"] == "sound"])

    def test_boot_runs_loading_with_time(self):
        r = json.loads(W.run_script(json.dumps({"task5.py": T5}), ""))
        bars = [f["rows"][3] for f in frames(r)]
        self.assertEqual(bars[:3], ["#", "##", "###"])
        self.assertLess(frames(r)[0]["t"], frames(r)[2]["t"])

    def test_check_reports_row_out_of_range_with_line(self):
        bad = 'def hello_screen():\n    show_text(9, "x")\n'
        p = json.loads(W.check(json.dumps({"task1.py": bad})))["problems"]
        self.assertTrue(any(x["file"] == "task1.py" and x["line"] == 2 and x["level"] == "error" for x in p))

    def test_errors_block_running(self):
        bad = 'def hello_screen():\n    show_text(9, "x")\n'
        r = json.loads(W.run_script(json.dumps({"task1.py": bad}), "1"))
        self.assertTrue(r["problems"]); self.assertFalse([e for e in r["events"] if e["kind"] == "frame" and e["rows"][0] == "Hi!"])

    def test_endless_while_is_a_warning_not_a_hang(self):
        loop = 'def loading():\n    while True:\n        wait(1)\n'
        r = json.loads(W.run_script(json.dumps({"task5.py": loop}), ""))
        self.assertTrue(any(e["kind"] == "warn" and "while" in e["text"] for e in r["events"]))

    def test_bad_token_is_reported(self):
        r = json.loads(W.run_script(json.dumps({"task1.py": T1}), "1 x"))
        self.assertIn("x", r["error"])

    def test_live_game_timeout_by_tick(self):
        T2 = 'def next_target(round):\n    target("JP", "Tokyo!")\n\ndef on_hit(correct, ms):\n    if correct:\n        show_text(3, "Yes")\n    else:\n        show_text(3, "No")\n'
        W.live_start(json.dumps({"task1.py": T1, "task2.py": T2}), 0)
        W.live_press("g", 0)
        r = json.loads(W.live_tick(60000))
        self.assertTrue(any(e["kind"] == "frame" and e["rows"][3] == "No" for e in r["events"]))

    def test_header_matches_make_build(self):
        from tools.build_student_code import render
        d = pathlib.Path(tempfile.mkdtemp())
        (d / "task1.py").write_text(T1, encoding="utf-8"); (d / "task5.py").write_text(T5, encoding="utf-8")
        expected, _ = render(ROOT, students_dir=d)
        got = json.loads(W.build_header(json.dumps({"task1.py": T1, "task5.py": T5})))
        self.assertEqual(got["header"], expected)

    def test_header_refuses_code_with_errors(self):
        got = json.loads(W.build_header(json.dumps({"task1.py": 'def hello_screen():\n    show_text(9, "x")\n'})))
        self.assertIsNone(got["header"]); self.assertTrue(got["problems"])
```

- [ ] **Step 2:** run → FAIL (`No module named web_runner`).
- [ ] **Step 3: implementation.** Key pieces:
  - `_Clock`: `now` in seconds; `sleep(s)` advances `now`. In live mode, `now` is set from `now_ms` on every call, but pauses inside the call advance it further (frames get `t` in ms relative to the start of the call).
  - `_Display.refresh(screen)` → `frame` with `rows=list(screen.rows)`, `inv=list(screen.inverted)`, skipping a frame identical to the previous one; `blink(times)` → `blink`; `note(text)` → `note`.
  - `_Speaker.play(ref)` → `sound` with `id=ref`; `audio_source` = `DictAudioSource`-like: `resolve(country) -> country.id`.
  - `on_warning` → `warn`, `on_note` → `note`.
  - Loading code: `analyze_all(sources, Context(catalog.ids(), settings.button_count))`; if `has_errors` → do not run anything, return the problems; otherwise for each file `compile_task(file, src, engine.api(), engine.loop_stuck, defaults=hook_defaults(info))` and `engine.set_hooks(...)` (as in `student_loader.load_students`, but from strings).
  - Tokens: the copied logic of `pc/cli.parse_token` (do not import `pc.cli`: it pulls in audio/ctypes): `q`→`touch_quiz()`, `g`→`touch_game()`, `N[:@]ms`→`touch_button(N, ms)`. In script mode, after `g` with no time given, `ms=1000` (DEFAULT_MS, as in the CLI).
  - Any Python exception inside the call → `error` with the text, the events up to that point are kept.
  - `build_header`: `analyze_all` → if errors, `None`; otherwise `generate_header(settings, infos)`; problems include those from `parse_settings`.
  - Problem → dict: `{"file","line","level","message","text": str(problem)}`.
- [ ] **Step 4:** tests PASS; also `python3 -m unittest tests/test_harness.py` (nothing broken).
- [ ] **Step 5:** commit `Globe page: Python glue that turns the engine into a timeline`.

---

### Task 3: LCD on canvas `js/globe/lcd.js`

**Files:**
- Create: `js/globe/lcd.js`, `tests/globe.test.js` (LCD part)
- Modify: `tests/checks.html` (+ scripts)

**Interfaces:**
- Produces: `window.GlobeLCD = { FONT, glyph(ch) -> number[5], create(canvas) -> { draw(rows, inv), blink(times) -> Promise, clear() }, W:84, H:48 }`.
  `draw` takes the `rows`/`inv` from a `frame` event. Characters outside 32..126 are already `?` (the engine sanitises them).

- [ ] **Step 1: tests**

```js
T.test("lcd: шрифт — 95 символів по 5 стовпчиків, 'A' як у glcdfont", () => {
  T.eq(GlobeLCD.FONT.length, 95 * 5);
  T.eq(GlobeLCD.glyph("A"), [0x7C, 0x12, 0x11, 0x12, 0x7C]);
  T.eq(GlobeLCD.glyph(" "), [0, 0, 0, 0, 0]);
});
T.test("lcd: інвертований рядок — темне тло, світлі літери", () => {
  const c = document.createElement("canvas"); const lcd = GlobeLCD.create(c);
  lcd.draw(["Ukraine", "", "", "", "", ""], [true, false, false, false, false, false]);
  T.eq(lcd.pixel(83, 0), 1);   /* кінець 0-го рядка — тло темне */
  T.eq(lcd.pixel(83, 8), 0);   /* 1-й рядок порожній */
});
```
(`pixel(x, y)` reads its own 84×48 buffer, not the canvas: no dependency on scaling.)

- [ ] **Step 2:** open `http://localhost:8765/tests/checks.html` (preview `site`) → FAIL.
- [ ] **Step 3:** implementation: `FONT` = bytes 0x20..0x7E from `~/Documents/Arduino/libraries/Adafruit_GFX_Library/glcdfont.c` (pull them out with a script, insert as an array, plus the BSD licence comment). The buffer is `Uint8Array(84*48)`; character `col c, row r` → x = c*6, y = r*8; a byte of the column = bits 0..6 from top to bottom. Render: `canvas.width=84*S` (S = 4 × devicePixelRatio), `imageSmoothingEnabled=false`, pixel colours from CSS variables `--lcd-on`/`--lcd-bg` (read via `getComputedStyle`). `blink(times)`: toggles the `.off` class on the parent `times` times (150 ms + 150 ms, like the board).
- [ ] **Step 4:** PASS. **Step 5:** commit `Globe page: Nokia 5110 LCD on canvas`.

---

### Task 4: Storage: Apps Script + client `js/globe/store.js`

**Files:**
- Create: `globe/apps-script/Code.gs`, `globe/apps-script/README.md`, `js/globe/store.js`, `js/globe-config.js`
- Test: `tests/globe.test.js` (Store part), `tests/test_globe_appscript.mjs` (node)

**Interfaces:**
- `js/globe-config.js`: `window.GLOBE_CONFIG = { endpoint: "" }` (empty → offline mode only).
- `window.GlobeStore`:
  - `normWho({cls, name}) -> {cls, name, key}`: `trim`, inner spaces collapsed to one, `cls` upper-case, `key = cls + "|" + name.toLowerCase()`.
  - `who() / setWho(w) / clearWho()`: localStorage `pgsb.globe.who`.
  - `draft(task) / setDraft(task, code)`: `pgsb.globe.draft.<key>.<task>`.
  - `save(task, code, problems) -> Promise<{ok, error?}>`: POST `{action:"save", cls, name, task, code, problems}`.
  - `load() -> Promise<{ok, tasks?:{task1.py:{code, updated}}}>`
  - `teacherList(teacherKey, cls) -> Promise<{ok, rows?:[{name, task, updated, problems}]}>`
  - `teacherGet(teacherKey, cls, name) -> Promise<{ok, tasks?}>`
  - `_fetch` can be swapped (for tests). All requests are `fetch(endpoint, {method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body: JSON.stringify(...)})`; a network error/`!ok` → `{ok:false, error}`; no endpoint → `{ok:false, error:"offline"}`.
- `Code.gs`: `doPost(e)` → `handle(JSON.parse(e.postData.contents), sheets)`; `handle` is a pure function over the object `sheets = {classes:[...codes], teacherKey, rows:[...], upsert(row), append(row)}`, so it can be tested in node without Google.
  Errors: an unknown class code → `{ok:false, error:"bad_class"}`; a wrong key → `{ok:false, error:"bad_key"}`; code longer than 20 000 characters → `{ok:false, error:"too_long"}` (the Sheets cell limit is 50 000).

- [ ] **Step 1: tests**

```js
T.test("store: нормалізація імені й класу", () => {
  T.eq(GlobeStore.normWho({ cls:" 9a ", name:"  Олена   Петренко " }),
       { cls:"9A", name:"Олена Петренко", key:"9A|олена петренко" });
});
T.test("store: без мережі — {ok:false}, чернетка лишається", async () => {
  GlobeStore._fetch = () => Promise.reject(new Error("net"));
  GlobeStore._endpoint = "https://example.invalid";
  GlobeStore.setWho({ cls:"9A", name:"Тест Учень" });
  GlobeStore.setDraft("task1.py", "print(1)");
  const r = await GlobeStore.save("task1.py", "print(1)", 0);
  T.eq(r.ok, false); T.eq(GlobeStore.draft("task1.py"), "print(1)");
});
T.test("store: save надсилає text/plain з потрібними полями", async () => {
  let sent = null;
  GlobeStore._fetch = (url, o) => { sent = o; return Promise.resolve({ ok:true, json:() => Promise.resolve({ ok:true }) }); };
  T.eq((await GlobeStore.save("task2.py", "x = 1", 0)).ok, true);
  T.eq(sent.headers["Content-Type"], "text/plain;charset=utf-8");
  T.eq(JSON.parse(sent.body).action, "save");
});
```

```js
// tests/test_globe_appscript.mjs — node tests/test_globe_appscript.mjs
import fs from "node:fs"; import vm from "node:vm"; import assert from "node:assert/strict";
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../globe/apps-script/Code.gs", import.meta.url), "utf8"), ctx);
const mem = () => { const rows = []; return { classes:["9A"], teacherKey:"k", rows,
  upsert(r){ const i = rows.findIndex(x => x.cls===r.cls && x.key===r.key && x.task===r.task); i<0 ? rows.push(r) : rows[i]=r; },
  append(){}, }; };
let s = mem();
assert.equal(ctx.handle({ action:"save", cls:"9B", name:"A", task:"task1.py", code:"" }, s).error, "bad_class");
assert.equal(ctx.handle({ action:"save", cls:"9a", name:"Олена", task:"task1.py", code:"x=1", problems:0 }, s).ok, true);
ctx.handle({ action:"save", cls:"9A", name:" олена ", task:"task1.py", code:"x=2", problems:0 }, s);
assert.equal(s.rows.length, 1); assert.equal(s.rows[0].code, "x=2");
assert.equal(ctx.handle({ action:"load", cls:"9A", name:"Олена" }, s).tasks["task1.py"].code, "x=2");
assert.equal(ctx.handle({ action:"list", cls:"9A", teacherKey:"bad" }, s).error, "bad_key");
assert.equal(ctx.handle({ action:"list", cls:"9A", teacherKey:"k" }, s).rows.length, 1);
assert.equal(ctx.handle({ action:"save", cls:"9A", name:"A", task:"task9.py", code:"" }, s).error, "bad_task");
assert.equal(ctx.handle({ action:"save", cls:"9A", name:"A", task:"task1.py", code:"x".repeat(20001) }, s).error, "too_long");
console.log("ok");
```

- [ ] **Step 2:** FAIL. **Step 3:** implementation. The `Code.gs` structure: `handle()` (pure logic, normalisation identical to `normWho`), `sheetsFromSpreadsheet()` (adapter over `SpreadsheetApp.getActiveSpreadsheet()`: the `classes` sheet is a column of codes; `settings!B1` is the teacher key; the `code` sheet has columns `cls, key, name, task, code, problems, updated`; the `history` sheet is append-only), `setup()` (creates the sheets and headers on first run), `doPost(e)` → `ContentService.createTextOutput(JSON.stringify(...)).setMimeType(JSON)`, `LockService` around writes. `README.md`: 7 steps with screenshot-like descriptions (create the Sheet → Extensions → Apps Script → paste Code.gs → run `setup` → fill in `classes` and `settings!B1` → Deploy → Web app, Execute as: Me, Who has access: Anyone → copy the URL into `js/globe-config.js`).
- [ ] **Step 4:** `node tests/test_globe_appscript.mjs` → `ok`; the browser tests PASS. **Step 5:** commit `Globe page: Google Sheet storage via Apps Script`.

---

### Task 5: Runtime `js/globe/runtime.js` (zip + Pyodide + audio)

**Files:**
- Create: `js/globe/runtime.js`
- Test: `tests/globe.test.js` (integration, needs the preview server)

**Interfaces:**
- Consumes: `PyEditor.bootPyodide()`, `globe/web_runner.py`, `globe/touch-the-globe.zip`, `window.JSZip`.
- Produces `window.GlobeRuntime`:
  - `base` (default `""`; tests set `"../"`), `boot() -> Promise<void>` (once; loads JSZip if missing, `fetch(zip)` → `ArrayBuffer`, `pyodide.unpackArchive(buf, "zip", {extractDir:"/globe"})`, writes `web_runner.py` into `/globe_web/`, `sys.path`, `setup("/globe/Touch_The_Globe")`).
  - `zip() -> JSZip` (the same opened archive, for bundle.js), `template(n) -> string` (`students/taskN.py`), `apiDoc() -> string` (`globe_api.py`).
  - `check(sources)`, `run(sources, command)`, `liveStart(sources)`, `livePress(token)`, `liveTick()`, `header(sources)`: thin JSON wrappers over the glue; `now_ms` = `performance.now()`.
  - `audioUrl(id) -> Promise<string|null>` (blob URL of `content/audio/<ID>.mp3`, cached).
  - `boot()` failure → reject with a human-readable message: `"Не вдалося завантажити проєкт глобуса. Відкрий сайт через інтернет (не як файл з диска) і онови сторінку."`.

- [ ] **Step 1: tests**

```js
T.test("globe runtime: boot, шаблон задачі і запуск press 1", async () => {
  GlobeRuntime.base = "../";
  await GlobeRuntime.boot();
  T.ok(GlobeRuntime.template(1).includes("def on_button(number):"));
  const r = GlobeRuntime.run({ "task1.py": 'def on_button(number):\n    show_country("UA")\n' }, "1");
  const f = r.events.filter(e => e.kind === "frame").pop();
  T.eq(f.rows[0], "Ukraine");
});
T.test("globe runtime: mp3 країни з архіву", async () => {
  T.ok(/^blob:/.test(await GlobeRuntime.audioUrl("UA")));
  T.eq(await GlobeRuntime.audioUrl("ZZ"), null);
});
```

- [ ] **Step 2–4:** FAIL → implementation → PASS. **Step 5:** commit `Globe page: runtime that loads the project into Pyodide`.

---

### Task 6: Archives `js/globe/bundle.js`

**Files:**
- Create: `js/globe/bundle.js`
- Test: `tests/globe.test.js`

**Interfaces:**
- Consumes: `GlobeRuntime.zip()`, `GlobeRuntime.header(sources)`.
- Produces `window.GlobeBundle`:
  - `project(sources) -> Promise<Blob>`: the whole zip (`Touch_The_Globe/…`), `students/taskN.py` replaced with `sources` (the rest are templates), and if `header` succeeded, `arduino/TouchTheGlobe/student_code.h` too.
  - `sketch(sources) -> Promise<{blob?:Blob, problems}>`: only `TouchTheGlobe/` (everything from `Touch_The_Globe/arduino/TouchTheGlobe/` without `build/`) with the new `student_code.h`; with errors, `blob` is missing.
  - `download(blob, filename)`: `<a download>` + `URL.createObjectURL`.

- [ ] **Step 1: tests**

```js
T.test("bundle: проєкт містить код учня", async () => {
  const blob = await GlobeBundle.project({ "task1.py": "# мій код\n" });
  const z = await JSZip.loadAsync(blob);
  T.eq(await z.file("Touch_The_Globe/students/task1.py").async("string"), "# мій код\n");
  T.ok(z.file("Touch_The_Globe/students/task2.py"));
});
T.test("bundle: скетч — student_code.h як у make build; з помилками — без архіву", async () => {
  const ok = await GlobeBundle.sketch({ "task1.py": 'def on_button(number):\n    show_country("UA")\n' });
  const z = await JSZip.loadAsync(ok.blob);
  T.ok((await z.file("TouchTheGlobe/student_code.h").async("string")).includes("s_number"));
  T.ok(z.file("TouchTheGlobe/TouchTheGlobe.ino"));
  const bad = await GlobeBundle.sketch({ "task1.py": 'def hello_screen():\n    show_text(9, "x")\n' });
  T.eq(bad.blob, undefined); T.ok(bad.problems.length > 0);
});
```

- [ ] **Step 2–4:** FAIL → implementation → PASS. **Step 5:** commit `Globe page: build the project and sketch archives in the browser`.

---

### Task 7: Student page `#/globe`

**Files:**
- Create: `js/pages/globe.js`, `css/globe.css`
- Modify: `index.html` (section `page-globe`, a card in `.practice-cards`, `<link>`/`<script>` with `?v=`), `js/app.js` (`ROUTES`: `{ slug:"globe", id:"page-globe", num:"🌍", toc:false, nav:"Touch The Globe · 9 клас", title:"Touch The Globe — код для глобуса, 9 клас" }` after `files`)

**Interfaces:**
- Consumes: `GlobeRuntime`, `GlobeLCD`, `GlobeStore`, `GlobeBundle`, `PyEditor.wireEditor`.
- Produces: `window.PageInit["globe"]`; also `window.GlobeSim = { mount(el) -> { run(sources, cmd), live… } }`: the simulator as a component, reused by the teacher page.

Page layout (`.wrap.wide`):
1. `header.top`: h1 "Touch The Globe", a lede about the globe and the 5 tasks.
2. **Sign-in** (`#globe-who`): name and surname, class code, "Увійти" → `GlobeStore.setWho`, then `load()` (if the Sheet has something newer than the draft, take the Sheet version; on conflict, the newer `updated` wins and the draft is kept as `…draft.prev`). Once signed in: "Учень: Олена Петренко · 9A · [змінити]".
3. **Two columns** (≥ 980 px; below that, one): on the left, tabs `Задача 1…5` (name from the template docstring: `ЗАДАЧА 1. «МОНТАЖНИК»`) + editor + `Перевірити` / `▶ Запустити` / `↺ Заготовка` (with confirmation, like `shop.js`) + the problem list (`task1.py, рядок 7: …`, a click moves the cursor to the line). On the right, the simulator: the LCD in a "globe" frame, buttons `1 2 3 4 5 · Q · G` (live mode), the command field + preset chips `boot`, `1 2 3 4 5`, `q 2 3 1`, `g 2:600 1:3000`, a `🔊/🔇` switch, a log of `note`/`warn`.
4. **Save status** under the editor: "збережено о 12:41" / "збережено лише в цьому браузері" (+ the reason) / "зберігаю…".
5. "API help": `<details>` with `globe_api.py` (highlighted by `PyEditor.highlight`).
6. "Download my project" → `GlobeBundle.project(all 5 of my tasks)`.

Behaviour:
- "Run" = `check` of all my tasks; if there are errors, show them and stop; otherwise `run(sources, command)` and play the events back: `setTimeout` by `t`, `frame`→`lcd.draw`, `blink`→`lcd.blink`, `sound`→`<audio>.src = await audioUrl(id); play()`, `note`/`warn`→ the log. A new run cancels the previous playback.
- Live mode: the first press of `1…5/Q/G` → `liveStart(sources)`, then `livePress`, plus `setInterval(liveTick, 200)` while the game is on. Changing the code resets live mode.
- Saving: on every "Run"/"Check" and "Зберегти" (Ctrl+S) → `GlobeStore.save(task, code, errorCount)`; the draft is written on every input (as in shop).
- Before Pyodide is ready, the buttons are `disabled` and the status is "завантажую Python і проєкт глобуса…"; on a `boot()` error, its message (Review Focus 5).

- [ ] **Step 1:** markup + route + card; preview `site` → `#/globe` opens, nav item active, no console errors.
- [ ] **Step 2:** editor tabs + templates from the zip, drafts in localStorage (reload → the code stays).
- [ ] **Step 3:** simulator + script playback (`1 2 3`, `q 2 3 1`, task5 loading bar animates).
- [ ] **Step 4:** live mode (`G` → countdown → timeout via tick → game over).
- [ ] **Step 5:** sign-in + saving (with `endpoint` empty → "лише в цьому браузері" status), the "Download my project" download.
- [ ] **Step 6:** `css/globe.css`: the LCD frame (`--lcd-bg`, `--lcd-on` defined in `:root` and `[data-theme="dark"]` in `css/base.css` as tokens), 375 px width with no horizontal scroll, dark theme; `python3 -m unittest tests/test_css_tokens.py`.
- [ ] **Step 7:** screenshots (light/dark/mobile), commit `Globe page: student page with editor and simulator`.

---

### Task 8: Teacher page `#/globe-teacher`

**Files:**
- Create: `js/pages/globe-teacher.js`
- Modify: `index.html` (section `page-globe-teacher`), `js/app.js` (`{ slug:"globe-teacher", id:"page-globe-teacher", num:"🌍", hidden:true, cls:"globe", toc:false, nav:"Touch The Globe: вчитель", title:"Touch The Globe — сторінка вчителя" }`), `css/globe.css`

Behaviour:
- Form: teacher key (sessionStorage, not localStorage) + class code → `GlobeStore.teacherList`.
- Table: rows = students, columns = task1…5; a cell = time + `✓`/`N помилок` + a radio "use for the class". By default the radio in each column is the latest save without errors.
- Clicking a cell → `teacherGet` → a read-only code panel (highlighted) + "Відкрити в симуляторі" (`GlobeSim.mount` with this student's code).
- "Завантажити скетч класу" → `GlobeBundle.sketch(chosen)` → `touch-the-globe-<class>-sketch.zip`; errors → a list + a block "student_code.h not created"; the hint about "Sketch too big" → `#define ENABLE_HARDWARE_CHECK 0` in `hardware_pins.h`.
- "Завантажити Python-проєкт класу" → `GlobeBundle.project(chosen)`.
- `bad_key`/offline → a clear message.

- [ ] **Step 1–4:** markup → table with a fake `_fetch` (fixed data, checked in preview) → code view + simulator → downloads.
- [ ] **Step 5:** check the downloaded class sketch: `unzip` into scratchpad, `arduino-cli compile --profile uno <dir>/TouchTheGlobe` (on "too big", repeat with `--build-property "build.extra_flags=-DENABLE_HARDWARE_CHECK=0"`, as `make compile` does).
- [ ] **Step 6:** commit `Globe page: teacher page with class code and downloads`.

---

### Task 9: Final verification and PR

- [ ] `python3 -m unittest discover -s tests -p "test_*.py" -v`, `node tests/test_globe_appscript.mjs`, `tests/checks.html` → all green (`window.T_DONE`).
- [ ] Preview: the full student scenario + teacher (fake fetch), light/dark, 375 px, no console errors.
- [ ] `README` section? The site has no README; instead, `globe/apps-script/README.md` + a line in the spec on how to refresh the snapshot (`tools/sync_globe.sh`).
- [ ] Push the branch, PR into `main` with a description and the setup steps for Apps Script.
