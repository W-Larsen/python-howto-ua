"use strict";
/* Сторінка Touch The Globe: дисплей, сховище, рушій і архіви. */
(function(){

/* ---------------- дисплей Nokia 5110 ---------------- */
T.test("globe lcd: шрифт — 95 символів по 5 стовпчиків, 'A' як у glcdfont", () => {
  T.eq(GlobeLCD.FONT.length, 95 * 5);
  T.eq(GlobeLCD.glyph("A"), [0x7C, 0x12, 0x11, 0x12, 0x7C]);
  T.eq(GlobeLCD.glyph(" "), [0, 0, 0, 0, 0]);
});

T.test("globe lcd: інвертований рядок — темне тло, світлі літери", () => {
  const lcd = GlobeLCD.create(document.createElement("canvas"));
  lcd.draw(["Ukraine", "", "", "", "", ""], [true, false, false, false, false, false]);
  T.eq(lcd.pixel(83, 0), 1);   /* кінець 0-го рядка — тло темне */
  T.eq(lcd.pixel(83, 8), 0);   /* 1-й рядок порожній */
  T.eq(lcd.pixel(0, 0), 0);    /* перший стовпчик 'U' в інвертованому рядку — світлий */
});

T.test("globe lcd: літера стоїть у своїй клітинці 6×8", () => {
  const lcd = GlobeLCD.create(document.createElement("canvas"));
  lcd.draw(["", "", "", "", "", "             A"], [false, false, false, false, false, false]);
  /* 'A', стовпчик 0 = 0x7C: біти 2..6 → y = 40+2 .. 40+6 */
  T.eq(lcd.pixel(78, 40 + 1), 0);
  T.eq(lcd.pixel(78, 40 + 2), 1);
  T.eq(lcd.pixel(78, 40 + 6), 1);
});

/* ---------------- сховище ---------------- */
const okFetch = (reply, log) => (url, o) => {
  if(log) log.push({ url, o, body: JSON.parse(o.body) });
  return Promise.resolve({ ok:true, json:() => Promise.resolve(reply) });
};

T.test("globe store: нормалізація імені й класу", () => {
  T.eq(GlobeStore.normWho({ cls:" 9a ", name:"  Олена   Петренко " }),
       { cls:"9A", name:"Олена Петренко", key:"9A|олена петренко" });
});

T.test("globe store: хто учень — пам'ятається, а чернетки в кожного свої", () => {
  GlobeStore.setWho({ cls:"9a", name:"Тест  Один" });
  T.eq(GlobeStore.who().key, "9A|тест один");
  GlobeStore.setDraft("task1.py", "a = 1");
  GlobeStore.setWho({ cls:"9A", name:"Тест Два" });
  T.eq(GlobeStore.draft("task1.py"), null);
  GlobeStore.setWho({ cls:"9A", name:"тест один" });
  T.eq(GlobeStore.draft("task1.py"), "a = 1");
});

T.test("globe store: без адреси сховища — offline, без запитів", async () => {
  const log = [];
  GlobeStore._fetch = okFetch({ ok:true }, log);
  GlobeStore._endpoint = "";
  const r = await GlobeStore.save("task1.py", "x", 0);
  T.eq(r, { ok:false, error:"offline" });
  T.eq(log.length, 0);
});

T.test("globe store: без мережі — {ok:false}, чернетка лишається", async () => {
  GlobeStore._fetch = () => Promise.reject(new Error("net"));
  GlobeStore._endpoint = "https://example.invalid/exec";
  GlobeStore.setWho({ cls:"9A", name:"Тест Учень" });
  GlobeStore.setDraft("task1.py", "print(1)");
  const r = await GlobeStore.save("task1.py", "print(1)", 0);
  T.eq(r.ok, false);
  T.eq(r.error, "network");
  T.eq(GlobeStore.draft("task1.py"), "print(1)");
});

T.test("globe store: save надсилає text/plain з учнем, задачею й кодом", async () => {
  const log = [];
  GlobeStore._endpoint = "https://example.invalid/exec";
  GlobeStore._fetch = okFetch({ ok:true, updated:"2026-10-09T10:00:00Z" }, log);
  GlobeStore.setWho({ cls:"9A", name:"Тест Учень" });
  T.eq((await GlobeStore.save("task2.py", "x = 1", 2)).ok, true);
  T.eq(log[0].url, "https://example.invalid/exec");
  T.eq(log[0].o.method, "POST");
  T.eq(log[0].o.headers["Content-Type"], "text/plain;charset=utf-8");
  T.eq(log[0].body, { action:"save", cls:"9A", name:"Тест Учень", task:"task2.py", code:"x = 1", problems:2 });
});

T.test("globe store: відповіді вчителя й помилки сервера", async () => {
  const log = [];
  GlobeStore._fetch = okFetch({ ok:false, error:"bad_key" }, log);
  const r = await GlobeStore.teacherList("k", "9a");
  T.eq(r, { ok:false, error:"bad_key" });
  T.eq(log[0].body, { action:"list", cls:"9A", teacherKey:"k" });
  T.ok(/ключ/i.test(GlobeStore.errorText("bad_key")));
  GlobeStore._fetch = okFetch({ ok:true, tasks:{} }, log);
  await GlobeStore.teacherGet("k", "9a", " Олена ");
  T.eq(log[1].body, { action:"get", cls:"9A", name:"Олена", teacherKey:"k" });
  GlobeStore.clearWho();
  T.eq(GlobeStore.who(), null);
});

})();
