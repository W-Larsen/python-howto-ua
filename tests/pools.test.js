"use strict";
(function(){
/* кожен пул: розв'язки проходять свої приховані тести, стартовий код — ні,
   у питанні рівно одна повна відповідь, сума балів — 12 */
["check", "check-9", "check-9plus"].forEach(slug => {
  T.test("пул " + slug + ": самоперевірка без проблем", async () => {
    const def = CheckEngine.get(slug);
    T.ok(def, "тест " + slug + " зареєстровано");
    T.eq(await CheckPy.validate(def), []);
  });
});

T.test("пул check-9: склад як у спеці §9.1", () => {
  const def = CheckEngine.get("check-9");
  T.eq(def.slots.map(s => s.type + ":" + s.points), [
    "mcq:1", "mcq:1", "mcq:1", "mcq:1", "mcq:1", "mcq:1", "mcq:1",
    "program:1", "program:1", "program:1", "program:2"]);
  T.eq(def.storage, "pyguide_check9");
  T.eq(def.shareVersion, 1);
});

T.test("пул check-9plus: склад як у спеці §9.2", () => {
  const def = CheckEngine.get("check-9plus");
  T.eq(def.slots.map(s => s.type + ":" + s.points), [
    "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5", "mcq:0.5",
    "program:2", "program:2", "program:2", "code:2"]);
  T.eq(def.storage, "pyguide_check9plus");
});

T.test("пули: у кожному слоті лишився хоча б один варіант, не виведений з обігу", () => {
  ["check", "check-9", "check-9plus"].forEach(slug => CheckEngine.get(slug).slots.forEach(s =>
    T.ok(s.variants.some(v => !v.retired), slug + "/" + s.id + ": усі варіанти retired")));
});

T.test("пул check-9plus: часткова відповідь у питанні на 0.5 бала — 0.25", () => {
  const slot = CheckEngine.get("check-9plus").slots[0];
  const half = slot.variants[0].options.findIndex(o => o.credit === 0.5);
  const item = CheckCore.mcqItem(slot, 0, half);
  T.eq(item.earned, 0.25);
  T.eq(CheckCore.fmtPoints(item.earned) + " / " + CheckCore.pointsLabel(item.points), "0.25 / 0.5 бала");
});
})();
