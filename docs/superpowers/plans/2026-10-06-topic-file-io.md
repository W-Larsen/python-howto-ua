# Тема 06 «Файли» — план реалізації

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Додати до посібника тему 06 «Файли» (`#/files`): текст, 10 покрокових віджетів із «блокнотом», hero, «Перевір себе», шпаргалку й картку на головній.

**Architecture:** Тема повторює шаблон наявних тем: маршрут у `js/app.js`, `<section id="page-files">` в `index.html`, віджети на `CollKit.createPlayer` у новому `js/pages/files.js`. Спільні чисті будівники `notepad`, `csvTable` і фабрика підсвітки `makeHl` додаються в `js/collkit.js` і покриваються тестами. Стилі — новий `css/files.css`, лише на токенах.

**Tech Stack:** статичний HTML/CSS/JS без збірки; JS-тести — `tests/checks.html` (власний раннер `T`); CSS-тести — Python `unittest`; звірка кадрів — справжній Python 3.

**Spec:** `docs/superpowers/specs/2026-10-06-topic-file-io-design.md`
**Гілка:** `feature/topic-file-io` (уже створена й активна)

---

## Як тут усе запускається (прочитай перед Task 1)

- **Сервер.** `.claude/launch.json` має конфігурацію `site-win` (`python -m http.server 8765`). Агент запускає її інструментом `preview_start {name:"site-win"}`; людина — командою `python -m http.server 8765` з кореня репозиторію. Сайт — `http://localhost:8765/`, тема — `http://localhost:8765/#/files`.
- **JS-тести.** Відкрий `http://localhost:8765/tests/checks.html`. Підсумок пише в `#summary` (`PASS N FAIL M`) і в `window.T_DONE` — агент читає його через `javascript_tool`: `window.T_DONE`. Новий тест-файл не потрібен: тести CollKit дописуються в `tests/collkit.test.js` **перед останнім рядком `})();`**.
- **CSS-тести:** `python -m unittest tests/test_css_tokens.py -v`
- **Звірка з Python:** `PYTHONIOENCODING=utf-8 python docs/superpowers/plans/2026-10-06-topic-file-io/snippets_check.py` — 27 тестів. Це **еталон**: вивід і вміст файлів у кожному віджеті мають збігатися з тим, що там перевіряється. Змінюєш код у віджеті — зміни й тут.
- **Перевірка віджета в браузері.** Після `navigate` на `#/files` вистав у `javascript_tool` цей помічник (раз на завантаження сторінки):

```js
window.fin = function(id, ...modes){
  const w = document.getElementById(id);
  modes.forEach(m => w.querySelector(`[data-mode="${m}"]`).click());
  w.dispatchEvent(new KeyboardEvent("keydown", {key:"End", bubbles:true}));
  const np = w.querySelector(".np");
  return {
    out: w.querySelector("[data-out]").innerText,
    file: np ? np.querySelector(".np-body").innerText : null,
    state: np ? np.querySelector(".np-state").textContent : null,
    note: w.querySelector("[data-note]").innerText,
    frames: w.querySelector("[data-counter]").innerText
  };
};
```

`fin("files-w-modes", "a")` перемикає режим, перемотує на останній кадр і віддає вивід, текст блокнота (з `↵`), його стан і примітку.

- **Мова й стиль.** Увесь текст сторінки, коментарі й примітки — українською, як у решті коду. Коментарі пояснюють «чому», а не «що». Відступи — 2 пробіли, лапки в JS — подвійні, шаблонні рядки для HTML.
- **Коміти.** Після кожної задачі. Кожне повідомлення закінчується рядком:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

---

### Task 1: Колір теми `--tc-files`

**Files:**
- Modify: `tests/test_css_tokens.py:23` (TOPICS), `:120` (need у `test_new_tokens_defined`), `:153` (need у `test_dark_covers_tokens`)
- Modify: `css/base.css:50` (світла тема), `:101` і `:117` (обидва темні блоки)
- Modify: `css/shell.css:16`

**Step 1: Тест, що падає.** У `tests/test_css_tokens.py`:

```python
TOPICS = ["vars", "cond", "loops", "func", "coll", "files", "tests"]
```

У `test_new_tokens_defined` у список `need` після `"--tc-coll",` додай `"--tc-files",`. У `test_dark_covers_tokens` після `"--tc-coll",` додай `"--tc-files",`.

**Step 2: Запусти.** `python -m unittest tests/test_css_tokens.py -v`
Очікується: FAIL у `test_new_tokens_defined`, `test_dark_covers_tokens`, `test_contrast_aa` (KeyError `--tc-files`).

**Step 3: Токени.** `css/base.css`, світлий `:root`, після `--tc-coll:#2563eb;`:

```css
    --tc-files:#a21caf;
```

В **обох** темних блоках рядок

```css
      --tc-vars:#a78bfa; --tc-cond:#2dd4bf; --tc-loops:#f59e6b; --tc-func:#fbbf24; --tc-coll:#60a5fa;
```

заміни на

```css
      --tc-vars:#a78bfa; --tc-cond:#2dd4bf; --tc-loops:#f59e6b; --tc-func:#fbbf24; --tc-coll:#60a5fa;
      --tc-files:#e879f9;
```

(блоки мають лишитись однаковими — це стереже `test_dark_blocks_identical`).

`css/shell.css`, після `body[data-topic="coll"]{--tc:var(--tc-coll)}`:

```css
  body[data-topic="files"]{--tc:var(--tc-files)}
```

**Step 4: Запусти.** `python -m unittest tests/test_css_tokens.py -v` → усі OK. Якщо `test_contrast_aa` скаржиться на `files`, підбери темніший/світліший відтінок фуксії й онови spec.

**Step 5: Коміт.**

```bash
git add tests/test_css_tokens.py css/base.css css/shell.css
git commit -m "Add the files topic colour"
```

---

### Task 2: `CollKit.makeHl` — підсвітка з власним набором слів

Темі потрібні `with`, `as`, `try`, `except`, `open`, `write`… Тема «Функції» колись скопіювала весь `hl`; тут робимо фабрику, щоб не множити копії. `func.js` не чіпаємо.

**Files:**
- Modify: `js/collkit.js:9-34`, `js/collkit.js` (рядок `return { … }` у кінці)
- Test: `tests/collkit.test.js`

**Step 1: Тест, що падає.** Допиши в `tests/collkit.test.js` перед останнім `})();`:

```js
/* ================= тема «Файли»: підсвітка, блокнот, CSV-таблиця ================= */
function dom(html){ const d = document.createElement("div"); d.innerHTML = html; return d; }

T.test("підсвітка: makeHl додає свої ключові слова й функції", () => {
  const hl = CollKit.makeHl(/\b(with|as)\b/g, /\b(open)\b/g);
  const s = hl('with open("a.txt") as f:');
  T.ok(s.includes('<span class="kw">with</span>'), s);
  T.ok(s.includes('<span class="kw">as</span>'), s);
  T.ok(s.includes('<span class="fn">open</span>'), s);
  T.ok(s.includes('<span class="str">"a.txt"</span>'), s);
  T.ok(CollKit.hl("for x in y").includes('<span class="kw">for</span>'), "звичайна hl зламалась");
});
```

