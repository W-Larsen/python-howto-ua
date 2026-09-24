# Самостійні роботи: загальна сторінка й тести 9 класу — план реалізації

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Винести самостійну роботу в спільний рушій, додати сторінку `#/tests` і два нові тести для 9 класу (базовий і розширений) з новим типом завдань «програма».

**Architecture:** Статичний сайт без збірки. `js/pages/check.js` розпадається на чисте ядро (`js/checks/core.js`), Python-обв'язку (`harness.js` — Python-код у рядку), обгортку Pyodide (`python.js`) і DOM-рушій (`engine.js`). Кожен тест — файл даних, що викликає `CheckEngine.define({...})`. Роутер `app.js` отримує вузол `tests` з підмаршрутами, один із яких прихований.

**Tech Stack:** ванільний JS (ES2020, без модулів), Pyodide 0.26.4 з CDN (через наявний `PyEditor.bootPyodide()`), Python 3.9+ (CPython) лише для тестів обв'язки, `python3 -m http.server` для локального запуску.

**Spec:** `docs/superpowers/specs/2026-09-24-tests-hub-grade9-design.md`

**Дані тестів 9 класу (готові, перевірені CPython):** `docs/superpowers/plans/2026-09-24-tests-hub-grade9/base.js`, `.../plus.js`; генератор і перевірка — `.../content_check.py` (`python3 content_check.py <тека>` — перевіряє розв'язки й генерує обидва файли).

## Global Constraints

- Сайт лишається статичним: без збірки, без npm, без нових CDN-залежностей; нові скрипти — звичайні `<script src>` у `index.html`.
- Версія кешу для всіх нових і змінених файлів у `index.html`: `?v=20260924a`.
- Інженерний тест: адреса `#/check`, посилання `#/check/r/…`, ключі `pyguide_check_pick`, `pyguide_check_draft`, `pyguide_check_result`, версія формату посилання `2` — **без змін**; тексти й стартовий код його завдань — байт-у-байт як у `js/pages/check.js` на `main`.
- 9 клас: `#/check-9`, ключі `pyguide_check9_*`; розширений: `#/check-9plus`, ключі `pyguide_check9plus_*`; нові тести мають версію формату посилання `1`.
- Загальна сторінка — `#/tests`, у меню «Самостійні роботи».
- Кожен тест — максимум **12** балів.
- Порівняння виводу програм: `rstrip()` кожного рядка, порожні рядки в кінці відкидаються, решта — точний збіг; підказка з `input("…")` у вивід не потрапляє.
- Ліміт на запуск коду учня: `MAX_STEPS = 200000` проходів циклів (у спеку §7.1 було «100 000 кроків через sys.settrace» — див. Task 3, чому це змінено).
- Обрізання виводу провального набору: 500 символів.
- Тексти інтерфейсу — українською; коментарі в коді — українською, у стилі наявних файлів.

## Review Focus

- **Старий збережений результат інженерної школи** (`pyguide_check_result` у браузері учня, зокрема без полів `variant`/`chosenIdx`) має показуватися й давати робоче посилання — тест у Task 5 (кроки 1 і 9).
- **Нескінченний цикл із `try/except` усередині** не має вішати сторінку — тест у Task 3.
- **Вивід, що відрізняється лише пробілами в кінці / зайвим `\n` / текстом підказки `input()`**, має зараховуватись, а пробіл на початку рядка чи порожній рядок усередині — ні — тести в Task 2 і Task 3.
- **Відкриття чужого посилання `#/check-9/r/…` у браузері, де тест не починали,** не повинно створювати набір/чернетку і блокувати власну спробу — тест у Task 5.
- **Два тести в одному браузері** не змішують відповіді (різні ключі, різні `name` у радіокнопках) — тест у Task 5.
- **Python не завантажився (офлайн):** питання з варіантами проходяться, а практичні отримують 0 з поясненням, без винятків у консолі — тест у Task 4.

## Як запускати тести

- **Python-обв'язка (CPython):** `python3 -m unittest tests/test_harness.py -v` з кореня репозиторію.
- **Браузерні тести:** локальний сервер `.claude/launch.json` → конфігурація `site` (`python3 -m http.server 8765`). Відкрити `http://localhost:8765/tests/checks.html` у вбудованому браузері (`preview_start` з `name: "site"`, потім `navigate`). Дочекатися, поки `#summary` покаже `PASS n FAIL m` (тести з Pyodide — до ~40 с; прочитати через `javascript_tool`: `window.T_DONE`). Потрібен інтернет (Pyodide з cdn.jsdelivr.net).
- **Сайт:** `http://localhost:8765/#/…`.

---

## Файли

| Файл | Дія | Відповідальність |
|---|---|---|
| `.claude/launch.json` | створити | локальний сервер для перевірок |
| `tests/runner.js` | створити | мінімальний раннер: `T.test`, `T.eq`, `T.ok`, `T.until`, `T.run` |
| `tests/checks.html` | створити | сторінка браузерних тестів |
| `tests/fixtures/engineering-legacy.js` | створити | «золоте» посилання й результат, зроблені старим кодом |
| `tests/fixtures/toy.js` | створити | маленький тест із трьома типами завдань для юніт- та інтеграційних тестів |
| `tests/core.test.js` | створити | тести `CheckCore` |
| `tests/test_harness.py` | створити | тести Python-обв'язки на CPython |
| `tests/python.test.js` | створити | тести `CheckPy` у Pyodide |
| `tests/engine.test.js` | створити | інтеграційні тести `CheckEngine` + сумісність інженерного тесту |
| `tests/pools.test.js` | створити | самоперевірка пулів усіх трьох тестів |
| `js/checks/core.js` | створити | чисте ядро: вибір варіантів, бали, вивід, пункти результату, посилання |
| `js/checks/harness.js` | створити | Python-код обв'язки (рядок) |
| `js/checks/python.js` | створити | Pyodide: запуск, оцінювання, `validate` |
| `js/checks/engine.js` | створити | DOM-рушій сторінки тесту |
| `js/checks/engineering/check.js` | створити | дані інженерного тесту |
| `js/checks/grade9/base.js` | створити | дані 9 класу |
| `js/checks/grade9/plus.js` | створити | дані розширеного варіанту |
| `js/pages/check.js` | видалити | логіка переїхала в `js/checks/` |
| `js/pyeditor.js` | змінити коментар | згадка `js/pages/check.js` → `js/checks/engine.js` |
| `js/app.js` | змінити | маршрути `tests` + `hidden` |
| `index.html` | змінити | контейнери тестів, сторінка `#/tests`, картка на головній, скрипти |
| `css/check.css` | змінити | клас прогресу, стилі програм, сторінки `#/tests` |
| `docs/superpowers/specs/2026-09-24-tests-hub-grade9-design.md` | змінити | §7.1: ліміт кроків через AST замість `sys.settrace` |

---

### Task 1: Тестова інфраструктура й «золоте» посилання від старого коду

**Files:**
- Create: `.claude/launch.json`, `tests/runner.js`, `tests/checks.html`, `tests/fixtures/engineering-legacy.js`

**Interfaces:**
- Produces: `window.T = { test(name, fn), eq(actual, expected, msg?), ok(cond, msg?), until(cond, ms?), run() }`; після `run()` — `window.T_DONE = { pass, fail }`. `window.LEGACY_ENGINEERING = { link, pick, result }`.

- [ ] **Step 1: Сервер для перевірок**

Create `.claude/launch.json`:

```json
{
  "version": "0.0.1",
  "configurations": [
    {
      "name": "site",
      "runtimeExecutable": "python3",
      "runtimeArgs": ["-m", "http.server", "8765"],
      "port": 8765
    }
  ]
}
```

- [ ] **Step 2: Раннер**

Create `tests/runner.js`:

```js
/* Мінімальний тест-раннер для tests/checks.html. Тести виконуються по черзі,
   у порядку реєстрації; fn може бути async. Підсумок — у #summary і
   window.T_DONE (його читає агент через javascript_tool). */
"use strict";
window.T = (function(){
  const cases = [];
  const fmt = (v) => { try { return JSON.stringify(v); } catch(e){ return String(v); } };

  function test(name, fn){ cases.push({ name, fn }); }
  function eq(actual, expected, msg){
    if(fmt(actual) !== fmt(expected))
      throw new Error((msg ? msg + ": " : "") + "очікувалось " + fmt(expected) + ", отримано " + fmt(actual));
  }
  function ok(cond, msg){ if(!cond) throw new Error(msg || "умова хибна"); }
  /* чекає, поки cond() стане правдою; кидає помилку через ms мілісекунд */
  async function until(cond, ms){
    const end = Date.now() + (ms || 40000);
    while(!cond()){
      if(Date.now() > end) throw new Error("не дочекались: " + cond);
      await new Promise(r => setTimeout(r, 50));
    }
  }
  async function run(){
    const out = document.getElementById("out");
    let pass = 0, fail = 0;
    for(const c of cases){
      const li = document.createElement("li");
      try { await c.fn(); pass++; li.className = "pass"; li.textContent = "✓ " + c.name; }
      catch(err){
        fail++; li.className = "fail";
        li.textContent = "✗ " + c.name + " — " + (err && err.message ? err.message : err);
        console.error(c.name, err);
      }
      out.appendChild(li);
    }
    const summary = document.getElementById("summary");
    summary.textContent = `PASS ${pass} FAIL ${fail}`;
    summary.className = fail ? "fail" : "pass";
    window.T_DONE = { pass, fail };
  }
  return { test, eq, ok, until, run };
})();
```

- [ ] **Step 3: Сторінка тестів**

Create `tests/checks.html`:

```html
<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8">
<title>Тести самостійних робіт</title>
<style>
  body{font:14px/1.5 system-ui, sans-serif; margin:24px; max-width:960px}
  .pass{color:#075c42} .fail{color:#8f2419}
  #summary{font-weight:700; font-size:18px}
  #sandbox{margin-top:40px; border-top:1px dashed #ccc; padding-top:20px}
</style>
</head>
<body>
<h1>Тести самостійних робіт</h1>
<p id="summary">Виконується…</p>
<ul id="out"></ul>

<!-- сюди інтеграційні тести монтують тестові сторінки рушія -->
<div id="sandbox"></div>

<script>window.PageInit = {};</script>
<script src="../js/pyeditor.js"></script>
<script src="runner.js"></script>
<!-- МОДУЛІ: додаються по задачах плану -->
<!-- ТЕСТИ: додаються по задачах плану -->
<script>T.run();</script>
</body>
</html>
```

- [ ] **Step 4: Запустити сервер і переконатися, що порожня сторінка тестів працює**

`preview_start` з `name: "site"`, потім `navigate` на `http://localhost:8765/tests/checks.html`, потім `javascript_tool`: `window.T_DONE`.
Expected: `{"pass":0,"fail":0}`.

- [ ] **Step 5: Зняти «золоте» посилання старим кодом**

Поки `js/pages/check.js` ще не змінено, у вбудованому браузері `navigate` на `http://localhost:8765/#/check`, потім `javascript_tool`:

```js
const ORDER = [0, 1, 2, 3];
const pick = {
  vars_mcq:{variant:0, order:ORDER}, cond_mcq:{variant:0, order:ORDER}, loops_mcq:{variant:0, order:ORDER},
  list_mcq:{variant:0, order:ORDER}, dict_mcq:{variant:0, order:ORDER},
  vars_code:{variant:0}, cond_code:{variant:0}, loops_code:{variant:0}, list_code:{variant:0}
};
const draft = {
  mcq:{ vars_mcq:0, cond_mcq:1, loops_mcq:2, dict_mcq:0 },
  code:{
    vars_code:"def order_total(price_text, quantity_text):\n    return int(price_text) * int(quantity_text)\n",
    cond_code:"def grade_label(score):\n    if score >= 10:\n        return \"відмінно\"\n    elif score >= 7:\n        return \"добре\"\n    elif score >= 4:\n        return \"задовільно\"\n    else:\n        return \"незадовільно\"\n",
    list_code:"def only_positive(numbers):\n    return numbers\n"
  }
};
localStorage.setItem("pyguide_check_pick", JSON.stringify(pick));
localStorage.setItem("pyguide_check_draft", JSON.stringify(draft));
localStorage.removeItem("pyguide_check_result");
location.reload();
```

Потім дочекатися завантаження Python (`javascript_tool`, повторювати, поки не `true`): `!document.getElementById("check-body").hidden`.
Потім: `const b = document.getElementById("check-finish-btn"); b.click(); b.click();`
Потім (повторювати, поки не рядок): `document.querySelector(".checkr-share-url") && document.querySelector(".checkr-share-url").value`.
Потім зібрати дані:

```js
JSON.stringify({
  link: "#" + document.querySelector(".checkr-share-url").value.split("#")[1],
  pick: JSON.parse(localStorage.getItem("pyguide_check_pick")),
  result: JSON.parse(localStorage.getItem("pyguide_check_result"))
})
```

Expected: `result.total === 5.5` (1 + 0.5 + 0 + 0 + 1 за питання, 1 + 2 + 0 + 0 за код), `link` починається з `#/check/r/z`.

- [ ] **Step 6: Зберегти фікстуру й прибрати за собою**

Create `tests/fixtures/engineering-legacy.js` — вставити JSON із кроку 5 як є:

```js
/* Знято старим js/pages/check.js (до переїзду в js/checks/), див. план,
   Task 1, крок 5. Не редагувати вручну: це еталон сумісності старих
   посилань і збережених результатів інженерної школи. */
window.LEGACY_ENGINEERING = /* JSON із кроку 5 */;
```

(замість коментаря `/* JSON із кроку 5 */` — буквальний об'єкт, отриманий у кроці 5.)

Прибрати тестові ключі з браузера: `["pick","draft","result"].forEach(k => localStorage.removeItem("pyguide_check_" + k))`.

- [ ] **Step 7: Commit**

```bash
git add .claude/launch.json tests/runner.js tests/checks.html tests/fixtures/engineering-legacy.js
git commit -m "Add browser test runner and legacy engineering share-link fixture"
```

---

### Task 2: Чисте ядро `CheckCore`

**Files:**
- Create: `js/checks/core.js`, `tests/fixtures/toy.js`, `tests/core.test.js`
- Modify: `tests/checks.html`

**Interfaces:**
- Consumes: нічого (працює без DOM і Python; `packShare`/`unpackShare` — браузерні `CompressionStream`, `Response`, `Blob`).
- Produces: `window.CheckCore` з функціями:
  - `makePick(slots, rnd?) → { [slotId]: { variant:number, order?:number[] } }`
  - `maxPoints(slots) → number`; `fmtPoints(n) → string`; `pointsWord(n) → string`; `pointsLabel(n) → string`
  - `normOutput(text) → string`; `sameOutput(actual, expected) → boolean`; `FAIL_OUT_MAX = 500`
  - `mcqItem(slot, variantIdx, chosenIdx|null)`, `codeItem(slot, variantIdx, source, passed, error)`, `programItem(slot, variantIdx, source, grade)` де `grade = { passed, error, failIdx, failOut }`
  - `withTotal(slots, items, finishedAt) → { total, max, items, finishedAt }`
  - `codeDiff(base, s) → 0 | [p, q, middle]`; `applyDiff(base, d) → string | null`; `starterSum(variants) → string`
  - `buildPayload(slots, version, result, savedPick) → array | null`
  - `parsePayload(slots, version, payload) → result | null | "stale"`
  - `packShare(obj) → Promise<string>`; `unpackShare(str) → Promise<any>`
- Пункт `program` у результаті: `{ slotId, type:"program", topic, points, variant, earned, passed, title, yourCode, error, failIdx, failInput, failExpected, failOut, solution }`.
- Пункт `mcq` отримує `code`, лише якщо він є у варіанті (інакше об'єкт такий самий, як раніше).

- [ ] **Step 1: Тестовий міні-тест (фікстура)**

Create `tests/fixtures/toy.js`:

```js
/* Маленький тест з усіма трьома типами завдань і дробовими балами —
   для тестів ядра, Python і рушія. Разом 0.5 + 2 + 1.5 = 4 бали. */
window.TOY_SLOTS = [
  { id:"q", type:"mcq", topic:"Питання", points:0.5, variants:[
    { q:"Оберіть a", options:[
        { text:"a", credit:1 }, { text:"b", credit:0.5 }, { text:"c", credit:0 }, { text:"d", credit:0 }
      ], explain:"Бо a." },
    { q:"Що виведе програма?", code:"print(1)", options:[
        { text:"1", credit:1 }, { text:"2", credit:0 }, { text:"3", credit:0 }, { text:"4", credit:0 }
      ], explain:"print(1) виводить 1." }
  ]},
  { id:"f", type:"code", topic:"Функція", points:2, variants:[
    { title:"Подвоєння", fn:"double", sig:"double(x)", intro:"Поверни x * 2.", hint:"return x * 2",
      starter:"def double(x):\n    raise NotImplementedError(\"double ще не реалізовано\")\n",
      tests:[ { args:[1], expected:2 }, { args:[0], expected:0 }, { args:[-3], expected:-6 } ],
      solution:"def double(x):\n    return x * 2\n" }
  ]},
  { id:"p", type:"program", topic:"Програма", points:1.5, variants:[
    { title:"Сума", intro:"Зчитай два числа й виведи суму.", hint:"int(input())",
      starter:"# Зчитай два цілі числа й виведи їхню суму.\n",
      sample:"1\n2", sampleOut:"3",
      tests:[ { input:"1\n2", output:"3" }, { input:"5\n5", output:"10" }, { input:"0\n0", output:"0" }, { input:"-1\n1", output:"0" } ],
      solution:"a = int(input())\nb = int(input())\nprint(a + b)\n" }
  ]}
];
```

- [ ] **Step 2: Написати тести ядра (падають — модуля ще немає)**

Create `tests/core.test.js`:

```js
"use strict";
(function(){
const C = () => window.CheckCore;
const S = () => window.TOY_SLOTS;

/* детермінований «random» для makePick */
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

T.test("core: makePick дає варіант у межах і перестановку відповідей", () => {
  const pick = C().makePick(S(), seq(0.99, 0.1, 0.5, 0.2, 0.7, 0.3));
  T.eq(pick.q.variant, 1);
  T.eq([...pick.q.order].sort(), [0, 1, 2, 3]);
  T.eq(pick.f, { variant:0 });
  T.eq(pick.p, { variant:0 });
});

T.test("core: бали форматуються без округлення до однієї цифри", () => {
  T.eq([12, 11.5, 0.25, 11.75, 0.1 + 0.2, 0].map(C().fmtPoints), ["12", "11.5", "0.25", "11.75", "0.3", "0"]);
});

T.test("core: слово «бал» узгоджується з числом", () => {
  T.eq([1, 2, 4, 5, 11, 12, 14, 21, 22, 0.5, 11.5].map(C().pointsLabel),
    ["1 бал", "2 бали", "4 бали", "5 балів", "11 балів", "12 балів", "14 балів", "21 бал", "22 бали", "0.5 бала", "11.5 бала"]);
});

T.test("core: вивід — пробіли в кінці рядків і порожні рядки в кінці не рахуються", () => {
  const same = C().sameOutput;
  T.ok(same("8\n", "8"), "\\n у кінці");
  T.ok(same("a  \nb\t\n\n\n", "a\nb"), "пробіли й порожні рядки в кінці");
  T.ok(same("a\r\nb\r\n", "a\nb"), "\\r\\n");
  T.ok(!same(" 8", "8"), "пробіл на початку рахується");
  T.ok(!same("a\n\nb", "a\nb"), "порожній рядок усередині рахується");
  T.ok(!same("Тепло", "тепло"), "регістр рахується");
});

T.test("core: codeDiff / applyDiff туди й назад", () => {
  const base = "def f():\n    # TODO\n    pass\n";
  const mine = "def f():\n    return 42\n";
  T.eq(C().codeDiff(base, base), 0);
  T.eq(C().applyDiff(base, 0), base);
  T.eq(C().applyDiff(base, C().codeDiff(base, mine)), mine);
  T.eq(C().applyDiff(base, [999, 0, ""]), null);
  T.eq(C().applyDiff(base, "x"), null);
});

function toyResult(){
  const s = S();
  return C().withTotal(s, [
    C().mcqItem(s[0], 1, 0),
    C().codeItem(s[1], 0, "def double(x):\n    return x + x\n", true, ""),
    C().programItem(s[2], 0, "print(3)\n", { passed:false, error:"", failIdx:1, failOut:"3\n" })
  ], "2026-09-24T10:00:00.000Z");
}

T.test("core: пункти результату й сума з дробовими балами", () => {
  const r = toyResult();
  T.eq(r.max, 4);
  T.eq(r.total, 2.5);
  T.eq(r.items[0].code, "print(1)");
  T.eq(r.items[2].failInput, "5\n5");
  T.eq(r.items[2].failExpected, "10");
  T.eq(r.items[2].earned, 0);
  T.ok(!("code" in C().mcqItem(S()[0], 0, 0)), "без code у варіанті — без поля code");
});

T.test("core: посилання — buildPayload → parsePayload відновлює результат", () => {
  const r = toyResult();
  const p = C().buildPayload(S(), 1, r, {});
  T.eq(p.length, S().length + 3);
  T.eq(p[3], [1, 0]);
  T.eq(p[5].slice(4), [1, "3\n"]);
  const back = C().parsePayload(S(), 1, p);
  T.eq(back.total, 2.5);
  T.eq(back.items[1].yourCode, r.items[1].yourCode);
  T.eq(back.items[2].failIdx, 1);
  T.eq(back.items[2].failOut, "3\n");
  T.eq(back.finishedAt, "2026-09-24T10:00:00.000Z");
});

T.test("core: посилання — чужа версія, зіпсовані дані, змінений стартовий код", () => {
  const p = C().buildPayload(S(), 1, toyResult(), {});
  T.eq(C().parsePayload(S(), 2, p), null, "інша версія");
  T.eq(C().parsePayload(S(), 1, p.slice(0, -1)), null, "не вистачає пункту");
  const bad = JSON.parse(JSON.stringify(p)); bad[5][4] = 99;
  T.eq(C().parsePayload(S(), 1, bad), null, "індекс набору поза межами");
  const changed = JSON.parse(JSON.stringify(S()));
  changed[2].variants[0].starter += "# нове\n";
  T.eq(C().parsePayload(changed, 1, p), "stale");
});

T.test("core: посилання — старий результат без variant/chosenIdx бере варіант із набору", () => {
  const r = toyResult();
  r.items.forEach(it => { delete it.variant; delete it.chosenIdx; });
  const p = C().buildPayload(S(), 1, r, { q:{ variant:1 }, f:{ variant:0 }, p:{ variant:0 } });
  T.eq(p[3], [1, 0], "варіант із набору, відповідь — за текстом");
  T.eq(C().buildPayload(S(), 1, r, {}), null, "без набору — не вгадуємо");
});

T.test("core: packShare / unpackShare з кирилицею", async () => {
  const obj = [1, "", "abc", [0, 1, [3, 0, "print(\"Привіт, світе!\")"], ""]];
  const s = await C().packShare(obj);
  T.ok(/^[zj][A-Za-z0-9_-]+$/.test(s), "base64url з префіксом");
  T.eq(await C().unpackShare(s), obj);
});
})();
```

Modify `tests/checks.html` — замінити два маркери:

```html
<!-- МОДУЛІ: додаються по задачах плану -->
<script src="../js/checks/core.js"></script>
<script src="fixtures/toy.js"></script>
<!-- ТЕСТИ: додаються по задачах плану -->
<script src="core.test.js"></script>
```

(Маркери-коментарі лишити: наступні задачі додають рядки одразу після них.)

- [ ] **Step 3: Переконатися, що тести падають**

Оновити `http://localhost:8765/tests/checks.html`, `javascript_tool`: `window.T_DONE`.
Expected: `fail` > 0 (помилка `Cannot read properties of undefined` — `CheckCore` ще немає).

- [ ] **Step 4: Реалізація**

Create `js/checks/core.js`:

```js
/* ==========================================================================
   Ядро самостійних робіт — без DOM і без Python: вибір варіантів для учня,
   бали, порівняння виводу програм, пункти результату й посилання на
   результат. Використовують рушій (js/checks/engine.js) і тести
   (tests/checks.html).

   Посилання на результат (#/<slug>/r/<дані>): сервера немає, тож увесь
   результат їде в самому посиланні. Тексти питань, пояснення й розв'язки
   сторінка бере з даних тесту, а в посиланні лише відповіді учня —
   компактним масивом у порядку слотів:
     [версія, час завершення (секунди, base36), контрольна сума, пункти…]
     mcq     — [варіант, вибрана відповідь або -1]
     code    — [варіант, 1/0 тести пройдено, код, помилка]
     program — [варіант, 1/0, код, помилка, перший провалений набір або -1,
                вивід програми на ньому (до 500 символів)]
   Код зберігається як різниця зі стартовим: [скільки символів збігається
   на початку, скільки в кінці, що між ними], або 0, якщо учень його не
   чіпав. Тому стартовий код уже виданих варіантів не можна міняти: старі
   посилання відновили б код неправильно. Контрольна сума стартових кодів
   це ловить і показує помилку замість спотвореного коду. Нове — додавай
   новим варіантом у кінець списку.
   JSON стискається deflate-raw і кодується base64url; перша літера — формат
   ("z" стиснене, "j" — ні, для браузерів без CompressionStream).
   Це не захист: хто захоче, розпакує посилання й підмінить відповіді.
   ========================================================================== */
"use strict";
window.CheckCore = (function(){

/* ============================ вибір варіанта для учня ============================ */
function shuffled(n, rnd){
  const a = Array.from({length:n}, (_, i) => i);
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* кожному слоту — випадковий варіант, а питанням ще й порядок відповідей */
function makePick(slots, rnd){
  rnd = rnd || Math.random;
  const pick = {};
  slots.forEach(slot => {
    const variant = Math.floor(rnd() * slot.variants.length);
    const entry = { variant };
    if(slot.type === "mcq") entry.order = shuffled(slot.variants[variant].options.length, rnd);
    pick[slot.id] = entry;
  });
  return pick;
}

/* ============================ бали ============================ */
const maxPoints = (slots) => slots.reduce((sum, s) => sum + s.points, 0);

/* 12 → "12", 11.5 → "11.5", 0.25 → "0.25" (toFixed(1) дав би "0.3") */
const fmtPoints = (n) => String(Math.round(n * 100) / 100);

/* 1 бал, 2 бали, 5 балів, 21 бал; дробові — завжди «бала»: 0.5 бала */
function pointsWord(n){
  if(!Number.isInteger(n)) return "бала";
  const d = n % 10, dd = n % 100;
  if(d === 1 && dd !== 11) return "бал";
  if(d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return "бали";
  return "балів";
}
const pointsLabel = (n) => fmtPoints(n) + " " + pointsWord(n);

/* ============================ вивід програм ============================ */
/* пробіли в кінці рядків і порожні рядки в кінці не рахуються — решта точно */
function normOutput(text){
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n").map(l => l.replace(/\s+$/, ""));
  while(lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}
const sameOutput = (actual, expected) => normOutput(actual) === normOutput(expected);
const FAIL_OUT_MAX = 500;

/* ============================ пункти результату ============================ */
/* Пункт будується лише з номера варіанта й відповіді учня — так само
   і після тесту, і з посилання, яким поділилися. */
function mcqItem(slot, variantIdx, chosenIdx){
  const variant = slot.variants[variantIdx];
  const opt = chosenIdx != null ? variant.options[chosenIdx] : null;
  const correctIdx = variant.options.findIndex(o => o.credit === 1);
  const item = { slotId:slot.id, type:"mcq", topic:slot.topic, points:slot.points,
    variant:variantIdx, chosenIdx, earned:(opt ? opt.credit : 0) * slot.points,
    question:variant.q, chosenText: opt ? opt.text : null, chosenCredit: opt ? opt.credit : 0,
    correctText: variant.options[correctIdx].text, explain:variant.explain };
  if(variant.code) item.code = variant.code;
  return item;
}

function codeItem(slot, variantIdx, source, passed, error){
  const variant = slot.variants[variantIdx];
  return { slotId:slot.id, type:"code", topic:slot.topic, points:slot.points,
    variant:variantIdx, earned: passed ? slot.points : 0, passed,
    title:variant.title, yourCode:source, error: error || null, solution:variant.solution };
}

/* grade: { passed, error, failIdx (-1, якщо пройдено), failOut } */
function programItem(slot, variantIdx, source, grade){
  const variant = slot.variants[variantIdx];
  const t = grade.failIdx >= 0 ? variant.tests[grade.failIdx] : null;
  return { slotId:slot.id, type:"program", topic:slot.topic, points:slot.points,
    variant:variantIdx, earned: grade.passed ? slot.points : 0, passed: grade.passed,
    title:variant.title, yourCode:source, error: grade.error || null,
    failIdx: grade.failIdx, failInput: t ? t.input : null, failExpected: t ? t.output : null,
    failOut: grade.failOut || "", solution:variant.solution };
}

const withTotal = (slots, items, finishedAt) =>
  ({ total: items.reduce((sum, it) => sum + it.earned, 0), max:maxPoints(slots), items, finishedAt });

/* ============================ посилання на результат ============================ */
/* FNV-1a — короткий відбиток стартових кодів вибраних варіантів */
function starterSum(variants){
  let h = 0x811c9dc5;
  const s = variants.map(v => v.starter).join("\u0000");
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
const codeVariants = (slots, variantOf) =>
  slots.filter(s => s.type === "code" || s.type === "program").map(s => s.variants[variantOf(s)]);

function codeDiff(base, s){
  if(s === base) return 0;
  let p = 0;
  while(p < base.length && p < s.length && base[p] === s[p]) p++;
  let q = 0;
  while(q < base.length - p && q < s.length - p && base[base.length - 1 - q] === s[s.length - 1 - q]) q++;
  return [p, q, s.slice(p, s.length - q)];
}

const isIdx = (n, len) => Number.isInteger(n) && n >= 0 && n < len;

/* зворотне до codeDiff; null — різниця не пасує до цього стартового коду */
function applyDiff(base, d){
  if(d === 0) return base;
  if(!Array.isArray(d) || !isIdx(d[0], base.length + 1) || !isIdx(d[1], base.length + 1 - d[0])
     || typeof d[2] !== "string") return null;
  return base.slice(0, d[0]) + d[2] + base.slice(base.length - d[1]);
}

/* savedPick — набір учня з localStorage: результати, збережені до появи
   посилань, не мають variant/chosenIdx — дістаємо їх звідти й з тексту
   вибраної відповіді */
function buildPayload(slots, version, result, savedPick){
  savedPick = savedPick || {};
  const known = Object.fromEntries(slots.map(s => [s.id, s]));
  const byId = {};
  for(const item of result.items){
    const slot = known[item.slotId];
    const v = item.variant != null ? item.variant : (savedPick[item.slotId] || {}).variant;
    if(!slot || !slot.variants[v]) return null;
    const starter = slot.variants[v].starter;
    if(item.type === "mcq"){
      const idx = item.chosenIdx !== undefined ? item.chosenIdx
        : slot.variants[v].options.findIndex(o => o.text === item.chosenText);
      byId[slot.id] = [v, idx == null || idx < 0 ? -1 : idx];
    } else if(item.type === "code"){
      byId[slot.id] = [v, item.passed ? 1 : 0, codeDiff(starter, item.yourCode), item.error || ""];
    } else {
      byId[slot.id] = [v, item.passed ? 1 : 0, codeDiff(starter, item.yourCode), item.error || "",
        item.failIdx != null ? item.failIdx : -1, item.failOut || ""];
    }
  }
  if(slots.some(s => !byId[s.id])) return null;
  const t = Date.parse(result.finishedAt);
  return [version, isNaN(t) ? "" : Math.round(t / 1000).toString(36),
    starterSum(codeVariants(slots, s => byId[s.id][0])), ...slots.map(s => byId[s.id])];
}

/* зворотне до buildPayload; посилання — чужі дані, тож перевіряємо кожне
   поле. null — посилання пошкоджене, "stale" — створене до зміни
   стартового коду */
function parsePayload(slots, version, p){
  if(!Array.isArray(p) || p[0] !== version || p.length !== slots.length + 3) return null;
  const entries = p.slice(3);
  if(entries.some((e, i) => !Array.isArray(e) || !isIdx(e[0], slots[i].variants.length))) return null;
  if(p[2] !== starterSum(codeVariants(slots, s => entries[slots.indexOf(s)][0]))) return "stale";

  const items = [];
  for(let i = 0; i < slots.length; i++){
    const slot = slots[i], e = entries[i];
    const variant = slot.variants[e[0]];
    if(slot.type === "mcq"){
      if(e[1] !== -1 && !isIdx(e[1], variant.options.length)) return null;
      items.push(mcqItem(slot, e[0], e[1] === -1 ? null : e[1]));
      continue;
    }
    const code = applyDiff(variant.starter, e[2]);
    if(code === null || typeof e[3] !== "string") return null;
    if(slot.type === "code"){
      items.push(codeItem(slot, e[0], code, e[1] === 1, e[3]));
      continue;
    }
    if(!(e[4] === -1 || isIdx(e[4], variant.tests.length)) || typeof e[5] !== "string") return null;
    items.push(programItem(slot, e[0], code, { passed: e[1] === 1, error: e[3], failIdx: e[4], failOut: e[5] }));
  }
  const secs = typeof p[1] === "string" && /^[0-9a-z]{1,9}$/.test(p[1]) ? parseInt(p[1], 36) : NaN;
  return withTotal(slots, items, isNaN(secs) ? null : new Date(secs * 1000).toISOString());
}

function b64url(bytes){
  let bin = "";
  for(let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(str){
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, ch => ch.charCodeAt(0));
}
const pipeBytes = (bytes, transform) =>
  new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer().then(b => new Uint8Array(b));

async function packShare(obj){
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let deflate = null;
  try { deflate = new CompressionStream("deflate-raw"); } catch(e){}
  if(!deflate) return "j" + b64url(bytes);
  return "z" + b64url(await pipeBytes(bytes, deflate));
}
async function unpackShare(str){
  let bytes = unb64url(str.slice(1));
  if(str[0] === "z") bytes = await pipeBytes(bytes, new DecompressionStream("deflate-raw"));
  else if(str[0] !== "j") throw new Error("невідомий формат посилання");
  return JSON.parse(new TextDecoder().decode(bytes));
}

return { makePick, maxPoints, fmtPoints, pointsWord, pointsLabel, normOutput, sameOutput, FAIL_OUT_MAX,
  mcqItem, codeItem, programItem, withTotal, starterSum, codeDiff, applyDiff,
  buildPayload, parsePayload, packShare, unpackShare };

})();
```

- [ ] **Step 5: Переконатися, що тести проходять**

Оновити `http://localhost:8765/tests/checks.html`, `javascript_tool`: `window.T_DONE`.
Expected: `{"pass":10,"fail":0}`.

- [ ] **Step 6: Commit**

```bash
git add js/checks/core.js tests/fixtures/toy.js tests/core.test.js tests/checks.html
git commit -m "Add CheckCore: pick, points, output comparison, share payload"
```

---

### Task 3: Python-обв'язка `CheckHarness`

**Files:**
- Create: `js/checks/harness.js`, `tests/test_harness.py`
- Modify: `docs/superpowers/specs/2026-09-24-tests-hub-grade9-design.md` (§7.1)

**Interfaces:**
- Produces: `window.CheckHarness.PY` — Python-код. Після `exec` у Pyodide доступні:
  - `check_install(name, source) -> str` — `""` або текст помилки (формати як у старому `check.js`: `"Помилка в коді — <Тип>: <текст>"`, `"У коді немає функції <name>(...) — не перейменовуй її."`);
  - `check_test(name, tests_json) -> str` — JSON `{"ok": bool}`;
  - `prog_run(source, input_text, max_steps=MAX_STEPS) -> str` — JSON `{"out": str, "error": str}`;
  - константи `MAX_STEPS = 200000`, `PROG_NO_INPUT`, `PROG_TOO_LONG`.

**Чому не `sys.settrace` (відхід від спеки §7.1):** якщо функція трасування кидає виняток, CPython вимикає трасування. Тоді голий `except:` у коді учня ловить наш виняток, і цикл далі крутиться вже без контролю. Натомість код учня проходить через `ast`, і на початок тіла кожного `for`/`while` вставляється виклик `__tick__()`. Цей виклик стоїть поза `try` учня, тож після вичерпання ліміту він кидає виняток на кожному проході і виносить його з циклу. Бонус: немає накладних витрат трасування на кожен рядок.

- [ ] **Step 1: Написати тести (падають — файлу ще немає)**

Create `tests/test_harness.py`:

```python
"""Тести Python-обв'язки самостійних робіт (js/checks/harness.js).

Обв'язка живе рядком у JS, щоб сайт працював і без сервера; тут вона
витягається з файлу й виконується звичайним CPython.
Запуск з кореня репозиторію: python3 -m unittest tests/test_harness.py -v
"""
import json
import pathlib
import re
import unittest

SRC = pathlib.Path(__file__).resolve().parent.parent / "js" / "checks" / "harness.js"
PY = re.search(r"String\.raw`(.*?)`", SRC.read_text(encoding="utf-8"), re.S).group(1)
H = {}
exec(compile(PY, "harness.py", "exec"), H)


def run(source, inp="", steps=None):
    args = (source, inp) if steps is None else (source, inp, steps)
    return json.loads(H["prog_run"](*args))


class ProgRun(unittest.TestCase):
    def test_reads_input_and_prints(self):
        self.assertEqual(run("a = int(input())\nb = int(input())\nprint(a + b)\n", "2\n3"),
                         {"out": "5\n", "error": ""})

    def test_prompt_is_not_part_of_output(self):
        self.assertEqual(run('n = input("Введи ім\'я: ")\nprint(n)', "Оля")["out"], "Оля\n")

    def test_trailing_newline_in_input_is_ignored(self):
        self.assertEqual(run("a = input()\nb = input()\nprint(a, b)", "x\ny\n")["out"], "x y\n")

    def test_crlf_input(self):
        self.assertEqual(run("print(input())", "5\r\n")["out"], "5\n")

    def test_too_few_inputs(self):
        r = run("a = input()\nb = input()\nprint(a)", "1")
        self.assertEqual(r["error"], H["PROG_NO_INPUT"])

    def test_empty_input_text(self):
        self.assertEqual(run("input()", "")["error"], H["PROG_NO_INPUT"])

    def test_runtime_error_keeps_partial_output(self):
        r = run('print("A")\nx = 1 / 0\nprint("B")')
        self.assertEqual(r["out"], "A\n")
        self.assertTrue(r["error"].startswith("ZeroDivisionError"), r["error"])

    def test_value_error_text(self):
        r = run("n = int(input())", "abc")
        self.assertTrue(r["error"].startswith("ValueError: invalid literal for int()"), r["error"])

    def test_syntax_error(self):
        r = run("if True\n    print(1)")
        self.assertEqual(r["out"], "")
        self.assertTrue(r["error"].startswith("SyntaxError"), r["error"])

    def test_infinite_while_is_stopped(self):
        self.assertEqual(run("while True:\n    pass", steps=1000)["error"], H["PROG_TOO_LONG"])

    def test_infinite_loop_with_bare_except_inside_is_stopped(self):
        src = "while True:\n    try:\n        x = 1\n    except:\n        pass\n"
        self.assertEqual(run(src, steps=1000)["error"], H["PROG_TOO_LONG"])

    def test_catching_everything_around_the_loop_still_terminates(self):
        src = "try:\n    while True:\n        pass\nexcept:\n    print('спіймав')\n"
        self.assertEqual(run(src, steps=1000), {"out": "спіймав\n", "error": ""})

    def test_loop_inside_function_is_counted(self):
        src = "def f():\n    while True:\n        pass\nf()\n"
        self.assertEqual(run(src, steps=1000)["error"], H["PROG_TOO_LONG"])

    def test_legit_long_loop_fits_default_limit(self):
        r = run("t = 0\nfor i in range(100000):\n    t += i\nprint(t)")
        self.assertEqual(r, {"out": "4999950000\n", "error": ""})

    def test_fresh_namespace_each_run(self):
        run("x = 5")
        self.assertTrue(run("print(x)")["error"].startswith("NameError"))

    def test_system_exit_is_a_normal_end(self):
        self.assertEqual(run('print("A")\nraise SystemExit\nprint("B")'), {"out": "A\n", "error": ""})

    def test_random_is_available(self):
        self.assertEqual(run("import random\nprint(random.randint(1, 1))")["out"], "1\n")


class FunctionTasks(unittest.TestCase):
    def install(self, name, src):
        return H["check_install"](name, src)

    def passes(self, name, tests):
        return json.loads(H["check_test"](name, json.dumps(tests)))["ok"]

    def test_correct_function_passes(self):
        self.assertEqual(self.install("double", "def double(x):\n    return x * 2\n"), "")
        self.assertTrue(self.passes("double", [{"args": [2], "expected": 4}, {"args": [0], "expected": 0}]))

    def test_wrong_function_fails(self):
        self.install("double", "def double(x):\n    return x + 1\n")
        self.assertFalse(self.passes("double", [{"args": [2], "expected": 4}, {"args": [0], "expected": 0}]))

    def test_missing_function_message(self):
        self.assertEqual(self.install("double", "def twice(x):\n    return x * 2\n"),
                         "У коді немає функції double(...) — не перейменовуй її.")

    def test_syntax_error_message(self):
        msg = self.install("double", "def double(x)\n    return x\n")
        self.assertTrue(msg.startswith("Помилка в коді — SyntaxError"), msg)

    def test_float_tolerance(self):
        self.install("avg", "def avg(a, b):\n    return (a + b) / 3 * 3 / 2\n")
        self.assertTrue(self.passes("avg", [{"args": [1, 2], "expected": 1.5}]))

    def test_bool_is_not_a_number_match(self):
        self.install("one", "def one():\n    return True\n")
        self.assertFalse(self.passes("one", [{"args": [], "expected": 1.0}]))

    def test_infinite_loop_in_function_fails(self):
        self.install("hang", "def hang():\n    while True:\n        pass\n")
        self.assertFalse(self.passes("hang", [{"args": [], "expected": 1}]))

    def test_input_inside_function_fails_instead_of_blocking(self):
        self.install("ask", "def ask():\n    return input()\n")
        self.assertFalse(self.passes("ask", [{"args": [], "expected": ""}]))

    def test_print_inside_function_is_silenced(self):
        self.install("loud", "def loud():\n    print('шум')\n    return 1\n")
        self.assertTrue(self.passes("loud", [{"args": [], "expected": 1}]))

    def test_unknown_function_fails(self):
        self.assertFalse(self.passes("nope", [{"args": [], "expected": 1}]))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Переконатися, що тести падають**

Run: `python3 -m unittest tests/test_harness.py -v`
Expected: помилка на рівні модуля — `FileNotFoundError: ... js/checks/harness.js`.

- [ ] **Step 3: Реалізація**

Create `js/checks/harness.js`:

```js
/* ==========================================================================
   Python-обв'язка самостійних робіт. Виконується в Pyodide один раз
   (js/checks/python.js), а в тестах — звичайним python3
   (tests/test_harness.py витягає код із цього файлу).

   check_install / check_test — завдання «функція» (тип code): код учня
   встановлюється в окремий простір імен, функцію проганяють на прихованих
   тестах.
   prog_run — завдання «програма» (тип program): код щоразу запускається
   з нуля, input() бере рядки з input_text, print() пишеться в буфер.

   Ліміт: у тіло кожного for/while коду учня вставляється виклик __tick__().
   Після MAX_STEPS проходів він кидає _TooLong на КОЖНОМУ наступному —
   навіть голий except: усередині циклу не втримає нескінченний цикл.
   (sys.settrace тут не годиться: після винятку з трасувальника CPython
   вимикає трасування.)

   Код лежить у String.raw — у ньому не можна бектиків і послідовності
   долар+фігурна дужка.
   ========================================================================== */
"use strict";
window.CheckHarness = { PY: String.raw`
import ast, io, json
from contextlib import redirect_stdout

MAX_STEPS = 200000
PROG_NO_INPUT = "Програма просить більше даних, ніж передбачено умовою"
PROG_TOO_LONG = "Схоже, цикл ніколи не закінчується — програма зробила забагато кроків"


class _NoInput(BaseException):
    pass


class _TooLong(BaseException):
    pass


class _Budget:
    # лічильник проходів циклів коду учня
    def __init__(self, max_steps):
        self.max_steps = max_steps
        self.left = max_steps

    def reset(self):
        self.left = self.max_steps

    def __call__(self):
        self.left -= 1
        if self.left < 0:
            raise _TooLong()


class _AddTicks(ast.NodeTransformer):
    def _tick(self, node):
        self.generic_visit(node)
        tick = ast.Expr(ast.Call(ast.Name("__tick__", ast.Load()), [], []))
        node.body.insert(0, ast.copy_location(tick, node))
        return node

    visit_For = _tick
    visit_While = _tick
    visit_AsyncFor = _tick


def _compile(source, filename):
    tree = _AddTicks().visit(ast.parse(source, filename))
    return compile(ast.fix_missing_locations(tree), filename, "exec")


def _error_text(error):
    if isinstance(error, _TooLong):
        return PROG_TOO_LONG
    if isinstance(error, _NoInput):
        return PROG_NO_INPUT
    return f"{type(error).__name__}: {error}"


def _no_input(prompt=""):
    raise _NoInput()


# ---------------------------------------------------------------- «функція»
_CHECK_FUNCS = {}


def check_install(name, source):
    _CHECK_FUNCS.pop(name, None)
    budget = _Budget(MAX_STEPS)
    namespace = {"__tick__": budget, "input": _no_input}
    try:
        exec(_compile(source, f"{name}.py"), namespace)
    except (Exception, _NoInput, _TooLong) as error:
        return f"Помилка в коді — {_error_text(error)}"
    func = namespace.get(name)
    if not callable(func):
        return f"У коді немає функції {name}(...) — не перейменовуй її."
    _CHECK_FUNCS[name] = (func, budget)
    return ""


def _check_equal(actual, expected):
    try:
        if isinstance(expected, float) and isinstance(actual, (int, float)) and not isinstance(actual, bool):
            return abs(actual - expected) < 1e-6
        return bool(actual == expected)
    except Exception:
        return False


def check_test(name, tests_json):
    entry = _CHECK_FUNCS.get(name)
    if entry is None:
        return json.dumps({"ok": False})
    func, budget = entry
    tests = json.loads(tests_json)
    try:
        for t in tests:
            budget.reset()
            with redirect_stdout(io.StringIO()):
                actual = func(*t["args"])
            if not _check_equal(actual, t["expected"]):
                return json.dumps({"ok": False})
    except (Exception, _NoInput, _TooLong):
        return json.dumps({"ok": False})
    return json.dumps({"ok": True})


# ---------------------------------------------------------------- «програма»
def prog_run(source, input_text, max_steps=MAX_STEPS):
    text = input_text.replace("\r\n", "\n").replace("\r", "\n")
    if text.endswith("\n"):
        text = text[:-1]
    feed = iter(text.split("\n") if text else [])

    def fake_input(prompt=""):
        # підказку не виводимо: у виводі має бути лише те, що друкує print()
        for line in feed:
            return line
        raise _NoInput()

    out = io.StringIO()
    namespace = {"__name__": "__main__", "__tick__": _Budget(max_steps), "input": fake_input}
    try:
        code = _compile(source, "main.py")
    except SyntaxError as error:
        return json.dumps({"out": "", "error": _error_text(error)}, ensure_ascii=False)
    error_text = ""
    try:
        with redirect_stdout(out):
            exec(code, namespace)
    except SystemExit:
        pass
    except (Exception, _NoInput, _TooLong) as error:
        error_text = _error_text(error)
    return json.dumps({"out": out.getvalue(), "error": error_text}, ensure_ascii=False)
` };
```

Зверни увагу: `f"{name}.py"` і `f"{type(error).__name__}: {error}"` — це `{` без долара перед ним, у `String.raw` вони безпечні. Перевір: `grep -n '\${' js/checks/harness.js` не має нічого знаходити.

- [ ] **Step 4: Переконатися, що тести проходять**

Run: `python3 -m unittest tests/test_harness.py -v`
Expected: `Ran 27 tests ... OK`.

Run: `grep -c '\${' js/checks/harness.js; grep -o '\`' js/checks/harness.js | wc -l`
Expected: `0` і `2` (у Python-коді немає `${`, а бектиків рівно два — ті, що відкривають і закривають `String.raw`).

- [ ] **Step 5: Оновити спеку**

У `docs/superpowers/specs/2026-09-24-tests-hub-grade9-design.md`, §7.1, замінити пункт

```
- `sys.settrace` рахує рядкові події; понад `max_steps` (100 000) — зупинка з
  повідомленням «Схоже, цикл ніколи не закінчується»;
```

на

```
- ліміт: код учня проходить через `ast`, у тіло кожного `for`/`while`
  вставляється `__tick__()`; понад `MAX_STEPS` (200 000) проходів — зупинка з
  повідомленням «Схоже, цикл ніколи не закінчується». (`sys.settrace` не
  підходить: після винятку з трасувальника CPython вимикає трасування, і
  голий `except:` у коді учня лишив би цикл без контролю.) Той самий ліміт
  діє й для завдань `code`; `input()` усередині функції — помилка, а не
  діалог браузера;
```

і в тому ж розділі `prog_run(source, input_text, max_steps)` лишити як є.

- [ ] **Step 6: Commit**

```bash
git add js/checks/harness.js tests/test_harness.py docs/superpowers/specs/2026-09-24-tests-hub-grade9-design.md
git commit -m "Add Python harness for function and program tasks with loop budget"
```

---

### Task 4: Обгортка Pyodide `CheckPy`

**Files:**
- Create: `js/checks/python.js`, `tests/python.test.js`
- Modify: `tests/checks.html`

**Interfaces:**
- Consumes: `PyEditor.bootPyodide()` (`js/pyeditor.js`), `CheckHarness.PY` (Task 3), `CheckCore.sameOutput`, `CheckCore.FAIL_OUT_MAX` (Task 2).
- Produces: `window.CheckPy`:
  - `boot() → Promise<void>` (один раз на сторінку; повторні виклики повертають той самий проміс);
  - `isReady() → boolean`;
  - `NOT_READY` — текст помилки, коли Python не завантажився;
  - `install(name, source) → string` (`""` або помилка);
  - `runProgram(source, inputText) → { out, error }`;
  - `gradeCode(variant, source) → { passed, error }`;
  - `gradeProgram(variant, source) → { passed, error, failIdx, failOut }`;
  - `validate(def) → Promise<string[]>` — список проблем пулу (порожній — усе гаразд).

- [ ] **Step 1: Написати тести (падають)**

Create `tests/python.test.js`:

```js
"use strict";
(function(){
const P = () => window.CheckPy;
const S = () => window.TOY_SLOTS;

/* цей тест має йти ДО будь-якого boot(): перевіряє поведінку без Python */
T.test("python: до завантаження все «не пройдено» з поясненням, без винятків", () => {
  T.ok(!P().isReady());
  T.eq(P().runProgram("print(1)", ""), { out:"", error:P().NOT_READY });
  T.eq(P().gradeCode(S()[1].variants[0], S()[1].variants[0].solution), { passed:false, error:P().NOT_READY });
  const g = P().gradeProgram(S()[2].variants[0], S()[2].variants[0].solution);
  T.eq(g, { passed:false, error:P().NOT_READY, failIdx:0, failOut:"" });
});

T.test("python: boot завантажує Pyodide і обв'язку", async () => {
  await P().boot();
  T.ok(P().isReady());
});

T.test("python: runProgram — вивід і помилки", () => {
  T.eq(P().runProgram("print(int(input()) * 2)", "21"), { out:"42\n", error:"" });
  T.ok(P().runProgram("while True:\n    pass", "").error.startsWith("Схоже, цикл ніколи"));
});

T.test("python: gradeProgram — розв'язок проходить, неправильна програма — ні, з першим проваленим набором", () => {
  const v = S()[2].variants[0];
  T.eq(P().gradeProgram(v, v.solution), { passed:true, error:"", failIdx:-1, failOut:"" });
  T.eq(P().gradeProgram(v, "print(3)\n"), { passed:false, error:"", failIdx:1, failOut:"3\n" });
  const crashed = P().gradeProgram(v, "a = int(input())\nprint(a + b)\n");
  T.eq([crashed.passed, crashed.failIdx], [false, 0]);
  T.ok(crashed.error.startsWith("NameError"), crashed.error);
});

T.test("python: gradeProgram обрізає довгий вивід до 500 символів", () => {
  const v = S()[2].variants[0];
  const g = P().gradeProgram(v, "print('x' * 2000)\n");
  T.eq(g.failOut.length, 500);
});

T.test("python: gradeCode", () => {
  const v = S()[1].variants[0];
  T.eq(P().gradeCode(v, v.solution), { passed:true, error:"" });
  T.eq(P().gradeCode(v, v.starter), { passed:false, error:"" });
  T.ok(P().gradeCode(v, "def double(x)\n").error.startsWith("Помилка в коді — SyntaxError"));
});

T.test("python: validate — чистий пул без проблем, зіпсований — з проблемами", async () => {
  T.eq(await P().validate({ slug:"toy", slots:S(), total:4 }), []);
  const bad = JSON.parse(JSON.stringify(S()));
  bad[0].variants[0].options[1].credit = 1;
  bad[1].variants[0].solution = "def double(x):\n    return x\n";
  bad[2].variants[0].sampleOut = "4";
  bad[2].variants[0].tests.pop();
  const problems = await P().validate({ slug:"toy", slots:bad, total:12 });
  T.eq(problems.length, 5, problems.join(" | "));
});
})();
```

Modify `tests/checks.html`: після `<script src="fixtures/toy.js"></script>` додати

```html
<script src="../js/checks/harness.js"></script>
<script src="../js/checks/python.js"></script>
```

а після `<script src="core.test.js"></script>` —

```html
<script src="python.test.js"></script>
```

- [ ] **Step 2: Переконатися, що тести падають**

Оновити сторінку тестів, `window.T_DONE`.
Expected: `fail` ≥ 7 (`CheckPy` не визначено).

- [ ] **Step 3: Реалізація**

Create `js/checks/python.js`:

```js
/* ==========================================================================
   Python для самостійних робіт: один раз запускає Pyodide (спільний з
   практикою через PyEditor.bootPyodide) і обв'язку js/checks/harness.js,
   далі — запуск і оцінювання завдань «функція» й «програма» та
   самоперевірка пулів завдань (validate).
   Поки Python не завантажився (або не зміг — немає інтернету), будь-яка
   перевірка дає «не пройдено» з поясненням NOT_READY, а не кидає помилку.
   ========================================================================== */
"use strict";
window.CheckPy = (function(){

const NOT_READY = "Python не завантажився — це завдання не вдалося перевірити";
let booting = null, fns = null;

function boot(){
  if(!booting) booting = PyEditor.bootPyodide().then(py => {
    py.runPython(CheckHarness.PY);
    fns = { install: py.globals.get("check_install"), test: py.globals.get("check_test"),
            run: py.globals.get("prog_run") };
  });
  return booting;
}
const isReady = () => !!fns;

function install(name, source){
  if(!fns) return NOT_READY;
  try { return fns.install(name, source); } catch(err){ return String(err); }
}
function testsPass(name, tests){
  if(!fns) return false;
  try { return JSON.parse(fns.test(name, JSON.stringify(tests))).ok === true; } catch(err){ return false; }
}
function runProgram(source, inputText){
  if(!fns) return { out:"", error:NOT_READY };
  try { return JSON.parse(fns.run(source, inputText)); }
  catch(err){ return { out:"", error:String(err) }; }
}

function gradeCode(variant, source){
  const error = install(variant.fn, source);
  return { passed: !error && testsPass(variant.fn, variant.tests), error };
}

/* бал лише за всі набори; для першого проваленого запам'ятовуємо вивід */
function gradeProgram(variant, source){
  for(let i = 0; i < variant.tests.length; i++){
    const t = variant.tests[i];
    const r = runProgram(source, t.input);
    if(r.error || !CheckCore.sameOutput(r.out, t.output))
      return { passed:false, error:r.error, failIdx:i, failOut:r.out.slice(0, CheckCore.FAIL_OUT_MAX) };
  }
  return { passed:true, error:"", failIdx:-1, failOut:"" };
}

/* Самоперевірка пулу тесту def = { slug, slots, total? }: розв'язки проходять
   свої тести, стартовий код — ні, у питанні рівно одна повна відповідь,
   сума балів — def.total (за замовчуванням 12). */
async function validate(def){
  await boot();
  const problems = [];
  const add = (msg) => problems.push(msg);
  const total = def.total != null ? def.total : 12;
  const points = CheckCore.maxPoints(def.slots);
  if(points !== total) add(`${def.slug}: сума балів ${points}, а має бути ${total}`);
  const ids = def.slots.map(s => s.id);
  if(new Set(ids).size !== ids.length) add(`${def.slug}: id слотів повторюються`);

  def.slots.forEach(slot => slot.variants.forEach((v, vi) => {
    const where = `${def.slug}/${slot.id}#${vi}`;
    if(slot.type === "mcq"){
      const full = v.options.filter(o => o.credit === 1).length;
      if(full !== 1) add(`${where}: повних відповідей ${full}, а має бути 1`);
      if(v.options.length !== 4) add(`${where}: варіантів ${v.options.length}, а має бути 4`);
      if(!v.explain) add(`${where}: немає пояснення`);
      return;
    }
    if(slot.type === "code"){
      if(!gradeCode(v, v.solution).passed) add(`${where}: розв'язок не проходить тести`);
      if(gradeCode(v, v.starter).passed) add(`${where}: стартовий код проходить тести`);
      return;
    }
    const g = gradeProgram(v, v.solution);
    if(!g.passed) add(`${where}: розв'язок не проходить набір ${g.failIdx}: ${g.error || JSON.stringify(g.failOut)}`);
    if(gradeProgram(v, v.starter).passed) add(`${where}: стартовий код проходить тести`);
    if(v.tests.length < 4) add(`${where}: прихованих наборів ${v.tests.length}, а треба щонайменше 4`);
    const s = runProgram(v.solution, v.sample);
    if(s.error || !CheckCore.sameOutput(s.out, v.sampleOut)) add(`${where}: розв'язок на прикладі виводить не sampleOut`);
  }));
  return problems;
}

return { NOT_READY, boot, isReady, install, runProgram, gradeCode, gradeProgram, validate };

})();
```

Примітка: у тесті «зіпсований пул» очікується 5 проблем. Це сума балів 4 ≠ 12, дві повні відповіді, розв'язок `double` не проходить тести, 3 набори замість 4 і `sampleOut` не збігається.

- [ ] **Step 4: Переконатися, що тести проходять**

Оновити сторінку тестів, `window.T_DONE`.
Expected: `{"pass":17,"fail":0}`.

- [ ] **Step 5: Commit**

```bash
git add js/checks/python.js tests/python.test.js tests/checks.html
git commit -m "Add CheckPy: Pyodide boot, grading and pool validation"
```

---

### Task 5: Рушій `CheckEngine` і переїзд інженерного тесту

**Files:**
- Create: `js/checks/engine.js`, `js/checks/engineering/check.js`, `tests/engine.test.js`
- Delete: `js/pages/check.js`
- Modify: `index.html` (секція `#page-check`, скрипти, версія `check.css`), `css/check.css`, `js/pyeditor.js` (коментар), `tests/checks.html`

**Interfaces:**
- Consumes: `CheckCore.*` (Task 2), `CheckPy.*` (Task 4), `PyEditor.esc`, `PyEditor.highlight`, `PyEditor.wireEditor`, глобальний `window.PageInit`.
- Produces: `window.CheckEngine = { define(def), get(slug), selfTest(slug?) }`.
  - `def = { slug, storage, title, lede, rules, slots, acHidden?, shareVersion? }`; `define` виставляє `shareVersion` (за замовчуванням 1) і `acHidden` (за замовчуванням `{}`) та реєструє `window.PageInit[slug]`.
  - Розмітка: у `index.html` для кожного тесту `<section class="page" id="page-<slug>" hidden><div class="wrap wide"><div data-check-root></div></div></section>`; рушій малює все всередині `[data-check-root]` (не чіпає `.wrap`, куди роутер додає «далі / назад»).

- [ ] **Step 1: Написати тести (падають)**

Create `tests/engine.test.js`:

```js
"use strict";
(function(){
const TOY = "toy", TOY2 = "toy2";
const keys = (prefix) => ["_pick", "_draft", "_result"].map(k => prefix + k);
const clear = (prefix) => keys(prefix).forEach(k => localStorage.removeItem(k));
const root = (slug) => document.querySelector(`#page-${slug} [data-check-root]`);
const $in = (slug, sel) => root(slug).querySelector(sel);

function sandbox(slug){
  const sec = document.createElement("section");
  sec.id = "page-" + slug;
  sec.innerHTML = `<div class="wrap wide"><div data-check-root></div></div>`;
  document.getElementById("sandbox").appendChild(sec);
}
function defineToy(slug){
  clear("test_" + slug);
  sandbox(slug);
  CheckEngine.define({ slug, storage:"test_" + slug, title:"Тестовий тест " + slug,
    lede:"Лід", rules:"Правила", slots:JSON.parse(JSON.stringify(TOY_SLOTS)), total:4 });
}
function type(ta, value){
  ta.value = value;
  ta.dispatchEvent(new Event("input", { bubbles:true }));
}

T.test("engine: define реєструє сторінку й get повертає тест", () => {
  defineToy(TOY);
  defineToy(TOY2);
  T.eq(typeof PageInit[TOY], "function");
  T.eq(CheckEngine.get(TOY).shareVersion, 1);
});

T.test("engine: сторінка малюється з прогресом «0 з 3» і трьома завданнями", async () => {
  PageInit[TOY]();
  PageInit[TOY2]();
  T.eq($in(TOY, "h1").textContent, "Тестовий тест toy");
  T.eq($in(TOY, '[data-part="progress-text"]').textContent, "Відповіли 0 з 3");
  T.eq(root(TOY).querySelectorAll(".checkq").length, 3);
  T.ok($in(TOY, ".checkq-n").textContent.includes("0.5 бала"));
  await T.until(() => !$in(TOY, '[data-part="body"]').hidden);
});

T.test("engine: відповідь на питання рахується в прогресі й пишеться в чернетку свого тесту", () => {
  const radio = $in(TOY, '[data-slot="q"] input[type=radio]');
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles:true }));
  T.eq($in(TOY, '[data-part="progress-text"]').textContent, "Відповіли 1 з 3");
  T.eq(JSON.parse(localStorage.getItem("test_toy_draft")).mcq.q, +radio.value);
  T.ok(radio.name !== $in(TOY2, '[data-slot="q"] input[type=radio]').name, "різні name у різних тестах");
  T.eq($in(TOY2, '[data-part="progress-text"]').textContent, "Відповіли 0 з 3", "інший тест не змінився");
});

T.test("engine: «Запустити» в програмі показує вивід на введених даних", () => {
  const card = $in(TOY, '[data-slot="p"]');
  type(card.querySelector('[data-role="editor"]'), "a = int(input())\nb = int(input())\nprint(a + b)\n");
  type(card.querySelector('[data-role="stdin"]'), "40\n2");
  card.querySelector('[data-act="run"]').click();
  T.eq(card.querySelector('[data-role="out"]').textContent, "42\n");
  T.ok(card.querySelector('[data-role="msg"]').classList.contains("good"));
  T.eq(JSON.parse(localStorage.getItem("test_toy_draft")).stdin.p, "40\n2");
});

T.test("engine: нескінченний цикл у «Запустити» не вішає сторінку", () => {
  const card = $in(TOY, '[data-slot="p"]');
  const before = card.querySelector('[data-role="editor"]').value;
  type(card.querySelector('[data-role="editor"]'), "while True:\n    pass\n");
  card.querySelector('[data-act="run"]').click();
  T.ok(card.querySelector('[data-role="msg"]').textContent.startsWith("Схоже, цикл ніколи"));
  type(card.querySelector('[data-role="editor"]'), before);
});

T.test("engine: завершення — бал, збережений результат, посилання", async () => {
  const card = $in(TOY, '[data-slot="f"]');
  type(card.querySelector('[data-role="editor"]'), "def double(x):\n    return x * 2\n");
  const btn = $in(TOY, '[data-part="finish"]');
  btn.click();
  T.ok(!localStorage.getItem("test_toy_result"), "перше натискання лише просить підтвердження");
  btn.click();
  const saved = JSON.parse(localStorage.getItem("test_toy_result"));
  const q = saved.items[0];
  T.eq(saved.total, q.earned + 2 + 1.5);
  T.eq(saved.max, 4);
  T.ok(!localStorage.getItem("test_toy_draft"), "чернетку прибрано");
  T.ok($in(TOY, ".checkr-score-n").textContent.startsWith(CheckCore.fmtPoints(saved.total)));
  await T.until(() => !$in(TOY, ".checkr-share").hidden);
  const url = $in(TOY, ".checkr-share-url").value;
  T.ok(url.includes("#/toy/r/"), url);
  window.__toyLink = url.split("#")[1];
});

T.test("engine: чуже посилання в браузері, де тест не починали, — той самий результат і нічого в localStorage", async () => {
  const slug = "toy4";                           /* свіжий тест з тими самими слотами */
  defineToy(slug);
  const saved = JSON.parse(localStorage.getItem("test_toy_result"));
  location.hash = "#/" + slug + "/r/" + window.__toyLink.replace(/^\/toy\/r\//, "");
  PageInit[slug]();                              /* як роутер: сторінка вперше відкривається за посиланням */
  await T.until(() => $in(slug, ".checkr-own"));
  T.eq($in(slug, ".checkr-score-n").textContent, CheckCore.fmtPoints(saved.total) + " / 4");
  T.ok(!localStorage.getItem("test_toy4_pick"), "перегляд посилання не створює набір");
  T.ok(!localStorage.getItem("test_toy4_draft"), "і чернетку");
  T.ok(!localStorage.getItem("test_toy4_result"), "і не блокує власну спробу");
  history.replaceState(null, "", location.pathname);
});

T.test("engine: результат програми з проваленим набором показує «ввели → очікувалось → вивела»", async () => {
  const slug = "toy3";
  defineToy(slug);
  PageInit[slug]();
  await T.until(() => !$in(slug, '[data-part="body"]').hidden);
  type($in(slug, '[data-slot="p"] [data-role="editor"]'), "print(3)\n");
  const btn = $in(slug, '[data-part="finish"]');
  btn.click(); btn.click();
  const io = $in(slug, ".checkr-io");
  T.ok(io, "є блок діагностики");
  T.ok(io.textContent.includes("5\n5") && io.textContent.includes("10"), io.textContent);
});
})();
```

Потім допиши в кінець того самого файлу тести сумісності інженерного тесту:

```js
(function(){
const L = () => window.LEGACY_ENGINEERING;
const data = () => L().link.match(/^#\/check\/r\/([A-Za-z0-9_-]+)$/)[1];

T.test("інженерний: старе посилання розбирається з тим самим результатом", async () => {
  const def = CheckEngine.get("check");
  T.eq(def.shareVersion, 2);
  const r = CheckCore.parsePayload(def.slots, def.shareVersion, await CheckCore.unpackShare(data()));
  T.ok(r && r !== "stale", "посилання розібралось");
  T.eq(r.total, L().result.total);
  T.eq(r.items.map(i => i.earned), L().result.items.map(i => i.earned));
  T.eq(r.items.map(i => i.yourCode || null), L().result.items.map(i => i.yourCode || null));
});

T.test("інженерний: новий код будує байт-у-байт той самий payload зі збереженого результату", async () => {
  const def = CheckEngine.get("check");
  const legacy = await CheckCore.unpackShare(data());
  T.eq(CheckCore.buildPayload(def.slots, def.shareVersion, L().result, L().pick), legacy);
});

T.test("інженерний: результат без variant/chosenIdx (з часів до посилань) теж дає той самий payload", async () => {
  const def = CheckEngine.get("check");
  const old = JSON.parse(JSON.stringify(L().result));
  old.items.forEach(it => { delete it.variant; delete it.chosenIdx; });
  T.eq(CheckCore.buildPayload(def.slots, def.shareVersion, old, L().pick), await CheckCore.unpackShare(data()));
});
})();
```

Modify `tests/checks.html`: після `<script src="../js/checks/python.js"></script>` додати

```html
<script src="../js/checks/engine.js"></script>
<script src="../js/checks/engineering/check.js"></script>
<script src="fixtures/engineering-legacy.js"></script>
```

а після `<script src="python.test.js"></script>` —

```html
<script src="engine.test.js"></script>
```

- [ ] **Step 2: Переконатися, що тести падають**

Оновити сторінку тестів, `window.T_DONE`.
Expected: `fail` ≥ 11 (`CheckEngine` не визначено).

- [ ] **Step 3: Рушій**

Create `js/checks/engine.js`:

```js
/* ==========================================================================
   Рушій самостійних робіт. Кожен тест — окремий файл у js/checks/<клас>/,
   який викликає CheckEngine.define({...}). Рушій будує сторінку тесту
   #/<slug>, при першому візиті видає учневі свій набір (варіант кожного
   завдання й порядок відповідей), зберігає чернетку й остаточний результат
   у localStorage (одна спроба) і показує результат за посиланням
   #/<slug>/r/<дані> у будь-якому браузері.

   Типи завдань:
     mcq     — варіанти відповіді; credit 1 / 0.5 (логіка правильна, але
               синтаксична помилка) / 0, помножений на points слота;
               необов'язкове поле code — програма для питань «що виведе?»;
     code    — написати функцію; перевіряється прихованими тестами;
     program — написати програму з input()/print(); рушій підставляє
               приховані вхідні дані й звіряє вивід.
   Чисті функції (бали, пункти результату, посилання) — js/checks/core.js,
   Python — js/checks/python.js.
   ========================================================================== */
"use strict";
window.CheckEngine = (function(){

const C = CheckCore;
const esc = PyEditor.esc;
const DEFS = {};

const store = {
  get(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { window.localStorage.setItem(k, v); } catch(e){} },
  del(k){ try { window.localStorage.removeItem(k); } catch(e){} }
};
const readJSON = (k, fallback) => {
  const raw = store.get(k);
  if(raw === null) return fallback;
  try { return JSON.parse(raw); } catch(e){ return fallback; }
};
const writeJSON = (k, v) => store.set(k, JSON.stringify(v));

/* def: { slug, storage, title, lede, rules, slots, acHidden?, shareVersion? } */
function define(def){
  def.shareVersion = def.shareVersion || 1;
  def.acHidden = def.acHidden || {};
  DEFS[def.slug] = def;
  window.PageInit[def.slug] = () => mount(def);
}
const get = (slug) => DEFS[slug];

/* з консолі браузера: await CheckEngine.selfTest()  або  selfTest("check-9") */
async function selfTest(slug){
  const slugs = slug ? [slug] : Object.keys(DEFS);
  const problems = [];
  for(const s of slugs) problems.push(...await CheckPy.validate(DEFS[s]));
  if(problems.length) console.error("Самоперевірка: проблеми\n" + problems.join("\n"));
  else console.info("Самоперевірка: усе гаразд — " + slugs.join(", "));
  return problems;
}

function skeleton(def){
  return `
  <header class="top">
    <h1>${esc(def.title)}</h1>
    <p class="lede">${def.lede}</p>
  </header>

  <div class="callout warn" data-part="rules"><p>${def.rules}</p></div>

  <div class="hero check-hero" data-part="progress-wrap">
    <div class="check-prog">
      <div class="check-prog-bar"><i data-part="progress-fill"></i></div>
      <span class="check-prog-text" data-part="progress-text"></span>
    </div>
  </div>

  <div class="store-loading" data-part="loading">
    <span class="shop-spin" aria-hidden="true"></span>
    <span>Готуємо завдання й запускаємо Python у браузері… Уперше це може зайняти кілька секунд.</span>
  </div>

  <div data-part="body" hidden>
    <div data-part="slots"></div>
    <div class="check-finish">
      <button type="button" class="ctl primary" data-part="finish">Завершити тест</button>
      <p class="check-finish-note">Після завершення побачиш бали й правильні відповіді. Змінити відповіді потім буде не можна.</p>
    </div>
  </div>

  <div data-part="results" hidden></div>`;
}

/* ================================================================== сторінка тесту */
function mount(def){
  const SLOTS = def.slots;
  const KEY = { pick: def.storage + "_pick", draft: def.storage + "_draft", result: def.storage + "_result" };
  const OWN_RE = new RegExp("^#/?" + def.slug + "(/|$)");
  const SHARE_RE = new RegExp("^#/?" + def.slug + "/r/([A-Za-z0-9_-]+)$");

  const root = document.querySelector(`#page-${def.slug} [data-check-root]`);
  root.innerHTML = skeleton(def);
  const $p = (name) => root.querySelector(`[data-part="${name}"]`);
  const cardOf = (slot) => root.querySelector(`[data-slot="${slot.id}"]`);
  const part = (card, role) => card.querySelector(`[data-role="${role}"]`);

  /* ---------- набір учня ---------- */
  /* Набір створюється лише тоді, коли учень справді відкриває свій тест, —
     перегляд чужого результату за посиланням нічого не записує. */
  let pick = null;
  function ensurePick(){
    pick = readJSON(KEY.pick, null);
    if(!pick){
      pick = C.makePick(SLOTS);
      writeJSON(KEY.pick, pick);
    }
  }
  const variantOf = (slot) => slot.variants[pick[slot.id].variant];

  /* ---------- чернетка ---------- */
  const draft = readJSON(KEY.draft, null) || {};
  draft.mcq = draft.mcq || {};
  draft.code = draft.code || {};
  draft.stdin = draft.stdin || {};
  const saveDraft = () => writeJSON(KEY.draft, draft);

  /* ---------- картки завдань ---------- */
  const head = (slot, n) =>
    `<div class="checkq-head"><span class="checkq-n">Завдання ${n} · ${C.pointsLabel(slot.points)}</span></div>`;

  const editorHtml = (label) => `
      <div class="pyed">
        <pre class="pyed-hl pysrc" data-role="hl" aria-hidden="true"></pre>
        <textarea class="pyed-ta" data-role="editor" spellcheck="false" autocapitalize="off"
          autocomplete="off" autocorrect="off" data-gramm="false" aria-label="${esc(label)}"></textarea>
      </div>`;

  const controlsHtml = (hint) => `
      <div class="controls pyt-controls">
        <details class="pyt-hint"><summary>Підказка</summary><p>${esc(hint)}</p></details>
        <span class="pyt-kbd">Ctrl+Enter — запустити</span>
        <button type="button" class="ctl" data-act="run" disabled>▶ Запустити</button>
      </div>
      <div class="pyt-msg" data-role="msg" hidden></div>`;

  function mcqCard(slot, n){
    const variant = variantOf(slot);
    const chosen = draft.mcq[slot.id];
    const opts = pick[slot.id].order.map(idx => {
      const opt = variant.options[idx];
      const on = chosen === idx;
      return `<label class="checkq-opt${on ? " on" : ""}" data-idx="${idx}">
        <input type="radio" name="mcq_${def.slug}_${slot.id}" value="${idx}" ${on ? "checked" : ""}>
        <pre>${esc(opt.text)}</pre>
      </label>`;
    }).join("");
    return `
    <article class="checkq" data-slot="${slot.id}" data-type="mcq">
      ${head(slot, n)}
      <p class="checkq-text">${esc(variant.q)}</p>
      ${variant.code ? `<pre class="checkq-code pysrc">${PyEditor.highlight(variant.code)}</pre>` : ""}
      <div class="checkq-opts" role="radiogroup" aria-label="${esc(variant.q)}">${opts}</div>
    </article>`;
  }

  function codeCard(slot, n){
    const variant = variantOf(slot);
    return `
    <article class="checkq" data-slot="${slot.id}" data-type="code">
      ${head(slot, n)}
      <p class="checkq-text"><b>${esc(variant.title)}.</b> ${esc(variant.intro)}</p>
      ${editorHtml("Код функції " + variant.fn)}
      ${controlsHtml(variant.hint)}
    </article>`;
  }

  function programCard(slot, n){
    const variant = variantOf(slot);
    const rows = Math.max(2, variant.sample.split("\n").length);
    return `
    <article class="checkq" data-slot="${slot.id}" data-type="program">
      ${head(slot, n)}
      <p class="checkq-text"><b>${esc(variant.title)}.</b> ${esc(variant.intro)}</p>
      <div class="checkq-io">
        <div><span>Приклад: ввели</span><pre>${esc(variant.sample)}</pre></div>
        <div><span>Має вивести</span><pre>${esc(variant.sampleOut)}</pre></div>
      </div>
      ${editorHtml("Код програми")}
      <label class="checkq-stdin">
        <span>Вхідні дані для запуску — кожне значення з нового рядка</span>
        <textarea data-role="stdin" rows="${rows}" spellcheck="false" autocapitalize="off"
          autocomplete="off" autocorrect="off" data-gramm="false"></textarea>
      </label>
      ${controlsHtml(variant.hint)}
      <pre class="checkq-out" data-role="out" hidden></pre>
    </article>`;
  }

  function setMsg(card, html, kind){
    const el = part(card, "msg");
    el.hidden = !html;
    el.innerHTML = html || "";
    el.className = "pyt-msg " + (kind || "");
  }

  function wireMcq(card, slot){
    card.addEventListener("change", (e) => {
      const input = e.target.closest("input[type=radio]");
      if(!input) return;
      const idx = +input.value;
      draft.mcq[slot.id] = idx;
      saveDraft();
      card.querySelectorAll(".checkq-opt").forEach(l => l.classList.toggle("on", +l.dataset.idx === idx));
      updateProgress();
    });
  }

  /* редактор коду зі збереженням у чернетку; onRun — що робить «Запустити» */
  function wireEditorFor(card, slot, onRun){
    const ta = part(card, "editor");
    ta.value = draft.code[slot.id] != null ? draft.code[slot.id] : variantOf(slot).starter;
    const run = () => { if(CheckPy.isReady()) onRun(ta.value); };
    PyEditor.wireEditor(ta, part(card, "hl"), {
      hiddenWords: def.acHidden[slot.id],
      minRows: 8,
      onInput: (value) => { draft.code[slot.id] = value; saveDraft(); updateProgress(); },
      onRun: run
    });
    card.querySelector('[data-act="run"]').addEventListener("click", run);
  }

  function wireCode(card, slot){
    const variant = variantOf(slot);
    wireEditorFor(card, slot, (source) => {
      const err = CheckPy.install(variant.fn, source);
      if(err) setMsg(card, esc(err), "bad");
      else setMsg(card, "Код виконується без помилок. Це не каже, чи правильна відповідь, — лише те, що код запускається.", "good");
    });
  }

  function wireProgram(card, slot){
    const stdin = part(card, "stdin");
    const out = part(card, "out");
    stdin.value = draft.stdin[slot.id] != null ? draft.stdin[slot.id] : variantOf(slot).sample;
    stdin.addEventListener("input", () => { draft.stdin[slot.id] = stdin.value; saveDraft(); });
    wireEditorFor(card, slot, (source) => {
      const r = CheckPy.runProgram(source, stdin.value);
      out.hidden = false;
      out.textContent = r.out === "" ? "(програма нічого не вивела)" : r.out;
      out.classList.toggle("empty", r.out === "");
      if(r.error) setMsg(card, esc(r.error), "bad");
      else setMsg(card, "Програма завершилась без помилок. Це не каже, чи правильна відповідь, — лише те, що вона працює на цих даних.", "good");
    });
  }

  const CARD = { mcq:mcqCard, code:codeCard, program:programCard };
  const WIRE = { mcq:wireMcq, code:wireCode, program:wireProgram };

  function renderSlots(){
    $p("slots").innerHTML = SLOTS.map((slot, i) => CARD[slot.type](slot, i + 1)).join("");
    SLOTS.forEach(slot => WIRE[slot.type](cardOf(slot), slot));
  }

  /* ---------- прогрес ---------- */
  function answeredCount(){
    return SLOTS.filter(slot => {
      if(slot.type === "mcq") return draft.mcq[slot.id] != null;
      const code = draft.code[slot.id];
      return !!code && code.trim() !== variantOf(slot).starter.trim();
    }).length;
  }

  function updateProgress(){
    const n = answeredCount();
    $p("progress-fill").style.width = (n / SLOTS.length * 100) + "%";
    $p("progress-text").textContent = `Відповіли ${n} з ${SLOTS.length}`;
  }

  /* ---------- оцінювання ---------- */
  function gradeAll(){
    const items = SLOTS.map(slot => {
      const v = pick[slot.id].variant;
      const variant = slot.variants[v];
      if(slot.type === "mcq"){
        const idx = draft.mcq[slot.id];
        return C.mcqItem(slot, v, idx != null ? idx : null);
      }
      const source = draft.code[slot.id] != null ? draft.code[slot.id] : variant.starter;
      if(slot.type === "code"){
        const g = CheckPy.gradeCode(variant, source);
        return C.codeItem(slot, v, source, g.passed, g.error);
      }
      return C.programItem(slot, v, source, CheckPy.gradeProgram(variant, source));
    });
    return C.withTotal(SLOTS, items, new Date().toISOString());
  }

  /* ---------- посилання на результат ---------- */
  async function shareUrl(result){
    const payload = C.buildPayload(SLOTS, def.shareVersion, result, readJSON(KEY.pick, {}));
    if(!payload) return null;
    return location.href.split("#")[0] + "#/" + def.slug + "/r/" + await C.packShare(payload);
  }

  function wireShare(box, result){
    const wrap = box.querySelector(".checkr-share");
    const input = wrap.querySelector("input");
    const btn = wrap.querySelector("button");
    shareUrl(result).then(url => {
      if(!url || !wrap.isConnected) return;
      input.value = url;
      wrap.hidden = false;
    }).catch(err => console.error("не вдалося зібрати посилання", err));

    let timer = null;
    btn.addEventListener("click", async () => {
      input.select();
      let ok = false;
      try { await navigator.clipboard.writeText(input.value); ok = true; }
      catch(e){ try { ok = document.execCommand("copy"); } catch(e2){} }
      btn.textContent = ok ? "Скопійовано ✓" : "Натисни Ctrl+C";
      clearTimeout(timer);
      timer = setTimeout(() => { btn.textContent = "Копіювати"; }, 2000);
    });
  }

  /* ---------- екран результатів ---------- */
  function resultBadge(item){
    if(item.type === "mcq") return item.earned === item.points ? "ok" : (item.earned > 0 ? "partial" : "bad");
    return item.passed ? "ok" : "bad";
  }

  const itemHead = (n, name, item) =>
    `<div class="checkr-item-head"><b>${n}. ${esc(name)}</b><span>${C.fmtPoints(item.earned)} / ${C.pointsLabel(item.points)}</span></div>`;

  const codeBlocks = (item) => `
      <p class="checkr-code-t">Твій код:</p>
      <pre class="checkr-code pysrc">${PyEditor.highlight(item.yourCode)}</pre>
      <p class="checkr-code-t">Приклад правильного розв'язку:</p>
      <pre class="checkr-code ref pysrc">${PyEditor.highlight(item.solution)}</pre>`;

  function mcqResult(item, n){
    const chosenCls = item.chosenText == null ? "" : (item.chosenCredit === 1 ? "ok" : (item.chosenCredit > 0 ? "partial" : "bad"));
    const chosenRow = item.chosenText == null
      ? `<li class="chosen bad"><b>Твоя відповідь:</b> (не відповів)</li>`
      : `<li class="chosen ${chosenCls}"><b>Твоя відповідь:</b> ${esc(item.chosenText)}</li>`;
    const correctRow = item.chosenCredit === 1 ? "" :
      `<li class="correct"><b>Правильно:</b> ${esc(item.correctText)}</li>`;
    return `<article class="checkr-item ${resultBadge(item)}">
      ${itemHead(n, item.topic, item)}
      <p class="checkr-q">${esc(item.question)}</p>
      ${item.code ? `<pre class="checkr-code pysrc">${PyEditor.highlight(item.code)}</pre>` : ""}
      <ul class="checkr-opts">${chosenRow}${correctRow}</ul>
      <p class="checkr-explain">${esc(item.explain)}</p>
    </article>`;
  }

  function codeResult(item, n){
    return `<article class="checkr-item ${resultBadge(item)}">
      ${itemHead(n, item.title, item)}
      <p class="checkr-q">${item.passed ? "Усі приховані тести пройдено." : (item.error ? esc(item.error) : "Не всі приховані тести пройдено.")}</p>
      ${codeBlocks(item)}
    </article>`;
  }

  function programResult(item, n){
    const fail = item.passed || item.failInput == null ? "" : `
      <div class="checkr-io">
        <div><span>Ввели</span><pre>${esc(item.failInput)}</pre></div>
        <div><span>Очікувалось</span><pre>${esc(item.failExpected)}</pre></div>
        <div><span>Твоя програма вивела</span><pre>${esc(item.failOut || "(нічого)")}</pre>${
          item.error ? `<p class="checkr-io-err">${esc(item.error)}</p>` : ""}</div>
      </div>`;
    return `<article class="checkr-item ${resultBadge(item)}">
      ${itemHead(n, item.title, item)}
      <p class="checkr-q">${item.passed ? "Усі приховані набори даних пройдено." : "Не всі приховані набори даних пройдено. Перший, на якому програма помилилась:"}</p>
      ${fail}
      ${codeBlocks(item)}
    </article>`;
  }

  const RESULT = { mcq:mcqResult, code:codeResult, program:programResult };

  /* shared — результат відкрито за посиланням, а не з цього браузера */
  function renderResults(result, shared){
    $p("body").hidden = true;
    $p("progress-wrap").hidden = true;
    $p("loading").hidden = true;
    const box = $p("results");
    box.hidden = false;

    const items = result.items.map((item, i) => RESULT[item.type](item, i + 1)).join("");
    const when = result.finishedAt
      ? new Date(result.finishedAt).toLocaleString("uk-UA", { dateStyle:"long", timeStyle:"short" }) : "";

    const note = shared
      ? `<p>Це результат, яким поділилися за посиланням${when ? ` · тест завершено ${esc(when)}` : ""}.
           Нижче — усі завдання з правильними відповідями.</p>
         <a class="checkr-own" href="#/${def.slug}">До власного тесту →</a>`
      : `<p>Результат збережено в цьому браузері. Нижче — усі завдання з правильними відповідями.</p>
         <div class="checkr-share" hidden>
           <p class="checkr-share-t">Посилання на цей результат: відкривається в будь-якому браузері, можна надіслати вчителю.</p>
           <div class="checkr-share-row">
             <input type="text" class="checkr-share-url" readonly aria-label="Посилання на результат">
             <button type="button" class="ctl">Копіювати</button>
           </div>
         </div>`;

    box.innerHTML = `
      <div class="checkr-score">
        <div class="checkr-score-n">${C.fmtPoints(result.total)}<span> / ${C.fmtPoints(result.max)}</span></div>
        ${note}
      </div>
      <div class="checkr-list">${items}</div>`;

    if(!shared) wireShare(box, result);
  }

  /* ---------- завершення тесту ---------- */
  function wireFinish(){
    const btn = $p("finish");
    btn.addEventListener("click", () => {
      if(btn.dataset.armed !== "1"){
        btn.dataset.armed = "1";
        btn.textContent = "Точно? Натисни ще раз — переграти не можна";
        return;
      }
      const result = gradeAll();
      writeJSON(KEY.result, result);
      store.del(KEY.draft);
      renderResults(result, false);
      /* кнопка була внизу довгої сторінки — повертаємо на початок, де видно бал;
         фокус (для читачів екрана) ставимо до скролу, щоб не перервати анімацію */
      const score = $p("results").querySelector(".checkr-score");
      score.tabIndex = -1;
      score.focus({ preventScroll:true });
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top:0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- режими сторінки ---------- */
  /* #/<slug> — власний тест цього браузера, #/<slug>/r/<дані> — результат за
     посиланням. Між ними можна ходити без перезавантаження, тож власний тест
     запускається один раз, а далі лише ховається й показується. */
  let bootState = "idle";         /* idle → loading → ready | failed */
  let viewToken = 0;              /* щоб запізніле розпакування не перемалювало інший режим */

  function startTest(){
    ensurePick();
    renderSlots();
    updateProgress();
    wireFinish();

    bootState = "loading";
    const loadingEl = $p("loading");
    CheckPy.boot().then(() => {
      root.querySelectorAll('[data-act="run"]').forEach(b => b.disabled = false);
      bootState = "ready";
    }).catch((err) => {
      console.error("Python не завантажився", err);
      loadingEl.innerHTML = `<b>Не вдалося завантажити Python.</b> Для практичних завдань потрібен інтернет: інтерпретатор підвантажується з cdn.jsdelivr.net. Перевір з'єднання й онови сторінку. Питання з варіантами відповіді можна проходити й так — вони не потребують Python.`;
      loadingEl.classList.add("err");
      bootState = "failed";
    }).then(() => {
      if(!SHARE_RE.test(location.hash)) showOwn();
    });
  }

  function showOwn(){
    $p("rules").hidden = false;
    const existing = readJSON(KEY.result, null);
    if(existing){
      renderResults(existing, false);
      return;
    }
    $p("results").hidden = true;
    $p("progress-wrap").hidden = false;
    if(bootState === "idle") startTest();
    $p("loading").hidden = bootState === "ready";
    $p("body").hidden = bootState === "loading";
  }

  async function showShared(data, token){
    ["rules", "progress-wrap", "loading", "body"].forEach(name => { $p(name).hidden = true; });
    const box = $p("results");
    box.hidden = false;
    box.innerHTML = "";

    let result = null;
    try { result = C.parsePayload(SLOTS, def.shareVersion, await C.unpackShare(data)); }
    catch(err){ console.error("не вдалося розпакувати посилання", err); }
    if(token !== viewToken) return;

    if(result && result !== "stale"){
      renderResults(result, true);
      return;
    }
    const why = result === "stale"
      ? "Посилання створене для попередньої версії завдань — відтоді стартовий код змінився, тож відновити відповіді не вийде."
      : "Посилання пошкоджене (можливо, його обрізало під час копіювання) або браузер застарий.";
    box.innerHTML = `<div class="store-loading err"><span><b>Не вдалося відкрити результат.</b>
      ${why} <a href="#/${def.slug}">До власного тесту →</a></span></div>`;
  }

  function route(){
    const token = ++viewToken;
    const m = location.hash.match(SHARE_RE);
    if(m) showShared(m[1], token);
    else showOwn();
  }

  /* роутер уже показав сторінку; тут лише перемикаємо режим усередині неї */
  window.addEventListener("hashchange", () => {
    if(OWN_RE.test(location.hash)) route();
  });
  route();
}

return { define, get, selfTest };

})();
```

Примітка до тесту «чуже посилання» в `engine.test.js`: посилання, зроблене тестом `toy`, відкривається тестом `toy4`. Це коректно, бо в обох ті самі слоти, а отже та сама контрольна сума стартового коду. `location.hash` виставляється ДО `PageInit`, так само як це робить роутер, коли сторінку вперше відкривають за посиланням.

- [ ] **Step 4: Перенести дані інженерного тесту (байт-у-байт)**

Run (з кореня репозиторію):

```bash
mkdir -p js/checks/engineering
python3 - <<'EOF'
import pathlib
src = pathlib.Path("js/pages/check.js").read_text(encoding="utf-8").split("\n")
assert src[41] == "const SLOTS = [", src[41]
assert src[622] == "];", src[622]
inner = "\n".join(src[42:622])
head = '''/* ==========================================================================
   Самостійна робота «Перевір себе» для Старшої інженерної школи (#/check):
   9 завдань, 12 балів. П'ять питань із варіантами відповіді (1 бал; 0.5 бала,
   якщо учень обрав варіант, правильний за логікою, але з синтаксичною
   помилкою) і чотири практичні завдання з функціями (2 або 1 бал).

   Тест уже пройшли учні, тому ключі localStorage (pyguide_check_*), адреса
   #/check і версія формату посилання (2) — сталі, а тексти й стартовий код
   завдань не змінювати: від них залежать надіслані вчителю посилання
   (tests/engine.test.js звіряє це з tests/fixtures/engineering-legacy.js).
   Нове — лише новим варіантом у кінець списку.
   ========================================================================== */
"use strict";
CheckEngine.define({
  slug:"check",
  storage:"pyguide_check",
  shareVersion:2,
  title:"Перевір себе",
  lede:"Підсумкова самостійна робота на <b>12 балів</b>: змінні та <code>print</code>/<code>input</code>/<code>int()</code>, умови, цикли, списки й словники. П'ять питань з варіантами відповіді та чотири практичні завдання з кодом.",
  rules:"<b>Одна спроба.</b> У кожного свій набір завдань, але однакова складність і однакова максимальна кількість балів — 12. Результат зберігається в цьому браузері одразу після натискання «Завершити тест» і показується щоразу, коли повертаєшся на цю сторінку: переграти не можна. У практичних завданнях можна натискати «Запустити», щоб побачити вивід чи помилку свого коду, — але без підказки, пройшло воно приховані тести чи ні.",
  acHidden:{ vars_code: new Set(["int"]) },
  slots:[
'''
tail = '''
  ]
});
'''
pathlib.Path("js/checks/engineering/check.js").write_text(head + inner + tail, encoding="utf-8")
EOF
```

Перевір, що `lede` і `rules` дослівно збігаються з наявним `index.html`:

Run: `grep -c "П'ять питань з варіантами відповіді та чотири практичні завдання з кодом" index.html js/checks/engineering/check.js`
Expected: `index.html:1` і `js/checks/engineering/check.js:1`.

- [ ] **Step 5: Розмітка, стилі, скрипти**

Modify `index.html` — замінити всю секцію від рядка `<!-- ================= самостійна робота: перевір себе ================= -->` до її закриваючого `</section>` (включно; це блок із `<section class="page" id="page-check" hidden>` … `<div id="check-results" hidden></div>` … `</section>`) на:

```html
  <!-- ================= самостійні роботи: сторінки тестів ================= -->
  <!-- вміст малює js/checks/engine.js за даними з js/checks/<клас>/*.js -->
  <section class="page" id="page-check" hidden>
  <div class="wrap wide"><div data-check-root></div></div>
  </section>
```

У `index.html` замінити рядок

```html
<script src="js/pages/check.js?v=20260922g"></script>
```

на

```html
<!-- самостійні роботи: ядро, Python, рушій і дані тестів по класах -->
<script src="js/checks/core.js?v=20260924a"></script>
<script src="js/checks/harness.js?v=20260924a"></script>
<script src="js/checks/python.js?v=20260924a"></script>
<script src="js/checks/engine.js?v=20260924a"></script>
<script src="js/checks/engineering/check.js?v=20260924a"></script>
```

і `css/check.css?v=20260922g` → `css/check.css?v=20260924a`.

Видалити старий файл: `git rm js/pages/check.js`.

У `js/pyeditor.js` у шапковому коментарі замінити `і в самостійній роботі (js/pages/check.js)` на `і в самостійних роботах (js/checks/engine.js)`.

Modify `css/check.css`: замінити рядок

```css
  #check-progress-text{font-family:var(--mono); font-size:.8rem; color:var(--muted); white-space:nowrap}
```

на

```css
  .check-prog-text{font-family:var(--mono); font-size:.8rem; color:var(--muted); white-space:nowrap}
```

і перед блоком `/* ---------- «Завершити тест» ---------- */` вставити:

```css
  /* код у питанні «що виведе програма?» */
  .checkq-code{margin:0 0 14px; padding:11px 14px; background:var(--card); border:1px solid var(--rule);
    border-radius:10px; font-family:var(--mono); font-size:.86rem; line-height:1.55; white-space:pre; overflow-x:auto}

  /* завдання «програма»: приклад, поле вхідних даних, вивід запуску;
     .checkr-io — те саме для проваленого набору в результатах */
  .checkq-io,.checkr-io{display:grid; grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr));
    gap:10px; margin:0 0 14px}
  .checkq-io span,.checkr-io span{display:block; font-size:.76rem; color:var(--muted); margin-bottom:4px}
  .checkq-io pre,.checkr-io pre{margin:0; padding:8px 11px; background:var(--card); border:1px solid var(--rule);
    border-radius:8px; font-family:var(--mono); font-size:.84rem; line-height:1.5; white-space:pre-wrap;
    overflow-wrap:anywhere}
  .checkr-io-err{margin:6px 0 0; font-size:.82rem; color:#8f2419}
  .checkq-stdin{display:block; margin:0 0 4px}
  .checkq-stdin span{display:block; font-size:.8rem; color:var(--muted); margin-bottom:4px}
  .checkq-stdin textarea{width:100%; box-sizing:border-box; padding:8px 11px; border:1px solid var(--rule);
    border-radius:8px; background:var(--card); color:var(--ink); font-family:var(--mono); font-size:.86rem;
    line-height:1.5; resize:vertical}
  .checkq-out{margin:10px 0 0; padding:10px 14px; background:#fff; border:1px solid var(--rule); border-radius:9px;
    font-family:var(--mono); font-size:.84rem; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere;
    max-height:320px; overflow:auto}
  .checkq-out[hidden]{display:none}
  .checkq-out.empty{color:var(--muted); font-style:italic}

```

- [ ] **Step 6: Переконатися, що тести проходять**

Оновити сторінку тестів, `window.T_DONE`.
Expected: `{"pass":28,"fail":0}`.

- [ ] **Step 7: Ручна перевірка інженерного тесту на сайті**

`navigate` на `http://localhost:8765/#/check` (переконайся, що ключів `pyguide_check_*` у цьому браузері немає: `Object.keys(localStorage)`).
Expected (перевір через `read_page` / скріншот):
- заголовок «Перевір себе», той самий лід і блок «Одна спроба», прогрес «Відповіли 0 з 9»;
- після завантаження Python — 9 карток, «Завдання 6 · 1 бал», «Завдання 7 · 2 бали»;
- у консолі (`read_console_messages`, `onlyErrors: true`) — жодних помилок.

Потім `navigate` на `http://localhost:8765/` + `LEGACY_ENGINEERING.link` (підстав значення з фікстури).
Expected: бал `5.5 / 12`, напис «Це результат, яким поділилися за посиланням».

Прибрати за собою: `["pick","draft","result"].forEach(k => localStorage.removeItem("pyguide_check_" + k))`.

- [ ] **Step 8: Самоперевірка пулу з консолі**

`javascript_tool` на сторінці сайту: `await CheckEngine.selfTest("check")`.
Expected: `[]`.

- [ ] **Step 9: Збережений у браузері старий результат показується**

На `http://localhost:8765/#/check`: `localStorage.setItem("pyguide_check_result", JSON.stringify(LEGACY_ENGINEERING_RESULT))` — підстав `result` із фікстури (скопіюй об'єкт), потім `location.reload()`.
Expected: одразу екран результатів `5.5 / 12`, за секунду з'являється поле з посиланням, і воно дорівнює `LEGACY_ENGINEERING.link` (крім адреси сторінки).
Прибрати ключ.

- [ ] **Step 10: Commit**

```bash
git add js/checks/engine.js js/checks/engineering/check.js tests/engine.test.js tests/checks.html index.html css/check.css js/pyeditor.js
git commit -m "Move self-check into shared CheckEngine; engineering test data in js/checks/engineering"
```

(`git rm` із кроку 5 уже додав видалення `js/pages/check.js` в індекс.)

---

### Task 6: Навігація: `#/tests`, підпункти меню, прихований маршрут, головна

**Files:**
- Modify: `js/app.js`, `index.html`, `css/check.css`

**Interfaces:**
- Consumes: розмітку `#page-check` (Task 5).
- Produces: маршрути `tests`, `check`, `check-9`, `check-9plus` (hidden); секції `#page-tests`, `#page-check-9`, `#page-check-9plus` з `[data-check-root]`. Сторінки `check-9`/`check-9plus` лишаються порожніми до Task 7/8.

- [ ] **Step 1: Маршрути**

Modify `js/app.js` — замінити

```js
  { slug:"check", id:"page-check", num:"✓",
    nav:"Перевір себе", title:"Перевір себе — самостійна робота з Python" }
];
/* плаский список — для «далі / назад» і для пошуку за slug */
const FLAT = ROUTES.reduce((a, r) => a.concat([r], r.kids || []), []);
```

на

```js
  { slug:"tests", id:"page-tests", num:"✓",
    nav:"Самостійні роботи", title:"Самостійні роботи — Python крок за кроком",
    kids:[
      { slug:"check", id:"page-check", num:"ІШ",
        nav:"Інженерна школа: Перевір себе", title:"Перевір себе — самостійна робота з Python" },
      { slug:"check-9", id:"page-check-9", num:"9",
        nav:"9 клас: Самостійна робота", title:"Самостійна робота з Python — 9 клас" },
      /* розширений варіант — лише за прямим посиланням від учителя */
      { slug:"check-9plus", id:"page-check-9plus", num:"9+", hidden:true,
        nav:"9 клас: розширений варіант", title:"Самостійна робота з Python — 9 клас, розширений варіант" }
    ]}
];
/* усі маршрути — для пошуку за slug; hidden-маршрути існують, але їх немає
   в меню й у «далі / назад» (FLAT) */
const ALL  = ROUTES.reduce((a, r) => a.concat([r], r.kids || []), []);
const FLAT = ALL.filter(r => !r.hidden);
```

Замінити в побудові меню

```js
  (r.kids ? `<div class="subnav" data-sub="${r.slug}">` + r.kids.map(c => `
```

на

```js
  (r.kids ? `<div class="subnav" data-sub="${r.slug}">` + r.kids.filter(c => !c.hidden).map(c => `
```

Замінити початок `buildPager`:

```js
function buildPager(route){
  const i = FLAT.indexOf(route);
  const prev = FLAT[i-1], next = FLAT[i+1];
  const wrap = $(".wrap", document.getElementById(route.id));
  if(!wrap) return;
  const box = document.createElement("div");
  box.className = "pager";
  box.innerHTML =
```

на

```js
function buildPager(route){
  const wrap = $(".wrap", document.getElementById(route.id));
  if(!wrap) return;
  const box = document.createElement("div");
  box.className = "pager";
  if(route.hidden){
    box.innerHTML =
      `<a class="prev" href="#/tests"><span class="lbl">← назад</span><span class="ttl">Самостійні роботи</span></a>` +
      `<a class="next" href="#/"><span class="lbl">на початок →</span><span class="ttl">Усі теми</span></a>`;
    wrap.appendChild(box);
    return;
  }
  const i = FLAT.indexOf(route);
  const prev = FLAT[i-1], next = FLAT[i+1];
  box.innerHTML =
```

У `slugFromHash` замінити `return FLAT.some(r=>r.slug===h) ? h : null;` на `return ALL.some(r=>r.slug===h) ? h : null;`.
У `render` замінити `const route = FLAT.find(r=>r.slug===slug) || null;` на `const route = ALL.find(r=>r.slug===slug) || null;`.

(Підсвітка «Самостійні роботи» для `#/check-9plus` працює без змін: у `render` батько шукається за `parent.kids`, де прихований підпункт є.)

- [ ] **Step 2: Сторінки в `index.html`**

Modify `index.html` — одразу перед `<!-- ================= самостійні роботи: сторінки тестів ================= -->` вставити:

```html
  <!-- ================= самостійні роботи: загальна сторінка ================= -->
  <section class="page" id="page-tests" hidden>
  <div class="wrap wide">

  <header class="top">
    <h1>Самостійні роботи</h1>
    <p class="lede">Підсумкові перевірки для кожного класу. Одна спроба, у кожного учня свій набір завдань, результат — одразу після завершення, разом із посиланням, яке можна надіслати вчителю.</p>
  </header>

  <h2>Старша інженерна школа</h2>
  <div class="cards check-cards">
    <a class="card check" href="#/check">
      <div class="card-body">
        <span class="card-tag check-tag">самостійна робота</span>
        <h3>Перевір себе</h3>
        <p>Змінні й <code>print</code>/<code>input</code>/<code>int()</code>, умови, цикли, списки та словники. Питання з варіантами відповіді й практичні завдання з функціями.</p>
        <div class="card-meta"><span>9 завдань</span><span>12 балів</span><span>результат одразу</span></div>
        <div class="card-go">Почати тест <em>→</em></div>
      </div>
    </a>
  </div>

  <h2>9 клас</h2>
  <div class="cards check-cards">
    <a class="card check" href="#/check-9">
      <div class="card-body">
        <span class="card-tag check-tag">самостійна робота</span>
        <h3>Самостійна робота</h3>
        <p><code>print</code>, <code>input</code>, змінні, рядки й f-рядки, умови <code>if</code>/<code>elif</code>/<code>else</code>, <code>and</code>/<code>or</code>, цикл <code>for</code>. Питання з варіантами відповіді й завдання, де треба написати програму.</p>
        <div class="card-meta"><span>11 завдань</span><span>12 балів</span><span>результат одразу</span></div>
        <div class="card-go">Почати тест <em>→</em></div>
      </div>
    </a>
  </div>

  </div>
  </section>

```

Після секції `#page-check` (з Task 5) додати ще дві:

```html
  <section class="page" id="page-check-9" hidden>
  <div class="wrap wide"><div data-check-root></div></div>
  </section>

  <section class="page" id="page-check-9plus" hidden>
  <div class="wrap wide"><div data-check-root></div></div>
  </section>
```

У `index.html` підняти версію `js/app.js?v=20260922g` → `js/app.js?v=20260924a`.

- [ ] **Step 3: Картка на головній**

Modify `index.html` — у картці `<a class="card check reveal" href="#/check">` замінити `href="#/check"` на `href="#/tests"`, а її `<div class="card-body">…</div>` — на:

```html
          <div class="card-body">
            <span class="card-tag check-tag">самостійні роботи</span>
            <h3>Перевір себе</h3>
            <p>Підсумкові самостійні роботи на 12 балів — окремо для Старшої інженерної школи й для 9 класу. Питання з варіантами відповіді й практичні завдання з кодом, у кожного свій набір.</p>
            <div class="card-meta"><span>2 класи</span><span>12 балів</span><span>результат одразу</span></div>
            <div class="card-go">До самостійних робіт <em>→</em></div>
          </div>
```

- [ ] **Step 4: Відступи між розділами на `#/tests`**

Modify `css/check.css` — після правила `.check-tag{…}` додати:

```css
  /* сторінка «Самостійні роботи»: розділ класу — заголовок і картки під ним */
  #page-tests h2{margin-top:2.2em}
  #page-tests .cards{margin:14px 0 8px}
```

- [ ] **Step 5: Ручна перевірка навігації**

Оновити `http://localhost:8765/`, потім у вбудованому браузері перевір (через `read_page` / `find` / скріншоти):
1. Головна: у розділі «Перевір себе» картка веде на `#/tests`.
2. `#/tests`: заголовок «Самостійні роботи», розділи «Старша інженерна школа» і «9 клас», дві картки; у меню підсвічено «✓ Самостійні роботи», під ним підпункти «Інженерна школа: Перевір себе» і «9 клас: Самостійна робота», **без** розширеного варіанту; «наступна тема →» веде на «Інженерна школа: Перевір себе».
3. `#/check`: тест працює, як у Task 5; у меню «Самостійні роботи» має позначку `trail`, підсвічено підпункт.
4. `#/check-9plus`: сторінка відкривається (поки порожня), у меню підсвічено «Самостійні роботи», у «далі / назад» — «← Самостійні роботи» і «Усі теми». Ніде в меню немає посилання на `check-9plus`: `document.querySelectorAll('a[href="#/check-9plus"]').length === 0`.
5. `resize_window` `preset: "mobile"`, повтори п. 2: немає горизонтальної прокрутки (`document.documentElement.scrollWidth <= innerWidth`); потім `preset: "desktop"`.
6. Консоль без помилок.

- [ ] **Step 6: Тести не зламались**

Сторінка тестів: `window.T_DONE` → `{"pass":28,"fail":0}`.

- [ ] **Step 7: Commit**

```bash
git add js/app.js index.html css/check.css
git commit -m "Add tests hub page, class subroutes and hidden route support"
```

---

### Task 7: Тест 9 класу (базовий)

**Files:**
- Create: `js/checks/grade9/base.js`, `tests/pools.test.js`
- Modify: `index.html`, `tests/checks.html`

**Interfaces:**
- Consumes: `CheckEngine.define` (Task 5), секцію `#page-check-9` (Task 6).
- Produces: тест `check-9` (11 слотів, 12 балів, `storage: "pyguide_check9"`, `shareVersion` 1).

- [ ] **Step 1: Тест пулу (падає)**

Create `tests/pools.test.js`:

```js
"use strict";
(function(){
/* кожен пул: розв'язки проходять свої приховані тести, стартовий код — ні,
   у питанні рівно одна повна відповідь, сума балів — 12 */
["check", "check-9"].forEach(slug => {
  T.test("пул " + slug + ": самоперевірка без проблем", async () => {
    const def = CheckEngine.get(slug);
    T.ok(def, "тест " + slug + " зареєстровано");
    T.eq(await CheckPy.validate(def), []);
  });
});

T.test("пул check-9: склад як у спеці §9.1", () => {
  const def = CheckEngine.get("check-9");
  T.eq(def.slots.map(s => s.type + ":" + s.points), [
    "mcq:1", "mcq:1", "mcq:1", "mcq:1", "mcq:1", "mcq:1", "mcq:1",
    "program:1", "program:1", "program:1", "program:2"]);
  T.eq(def.storage, "pyguide_check9");
  T.eq(def.shareVersion, 1);
});
})();
```

Modify `tests/checks.html`: після `<script src="fixtures/engineering-legacy.js"></script>` додати `<script src="../js/checks/grade9/base.js"></script>`, після `<script src="engine.test.js"></script>` — `<script src="pools.test.js"></script>`.

Сторінка тестів, `window.T_DONE`.
Expected: `fail` ≥ 1 (тест `check-9` не зареєстровано; файлу ще немає — у консолі 404).

- [ ] **Step 2: Дані тесту**

Run: `mkdir -p js/checks/grade9 && cp docs/superpowers/plans/2026-09-24-tests-hub-grade9/base.js js/checks/grade9/base.js`

(Файл згенеровано й перевірено `content_check.py`: 7 питань × 3–4 варіанти, 4 програми × 3 варіанти. Не редагувати вручну. Щоб змінити контент, правити `content_check.py`, перезапустити `python3 docs/superpowers/plans/2026-09-24-tests-hub-grade9/content_check.py js/checks/grade9` і переконатися, що він друкує `PROBLEMS: none`. Скрипт пише в наявну теку й перезаписує там `base.js` і `plus.js`.)

Run: `python3 docs/superpowers/plans/2026-09-24-tests-hub-grade9/content_check.py docs/superpowers/plans/2026-09-24-tests-hub-grade9 && git diff --exit-code docs/superpowers/plans/2026-09-24-tests-hub-grade9 && cmp docs/superpowers/plans/2026-09-24-tests-hub-grade9/base.js js/checks/grade9/base.js && echo SAME`
Expected: `PROBLEMS: none`, `written …`, `SAME` (генератор відтворює закомічені файли без змін, і скопійований файл їм ідентичний).

Modify `index.html`: після `<script src="js/checks/engineering/check.js?v=20260924a"></script>` додати

```html
<script src="js/checks/grade9/base.js?v=20260924a"></script>
```

- [ ] **Step 3: Тести проходять**

Сторінка тестів, `window.T_DONE`.
Expected: `{"pass":31,"fail":0}`.

- [ ] **Step 4: Ручна перевірка на сайті**

`navigate` на `http://localhost:8765/#/check-9` (ключів `pyguide_check9_*` немає).
Expected:
- заголовок «Самостійна робота — 9 клас», «Відповіли 0 з 11»; завдання 1–7 — «1 бал», 8–10 — «1 бал», 11 — «2 бали»;
- у питаннях «Що виведе програма?» код показано окремим підсвіченим блоком;
- у завданні-програмі: блок «Приклад: ввели / Має вивести», поле «Вхідні дані для запуску» з прикладом.
Потім у завданні 8 вписати еталонний розв'язок свого варіанту (узяти з `CheckEngine.get("check-9").slots[7].variants[JSON.parse(localStorage.pyguide_check9_pick).g9_calc_prog.variant].solution`), натиснути «▶ Запустити».
Expected: у блоці виводу — те саме, що в «Має вивести».
Змінити вхідні дані на `abc`, «Запустити».
Expected: червоне повідомлення `ValueError: invalid literal for int()…`.
У завданні 11 написати `while True:\n    pass`, «Запустити».
Expected: «Схоже, цикл ніколи не закінчується…», сторінка не зависла.
Завершити тест (двічі натиснути).
Expected: бал, у завданні 8 — «Усі приховані набори даних пройдено.», в 11 — блок «Ввели / Очікувалось / Твоя програма вивела», поле з посиланням `…#/check-9/r/…`.
Відкрити це посилання в новій вкладці (`tabs_create`, `navigate`).
Expected: той самий бал, «Це результат, яким поділилися за посиланням».
`#/check` у тому ж браузері не заблоковано результатом 9 класу (показує тест, а не результат).
Прибрати: `["pick","draft","result"].forEach(k => localStorage.removeItem("pyguide_check9_" + k))`.

- [ ] **Step 5: Commit**

```bash
git add js/checks/grade9/base.js tests/pools.test.js tests/checks.html index.html
git commit -m "Add grade 9 self-check: 7 questions and 4 program tasks"
```

---

### Task 8: Розширений варіант 9 класу

**Files:**
- Create: `js/checks/grade9/plus.js`
- Modify: `index.html`, `tests/checks.html`, `tests/pools.test.js`

**Interfaces:**
- Consumes: `CheckEngine.define` (Task 5), секцію `#page-check-9plus` і прихований маршрут (Task 6).
- Produces: тест `check-9plus` (12 слотів, 8 × 0.5 + 4 × 2 = 12, `storage: "pyguide_check9plus"`).

- [ ] **Step 1: Тест пулу (падає)**

Modify `tests/pools.test.js`: замінити `["check", "check-9"].forEach(` на `["check", "check-9", "check-9plus"].forEach(` і перед рядком `})();` у кінці додати:

```js
T.test("пул check-9plus: склад як у спеці §9.2", () => {
  const def = CheckEngine.get("check-9plus");
  T.eq(def.slots.map(s => s.type + ":" + s.points), [
    "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5",
    "program:2", "program:2", "program:2", "code:2"]);
  T.eq(def.storage, "pyguide_check9plus");
});

T.test("пул check-9plus: часткова відповідь у питанні на 0.5 бала — 0.25", () => {
  const slot = CheckEngine.get("check-9plus").slots[0];
  const half = slot.variants[0].options.findIndex(o => o.credit === 0.5);
  const item = CheckCore.mcqItem(slot, 0, half);
  T.eq(item.earned, 0.25);
  T.eq(CheckCore.fmtPoints(item.earned) + " / " + CheckCore.pointsLabel(item.points), "0.25 / 0.5 бала");
});
```

Modify `tests/checks.html`: після `<script src="../js/checks/grade9/base.js"></script>` додати `<script src="../js/checks/grade9/plus.js"></script>`.

Сторінка тестів, `window.T_DONE`.
Expected: `fail` ≥ 3.

- [ ] **Step 2: Дані тесту**

Run: `cp docs/superpowers/plans/2026-09-24-tests-hub-grade9/plus.js js/checks/grade9/plus.js && cmp docs/superpowers/plans/2026-09-24-tests-hub-grade9/plus.js js/checks/grade9/plus.js && echo SAME`
Expected: `SAME`.

Modify `index.html`: після `<script src="js/checks/grade9/base.js?v=20260924a"></script>` додати

```html
<script src="js/checks/grade9/plus.js?v=20260924a"></script>
```

- [ ] **Step 3: Тести проходять**

Сторінка тестів, `window.T_DONE`.
Expected: `{"pass":34,"fail":0}`.

- [ ] **Step 4: Ручна перевірка на сайті**

`navigate` на `http://localhost:8765/#/check-9plus` (ключів `pyguide_check9plus_*` немає).
Expected:
- «Самостійна робота — 9 клас, розширений варіант», «Відповіли 0 з 12»; завдання 1–8 — «0.5 бала», 9–12 — «2 бали»;
- завдання 12 — редактор функції з docstring, без поля вхідних даних;
- у меню підсвічено «Самостійні роботи», підпункту розширеного варіанту немає; на `#/tests` посилання на `#/check-9plus` немає.
Відповісти на питання 1 варіантом з помилкою (на 0.5 кредиту — його видно в `CheckEngine.get("check-9plus").slots[0]`), у завданні 12 вписати еталонний розв'язок, завершити.
Expected: у пункті 1 — «0.25 / 0.5 бала», жовта позначка; у 12 — «2 / 2 бали»; загальний бал форматовано без хвоста на кшталт `2.2500000001`.
Прибрати: `["pick","draft","result"].forEach(k => localStorage.removeItem("pyguide_check9plus_" + k))`.

- [ ] **Step 5: Commit**

```bash
git add js/checks/grade9/plus.js tests/pools.test.js tests/checks.html index.html
git commit -m "Add extended grade 9 self-check (direct link only)"
```

---

### Task 9: Фінальна перевірка гілки

**Files:**
- Modify: `docs/superpowers/specs/2026-09-24-tests-hub-grade9-design.md` (статус)

- [ ] **Step 1: Усі автоматичні тести**

Run: `python3 -m unittest tests/test_harness.py -v`
Expected: `Ran 27 tests … OK`.

Сторінка тестів (жорстке оновлення), `window.T_DONE`.
Expected: `{"pass":34,"fail":0}`.

- [ ] **Step 2: Самоперевірка з консолі сайту**

На `http://localhost:8765/`: `await CheckEngine.selfTest()`.
Expected: `[]` і в консолі «Самоперевірка: усе гаразд — check, check-9, check-9plus».

- [ ] **Step 3: Залишки старого коду**

Run: `grep -rn "pages/check.js\|check-progress-text\|check-slots\|check-finish-btn" --include=*.js --include=*.html --include=*.css . | grep -v docs/`
Expected: порожньо.

Run: `grep -n "v=20260922g" index.html`
Expected: порожньо (усі змінені файли на `20260924a`).

- [ ] **Step 4: Прохід очима**

Для `#/`, `#/tests`, `#/check`, `#/check-9`, `#/check-9plus` — скріншот на десктопі й на `preset: "mobile"`. Немає горизонтальної прокрутки, картки програм читаються, блок «Приклад» на мобільному складається в колонку. Консоль без помилок. Повернути `preset: "desktop"`. Прибрати всі ключі `pyguide_check*` у цьому браузері.

- [ ] **Step 5: Статус спеки й commit**

У спеці замінити `Статус: чернетка, чекає на перегляд` на `Статус: реалізовано`.

```bash
git add docs/superpowers/specs/2026-09-24-tests-hub-grade9-design.md
git commit -m "Mark tests hub and grade 9 spec as implemented"
```
