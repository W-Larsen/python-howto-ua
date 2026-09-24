"use strict";
(function(){
const C = () => window.CheckCore;
const S = () => window.TOY_SLOTS;

/* детермінований «random» для makePick */
const seq = (...xs) => { let i = 0; return () => xs[i++ % xs.length]; };

T.test("core: makePick дає варіант у межах і перестановку відповідей", () => {
  const pick = C().makePick(S(), seq(0.99, 0.1, 0.5, 0.2, 0.7, 0.3));
  T.eq(pick.q.variant, 1);
  T.eq([...pick.q.order].sort(), [0, 1, 2, 3]);
  T.eq(pick.f, { variant:0 });
  T.eq(pick.p, { variant:0 });
});

T.test("core: бали форматуються без округлення до однієї цифри", () => {
  T.eq([12, 11.5, 0.25, 11.75, 0.1 + 0.2, 0].map(C().fmtPoints), ["12", "11.5", "0.25", "11.75", "0.3", "0"]);
});

T.test("core: слово «бал» узгоджується з числом", () => {
  T.eq([1, 2, 4, 5, 11, 12, 14, 21, 22, 0.5, 11.5].map(C().pointsLabel),
    ["1 бал", "2 бали", "4 бали", "5 балів", "11 балів", "12 балів", "14 балів", "21 бал", "22 бали", "0.5 бала", "11.5 бала"]);
});

T.test("core: вивід — пробіли в кінці рядків і порожні рядки в кінці не рахуються", () => {
  const same = C().sameOutput;
  T.ok(same("8\n", "8"), "\\n у кінці");
  T.ok(same("a  \nb\t\n\n\n", "a\nb"), "пробіли й порожні рядки в кінці");
  T.ok(same("a\r\nb\r\n", "a\nb"), "\\r\\n");
  T.ok(!same(" 8", "8"), "пробіл на початку рахується");
  T.ok(!same("a\n\nb", "a\nb"), "порожній рядок усередині рахується");
  T.ok(!same("Тепло", "тепло"), "регістр рахується");
});

T.test("core: codeDiff / applyDiff туди й назад", () => {
  const base = "def f():\n    # TODO\n    pass\n";
  const mine = "def f():\n    return 42\n";
  T.eq(C().codeDiff(base, base), 0);
  T.eq(C().applyDiff(base, 0), base);
  T.eq(C().applyDiff(base, C().codeDiff(base, mine)), mine);
  T.eq(C().applyDiff(base, [999, 0, ""]), null);
  T.eq(C().applyDiff(base, "x"), null);
});

function toyResult(){
  const s = S();
  return C().withTotal(s, [
    C().mcqItem(s[0], 1, 0),
    C().codeItem(s[1], 0, "def double(x):\n    return x + x\n", true, ""),
    C().programItem(s[2], 0, "print(3)\n", { passed:false, error:"", failIdx:1, failOut:"3\n" })
  ], "2026-09-24T10:00:00.000Z");
}

T.test("core: пункти результату й сума з дробовими балами", () => {
  const r = toyResult();
  T.eq(r.max, 4);
  T.eq(r.total, 2.5);
  T.eq(r.items[0].code, "print(1)");
  T.eq(r.items[2].failInput, "5\n5");
  T.eq(r.items[2].failExpected, "10");
  T.eq(r.items[2].earned, 0);
  T.ok(!("code" in C().mcqItem(S()[0], 0, 0)), "без code у варіанті — без поля code");
});

T.test("core: посилання — buildPayload → parsePayload відновлює результат", () => {
  const r = toyResult();
  const p = C().buildPayload(S(), 1, r, {});
  T.eq(p.length, S().length + 3);
  T.eq(p[3], [1, 0]);
  T.eq(p[5].slice(4), [1, "3\n"]);
  const back = C().parsePayload(S(), 1, p);
  T.eq(back.total, 2.5);
  T.eq(back.items[1].yourCode, r.items[1].yourCode);
  T.eq(back.items[2].failIdx, 1);
  T.eq(back.items[2].failOut, "3\n");
  T.eq(back.finishedAt, "2026-09-24T10:00:00.000Z");
});

T.test("core: посилання — чужа версія, зіпсовані дані, змінений стартовий код", () => {
  const p = C().buildPayload(S(), 1, toyResult(), {});
  T.eq(C().parsePayload(S(), 2, p), null, "інша версія");
  T.eq(C().parsePayload(S(), 1, p.slice(0, -1)), null, "не вистачає пункту");
  const bad = JSON.parse(JSON.stringify(p)); bad[5][4] = 99;
  T.eq(C().parsePayload(S(), 1, bad), null, "індекс набору поза межами");
  const changed = JSON.parse(JSON.stringify(S()));
  changed[2].variants[0].starter += "# нове\n";
  T.eq(C().parsePayload(changed, 1, p), "stale");
});

T.test("core: посилання — старий результат без variant/chosenIdx бере варіант із набору", () => {
  const r = toyResult();
  r.items.forEach(it => { delete it.variant; delete it.chosenIdx; });
  const p = C().buildPayload(S(), 1, r, { q:{ variant:1 }, f:{ variant:0 }, p:{ variant:0 } });
  T.eq(p[3], [1, 0], "варіант із набору, відповідь — за текстом");
  T.eq(C().buildPayload(S(), 1, r, {}), null, "без набору — не вгадуємо");
});

T.test("core: packShare / unpackShare з кирилицею", async () => {
  const obj = [1, "", "abc", [0, 1, [3, 0, "print(\"Привіт, світе!\")"], ""]];
  const s = await C().packShare(obj);
  T.ok(/^[zj][A-Za-z0-9_-]+$/.test(s), "base64url з префіксом");
  T.eq(await C().unpackShare(s), obj);
});
})();
