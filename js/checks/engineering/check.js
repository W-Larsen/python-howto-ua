/* ==========================================================================
   Самостійна робота 1 для Старшої інженерної школи (#/check):
   9 завдань, 12 балів. П'ять питань із варіантами відповіді (1 бал; 0.5 бала,
   якщо учень обрав варіант, правильний за логікою, але з синтаксичною
   помилкою) і чотири практичні завдання з функціями (2 або 1 бал).

   Тест уже пройшли учні, тому ключі localStorage (pyguide_check_*), адреса
   #/check і версія формату посилання (2) — сталі, а тексти варіантів
   відповіді (options[].text) і стартовий код не змінювати: від них залежать
   надіслані вчителю посилання (tests/engine.test.js звіряє це з
   tests/fixtures/engineering-legacy.js). Умови, підказки й пояснення (q,
   intro, hint, explain) у посилання не потрапляють — їх правити можна.
   Нове — лише новим варіантом у кінець списку.
   ========================================================================== */
"use strict";
CheckEngine.define({
  slug:"check",
  storage:"pyguide_check",
  shareVersion:2,
  title:"Інженерна школа: Самостійна робота 1",
  lede:
    "<p>Підсумкова самостійна робота на <b>12 балів</b>. Усього 9 завдань:</p>" +
    "<ul>" +
      "<li><b>5 питань</b> з варіантами відповіді — по 1 балу, а за майже правильну відповідь — 0.5;</li>" +
      "<li><b>4 практичні завдання</b>, де треба написати функцію, — одне на 1 бал і три по 2 бали.</li>" +
    "</ul>",
  rules:
    "<p><b>Перед початком прочитай, як усе влаштовано:</b></p>" +
    "<ul>" +
      "<li><b>Одна спроба.</b> Коли натиснеш «Завершити тест», змінити відповіді чи пройти тест заново вже не вийде.</li>" +
      "<li><b>У кожного свої завдання,</b> але складність і максимум — 12 балів — однакові для всіх.</li>" +
      "<li><b>Відповіді не загубляться.</b> Поки пишеш, вони зберігаються автоматично, а після завершення в цьому браузері лишається результат — повернешся на сторінку й побачиш свої бали та правильні відповіді.</li>" +
      "<li><b>Код можна запускати скільки завгодно.</b> Кнопка «Запустити» (або Ctrl+Enter) покаже, чи виконується твоя функція без помилок. Але чи пройде вона приховані тести, дізнаєшся лише після завершення тесту.</li>" +
    "</ul>",
  acHidden:{ vars_code: new Set(["int"]) },
  slots:[

  /* ---------- 1. змінні, print, input, int() — MCQ ---------- */
  { id:"vars_mcq", type:"mcq", topic:"Змінні, print, input, int()", points:1, variants:[
    { q:"Потрібно запитати вік користувача і одразу вивести, скільки йому буде років через 5 років.\n\nЯкий варіант зробить це правильно?",
      options:[
        { text:'age = int(input("Скільки тобі років? "))\nprint(age + 5)', credit:1 },
        { text:'age = int(input("Скільки тобі років? ")\nprint(age + 5)', credit:0.5 },
        { text:'age = input("Скільки тобі років? ")\nprint(age + 5)', credit:0 },
        { text:'age = int("Скільки тобі років? ")\nprint(age + 5)', credit:0 }
      ],
      explain:"`input()` завжди повертає рядок, тому число з нього треба дістати через `int()`.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- Без `int()` рядок складається з числом — `TypeError`.\n- `int()` застосовано не до того, що ввів користувач, а до тексту питання." },
    { q:"Змінна `price` має зберігати ціну, яку ввів користувач, як ціле число.\n\nЯкий варіант правильний?",
      options:[
        { text:'price = int(input("Ціна: "))', credit:1 },
        { text:'price = int(input("Ціна: ")', credit:0.5 },
        { text:'price = input(int("Ціна: "))', credit:0 },
        { text:'price = "int(input(Ціна: ))"', credit:0 }
      ],
      explain:"Правильний порядок: спершу `input()` зчитує рядок, потім `int()` перетворює його в число.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- `input(int(...))` — переплутано, що саме перетворюється в число.\n- Весь вираз у лапках — це просто текст, він нічого не обчислює." },
    { q:"Потрібно зчитати два числа й вивести їхню суму.\n\nЯкий варіант правильний?",
      options:[
        { text:'a = int(input("Перше число: "))\nb = int(input("Друге число: "))\nprint(a + b)', credit:1 },
        { text:'a = Int(input("Перше число: "))\nb = int(input("Друге число: "))\nprint(a + b)', credit:0.5 },
        { text:'a = input("Перше число: ")\nb = int(input("Друге число: "))\nprint(a + b)', credit:0 },
        { text:'a = input("Перше число: ")\nb = input("Друге число: ")\nprint(a + b)', credit:0 }
      ],
      explain:"У Python функції пишуться з малої літери: `int()`, а не `Int()`.\n\nЩо не так з іншими варіантами:\n- `Int` узагалі не існує — `NameError`.\n- Одну змінну перетворили через `int()`, іншу — ні, тому `a + b` впаде з `TypeError`.\n- Обидві змінні лишились рядками — `a + b` просто склеїть текст, а не додасть числа." },
    { q:"Значення `name` і `age` зберігаються у змінних (`age` — число). Потрібно вивести їх в одному рядку через пробіл, наприклад `Оля 16`.\n\nЯкий варіант правильний?",
      options:[
        { text:"print(name, age)", credit:1 },
        { text:"print(name age)", credit:0.5 },
        { text:"print(name + age)", credit:0 },
        { text:"print(name * age)", credit:0 }
      ],
      explain:"`print()` з кількома аргументами через кому сам розставляє пробіли між ними.\n\nЩо не так з іншими варіантами:\n- Без коми Python не зрозуміє, де закінчується один аргумент і починається інший — `SyntaxError`.\n- `+` намагається скласти рядок із числом — `TypeError`.\n- `*` повторить рядок `name` стільки разів, скільки в `age`, — це не те, що потрібно." }
  ]},

  /* ---------- 2. умови — MCQ ---------- */
  { id:"cond_mcq", type:"mcq", topic:"Умови", points:1, variants:[
    { q:"Потрібно вивести `Прохід`, якщо `score >= 60`, інакше — `Незалік`.\n\nЯкий варіант правильний?",
      options:[
        { text:'if score >= 60:\n    print("Прохід")\nelse:\n    print("Незалік")', credit:1 },
        { text:'if score >= 60\n    print("Прохід")\nelse:\n    print("Незалік")', credit:0.5 },
        { text:'if score >= 60:\n    print("Незалік")\nelse:\n    print("Прохід")', credit:0 },
        { text:'if score => 60:\n    print("Прохід")\nelse:\n    print("Незалік")', credit:0 }
      ],
      explain:"Після умови `if` обов'язкова двокрапка, а в кожній гілці має стояти свій текст.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після умови — `SyntaxError`, хоча логіка гілок правильна.\n- Тексти в гілках переплутано місцями.\n- `=>` у Python не існує — потрібно `>=`." },
    { q:"Потрібно перевірити, що оцінка `grade` одночасно не менша за 4 і не більша за 12.\n\nЯкий варіант правильний?",
      options:[
        { text:"if 4 <= grade <= 12:", credit:1 },
        { text:"if 4 <= grade <= 12", credit:0.5 },
        { text:"if 4 >= grade >= 12:", credit:0 },
        { text:"if grade >= 4 and grade >= 12:", credit:0 }
      ],
      explain:"Python дозволяє ланцюжок порівнянь: `4 <= grade <= 12` — це і є «між 4 і 12».\n\nЩо не так з іншими варіантами:\n- Немає двокрапки в кінці — `SyntaxError`.\n- `4 >= grade >= 12` — знаки переплутано, умова ніколи не буде істинною.\n- `grade >= 4 and grade >= 12` фактично вимагає `grade >= 12` — це не «від 4 до 12»." },
    { q:"Потрібно перевірити, що число `num` ділиться і на 2, і на 3 одночасно.\n\nЯкий варіант правильний?",
      options:[
        { text:"if num % 2 == 0 and num % 3 == 0:", credit:1 },
        { text:"if num % 2 = 0 and num % 3 == 0:", credit:0.5 },
        { text:"if num % 2 == 0 or num % 3 == 0:", credit:0 },
        { text:"if num / 2 == 0 and num / 3 == 0:", credit:0 }
      ],
      explain:"`%` — остача від ділення; вона дорівнює 0, якщо число ділиться націло.\n\nЩо не так з іншими варіантами:\n- `num % 2 = 0` — присвоєння замість порівняння `==`, усередині умови це `SyntaxError`.\n- `or` пропускає числа, які діляться лише на одне з двох.\n- `/` — звичайне ділення, а не остача, тому умова майже ніколи не спрацює правильно." },
    { q:"Потрібно вивести `парне`, якщо число `num` парне, інакше — `непарне`.\n\nЯкий варіант правильний?",
      options:[
        { text:'if num % 2 == 0:\n    print("парне")\nelse:\n    print("непарне")', credit:1 },
        { text:'if num % 2 == 0:\nprint("парне")\nelse:\n    print("непарне")', credit:0.5 },
        { text:'if num % 2 == 1:\n    print("парне")\nelse:\n    print("непарне")', credit:0 },
        { text:'if num % 2 == 0:\n    print("непарне")\nelse:\n    print("парне")', credit:0 }
      ],
      explain:"Тіло `if` і `else` має бути з відступом — саме відступ показує Python, які рядки належать якій гілці.\n\nЩо не так з іншими варіантами:\n- `print(\"парне\")` без відступу — `IndentationError`, хоча логіка правильна.\n- `num % 2 == 1` перевіряє непарність, а не парність.\n- Тексти в гілках переплутано — вивід буде навпаки." }
  ]},

  /* ---------- 3. цикли — MCQ ---------- */
  { id:"loops_mcq", type:"mcq", topic:"Цикли", points:1, variants:[
    { q:"Потрібно вивести числа від 1 до 5 включно.\n\nЯкий варіант правильний?",
      options:[
        { text:"for i in range(1, 6):\n    print(i)", credit:1 },
        { text:"for i in range(1, 6)\n    print(i)", credit:0.5 },
        { text:"for i in range(1, 5):\n    print(i)", credit:0 },
        { text:"for i in range(6, 1):\n    print(i)", credit:0 }
      ],
      explain:"`range(1, 6)` дає 1, 2, 3, 4, 5 — верхня межа не входить, тому для «до 5 включно» потрібно 6.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `for` — `SyntaxError`.\n- `range(1, 5)` виведе лише 1–4.\n- `range(6, 1)` — межі переплутано, діапазон порожній, нічого не виведеться." },
    { q:"Потрібно вивести `Привіт` рівно 3 рази за допомогою `while`.\n\nЯкий варіант правильний?",
      options:[
        { text:'i = 0\nwhile i < 3:\n    print("Привіт")\n    i += 1', credit:1 },
        { text:'i = 0\nwhile i < 3\n    print("Привіт")\n    i += 1', credit:0.5 },
        { text:'i = 0\nwhile i < 3:\n    print("Привіт")', credit:0 },
        { text:'i = 1\nwhile i < 3:\n    print("Привіт")\n    i += 1', credit:0 }
      ],
      explain:"Лічильник має рухатись до умови виходу — `i += 1` усередині циклу.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після умови — `SyntaxError`.\n- `i` ніколи не змінюється — цикл нескінченний.\n- `i` починається з 1, тому `Привіт` виведеться лише 2 рази (для `i` = 1 і 2)." },
    { q:"Потрібно порахувати суму чисел від 1 до 10 включно за допомогою циклу.\n\nЯкий варіант правильний?",
      options:[
        { text:"total = 0\nfor i in range(1, 11):\n    total += i", credit:1 },
        { text:"total = 0\nfor i in range(1, 11):\ntotal += i", credit:0.5 },
        { text:"total = 0\nfor i in range(1, 10):\n    total += i", credit:0 },
        { text:"total = 0\nfor i in range(1, 11):\n    total = i", credit:0 }
      ],
      explain:"`range(1, 11)` дає числа 1–10, а `total += i` щоразу додає поточне число до накопичувача.\n\nЩо не так з іншими варіантами:\n- Тіло циклу без відступу — `IndentationError`.\n- `range(1, 10)` — це лише 1–9, останнє число загублено.\n- `total = i` щоразу ПЕРЕЗАПИСУЄ суму замість накопичення — лишиться тільки останнє число." },
    { q:"Потрібно вивести числа 0, 2, 4, 6, 8 — з кроком 2.\n\nЯкий варіант правильний?",
      options:[
        { text:"for i in range(0, 10, 2):\n    print(i)", credit:1 },
        { text:"for i in range(0; 10; 2):\n    print(i)", credit:0.5 },
        { text:"for i in range(0, 10):\n    print(i)", credit:0 },
        { text:"for i in range(0, 10, 3):\n    print(i)", credit:0 }
      ],
      explain:"Третій аргумент `range()` — крок: `range(0, 10, 2)` дає саме 0, 2, 4, 6, 8.\n\nЩо не так з іншими варіантами:\n- Аргументи розділено `;` замість коми — `SyntaxError`.\n- Без кроку (за замовчуванням 1) вийдуть усі числа 0–9.\n- Крок 3 дає геть інші числа: 0, 3, 6, 9." }
  ]},

  /* ---------- 4. списки (без зрізів) — MCQ ---------- */
  { id:"list_mcq", type:"mcq", topic:"Списки", points:1, variants:[
    { q:"У списку `fruits = [\"яблуко\", \"банан\", \"вишня\"]` потрібно додати новий фрукт `\"груша\"` у кінець.\n\nЯкий варіант правильний?",
      options:[
        { text:'fruits.append("груша")', credit:1 },
        { text:'fruits.append("груша"', credit:0.5 },
        { text:'fruits[0] = "груша"', credit:0 },
        { text:'fruits.remove("груша")', credit:0 }
      ],
      explain:"`append()` додає елемент у кінець списку.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- `fruits[0] = ...` замінює перший елемент замість додавання нового.\n- `remove()` намагається видалити те, чого в списку ще немає." },
    { q:"Потрібно дізнатися, скільки елементів у списку `numbers`.\n\nЯкий варіант правильний?",
      options:[
        { text:"len(numbers)", credit:1 },
        { text:"Len(numbers)", credit:0.5 },
        { text:"numbers.len()", credit:0 },
        { text:"numbers[len]", credit:0 }
      ],
      explain:"`len()` — вбудована функція, пишеться `len(numbers)`, обов'язково з малої літери.\n\nЩо не так з іншими варіантами:\n- `Len` з великої літери не існує — `NameError`.\n- `numbers.len()` — у списку такого методу немає, `AttributeError`.\n- `numbers[len]` використовує `len` як індекс — це не має сенсу." },
    { q:"Потрібно перевірити, чи входить число 7 у список `numbers`.\n\nЯкий варіант правильний?",
      options:[
        { text:"7 in numbers", credit:1 },
        { text:"7 In numbers", credit:0.5 },
        { text:"numbers.in(7)", credit:0 },
        { text:"numbers == 7", credit:0 }
      ],
      explain:"`in` — оператор перевірки належності, пишеться з малої літери.\n\nЩо не так з іншими варіантами:\n- `In` з великої літери Python не розпізнає як оператор — `SyntaxError`.\n- `numbers.in(7)` — такого методу в списку немає.\n- `numbers == 7` порівнює весь список із числом, а не перевіряє належність." },
    { q:"Потрібно отримати НОВИЙ відсортований список на основі `prices`, а сам `prices` лишити без змін.\n\nЯкий варіант правильний?",
      options:[
        { text:"sorted(prices)", credit:1 },
        { text:"sort(prices)", credit:0.5 },
        { text:"prices.sort()", credit:0 },
        { text:"prices.reverse()", credit:0 }
      ],
      explain:"`sorted(prices)` — вбудована функція, яка повертає НОВИЙ відсортований список, не чіпаючи `prices`.\n\nЩо не так з іншими варіантами:\n- `sort(prices)` як окремої функції не існує — `NameError` (є `sorted()` або метод `.sort()`).\n- `prices.sort()` сортує сам `prices` НА МІСЦІ й повертає `None` — це суперечить умові.\n- `reverse()` лише перевертає порядок, а не сортує." }
  ]},

  /* ---------- 5. словники — MCQ ---------- */
  { id:"dict_mcq", type:"mcq", topic:"Словники", points:1, variants:[
    { q:"Є словник `ages = {\"Оля\": 16, \"Іван\": 15}`. Потрібно безпечно отримати вік `\"Марії\"`, а якщо такого ключа немає — отримати `0` замість помилки.\n\nЯкий варіант правильний?",
      options:[
        { text:'ages.get("Марії", 0)', credit:1 },
        { text:'ages.get("Марії", 0', credit:0.5 },
        { text:'ages["Марії"]', credit:0 },
        { text:'ages.get(0, "Марії")', credit:0 }
      ],
      explain:"`.get(ключ, значення_за_замовчуванням)` не кидає помилку, якщо ключа немає.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- Звернення через `[]` кине `KeyError`, якщо ключа немає, — це проти умови.\n- Аргументи `get()` переплутано місцями." },
    { q:"Потрібно додати нову пару ключ-значення `\"Петро\": 14` у словник `ages`.\n\nЯкий варіант правильний?",
      options:[
        { text:'ages["Петро"] = 14', credit:1 },
        { text:"ages['Петро\"] = 14", credit:0.5 },
        { text:'ages.append("Петро", 14)', credit:0 },
        { text:'ages["Петро"] == 14', credit:0 }
      ],
      explain:"Новий ключ додається присвоєнням: `ages[\"ключ\"] = значення`.\n\nЩо не так з іншими варіантами:\n- Рядок відкрито однією лапкою, а закрито іншою — `SyntaxError`.\n- У словників немає методу `append()` — це метод списків.\n- `==` — це порівняння, воно нічого не змінює в словнику." },
    { q:"Потрібно дізнатися, скільки пар ключ-значення у словнику `ages`.\n\nЯкий варіант правильний?",
      options:[
        { text:"len(ages)", credit:1 },
        { text:"ages.length()", credit:0.5 },
        { text:"max(ages)", credit:0 },
        { text:"type(ages)", credit:0 }
      ],
      explain:"`len()` працює для словників так само, як і для списків, — рахує кількість пар.\n\nЩо не так з іншими варіантами:\n- Методу `.length()` у Python немає, це з інших мов — `AttributeError`.\n- `max()` поверне найбільший ключ, а не кількість.\n- `type()` поверне лише тип об'єкта (`dict`), а не кількість елементів." },
    { q:"Потрібно створити словник одразу з двома записами: `\"Оля\": 16` і `\"Іван\": 15`.\n\nЯкий варіант правильний?",
      options:[
        { text:'ages = {"Оля": 16, "Іван": 15}', credit:1 },
        { text:'ages = {"Оля": 16 "Іван": 15}', credit:0.5 },
        { text:'ages = ["Оля": 16, "Іван": 15]', credit:0 },
        { text:'ages = ("Оля": 16, "Іван": 15)', credit:0 }
      ],
      explain:"Словник — це фігурні дужки `{}`, а пари розділяються комою.\n\nЩо не так з іншими варіантами:\n- Кому між парами забули — `SyntaxError`.\n- `[]` — це список, а `()` — кортеж: вони не підтримують запис `ключ: значення`, теж `SyntaxError`." }
  ]},

  /* ---------- 6. змінні, print, input, int() — код ---------- */
  { id:"vars_code", type:"code", topic:"Змінні, print, input, int()", points:1, variants:[
    { title:"Сума замовлення", fn:"order_total", sig:"order_total(price_text, quantity_text)",
      intro:"`price_text` і `quantity_text` — рядки, такі самі, як поверне `input()`:\n- `price_text` — ціна за одиницю товару;\n- `quantity_text` — кількість.\n\nПереведи обидва значення в цілі числа й поверни загальну суму — ціну, помножену на кількість.",
      hint:"Рядок треба спершу перетворити функцією `int()`, і лише тоді множити.",
      starter:
`def order_total(price_text, quantity_text):
    """
    price_text і quantity_text - рядки, такі самі, як поверне input().

    Перетвори обидва значення в цілі числа (int) і поверни
    ЗАГАЛЬНУ СУМУ - ціну, помножену на кількість.

    Приклад: order_total("150", "3") -> 450
    Приклад: order_total("40", "2") -> 80
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("order_total ще не реалізовано")
`,
      tests:[
        { args:["150","3"], expected:450 },
        { args:["40","2"], expected:80 },
        { args:["0","5"], expected:0 },
        { args:["999","1"], expected:999 }
      ],
      solution:
`def order_total(price_text, quantity_text):
    price = int(price_text)
    quantity = int(quantity_text)
    return price * quantity
` },
    { title:"Середня ціна", fn:"average_price", sig:"average_price(price1_text, price2_text)",
      intro:"`price1_text` і `price2_text` — дві ціни, рядки, такі самі, як поверне `input()`.\n\nПереведи обидва значення в цілі числа й поверни їхнє середнє арифметичне.",
      hint:"Спочатку `int()` для обох рядків, потім `(a + b) / 2` — ділення `/` завжди дає дробове число.",
      starter:
`def average_price(price1_text, price2_text):
    """
    price1_text і price2_text - рядки, такі самі, як поверне input().

    Перетвори обидва значення в цілі числа (int) і поверни
    їхнє СЕРЕДНЄ АРИФМЕТИЧНЕ.

    Приклад: average_price("100", "200") -> 150.0
    Приклад: average_price("50", "51") -> 50.5
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("average_price ще не реалізовано")
`,
      tests:[
        { args:["100","200"], expected:150.0 },
        { args:["50","51"], expected:50.5 },
        { args:["10","10"], expected:10.0 },
        { args:["0","4"], expected:2.0 }
      ],
      solution:
`def average_price(price1_text, price2_text):
    return (int(price1_text) + int(price2_text)) / 2
` },
    { title:"Різниця у віці", fn:"age_diff", sig:"age_diff(year1_text, year2_text)",
      intro:"`year1_text` і `year2_text` — роки народження, рядки, такі самі, як поверне `input()`.\n\nПереведи обидва значення в цілі числа й поверни різницю у віці — завжди невід'ємне число.",
      hint:"`abs()` повертає модуль числа — прибирає знак «мінус», якщо різниця вийшла від'ємною.",
      starter:
`def age_diff(year1_text, year2_text):
    """
    year1_text і year2_text - рядки з роками народження, такі самі,
    як поверне input().

    Перетвори обидва значення в цілі числа (int) і поверни
    РІЗНИЦЮ У ВІЦІ - модуль різниці між роками (завжди невід'ємне число).

    Приклад: age_diff("2005", "2008") -> 3
    Приклад: age_diff("2010", "2001") -> 9
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("age_diff ще не реалізовано")
`,
      tests:[
        { args:["2005","2008"], expected:3 },
        { args:["2010","2001"], expected:9 },
        { args:["2000","2000"], expected:0 },
        { args:["1999","2020"], expected:21 }
      ],
      solution:
`def age_diff(year1_text, year2_text):
    return abs(int(year1_text) - int(year2_text))
` }
  ]},

  /* ---------- 7. умови — код ---------- */
  { id:"cond_code", type:"code", topic:"Умови", points:2, variants:[
    { title:"Оцінка словами", fn:"grade_label", sig:"grade_label(score)",
      intro:"`score` — ціле число від 1 до 12, оцінка за дванадцятибальною шкалою. Поверни рядок:\n- `\"відмінно\"` — якщо `score >= 10`;\n- `\"добре\"` — від 7 до 9;\n- `\"задовільно\"` — від 4 до 6;\n- `\"незадовільно\"` — якщо `score < 4`.",
      hint:"Перевіряй умови від найбільшої межі до найменшої: спершу `score >= 10`, потім `>= 7`, потім `>= 4`, інакше — останній випадок.",
      starter:
`def grade_label(score):
    """
    score - ціле число від 1 до 12.

    Повернути рядок:
      "відмінно"     якщо score >= 10
      "добре"        якщо 7 <= score < 10
      "задовільно"   якщо 4 <= score < 7
      "незадовільно" якщо score < 4

    Приклад: grade_label(11) -> "відмінно"
    Приклад: grade_label(5) -> "задовільно"
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("grade_label ще не реалізовано")
`,
      tests:[
        { args:[12], expected:"відмінно" },
        { args:[10], expected:"відмінно" },
        { args:[9], expected:"добре" },
        { args:[7], expected:"добре" },
        { args:[6], expected:"задовільно" },
        { args:[4], expected:"задовільно" },
        { args:[3], expected:"незадовільно" },
        { args:[1], expected:"незадовільно" }
      ],
      solution:
`def grade_label(score):
    if score >= 10:
        return "відмінно"
    elif score >= 7:
        return "добре"
    elif score >= 4:
        return "задовільно"
    else:
        return "незадовільно"
` },
    { title:"Стан балансу", fn:"balance_status", sig:"balance_status(balance)",
      intro:"`balance` — ціле чи дробове число, залишок на рахунку. Поверни рядок:\n- `\"борг\"` — якщо `balance < 0`;\n- `\"порожньо\"` — якщо `balance == 0`;\n- `\"є кошти\"` — якщо `balance > 0`.",
      hint:"Три випадки — три гілки: `if` / `elif` / `else`.",
      starter:
`def balance_status(balance):
    """
    balance - ціле чи дробове число, залишок на рахунку.

    Повернути рядок:
      "борг"      якщо balance < 0
      "порожньо"  якщо balance == 0
      "є кошти"   якщо balance > 0

    Приклад: balance_status(-50) -> "борг"
    Приклад: balance_status(0) -> "порожньо"
    Приклад: balance_status(120) -> "є кошти"
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("balance_status ще не реалізовано")
`,
      tests:[
        { args:[-50], expected:"борг" },
        { args:[0], expected:"порожньо" },
        { args:[120], expected:"є кошти" },
        { args:[-1], expected:"борг" },
        { args:[0.5], expected:"є кошти" }
      ],
      solution:
`def balance_status(balance):
    if balance < 0:
        return "борг"
    elif balance == 0:
        return "порожньо"
    else:
        return "є кошти"
` },
    { title:"Вікова категорія", fn:"age_category", sig:"age_category(age)",
      intro:"`age` — ціле невід'ємне число, вік людини. Поверни рядок:\n- `\"дитина\"` — якщо `age < 12`;\n- `\"підліток\"` — від 12 до 17;\n- `\"дорослий\"` — якщо `age >= 18`.",
      hint:"`elif age < 18` тут достатньо: якщо код дійшов до цього рядка, значить `age` вже не менше 12.",
      starter:
`def age_category(age):
    """
    age - ціле число, вік людини (>= 0).

    Повернути рядок:
      "дитина"    якщо age < 12
      "підліток"  якщо 12 <= age < 18
      "дорослий"  якщо age >= 18

    Приклад: age_category(10) -> "дитина"
    Приклад: age_category(15) -> "підліток"
    Приклад: age_category(30) -> "дорослий"
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("age_category ще не реалізовано")
`,
      tests:[
        { args:[10], expected:"дитина" },
        { args:[15], expected:"підліток" },
        { args:[12], expected:"підліток" },
        { args:[17], expected:"підліток" },
        { args:[18], expected:"дорослий" },
        { args:[0], expected:"дитина" }
      ],
      solution:
`def age_category(age):
    if age < 12:
        return "дитина"
    elif age < 18:
        return "підліток"
    else:
        return "дорослий"
` }
  ]},

  /* ---------- 8. цикли — код ---------- */
  { id:"loops_code", type:"code", topic:"Цикли", points:2, variants:[
    { title:"Сума парних чисел", fn:"sum_even", sig:"sum_even(numbers)",
      intro:"`numbers` — список цілих чисел. Поверни суму лише ПАРНИХ чисел зі списку.\n\nЯкщо парних чисел немає — поверни `0`.",
      hint:"Число `n` парне, якщо `n % 2 == 0`. Заведи накопичувач `total = 0` і додавай до нього підходящі числа в циклі.",
      starter:
`def sum_even(numbers):
    """
    numbers - список цілих чисел.

    Повернути СУМУ лише ПАРНИХ чисел зі списку numbers.
    Якщо парних чисел немає - повернути 0.

    Приклад: sum_even([1, 2, 3, 4, 5, 6]) -> 12   (2 + 4 + 6)
    Приклад: sum_even([1, 3, 5]) -> 0
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("sum_even ще не реалізовано")
`,
      tests:[
        { args:[[1,2,3,4,5,6]], expected:12 },
        { args:[[1,3,5]], expected:0 },
        { args:[[]], expected:0 },
        { args:[[2,4,6]], expected:12 },
        { args:[[10]], expected:10 }
      ],
      solution:
`def sum_even(numbers):
    total = 0
    for n in numbers:
        if n % 2 == 0:
            total += n
    return total
` },
    { title:"Кількість від'ємних", fn:"count_negative", sig:"count_negative(numbers)",
      intro:"`numbers` — список цілих чи дробових чисел. Поверни кількість від'ємних чисел (менших за 0) у списку.",
      hint:"Заведи лічильник `count = 0` і збільшуй його на 1 щоразу, коли зустрічаєш число менше за 0.",
      starter:
`def count_negative(numbers):
    """
    numbers - список цілих чи дробових чисел.

    Повернути КІЛЬКІСТЬ від'ємних чисел (менших за 0) у списку numbers.

    Приклад: count_negative([1, -2, 3, -4, -5]) -> 3
    Приклад: count_negative([1, 2, 3]) -> 0
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("count_negative ще не реалізовано")
`,
      tests:[
        { args:[[1,-2,3,-4,-5]], expected:3 },
        { args:[[1,2,3]], expected:0 },
        { args:[[]], expected:0 },
        { args:[[-1,-1,-1]], expected:3 }
      ],
      solution:
`def count_negative(numbers):
    count = 0
    for n in numbers:
        if n < 0:
            count += 1
    return count
` },
    { title:"Добуток елементів", fn:"product_all", sig:"product_all(numbers)",
      intro:"`numbers` — непорожній список цілих чисел. Поверни добуток усіх чисел у списку — результат множення їх усіх між собою.",
      hint:"Накопичувач тут починається з `1`, а не з `0`, як для суми, — інакше множення на 0 занулило б усе.",
      starter:
`def product_all(numbers):
    """
    numbers - непорожній список цілих чисел.

    Повернути ДОБУТОК усіх чисел у списку numbers
    (результат множення їх усіх між собою).

    Приклад: product_all([1, 2, 3, 4]) -> 24
    Приклад: product_all([5]) -> 5
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("product_all ще не реалізовано")
`,
      tests:[
        { args:[[1,2,3,4]], expected:24 },
        { args:[[5]], expected:5 },
        { args:[[2,2,2]], expected:8 },
        { args:[[1,1,1,1]], expected:1 }
      ],
      solution:
`def product_all(numbers):
    result = 1
    for n in numbers:
        result *= n
    return result
` }
  ]},

  /* ---------- 9. списки (без зрізів) — код ---------- */
  { id:"list_code", type:"code", topic:"Списки", points:2, variants:[
    { title:"Лише додатні числа", fn:"only_positive", sig:"only_positive(numbers)",
      intro:"`numbers` — список цілих чи дробових чисел. Поверни НОВИЙ список, у якому лише додатні числа з `numbers` (більші за 0), у тому самому порядку.",
      hint:"Заведи порожній список `result = []`, пройдись циклом по `numbers` і додавай у `result` лише числа, більші за 0.",
      starter:
`def only_positive(numbers):
    """
    numbers - список цілих чи дробових чисел.

    Повернути НОВИЙ список, що містить лише додатні числа з numbers
    (більші за 0), у тому самому порядку.

    Приклад: only_positive([3, -1, 0, 5, -2]) -> [3, 5]
    Приклад: only_positive([-1, -2]) -> []
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("only_positive ще не реалізовано")
`,
      tests:[
        { args:[[3,-1,0,5,-2]], expected:[3,5] },
        { args:[[-1,-2]], expected:[] },
        { args:[[1,2,3]], expected:[1,2,3] },
        { args:[[0,0,0]], expected:[] }
      ],
      solution:
`def only_positive(numbers):
    result = []
    for n in numbers:
        if n > 0:
            result.append(n)
    return result
` },
    { title:"Подвоєні числа", fn:"double_all", sig:"double_all(numbers)",
      intro:"`numbers` — список цілих чи дробових чисел. Поверни НОВИЙ список, у якому кожне число з `numbers` помножене на 2, у тому самому порядку.",
      hint:"Заведи порожній список `result = []` і для кожного числа додавай у нього число, помножене на 2.",
      starter:
`def double_all(numbers):
    """
    numbers - список цілих чи дробових чисел.

    Повернути НОВИЙ список, у якому кожне число з numbers
    збільшене вдвічі (помножене на 2), у тому самому порядку.

    Приклад: double_all([1, 2, 3]) -> [2, 4, 6]
    Приклад: double_all([]) -> []
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("double_all ще не реалізовано")
`,
      tests:[
        { args:[[1,2,3]], expected:[2,4,6] },
        { args:[[]], expected:[] },
        { args:[[0,-1]], expected:[0,-2] },
        { args:[[5]], expected:[10] }
      ],
      solution:
`def double_all(numbers):
    result = []
    for n in numbers:
        result.append(n * 2)
    return result
` },
    { title:"Найдовше слово", fn:"longest_word", sig:"longest_word(words)",
      intro:"`words` — непорожній список рядків (слів). Поверни найдовше слово зі списку.\n\nЯкщо однаково довгих слів декілька — поверни перше з них.",
      hint:"Заведи змінну `best = words[0]` — перше слово за замовчуванням — і онови її, тільки якщо знайдеш довше слово.",
      starter:
`def longest_word(words):
    """
    words - непорожній список рядків (слів).

    Повернути НАЙДОВШЕ слово зі списку words.
    Якщо однаково довгих слів декілька - повернути перше з них.

    Приклад: longest_word(["кіт", "слон", "у"]) -> "слон"
    Приклад: longest_word(["раз"]) -> "раз"
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("longest_word ще не реалізовано")
`,
      tests:[
        { args:[["кіт","слон","у"]], expected:"слон" },
        { args:[["раз"]], expected:"раз" },
        { args:[["ab","cd","efg"]], expected:"efg" },
        { args:[["aaa","bbb"]], expected:"aaa" }
      ],
      solution:
`def longest_word(words):
    best = words[0]
    for w in words:
        if len(w) > len(best):
            best = w
    return best
` }
  ]},


  ]
});
