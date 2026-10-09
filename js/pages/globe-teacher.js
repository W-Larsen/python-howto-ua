/* ==========================================================================
   Touch The Globe — сторінка вчителя (#/globe-teacher, лише за прямим
   посиланням). Ключ учителя + код класу → таблиця «учні × задачі» з Google
   Таблиці (js/globe/store.js). Клік по клітинці — код учня і симулятор з
   усіма його задачами. У кожному стовпчику вчитель обирає, чий розв'язок
   піде на глобус, і скачує скетч Arduino або Python-проєкт класу.
   ========================================================================== */
"use strict";
window.PageInit["globe-teacher"] = function(){

const root = document.getElementById("globe-teacher");
const esc = PyEditor.esc;
const TASKS = ["task1.py", "task2.py", "task3.py", "task4.py", "task5.py"];
const KEY = "pgsb.globe.tkey";
const ss = {
  get(k){ try { return sessionStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { sessionStorage.setItem(k, v); } catch(e){} }
};

root.innerHTML = `
  <form class="gt-login" autocomplete="off">
    <label>Ключ учителя<input name="key" type="password" required></label>
    <label>Код класу<input name="cls" type="text" required autocapitalize="characters" placeholder="9A"></label>
    <button type="submit" class="ctl primary">Показати клас</button>
    <p class="gt-msg" data-role="msg" hidden></p>
  </form>
  <div data-role="class" hidden>
    <div class="gt-scroll"><table class="gt-table"><thead></thead><tbody></tbody></table></div>
    <p class="gt-hint">Клік по часу — код учня й симулятор. Перемикачі в рядках — чий розв'язок кожної задачі піде на глобус
      (спершу обрано найновіший без помилок).</p>
    <div class="gt-actions">
      <button type="button" class="ctl primary" data-act="sketch">⬇ Скетч Arduino класу</button>
      <button type="button" class="ctl" data-act="project">⬇ Python-проєкт класу</button>
      <button type="button" class="ctl" data-act="refresh">↻ Оновити</button>
    </div>
    <div class="gt-build" data-role="build" hidden></div>
    <div class="gt-view" data-role="view" hidden>
      <div class="gt-code"><div class="gt-code-h" data-role="code-h"></div><pre data-role="code"></pre></div>
      <div data-role="sim"></div>
    </div>
  </div>`;

const $ = (s) => root.querySelector(s);
const form = $(".gt-login");
const msg = $('[data-role="msg"]');
const box = $('[data-role="class"]');
const buildEl = $('[data-role="build"]');
let key = "", cls = "", students = [], byName = {};
const codeCache = {};       /* ім'я → {task: {code, updated, problems}} */
let simSources = {}, sim = null;

function say(text, ok){
  msg.hidden = !text;
  msg.textContent = text || "";
  msg.className = "gt-msg" + (ok ? " ok" : "");
}
const hhmm = (iso) => {
  const d = new Date(iso);
  if(isNaN(d)) return "";
  const today = new Date().toDateString() === d.toDateString();
  return d.toLocaleString("uk-UA", today ? { hour:"2-digit", minute:"2-digit" }
    : { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
};
function taskName(i){
  const m = /ЗАДАЧА\s*\d+\.\s*«([^»]+)»/.exec(GlobeRuntime.template(i + 1));
  if(!m) return "";
  return m[1].charAt(0) + m[1].slice(1).toLowerCase();
}

/* ---------------- таблиця класу ---------------- */
async function loadClass(){
  say("Завантажую…", true);
  const r = await GlobeStore.teacherList(key, cls);
  if(!r.ok){ say(GlobeStore.errorText(r.error)); box.hidden = true; return; }
  byName = {};
  (r.rows || []).forEach(row => { (byName[row.name] = byName[row.name] || {})[row.task] = row; });
  students = Object.keys(byName).sort((a, b) => a.localeCompare(b, "uk"));
  Object.keys(codeCache).forEach(k => delete codeCache[k]);
  say(students.length ? "" : "У класі " + cls + " ще ніхто нічого не зберіг.", true);
  render();
  box.hidden = !students.length;
}

/* за замовчуванням: найновіший розв'язок без помилок, а як таких нема — нічий (заготовка) */
function defaultPick(task){
  let best = null;
  students.forEach(n => {
    const row = byName[n][task];
    if(row && !row.problems && (!best || row.updated > byName[best][task].updated)) best = n;
  });
  return best;
}

function render(){
  const head = `<tr><th>Учень</th>${TASKS.map((t, i) =>
    `<th>Задача ${i + 1}<small>${esc(taskName(i))}</small></th>`).join("")}</tr>`;
  const pickRow = `<tr><td class="gt-name gt-empty">заготовка</td>${TASKS.map(t =>
    `<td><label class="gt-cell"><input class="gt-pick" type="radio" name="pick-${t}" value=""
      ${defaultPick(t) === null ? "checked" : ""}> <span class="gt-empty">нічий</span></label></td>`).join("")}</tr>`;
  const rows = students.map((n, k) => `<tr><td class="gt-name">${esc(n)}</td>${TASKS.map(t => {
    const row = byName[n][t];
    if(!row) return `<td class="gt-empty">—</td>`;
    const st = row.problems ? `bad" title="помилок: ${row.problems}` : `ok" title="без помилок`;
    return `<td><span class="gt-cell">
      <input class="gt-pick" type="radio" name="pick-${t}" value="${k}" aria-label="${esc(n)}: ${t} на глобус"
        ${defaultPick(t) === n ? "checked" : ""}>
      <button type="button" class="gt-open ${st}" data-open="${k}" data-task="${t}">
        ${esc(hhmm(row.updated))} ${row.problems ? "✕ " + row.problems : "✓"}</button></span></td>`;
  }).join("")}</tr>`).join("");
  $(".gt-table thead").innerHTML = head;
  $(".gt-table tbody").innerHTML = pickRow + rows;
}

async function studentCode(name){
  if(codeCache[name]) return codeCache[name];
  const r = await GlobeStore.teacherGet(key, cls, name);
  if(!r.ok) throw new Error(GlobeStore.errorText(r.error));
  return (codeCache[name] = r.tasks || {});
}

/* ---------------- код учня + симулятор ---------------- */
async function open(name, task){
  root.querySelectorAll(".gt-open[aria-pressed]").forEach(b => b.removeAttribute("aria-pressed"));
  const btn = root.querySelector(`.gt-open[data-open="${students.indexOf(name)}"][data-task="${task}"]`);
  if(btn) btn.setAttribute("aria-pressed", "true");
  let tasks;
  try { tasks = await studentCode(name); } catch(e){ say(e.message); return; }
  const view = $('[data-role="view"]');
  view.hidden = false;
  $('[data-role="code-h"]').innerHTML = `<b>${esc(name)}</b> · ${task} · ${esc(hhmm((tasks[task] || {}).updated))}`;
  $('[data-role="code"]').innerHTML = PyEditor.highlight((tasks[task] || {}).code || "");
  /* у симуляторі — усі задачі цього учня (решта — заготовки), як у нього на сторінці */
  simSources = GlobeBundle.full(Object.fromEntries(Object.entries(tasks).map(([t, v]) => [t, v.code])));
  if(!sim) sim = GlobeSim.mount($('[data-role="sim"]'), { sources: () => simSources, command: "1 2 3" });
  else { sim.stop(); sim.run(""); }
  view.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- архіви класу ---------------- */
async function chosen(){
  const sources = {}, who = {};
  for(const t of TASKS){
    const r = root.querySelector(`input[name="pick-${t}"]:checked`);
    if(!r || r.value === "") continue;
    const name = students[+r.value];
    const tasks = await studentCode(name);
    if(tasks[t]){ sources[t] = tasks[t].code; who[t] = name; }
  }
  return { sources, who };
}

function showBuild(html){ buildEl.hidden = !html; buildEl.innerHTML = html || ""; }

async function download(kind, btn){
  btn.disabled = true;
  showBuild("");
  try {
    const { sources, who } = await chosen();
    const list = Object.keys(who).map(t => `${t} — ${esc(who[t])}`).join(", ") || "лише заготовки";
    const name = "touch-the-globe-" + cls.toLowerCase();
    if(kind === "project"){
      GlobeBundle.download(await GlobeBundle.project(sources), name + ".zip");
      showBuild(`<div class="callout"><p>Python-проєкт класу: ${list}.</p></div>`);
      return;
    }
    const r = await GlobeBundle.sketch(sources);
    if(!r.blob){
      showBuild(`<div class="callout warn"><p><b>student_code.h не створено</b> — у вибраних розв'язках є помилки
        (так само відмовив би <code>make build</code>). Оберіть інші розв'язки або «нічий».</p>
        <ul>${r.problems.filter(p => p.level === "error").map(p => `<li>${esc(p.text)}</li>`).join("")}</ul></div>`);
      return;
    }
    GlobeBundle.download(r.blob, name + "-sketch.zip");
    showBuild(`<div class="callout"><p>Скетч: ${list}. Розпакуйте, відкрийте <code>TouchTheGlobe/TouchTheGlobe.ino</code>
      в Arduino IDE, плата Arduino Uno → Upload. Якщо IDE пише «Sketch too big», поставте
      <code>#define ENABLE_HARDWARE_CHECK 0</code> у <code>hardware_pins.h</code> (це вимикає лише команду
      <code>check</code> у Serial Monitor).</p></div>`);
  } catch(e){
    showBuild(`<div class="callout warn"><p>${esc(e.message)}</p></div>`);
  } finally { btn.disabled = false; }
}

/* ---------------- події ---------------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  key = form.key.value;
  cls = GlobeStore.normWho({ cls: form.cls.value }).cls;
  ss.set(KEY, JSON.stringify({ key, cls }));
  await GlobeRuntime.boot().catch(err => say(err.message));
  if(GlobeRuntime.isReady()) loadClass();
});
root.addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]");
  if(o){ open(students[+o.dataset.open], o.dataset.task); return; }
  const b = e.target.closest("button[data-act]");
  if(!b) return;
  if(b.dataset.act === "refresh") loadClass();
  else download(b.dataset.act, b);
});

if(!GlobeStore.configured()){
  say("Сховище ще не налаштоване: впишіть адресу Apps Script у js/globe-config.js (інструкція — globe/apps-script/README.md).");
}
try {
  const saved = JSON.parse(ss.get(KEY) || "null");
  if(saved){ form.key.value = saved.key; form.cls.value = saved.cls; }
} catch(e){}
GlobeRuntime.boot().catch(err => say(err.message));

};
