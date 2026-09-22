/* ==========================================================================
   Самостійна робота «Перевір себе»: 9 завдань, 12 балів максимум.
   П'ять питань із варіантами відповіді (1 бал; 0.5 бала, якщо учень обрав
   варіант, правильний за логікою, але з синтаксичною помилкою) і чотири
   практичні завдання з кодом (2 або 1 бал — код перевіряється справжнім
   Python через Pyodide, тим самим рушієм, що й у практиці «Оживи магазин»).

   У кожного учня свій набір: при першому візиті для кожного завдання
   випадково береться один з кількох рівноцінних варіантів і порядок
   відповідей у ньому — це зберігається назавжди в localStorage, так само
   як і остаточний результат. Переграти не можна.

   Після завершення учень отримує посилання #/check/r/<дані>, у якому
   закодовано весь результат, — його можна відкрити в будь-якому браузері.
   ========================================================================== */
"use strict";
window.PageInit["check"] = function(){

const $id = (s) => document.getElementById(s);
const esc = PyEditor.esc;

const PICK_KEY   = "pyguide_check_pick";
const DRAFT_KEY  = "pyguide_check_draft";
const RESULT_KEY = "pyguide_check_result";

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

/* ============================ пул завдань ============================ */
/* Кожен слот — це один пункт тесту з фіксованою темою й кількістю балів.
   variants — рівноцінні за складністю варіанти цього пункту; який саме
   дістанеться учневі, вирішує makePick() при першому візиті. */
const SLOTS = [

  /* ---------- 1. змінні, print, input, int() — MCQ ---------- */
  { id:"vars_mcq", type:"mcq", topic:"Змінні, print, input, int()", points:1, variants:[
    { q:"Потрібно запитати вік користувача і одразу вивести, скільки йому буде років через 5 років. Який варіант зробить це правильно?",
      options:[
        { text:'age = int(input("Скільки тобі років? "))\nprint(age + 5)', credit:1 },
        { text:'age = int(input("Скільки тобі років? ")\nprint(age + 5)', credit:0.5 },
        { text:'age = input("Скільки тобі років? ")\nprint(age + 5)', credit:0 },
        { text:'age = int("Скільки тобі років? ")\nprint(age + 5)', credit:0 }
      ],
      explain:"input() завжди повертає рядок, тому число з нього треба дістати через int(). У другому варіанті ідея правильна, але не вистачає закриваючої дужки — SyntaxError. У третьому забули int() (спроба скласти рядок і число — TypeError), у четвертому int() застосували не до того, що ввів користувач, а до тексту питання." },
    { q:'Змінна price має зберігати ціну, яку ввів користувач, як ціле число. Який варіант правильний?',
      options:[
        { text:'price = int(input("Ціна: "))', credit:1 },
        { text:'price = int(input("Ціна: ")', credit:0.5 },
        { text:'price = input(int("Ціна: "))', credit:0 },
        { text:'price = "int(input(Ціна: ))"', credit:0 }
      ],
      explain:"Правильний порядок — спершу input() зчитує рядок, потім int() перетворює його в число. У другому варіанті порядок правильний, але не вистачає дужки. У третьому переплутано, що саме перетворюється в число. У четвертому весь вираз — просто текст у лапках, він нічого не обчислює." },
    { q:"Потрібно зчитати два числа й вивести їхню суму. Який варіант правильний?",
      options:[
        { text:'a = int(input("Перше число: "))\nb = int(input("Друге число: "))\nprint(a + b)', credit:1 },
        { text:'a = Int(input("Перше число: "))\nb = int(input("Друге число: "))\nprint(a + b)', credit:0.5 },
        { text:'a = input("Перше число: ")\nb = int(input("Друге число: "))\nprint(a + b)', credit:0 },
        { text:'a = input("Перше число: ")\nb = input("Друге число: ")\nprint(a + b)', credit:0 }
      ],
      explain:"У Python функції — з малої літери: int(), а не Int(). У другому варіанті ідея правильна, але Int узагалі не існує — NameError. У третьому одну змінну перетворили, іншу — ні, тому a + b впаде з TypeError. У четвертому обидві лишились рядками — a + b просто склеїть текст, а не додасть числа." },
    { q:"Значення name і age зберігаються у змінних (age — число). Потрібно вивести їх на одному рядку через пробіл, наприклад Оля 16. Який варіант правильний?",
      options:[
        { text:"print(name, age)", credit:1 },
        { text:"print(name age)", credit:0.5 },
        { text:"print(name + age)", credit:0 },
        { text:"print(name * age)", credit:0 }
      ],
      explain:"print() з кількома аргументами через кому сам розставляє пробіли між ними. У другому варіанті кому забули — Python не зрозуміє, де закінчується один аргумент і починається інший (SyntaxError). У третьому + намагається скласти рядок із числом — TypeError. У четвертому * — це valid Python (повторює рядок age разів), але результат — не те, що потрібно." }
  ]},

  /* ---------- 2. умови — MCQ ---------- */
  { id:"cond_mcq", type:"mcq", topic:"Умови", points:1, variants:[
    { q:'Потрібно вивести "Прохід", якщо score >= 60, інакше — "Незалік". Який варіант правильний?',
      options:[
        { text:'if score >= 60:\n    print("Прохід")\nelse:\n    print("Незалік")', credit:1 },
        { text:'if score >= 60\n    print("Прохід")\nelse:\n    print("Незалік")', credit:0.5 },
        { text:'if score >= 60:\n    print("Незалік")\nelse:\n    print("Прохід")', credit:0 },
        { text:'if score => 60:\n    print("Прохід")\nelse:\n    print("Незалік")', credit:0 }
      ],
      explain:"Після умови if обов'язкова двокрапка — у другому варіанті її не вистачає (SyntaxError), хоча логіка гілок правильна. У третьому переплутані місцями рядки в гілках. У четвертому — неіснуючий у Python оператор => замість >=." },
    { q:"Потрібно перевірити, що оцінка одночасно не менша за 4 і не більша за 12. Який варіант правильний?",
      options:[
        { text:"if 4 <= grade <= 12:", credit:1 },
        { text:"if 4 <= grade <= 12", credit:0.5 },
        { text:"if 4 >= grade >= 12:", credit:0 },
        { text:"if grade >= 4 and grade >= 12:", credit:0 }
      ],
      explain:"Python дозволяє ланцюжок порівнянь 4 <= grade <= 12 — це і є «між 4 і 12». У другому варіанті логіка та сама, але без двокрапки. У третьому напрямки знаків переплутані — умова ніколи не буде істинною. У четвертому and грає проти задуму: обидві частини вимагають grade >= 12, це не «від 4 до 12»." },
    { q:"Потрібно перевірити, що число num ділиться і на 2, і на 3 одночасно. Який варіант правильний?",
      options:[
        { text:"if num % 2 == 0 and num % 3 == 0:", credit:1 },
        { text:"if num % 2 = 0 and num % 3 == 0:", credit:0.5 },
        { text:"if num % 2 == 0 or num % 3 == 0:", credit:0 },
        { text:"if num / 2 == 0 and num / 3 == 0:", credit:0 }
      ],
      explain:"% — остача від ділення; вона дорівнює 0, якщо число ділиться націло. У другому варіанті ідея та сама, але замість порівняння == написали присвоєння = — це SyntaxError усередині умови. У третьому or замість and пропускає числа, які діляться лише на одне з двох. У четвертому / — це звичайне ділення, а не остача, тому умова майже ніколи не спрацює правильно." },
    { q:'Потрібно вивести "парне", якщо число num парне, інакше — "непарне". Який варіант правильний?',
      options:[
        { text:'if num % 2 == 0:\n    print("парне")\nelse:\n    print("непарне")', credit:1 },
        { text:'if num % 2 == 0:\nprint("парне")\nelse:\n    print("непарне")', credit:0.5 },
        { text:'if num % 2 == 1:\n    print("парне")\nelse:\n    print("непарне")', credit:0 },
        { text:'if num % 2 == 0:\n    print("непарне")\nelse:\n    print("парне")', credit:0 }
      ],
      explain:'Тіло if і else має бути з відступом — саме відступ показує Python, які рядки належать якій гілці. У другому варіанті рядок print("парне") без відступу — IndentationError, хоча логіка правильна. У третьому умова перевіряє непарність, а не парність. У четвертому переплутані тексти в гілках — вивід буде навпаки.' }
  ]},

  /* ---------- 3. цикли — MCQ ---------- */
  { id:"loops_mcq", type:"mcq", topic:"Цикли", points:1, variants:[
    { q:"Потрібно вивести числа від 1 до 5 включно. Який варіант правильний?",
      options:[
        { text:"for i in range(1, 6):\n    print(i)", credit:1 },
        { text:"for i in range(1, 6)\n    print(i)", credit:0.5 },
        { text:"for i in range(1, 5):\n    print(i)", credit:0 },
        { text:"for i in range(6, 1):\n    print(i)", credit:0 }
      ],
      explain:"range(1, 6) дає 1, 2, 3, 4, 5 — верхня межа не включається, тому для «до 5 включно» треба 6. У другому варіанті межі правильні, але немає двокрапки. У третьому — range(1, 5) виведе лише 1–4. У четвертому межі переплутані місцями — діапазон порожній, нічого не виведеться." },
    { q:'Потрібно вивести "Привіт" рівно 3 рази за допомогою while. Який варіант правильний?',
      options:[
        { text:'i = 0\nwhile i < 3:\n    print("Привіт")\n    i += 1', credit:1 },
        { text:'i = 0\nwhile i < 3\n    print("Привіт")\n    i += 1', credit:0.5 },
        { text:'i = 0\nwhile i < 3:\n    print("Привіт")', credit:0 },
        { text:'i = 1\nwhile i < 3:\n    print("Привіт")\n    i += 1', credit:0 }
      ],
      explain:"Лічильник має рухатись до умови виходу — i += 1 усередині циклу. У другому варіанті логіка та сама, але немає двокрапки. У третьому i ніколи не змінюється — цикл нескінченний. У четвертому i починається з 1, тому «Привіт» виведеться лише 2 рази (i = 1 і i = 2)." },
    { q:"Потрібно порахувати суму чисел від 1 до 10 включно за допомогою циклу. Який варіант правильний?",
      options:[
        { text:"total = 0\nfor i in range(1, 11):\n    total += i", credit:1 },
        { text:"total = 0\nfor i in range(1, 11):\ntotal += i", credit:0.5 },
        { text:"total = 0\nfor i in range(1, 10):\n    total += i", credit:0 },
        { text:"total = 0\nfor i in range(1, 11):\n    total = i", credit:0 }
      ],
      explain:"range(1, 11) дає числа 1–10, а total += i щоразу додає поточне число до накопичувача. У другому варіанті логіка правильна, але тіло циклу без відступу — IndentationError. У третьому range(1, 10) — це лише 1–9, останнє число загублено. У четвертому total = i щоразу ПЕРЕЗАПИСУЄ суму замість накопичення, у результаті лишиться тільки останнє число." },
    { q:"Потрібно вивести числа 0, 2, 4, 6, 8 — з кроком 2. Який варіант правильний?",
      options:[
        { text:"for i in range(0, 10, 2):\n    print(i)", credit:1 },
        { text:"for i in range(0; 10; 2):\n    print(i)", credit:0.5 },
        { text:"for i in range(0, 10):\n    print(i)", credit:0 },
        { text:"for i in range(0, 10, 3):\n    print(i)", credit:0 }
      ],
      explain:"Третій аргумент range() — крок; range(0, 10, 2) саме й дає 0, 2, 4, 6, 8. У другому варіанті ідея правильна, але аргументи розділені крапкою з комою замість коми — SyntaxError. У третьому крок не вказано (за замовчуванням 1) — вийдуть усі числа 0–9. У четвертому крок 3 дає геть інші числа: 0, 3, 6, 9." }
  ]},

  /* ---------- 4. списки (без зрізів) — MCQ ---------- */
  { id:"list_mcq", type:"mcq", topic:"Списки", points:1, variants:[
    { q:'У списку fruits = ["яблуко", "банан", "вишня"] потрібно додати новий фрукт "груша" в кінець. Який варіант правильний?',
      options:[
        { text:'fruits.append("груша")', credit:1 },
        { text:'fruits.append("груша"', credit:0.5 },
        { text:'fruits[0] = "груша"', credit:0 },
        { text:'fruits.remove("груша")', credit:0 }
      ],
      explain:"append() додає елемент у кінець списку. У другому варіанті метод правильний, але бракує закриваючої дужки. Третій замінює перший елемент замість додавання нового. Четвертий взагалі намагається видалити те, чого в списку ще немає." },
    { q:"Потрібно дізнатися, скільки елементів у списку numbers. Який варіант правильний?",
      options:[
        { text:"len(numbers)", credit:1 },
        { text:"Len(numbers)", credit:0.5 },
        { text:"numbers.len()", credit:0 },
        { text:"numbers[len]", credit:0 }
      ],
      explain:"len() — вбудована функція, застосовується як len(numbers), обов'язково з малої літери. У другому варіанті ідея та сама, але Len з великої літери не існує — NameError. У третьому len викликано як метод списку — такого методу немає (AttributeError). У четвертому len використано як індекс, що не має сенсу." },
    { q:"Потрібно перевірити, чи входить число 7 у список numbers. Який варіант правильний?",
      options:[
        { text:"7 in numbers", credit:1 },
        { text:"7 In numbers", credit:0.5 },
        { text:"numbers.in(7)", credit:0 },
        { text:"numbers == 7", credit:0 }
      ],
      explain:"in — це оператор перевірки належності, пишеться з малої літери. У другому варіанті ідея правильна, але In з великої літери Python не розпізнає як оператор — SyntaxError. У третьому — спроба викликати in як метод списку, такого методу немає. У четвертому порівнюється весь список із числом 7, а не належність числа списку." },
    { q:"Потрібно отримати НОВИЙ відсортований список на основі prices, а сам prices лишити без змін. Який варіант правильний?",
      options:[
        { text:"sorted(prices)", credit:1 },
        { text:"sort(prices)", credit:0.5 },
        { text:"prices.sort()", credit:0 },
        { text:"prices.reverse()", credit:0 }
      ],
      explain:"sorted(prices) — вбудована функція, яка повертає НОВИЙ відсортований список, не чіпаючи prices. У другому варіанті ідея правильна, але sort() як окрема функція не існує — NameError (це або sorted(), або метод .sort()). У третьому .sort() — це метод, який сортує prices НА МІСЦІ і повертає None, тобто змінює сам prices, що суперечить умові. У четвертому reverse() лише перевертає порядок, зовсім не сортує." }
  ]},

  /* ---------- 5. словники — MCQ ---------- */
  { id:"dict_mcq", type:"mcq", topic:"Словники", points:1, variants:[
    { q:'Є словник ages = {"Оля": 16, "Іван": 15}. Потрібно безпечно отримати вік "Марії", а якщо такого ключа немає — отримати 0 замість помилки. Який варіант правильний?',
      options:[
        { text:'ages.get("Марії", 0)', credit:1 },
        { text:'ages.get("Марії", 0', credit:0.5 },
        { text:'ages["Марії"]', credit:0 },
        { text:'ages.get(0, "Марії")', credit:0 }
      ],
      explain:'.get(ключ, значення_за_замовчуванням) не кидає помилку, якщо ключа немає. У другому варіанті метод правильний, але не вистачає дужки. У третьому — звернення через [] кине помилку, якщо ключа немає (проти умови задачі). У четвертому переплутані місцями аргументи.' },
    { q:'Потрібно додати нову пару ключ-значення "Петро": 14 у словник ages. Який варіант правильний?',
      options:[
        { text:'ages["Петро"] = 14', credit:1 },
        { text:"ages['Петро\"] = 14", credit:0.5 },
        { text:'ages.append("Петро", 14)', credit:0 },
        { text:'ages["Петро"] == 14', credit:0 }
      ],
      explain:'Новий ключ додається присвоєнням ages["ключ"] = значення. У другому варіанті ідея правильна, але рядок відкрито однією лапкою, а закрито іншою — SyntaxError. У словників немає методу append() — це метод списків. Четвертий варіант — це порівняння (==), воно нічого не змінює в словнику.' },
    { q:"Потрібно дізнатися, скільки пар ключ-значення у словнику ages. Який варіант правильний?",
      options:[
        { text:"len(ages)", credit:1 },
        { text:"ages.length()", credit:0.5 },
        { text:"max(ages)", credit:0 },
        { text:"type(ages)", credit:0 }
      ],
      explain:"len() працює для словників так само, як і для списків — рахує кількість пар. У другому варіанті ідея правильна (порахувати розмір), але в Python немає методу .length() — це з інших мов (AttributeError). У третьому max() поверне найбільший ключ, а не кількість. У четвертому type() поверне лише тип об'єкта (dict), а не кількість елементів." },
    { q:'Потрібно створити словник одразу з двома записами: "Оля": 16 і "Іван": 15. Який варіант правильний?',
      options:[
        { text:'ages = {"Оля": 16, "Іван": 15}', credit:1 },
        { text:'ages = {"Оля": 16 "Іван": 15}', credit:0.5 },
        { text:'ages = ["Оля": 16, "Іван": 15]', credit:0 },
        { text:'ages = ("Оля": 16, "Іван": 15)', credit:0 }
      ],
      explain:'Словник — фігурні дужки {}, пари через кому. У другому варіанті дужки правильні, але кому між парами забули — SyntaxError. У третьому й четвертому взято не той тип дужок ([] — список, () — кортеж), а вони не підтримують запис "ключ: значення" — це теж SyntaxError, тільки вже через нерозуміння, який контейнер тут потрібен.' }
  ]},

  /* ---------- 6. змінні, print, input, int() — код ---------- */
  { id:"vars_code", type:"code", topic:"Змінні, print, input, int()", points:1, variants:[
    { title:"Сума замовлення", fn:"order_total", sig:"order_total(price_text, quantity_text)",
      intro:"price_text і quantity_text — рядки, такі самі, як поверне input(): ціна за одиницю товару і кількість. Переведи обидва значення в цілі числа й поверни загальну суму — ціну, помножену на кількість.",
      hint:"Рядок треба спершу перетворити функцією int(), і лише тоді множити.",
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
      intro:"price1_text і price2_text — рядки, такі самі, як поверне input(): дві ціни. Переведи обидва значення в цілі числа й поверни їхнє середнє арифметичне.",
      hint:"Спочатку int() для обох рядків, потім (a + b) / 2 — ділення / завжди дає дробове число.",
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
      intro:"year1_text і year2_text — рядки з роками народження, такі самі, як поверне input(). Переведи обидва значення в цілі числа й поверни різницю у віці — завжди невід'ємне число.",
      hint:"abs() повертає модуль числа — прибирає знак «мінус», якщо різниця вийшла від'ємною.",
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
      intro:"score — ціле число від 1 до 12 (оцінка за дванадцятибальною шкалою). Потрібно повернути словесну оцінку за правилами нижче.",
      hint:"Перевіряй умови від найбільшої межі до найменшої: спершу score >= 10, потім >= 7, потім >= 4, інакше — останній випадок.",
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
      intro:"balance — ціле чи дробове число, залишок на рахунку. Потрібно повернути словесний стан за правилами нижче.",
      hint:"Три випадки — три гілки: if / elif / else.",
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
      intro:"age — ціле невід'ємне число, вік людини. Потрібно повернути вікову категорію за правилами нижче.",
      hint:"elif age < 18 тут достатньо: якщо код дійшов до цього рядка, значить age вже не менше 12.",
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
      intro:"numbers — список цілих чисел. Потрібно повернути суму лише ПАРНИХ чисел зі списку. Якщо парних чисел немає — повернути 0.",
      hint:"Число number парне, якщо number % 2 == 0. Заведи змінну-накопичувач total = 0 і додавай до неї підходящі числа в циклі.",
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
      intro:"numbers — список цілих чи дробових чисел. Потрібно повернути кількість від'ємних чисел (менших за 0) у списку.",
      hint:"Заведи лічильник count = 0 і збільшуй його на 1 щоразу, коли зустрічаєш число менше за 0.",
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
      intro:"numbers — непорожній список цілих чисел. Потрібно повернути добуток усіх чисел у списку (результат множення їх усіх між собою).",
      hint:"Накопичувач тут починається з 1, а не з 0, як для суми, — інакше множення на 0 занулило б усе.",
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
      intro:"numbers — список цілих чи дробових чисел. Потрібно повернути новий список, що містить лише додатні числа з numbers (більші за 0), у тому самому порядку.",
      hint:"Заведи порожній список result = [], пройдись циклом по numbers і додавай у result лише ті числа, що більші за 0.",
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
      intro:"numbers — список цілих чи дробових чисел. Потрібно повернути новий список, у якому кожне число з numbers збільшене вдвічі, у тому самому порядку.",
      hint:"Заведи порожній список result = [] і для кожного числа додавай у нього число, помножене на 2.",
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
      intro:"words — непорожній список рядків (слів). Потрібно повернути найдовше слово зі списку; якщо однаково довгих слів декілька — перше з них.",
      hint:"Заведи змінну best = words[0] (перше слово за замовчуванням) і онови її, тільки якщо знайдеш довше слово.",
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


];

const BY_ID = Object.fromEntries(SLOTS.map(s => [s.id, s]));
const MAX_POINTS = SLOTS.reduce((sum, s) => sum + s.points, 0);

/* ============================ вибір варіанта для учня ============================ */
function shuffled(n){
  const a = Array.from({length:n}, (_, i) => i);
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makePick(){
  const pick = {};
  SLOTS.forEach(slot => {
    const variant = Math.floor(Math.random() * slot.variants.length);
    const entry = { variant };
    if(slot.type === "mcq") entry.order = shuffled(slot.variants[variant].options.length);
    pick[slot.id] = entry;
  });
  return pick;
}

/* Набір створюється лише тоді, коли учень справді відкриває свій тест, —
   перегляд чужого результату за посиланням нічого не записує. */
let pick = null;
function ensurePick(){
  pick = readJSON(PICK_KEY, null);
  if(!pick){
    pick = makePick();
    writeJSON(PICK_KEY, pick);
  }
}

const variantOf = (slot) => slot.variants[pick[slot.id].variant];

/* ============================ чернетка відповідей ============================ */
const draft = readJSON(DRAFT_KEY, { mcq:{}, code:{} });
const saveDraft = () => writeJSON(DRAFT_KEY, draft);

/* ============================ Python (спільний з практикою) ============================ */
const CHECK_HARNESS = `
import json, io
from contextlib import redirect_stdout

_CHECK_FUNCS = {}

def _check_error_text(error):
    return f"{type(error).__name__}: {error}"

def check_install(name, source):
    _CHECK_FUNCS.pop(name, None)
    namespace = {}
    try:
        exec(compile(source, f"{name}.py", "exec"), namespace)
    except Exception as error:
        return f"Помилка в коді — {_check_error_text(error)}"
    func = namespace.get(name)
    if not callable(func):
        return f"У коді немає функції {name}(...) — не перейменовуй її."
    _CHECK_FUNCS[name] = func
    return ""

def _check_equal(actual, expected):
    try:
        if isinstance(expected, float) and isinstance(actual, (int, float)) and not isinstance(actual, bool):
            return abs(actual - expected) < 1e-6
        return bool(actual == expected)
    except Exception:
        return False

def check_test(name, tests_json):
    func = _CHECK_FUNCS.get(name)
    if func is None:
        return json.dumps({"ok": False})
    tests = json.loads(tests_json)
    try:
        for t in tests:
            with redirect_stdout(io.StringIO()):
                actual = func(*t["args"])
            if not _check_equal(actual, t["expected"]):
                return json.dumps({"ok": False})
    except Exception:
        return json.dumps({"ok": False})
    return json.dumps({"ok": True})
`;

let py = null, pyInstall = null, pyTest = null;

async function bootPython(){
  py = await PyEditor.bootPyodide();
  py.runPython(CHECK_HARNESS);
  pyInstall = py.globals.get("check_install");
  pyTest = py.globals.get("check_test");
}

function install(name, source){
  try { return pyInstall(name, source); }
  catch(err){ return String(err); }
}
function testsPass(name, tests){
  try { return JSON.parse(pyTest(name, JSON.stringify(tests))).ok === true; }
  catch(err){ return false; }
}

/* ============================ рендер завдань ============================ */
const AC_HIDDEN = { vars_code: new Set(["int"]) };

function mcqCard(slot, n){
  const variant = variantOf(slot);
  const order = pick[slot.id].order;
  const chosen = draft.mcq[slot.id];
  const opts = order.map(idx => {
    const opt = variant.options[idx];
    const on = chosen === idx ? " on" : "";
    return `<label class="checkq-opt${on}" data-idx="${idx}">
      <input type="radio" name="mcq_${slot.id}" value="${idx}" ${chosen === idx ? "checked" : ""}>
      <pre>${esc(opt.text)}</pre>
    </label>`;
  }).join("");
  return `
    <article class="checkq" id="check-slot-${slot.id}" data-slot="${slot.id}" data-type="mcq">
      <div class="checkq-head">
        <span class="checkq-n">Завдання ${n} · ${slot.points} бал${slot.points === 1 ? "" : "и"}</span>
      </div>
      <p class="checkq-text">${esc(variant.q)}</p>
      <div class="checkq-opts" role="radiogroup" aria-label="${esc(variant.q)}">${opts}</div>
    </article>`;
}

function codeCard(slot, n){
  const variant = variantOf(slot);
  return `
    <article class="checkq" id="check-slot-${slot.id}" data-slot="${slot.id}" data-type="code">
      <div class="checkq-head">
        <span class="checkq-n">Завдання ${n} · ${slot.points} бал${slot.points === 1 ? "" : "и"}</span>
      </div>
      <p class="checkq-text"><b>${esc(variant.title)}.</b> ${esc(variant.intro)}</p>
      <div class="pyed">
        <pre class="pyed-hl pysrc" data-role="hl" aria-hidden="true"></pre>
        <textarea class="pyed-ta" data-role="editor" spellcheck="false" autocapitalize="off"
          autocomplete="off" autocorrect="off" data-gramm="false" aria-label="Код функції ${esc(variant.fn)}"></textarea>
      </div>
      <div class="controls pyt-controls">
        <details class="pyt-hint"><summary>Підказка</summary><p>${esc(variant.hint)}</p></details>
        <span class="pyt-kbd">Ctrl+Enter — запустити</span>
        <button type="button" class="ctl" data-act="run" disabled>▶ Запустити</button>
      </div>
      <div class="pyt-msg" data-role="msg" hidden></div>
    </article>`;
}

const part = (card, role) => card.querySelector(`[data-role="${role}"]`);

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

function wireCode(card, slot){
  const variant = variantOf(slot);
  const ta = part(card, "editor");
  const hl = part(card, "hl");
  const runBtn = card.querySelector('[data-act="run"]');
  ta.value = draft.code[slot.id] != null ? draft.code[slot.id] : variant.starter;

  function runCheck(){
    if(!py) return;
    const err = install(variant.fn, ta.value);
    if(err) setMsg(card, esc(err), "bad");
    else setMsg(card, "Код виконується без помилок. Це не каже, чи правильна відповідь, — лише те, що код запускається.", "good");
  }

  PyEditor.wireEditor(ta, hl, {
    hiddenWords: AC_HIDDEN[slot.id],
    minRows: 8,
    onInput: (value) => { draft.code[slot.id] = value; saveDraft(); updateProgress(); },
    onRun: () => { if(py){ runCheck(); } }
  });

  runBtn.addEventListener("click", runCheck);
}

function renderSlots(){
  $id("check-slots").innerHTML = SLOTS.map((slot, i) =>
    slot.type === "mcq" ? mcqCard(slot, i + 1) : codeCard(slot, i + 1)
  ).join("");

  SLOTS.forEach(slot => {
    const card = $id("check-slot-" + slot.id);
    if(slot.type === "mcq") wireMcq(card, slot);
    else wireCode(card, slot);
  });
}

/* ============================ прогрес ============================ */
function answeredCount(){
  return SLOTS.filter(slot => {
    if(slot.type === "mcq") return draft.mcq[slot.id] != null;
    const code = draft.code[slot.id];
    return !!code && code.trim() !== variantOf(slot).starter.trim();
  }).length;
}

function updateProgress(){
  const n = answeredCount();
  $id("check-progress-fill").style.width = (n / SLOTS.length * 100) + "%";
  $id("check-progress-text").textContent = `Відповіли ${n} з ${SLOTS.length}`;
}

/* ============================ оцінювання й результати ============================ */
/* Пункт результату будується лише з номера варіанта й відповіді учня —
   так само і після тесту, і з посилання, яким поділилися. */
function mcqItem(slot, variantIdx, chosenIdx){
  const variant = slot.variants[variantIdx];
  const opt = chosenIdx != null ? variant.options[chosenIdx] : null;
  const correctIdx = variant.options.findIndex(o => o.credit === 1);
  return { slotId:slot.id, type:"mcq", topic:slot.topic, points:slot.points,
    variant:variantIdx, chosenIdx, earned:(opt ? opt.credit : 0) * slot.points,
    question:variant.q, chosenText: opt ? opt.text : null, chosenCredit: opt ? opt.credit : 0,
    correctText: variant.options[correctIdx].text, explain:variant.explain };
}

function codeItem(slot, variantIdx, source, passed, error){
  const variant = slot.variants[variantIdx];
  return { slotId:slot.id, type:"code", topic:slot.topic, points:slot.points,
    variant:variantIdx, earned: passed ? slot.points : 0, passed,
    title:variant.title, yourCode:source, error: error || null, solution:variant.solution };
}

const withTotal = (items, finishedAt) =>
  ({ total: items.reduce((sum, it) => sum + it.earned, 0), max:MAX_POINTS, items, finishedAt });

function gradeAll(){
  const items = SLOTS.map(slot => {
    const v = pick[slot.id].variant;
    if(slot.type === "mcq"){
      const idx = draft.mcq[slot.id];
      return mcqItem(slot, v, idx != null ? idx : null);
    }
    const variant = slot.variants[v];
    const source = draft.code[slot.id] != null ? draft.code[slot.id] : variant.starter;
    const err = install(variant.fn, source);
    const passed = !err && testsPass(variant.fn, variant.tests);
    return codeItem(slot, v, source, passed, err);
  });
  return withTotal(items, new Date().toISOString());
}

/* ============================ посилання на результат ============================ */
/* Сервера немає, тож увесь результат їде в самому посиланні #/check/r/<дані>.
   Тексти питань, пояснення й розв'язки сторінка бере зі SLOTS, а в посиланні
   лише відповіді учня — компактним масивом у порядку SLOTS:
     [версія, час завершення (секунди, base36), контрольна сума, пункти…]
     пункт з варіантами — [варіант, вибрана відповідь або -1]
     пункт з кодом      — [варіант, 1/0 тести пройдено, код, помилка]
   Код зберігається як різниця зі стартовим: [скільки символів збігається
   на початку, скільки в кінці, що між ними], або 0, якщо учень його не чіпав.
   Так docstring-и, які учні зазвичай лишають, у посилання не потрапляють.
   Тому стартовий код уже виданих варіантів не можна міняти: старі посилання
   відновили б код неправильно. Контрольна сума стартових кодів це ловить
   і показує помилку замість спотвореного коду. Нове — додавай новим варіантом
   у кінець списку.
   JSON стискається deflate-raw і кодується base64url; перша літера — формат
   ("z" стиснене, "j" — ні, для браузерів без CompressionStream).
   Це не захист: хто захоче, розпакує посилання й підмінить відповіді. */
const SHARE_VERSION = 2;
const SHARE_RE = /^#\/?check\/r\/([A-Za-z0-9_-]+)$/;

/* FNV-1a — короткий відбиток стартових кодів вибраних варіантів */
function starterSum(variants){
  let h = 0x811c9dc5;
  const s = variants.map(v => v.starter).join("\u0000");
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
const codeVariants = (variantOf) =>
  SLOTS.filter(slot => slot.type === "code").map(slot => slot.variants[variantOf(slot)]);

function codeDiff(base, s){
  if(s === base) return 0;
  let p = 0;
  while(p < base.length && p < s.length && base[p] === s[p]) p++;
  let q = 0;
  while(q < base.length - p && q < s.length - p && base[base.length - 1 - q] === s[s.length - 1 - q]) q++;
  return [p, q, s.slice(p, s.length - q)];
}

function sharePayload(result){
  /* результати, збережені до появи посилань, не мають variant/chosenIdx —
     дістаємо їх із набору учня та тексту вибраної відповіді */
  const savedPick = readJSON(PICK_KEY, {});
  const byId = {};
  for(const item of result.items){
    const slot = BY_ID[item.slotId];
    const v = item.variant != null ? item.variant : (savedPick[item.slotId] || {}).variant;
    if(!slot || !slot.variants[v]) return null;
    if(item.type === "mcq"){
      const idx = item.chosenIdx !== undefined ? item.chosenIdx
        : slot.variants[v].options.findIndex(o => o.text === item.chosenText);
      byId[slot.id] = [v, idx == null || idx < 0 ? -1 : idx];
    } else {
      byId[slot.id] = [v, item.passed ? 1 : 0, codeDiff(slot.variants[v].starter, item.yourCode), item.error || ""];
    }
  }
  if(SLOTS.some(slot => !byId[slot.id])) return null;
  const t = Date.parse(result.finishedAt);
  return [SHARE_VERSION, isNaN(t) ? "" : Math.round(t / 1000).toString(36),
    starterSum(codeVariants(slot => byId[slot.id][0])), ...SLOTS.map(slot => byId[slot.id])];
}

/* зворотне до sharePayload; посилання — чужі дані, тож перевіряємо кожне поле.
   null — посилання пошкоджене, "stale" — створене до зміни стартового коду */
function resultFromPayload(p){
  const isIdx = (n, len) => Number.isInteger(n) && n >= 0 && n < len;
  if(!Array.isArray(p) || p[0] !== SHARE_VERSION || p.length !== SLOTS.length + 3) return null;
  const entries = p.slice(3);
  if(entries.some((e, i) => !Array.isArray(e) || !isIdx(e[0], SLOTS[i].variants.length))) return null;
  if(p[2] !== starterSum(codeVariants(slot => entries[SLOTS.indexOf(slot)][0]))) return "stale";

  const items = [];
  for(let i = 0; i < SLOTS.length; i++){
    const slot = SLOTS[i], e = entries[i];
    const variant = slot.variants[e[0]];
    if(slot.type === "mcq"){
      if(e[1] !== -1 && !isIdx(e[1], variant.options.length)) return null;
      items.push(mcqItem(slot, e[0], e[1] === -1 ? null : e[1]));
      continue;
    }
    const d = e[2], base = variant.starter;
    let code = base;
    if(d !== 0){
      if(!Array.isArray(d) || !isIdx(d[0], base.length + 1) || !isIdx(d[1], base.length + 1 - d[0])
         || typeof d[2] !== "string") return null;
      code = base.slice(0, d[0]) + d[2] + base.slice(base.length - d[1]);
    }
    if(typeof e[3] !== "string") return null;
    items.push(codeItem(slot, e[0], code, e[1] === 1, e[3]));
  }
  const secs = typeof p[1] === "string" && /^[0-9a-z]{1,9}$/.test(p[1]) ? parseInt(p[1], 36) : NaN;
  return withTotal(items, isNaN(secs) ? null : new Date(secs * 1000).toISOString());
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

async function shareUrl(result){
  const payload = sharePayload(result);
  if(!payload) return null;
  return location.href.split("#")[0] + "#/check/r/" + await packShare(payload);
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

function resultBadge(item){
  if(item.type === "mcq") return item.earned === item.points ? "ok" : (item.earned > 0 ? "partial" : "bad");
  return item.passed ? "ok" : "bad";
}

/* shared — результат відкрито за посиланням, а не з цього браузера */
function renderResults(result, shared){
  $id("check-body").hidden = true;
  $id("check-progress-wrap").hidden = true;
  $id("check-loading").hidden = true;
  const box = $id("check-results");
  box.hidden = false;

  const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);

  const items = result.items.map((item, i) => {
    const n = i + 1;
    const cls = resultBadge(item);
    if(item.type === "mcq"){
      const chosenCls = item.chosenText == null ? "" : (item.chosenCredit === 1 ? "ok" : (item.chosenCredit > 0 ? "partial" : "bad"));
      const chosenRow = item.chosenText == null
        ? `<li class="chosen bad"><b>Твоя відповідь:</b> (не відповів)</li>`
        : `<li class="chosen ${chosenCls}"><b>Твоя відповідь:</b> ${esc(item.chosenText)}</li>`;
      const correctRow = item.chosenCredit === 1 ? "" :
        `<li class="correct"><b>Правильно:</b> ${esc(item.correctText)}</li>`;
      return `<article class="checkr-item ${cls}">
        <div class="checkr-item-head"><b>${n}. ${esc(item.topic)}</b><span>${fmt(item.earned)} / ${item.points} бал${item.points === 1 ? "" : "и"}</span></div>
        <p class="checkr-q">${esc(item.question)}</p>
        <ul class="checkr-opts">${chosenRow}${correctRow}</ul>
        <p class="checkr-explain">${esc(item.explain)}</p>
      </article>`;
    }
    return `<article class="checkr-item ${cls}">
      <div class="checkr-item-head"><b>${n}. ${esc(item.title)}</b><span>${fmt(item.earned)} / ${item.points} бал${item.points === 1 ? "" : "и"}</span></div>
      <p class="checkr-q">${item.passed ? "Усі приховані тести пройдено." : (item.error ? esc(item.error) : "Не всі приховані тести пройдено.")}</p>
      <p class="checkr-code-t">Твій код:</p>
      <pre class="checkr-code pysrc">${PyEditor.highlight(item.yourCode)}</pre>
      <p class="checkr-code-t">Приклад правильного розв'язку:</p>
      <pre class="checkr-code ref pysrc">${PyEditor.highlight(item.solution)}</pre>
    </article>`;
  }).join("");

  const when = result.finishedAt
    ? new Date(result.finishedAt).toLocaleString("uk-UA", { dateStyle:"long", timeStyle:"short" }) : "";

  const note = shared
    ? `<p>Це результат, яким поділилися за посиланням${when ? ` · тест завершено ${esc(when)}` : ""}.
         Нижче — усі завдання з правильними відповідями.</p>
       <a class="checkr-own" href="#/check">До власного тесту →</a>`
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
      <div class="checkr-score-n">${fmt(result.total)}<span> / ${result.max}</span></div>
      ${note}
    </div>
    <div class="checkr-list">${items}</div>`;

  if(!shared) wireShare(box, result);
}

/* ============================ завершення тесту ============================ */
function wireFinish(){
  const btn = $id("check-finish-btn");
  btn.addEventListener("click", () => {
    if(btn.dataset.armed !== "1"){
      btn.dataset.armed = "1";
      btn.textContent = "Точно? Натисни ще раз — переграти не можна";
      return;
    }
    const result = gradeAll();
    writeJSON(RESULT_KEY, result);
    store.del(DRAFT_KEY);
    renderResults(result, false);
    /* кнопка була внизу довгої сторінки — повертаємо на початок, де видно бал;
       фокус (для читачів екрана) ставимо до скролу, щоб не перервати анімацію */
    const score = $id("check-results").querySelector(".checkr-score");
    score.tabIndex = -1;
    score.focus({ preventScroll:true });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top:0, behavior: reduced ? "auto" : "smooth" });
  });
}

/* ============================ режими сторінки ============================ */
/* #/check — власний тест цього браузера, #/check/r/<дані> — результат за
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
  const loadingEl = $id("check-loading");
  bootPython().then(() => {
    $id("check-slots").querySelectorAll('[data-act="run"]').forEach(b => b.disabled = false);
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
  $id("check-rules").hidden = false;
  const existing = readJSON(RESULT_KEY, null);
  if(existing){
    renderResults(existing, false);
    return;
  }
  $id("check-results").hidden = true;
  $id("check-progress-wrap").hidden = false;
  if(bootState === "idle") startTest();
  $id("check-loading").hidden = bootState === "ready";
  $id("check-body").hidden = bootState === "loading";
}

async function showShared(data, token){
  ["check-rules", "check-progress-wrap", "check-loading", "check-body"].forEach(id => { $id(id).hidden = true; });
  const box = $id("check-results");
  box.hidden = false;
  box.innerHTML = "";

  let result = null;
  try { result = resultFromPayload(await unpackShare(data)); }
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
    ${why} <a href="#/check">До власного тесту →</a></span></div>`;
}

function route(){
  const token = ++viewToken;
  const m = location.hash.match(SHARE_RE);
  if(m) showShared(m[1], token);
  else showOwn();
}

/* роутер уже показав сторінку; тут лише перемикаємо режим усередині неї */
window.addEventListener("hashchange", () => {
  if(/^#\/?check(\/|$)/.test(location.hash)) route();
});
route();

};
