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
