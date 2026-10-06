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
/* рядок так, як його показує Python: з лапками й видимим \n */
const pyStr  = (s) => `"${s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n")}"`;
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
        note: k === 0 ? `rstrip() відрізає \\n, і в список іде чисте ім'я. Без rstrip сортування й порівняння спотикались би об невидимий символ.`
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
  extra:(f)=> notepad(f.file)
});

};
