"use strict";
window.PageInit["files"] = function(){
const K = window.CollKit;
const { esc, modeCfg, notepad, csvTable, cells, row } = K;
const $id = (s) => document.getElementById(s);

/* Підсвітка: власний список слів цієї теми — ключові слова й функції, що
   трапляються в її прикладах (with / as / try / except, open / write / csv тощо).
   Якщо в новому прикладі з'явиться інше слово (range, join, while …), додай його сюди. */
const hl = K.makeHl(
  /\b(for|in|if|else|not|and|or|True|False|None|lambda|import|from|with|as|try|except|pass)\b/g,
  /\b(print|len|sorted|int|repr|open|read|readlines|write|close|rstrip|append|split|exists|read_text|Path|reader|DictReader|DictWriter|writeheader|writerow|FileNotFoundError|key)\b/g);
const createPlayer = K.makePlayer({ hl, tick:700 });

/* ================= спільне ================= */
const NAMES = "Оля\nІван\nПетро\n";
const TRACE = "Traceback (most recent call last):";
/* рядок у стилі чипів сайту: з лапками й видимим \n; лапки подвійні,
   а якщо всередині є " (і немає '), одинарні: '"Іваненко, Оля"' — так само вибирає лапки й repr у Python.
   Коли є обидва види лапок, Python ще й екранує лапку-обмежувач — для даних цієї сторінки це не потрібно. */
const pyStr  = (s) => { const q = s.includes('"') && !s.includes("'") ? "'" : '"';
  return q + s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n") + q; };
const pyList = (a) => "[" + a.map(pyStr).join(", ") + "]";
/* список рядків так, як його друкує print: в одинарних лапках */
const pyRow  = (a) => "[" + a.map(x=>`'${x}'`).join(", ") + "]";
/* межі рядків файлу [від, до): кожен разом зі своїм \n */
function lineSpans(text){
  const out = [];
  let a = 0;
  for(let k = 0; k < text.length; k++) if(text[k] === "\n"){ out.push([a, k + 1]); a = k + 1; }
  if(a < text.length) out.push([a, text.length]);
  return out;
}
const file  = (name, mode, text, pos, marks) => ({name, mode, text, pos, marks: marks || []});
const V     = (name, val, cls) => ({name, val, cls: cls || ""});
/* змінна f: відкритий чи закритий файл */
const fv    = (name, mode) => V("f", mode ? `файл ${name} (${mode})` : `файл ${name} (закрито)`, mode ? "i" : "");
const stack = (...parts) => `<div class="np-stack">${parts.join("")}</div>`;

/* ================= 6.2 open і режими ================= */
createPlayer($id("files-w-modes"), {
  config:`<span class="seg">
      <button data-mode="w" aria-pressed="true">"w"</button>
      <button data-mode="a" aria-pressed="false">"a"</button>
      <button data-mode="r" aria-pressed="false">"r"</button>
    </span>`,
  readCfg:(r)=>({mode:modeCfg(r)}),
  build:({mode})=>{
    const code = [
      `f = open("names.txt", "${mode}", encoding="utf-8")`,
      `f.write("Ніна\\n")`,
      `f.close()`,
      `print("готово")`
    ];
    const N = NAMES.length, ADD = "Ніна\n";
    const on = [fv("names.txt", mode)], off = [fv("names.txt", null)];
    const frames = [];

    if(mode === "r"){
      const err = [TRACE, "io.UnsupportedOperation: not writable"];
      const same = file("names.txt", "r", NAMES, 0);
      frames.push({line:0, vars:on, out:[], file:same,
        note:`"r" (read) — тільки читання. Це режим за замовчуванням: open("names.txt") без другого аргументу означає те саме.`});
      frames.push({line:1, vars:on, out:err, file:same, kind:"end",
        note:`Файл відкрито лише для читання, тож write падає з помилкою. Вміст файлу не змінився.`});
      frames.push({line:2, vars:on, out:err, file:same, kind:"end",
        note:`До close() черга так і не дійшла: програма впала раніше, і файл лишився відкритим. Цю проблему розв'язує with — про нього в наступному розділі.`});
      return {code, frames};
    }

    if(mode === "w"){
      frames.push({line:0, vars:on, out:[], file:file("names.txt", "w", NAMES, 0, [{from:0, to:N, cls:"gone"}]),
        note:`До запуску у файлі були три імена. open(…, "w") відкриває файл на запис і першим ділом стирає все, що в ньому було, — ще до того, як ми щось записали.`});
      frames.push({line:1, vars:on, out:[], file:file("names.txt", "w", ADD, ADD.length, [{from:0, to:ADD.length, cls:"new"}]),
        note:`write пише рядок туди, де стоїть каретка, — на початок порожнього файлу. \\n у кінці ми дописали самі: write його не додає.`});
    }else{
      frames.push({line:0, vars:on, out:[], file:file("names.txt", "a", NAMES, N),
        note:`Режим "a" (append — дописати) вміст не чіпає, а ставить каретку в самий кінець файлу.`});
      frames.push({line:1, vars:on, out:[], file:file("names.txt", "a", NAMES + ADD, N + ADD.length, [{from:N, to:N + ADD.length, cls:"new"}]),
        note:`Нове ім'я лягає після трьох старих.`});
    }
    const text = mode === "w" ? ADD : NAMES + ADD;
    frames.push({line:2, vars:off, out:[], file:file("names.txt", null, text, null),
      note:`close() закриває файл. Тепер записане точно на диску, а писати через f більше не можна.`});
    frames.push({line:3, vars:off, out:["готово"], file:file("names.txt", null, text, null), kind:"end",
      note: mode === "w"
        ? `Від трьох імен не лишилось нічого — у файлі тільки «Ніна». Режим "w" не питає, чи ти впевнений.`
        : `Тепер у файлі чотири імена. Запусти програму ще раз — буде п'ять: "a" дописує при кожному запуску.`});
    return {code, frames};
  },
  sizeVariants:()=>["w","a","r"].map(mode=>({mode})),
  extra:(f)=> notepad(f.file)
});

/* ================= 6.3 with ================= */
createPlayer($id("files-w-with"), {
  config:`<span class="seg">
      <button data-mode="close" aria-pressed="true">open … close()</button>
      <button data-mode="with" aria-pressed="false">with</button>
    </span>`,
  readCfg:(r)=>({mode:modeCfg(r)}),
  build:({mode})=>{
    const W = mode === "with";
    const code = W ? [
      `with open("names.txt", "a", encoding="utf-8") as f:`,
      `    f.write("Ніна\\n")`,
      `    f.write(100)`,
      `print("сюди не дійдемо")`
    ] : [
      `f = open("names.txt", "a", encoding="utf-8")`,
      `f.write("Ніна\\n")`,
      `f.write(100)`,
      `f.close()`
    ];
    const N = NAMES.length, TEXT = NAMES + "Ніна\n";
    const on = [fv("names.txt", "a")];
    const err = [TRACE, "TypeError: write() argument must be str, not int"];
    /* головна різниця: після помилки файл з with закритий, а без with — ні */
    const after = W ? [fv("names.txt", null)] : on;
    const fileAfter = file("names.txt", W ? null : "a", TEXT, W ? null : TEXT.length);
    return {code, frames:[
      {line:0, vars:on, out:[], file:file("names.txt", "a", NAMES, N),
        note: W ? `with відкриває файл і дає йому ім'я f — до кінця блоку з відступом.`
                : `Відкриваємо файл на дописування — каретка в кінці.`},
      {line:1, vars:on, out:[], file:file("names.txt", "a", TEXT, TEXT.length, [{from:N, to:TEXT.length, cls:"new"}]),
        note:`Перший запис проходить як слід.`},
      {line:2, vars:after, out:err, file:fileAfter, kind:"end",
        note: W ? `Та сама помилка: write приймає тільки рядки. Але, виходячи з блоку with — навіть через помилку, — Python сам закриває файл. Подивись на шапку блокнота: «закрито».`
                : `write приймає тільки рядки, тому 100 — помилка. Програма падає, а файл лишається відкритим: подивись на шапку блокнота.`},
      {line:3, vars:after, out:err, file:fileAfter, kind:"end",
        note: W ? `print не виконався — програма впала. Зате «Ніна» вже у файлі, і файл закрито як слід.`
                : `f.close() так і не виконався. Коли програма завершиться, Python прибере за нею, але в довгій програмі такі «забуті» файли накопичуються, а записане може ще не дійти до диска.`}
    ]};
  },
  extra:(f)=> notepad(f.file)
});

/* ================= 6.4 читання ================= */
createPlayer($id("files-w-read"), {
  config:`<span class="seg">
      <button data-mode="read" aria-pressed="true">read()</button>
      <button data-mode="for" aria-pressed="false">for line in f</button>
      <button data-mode="strip" aria-pressed="false">for + rstrip()</button>
      <button data-mode="lines" aria-pressed="false">readlines()</button>
    </span>`,
  readCfg:(r)=>({mode:modeCfg(r)}),
  build:({mode})=>{
    const N = NAMES.length, first = `with open("names.txt", encoding="utf-8") as f:`;
    const on = fv("names.txt", "r"), off = fv("names.txt", null);
    const all = [{from:0, to:N, cls:"read"}];
    const closed = file("names.txt", null, NAMES, null);
    const frames = [{line:0, vars:[on], out:[], file:file("names.txt", "r", NAMES, 0),
      note:`Файл відкрито на читання — каретка стоїть на самому початку.`}];

    if(mode === "read"){
      const code = [first, `    text = f.read()`, `    again = f.read()`, `print(text)`, `print(repr(again))`];
      const T = V("text", pyStr(NAMES), "j"), A = V("again", `""`, "j");
      frames.push({line:1, vars:[on, T], out:[], file:file("names.txt", "r", NAMES, N, all),
        note:`read() забирає весь файл одним рядком — разом із символами \\n. Каретка доїхала до кінця.`});
      frames.push({line:2, vars:[on, T, A], out:[], file:file("names.txt", "r", NAMES, N, all),
        note:`Другий read() читає з того місця, де стоїть каретка, — а вона вже в кінці. Читати нічого, тож повертається порожній рядок. Сам файл назад не перемотується.`});
      frames.push({line:3, vars:[off, T, A], out:["Оля", "Іван", "Петро", ""], file:closed,
        note:`Блок with скінчився — файл закрито, а text лишився. print(text) друкує три рядки, а \\n з кінця файлу плюс власний перенос print дають порожній рядок унизу.`});
      frames.push({line:4, vars:[off, T, A], out:["Оля", "Іван", "Петро", "", "''"], file:closed, kind:"end",
        note:`repr() показує рядок разом із лапками: '' — порожньо. Друга спроба справді нічого не прочитала.`});
      return {code, frames};
    }

    if(mode === "lines"){
      const code = [first, `    lines = f.readlines()`, `print(lines)`];
      const L = V("lines", pyList(lineSpans(NAMES).map(([a, b])=>NAMES.slice(a, b))), "j");
      frames.push({line:1, vars:[on, L], out:[], file:file("names.txt", "r", NAMES, N, all),
        note:`readlines() теж читає весь файл, але віддає не один рядок, а список — по елементу на кожен рядок файлу.`});
      frames.push({line:2, vars:[off, L], out:["['Оля\\n', 'Іван\\n', 'Петро\\n']"], file:closed, kind:"end",
        note:`\\n лишився в кожному елементі. Щоб його позбутись, рядки все одно доведеться пройти циклом із rstrip(), тому частіше одразу пишуть for line in f.`});
      return {code, frames};
    }

    const strip = mode === "strip";
    const code = [first, `    for line in f:`, strip ? `        print(line.rstrip())` : `        print(line)`];
    const out = [];
    let last = null;
    lineSpans(NAMES).forEach(([a, b], k)=>{
      const s = NAMES.slice(a, b), read = [{from:a, to:b, cls:"read"}];
      last = V("line", pyStr(s), "j");
      frames.push({line:1, vars:[on, last], out:[...out], file:file("names.txt", "r", NAMES, b, read),
        note: k === 0 ? `for бере з файлу по одному рядку. У line потрапляє ${pyStr(s)} — разом із символом кінця рядка.`
                      : `Наступний рядок: ${pyStr(s)}. Каретка посунулась далі.`});
      out.push(s.replace(/\n$/, ""));
      if(!strip) out.push("");
      frames.push({line:2, vars:[on, last], out:[...out], file:file("names.txt", "r", NAMES, b, read),
        note: strip
          ? (k === 0 ? `rstrip() відрізає з правого краю пробіли й \\n. print отримує чисте ім'я — порожніх рядків немає.` : `Ще одне чисте ім'я.`)
          : (k === 0 ? `print друкує рядок, у якому вже є \\n, і додає ще свій. Два переноси — і після імені з'являється порожній рядок.` : `Знову два переноси — знову порожній рядок.`)});
    });
    frames.push({line:1, vars:[off, last], out:[...out], file:closed, kind:"end",
      note: strip
        ? `Рядки скінчились, with закрив файл. Звичка «прочитав рядок — одразу rstrip()» рятує і від порожніх рядків, і від зайвого \\n у порівняннях.`
        : `Рядки скінчились — цикл завершився, а with закрив файл. Порожні рядки у виводі — це ті самі \\n із файлу.`});
    return {code, frames};
  },
  extra:(f)=> notepad(f.file)
});

/* ================= 6.5 читаємо в список і сортуємо ================= */
createPlayer($id("files-w-sort"), {
  build:()=>{
    const code = [
      `names = []`,
      `with open("names.txt", encoding="utf-8") as f:`,
      `    for line in f:`,
      `        names.append(line.rstrip())`,
      `for name in sorted(names):`,
      `    print("привіт,", name)`
    ];
    const names = [], frames = [], out = [];
    const L = () => V("names", pyList(names), "i");
    const on = fv("names.txt", "r"), off = fv("names.txt", null);
    const closed = file("names.txt", null, NAMES, null);
    frames.push({line:0, vars:[L()], out:[], names:[], file:closed,
      note:`Порожній список — сюди складемо імена з файлу.`});
    frames.push({line:1, vars:[L(), on], out:[], names:[], file:file("names.txt", "r", NAMES, 0),
      note:`Відкриваємо файл на читання.`});
    lineSpans(NAMES).forEach(([a, b], k)=>{
      const s = NAMES.slice(a, b), name = s.replace(/\n$/, "");
      const fl = file("names.txt", "r", NAMES, b, [{from:a, to:b, cls:"read"}]);
      const LN = V("line", pyStr(s), "j");
      frames.push({line:2, vars:[L(), on, LN], out:[], names:[...names], file:fl,
        note:`Беремо рядок ${pyStr(s)}.`});
      names.push(name);
      frames.push({line:3, vars:[L(), on, LN], out:[], names:[...names], add:names.length - 1, file:fl,
        note: k === 0 ? `rstrip() відрізає \\n, і в список іде чисте ім'я. Без rstrip у виводі й у порівняннях на кшталт "Оля" in names лишився б невидимий \\n, і вони б ламались.`
                      : `"${name}" — у список.`});
    });
    const sorted = [...names].sort();
    frames.push({line:4, vars:[L(), off], out:[], names:[...names], file:closed,
      note:`Файл уже закрито — далі звичайний список. sorted(names) повертає новий, відсортований список: ${sorted.join(", ")}. Сам names не змінюється.`});
    sorted.forEach((name, k)=>{
      const end = k === sorted.length - 1;
      out.push(`привіт, ${name}`);
      frames.push({line:5, vars:[L(), off, V("name", pyStr(name), "j")], out:[...out], names:[...names], file:closed,
        kind: end ? "end" : undefined,
        note: end ? `Імена з файлу — за алфавітом.` : `Вітаємо: ${name}.`});
    });
    return {code, frames};
  },
  extra:(f)=> stack(notepad(f.file),
    row("names", cells(f.names, {state: f.add != null ? {[f.add]:"now"} : {}})))
});

/* ================= 6.6 коли файлу немає ================= */
createPlayer($id("files-w-missing"), {
  config:`<span class="seg">
      <button data-mode="have" data-group="file" aria-pressed="true">файл є</button>
      <button data-mode="none" data-group="file" aria-pressed="false">файлу немає</button>
    </span>
    <span class="seg">
      <button data-mode="plain" data-group="guard" aria-pressed="true">без try</button>
      <button data-mode="try" data-group="guard" aria-pressed="false">з try</button>
    </span>`,
  readCfg:(r)=>({have: modeCfg(r, "file") === "have", guard: modeCfg(r, "guard") === "try"}),
  build:({have, guard})=>{
    const N = NAMES.length, names = ["Оля", "Іван", "Петро"];
    const gone = {name:"names.txt", missing:true};
    const on = fv("names.txt", "r"), off = fv("names.txt", null);
    const opened = file("names.txt", "r", NAMES, 0);
    const read = file("names.txt", "r", NAMES, N, [{from:0, to:N, cls:"read"}]);
    const closed = file("names.txt", null, NAMES, null);
    const ERR = "FileNotFoundError: [Errno 2] No such file or directory: 'names.txt'";
    const frames = [];

    if(!guard){
      const code = [
        `with open("names.txt", encoding="utf-8") as f:`,
        `    print(f.read().rstrip())`,
        `print("кінець програми")`
      ];
      if(have){
        frames.push({line:0, vars:[on], out:[], file:opened, note:`Файл є — open спокійно його відкриває.`});
        frames.push({line:1, vars:[on], out:[...names], file:read, note:`read() забрав увесь текст, rstrip() зрізав останній \\n.`});
        frames.push({line:2, vars:[off], out:[...names, "кінець програми"], file:closed, kind:"end",
          note:`Програма дійшла до кінця.`});
      }else{
        const out = [TRACE, ERR];
        frames.push({line:0, vars:[], out, file:gone, kind:"end",
          note:`Файлу немає, і open падає з FileNotFoundError прямо на першому рядку.`});
        frames.push({line:2, vars:[], out, file:gone, kind:"end",
          note:`До останнього рядка програма так і не дійшла.`});
      }
      return {code, frames};
    }

    const code = [
      `try:`,
      `    with open("names.txt", encoding="utf-8") as f:`,
      `        print(f.read().rstrip())`,
      `except FileNotFoundError:`,
      `    print("файлу names.txt немає")`,
      `print("кінець програми")`
    ];
    frames.push({line:0, vars:[], out:[], file: have ? closed : gone,
      note:`try: — «спробуй виконати цей блок». Якщо в ньому станеться помилка, Python пошукає відповідний except.`});
    if(have){
      frames.push({line:1, vars:[on], out:[], file:opened, note:`Файл є — відкрився.`});
      frames.push({line:2, vars:[on], out:[...names], file:read, note:`Читаємо й друкуємо вміст.`});
      frames.push({line:5, vars:[off], out:[...names, "кінець програми"], file:closed, kind:"end",
        note:`Помилки не було, тож блок except пропущено повністю.`});
    }else{
      frames.push({line:1, vars:[], out:[], file:gone,
        note:`open не знаходить файлу й кидає FileNotFoundError. Але програма не падає: помилка сталась усередині try.`});
      frames.push({line:3, vars:[], out:[], file:gone,
        note:`except FileNotFoundError ловить саме цю помилку. Решта блоку try пропускається.`});
      frames.push({line:4, vars:[], out:["файлу names.txt немає"], file:gone,
        note:`Замість трейсбеку — зрозуміле повідомлення.`});
      frames.push({line:5, vars:[], out:["файлу names.txt немає", "кінець програми"], file:gone, kind:"end",
        note:`І програма спокійно йде далі.`});
    }
    return {code, frames};
  },
  sizeVariants:({guard})=>[{have:true,guard},{have:false,guard}],
  extra:(f)=> notepad(f.file)
});

/* ================= 6.7 де шукається файл ================= */
/* дерево папок: рядки {depth, name, dir, cls, tag} */
function tree(rows){
  return `<div class="ftree">` + rows.map(r=>
    `<div class="ft-row d${r.depth}${r.dir ? " dir" : ""}${r.cls ? " " + r.cls : ""}">` +
    `<span class="ft-ico" aria-hidden="true">${r.dir ? "▾" : "·"}</span>` +
    `<span class="ft-name">${esc(r.name)}${r.dir ? "/" : ""}</span>` +
    (r.tag ? `<span class="ft-tag">${esc(r.tag)}</span>` : "") + `</div>`).join("") + `</div>`;
}
/* where — звідки запущено ("proj" чи "data"); look — чи вже шукаємо файл */
function pathTree(where, look){
  const fromData = where === "data";
  const rows = [
    {depth:0, name:"project", dir:true, tag: fromData ? "" : "тут запущено"},
    {depth:1, name:"main.py"},
    {depth:1, name:"data", dir:true, tag: fromData ? "тут запущено" : ""},
    {depth:2, name:"names.txt", cls: look && !fromData ? "hit" : "", tag: look && !fromData ? "знайдено" : ""}
  ];
  if(look && fromData) rows.push(
    {depth:2, name:"data", dir:true, cls:"ft-ghost"},
    {depth:3, name:"names.txt", cls:"ft-ghost", tag:"шукаємо тут — немає"});
  return tree(rows);
}

createPlayer($id("files-w-path"), {
  config:`<span class="seg">
      <button data-mode="proj" aria-pressed="true">запущено з project/</button>
      <button data-mode="data" aria-pressed="false">запущено з data/</button>
    </span>`,
  readCfg:(r)=>({where:modeCfg(r)}),
  build:({where})=>{
    const fromData = where === "data";
    const code = [
      `from pathlib import Path`,
      `path = Path("data") / "names.txt"`,
      `if path.exists():`,
      `    print(path.read_text(encoding="utf-8").rstrip())`,
      `else:`,
      `    print("файлу немає")`
    ];
    const P = V("path", `Path("data/names.txt")`, "i");
    const frames = [
      {line:0, vars:[], out:[], where, look:false,
        note:`pathlib — модуль для роботи зі шляхами, Path — його головний тип. Програму запустили з папки ${fromData ? "data/" : "project/"}.`},
      {line:1, vars:[P], out:[], where, look:false,
        note:`Оператор / склеює частини шляху. Роздільник Python підставить сам: / на macOS і Linux, \\ на Windows.`},
      {line:2, vars:[P], out:[], where, look:true,
        note: fromData
          ? `Шлях відносний, тож рахується від папки запуску: data/ → data/ → names.txt. Такого файлу немає, хоча names.txt лежить просто поруч!`
          : `Шлях відносний, тож рахується від папки запуску: project/ → data/ → names.txt. Файл є — exists() повертає True.`}
    ];
    if(fromData) frames.push({line:5, vars:[P], out:["файлу немає"], where, look:true, kind:"end",
      note:`Без перевірки exists() тут було б FileNotFoundError — «хоча файл же є»: відносний шлях залежить від того, звідки запустили програму, а не від того, де лежить .py-файл.`});
    else frames.push({line:3, vars:[P], out:["Оля", "Іван", "Петро"], where, look:true, kind:"end",
      note:`read_text() відкриває, читає й закриває файл одним викликом — with тут не потрібен.`});
    return {code, frames};
  },
  sizeVariants:()=>[{where:"proj"},{where:"data"}],
  extra:(f)=> pathTree(f.where, f.look)
});

/* ================= 6.9 чому не split ================= */
const QUOTED = `name,class,grade\n"Іваненко, Оля",9-А,11\nПетро,9-Б,9\n`;
/* ті самі рядки так, як їх розбирає csv.reader: кома в лапках — частина значення */
const QUOTED_ROWS = [["name", "class", "grade"], ["Іваненко, Оля", "9-А", "11"], ["Петро", "9-Б", "9"]];
/* поля рядка в комірках; лапки як у Python: '"Іваненко' */
const fields = (parts, st) => `<div class="lst">` + parts.map((p, i)=>
  `<div class="cellw"><div class="cell ${st[i] || ""}">${esc(`'${p}'`)}</div><div class="ix">${i}</div></div>`).join("") + `</div>`;

createPlayer($id("files-w-split"), {
  config:`<span class="seg">
      <button data-mode="split" aria-pressed="true">split(",")</button>
      <button data-mode="csv" aria-pressed="false">csv.reader</button>
    </span>`,
  readCfg:(r)=>({mode:modeCfg(r)}),
  build:({mode})=>{
    const useCsv = mode === "csv";
    const code = useCsv ? [
      `import csv`,
      `with open("students.csv", encoding="utf-8") as f:`,
      `    for row in csv.reader(f):`,
      `        print(len(row), row)`
    ] : [
      `with open("students.csv", encoding="utf-8") as f:`,
      `    for line in f:`,
      `        row = line.rstrip().split(",")`,
      `        print(len(row), row)`
    ];
    const on = fv("students.csv", "r"), off = fv("students.csv", null);
    const frames = [], out = [];
    if(useCsv) frames.push({line:0, vars:[], out:[], file:file("students.csv", null, QUOTED, null), parts:null,
      note:`csv — модуль стандартної бібліотеки, встановлювати нічого не треба.`});
    frames.push({line: useCsv ? 1 : 0, vars:[on], out:[], file:file("students.csv", "r", QUOTED, 0), parts:null,
      note:`Файл відкрито. У другому рядку прізвище й ім'я взято в лапки: всередині значення є кома.`});
    lineSpans(QUOTED).forEach(([a, b], k)=>{
      const s = QUOTED.slice(a, b), fl = file("students.csv", "r", QUOTED, b, [{from:a, to:b, cls:"read"}]);
      const parts = useCsv ? QUOTED_ROWS[k] : s.replace(/\n$/, "").split(",");
      const bad = parts.length !== 3;
      const st = {};
      if(bad) parts.forEach((p, i)=>{ if(p.includes('"')) st[i] = "warn"; });
      const R = V("row", pyRow(parts), bad ? "n" : "j");
      const LN = V("line", pyStr(s), "j");
      if(!useCsv) frames.push({line:1, vars:[on, LN], out:[...out], file:fl, parts:null,
        note: k === 0 ? `Перший рядок — заголовок із назвами стовпців.` : `Наступний рядок файлу.`});
      frames.push({line:2, vars: useCsv ? [on, R] : [on, LN, R], out:[...out], file:fl, parts, st,
        note: useCsv
          ? [`csv.reader сам ділить рядок на поля й віддає список. Заголовок — звичайний перший рядок.`,
             `Кома всередині лапок — частина значення, а не роздільник. Лапки csv.reader прибрав: 'Іваненко, Оля' — одне поле.`,
             `Три поля, як і має бути.`][k]
          : [`split(",") ріже рядок на кожній комі. Заголовок без сюрпризів: три назви — три шматки.`,
             `Кома всередині лапок для split — така сама кома. Замість 3 полів вийшло 4, а лапки лишились усередині значень.`,
             `Тут ком у значеннях немає — знову три шматки.`][k]});
      out.push(`${parts.length} ${pyRow(parts)}`);
      frames.push({line:3, vars: useCsv ? [on, R] : [on, LN, R], out:[...out], file:fl, parts, st,
        note: bad ? `У row тепер 4 елементи замість трьох, тож row[1] — це ' Оля"', а не клас.` : `${parts.length} поля.`});
    });
    frames.push({line: useCsv ? 2 : 1, vars:[off], out:[...out], file:file("students.csv", null, QUOTED, null), parts:null, kind:"end",
      note: useCsv
        ? `Усі рядки — рівно по три поля. І ще дрібниця: rstrip() не знадобився, \\n csv.reader прибирає сам.`
        : `Досить одному значенню містити кому — і «таблиця» роз'їжджається. Тому CSV читають не split-ом, а модулем csv.`});
    return {code, frames};
  },
  sizeVariants:()=>[{mode:"split"},{mode:"csv"}],
  extra:(f)=> stack(notepad(f.file), f.parts ? row("row", fields(f.parts, f.st)) : "")
});

/* ================= 6.10 DictReader ================= */
const STUDENTS = `name,class,grade\nОля,9-А,11\nІван,9-Б,9\nНіна,9-А,12\n`;
const HEAD = ["name", "class", "grade"];
const ROWS = [["Оля", "9-А", "11"], ["Іван", "9-Б", "9"], ["Ніна", "9-А", "12"]];
const rowDict = (r) => "{" + HEAD.map((h, i)=>`"${h}": "${r[i]}"`).join(", ") + "}";

createPlayer($id("files-w-dict"), {
  config:`<span class="seg">
      <button data-mode="str" aria-pressed="true">s["grade"]</button>
      <button data-mode="int" aria-pressed="false">int(s["grade"])</button>
    </span>`,
  readCfg:(r)=>({mode:modeCfg(r)}),
  build:({mode})=>{
    const asInt = mode === "int";
    const code = [
      `import csv`,
      `students = []`,
      `with open("students.csv", encoding="utf-8") as f:`,
      `    for row in csv.DictReader(f):`,
      `        students.append(row)`,
      `for s in sorted(students, key=lambda s: ${asInt ? `int(s["grade"])` : `s["grade"]`}):`,
      `    print(s["name"], s["grade"])`
    ];
    const spans = lineSpans(STUDENTS);
    const on = fv("students.csv", "r"), off = fv("students.csv", null);
    const S = (n) => V("students", "[" + new Array(n).fill("{…}").join(", ") + "]", "i");
    const closed = file("students.csv", null, STUDENTS, null);
    const frames = [], out = [];
    frames.push({line:0, vars:[], out:[], file:closed, table:false, note:`Підключаємо модуль csv.`});
    frames.push({line:1, vars:[S(0)], out:[], file:closed, table:false, note:`Порожній список для учнів.`});
    frames.push({line:2, vars:[S(0), on], out:[], file:file("students.csv", "r", STUDENTS, 0), table:false,
      note:`Відкриваємо файл на читання.`});
    frames.push({line:3, vars:[S(0), on], out:[], table:true, rows:[], cur:null,
      file:file("students.csv", "r", STUDENTS, spans[0][1], [{from:spans[0][0], to:spans[0][1], cls:"read"}]),
      note:`DictReader першим ділом забирає рядок-заголовок: name, class і grade стануть ключами словників.`});
    ROWS.forEach((r, k)=>{
      const [a, b] = spans[k + 1];
      const fl = file("students.csv", "r", STUDENTS, b, [{from:a, to:b, cls:"read"}]);
      const R = V("row", rowDict(r), "j"), rows = ROWS.slice(0, k + 1);
      frames.push({line:3, vars:[S(k), on, R], out:[], file:fl, table:true, rows, cur:k,
        note: k === 0 ? `Кожен наступний рядок стає словником: ключі із заголовка, значення з рядка. Зверни увагу на "11" у лапках: з файлу все приходить рядками.`
                      : `Наступний рядок — наступний словник.`});
      frames.push({line:4, vars:[S(k + 1), on, R], out:[], file:fl, table:true, rows, cur:k,
        note: k === 0 ? `Словник іде в список students.` : `І він теж — у список.`});
    });
    /* порівняння як у Python: рядки — посимвольно, числа — за значенням */
    const by = (r) => asInt ? Number(r[2]) : r[2];
    const sorted = [...ROWS].sort((x, y)=> by(x) < by(y) ? -1 : by(x) > by(y) ? 1 : 0);
    frames.push({line:5, vars:[S(3), off], out:[], file:closed, table:true, rows:ROWS, cur:null,
      note: asInt ? `int(s["grade"]) перетворює оцінку на число перед порівнянням — і 9 < 11 < 12, як і має бути.`
                  : `sorted порівнює s["grade"], а це рядки. Рядки порівнюються посимвольно, як слова в словнику: "11" < "12" < "9", бо "1" менше за "9".`});
    sorted.forEach((r, k)=>{
      const end = k === sorted.length - 1;
      out.push(`${r[0]} ${r[2]}`);
      frames.push({line:6, vars:[S(3), off, V("s", rowDict(r), "j")], out:[...out], file:closed,
        table:true, rows:ROWS, cur:ROWS.indexOf(r), kind: end ? "end" : undefined,
        note: !end ? `${r[0]}: оцінка ${r[2]}.`
          : asInt ? `Порядок правильний: від меншої оцінки до більшої.`
                  : `Іван із дев'яткою опинився останнім. Числа з CSV завжди приходять рядками — перетвори їх через int(), перш ніж порівнювати чи рахувати.`});
    });
    return {code, frames};
  },
  extra:(f)=> stack(notepad(f.file), f.table ? csvTable(HEAD, f.rows, f.cur) : "")
});

/* ================= 6.11 запис CSV ================= */
createPlayer($id("files-w-write"), {
  build:()=>{
    const code = [
      `import csv`,
      `students = [{"name": "Оля", "grade": 11}, {"name": "Іван", "grade": 9}]`,
      `with open("grades.csv", "w", encoding="utf-8", newline="") as f:`,
      `    writer = csv.DictWriter(f, fieldnames=["name", "grade"])`,
      `    writer.writeheader()`,
      `    for s in students:`,
      `        writer.writerow(s)`
    ];
    const DATA = [["Оля", 11], ["Іван", 9]];
    const ST = V("students", `[{"name": "Оля", "grade": 11}, {"name": "Іван", "grade": 9}]`, "i");
    const WR = V("writer", `DictWriter(fieldnames=["name", "grade"])`, "j");
    const on = fv("grades.csv", "w"), off = fv("grades.csv", null);
    const none = {name:"grades.csv", missing:true};
    let text = "";
    /* дописує рядок у файл і віддає підсвітку саме цього шматка */
    const put = (add) => { const from = text.length; text += add; return [{from, to:text.length, cls:"new"}]; };
    const frames = [];
    frames.push({line:0, vars:[], out:[], file:none, note:`Підключаємо модуль csv. Файлу grades.csv поки немає.`});
    frames.push({line:1, vars:[ST], out:[], file:none, note:`Дані, які треба зберегти: список словників.`});
    frames.push({line:2, vars:[ST, on], out:[], file:file("grades.csv", "w", "", 0),
      note:`Режим "w" створює порожній файл. newline="" для CSV обов'язковий — чому, пояснено під віджетом.`});
    frames.push({line:3, vars:[ST, on, WR], out:[], file:file("grades.csv", "w", "", 0),
      note:`DictWriter пише у файл f, а fieldnames задає стовпці і їхній порядок.`});
    let m = put("name,grade\n");
    frames.push({line:4, vars:[ST, on, WR], out:[], file:file("grades.csv", "w", text, text.length, m),
      note:`writeheader() записує рядок-заголовок із назв стовпців.`});
    let S = null;
    DATA.forEach(([name, grade], k)=>{
      S = V("s", `{"name": "${name}", "grade": ${grade}}`, "j");
      frames.push({line:5, vars:[ST, on, WR, S], out:[], file:file("grades.csv", "w", text, text.length),
        note:`Беремо наступний словник.`});
      m = put(`${name},${grade}\n`);
      frames.push({line:6, vars:[ST, on, WR, S], out:[], file:file("grades.csv", "w", text, text.length, m),
        note: k === 0 ? `writerow бере значення зі словника в порядку fieldnames і сам ставить коми. Число 11 у файлі стало текстом. (Блокнот показує ↵, а csv насправді пише \\r\\n — див. зауваження під віджетом.)`
                      : `Ще один рядок таблиці.`});
    });
    frames.push({line:6, vars:[ST, off, WR, S], out:[], file:file("grades.csv", null, text, null), kind:"end",
      note:`Блок with закрив файл. Такий CSV відкриється в Python і в Google Таблицях.`});
    return {code, frames};
  },
  extra:(f)=> notepad(f.file)
});

/* ================= hero ================= */
(function(){
  const box = $id("files-heroBox"), line = $id("files-heroLine"), btn = $id("files-heroBtn");
  if(!box) return;
  const WHO = ["Оля", "Іван", "Петро"];
  const show = (st) => { box.innerHTML = notepad(st); };
  show({name:"names.txt", mode:null, text:"", pos:null});
  let t = null;
  function run(){
    clearInterval(t);
    let k = 0, text = "";
    show({name:"names.txt", mode:"w", text:"", pos:0});
    line.innerHTML = `f = open("names.txt", "w", encoding="utf-8")`;
    t = setInterval(()=>{
      if(k < WHO.length){
        const add = WHO[k] + "\n", from = text.length;
        text += add;
        show({name:"names.txt", mode:"w", text, pos:text.length, marks:[{from, to:text.length, cls:"new"}]});
        line.innerHTML = `f.write(<b>"${WHO[k]}\\n"</b>)`;
        k++;
        return;
      }
      clearInterval(t); t = null;
      show({name:"names.txt", mode:null, text, pos:null});
      line.innerHTML = `програма завершилась: змінні зникли, а <b>файл лишився</b>`;
    }, 1100);
  }
  btn.onclick = run;
  let auto = null;
  /* запуск і зупинку веде роутер: сторінки лишаються в DOM, тож анімацію
     схованої теми треба гасити, а при повторному заході — заводити знову */
  window.registerAnim({
    el: btn,
    stop(){ clearInterval(t); t = null; clearTimeout(auto); auto = null; },
    start(){ clearTimeout(auto); auto = setTimeout(run, 600); }
  });
})();

};
