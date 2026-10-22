"use strict";
window.PageInit["errors"] = function(){
const K = window.CollKit;
const { esc, modeCfg, notepad } = K;
const $id = (s) => document.getElementById(s);

/* Підсвітка: власний список слів цієї теми. Якщо в новому прикладі з'явиться
   інше слово (range, join …), додай його сюди. */
const hl = K.makeHl(
  /\b(def|return|if|else|for|in|while|not|and|or|True|False|None|import|from|with|as|try|except|finally|raise|break|pass)\b/g,
  /\b(print|len|sum|int|input|open|write|read|close|ValueError|TypeError|IndexError|KeyError|ZeroDivisionError|FileNotFoundError)\b/g);
const createPlayer = K.makePlayer({ hl, tick:800 });

/* ================= спільне ================= */
const TRACE = "Traceback (most recent call last):";
const V = (name, val, cls) => ({name, val, cls: cls || ""});
const stack = (...parts) => `<div class="np-stack">${parts.join("")}</div>`;
/* рядки трейсбеку для помилки в рядку line (з 1) верхнього рівня програми */
const tb = (line, src, err) => [TRACE, `  File "main.py", line ${line}, in <module>`, `    ${src}`, err];

/* Схема гілок try: blocks — [{tag, text, st}], st ∈ idle, run, ok, boom, skip.
   Стилі .tryviz / .tryblk — у css/functions.css, .skip — у css/errors.css. */
function branches(blocks){
  return `<div class="tryviz">` + blocks.map(b =>
    `<div class="tryblk ${b.st || "idle"}"><span class="tag">${esc(b.tag)}</span><span>${esc(b.text)}</span></div>`).join("") + `</div>`;
}
const LEGEND = `<span><i class="y"></i>виконується</span><span><i class="g"></i>минуло без помилки</span>` +
  `<span><i class="r"></i>тут сталася помилка</span>`;

/* ================= hero: програма падає ================= */
(function(){
  const box = $id("errors-heroBox"), line = $id("errors-heroLine"), btn = $id("errors-heroBtn");
  if(!box) return;
  const CODE = [`print("починаємо")`, `age = int("abc")`, `print("кінець")`];
  const OUT = ["починаємо", ...tb(2, CODE[1], `ValueError: invalid literal for int() with base 10: 'abc'`)];
  /* step: 0 — нічого, 1 — перший print, 2 — падіння; кроків «3» немає: після падіння рядок так і не виконується */
  const show = (step) => {
    const cls = (k) => step === 0 ? "" : k < step - 1 ? " done" : k === step - 1 ? " now" : (step === 2 && k === 2 ? " skip" : "");
    const code = CODE.map((c, k) => `<div class="eh-ln${cls(k)}"><span class="eh-no">${k + 1}</span><span class="eh-tx">${hl(c)}</span></div>`).join("");
    const out = OUT.slice(0, step === 0 ? 0 : step === 1 ? 1 : OUT.length)
      .map((l, k) => `<div class="eh-out${k >= 1 ? " bad" : ""}">${esc(l)}</div>`).join("");
    box.innerHTML = `<div class="errhero"><div class="eh-code">${code}</div><div class="eh-term">${out || `<div class="eh-out dim">вивід</div>`}</div></div>`;
  };
  show(0);
  let t = null;
  function run(){
    clearTimeout(t);
    show(0);
    line.innerHTML = `програма стартує…`;
    t = setTimeout(() => {
      show(1);
      line.innerHTML = `перший <b>print</b> спрацював`;
      t = setTimeout(() => {
        show(2);
        line.innerHTML = `<b>ValueError</b> — програма зупинилась, а третій рядок <b>так і не виконався</b>`;
        t = null;
      }, 1500);
    }, 900);
  }
  btn.onclick = run;
  let auto = null;
  window.registerAnim({
    el: btn,
    stop(){ clearTimeout(t); t = null; clearTimeout(auto); auto = null; },
    start(){ clearTimeout(auto); auto = setTimeout(run, 600); }
  });
})();

/* ================= 7.2 читаємо traceback ================= */
/* hot — яка частина трейсбеку підсвічена: msg, where, mid, top */
function tbHtml(hot){
  if(!hot) return `<div class="errtb empty">Помилки ще не було — трейсбеку немає.</div>`;
  const fr = (key, file, code) =>
    `<div class="tb-fr${hot === key ? " on" : ""}"><div class="tb-file">${esc(file)}</div><div class="tb-code">${esc(code)}</div></div>`;
  return `<div class="errtb">` +
    `<div class="tb-head">${TRACE}</div>` +
    fr("top", `File "main.py", line 7, in <module>`, `report([])`) +
    fr("mid", `File "main.py", line 5, in report`, `print("середній бал:", average(scores))`) +
    fr("where", `File "main.py", line 2, in average`, `return sum(nums) / len(nums)`) +
    `<div class="tb-msg${hot === "msg" ? " on" : ""}"><b>ZeroDivisionError</b>: division by zero</div>` +
    `</div>`;
}
createPlayer($id("errors-w-trace"), {
  build:()=>{
    const code = [
      `def average(nums):`,
      `    return sum(nums) / len(nums)`,
      ``,
      `def report(scores):`,
      `    print("середній бал:", average(scores))`,
      ``,
      `report([])`
    ];
    const TB = [TRACE, `  File "main.py", line 7, in <module>`, `    report([])`,
      `  File "main.py", line 5, in report`, `    print("середній бал:", average(scores))`,
      `  File "main.py", line 2, in average`, `    return sum(nums) / len(nums)`,
      `ZeroDivisionError: division by zero`];
    const S = V("scores", "[]", "i"), N = V("nums", "[]", "i");
    return {code, frames:[
      {line:6, vars:[], out:[], hot:null,
        note:`Програма викликає report з порожнім списком оцінок.`},
      {line:4, vars:[S], out:[], hot:null,
        note:`report хоче надрукувати середній бал і викликає average. Тепер у пам'яті «живуть» уже три виклики: головна програма → report → average.`},
      {line:1, vars:[S, N], out:[], hot:null,
        note:`sum([]) дорівнює 0, len([]) теж 0 — виходить 0 / 0. Ділити на нуль не можна: Python кидає ZeroDivisionError.`},
      {line:1, vars:[S, N], out:TB, hot:"msg", kind:"end",
        note:`Читаємо трейсбек ЗНИЗУ. Останній рядок — найголовніший: тип помилки (ZeroDivisionError) і її пояснення (division by zero).`},
      {line:1, vars:[S, N], out:TB, hot:"where", kind:"end",
        note:`Вище — де саме сталося: файл, номер рядка (2), у якій функції (average) і сам рядок коду. Номер рядка збігається з тим, що підсвічено в коді.`},
      {line:4, vars:[S], out:TB, hot:"mid", kind:"end",
        note:`Ще вище — хто викликав average: функція report, рядок 5. Кожен «File» — це один виклик у ланцюжку.`},
      {line:6, vars:[], out:TB, hot:"top", kind:"end",
        note:`Найвищий запис — звідки все почалось: рядок 7 головної програми. Помилка в average, а причина — порожній список, який передали з рядка 7.`}
    ]};
  },
  extra:(f)=> tbHtml(f.hot)
});

/* ================= 7.3 найчастіші винятки ================= */
const KINDS = {
  ValueError:{
    code:[`text = "abc"`, `number = int(text)`],
    vars:[V("text", `"abc"`, "j")], at:1,
    err:`ValueError: invalid literal for int() with base 10: 'abc'`,
    why:`Тип правильний (рядок), але значення не підходить: "abc" не схоже на число. Так само впаде int("") чи int("3,5").`},
  TypeError:{
    code:[`age = 15`, `print("мені " + age + " років")`],
    vars:[V("age", "15", "i")], at:1,
    err:`TypeError: can only concatenate str (not "int") to str`,
    why:`Неправильний тип: рядок і число не склеїш плюсом. Виправлення: str(age) або f-рядок.`},
  IndexError:{
    code:[`names = ["Оля", "Іван"]`, `print(names[5])`],
    vars:[V("names", `["Оля", "Іван"]`, "i")], at:1,
    err:`IndexError: list index out of range`,
    why:`У списку два елементи — індекси 0 і 1. Індексу 5 немає. Нагадування: <a href="#/list">Списки</a>.`},
  KeyError:{
    code:[`student = {"name": "Оля"}`, `print(student["age"])`],
    vars:[V("student", `{"name": "Оля"}`, "i")], at:1,
    err:`KeyError: 'age'`,
    why:`У словнику немає ключа "age". Безпечніше — student.get("age"), який віддає None замість помилки. Нагадування: <a href="#/dict">Словники</a>.`},
  ZeroDivisionError:{
    code:[`total = 10`, `count = 0`, `print(total / count)`],
    vars:[V("total", "10", "i"), V("count", "0", "i")], at:2,
    err:`ZeroDivisionError: division by zero`,
    why:`На нуль ділити не можна. Типова причина: середнє від порожнього списку.`},
  FileNotFoundError:{
    code:[`name = "marks.txt"`, `with open(name, encoding="utf-8") as f:`, `    print(f.read())`],
    vars:[V("name", `"marks.txt"`, "j")], at:1,
    err:`FileNotFoundError: [Errno 2] No such file or directory: 'marks.txt'`,
    why:`open на читання не знаходить такого файлу в робочій папці. Докладніше — у темі <a href="#/files">«Файли»</a>.`,
    file:true}
};
createPlayer($id("errors-w-kinds"), {
  config:`<span class="seg">` + Object.keys(KINDS).map((k, i) =>
    `<button data-mode="${k}" aria-pressed="${i === 0}">${k}</button>`).join("") + `</span>`,
  readCfg:(r)=>({kind:modeCfg(r)}),
  build:({kind})=>{
    const K_ = KINDS[kind];
    const frames = [];
    for(let k = 0; k < K_.at; k++){
      frames.push({line:k, vars:K_.vars.slice(0, k + 1), out:[], which:kind,
        note: k === 0 ? `Програма стартує, готуємо дані.` : `Ще один безпечний рядок.`});
    }
    const src = K_.code[K_.at].trim();
    frames.push({line:K_.at, vars:K_.vars, out:tb(K_.at + 1, src, K_.err), kind:"end", which:kind, boom:true,
      note:`Помилка. Рядок ${K_.at + 1} не виконався, програма зупинилась. Тип помилки (${kind}) — це «діагноз», а текст після двокрапки — подробиці.`});
    return {code:K_.code, frames};
  },
  sizeVariants:()=>Object.keys(KINDS).map(kind=>({kind})),
  extra:(f)=>{
    const K_ = KINDS[f.which];
    const why = f.boom ? `<div class="errwhy"><b>Чому так.</b> ${K_.why}</div>` : `<div class="errwhy dim">Дивись, який рядок падає.</div>`;
    return K_.file ? stack(notepad({name:"marks.txt", mode:null, text:"", pos:null, missing:true}), why) : why;
  }
});

/* ================= 7.4 try / except ================= */
createPlayer($id("errors-w-try"), {
  config:`<span class="seg">
      <button data-mode="abc" data-group="val" aria-pressed="true">text = "abc"</button>
      <button data-mode="12" data-group="val" aria-pressed="false">text = "12"</button>
    </span>
    <span class="seg">
      <button data-mode="plain" data-group="guard" aria-pressed="true">без try</button>
      <button data-mode="try" data-group="guard" aria-pressed="false">з try</button>
    </span>`,
  readCfg:(r)=>({val:modeCfg(r, "val"), guard:modeCfg(r, "guard") === "try"}),
  build:({val, guard})=>{
    const bad = val === "abc";
    const T = V("text", `"${val}"`, "j");
    const N = V("number", "12", "j");
    const frames = [];
    const blk = (a, b) => ({a, b});
    if(!guard){
      const code = [`text = "${val}"`, `number = int(text)`, `print("на 2 більше:", number + 2)`, `print("кінець")`];
      const ERR = tb(2, "number = int(text)", `ValueError: invalid literal for int() with base 10: 'abc'`);
      frames.push({line:0, vars:[T], out:[], blk:blk("idle"), note:`Користувач «ввів» текст.`});
      if(!bad){
        frames.push({line:1, vars:[T, N], out:[], blk:blk("ok"), note:`int("12") — число 12.`});
        frames.push({line:2, vars:[T, N], out:["на 2 більше: 14"], blk:blk("ok"), note:`Усе гаразд.`});
        frames.push({line:3, vars:[T, N], out:["на 2 більше: 14", "кінець"], blk:blk("ok"), kind:"end", note:`Програма дійшла до кінця.`});
      }else{
        frames.push({line:1, vars:[T], out:ERR, blk:blk("boom"), kind:"end",
          note:`int("abc") — ValueError. Блоку try немає, тож ніхто не перехопить: програма падає з трейсбеком.`});
        frames.push({line:3, vars:[T], out:ERR, blk:blk("boom"), kind:"end",
          note:`Два останні рядки не виконались. Для користувача це виглядає як «усе зламалось».`});
      }
      return {code, frames};
    }
    const code = [`text = "${val}"`, `try:`, `    number = int(text)`, `    print("на 2 більше:", number + 2)`,
      `except ValueError:`, `    print("це не число")`, `print("кінець")`];
    frames.push({line:0, vars:[T], out:[], blk:blk("idle", "idle"), note:`Користувач «ввів» текст.`});
    frames.push({line:1, vars:[T], out:[], blk:blk("run", "idle"), note:`try: — «спробуй». Усередині може статися помилка, і ми готові її зустріти.`});
    if(!bad){
      frames.push({line:2, vars:[T, N], out:[], blk:blk("ok", "idle"), note:`int("12") спрацювало — число 12.`});
      frames.push({line:3, vars:[T, N], out:["на 2 більше: 14"], blk:blk("ok", "idle"), note:`Блок try виконався до кінця.`});
      frames.push({line:6, vars:[T, N], out:["на 2 більше: 14", "кінець"], blk:blk("ok", "skip"), kind:"end",
        note:`Помилки не було, тож except пропущено повністю.`});
    }else{
      frames.push({line:2, vars:[T], out:[], blk:blk("boom", "idle"),
        note:`int("abc") кидає ValueError. Решта блоку try (рядок із print) пропускається.`});
      frames.push({line:4, vars:[T], out:[], blk:blk("boom", "ok"),
        note:`except ValueError — тип збігся, керування переходить сюди.`});
      frames.push({line:5, vars:[T], out:["це не число"], blk:blk("boom", "ok"),
        note:`Замість трейсбеку — зрозуміле повідомлення.`});
      frames.push({line:6, vars:[T], out:["це не число", "кінець"], blk:blk("boom", "ok"), kind:"end",
        note:`І програма живе далі: останній рядок виконався.`});
    }
    return {code, frames};
  },
  sizeVariants:({guard})=>[{val:"abc", guard}, {val:"12", guard}],
  legend:LEGEND,
  extra:(f)=> f.blk.b === undefined
    ? branches([{tag:"код", text:"усі рядки програми", st:f.blk.a}])
    : branches([{tag:"try", text:"number = int(text) …", st:f.blk.a}, {tag:"except", text:"ValueError → повідомлення", st:f.blk.b}])
});

/* ================= 7.5 конкретний except і as e ================= */
createPlayer($id("errors-w-except"), {
  config:`<span class="seg">
      <button data-mode="12" data-group="inp" aria-pressed="false">"12"</button>
      <button data-mode="abc" data-group="inp" aria-pressed="true">"abc"</button>
      <button data-mode="0" data-group="inp" aria-pressed="false">"0"</button>
    </span>
    <span class="seg">
      <button data-mode="two" data-group="exc" aria-pressed="true">два except</button>
      <button data-mode="one" data-group="exc" aria-pressed="false">лише ValueError</button>
    </span>`,
  readCfg:(r)=>({inp:modeCfg(r, "inp"), two:modeCfg(r, "exc") === "two"}),
  build:({inp, two})=>{
    const code = [`text = "${inp}"`, `try:`, `    n = int(text)`, `    print(100 / n)`,
      `except ValueError as e:`, `    print("не число:", e)`];
    if(two) code.push(`except ZeroDivisionError:`, `    print("на нуль ділити не можна")`);
    code.push(`print("кінець")`);
    const END = code.length - 1, ZE = 6, ZP = 7;
    const T = V("text", `"${inp}"`, "j");
    const MSG = `invalid literal for int() with base 10: 'abc'`;
    const frames = [];
    const blk = (t, v, z) => ({t, v, z});
    const ID = two ? "idle" : undefined;
    frames.push({line:0, vars:[T], out:[], blk:blk("idle", "idle", ID), note:`Рядок, який «ввів» користувач.`});
    frames.push({line:1, vars:[T], out:[], blk:blk("run", "idle", ID), note:`Входимо в try.`});

    if(inp === "12"){
      frames.push({line:2, vars:[T, V("n", "12", "j")], out:[], blk:blk("ok", "idle", ID), note:`int("12") — число 12.`});
      frames.push({line:3, vars:[T, V("n", "12", "j")], out:["8.333333333333334"], blk:blk("ok", "idle", ID), note:`100 / 12 — без помилок.`});
      frames.push({line:END, vars:[T, V("n", "12", "j")], out:["8.333333333333334", "кінець"], blk:blk("ok", "skip", two ? "skip" : undefined), kind:"end",
        note:`Помилки не було — жоден except не потрібен.`});
    }else if(inp === "abc"){
      const E = V("e", `ValueError("${MSG}")`, "n");
      frames.push({line:2, vars:[T], out:[], blk:blk("boom", "idle", ID), note:`int("abc") — ValueError.`});
      frames.push({line:4, vars:[T, E], out:[], blk:blk("boom", "ok", two ? "skip" : undefined),
        note:`except ValueError збігся. Слово as e кладе сам виняток у змінну e — через неї можна прочитати пояснення.`});
      frames.push({line:5, vars:[T, E], out:["не число: " + MSG], blk:blk("boom", "ok", two ? "skip" : undefined),
        note:`print з e друкує текст помилки, той самий, що був би в трейсбеку. Другий except, якщо він є, не перевіряється: вже знайшли свій.`});
      frames.push({line:END, vars:[T, E], out:["не число: " + MSG, "кінець"], blk:blk("boom", "ok", two ? "skip" : undefined), kind:"end",
        note:`Програма пішла далі.`});
    }else{
      const N0 = V("n", "0", "j");
      frames.push({line:2, vars:[T, N0], out:[], blk:blk("ok", "idle", ID), note:`int("0") — число 0, це ще не помилка.`});
      frames.push({line:3, vars:[T, N0], out:[], blk:blk("boom", "idle", ID), note:`100 / 0 — ZeroDivisionError.`});
      if(two){
        frames.push({line:4, vars:[T, N0], out:[], blk:blk("boom", "run", "idle"),
          note:`Спершу Python питає except ValueError: це не ValueError, тож пропускаємо.`});
        frames.push({line:ZE, vars:[T, N0], out:[], blk:blk("boom", "skip", "ok"),
          note:`except ZeroDivisionError — збіг. Кожен except — окремий «план Б» для свого типу помилки.`});
        frames.push({line:ZP, vars:[T, N0], out:["на нуль ділити не можна"], blk:blk("boom", "skip", "ok"), note:`Виконується відповідне повідомлення.`});
        frames.push({line:END, vars:[T, N0], out:["на нуль ділити не можна", "кінець"], blk:blk("boom", "skip", "ok"), kind:"end",
          note:`Програма пішла далі.`});
      }else{
        const ERR = tb(4, "print(100 / n)", "ZeroDivisionError: division by zero");
        frames.push({line:4, vars:[T, N0], out:ERR, blk:blk("boom", "skip"), kind:"end",
          note:`except ValueError не підходить до ZeroDivisionError, а інших except немає — помилку ніхто не ловить, і програма падає з трейсбеком. except ловить лише те, що в нього вписано.`});
      }
    }
    return {code, frames};
  },
  sizeVariants:({two})=>["12", "abc", "0"].map(inp=>({inp, two})),
  legend:LEGEND,
  extra:(f)=>{
    const b = f.blk, list = [
      {tag:"try", text:"n = int(text); print(100 / n)", st:b.t},
      {tag:"except", text:"ValueError as e → «не число»", st:b.v}];
    if(b.z !== undefined) list.push({tag:"except", text:"ZeroDivisionError → «на нуль…»", st:b.z});
    return branches(list);
  }
});

/* ================= 7.6 else і finally (файл) ================= */
createPlayer($id("errors-w-finally"), {
  config:`<span class="seg">
      <button data-mode="ok" aria-pressed="true">points = "12"</button>
      <button data-mode="err" aria-pressed="false">points = 12</button>
    </span>`,
  readCfg:(r)=>({bad:modeCfg(r) === "err"}),
  build:({bad})=>{
    const P = bad ? "12" : `"12"`;
    const code = [
      `points = ${P}`,
      `f = open("scores.txt", "w", encoding="utf-8")`,
      `try:`,
      `    f.write(points)`,
      `except TypeError:`,
      `    print("write бере лише рядки")`,
      `else:`,
      `    print("записано")`,
      `finally:`,
      `    f.close()`,
      `    print("файл закрито")`,
      `print("кінець")`
    ];
    const PV = V("points", P, "i");
    const fv = (mode) => V("f", mode ? `файл scores.txt (${mode})` : `файл scores.txt (закрито)`, mode ? "i" : "");
    const nf = (mode, text, mark) => ({name:"scores.txt", mode, text, pos: mode ? text.length : null, marks: mark || []});
    const blk = (t, e, el, fi) => ({t, e, el, fi});
    const frames = [];
    frames.push({line:0, vars:[PV], out:[], file:nf(null, ""), blk:blk("idle", "idle", "idle", "idle"),
      note: bad ? `Оцінка — число 12, а не рядок.` : `Оцінка — рядок "12".`});
    frames.push({line:1, vars:[PV, fv("w")], out:[], file:nf("w", ""), blk:blk("idle", "idle", "idle", "idle"),
      note:`Режим "w" створив порожній файл. Закривати його доведеться самим — тому далі finally.`});
    frames.push({line:2, vars:[PV, fv("w")], out:[], file:nf("w", ""), blk:blk("run", "idle", "idle", "idle"), note:`Входимо в try.`});
    if(bad){
      const o1 = ["write бере лише рядки"], o2 = [...o1, "файл закрито"], o3 = [...o2, "кінець"];
      frames.push({line:3, vars:[PV, fv("w")], out:[], file:nf("w", ""), blk:blk("boom", "idle", "idle", "idle"),
        note:`write(12) — TypeError: write бере лише рядки. У файл нічого не потрапило.`});
      frames.push({line:4, vars:[PV, fv("w")], out:[], file:nf("w", ""), blk:blk("boom", "ok", "skip", "idle"),
        note:`except TypeError збігся. Гілка else у цьому випадку пропускається — вона лише для «все пройшло добре».`});
      frames.push({line:5, vars:[PV, fv("w")], out:o1, file:nf("w", ""), blk:blk("boom", "ok", "skip", "idle"), note:`Повідомлення про помилку.`});
      frames.push({line:9, vars:[PV, fv(null)], out:o1, file:nf(null, ""), blk:blk("boom", "ok", "skip", "run"),
        note:`finally виконується завжди — і коли була помилка, і коли ні. Тут файл закривається: у шапці блокнота «закрито».`});
      frames.push({line:10, vars:[PV, fv(null)], out:o2, file:nf(null, ""), blk:blk("boom", "ok", "skip", "ok"), note:`Ще один рядок finally.`});
      frames.push({line:11, vars:[PV, fv(null)], out:o3, file:nf(null, ""), blk:blk("boom", "ok", "skip", "ok"), kind:"end",
        note:`Програма пішла далі, а файл не лишився відкритим.`});
    }else{
      const o1 = ["записано"], o2 = [...o1, "файл закрито"], o3 = [...o2, "кінець"];
      frames.push({line:3, vars:[PV, fv("w")], out:[], file:nf("w", "12", [{from:0, to:2, cls:"new"}]), blk:blk("ok", "idle", "idle", "idle"),
        note:`write("12") спрацював — у файлі з'явилось "12".`});
      frames.push({line:6, vars:[PV, fv("w")], out:[], file:nf("w", "12"), blk:blk("ok", "skip", "run", "idle"),
        note:`Помилки не було — виконується else. Це місце для коду, який має працювати лише після успішного try.`});
      frames.push({line:7, vars:[PV, fv("w")], out:o1, file:nf("w", "12"), blk:blk("ok", "skip", "ok", "idle"), note:`Повідомлення про успіх.`});
      frames.push({line:9, vars:[PV, fv(null)], out:o1, file:nf(null, "12"), blk:blk("ok", "skip", "ok", "run"),
        note:`finally виконується завжди: і після успіху, і після помилки. Файл закрито.`});
      frames.push({line:10, vars:[PV, fv(null)], out:o2, file:nf(null, "12"), blk:blk("ok", "skip", "ok", "ok"), note:`Ще один рядок finally.`});
      frames.push({line:11, vars:[PV, fv(null)], out:o3, file:nf(null, "12"), blk:blk("ok", "skip", "ok", "ok"), kind:"end", note:`Кінець програми.`});
    }
    return {code, frames};
  },
  sizeVariants:()=>[{bad:false}, {bad:true}],
  legend:LEGEND,
  extra:(f)=> stack(
    notepad(f.file),
    branches([
      {tag:"try", text:"f.write(points)", st:f.blk.t},
      {tag:"except", text:"TypeError → повідомлення", st:f.blk.e},
      {tag:"else", text:"лише якщо помилки не було", st:f.blk.el},
      {tag:"finally", text:"f.close() — завжди", st:f.blk.fi}]))
});

/* ================= 7.7 запитуємо, поки не введуть правильно ================= */
createPlayer($id("errors-w-retry"), {
  build:()=>{
    const code = [
      `while True:`,
      `    text = input("Вік: ")`,
      `    try:`,
      `        age = int(text)`,
      `        break`,
      `    except ValueError:`,
      `        print("Це не число, ще раз")`,
      `print("вік:", age)`
    ];
    const TRIES = ["abc", "", "15"];
    const out = [], frames = [];
    TRIES.forEach((t, k) => {
      const T = V("text", `"${t}"`, "j");
      frames.push({line:0, vars:k === 0 ? [] : [V("text", `"${TRIES[k - 1]}"`, "j")], out:[...out],
        note: k === 0 ? `Нескінченний цикл: він крутитиметься, доки не спрацює break.` : `Знову на початок циклу — нова спроба.`});
      out.push("Вік: " + t);
      frames.push({line:1, vars:[T], out:[...out],
        note: t === "" ? `Користувач натиснув Enter, нічого не ввівши.` : `Користувач ввів "${t}".`});
      if(t === "15"){
        const A = V("age", "15", "j");
        frames.push({line:3, vars:[T, A], out:[...out], note:`int("15") спрацювало: age = 15. Помилки не було, тож except пропущено.`});
        frames.push({line:4, vars:[T, A], out:[...out], note:`break виходить із циклу.`});
        out.push("вік: 15");
        frames.push({line:7, vars:[T, A], out:[...out], kind:"end", note:`Цикл завершено — програма має правильне число й іде далі.`});
      }else{
        frames.push({line:3, vars:[T], out:[...out], note: t === "" ? `int("") — теж ValueError: порожній рядок не число.` : `int("${t}") — ValueError.`});
        frames.push({line:5, vars:[T], out:[...out], note:`except ValueError ловить помилку.`});
        out.push("Це не число, ще раз");
        frames.push({line:6, vars:[T], out:[...out], note:`Пояснюємо користувачу, що не так. До break справа не дійшла — цикл продовжується.`});
      }
    });
    return {code, frames};
  }
});

/* ================= 7.8 raise ================= */
createPlayer($id("errors-w-raise"), {
  config:`<span class="seg">
      <button data-mode="plain" aria-pressed="true">без перевірки</button>
      <button data-mode="raise" aria-pressed="false">з raise</button>
    </span>`,
  readCfg:(r)=>({raise:modeCfg(r) === "raise"}),
  build:({raise})=>{
    const frames = [];
    if(!raise){
      const code = [`def set_age(age):`, `    return age`, ``, `age = set_age(-5)`, `print("мені", age, "років")`];
      frames.push({line:3, vars:[], out:[], note:`Хтось передає вік −5.`});
      frames.push({line:1, vars:[V("age", "-5", "i")], out:[], note:`Функція не перевіряє, що їй дали, і спокійно повертає −5.`});
      frames.push({line:4, vars:[V("age", "-5", "j")], out:["мені -5 років"], kind:"end",
        note:`Помилки немає, але результат — абсурд. Така «тиха» помилка найгірша: вона вилізе далеко від причини, коли шукати її буде важко.`});
      return {code, frames};
    }
    const code = [
      `def set_age(age):`,
      `    if age < 0:`,
      `        raise ValueError("вік не може бути від'ємним")`,
      `    return age`,
      ``,
      `try:`,
      `    age = set_age(-5)`,
      `except ValueError as e:`,
      `    print("помилка:", e)`,
      `print("кінець")`
    ];
    const MSG = "вік не може бути від'ємним";
    const A = V("age", "-5", "i");
    const bl = (t, e) => ({t, e});
    frames.push({line:5, vars:[], out:[], blk:bl("run", "idle"), note:`Виклик функції огортаємо в try — раптом вона відмовиться.`});
    frames.push({line:6, vars:[A], out:[], blk:bl("run", "idle"), note:`Викликаємо set_age(-5).`});
    frames.push({line:1, vars:[A], out:[], blk:bl("run", "idle"), note:`Перевіряємо аргумент: −5 < 0 — це правда.`});
    frames.push({line:2, vars:[A], out:[], blk:bl("boom", "idle"),
      note:`raise кидає виняток вручну — так само, як це робить Python, коли щось іде не так. Функція переривається, return не виконується.`});
    frames.push({line:7, vars:[A, V("e", `ValueError("${MSG}")`, "n")], out:[], blk:bl("boom", "ok"),
      note:`Виняток піднімається до ближчого try. except ValueError ловить його, а e містить наше повідомлення.`});
    frames.push({line:8, vars:[A, V("e", `ValueError("${MSG}")`, "n")], out:["помилка: " + MSG], blk:bl("boom", "ok"),
      note:`Пояснення — точнісінько таке, як ми написали в raise.`});
    frames.push({line:9, vars:[A, V("e", `ValueError("${MSG}")`, "n")], out:["помилка: " + MSG, "кінець"], blk:bl("boom", "ok"), kind:"end",
      note:`Помилку помічено одразу, там, де вона виникла, а програма не зламалась.`});
    return {code, frames};
  },
  sizeVariants:()=>[{raise:false}, {raise:true}],
  legend:LEGEND,
  extra:(f)=> f.blk
    ? branches([{tag:"try", text:"age = set_age(-5)", st:f.blk.t}, {tag:"except", text:"ValueError as e → повідомлення", st:f.blk.e}])
    : `<div class="errwhy"><b>Тиха помилка.</b> Програма не впала, але вже працює з неправильними даними.</div>`
});

};
