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

T.test("блокнот: ↵ на кожен \\n, номери рядків, без каретки", () => {
  const d = dom(CollKit.notepad({name:"names.txt", mode:"r", text:"Оля\nІван\n", pos:null}));
  T.eq(d.querySelectorAll(".np-nl").length, 2);
  T.eq([...d.querySelectorAll(".np-no")].map(n=>n.textContent), ["1", "2"]);
  T.eq(d.querySelector(".np-caret"), null);
  T.eq(d.querySelector(".np-tx").textContent, "Оля↵");
});

T.test("блокнот: каретка стоїть перед символом pos", () => {
  const d = dom(CollKit.notepad({name:"a.txt", mode:"r", text:"ab\ncd\n", pos:3}));
  T.eq(d.querySelectorAll(".np-caret").length, 1);
  T.eq(d.querySelectorAll(".np-tx")[1].firstElementChild.className, "np-caret");
});

T.test("блокнот: каретка в кінці файлу з \\n — на новому порожньому рядку", () => {
  const d = dom(CollKit.notepad({name:"a.txt", mode:"a", text:"ab\n", pos:3}));
  const tx = d.querySelectorAll(".np-tx");
  T.eq(tx.length, 2);
  T.eq(tx[1].children.length, 1);
  T.eq(tx[1].firstElementChild.className, "np-caret");
  T.eq(dom(CollKit.notepad({name:"a.txt", mode:"r", text:"ab\n", pos:null})).querySelectorAll(".np-tx").length, 1);
});

T.test("блокнот: каретка в кінці файлу без \\n — у тому ж рядку", () => {
  const tx = dom(CollKit.notepad({name:"a.txt", mode:"a", text:"ab", pos:2})).querySelectorAll(".np-tx");
  T.eq(tx.length, 1);
  T.eq(tx[0].lastElementChild.className, "np-caret");
});

T.test("блокнот: підсвітка шматків тексту за marks", () => {
  const d = dom(CollKit.notepad({name:"a.txt", mode:"r", text:"ab\ncd\n", pos:3,
    marks:[{from:0, to:3, cls:"read"}, {from:3, to:5, cls:"new"}]}));
  T.eq(d.querySelectorAll(".np-read").length, 1);
  T.eq(d.querySelector(".np-read").textContent, "ab↵");
  T.eq(d.querySelector(".np-new").textContent, "cd");
});

T.test("блокнот: екранує текст і ім'я файлу", () => {
  const d = dom(CollKit.notepad({name:"<i>.txt", mode:null, text:"<b>x</b>", pos:null}));
  T.eq(d.querySelector("b"), null);
  T.eq(d.querySelector("i"), null);
  T.eq(d.querySelector(".np-tx").textContent, "<b>x</b>");
  T.eq(d.querySelector(".np-name").textContent, "<i>.txt");
});

T.test("блокнот: стан у шапці — закрито / відкрито / немає", () => {
  T.eq(dom(CollKit.notepad({name:"a", mode:null, text:"x"})).querySelector(".np-state").textContent, "закрито");
  T.eq(dom(CollKit.notepad({name:"a", mode:"a", text:"x"})).querySelector(".np-state").textContent, "відкрито: a");
  const m = dom(CollKit.notepad({name:"a", missing:true}));
  T.eq(m.querySelector(".np-state").textContent, "немає");
  T.eq(m.querySelector(".np-missing").textContent, "такого файлу немає");
  T.eq(m.querySelector(".np-ln"), null);
});

T.test("блокнот: порожній файл", () => {
  const d = dom(CollKit.notepad({name:"a", mode:"w", text:"", pos:0}));
  T.eq(d.querySelector(".np-empty").textContent, "файл порожній");
  T.ok(d.querySelector(".np-caret"), "у порожньому файлі каретка на початку");
});

T.test("CSV-таблиця: шапка, рядки, підсвітка й екранування", () => {
  const d = dom(CollKit.csvTable(["name", "grade"], [["Оля", "11"], ["<b>", "9"]], 1));
  T.eq([...d.querySelectorAll("th")].map(t=>t.textContent), ["name", "grade"]);
  T.eq(d.querySelectorAll("tbody tr").length, 2);
  T.eq(d.querySelectorAll("tbody td").length, 4);
  T.eq(d.querySelectorAll("tr.now").length, 1);
  T.eq(d.querySelector("tr.now td").textContent, "<b>");
  T.eq(d.querySelector("tbody b"), null);
  T.eq(dom(CollKit.csvTable(["a"], [])).querySelectorAll("tbody tr").length, 0);
});
})();
