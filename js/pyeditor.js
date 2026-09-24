/* ==========================================================================
   Спільний рушій для сторінок з живим Python-редактором (Pyodide в браузері):
   підсвітка синтаксису, автодоповнення, поведінка Tab/Enter/Ctrl+Enter.
   Використовується і в практиці «Оживи магазин» (js/pages/shop.js),
   і в самостійних роботах (js/checks/engine.js) — щоб редактор виглядав
   і поводився однаково в обох місцях.
   ========================================================================== */
"use strict";
window.PyEditor = (function(){

const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ============================ завантаження Pyodide ============================ */
const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";

function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("не вдалося завантажити " + src));
    document.head.appendChild(s);
  });
}

/* Кілька сторінок можуть потребувати Python в одній вкладці — інтерпретатор
   вантажиться й стартує лише один раз, а не по разу на кожну сторінку. */
let pyodidePromise = null;
function bootPyodide(){
  if(!pyodidePromise) pyodidePromise = (async () => {
    if(!window.loadPyodide) await loadScript(PYODIDE_URL);
    return window.loadPyodide();
  })();
  return pyodidePromise;
}

/* ============================ підсвітка Python ============================ */
const PY_KW = new Set(("False None True and as assert break class continue def del elif else except " +
  "finally for from global if import in is lambda nonlocal not or pass raise return try while with yield").split(" "));
const PY_FN = new Set(("print len range sorted sum min max map filter any all enumerate zip list set dict " +
  "tuple str int float abs round reversed type isinstance append insert remove pop sort index count " +
  "NotImplementedError ValueError TypeError").split(" "));
