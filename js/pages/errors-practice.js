/* ==========================================================================
   Практика «Помилки та винятки» для Старшої інженерної школи (#/errors-practice).

   Шість функцій з тестами. Код виконується справжнім Python (Pyodide)
   прямо в браузері, а чернетки лишаються в localStorage цього браузера.
   ========================================================================== */
"use strict";
window.PageInit["errors-practice"] = function(){

const $id = (s) => document.getElementById(s);
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const DRAFT_PREFIX = "pyguide_exc_";
/* У приватному режимі localStorage може кидати помилки — тоді просто не зберігаємо. */
const store = {
  get(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { window.localStorage.setItem(k, v); } catch(e){} },
  del(k){ try { window.localStorage.removeItem(k); } catch(e){} }
};
const sourceOf = (name) => { const d = store.get(DRAFT_PREFIX + name); return d !== null ? d : BY_NAME[name].starter; };

/* ============================ завдання ============================ */
const TASKS = [
  { name:"parse_age", title:"Вік із форми", sig:"parse_age(text)",
    hint:"<code>int(\"abc\")</code> кидає <code>ValueError</code> — його і лови. Не пиши голий <code>except:</code>: він проковтне й інші помилки.",
    starter:
`def parse_age(text):
    """
    Перетворити рядок text на ціле число.
    Якщо це не вдалося — повернути None (програма не падає).

    Приклад: parse_age("42") -> 42
             parse_age("abc") -> None
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("parse_age ще не реалізовано")
` },
  { name:"safe_get", title:"Налаштування без падінь", sig:"safe_get(data, key, default=None)",
    hint:"Спіймай <code>KeyError</code> і <code>IndexError</code>: або двома <code>except</code>, або одним — <code>except (KeyError, IndexError):</code>. Не ловити <code>Exception</code>: тоді зникне й <code>TypeError</code>, який тут має пролітати.",
    starter:
`def safe_get(data, key, default=None):
    """
    data — словник або список. Повернути data[key],
    а якщо такого ключа чи індексу немає — default.

    Помилку TypeError (наприклад, індекс-рядок у списку) НЕ ловити:
    це помилка програміста, і програма має про неї сказати.

    Приклад: safe_get({"a": 1}, "b", 0) -> 0
             safe_get([10, 20], 5, "—") -> "—"
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("safe_get ще не реалізовано")
` },
  { name:"parse_logged", title:"Журнал спроби", sig:"parse_logged(text, log)",
    hint:"<code>else</code> виконується лише тоді, коли помилки не було, а <code>finally</code> — завжди. Тому <code>\"ок\"</code> піде в <code>else</code>, а <code>\"кінець\"</code> — у <code>finally</code>.",
    starter:
`def parse_logged(text, log):
    """
    Перетворити text на ціле число й записати в список log, що сталось:
      "ок"      — якщо вдалося,
      "помилка" — якщо ні (тоді повернути None),
      "кінець"  — завжди, останнім записом.

    Приклад: log = []
             parse_logged("5", log) -> 5, log == ["ок", "кінець"]
             parse_logged("x", log) -> None, log == [..., "помилка", "кінець"]
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("parse_logged ще не реалізовано")
` },
  { name:"first_number", title:"Питаємо, поки не введуть число", sig:"first_number(answers)",
    hint:"Пройди <code>for answer in answers</code>, у <code>try</code> зроби <code>return int(answer)</code>, а в <code>except ValueError</code> просто йди до наступної відповіді. Після циклу — <code>return None</code>.",
    starter:
`def first_number(answers):
    """
    answers — список рядків, які користувач вводить по черзі.
    Повернути перше значення, яке можна перетворити на ціле число.
    Якщо жодне не підійшло — повернути None.

    Приклад: first_number(["abc", "", "5", "7"]) -> 5
             first_number(["x", "y"]) -> None
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("first_number ще не реалізовано")
` },
  { name:"average", title:"Середнє без ділення на нуль", sig:"average(numbers)",
    hint:"Перевір порожній список <b>до</b> ділення: <code>if not numbers:</code> і далі <code>raise ValueError(\"…\")</code> з будь-яким зрозумілим текстом.",
    starter:
`def average(numbers):
    """
    Повернути середнє арифметичне чисел зі списку numbers.

    Для порожнього списку середнього не існує: кинь ValueError
    із зрозумілим текстом (а не ZeroDivisionError).

    Приклад: average([2, 4, 6]) -> 4.0
             average([]) -> ValueError
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("average ще не реалізовано")
` },
  { name:"validate_age", title:"Власний виняток AgeError", sig:"validate_age(age)", adv:true,
    hint:"Спершу оголоси клас вище функції: <code>class AgeError(ValueError):</code> з <code>pass</code> всередині. Потім у функції — <code>raise AgeError(\"…\")</code> для двох поганих випадків.",
    starter:
`def validate_age(age):
    """
    1) Оголоси ВИЩЕ цієї функції власний виняток AgeError —
       різновид ValueError (клас, який успадковує ValueError).
    2) Якщо age < 0 або age > 120 — кинь AgeError з поясненням.
       Інакше поверни age як є.

    Приклад: validate_age(15) -> 15
             validate_age(-1) -> AgeError
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("validate_age ще не реалізовано")
` }
];
const BY_NAME = Object.fromEntries(TASKS.map(t => [t.name, t]));

/* ============================ Python-обв'язка ============================ */
/* Виконується в окремому просторі імен разом із CheckHarness.PY (js/checks/harness.js):
   звідти беремо ліміт кроків циклів, щоб нескінченний цикл учня не вішав вкладку.
   Тести бувають двох видів: «поверни значення» (expected) і «кинь виняток»
   (raises — перевіряється ім'я типу в ланцюжку успадкування, тож підклас теж підходить). */
const HARNESS = String.raw`
import builtins
import copy

EXC_TESTS = {
    "parse_age": [
        {"call": 'parse_age("42")', "args": ("42",), "expected": 42},
        {"call": 'parse_age("abc")', "args": ("abc",), "expected": None},
        {"call": 'parse_age("")', "args": ("",), "expected": None},
        {"call": 'parse_age(" 7 ")', "args": (" 7 ",), "expected": 7},
        {"call": 'parse_age("3.5")', "args": ("3.5",), "expected": None},
    ],
    "safe_get": [
        {"call": 'safe_get({"a": 1}, "a")', "args": ({"a": 1}, "a"), "expected": 1},
        {"call": 'safe_get({"a": 1}, "b")', "args": ({"a": 1}, "b"), "expected": None},
        {"call": 'safe_get({"a": 1}, "b", 0)', "args": ({"a": 1}, "b", 0), "expected": 0},
        {"call": "safe_get([10, 20], 1)", "args": ([10, 20], 1), "expected": 20},
        {"call": 'safe_get([10, 20], 5, "—")', "args": ([10, 20], 5, "—"), "expected": "—"},
        {"call": 'safe_get([10], "x")', "args": ([10], "x"), "raises": "TypeError"},
    ],
    "parse_logged": [
        {"call": 'parse_logged("5", log)', "args": ("5", []), "expected": 5,
         "expected_args": {1: ["ок", "кінець"]}, "label": "log"},
        {"call": 'parse_logged("x", log)', "args": ("x", []), "expected": None,
         "expected_args": {1: ["помилка", "кінець"]}, "label": "log"},
        {"call": 'parse_logged("", log)', "args": ("", []), "expected": None,
         "expected_args": {1: ["помилка", "кінець"]}, "label": "log"},
        {"call": 'parse_logged("-12", log)', "args": ("-12", []), "expected": -12,
         "expected_args": {1: ["ок", "кінець"]}, "label": "log"},
    ],
    "first_number": [
        {"call": 'first_number(["abc", "", "5", "7"])', "args": (["abc", "", "5", "7"],), "expected": 5},
        {"call": 'first_number(["7"])', "args": (["7"],), "expected": 7},
        {"call": 'first_number(["x", "y"])', "args": (["x", "y"],), "expected": None},
        {"call": "first_number([])", "args": ([],), "expected": None},
        {"call": 'first_number(["1.5", "-3"])', "args": (["1.5", "-3"],), "expected": -3},
    ],
    "average": [
        {"call": "average([2, 4, 6])", "args": ([2, 4, 6],), "expected": 4.0},
        {"call": "average([5])", "args": ([5],), "expected": 5.0},
        {"call": "average([1, 2])", "args": ([1, 2],), "expected": 1.5},
        {"call": "average([])", "args": ([],), "raises": "ValueError"},
    ],
    "validate_age": [
        {"call": "validate_age(15)", "args": (15,), "expected": 15},
        {"call": "validate_age(0)", "args": (0,), "expected": 0},
        {"call": "validate_age(120)", "args": (120,), "expected": 120},
        {"call": "validate_age(-1)", "args": (-1,), "raises": "AgeError"},
        {"call": "validate_age(200)", "args": (200,), "raises": "AgeError"},
        {"call": "issubclass(AgeError, ValueError)", "check": "subclass", "names": ("AgeError", "ValueError")},
    ],
}

_EXC = {}


def exc_install(name, source):
    _EXC.pop(name, None)
    budget = _Budget(MAX_STEPS)
    namespace = {"__name__": "exc_task", "__tick__": budget, "input": _no_input}
    try:
        exec(_compile(source, f"{name}.py"), namespace)
    except (Exception, _NoInput, _TooLong) as error:
        return f"Помилка в коді — {_error_text(error)}"
    func = namespace.get(name)
    if not callable(func):
        return f"У коді немає функції {name}(...) — не перейменовуй її."
    _EXC[name] = (func, namespace, budget)
    return ""


def _expected_text(test):
    text = repr(test["expected"])
    for index, value in test.get("expected_args", {}).items():
        text += f", {test.get('label', 'аргумент')} = {value!r}"
    return text


def exc_test(name):
    func, namespace, budget = _EXC[name]
    results = []
    printed = io.StringIO()
    hung = False
    for test in EXC_TESTS[name]:
        budget.reset()
        row = {"call": test["call"]}
        if test.get("check") == "subclass":
            child, parent = test["names"]
            cls = namespace.get(child)
            base = namespace.get(parent) or getattr(builtins, parent, None)
            row["expected"] = "True"
            if not isinstance(cls, type):
                row.update(actual=f"клас {child} не оголошено", ok=False)
            else:
                ok = issubclass(cls, base)
                row.update(actual=repr(ok), ok=ok)
            results.append(row)
            continue
        args = copy.deepcopy(test["args"])
        raises = test.get("raises")
        row["expected"] = f"кидає {raises}" if raises else _expected_text(test)
        try:
            with redirect_stdout(printed):
                value = func(*args)
        except (_NoInput, _TooLong) as error:
            hung = hung or isinstance(error, _TooLong)
            row.update(actual=_error_text(error), ok=False)
        except Exception as error:
            if raises:
                names = [cls.__name__ for cls in type(error).__mro__]
                row.update(actual=f"кинуто {_error_text(error)}", ok=raises in names)
            else:
                row.update(actual=f"помилка — {_error_text(error)}", ok=False)
        else:
            if raises:
                row.update(actual=f"повернуто {value!r}, помилки не було", ok=False)
            else:
                ok = _check_equal(value, test["expected"])
                actual = repr(value)
                for index, expected in test.get("expected_args", {}).items():
                    ok = ok and args[index] == expected
                    actual += f", {test.get('label', 'аргумент')} = {args[index]!r}"
                row.update(actual=actual, ok=ok)
        results.append(row)
    return json.dumps({"results": results, "hung": hung, "stdout": printed.getvalue()[-2000:]}, ensure_ascii=False)
`;

/* ============================ Python ============================ */
let py = null, pyInstall = null, pyTest = null;
const status = {};          /* name → "ok" | "fail" | "error" | "hung" | "todo" */
const cards = {};           /* name → картка завдання */

async function bootPython(){
  py = await PyEditor.bootPyodide();
  py.globals.set("EXC_SRC", CheckHarness.PY + "\n" + HARNESS);
  py.runPython('_exc_ns = {"__name__": "exc_harness"}\nexec(EXC_SRC, _exc_ns)');
  const ns = py.globals.get("_exc_ns");
  pyInstall = ns.get("exc_install");
  pyTest = ns.get("exc_test");
  py.globals.delete("EXC_SRC");
}

/* ============================ картки завдань ============================ */
const STATUS_LABEL = {
  ok:"✓ виконано", fail:"тести не пройдено", error:"помилка в коді",
  hung:"цикл не закінчується", todo:"не розв'язано"
};

function taskCard(t){
  return `
    <div class="pyt-head">
      <code class="pyt-sig">${esc(t.sig)}</code>
      <span class="pyt-status" data-role="status">…</span>
    </div>
    <div class="pyed">
      <pre class="pyed-hl" data-role="hl" aria-hidden="true"></pre>
      <textarea class="pyed-ta" data-role="editor" spellcheck="false" autocapitalize="off"
        autocomplete="off" autocorrect="off" data-gramm="false" aria-label="Код функції ${t.name}"></textarea>
    </div>
    <div class="controls pyt-controls">
      <details class="pyt-hint"><summary>Підказка</summary><p>${t.hint}</p></details>
      <span class="pyt-kbd">Ctrl+Enter — запустити</span>
      <button type="button" class="ctl" data-act="reset">↺ Скинути</button>
      <button type="button" class="ctl primary" data-act="run" disabled>▶ Запустити</button>
    </div>
    <div class="pyt-msg" data-role="msg" hidden></div>
    <div class="pyt-tests" data-role="tests"></div>`;
}

const part = (card, role) => card.querySelector(`[data-role="${role}"]`);
const editorOf = (name) => part(cards[name], "editor");
const codeOf = (name) => editorOf(name).value;
function syncEditor(name){ PyEditor.syncEditor(editorOf(name), part(cards[name], "hl")); }
function setCode(name, value){ editorOf(name).value = value; syncEditor(name); }

function setStatus(name, st){
  status[name] = st;
  const el = part(cards[name], "status");
  el.textContent = STATUS_LABEL[st] || "…";
  el.className = "pyt-status " + st;
}

function setMsg(name, html, kind){
  const el = part(cards[name], "msg");
  el.hidden = !html;
  el.innerHTML = html || "";
  el.className = "pyt-msg " + (kind || "");
}

function testsTable(data){
  const rows = data.results.map(r => `
    <tr class="${r.ok ? "ok" : "no"}">
      <td class="pyt-mark">${r.ok ? "✓" : "✕"}</td>
      <td><code>${esc(r.call)}</code></td>
      <td><code>${esc(r.expected)}</code></td>
      <td><code>${esc(r.actual)}</code></td>
    </tr>`).join("");
  const printed = data.stdout
    ? `<div class="pyt-out-t">вивід print()</div><div class="out pyt-out">${esc(data.stdout)}</div>` : "";
  return `<div class="pyt-scroll"><table class="pyt-table">
    <thead><tr><th></th><th>виклик</th><th>очікується</th><th>отримано</th></tr></thead>
    <tbody>${rows}</tbody></table></div>${printed}`;
}

function renderProgress(){
  const done = TASKS.filter(t => status[t.name] === "ok").length;
  $id("exc-progress-fill").style.width = (done / TASKS.length * 100) + "%";
  $id("exc-progress-text").textContent = done === TASKS.length
    ? `Усі ${TASKS.length} задач виконано 🎉` : `Виконано ${done} з ${TASKS.length}`;
  $id("exc-chips").innerHTML = TASKS.map((t, k) =>
    `<a class="shop-chip ${status[t.name] === "ok" ? "ok" : ""}" href="#exc-task-${t.name}" data-jump="${t.name}">
      <span>${status[t.name] === "ok" ? "✓" : k + 1}</span>${esc(t.title)}</a>`).join("");
  $id("exc-hero").classList.toggle("done", done === TASKS.length);
}

/* Запускає тести однієї задачі. announce=false — тихий запуск (на старті): без
   повідомлення під редактором. */
function runTask(name, announce){
  const err = pyInstall(name, codeOf(name));
  const box = part(cards[name], "tests");
  if(err){
    setStatus(name, "error");
    setMsg(name, esc(err), "bad");
    box.innerHTML = `<p class="pyt-skip">Тести не запускались — спершу виправ помилку.</p>`;
  }else{
    const data = JSON.parse(pyTest(name));
    const bad = data.results.filter(r => !r.ok).length;
    const untouched = data.results.some(r => /NotImplementedError/.test(r.actual));
    setStatus(name, data.hung ? "hung" : !bad ? "ok" : untouched ? "todo" : "fail");
    box.innerHTML = testsTable(data);
    if(!announce) setMsg(name, "");
    else if(data.hung) setMsg(name, "Схоже, цикл ніколи не закінчується — перевір умову виходу з нього.", "bad");
    else if(!bad) setMsg(name, "Усі тести пройдено.", "good");
    else setMsg(name, "Код запустився, але не всі тести пройдено — подивись таблицю нижче.", "bad");
  }
  renderProgress();
}
const runAll = () => TASKS.forEach(t => runTask(t.name, false));

/* ============================ редактори й кнопки ============================ */
/* функції, які учень має згадати сам — саме їх і перевіряють завдання */
const AC_HIDDEN = new Set("int float sum len ValueError TypeError KeyError IndexError ZeroDivisionError Exception".split(" "));

function disarmResets(except){
  document.querySelectorAll('#page-errors-practice [data-act="reset"][data-armed]').forEach(b => {
    if(b === except) return;
    b.removeAttribute("data-armed");
    b.textContent = "↺ Скинути";
  });
}

function wireCard(name){
  const card = cards[name];
  PyEditor.wireEditor(editorOf(name), part(card, "hl"), {
    hiddenWords: AC_HIDDEN,
    minRows: 8,
    onInput: (value) => { store.set(DRAFT_PREFIX + name, value); },
    onRun: () => { if(py){ disarmResets(); runTask(name, true); } }
  });
  card.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if(!b) return;
    if(b.dataset.act === "run"){ disarmResets(); runTask(name, true); return; }
    if(b.dataset.armed !== "1"){
      disarmResets(b);
      b.dataset.armed = "1";
      b.textContent = "Точно? Натисни ще раз";
      return;
    }
    disarmResets();
    store.del(DRAFT_PREFIX + name);
    setCode(name, BY_NAME[name].starter);
    if(py){
      runTask(name, false);
      setMsg(name, "Повернуто початкову заготовку.", "good");
    }
  });
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const page = $id("page-errors-practice");
page.addEventListener("click", (e) => {
  const jump = e.target.closest("[data-jump]");
  if(jump){
    e.preventDefault();
    const el = $id("exc-task-" + jump.dataset.jump);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: reduced ? "auto" : "smooth" });
  }
});

/* ============================ старт ============================ */
TASKS.forEach(t => {
  const card = $id("exc-task-" + t.name);
  card.querySelector(".pyt-work").innerHTML = taskCard(t);
  cards[t.name] = card;
  setCode(t.name, sourceOf(t.name));
  wireCard(t.name);
});
renderProgress();

bootPython().then(() => {
  TASKS.forEach(t => { cards[t.name].querySelector('[data-act="run"]').disabled = false; });
  runAll();
  $id("exc-boot").hidden = true;
}).catch((err) => {
  console.error("Python не завантажився", err);
  const boot = $id("exc-boot");
  boot.innerHTML = `<b>Не вдалося завантажити Python.</b> Для цієї сторінки потрібен інтернет: інтерпретатор підвантажується з cdn.jsdelivr.net. Перевір з'єднання й онови сторінку.`;
  boot.classList.add("err");
});

};
