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
})();
