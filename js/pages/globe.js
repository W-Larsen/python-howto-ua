/* ==========================================================================
   Touch The Globe — сторінка учня (#/globe).

   П'ять задач проєкту глобуса (students/task1.py … task5.py) в одному
   редакторі з вкладками, симулятор (js/globe/sim.js) праворуч і збереження:
   чернетка — завжди в цьому браузері, а для вчителя — у Google Таблиці
   (js/globe/store.js) щоразу, коли учень запускає чи перевіряє код.
   ========================================================================== */
"use strict";
window.PageInit["globe"] = function(){

const page = document.getElementById("page-globe");
const $ = (s) => page.querySelector(s);
const esc = PyEditor.esc;
const TASKS = ["task1.py", "task2.py", "task3.py", "task4.py", "task5.py"];

const ta = $("#globe-ta");
const hl = $("#globe-hl");
const tabsEl = $("#globe-tabs");
const problemsEl = $("#globe-problems");
const saveEl = $("#globe-save");

let current = 0;
const codes = {};          /* task -> код у редакторі */
const saved = {};          /* task -> код, який востаннє пішов у таблицю */
const status = {};         /* task -> {errors, warnings} з останньої перевірки */
let problems = [];
let ready = false;

/* ---------------- задачі й вкладки ---------------- */
/* «ЗАДАЧА 1. «МОНТАЖНИК»» з docstring заготовки → «Монтажник» */
function taskName(i){
  const m = /ЗАДАЧА\s*\d+\.\s*«([^»]+)»/.exec(GlobeRuntime.template(i + 1));
  if(!m) return "";
  const w = m[1].toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function renderTabs(){
  tabsEl.innerHTML = TASKS.map((t, i) => {
    const st = status[t];
    const untouched = ready && codes[t] === GlobeRuntime.template(i + 1);
    const badge = !ready ? "" : untouched ? `<span class="globe-tab-st">заготовка</span>`
      : !st ? "" : st.errors ? `<span class="globe-tab-st bad">${st.errors} ✕</span>`
      : `<span class="globe-tab-st ok">✓</span>`;
    return `<button type="button" role="tab" class="globe-tab" data-i="${i}"
      aria-selected="${i === current}" tabindex="${i === current ? 0 : -1}">
      <span class="globe-tab-n">Задача ${i + 1}</span>
      <span class="globe-tab-t">${esc(ready ? taskName(i) : "…")}</span>${badge}</button>`;
  }).join("");
}

function sync(){ PyEditor.syncEditor(ta, hl, 16); }

function select(i, line){
  codes[TASKS[current]] = ta.value;
  current = i;
  ta.value = codes[TASKS[i]] || "";
  sync();
  renderTabs();
  if(line) goToLine(line);
}

function goToLine(line){
  const lines = ta.value.split("\n");
  const start = lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0);
  ta.focus();
  ta.setSelectionRange(start, start + (lines[line - 1] || "").length);
  const lh = parseFloat(getComputedStyle(ta).lineHeight) || 22;
  const top = ta.getBoundingClientRect().top + window.scrollY + (line - 3) * lh;
  window.scrollTo({ top: Math.max(0, top - 80), behavior: "smooth" });
}

tabsEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-i]");
  if(b) select(+b.dataset.i);
});
tabsEl.addEventListener("keydown", (e) => {
  const j = { ArrowRight:(current + 1) % 5, ArrowLeft:(current + 4) % 5, Home:0, End:4 }[e.key];
  if(j === undefined) return;
  e.preventDefault();
  select(j);
  tabsEl.querySelector(`[data-i="${j}"]`).focus();
});

const sources = () => { codes[TASKS[current]] = ta.value; return Object.assign({}, codes); };

