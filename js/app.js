"use strict";
(function(){

/* ============================ маршрути ============================ */
const ROUTES = [
  { slug:"vars",  id:"page-vars",  num:"01",
    nav:"Змінні, print і input", title:"Змінні, print і input — Python крок за кроком" },
  { slug:"cond",  id:"page-cond",  num:"02",
    nav:"Умови: if, elif, else", title:"Умови в Python — if, elif, else" },
  { slug:"loops", id:"page-loops", num:"03",
    nav:"Цикли: for і while",    title:"Цикли в Python — покроково" },
  { slug:"func",  id:"page-func",  num:"04",
    nav:"Функції",               title:"Функції в Python — def, return, стек викликів" },
  { slug:"coll",  id:"page-coll",  num:"05",
    nav:"Колекції",              title:"Колекції в Python — списки, словники, множини",
    kids:[
      { slug:"list", id:"page-list", num:"5.1",
        nav:"Списки",   title:"Списки в Python — індекси, зрізи, sorted, map, filter" },
      { slug:"shop", id:"page-shop", num:"✎", practice:true,
        nav:"Практика: магазин", title:"Практика: оживи магазин — функції для списків" },
      { slug:"dict", id:"page-dict", num:"5.2",
        nav:"Словники", title:"Словники в Python — ключ, значення і вбудовані функції" },
      { slug:"set",  id:"page-set",  num:"5.3",
        nav:"Множини",  title:"Множини в Python — набір без повторів" }
    ]},
  { slug:"files", id:"page-files", num:"06",
    nav:"Файли",                 title:"Файли в Python — open, with, читання, запис і CSV" },
  /* проєкт для 9 класу: код для глобуса, симулятор дисплея, збереження для
     вчителя. Сторінка вчителя — лише за прямим посиланням (hidden). */
  { slug:"globe", id:"page-globe", num:"🌍", practice:true, toc:false,
    nav:"Touch The Globe · 9 клас", title:"Touch The Globe — код для глобуса, 9 клас",
    kids:[
      { slug:"globe-teacher", id:"page-globe-teacher", num:"🌍", hidden:true, cls:"globe", toc:false,
        nav:"Touch The Globe: вчитель", title:"Touch The Globe — сторінка вчителя" }
    ]},
  /* toc:false — без змісту-якорів під пунктом меню: сторінки й так лише картки.
     Самостійні: розділ → клас (grade) → робота. Роботи в меню не показуємо
     (hidden), а поки робота відкрита, підсвічуємо її клас (cls). */
  { slug:"tests", id:"page-tests", num:"✓", toc:false,
    nav:"Самостійні роботи", title:"Самостійні роботи — Python крок за кроком",
    kids:[
      { slug:"tests-eng", id:"page-tests-eng", num:"ІШ", grade:true, toc:false,
        nav:"Старша інженерна школа", title:"Самостійні роботи — Старша інженерна школа" },
      { slug:"tests-9", id:"page-tests-9", num:"9", grade:true, toc:false,
        nav:"9 клас", title:"Самостійні роботи — 9 клас" },
      { slug:"check", id:"page-check", num:"ІШ", hidden:true, cls:"tests-eng",
        nav:"Інженерна школа: Самостійна робота 1", title:"Самостійна робота 1 з Python — Старша інженерна школа" },
      { slug:"check-9", id:"page-check-9", num:"9", hidden:true, cls:"tests-9",
        nav:"9 клас: Самостійна робота 1", title:"Самостійна робота 1 з Python — 9 клас" },
      /* розширений варіант — лише за прямим посиланням від учителя */
      { slug:"check-9plus", id:"page-check-9plus", num:"9+", hidden:true, cls:"tests-9",
        nav:"9 клас: Самостійна робота 1, розширений варіант", title:"Самостійна робота 1 з Python — 9 клас, розширений варіант" }
    ]}
];
/* усі маршрути — для пошуку за slug; hidden-маршрути існують, але їх немає
   в меню й у крапках прогресу (FLAT) */
const ALL  = ROUTES.reduce((a, r) => a.concat([r], r.kids || []), []);
const FLAT = ALL.filter(r => !r.hidden);
/* теми, які учень «проходить»: для них — номери розділів і позначка «пройдено» */
const TOPIC_SLUGS = ["vars","cond","loops","func","coll","list","dict","set","files"];
/* корінь маршруту: підтема належить своєму розділу (list → coll, check-9 → tests) */
const topicOf = (route) =>
  (ROUTES.find(r => r === route || (r.kids || []).includes(route)) || route).slug;
/* старі посилання не мають ламатись */
const ALIAS = { dicts:"coll", sets:"set", lists:"list" };
const HOME_TITLE = "Python крок за кроком";
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.PageInit = {};           /* сюди реєструються скрипти окремих тем */
const started = {};             /* які теми вже ініціалізовані */

/* ============================ зупинка анімацій ============================ */
/* Сторінки не видаляються з DOM, а лише ховаються, тому їхні таймери треба
   гасити вручну. Інакше анімація крутиться на схованій сторінці, а таймери
   різних тем накладаються один на одний. */
const anims = [];               /* {el, stop, start} кожної анімованої вставки */
window.registerAnim = (a) => { anims.push(a); };

function stopPageAnims(){
  anims.forEach(a=>{ try{ a.stop(); }catch(err){ console.error("не зупинилась анімація", err); } });
  if(window.CollKit && window.CollKit.stopAllPlayers) window.CollKit.stopAllPlayers();
}
/* заводимо лише те, що лежить на щойно показаній сторінці */
function startPageAnims(){
  if(reduced) return;
  anims.forEach(a=>{
    if(!a.start || !a.el || !a.el.isConnected) return;
    if(a.el.closest(".page[hidden]")) return;
    try{ a.start(); }catch(err){ console.error("не запустилась анімація", err); }
  });
}

const $  = (s,r) => (r||document).querySelector(s);
const $$ = (s,r) => [...(r||document).querySelectorAll(s)];

const sidebar = $("#sidebar"), scrim = $("#scrim"), burger = $("#burger"),
      navList = $("#navList"), progBar = $("#progBar"), topbarTitle = $("#topbarTitle");

/* ============================ бічне меню ============================ */
/* Кожна тема — група: пункт, зміст і під-сторінки. Група поточної теми
   піднімається карткою; колір кружка — колір теми (--tc інлайном). */
/* розділ, у якого всі підсторінки приховані (globe), у меню — звичайний пункт */
const shownKids = (r) => (r.kids || []).filter(c => !c.hidden);
navList.innerHTML = ROUTES.map(r => `
  <div class="nav-group" data-group="${r.slug}" style="--tc:var(--tc-${r.slug})">
  <a class="nav-item${shownKids(r).length ? " has-kids" : ""}" href="#/${r.slug}" data-slug="${r.slug}">
    <span class="num">${r.num}</span><span class="t">${r.nav}</span>
  </a>` +
  (r.toc === false ? "" : `<ul class="toc" data-toc="${r.slug}"></ul>`) +
  (shownKids(r).length ? `<div class="subnav" data-sub="${r.slug}">` + r.kids.filter(c => !c.hidden).map(c => `
    <a class="nav-sub${c.practice ? " practice" : ""}" href="#/${c.slug}" data-slug="${c.slug}">
      <span class="num">${c.num}</span><span class="t">${c.nav}</span>
    </a>` +
    (c.toc === false ? "" : `<ul class="toc" data-toc="${c.slug}"></ul>`)).join("") + `</div>` : "") +
  `</div>`
).join("");

function closeMenu(){
  sidebar.classList.remove("open");
  scrim.classList.remove("on");
  burger.setAttribute("aria-expanded","false");
}
burger.addEventListener("click", ()=>{
  const open = sidebar.classList.toggle("open");
  scrim.classList.toggle("on", open);
  burger.setAttribute("aria-expanded", open ? "true" : "false");
});
scrim.addEventListener("click", closeMenu);
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeMenu(); });