const PY_TOKEN = /("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(#[^\n]*)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;

/* префікс f-рядка: f, F, rf, fr (у будь-якому регістрі) — одразу перед лапкою */
const FSTR_PREFIX = /^(?:[fF][rR]?|[rR][fF])$/;

/* f-рядок, як у VS Code: текст — зеленим, {вираз} — фігурні дужки окремим
   кольором, а вираз усередині підсвічується як звичайний код.
   {{ і }} — це екрановані дужки, тобто звичайний текст. */
function highlightFString(tok){
  let out = "", text = "", i = 0;
  const flush = () => { if(text) out += `<span class="str">${esc(text)}</span>`; text = ""; };
  while(i < tok.length){
    const ch = tok[i];
    if((ch === "{" || ch === "}") && tok[i + 1] === ch){ text += ch + ch; i += 2; continue; }
    if(ch !== "{"){ text += ch; i++; continue; }
    /* шукаємо парну } з урахуванням вкладених дужок і рядків усередині виразу */
    let j = i + 1, depth = 0, quote = null;
    for(; j < tok.length; j++){
      const c = tok[j];
      if(quote){ if(c === quote) quote = null; continue; }
      if(c === "'" || c === '"'){
        /* лапка того ж типу, що й у самого f-рядка, його закриває */
        if(c === tok[tok.length - 1] && j === tok.length - 1) break;
        quote = c; continue;
      }
      if(c === "(" || c === "[" || c === "{") depth++;
      else if(c === ")" || c === "]") depth--;
      else if(c === "}"){ if(depth === 0) break; depth--; }
    }
    flush();
    const closed = tok[j] === "}";
    out += `<span class="fmt">{</span>` + highlight(tok.slice(i + 1, j)) + (closed ? `<span class="fmt">}</span>` : "");
    i = closed ? j + 1 : j;
  }
  flush();
  return out;
}

function highlight(src){
  let out = "", last = 0, afterDef = false, fstr = false, m;
  const re = new RegExp(PY_TOKEN.source, "g");   /* свій — бо highlight рекурсивний (f-рядки) */
  while((m = re.exec(src))){
    out += esc(src.slice(last, m.index));
    last = re.lastIndex;
    const [tok, str, cmt, num, word] = m;
    if(str){
      out += fstr ? highlightFString(tok) : `<span class="str">${esc(tok)}</span>`;
      fstr = false;
    }
    else if(cmt) out += `<span class="cmt">${esc(tok)}</span>`;
    else if(num) out += `<span class="num">${tok}</span>`;
    else if(word){
      if(FSTR_PREFIX.test(word) && (src[last] === '"' || src[last] === "'")){
        out += `<span class="fpre">${tok}</span>`;
        fstr = true;
        continue;
      }
      if(afterDef){ out += `<span class="def">${tok}</span>`; afterDef = false; continue; }
      if(PY_KW.has(word)){ out += `<span class="kw">${tok}</span>`; afterDef = word === "def"; continue; }
      out += PY_FN.has(word) ? `<span class="fn">${tok}</span>` : tok;
    }
  }
  return out + esc(src.slice(last));
}

/* ============================ вставка тексту ============================ */
/* Вставка тексту на місце виділення. execCommand лишає зміну в історії Ctrl+Z;
   якщо його нема — вставляємо вручну. */
function insertText(ta, text){
  /* Стирання — через "delete": insertText з порожнім рядком у кінці тексту
     лишає курсор на попередньому рядку (Chrome), а delete ставить його туди,
     де був виділений фрагмент. */
  if(text === "" && ta.selectionStart === ta.selectionEnd) return;
  if(document.execCommand && document.execCommand(text === "" ? "delete" : "insertText", false, text)) return;
  const start = ta.selectionStart, v = ta.value;
  ta.value = v.slice(0, start) + text + v.slice(ta.selectionEnd);
  ta.selectionStart = ta.selectionEnd = start + text.length;
  ta.dispatchEvent(new Event("input"));
}

/* ============================ автодоповнення ============================ */
const AC_FUNCS = ("print len range sorted sum min max map filter any all enumerate zip list set dict " +
  "tuple str int float abs round reversed isinstance type").split(" ");
const AC_METHODS = "append insert remove pop sort index count copy extend clear reverse get keys values items".split(" ");
const AC_WORDS = ("def return for in if elif else while break continue and or not is " +
  "True False None pass lambda").split(" ");
const AC_BUILTIN = new Set([...AC_FUNCS, ...AC_METHODS, ...AC_WORDS, ...PY_KW]);
const AC_LIMIT = 8;

/* Проходить токенами й каже, чи позиція стоїть усередині рядка або коментаря,
   а заодно збирає всі імена, які вже є в коді. */
function scanCode(src, pos){
  const re = new RegExp(PY_TOKEN.source, "g");
  const names = new Set();
  let inside = false, m;
  while((m = re.exec(src))){
    const end = m.index + m[0].length;
    if((m[1] || m[2]) && m.index < pos && pos <= end) inside = true;
    if(m[4] && !AC_BUILTIN.has(m[4])) names.add(m[4]);
  }
  return { inside, names };
}

function suggest(src, caret, hiddenWords){
  if(/\w/.test(src[caret] || "")) return null;             /* курсор посеред слова */
  const prefix = (src.slice(0, caret).match(/[A-Za-z_]\w*$/) || [""])[0];
  const start = caret - prefix.length;
  const afterDot = src[start - 1] === ".";
  if(!afterDot && prefix.length < 2) return null;
  if(/\d/.test(prefix[0] || "")) return null;
  if(afterDot && /(^|[^\w])\d+$/.test(src.slice(0, start - 1))) return null;   /* 3.14 — це число */

  /* поточне недописане слово не повинно підказувати саме себе */
  const { inside, names } = scanCode(src.slice(0, start) + src.slice(caret), start);
  if(inside) return null;

  const pool = afterDot
    ? AC_METHODS.map(w => ({ w, kind:"метод", call:true, rank:0 }))
    : [...names].map(w => ({ w, kind:"з коду", rank:0 }))
        .concat(AC_FUNCS.map(w => ({ w, kind:"функція", call:true, rank:1 })),
                AC_WORDS.map(w => ({ w, kind:"слово", rank:2 })));
  const low = prefix.toLowerCase();
  const hidden = hiddenWords || new Set();
  const items = pool
    .filter(it => it.w !== prefix && !hidden.has(it.w) && it.w.toLowerCase().startsWith(low))
    .sort((a, b) => a.rank - b.rank || a.w.length - b.w.length || a.w.localeCompare(b.w))
    .slice(0, AC_LIMIT);
  return items.length ? { prefix, start, items } : null;
}

let measureCtx = null;
function charWidth(ta){
  const cs = getComputedStyle(ta);
  measureCtx = measureCtx || document.createElement("canvas").getContext("2d");
  measureCtx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return measureCtx.measureText("0000000000").width / 10;
}

function makeAutocomplete(ta, hiddenWords){
  const box = document.createElement("div");
  box.className = "pyac";
  box.setAttribute("role", "listbox");
  box.hidden = true;
  ta.parentNode.appendChild(box);

  let cur = null, sel = 0, accepting = false;

  function close(){ cur = null; box.hidden = true; }

  function paint(){
    box.innerHTML = cur.items.map((it, k) => `
      <div class="pyac-i${k === sel ? " on" : ""}" role="option" aria-selected="${k === sel}" data-k="${k}">
        <span class="pyac-w"><b>${esc(it.w.slice(0, cur.prefix.length))}</b>${esc(it.w.slice(cur.prefix.length))}${it.call ? "()" : ""}</span>
        <span class="pyac-k">${it.kind}</span>
      </div>`).join("");
  }

  function place(){
    const cs = getComputedStyle(ta);
    const before = ta.value.slice(0, cur.start);
    const line = before.split("\n").length - 1;
    const col = before.length - before.lastIndexOf("\n") - 1;
    const lh = parseFloat(cs.lineHeight);
    let left = parseFloat(cs.paddingLeft) + col * charWidth(ta) - ta.scrollLeft - 8;
    const top = parseFloat(cs.paddingTop) + (line + 1) * lh - ta.scrollTop + 2;
    left = Math.max(4, Math.min(left, ta.clientWidth - box.offsetWidth - 4));
    box.style.left = left + "px";
    box.style.top = top + "px";
  }

  function update(){
    if(ta.selectionStart !== ta.selectionEnd){ close(); return; }
    cur = suggest(ta.value, ta.selectionStart, hiddenWords);
    if(!cur){ close(); return; }
    sel = 0;
    paint();
    box.hidden = false;
    place();
  }

  function accept(k){
    const it = cur.items[k];
    const caret = ta.selectionStart;
    const hasParen = ta.value[caret] === "(";
    accepting = true;
    ta.setSelectionRange(cur.start, caret);
    insertText(ta, it.call && !hasParen ? it.w + "()" : it.w);
    /* курсор — між дужками, щоб одразу писати аргументи */
    if(it.call && !hasParen) ta.selectionStart = ta.selectionEnd = ta.selectionStart - 1;
    accepting = false;
    close();
  }

  /* true — клавішу забрало автодоповнення */
  function onKey(e){
    if(!cur) return false;
    if(e.key === "ArrowDown" || e.key === "ArrowUp"){
      const n = cur.items.length;
      sel = (sel + (e.key === "ArrowDown" ? 1 : n - 1)) % n;
      paint();
    }
    else if((e.key === "Enter" || e.key === "Tab") && !e.ctrlKey && !e.metaKey && !e.shiftKey) accept(sel);
    else if(e.key === "Escape") close();
    else {
      if(["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key) ||
         (e.key === "Enter")) close();
      return false;
    }
    e.preventDefault();
    e.stopPropagation();       /* Esc не має закривати ще й бічне меню */
    return true;
  }

  function onInput(e){
    if(accepting) return;
    const t = e.inputType || "";
    if(t === "insertText" || (t === "deleteContentBackward" && cur)) update();
    else close();
  }

  box.addEventListener("mousedown", (e) => {
    const row = e.target.closest("[data-k]");
    e.preventDefault();                   /* фокус лишається в редакторі */
    if(row) accept(+row.dataset.k);
  });
  ta.addEventListener("blur", close);
  ta.addEventListener("mousedown", close);
  ta.addEventListener("scroll", () => { if(cur) place(); });

  return { onKey, onInput };
}

/* ============================ парні дужки й лапки ============================ */
const PAIRS = { "(":")", "[":"]", "{":"}", "\"":"\"", "'":"'" };
const CLOSERS = new Set([")", "]", "}"]);
const WORD_CH = /[\p{L}\p{N}_]/u;

/* де стоїть позиція: "cmt" — у коментарі, "str" — усередині рядка
   (зокрема ще не закритого), null — у звичайному коді */
function contextAt(src, pos){
  const re = new RegExp(PY_TOKEN.source, "g");
  let m;
  while((m = re.exec(src)) && m.index < pos){
    const end = m.index + m[0].length;
    if(m[2] && pos <= end) return "cmt";
    if(m[1]){
      const tok = m[1], q3 = tok.slice(0, 3);
      const closed = q3 === '"""' || q3 === "'''"
        ? tok.length >= 6 && tok.endsWith(q3)
        : /^(["'])(?:\\.|(?!\1)[^\\\n])*\1$/.test(tok);
      if(pos < end || (pos === end && !closed)) return "str";
    }
  }
  return null;
}

/* Друкуєш ( [ { " ' — одразу ставиться й закриваюча, курсор між ними;
   з виділенням — воно обгортається. Закриваючу, яка вже стоїть під
   курсором, просто «перескакуємо». true — клавішу оброблено. */
function autoPair(ta, key){
  const start = ta.selectionStart, end = ta.selectionEnd, v = ta.value;
  const next = v[start] || "", prev = v[start - 1] || "";
  const isQuote = key === "\"" || key === "'";

  if(start !== end && PAIRS[key]){
    const sel = v.slice(start, end);
    insertText(ta, key + sel + PAIRS[key]);
    ta.setSelectionRange(start + 1, start + 1 + sel.length);
    return true;
  }
  if(start !== end) return false;

  if((CLOSERS.has(key) || isQuote) && next === key){
    ta.selectionStart = ta.selectionEnd = start + 1;
    return true;
  }
  if(!PAIRS[key] || CLOSERS.has(key)) return false;
  if(WORD_CH.test(next)) return false;                    /* перед словом — не закриваємо */
  const ctx = contextAt(v, start);
  if(ctx === "cmt") return false;
  if(isQuote){
    if(ctx === "str") return false;                       /* апостроф у тексті: "Ім'я" */
    if(v.slice(start - 2, start) === key + key) return false;   /* третя лапка """ */
    /* після літери лапки не парні, крім префіксів рядка: f"..", r"..", b".." */
    if(WORD_CH.test(prev) && !/(^|[^\p{L}\p{N}_])[fFrRbBuU]{1,2}$/u.test(v.slice(0, start))) return false;
  }

  insertText(ta, key + PAIRS[key]);
  ta.selectionStart = ta.selectionEnd = start + 1;
  return true;
}

/* Backspace між порожньою парою — () "" '' [] {} — прибирає обидві */
function deletePair(ta){
  const start = ta.selectionStart, v = ta.value;
  if(start !== ta.selectionEnd || start === 0) return false;
  /* close перевіряємо окремо: у кінці тексту v[start] — undefined, і без цього
     «немає пари» === «немає символу» сприймалось як порожня пара */
  const close = PAIRS[v[start - 1]];
  if(!close || v[start] !== close) return false;
  ta.setSelectionRange(start - 1, start + 1);
  insertText(ta, "");
  return true;
}

/* ============================ редактор ============================ */
function syncEditor(ta, hlPre, minRows){
  ta.rows = Math.max(minRows || 8, ta.value.split("\n").length + 1);
  /* зайвий \n — щоб порожній останній рядок мав висоту, як у textarea */
  hlPre.innerHTML = highlight(ta.value) + "\n";
}

/* Підключає підсвітку, автовисоту, автодоповнення й клавіші Tab/Enter/Ctrl+Enter
   до пари textarea+pre. opts: { hiddenWords, minRows, onInput(value), onRun() }. */
function wireEditor(ta, hlPre, opts){
  opts = opts || {};
  const ac = makeAutocomplete(ta, opts.hiddenWords);
  const sync = () => syncEditor(ta, hlPre, opts.minRows);
  sync();

  ta.addEventListener("input", (e) => {
    sync();
    if(opts.onInput) opts.onInput(ta.value);
    ac.onInput(e);
  });
  ta.addEventListener("scroll", () => { hlPre.scrollTop = ta.scrollTop; hlPre.scrollLeft = ta.scrollLeft; });

  ta.addEventListener("keydown", (e) => {
    if(ac.onKey(e)) return;
    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      if(opts.onRun) opts.onRun();
      return;
    }
    const start = ta.selectionStart, v = ta.value;

    if(!e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing){
      if(e.key === "Backspace" ? deletePair(ta) : autoPair(ta, e.key)){ e.preventDefault(); return; }
    }

    /* Backspace у відступі на початку рядка забирає одразу цілий крок
       табуляції (до попереднього кратного 4), а не по одному пробілу. */
    if(e.key === "Backspace" && !e.ctrlKey && !e.metaKey && !e.altKey && start === ta.selectionEnd){
      const lineStart = v.lastIndexOf("\n", start - 1) + 1;
      const before = v.slice(lineStart, start);
      if(before.length > 0 && /^ +$/.test(before)){
        const del = ((before.length - 1) % 4) + 1;
        e.preventDefault();
        ta.setSelectionRange(start - del, start);
        insertText(ta, "");
        return;
      }
    }

    let insert = null;
    if(e.key === "Tab" && !e.shiftKey) insert = "    ";
    /* Enter тримає відступ попереднього рядка, а після двокрапки додає ще один */
    if(e.key === "Enter" && !e.shiftKey && !e.altKey){
      const line = v.slice(v.lastIndexOf("\n", start - 1) + 1, start);
      const indent = line.match(/^ */)[0];
      insert = "\n" + indent + (/:\s*$/.test(line) ? "    " : "");
    }
    if(insert === null) return;
    e.preventDefault();
    insertText(ta, insert);
  });

  return { sync };
}

return { esc, PYODIDE_URL, loadScript, bootPyodide, highlight, insertText, makeAutocomplete, syncEditor, wireEditor };

})();
