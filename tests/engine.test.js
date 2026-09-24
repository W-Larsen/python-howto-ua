"use strict";
(function(){
const TOY = "toy", TOY2 = "toy2";
const keys = (prefix) => ["_pick", "_draft", "_result"].map(k => prefix + k);
const clear = (prefix) => keys(prefix).forEach(k => localStorage.removeItem(k));
const root = (slug) => document.querySelector(`#page-${slug} [data-check-root]`);
const $in = (slug, sel) => root(slug).querySelector(sel);

function sandbox(slug){
  const sec = document.createElement("section");
  sec.id = "page-" + slug;
  sec.innerHTML = `<div class="wrap wide"><div data-check-root></div></div>`;
  document.getElementById("sandbox").appendChild(sec);
}
function defineToy(slug){
  clear("test_" + slug);
  sandbox(slug);
  CheckEngine.define({ slug, storage:"test_" + slug, title:"Тестовий тест " + slug,
    lede:"Лід", rules:"Правила", slots:JSON.parse(JSON.stringify(TOY_SLOTS)), total:4 });
}
function type(ta, value){
  ta.value = value;
  ta.dispatchEvent(new Event("input", { bubbles:true }));
}

T.test("engine: define реєструє сторінку й get повертає тест", () => {
  defineToy(TOY);
  defineToy(TOY2);
  T.eq(typeof PageInit[TOY], "function");
  T.eq(CheckEngine.get(TOY).shareVersion, 1);
});

T.test("engine: сторінка малюється з прогресом «0 з 3» і трьома завданнями", async () => {
  PageInit[TOY]();
  PageInit[TOY2]();
  T.eq($in(TOY, "h1").textContent, "Тестовий тест toy");
  T.eq($in(TOY, '[data-part="progress-text"]').textContent, "Відповіли 0 з 3");
  T.eq(root(TOY).querySelectorAll(".checkq").length, 3);
  T.ok($in(TOY, ".checkq-n").textContent.includes("0.5 бала"));
  await T.until(() => !$in(TOY, '[data-part="body"]').hidden);
});

T.test("engine: відповідь на питання рахується в прогресі й пишеться в чернетку свого тесту", () => {
  const radio = $in(TOY, '[data-slot="q"] input[type=radio]');
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles:true }));
  T.eq($in(TOY, '[data-part="progress-text"]').textContent, "Відповіли 1 з 3");
  T.eq(JSON.parse(localStorage.getItem("test_toy_draft")).mcq.q, +radio.value);
  T.ok(radio.name !== $in(TOY2, '[data-slot="q"] input[type=radio]').name, "різні name у різних тестах");
  T.eq($in(TOY2, '[data-part="progress-text"]').textContent, "Відповіли 0 з 3", "інший тест не змінився");
});

T.test("engine: «Запустити» в програмі показує вивід на введених даних", () => {
  const card = $in(TOY, '[data-slot="p"]');
  type(card.querySelector('[data-role="editor"]'), "a = int(input())\nb = int(input())\nprint(a + b)\n");
  type(card.querySelector('[data-role="stdin"]'), "40\n2");
  card.querySelector('[data-act="run"]').click();
  T.eq(card.querySelector('[data-role="out"]').textContent, "42\n");
  T.ok(card.querySelector('[data-role="msg"]').classList.contains("good"));
  T.eq(JSON.parse(localStorage.getItem("test_toy_draft")).stdin.p, "40\n2");
});

T.test("engine: нескінченний цикл у «Запустити» не вішає сторінку", () => {
  const card = $in(TOY, '[data-slot="p"]');
  const before = card.querySelector('[data-role="editor"]').value;
  type(card.querySelector('[data-role="editor"]'), "while True:\n    pass\n");
  card.querySelector('[data-act="run"]').click();
  T.ok(card.querySelector('[data-role="msg"]').textContent.startsWith("Схоже, цикл ніколи"));
  type(card.querySelector('[data-role="editor"]'), before);
});