**Step 2: Запусти** `tests/checks.html`. Очікується: FAIL «CollKit.makeHl is not a function».

**Step 3: Реалізація.** У `js/collkit.js` заміни оголошення `function hl(line){ … }` (рядки 12–34) на:

```js
/* Підсвітка синтаксису: рядки й коментарі витягуються у плейсхолдери, щоб їх
   не чіпали інші правила. Набори слів — параметри: тема з with / try / open
   додає свої, а не копіює розбір рядка. */
function makeHl(kw, fn){
  return function(line){
    let s = esc(line), cmt = null, inq = false, ci = -1;
    for(let k = 0; k < s.length; k++){
      const c = s[k];
      if(c === '"') inq = !inq;
      else if(c === "#" && !inq){ ci = k; break; }
    }
    if(ci >= 0){ cmt = s.slice(ci); s = s.slice(0, ci); }

    const lits = [];
    s = s.replace(/"[^"]*"/g, m => {
      lits.push(m);
      return "\u0001" + String.fromCharCode(64 + lits.length) + "\u0001";
    });
    s = s.replace(kw, '<span class="kw">$1</span>');
    s = s.replace(fn, '<span class="fn">$1</span>');
    s = s.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
    s = s.replace(/\u0001([A-Z])\u0001/g, (m, k) => `<span class="str">${lits[k.charCodeAt(0) - 65]}</span>`);
    return s + (cmt ? `<span class="cmt">${cmt}</span>` : "");
  };
}
const hl = makeHl(KW, FN);
```

У фінальному `return { esc, hl, … }` додай `makeHl` після `hl`.

**Step 4: Запусти** `tests/checks.html` → `FAIL 0`. Відкрий `#/list` і переконайся, що код у віджетах так само підсвічений.

**Step 5: Коміт.**

```bash
git add js/collkit.js tests/collkit.test.js
git commit -m "Let topics extend the widget syntax highlighter"
```

---

### Task 3: `CollKit.notepad` — блокнот

**Files:**
- Modify: `js/collkit.js` (новий блок після `legendHtml`, перед `return`)
- Test: `tests/collkit.test.js`

**Step 1: Тести, що падають.** Допиши після тесту з Task 2:

```js
T.test("блокнот: ↵ на кожен \\n, номери рядків, без каретки", () => {
  const d = dom(CollKit.notepad({name:"names.txt", mode:"r", text:"Оля\nІван\n", pos:null}));
  T.eq(d.querySelectorAll(".np-nl").length, 2);
  T.eq([...d.querySelectorAll(".np-no")].map(n=>n.textContent), ["1", "2"]);
  T.eq(d.querySelector(".np-caret"), null);
  T.eq(d.querySelector(".np-tx").textContent, "Оля↵");
});

T.test("блокнот: каретка стоїть перед символом pos", () => {
  const d = dom(CollKit.notepad({name:"a.txt", mode:"r", text:"ab\ncd\n", pos:3}));
  T.eq(d.querySelectorAll(".np-caret").length, 1);
  T.eq(d.querySelectorAll(".np-tx")[1].firstElementChild.className, "np-caret");
});

T.test("блокнот: каретка в кінці файлу з \\n — на новому порожньому рядку", () => {
  const d = dom(CollKit.notepad({name:"a.txt", mode:"a", text:"ab\n", pos:3}));
  const tx = d.querySelectorAll(".np-tx");
  T.eq(tx.length, 2);
  T.eq(tx[1].children.length, 1);
  T.eq(tx[1].firstElementChild.className, "np-caret");
  T.eq(dom(CollKit.notepad({name:"a.txt", mode:"r", text:"ab\n", pos:null})).querySelectorAll(".np-tx").length, 1);
});

T.test("блокнот: каретка в кінці файлу без \\n — у тому ж рядку", () => {
  const tx = dom(CollKit.notepad({name:"a.txt", mode:"a", text:"ab", pos:2})).querySelectorAll(".np-tx");
  T.eq(tx.length, 1);
  T.eq(tx[0].lastElementChild.className, "np-caret");
});

T.test("блокнот: підсвітка шматків тексту за marks", () => {
  const d = dom(CollKit.notepad({name:"a.txt", mode:"r", text:"ab\ncd\n", pos:3,
    marks:[{from:0, to:3, cls:"read"}, {from:3, to:5, cls:"new"}]}));
  T.eq(d.querySelectorAll(".np-read").length, 1);
  T.eq(d.querySelector(".np-read").textContent, "ab↵");
  T.eq(d.querySelector(".np-new").textContent, "cd");
});

T.test("блокнот: екранує текст і ім'я файлу", () => {
  const d = dom(CollKit.notepad({name:"<i>.txt", mode:null, text:"<b>x</b>", pos:null}));
  T.eq(d.querySelector("b"), null);
  T.eq(d.querySelector("i"), null);
  T.eq(d.querySelector(".np-tx").textContent, "<b>x</b>");
  T.eq(d.querySelector(".np-name").textContent, "<i>.txt");
});

T.test("блокнот: стан у шапці — закрито / відкрито / немає", () => {
  T.eq(dom(CollKit.notepad({name:"a", mode:null, text:"x"})).querySelector(".np-state").textContent, "закрито");
  T.eq(dom(CollKit.notepad({name:"a", mode:"a", text:"x"})).querySelector(".np-state").textContent, "відкрито: a");
  const m = dom(CollKit.notepad({name:"a", missing:true}));
  T.eq(m.querySelector(".np-state").textContent, "немає");
  T.eq(m.querySelector(".np-missing").textContent, "такого файлу немає");
  T.eq(m.querySelector(".np-ln"), null);
});

T.test("блокнот: порожній файл", () => {
  const d = dom(CollKit.notepad({name:"a", mode:"w", text:"", pos:0}));
  T.eq(d.querySelector(".np-empty").textContent, "файл порожній");
  T.ok(d.querySelector(".np-caret"), "у порожньому файлі каретка на початку");
});
```

**Step 2: Запусти** `tests/checks.html` → 8 нових FAIL («CollKit.notepad is not a function»).

**Step 3: Реалізація.** У `js/collkit.js` після рядка `const legendHtml = …` додай:

