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

T.test("globe store: чернетка пам'ятає, коли її змінили", () => {
  GlobeStore.setWho({ cls:"9A", name:"Тест Час" });
  const before = Date.now();
  GlobeStore.setDraft("task3.py", "x = 3");
  const t = Date.parse(GlobeStore.draftTime("task3.py"));
  T.ok(t >= before - 1000 && t <= Date.now() + 1000, String(GlobeStore.draftTime("task3.py")));
  T.eq(GlobeStore.draftTime("task4.py"), null);
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

/* ---------------- рушій: знімок проєкту + Pyodide ---------------- */
const T1 = 'def on_button(number):\n    if number == 1:\n        play_sound("UA")\n        show_country("UA")\n';

T.test("globe runtime: без знімка — зрозуміла помилка, а не вічне очікування", async () => {
  GlobeRuntime.base = "../nope/";
  let msg = "";
  try { await GlobeRuntime.boot(); } catch(e){ msg = e.message; }
  T.ok(/не вдалося завантажити проєкт глобуса/i.test(msg), msg);
  T.ok(!GlobeRuntime.isReady());
});

T.test("globe runtime: boot, шаблон задачі і довідка API", async () => {
  GlobeRuntime.base = "../";
  await GlobeRuntime.boot();
  T.ok(GlobeRuntime.isReady());
  T.ok(GlobeRuntime.template(1).includes("def on_button(number):"));
  T.ok(GlobeRuntime.template(5).includes("def loading():"));
  T.ok(GlobeRuntime.apiDoc().includes("def show_text("));
});

T.test("globe runtime: press 1 — екран України і звук", () => {
  const r = GlobeRuntime.run({ "task1.py": T1 }, "1");
  const f = r.events.filter(e => e.kind === "frame").pop();
  T.eq(f.rows[0], "Ukraine");
  T.ok(r.events.some(e => e.kind === "sound" && e.id === "UA"));
});

T.test("globe runtime: check знаходить помилку з рядком", () => {
  const p = GlobeRuntime.check({ "task1.py": 'def hello_screen():\n    show_text(9, "x")\n' }).problems;
  T.ok(p.some(x => x.line === 2 && x.level === "error"), JSON.stringify(p));
});

T.test("globe runtime: живий режим — кнопка 1", () => {
  GlobeRuntime.liveStart({ "task1.py": T1 });
  const r = GlobeRuntime.livePress("1");
  T.eq(r.events.filter(e => e.kind === "frame").pop().rows[0], "Ukraine");
  T.eq(GlobeRuntime.liveMode(), "normal");
});

T.test("globe runtime: student_code.h", () => {
  const h = GlobeRuntime.header({ "task1.py": T1 });
  T.ok(h.header.includes("STUDENT_CODE_H"));
});

T.test("globe runtime: mp3 країни з архіву", async () => {
  T.ok(/^blob:/.test(await GlobeRuntime.audioUrl("UA")));
  T.eq(await GlobeRuntime.audioUrl("ZZ"), null);
});

/* ---------------- архіви для скачування ---------------- */
T.test("globe bundle: проєкт — код учня замість заготовок, решта як у знімку", async () => {
  GlobeRuntime.base = "../";
  await GlobeRuntime.boot();
  const blob = await GlobeBundle.project({ "task1.py": T1 });
  const z = await JSZip.loadAsync(blob);
  T.eq(await z.file("Touch_The_Globe/students/task1.py").async("string"), T1);
  T.eq(await z.file("Touch_The_Globe/students/task2.py").async("string"), GlobeRuntime.template(2));
  T.ok(z.file("Touch_The_Globe/globe_core/engine.py"));
  const h = await z.file("Touch_The_Globe/arduino/TouchTheGlobe/student_code.h").async("string");
  T.eq(h, GlobeRuntime.header({ "task1.py": T1, "task2.py": GlobeRuntime.template(2),
    "task3.py": GlobeRuntime.template(3), "task4.py": GlobeRuntime.template(4),
    "task5.py": GlobeRuntime.template(5) }).header);
});

T.test("globe bundle: проєкт з помилкою все одно скачується (student_code.h — зі знімка)", async () => {
  const bad = 'def hello_screen():\n    show_text(9, "x")\n';
  const z = await JSZip.loadAsync(await GlobeBundle.project({ "task1.py": bad }));
  T.eq(await z.file("Touch_The_Globe/students/task1.py").async("string"), bad);
  T.ok(z.file("Touch_The_Globe/arduino/TouchTheGlobe/student_code.h"));
});

T.test("globe bundle: скетч — лише TouchTheGlobe/ з новим student_code.h", async () => {
  const r = await GlobeBundle.sketch({ "task1.py": T1 });
  T.eq(r.problems.filter(p => p.level === "error"), []);
  const z = await JSZip.loadAsync(r.blob);
  T.ok((await z.file("TouchTheGlobe/student_code.h").async("string")).includes("s_number"));
  T.ok(z.file("TouchTheGlobe/TouchTheGlobe.ino"));
  T.ok(z.file("TouchTheGlobe/countries.h"));
  T.eq(Object.keys(z.files).filter(n => !n.startsWith("TouchTheGlobe/")), []);
});

T.test("globe bundle: скетч з помилками — без архіву, зі списком проблем", async () => {
  const r = await GlobeBundle.sketch({ "task1.py": 'def hello_screen():\n    show_text(9, "x")\n' });
  T.eq(r.blob, undefined);
  T.ok(r.problems.some(p => p.level === "error" && p.line === 2));
});

})();