/* ============================ книжкові прикраси сторінок ============================ */
/* Один прохід під час завантаження — раніше, ніж скрипти тем збудують віджети
   (їхні PageInit запускаються лише з render()): смужка віджета читає номер
   розділу з h2[data-sec]. Шапку самостійних робіт рушій малює пізніше —
   їхня обкладинка виходить самим CSS, без підпису. */
if(window.Book){
  ALL.forEach(route=>{
    const page = document.getElementById(route.id);
    if(!page) return;
    const count = TOPIC_SLUGS.includes(route.slug)
      ? Book.numberHeads(page, route.num)
      : $$("h2", page).length;
    const h1 = $("header.top > h1", page);
    if(h1){
      const cap = Book.coverCaption(route, count);
      if(cap) h1.dataset.cap = cap;
      if(route.num) h1.dataset.num = route.num;
    }
    Book.markCallouts(page);
    Book.wrapTasks(page);
    Book.wrapCheats(page);
  });
}

/* ============================ зміст теми ============================ */
function buildToc(route){
  const page = document.getElementById(route.id);
  const list = $(`[data-toc="${route.slug}"]`);
  if(!list) return;             /* hidden-маршрут або toc:false — змісту в меню немає */
  const heads = $$("h2", page);
  heads.forEach((h,k)=>{ if(!h.id) h.id = route.slug + "-s" + k; });
  list.innerHTML = heads.map(h=>{
    const c = h.cloneNode(true);
    c.querySelectorAll(".badge").forEach(b=>b.remove());   /* бейдж «advanced» у зміст не тягнемо */
    return `<li><a href="#${h.id}" data-anchor="${h.id}">${c.textContent.trim()}</a></li>`;
  }).join("");
  list.addEventListener("click", e=>{
    const a = e.target.closest("[data-anchor]");
    if(!a) return;
    e.preventDefault();
    const el = document.getElementById(a.dataset.anchor);
    if(!el) return;
    closeMenu();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 22,
                      behavior: reduced ? "auto" : "smooth" });
  });
}