```js
/* ================= тема «Файли» ================= */
/* Блокнот — вигляд файлу. file = {name, mode, text, pos, marks, missing}:
   mode    — null (закрито) або "r" / "w" / "a";
   text    — увесь вміст, з \n;
   pos     — індекс символу в text, перед яким стоїть каретка; null — без каретки;
   marks   — [{from, to, cls}], cls: read | new | gone — підсвітка шматків;
   missing — файлу немає зовсім.
   Кожен \n малюється як ↵ у кінці свого рядка: кінець рядка — теж символ,
   і саме він потрапляє в змінну разом із текстом. */
function notepad(file){
  const text = file.text || "", marks = file.marks || [];
  const pos = file.pos == null ? -1 : file.pos;
  const st = file.missing ? ["miss", "немає"] : file.mode ? ["on", "відкрито: " + file.mode] : ["", "закрито"];
  const wrap = (body) => `<div class="np"><div class="np-head"><span class="np-name">${esc(file.name)}</span>` +
    `<span class="np-state ${st[0]}">${st[1]}</span></div><div class="np-body">${body}</div></div>`;
  const caret = `<span class="np-caret" aria-hidden="true"></span>`;
  const ln = (n, html) => `<div class="np-ln"><span class="np-no">${n}</span><span class="np-tx">${html}</span></div>`;

  if(file.missing) return wrap(`<div class="np-missing">такого файлу немає</div>`);
  if(!text) return wrap(ln(1, (pos === 0 ? caret : "") + `<span class="np-empty">файл порожній</span>`));

  const clsAt = (k) => { for(const m of marks) if(k >= m.from && k < m.to) return m.cls; return ""; };
  /* межі рядків [from, to): рядок разом зі своїм \n. Порожній хвіст після
     останнього \n показуємо лише тоді, коли в ньому стоїть каретка */
  const spans = [];
  let a = 0;
  for(let k = 0; k < text.length; k++) if(text[k] === "\n"){ spans.push([a, k + 1]); a = k + 1; }
  if(a < text.length || pos === text.length) spans.push([a, text.length]);

  return wrap(spans.map(([from, to], n)=>{
    let html = "", chunk = "", chunkCls = "";
    const flush = () => {
      if(chunk) html += chunkCls ? `<span class="np-${chunkCls}">${chunk}</span>` : chunk;
      chunk = "";
    };
    for(let k = from; k < to; k++){
      if(k === pos){ flush(); html += caret; }
      const c = clsAt(k);
      if(c !== chunkCls){ flush(); chunkCls = c; }
      chunk += text[k] === "\n" ? `<span class="np-nl">↵</span>` : esc(text[k]);
    }
    flush();
    /* каретка за останнім символом: у цьому ж рядку, якщо він не кінчається \n */
    if(pos === to && to === text.length && (from === to || text[to - 1] !== "\n")) html += caret;
    return ln(n + 1, html);
  }).join(""));
}
```

У `return { … }` додай `notepad`.

**Step 4: Запусти** `tests/checks.html` → `FAIL 0`.

**Step 5: Коміт.**

```bash
git add js/collkit.js tests/collkit.test.js
git commit -m "Add the notepad view for the files topic"
```

---

### Task 4: `CollKit.csvTable`

**Files:**
- Modify: `js/collkit.js` (після `notepad`)
- Test: `tests/collkit.test.js`

**Step 1: Тест, що падає:**

```js
T.test("CSV-таблиця: шапка, рядки, підсвітка й екранування", () => {
  const d = dom(CollKit.csvTable(["name", "grade"], [["Оля", "11"], ["<b>", "9"]], 1));
  T.eq([...d.querySelectorAll("th")].map(t=>t.textContent), ["name", "grade"]);
  T.eq(d.querySelectorAll("tbody tr").length, 2);
  T.eq(d.querySelectorAll("tbody td").length, 4);
  T.eq(d.querySelectorAll("tr.now").length, 1);
  T.eq(d.querySelector("tr.now td").textContent, "<b>");
  T.eq(d.querySelector("tbody b"), null);
  T.eq(dom(CollKit.csvTable(["a"], [])).querySelectorAll("tbody tr").length, 0);
});
```

**Step 2: Запусти** → FAIL «CollKit.csvTable is not a function».

**Step 3: Реалізація** (після `notepad`):

```js
/* CSV-таблиця: head — назви стовпців, rows — масиви клітинок,
   cur — індекс рядка, який щойно додано (підсвічується) */
function csvTable(head, rows, cur){
  return `<div class="csvt-wrap"><table class="csvt"><thead><tr>` +
    head.map(h=>`<th>${esc(h)}</th>`).join("") + `</tr></thead><tbody>` +
    rows.map((r, k)=>`<tr${k === cur ? ` class="now"` : ""}>` +
      r.map(c=>`<td>${esc(c)}</td>`).join("") + `</tr>`).join("") +
    `</tbody></table></div>`;
}
```

У `return { … }` додай `csvTable`.

**Step 4: Запусти** → `FAIL 0`.

**Step 5: Коміт.**

```bash
git add js/collkit.js tests/collkit.test.js
git commit -m "Add the CSV table view for the files topic"
```

---

### Task 5: Стилі `css/files.css`

**Files:**
- Create: `css/files.css`
- Modify: `index.html:24` (додати `<link>` після `check.css`)

**Step 1: Файл стилів.** Лише токени — `test_no_hardcoded_colors` не пропустить жодного `#fff` поза `:root`.

```css
/* ==========================================================================
   6. Файли: блокнот, CSV-таблиця, дерево папок
   ========================================================================== */

  /* ---------- блокнот ---------- */
  .np{border:1.5px solid var(--rule); border-radius:10px; background:var(--card); overflow:hidden;
    font-family:var(--mono); font-size:.82rem}
  .np-head{display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:7px 12px; background:var(--panel-2); border-bottom:1px solid var(--rule)}
  .np-name{font-weight:700; color:var(--ink)}
  .np-state{font-size:.7rem; padding:2px 8px; border-radius:999px; color:var(--muted);
    background:var(--panel); border:1px solid var(--rule);
    transition:background var(--t-base) var(--ease), color var(--t-base) var(--ease), border-color var(--t-base) var(--ease)}
  .np-state.on{color:var(--i); background:var(--i-soft); border-color:var(--i-line)}
  .np-state.miss{color:var(--stop); background:var(--stop-soft); border-color:var(--stop-line)}
  .np-body{padding:8px 0}
  .np-ln{display:flex; gap:12px; padding:1px 12px 1px 0; line-height:1.6}
  .np-no{flex:none; width:2.4em; text-align:right; color:var(--faint); user-select:none}
  .np-tx{min-width:0; white-space:pre-wrap; overflow-wrap:anywhere; color:var(--body)}
  /* ↵ — і у віджетах, і в тексті статті */
  .np-nl{color:var(--faint); padding:0 1px; font-family:var(--mono)}
  .np-read{background:var(--j-soft); color:var(--j); border-radius:3px}
  .np-new{background:var(--i-soft); color:var(--i); border-radius:3px; font-weight:700}
  .np-gone{background:var(--stop-soft); color:var(--stop); border-radius:3px; text-decoration:line-through}
  .np-read .np-nl, .np-new .np-nl, .np-gone .np-nl{color:inherit; opacity:.6}
  .np-caret{display:inline-block; width:2px; height:1.15em; margin:0 -1px; vertical-align:-.2em;
    background:var(--i); border-radius:1px; animation:np-blink 1.05s steps(1) infinite}
  @keyframes np-blink{50%{opacity:0}}
  .np-empty{color:var(--faint); font-style:italic}
  .np-missing{padding:4px 12px; color:var(--stop); font-style:italic}
  /* блокнот + ще щось під ним у .extra */
  .np-stack{display:flex; flex-direction:column; gap:12px}

  /* ---------- CSV-таблиця ---------- */
  .csvt-wrap{overflow-x:auto}
  .csvt{border-collapse:collapse; font-family:var(--mono); font-size:.8rem}
  .csvt th, .csvt td{border:1px solid var(--rule); padding:5px 12px; text-align:left; white-space:nowrap}
  .csvt th{background:var(--panel-2); color:var(--ink); font-weight:700}
  .csvt td{background:var(--card); color:var(--body); transition:background var(--t-base), color var(--t-base)}
  .csvt tr.now td{background:var(--j-soft); color:var(--j); font-weight:700}

  /* ---------- дерево папок ---------- */
  .ftree{display:flex; flex-direction:column; gap:3px; font-family:var(--mono); font-size:.84rem}
  .ft-row{display:flex; align-items:center; gap:8px; padding:4px 10px; border-radius:7px;
    border:1.5px solid transparent; transition:background var(--t-base), border-color var(--t-base)}
  .ft-row.d1{margin-left:22px}
  .ft-row.d2{margin-left:44px}
  .ft-row.d3{margin-left:66px}
  .ft-ico{color:var(--muted); width:.8em; text-align:center}
  .ft-name{color:var(--body)}
  .ft-row.dir .ft-name{color:var(--ink); font-weight:700}
  .ft-tag{font-family:var(--sans); font-size:.68rem; font-weight:600; padding:2px 8px; border-radius:999px;
    background:var(--i-soft); color:var(--i)}
  .ft-row.hit{background:var(--j-soft); border-color:var(--j-line)}
  .ft-row.hit .ft-name{color:var(--j); font-weight:700}
  .ft-row.hit .ft-tag{background:var(--card); color:var(--j)}
  .ft-row.ghost{border-style:dashed; border-color:var(--stop-line); background:var(--stop-soft)}
  .ft-row.ghost .ft-name{color:var(--stop); text-decoration:line-through}
  .ft-row.ghost .ft-tag{background:var(--card); color:var(--stop)}

  /* ---------- hero ---------- */
  #files-heroBox{max-width:420px; margin-bottom:14px}

  @media (prefers-reduced-motion:reduce){ .np-caret{animation:none} }
```

