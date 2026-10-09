/* ==========================================================================
   Архіви сторінки Touch The Globe — збираються прямо в браузері зі знімка
   проєкту (GlobeRuntime.snapshot()):

     project(sources) — увесь проєкт Touch_The_Globe/ з кодом учня(ів) у
                        students/ і свіжим student_code.h: make press /
                        make build на своєму комп'ютері;
     sketch(sources)  — лише папка TouchTheGlobe/ для Arduino IDE з
                        student_code.h, як після make build.

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

async function project(sources){
  const all = full(sources);
  const z = await JSZip.loadAsync(GlobeRuntime.snapshot());
  const root = GlobeRuntime.prefix;
  TASKS.forEach(t => z.file(root + "students/" + t, all[t]));
  /* з помилками student_code.h лишається зі знімка — make build покаже, що виправити */
  const h = GlobeRuntime.header(all);
  if(h.header) z.file(root + SKETCH + "student_code.h", h.header);
  return pack(z);
}

async function sketch(sources){
  const h = GlobeRuntime.header(full(sources));
  if(!h.header) return { problems: h.problems };
  const src = await JSZip.loadAsync(GlobeRuntime.snapshot());
  const from = GlobeRuntime.prefix + SKETCH;
  const out = new JSZip();
  const files = Object.keys(src.files).filter(n =>
    n.startsWith(from) && !src.files[n].dir && !n.slice(from.length).startsWith("build/"));
  for(const n of files) out.file("TouchTheGlobe/" + n.slice(from.length), await src.file(n).async("uint8array"));
  out.file("TouchTheGlobe/student_code.h", h.header);
  return { blob: await pack(out), problems: h.problems };
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

return { project, sketch, download, full };
})();
