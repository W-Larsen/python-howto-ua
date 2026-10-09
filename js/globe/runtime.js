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
const SNAPSHOT_V = "20261011a";
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
  /* країни вчителя — паралельно з Pyodide, а не після нього */
  const countriesPromise = fetchCountries();
  const buttonsPromise = fetchButtons();
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
  applyCountries(await countriesPromise);
  applyButtons(await buttonsPromise);
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
async function fetchCountries(){
  const store = window.GlobeStore;
  if(!store || !store.configured()) return { ok:true, list:[] };
  try {
    const r = await store.countries();
    /* стара версія Code.gs ще не знає про країни — працюємо з країнами проєкту */
    if(r.ok || r.error === "bad_action") return { ok:true, list: r.countries || [] };
    return { ok:false, error: r.error };
  } catch(e){ return { ok:false, error:"network" }; }
}
/* Збій сховища не стирає вже завантажені країни: інакше скетч і проєкт
   тихо зібралися б без них, і номери треків розійшлися б із SD-карткою. */
function applyCountries(r){
  if(!r.ok){
    rt.countriesError = window.GlobeStore ? GlobeStore.errorText(r.error) : r.error;
    console.warn("Touch The Globe: країни вчителя —", r.error);
    return { ok:false, error:r.error, skipped: rt.skipped || [], ids: [] };
  }
  rt.countriesError = "";
  return Object.assign({ ok:true }, rt.setCountries(r.list));
}
rt.countriesError = "";
rt.loadCountries = async function(){ return applyCountries(await fetchCountries()); };
rt.setCountries = function(list){
  const r = js(mod.set_extra_countries(JSON.stringify((list || []).map(c =>
    ({ id: c.id, fields: c.fields, has_audio: !!c.has_audio })))));
  Object.keys(audio).forEach(k => { if(audio[k]) URL.revokeObjectURL(audio[k]); delete audio[k]; });
  Object.keys(extraBytes).forEach(k => delete extraBytes[k]);
  if(r.skipped.length) console.warn("Touch The Globe: пропущено країни", r.skipped);
  rt.skipped = r.skipped;
  /* списки на сторінці вчителя (країни кнопок) підхоплюють нові країни */
  try { window.dispatchEvent(new Event("globe:countries")); } catch(e){}
  return r;
};
/* ---------------- країни кнопок ---------------- */
/* Вчитель закріплює країну за кнопкою (сторінка вчителя); таблиця одна для
   всіх учнів, лежить у тому самому сховищі й потрапляє в settings.py проєкту,
   тож ігри (task2, task3) беруть відповідь звідти, а не з task1. */
async function fetchButtons(){
  const store = window.GlobeStore;
  if(!store || !store.configured()) return { ok:true, list:[] };
  try {
    const r = await store.buttons();
    /* стара версія Code.gs ще не знає про кнопки — працюємо без таблиці */
    if(r.ok || r.error === "bad_action") return { ok:true, list: r.buttons || [] };
    return { ok:false, error: r.error };
  } catch(e){ return { ok:false, error:"network" }; }
}
function applyButtons(r){
  if(!r.ok){
    rt.buttonsError = window.GlobeStore ? GlobeStore.errorText(r.error) : r.error;
    console.warn("Touch The Globe: країни кнопок —", r.error);
    return { ok:false, error:r.error };
  }
  rt.buttonsError = "";
  const countries = rt.setButtons(r.list);
  /* сторінка учня перемальовує таблицю «кнопка → країна» */
  try { window.dispatchEvent(new Event("globe:buttons")); } catch(e){}
  return { ok:true, countries };
}
rt.buttonsError = "";
rt.loadButtons = async function(){ return applyButtons(await fetchButtons()); };
rt.setButtons = (list) => js(mod.set_button_countries(JSON.stringify(list || []))).countries;
/* [“UA”, “AU”, …] — ID країни на кнопці 1, 2, …; "" — не закріплено */
rt.buttons = () => js(mod.button_countries());
/* кнопок на платі — стільки, скільки пінів у settings.py знімка */
rt.buttonCount = () => js(mod.button_count());
rt.settingsText = () => mod.settings_text();

rt.countries = () => js(mod.catalog_list());
rt.checkCountry = (id, fields) => js(mod.check_country(String(id), JSON.stringify(fields || {})));
rt.countryFile = (fields) => mod.country_file(JSON.stringify(fields || {}));
rt.countriesHeader = () => js(mod.countries_header());

const extraBytes = {};
/* mp3, який учитель завантажив для країни (Uint8Array), або null */
/* Невдале завантаження не запам'ятовується — наступна спроба піде знову. */
rt.extraAudio = async function(id){
  if(id in extraBytes) return extraBytes[id];
  const c = rt.countries().find(x => x.id === id);
  if(!(c && c.extra && c.has_audio && window.GlobeStore)) return (extraBytes[id] = null);
  try {
    const r = await GlobeStore.audio(id);
    if(r.ok && r.audio) return (extraBytes[id] = Uint8Array.from(atob(r.audio), ch => ch.charCodeAt(0)));
  } catch(e){}
  return null;
};
/* запис учителя мав бути, але не завантажився */
rt.teacherAudioMissing = (c, bytes) => !!(c && c.extra && c.has_audio && !bytes);
/* mp3 зі знімка (Uint8Array) або null */
rt.snapshotAudio = async function(id){
  const f = zip && zip.file(PREFIX + "content/audio/" + id + ".mp3");
  return f ? f.async("uint8array") : null;
};

/* blob-адреса mp3 країни: спершу запис учителя, потім зі знімка; null — запису немає */
rt.audioUrl = async function(id){
  const key = String(id || "").toUpperCase();
  if(key in audio) return audio[key];
  const extra = await rt.extraAudio(key);
  if(rt.teacherAudioMissing(rt.countries().find(c => c.id === key), extra)) return null;
  const bytes = extra || (await rt.snapshotAudio(key));
  audio[key] = bytes ? URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" })) : null;
  return audio[key];
};

return rt;
})();
