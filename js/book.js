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

/* ============================ стежка на головній ============================ */
/* Станція — середина того краю картки, що дивиться в прохід між колонками:
   у лівої (парний індекс) — правий край, у правої — лівий. */
function trailPoints(rects){
  return rects.map((r, k)=>({ x: k % 2 ? r.left : r.right, y: r.top + r.height / 2 }));
}
const r1 = (v) => Math.round(v * 10) / 10;
/* Кубічна крива між сусідніми станціями: обидві контрольні точки посередині
   проходу — лінія виходить і входить горизонтально. pick(i) відбирає ділянку
   i → i+1 (для акцентної стежки до пройдених станцій). */
function trailPath(pts, pick){
  let d = "";
  for(let i = 0; i + 1 < pts.length; i++){
    if(pick && !pick(i)) continue;
    const a = pts[i], b = pts[i + 1], mx = r1((a.x + b.x) / 2);
    d += `M${r1(a.x)} ${r1(a.y)}C${mx} ${r1(a.y)} ${mx} ${r1(b.y)} ${r1(b.x)} ${r1(b.y)}`;
  }
  return d;
}

return { esc, visited:{ list, add }, isDone, trailPoints, trailPath };
})();