**Step 2: Підключи** в `index.html` після рядка з `css/check.css`:

```html
<link rel="stylesheet" href="css/files.css?v=20261006a">
```

**Step 3: Запусти** `python -m unittest tests/test_css_tokens.py -v` → OK (зокрема `test_no_hardcoded_colors` і `test_every_var_is_defined`).

**Step 4: Коміт.**

```bash
git add css/files.css index.html
git commit -m "Add styles for the files topic widgets"
```

---

### Task 6: Маршрут, порожня сторінка, заготовка `files.js`

**Files:**
- Modify: `js/app.js:14-26` (ROUTES), `js/app.js:50` (TOPIC_SLUGS)
- Modify: `index.html` (нова `<section>` перед коментарем `<!-- ================= самостійні роботи: загальна сторінка ================= -->`; `<script>` після `js/pages/set.js`)
- Create: `js/pages/files.js`

**Step 1: Перевір, що теми ще нема.** Відкрий `http://localhost:8765/#/files` → маршрут невідомий, показується головна.

**Step 2: Маршрут.** У `js/app.js` після закриття об'єкта `coll` (рядок `]},` після `set`) додай:

```js
  { slug:"files", id:"page-files", num:"06",
    nav:"Файли",                 title:"Файли в Python — open, with, читання, запис і CSV" },
```

і заміни

```js
const TOPIC_SLUGS = ["vars","cond","loops","func","coll","list","dict","set"];
```

на

```js
const TOPIC_SLUGS = ["vars","cond","loops","func","coll","list","dict","set","files"];
```

**Step 3: Розмітка-заготовка** в `index.html` перед блоком самостійних робіт:

```html
  <!-- ================= тема: файли ================= -->
  <section class="page" id="page-files" hidden>
  <div class="wrap">

  <header class="top">
    <h1>Файли</h1>
  </header>

  </div>
  </section>

```

**Step 4: Заготовка скрипта** `js/pages/files.js`:

```js
"use strict";
window.PageInit["files"] = function(){
const K = window.CollKit;
const { esc, modeCfg, notepad, csvTable, cells, row } = K;
const $id = (s) => document.getElementById(s);

/* Підсвітка: до слів CollKit додано те, що живе лише в цій темі —
   with / as / try / except і все для роботи з файлами. */
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

};
```

Підключи в `index.html` після `<script src="js/pages/set.js?v=…"></script>`:

```html
<script src="js/pages/files.js?v=20261006a"></script>
```

**Step 5: Перевір у браузері.** `#/files`: заголовок «Файли», у меню пункт «06 Файли» з фуксієвою позначкою, `read_console_messages` без помилок, у пагінації під «Множинами» з'являється «далі: Файли». На головній `Book`-позначка «пройдено» після відвідин теми з'являється в меню.

**Step 6: Коміт.**

```bash
git add js/app.js index.html js/pages/files.js
git commit -m "Add the files topic route and an empty page"
```

---

### Task 7: Текст статті

Уся розмітка сторінки за один раз: текст, виноски, порожні `div.widget`, «Перевір себе», шпаргалка. Віджети оживуть у наступних задачах.

**Files:**
- Modify: `index.html` (вміст `#page-files` з Task 6)

**Step 1:** Заміни вміст `<div class="wrap">…</div>` секції `#page-files` на:

