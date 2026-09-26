"use strict";
(function(){
/* Тема: режими «світла / авто / темна» і збереження в localStorage["pgsb.theme"].
   Тести міняють <html data-theme> і сховище — наприкінці все вертаємо. */
const KEY = "pgsb.theme";
function keep(fn){
  const html = document.documentElement;
  const attr = html.getAttribute("data-theme");
  const mode = Theme.mode;
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch(e){}
  try { return fn(); }
  finally {
    Theme.set(mode);
    try { saved === null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, saved); } catch(e){}
    if(attr === null) html.removeAttribute("data-theme"); else html.setAttribute("data-theme", attr);
    html.classList.remove("theme-anim");
  }
}

T.test("тема: циклер іде світла → авто → темна → світла", () => {
  T.eq(Theme.next("light"), "auto");
  T.eq(Theme.next("auto"), "dark");
  T.eq(Theme.next("dark"), "light");
});

T.test("тема: вибір пишеться в сховище й на <html>; «авто» ключ прибирає", () => keep(() => {
  Theme.set("dark");
  T.eq(localStorage.getItem(KEY), "dark");
  T.eq(document.documentElement.getAttribute("data-theme"), "dark");
  T.eq(Theme.read(), "dark");
  Theme.set("auto");
  T.eq(localStorage.getItem(KEY), null);
  T.eq(document.documentElement.hasAttribute("data-theme"), false);
  T.eq(Theme.read(), "auto");
}));

T.test("тема: сміття в сховищі читається як «авто»", () => keep(() => {
  localStorage.setItem(KEY, "purple");
  T.eq(Theme.read(), "auto");
}));

T.test("тема: без сховища вибір усе одно застосовується, помилок нема", () => keep(() => {
  const P = Storage.prototype, get = P.getItem, set = P.setItem, del = P.removeItem;
  const boom = () => { throw new Error("blocked"); };
  P.getItem = P.setItem = P.removeItem = boom;
  try {
    T.eq(Theme.read(), "auto");
    Theme.set("dark");
    T.eq(document.documentElement.getAttribute("data-theme"), "dark");
  } finally { P.getItem = get; P.setItem = set; P.removeItem = del; }
}));

T.test("тема: кнопки перемикача й циклер показують поточний режим", () => keep(() => {
  const box = document.createElement("div");
  box.innerHTML =
    `<button data-theme-set="light"></button><button data-theme-set="auto"></button>` +
    `<button data-theme-set="dark"></button><button data-theme-cycle></button>`;
  document.getElementById("sandbox").appendChild(box);
  try {
    Theme.set("light");
    T.eq([...box.querySelectorAll("[data-theme-set]")].map(b => b.getAttribute("aria-pressed")),
         ["true", "false", "false"]);
    const cyc = box.querySelector("[data-theme-cycle]");
    T.ok(/світла/.test(cyc.getAttribute("aria-label")), cyc.getAttribute("aria-label"));
    cyc.click();                                           /* світла → авто */
    T.eq(Theme.mode, "auto");
    box.querySelector('[data-theme-set="dark"]').click();
    T.eq(Theme.mode, "dark");
  } finally { box.remove(); }
}));
})();