/* ============================ навігація «далі / назад» ============================ */
/* Перебудовується на кожному показі сторінки: крапки прогресу залежать від
   того, що вже пройдено. Самостійні роботи — окремий розділ: там пагінації
   по темах немає, лише бічне меню. */
function buildPager(route){
  if(!window.Book) return;      /* без Book нема ні pagerHtml, ні kindLabel — краще без пагінації, ніж крах */
  if(topicOf(route) === "tests" || route.hidden) return;
  const wrap = $(".wrap", document.getElementById(route.id));
  if(!wrap) return;
  const old = $(":scope > .pager", wrap);
  if(old) old.remove();
  const link = (r, lbl) => ({ href:"#/" + r.slug, lbl, ttl:r.nav, num:r.num, topic:topicOf(r) });
  const home = (lbl) => ({ href:"#/", lbl, ttl:"Усі теми", num:"", topic:"" });
  const i = FLAT.indexOf(route);
  const prev = FLAT[i-1] ? link(FLAT[i-1], "← назад") : home("← на початок");
  const next = FLAT[i+1] ? link(FLAT[i+1], "далі · " + Book.kindLabel(FLAT[i+1])) : home("це остання тема");
  const list = Book.visited.list();
  const dots = FLAT.map(r=>({ cls: r === route ? "cur" : Book.isDone(r.slug, list) ? "done" : "" }));
  const box = document.createElement("div");
  box.className = "pager";
  box.innerHTML = Book.pagerHtml({ prev, next, dots });
  wrap.appendChild(box);
}

/* ============================ роутер ============================ */
/* Після slug може йти хвіст (#/check/r/…) — його розбирає сама сторінка,
   роутеру важливий лише перший сегмент. */