```html
  <header class="top">
    <h1>Файли</h1>
    <p class="lede">Усе, що програма тримає в змінних, зникає, щойно вона завершується. Щоб імена, оцінки чи налаштування дожили до наступного запуску, їх кладуть у <b>файл</b>. Python уміє відкрити файл, прочитати його рядок за рядком і дописати в нього нове — кількома рядками коду.</p>
  </header>

  <div class="hero" id="files-hero">
    <div id="files-heroBox"></div>
    <div class="hero-line" id="files-heroLine">натисни, щоб подивитись запис у файл</div>
    <button class="ctl replay" id="files-heroBtn">Показати ще раз</button>
  </div>

  <h2>Навіщо файли</h2>
  <p>Змінна живе в оперативній пам’яті, поки працює програма. Закрив програму — і <code>names = ["Оля", "Іван"]</code> зник разом із нею. Наступний запуск починається з чистого аркуша.</p>
  <p>Файл лежить на диску. Його можна записати сьогодні, а прочитати завтра — іншою програмою, у текстовому редакторі чи навіть на іншому комп’ютері. Так зберігаються збереження в іграх, налаштування застосунків і таблиці з оцінками.</p>
  <p>У цій темі — <b>текстові файли</b>, які відкриваються в Блокноті. Усередині такий файл — один довгий рядок символів, а «рядки», які ти бачиш у редакторі, розділяє невидимий символ <code>\n</code>. У віджетах нижче він видимий: <span class="np-nl">↵</span>.</p>

  <h2>open і режими</h2>
  <p>Щоб працювати з файлом, його спершу відкривають: <code>open("names.txt", "w", encoding="utf-8")</code>. Перший аргумент — ім’я файлу, другий — <b>режим</b>, тобто що ти збираєшся з файлом робити:</p>
  <ul>
    <li><code>"r"</code> (read) — тільки читати. Це режим за замовчуванням;</li>
    <li><code>"w"</code> (write) — записати з нуля. Якщо файл був, його вміст <b>стирається</b>; якщо не було — створюється новий;</li>
    <li><code>"a"</code> (append) — дописати в кінець, не чіпаючи того, що вже є.</li>
  </ul>
  <p><code>open</code> повертає об’єкт файлу. Через нього пишуть — <code>f.write("Ніна\n")</code>, — а наприкінці закривають: <code>f.close()</code>. <code>write</code> пише рівно те, що йому дали, тому <code>\n</code> у кінці рядка додають самі. Перемкни режим і подивись, що станеться з тим самим файлом.</p>

  <div class="widget" id="files-w-modes" tabindex="0"></div>

  <div class="callout warn">
    <p><b>"w" не питає дозволу.</b> Відкрити наявний файл у режимі <code>"w"</code> — означає стерти його ще до першого <code>write</code>. Якщо треба додати рядок до журналу чи списку, потрібен <code>"a"</code>.</p>
  </div>

  <div class="callout">
    <p><b>Навіщо encoding="utf-8".</b> На диску файл — це байти, а кодування каже, як перетворити букви на байти й назад. Без нього Python бере кодування системи, і на Windows кирилиця з чужого файлу перетворюється на «РћР»СЏ» замість «Оля». Тому в кожному <code>open</code> на цій сторінці стоїть <code>encoding="utf-8"</code> — звикай писати його завжди.</p>
  </div>

  <h2>with: файл закривається сам</h2>
  <p>Відкритий файл треба закрити: тоді записане гарантовано опиниться на диску, а система звільнить файл для інших програм. Але <code>f.close()</code> легко забути, а ще легше — не дійти до нього: якщо посередині станеться помилка, програма впаде раніше.</p>
  <p>Тому файли майже завжди відкривають так: <code>with open("names.txt", "a", encoding="utf-8") as f:</code>. Усе, що з відступом під цим рядком, працює з відкритим файлом <code>f</code>. Щойно блок закінчився — <b>будь-яким способом</b>, навіть через помилку, — Python сам закриває файл. Порівняй обидва варіанти: в обох посередині трапляється помилка.</p>

  <div class="widget" id="files-w-with" tabindex="0"></div>

  <div class="callout">
    <p><b>print теж уміє писати у файл.</b> <code>print("Ніна", file=f)</code> робить те саме, що <code>f.write("Ніна\n")</code>, але сам додає <code>\n</code> у кінці й сам перетворює числа на текст.</p>
  </div>

  <h2>Читання</h2>
  <p>Відкритий на читання файл можна прочитати трьома способами. <code>f.read()</code> забирає все одним рядком. <code>for line in f</code> дає рядки по одному — найзручніше й найекономніше. <code>f.readlines()</code> повертає список рядків.</p>
  <p>Стеж за <b>кареткою</b> в блокноті: файл пам’ятає, де зупинилось читання, і наступне читання продовжує з того самого місця. І стеж за <span class="np-nl">↵</span>: кожен прочитаний рядок приносить свій <code>\n</code> із собою.</p>

  <div class="widget" id="files-w-read" tabindex="0"></div>

  <div class="callout warn">
    <p><b>Звідки порожні рядки.</b> <code>print(line)</code> друкує рядок, у якому вже є <code>\n</code>, і додає свій. Два переноси — порожній рядок. Ліки — <code>line.rstrip()</code>: він зрізає пробіли й <code>\n</code> з правого краю.</p>
  </div>

  <h2>Читаємо в список і сортуємо</h2>
  <p>Найчастіший сценарій: прочитати файл, скласти рядки в список і далі працювати вже зі списком — сортувати, шукати, рахувати. Усе, що ти знаєш про <a href="#/list">списки</a>, тут працює без змін.</p>
  <p>Головне — прибрати <code>\n</code> ще під час читання. <code>"Оля\n"</code> і <code>"Оля"</code> для Python — різні рядки: перевірка <code>"Оля" in names</code> на неочищеному списку дасть <code>False</code>.</p>

  <div class="widget" id="files-w-sort" tabindex="0"></div>

  <h2>Коли файлу немає</h2>
  <p>Відкрити на читання файл, якого немає, не вийде: <code>open</code> упаде з помилкою <code>FileNotFoundError</code>. Режими <code>"w"</code> і <code>"a"</code> такої проблеми не мають — вони просто створять новий файл.</p>
  <p>Відсутній файл — звичайна ситуація: програму запустили вперше, файл видалили чи перейменували. Таку помилку ловлять знайомим з теми <a href="#/func">«Функції»</a> <code>try / except</code>. Спробуй обидва перемикачі.</p>

  <div class="widget" id="files-w-missing" tabindex="0"></div>

  <h2>Де шукається файл</h2>
  <p>Ім’я <code>"names.txt"</code> — це <b>відносний шлях</b>. Python шукає такий файл у <b>робочій папці</b> — тій, з якої запустили програму. Не в папці, де лежить <code>.py</code>-файл, а саме звідки запустили: це найчастіша причина помилки «FileNotFoundError, хоча файл же є».</p>
  <p><b>Абсолютний шлях</b> починається від кореня диска — <code>C:\Users\olia\data\names.txt</code> на Windows чи <code>/home/olia/data/names.txt</code> на Linux — і працює звідки завгодно. Але з таким шляхом програма прив’язана до одного комп’ютера.</p>
  <p>Для шляхів у Python є модуль <code>pathlib</code>. <code>Path("data") / "names.txt"</code> склеює частини шляху правильним для системи роздільником, <code>.exists()</code> перевіряє, чи є такий файл, а <code>.read_text()</code> і <code>.write_text()</code> читають і пишуть файл одним викликом — без <code>open</code> і <code>with</code>.</p>

  <div class="widget" id="files-w-path" tabindex="0"></div>

  <h2 class="adv">Advanced: CSV<span class="badge">advanced</span></h2>

  <div class="adv-intro">
    <h3>Таблиця у звичайному тексті</h3>
    <p>CSV (comma-separated values — «значення через кому») — найпростіший формат таблиць. Кожен рядок файлу — рядок таблиці, коми ділять його на стовпці, а перший рядок зазвичай містить назви стовпців. Такий файл відкриється і в Блокноті, і в Excel, і в Google Таблицях.</p>
  </div>

  <h2>Чому не просто split(",")</h2>
  <p>Перша думка — читати CSV як звичайний текст і різати кожен рядок через <code>split(",")</code>. Це працює рівно доти, доки в якомусь значенні не трапиться кома. Тоді значення беруть у лапки — <code>"Іваненко, Оля",9-А,11</code>, — а <code>split</code> про лапки нічого не знає.</p>
  <p>Модуль <code>csv</code> зі стандартної бібліотеки знає: <code>csv.reader(f)</code> перебирає рядки файлу й віддає кожен уже як список полів.</p>

  <div class="widget" id="files-w-split" tabindex="0"></div>

  <h2>DictReader: рядок як словник</h2>
  <p><code>row[2]</code> — не найзрозуміліший запис: доводиться пам’ятати, що третій стовпець — це оцінка. <code>csv.DictReader</code> бере назви стовпців із першого рядка й віддає кожен наступний рядок як <a href="#/dict">словник</a>: <code>row["grade"]</code> читається саме як «оцінка».</p>
  <p>Тут же ховається пастка: <b>усе, що прочитано з файлу, — рядки</b>, навіть якщо виглядає як число. Посортуй учнів за оцінкою обома способами.</p>

  <div class="widget" id="files-w-dict" tabindex="0"></div>

  <h2>Запис CSV</h2>
  <p>Записують CSV дзеркально: <code>csv.DictWriter</code> отримує файл і список стовпців <code>fieldnames</code>, <code>writeheader()</code> пише рядок-заголовок, а <code>writerow(словник)</code> — по рядку на кожен словник. Коми, лапки навколо значень із комами й перетворення чисел на текст він бере на себе.</p>

  <div class="widget" id="files-w-write" tabindex="0"></div>

  <div class="callout warn">
    <p><b>newline="" при записі CSV.</b> Модуль <code>csv</code> сам закінчує кожен рядок парою символів <code>\r\n</code>. Без <code>newline=""</code> Windows перетворить ще й <code>\n</code> на <code>\r\n</code>, і в Excel між рядками з’являться порожні. Тому для запису CSV завжди <code>open(..., "w", newline="")</code>.</p>
  </div>

  <h2>Перевір себе</h2>

  <div class="task">
    <p>1. Цю програму запустили двічі. Що буде у файлі <code>log.txt</code>, якщо до першого запуску його не було?</p>
    <pre>with open("log.txt", "a", encoding="utf-8") as f:
    f.write("старт\n")</pre>
    <button class="ctl" data-answer="files-a1">Показати відповідь</button>
    <div class="answer" id="files-a1"><p>Два рядки <code>старт</code>. Перший запуск створив файл — режим <code>"a"</code> створює його, якщо файлу немає, — а другий дописав ще один рядок у кінець.</p></div>
  </div>

  <div class="task">
    <p>2. Що виведе програма?</p>
    <pre>with open("a.txt", "w", encoding="utf-8") as f:
    f.write("раз")
    f.write("два")
with open("a.txt", encoding="utf-8") as f:
    print(f.read())</pre>
    <button class="ctl" data-answer="files-a2">Показати відповідь</button>
    <div class="answer" id="files-a2"><p><code>раздва</code> — одним словом. <code>write</code> не додає <code>\n</code> сам, тож обидва шматки опинились в одному рядку.</p></div>
  </div>

  <div class="task">
    <p>3. У <code>names.txt</code> три рядки: <code>Оля</code>, <code>Іван</code>, <code>Петро</code>, кожен закінчується <code>\n</code>. Що виведе програма?</p>
    <pre>with open("names.txt", encoding="utf-8") as f:
    print(len(f.read()))
    print(len(f.read()))</pre>
    <button class="ctl" data-answer="files-a3">Показати відповідь</button>
    <div class="answer" id="files-a3"><p><code>15</code> і <code>0</code>. Перший <code>read()</code> забрав 12 букв і три <code>\n</code>. Другий почав з місця, де зупинилась каретка, — з кінця файлу, — і прочитав порожній рядок.</p></div>
  </div>

  <div class="task">
    <p>4. На скільки частин <code>split(",")</code> розріже цей рядок із CSV-файлу?</p>
    <pre>'"Коваль, Ніна",9-Б,12'.split(",")</pre>
    <button class="ctl" data-answer="files-a4">Показати відповідь</button>
    <div class="answer" id="files-a4"><p>На 4: <code>split</code> ріже й на комі всередині лапок. <code>csv.reader</code> розібрав би цей рядок правильно — на 3 поля, перше з них <code>Коваль, Ніна</code>.</p></div>
  </div>

  <div class="task">
    <p>5. Файлу <code>new.txt</code> немає. Що зробить цей код?</p>
    <pre>with open("new.txt", "w", encoding="utf-8") as f:
    pass</pre>
    <button class="ctl" data-answer="files-a5">Показати відповідь</button>
    <div class="answer" id="files-a5"><p>Створить порожній файл <code>new.txt</code> — без жодної помилки. <code>FileNotFoundError</code> буває лише при читанні (<code>"r"</code>); <code>"w"</code> і <code>"a"</code> створюють файл самі.</p></div>
  </div>

  <div class="task">
    <p>6. Чому тут <code>False</code>, хоча Оля у файлі є?</p>
    <pre>with open("names.txt", encoding="utf-8") as f:
    names = f.readlines()
print("Оля" in names)</pre>
    <button class="ctl" data-answer="files-a6">Показати відповідь</button>
    <div class="answer" id="files-a6"><p>У списку лежить <code>"Оля\n"</code>, а не <code>"Оля"</code>: <code>readlines()</code> лишає <code>\n</code> у кожному рядку. Треба прибрати його: <code>names = [line.rstrip() for line in f]</code>.</p></div>
  </div>

  <h2>Шпаргалка</h2>
  <table class="cheat">
    <tr><td>open("a.txt", encoding="utf-8")</td><td>відкрити на читання ("r" — за замовчуванням)</td></tr>
    <tr><td>open("a.txt", "w", encoding="utf-8")</td><td>записати з нуля: старий вміст стирається</td></tr>
    <tr><td>open("a.txt", "a", encoding="utf-8")</td><td>дописати в кінець</td></tr>
    <tr><td>with open(...) as f:</td><td>файл закриється сам, навіть після помилки</td></tr>
    <tr><td>f.read()</td><td>увесь файл одним рядком</td></tr>
    <tr><td>for line in f:</td><td>рядки по одному, разом із \n</td></tr>
    <tr><td>f.readlines()</td><td>список рядків, теж із \n</td></tr>
    <tr><td>line.rstrip()</td><td>зрізати \n і пробіли справа</td></tr>
    <tr><td>f.write("Оля\n")</td><td>записати рядок; \n — самому</td></tr>
    <tr><td>print("Оля", file=f)</td><td>записати, \n додасться сам</td></tr>
    <tr><td>except FileNotFoundError:</td><td>файлу немає</td></tr>
    <tr><td>Path("data") / "a.txt"</td><td>шлях із частин</td></tr>
    <tr><td>path.exists()</td><td>чи є такий файл</td></tr>
    <tr><td>path.read_text(encoding="utf-8")</td><td>прочитати файл одним викликом</td></tr>
    <tr><td>csv.reader(f)</td><td>рядки CSV як списки полів</td></tr>
    <tr><td>csv.DictReader(f)</td><td>рядки CSV як словники</td></tr>
    <tr><td>int(row["grade"])</td><td>з CSV усе приходить рядками</td></tr>
    <tr><td>csv.DictWriter(f, fieldnames=[...])</td><td>запис CSV: writeheader(), writerow(d)</td></tr>
    <tr><td>open(..., "w", newline="")</td><td>обов'язково для запису CSV</td></tr>
  </table>
```

