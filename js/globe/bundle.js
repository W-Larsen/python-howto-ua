/* ==========================================================================
   Архіви сторінки Touch The Globe — збираються прямо в браузері зі знімка
   проєкту (GlobeRuntime.snapshot()):

     project(sources) — увесь проєкт Touch_The_Globe/ з кодом учня(ів) у
                        students/ і свіжим student_code.h: make press /
                        make build на своєму комп'ютері;
     sketch(sources)  — лише папка TouchTheGlobe/ для Arduino IDE з
                        student_code.h, як після make build;
     sdcard()         — вміст microSD для DFPlayer (01/001.mp3, …).

   Країни, які вчитель додав на сайті, потрапляють в усі три архіви, а
   countries.h і номери треків на картці беруться з одного каталогу.

   student_code.h складає той самий перекладач, що й make build
   (GlobeRuntime.header) — і так само відмовляється, якщо в коді є помилки.
   ========================================================================== */
"use strict";
window.GlobeBundle = (function(){

const TASKS = ["task1.py", "task2.py", "task3.py", "task4.py", "task5.py"];
const SKETCH = "arduino/TouchTheGlobe/";

/* задачі, яких немає в sources, — заготовки зі знімка (як у свіжому проєкті) */
function full(sources){
  const out = {};
  TASKS.forEach((t, i) => {
    out[t] = sources && typeof sources[t] === "string" ? sources[t] : GlobeRuntime.template(i + 1);
  });
  return out;
}

const pack = (z) => z.generateAsync({ type: "blob", compression: "DEFLATE" });
const COUNTRY_FIELDS = ["name", "capital", "continent", "lcd_name", "lcd_capital", "text"];
const trackFile = (track) => "01/" + String(track).padStart(3, "0") + ".mp3";
const audioFailed = (id) => "Не вдалося завантажити запис " + id + " зі сховища — спробуйте ще раз за хвилину.";

/* Країни, які вчитель додав на сайті, — у проєкт як звичайні файли:
   content/countries/<ID>.txt і content/audio/<ID>.mp3. */
async function addCountries(z, root){
  for(const c of GlobeRuntime.countries().filter(c => c.extra)){
    const fields = {};
    COUNTRY_FIELDS.forEach(f => { fields[f] = c[f]; });
    z.file(root + "content/countries/" + c.id + ".txt", GlobeRuntime.countryFile(fields));
    const bytes = c.has_audio ? await GlobeRuntime.extraAudio(c.id) : null;
    if(GlobeRuntime.teacherAudioMissing(c, bytes)) throw new Error(audioFailed(c.id));
    if(bytes) z.file(root + "content/audio/" + c.id + ".mp3", bytes);
  }
}

async function project(sources){
  const all = full(sources);
  const z = await JSZip.loadAsync(GlobeRuntime.snapshot());
  const root = GlobeRuntime.prefix;
  TASKS.forEach(t => z.file(root + "students/" + t, all[t]));
  /* settings.py із країнами кнопок: make press / make build на комп'ютері учня
     читають ту саму таблицю, що й сайт */
  z.file(root + "settings.py", GlobeRuntime.settingsText());
  await addCountries(z, root);
  /* countries.h — з того самого каталогу, що й номери треків на SD-картці */
  const ch = GlobeRuntime.countriesHeader();
  if(ch.header) z.file(root + SKETCH + "countries.h", ch.header);
  /* з помилками student_code.h лишається зі знімка — make build покаже, що виправити */
  const h = GlobeRuntime.header(all);
  if(h.header) z.file(root + SKETCH + "student_code.h", h.header);
  return pack(z);
}

async function sketch(sources){
  const h = GlobeRuntime.header(full(sources));
  if(!h.header) return { problems: h.problems };
  const ch = GlobeRuntime.countriesHeader();
  if(!ch.header) return { problems: h.problems.concat([{ level: "error", file: null, line: null,
    message: ch.error, text: "countries.h: " + ch.error }]) };
  const src = await JSZip.loadAsync(GlobeRuntime.snapshot());
  const from = GlobeRuntime.prefix + SKETCH;
  const out = new JSZip();
  const files = Object.keys(src.files).filter(n =>
    n.startsWith(from) && !src.files[n].dir && !n.slice(from.length).startsWith("build/"));
  for(const n of files) out.file("TouchTheGlobe/" + n.slice(from.length), await src.file(n).async("uint8array"));
  out.file("TouchTheGlobe/student_code.h", h.header);
  out.file("TouchTheGlobe/countries.h", ch.header);
  return { blob: await pack(out), problems: h.problems };
}

/* Вміст microSD для DFPlayer, як tools/build_sd_card.py: 01/001.mp3, 002.mp3…
   за номерами треків каталогу. missing — країни без жодного запису. */
async function sdcard(){
  const out = new JSZip();
  const missing = [];
  for(const c of GlobeRuntime.countries()){
    const extra = await GlobeRuntime.extraAudio(c.id);
    /* без запису вчителя не підкладаємо проєктний mp3 — на картці був би не той голос */
    if(GlobeRuntime.teacherAudioMissing(c, extra)) throw new Error(audioFailed(c.id));
    const bytes = extra || (await GlobeRuntime.snapshotAudio(c.id));
    if(bytes) out.file(trackFile(c.track), bytes);
    else missing.push(c);
  }
  return { blob: await pack(out), missing };
}

function download(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

return { project, sketch, sdcard, download, full };
})();
