"use strict";
(function(){
/* кожен пул: розв'язки проходять свої приховані тести, стартовий код — ні,
   у питанні рівно одна повна відповідь, сума балів — 12 */
["check", "check-9"].forEach(slug => {
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
})();
