"use strict";
(function(){
/* Тема: режими «світла / темна» і збереження в localStorage["pgsb.theme"].
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
  }
}

const SYSTEM = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

T.test("тема: циклер перемикає світла ↔ темна, «авто» нема", () => {
  T.eq(Theme.next("light"), "dark");
  T.eq(Theme.next("dark"), "light");
});

T.test("тема: вибір пишеться в сховище й на <html>", () => keep(() => {
  Theme.set("dark");
  T.eq(localStorage.getItem(KEY), "dark");
  T.eq(document.documentElement.getAttribute("data-theme"), "dark");
  T.eq(Theme.read(), "dark");
  Theme.set("light");
  T.eq(localStorage.getItem(KEY), "light");
  T.eq(document.documentElement.getAttribute("data-theme"), "light");
  T.eq(Theme.read(), "light");
}));

T.test("тема: без вибору, зі сміттям чи колишнім «авто» — тема системи", () => keep(() => {
  localStorage.removeItem(KEY);
  T.eq(Theme.read(), SYSTEM);
  localStorage.setItem(KEY, "purple");
  T.eq(Theme.read(), SYSTEM);
  Theme.set("auto");
  T.eq(Theme.mode, SYSTEM);
  T.eq(document.documentElement.getAttribute("data-theme"), SYSTEM);
}));

T.test("тема: без сховища вибір усе одно застосовується, помилок нема", () => keep(() => {
  const P = Storage.prototype, get = P.getItem, set = P.setItem, del = P.removeItem;
  const boom = () => { throw new Error("blocked"); };
  P.getItem = P.setItem = P.removeItem = boom;
  try {
    T.eq(Theme.read(), SYSTEM);
    Theme.set("dark");
    T.eq(document.documentElement.getAttribute("data-theme"), "dark");
  } finally { P.getItem = get; P.setItem = set; P.removeItem = del; }
}));

T.test("тема: кнопки перемикача й циклер показують поточний режим", () => keep(() => {
  const box = document.createElement("div");
  box.innerHTML =
    `<button data-theme-set="light"></button><button data-theme-set="dark"></button>` +
    `<button data-theme-cycle></button>`;
  document.getElementById("sandbox").appendChild(box);
  try {
    Theme.set("light");
    T.eq([...box.querySelectorAll("[data-theme-set]")].map(b => b.getAttribute("aria-pressed")),
         ["true", "false"]);
    const cyc = box.querySelector("[data-theme-cycle]");
    T.ok(/світла/.test(cyc.getAttribute("aria-label")), cyc.getAttribute("aria-label"));
    cyc.click();                                           /* світла → темна */
    T.eq(Theme.mode, "dark");
    box.querySelector('[data-theme-set="light"]').click();
    T.eq(Theme.mode, "light");
  } finally { box.remove(); }
}));

T.test("тема: програмна зміна діє одразу, без відкладеного переходу", () => keep(() => {
  Theme.set("dark");
  T.eq(document.documentElement.getAttribute("data-theme"), "dark");
  Theme.set("light");
  T.eq(document.documentElement.getAttribute("data-theme"), "light");
}));
})();
