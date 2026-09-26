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

/* ============================ номери розділів і обкладинка ============================ */
/* «03» → «3», «5.1» → «5.1»: номер теми в плашці «3.2» без провідного нуля */
const secBase = (num) => String(num).replace(/^0+(?=\d)/, "");

function plural(n, forms){
  const a = n % 10, b = n % 100;
  if(a === 1 && b !== 11) return forms[0];
  if(a >= 2 && a <= 4 && (b < 12 || b > 14)) return forms[1];
  return forms[2];
}
const SECTIONS = ["розділ", "розділи", "розділів"];

/* Номер пишеться в сам заголовок: h2[data-sec="3.2"]. Його малює CSS
   (::before) і читає смужка віджета (CollKit.titleBar). Віддає кількість h2. */
function numberHeads(page, num){
  const base = secBase(num);
  const heads = page.querySelectorAll("h2");
  heads.forEach((h, k)=>{ h.dataset.sec = base + "." + (k + 1); });
  return heads.length;
}

/* Підпис над заголовком обкладинки. Самостійні роботи — без підпису:
   їхня шапка з'являється пізніше й номер «9» там — клас, а не тема. */
function coverCaption(route, count){
  if(/^check/.test(route.slug)) return "";
  const tail = " · " + count + " " + plural(count, SECTIONS);
  if(route.practice) return "практика" + tail;
  if(/^\d/.test(route.num)) return "тема " + route.num + tail;
  return "";
}

/* ============================ виноски ============================ */
/* Заголовок виноски — <b>, з якого починається перший абзац («Обережно:»).
   Не в кожної виноски він є, а жирне слово посеред тексту заголовком не
   стає — тому позначаємо класом, а не селектором b:first-child. */
function markCallouts(root){
  let n = 0;
  root.querySelectorAll(".callout").forEach(c=>{
    const p = c.firstElementChild;
    if(!p || p.tagName !== "P") return;
    let first = p.firstChild;
    while(first && first.nodeType === 3 && !first.data.trim()) first = first.nextSibling;
    if(first && first.nodeType === 1 && first.tagName === "B"){ first.classList.add("co-h"); n++; }
  });
  return n;
}

/* ============================ «Перевір себе» ============================ */
/* Сусідні .task збираються в сітку .tasks; «1.» на початку умови стає
   кружком .task-n; вміст .answer загортається в .answer-in, щоб відповідь
   розгорталась твіном grid-template-rows. Повторний виклик нічого не ламає. */
function numberTask(task){
  const p = task.querySelector(":scope > p");
  if(!p || p.querySelector(".task-n")) return;
  const t = p.firstChild;
  if(!t || t.nodeType !== 3) return;
  /* пробіл після крапки обов'язковий: «3.14 — …» — це не номер */
  const m = /^\s*(\d+)\.\s+/.exec(t.data);
  if(!m) return;
  t.data = t.data.slice(m[0].length);
  const n = document.createElement("span");
  n.className = "task-n";
  n.textContent = m[1];
  p.insertBefore(n, t);
}
function wrapAnswer(box){
  const f = box.firstElementChild;
  if(f && f.classList.contains("answer-in")) return;
  const inner = document.createElement("div");
  inner.className = "answer-in";
  inner.append(...box.childNodes);
  box.appendChild(inner);
}
function wrapTasks(root){
  let groups = 0;
  root.querySelectorAll(".task").forEach(task=>{
    if(task.parentElement.classList.contains("tasks")) return;
    const box = document.createElement("div");
    box.className = "tasks";
    task.before(box);
    for(let el = task; el && el.classList.contains("task"); ){
      const next = el.nextElementSibling;
      box.appendChild(el);
      el = next;
    }
    groups++;
  });
  root.querySelectorAll(".task").forEach(numberTask);
  root.querySelectorAll(".answer").forEach(wrapAnswer);
  root.querySelectorAll(".task [data-answer]").forEach(btn=>{
    if(!btn.hasAttribute("aria-controls")) btn.setAttribute("aria-controls", btn.dataset.answer);
    if(!btn.hasAttribute("aria-expanded")) btn.setAttribute("aria-expanded", "false");
  });
  return groups;
}

/* ============================ шпаргалки ============================ */
/* table.cheat без змін у розмітці: картка з шапкою навколо. Рамка, радіус
   і прокрутка на вузькому екрані — на картці, а не на таблиці. */
function wrapCheats(root){
  let n = 0;
  root.querySelectorAll("table.cheat").forEach(t=>{
    if(t.parentElement.classList.contains("cheat-card")) return;
    const card = document.createElement("div");
    card.className = "cheat-card";
    card.innerHTML = `<div class="cheat-head"><b>Шпаргалка</b><span>код · що робить</span></div>`;
    t.before(card);
    card.appendChild(t);
    n++;
  });
  return n;
}

/* ============================ пагінація ============================ */
function kindLabel(route){
  if(route.practice) return "практика";
  if(route.slug === "tests") return "самостійні роботи";
  if(/^check/.test(route.slug)) return "самостійна робота";
  return "тема " + route.num;
}
/* prev / next: {href, lbl, ttl, num?, topic?}; dots — [{cls}] по FLAT або null.
   «Далі» фарбується кольором наступної теми — інлайновим --tc. */
function pagerHtml(o){
  const p = o.prev, n = o.next;
  const tc = n.topic ? ` style="--tc:var(--tc-${esc(n.topic)})"` : "";
  return `<a class="prev" href="${esc(p.href)}"><span class="lbl">${esc(p.lbl)}</span>` +
      `<span class="ttl">${esc(p.ttl)}</span></a>` +
    `<a class="next" href="${esc(n.href)}"${tc}><span class="lbl">${esc(n.lbl)}</span>` +
      `<span class="ttl">${esc(n.ttl)}</span>` +
      (n.num ? `<span class="wm" aria-hidden="true">${esc(n.num)}</span>` : "") +
      `<span class="go" aria-hidden="true">→</span></a>` +
    (o.dots ? `<div class="pager-dots" aria-hidden="true">` +
      o.dots.map(d=>`<i${d.cls ? ` class="${d.cls}"` : ""}></i>`).join("") + `</div>` : "");
}

return { esc, visited:{ list, add }, isDone, trailPoints, trailPath,
  secBase, plural, numberHeads, coverCaption, markCallouts, wrapTasks, wrapCheats,
  kindLabel, pagerHtml };
})();