function slugFromHash(){
  let h = location.hash.replace(/^#\/?/, "").trim().split("/")[0];
  if(ALIAS[h]) h = ALIAS[h];
  return ALL.some(r=>r.slug===h) ? h : null;
}

let activeRoute = null;

function render(){
  const slug = slugFromHash();
  const route = ALL.find(r=>r.slug===slug) || null;
  activeRoute = route;

  stopPageAnims();              /* спершу гасимо те, що анімувалось досі */

  $$(".page").forEach(p=>{ p.hidden = true; });
  document.getElementById(route ? route.id : "page-home").hidden = false;

  document.body.dataset.route = route ? "article" : "home";
  /* колір теми: --tc задає CSS за body[data-topic] */
  if(route) document.body.dataset.topic = topicOf(route);
  else delete document.body.dataset.topic;
  document.title = route ? route.title : HOME_TITLE;
  if(route) topbarTitle.textContent = route.nav;
  /* тему відкрили — вона пройдена */
  if(route && TOPIC_SLUGS.includes(route.slug)) window.Book && Book.visited.add(route.slug);

  $$(".nav-item, .nav-sub").forEach(a=>
    a.classList.toggle("active", !!route && (a.dataset.slug===route.slug || a.dataset.slug===route.cls)));
  $$(".toc").forEach(u=>u.classList.toggle("open", !!route && u.dataset.toc===route.slug));
  $$(".subnav").forEach(d=>{
    const parent = ROUTES.find(r=>r.slug===d.dataset.sub);
    const on = !!route && !!parent &&
      (route.slug===parent.slug || (parent.kids||[]).some(c=>c.slug===route.slug));
    d.classList.toggle("open", on);
    const head = $(`.nav-item[data-slug="${d.dataset.sub}"]`);
    if(head) head.classList.toggle("trail", on && route.slug!==parent.slug);
  });
  $$(".nav-group").forEach(g=>{
    const r = ROUTES.find(x=>x.slug===g.dataset.group);
    g.classList.toggle("current", !!route && (r===route || (r.kids||[]).includes(route)));
  });

  if(route && !started[route.slug]){
    started[route.slug] = true;
    buildToc(route);
    try { if(window.PageInit[route.slug]) window.PageInit[route.slug](); }
    catch(err){ console.error("Помилка теми " + route.slug, err); }
  }
  if(route) buildPager(route);
  paintVisited();

  closeMenu();
  window.scrollTo(0, 0);
  homeAnim(!route);
  startPageAnims();
  updateProgress();
}

window.addEventListener("hashchange", render);

/* ============================ прогрес читання + підсвітка змісту ============================ */
function updateProgress(){
  if(!activeRoute){ progBar.style.width = "0%"; return; }
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progBar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + "%";

  const links = $$(`[data-toc="${activeRoute.slug}"] a`);
  if(!links.length) return;
  let current = links[0];
  for(const a of links){
    const el = document.getElementById(a.dataset.anchor);
    if(el && el.getBoundingClientRect().top <= 130) current = a; else break;
  }
  links.forEach(a=>a.classList.toggle("on", a===current));
}
let ticking = false;
window.addEventListener("scroll", ()=>{
  if(ticking) return;
  ticking = true;
  requestAnimationFrame(()=>{ updateProgress(); ticking = false; });
}, {passive:true});

/* ============================ анімації на головній ============================ */
function cycler(steps){
  let i = 0, timer = null;
  function tick(){
    steps[i].run();
    const wait = steps[i].d;
    i = (i + 1) % steps.length;
    timer = setTimeout(tick, wait);
  }
  return {
    start(){ if(timer || reduced) return; tick(); },
    /* i скидаємо, щоб повернення на головну починало показ з початку,
       а не з середини перерваного циклу */
    stop(){ clearTimeout(timer); timer = null; i = 0; },
    once(){ steps.forEach(s=>s.run()); }
  };
}

function restart(el, cls){
  el.classList.remove(cls);
  void el.getBoundingClientRect();
  el.classList.add(cls);
}

/* --- 1. змінні --- */
function vizVars(svg){
  const line  = $("[data-line]", svg);
  const boxA  = $('[data-box="a"]', svg), boxB = $('[data-box="b"]', svg);
  const valA  = $('[data-val="a"]', svg), valB = $('[data-val="b"]', svg);
  const ghost = $('[data-ghost="a"]', svg);
  const flow  = $("[data-flow]", svg), token = $("[data-token]", svg);

  const setBox = (box, cls) => box.setAttribute("class", "vz-box" + (cls ? " " + cls : ""));
  const setVal = (el, text, empty) => {
    el.textContent = text;
    el.setAttribute("class", "vz-val" + (empty ? " none" : ""));
    if(!empty) restart(el, "pop");
  };

  return cycler([
    { d:800, run(){
        line.textContent = "a = 2";
        setBox(boxA,"empty"); setBox(boxB,"empty");
        setVal(valA,"порожньо",true); setVal(valB,"порожньо",true);
        flow.classList.remove("on"); token.classList.remove("go");
        ghost.classList.remove("go");
      }},
    { d:1000, run(){ setBox(boxA,"hot"); setVal(valA,"2"); }},
    { d:600,  run(){ line.textContent = "b = a"; }},
    { d:950,  run(){ flow.classList.add("on"); restart(token,"go"); }},
    { d:1100, run(){ setBox(boxB,"cool"); setVal(valB,"2");
                     flow.classList.remove("on"); token.classList.remove("go"); }},
    { d:600,  run(){ line.textContent = "a = 10"; setBox(boxA,"hot"); }},
    { d:1100, run(){ ghost.textContent = "2"; restart(ghost,"go"); setVal(valA,"10"); }},
    { d:1900, run(){ line.textContent = "print(b) → 2"; setBox(boxB,"cool"); restart(valB,"pop"); }}
  ]);
}

/* --- 2. умови --- */
function vizCond(svg){
  const chip = $("[data-val]", svg);
  const CASES = [
    {v:95, ok:true}, {v:42, ok:false}, {v:90, ok:true}, {v:71, ok:false}
  ];
  let n = 0, cur = CASES[0];

  return cycler([
    { d:900, run(){
        cur = CASES[n % CASES.length]; n++;
        svg.classList.remove("t","f","checking");
        chip.textContent = "score = " + cur.v;
      }},
    { d:1200, run(){ svg.classList.add("checking"); }},
    { d:1900, run(){ svg.classList.remove("checking"); svg.classList.add(cur.ok ? "t" : "f"); }}
  ]);
}

/* --- 3. цикли --- */
function vizLoop(svg){
  const N = 8, cells = $("[data-cells]", svg), mark = $("[data-mark]", svg),
        line = $("[data-line]", svg);
  const NS = "http://www.w3.org/2000/svg";
  for(let k = 0; k < N; k++){
    const x = 12 + k * 38;
    const r = document.createElementNS(NS, "rect");
    r.setAttribute("class","vz-cell"); r.setAttribute("x",x); r.setAttribute("y",56);
    r.setAttribute("width",30); r.setAttribute("height",30); r.setAttribute("rx",8);
    const t = document.createElementNS(NS, "text");
    t.setAttribute("class","vz-cn"); t.setAttribute("x",x+15); t.setAttribute("y",75);
    t.textContent = k;
    cells.append(r, t);
  }
  const rects = $$(".vz-cell", cells), nums = $$(".vz-cn", cells);
  const paint = (k) => rects.forEach((r,j)=>{
    const cls = j === k ? "now" : (k >= 0 && j < k ? "done" : "");
    r.setAttribute("class","vz-cell" + (cls ? " " + cls : ""));
    nums[j].setAttribute("class","vz-cn" + (cls ? " " + cls : ""));
  });

  /* Маркер має transition:transform, тому просте скидання на початок
     проганяло б його назад через увесь рядок. Знімаємо перехід, ставимо
     нуль, форсуємо reflow — і лише потім вертаємо перехід. */
  function resetMark(){
    mark.classList.remove("on");
    mark.style.transition = "none";
    mark.style.transform = "translateX(0px)";
    void mark.getBoundingClientRect();
    mark.style.transition = "";
  }

  const steps = [{ d:700, run(){
      paint(-1); resetMark();
      line.innerHTML = 'i = <tspan class="hi">?</tspan> → цикл ще не почався';
    }}];
  for(let k = 0; k < N; k++){
    steps.push({ d:430, run(){
      paint(k);
      mark.classList.add("on");
      mark.style.transform = "translateX(" + (k * 38) + "px)";
      line.innerHTML = 'i = <tspan class="hi">' + k + '</tspan> → print(i)';
    }});
  }
  steps.push({ d:1700, run(){
    paint(N); resetMark();
    line.innerHTML = 'цикл завершено — тіло виконалось <tspan class="hi">8</tspan> разів';
  }});
  return cycler(steps);
}

/* --- 4. словники --- */
function vizDict(svg){
  const line = $("[data-line]", svg);
  const rows = [0,1,2].map(k=>$('[data-row="' + k + '"]', svg));
  const DATA = [["Оля",16], ["Іван",15], ["Ніна",14]];
  const Q = ["Оля", "Ніна", "Петро", "Іван"];
  let n = 0, cur = Q[0];

  return cycler([
    { d:850, run(){
        cur = Q[n % Q.length]; n++;
        rows.forEach(r=>r.removeAttribute("class"));
        line.setAttribute("class","vz-code");
        line.textContent = 'ages["' + cur + '"]';
      }},
    { d:1600, run(){
        const i = DATA.findIndex(d=>d[0]===cur);
        if(i >= 0){
          rows.forEach((r,k)=>r.setAttribute("class", k===i ? "hit" : "dim"));
          line.textContent = 'ages["' + cur + '"] → ' + DATA[i][1];
        }else{
          rows.forEach(r=>r.setAttribute("class","dim"));
          line.setAttribute("class","vz-code err");
          line.textContent = 'ages["' + cur + '"] → KeyError';
        }
      }}
  ]);
}

/* --- 5. функції --- */
function vizFunc(svg){
  const line = $("[data-line]", svg), note = $("[data-note]", svg), box = $('[data-box="f"]', svg);
  const pA = $('[data-pill="a"]', svg), tA = $('[data-pt="a"]', svg);
  const pR = $('[data-pill="r"]', svg), tR = $('[data-pt="r"]', svg);
  const w1 = $('[data-w="1"]', svg), h1 = $('[data-h="1"]', svg);
  const w2 = $('[data-w="2"]', svg), h2 = $('[data-h="2"]', svg);
  const dIn = $('[data-dot="in"]', svg), dOut = $('[data-dot="out"]', svg);
  const VALS = [4, 7, 9, 12];
  let n = 0, v = VALS[0];
  const set = (el, cls) => el.setAttribute("class", cls);

  return cycler([
    { d:700, run(){
        v = VALS[n % VALS.length]; n++;
        set(pA,"vz-fpill arg"); set(tA,"vz-fpt arg"); tA.textContent = "?";
        set(pR,"vz-fpill ret"); set(tR,"vz-fpt ret"); tR.textContent = "?";
        set(box,"vz-fbox");
        set(w1,"vz-fwire"); set(h1,"vz-fhead"); set(w2,"vz-fwire"); set(h2,"vz-fhead");
        set(dIn,"vz-fdot"); set(dOut,"vz-fdot back");
        line.textContent = "square(" + v + ")";
        note.textContent = "виклик функції";
      }},
    { d:800, run(){
        set(pA,"vz-fpill arg on"); set(tA,"vz-fpt arg on"); tA.textContent = v;
        note.textContent = "аргумент " + v + " готовий";
      }},
    { d:850, run(){
        set(w1,"vz-fwire on"); set(h1,"vz-fhead on"); restart(dIn,"go");
        note.textContent = "n = " + v + " — заходимо всередину";
      }},
    { d:800, run(){ set(box,"vz-fbox work"); note.textContent = "усередині: n * n"; }},
    { d:850, run(){
        set(box,"vz-fbox"); set(w2,"vz-fwire done"); set(h2,"vz-fhead done"); restart(dOut,"go");
        note.textContent = "return віддає результат";
      }},
    { d:2000, run(){
        set(pR,"vz-fpill ret on"); set(tR,"vz-fpt ret on"); tR.textContent = v * v;
        line.textContent = "square(" + v + ") → " + (v * v);
        note.textContent = "значення стало на місце виклику";
      }}
  ]);
}

/* --- 6. файли --- */
function vizFiles(svg){
  const mode = $("[data-mode]", svg), caret = $("[data-caret]", svg);
  const lines = [0,1,2].map(k=>$('[data-l="' + k + '"]', svg));
  const setMode = (t, on) => {
    mode.textContent = t;
    mode.setAttribute("class", "vz-np-mode" + (on ? " on" : ""));
  };
  /* каретка їде рядками вниз; рядок у svg — 24 одиниці */
  const caretTo = (k) => { caret.style.transform = "translateY(" + (k * 24) + "px)"; };
  const steps = [{ d:700, run(){
    lines.forEach(l=>l.setAttribute("class", "vz-np-tx"));
    setMode("відкрито: w", true);
    caret.setAttribute("class", "vz-caret");
    caretTo(0);
  }}];
  lines.forEach((l, k)=>steps.push({ d:800, run(){
    l.setAttribute("class", "vz-np-tx on");
    caretTo(k + 1);
  }}));
  steps.push({ d:1700, run(){
    setMode("закрито", false);
    caret.setAttribute("class", "vz-caret off");
    caretTo(0);
  }});
  return cycler(steps);
}

/* --- 7. практика: магазин --- */
function vizShop(svg){
  const line = $("[data-line]", svg), note = $("[data-note]", svg);
  const tiles = [0,1,2,3].map(k=>$('[data-tile="' + k + '"]', svg));
  const PRICES = [1899, 449, 3499, 799];
  const SLOT = [2, 0, 3, 1];      /* куди стає кожна плитка після сортування */
  const place = (sorted) => tiles.forEach((t,k)=>{
    t.style.transform = sorted ? "translateX(" + ((SLOT[k] - k) * 76) + "px)" : "";
  });
  const mark = (fn) => tiles.forEach((t,k)=>t.setAttribute("class", fn ? fn(PRICES[k]) : ""));

  return cycler([
    { d:1300, run(){
        place(false); mark(null);
        line.textContent = "prices = [1899, 449, 3499, 799]";
        note.textContent = "каталог як є";
      }},
    { d:1500, run(){
        place(true);
        line.textContent = "sort_values(prices)";
        note.textContent = "→ спершу дешевші";
      }},
    { d:1500, run(){
        mark(p => p <= 1000 ? "hit" : "dim");
        line.textContent = "filter_by_price_range(prices, 0, 1000)";
        note.textContent = "→ [1, 3] — лише товари до 1000 ₴";
      }},
    { d:1900, run(){
        line.textContent = "get_average([449, 799])";
        note.textContent = "→ 624.0 — середня ціна";
      }}
  ]);
}

const VIZ = {};
(function initViz(){
  const map = { vars: vizVars, cond: vizCond, loops: vizLoop, func: vizFunc, dicts: vizDict, files: vizFiles, shop: vizShop };
  /* Раніше картки оживали лише на mouseenter — тобто на сенсорному екрані
     не грали ніколи. Тепер запускає поява в екрані, а наведення лишається
     додатковим тригером. */
  const io = (!reduced && "IntersectionObserver" in window)
    ? new IntersectionObserver(entries=>{
        entries.forEach(en=>{
          const anim = VIZ[en.target.dataset.viz];
          if(anim && en.isIntersecting && !activeRoute && !document.hidden) anim.start();
        });
      }, { threshold:.4 })
    : null;

  $$("[data-viz]").forEach(card=>{
    const kind = card.dataset.viz;
    const svg = $("svg", card);
    if(!map[kind] || !svg) return;
    const anim = map[kind](svg);
    VIZ[kind] = anim;
    if(reduced){ anim.once(); return; }
    card.addEventListener("mouseenter", ()=>anim.start());
    if(io) io.observe(card);
  });
})();

function homeAnim(on){
  Object.values(VIZ).forEach(a => on && !document.hidden ? a.start() : a.stop());
}
document.addEventListener("visibilitychange", ()=>homeAnim(!activeRoute));

/* поява карток */
(function reveal(){
  const items = $$(".reveal");
  if(reduced){ items.forEach(el=>el.classList.add("in")); return; }
  items.forEach((el,k)=>{
    el.style.transitionDelay = (k * 90) + "ms";
    setTimeout(()=>el.classList.add("in"), 60);
  });
})();

/* ============================ головна: картки ============================ */
/* Картки знають свій маршрут: колір обкладинки (--tc), водяний номер, а
   картки тем — ще й мітку «Тема 01» з порядковим номером. */
const homeCards = $$("#page-home a.card");
homeCards.forEach(card=>{
  const route = ALL.find(r => "#/" + r.slug === card.getAttribute("href"));
  if(!route) return;
  card.dataset.slug = route.slug;
  card.style.setProperty("--tc", "var(--tc-" + topicOf(route) + ")");
  const viz = $(".card-viz", card);
  if(viz && (/^\d/.test(route.num) || route.grade)) viz.dataset.n = route.num;
  if(TOPIC_SLUGS.includes(route.slug) && /^\d+$/.test(route.num))
    $(".card-body", card).insertAdjacentHTML("afterbegin", `<span class="card-tag">Тема ${route.num}</span>`);
});

/* Сторінка #/tests показує ті самі картки класів, що й вкладка на головній:
   копія вже з кольором і водяним номером, але без появи (.reveal) — вона
   спрацьовує лише на старті, коли сторінка ще схована. */
(function classCards(){
  const src = $("#page-home [data-class-cards]"), slot = $("[data-class-cards-slot]");
  if(!src || !slot) return;
  const copy = src.cloneNode(true);
  copy.removeAttribute("data-class-cards");
  $$(".reveal", copy).forEach(el=>el.classList.remove("reveal"));
  slot.replaceWith(copy);
})();

/* Мітки «пройдено» на головній і в меню */
function paintVisited(){
  if(!window.Book) return;      /* без Book нема списку пройденого — нема що малювати */
  const list = Book.visited.list();
  $$(".nav-item").forEach(a=>a.classList.toggle("done", Book.isDone(a.dataset.slug, list)));
  homeCards.forEach(card=>{
    const on = Book.isDone(card.dataset.slug, list);
    let tag = $(".card-done", card);
    if(on && !tag){
      tag = document.createElement("span");
      tag.className = "card-done";
      tag.textContent = "✓ пройдено";
      $(".card-body", card).prepend(tag);
    } else if(!on && tag) tag.remove();
  });
}

/* ============================ таби ============================ */
/* .tabs[data-tabs] з кнопками [role=tab][aria-controls] перемикає панелі
   .tab-panel. Вибір пам'ятаємо до кінця сесії, щоб «назад» зі сторінки теми
   повертав на той самий таб. Стрілки, Home і End — як у звичайних табах. */
$$("[data-tabs]").forEach(box=>{
  const key = "pyguide_tab_" + box.dataset.tabs;
  const tabs = $$("[role=tab]", box);
  /* лічильник біля назви табу — скільки карток у його панелі */
  tabs.forEach(t=>{
    const n = $$(".card", document.getElementById(t.getAttribute("aria-controls"))).length;
    if(n) t.insertAdjacentHTML("beforeend", ` <span class="tab-n">${n}</span>`);
  });
  function select(tab, focus){
    tabs.forEach(t=>{
      const on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if(focus) tab.focus();
    try { sessionStorage.setItem(key, tab.id); } catch(e){}
  }
  box.addEventListener("click", e=>{
    const t = e.target.closest("[role=tab]");
    if(t) select(t);
  });
  box.addEventListener("keydown", e=>{
    const i = tabs.indexOf(document.activeElement);
    if(i < 0) return;
    const n = tabs.length;
    const j = { ArrowRight:(i + 1) % n, ArrowLeft:(i + n - 1) % n, Home:0, End:n - 1 }[e.key];
    if(j === undefined) return;
    e.preventDefault();
    select(tabs[j], true);
  });
  let saved = null;
  try { saved = sessionStorage.getItem(key); } catch(e){}
  select(tabs.find(t=>t.id===saved) || tabs[0]);
});

/* ============================ відповіді на задачі ============================ */
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-answer]");
  if(!b) return;
  const box = document.getElementById(b.dataset.answer);
  if(!box) return;
  const open = box.classList.toggle("show");
  b.textContent = open ? "Сховати відповідь" : "Показати відповідь";
  b.setAttribute("aria-expanded", open ? "true" : "false");
  /* відкрита картка — зелена рамка й кружок */
  const task = b.closest(".task");
  if(task) task.classList.toggle("open", open);
});

/* ============================ друк рядка на головній ============================ */
/* >>> print("привіт, Python") друкується посимвольно один раз, а наприкінці
   фарбується тим самим PyEditor.highlight. Під prefers-reduced-motion рядок
   одразу повний. PyEditor підключається пізніше за app.js, тому запускаємо
   на старті, а не під час завантаження скрипта. */
function typeLine(){
  const el = $("[data-type]");
  if(!el) return;
  const text = el.textContent;
  const done = () => {
    if(window.PyEditor) el.innerHTML = window.PyEditor.highlight(text);
    else el.textContent = text;
  };
  if(reduced){ done(); return; }
  let k = 0;
  el.textContent = "";
  (function tick(){
    el.textContent = text.slice(0, ++k);
    if(k < text.length) setTimeout(tick, 55);
    else done();
  })();
}

/* ============================ старт ============================ */
/* скрипти окремих тем стоять нижче в документі — чекаємо, поки вони зареєструються */
function start(){ typeLine(); render(); }
if(document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", start, {once:true});
else
  start();

})();
