"use strict";
(function(){
/* Віджет-програвач: смужка-заголовок і стан керування */
function page(html){
  const s = document.createElement("section");
  s.className = "page";
  s.innerHTML = html;
  document.getElementById("sandbox").appendChild(s);
  return s;
}
function bar(s, id, cfg){
  const d = document.createElement("div");
  d.innerHTML = CollKit.titleBar(s.querySelector("#" + id), cfg);
  return d.firstElementChild;
}

T.test("віджет: смужка бере номер і назву найближчого попереднього h2", () => {
  const s = page(
    `<div class="widget" id="kt-0"></div>` +
    `<h2 data-sec="3.1">Перший</h2><div class="widget" id="kt-1"></div>` +
    `<h2 data-sec="3.2">Вбудовані функції<span class="badge">advanced</span></h2>` +
    `<p>текст</p><h3>підрозділ</h3><div class="widget" id="kt-2"></div>` +
    `<h2>Без номера</h2><div class="widget" id="kt-3"></div>`);
  try {
    const b0 = bar(s, "kt-0");
    T.eq(b0.className, "w-head");
    T.eq(b0.querySelector(".w-sec"), null);
    T.eq(b0.querySelector(".w-title").textContent, "Приклад");
    T.eq(bar(s, "kt-1").querySelector(".w-sec").textContent, "3.1");
    const b2 = bar(s, "kt-2", `<label>n <input data-cfg></label>`);
    T.eq(b2.querySelector(".w-sec").textContent, "3.2");
    T.eq(b2.querySelector(".w-title").textContent, "Вбудовані функції");
    T.ok(b2.querySelector(".w-config input[data-cfg]"), "налаштування не в смужці");
    const b3 = bar(s, "kt-3");
    T.eq(b3.querySelector(".w-sec"), null);
    T.eq(b3.querySelector(".w-title").textContent, "Без номера");
  } finally { s.remove(); }
});

T.test("віджет: програвач малює смужку першою, з налаштуваннями всередині", () => {
  const s = page(`<h2 data-sec="1.1">Коробка</h2><div class="widget" id="kt-p" tabindex="0"></div>`);
  try {
    const root = s.querySelector("#kt-p");
    CollKit.createPlayer(root, {
      config:`<label>n <input type="number" data-cfg value="2"></label>`,
      build: () => ({ code:["a = 1"], frames:[{ line:0, vars:[], out:[], note:"старт" }] })
    });
    T.eq(root.firstElementChild.className, "w-head");
    T.eq(root.querySelector(".w-head .w-sec").textContent, "1.1");
    T.eq(root.querySelector(".w-head .w-title").textContent, "Коробка");
    T.ok(root.querySelector(".w-head .w-config [data-cfg]"), "налаштування поза смужкою");
  } finally { s.remove(); }
});

T.test("віджет: шкала заповнена до кроку, засічки пройдених зафарбовані, «крок N / M»", () => {
  const s = page(`<h2 data-sec="1.1">Коробка</h2><div class="widget" id="kt-s" tabindex="0"></div>`);
  try {
    const root = s.querySelector("#kt-s");
    CollKit.createPlayer(root, { build: () => ({
      code: ["a = 1", "print(a)"],
      frames: [
        { line:0, vars:[], out:[], note:"старт" },
        { line:0, vars:[{ name:"a", val:"1", cls:"i" }], out:[], note:"a = 1" },
        { line:1, vars:[{ name:"a", val:"1" }], out:["1"], note:"друк" }
      ]}) });
    const scrub = root.querySelector("[data-scrub]");
    T.eq(scrub.style.getPropertyValue("--p"), "0%");
    root.querySelector("[data-step]").click();       /* ручна дія — автостарт уже не заведеться */
    T.eq(scrub.style.getPropertyValue("--p"), "50%");
    T.eq(root.querySelectorAll(".ticks i.p").length, 2);
    T.eq(root.querySelector("[data-counter]").textContent, "крок 2 / 3");
    T.eq(root.querySelector("[data-counter] b").textContent, "2");
  } finally { s.remove(); }
});

/* ================= тема «Файли»: підсвітка, блокнот, CSV-таблиця ================= */
function dom(html){ const d = document.createElement("div"); d.innerHTML = html; return d; }

T.test("підсвітка: makeHl додає свої ключові слова й функції", () => {
  const hl = CollKit.makeHl(/\b(with|as)\b/g, /\b(open)\b/g);
  const s = hl('with open("a.txt") as f:');
  T.ok(s.includes('<span class="kw">with</span>'), s);
  T.ok(s.includes('<span class="kw">as</span>'), s);
  T.ok(s.includes('<span class="fn">open</span>'), s);
  T.ok(s.includes('<span class="str">"a.txt"</span>'), s);
  T.ok(CollKit.hl("for x in y").includes('<span class="kw">for</span>'), "звичайна hl зламалась");
});
})();