**Step 2: Звір відповіді.** `PYTHONIOENCODING=utf-8 python docs/superpowers/plans/2026-10-06-topic-file-io/snippets_check.py` → 27 OK. Задачі 1–6 відповідають `Tasks.test_t1…t6`.

**Step 3: Перевір у браузері** `#/files`: заголовки отримали номери `6.1…6.13`, у меню під «Файли» розгорнувся зміст, «Перевір себе» складена в сітку, відповіді розгортаються, шпаргалка в картці. Консоль без помилок.

**Step 4: Коміт.**

```bash
git add index.html
git commit -m "Write the files topic article"
```

---

> **Задачі 8–16 — віджети.** Кожен блок коду додається в `js/pages/files.js` **в кінець функції, перед останнім рядком `};`**, у порядку задач. Цикл для кожної: (1) у браузері `fin(...)` повертає порожнє — віджета ще нема (тест падає); (2) додаєш код; (3) перезавантажуєш сторінку, знову ставиш `fin` і перевіряєш очікувані значення — вони взяті зі `snippets_check.py`; (4) гортаєш віджет кроками стрілками й читаєш примітки; (5) коміт.

### Task 8: Віджет 6.2 «open і режими»

**Files:** Modify `js/pages/files.js`

**Step 1: Код.**

