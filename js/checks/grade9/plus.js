/* ==========================================================================
   Розширена самостійна робота для 9 класу (#/check-9plus): 12 завдань,
   12 балів. Для учня, який уже вчив Python на курсі з іграми (Breakout):
   мало простого, більше циклів і списків, плюс функції, винятки й базова
   ігрова логіка. Сторінка доступна лише за прямим посиланням — її немає
   в меню й на сторінці «Самостійні роботи».
   Вісім питань з варіантами по 0.5 бала і чотири практичні по 2 бали:
   три «програми» (input()/print()) і одна функція з прихованими тестами.
   Стартовий код уже виданих варіантів не змінюй — від нього залежать
   посилання на результати (див. js/checks/core.js). Варіанти не видаляй:
   надто складний позначай retired:true (новим учням він не видається),
   а заміну додавай у кінець списку.
   ========================================================================== */
"use strict";
CheckEngine.define({
  slug:"check-9plus",
  storage:"pyguide_check9plus",
  title:"9 клас: Самостійна робота 1, розширений варіант",
  lede:
    "<p>Розширений варіант самостійної роботи на <b>12 балів</b> — для тих, хто вже програмував, наприклад на курсі з іграми. Усього 12 завдань:</p>" +
    "<ul>" +
      "<li><b>8 питань</b> з варіантами відповіді — по 0.5 бала, а за майже правильну відповідь — 0.25;</li>" +
      "<li><b>4 практичні завдання</b> по 2 бали: три програми з <code>input()</code> і <code>print()</code> та одна функція.</li>" +
    "</ul>",
  rules:
    "<p><b>Перед початком прочитай, як усе влаштовано:</b></p>" +
    "<ul>" +
      "<li><b>Одна спроба.</b> Коли натиснеш «Завершити тест», змінити відповіді чи пройти тест заново вже не вийде.</li>" +
      "<li><b>У кожного свої завдання,</b> але складність і максимум — 12 балів — однакові для всіх.</li>" +
      "<li><b>Відповіді не загубляться.</b> Поки пишеш, вони зберігаються автоматично, а після завершення в цьому браузері лишається результат — повернешся на сторінку й побачиш свої бали та правильні відповіді.</li>" +
      "<li><b>Код можна запускати скільки завгодно.</b> У програмі впиши вхідні дані й натисни «Запустити» (або Ctrl+Enter) — побачиш, що вона виводить. У функції «Запустити» покаже, чи виконується код без помилок. Але чи пройде код приховані перевірки, дізнаєшся лише після завершення тесту.</li>" +
    "</ul>",
  slots:[

  /* ---------- 1. print, input, int() і f-рядки — mcq ---------- */
  { id:"p_base1", type:"mcq", topic:"print, input, int() і f-рядки", points:0.5, variants:[
    { q:"Користувач вводить свій рахунок. Потрібно вивести `Рахунок: <рахунок + 100>` — тобто додати бонус 100 очок.\n\nЯкий варіант правильний?",
      options:[
        { text:"score = int(input())\nprint(f\"Рахунок: {score + 100}\")", credit:1 },
        { text:"score = int(input())\nprint(f\"Рахунок: {score + 100}\"", credit:0.5 },
        { text:"score = input()\nprint(f\"Рахунок: {score + 100}\")", credit:0 },
        { text:"score = int(input())\nprint(\"Рахунок: {score + 100}\")", credit:0 }
      ],
      explain:"Число з `input()` треба отримати через `int()`, а вираз у f-рядку пишеться у фігурних дужках.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки `print(...)` — `SyntaxError`.\n- Без `int()` змінна `score` — рядок, і `score + 100` дасть `TypeError`.\n- Без `f` перед лапками виведеться текст `{score + 100}` буквально." },
    { q:"Що виведе програма?",
      code:"lives = 3\nlives = lives - 1\nprint(f\"Життів: {lives * 2}\")",
      options:[
        { text:"Життів: 4", credit:1 },
        { text:"Життів: 6", credit:0 },
        { text:"Життів: {lives * 2}", credit:0 },
        { text:"Життів: 2", credit:0 }
      ],
      explain:"Спершу `lives` стає `3 - 1 = 2`, потім у f-рядку обчислюється вираз `lives * 2 = 4`." },
    { q:"Що виведе програма?",
      code:"a = \"5\"\nb = 5\nprint(int(a) + b, a * 2)",
      options:[
        { text:"10 55", credit:1 },
        { text:"55 10", credit:0 },
        { text:"10 10", credit:0 },
        { text:"Помилка TypeError", credit:0 }
      ],
      explain:"`int(a)` перетворює рядок `\"5\"` на число 5, тому `int(a) + b = 10`. А `a * 2` — це рядок, повторений двічі: `\"55\"`. `print()` з двома аргументами ставить між ними пробіл." }
  ]},

  /* ---------- 2. if / elif / else, and і or — mcq ---------- */
  { id:"p_base2", type:"mcq", topic:"if / elif / else, and і or", points:0.5, variants:[
    { q:"Що виведе програма?",
      code:"x = 15\nif x > 10 and x < 20:\n    print(\"A\")\nelif x > 10:\n    print(\"B\")\nelse:\n    print(\"C\")",
      options:[
        { text:"A", credit:1 },
        { text:"A\nB", credit:0 },
        { text:"B", credit:0 },
        { text:"C", credit:0 }
      ],
      explain:"`15 > 10` і `15 < 20` — обидві частини правдиві, тому спрацьовує перша гілка й виводиться `A`. `elif` перевіряється лише тоді, коли всі умови вище виявились неправдивими, тож `B` не виводиться." },
    { q:"Гра закінчується, якщо в гравця не лишилось життів (`lives`) АБО скінчився час (`time_left` дорівнює 0).\n\nЯкий варіант правильний?",
      options:[
        { text:"if lives == 0 or time_left == 0:\n    print(\"Game over\")", credit:1 },
        { text:"if lives == 0 or time_left == 0\n    print(\"Game over\")", credit:0.5 },
        { text:"if lives == 0 and time_left == 0:\n    print(\"Game over\")", credit:0 },
        { text:"if lives = 0 or time_left = 0:\n    print(\"Game over\")", credit:0 }
      ],
      explain:"«Або» — це `or`: достатньо, щоб виконалась одна з умов.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після умови — `SyntaxError`.\n- `and` вимагає обох умов одночасно — гравець без життів продовжив би грати.\n- `lives = 0` — це присвоєння, а не порівняння `==`." },
    { q:"Що виведе програма?",
      code:"score = 75\nif score >= 90:\n    print(\"A\")\nelif score >= 70:\n    print(\"B\")\nelif score >= 50:\n    print(\"C\")\nelse:\n    print(\"D\")",
      options:[
        { text:"B", credit:1 },
        { text:"B\nC", credit:0 },
        { text:"C", credit:0 },
        { text:"D", credit:0 }
      ],
      explain:"Умови перевіряються згори донизу, і виконується перша правдива: `75 >= 90` — ні, `75 >= 70` — так, тому `B`. Далі ланцюжок не перевіряється, хоча `75 >= 50` теж правда." }
  ]},

  /* ---------- 3. Цикл for і накопичувач — mcq ---------- */
  { id:"p_for", type:"mcq", topic:"Цикл for і накопичувач", points:0.5, variants:[
    { q:"Що виведе програма?",
      code:"total = 0\nfor i in range(1, 5):\n    total += i\nprint(total)",
      options:[
        { text:"10", credit:1 },
        { text:"15", credit:0 },
        { text:"4", credit:0 },
        { text:"1\n3\n6\n10", credit:0.5 }
      ],
      explain:"`range(1, 5)` дає 1, 2, 3, 4, а `total += i` додає кожне з них: `1 + 2 + 3 + 4 = 10`. `print` стоїть після циклу, тому виводиться один раз.\n\nВідповідь `1 3 6 10` у стовпчик — майже: суму пораховано правильно, але так вийшло б, якби `print(total)` стояв усередині циклу." },
    { q:"Що виведе програма?",
      code:"print(list(range(0, 10, 3)))",
      options:[
        { text:"[0, 3, 6, 9]", credit:1 },
        { text:"[0, 3, 6]", credit:0 },
        { text:"[3, 6, 9]", credit:0 },
        { text:"[0, 3, 6, 9, 12]", credit:0 }
      ],
      explain:"`range(0, 10, 3)` починає з 0 і крокує по 3, поки число менше за 10: 0, 3, 6, 9. Наступне, 12, уже за межею." },
    { q:"Потрібно вивести ряд із 5 цеглин `[][][][][]` в ОДНОМУ рядку.\n\nЯкий варіант правильний?",
      options:[
        { text:"row = \"\"\nfor i in range(5):\n    row += \"[]\"\nprint(row)", credit:1 },
        { text:"row = \"\"\nfor i in range(5)\n    row += \"[]\"\nprint(row)", credit:0.5 },
        { text:"row = \"\"\nfor i in range(5):\n    row = \"[]\"\nprint(row)", credit:0 },
        { text:"row = \"\"\nfor i in range(5):\n    row += \"[]\"\n    print(row)", credit:0 }
      ],
      explain:"`row += \"[]\"` дописує цеглину до рядка, а `print` після циклу виводить готовий ряд один раз.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `for` — `SyntaxError`.\n- `row = \"[]\"` щоразу перезаписує рядок — лишиться одна цеглина.\n- `print` усередині циклу (з відступом) виведе 5 рядків різної довжини." }
  ]},

  /* ---------- 4. Цикл while і break — mcq ---------- */
  { id:"p_while", type:"mcq", topic:"Цикл while і break", points:0.5, variants:[
    { q:"Скільки разів виведеться `Кадр`?",
      code:"frame = 0\nwhile frame < 3:\n    print(\"Кадр\")\n    frame += 1",
      options:[
        { text:"3", credit:1 },
        { text:"4", credit:0 },
        { text:"2", credit:0 },
        { text:"Нескінченно", credit:0 }
      ],
      explain:"Тіло виконується, поки `frame < 3`: для `frame` = 0, 1, 2. Після третього проходу `frame` стає 3, умова неправдива — цикл закінчується." },
    { q:"Який із циклів НІКОЛИ не закінчиться?",
      options:[
        { text:"lives = 3\nwhile lives > 0:\n    print(\"Граємо\")", credit:1 },
        { text:"lives = 3\nwhile lives > 0:\n    lives -= 1", credit:0 },
        { text:"running = True\nwhile running:\n    running = False", credit:0 },
        { text:"x = 0\nwhile True:\n    x += 1\n    if x == 5:\n        break", credit:0 }
      ],
      explain:"Нескінченний той цикл, де `lives` усередині ніколи не змінюється: `lives > 0` завжди правда, і `Граємо` виводиться без кінця.\n\nВ інших циклах умова рано чи пізно стає неправдивою:\n- `lives -= 1` зменшує життя до 0;\n- `running = False` вимикає прапорець;\n- `break` спрацьовує, коли `x` доходить до 5." },
    { q:"Що виведе програма?",
      code:"for i in range(10):\n    if i == 4:\n        break\n    print(i)",
      options:[
        { text:"0\n1\n2\n3", credit:1 },
        { text:"0\n1\n2\n3\n4", credit:0 },
        { text:"4", credit:0 },
        { text:"0\n1\n2\n3\n4\n5\n6\n7\n8\n9", credit:0 }
      ],
      explain:"`break` одразу виходить із циклу. Коли `i` стає 4, спрацьовує `break` — ще ДО `print(i)`, тому 4 уже не виводиться." }
  ]},

  /* ---------- 5. Списки — mcq ---------- */
  { id:"p_list", type:"mcq", topic:"Списки", points:0.5, variants:[
    { q:"Що виведе програма?",
      code:"bricks = [\"red\", \"green\", \"blue\"]\nprint(bricks[-1])",
      options:[
        { text:"blue", credit:1 },
        { text:"red", credit:0 },
        { text:"green", credit:0 },
        { text:"Помилка IndexError", credit:0 }
      ],
      explain:"Індекс `-1` — це останній елемент списку, `-2` — передостанній і так далі. Тут останній — `\"blue\"`." },
    { q:"Потрібно додати цеглину `\"gold\"` у кінець списку `bricks` і вивести, скільки тепер у ньому цеглин.\n\nЯкий варіант правильний?",
      options:[
        { text:"bricks.append(\"gold\")\nprint(len(bricks))", credit:1 },
        { text:"bricks.append(\"gold\")\nprint(len(bricks)", credit:0.5 },
        { text:"bricks = \"gold\"\nprint(len(bricks))", credit:0 },
        { text:"bricks.append(\"gold\")\nprint(bricks.len())", credit:0 }
      ],
      explain:"`append()` додає елемент у кінець, `len()` повертає кількість елементів.\n\nЩо не так з іншими варіантами:\n- Не вистачає закриваючої дужки — `SyntaxError`.\n- `bricks = \"gold\"` замінює список рядком, і `len()` порахує його літери.\n- `bricks.len()` — у списку такого методу немає, `AttributeError`." },
    { q:"Що виведе програма?",
      code:"colors = [\"red\", \"blue\"]\nif \"green\" in colors:\n    print(\"Є\")\nelse:\n    colors.append(\"green\")\nprint(len(colors))",
      options:[
        { text:"3", credit:1 },
        { text:"2", credit:0 },
        { text:"Є\n2", credit:0 },
        { text:"Є", credit:0 }
      ],
      explain:"`\"green\" in colors` перевіряє, чи є такий елемент у списку. Його немає, тому спрацьовує `else` і `\"green\"` додається. Тепер у списку три елементи — `print(len(colors))` виводить `3`." },
    { q:"Що виведе програма?",
      code:"scores = [10, 20, 30]\nscores[1] = 25\nprint(scores)",
      options:[
        { text:"[10, 25, 30]", credit:1 },
        { text:"[25, 20, 30]", credit:0 },
        { text:"[10, 20, 25]", credit:0 },
        { text:"[10, 20, 30, 25]", credit:0 }
      ],
      explain:"Індекси рахуються з нуля, тому `scores[1]` — другий елемент (20). Присвоєння `scores[1] = 25` замінює саме його." }
  ]},

  /* ---------- 6. Функції — mcq ---------- */
  { id:"p_func", type:"mcq", topic:"Функції", points:0.5, variants:[
    { q:"Що виведе програма?",
      code:"def double(x):\n    return x * 2\n\nresult = double(5) + 1\nprint(result)",
      options:[
        { text:"11", credit:1 },
        { text:"12", credit:0 },
        { text:"10", credit:0 },
        { text:"None", credit:0 }
      ],
      explain:"`double(5)` повертає `5 * 2 = 10` — це значення стає на місце виклику, і до нього додається 1." },
    { q:"Потрібна функція `area(w, h)`, яка ПОВЕРТАЄ площу прямокутника.\n\nЯкий варіант правильний?",
      options:[
        { text:"def area(w, h):\n    return w * h", credit:1 },
        { text:"def area(w, h)\n    return w * h", credit:0.5 },
        { text:"def area(w, h):\n    print(w * h)", credit:0 },
        { text:"def area():\n    return w * h", credit:0 }
      ],
      explain:"`return` віддає результат тому, хто викликав функцію.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `def` — `SyntaxError`.\n- `print` лише показує число на екрані, а функція повертає `None` — результат не можна використати далі.\n- `def area():` без параметрів — `w` і `h` функції ніхто не передасть." },
    { q:"Що виведе програма?",
      code:"def greet(name):\n    print(\"Привіт, \" + name)\n\nx = greet(\"Оля\")\nprint(x)",
      options:[
        { text:"Привіт, Оля\nNone", credit:1 },
        { text:"Привіт, Оля\nПривіт, Оля", credit:0 },
        { text:"Привіт, Оля", credit:0.5 },
        { text:"None", credit:0 }
      ],
      explain:"`greet(\"Оля\")` виконує `print` — з'являється `Привіт, Оля`. Але `return` у функції немає, тому вона повертає `None`, і саме `None` потрапляє в `x` і виводиться другим рядком.\n\nВідповідь без `None` — майже: вивід функції правильний, але забуто другий `print(x)`." }
  ]},

  /* ---------- 7. Винятки: try / except — mcq ---------- */
  { id:"p_exc", type:"mcq", topic:"Винятки: try / except", points:0.5, variants:[
    { q:"Що виведе програма, якщо користувач введе `abc`?",
      code:"try:\n    n = int(input())\n    print(\"Число:\", n)\nexcept ValueError:\n    print(\"Це не число\")",
      options:[
        { text:"Це не число", credit:1 },
        { text:"Число: abc", credit:0 },
        { text:"Програма впаде з ValueError", credit:0 },
        { text:"Число: abc\nЦе не число", credit:0 }
      ],
      explain:"`int(\"abc\")` кидає `ValueError`. Помилка сталась усередині `try`, тому Python одразу переходить у `except ValueError` — `print(\"Число:\", n)` так і не виконується." },
    { q:"Потрібно зчитати число, а якщо ввели не число — вивести `Помилка` замість аварійного завершення.\n\nЯкий варіант правильний?",
      options:[
        { text:"try:\n    n = int(input())\nexcept ValueError:\n    print(\"Помилка\")", credit:1 },
        { text:"try:\n    n = int(input())\nexcept ValueError\n    print(\"Помилка\")", credit:0.5 },
        { text:"n = int(input())\ntry:\n    print(n)\nexcept ValueError:\n    print(\"Помилка\")", credit:0 },
        { text:"try:\n    n = input()\nexcept ValueError:\n    print(\"Помилка\")", credit:0 }
      ],
      explain:"У `try` має бути саме той рядок, який може впасти, — тут `int(input())`.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після `except` — `SyntaxError`.\n- `int()` стоїть ДО `try`, тож помилка трапиться поза захистом.\n- Без `int()` `input()` ніколи не кидає `ValueError` — перевірки на число немає." },
    { q:"Що виведе програма?",
      code:"try:\n    print(\"A\")\n    x = 10 / 0\n    print(\"B\")\nexcept ZeroDivisionError:\n    print(\"C\")\nprint(\"D\")",
      options:[
        { text:"A\nC\nD", credit:1 },
        { text:"A\nB\nC\nD", credit:0 },
        { text:"C\nD", credit:0 },
        { text:"A\nD", credit:0 }
      ],
      explain:"`A` виводиться, потім `10 / 0` кидає `ZeroDivisionError` — решта блоку `try` (`print(\"B\")`) пропускається, спрацьовує `except` (`C`). Після `try` / `except` програма йде далі — `D`." }
  ]},

  /* ---------- 8. Ігрова логіка: рух, відбиття, зіткнення — mcq ---------- */
  { id:"p_game", type:"mcq", topic:"Ігрова логіка: рух, відбиття, зіткнення", points:0.5, variants:[
    /* виведено з обігу — надто складно: писати відбиття з нуля */
    { retired:true,
      q:"М'яч летить праворуч:\n- `x` — його координата;\n- `dx = 10` — швидкість;\n- ширина поля — 800.\n\nПотрібно, щоб на кожному кадрі м'яч зсувався, а біля правої стінки відбивався назад. Який варіант правильний?",
      options:[
        { text:"x += dx\nif x >= 800:\n    dx = -dx", credit:1 },
        { text:"x += dx\nif x >= 800\n    dx = -dx", credit:0.5 },
        { text:"x += dx\nif x >= 800:\n    x = -x", credit:0 },
        { text:"x += dx\nif x >= 800:\n    dx = 0", credit:0 }
      ],
      explain:"Відбиття — це зміна напрямку руху: швидкість `dx` міняє знак, і м'яч летить ліворуч.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після умови — `SyntaxError`.\n- `x = -x` змінює координату, а не швидкість — м'яч «телепортується» за ліву межу.\n- `dx = 0` просто зупиняє м'яч біля стінки." },
    { q:"Платформа займає по горизонталі відрізок від `paddle_x` до `paddle_x + 100`. М'яч з координатою `ball_x` опустився до рівня платформи.\n\nЯка умова перевіряє, що м'яч влучив у платформу?",
      options:[
        { text:"if ball_x >= paddle_x and ball_x <= paddle_x + 100:", credit:1 },
        { text:"if ball_x >= paddle_x and ball_x <= paddle_x + 100", credit:0.5 },
        { text:"if ball_x >= paddle_x or ball_x <= paddle_x + 100:", credit:0 },
        { text:"if ball_x == paddle_x:", credit:0 }
      ],
      explain:"М'яч має бути одночасно не лівіше за лівий край і не правіше за правий — це `and`.\n\nЩо не так з іншими варіантами:\n- Немає двокрапки після умови — `SyntaxError`.\n- `or` дає `True` майже для будь-якого `ball_x` — платформа «ловила» б м'яч навіть за межами.\n- `ball_x == paddle_x` перевіряє лише одну точку — лівий край." },
    { q:"Що виведе програма?",
      code:"running = True\nframes = 0\nwhile running:\n    frames += 1\n    if frames == 3:\n        running = False\nprint(frames)",
      options:[
        { text:"3", credit:1 },
        { text:"2", credit:0 },
        { text:"4", credit:0 },
        { text:"Нічого — цикл нескінченний", credit:0 }
      ],
      explain:"`running` — прапорець ігрового циклу. На кожному проході `frames` збільшується; коли `frames` стає 3, прапорець вимикається, і перевірка `while running` на наступному колі завершує цикл. Після циклу виводиться `3`." },
    { q:"Що виведе програма?",
      code:"x = 790\ndx = 10\nx += dx\nif x >= 800:\n    dx = -dx\nprint(x, dx)",
      options:[
        { text:"800 -10", credit:1 },
        { text:"800 10", credit:0 },
        { text:"790 -10", credit:0 },
        { text:"780 -10", credit:0 }
      ],
      explain:"Спершу `x += dx` зсуває м'яч: `790 + 10 = 800`. Умова `800 >= 800` — правда, тому `dx = -dx` міняє знак швидкості на `-10`: м'яч полетить назад.\n\n`print(x, dx)` виводить обидва значення через пробіл — `800 -10`." }
  ]},

  /* ---------- 9. Цикл for — program ---------- */
  { id:"p_for_prog", type:"program", topic:"Цикл for", points:2, variants:[
    /* виведено з обігу — надто складно: зчитувати n чисел у циклі */
    { retired:true, title:"Очки за цеглини",
      intro:"Програма зчитує, кожне з нового рядка:\n- `n` — кількість розбитих цеглин;\n- `n` цілих чисел — очки за кожну цеглину.\n\nВиведи загальний рахунок. Виведи лише число.",
      hint:"`for _ in range(n):` — і в тілі циклу зчитуй чергове число та додавай його до `total`.",
      starter:
`# Зчитай n, потім n цілих чисел (очки за цеглини)
# і виведи їхню суму. Виведи лише число.
#
# Приклад: ввели 3, 10, 20, 30 -> вивести 60
`,
      sample:"3\n10\n20\n30", sampleOut:"60",
      tests:[
        { input:"1\n5", output:"5" },
        { input:"0", output:"0" },
        { input:"4\n1\n1\n1\n1", output:"4" },
        { input:"2\n100\n-50", output:"50" },
        { input:"3\n7\n0\n8", output:"15" }
      ],
      solution:
`n = int(input())
total = 0
for _ in range(n):
    total += int(input())
print(total)
` },
    /* виведено з обігу разом з «Очки за цеглини»: той самий рівень складності */
    { retired:true, title:"Влучання",
      intro:"Програма зчитує, кожне з нового рядка:\n- `n` — кількість ударів;\n- `n` рядків, кожен `hit` (влучив) або `miss` (промах).\n\nВиведи, скільки було влучань. Виведи лише число.",
      hint:"Заведи лічильник `hits = 0` і збільшуй його, коли зчитаний рядок дорівнює `\"hit\"`.",
      starter:
`# Зчитай n, потім n рядків hit або miss
# і виведи, скільки було hit. Виведи лише число.
#
# Приклад: ввели 4, hit, miss, hit, hit -> вивести 3
`,
      sample:"4\nhit\nmiss\nhit\nhit", sampleOut:"3",
      tests:[
        { input:"1\nmiss", output:"0" },
        { input:"2\nhit\nhit", output:"2" },
        { input:"0", output:"0" },
        { input:"5\nmiss\nhit\nmiss\nmiss\nhit", output:"2" }
      ],
      solution:
`n = int(input())
hits = 0
for _ in range(n):
    if input() == "hit":
        hits += 1
print(hits)
` },
    { title:"Рівні гри",
      intro:"Програма зчитує `n` — кількість рівнів. Виведи:\n- рядки `Рівень 1`, `Рівень 2`, ..., `Рівень n`;\n- у кінці — `Гру пройдено!`\n\nДля `n = 0` виводиться лише `Гру пройдено!`",
      hint:"`range(1, n + 1)` дає номери від 1 до `n`. Останній рядок — після циклу, без відступу.",
      starter:
`# Зчитай n і виведи рядки Рівень 1 ... Рівень n,
# а потім Гру пройдено!
#
# Приклад: ввели 2 -> вивести
# Рівень 1
# Рівень 2
# Гру пройдено!
`,
      sample:"2", sampleOut:"Рівень 1\nРівень 2\nГру пройдено!",
      tests:[
        { input:"1", output:"Рівень 1\nГру пройдено!" },
        { input:"0", output:"Гру пройдено!" },
        { input:"4", output:"Рівень 1\nРівень 2\nРівень 3\nРівень 4\nГру пройдено!" },
        { input:"3", output:"Рівень 1\nРівень 2\nРівень 3\nГру пройдено!" }
      ],
      solution:
`n = int(input())
for level in range(1, n + 1):
    print(f"Рівень {level}")
print("Гру пройдено!")
` },
    { title:"Очки за цеглини",
      intro:"Програма зчитує `n` — кількість розбитих цеглин. Перша цеглина дає 10 очок, друга — 20, третя — 30 і так далі: кожна наступна на 10 більше.\n\nВиведи загальний рахунок за всі `n` цеглин. Виведи лише число.",
      hint:"Заведи `total = 0` і в циклі `for i in range(1, n + 1):` додавай до нього `i * 10`.",
      starter:
`# Зчитай n - кількість цеглин. Цеглина номер i дає i * 10 очок:
# 10, 20, 30, ... Виведи загальний рахунок. Виведи лише число.
#
# Приклад: ввели 3 -> вивести 60   (10 + 20 + 30)
`,
      sample:"3", sampleOut:"60",
      tests:[
        { input:"1", output:"10" },
        { input:"0", output:"0" },
        { input:"2", output:"30" },
        { input:"4", output:"100" },
        { input:"10", output:"550" }
      ],
      solution:
`n = int(input())
total = 0
for i in range(1, n + 1):
    total += i * 10
print(total)
` },
    { title:"Бонуси за рівні",
      intro:"Програма зчитує `n` — кількість пройдених рівнів. За рівень номер `i` гравець отримує `i * 100` очок.\n\nДля кожного рівня від 1 до `n` виведи рядок у такому форматі:\n`Рівень <номер>: <очки> очок`",
      hint:"`range(1, n + 1)` дає номери рівнів, а рядок зручно зібрати f-рядком: `f\"Рівень {i}: {i * 100} очок\"`.",
      starter:
`# Зчитай n і для кожного рівня від 1 до n виведи рядок:
# Рівень <номер>: <номер * 100> очок
#
# Приклад: ввели 2 -> вивести
# Рівень 1: 100 очок
# Рівень 2: 200 очок
`,
      sample:"3", sampleOut:"Рівень 1: 100 очок\nРівень 2: 200 очок\nРівень 3: 300 очок",
      tests:[
        { input:"1", output:"Рівень 1: 100 очок" },
        { input:"2", output:"Рівень 1: 100 очок\nРівень 2: 200 очок" },
        { input:"4", output:"Рівень 1: 100 очок\nРівень 2: 200 очок\nРівень 3: 300 очок\nРівень 4: 400 очок" },
        { input:"5", output:"Рівень 1: 100 очок\nРівень 2: 200 очок\nРівень 3: 300 очок\nРівень 4: 400 очок\nРівень 5: 500 очок" }
      ],
      solution:
`n = int(input())
for i in range(1, n + 1):
    print(f"Рівень {i}: {i * 100} очок")
` }
  ]},

  /* ---------- 10. Цикл while — program ---------- */
  { id:"p_while_prog", type:"program", topic:"Цикл while", points:2, variants:[
    /* виведено з обігу — незрозуміла умова (кадри до висоти <= 0) */
    { retired:true, title:"М'яч падає",
      intro:"Програма зчитує два цілі додатні числа, кожне з нового рядка:\n- `h` — висота, з якої падає м'яч;\n- `s` — на скільки він опускається за кадр.\n\nВиведи, за скільки кадрів м'яч торкнеться землі — висота стане 0 або менше. Виведи лише число.",
      hint:"`while h > 0:` — зменшуй `h` на `s` і рахуй кадри в окремій змінній.",
      starter:
`# Зчитай висоту h і крок s (цілі числа > 0).
# Кожен кадр h зменшується на s. Виведи, за скільки кадрів
# h стане <= 0. Виведи лише число.
#
# Приклад: ввели 100 і 10 -> вивести 10
`,
      sample:"100\n10", sampleOut:"10",
      tests:[
        { input:"95\n10", output:"10" },
        { input:"5\n10", output:"1" },
        { input:"1\n1", output:"1" },
        { input:"50\n7", output:"8" },
        { input:"30\n3", output:"10" }
      ],
      solution:
`h = int(input())
s = int(input())
frames = 0
while h > 0:
    h -= s
    frames += 1
print(frames)
` },
    /* виведено з обігу — надто складно: подвоєння швидкості */
    { retired:true, title:"Розгін платформи",
      intro:"Швидкість платформи починається з 1 і щокадру подвоюється: 1 → 2 → 4 → 8 → ...\n\nПрограма зчитує ціле число `max`. Виведи, скільки кадрів потрібно, щоб швидкість стала не меншою за `max`. Якщо `max` — 1 або менше, виведи `0`. Виведи лише число.",
      hint:"`speed = 1`, `frames = 0`; поки `speed < max` — `speed *= 2` і `frames += 1`.",
      starter:
`# Швидкість спершу 1 і щокадру подвоюється.
# Зчитай max і виведи, за скільки кадрів швидкість
# стане >= max. Виведи лише число.
#
# Приклад: ввели 10 -> вивести 4   (1 -> 2 -> 4 -> 8 -> 16)
`,
      sample:"10", sampleOut:"4",
      tests:[
        { input:"1", output:"0" },
        { input:"2", output:"1" },
        { input:"100", output:"7" },
        { input:"64", output:"6" },
        { input:"65", output:"7" }
      ],
      solution:
`limit = int(input())
speed = 1
frames = 0
while speed < limit:
    speed *= 2
    frames += 1
print(frames)
` },
    /* виведено з обігу — надто складно: input() у циклі while True з break */
    { retired:true, title:"Вгадай до перемоги",
      intro:"Загадане число — 7. Програма зчитує спроби гравця, кожну з нового рядка, доки він не вгадає.\n\nЩойно вгадав — виведи `Спроб: <кількість>` і більше нічого не зчитуй.",
      hint:"`while True:` — зчитуй число, збільшуй лічильник, а коли число дорівнює 7 — `break`.",
      starter:
`# Загадане число - 7. Зчитуй спроби, доки гравець не вгадає,
# і виведи Спроб: <кількість>. Після вгадування більше
# нічого не зчитуй.
#
# Приклад: ввели 3, 9, 7 -> вивести Спроб: 3
`,
      sample:"3\n9\n7", sampleOut:"Спроб: 3",
      tests:[
        { input:"7", output:"Спроб: 1" },
        { input:"1\n2\n3\n4\n5\n6\n7", output:"Спроб: 7" },
        { input:"10\n7", output:"Спроб: 2" },
        { input:"7\n7\n7", output:"Спроб: 1" }
      ],
      solution:
`tries = 0
while True:
    guess = int(input())
    tries += 1
    if guess == 7:
        break
print(f"Спроб: {tries}")
` },
    { title:"Розгін платформи",
      intro:"Швидкість платформи починається з 0 і щокадру зростає на 3: 0 → 3 → 6 → 9 → ...\n\nПрограма зчитує ціле число `max`. Виведи, за скільки кадрів швидкість стане не меншою за `max`. Якщо `max` — 0 або менше, виведи `0`. Виведи лише число.",
      hint:"`speed = 0`, `frames = 0`; поки `speed < max` — `speed += 3` і `frames += 1`.",
      starter:
`# Швидкість спершу 0 і щокадру зростає на 3.
# Зчитай max і виведи, за скільки кадрів швидкість
# стане >= max. Виведи лише число.
#
# Приклад: ввели 10 -> вивести 4   (0 -> 3 -> 6 -> 9 -> 12)
`,
      sample:"10", sampleOut:"4",
      tests:[
        { input:"0", output:"0" },
        { input:"3", output:"1" },
        { input:"1", output:"1" },
        { input:"9", output:"3" },
        { input:"30", output:"10" },
        { input:"31", output:"11" }
      ],
      solution:
`limit = int(input())
speed = 0
frames = 0
while speed < limit:
    speed += 3
    frames += 1
print(frames)
` },
    { title:"М'яч падає",
      intro:"Програма зчитує ціле число `h` — висоту, з якої падає м'яч. Щокадру м'яч опускається на 10.\n\nПоки висота більша за 0, виводь її — кожну з нового рядка. Коли м'яч торкнеться землі (висота стане 0 або менше), виведи `Приземлився!`",
      hint:"`while h > 0:` — виведи `h`, потім зменш її: `h -= 10`. `Приземлився!` виводиться після циклу, без відступу.",
      starter:
`# Зчитай висоту h. Поки h > 0: виведи h і зменш її на 10.
# Після циклу виведи Приземлився!
#
# Приклад: ввели 35 -> вивести
# 35
# 25
# 15
# 5
# Приземлився!
`,
      sample:"35", sampleOut:"35\n25\n15\n5\nПриземлився!",
      tests:[
        { input:"10", output:"10\nПриземлився!" },
        { input:"0", output:"Приземлився!" },
        { input:"1", output:"1\nПриземлився!" },
        { input:"30", output:"30\n20\n10\nПриземлився!" },
        { input:"42", output:"42\n32\n22\n12\n2\nПриземлився!" }
      ],
      solution:
`h = int(input())
while h > 0:
    print(h)
    h -= 10
print("Приземлився!")
` },
    { title:"Життя героя",
      intro:"Програма зчитує ціле число `lives` — скільки життів у героя. Щораунду він втрачає одне життя.\n\nПоки життів більше за 0, виводь рядок `Життів: <кількість>`. Коли життя скінчаться, виведи `Гру закінчено`",
      hint:"`while lives > 0:` — виведи рядок f-рядком і зменш `lives` на 1. `Гру закінчено` виводиться після циклу, без відступу.",
      starter:
`# Зчитай lives. Поки lives > 0: виведи Життів: <lives>
# і зменш lives на 1. Після циклу виведи Гру закінчено
#
# Приклад: ввели 3 -> вивести
# Життів: 3
# Життів: 2
# Життів: 1
# Гру закінчено
`,
      sample:"3", sampleOut:"Життів: 3\nЖиттів: 2\nЖиттів: 1\nГру закінчено",
      tests:[
        { input:"1", output:"Життів: 1\nГру закінчено" },
        { input:"0", output:"Гру закінчено" },
        { input:"2", output:"Життів: 2\nЖиттів: 1\nГру закінчено" },
        { input:"5", output:"Життів: 5\nЖиттів: 4\nЖиттів: 3\nЖиттів: 2\nЖиттів: 1\nГру закінчено" }
      ],
      solution:
`lives = int(input())
while lives > 0:
    print(f"Життів: {lives}")
    lives -= 1
print("Гру закінчено")
` }
  ]},

  /* ---------- 11. Списки — program ---------- */
  { id:"p_list_prog", type:"program", topic:"Списки", points:2, variants:[
    /* виведено з обігу — надто складно: зчитати n значень і порахувати */
    { retired:true, title:"Червоні цеглини",
      intro:"Програма зчитує, кожне з нового рядка:\n- `n` — кількість цеглин;\n- `n` кольорів цеглин.\n\nЗбери кольори в список і виведи, скільки в ньому червоних цеглин (`red`). Виведи лише число.",
      hint:"Спершу `bricks = []` і `bricks.append(...)` у циклі, потім окремим циклом по списку порахуй `\"red\"`.",
      starter:
`# Зчитай n, потім n кольорів. Збери їх у список
# і виведи, скільки серед них red. Виведи лише число.
#
# Приклад: ввели 4, red, blue, red, green -> вивести 2
`,
      sample:"4\nred\nblue\nred\ngreen", sampleOut:"2",
      tests:[
        { input:"1\nblue", output:"0" },
        { input:"3\nred\nred\nred", output:"3" },
        { input:"0", output:"0" },
        { input:"5\ngreen\nred\nblue\nblue\nred", output:"2" }
      ],
      solution:
`n = int(input())
bricks = []
for _ in range(n):
    bricks.append(input())
count = 0
for color in bricks:
    if color == "red":
        count += 1
print(count)
` },
    /* виведено з обігу — надто складно: змінювати список за індексами */
    { retired:true, title:"Удар по стіні",
      intro:"Програма зчитує, кожне з нового рядка:\n- `n` — кількість цеглин;\n- `n` цілих чисел — міцність кожної цеглини.\n\nЗбери їх у список. М'яч б'є по всій стіні, і міцність кожної цеглини зменшується на 1. Виведи новий список через `print(список)`, наприклад `[2, 0, 1]`.",
      hint:"Можна пройтись по індексах: `for i in range(len(bricks)): bricks[i] -= 1`. Або зібрати новий список через `append`.",
      starter:
`# Зчитай n, потім n цілих чисел (міцність цеглин) у список.
# Зменш кожне число на 1 і виведи список через print(bricks).
#
# Приклад: ввели 3, 3, 1, 2 -> вивести [2, 0, 1]
`,
      sample:"3\n3\n1\n2", sampleOut:"[2, 0, 1]",
      tests:[
        { input:"1\n5", output:"[4]" },
        { input:"0", output:"[]" },
        { input:"4\n1\n1\n1\n1", output:"[0, 0, 0, 0]" },
        { input:"2\n10\n0", output:"[9, -1]" }
      ],
      solution:
`n = int(input())
bricks = []
for _ in range(n):
    bricks.append(int(input()))
for i in range(len(bricks)):
    bricks[i] -= 1
print(bricks)
` },
    /* виведено з обігу — надто складно: зчитати n значень у список */
    { retired:true, title:"Перший, останній, скільки",
      intro:"Програма зчитує, кожне з нового рядка:\n- `n` — кількість рівнів (щонайменше 1);\n- `n` назв рівнів.\n\nЗбери їх у список і виведи три рядки:\n- першу назву;\n- останню назву;\n- кількість рівнів.",
      hint:"Перший елемент — `levels[0]`, останній — `levels[-1]`, кількість — `len(levels)`.",
      starter:
`# Зчитай n (>= 1), потім n назв рівнів у список.
# Виведи три рядки: перша назва, остання назва, кількість.
#
# Приклад: ввели 3, ліс, печера, замок -> вивести
# ліс
# замок
# 3
`,
      sample:"3\nліс\nпечера\nзамок", sampleOut:"ліс\nзамок\n3",
      tests:[
        { input:"1\nкосмос", output:"космос\nкосмос\n1" },
        { input:"2\nA\nB", output:"A\nB\n2" },
        { input:"4\nw1\nw2\nw3\nw4", output:"w1\nw4\n4" },
        { input:"5\nа\nб\nв\nг\nґ", output:"а\nґ\n5" }
      ],
      solution:
`n = int(input())
levels = []
for _ in range(n):
    levels.append(input())
print(levels[0])
print(levels[-1])
print(len(levels))
` },
    /* виведено з обігу — надто складно: зчитати n чисел у список */
    { retired:true, title:"Міцність стіни",
      intro:"Програма зчитує, кожне з нового рядка:\n- `n` — кількість цеглин;\n- `n` цілих чисел — міцність кожної цеглини.\n\nЗбери міцності в список і виведи два рядки:\n- сам список через `print(список)`, наприклад `[3, 1, 2]`;\n- загальну міцність стіни — суму всіх чисел.",
      hint:"`bricks = []`, а в циклі — `bricks.append(int(input()))`. Суму дає `sum(bricks)`.",
      starter:
`# Зчитай n, потім n цілих чисел (міцність цеглин) у список.
# Виведи два рядки: сам список і суму всіх чисел.
#
# Приклад: ввели 3, 3, 1, 2 -> вивести
# [3, 1, 2]
# 6
`,
      sample:"3\n3\n1\n2", sampleOut:"[3, 1, 2]\n6",
      tests:[
        { input:"1\n5", output:"[5]\n5" },
        { input:"0", output:"[]\n0" },
        { input:"4\n1\n1\n1\n1", output:"[1, 1, 1, 1]\n4" },
        { input:"2\n10\n0", output:"[10, 0]\n10" }
      ],
      solution:
`n = int(input())
bricks = []
for _ in range(n):
    bricks.append(int(input()))
print(bricks)
print(sum(bricks))
` },
    { title:"Є така цеглина?",
      intro:"У стартовому коді вже є список кольорів:\n`colors = [\"red\", \"green\", \"blue\", \"gold\"]`\n\nПрограма зчитує колір. Виведи `Є`, якщо такий колір є в списку, інакше — `Немає`.",
      hint:"Перевірити, чи є елемент у списку, можна оператором `in`: `if color in colors:`.",
      starter:
`colors = ["red", "green", "blue", "gold"]

# Зчитай колір і виведи Є, якщо він є в списку colors,
# інакше - Немає.
#
# Приклад: ввели blue -> вивести Є
`,
      sample:"blue", sampleOut:"Є",
      tests:[
        { input:"red", output:"Є" },
        { input:"gold", output:"Є" },
        { input:"white", output:"Немає" },
        { input:"Red", output:"Немає" },
        { input:"green", output:"Є" }
      ],
      solution:
`colors = ["red", "green", "blue", "gold"]
color = input()
if color in colors:
    print("Є")
else:
    print("Немає")
` },
    { title:"Цеглина за номером",
      intro:"У стартовому коді вже є список цеглин:\n`bricks = [\"red\", \"green\", \"blue\", \"gold\", \"white\"]`\n\nПрограма зчитує номер цеглини — ціле число від 1 до 5. Виведи колір цієї цеглини.\n\nЗверни увагу: номери рахуються з 1, а індекси списку — з 0.",
      hint:"Цеглина номер 1 — це `bricks[0]`, тобто індекс на 1 менший за номер: `bricks[n - 1]`.",
      starter:
`bricks = ["red", "green", "blue", "gold", "white"]

# Зчитай номер цеглини (від 1 до 5) і виведи її колір.
# Номери рахуються з 1, а індекси списку - з 0.
#
# Приклад: ввели 2 -> вивести green
`,
      sample:"2", sampleOut:"green",
      tests:[
        { input:"1", output:"red" },
        { input:"5", output:"white" },
        { input:"3", output:"blue" },
        { input:"4", output:"gold" }
      ],
      solution:
`bricks = ["red", "green", "blue", "gold", "white"]
n = int(input())
print(bricks[n - 1])
` },
    { title:"Нова цеглина",
      intro:"У стартовому коді вже є список цеглин:\n`bricks = [\"red\", \"green\"]`\n\nПрограма зчитує колір нової цеглини. Додай її в кінець списку й виведи два рядки:\n- сам список через `print(bricks)`;\n- скільки тепер у ньому цеглин.",
      hint:"`bricks.append(color)` додає елемент у кінець списку, а `len(bricks)` дає кількість.",
      starter:
`bricks = ["red", "green"]

# Зчитай колір, додай його в кінець списку bricks
# і виведи два рядки: сам список і кількість цеглин.
#
# Приклад: ввели blue -> вивести
# ['red', 'green', 'blue']
# 3
`,
      sample:"blue", sampleOut:"['red', 'green', 'blue']\n3",
      tests:[
        { input:"gold", output:"['red', 'green', 'gold']\n3" },
        { input:"red", output:"['red', 'green', 'red']\n3" },
        { input:"white", output:"['red', 'green', 'white']\n3" },
        { input:"light blue", output:"['red', 'green', 'light blue']\n3" }
      ],
      solution:
`bricks = ["red", "green"]
color = input()
bricks.append(color)
print(bricks)
print(len(bricks))
` }
  ]},

  /* ---------- 12. Функції — code ---------- */
  { id:"p_func_code", type:"code", topic:"Функції", points:2, variants:[
    { title:"Відбиття від стінок", fn:"bounce", sig:"bounce(x, dx, width)",
      intro:"Параметри функції:\n- `x` — координата м'яча;\n- `dx` — його швидкість;\n- `width` — ширина поля.\n\nПоверни нову швидкість:\n- `-dx` — якщо м'яч біля лівої (`x <= 0`) або правої (`x >= width`) стінки;\n- `dx` — в усіх інших випадках.",
      hint:"Одна умова з `or`: `if x <= 0 or x >= width:` — `return -dx`, а інакше `return dx`.",
      starter:
`def bounce(x, dx, width):
    """
    x - координата м'яча, dx - швидкість, width - ширина поля.

    Повернути НОВУ швидкість:
      -dx  якщо x <= 0 або x >= width (м'яч біля стінки)
       dx  в усіх інших випадках

    Приклад: bounce(400, 5, 800) -> 5
    Приклад: bounce(800, 5, 800) -> -5
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("bounce ще не реалізовано")
`,
      tests:[
        { args:[400,5,800], expected:5 },
        { args:[800,5,800], expected:-5 },
        { args:[0,-5,800], expected:5 },
        { args:[810,7,800], expected:-7 },
        { args:[-3,-2,800], expected:2 },
        { args:[1,3,800], expected:3 }
      ],
      solution:
`def bounce(x, dx, width):
    if x <= 0 or x >= width:
        return -dx
    return dx
` },
    /* виведено з обігу — незручно: координати й межі платформи */
    { retired:true, title:"Влучання в платформу", fn:"hit_paddle", sig:"hit_paddle(ball_x, paddle_x, paddle_w)",
      intro:"Параметри функції:\n- `ball_x` — координата м'яча;\n- `paddle_x` — лівий край платформи;\n- `paddle_w` — її ширина.\n\nПоверни `True`, якщо м'яч над платформою — від `paddle_x` до `paddle_x + paddle_w` включно, інакше — `False`.",
      hint:"Дві межі одночасно — це `and`: `ball_x >= paddle_x and ball_x <= paddle_x + paddle_w`.",
      starter:
`def hit_paddle(ball_x, paddle_x, paddle_w):
    """
    ball_x - координата м'яча, paddle_x - лівий край платформи,
    paddle_w - ширина платформи.

    Повернути True, якщо paddle_x <= ball_x <= paddle_x + paddle_w,
    інакше - False.

    Приклад: hit_paddle(150, 100, 80) -> True
    Приклад: hit_paddle(90, 100, 80) -> False
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("hit_paddle ще не реалізовано")
`,
      tests:[
        { args:[150,100,80], expected:true },
        { args:[90,100,80], expected:false },
        { args:[100,100,80], expected:true },
        { args:[180,100,80], expected:true },
        { args:[181,100,80], expected:false },
        { args:[0,0,50], expected:true }
      ],
      solution:
`def hit_paddle(ball_x, paddle_x, paddle_w):
    return ball_x >= paddle_x and ball_x <= paddle_x + paddle_w
` },
    { title:"Очки за цеглину", fn:"brick_points", sig:"brick_points(color)",
      intro:"`color` — колір розбитої цеглини. Поверни кількість очок:\n- `\"red\"` — 30;\n- `\"green\"` — 20;\n- `\"blue\"` — 10;\n- будь-який інший колір — 0.",
      hint:"`if` / `elif` / `else` з `return` у кожній гілці.",
      starter:
`def brick_points(color):
    """
    color - колір розбитої цеглини (рядок).

    Повернути очки:
      30  якщо color == "red"
      20  якщо color == "green"
      10  якщо color == "blue"
       0  для будь-якого іншого кольору

    Приклад: brick_points("red") -> 30
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("brick_points ще не реалізовано")
`,
      tests:[
        { args:["red"], expected:30 },
        { args:["green"], expected:20 },
        { args:["blue"], expected:10 },
        { args:["gold"], expected:0 },
        { args:["Red"], expected:0 }
      ],
      solution:
`def brick_points(color):
    if color == "red":
        return 30
    elif color == "green":
        return 20
    elif color == "blue":
        return 10
    else:
        return 0
` },
    { title:"Рівень пройдено?", fn:"level_passed", sig:"level_passed(score, lives)",
      intro:"Параметри функції:\n- `score` — скільки очок набрав гравець;\n- `lives` — скільки життів у нього лишилось.\n\nРівень пройдено, якщо гравець набрав щонайменше 100 очок І в нього лишилось хоча б одне життя. Поверни `True`, якщо рівень пройдено, інакше — `False`.",
      hint:"Обидві умови одночасно — це `and`: `score >= 100 and lives > 0`.",
      starter:
`def level_passed(score, lives):
    """
    score - очки гравця, lives - скільки життів лишилось.

    Повернути True, якщо score >= 100 і lives > 0,
    інакше - False.

    Приклад: level_passed(150, 2) -> True
    Приклад: level_passed(150, 0) -> False
    """
    # TODO: прибери рядок нижче і напиши реалізацію:
    raise NotImplementedError("level_passed ще не реалізовано")
`,
      tests:[
        { args:[150,2], expected:true },
        { args:[100,1], expected:true },
        { args:[99,3], expected:false },
        { args:[150,0], expected:false },
        { args:[0,0], expected:false },
        { args:[100,0], expected:false }
      ],
      solution:
`def level_passed(score, lives):
    return score >= 100 and lives > 0
` }
  ]}
  ]
});
