/* ==========================================================================
   Код у тексті: <code> у прозі й ліва колонка шпаргалок фарбуються тим самим
   PyEditor.highlight, що й редактор, — одна палітра --syn-* на весь сайт.
   Віджети, <pre>, редактори й самостійні роботи мають власну підсвітку або
   малюються пізніше — їх не чіпаємо. Фрагменти з вкладеною розміткою
   (<code><b>…</b></code>) теж: там автор уже щось виділив сам.
   Якщо модуль не спрацював, лишається пластинка без кольорів.
   ========================================================================== */
"use strict";
window.InlineCode = (function(){

const SKIP = ".widget, pre, .pyed, .pytask, [data-check-root]";

/* клас syn — і позначка «вже розфарбовано», і гачок для кольорів у CSS */
function paintEl(el){
  if(el.children.length || el.classList.contains("syn")) return false;
  el.innerHTML = window.PyEditor.highlight(el.textContent);
  el.classList.add("syn");
  return true;
}

/* Віддає, скільки фрагментів розфарбовано за цей прохід. */
function paint(root){
  if(!window.PyEditor) return 0;
  let n = 0;
  root.querySelectorAll("code").forEach(el=>{
    if(!el.closest(SKIP) && paintEl(el)) n++;
  });
  root.querySelectorAll("table.cheat td:first-child").forEach(td=>{
    if(paintEl(td)) n++;
  });
  return n;
}

document.querySelectorAll("section.page").forEach(paint);

return { paint };
})();