```js
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
```

**Step 2: Перевір** (еталон — `Modes` у `snippets_check.py`):
- `fin("files-w-modes","w")` → `out: "готово"`, `file` містить лише рядок `Ніна↵` (плюс номер рядка `1`), `state: "закрито"`.
- `fin("files-w-modes","a")` → у `file` чотири рядки, останній `Ніна↵`.
- `fin("files-w-modes","r")` → `out` містить `io.UnsupportedOperation: not writable`, `file` — три початкові імена, `state: "відкрито: r"`.

**Step 3: Коміт.** `git commit -am "Files topic: open modes widget"`

---

### Task 9: Віджет 6.3 «with»

```js
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
```

**Перевір** (еталон — `With`): `fin("files-w-with","close")` → `TypeError: write() argument must be str, not int`, `state: "відкрито: a"`; `fin("files-w-with","with")` → та сама помилка, `state: "закрито"`, у `file` останній рядок `Ніна↵`.

**Коміт.** `git commit -am "Files topic: with widget"`

---

### Task 10: Віджет 6.4 «Читання»

```js
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
```

**Перевір** (еталон — `Read`): `out` для `read` — `Оля / Іван / Петро / (порожній) / ''`; для `for` — після кожного імені порожній рядок; для `strip` — три імені поспіль; для `lines` — `['Оля\n', 'Іван\n', 'Петро\n']` з видимими `\n`. Покроково в режимі `read`: на кадрі 3 у чипі `again = ""`, каретка в кінці файлу.

**Коміт.** `git commit -am "Files topic: reading widget"`

---

### Task 11: Віджет 6.5 «Читаємо в список і сортуємо»

```js
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
```

**Перевір** (еталон — `Sort`): `fin("files-w-sort")` → `out: "привіт, Іван\nпривіт, Оля\nпривіт, Петро"`. Під блокнотом — комірки списку, нова комірка підсвічується.

**Коміт.** `git commit -am "Files topic: read-into-list widget"`

---

### Task 12: Віджет 6.6 «Коли файлу немає»

Перший віджет із двома перемикачами: кнопки з `data-group` — `modeCfg(root, group)` і обробник кліків у `CollKit` це вже підтримують.

```js
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
```

**Перевір** (еталон — `Missing`), усі чотири комбінації:
- `fin("files-w-missing","have","plain")` → `Оля / Іван / Петро / кінець програми`
- `fin("files-w-missing","none","plain")` → `FileNotFoundError: [Errno 2] No such file or directory: 'names.txt'`, `state: "немає"`
- `fin("files-w-missing","have","try")` → як перший
- `fin("files-w-missing","none","try")` → `файлу names.txt немає / кінець програми`
- Клік по кнопці однієї групи **не** знімає натиснення з іншої (перевір `aria-pressed` обох груп).

**Коміт.** `git commit -am "Files topic: missing file widget"`

---

### Task 13: Віджет 6.7 «Де шукається файл»

```js
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
    {depth:2, name:"data", dir:true, cls:"ghost"},
    {depth:3, name:"names.txt", cls:"ghost", tag:"шукаємо тут — немає"});
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
      note:`Звідси й «FileNotFoundError, хоча файл же є»: відносний шлях залежить від того, звідки запустили програму, а не від того, де лежить .py-файл.`});
    else frames.push({line:3, vars:[P], out:["Оля", "Іван", "Петро"], where, look:true, kind:"end",
      note:`read_text() відкриває, читає й закриває файл одним викликом — with тут не потрібен.`});
    return {code, frames};
  },
  extra:(f)=> pathTree(f.where, f.look)
});
```

**Перевір** (еталон — `Paths`): `fin("files-w-path","proj")` → `Оля / Іван / Петро`, у дереві `names.txt` зелений із міткою «знайдено»; `fin("files-w-path","data")` → `файлу немає`, з'явились пунктирні червоні `data/` і `names.txt` із міткою «шукаємо тут — немає».

**Коміт.** `git commit -am "Files topic: relative path widget"`

---

### Task 14: Віджет 6.9 «Чому не просто split»

```js
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
        note: bad ? `Програма певна, що в рядку 4 поля. Тепер row[1] — це ' Оля"', а не клас.` : `${parts.length} поля.`});
    });
    frames.push({line: useCsv ? 2 : 1, vars:[off], out:[...out], file:file("students.csv", null, QUOTED, null), parts:null, kind:"end",
      note: useCsv
        ? `Усі рядки — рівно по три поля. І ще дрібниця: rstrip() не знадобився, \\n csv.reader прибирає сам.`
        : `Досить одному значенню містити кому — і «таблиця» роз'їжджається. Тому CSV читають не split-ом, а модулем csv.`});
    return {code, frames};
  },
  extra:(f)=> stack(notepad(f.file), f.parts ? row("row", fields(f.parts, f.st)) : "")
});
```

**Перевір** (еталон — `Csv.test_split`, `Csv.test_reader`): `fin("files-w-split","split")` → другий рядок виводу `4 ['"Іваненко', ' Оля"', '9-А', '11']`; `fin("files-w-split","csv")` → `3 ['Іваненко, Оля', '9-А', '11']`. Покроково в режимі `split` на другому рядку файлу дві «зламані» комірки жовті.

**Коміт.** `git commit -am "Files topic: split vs csv.reader widget"`

---

### Task 15: Віджет 6.10 «DictReader»

```js
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
```

**Перевір** (еталон — `test_dictreader_str_sort`, `test_dictreader_int_sort`): `fin("files-w-dict","str")` → `Оля 11 / Ніна 12 / Іван 9`; `fin("files-w-dict","int")` → `Іван 9 / Оля 11 / Ніна 12`. Таблиця заповнюється рядок за рядком.

**Коміт.** `git commit -am "Files topic: DictReader widget"`

---

### Task 16: Віджет 6.11 «Запис CSV»

```js
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
        note: k === 0 ? `writerow бере значення зі словника в порядку fieldnames і сам ставить коми. Число 11 у файлі стало текстом.`
                      : `Ще один рядок таблиці.`});
    });
    frames.push({line:6, vars:[ST, off, WR, S], out:[], file:file("grades.csv", null, text, null), kind:"end",
      note:`Блок with закрив файл. Такий CSV відкриється і в Python, і в Excel чи Google Таблицях.`});
    return {code, frames};
  },
  extra:(f)=> notepad(f.file)
});
```

**Перевір** (еталон — `test_dictwriter`): `fin("files-w-write")` → `file` має три рядки `name,grade↵ / Оля,11↵ / Іван,9↵`, `state: "закрито"`; перші два кадри — блокнот у стані «немає».

**Коміт.** `git commit -am "Files topic: DictWriter widget"`

---

### Task 17: Hero

**Files:** Modify `js/pages/files.js` (в кінець, перед `};`)

```js
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
```

**Перевір:** на `#/files` hero сам програє запис трьох імен, у кінці — «файл лишився», шапка «закрито». Кнопка «Показати ще раз» перезапускає. Перехід на іншу тему й назад не плодить паралельних анімацій.

