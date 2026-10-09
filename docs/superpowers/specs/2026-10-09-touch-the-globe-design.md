# Touch The Globe: a student page on the site

> **All work happens in a separate branch `feature/touch-the-globe`** (from `main`), with commits on it.
> The first step is `git switch -c feature/touch-the-globe`. Nothing is committed to `main` and nothing is merged
> without your approval; at the end, a PR into `main`. The globe repo is not touched.

## Context

The 9th-grade students write code for the Touch The Globe project (`~/Britanica_School/Touch_The_Globe_v2`):
five tasks, `students/task1.py`…`task5.py`. Right now they need a local install, Python and `make`.
The goal is a separate page on the static site (`python-guide-static-book`, GitHub Pages) where a student:

- sees 5 tasks, writes code in the browser editor;
- runs commands (picks a preset or types their own, the same syntax as `globe press`), and the code
  goes through a simulator of the Nokia 5110 display (6×14) + sound;
- the code is saved remotely, so the teacher can see it from their own computer;
- can download an archive: the full Python project with their code. The teacher additionally gets
  an Arduino sketch with a `student_code.h` built from the whole class's code.

**Key fact found during exploration:** `globe_core/` is plain Python without dependencies (`ast`, `random`, `time`),
and the site already loads Pyodide (`js/pyeditor.js` → `PyEditor.bootPyodide()`). So in the browser we run
**the real** engine (`GlobeEngine`), the real checks (`language.analyze_task`) and the real
C++ translator (`cpp_codegen.generate_header`), with no rewrite in JS. The simulator therefore behaves exactly
like `make press`, and the downloaded `student_code.h` matches `make build` byte for byte.

**Decisions made with the user:** storage is a Google Sheet via Apps Script; a student signs in with
name + class code (no passwords); each student can do all 5 tasks; in the archive: a sketch with the
whole class's code + the full Python project.

## Architecture

### 1. Project source = one zip asset
- `globe/touch-the-globe.zip` in the site repo is the output of `make student-zip` (git archive without
  `.env`, solutions or specs, ≈2 MB: globe_core, sketch, countries, mp3).
- `tools/sync_globe.sh` in the site repo: `make -C ../Touch_The_Globe_v2 student-zip` → copy into `globe/`.
  The teacher refreshes the snapshot with one command after changes to the globe.
- The browser fetches the zip once and uses it three ways: `pyodide.unpackArchive` (Python),
  JSZip (building the archives), mp3 from `content/audio/` (sound in the simulator).
- JSZip comes from cdnjs, pinned to `jszip@3.10.1`.

### 2. Python glue in Pyodide: `globe/web_runner.py`
A thin wrapper, with no changes to the globe repo:
- `WebDisplay` / `WebSpeaker`: they record a **timeline** of events `{t, kind: frame|blink|sound|note|warn, …}`;
  `sleep` advances virtual time (`FakeClock`/`FakeSleep` from `globe_core/fakes.py` are reused).
- `check(sources) -> problems` uses `language.analyze_all` + `Context(catalog.ids(), settings.button_count)`,
  the same as `globe test`.
- `run_script(sources, tokens) -> timeline`: load_students-style compilation from strings (reusing
  `student_loader.compile_task` + `hook_defaults`), then `boot()` and the commands parsed by the logic of
  `pc/cli.parse_token` (`1`, `3:600`, `q`, `g`).
- Live mode: a persistent `GlobeEngine` between clicks; `clock` = real browser time,
  `tick()` every 200 ms (game timeout), each click returns its piece of the timeline.
- `build_header(sources) -> (header | None, problems)` reuses the logic of `tools/build_student_code.render`
  (settings + catalog from the unpacked zip, sources from memory).

### 3. Page `#/globe` (route in `js/app.js`, section `page-globe` in `index.html`)
- `js/pages/globe.js` + `css/globe.css` (colours only through tokens from `css/base.css`, as in the other pages).
- **Sign-in:** name, surname, class code → localStorage (`pgsb.globe.who`); "change student" button.
- **5 tabs** (task1…task5): the editor from `PyEditor.wireEditor`/`highlight` (as in `shop.js`); starting
  text = `students/taskN.py` from the zip (the docstring already holds the task card); an "API help" panel
  built from `globe_api.py`.
- **Simulator:** an 84×48 LCD drawn on a canvas at ×4 scale, a 5×7 pixel font (the classic glcdfont from Adafruit GFX,
  BSD, the same font as on the board), inverted rows, backlight flicker for `blink`, globe buttons
  1…5 / Q / G for live mode. Below it: notes (`(загадано: JP — кнопка 2)`) and warnings.
