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

};