**Коміт.** `git commit -am "Files topic: hero animation"`

---

### Task 18: Картка на головній і її мініатюра

**Files:**
- Modify: `index.html` (картка в `.topic-cards` після картки `#/coll`)
- Modify: `js/app.js` (нова `vizFiles` після `vizFunc`; мапа в `initViz`)
- Modify: `css/shell.css` (після правил `.vz-kv…`, перед `@media (prefers-reduced-motion…)`)

**Step 1: Картка.** У `index.html` після картки `href="#/coll"` (перед `</div>` сітки `topic-cards`):

```html
        <a class="card reveal" href="#/files" data-viz="files">
          <div class="card-viz">
            <svg viewBox="0 0 320 152" class="viz viz-files" aria-hidden="true">
              <rect class="vz-np" x="40" y="12" width="240" height="130" rx="10"/>
              <path class="vz-np-bar" d="M41 40 V22 a9 9 0 0 1 9 -9 H270 a9 9 0 0 1 9 9 V40 Z"/>
              <text class="vz-np-name" x="54" y="31">names.txt</text>
              <text class="vz-np-mode" data-mode x="266" y="31">закрито</text>
              <text class="vz-np-no" x="66" y="64">1</text>
              <text class="vz-np-no" x="66" y="88">2</text>
              <text class="vz-np-no" x="66" y="112">3</text>
              <text class="vz-np-tx on" data-l="0" x="80" y="64">Оля<tspan class="nl"> ↵</tspan></text>
              <text class="vz-np-tx on" data-l="1" x="80" y="88">Іван<tspan class="nl"> ↵</tspan></text>
              <text class="vz-np-tx on" data-l="2" x="80" y="112">Петро<tspan class="nl"> ↵</tspan></text>
              <rect class="vz-caret off" data-caret x="80" y="51" width="2" height="16" rx="1"/>
            </svg>
          </div>
          <div class="card-body">
            <h3>Файли</h3>
            <p>Як зберегти дані між запусками: <code>open</code> і режими <code>r</code>, <code>w</code>, <code>a</code>, чому <code>with</code> надійніший за <code>close()</code>, звідки береться зайвий <code>\n</code> і як читати CSV.</p>
            <div class="card-meta"><span>with / open</span><span>CSV</span></div>
            <div class="card-go">Читати тему <em>→</em></div>
          </div>
        </a>
```

**Step 2: Мініатюра.** У `js/app.js` після функції `vizFunc`:

```js
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
    setMode("відкрито: a", true);
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
  }});
  return cycler(steps);
}
```

У `initViz` заміни мапу на:

```js
  const map = { vars: vizVars, cond: vizCond, loops: vizLoop, func: vizFunc, dicts: vizDict, files: vizFiles, shop: vizShop };
```

**Step 3: Стилі мініатюри** (`css/shell.css`, після `.vz-code.err{…}`):

```css
  .vz-np{fill:var(--card); stroke:var(--rule); stroke-width:1.5}
  .vz-np-bar{fill:var(--panel-2)}
  .vz-np-name{font-size:11px; font-weight:700; fill:var(--ink)}
  .vz-np-mode{font-size:10px; fill:var(--muted); text-anchor:end; transition:fill .3s}
  .vz-np-mode.on{fill:var(--i)}
  .vz-np-no{font-size:11px; fill:var(--faint); text-anchor:end}
  .vz-np-tx{font-size:13px; font-weight:700; fill:var(--ink); opacity:0; transition:opacity .3s}
  .vz-np-tx.on{opacity:1}
  .vz-np-tx .nl{fill:var(--faint); font-weight:400}
  .vz-caret{fill:var(--i); transition:transform .35s var(--ease), opacity .2s}
  .vz-caret.off{opacity:0}
```

**Step 4: Перевір:** на головній з'явилась картка «Тема 06 · Файли» з фуксієвою обкладинкою й водяним номером 06; мініатюра програє запис, коли картка в екрані або під курсором. З `prefers-reduced-motion` (через `resize_window`/емуляцію або налаштування ОС) показує фінальний стан без руху. `python -m unittest tests/test_css_tokens.py -v` → OK.

**Step 5: Коміт.**

```bash
git add index.html js/app.js css/shell.css
git commit -m "Add the files topic card to the home page"
```

---

### Task 19: Версії кешу, повна перевірка, статус spec

**Files:**
- Modify: `index.html` (`?v=` у `<link>`/`<script>`)
- Modify: `docs/superpowers/specs/2026-10-06-topic-file-io-design.md` (статус)

**Step 1: Підніми `?v=`** до `20261006a` у змінених файлах: `css/base.css`, `css/shell.css`, `js/app.js`, `js/collkit.js` (нові `css/files.css` і `js/pages/files.js` уже з `20261006a`).

**Step 2: Усі автоматичні перевірки:**

```bash
python -m unittest discover -s tests -p "test_*.py" -v
```

```bash
PYTHONIOENCODING=utf-8 python docs/superpowers/plans/2026-10-06-topic-file-io/snippets_check.py
```

`tests/checks.html` → `window.T_DONE.fail === 0`.

**Step 3: Обхід у браузері** (`site-win`), по кожному пункту spec §7:
- `#/files`: меню, зміст під пунктом, номери `6.1…6.13`, пагінація «Множини ← → (наступна)»;
- кожен віджет: кожен режим від першого до останнього кадру (стрілки, `End`, клік по рядку коду), висота під віджетом не сіпається при перемиканні режимів;
- світла й темна тема (`resize_window` з `colorScheme`) — блокнот, таблиця, дерево читаються;
- ширина телефона (`resize_window` `preset:"mobile"`): немає горизонтальної прокрутки сторінки (`document.documentElement.scrollWidth <= innerWidth`); широка CSV-таблиця прокручується у своїй рамці; потім `preset:"desktop"`;
- `read_console_messages` з `onlyErrors:true` — порожньо;
- головна: картка теми 06 і позначка «пройдено» після відвідин.

Скриншоти `#/files` (світла й темна) і головної — доказ для PR.

**Step 4: Статус spec** — заміни рядок статусу на `Статус: реалізовано`.

**Step 5: Коміт.**

```bash
git add index.html docs/superpowers/specs/2026-10-06-topic-file-io-design.md
git commit -m "Bump asset versions and mark the files topic spec as implemented"
```
