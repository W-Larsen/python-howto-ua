# Countries from the teacher: implementation plan

> Execution: superpowers:executing-plans (native), branch `feature/touch-the-globe`.

**Goal:** the teacher adds/overrides/deletes countries (text + mp3) on `#/globe-teacher` without git and without a deploy.
**Spec:** `docs/superpowers/specs/2026-10-09-globe-countries-design.md`

## Global Constraints
- The `Touch_The_Globe_v2` repo is not edited; the rules are those of its `parse_country_file`, `validate_content.check`, `build_arduino_data.render_header`.
- ID `^[A-Z]{2,3}$`; lcd_* — ASCII, ≤ 14; mp3 ≤ 5 MB (base64 ≤ 7 000 000 characters).
- Colours — tokens only; `?v=` / `SNAPSHOT_V` bump; localStorage only via try/catch.

## Review Focus
1. The store is unavailable at boot → the page works with the countries from the snapshot (a warning in the console, not a failure).
2. An invalid country from the Sheet (someone edited it by hand) → skipped with an explanation, the rest work.
3. An overridden project country deleted → the project's text and mp3 come back.
4. A new country shifts the track numbers → the sketch (`countries.h`) and the SD card are built from the same catalog.
5. A double click on «Зберегти» / a slow upload → the form is blocked until the response.

## Task 1: glue (`globe/web_runner.py`)
Produces (JSON strings):
- `country_file(fields_json) -> str` — the `<ID>.txt` text (name, capital, continent, lcd_name, lcd_capital, `---`, text).
- `check_country(id, fields_json) -> {"errors":[…], "warnings":[…]}` — ID, `parse_country_file`, `validate_content.check`.
- `set_extra_countries(list_json) -> {"skipped":[{"id","errors"}], "ids":[…]}` — list items `{id, fields, has_audio}`;
  writes/restores files in the snapshot's `content/countries`, calls `setup` again.
- `catalog_list() -> [{"id","name","capital","continent","lcd_name","lcd_capital","track","extra","override"}]`
- `countries_header() -> {"header": str|None, "error": str}`
Tests (`tests/test_globe_runner.py`): adding FR → in the catalog, JP's track shifted by one; `show_country("FR")` passes `check`;
override UA → text/lcd_name from the teacher, `extra` and `override`; empty list → FR gone, UA from the project; invalid
(Cyrillic lcd_name) → in `skipped`, the rest added; `countries_header` == `render_header` of the same catalog.

## Task 2: Apps Script (`globe/apps-script/Code.gs`)
`handle()` + adapter: `sheets.countries` (rows), `upsertCountry`, `deleteCountry`, `saveAudio(id, b64) -> fileId`,
`readAudio(fileId) -> b64`, `dropAudio(fileId)`. Actions `countries`, `audio`, `add_country`, `delete_country`;
errors `bad_id`, `bad_country`, `too_big`, `no_audio`, `bad_key`. Tests in `tests/test_globe_appscript.mjs`.

## Task 3: client (`js/globe/store.js`)
`countries()`, `audio(id)`, `addCountry(key, country, audioB64)`, `deleteCountry(key, id)`. Browser tests with a fake fetch.

## Task 4: runtime (`js/globe/runtime.js`)
At boot, `GlobeStore.countries()` in parallel with Pyodide → `set_extra_countries`; `rt.countries()`, `rt.setCountries(list)`,
`rt.checkCountry(id, fields)`, `rt.countryFile(fields)`, `rt.countriesHeader()`, `rt.extraAudio(id)` (base64 → bytes, cache);
`audioUrl` takes the uploaded one first. Browser tests: FR from a fake store → the "France" frame, `audioUrl("FR")` blob.

## Task 5: archives (`js/globe/bundle.js`)
project: + `content/countries/<ID>.txt`, `content/audio/<ID>.mp3` of the teacher countries, fresh `countries.h`;
sketch: fresh `countries.h`; `sdcard() -> {blob, missing}`. Browser tests.

## Task 6: pages
The teacher: the «Країни глобуса» section (list, ▶, delete, the add form with a check before upload), «⬇ SD-картка (.zip)»,
a hint. The student: the list of IDs in the reference from `GlobeRuntime.countries()`. Check in the preview with the fake server.

## Task 7: README Apps Script (steps for updating the script), full suite, review, commit.
