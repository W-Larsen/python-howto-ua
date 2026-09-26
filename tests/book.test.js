"use strict";
(function(){
/* js/book.js: «пройдено», номери розділів, прикраси розмітки, стежка, пагінація */
function page(html){
  const s = document.createElement("section");
  s.className = "page";
  s.innerHTML = html;
  document.getElementById("sandbox").appendChild(s);
  return s;
}
/* тести пишуть у справжнє сховище — чуже значення зберігаємо й повертаємо */
function withStore(key, fn){
  let saved = null;
  try { saved = localStorage.getItem(key); } catch(e){}
  try { localStorage.removeItem(key); return fn(); }
  finally {
    try { saved === null ? localStorage.removeItem(key) : localStorage.setItem(key, saved); } catch(e){}
  }
}

T.test("book: відкриті теми пишуться в pgsb.visited без повторів", () => withStore("pgsb.visited", () => {
  T.eq(Book.visited.list(), []);
  T.eq(Book.visited.add("vars"), ["vars"]);
  T.eq(Book.visited.add("vars"), ["vars"]);
  Book.visited.add("list");
  T.eq(JSON.parse(localStorage.getItem("pgsb.visited")), ["vars", "list"]);
}));

T.test("book: «Колекції» пройдено, якщо відкрито будь-яку з coll/list/dict/set", () => {
  T.eq(Book.isDone("coll", ["dict"]), true);
  T.eq(Book.isDone("coll", ["vars"]), false);
  T.eq(Book.isDone("vars", ["vars"]), true);
  T.eq(Book.isDone("cond", ["vars"]), false);
});

T.test("book: зіпсоване сховище читається як порожній список", () => withStore("pgsb.visited", () => {
  localStorage.setItem("pgsb.visited", "{");
  T.eq(Book.visited.list(), []);
  localStorage.setItem("pgsb.visited", '{"a":1}');
  T.eq(Book.visited.list(), []);
}));

T.test("book: без сховища позначок нема, але й помилок теж", () => {
  const P = Storage.prototype, get = P.getItem, set = P.setItem;
  P.getItem = P.setItem = () => { throw new Error("blocked"); };
  try {
    T.eq(Book.visited.list(), []);
    T.eq(Book.visited.add("vars"), ["vars"]);
    T.eq(Book.isDone("vars"), false);
  } finally { P.getItem = get; P.setItem = set; }
});

T.test("book: станція стежки — на краю картки, що дивиться в прохід", () => {
  const rects = [
    { left:0,   right:100, top:0,   height:200 },
    { left:170, right:270, top:100, height:200 },
    { left:0,   right:100, top:220, height:100 }
  ];
  T.eq(Book.trailPoints(rects), [{ x:100, y:100 }, { x:170, y:200 }, { x:100, y:270 }]);
});

T.test("book: стежка — кубічні криві між станціями; pick відбирає ділянки", () => {
  const pts = [{ x:100, y:100 }, { x:170, y:200 }, { x:100, y:270 }];
  T.eq(Book.trailPath(pts.slice(0, 2)), "M100 100C135 100 135 200 170 200");
  T.eq(Book.trailPath(pts, i => i === 1), "M170 200C135 200 135 270 100 270");
  T.eq(Book.trailPath(pts, () => false), "");
  T.eq(Book.trailPath([]), "");
});

T.test("book: номер теми для плашок — без провідного нуля", () => {
  T.eq(Book.secBase("03"), "3");
  T.eq(Book.secBase("01"), "1");
  T.eq(Book.secBase("5.1"), "5.1");
  T.eq(Book.secBase("10"), "10");
});

T.test("book: розділ / розділи / розділів", () => {
  const f = ["розділ", "розділи", "розділів"];
  T.eq([1, 2, 4, 5, 11, 12, 14, 21, 22, 25].map(n => Book.plural(n, f)),
       ["розділ", "розділи", "розділи", "розділів", "розділів", "розділів", "розділів",
        "розділ", "розділи", "розділів"]);
});

T.test("book: h2 теми нумеруються в data-sec, текст не змінюється", () => {
  const s = page(`<h2>Перший</h2><p>x</p><h2>Другий <span class="badge">advanced</span></h2>`);
  try {
    T.eq(Book.numberHeads(s, "03"), 2);
    T.eq([...s.querySelectorAll("h2")].map(h => h.dataset.sec), ["3.1", "3.2"]);
    T.eq(s.querySelector("h2").textContent, "Перший");
    Book.numberHeads(s, "5.1");
    T.eq(s.querySelector("h2").dataset.sec, "5.1.1");
  } finally { s.remove(); }
});

T.test("book: підпис обкладинки — тема, практика; для робіт — нічого", () => {
  T.eq(Book.coverCaption({ slug:"loops", num:"03" }, 6), "тема 03 · 6 розділів");
  T.eq(Book.coverCaption({ slug:"list", num:"5.1" }, 1), "тема 5.1 · 1 розділ");
  T.eq(Book.coverCaption({ slug:"shop", num:"✎", practice:true }, 4), "практика · 4 розділи");
  T.eq(Book.coverCaption({ slug:"tests", num:"✓" }, 0), "");
  T.eq(Book.coverCaption({ slug:"check-9", num:"9" }, 3), "");
});

T.test("book: заголовок виноски — лише <b> на самому початку першого абзацу", () => {
  const s = page(
    `<div class="callout warn"><p><b>Обережно:</b> текст</p></div>` +
    `<div class="callout"><p>Текст з <b>жирним</b> словом</p></div>` +
    `<div class="callout"><p>
       <b>Після пробілу.</b> текст</p></div>`);
  try {
    T.eq(Book.markCallouts(s), 2);
    T.eq([...s.querySelectorAll("b")].map(b => b.classList.contains("co-h")), [true, false, true]);
    T.eq(Book.markCallouts(s), 2);                          /* повторно — те саме */
  } finally { s.remove(); }
});

T.test("book: сусідні задачі — у сітці .tasks; «1.» стає кружком; відповідь загорнута", () => {
  const s = page(
    `<h2>Перевір себе</h2>` +
    `<div class="task"><p>1. Що <code>x</code>?</p><button data-answer="bt-a1">?</button>` +
    `<div class="answer" id="bt-a1"><p>8.</p></div></div>` +
    `<div class="task"><p>2. А тут?</p></div>` +
    `<p>між групами</p>` +
    `<div class="task"><p>Без номера</p></div>` +
    `<div class="task"><p>3.14 — не номер</p></div>`);
  try {
    T.eq(Book.wrapTasks(s), 2);
    const groups = s.querySelectorAll(".tasks");
    T.eq([...groups].map(g => g.children.length), [2, 2]);
    const p1 = groups[0].querySelector(".task > p");
    T.eq(p1.querySelector(".task-n").textContent, "1");
    T.eq(p1.textContent, "1Що x?");
    T.eq(groups[1].querySelectorAll(".task-n").length, 0);
    const ans = s.querySelector("#bt-a1");
    T.eq(ans.children.length, 1);
    T.eq(ans.firstElementChild.className, "answer-in");
    T.eq(ans.firstElementChild.innerHTML, "<p>8.</p>");
    const btn = s.querySelector('[data-answer="bt-a1"]');
    T.eq(btn.getAttribute("aria-controls"), "bt-a1");
    T.eq(btn.getAttribute("aria-expanded"), "false");
    T.eq(Book.wrapTasks(s), 0);                             /* повторно — нічого нового */
    T.eq(s.querySelectorAll(".task-n").length, 2);
    T.eq(s.querySelectorAll(".answer-in").length, 1);
    T.eq(btn.getAttribute("aria-expanded"), "false");       /* повторно не чіпає вже виставлене */
  } finally { s.remove(); }
});

T.test("book: шпаргалка загортається в картку з шапкою, один раз", () => {
  const s = page(`<h2>Шпаргалка</h2><table class="cheat"><tr><td>a</td><td>b</td></tr></table>`);
  try {
    T.eq(Book.wrapCheats(s), 1);
    const card = s.querySelector(".cheat-card");
    T.eq(card.firstElementChild.className, "cheat-head");
    T.eq(card.querySelector(".cheat-head b").textContent, "Шпаргалка");
    T.eq(card.lastElementChild.tagName, "TABLE");
    T.eq(Book.wrapCheats(s), 0);
    T.eq(s.querySelectorAll(".cheat-card").length, 1);
  } finally { s.remove(); }
});

T.test("book: підпис «далі» — тема, практика, роботи", () => {
  T.eq(Book.kindLabel({ slug:"func", num:"04" }), "тема 04");
  T.eq(Book.kindLabel({ slug:"list", num:"5.1" }), "тема 5.1");
  T.eq(Book.kindLabel({ slug:"shop", num:"✎", practice:true }), "практика");
  T.eq(Book.kindLabel({ slug:"tests", num:"✓" }), "самостійні роботи");
  T.eq(Book.kindLabel({ slug:"check-9", num:"9" }), "самостійна робота");
});

T.test("book: пагінація — тихе «назад», картка «далі», крапки прогресу", () => {
  const d = document.createElement("div");
  d.innerHTML = Book.pagerHtml({
    prev:{ href:"#/cond", lbl:"← назад", ttl:"Умови" },
    next:{ href:"#/func", lbl:"далі · тема 04", ttl:"Функції <def>", num:"04", topic:"func" },
    dots:[{ cls:"done" }, { cls:"cur" }, { cls:"" }]
  });
  T.eq(d.querySelector(".prev").getAttribute("href"), "#/cond");
  const next = d.querySelector(".next");
  T.eq(next.getAttribute("href"), "#/func");
  T.ok(/--tc:var\(--tc-func\)/.test(next.getAttribute("style")), next.getAttribute("style"));
  T.eq(next.querySelector(".ttl").textContent, "Функції <def>");
  T.eq(next.querySelector(".wm").textContent, "04");
  T.ok(next.querySelector(".go"), "нема кнопки-стрілки");
  T.eq([...d.querySelectorAll(".pager-dots i")].map(i => i.className), ["done", "cur", ""]);

  d.innerHTML = Book.pagerHtml({
    prev:{ href:"#/tests", lbl:"← назад", ttl:"Самостійні роботи" },
    next:{ href:"#/", lbl:"на початок", ttl:"Усі теми", num:"", topic:"" },
    dots:null
  });
  T.eq(d.querySelector(".pager-dots"), null);
  T.eq(d.querySelector(".wm"), null);
  T.eq(d.querySelector(".next").hasAttribute("style"), false);
});
})();
