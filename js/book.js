/* ==========================================================================
   Книжкові прикраси: чисті помічники оболонки й одноразові перетворення
   розмітки сторінок (номери розділів, «Перевір себе», шпаргалки…), а ще
   позначка «пройдено». Без залежностей і без побічних дій на старті —
   викликає js/app.js, тестує tests/book.test.js.
   ========================================================================== */
"use strict";
window.Book = (function(){

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
  .replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ============================ «пройдено» ============================ */
/* Список відкритих тем у localStorage. Без доступу до сховища (приватне
   вікно, заблоковані дані сайту) позначок просто нема — решта працює. */
const VKEY = "pgsb.visited";
/* «Колекції» пройдено, якщо відкрито будь-яку з їхніх сторінок */
const COLL = ["coll", "list", "dict", "set"];

function list(){
  try {
    const a = JSON.parse(localStorage.getItem(VKEY) || "[]");
    return Array.isArray(a) ? a.filter(s => typeof s === "string") : [];
  } catch(e){ return []; }
}
function add(slug){
  const a = list();
  if(a.includes(slug)) return a;
  a.push(slug);
  try { localStorage.setItem(VKEY, JSON.stringify(a)); } catch(e){}
  return a;
}
function isDone(slug, seen){
  const a = seen || list();
  return slug === "coll" ? COLL.some(s => a.includes(s)) : a.includes(slug);
}

return { esc, visited:{ list, add }, isDone };
})();
