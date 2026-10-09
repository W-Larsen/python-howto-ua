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

T.test("globe store: країни вчителя — список, mp3, додати, прибрати", async () => {
  const log = [];
  GlobeStore._endpoint = "https://example.invalid/exec";
  GlobeStore._fetch = okFetch({ ok:true, countries:[] }, log);
  T.eq(await GlobeStore.countries(), { ok:true, countries:[] });
  await GlobeStore.audio("FR");
  await GlobeStore.addCountry("k", "FR", { name:"Франція" }, "AAAA");
  await GlobeStore.addCountry("k", "FR", { name:"Франція" });
  await GlobeStore.deleteCountry("k", "FR");
  T.eq(log.map(x => x.body), [
    { action:"countries" },
    { action:"audio", id:"FR" },
    { action:"add_country", teacherKey:"k", id:"FR", country:{ name:"Франція" }, audio:"AAAA" },
    { action:"add_country", teacherKey:"k", id:"FR", country:{ name:"Франція" } },
    { action:"delete_country", teacherKey:"k", id:"FR" }
  ]);
  T.ok(/5 МБ/.test(GlobeStore.errorText("too_big")));
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

T.test("globe runtime: країни вчителя зі сховища — у каталозі, у симуляторі, зі своїм mp3", async () => {
  const fr = { id:"FR", has_audio:true, updated:"2026-10-09T10:00:00Z",
    fields:{ name:"Франція", capital:"Париж", continent:"Європа", lcd_name:"France", lcd_capital:"Paris", text:"Сир." } };
  const bad = { id:"XX", has_audio:false, updated:"", fields:{ name:"X", lcd_name:"Ікс", lcd_capital:"X", text:"x" } };
  let countries = [fr, bad];
  GlobeStore._endpoint = "https://example.invalid/exec";
  GlobeStore._fetch = (url, o) => {
    const b = JSON.parse(o.body);
    const reply = b.action === "countries" ? { ok:true, countries } : b.action === "audio" ? { ok:true, audio:"SUQz" } : { ok:false };
    return Promise.resolve({ ok:true, json:() => Promise.resolve(reply) });
  };
  const r = await GlobeRuntime.loadCountries();
  T.eq(r.skipped.map(s => s.id), ["XX"]);
  const fr2 = GlobeRuntime.countries().find(c => c.id === "FR");
  T.ok(fr2 && fr2.extra && fr2.has_audio);
  const run = GlobeRuntime.run({ "task1.py": 'def on_button(number):\n    show_country("FR")\n' }, "1");
  T.eq(run.events.filter(e => e.kind === "frame").pop().rows[0], "France");
  const url = await GlobeRuntime.audioUrl("FR");
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  T.eq([...bytes], [73, 68, 51]);       /* "ID3" — те, що прийшло зі сховища */
  T.eq(GlobeRuntime.checkCountry("FR", fr.fields).errors, []);
  T.ok(GlobeRuntime.countriesHeader().header.includes('"France"'));
  countries = [];
  await GlobeRuntime.loadCountries();
  T.ok(!GlobeRuntime.countries().some(c => c.id === "FR"));
  GlobeStore._endpoint = "";
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

/* ---------------- архіви з країнами вчителя ---------------- */
const FR_C = { id:"FR", has_audio:true, updated:"2026-10-09T10:00:00Z",
  fields:{ name:"Франція", capital:"Париж", continent:"Європа", lcd_name:"France", lcd_capital:"Paris", text:"Сир." } };
async function withCountries(list, fn){
  GlobeStore._endpoint = "https://example.invalid/exec";
  GlobeStore._fetch = (url, o) => {
    const b = JSON.parse(o.body);
    const reply = b.action === "countries" ? { ok:true, countries:list } : b.action === "audio" ? { ok:true, audio:"SUQz" } : { ok:false };
    return Promise.resolve({ ok:true, json:() => Promise.resolve(reply) });
  };
  GlobeRuntime.base = "../";
  await GlobeRuntime.boot();
  await GlobeRuntime.loadCountries();
  try { await fn(); }
  finally { GlobeStore._endpoint = ""; GlobeRuntime.setCountries([]); }
}

T.test("globe bundle: країни вчителя потрапляють у проєкт — файл, mp3 і countries.h", () => withCountries([FR_C], async () => {
  const z = await JSZip.loadAsync(await GlobeBundle.project({}));
  const root = "Touch_The_Globe/";
  T.eq(await z.file(root + "content/countries/FR.txt").async("string"), GlobeRuntime.countryFile(FR_C.fields));
  T.eq([...await z.file(root + "content/audio/FR.mp3").async("uint8array")], [73, 68, 51]);
  T.eq(await z.file(root + "arduino/TouchTheGlobe/countries.h").async("string"), GlobeRuntime.countriesHeader().header);
}));

T.test("globe bundle: скетч з новим countries.h", () => withCountries([FR_C], async () => {
  const r = await GlobeBundle.sketch({});
  const z = await JSZip.loadAsync(r.blob);
  T.ok((await z.file("TouchTheGlobe/countries.h").async("string")).includes('"France"'));
}));

T.test("globe bundle: SD-картка — 01/NNN.mp3 за номерами треків каталогу", () => withCountries([FR_C], async () => {
  const r = await GlobeBundle.sdcard();
  const z = await JSZip.loadAsync(r.blob);
  const cat = GlobeRuntime.countries();
  T.eq(Object.keys(z.files).filter(n => !z.files[n].dir).sort(),
       cat.map(c => "01/" + String(c.track).padStart(3, "0") + ".mp3").sort());
  const fr = cat.find(c => c.id === "FR");
  T.eq([...await z.file("01/" + String(fr.track).padStart(3, "0") + ".mp3").async("uint8array")], [73, 68, 51]);
  T.eq(r.missing, []);
}));

T.test("globe bundle: SD-картка — країна без mp3 у списку «missing»", () =>
  withCountries([Object.assign({}, FR_C, { id:"DE", has_audio:false,
    fields:Object.assign({}, FR_C.fields, { name:"Німеччина", lcd_name:"Germany", lcd_capital:"Berlin" }) })], async () => {
  const r = await GlobeBundle.sdcard();
  T.eq(r.missing.map(c => c.id), ["DE"]);
}));

/* ---------------- збої сховища не губять країн учителя ---------------- */
const UA_OVER = { id:"UA", has_audio:true, updated:"2026-10-09T10:00:00Z",
  fields:{ name:"Україна", capital:"Київ", continent:"Європа", lcd_name:"Ukraina", lcd_capital:"Kyiv", text:"Наш запис." } };
function fakeStore(state){
  GlobeStore._endpoint = "https://example.invalid/exec";
  GlobeStore._fetch = (url, o) => {
    const b = JSON.parse(o.body);
    if(state.down) return Promise.reject(new Error("net"));
    if(b.action === "audio" && state.audioDown) return Promise.resolve({ ok:true, json:() => Promise.resolve({ ok:false, error:"server" }) });
    const reply = b.action === "countries" ? { ok:true, countries:state.list } : b.action === "audio" ? { ok:true, audio:"QUJD" } : { ok:false };
    return Promise.resolve({ ok:true, json:() => Promise.resolve(reply) });
  };
}

T.test("globe runtime: збій сховища не стирає вже завантажені країни вчителя", async () => {
  const state = { list:[FR_C] };
  fakeStore(state);
  GlobeRuntime.base = "../";
  await GlobeRuntime.boot();
  await GlobeRuntime.loadCountries();
  state.down = true;
  const r = await GlobeRuntime.loadCountries();
  T.eq(r.ok, false);
  T.ok(GlobeRuntime.countries().some(c => c.id === "FR"), "FR лишилась");
  T.ok(GlobeRuntime.countriesError, "помилку видно сторінці");
  state.down = false;
  await GlobeRuntime.loadCountries();
  T.eq(GlobeRuntime.countriesError, "");
  GlobeStore._endpoint = ""; GlobeRuntime.setCountries([]);
});

T.test("globe runtime: невдале завантаження mp3 не запам'ятовується", async () => {
  const state = { list:[FR_C], audioDown:true };
  fakeStore(state);
  await GlobeRuntime.loadCountries();
  T.eq(await GlobeRuntime.extraAudio("FR"), null);
  state.audioDown = false;
  T.eq([...await GlobeRuntime.extraAudio("FR")], [65, 66, 67]);
  GlobeStore._endpoint = ""; GlobeRuntime.setCountries([]);
});

T.test("globe bundle: замінений учителем UA — його запис на SD-картці й у проєкті; без запису — помилка, а не проєктний mp3", async () => {
  const state = { list:[UA_OVER] };
  fakeStore(state);
  await GlobeRuntime.loadCountries();
  const ua = GlobeRuntime.countries().find(c => c.id === "UA");
  const sd = await JSZip.loadAsync((await GlobeBundle.sdcard()).blob);
  T.eq([...await sd.file("01/" + String(ua.track).padStart(3, "0") + ".mp3").async("uint8array")], [65, 66, 67]);
  const pz = await JSZip.loadAsync(await GlobeBundle.project({}));
  T.eq([...await pz.file("Touch_The_Globe/content/audio/UA.mp3").async("uint8array")], [65, 66, 67]);
  /* сховище не віддало запис — картку не збираємо, щоб не підкласти старий UA.mp3 */
  state.list = [UA_OVER];
  await GlobeRuntime.loadCountries();
  state.audioDown = true;
  let err = "";
  try { await GlobeBundle.sdcard(); } catch(e){ err = e.message; }
  T.ok(/UA/.test(err), err);
  err = "";
  try { await GlobeBundle.project({}); } catch(e){ err = e.message; }
  T.ok(/UA/.test(err), err);
  /* «Прибрати» заміну — повертається проєктний UA */
  state.audioDown = false; state.list = [];
  await GlobeRuntime.loadCountries();
  T.eq(GlobeRuntime.countries().find(c => c.id === "UA").lcd_name, "Ukraine");
  const sd2 = await JSZip.loadAsync((await GlobeBundle.sdcard()).blob);
  const snap = await GlobeRuntime.snapshotAudio("UA");
  T.eq((await sd2.file("01/" + String(ua.track).padStart(3, "0") + ".mp3").async("uint8array")).length, snap.length);
  GlobeStore._endpoint = ""; GlobeRuntime.setCountries([]);
});

/* ---------------- сторінка учня цілком: iframe + сервер із логікою Code.gs ---------------- */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function clearGlobeStorage(){
  Object.keys(localStorage).filter(k => k.startsWith("pgsb.globe")).forEach(k => localStorage.removeItem(k));
}
/* сторінка в iframe; delay(body) — затримка відповіді сервера для цього запиту */
async function openGlobePage(sheetRows, delay){
  clearGlobeStorage();
  const gs = await (await fetch("../globe/apps-script/Code.gs")).text();
  const handle = new Function(gs + "\nreturn handle;")();
  const rows = sheetRows.slice();
  const sheet = { classes:["9A"], teacherKey:"k", rows, countries:[],
    upsert(r){ const i = rows.findIndex(x => x.cls === r.cls && x.key === r.key && x.task === r.task); if(i < 0) rows.push(r); else rows[i] = r; },
    append(){} };
  const box = document.getElementById("sandbox");
  box.innerHTML = "";
  const frame = document.createElement("iframe");
  frame.style.cssText = "width:1200px;height:700px;border:1px solid #ccc";
  frame.src = "../index.html#/globe";
  await new Promise(r => { frame.onload = r; box.appendChild(frame); });
  const w = frame.contentWindow;
  w.GlobeStore._endpoint = "https://fake/exec";
  w.GlobeStore._fetch = (url, o) => {
    const body = JSON.parse(o.body);
    return sleep(delay ? delay(body) : 20).then(() => ({ ok:true,
      json: async () => JSON.parse(JSON.stringify(handle(body, sheet))) }));
  };
  await T.until(() => w.GlobeRuntime.isReady() && !w.document.getElementById("globe-ta").disabled, 90000);
  await sleep(300);
  const d = w.document;
  const page = {
    w, d, rows,
    ta: d.getElementById("globe-ta"),
    tab(i){ d.querySelector(`.globe-tab[data-i="${i}"]`).click(); },
    type(code){ page.ta.value = code; page.ta.dispatchEvent(new w.Event("input")); },
    async login(name, cls){
      const f = d.getElementById("globe-login");
      f.name.value = name; f.cls.value = cls; f.requestSubmit();
    },
    logout(){ d.querySelector('[data-act="logout"]').click(); },
    async run(){ d.querySelector("#globe-sim .gsim-run").click(); }
  };
  return page;
}
const sheetRow = (name, task, code) => ({ cls:"9A", key:name.toLowerCase(), name, task, code, problems:0,
  updated:"2026-10-01T10:00:00.000Z" });

T.test("globe page: код до входу не перебиває збережене в таблиці й не лишається наступному учневі", async () => {
  const p = await openGlobePage([sheetRow("Олена Петренко", "task1.py", "# SHEET 1\n")]);
  p.tab(0); p.type("# ANON 1\n");
  p.tab(4); p.type("# ANON 5\n");
  await p.login("Олена Петренко", "9A");
  await sleep(600);
  p.tab(0);
  T.eq(p.ta.value, "# SHEET 1\n", "задача, яка є в таблиці, — з таблиці");
  p.tab(4);
  T.eq(p.ta.value, "# ANON 5\n", "задача, якої в таблиці нема, — та, що написали до входу");
  p.logout();
  await sleep(300);
  p.tab(0);
  T.ok(!p.ta.value.includes("ANON") && !p.ta.value.includes("SHEET"), "після виходу — заготовка: " + p.ta.value.slice(0, 40));
});

T.test("globe page: у таблицю йде свіжа кількість помилок, а не з минулої перевірки", async () => {
  const p = await openGlobePage([]);
  await p.login("Іван Коваль", "9A");
  await sleep(400);
  p.tab(0);
  p.type('def hello_screen():\n    show_text(9, "x")\n');
  await p.run();
  await T.until(() => p.rows.some(r => r.task === "task1.py"), 5000);
  T.eq(p.rows.find(r => r.task === "task1.py").problems, 1);
});

T.test("globe page: повільна відповідь таблиці не потрапляє до іншого учня", async () => {
  const p = await openGlobePage([sheetRow("Олена Петренко", "task1.py", "# SHEET OLENA\n")],
    (body) => body.action === "load" ? 1500 : 20);
  await p.login("Олена Петренко", "9A");
  await sleep(100);
  p.logout();
  await sleep(2000);
  p.tab(0);
  T.ok(!p.ta.value.includes("SHEET OLENA"), "у редакторі анонімного учня: " + p.ta.value.slice(0, 40));
  T.ok(!(p.w.GlobeStore.draft("task1.py") || "").includes("SHEET OLENA"), "у чернетках анонімного учня");
  clearGlobeStorage();
});

/* ---------------- симулятор: кнопка «вимкнути» ---------------- */
T.test("globe sim: «вимкнути» зупиняє гру — екран гасне, а наступна кнопка вмикає глобус заново", async () => {
  GlobeRuntime.base = "../";
  await GlobeRuntime.boot();
  const box = document.getElementById("sandbox");
  box.innerHTML = "<div></div>";
  const t2 = 'def next_target(round):\n    target("JP", "Tokyo!")\n';
  const sim = GlobeSim.mount(box.firstChild, { sources: () => ({ "task1.py": T1, "task2.py": t2 }), autoBoot: false });
  await sleep(100);
  const key = (k) => box.querySelector(`[data-key="${k}"]`).click();
  key("g");
  await sleep(300);                                   /* відлік 3-2-1 ще триває */
  box.querySelector('[data-act="power"]').click();
  await sleep(2500);                                  /* якби таймери не скасувались — тут був би раунд */
  let lit = 0;
  for(let y = 0; y < GlobeLCD.H; y++) for(let x = 0; x < GlobeLCD.W; x++) lit += sim.lcd.pixel(x, y);
  T.eq(lit, 0, "екран погашено");
  const log = box.querySelector(".gsim-log").innerText;
  T.ok(/вимкнено/i.test(log), log);
  T.ok(!/Round/.test(log));
  key("1");
  await sleep(300);
  T.ok(/Глобус увімкнено/.test(box.querySelector(".gsim-log").innerText));
  sim.stop();
  box.innerHTML = "";
});

/* ---------------- сторінка вчителя: країни глобуса ---------------- */
async function openTeacherPage(){
  clearGlobeStorage();
  const gs = await (await fetch("../globe/apps-script/Code.gs")).text();
  const handle = new Function(gs + "\nreturn handle;")();
  const files = {}; let n = 0;
  const sheet = { classes:["9A"], teacherKey:"k", rows:[], upsert(){}, append(){}, countries:[],
    upsertCountry(r){ const i = this.countries.findIndex(x => x.id === r.id); if(i < 0) this.countries.push(r); else this.countries[i] = r; },
    deleteCountry(id){ this.countries = this.countries.filter(x => x.id !== id); },
    saveAudio(id, b64){ const f = "f" + (++n); files[f] = b64; return f; },
    readAudio(f){ return files[f]; }, dropAudio(f){ delete files[f]; } };
  const requests = [];
  const box = document.getElementById("sandbox");
  box.innerHTML = "";
  const frame = document.createElement("iframe");
  frame.style.cssText = "width:1200px;height:700px;border:1px solid #ccc";
  frame.src = "../index.html#/globe-teacher";
  await new Promise(r => { frame.onload = r; box.appendChild(frame); });
  const w = frame.contentWindow;
  w.GlobeStore._endpoint = "https://fake/exec";
  w.GlobeStore._fetch = (url, o) => {
    const body = JSON.parse(o.body);
    requests.push(body);
    return sleep(20).then(() => ({ ok:true, json: async () => JSON.parse(JSON.stringify(handle(body, sheet))) }));
  };
  const d = w.document;
  await T.until(() => w.GlobeRuntime.isReady() && d.querySelector('[data-role="countries"] tbody tr'), 90000);
  const form = () => d.querySelector(".gt-cform");
  return {
    w, d, sheet, requests, files,
    ids: () => [...d.querySelectorAll('[data-role="countries"] tbody tr')].map(tr => tr.dataset.id),
    row: (id) => d.querySelector(`[data-role="countries"] tbody tr[data-id="${id}"]`),
    async add(id, fields, bytes){
      d.querySelector('[data-act="add-country"]').click();
      const f = form();
      f.elements.id.value = id;
      Object.entries(fields).forEach(([k, v]) => { f.elements[k].value = v; });
      if(bytes){
        const dt = new w.DataTransfer();
        dt.items.add(new w.File([new Uint8Array(bytes)], id + ".mp3", { type:"audio/mpeg" }));
        f.elements.audio.files = dt.files;
      }
      f.requestSubmit();
      await sleep(600);
    },
    msg: () => form().querySelector('[data-role="cmsg"]').innerText
  };
}

T.test("globe teacher: додати країну з mp3 — вона в списку з треком; кирилиця в lcd_name — без запиту", async () => {
  const p = await openTeacherPage();
  p.d.querySelector('.gt-login input[name="key"]').value = "k";
  T.ok(p.ids().includes("UA") && !p.ids().includes("FR"));
  const before = p.requests.length;
  await p.add("FR", Object.assign({}, FR_C.fields, { lcd_name:"Франція" }), [73, 68, 51]);
  T.ok(/lcd_name/.test(p.msg()), p.msg());
  T.eq(p.requests.length, before, "з помилкою нічого не надіслано");
  p.d.querySelector('.gt-cform').elements.lcd_name.value = "France";
  p.d.querySelector('.gt-cform').requestSubmit();
  await T.until(() => p.ids().includes("FR"), 10000);
  T.eq(Object.values(p.files), ["SUQz"], "mp3 пішов на Drive у base64");
  T.ok(/France/.test(p.row("FR").innerText));
  T.ok(/\b4\b/.test(p.row("FR").querySelector(".gt-track").innerText), "FR — 4-й трек за абеткою");
  p.row("FR").querySelector('[data-act="delete-country"]').click();
  p.row("FR").querySelector('[data-act="delete-country"]').click();   /* підтвердження */
  await T.until(() => !p.ids().includes("FR"), 10000);
  T.eq(p.sheet.countries.length, 0);
  document.getElementById("sandbox").innerHTML = "";
});

})();
