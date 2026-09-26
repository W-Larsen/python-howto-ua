/* ==========================================================================
   Тема оформлення: світла / авто / темна.
   Вибір живе в localStorage["pgsb.theme"] (light | dark; «авто» — ключа нема)
   і стоїть атрибутом data-theme на <html>. Найперше його ставить вбудований
   скрипт у <head> — ще до стилів, щоб не блимало. Цей модуль малює стан
   кнопок і міняє тему на кліку: [data-theme-set] у меню, [data-theme-cycle]
   на головній і в мобільній панелі.
   ========================================================================== */
"use strict";
window.Theme = (function(){

const KEY = "pgsb.theme";
const ORDER = ["light", "auto", "dark"];
/* ︎ — текстовий варіант символу, інакше деякі системи малюють емодзі */
const ICON = { light:"☀︎", auto:"◐", dark:"☾︎" };
const NAME = { light:"світла", auto:"як у системі", dark:"темна" };
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const html = document.documentElement;
let animTimer = null;

/* Без доступу до сховища (приватне вікно) — завжди «авто», без помилок */
function read(){
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch(e){ return "auto"; }
}
function store(mode){
  try {
    if(mode === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch(e){}
}
function apply(mode, animate){
  if(animate && !reduced){
    html.classList.add("theme-anim");
    clearTimeout(animTimer);
    animTimer = setTimeout(()=>html.classList.remove("theme-anim"), 300);
  }
  if(mode === "auto") html.removeAttribute("data-theme");
  else html.setAttribute("data-theme", mode);
}

let current = read();

function sync(){
  document.querySelectorAll("[data-theme-set]").forEach(b=>
    b.setAttribute("aria-pressed", String(b.dataset.themeSet === current)));
  document.querySelectorAll("[data-theme-cycle]").forEach(b=>{
    const label = "Тема: " + NAME[current] + ". Змінити";
    b.textContent = ICON[current];
    b.setAttribute("aria-label", label);
    b.title = label;
  });
}
function set(mode){
  if(ORDER.indexOf(mode) < 0) mode = "auto";
  current = mode;
  store(mode);
  apply(mode, true);
  sync();
}
const next = (mode) => ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

document.addEventListener("click", e=>{
  const s = e.target.closest("[data-theme-set]");
  if(s){ set(s.dataset.themeSet); return; }
  if(e.target.closest("[data-theme-cycle]")) set(next(current));
});

apply(current, false);
sync();

return { read, set, next, sync, get mode(){ return current; } };
})();