/* ---------------- проблеми ---------------- */
function showProblems(list){
  problems = list || [];
  TASKS.forEach(t => {
    const mine = problems.filter(p => p.file === t);
    status[t] = { errors: mine.filter(p => p.level === "error").length,
                  warnings: mine.filter(p => p.level !== "error").length };
  });
  renderTabs();
  if(!problems.length){ problemsEl.hidden = true; problemsEl.innerHTML = ""; return; }
  problemsEl.hidden = false;
  const errors = problems.filter(p => p.level === "error").length;
  problemsEl.innerHTML = `<p class="globe-problems-t">${errors
    ? "Помилки, через які код не запуститься на глобусі:" : "Код працює, але зверни увагу:"}</p>
    <ul>${problems.map((p, k) => `<li class="${p.level === "error" ? "bad" : "warn"}">
      <button type="button" class="globe-problem" data-k="${k}">${esc(p.text || p.message)}</button></li>`).join("")}</ul>`;
}
problemsEl.addEventListener("click", (e) => {
  const b = e.target.closest("[data-k]");
  if(!b) return;
  const p = problems[+b.dataset.k];
  const i = TASKS.indexOf(p.file);
  if(i >= 0) select(i, p.line);
});

/* ---------------- збереження ---------------- */
function setSave(text, kind){
  saveEl.textContent = text;
  saveEl.className = "globe-save " + (kind || "");
}
const hhmm = (iso) => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleTimeString("uk-UA", { hour:"2-digit", minute:"2-digit" });
};

/* зберігає в таблицю ті задачі, що змінилися (заготовки — ні) */
async function saveAll(){
  if(!ready) return;
  const src = sources();
  TASKS.forEach(t => GlobeStore.setDraft(t, src[t]));
  if(!GlobeStore.who()){ setSave("Збережено лише в цьому браузері — увійди, щоб учитель побачив код.", "warn"); return; }
  const dirty = TASKS.filter((t, i) => src[t] !== saved[t] && src[t] !== GlobeRuntime.template(i + 1));
  if(!dirty.length){
    if(GlobeStore.configured()) setSave("Нового коду немає — усе вже збережено.", "ok");
    else setSave(GlobeStore.errorText("offline"), "warn");
    return;
  }
  setSave("Зберігаю…");
  const results = await Promise.all(dirty.map(t =>
    GlobeStore.save(t, src[t], (status[t] || {}).errors || 0).then(r => ({ t, r }))));
  const bad = results.find(x => !x.r.ok);
  results.filter(x => x.r.ok).forEach(x => { saved[x.t] = src[x.t]; });
  if(bad) setSave(GlobeStore.errorText(bad.r.error), "warn");
  else setSave("Збережено для вчителя о " + hhmm(results[0].r.updated) + ".", "ok");
}

/* ---------------- перевірка й запуск ---------------- */
function check(){
  if(!ready) return;
  const r = GlobeRuntime.check(sources());
  showProblems(r.problems);
  if(!r.problems.length){
    problemsEl.hidden = false;
    problemsEl.innerHTML = `<p class="globe-problems-t ok">Помилок немає — код можна переносити на глобус.</p>`;
  }
  saveAll();
}

/* перший показ екрана після завантаження — без збереження */
let quiet = false;
const sim = GlobeSim.mount($("#globe-sim"), {
  sources,
  command: "1 2 3",
  autoBoot: false,
  /* і запуск команд, і перше натискання кнопки — привід зберегти */
  beforeRun(){ if(!quiet) saveAll(); return true; },
  onProblems: (list) => showProblems(list)
});

/* ---------------- редактор ---------------- */
PyEditor.wireEditor(ta, hl, {
  minRows: 16,
  onInput: (value) => {
    codes[TASKS[current]] = value;
    GlobeStore.setDraft(TASKS[current], value);
    sim.reset();
    setSave("");
  },
  onRun: () => sim.run()
});
ta.addEventListener("keydown", (e) => {
  if((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")){ e.preventDefault(); saveAll(); }
});

page.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-act]");
  if(!b) return;
  const act = b.dataset.act;
  if(act === "check") check();
  else if(act === "save") saveAll();
  else if(act === "download") download(b);
  else if(act === "logout") logout();
  else if(act === "reset"){
    if(b.dataset.armed !== "1"){
      b.dataset.armed = "1";
      b.textContent = "Точно? Натисни ще раз";
      setTimeout(() => { b.removeAttribute("data-armed"); b.textContent = "↺ Заготовка"; }, 4000);
      return;
    }
    b.removeAttribute("data-armed");
    b.textContent = "↺ Заготовка";
    ta.value = GlobeRuntime.template(current + 1);
    ta.dispatchEvent(new Event("input"));
  }
});

