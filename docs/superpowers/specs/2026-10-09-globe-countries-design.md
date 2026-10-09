# Touch The Globe: countries uploaded by the teacher

## Context
The audio and the list of countries come from the project snapshot (`globe/touch-the-globe.zip`). To add the students'
recordings for new countries, you would currently need to edit `Touch_The_Globe_v2`, commit, `tools/sync_globe.sh` and redeploy.
The teacher wants it simpler: upload a country right on the site, with no git and no deploy.

## Decision (approved in chat)
On `#/globe-teacher` there is a «Країни глобуса» section: a list of all countries (from the project + added ones, ▶ to listen),
and an «Додати країну» form: ID, name and capital (Ukrainian), lcd_name/lcd_capital (Latin, ≤ 14), continent, text, mp3.
Before saving, the same checks as `tools/validate_content.py` / `tools/build_arduino_data.py`. An added country can be
deleted or replaced; an ID from the project (e.g. `UA`) can be overridden with your own recording/text.

## Storage
The same Apps Script: a `countries` sheet (id, name, capital, continent, lcd_name, lcd_capital, text, audio_file, updated)
+ a Drive folder «Touch The Globe — аудіо» (`<ID>.mp3`). Actions:
- `countries` (public): the list without audio; `audio` {id} (public): base64 mp3;
- `add_country` {teacherKey, country, audio?} and `delete_country` {teacherKey, id}.
ID `^[A-Z]{2,3}$`, mp3 ≤ 5 MB. The teacher pastes the new Code.gs once, runs `setup` (Drive permission) and
publishes a new version (the `/exec` address does not change).

## Browser
- `web_runner.py`: `country_file`, `check_country`, `set_extra_countries` (writes `content/countries/<ID>.txt` into the Pyodide FS
  on top of the snapshot, restores project files on removal, re-reads the catalog), `catalog_list`, `countries_header`
  (`render_header` from `tools/build_arduino_data.py`).
- `runtime.js`: on boot it takes the countries from the store; `audioUrl` takes the uploaded mp3 before the one from the snapshot.
- `bundle.js`: the project and the sketch contain the new countries and a fresh `countries.h`; new `sdcard()` = `01/NNN.mp3` by
  the catalog's track numbers (the same as `build_sd_card.py`).
- The teacher page: the countries section + «⬇ SD-картка (.zip)» and a hint to re-download the sketch and the SD card together.
- The student page: the list of IDs in the reference is built from the catalog.

## Verification
CPython tests of the glue (adding, overriding, removing, track shifts, parity of `countries.h` with
`render_header`); node tests of Code.gs with a fake Drive; browser tests of the store/runtime/bundles; the teacher page in the preview
with the real Code.gs logic as a fake server.