- **Commands:** chips with presets (`boot`, `1 2 3 4 5`, `q 2 3 1`, `g 2:600 1:3000`) + a text field with the
  `globe press` syntax. "Run" plays the timeline back with real pauses; "Check" = `globe test`.
- **Sound:** an mp3 from the zip through `<audio>` (blob URL), with a mute switch.

### 4. Storage: Google Sheet + Apps Script
- `globe/apps-script/Code.gs` + `globe/apps-script/README.md` (step-by-step setup for the teacher:
  create the Sheet → Extensions → Apps Script → paste → Deploy as web app "Anyone" → paste the URL into
  `js/globe-config.js`). I can't do this step myself, because it needs your Google account.
- Sheets: `classes` (allowed class codes), `code` (one row per class+student+task: code,
  time, problem count; upsert), `history` (append-only log of every save, a safeguard against overwrites),
  `settings` (teacher key).
- API: `POST` with `Content-Type: text/plain` (no CORS preflight) `{action:"save"|"load"|"list"|"get", …}`.
  `load` is the student's own code; `list`/`get` need the teacher key.
- When it saves: on every "Run"/"Check" + a "Save" button. A draft always lives in localStorage; if the network
  fails, the status shows "not saved" and the next run retries. On a new computer, after sign-in, the code is
  loaded from the Sheet.

### 5. Teacher page `#/globe-teacher` (hidden route, direct link only, like `check-9plus`)
- Teacher key + class choice → a table of students × 5 tasks (time, ✓/problems).
- Clicking a cell opens the code read-only and "Open in simulator".
- Choose one solution per task (radio in each column) → **"Download the class sketch"**
  (`TouchTheGlobe/` with the generated `student_code.h`, ready for Arduino IDE → Upload) and
  **"Download the class Python project"** (the whole zip with `students/taskN.py` replaced).
- If codegen finds errors, the download is disabled and the list of problems is shown (as in `make build`).
  A hint about "Sketch too big" → `ENABLE_HARDWARE_CHECK 0` (from the README).

### 6. Student downloads
- "Download my project": the whole Python project with their 5 tasks (run `make press`/`make build` locally).
  Built in the browser: JSZip opens the asset, swaps `students/task*.py` and repacks it.

### 7. Home and navigation
- A "Touch The Globe · 9th grade" card in the "Practice" tab on home (`index.html`, `.practice-cards`),
  a route in `ROUTES` (`js/app.js`), `?v=` bumps for the new/changed css/js.

## Files

New: `globe/touch-the-globe.zip`, `globe/web_runner.py`, `globe/apps-script/{Code.gs,README.md}`,
`js/pages/globe.js`, `js/pages/globe-teacher.js`, `js/globe/lcd.js` (canvas + font),
`js/globe/store.js` (Apps Script client + localStorage), `js/globe/bundle.js` (JSZip archives),
`js/globe-config.js`, `css/globe.css`, `tools/sync_globe.sh`, `tests/globe.test.js`.
Changed: `index.html` (sections, card, scripts), `js/app.js` (routes).
Process: first the spec `docs/superpowers/specs/2026-10-09-touch-the-globe-design.md` and the plan in
`docs/superpowers/plans/` (the repo's convention), then implementation on a branch `feature/touch-the-globe`.
The globe repo itself **does not change**.

## Verification
- `tests/globe.test.js` in `tests/checks.html` (existing runner `tests/runner.js`):
  - with the reference solutions (`tests/fixtures/solutions` from the globe repo, as test data only)
    `run_script(["1"])` gives a frame with `Ukraine` in row 0 (inverted) and a `UA` sound;
  - `check()` catches an error (e.g. `show_text(9, ...)`) with the correct line number;
  - `build_header()` matches **byte for byte** the output of `python3 tools/build_student_code.py` for the
    same solutions (parity);
  - the downloaded zip contains `students/task1.py` with the student's code and opens in JSZip.
- `Store` with a fake `fetch`: save/load/offline fallback.
- Browser preview (`.claude/launch.json` → `site`): sign-in, the 5 tabs, `press 1 2 3`, game `g` in live mode,
  quiz `q 2 3 1`, the loading bar (task5) animates, downloads, dark theme, 375px width.
- Manually after deploying Apps Script: save from one browser → see the code on `#/globe-teacher` from another
  (incognito). The downloaded class sketch → `arduino-cli compile --profile uno` (as `make compile`).
