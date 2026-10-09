/* ==========================================================================
   Сховище сторінки Touch The Globe.

   Хто учень і чернетки — у localStorage цього браузера (завжди, навіть без
   мережі). Збережене для вчителя — у Google Таблиці через Apps Script
   (globe/apps-script/Code.gs). Запити — POST з text/plain: такий запит
   браузер шле без попереднього OPTIONS, і Apps Script його приймає.
   ========================================================================== */
"use strict";
window.GlobeStore = (function(){

const WHO = "pgsb.globe.who";
const DRAFT = "pgsb.globe.draft.";

/* У приватному режимі localStorage може кидати помилки — тоді просто не зберігаємо. */
const ls = {
  get(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { window.localStorage.setItem(k, v); } catch(e){} },
  del(k){ try { window.localStorage.removeItem(k); } catch(e){} }
};

const ERRORS = {
  offline: "Сховище вчителя ще не налаштоване — код збережено лише в цьому браузері.",
  network: "Немає зв'язку зі сховищем — код збережено лише в цьому браузері. Спробую ще раз під час наступного запуску.",
  bad_class: "Такого коду класу немає — перевір його з учителем.",
  bad_name: "Впиши ім'я та прізвище.",
  bad_task: "Невідома задача.",
  too_long: "Код задовгий (понад 20 000 символів) — не збережено.",
  bad_key: "Неправильний ключ учителя.",
  server: "Сховище відповіло помилкою — код збережено лише в цьому браузері."
};

const normText = (s) => String(s || "").replace(/\s+/g, " ").trim();

function normWho(w){
  const cls = normText(w && w.cls).toUpperCase();
  const name = normText(w && w.name);
  return { cls, name, key: cls + "|" + name.toLowerCase() };
}

function who(){
  try {
    const w = JSON.parse(ls.get(WHO) || "null");
    return w && w.cls && w.name ? normWho(w) : null;
  } catch(e){ return null; }
}
function setWho(w){
  const n = normWho(w);
  ls.set(WHO, JSON.stringify({ cls: n.cls, name: n.name }));
  return n;
}
function clearWho(){ ls.del(WHO); }

const draftKey = (task) => DRAFT + ((who() || {}).key || "anon") + "." + task;
function draft(task){ return ls.get(draftKey(task)); }
function setDraft(task, code){ ls.set(draftKey(task), code); }

const api = {
  _endpoint: (window.GLOBE_CONFIG && window.GLOBE_CONFIG.endpoint) || "",
  _fetch: (url, o) => window.fetch(url, o)
};

async function post(body){
  if(!api._endpoint) return { ok:false, error:"offline" };
  let res;
  try {
    res = await api._fetch(api._endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });
  } catch(e){ return { ok:false, error:"network" }; }
  if(!res || !res.ok) return { ok:false, error:"network" };
  try {
    const data = await res.json();
    return data && typeof data === "object" ? data : { ok:false, error:"server" };
  } catch(e){ return { ok:false, error:"server" }; }
}

function save(task, code, problems){
  const w = who();
  if(!w) return Promise.resolve({ ok:false, error:"bad_name" });
  return post({ action:"save", cls:w.cls, name:w.name, task, code, problems: problems | 0 });
}
function load(){
  const w = who();
  if(!w) return Promise.resolve({ ok:false, error:"bad_name" });
  return post({ action:"load", cls:w.cls, name:w.name });
}
function teacherList(teacherKey, cls){
  return post({ action:"list", cls: normWho({ cls }).cls, teacherKey });
}
function teacherGet(teacherKey, cls, name){
  const n = normWho({ cls, name });
  return post({ action:"get", cls:n.cls, name:n.name, teacherKey });
}

const errorText = (code) => ERRORS[code] || ERRORS.server;
const configured = () => !!api._endpoint;

return Object.assign(api, {
  normWho, who, setWho, clearWho, draft, setDraft,
  save, load, teacherList, teacherGet, errorText, configured
});
})();
