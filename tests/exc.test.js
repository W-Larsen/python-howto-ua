"use strict";
/* Практика «Помилки та винятки» (#/errors-practice): задачі й тести в Pyodide.
   Сторінка відкривається в iframe. */
(function(){

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const NAMES = ["parse_age", "safe_get", "parse_logged", "first_number", "average", "validate_age"];

/* еталонні рішення: кожне має проходити всі тести своєї задачі */
const SOLUTION = {
  parse_age:
`def parse_age(text):
    try:
        return int(text)
    except ValueError:
        return None
`,
  safe_get:
`def safe_get(data, key, default=None):
    try:
        return data[key]
    except (KeyError, IndexError):
        return default
`,
  parse_logged:
`def parse_logged(text, log):
    try:
        number = int(text)
    except ValueError:
        log.append("помилка")
        return None
    else:
        log.append("ок")
        return number
    finally:
        log.append("кінець")
`,
  first_number:
`def first_number(answers):
    for answer in answers:
        try:
            return int(answer)
        except ValueError:
            continue
    return None
`,
  average:
`def average(numbers):
    if not numbers:
        raise ValueError("список порожній")
    return sum(numbers) / len(numbers)
`,
  validate_age:
`class AgeError(ValueError):
    pass


def validate_age(age):
    if age < 0 or age > 120:
        raise AgeError("вік має бути від 0 до 120")
    return age
`
};

function clearStorage(){
  Object.keys(localStorage).filter(k => k.startsWith("pyguide_exc_")).forEach(k => localStorage.removeItem(k));
}

/* прибирає iframe й чернетки, які тест лишив у localStorage (той самий origin, що й справжня сторінка) */
function closeExcPage(){
  document.getElementById("sandbox").innerHTML = "";
  clearStorage();
}

/* сторінка в iframe; повертає помічники для редакторів і статусів */
async function openExcPage(){
  clearStorage();
  const box = document.getElementById("sandbox");
  box.innerHTML = "";
  const frame = document.createElement("iframe");
  frame.style.cssText = "width:1200px;height:700px;border:1px solid #ccc";
  frame.src = "../index.html#/errors-practice";
  await new Promise(r => { frame.onload = r; box.appendChild(frame); });
  const w = frame.contentWindow;
  const d = w.document;
  await T.until(() => !d.getElementById("exc-boot") || d.getElementById("exc-boot").hidden, 90000);
  await sleep(200);
  const page = {
    w, d,
    ta: (name) => d.querySelector(`#exc-task-${name} textarea`),
    status: (name) => d.querySelector(`#exc-task-${name} [data-role="status"]`).textContent,
    table: (name) => d.querySelector(`#exc-task-${name} [data-role="tests"]`).textContent,
    type(name, code){ const ta = page.ta(name); ta.value = code; ta.dispatchEvent(new w.Event("input")); },
    run(name){ d.querySelector(`#exc-task-${name} [data-act="run"]`).click(); },
    progress: () => d.getElementById("exc-progress-text").textContent
  };
  return page;
}

T.test("exc page: заготовки не розв'язані, прогрес 0 з 6, без входу й збереження на сервері", async () => {
  const p = await openExcPage();
  NAMES.forEach(n => T.eq(p.status(n), "не розв'язано", n));
  T.eq(p.progress(), "Виконано 0 з 6");
  T.ok(!p.d.getElementById("exc-login") && !p.d.querySelector('#page-errors-practice [data-act="save"]'), "ні входу, ні кнопки «Зберегти»");
  T.ok(p.d.querySelector("#page-practice-eng a.card[href='#/errors-practice']"), "картка на сторінці класу");
  closeExcPage();
});

T.test("exc page: еталонні рішення проходять усі тести, код лишається в браузері", async () => {
  const p = await openExcPage();
  NAMES.forEach(n => { p.type(n, SOLUTION[n]); p.run(n); });
  NAMES.forEach(n => T.eq(p.status(n), "✓ виконано", n + ": " + p.table(n).slice(0, 200)));
  T.eq(p.progress(), "Усі 6 задач виконано 🎉");
  NAMES.forEach(n => T.eq(p.w.localStorage.getItem("pyguide_exc_" + n), SOLUTION[n], n));
  closeExcPage();
});

T.test("exc page: типові помилки ловляться тестами", async () => {
  const p = await openExcPage();
  /* except Exception ковтає й TypeError, який має пролетіти */
  p.type("safe_get", SOLUTION.safe_get.replace("(KeyError, IndexError)", "Exception"));
  p.run("safe_get");
  T.eq(p.status("safe_get"), "тести не пройдено");
  T.ok(/повернуто/.test(p.table("safe_get")), "TypeError мав кинутись: " + p.table("safe_get"));
  /* наївне середнє: ZeroDivisionError замість ValueError */
  p.type("average", "def average(numbers):\n    return sum(numbers) / len(numbers)\n");
  p.run("average");
  T.eq(p.status("average"), "тести не пройдено");
  T.ok(/кинуто ZeroDivisionError/.test(p.table("average")), p.table("average"));
  /* ValueError замість AgeError */
  p.type("validate_age", "def validate_age(age):\n    if age < 0 or age > 120:\n        raise ValueError('x')\n    return age\n");
  p.run("validate_age");
  T.eq(p.status("validate_age"), "тести не пройдено");
  T.ok(/AgeError не оголошено/.test(p.table("validate_age")), p.table("validate_age"));
  /* без finally журнал неповний */
  p.type("parse_logged", SOLUTION.parse_logged.replace(/    finally:\n        log.append\("кінець"\)\n/, ""));
  p.run("parse_logged");
  T.eq(p.status("parse_logged"), "тести не пройдено");
  /* синтаксична помилка */
  p.type("parse_age", "def parse_age(text)\n    return 1\n");
  p.run("parse_age");
  T.eq(p.status("parse_age"), "помилка в коді");
  closeExcPage();
});

T.test("exc page: нескінченний цикл не вішає вкладку", async () => {
  const p = await openExcPage();
  p.type("first_number", "def first_number(answers):\n    while True:\n        pass\n");
  p.run("first_number");
  T.eq(p.status("first_number"), "цикл не закінчується");
  closeExcPage();
});

T.test("exc page: збережений у браузері код підтягується після оновлення сторінки", async () => {
  const p = await openExcPage();
  p.type("average", SOLUTION.average);
  const stored = p.w.localStorage.getItem("pyguide_exc_average");
  T.eq(stored, SOLUTION.average);
  p.w.location.reload();
  const area = () => p.w.document.querySelector("#exc-task-average textarea");
  await T.until(() => area() && area().value === SOLUTION.average, 20000);
  closeExcPage();
});

})();
