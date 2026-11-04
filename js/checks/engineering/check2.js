/* ==========================================================================
   Самостійна робота 2 для Старшої інженерної школи (#/check-2) — за
   лекціями 4–7 і практиками 3–5: функції, списки й словники, текстові
   файли, CSV, винятки.

   9 завдань, 12 балів. П'ять питань із варіантами відповіді (1 бал; 0.5
   бала за майже правильну відповідь) і чотири практичні завдання: два по
   1.5 бала (трохи легші) і два по 2 бали. За практику — частковий бал
   (partial:true): бал × частка пройдених прихованих тестів, униз до 0.5.

   Коли учні почнуть проходити роботу, тексти варіантів відповіді
   (options[].text) і стартовий код не змінювати: від них залежать
   надіслані вчителю посилання. Умови, підказки й пояснення правити можна.
   Нове — лише новим варіантом у кінець списку.
   ========================================================================== */
"use strict";
CheckEngine.define({
  slug:"check-2",
  storage:"pyguide_check2",
  shareVersion:1,
  partial:true,
  title:"Інженерна школа: Самостійна робота 2",
  lede:
    "<p>Самостійна робота за темами «Функції», «Списки й словники», «Файли», «CSV» і «Винятки» — на <b>12 балів</b>. Усього 9 завдань:</p>" +
    "<ul>" +
      "<li><b>5 питань</b> з варіантами відповіді — по 1 балу, а за майже правильну відповідь — 0.5;</li>" +
      "<li><b>4 практичні завдання</b>, де треба написати функцію, — два по 1.5 бала і два по 2 бали.</li>" +
    "</ul>",
  rules:
    "<p><b>Перед початком прочитай, як усе влаштовано:</b></p>" +
    "<ul>" +
      "<li><b>Одна спроба.</b> Коли натиснеш «Завершити тест», змінити відповіді чи пройти тест заново вже не вийде.</li>" +
      "<li><b>У кожного свої завдання,</b> але складність і максимум — 12 балів — однакові для всіх.</li>" +
      "<li><b>Частковий бал за практику.</b> Функцію перевіряють кілька прихованих тестів: пройде половина — отримаєш половину балів за завдання (з округленням униз до 0.5).</li>" +
      "<li><b>Файли — справжні.</b> У завданнях з файлами функція отримує ім'я файлу, а тести кладуть поруч файл із даними. Приклад файлу показано в умові.</li>" +
      "<li><b>Відповіді не загубляться.</b> Поки пишеш, вони зберігаються автоматично, а після завершення в цьому браузері лишається результат.</li>" +
      "<li><b>Код можна запускати скільки завгодно.</b> Кнопка «Запустити» (або Ctrl+Enter) покаже, чи виконується код без помилок, і що надрукував твій <code>print()</code> — так можна перевірити функцію на файлі-прикладі. Чи пройде вона приховані тести, дізнаєшся лише після завершення.</li>" +
    "</ul>",
  slots:[

  /* ---------- 1. функції — MCQ ---------- */
  { id:"func_mcq", type:"mcq", topic:"Функції", points:1, variants:[
    { q:"Що виведе цей код?",
      code:`def add(a, b):
    print(a + b)

result = add(2, 3)
print(result)`,
      options:[
        { text:"5\nNone", credit:1 },
        { text:"5\n5", credit:0 },
        { text:"None", credit:0 },
        { text:"5", credit:0 }
      ],
      explain:"Функція `add` лише ДРУКУЄ суму, а нічого не повертає. Функція без `return` повертає `None`.\n\nТому спершу виконується `print(a + b)` усередині функції — виводиться `5`, а потім `print(result)` виводить `None`.\n\n`print` показує людині, `return` віддає значення програмі." },
    { q:"Потрібна функція `area(w, h)`, яка ПОВЕРТАЄ площу прямокутника, щоб її можна було зберегти в змінну: `s = area(3, 4)`.\n\nЯкий варіант правильний?",
      options:[
        { text:"def area(w, h):\n    return w * h", credit:1 },
        { text:"def area(w, h)\n    return w * h", credit:0.5 },
        { text:"def area(w, h):\n    print(w * h)", credit:0 },
        { text:"def area():\n    return w * h", credit:0 }
      ],
      explain:"Функція отримує дані через параметри й віддає результат через `return`.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `def` — `SyntaxError`, хоча логіка правильна.\n- `print` лише показує площу, а `s` отримає `None`.\n- Без параметрів функція не знає, що таке `w` і `h`, — `NameError`." },
    { q:"Що виведе цей код?",
      code:`def greet(name, greeting="Привіт"):
    return greeting + ", " + name + "!"

print(greet("Оля"))
print(greet("Іван", "Добрий день"))`,
      options:[
        { text:"Привіт, Оля!\nДобрий день, Іван!", credit:1 },
        { text:"Привіт, Оля!\nПривіт, Іван!", credit:0 },
        { text:"Оля, Привіт!\nІван, Добрий день!", credit:0 },
        { text:"TypeError: greet() missing 1 required positional argument", credit:0 }
      ],
      explain:"`greeting=\"Привіт\"` — значення за замовчуванням: воно використовується, лише якщо другий аргумент не передали.\n\nУ першому виклику передано тільки ім'я — працює `\"Привіт\"`. У другому передано `\"Добрий день\"` — воно замінює значення за замовчуванням. Помилки немає: параметр зі значенням за замовчуванням можна не передавати." },
    { q:"Що виведе цей код?",
      code:`total = 0

def add_bonus(points):
    total = points + 10
    return total

add_bonus(5)
print(total)`,
      options:[
        { text:"0", credit:1 },
        { text:"15", credit:0 },
        { text:"10", credit:0 },
        { text:"NameError: name 'total' is not defined", credit:0 }
      ],
      explain:"`total` усередині функції — ЛОКАЛЬНА змінна: вона живе лише під час виклику й не має нічого спільного з `total` поза функцією.\n\nДо того ж результат `add_bonus(5)` ніде не збережено. Тому зовнішній `total` лишається `0`. Щоб отримати 15, треба написати `total = add_bonus(5)`." }
  ]},

  /* ---------- 2. списки й словники — MCQ ---------- */
  { id:"coll_mcq", type:"mcq", topic:"Списки й словники", points:1, variants:[
    { q:"Що виведе цей код?",
      code:`prices = [300, 100, 200]
result = prices.sort()
print(result)`,
      options:[
        { text:"None", credit:1 },
        { text:"[100, 200, 300]", credit:0 },
        { text:"[300, 100, 200]", credit:0 },
        { text:"[300, 200, 100]", credit:0 }
      ],
      explain:"Метод `.sort()` сортує сам список НА МІСЦІ й повертає `None`. Тому в `result` лежить `None`, а відсортований — сам `prices`.\n\nЯкщо потрібен новий відсортований список, використовують функцію `sorted(prices)` — вона повертає список і не чіпає оригінал." },
    { q:"Є словник `stock = {\"яблука\": 5, \"груші\": 0}`. Потрібно збільшити кількість товару з назвою `name` на 1 — навіть якщо такого ключа в словнику ще немає.\n\nЯкий варіант правильний?",
      options:[
        { text:"stock[name] = stock.get(name, 0) + 1", credit:1 },
        { text:"stock[name] = stock.get(name 0) + 1", credit:0.5 },
        { text:"stock[name] += 1", credit:0 },
        { text:"stock.get(name, 0) + 1", credit:0 }
      ],
      explain:"`.get(name, 0)` повертає поточну кількість або `0`, якщо ключа немає, — тож новий товар отримає 1, а наявний збільшиться на 1.\n\nЩо не так з іншими варіантами:\n- Між аргументами `get` немає коми — `SyntaxError`.\n- `stock[name] += 1` для нового товару впаде з `KeyError`.\n- Вираз рахує нове значення, але нікуди його не записує — словник не зміниться." },
    { q:"Що виведе цей код?",
      code:`scores = {"Оля": 10, "Іван": 7, "Марко": 12}
for name, score in scores.items():
    if score >= 10:
        print(name)`,
      options:[
        { text:"Оля\nМарко", credit:1 },
        { text:"10\n12", credit:0 },
        { text:"Оля\nІван\nМарко", credit:0 },
        { text:"('Оля', 10)\n('Марко', 12)", credit:0 }
      ],
      explain:"`.items()` дає пари «ключ — значення», і в циклі `for name, score in ...` вони одразу розкладаються у дві змінні.\n\nУмова `score >= 10` пропускає лише Олю (10) і Марка (12), а друкується `name` — ім'я, а не бал і не вся пара." },
    { q:"`cars` — список словників, у кожного є ключ `\"price\"`, наприклад такий, як нижче. Потрібно отримати НОВИЙ список, відсортований за ціною від найдешевшого.\n\nЯкий варіант правильний?",
      codeOptions:true,
      code:`cars = [
    {"brand": "BMW", "model": "M3", "price": 90000},
    {"brand": "Toyota", "model": "Camry", "price": 40000},
    {"brand": "Tesla", "model": "Model 3", "price": 50000}
]`,
      options:[
        { text:'sorted(cars, key=lambda car: car["price"])', credit:1 },
        { text:'sorted(cars, key=lambda car: car["price"]', credit:0.5 },
        { text:"sorted(cars)", credit:0 },
        { text:'sorted(cars, key=car["price"])', credit:0 }
      ],
      explain:"`key=` отримує ФУНКЦІЮ, яка для кожного елемента каже, за чим сортувати. `lambda car: car[\"price\"]` — коротка функція, що повертає ціну авто.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- Словники між собою порівнювати не можна — `TypeError`.\n- `car[\"price\"]` обчислюється одразу, ще до сортування, а змінної `car` тут немає — `NameError`." }
  ]},

  /* ---------- 3. текстові файли — MCQ ---------- */
  { id:"file_mcq", type:"mcq", topic:"Текстові файли", points:1, variants:[
    { q:"У файлі `log.txt` уже є записи. Потрібно ДОПИСАТИ в кінець ще один рядок, не стираючи того, що там було.\n\nЯкий варіант правильний?",
      options:[
        { text:'with open("log.txt", "a", encoding="utf-8") as f:\n    f.write("Новий запис\\n")', credit:1 },
        { text:'with open("log.txt", "a", encoding="utf-8") as f\n    f.write("Новий запис\\n")', credit:0.5 },
        { text:'with open("log.txt", "w", encoding="utf-8") as f:\n    f.write("Новий запис\\n")', credit:0 },
        { text:'with open("log.txt", "r", encoding="utf-8") as f:\n    f.write("Новий запис\\n")', credit:0 }
      ],
      explain:"Режим `\"a\"` (append) дописує в кінець файлу, а якщо файлу немає — створює його.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `with` — `SyntaxError`.\n- Режим `\"w\"` спершу СТИРАЄ весь файл — старі записи зникнуть.\n- Режим `\"r\"` — лише читання, `write()` кине помилку." },
    { q:"У файлі `numbers.txt` два рядки: `5` і `7` (після кожного — перенос рядка). Що виведе цей код?",
      code:`with open("numbers.txt", encoding="utf-8") as f:
    lines = f.readlines()
print(lines)`,
      options:[
        { text:"['5\\n', '7\\n']", credit:1 },
        { text:"['5', '7']", credit:0 },
        { text:"[5, 7]", credit:0 },
        { text:"5\n7", credit:0 }
      ],
      explain:"`readlines()` повертає СПИСОК РЯДКІВ, і кожен рядок зберігає свій `\\n` у кінці. Числами вони теж не стають — з файлу завжди приходить текст.\n\nЩоб позбутися `\\n`, кожен рядок чистять `line.rstrip()`, а число отримують через `int()`." },
    { q:"У файлі `numbers.txt` два рядки: `10` і `20`. Що станеться, коли виконати цей код?",
      code:`total = 0
with open("numbers.txt", encoding="utf-8") as f:
    for line in f:
        total += line
print(total)`,
      options:[
        { text:"Помилка TypeError: до числа не можна додати рядок", credit:1 },
        { text:"30", credit:0 },
        { text:"1020", credit:0 },
        { text:"10\n20", credit:0 }
      ],
      explain:"Кожен `line` з файлу — це РЯДОК (`\"10\\n\"`), а `total` — число. `0 + \"10\\n\"` дає `TypeError`.\n\nПравильно: `total += int(line)` — `int()` сам пропускає пробіли й `\\n` по краях рядка." },
    { q:"Потрібно прочитати всі рядки файлу `names.txt` у список `names` — БЕЗ символу `\\n` у кінці кожного.\n\nЯкий варіант правильний?",
      options:[
        { text:'names = []\nwith open("names.txt", encoding="utf-8") as f:\n    for line in f:\n        names.append(line.rstrip())', credit:1 },
        { text:'names = []\nwith open("names.txt", encoding="utf-8") as f:\n    for line in f\n        names.append(line.rstrip())', credit:0.5 },
        { text:'with open("names.txt", encoding="utf-8") as f:\n    names = f.readlines()', credit:0 },
        { text:'with open("names.txt", "w", encoding="utf-8") as f:\n    names = f.read()', credit:0 }
      ],
      explain:"`for line in f` дає рядки по одному, а `rstrip()` прибирає `\\n` і пробіли справа.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `for` — `SyntaxError`.\n- `readlines()` лишає `\\n` у кожному рядку.\n- Режим `\"w\"` стирає файл, а читати з нього не можна." }
  ]},

  /* ---------- 4. CSV — MCQ ---------- */
  { id:"csv_mcq", type:"mcq", topic:"CSV", points:1, variants:[
    { q:"У файлі `cars.csv` три рядки:\n`brand,price`\n`BMW,90000`\n`Toyota,40000`\n\nЩо виведе цей код?",
      code:`import csv

with open("cars.csv", encoding="utf-8", newline="") as f:
    rows = list(csv.DictReader(f))
print(rows[0]["price"] + rows[1]["price"])`,
      options:[
        { text:"9000040000", credit:1 },
        { text:"130000", credit:0 },
        { text:"TypeError: can only concatenate str (not \"int\") to str", credit:0 },
        { text:"BMWToyota", credit:0 }
      ],
      explain:"`DictReader` дає словники, у яких УСІ значення — рядки: `\"90000\"` і `\"40000\"`. `+` для рядків їх склеює.\n\nЩоб додати як числа, кожне значення треба перетворити: `int(row[\"price\"])`." },
    { q:"Файл `cars.csv` відкрито як `f`, у ньому колонки `brand` і `price`. Потрібно порахувати суму цін усіх авто.\n\nЯкий варіант правильний?",
      options:[
        { text:'total = 0\nfor row in csv.DictReader(f):\n    total += int(row["price"])', credit:1 },
        { text:'total = 0\nfor row in csv.DictReader(f):\n    total += int(row["price"]', credit:0.5 },
        { text:'total = 0\nfor row in csv.DictReader(f):\n    total += row["price"]', credit:0 },
        { text:'total = 0\nfor row in csv.DictReader(f):\n    total += int(row[1])', credit:0 }
      ],
      explain:"Кожен `row` — словник `{\"brand\": ..., \"price\": ...}` з рядками всередині, тому ціну дістаємо за назвою колонки й перетворюємо через `int()`.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- Без `int()` до числа додається рядок — `TypeError`.\n- `row` — словник, а не список: ключа `1` у ньому немає — `KeyError`." },
    { q:"Потрібно записати список словників `students` (ключі `name` і `score`) у НОВИЙ CSV-файл — з рядком заголовків. Файл уже відкрито для запису як `f`.\n\nЯкий варіант правильний?",
      options:[
        { text:'writer = csv.DictWriter(f, fieldnames=["name", "score"])\nwriter.writeheader()\nwriter.writerows(students)', credit:1 },
        { text:'writer = csv.DictWriter(f, fieldnames=["name", "score")\nwriter.writeheader()\nwriter.writerows(students)', credit:0.5 },
        { text:'writer = csv.DictWriter(f, fieldnames=["name", "score"])\nwriter.writerows(students)', credit:0 },
        { text:'writer = csv.DictWriter(f, fieldnames=["name", "score"])\nwriter.writeheader()\nwriter.writerow(students)', credit:0 }
      ],
      explain:"`writeheader()` пише рядок з назвами колонок, а `writerows()` — увесь список словників, по рядку на кожен.\n\nЩо не так з іншими варіантами:\n- Список відкрито `[`, а закрито `)` — `SyntaxError`.\n- Без `writeheader()` у файлі не буде рядка заголовків.\n- `writerow()` пише ОДИН словник, а тут передано цілий список — помилка." }
  ]},

  /* ---------- 5. винятки — MCQ ---------- */
  { id:"exc_mcq", type:"mcq", topic:"Винятки", points:1, variants:[
    { q:"Що виведе цей код?",
      code:`try:
    x = int("12")
except ValueError:
    print("помилка")
else:
    print("ок")
finally:
    print("кінець")`,
      options:[
        { text:"ок\nкінець", credit:1 },
        { text:"кінець", credit:0 },
        { text:"помилка\nкінець", credit:0 },
        { text:"ок", credit:0 }
      ],
      explain:"`int(\"12\")` спрацьовує без помилки, тому `except` пропускається, виконується `else` — він працює лише тоді, коли помилки НЕ було.\n\n`finally` виконується ЗАВЖДИ — і з помилкою, і без неї." },
    { q:"Що виведе цей код?",
      code:`data = {"a": 1}
try:
    print(data["b"])
except IndexError:
    print("індекс")
except KeyError:
    print("ключ")`,
      options:[
        { text:"ключ", credit:1 },
        { text:"індекс", credit:0 },
        { text:"None", credit:0 },
        { text:"індекс\nключ", credit:0 }
      ],
      explain:"Звернення до словника за ключем, якого немає, кидає `KeyError` (а `IndexError` — це для індексу списку поза межами).\n\nPython перевіряє `except` по черзі й виконує ПЕРШИЙ, що підходить, — лише один." },
    { q:"У змінній `text` — рядок, який ввів користувач. Потрібно перетворити його на число, а якщо це не число — вивести `Це не число`, і щоб програма не впала.\n\nЯкий варіант правильний?",
      options:[
        { text:'try:\n    n = int(text)\nexcept ValueError:\n    print("Це не число")', credit:1 },
        { text:'try:\n    n = int(text)\nexcept ValueError\n    print("Це не число")', credit:0.5 },
        { text:'try:\n    n = int(text)\nexcept TypeError:\n    print("Це не число")', credit:0 },
        { text:'if int(text):\n    n = int(text)\nelse:\n    print("Це не число")', credit:0 }
      ],
      explain:"`int(\"abc\")` кидає саме `ValueError` — його і ловимо.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `except ValueError` — `SyntaxError`.\n- `TypeError` тут не виникає, тож `ValueError` пролетить далі й програма впаде.\n- `if int(text)` впаде на тому самому `int()` ще до перевірки." },
    { q:"Функція `set_age(age)` має ПОВІДОМИТИ про помилку, якщо вік від'ємний, щоб код, який її викликав, міг цю помилку спіймати.\n\nЯкий варіант правильний?",
      options:[
        { text:'if age < 0:\n    raise ValueError("Вік не може бути від\'ємним")', credit:1 },
        { text:'if age < 0:\n    raise ValueError("Вік не може бути від\'ємним"', credit:0.5 },
        { text:'if age < 0:\n    return ValueError("Вік не може бути від\'ємним")', credit:0 },
        { text:'if age < 0:\n    print(ValueError("Вік не може бути від\'ємним"))', credit:0 }
      ],
      explain:"`raise` КИДАЄ виняток: функція одразу зупиняється, і помилку можна спіймати через `try / except ValueError`.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- `return` просто повертає об'єкт помилки як звичайне значення — нічого не зупиняється.\n- `print` лише друкує текст помилки, а програма йде далі, ніби все гаразд." }
  ]},

  /* ---------- 6. функції, списки й словники — код (1.5) ---------- */
  { id:"coll_code", type:"code", topic:"Функції, списки й словники", points:1.5, variants:[
    { title:"Скільки авто кожної марки", fn:"count_by_brand", sig:"count_by_brand(cars)",
      intro:"`cars` — список словників, у кожного є ключі `\"brand\"` і `\"model\"`.\n\nПоверни СЛОВНИК: ключ — марка, значення — скільки авто цієї марки є в списку. Наприклад:",
      example:`cars = [
    {"brand": "BMW", "model": "M3"},
    {"brand": "Toyota", "model": "Camry"},
    {"brand": "BMW", "model": "X5"}
]
count_by_brand(cars)  # -> {"BMW": 2, "Toyota": 1}`,
      hint:"Заведи порожній словник `counts = {}` і для кожного авто збільшуй `counts[brand]` на 1. Для марки, якої ще немає, допоможе `counts.get(brand, 0)`.",
      starter:
`def count_by_brand(cars):
    """
    cars - список словників з ключами "brand" і "model".

    Повернути СЛОВНИК: ключ - марка, значення - скільки авто
    цієї марки в списку.

    Приклад:
    count_by_brand([{"brand": "BMW", "model": "M3"},
                    {"brand": "Toyota", "model": "Camry"},
                    {"brand": "BMW", "model": "X5"}])
        -> {"BMW": 2, "Toyota": 1}
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("count_by_brand ще не реалізовано")
`,
      tests:[
        { args:[[{brand:"BMW",model:"M3"},{brand:"Toyota",model:"Camry"},{brand:"BMW",model:"X5"}]], expected:{BMW:2,Toyota:1} },
        { args:[[{brand:"Tesla",model:"Model 3"}]], expected:{Tesla:1} },
        { args:[[{brand:"Audi",model:"A4"},{brand:"Audi",model:"A6"},{brand:"Audi",model:"Q7"}]], expected:{Audi:3} },
        { args:[[{brand:"Kia",model:"Rio"},{brand:"Ford",model:"Focus"},{brand:"Kia",model:"Ceed"},{brand:"Opel",model:"Astra"},{brand:"Ford",model:"Kuga"}]], expected:{Kia:2,Ford:2,Opel:1} },
        { args:[[{brand:"Honda",model:"Civic"},{brand:"Mazda",model:"3"}]], expected:{Honda:1,Mazda:1} },
        { args:[[]], expected:{} }
      ],
      solution:
`def count_by_brand(cars):
    counts = {}
    for car in cars:
        brand = car["brand"]
        counts[brand] = counts.get(brand, 0) + 1
    return counts
` },
    { title:"Найкращі учні", fn:"top_students", sig:"top_students(scores, limit)",
      intro:"`scores` — словник: ключ — ім'я учня, значення — бал (ціле число). `limit` — ціле число.\n\nПоверни СПИСОК імен учнів, у яких бал НЕ МЕНШИЙ за `limit`, відсортований за балом від найбільшого до найменшого. Однакових балів у даних немає.\n\nНаприклад:",
      example:`scores = {"Оля": 10, "Марко": 7, "Ніна": 12}
top_students(scores, 9)   # -> ["Ніна", "Оля"]
top_students(scores, 11)  # -> ["Ніна"]`,
      hint:"Спершу збери в список імена з балом `>= limit` (цикл по `scores.items()`), а потім відсортуй: `sorted(names, key=lambda name: scores[name], reverse=True)`.",
      starter:
`def top_students(scores, limit):
    """
    scores - словник {ім'я: бал}, limit - ціле число.

    Повернути СПИСОК імен з балом >= limit, відсортований
    за балом від найбільшого до найменшого.

    Приклад: top_students({"Оля": 10, "Марко": 7, "Ніна": 12}, 9)
             -> ["Ніна", "Оля"]
    Приклад: top_students({"Оля": 10}, 11) -> []
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("top_students ще не реалізовано")
`,
      tests:[
        { args:[{"Оля":10,"Марко":7,"Ніна":12}, 9], expected:["Ніна","Оля"] },
        { args:[{"Андрій":5,"Богдан":8,"Віра":6}, 5], expected:["Богдан","Віра","Андрій"] },
        { args:[{"Тарас":11}, 11], expected:["Тарас"] },
        { args:[{"Дана":3,"Максим":9,"Софія":7,"Роман":1}, 4], expected:["Максим","Софія"] },
        { args:[{"Ліна":12,"Петро":4,"Зоя":8}, 1], expected:["Ліна","Зоя","Петро"] },
        { args:[{"Оля":10,"Марко":7}, 11], expected:[] }
      ],
      solution:
`def top_students(scores, limit):
    names = []
    for name, score in scores.items():
        if score >= limit:
            names.append(name)
    return sorted(names, key=lambda name: scores[name], reverse=True)
` },
    { title:"Витрати за категоріями", fn:"total_by_category", sig:"total_by_category(purchases)",
      intro:"`purchases` — список покупок; кожна — словник з ключами `\"category\"` (рядок) і `\"price\"` (ціле число).\n\nПоверни СЛОВНИК: ключ — категорія, значення — скільки всього витрачено на цю категорію. Наприклад:",
      example:`purchases = [
    {"category": "їжа", "price": 120},
    {"category": "кіно", "price": 200},
    {"category": "їжа", "price": 80}
]
total_by_category(purchases)  # -> {"їжа": 200, "кіно": 200}`,
      hint:"Заведи `totals = {}` і для кожної покупки додавай її ціну: `totals[category] = totals.get(category, 0) + price`.",
      starter:
`def total_by_category(purchases):
    """
    purchases - список словників з ключами "category" і "price".

    Повернути СЛОВНИК: ключ - категорія, значення - сума цін
    усіх покупок цієї категорії.

    Приклад:
    total_by_category([{"category": "їжа", "price": 120},
                       {"category": "кіно", "price": 200},
                       {"category": "їжа", "price": 80}])
        -> {"їжа": 200, "кіно": 200}
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("total_by_category ще не реалізовано")
`,
      tests:[
        { args:[[{category:"їжа",price:120},{category:"кіно",price:200},{category:"їжа",price:80}]], expected:{"їжа":200,"кіно":200} },
        { args:[[{category:"книги",price:350}]], expected:{"книги":350} },
        { args:[[{category:"транспорт",price:15},{category:"транспорт",price:15},{category:"транспорт",price:30}]], expected:{"транспорт":60} },
        { args:[[{category:"ігри",price:500},{category:"їжа",price:90},{category:"ігри",price:250},{category:"одяг",price:1200}]], expected:{"ігри":750,"їжа":90,"одяг":1200} },
        { args:[[{category:"подарунки",price:0},{category:"кава",price:65}]], expected:{"подарунки":0,"кава":65} },
        { args:[[]], expected:{} }
      ],
      solution:
`def total_by_category(purchases):
    totals = {}
    for p in purchases:
        category = p["category"]
        totals[category] = totals.get(category, 0) + p["price"]
    return totals
` }
  ]},

  /* ---------- 7. текстові файли — код (1.5) ---------- */
  { id:"file_code", type:"code", topic:"Текстові файли", points:1.5, variants:[
    { title:"Сума чисел з файлу", fn:"sum_numbers_in_file", sig:"sum_numbers_in_file(path)",
      intro:"`path` — ім'я текстового файлу. У кожному рядку файлу записано одне ціле число, але трапляються й ПОРОЖНІ рядки — їх треба пропустити.\n\nПоверни суму всіх чисел із файлу.",
      hint:"Відкрий файл через `with open(path, encoding=\"utf-8\") as f:` і пройдись `for line in f:`. Очисти рядок `line.strip()`; якщо після цього він порожній — `continue`, інакше додай `int(...)` до суми.",
      files:{ "numbers.txt":"10\n20\n\n30\n" },
      starter:
`def sum_numbers_in_file(path):
    """
    path - ім'я текстового файлу, у кожному рядку якого одне
    ціле число. Порожні рядки пропустити.

    Повернути СУМУ всіх чисел з файлу.

    Приклад: якщо у файлі numbers.txt рядки 10, 20, (порожній), 30
             sum_numbers_in_file("numbers.txt") -> 60
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("sum_numbers_in_file ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(sum_numbers_in_file("numbers.txt"))
`,
      tests:[
        { args:["numbers.txt"], files:{ "numbers.txt":"10\n20\n30\n" }, expected:60 },
        { args:["data.txt"], files:{ "data.txt":"5\n" }, expected:5 },
        { args:["numbers.txt"], files:{ "numbers.txt":"1\n\n2\n\n3\n" }, expected:6 },
        { args:["n.txt"], files:{ "n.txt":"-4\n10\n" }, expected:6 },
        { args:["numbers.txt"], files:{ "numbers.txt":"100\n200\n300\n400" }, expected:1000 },
        { args:["scores.txt"], files:{ "scores.txt":"\n7\n\n\n3\n\n" }, expected:10 },
        { args:["numbers.txt"], files:{ "numbers.txt":"" }, expected:0 }
      ],
      solution:
`def sum_numbers_in_file(path):
    total = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line == "":
                continue
            total += int(line)
    return total
` },
    { title:"Дописати нотатку", fn:"append_note", sig:"append_note(path, text)",
      intro:"`path` — ім'я текстового файлу з нотатками (по одній у рядку), `text` — нова нотатка.\n\nДОПИШИ `text` окремим рядком у кінець файлу — старі нотатки мають лишитися. Якщо файлу ще немає, він має створитися.\n\nПоверни, скільки рядків-нотаток тепер у файлі.",
      hint:"Режим `\"a\"` дописує в кінець і створює файл, якщо його немає: `f.write(text + \"\\n\")`. Потім відкрий файл ще раз для читання й порахуй рядки, напр. `len(f.readlines())`.",
      files:{ "notes.txt":"Купити хліб\nПодзвонити бабусі\n" },
      starter:
`def append_note(path, text):
    """
    path - ім'я файлу з нотатками (по одній у рядку),
    text - нова нотатка.

    ДОПИСАТИ text окремим рядком у КІНЕЦЬ файлу (старі нотатки
    лишаються; якщо файлу немає - він створюється).
    Повернути, скільки рядків тепер у файлі.

    Приклад: у notes.txt рядки "Купити хліб", "Подзвонити бабусі"
             append_note("notes.txt", "Зробити ДЗ") -> 3
             і у файлі тепер три рядки
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("append_note ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(append_note("notes.txt", "Зробити ДЗ"))
`,
      tests:[
        { args:["notes.txt","Зробити ДЗ"], files:{ "notes.txt":"Купити хліб\nПодзвонити бабусі\n" }, expected:3,
          expectFiles:{ "notes.txt":"Купити хліб\nПодзвонити бабусі\nЗробити ДЗ\n" } },
        { args:["log.txt","c"], files:{ "log.txt":"a\nb\n" }, expected:3, expectFiles:{ "log.txt":"a\nb\nc\n" } },
        { args:["todo.txt","перша справа"], files:{}, expected:1, expectFiles:{ "todo.txt":"перша справа\n" } },
        { args:["notes.txt","друга"], files:{ "notes.txt":"перша\n" }, expected:2, expectFiles:{ "notes.txt":"перша\nдруга\n" } },
        { args:["notes.txt","нова"], files:{ "notes.txt":"x\n", "other.txt":"y\n" }, expected:2,
          expectFiles:{ "notes.txt":"x\nнова\n", "other.txt":"y\n" } },
        { args:["list.txt","5"], files:{ "list.txt":"1\n2\n3\n4\n" }, expected:5, expectFiles:{ "list.txt":"1\n2\n3\n4\n5\n" } },
        { args:["diary.txt","Сьогодні вчив файли"], files:{ "diary.txt":"Понеділок\nВівторок\nСереда\n" }, expected:4,
          expectFiles:{ "diary.txt":"Понеділок\nВівторок\nСереда\nСьогодні вчив файли\n" } }
      ],
      solution:
`def append_note(path, text):
    with open(path, "a", encoding="utf-8") as f:
        f.write(text + "\\n")
    with open(path, encoding="utf-8") as f:
        return len(f.readlines())
` },
    { title:"Найдовший рядок", fn:"longest_line", sig:"longest_line(path)",
      intro:"`path` — ім'я текстового файлу. Поверни найдовший рядок файлу — БЕЗ символу `\\n` у кінці.\n\nЯкщо однаково довгих рядків декілька — поверни перший з них. Якщо файл порожній — поверни порожній рядок `\"\"`.",
      hint:"Порівнюй рядки вже після `line.rstrip(\"\\n\")`: в останньому рядку файлу `\\n` може не бути, і без очищення довжини будуть нечесні. Почни з `best = \"\"` і оновлюй, лише коли знайдеш ДОВШИЙ рядок.",
      files:{ "poem.txt":"Садок вишневий коло хати,\nХрущі над вишнями гудуть,\nПлугатарі з плугами йдуть\n" },
      starter:
`def longest_line(path):
    """
    path - ім'я текстового файлу.

    Повернути НАЙДОВШИЙ рядок файлу без "\\n" у кінці.
    Якщо однаково довгих декілька - перший з них.
    Порожній файл -> "".

    Приклад: у файлі рядки "кіт", "слон", "у"
             longest_line("words.txt") -> "слон"
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("longest_line ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(longest_line("poem.txt"))
`,
      tests:[
        { args:["words.txt"], files:{ "words.txt":"кіт\nслон\nу\n" }, expected:"слон" },
        { args:["poem.txt"], files:{ "poem.txt":"Садок вишневий коло хати,\nХрущі над вишнями гудуть,\nПлугатарі з плугами йдуть\n" }, expected:"Садок вишневий коло хати," },
        { args:["a.txt"], files:{ "a.txt":"ab\ncd\nef" }, expected:"ab" },
        { args:["a.txt"], files:{ "a.txt":"один\nдва\nсімнадцять" }, expected:"сімнадцять" },
        { args:["one.txt"], files:{ "one.txt":"єдиний рядок\n" }, expected:"єдиний рядок" },
        { args:["b.txt"], files:{ "b.txt":"abc\nabcd\n\nab\n" }, expected:"abcd" },
        { args:["empty.txt"], files:{ "empty.txt":"" }, expected:"" }
      ],
      solution:
`def longest_line(path):
    best = ""
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\\n")
            if len(line) > len(best):
                best = line
    return best
` }
  ]},

  /* ---------- 8. CSV — код (2) ---------- */
  { id:"csv_code", type:"code", topic:"CSV", points:2, variants:[
    { title:"Дорогі авто з таблиці", fn:"expensive_cars", sig:"expensive_cars(path, limit)",
      intro:"`path` — ім'я CSV-файлу з колонками `brand,model,year,price`, `limit` — ціле число.\n\nПоверни СПИСОК рядків `\"марка модель\"` (через пробіл) для авто, у яких ціна БІЛЬША за `limit`, — у тому порядку, як вони йдуть у файлі.",
      hint:"`csv.DictReader(f)` дає по словнику на рядок таблиці, але ціна там — рядок. Порівнюй `int(row[\"price\"]) > limit`, а в список додавай `row[\"brand\"] + \" \" + row[\"model\"]`. Не забудь `import csv`.",
      files:{ "cars.csv":"brand,model,year,price\nToyota,Camry,2026,40000\nBMW,M3,2027,90000\nTesla,Model 3,2026,50000\n" },
      starter:
`import csv


def expensive_cars(path, limit):
    """
    path - ім'я CSV-файлу з колонками brand,model,year,price;
    limit - ціле число.

    Повернути СПИСОК рядків "марка модель" для авто з ціною
    БІЛЬШОЮ за limit - у порядку, як у файлі.

    Приклад (cars.csv з умови):
    expensive_cars("cars.csv", 45000) -> ["BMW M3", "Tesla Model 3"]
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("expensive_cars ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(expensive_cars("cars.csv", 45000))
`,
      tests:[
        { args:["cars.csv",45000], files:{ "cars.csv":"brand,model,year,price\nToyota,Camry,2026,40000\nBMW,M3,2027,90000\nTesla,Model 3,2026,50000\n" }, expected:["BMW M3","Tesla Model 3"] },
        { args:["cars.csv",10000], files:{ "cars.csv":"brand,model,year,price\nToyota,Camry,2026,40000\nBMW,M3,2027,90000\n" }, expected:["Toyota Camry","BMW M3"] },
        { args:["auto.csv",50000], files:{ "auto.csv":"brand,model,year,price\nTesla,Model 3,2026,50000\nAudi,Q7,2025,75000\n" }, expected:["Audi Q7"] },
        { args:["cars.csv",8000], files:{ "cars.csv":"brand,model,year,price\nKia,Rio,2019,9000\nFord,Focus,2018,7500\nOpel,Astra,2020,12000\n" }, expected:["Kia Rio","Opel Astra"] },
        { args:["cars.csv",100000], files:{ "cars.csv":"brand,model,year,price\nPorsche,911,2026,150000\nBMW,M3,2027,90000\nMercedes,G,2025,180000\n" }, expected:["Porsche 911","Mercedes G"] },
        { args:["cars.csv",30000], files:{ "cars.csv":"brand,model,year,price\nHonda,Civic,2024,31000\n" }, expected:["Honda Civic"] },
        { args:["cars.csv",95000], files:{ "cars.csv":"brand,model,year,price\nToyota,Camry,2026,40000\nBMW,M3,2027,90000\n" }, expected:[] }
      ],
      solution:
`import csv


def expensive_cars(path, limit):
    result = []
    with open(path, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if int(row["price"]) > limit:
                result.append(row["brand"] + " " + row["model"])
    return result
` },
    { title:"Відомість заліку", fn:"write_report", sig:"write_report(path, students)",
      intro:"`students` — список словників з ключами `\"name\"` (рядок) і `\"score\"` (ціле число), `path` — ім'я НОВОГО CSV-файлу.\n\nЗапиши у файл таблицю з колонками `name,score,result`: перший рядок — заголовок, далі по рядку на учня в тому самому порядку. У колонці `result` — `зараховано`, якщо `score >= 60`, інакше — `не зараховано`.\n\nПоверни, скільки учнів отримали `зараховано`.\n\nНаприклад, для такого списку функція поверне `1`, а файл `report.csv` має бути таким:\n`name,score,result`\n`Оля,75,зараховано`\n`Іван,40,не зараховано`",
      example:`students = [
    {"name": "Оля", "score": 75},
    {"name": "Іван", "score": 40}
]
write_report("report.csv", students)  # -> 1`,
      hint:"`with open(path, \"w\", encoding=\"utf-8\", newline=\"\") as f:` → `csv.DictWriter(f, fieldnames=[\"name\", \"score\", \"result\"])` → `writeheader()`, а для кожного учня — `writerow({...})` зі словником із трьох ключів.",
      starter:
`import csv


def write_report(path, students):
    """
    students - список словників {"name": ..., "score": ...};
    path - ім'я нового CSV-файлу.

    Записати у файл колонки name,score,result (заголовок + рядок
    на кожного учня). result = "зараховано", якщо score >= 60,
    інакше "не зараховано".
    Повернути, скільки учнів "зараховано".

    Приклад:
    write_report("report.csv", [{"name": "Оля", "score": 75},
                                {"name": "Іван", "score": 40}]) -> 1
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("write_report ще не реалізовано")
`,
      tests:[
        { args:["report.csv",[{name:"Оля",score:75},{name:"Іван",score:40}]], expected:1,
          expectFiles:{ "report.csv":"name,score,result\nОля,75,зараховано\nІван,40,не зараховано\n" } },
        { args:["out.csv",[{name:"Марко",score:60}]], expected:1,
          expectFiles:{ "out.csv":"name,score,result\nМарко,60,зараховано\n" } },
        { args:["report.csv",[{name:"Ніна",score:59},{name:"Тарас",score:12}]], expected:0,
          expectFiles:{ "report.csv":"name,score,result\nНіна,59,не зараховано\nТарас,12,не зараховано\n" } },
        { args:["r.csv",[{name:"Аня",score:100},{name:"Богдан",score:61},{name:"Віра",score:90}]], expected:3,
          expectFiles:{ "r.csv":"name,score,result\nАня,100,зараховано\nБогдан,61,зараховано\nВіра,90,зараховано\n" } },
        { args:["report.csv",[{name:"Зоя",score:0},{name:"Лев",score:80},{name:"Ліна",score:59},{name:"Петро",score:60}]], expected:2,
          expectFiles:{ "report.csv":"name,score,result\nЗоя,0,не зараховано\nЛев,80,зараховано\nЛіна,59,не зараховано\nПетро,60,зараховано\n" } },
        { args:["report.csv",[]], expected:0, expectFiles:{ "report.csv":"name,score,result\n" } }
      ],
      solution:
`import csv


def write_report(path, students):
    passed = 0
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "score", "result"])
        writer.writeheader()
        for s in students:
            if s["score"] >= 60:
                result = "зараховано"
                passed += 1
            else:
                result = "не зараховано"
            writer.writerow({"name": s["name"], "score": s["score"], "result": result})
    return passed
` },
    { title:"Сума замовлень клієнтів", fn:"total_by_customer", sig:"total_by_customer(path)",
      intro:"`path` — ім'я CSV-файлу з колонками `customer,amount`: хто зробив замовлення і на яку суму (ціле число). Один клієнт може мати кілька замовлень.\n\nПоверни СЛОВНИК: ключ — клієнт, значення — загальна сума всіх його замовлень.",
      hint:"`csv.DictReader(f)` → для кожного рядка `amount = int(row[\"amount\"])`, далі як підрахунок у словнику: `totals[name] = totals.get(name, 0) + amount`. Не забудь `import csv`.",
      files:{ "orders.csv":"customer,amount\nОля,250\nІван,100\nОля,50\nМарко,300\n" },
      starter:
`import csv


def total_by_customer(path):
    """
    path - ім'я CSV-файлу з колонками customer,amount.

    Повернути СЛОВНИК: ключ - клієнт, значення - сума всіх
    його замовлень (ціле число).

    Приклад (orders.csv з умови):
    total_by_customer("orders.csv")
        -> {"Оля": 300, "Іван": 100, "Марко": 300}
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("total_by_customer ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(total_by_customer("orders.csv"))
`,
      tests:[
        { args:["orders.csv"], files:{ "orders.csv":"customer,amount\nОля,250\nІван,100\nОля,50\nМарко,300\n" }, expected:{"Оля":300,"Іван":100,"Марко":300} },
        { args:["orders.csv"], files:{ "orders.csv":"customer,amount\nНіна,999\n" }, expected:{"Ніна":999} },
        { args:["o.csv"], files:{ "o.csv":"customer,amount\nТарас,10\nТарас,20\nТарас,30\n" }, expected:{"Тарас":60} },
        { args:["orders.csv"], files:{ "orders.csv":"customer,amount\nАня,5\nБогдан,7\nАня,5\nВіра,1\nБогдан,3\n" }, expected:{"Аня":10,"Богдан":10,"Віра":1} },
        { args:["shop.csv"], files:{ "shop.csv":"customer,amount\nЛев,1200\nЗоя,0\n" }, expected:{"Лев":1200,"Зоя":0} },
        { args:["orders.csv"], files:{ "orders.csv":"customer,amount\nПетро,400\nПетро,600\nЛіна,250\n" }, expected:{"Петро":1000,"Ліна":250} },
        { args:["orders.csv"], files:{ "orders.csv":"customer,amount\n" }, expected:{} }
      ],
      solution:
`import csv


def total_by_customer(path):
    totals = {}
    with open(path, encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            name = row["customer"]
            totals[name] = totals.get(name, 0) + int(row["amount"])
    return totals
` }
  ]},

  /* ---------- 9. винятки + файли — код (2) ---------- */
  { id:"exc_code", type:"code", topic:"Винятки", points:2, variants:[
    { title:"Бали з брудного файлу", fn:"parse_scores", sig:"parse_scores(path)",
      intro:"`path` — ім'я текстового файлу, у якому має бути по одному цілому числу в рядку. Але файл «брудний»: трапляються слова, дробові числа й порожні рядки.\n\nПоверни СПИСОК цілих чисел з файлу в тому самому порядку — рядки, які не вдається перетворити на ціле число, пропусти.\n\nЯкщо файлу немає — поверни порожній список `[]`, програма не має падати.",
      hint:"Усередині циклу обгорни `int(line)` у `try / except ValueError:` — у `except` просто `continue`. А весь `with open(...)` — у `try / except FileNotFoundError:` з `return []`.",
      files:{ "scores.txt":"10\nабв\n7\n\n4.5\n12\n" },
      starter:
`def parse_scores(path):
    """
    path - ім'я файлу, у кожному рядку якого має бути ціле число.

    Повернути СПИСОК цілих чисел з файлу (у тому самому порядку).
    Рядки, які не перетворюються на int, пропустити.
    Якщо файлу немає - повернути [].

    Приклад: у scores.txt рядки 10, абв, 7, (порожній), 4.5, 12
             parse_scores("scores.txt") -> [10, 7, 12]
             parse_scores("nope.txt") -> []
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("parse_scores ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(parse_scores("scores.txt"))
`,
      tests:[
        { args:["scores.txt"], files:{ "scores.txt":"10\nабв\n7\n" }, expected:[10,7] },
        { args:["scores.txt"], files:{ "scores.txt":"5\n\n6\n" }, expected:[5,6] },
        { args:["s.txt"], files:{ "s.txt":"x\n12\n" }, expected:[12] },
        { args:["scores.txt"], files:{ "scores.txt":"1\n2\n3\n" }, expected:[1,2,3] },
        { args:["scores.txt"], files:{ "scores.txt":"-3\n4.5\n8\n" }, expected:[-3,8] },
        { args:["data.txt"], files:{ "data.txt":" 9 \nдев'ять\n11" }, expected:[9,11] },
        { args:["nope.txt"], files:{}, expected:[] }
      ],
      solution:
`def parse_scores(path):
    scores = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                try:
                    scores.append(int(line))
                except ValueError:
                    continue
    except FileNotFoundError:
        return []
    return scores
` },
    { title:"Прайс із помилками", fn:"load_prices", sig:"load_prices(path)",
      intro:"`path` — ім'я CSV-файлу з колонками `name,price`. Ціна має бути цілим числом, але в деяких рядках там сміття (`\"дорого\"`, `\"\"`, `\"12.5\"`).\n\nПоверни СЛОВНИК: ключ — назва товару, значення — ціна як ціле число. Рядки з ціною, яка не перетворюється на `int`, пропусти.\n\nЯкщо файлу немає — поверни порожній словник `{}`, програма не має падати.",
      hint:"Для кожного рядка з `csv.DictReader(f)` спробуй `int(row[\"price\"])` у `try / except ValueError: continue`. Відкриття файлу обгорни в `try / except FileNotFoundError:` з `return {}`. Не забудь `import csv`.",
      files:{ "prices.csv":"name,price\nхліб,30\nсир,дорого\nмолоко,42\nкава,12.5\n" },
      starter:
`import csv


def load_prices(path):
    """
    path - ім'я CSV-файлу з колонками name,price.

    Повернути СЛОВНИК {назва: ціна (int)}. Рядки, де ціна
    не перетворюється на int, пропустити.
    Якщо файлу немає - повернути {}.

    Приклад (prices.csv з умови):
    load_prices("prices.csv") -> {"хліб": 30, "молоко": 42}
    load_prices("nope.csv") -> {}
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("load_prices ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(load_prices("prices.csv"))
`,
      tests:[
        { args:["prices.csv"], files:{ "prices.csv":"name,price\nхліб,30\nсир,дорого\nмолоко,42\n" }, expected:{"хліб":30,"молоко":42} },
        { args:["prices.csv"], files:{ "prices.csv":"name,price\nкава,12.5\nчай,25\n" }, expected:{"чай":25} },
        { args:["p.csv"], files:{ "p.csv":"name,price\nяблука,40\nгруші,55\nбанани,38\n" }, expected:{"яблука":40,"груші":55,"банани":38} },
        { args:["prices.csv"], files:{ "prices.csv":"name,price\nсік,\nвода,15\n" }, expected:{"вода":15} },
        { args:["shop.csv"], files:{ "shop.csv":"name,price\nноутбук,30000\nмишка,безкоштовно\nкилимок,0\n" }, expected:{"ноутбук":30000,"килимок":0} },
        { args:["prices.csv"], files:{ "prices.csv":"name,price\na,1\nb,x\nc,3\nd,y\n" }, expected:{"a":1,"c":3} },
        { args:["nope.csv"], files:{}, expected:{} }
      ],
      solution:
`import csv


def load_prices(path):
    prices = {}
    try:
        with open(path, encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                try:
                    prices[row["name"]] = int(row["price"])
                except ValueError:
                    continue
    except FileNotFoundError:
        return {}
    return prices
` },
    { title:"Журнал оцінок", fn:"parse_grades", sig:"parse_grades(path)",
      intro:"`path` — ім'я текстового файлу, у кожному рядку якого `ім'я,оцінка`, наприклад `Оля,10`.\n\nПоверни СЛОВНИК: ключ — ім'я, значення — оцінка як ціле число. Правила:\n- рядки, які не вдається розібрати (немає коми, оцінка не число, порожній рядок), — пропусти;\n- якщо оцінка — число, але поза межами від 1 до 12, — КИНЬ `ValueError`: це вже не сміття, а помилка в журналі, і про неї треба повідомити.",
      hint:"Розбір рядка (`name, grade_text = line.strip().split(\",\")` і `int(grade_text)`) поклади в `try / except ValueError: continue`. А перевірку меж і `raise ValueError(...)` — ПІСЛЯ цього `try`, інакше твій же `except` проковтне твою помилку.",
      files:{ "grades.txt":"Оля,10\nІван,сім\nМарко,12\n\nНіна 9\n" },
      starter:
`def parse_grades(path):
    """
    path - ім'я файлу з рядками "ім'я,оцінка".

    Повернути СЛОВНИК {ім'я: оцінка (int)}.
    - Рядки, які не розбираються (немає коми, не число,
      порожній рядок), пропустити.
    - Якщо оцінка - число поза межами 1..12, кинути ValueError.

    Приклад: у grades.txt рядки "Оля,10", "Іван,сім", "Марко,12"
             parse_grades("grades.txt") -> {"Оля": 10, "Марко": 12}
    Приклад: рядок "Петро,15" -> ValueError
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("parse_grades ще не реалізовано")


# Перевір себе: натисни «Запустити» — рядок нижче надрукує результат
# print(parse_grades("grades.txt"))
`,
      tests:[
        { args:["grades.txt"], files:{ "grades.txt":"Оля,10\nІван,сім\nМарко,12\n" }, expected:{"Оля":10,"Марко":12} },
        { args:["grades.txt"], files:{ "grades.txt":"Ніна,9\n\nТарас,4\n" }, expected:{"Ніна":9,"Тарас":4} },
        { args:["g.txt"], files:{ "g.txt":"Аня,1\nБогдан 7\nВіра,12\n" }, expected:{"Аня":1,"Віра":12} },
        { args:["grades.txt"], files:{ "grades.txt":"Лев,11\nЗоя,6.5\nЛіна,8\nПетро,\n" }, expected:{"Лев":11,"Ліна":8} },
        { args:["grades.txt"], files:{ "grades.txt":"Дана,5\nРоман,3\nСофія,2\n" }, expected:{"Дана":5,"Роман":3,"Софія":2} },
        { args:["grades.txt"], files:{ "grades.txt":"Оля,10\nхтось,без,коми\nМаксим,7\n" }, expected:{"Оля":10,"Максим":7} },
        { args:["journal.txt"], files:{ "journal.txt":"Іра,12\nЮра,10\n" }, expected:{"Іра":12,"Юра":10} },
        { args:["grades.txt"], files:{ "grades.txt":"Оля,10\nПетро,15\n" }, raises:"ValueError" },
        { args:["grades.txt"], files:{ "grades.txt":"Марко,0\nНіна,9\n" }, raises:"ValueError" }
      ],
      solution:
`def parse_grades(path):
    grades = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                name, grade_text = line.strip().split(",")
                grade = int(grade_text)
            except ValueError:
                continue
            if grade < 1 or grade > 12:
                raise ValueError(f"Оцінка поза межами 1..12: {name}, {grade}")
            grades[name] = grade
    return grades
` }
  ]}

  ]
});
