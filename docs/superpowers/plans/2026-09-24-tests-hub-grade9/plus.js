/* ==========================================================================
   Розширена самостійна робота для 9 класу (#/check-9plus): 12 завдань,
   12 балів. Для учня, який уже вчив Python на курсі з іграми (Breakout):
   мало простого, більше циклів і списків, плюс функції, винятки й базова
   ігрова логіка. Сторінка доступна лише за прямим посиланням — її немає
   в меню й на сторінці «Самостійні роботи».
   Вісім питань з варіантами по 0.5 бала і чотири практичні по 2 бали:
   три «програми» (input()/print()) і одна функція з прихованими тестами.
   Стартовий код уже виданих варіантів не змінюй — від нього залежать
   посилання на результати (див. js/checks/core.js).
   ========================================================================== */
"use strict";
CheckEngine.define({
  slug:"check-9plus",
  storage:"pyguide_check9plus",
  title:"Самостійна робота — 9 клас, розширений варіант",
  lede:"Самостійна робота на <b>12 балів</b> для тих, хто вже програмував: цикли <code>for</code> і <code>while</code>, <code>break</code>, списки, функції, <code>try</code>/<code>except</code> і трохи логіки ігор на кшталт Breakout. Вісім коротких питань по 0.5 бала і чотири практичні завдання по 2 бали.",
  rules:"<b>Одна спроба.</b> Результат зберігається в цьому браузері одразу після натискання «Завершити тест» і показується щоразу, коли повертаєшся на цю сторінку: переграти не можна. У практичних завданнях можна натискати «Запустити» й дивитись, що виводить твій код, — але без підказки, чи пройде він приховані перевірки.",
  slots:[

  /* ---------- 1. print, input, int() і f-рядки — mcq ---------- */
  { id:"p_base1", type:"mcq", topic:"print, input, int() і f-рядки", points:0.5, variants:[
    { q:"Користувач вводить свій рахунок. Потрібно вивести Рахунок: <рахунок + 100> (бонус 100 очок). Який варіант правильний?",
      options:[
        { text:"score = int(input())\nprint(f\"Рахунок: {score + 100}\")", credit:1 },
        { text:"score = int(input())\nprint(f\"Рахунок: {score + 100}\"", credit:0.5 },
        { text:"score = input()\nprint(f\"Рахунок: {score + 100}\")", credit:0 },
        { text:"score = int(input())\nprint(\"Рахунок: {score + 100}\")", credit:0 }
      ],
      explain:"Число з input() треба отримати через int(), а вираз у f-рядку пишеться у фігурних дужках. У другому варіанті не вистачає дужки print — SyntaxError. У третьому score — рядок, і score + 100 дасть TypeError. У четвертому немає f — виведеться текст {score + 100} буквально." },
    { q:"Що виведе програма?",
      code:"lives = 3\nlives = lives - 1\nprint(f\"Життів: {lives * 2}\")",
      options:[
        { text:"Життів: 4", credit:1 },
        { text:"Життів: 6", credit:0 },
        { text:"Життів: {lives * 2}", credit:0 },
        { text:"Життів: 2", credit:0 }
      ],
      explain:"Спершу lives стає 3 - 1 = 2, потім у f-рядку обчислюється вираз lives * 2 = 4." },
    { q:"Що виведе програма?",
      code:"a = \"5\"\nb = 5\nprint(int(a) + b, a * 2)",
      options:[
        { text:"10 55", credit:1 },
        { text:"55 10", credit:0 },
        { text:"10 10", credit:0 },
        { text:"Помилка TypeError", credit:0 }
      ],
      explain:"int(a) перетворює рядок \"5\" на число 5, тому int(a) + b = 10. А a * 2 — це рядок, повторений двічі: \"55\". print() з двома аргументами ставить між ними пробіл." }
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
      explain:"15 > 10 і 15 < 20 — обидві частини правдиві, тому спрацьовує перша гілка й виводиться A. elif перевіряється лише тоді, коли всі умови вище виявились неправдивими, тож B не виводиться." },
    { q:"Гра закінчується, якщо в гравця не лишилось життів АБО скінчився час (time_left дорівнює 0). Який варіант правильний?",
      options:[
        { text:"if lives == 0 or time_left == 0:\n    print(\"Game over\")", credit:1 },
        { text:"if lives == 0 or time_left == 0\n    print(\"Game over\")", credit:0.5 },
        { text:"if lives == 0 and time_left == 0:\n    print(\"Game over\")", credit:0 },
        { text:"if lives = 0 or time_left = 0:\n    print(\"Game over\")", credit:0 }
      ],
      explain:"«Або» — це or: достатньо, щоб виконалась одна з умов. У другому варіанті логіка правильна, але немає двокрапки. У третьому and вимагає обох умов одночасно — гравець без життів продовжив би грати. У четвертому замість порівняння == стоїть присвоєння =." },
    { q:"Що виведе програма?",
      code:"score = 75\nif score >= 90:\n    print(\"A\")\nelif score >= 70:\n    print(\"B\")\nelif score >= 50:\n    print(\"C\")\nelse:\n    print(\"D\")",
      options:[
        { text:"B", credit:1 },
        { text:"B\nC", credit:0 },
        { text:"C", credit:0 },
        { text:"D", credit:0 }
      ],
      explain:"Умови перевіряються згори донизу, і виконується перша правдива: 75 >= 90 — ні, 75 >= 70 — так, тому B. Далі ланцюжок не перевіряється, хоча 75 >= 50 теж правда." }
  ]},

  /* ---------- 3. Цикл for і накопичувач — mcq ---------- */
  { id:"p_for", type:"mcq", topic:"Цикл for і накопичувач", points:0.5, variants:[
    { q:"Що виведе програма?",
      code:"total = 0\nfor i in range(1, 5):\n    total += i\nprint(total)",
      options:[
        { text:"10", credit:1 },
        { text:"15", credit:0 },
        { text:"4", credit:0 },
        { text:"1\n3\n6\n10", credit:0 }
      ],
      explain:"range(1, 5) дає 1, 2, 3, 4, а total += i додає кожне з них: 1 + 2 + 3 + 4 = 10. print стоїть після циклу, тому виводиться один раз." },
    { q:"Що виведе програма?",
      code:"print(list(range(0, 10, 3)))",
      options:[
        { text:"[0, 3, 6, 9]", credit:1 },
        { text:"[0, 3, 6]", credit:0 },
        { text:"[3, 6, 9]", credit:0 },
        { text:"[0, 3, 6, 9, 12]", credit:0 }
      ],
      explain:"range(0, 10, 3) починає з 0 і крокує по 3, поки число менше за 10: 0, 3, 6, 9. Наступне, 12, уже за межею." },
    { q:"Потрібно вивести ряд із 5 цеглин [][][][][] в ОДНОМУ рядку. Який варіант правильний?",
      options:[
        { text:"row = \"\"\nfor i in range(5):\n    row += \"[]\"\nprint(row)", credit:1 },
        { text:"row = \"\"\nfor i in range(5)\n    row += \"[]\"\nprint(row)", credit:0.5 },
        { text:"row = \"\"\nfor i in range(5):\n    row = \"[]\"\nprint(row)", credit:0 },
        { text:"row = \"\"\nfor i in range(5):\n    row += \"[]\"\n    print(row)", credit:0 }
      ],
      explain:"row += \"[]\" дописує цеглину до рядка, а print після циклу виводить готовий ряд один раз. У другому варіанті немає двокрапки після for. У третьому = щоразу перезаписує рядок — лишиться одна цеглина. У четвертому print усередині циклу — виведеться 5 рядків різної довжини." }
  ]},

  /* ---------- 4. Цикл while і break — mcq ---------- */
  { id:"p_while", type:"mcq", topic:"Цикл while і break", points:0.5, variants:[
    { q:"Скільки разів виведеться Кадр?",
      code:"frame = 0\nwhile frame < 3:\n    print(\"Кадр\")\n    frame += 1",
      options:[
        { text:"3", credit:1 },
        { text:"4", credit:0 },
        { text:"2", credit:0 },
        { text:"Нескінченно", credit:0 }
      ],
      explain:"Тіло виконується, поки frame < 3: для frame = 0, 1, 2. Після третього проходу frame стає 3, умова неправдива — цикл закінчується." },
    { q:"Який із циклів НІКОЛИ не закінчиться?",
      options:[
        { text:"lives = 3\nwhile lives > 0:\n    print(\"Граємо\")", credit:1 },
        { text:"lives = 3\nwhile lives > 0:\n    lives -= 1", credit:0 },
        { text:"running = True\nwhile running:\n    running = False", credit:0 },
        { text:"x = 0\nwhile True:\n    x += 1\n    if x == 5:\n        break", credit:0 }
      ],
      explain:"У першому варіанті lives усередині циклу ніколи не змінюється, тому lives > 0 завжди правда. В інших циклах умова рано чи пізно стає неправдивою (lives зменшується, running стає False) або спрацьовує break." },
    { q:"Що виведе програма?",
      code:"for i in range(10):\n    if i == 4:\n        break\n    print(i)",
      options:[
        { text:"0\n1\n2\n3", credit:1 },
        { text:"0\n1\n2\n3\n4", credit:0 },
        { text:"4", credit:0 },
        { text:"0\n1\n2\n3\n4\n5\n6\n7\n8\n9", credit:0 }
      ],
      explain:"break одразу виходить із циклу. Коли i стає 4, спрацьовує break — ще ДО print(i), тому 4 уже не виводиться." }
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
      explain:"Індекс -1 — це останній елемент списку, -2 — передостанній і так далі. Тут останній — \"blue\"." },
    { q:"Потрібно додати цеглину \"gold\" у кінець списку bricks і вивести, скільки тепер у ньому цеглин. Який варіант правильний?",
      options:[
        { text:"bricks.append(\"gold\")\nprint(len(bricks))", credit:1 },
        { text:"bricks.append(\"gold\")\nprint(len(bricks)", credit:0.5 },
        { text:"bricks = \"gold\"\nprint(len(bricks))", credit:0 },
        { text:"bricks.append(\"gold\")\nprint(bricks.len())", credit:0 }
      ],
      explain:"append() додає елемент у кінець, len() повертає кількість елементів. У другому варіанті не вистачає дужки — SyntaxError. У третьому список замінено рядком \"gold\", і len() порахує його літери. У четвертому len викликано як метод — у списку такого методу немає (AttributeError)." },
    { q:"Що виведе програма?",
      code:"colors = [\"red\", \"blue\"]\nif \"green\" in colors:\n    print(\"Є\")\nelse:\n    colors.append(\"green\")\nprint(len(colors))",
      options:[
        { text:"3", credit:1 },
        { text:"2", credit:0 },
        { text:"Є\n2", credit:0 },
        { text:"Є", credit:0 }
      ],
      explain:"\"green\" in colors перевіряє, чи є такий елемент у списку. Його немає, тому спрацьовує else і \"green\" додається. Тепер у списку три елементи — print(len(colors)) виводить 3." },
    { q:"Що виведе програма?",
      code:"scores = [10, 20, 30]\nscores[1] = 25\nprint(scores)",
      options:[
        { text:"[10, 25, 30]", credit:1 },
        { text:"[25, 20, 30]", credit:0 },
        { text:"[10, 20, 25]", credit:0 },
        { text:"[10, 20, 30, 25]", credit:0 }
      ],
      explain:"Індекси рахуються з нуля, тому scores[1] — другий елемент (20). Присвоєння scores[1] = 25 замінює саме його." }
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
      explain:"double(5) повертає 5 * 2 = 10 — це значення стає на місце виклику, і до нього додається 1." },
    { q:"Потрібна функція area(w, h), яка ПОВЕРТАЄ площу прямокутника. Який варіант правильний?",
      options:[
        { text:"def area(w, h):\n    return w * h", credit:1 },
        { text:"def area(w, h)\n    return w * h", credit:0.5 },
        { text:"def area(w, h):\n    print(w * h)", credit:0 },
        { text:"def area():\n    return w * h", credit:0 }
      ],
      explain:"return віддає результат тому, хто викликав функцію. У другому варіанті немає двокрапки після def. У третьому print лише показує число на екрані, а функція повертає None — результат не можна використати далі. У четвертому функція не має параметрів, тож w і h їй ніхто не передасть." },
    { q:"Що виведе програма?",
      code:"def greet(name):\n    print(\"Привіт, \" + name)\n\nx = greet(\"Оля\")\nprint(x)",
      options:[
        { text:"Привіт, Оля\nNone", credit:1 },
        { text:"Привіт, Оля\nПривіт, Оля", credit:0 },
        { text:"Привіт, Оля", credit:0 },
        { text:"None", credit:0 }
      ],
      explain:"greet(\"Оля\") виконує print — з'являється Привіт, Оля. Але return у функції немає, тому вона повертає None, і саме None потрапляє в x і виводиться другим рядком." }
  ]},

  /* ---------- 7. Винятки: try / except — mcq ---------- */
  { id:"p_exc", type:"mcq", topic:"Винятки: try / except", points:0.5, variants:[
    { q:"Що виведе програма, якщо користувач введе abc?",
      code:"try:\n    n = int(input())\n    print(\"Число:\", n)\nexcept ValueError:\n    print(\"Це не число\")",
      options:[
        { text:"Це не число", credit:1 },
        { text:"Число: abc", credit:0 },
        { text:"Програма впаде з ValueError", credit:0 },
        { text:"Число: abc\nЦе не число", credit:0 }
      ],
      explain:"int(\"abc\") кидає ValueError. Помилка сталась усередині try, тому Python одразу переходить у except ValueError — print(\"Число:\", n) так і не виконується." },
    { q:"Потрібно зчитати число, а якщо ввели не число — вивести Помилка замість аварійного завершення. Який варіант правильний?",
      options:[
        { text:"try:\n    n = int(input())\nexcept ValueError:\n    print(\"Помилка\")", credit:1 },
        { text:"try:\n    n = int(input())\nexcept ValueError\n    print(\"Помилка\")", credit:0.5 },
        { text:"n = int(input())\ntry:\n    print(n)\nexcept ValueError:\n    print(\"Помилка\")", credit:0 },
        { text:"try:\n    n = input()\nexcept ValueError:\n    print(\"Помилка\")", credit:0 }
      ],
      explain:"У try має бути саме той рядок, який може впасти, — тут int(input()). У другому варіанті немає двокрапки після except. У третьому int() стоїть ДО try, тож помилка трапиться поза захистом. У четвертому немає int() — input() ніколи не кидає ValueError, і перевірки на число немає." },
    { q:"Що виведе програма?",
      code:"try:\n    print(\"A\")\n    x = 10 / 0\n    print(\"B\")\nexcept ZeroDivisionError:\n    print(\"C\")\nprint(\"D\")",
      options:[
        { text:"A\nC\nD", credit:1 },
        { text:"A\nB\nC\nD", credit:0 },
        { text:"C\nD", credit:0 },
        { text:"A\nD", credit:0 }
      ],
      explain:"A виводиться, потім 10 / 0 кидає ZeroDivisionError — решта блоку try (print(\"B\")) пропускається, спрацьовує except (C). Після try/except програма йде далі — D." }
  ]},

  /* ---------- 8. Ігрова логіка: рух, відбиття, зіткнення — mcq ---------- */
  { id:"p_game", type:"mcq", topic:"Ігрова логіка: рух, відбиття, зіткнення", points:0.5, variants:[
    { q:"М'яч летить праворуч: x — його координата, dx = 10 — швидкість, ширина поля 800. Потрібно, щоб на кожному кадрі м'яч зсувався, а біля правої стінки відбивався назад. Який варіант правильний?",
      options:[
        { text:"x += dx\nif x >= 800:\n    dx = -dx", credit:1 },
        { text:"x += dx\nif x >= 800\n    dx = -dx", credit:0.5 },
        { text:"x += dx\nif x >= 800:\n    x = -x", credit:0 },
        { text:"x += dx\nif x >= 800:\n    dx = 0", credit:0 }
      ],
      explain:"Відбиття — це зміна напрямку руху: швидкість dx міняє знак, і м'яч летить ліворуч. У другому варіанті немає двокрапки. У третьому змінюється координата, а не швидкість — м'яч «телепортується» за ліву межу. У четвертому dx = 0 просто зупиняє м'яч біля стінки." },
    { q:"Платформа займає по горизонталі відрізок від paddle_x до paddle_x + 100. М'яч з координатою ball_x опустився до рівня платформи. Яка умова перевіряє, що м'яч влучив у платформу?",
      options:[
        { text:"if ball_x >= paddle_x and ball_x <= paddle_x + 100:", credit:1 },
        { text:"if ball_x >= paddle_x and ball_x <= paddle_x + 100", credit:0.5 },
        { text:"if ball_x >= paddle_x or ball_x <= paddle_x + 100:", credit:0 },
        { text:"if ball_x == paddle_x:", credit:0 }
      ],
      explain:"М'яч має бути одночасно не лівіше за лівий край і не правіше за правий — це and. У другому варіанті немає двокрапки. У третьому or дає True майже для будь-якого ball_x — платформа «ловила» б м'яч навіть за межами. У четвертому перевіряється лише одна точка — лівий край." },
    { q:"Що виведе програма?",
      code:"running = True\nframes = 0\nwhile running:\n    frames += 1\n    if frames == 3:\n        running = False\nprint(frames)",
      options:[
        { text:"3", credit:1 },
        { text:"2", credit:0 },
        { text:"4", credit:0 },
        { text:"Нічого — цикл нескінченний", credit:0 }
      ],
      explain:"running — прапорець ігрового циклу. На кожному проході frames збільшується; коли frames стає 3, прапорець вимикається, і перевірка while running на наступному колі завершує цикл. Після циклу виводиться 3." }
  ]},

  /* ---------- 9. Цикл for — program ---------- */
  { id:"p_for_prog", type:"program", topic:"Цикл for", points:2, variants:[
    { title:"Очки за цеглини",
      intro:"Спершу програма зчитує n — кількість розбитих цеглин, потім n цілих чисел — очки за кожну (кожне з нового рядка). Виведи загальний рахунок. Виведи лише число.",
      hint:"for _ in range(n): — і в тілі циклу зчитуй чергове число та додавай його до total.",
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
    { title:"Влучання",
      intro:"Спершу програма зчитує n — кількість ударів, потім n рядків, кожен hit (влучив) або miss (промах). Виведи, скільки було влучань. Виведи лише число.",
      hint:"Заведи лічильник hits = 0 і збільшуй його, коли зчитаний рядок дорівнює \"hit\".",
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
      intro:"Програма зчитує n — кількість рівнів. Виведи рядки Рівень 1, Рівень 2, ..., Рівень n, а в кінці — Гру пройдено!. Для n = 0 виводиться лише Гру пройдено!.",
      hint:"range(1, n + 1) дає номери від 1 до n. Останній рядок — після циклу, без відступу.",
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
` }
  ]},

  /* ---------- 10. Цикл while — program ---------- */
  { id:"p_while_prog", type:"program", topic:"Цикл while", points:2, variants:[
    { title:"М'яч падає",
      intro:"Програма зчитує два цілі додатні числа: висоту h, з якої падає м'яч, і крок s — на скільки він опускається за кадр. Виведи, за скільки кадрів м'яч торкнеться землі (висота стане 0 або менше). Виведи лише число.",
      hint:"while h > 0: зменшуй h на s і рахуй кадри в окремій змінній.",
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
    { title:"Розгін платформи",
      intro:"Швидкість платформи починається з 1 і щокадру подвоюється. Програма зчитує ціле число max. Виведи, скільки кадрів потрібно, щоб швидкість стала не меншою за max. Якщо max — 1 або менше, виведи 0. Виведи лише число.",
      hint:"speed = 1, frames = 0; поки speed < max — speed *= 2 і frames += 1.",
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
    { title:"Вгадай до перемоги",
      intro:"Загадане число — 7. Програма зчитує спроби гравця (кожна з нового рядка), доки він не вгадає. Щойно вгадав — виведи Спроб: <кількість> і більше нічого не зчитуй.",
      hint:"while True: зчитуй число, збільшуй лічильник, а коли число дорівнює 7 — break.",
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
` }
  ]},

  /* ---------- 11. Списки — program ---------- */
  { id:"p_list_prog", type:"program", topic:"Списки", points:2, variants:[
    { title:"Червоні цеглини",
      intro:"Спершу програма зчитує n, потім n кольорів цеглин (кожен з нового рядка). Збери кольори в список і виведи, скільки в ньому червоних цеглин (red). Виведи лише число.",
      hint:"Спершу bricks = [] і bricks.append(...) у циклі, потім окремим циклом по списку порахуй \"red\".",
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
    { title:"Удар по стіні",
      intro:"Спершу програма зчитує n, потім n цілих чисел — міцність кожної цеглини. Збери їх у список. М'яч б'є по всій стіні, і міцність кожної цеглини зменшується на 1. Виведи новий список через print(список), наприклад [2, 0, 1].",
      hint:"Можна пройтись по індексах: for i in range(len(bricks)): bricks[i] -= 1. Або зібрати новий список через append.",
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
    { title:"Перший, останній, скільки",
      intro:"Спершу програма зчитує n (щонайменше 1), потім n назв рівнів (кожна з нового рядка). Збери їх у список і виведи три рядки: першу назву, останню назву і кількість рівнів.",
      hint:"Перший елемент — levels[0], останній — levels[-1], кількість — len(levels).",
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
` }
  ]},

  /* ---------- 12. Функції — code ---------- */
  { id:"p_func_code", type:"code", topic:"Функції", points:2, variants:[
    { title:"Відбиття від стінок", fn:"bounce", sig:"bounce(x, dx, width)",
      intro:"x — координата м'яча, dx — його швидкість, width — ширина поля. Поверни нову швидкість: якщо м'яч біля лівої (x <= 0) або правої (x >= width) стінки — швидкість з протилежним знаком, інакше — ту саму.",
      hint:"Одна умова з or: if x <= 0 or x >= width: return -dx, а інакше return dx.",
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
    { title:"Влучання в платформу", fn:"hit_paddle", sig:"hit_paddle(ball_x, paddle_x, paddle_w)",
      intro:"ball_x — координата м'яча, paddle_x — лівий край платформи, paddle_w — її ширина. Поверни True, якщо м'яч над платформою (від paddle_x до paddle_x + paddle_w включно), інакше — False.",
      hint:"Дві межі одночасно — це and: ball_x >= paddle_x and ball_x <= paddle_x + paddle_w.",
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
      intro:"color — колір розбитої цеглини. Поверни кількість очок: red — 30, green — 20, blue — 10, будь-який інший колір — 0.",
      hint:"if / elif / else з return у кожній гілці.",
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
` }
  ]}
  ]
});
