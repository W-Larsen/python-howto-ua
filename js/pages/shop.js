/* ==========================================================================
   Практика «Оживи магазин»: вітрина + завдання з редактором і тестами.
   Код учня виконується справжнім Python (Pyodide) прямо в браузері.
   Pyodide важкий, тому вантажиться лише тоді, коли цю сторінку вперше відкрили.
   ========================================================================== */
"use strict";
window.PageInit["shop"] = function(){

const $id = (s) => document.getElementById(s);
const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
const DRAFT_PREFIX = "pyguide_shop_";
/* ім'я завдання, чий код виконувався, коли вкладку закрили або вона зависла */
const RUNNING_KEY = "pyguide_shop_running";

/* ============================ дані магазину ============================ */
/* Товари — складні об'єкти. Функції учня ніколи їх не бачать: до Python
   доходять лише прості списки цін, назв і категорій. */
const PRODUCTS = [
  { name:"Бездротові навушники TWS Pro", category:"Електроніка", price:1899, rating:4.6,
    image:"tws-pro-headphones", badge:"Хіт продажів", description:"До 30 годин роботи, активне шумозаглушення." },
  { name:"Розумний годинник FitTrack X2", category:"Електроніка", price:3499, rating:4.4,
    image:"fittrack-x2-smartwatch", badge:null, description:"Пульсометр, GPS, до 10 днів автономності." },
  { name:"Механічна клавіатура RGB", category:"Електроніка", price:2299, rating:4.8,
    image:"rgb-mechanical-keyboard", badge:"Новинка", description:"Перемикачі blue, підсвітка RGB, USB-C." },
  { name:"Бездротова миша ErgoFlow", category:"Електроніка", price:799, rating:4.2,
    image:"ergoflow-wireless-mouse", badge:null, description:"Ергономічна форма, безшумні кліки." },
  { name:"Компактна камера SnapShot Z1", category:"Електроніка", price:8999, rating:4.5,
    image:"snapshot-z1-camera", badge:null, description:"4K відео, оптична стабілізація." },
  { name:"Кросівки міські UrbanStep", category:"Одяг та взуття", price:2149, rating:4.3,
    image:"urbanstep-sneakers", badge:null, description:"Легка сітчаста тканина, підошва з амортизацією." },
  { name:"Рюкзак TrailPack 25L", category:"Одяг та взуття", price:1349, rating:4.7,
    image:"trailpack-backpack", badge:"Хіт продажів", description:"Відділення під ноутбук 15″, вологозахист." },
  { name:"Сонцезахисні окуляри SunLine", category:"Одяг та взуття", price:599, rating:4.0,
    image:"sunline-sunglasses", badge:null, description:"UV400 захист, поляризаційні лінзи." },
  { name:"Кавоварка DripMaster", category:"Дім", price:2599, rating:4.6,
    image:"dripmaster-coffee-maker", badge:null, description:"Крапельна кавоварка на 1.2 л, таймер." },
  { name:"Настільна лампа GlowLine LED", category:"Дім", price:749, rating:4.1,
    image:"glowline-desk-lamp", badge:null, description:"Регулювання яскравості, USB-зарядка." },
  { name:"Пляшка для води SteelFlow", category:"Спорт", price:449, rating:4.9,
    image:"steelflow-water-bottle", badge:"Новинка", description:"Нержавіюча сталь, зберігає температуру 24 год." },
  { name:"Килимок для йоги FlexMat", category:"Спорт", price:699, rating:4.3,
    image:"flexmat-yoga-mat", badge:null, description:"Товщина 6 мм, протиковзке покриття." }
];
const ALL_PRICES = PRODUCTS.map(p => p.price);
const ALL_NAMES = PRODUCTS.map(p => p.name);
const ALL_CATEGORIES = PRODUCTS.map(p => p.category);
const CATEGORY_LIST = [...new Set(ALL_CATEGORIES)].sort((a, b) => a.localeCompare(b, "uk"));
const PRICE_MIN = Math.min(...ALL_PRICES);
const PRICE_MAX = Math.max(...ALL_PRICES);

const state = { category:null, low:PRICE_MIN, high:PRICE_MAX, sort:"default", cart:0 };

/* ============================ завдання ============================ */
const TASKS = [
  { name:"get_length", title:"Скільки товарів знайдено", sig:"get_length(items)",
    usage:"картка «Товарів знайдено»", target:"shop-stats",
    hint:"Рахувати циклом не потрібно — у Python є вбудована функція з трьох літер.",
    starter:
`def get_length(items):
    """
    Повернути КІЛЬКІСТЬ елементів у списку items.

    Приклад: get_length([10, 20, 30]) -> 3
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("get_length ще не реалізовано")
` },
  { name:"get_min", title:"Найдешевший товар", sig:"get_min(items)",
    usage:"картка «Мінімальна ціна»", target:"shop-stats",
    hint:"Протилежність до max() — теж одне слово.",
    starter:
`def get_min(items):
    """
    Повернути НАЙМЕНШИЙ елемент списку items.

    Приклад: get_min([5, -3, 9, 0]) -> -3
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("get_min ще не реалізовано")
` },
  { name:"get_max", title:"Найдорожчий товар", sig:"get_max(items)",
    usage:"картка «Максимальна ціна»", target:"shop-stats",
    hint:"Протилежність до min().",
    starter:
`def get_max(items):
    """
    Повернути НАЙБІЛЬШИЙ елемент списку items.

    Приклад: get_max([5, -3, 9, 0]) -> 9
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("get_max ще не реалізовано")
` },
  { name:"get_average", title:"Середня ціна", sig:"get_average(items)",
    usage:"картка «Середня ціна»", target:"shop-stats",
    hint:"Середнє = сума всіх елементів, поділена на їх кількість. Обидві частини — вбудовані функції.",
    starter:
`def get_average(items):
    """
    Повернути СЕРЕДНЄ АРИФМЕТИЧНЕ чисел у списку items.

    Приклад: get_average([2, 4, 6]) -> 4.0
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("get_average ще не реалізовано")
` },
  { name:"sort_values", title:"Сортування каталогу", sig:"sort_values(items, reverse=False)",
    usage:"список «Сортування» над товарами", target:"shop-sort",
    hint:"Згадай різницю між sorted() і .sort(): одна повертає копію, інша змінює список і повертає None.",
    starter:
`def sort_values(items, reverse=False):
    """
    Повернути НОВИЙ відсортований список на основі items.
    Сам items після виклику МАЄ ЛИШИТИСЯ без змін.

    Приклад: sort_values([3, 1, 2]) -> [1, 2, 3]
    Приклад: sort_values([3, 1, 2], reverse=True) -> [3, 2, 1]
    Приклад: sort_values(["вишня", "банан"]) -> ["банан", "вишня"]
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("sort_values ще не реалізовано")
` },
  { name:"filter_by_category", title:"Фільтр за категорією", sig:"filter_by_category(categories, target)",
    usage:"список категорій зліва", target:"shop-cats-wrap",
    hint:"Цикл for з enumerate() дає одразу індекс і значення; потрібні індекси додавай у новий список через append().",
    starter:
`def filter_by_category(categories, target):
    """
    categories - список назв категорій, по одній на кожен товар,
    у ТОМУ Ж порядку, що й самі товари.

    Повернути список ІНДЕКСІВ i, для яких categories[i] == target.

    Приклад: filter_by_category(["a", "b", "a"], "a") -> [0, 2]
    """
    # TODO: пройдись циклом по categories, порівнюючи кожен елемент з target
    raise NotImplementedError("filter_by_category ще не реалізовано")
` },
  { name:"filter_by_price_range", title:"Фільтр за ціною", sig:"filter_by_price_range(prices, low, high)",
    usage:"поля «Ціна» зліва", target:"shop-price",
    hint:"Той самий цикл, що й у фільтрі за категорією, тільки умова — «у діапазоні».",
    starter:
`def filter_by_price_range(prices, low, high):
    """
    prices - список цін, по одній на кожен товар, у ТОМУ Ж порядку,
    що й самі товари.

    Повернути список ІНДЕКСІВ i, для яких low <= prices[i] <= high.

    Приклад: filter_by_price_range([10, 25, 30, 5], 10, 25) -> [0, 1]
    """
    # TODO: пройдись циклом по prices, перевіряючи low <= prices[i] <= high
    raise NotImplementedError("filter_by_price_range ще не реалізовано")
` }
];
const BY_NAME = Object.fromEntries(TASKS.map(t => [t.name, t]));

/* Тести живуть на боці Python — так «очікується» й «отримано» друкуються
   через repr() і порівнюються рівно так, як це зробив би сам Python. */
const HARNESS = `
import copy, io, json
from contextlib import redirect_stdout

TESTS = {
    "get_length": [
        {"call": "get_length([10, 20, 30])", "args": ([10, 20, 30],), "expected": 3},
        {"call": "get_length([])", "args": ([],), "expected": 0},
        {"call": 'get_length(["a", "b"])', "args": (["a", "b"],), "expected": 2},
    ],
    "get_min": [
        {"call": "get_min([5, -3, 9, 0])", "args": ([5, -3, 9, 0],), "expected": -3},
        {"call": "get_min([7])", "args": ([7],), "expected": 7},
        {"call": "get_min([449.0, 1899.0, 799.0])", "args": ([449.0, 1899.0, 799.0],), "expected": 449.0},
    ],
    "get_max": [
        {"call": "get_max([5, -3, 9, 0])", "args": ([5, -3, 9, 0],), "expected": 9},
        {"call": "get_max([7])", "args": ([7],), "expected": 7},
        {"call": "get_max([449.0, 1899.0, 799.0])", "args": ([449.0, 1899.0, 799.0],), "expected": 1899.0},
    ],
    "get_average": [
        {"call": "get_average([2, 4, 6])", "args": ([2, 4, 6],), "expected": 4.0},
        {"call": "get_average([10])", "args": ([10],), "expected": 10.0},
        {"call": "get_average([1, 2])", "args": ([1, 2],), "expected": 1.5},
    ],
    "sort_values": [
        {"call": "sort_values([3, 1, 2])", "args": ([3, 1, 2],), "expected": [1, 2, 3]},
        {"call": "sort_values([3, 1, 2], reverse=True)", "args": ([3, 1, 2],),
         "kwargs": {"reverse": True}, "expected": [3, 2, 1]},
        {"call": 'sort_values(["вишня", "банан", "апельсин"])', "args": (["вишня", "банан", "апельсин"],),
         "expected": ["апельсин", "банан", "вишня"]},
        {"call": "items = [3, 1, 2]; sort_values(items); items", "args": ([3, 1, 2],),
         "check": "unchanged", "expected": [3, 1, 2]},
    ],
    "filter_by_category": [
        {"call": 'filter_by_category(["a", "b", "a"], "a")', "args": (["a", "b", "a"], "a"), "expected": [0, 2]},
        {"call": 'filter_by_category(["a", "b"], "z")', "args": (["a", "b"], "z"), "expected": []},
        {"call": 'filter_by_category(["Дім", "Спорт", "Дім"], "Спорт")',
         "args": (["Дім", "Спорт", "Дім"], "Спорт"), "expected": [1]},
    ],
    "filter_by_price_range": [
        {"call": "filter_by_price_range([10, 25, 30, 5], 10, 25)", "args": ([10, 25, 30, 5], 10, 25),
         "expected": [0, 1]},
        {"call": "filter_by_price_range([100, 200], 300, 400)", "args": ([100, 200], 300, 400),
         "expected": []},
        {"call": "filter_by_price_range([5, 5], 5, 5)", "args": ([5, 5], 5, 5), "expected": [0, 1]},
    ],
}

_FUNCS = {}


def _error_text(error):
    return f"{type(error).__name__}: {error}"


def shop_install(name, source):
    _FUNCS.pop(name, None)
    namespace = {}
    try:
        exec(compile(source, f"{name}.py", "exec"), namespace)
    except Exception as error:
        return f"Помилка в коді — {_error_text(error)}"
    func = namespace.get(name)
    if not callable(func):
        return f"У коді немає функції {name}(...) — не перейменовуй її."
    _FUNCS[name] = func
    return ""


def _equal(actual, expected):
    try:
        if isinstance(expected, float) and isinstance(actual, (int, float)) and not isinstance(actual, bool):
            return abs(actual - expected) < 1e-6
        return bool(actual == expected)
    except Exception:
        return False


def shop_test(name):
    func = _FUNCS[name]
    results = []
    printed = io.StringIO()
    for test in TESTS[name]:
        args = copy.deepcopy(test["args"])
        kwargs = test.get("kwargs", {})
        row = {"call": test["call"], "expected": repr(test["expected"])}
        try:
            with redirect_stdout(printed):
                actual = func(*args, **kwargs)
        except Exception as error:
            row.update(actual=f"помилка — {_error_text(error)}", ok=False, error=True)
            results.append(row)
            continue
        if test.get("check") == "unchanged":
            actual = args[0]
        row.update(actual=repr(actual), ok=_equal(actual, test["expected"]), error=False)
        results.append(row)
    return json.dumps({"results": results, "stdout": printed.getvalue()[-2000:]}, ensure_ascii=False)


def shop_call(name, args_json, kwargs_json):
    func = _FUNCS.get(name)
    if func is None:
        return json.dumps({"ok": False, "error": "функцію не скомпільовано"})
    args = json.loads(args_json)
    kwargs = json.loads(kwargs_json)
    snapshot = copy.deepcopy(args)
    try:
        with redirect_stdout(io.StringIO()):
            value = func(*args, **kwargs)
    except Exception as error:
        return json.dumps({"ok": False, "error": _error_text(error)}, ensure_ascii=False)
    mutated = args != snapshot
    try:
        return json.dumps({"ok": True, "value": value, "mutated": mutated}, ensure_ascii=False, allow_nan=False)
    except (TypeError, ValueError):
        return json.dumps({"ok": False, "error": "функція повернула щось несподіване", "mutated": mutated})
`;

/* ============================ сховище ============================ */
/* У приватному режимі localStorage може кидати помилки — тоді просто не зберігаємо. */
const store = {
  get(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { window.localStorage.setItem(k, v); } catch(e){} },
  del(k){ try { window.localStorage.removeItem(k); } catch(e){} }
};
const readDraft = (name) => store.get(DRAFT_PREFIX + name);
const sourceOf = (name) => { const d = readDraft(name); return d !== null ? d : BY_NAME[name].starter; };

/* ============================ підсвітка Python ============================ */
const PY_KW = new Set(("False None True and as assert break class continue def del elif else except " +
  "finally for from global if import in is lambda nonlocal not or pass raise return try while with yield").split(" "));
const PY_FN = new Set(("print len range sorted sum min max map filter any all enumerate zip list set dict " +
  "tuple str int float abs round reversed type isinstance append insert remove pop sort index count " +
  "NotImplementedError ValueError TypeError").split(" "));
const PY_TOKEN = /("""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(#[^\n]*)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b/g;

function highlightPy(src){
  let out = "", last = 0, afterDef = false, m;
  PY_TOKEN.lastIndex = 0;
  while((m = PY_TOKEN.exec(src))){
    out += esc(src.slice(last, m.index));
    last = PY_TOKEN.lastIndex;
    const [tok, str, cmt, num, word] = m;
    if(str) out += `<span class="str">${esc(tok)}</span>`;
    else if(cmt) out += `<span class="cmt">${esc(tok)}</span>`;
    else if(num) out += `<span class="num">${tok}</span>`;
    else if(word){
      if(afterDef){ out += `<span class="def">${tok}</span>`; afterDef = false; continue; }
      if(PY_KW.has(word)){ out += `<span class="kw">${tok}</span>`; afterDef = word === "def"; continue; }
      out += PY_FN.has(word) ? `<span class="fn">${tok}</span>` : tok;
    }
  }
  return out + esc(src.slice(last));
}

/* ============================ Python ============================ */
let py = null;
let pyInstall = null, pyTest = null, pyCall = null;
const loaded = {};      /* name → текст помилки компіляції або "" */
const status = {};      /* name → "ok" | "fail" | "error" | "hung" */

function loadScript(src){
  return new Promise((resolve, reject)=>{
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("не вдалося завантажити " + src));
    document.head.appendChild(s);
  });
}

async function bootPython(){
  if(!window.loadPyodide) await loadScript(PYODIDE_URL);
  py = await window.loadPyodide();
  py.runPython(HARNESS);
  pyInstall = py.globals.get("shop_install");
  pyTest = py.globals.get("shop_test");
  pyCall = py.globals.get("shop_call");
}

function install(name, source){
  loaded[name] = pyInstall(name, source);
  return loaded[name];
}

/* Виклик функції учня з вітрини. Помилка не валить магазин — просто
   повертаємо {ok:false}, і відповідна частина показує прочерк. */
function call(name, args, kwargs){
  if(!py || loaded[name] !== "") return { ok:false, error:"не завантажено" };
  try {
    return JSON.parse(pyCall(name, JSON.stringify(args), JSON.stringify(kwargs || {})));
  } catch(err){
    return { ok:false, error:String(err) };
  }
}

/* Тести однієї функції. Позначка RUNNING_KEY рятує від вічного циклу:
   якщо вкладка зависла й її перезавантажили, цей код автоматично вже не запуститься. */
function runTests(name){
  store.set(RUNNING_KEY, name);
  try { return JSON.parse(pyTest(name)); }
  finally { store.del(RUNNING_KEY); }
}

/* ============================ вітрина ============================ */
const fmtPrice = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₴";
const isNum = (v) => typeof v === "number" && isFinite(v);
const stars = (r) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));
const taskLink = (name) => `<a href="#shop-task-${name}" data-jump="${name}"><code>${name}()</code></a>`;

function filteredIndices(){
  let idx = PRODUCTS.map((_, i) => i);
  const warn = [];

  if(state.category !== null){
    const r = call("filter_by_category", [ALL_CATEGORIES, state.category]);
    if(!r.ok || !Array.isArray(r.value))
      warn.push(`Фільтр за категорією ще не працює — розв'яжи ${taskLink("filter_by_category")}.`);
    else { const keep = new Set(r.value); idx = idx.filter(i => keep.has(i)); }
  }

  if(state.low > PRICE_MIN || state.high < PRICE_MAX){
    const r = call("filter_by_price_range", [ALL_PRICES, state.low, state.high]);
    if(!r.ok || !Array.isArray(r.value))
      warn.push(`Фільтр за ціною ще не працює — розв'яжи ${taskLink("filter_by_price_range")}.`);
    else { const keep = new Set(r.value); idx = idx.filter(i => keep.has(i)); }
  }
  return { idx, warn };
}

/* Функція учня сортує лише значення (ціни чи назви). Щоб переставити самі
   товари, шукаємо для кожного відсортованого значення перший ще не взятий товар. */
function sortIndices(idx){
  if(state.sort === "default") return { idx, warn:[] };
  const byPrice = state.sort !== "name_asc";
  const values = idx.map(i => byPrice ? ALL_PRICES[i] : ALL_NAMES[i]);
  const r = call("sort_values", [values], { reverse: state.sort === "price_desc" });

  if(r.mutated)
    return { idx, warn:[`${taskLink("sort_values")} змінила вхідний список — магазин більше не знає, яка ціна якому товару належить. Використай <code>sorted()</code>, а не <code>.sort()</code>.`] };
  if(!r.ok || !Array.isArray(r.value) || r.value.length !== values.length)
    return { idx, warn:[`Сортування ще не працює — розв'яжи ${taskLink("sort_values")}.`] };

  const pool = idx.map((i, k) => [i, values[k]]);
  const ordered = [];
  for(const target of r.value){
    const pos = pool.findIndex(p => p[1] === target);
    if(pos >= 0) ordered.push(pool.splice(pos, 1)[0][0]);
  }
  pool.forEach(p => ordered.push(p[0]));
  return { idx: ordered, warn:[] };
}

function statTile(label, r, fmt, task){
  const ok = r.ok && isNum(r.value);
  return `<div class="shop-stat${ok ? "" : " off"}">
    <span class="shop-stat-v">${ok ? fmt(r.value) : "—"}</span>
    <span class="shop-stat-l">${label}</span>
    ${ok ? "" : `<a class="shop-stat-t" href="#shop-task-${task}" data-jump="${task}">${task}()</a>`}
  </div>`;
}

function renderShop(){
  if(!py) return;
  const f = filteredIndices();
  const s = sortIndices(f.idx);
  const idx = s.idx, warn = f.warn.concat(s.warn);
  const prices = idx.map(i => ALL_PRICES[i]);

  $id("shop-stats").innerHTML =
    statTile("товарів знайдено", call("get_length", [prices]), v => String(Math.round(v)), "get_length") +
    statTile("мінімальна ціна", call("get_min", [prices]), fmtPrice, "get_min") +
    statTile("максимальна ціна", call("get_max", [prices]), fmtPrice, "get_max") +
    statTile("середня ціна", call("get_average", [prices]), fmtPrice, "get_average");

  $id("shop-warn").innerHTML = warn.length
    ? `<b>Не все ще працює</b><ul>${warn.map(w => `<li>${w}</li>`).join("")}</ul>`
    : "";
  $id("shop-warn").hidden = !warn.length;

  $id("shop-cats").innerHTML = [[null, "Усі товари"]].concat(CATEGORY_LIST.map(c => [c, c])).map(([v, l]) =>
    `<button type="button" class="store-cat" data-cat="${v === null ? "" : esc(v)}" aria-pressed="${state.category === v}">${esc(l)}</button>`
  ).join("");

  const cheapest = call("get_min", [ALL_PRICES]);
  $id("shop-banner-price").innerHTML = cheapest.ok && isNum(cheapest.value)
    ? `Ціни від <b>${fmtPrice(cheapest.value)}</b>`
    : `Ціни від <b>—</b> <span>(банеру потрібна ${taskLink("get_min")})</span>`;

  $id("shop-count").innerHTML = `Знайдено <b>${idx.length}</b> з ${PRODUCTS.length} товарів`;

  $id("shop-grid").innerHTML = idx.length ? idx.map(i => {
    const p = PRODUCTS[i];
    return `<article class="shop-card">
      <div class="shop-img">
        <img src="img/shop/${p.image}.jpg" alt="${esc(p.name)}" loading="lazy" width="320" height="240">
        ${p.badge ? `<span class="shop-badge">${p.badge}</span>` : ""}
      </div>
      <div class="shop-cbody">
        <span class="shop-cat">${esc(p.category)}</span>
        <h4>${esc(p.name)}</h4>
        <p>${esc(p.description)}</p>
        <span class="shop-rate" aria-label="рейтинг ${p.rating}">${stars(p.rating)} <i>${p.rating.toFixed(1)}</i></span>
        <div class="shop-cfoot">
          <b>${fmtPrice(p.price)}</b>
          <button type="button" class="ctl shop-buy">У кошик</button>
        </div>
      </div>
    </article>`;
  }).join("") : `<p class="shop-empty">Товарів не знайдено. Спробуй змінити фільтри.</p>`;
}

function renderProgress(){
  const done = TASKS.filter(t => status[t.name] === "ok").length;
  $id("shop-progress-fill").style.width = (done / TASKS.length * 100) + "%";
  $id("shop-progress-text").textContent = done === TASKS.length
    ? "Усі 7 завдань виконано — магазин працює повністю 🎉"
    : `Виконано ${done} з ${TASKS.length}`;
  $id("shop-chips").innerHTML = TASKS.map((t, k) =>
    `<a class="shop-chip ${status[t.name] === "ok" ? "ok" : ""}" href="#shop-task-${t.name}" data-jump="${t.name}">
      <span>${status[t.name] === "ok" ? "✓" : k + 1}</span>${t.title}</a>`).join("");
  $id("shop-hero").classList.toggle("done", done === TASKS.length);
}

/* ============================ картки завдань ============================ */
const STATUS_LABEL = {
  ok:"✓ виконано", fail:"тести не пройдено", error:"помилка в коді",
  hung:"код не запущено", todo:"не розв'язано"
};

function taskCard(t){
  return `
    <div class="pyt-head">
      <code class="pyt-sig">${esc(t.sig)}</code>
      <span class="pyt-status" data-role="status">…</span>
    </div>
    <div class="pyt-where">Де в магазині: <a href="#shop-shop" data-scroll="${t.target}">${t.usage} ↑</a></div>
    <div class="pyed">
      <pre class="pyed-hl" aria-hidden="true"><code data-role="hl"></code></pre>
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

function syncEditor(card){
  const ta = part(card, "editor");
  ta.rows = Math.max(8, ta.value.split("\n").length + 1);
  /* зайвий \n — щоб порожній останній рядок мав висоту, як у textarea */
  part(card, "hl").innerHTML = highlightPy(ta.value) + "\n";
}

function setStatus(card, name, st){
  status[name] = st;
  const el = part(card, "status");
  el.textContent = STATUS_LABEL[st];
  el.className = "pyt-status " + st;
}

function setMsg(card, html, kind){
  const el = part(card, "msg");
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

function runTask(card, name, announce){
  const ta = part(card, "editor");
  syncEditor(card);
  const err = install(name, ta.value);
  const box = part(card, "tests");

  if(err){
    setStatus(card, name, "error");
    setMsg(card, esc(err), "bad");
    box.innerHTML = `<p class="pyt-skip">Тести не запускались — спершу виправ помилку.</p>`;
  }else{
    const data = runTests(name);
    const passed = data.results.every(r => r.ok);
    const untouched = data.results.some(r => /NotImplementedError/.test(r.actual));
    setStatus(card, name, passed ? "ok" : (untouched ? "todo" : "fail"));
    box.innerHTML = testsTable(data);
    if(!announce) setMsg(card, "");
    else if(passed) setMsg(card, `Усі тести пройдено. Магазин уже використовує цю функцію — <a href="#shop-shop" data-scroll="${BY_NAME[name].target}">подивитись ↑</a>`, "good");
    else setMsg(card, "Код запустився, але не всі тести пройдено — подивись таблицю нижче.", "bad");
  }
  renderProgress();
  renderShop();
}

function disarmResets(except){
  document.querySelectorAll('#page-shop [data-act="reset"][data-armed]').forEach(b => {
    if(b === except) return;
    b.removeAttribute("data-armed");
    b.textContent = "↺ Скинути";
  });
}

function wireCard(card, name){
  const ta = part(card, "editor");
  const hlPre = card.querySelector(".pyed-hl");

  ta.addEventListener("input", () => { store.set(DRAFT_PREFIX + name, ta.value); syncEditor(card); });
  ta.addEventListener("scroll", () => { hlPre.scrollTop = ta.scrollTop; hlPre.scrollLeft = ta.scrollLeft; });

  ta.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      if(py){ disarmResets(); runTask(card, name, true); }
      return;
    }
    const start = ta.selectionStart, end = ta.selectionEnd, v = ta.value;
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
    /* execCommand лишає зміну в історії Ctrl+Z; якщо його нема — вставляємо вручну */
    if(!document.execCommand || !document.execCommand("insertText", false, insert)){
      ta.value = v.slice(0, start) + insert + v.slice(end);
      ta.selectionStart = ta.selectionEnd = start + insert.length;
      ta.dispatchEvent(new Event("input"));
    }
  });

  card.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if(!b) return;
    if(b.dataset.act === "run"){
      disarmResets();
      store.set(DRAFT_PREFIX + name, ta.value);
      runTask(card, name, true);
      return;
    }
    if(b.dataset.armed !== "1"){
      disarmResets(b);
      b.dataset.armed = "1";
      b.textContent = "Точно? Натисни ще раз";
      return;
    }
    disarmResets();
    store.del(DRAFT_PREFIX + name);
    ta.value = BY_NAME[name].starter;
    syncEditor(card);
    if(py){
      runTask(card, name, false);
      setMsg(card, "Повернуто початкову заготовку.", "good");
    }
  });
}

/* ============================ навігація всередині сторінки ============================ */
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function scrollToEl(el, flash){
  if(!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70,
                    behavior: reduced ? "auto" : "smooth" });
  if(flash){
    el.classList.remove("shop-flash");
    void el.offsetWidth;
    el.classList.add("shop-flash");
  }
}

const page = $id("page-shop");
page.addEventListener("click", (e) => {
  const jump = e.target.closest("[data-jump]");
  if(jump){
    e.preventDefault();
    scrollToEl($id("shop-task-" + jump.dataset.jump));
    return;
  }
  const to = e.target.closest("[data-scroll]");
  if(to){
    e.preventDefault();
    scrollToEl($id("shop-shop"));
    const target = $id(to.dataset.scroll);
    if(target) setTimeout(() => { target.classList.remove("shop-flash"); void target.offsetWidth; target.classList.add("shop-flash"); }, reduced ? 0 : 350);
  }
});

/* ============================ керування вітриною ============================ */
const lowIn = $id("shop-low"), highIn = $id("shop-high");
[lowIn, highIn].forEach(inp => { inp.min = PRICE_MIN; inp.max = PRICE_MAX; });
lowIn.value = PRICE_MIN;
highIn.value = PRICE_MAX;

function readPrice(inp, fallback){
  const v = parseFloat(inp.value);
  return isFinite(v) ? v : fallback;
}
lowIn.addEventListener("change", () => { state.low = readPrice(lowIn, PRICE_MIN); renderShop(); });
highIn.addEventListener("change", () => { state.high = readPrice(highIn, PRICE_MAX); renderShop(); });
$id("shop-sort-sel").addEventListener("change", (e) => { state.sort = e.target.value; renderShop(); });
$id("shop-cats").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-cat]");
  if(!b) return;
  state.category = b.dataset.cat === "" ? null : b.dataset.cat;
  renderShop();
});
$id("shop-grid").addEventListener("click", (e) => {
  if(!e.target.closest(".shop-buy")) return;
  state.cart++;
  $id("shop-cart").textContent = state.cart;
  const box = $id("shop-cartbox");
  box.classList.remove("bump");
  void box.offsetWidth;
  box.classList.add("bump");
});

/* ============================ старт ============================ */
const cards = TASKS.map(t => {
  const card = $id("shop-task-" + t.name);
  card.querySelector(".pyt-work").innerHTML = taskCard(t);
  part(card, "editor").value = sourceOf(t.name);
  syncEditor(card);
  wireCard(card, t.name);
  return card;
});
renderProgress();

const loadingEl = $id("shop-loading");
bootPython().then(() => {
  const hung = store.get(RUNNING_KEY);
  store.del(RUNNING_KEY);
  TASKS.forEach((t, k) => {
    const card = cards[k];
    card.querySelector('[data-act="run"]').disabled = false;
    if(t.name === hung){
      /* минулого разу саме цей код не повернувся — не запускаємо його сам */
      setStatus(card, t.name, "hung");
      setMsg(card, "Минулого разу цей код, схоже, завис (нескінченний цикл?). Перевір його й натисни «Запустити».", "bad");
      loaded[t.name] = "не запущено";
      return;
    }
    runTask(card, t.name, false);
  });
  loadingEl.hidden = true;
  $id("shop-body").hidden = false;
  renderProgress();
  renderShop();
}).catch((err) => {
  console.error("Python не завантажився", err);
  loadingEl.innerHTML = `<b>Не вдалося завантажити Python.</b> Для цієї сторінки потрібен інтернет: інтерпретатор підвантажується з cdn.jsdelivr.net. Перевір з'єднання й онови сторінку.`;
  loadingEl.classList.add("err");
});

};
