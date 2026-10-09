/* ==========================================================================
   Рушій сторінки Touch The Globe: знімок проєкту + Pyodide.

   Знімок (globe/touch-the-globe.zip — make student-zip проєкту глобуса,
   оновлюється tools/sync_globe.sh) вантажиться один раз і служить трьом
   справам: Pyodide розпаковує з нього globe_core, JSZip збирає з нього
   архіви для скачування (js/globe/bundle.js), а mp3 країн грають у
   симуляторі. Python-обв'язка — globe/web_runner.py.
   ========================================================================== */
"use strict";
window.GlobeRuntime = (function(){

const JSZIP_URL = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
/* версія знімка для кешу браузера: після tools/sync_globe.sh підніми її */
const SNAPSHOT_V = "20261010a";
const PREFIX = "Touch_The_Globe/";
const BOOT_ERROR = "Не вдалося завантажити проєкт глобуса. Відкрий сайт через інтернет " +
  "(не як файл з диска) і онови сторінку.";

const rt = { base: "" };
let booting = null;
let py = null, mod = null, zip = null, snapshot = null;
const texts = {};
const audio = {};

async function fetchOk(url, kind){
  const res = await fetch(url);
  if(!res.ok) throw new Error(url + ": " + res.status);
  return kind === "text" ? res.text() : res.arrayBuffer();
}

async function load(){
  if(!window.JSZip) await PyEditor.loadScript(JSZIP_URL);
  const [buf, runner, pyodide] = await Promise.all([
    fetchOk(rt.base + "globe/touch-the-globe.zip?v=" + SNAPSHOT_V),
    fetchOk(rt.base + "globe/web_runner.py?v=" + SNAPSHOT_V, "text"),
    PyEditor.bootPyodide()
  ]);
  const z = await JSZip.loadAsync(buf);
  for(let n = 1; n <= 5; n++) texts["task" + n] = await z.file(PREFIX + "students/task" + n + ".py").async("string");
  texts.api = await z.file(PREFIX + "globe_api.py").async("string");

  pyodide.unpackArchive(buf, "zip", { extractDir: "/globe" });
  try { pyodide.FS.mkdir("/globe_web"); } catch(e){}
  pyodide.FS.writeFile("/globe_web/web_runner.py", runner);
  pyodide.runPython([
    "import sys",
    "for p in ('/globe/Touch_The_Globe', '/globe_web'):",
    "    if p not in sys.path: sys.path.insert(0, p)",
    "import web_runner",
    "web_runner.setup('/globe/Touch_The_Globe')"
  ].join("\n"));
  py = pyodide;
  mod = pyodide.pyimport("web_runner");
  zip = z;
  snapshot = buf;
  /* країни, які вчитель додав на сайті; без сховища — лише країни проєкту */
  await rt.loadCountries().catch(err => console.warn("Touch The Globe: країни вчителя", err));
}

/* Один запуск на вкладку; якщо не вийшло — наступний boot() спробує знову. */
rt.boot = function(){
  if(!booting) booting = load().catch((err) => {
    booting = null;
    console.error("Touch The Globe:", err);
    throw new Error(BOOT_ERROR);
  });
  return booting;
};

rt.isReady = () => !!mod;
rt.zip = () => zip;
/* сам знімок (ArrayBuffer): з нього bundle.js збирає нові архіви, не чіпаючи zip() */
rt.snapshot = () => snapshot;
rt.prefix = PREFIX;
rt.template = (n) => texts["task" + n] || "";
rt.apiDoc = () => texts.api || "";

const js = (s) => JSON.parse(s);
const src = (sources) => JSON.stringify(sources || {});
const now = () => Math.round(performance.now());

rt.check = (sources) => js(mod.check(src(sources)));
rt.run = (sources, command) => js(mod.run_script(src(sources), String(command || "")));
rt.liveStart = (sources) => js(mod.live_start(src(sources), now()));
rt.livePress = (token) => js(mod.live_press(String(token), now()));
rt.liveTick = () => js(mod.live_tick(now()));
rt.liveMode = () => mod.live_mode();
rt.header = (sources) => js(mod.build_header(src(sources)));

/* ---------------- країни вчителя ---------------- */
/* Сховище (Google Таблиця + Drive) → файли content/countries/<ID>.txt поверх
   знімка в Pyodide. Повертає {skipped, ids}; неправильні країни пропускаються. */
rt.loadCountries = async function(){
  const store = window.GlobeStore;
  let list = [];
  if(store && store.configured()){
    const r = await store.countries();
    if(r.ok) list = r.countries || [];
    else if(r.error !== "bad_action") console.warn("Touch The Globe: країни вчителя —", r.error);
  }
  return rt.setCountries(list);
};
rt.setCountries = function(list){
  const r = js(mod.set_extra_countries(JSON.stringify((list || []).map(c =>
    ({ id: c.id, fields: c.fields, has_audio: !!c.has_audio })))));
  Object.keys(audio).forEach(k => { if(audio[k]) URL.revokeObjectURL(audio[k]); delete audio[k]; });
  Object.keys(extraBytes).forEach(k => delete extraBytes[k]);
  if(r.skipped.length) console.warn("Touch The Globe: пропущено країни", r.skipped);
  rt.skipped = r.skipped;
  return r;
};
rt.countries = () => js(mod.catalog_list());
rt.checkCountry = (id, fields) => js(mod.check_country(String(id), JSON.stringify(fields || {})));
rt.countryFile = (fields) => mod.country_file(JSON.stringify(fields || {}));
rt.countriesHeader = () => js(mod.countries_header());

const extraBytes = {};
/* mp3, який учитель завантажив для країни (Uint8Array), або null */
rt.extraAudio = async function(id){
  if(id in extraBytes) return extraBytes[id];
  const c = rt.countries().find(x => x.id === id);
  let bytes = null;
  if(c && c.extra && c.has_audio && window.GlobeStore){
    const r = await GlobeStore.audio(id);
    if(r.ok && r.audio) bytes = Uint8Array.from(atob(r.audio), ch => ch.charCodeAt(0));
  }
  return (extraBytes[id] = bytes);
};
/* mp3 зі знімка (Uint8Array) або null */
rt.snapshotAudio = async function(id){
  const f = zip && zip.file(PREFIX + "content/audio/" + id + ".mp3");
  return f ? f.async("uint8array") : null;
};

/* blob-адреса mp3 країни: спершу запис учителя, потім зі знімка; null — запису немає */
rt.audioUrl = async function(id){
  const key = String(id || "").toUpperCase();
  if(key in audio) return audio[key];
  const bytes = (await rt.extraAudio(key)) || (await rt.snapshotAudio(key));
  audio[key] = bytes ? URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })) : null;
  return audio[key];
};

return rt;
})();
