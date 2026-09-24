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

T.test("python: обв'язка не залежить від глобальних імен інших сторінок (практика магазину)", async () => {
  /* js/pages/shop.js виконує свою обв'язку в тому ж Pyodide й має власну _error_text */
  (await PyEditor.bootPyodide()).runPython('def _error_text(error):\n    return "boom"');
  T.ok(P().runProgram("while True:\n    pass", "").error.startsWith("Схоже, цикл ніколи"));
  T.eq(P().runProgram("input()", "").error, "Програма просить більше даних, ніж передбачено умовою");
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