async function download(b){
  b.disabled = true;
  try {
    const blob = await GlobeBundle.project(sources());
    const w = GlobeStore.who();
    GlobeBundle.download(blob, "touch-the-globe" + (w ? "-" + w.cls.toLowerCase() : "") + ".zip");
  } finally { b.disabled = false; }
}

/* ---------------- хто учень ---------------- */
const loginForm = $("#globe-login");
const meBox = $("#globe-me");
const loginMsg = loginForm.querySelector('[data-role="login-msg"]');

function showWho(){
  const w = GlobeStore.who();
  loginForm.hidden = !!w;
  meBox.hidden = !w;
  if(w){
    meBox.querySelector('[data-role="me-name"]').textContent = w.name;
    meBox.querySelector('[data-role="me-cls"]').textContent = w.cls;
  }
}

/* код учня в редактор: чернетка з цього браузера, а якщо в таблиці новіший — він.
   carry — код, написаний до входу: дістається учневі, якщо своєї чернетки ще немає. */
async function loadCode(carry){
  TASKS.forEach((t, i) => {
    const tpl = GlobeRuntime.template(i + 1);
    const mine = GlobeStore.draft(t);
    if(mine === null && carry && carry[t] && carry[t] !== tpl){
      codes[t] = carry[t];
      GlobeStore.setDraft(t, carry[t]);
    }else codes[t] = mine ?? tpl;
    delete saved[t];
  });
  ta.value = codes[TASKS[current]];
  sync();
  renderTabs();
  if(!GlobeStore.who() || !GlobeStore.configured()) return;
  setSave("Завантажую збережений код…");
  const r = await GlobeStore.load();
  if(!r.ok){
    setSave(GlobeStore.errorText(r.error), "warn");
    return r;
  }
  let taken = 0;
  Object.entries(r.tasks || {}).forEach(([t, v]) => {
    if(!TASKS.includes(t)) return;
    saved[t] = v.code;
    const local = GlobeStore.draftTime(t);
    if(GlobeStore.draft(t) === null || !local || Date.parse(v.updated) > Date.parse(local)){
      if(codes[t] !== v.code) taken++;
      codes[t] = v.code;
      GlobeStore.setDraft(t, v.code);
    }
  });
  ta.value = codes[TASKS[current]];
  sync();
  renderTabs();
  setSave(taken ? "Завантажено збережений код (" + taken + " " + (taken === 1 ? "задача" : "задачі") + ")." : "Код з таблиці вже тут.", "ok");
  return r;
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(loginForm);
  const w = GlobeStore.normWho({ name: f.get("name"), cls: f.get("cls") });
  if(!w.name || !w.cls){ loginMsg.hidden = false; loginMsg.textContent = "Впиши ім'я та код класу."; return; }
  const before = ready ? sources() : null;
  GlobeStore.setWho(w);
  loginMsg.hidden = true;
  showWho();
  setSave("");
  sim.reset();
  if(!ready) return;
  const r = await loadCode(before);
  if(r && r.error === "bad_class"){
    GlobeStore.clearWho();
    showWho();
    loginMsg.hidden = false;
    loginMsg.textContent = GlobeStore.errorText("bad_class");
  }
});

function logout(){
  codes[TASKS[current]] = ta.value;
  GlobeStore.clearWho();
  showWho();
  setSave("");
  if(ready) loadCode();
  loginForm.querySelector("input").focus();
}

/* ---------------- старт ---------------- */
showWho();
renderTabs();
ta.value = "";
ta.disabled = true;
ta.placeholder = "Завантажую Python і проєкт глобуса…";
sync();
GlobeRuntime.boot().then(async () => {
  ready = true;
  ta.disabled = false;
  ta.placeholder = "";
  $("#globe-api").innerHTML = PyEditor.highlight(GlobeRuntime.apiDoc());
  page.querySelectorAll('[data-act="check"], [data-act="download"]').forEach(b => { b.disabled = false; });
  await loadCode();
  quiet = true;
  await sim.run("");
  quiet = false;
}).catch(err => {
  ta.placeholder = err.message;
  setSave(err.message, "warn");
});

};
