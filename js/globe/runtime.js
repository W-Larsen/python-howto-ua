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
const SNAPSHOT_V = "20261009b";
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

/* blob-адреса mp3 країни зі знімка, або null, якщо запису немає */
rt.audioUrl = async function(id){
  const key = String(id || "").toUpperCase();
  if(key in audio) return audio[key];
  const f = zip && zip.file(PREFIX + "content/audio/" + key + ".mp3");
  audio[key] = f ? URL.createObjectURL(new Blob([await f.async("arraybuffer")], { type: "audio/mpeg" })) : null;
  return audio[key];
};

return rt;
})();