T.test("engine: завершення — бал, збережений результат, посилання", async () => {
  const card = $in(TOY, '[data-slot="f"]');
  type(card.querySelector('[data-role="editor"]'), "def double(x):\n    return x * 2\n");
  const btn = $in(TOY, '[data-part="finish"]');
  btn.click();
  T.ok(!localStorage.getItem("test_toy_result"), "перше натискання лише просить підтвердження");
  btn.click();
  const saved = JSON.parse(localStorage.getItem("test_toy_result"));
  const q = saved.items[0];
  T.eq(saved.total, q.earned + 2 + 1.5);
  T.eq(saved.max, 4);
  T.ok(!localStorage.getItem("test_toy_draft"), "чернетку прибрано");
  T.ok($in(TOY, ".checkr-score-n").textContent.startsWith(CheckCore.fmtPoints(saved.total)));
  await T.until(() => !$in(TOY, ".checkr-share").hidden);
  const url = $in(TOY, ".checkr-share-url").value;
  T.ok(url.includes("#/toy/r/"), url);
  window.__toyLink = url.split("#")[1];
});

T.test("engine: чуже посилання в браузері, де тест не починали, — той самий результат і нічого в localStorage", async () => {
  const slug = "toy4";                           /* свіжий тест з тими самими слотами */
  defineToy(slug);
  const saved = JSON.parse(localStorage.getItem("test_toy_result"));
  location.hash = "#/" + slug + "/r/" + window.__toyLink.replace(/^\/toy\/r\//, "");
  PageInit[slug]();                              /* як роутер: сторінка вперше відкривається за посиланням */
  await T.until(() => $in(slug, ".checkr-own"));
  T.eq($in(slug, ".checkr-score-n").textContent, CheckCore.fmtPoints(saved.total) + " / 4");
  T.ok(!localStorage.getItem("test_toy4_pick"), "перегляд посилання не створює набір");
  T.ok(!localStorage.getItem("test_toy4_draft"), "і чернетку");
  T.ok(!localStorage.getItem("test_toy4_result"), "і не блокує власну спробу");
  history.replaceState(null, "", location.pathname);
});

T.test("engine: результат програми з проваленим набором показує «ввели → очікувалось → вивела»", async () => {
  const slug = "toy3";
  defineToy(slug);
  PageInit[slug]();
  await T.until(() => !$in(slug, '[data-part="body"]').hidden);
  type($in(slug, '[data-slot="p"] [data-role="editor"]'), "print(3)\n");
  const btn = $in(slug, '[data-part="finish"]');
  btn.click(); btn.click();
  const io = $in(slug, ".checkr-io");
  T.ok(io, "є блок діагностики");
  T.ok(io.textContent.includes("5\n5") && io.textContent.includes("10"), io.textContent);
});
})();

(function(){
const L = () => window.LEGACY_ENGINEERING;
const data = () => L().link.match(/^#\/check\/r\/([A-Za-z0-9_-]+)$/)[1];

T.test("інженерний: старе посилання розбирається з тим самим результатом", async () => {
  const def = CheckEngine.get("check");
  T.eq(def.shareVersion, 2);
  const r = CheckCore.parsePayload(def.slots, def.shareVersion, await CheckCore.unpackShare(data()));
  T.ok(r && r !== "stale", "посилання розібралось");
  T.eq(r.total, L().result.total);
  T.eq(r.items.map(i => i.earned), L().result.items.map(i => i.earned));
  T.eq(r.items.map(i => i.yourCode || null), L().result.items.map(i => i.yourCode || null));
});

T.test("інженерний: новий код будує байт-у-байт той самий payload зі збереженого результату", async () => {
  const def = CheckEngine.get("check");
  const legacy = await CheckCore.unpackShare(data());
  T.eq(CheckCore.buildPayload(def.slots, def.shareVersion, L().result, L().pick), legacy);
});

T.test("інженерний: результат без variant/chosenIdx (з часів до посилань) теж дає той самий payload", async () => {
  const def = CheckEngine.get("check");
  const old = JSON.parse(JSON.stringify(L().result));
  old.items.forEach(it => { delete it.variant; delete it.chosenIdx; });
  T.eq(CheckCore.buildPayload(def.slots, def.shareVersion, old, L().pick), await CheckCore.unpackShare(data()));
});
})();
