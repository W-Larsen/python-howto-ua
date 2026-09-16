"use strict";
window.PageInit["lambda"] = function(){

const CK  = window.CollKit;
const esc = CK.esc;
const { numCfg, modeCfg, conveyor, row } = CK;
const { boxViz, scopeViz } = window.FuncViz;
/* підсвітка CollKit уже знає lambda, sorted, key і append */
const createPlayer = CK.makePlayer({ tick:660 });

/* комірки з готовим текстом: CK.cells сам загортає рядки в лапки,
   а тут бувають і кортежі, яким лапки навколо не потрібні */
function textCells(list, empty){
  if(!list || !list.length)
    return `<div class="lst"><div class="cellw"><div class="cell ghost">${esc(empty || "порожньо")}</div></div></div>`;
  return `<div class="lst">` + list.map(t =>
    `<div class="cellw" data-key="${esc(t)}"><div class="cell hit">${esc(t)}</div></div>`).join("") + `</div>`;
}

/* ================= 1. анатомія запису ================= */
createPlayer(document.getElementById("func-w-lambda"), {
  config:`<span class="seg">
      <button data-mode="def" aria-pressed="true">def</button>
      <button data-mode="lam" aria-pressed="false">lambda</button>
      <button data-mode="cond" aria-pressed="false">lambda з умовою</button>
    </span>
    <label>аргумент <input type="number" data-cfg id="func-lm-n" value="5" min="0" max="12"></label>`,
  readCfg:(r)=>({ mode:modeCfg(r), n:numCfg(r, "#func-lm-n", 5) }),
  build:({mode, n})=>{
    const isDef = mode === "def", isCond = mode === "cond";
    const name = isCond ? "parity" : "square";
    const expr = isCond ? `"парне" if x % 2 == 0 else "непарне"` : `x * x`;
    const even = n % 2 === 0;
    const res  = isCond ? `"${even ? "парне" : "непарне"}"` : String(n * n);
    const code = isDef
      ? [`def square(x):`, `    return x * x`, ``, `print(square(${n}))`]
      : [`${name} = lambda x: ${expr}`, ``, `print(${name}(${n}))`];
    const callLine = isDef ? 3 : 2, bodyLine = isDef ? 1 : 0;
    const parts = isDef
      ? [{role:"kw", t:"def square", lab:"def та ім'я"},
         {role:"params", t:"(x)", lab:"параметри"},
         {role:"sep", t:": return", lab:"двокрапка й return"},
         {role:"body", t:"x * x", lab:"що повернути"}]
      : [{role:"kw", t:"lambda", lab:"замість def та імені"},
         {role:"params", t:"x", lab:"параметри"},
         {role:"sep", t:":", lab:""},
         {role:"body", t:expr, lab: isCond ? "умовний вираз — він і є результат" : "вираз — він і є результат"}];
    const fnVal = isDef ? "<function square>" : "<function <lambda>>";
    const fnChip = {name, val:fnVal, cls:"i"};
    const box = (o) => Object.assign({name:`${name}(x)`, body: isCond ? "парне чи непарне" : "x * x"}, o);
    const F = (o) => Object.assign({parts, hot:null, out:[], box:box({})}, o);
    const frames = [];

    frames.push(F({line:0, hot:"kw",
      note: isDef
        ? `Звичайний спосіб: слово def, а за ним ім'я функції. Без імені def не буває.`
        : `Слово lambda створює функцію так само, як def, — тільки без імені. Ім'я ${name} їй дає вже звичайне присвоєння зліва.`}));
    frames.push(F({line:0, hot:"params",
      note: isDef
        ? `У дужках — параметри. Тут один: x.`
        : `Між lambda і двокрапкою — параметри. Дужки не потрібні, а кілька параметрів пишуть через кому: lambda a, b: a + b.`}));
    frames.push(F({line:bodyLine, hot:"body",
      note: isDef
        ? `Тіло стоїть окремим рядком із відступом, а значення віддає явний return.`
        : isCond
          ? `Інструкцію if у lambda не вставиш. Але умовний вираз «А if умова else Б» — це один вираз, тож він дозволений.`
          : `Після двокрапки — рівно один вираз. return не пишуть: значення цього виразу lambda поверне сама.`}));
    frames.push(F({line:0, vars:[fnChip],
      note: isDef
        ? `Функція збережена під іменем square. Нічого ще не пораховано — тіло чекає на виклик.`
        : `Готова функція лягла в змінну ${name}. Як і з def, поки нічого не пораховано: lambda лише описала, що робити.`}));
    frames.push(F({line:callLine, vars:[fnChip], box:box({arg:n, in:true}),
      note:`Виклик ${name}(${n}): аргумент ${n} стає значенням параметра x.`}));
    frames.push(F({line:bodyLine, hot:"body", vars:[{name:"x", val:n, cls:"j"}], box:box({arg:n, in:true, work:true}),
      note: isCond
        ? `Перевіряємо умову: ${n} % 2 == 0 → ${even ? "True" : "False"}. Отже, вираз дає ${res}.`
        : `Обчислюється вираз: ${n} * ${n} = ${res}.`}));
    frames.push(F({line:callLine, vars:[fnChip], box:box({arg:n, out:true, ret:res}), out:[res.replace(/"/g, "")], kind:"end",
      note: isDef
        ? `Повернулось ${res}. Перемкни на lambda — вийде те саме, тільки в один рядок.`
        : isCond
          ? `Повернулось ${res} — без жодного return. Спробуй ${even ? "непарний" : "парний"} аргумент: вираз обере іншу гілку.`
          : `Значення виразу повернулось само. Результат той самий, що й у def: lambda не вміє нічого, чого не вміла б звичайна функція, — вона просто коротша.`}));
    return {code, frames};
  },
  legend:`<span><i class="p"></i>ключове слово</span><span><i class="y"></i>параметри</span>` +
         `<span><i class="g"></i>що повертається</span>`,
  extra:(f)=>`<div class="lanat">` + f.parts.map(p =>
      `<span class="lpart ${p.role}${f.hot === p.role ? " now" : ""}" data-key="${p.role}">` +
      `<code>${esc(p.t)}</code><i>${p.lab ? esc(p.lab) : "&nbsp;"}</i></span>`).join("") +
    `</div>` + boxViz(f.box)
});

/* ================= 2. key=: функція як аргумент ================= */
createPlayer(document.getElementById("func-w-key"), {
  config:`<span class="seg">
      <button data-mode="len" aria-pressed="true">key=len</button>
      <button data-mode="last" aria-pressed="false">key=lambda w: w[-1]</button>
      <button data-mode="pair" aria-pressed="false">key=lambda p: p[1]</button>
    </span>`,
  readCfg:(r)=>({ mode:modeCfg(r) }),
  build:({mode})=>{
    const isPair = mode === "pair", isLen = mode === "len";
    const items = isPair ? [["Оля", 11], ["Іван", 8], ["Ніна", 12]] : ["черепаха", "кіт", "жираф", "лев"];
    const arr = isPair ? "people" : "words";
    const keyTxt = isLen ? "len" : isPair ? "lambda p: p[1]" : "lambda w: w[-1]";
    const keyOf = isLen ? (w)=>w.length : isPair ? (p)=>p[1] : (w)=>w[w.length - 1];
    const show  = (v) => isPair ? `("${v[0]}", ${v[1]})` : `"${v}"`;
    /* так друкує сам Python: рядки в одинарних лапках */
    const shown = (v) => isPair ? `('${v[0]}', ${v[1]})` : `'${v}'`;
    const kShow = (k) => typeof k === "string" ? `"${k}"` : String(k);

    const src = items.map(show);
    const keys = items.map(keyOf);
    /* Array.prototype.sort стабільне, як і sorted у Python */
    const order = items.map((_, i)=>i).sort((a, b)=> keys[a] < keys[b] ? -1 : keys[a] > keys[b] ? 1 : 0);
    const res = order.map(i=>src[i]);
    const listTxt = "[" + src.join(", ") + "]";
    const code = [`${arr} = ${listTxt}`, `res = sorted(${arr}, key=${keyTxt})`, `print(res)`];
    const V = [{name:arr, val:listTxt, cls:"i"}];
    const F = (o) => Object.assign({src, keys:[], k:-1, calls:0, res:null, keyTxt, vars:V, out:[]}, o);
    const frames = [];

    frames.push(F({line:0,
      note: isPair
        ? `Три пари «ім'я, бал». Самі пари порівнювались би за першим елементом, тобто за іменем. А сортувати треба за балом.`
        : `Чотири слова. Без key вийшло б за алфавітом: жираф, кіт, лев, черепаха. Нам потрібен інший порядок.`}));
    frames.push(F({line:1, vars:V.concat([{name:"key", val: isLen ? "<built-in function len>" : "<function <lambda>>", cls:"n"}]),
      note: isLen
        ? `key=len — готова функція, і передаємо її без дужок. Викликати її буде сам sorted, по разу на кожне слово.`
        : isPair
          ? `lambda p: p[1] — «з пари бери другий елемент». Знову без виклику: ми віддаємо sorted саму функцію, а не її результат.`
          : `Готової функції «остання буква» немає, тож пишемо її на місці: lambda w: w[-1]. Зверни увагу — ми її не кличемо, а віддаємо sorted.`}));

    items.forEach((v, k)=>{
      const kv = kShow(keys[k]);
      const param = isLen ? [] : [{name: isPair ? "p" : "w", val:src[k], cls:"j"}];
      frames.push(F({line:1, keys:keys.slice(0, k + 1).map(kShow), k, calls:k + 1, vars:V.concat(param),
        note: isLen
          ? `Виклик №${k + 1}: len(${src[k]}) → ${kv}. Це мірка для ${src[k]}.`
          : isPair
            ? `Виклик №${k + 1}: p = ${src[k]}, p[1] → ${kv}. Мірка — бал.`
            : `Виклик №${k + 1}: w = ${src[k]}, w[-1] → ${kv}. Мірка — остання буква.`}));
    });

    const allKeys = keys.map(kShow);
    const sortedKeys = order.map(i=>allKeys[i]);
    frames.push(F({line:1, keys:allKeys, calls:items.length, res,
      note: isLen
        ? `Тепер sorted порівнює лише мірки: ${sortedKeys.join(" ≤ ")}. У «кіт» і «лев» мірка однакова — тоді sorted лишає їх у тому порядку, в якому вони стояли.`
        : isPair
          ? `Порівнюються бали: ${sortedKeys.join(" < ")}. А переставляються цілі пари — ім'я їде разом зі своїм балом.`
          : `Порівнюються самі букви: ${sortedKeys.join(" < ")}. У такому порядку й стають слова.`}));
    frames.push(F({line:2, keys:allKeys, calls:items.length, res, kind:"end",
      out:["[" + order.map(i=>shown(items[i])).join(", ") + "]"],
      note:`Мірку викликали рівно ${items.length} рази — по разу на елемент, і все це зробив sorted без нашої участі. Самі елементи не змінились, змінився лише порядок.`}));
    return {code, frames};
  },
  extra:(f)=>{
    const rows = f.src.map((s, k)=>({
      n:k, src:s,
      out: k < f.keys.length ? f.keys[k] : "?",
      outCls: k < f.keys.length ? "res" : "wait",
      cls: f.k < 0 ? "" : (k === f.k ? "on" : (k > f.k ? "off" : ""))
    }));
    return `<div class="convtitle">sorted викликає <b>${esc(f.keyTxt)}</b> для кожного елемента</div>` +
      conveyor(rows, {a:"елемент", c:"мірка"}) +
      `<div style="margin-top:12px">${row("res", textCells(f.res, "ще не посортовано"), "j")}</div>` +
      `<div class="accrow"><span class="acclab">викликів функції-мірки:</span>` +
      `<span class="accbox${f.calls ? "" : " wait"}">${f.calls}</span></div>`;
  }
});

/* ================= 3. замикання: функція, що повертає функцію ================= */
createPlayer(document.getElementById("func-w-closure"), {
  config:`<label>аргумент <input type="number" data-cfg id="func-cl-x" value="5" min="0" max="20"></label>`,
  readCfg:(r)=>({ x:numCfg(r, "#func-cl-x", 5) }),
  build:({x})=>{
    const code = [`def multiplier(n):`, `    return lambda x: x * n`, ``,
                  `double = multiplier(2)`, `triple = multiplier(3)`, ``,
                  `print(double(${x}))`, `print(triple(${x}))`];
    const LAM = "lambda x: x * n";
    const G = (vars) => ({t:"глобальна область", vars});
    const L = (t, vars) => ({t, vars, local:true});
    const dbl = (cls) => ({name:"double", val:LAM, cls:cls || ""});
    const tpl = (cls) => ({name:"triple", val:LAM, cls:cls || ""});
    const nv  = (v, cls) => ({name:"n", val:String(v), cls:cls || ""});
    const out = [], frames = [];

    frames.push({line:0, out:[], scopes:[G([])],
      note:`multiplier — звичайна def-функція. Незвичне в ній одне: повертає вона не число, а нову функцію.`});
    frames.push({line:3, out:[], vars:[{name:"n", val:2, cls:"i"}],
      scopes:[G([]), L("локальна область multiplier(2)", [nv(2, "now")])],
      note:`Виклик multiplier(2): у локальній області з'являється n = 2.`});
    frames.push({line:1, out:[], vars:[{name:"n", val:2, cls:"i"}],
      scopes:[G([]), L("локальна область multiplier(2)", [nv(2, "hit")])],
      note:`Створюється lambda x: x * n. Усередині вона згадує n — тому забирає цю змінну з собою. Множити вона поки нічого не множить.`});
    frames.push({line:3, out:[], vars:[{name:"double", val:"<function <lambda>>", cls:"j"}],
      scopes:[G([dbl("now")]), L("рюкзак double", [nv(2)])],
      note:`multiplier завершилась, але n = 2 не зникла, як зникають звичайні локальні змінні: вона лишилась прив'язаною до double. Функцію з таким «рюкзаком» змінних називають замиканням.`});
    frames.push({line:4, out:[], vars:[{name:"n", val:3, cls:"i"}],
      scopes:[G([dbl()]), L("рюкзак double", [nv(2)]), L("локальна область multiplier(3)", [nv(3, "now")])],
      note:`Другий виклик — нова локальна область і нова n = 3. Рюкзак double це ніяк не зачепило: у нього своя n.`});
    frames.push({line:4, out:[], vars:[{name:"triple", val:"<function <lambda>>", cls:"j"}],
      scopes:[G([dbl(), tpl("now")]), L("рюкзак double", [nv(2)]), L("рюкзак triple", [nv(3)])],
      note:`Тепер є дві функції з однаковим кодом x * n, але з різними рюкзаками.`});
    out.push(String(x * 2));
    frames.push({line:6, out:[...out], vars:[{name:"x", val:x, cls:"i"}, {name:"n", val:2, cls:"n"}],
      scopes:[G([dbl("hit"), tpl()]), L("рюкзак double", [nv(2, "hit")]), L("рюкзак triple", [nv(3)])],
      note:`double(${x}): x = ${x} приходить аргументом, а n береться з рюкзака — 2. ${x} * 2 = ${x * 2}.`});
    out.push(String(x * 3));
    frames.push({line:7, out:[...out], kind:"end", vars:[{name:"x", val:x, cls:"i"}, {name:"n", val:3, cls:"n"}],
      scopes:[G([dbl(), tpl("hit")]), L("рюкзак double", [nv(2)]), L("рюкзак triple", [nv(3, "hit")])],
      note:`triple(${x}): той самий вираз, але в рюкзаку n = 3, тож ${x * 3}. Одна lambda — різні результати, бо кожна копія пам'ятає своє n.`});
    return {code, frames};
  },
  legend:`<span><i class="p"></i>щойно з'явилось</span><span><i class="g"></i>саме зараз читається</span>`,
  extra:(f)=>scopeViz(f.scopes)
});

/* ================= 4. пастка: lambda в циклі ================= */
createPlayer(document.getElementById("func-w-late"), {
  config:`<span class="seg">
      <button data-mode="late" aria-pressed="true">lambda: i</button>
      <button data-mode="fix" aria-pressed="false">lambda i=i: i</button>
    </span>`,
  readCfg:(r)=>({ mode:modeCfg(r) }),
  build:({mode})=>{
    const fix = mode === "fix";
    const lam = fix ? "lambda i=i: i" : "lambda: i";
    const code = [`funcs = []`, `for i in range(3):`, `    funcs.append(${lam})`, ``,
                  `for f in funcs:`, `    print(f())`];
    const out = [], frames = [], fns = [], rets = [];
    const listV = () => ({name:"funcs", val:"[" + fns.map(()=>"λ").join(", ") + "]", cls:"i"});
    const F = (o) => Object.assign({fix, lam, gi:null, fns:fns.map(v=>({own:v})), rets:[...rets], run:-1, out:[...out]}, o);

    frames.push(F({line:0, vars:[listV()],
      note:`Порожній список — складатимемо в нього функції.`}));

    for(let i = 0; i < 3; i++){
      frames.push(F({line:1, gi:i, vars:[listV(), {name:"i", val:i, cls:"n"}],
        note: i === 0 ? `Перший крок циклу: i = 0.` : `Наступний крок: та сама змінна i тепер дорівнює ${i}.`}));
      fns.push(fix ? i : null);
      frames.push(F({line:2, gi:i, vars:[listV(), {name:"i", val:i, cls:"n"}],
        note: fix
          ? (i === 0
              ? `i=i — це параметр із типовим значенням. Типове значення обчислюється одразу, при створенні функції, тож вона забирає собі поточне число 0.`
              : `Нова функція забрала собі ${i}. Попередні своїх чисел не міняють — у кожної власна копія.`)
          : (i === 0
              ? `Створили lambda: i і поклали в список. Число 0 у функцію НЕ записалося — вона пам'ятає лише ім'я i, а по значення піде тоді, коли її викличуть.`
              : `Ще одна функція. І вона пам'ятає не число ${i}, а ту саму змінну i, що й попередні.`)}));
    }

    frames.push(F({line:4, gi:2, vars:[listV(), {name:"i", val:2, cls:"n"}],
      note: fix
        ? `Цикл закінчився, i = 2. Але функціям це вже байдуже: свої числа вони забрали раніше.`
        : `Цикл закінчився, але змінна i нікуди не зникла — лишилась з останнім значенням 2. І всі три функції дивляться саме на неї.`}));

    const NOTES = fix
      ? [`funcs[0]() має власну i = 0 і назовні не дивиться.`,
         `funcs[1]() повертає свою 1.`,
         `0, 1, 2 — саме те, чого чекали. Типове значення «заморозило» число в момент створення функції.`]
      : [`funcs[0]() тільки зараз виконує тіло: шукає i, своєї не має й бере зовнішню — а там 2. Не 0!`,
         `funcs[1]() — те саме: зовнішня i досі дорівнює 2.`,
         `Три двійки. Функція читає змінну в момент виклику, а не в момент створення — а на момент виклику цикл давно закінчився.`];
    for(let k = 0; k < 3; k++){
      const v = fix ? k : 2;
      rets[k] = v; out.push(String(v));
      frames.push(F({line:5, gi:2, run:k, kind: k === 2 ? "end" : "",
        vars:[listV(), {name:"i", val:2, cls:"n"}, {name:"f", val:`funcs[${k}]`, cls:"j"}],
        note:NOTES[k]}));
    }
    return {code, frames};
  },
  legend:`<span><i class="p"></i>функція, яку викликають зараз</span><span>λ — функція, створена через lambda</span>`,
  extra:(f)=>{
    const outer = f.run >= 0 && !f.fix;
    const glob = `<div class="lamglob"><span class="lamlab">змінна циклу</span>` +
      `<span class="svar ${f.gi === null ? "empty" : (outer ? "hit" : "now")}">${f.gi === null ? "i ще немає" : "i = " + f.gi}</span></div>`;
    const cards = [0, 1, 2].map(k=>{
      const o = f.fns[k];
      if(!o) return `<div class="lamf ghost"><span class="nm">funcs[${k}]</span><span class="lb">ще не створено</span>` +
                    `<span class="ref">&nbsp;</span><span class="rv">&nbsp;</span></div>`;
      const called = f.rets[k] !== undefined;
      return `<div class="lamf${f.run === k ? " now" : ""}" data-key="f${k}">` +
        `<span class="nm">funcs[${k}]</span><span class="lb">${esc(f.lam)}</span>` +
        (f.fix ? `<span class="ref own">своя i = ${o.own}</span>`
               : `<span class="ref outer">i → бере зовнішню</span>`) +
        `<span class="rv${called ? " on" : ""}">${called ? "повернула " + f.rets[k] : "ще не викликали"}</span></div>`;
    }).join("");
    return `<div class="lamviz">${glob}<div class="lamfs">${cards}</div></div>`;
  }
});

/* ================= hero ================= */
(function(){
  const id  = (s) => document.getElementById(s);
  const arg = id("lambda-heroArg"), ret = id("lambda-heroRet"), box = id("lambda-heroBox"),
        w1  = id("lambda-heroW1"),  w2  = id("lambda-heroW2"),
        line = id("lambda-heroLine"), btn = id("lambda-heroBtn");
  if(!btn) return;
  const CASES = [
    {fn:"lambda x: x * 2",                arg:"7",     work:"7 * 2",       ret:"14"},
    {fn:"lambda w: w[-1]",                arg:'"кіт"', work:'"кіт"[-1]',   ret:'"т"'},
    {fn:"lambda a, b: a + b",             arg:"3, 4",  work:"3 + 4",       ret:"7"},
    {fn:'lambda x: "так" if x else "ні"', arg:"0",     work:"0 — це хиба", ret:'"ні"'}
  ];
  let n = 0, timers = [];
  const clear = () => { timers.forEach(clearTimeout); timers = []; };
  const at = (ms, fn) => { timers.push(setTimeout(fn, ms)); };
  const setBox = (c, sub) => { box.innerHTML = `${esc(c.fn)}<b>${esc(sub)}</b>`; };

  function run(){
    clear();
    const c = CASES[n % CASES.length]; n++;
    arg.textContent = "?"; arg.className = "fnpill arg";
    ret.textContent = "?"; ret.className = "fnpill ret";
    box.className = "fnbox"; setBox(c, "чекає на виклик");
    w1.className = "fnwire"; w2.className = "fnwire";
    line.innerHTML = `функція <b>${esc(c.fn)}</b> створена, але ще не викликана`;

    at(420,  ()=>{ arg.textContent = c.arg; arg.className = "fnpill arg on";
                   line.innerHTML = `виклик з аргументом <b>${esc(c.arg)}</b>`; });
    at(1050, ()=>{ w1.className = "fnwire on"; });
    at(1500, ()=>{ box.className = "fnbox work"; setBox(c, c.work);
                   line.innerHTML = `обчислюється вираз: <b>${esc(c.work)}</b>`; });
    at(2450, ()=>{ box.className = "fnbox"; w2.className = "fnwire back"; });
    at(2850, ()=>{ ret.textContent = c.ret; ret.className = "fnpill ret on";
                   line.innerHTML = `значення виразу <b>${esc(c.ret)}</b> повертається само, без return`; });
    at(4700, run);
  }

  /* кнопка програє той самий приклад ще раз, а не наступний */
  btn.onclick = ()=>{ n = Math.max(0, n - 1); run(); };
  window.registerAnim({
    el: btn,
    stop(){ clear(); },
    start(){ clear(); at(600, run); }
  });
})();

};
