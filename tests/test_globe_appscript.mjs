/* Логіка Apps Script для сторінки Touch The Globe (globe/apps-script/Code.gs)
   без Google: handle() отримує «таблицю» у пам'яті.
   Запуск з кореня репозиторію: node tests/test_globe_appscript.mjs */
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../globe/apps-script/Code.gs", import.meta.url), "utf8"), ctx);

function mem(){
  const rows = [], log = [];
  return {
    classes: ["9A"], teacherKey: "k", rows, log,
    upsert(r){
      const i = rows.findIndex(x => x.cls === r.cls && x.key === r.key && x.task === r.task);
      if(i < 0) rows.push(r); else rows[i] = r;
    },
    append(r){ log.push(r); }
  };
}

const s = mem();
const h = (req) => ctx.handle(req, s);

assert.equal(h({ action:"save", cls:"9B", name:"A", task:"task1.py", code:"" }).error, "bad_class");
assert.equal(h({ action:"save", cls:"9a", name:"Олена", task:"task1.py", code:"x=1", problems:0 }).ok, true);
h({ action:"save", cls:"9A", name:"  олена ", task:"task1.py", code:"x=2", problems:1 });
assert.equal(s.rows.length, 1, "той самий учень — той самий рядок");
assert.equal(s.rows[0].code, "x=2");
assert.equal(s.rows[0].name, "олена");
assert.equal(s.log.length, 2, "кожне збереження — в історію");
assert.equal(h({ action:"load", cls:"9A", name:"Олена" }).tasks["task1.py"].code, "x=2");
assert.equal(h({ action:"load", cls:"9C", name:"Олена" }).error, "bad_class");
assert.equal(h({ action:"save", cls:"9A", name:"", task:"task1.py", code:"" }).error, "bad_name");
assert.equal(h({ action:"save", cls:"9A", name:"A", task:"task9.py", code:"" }).error, "bad_task");
assert.equal(h({ action:"save", cls:"9A", name:"A", task:"task1.py", code:"x".repeat(20001) }).error, "too_long");
assert.equal(h({ action:"list", cls:"9A", teacherKey:"bad" }).error, "bad_key");
assert.equal(h({ action:"list", cls:"9A", teacherKey:"" }).error, "bad_key");
const list = h({ action:"list", cls:"9A", teacherKey:"k" });
assert.equal(list.rows.length, 1);
assert.equal(list.rows[0].code, undefined, "список — без коду, лише час і помилки");
assert.equal(list.rows[0].problems, 1);
assert.equal(h({ action:"get", cls:"9A", name:"ОЛЕНА", teacherKey:"k" }).tasks["task1.py"].code, "x=2");
assert.equal(h({ action:"get", cls:"9A", name:"Олена", teacherKey:"x" }).error, "bad_key");
assert.equal(h({ action:"nope" }).error, "bad_action");
assert.equal(ctx.normName("  Олена   Петренко "), "Олена Петренко");
/* ключ за замовчуванням із setup() опубліковано в репозиторії — він не має працювати */
const fresh = mem(); fresh.teacherKey = "змініть-мене";
assert.equal(ctx.handle({ action:"list", cls:"9A", teacherKey:"змініть-мене" }, fresh).error, "bad_key");
/* ---------- країни вчителя: таблиця countries + mp3 на Google Drive ---------- */
function withDrive(sheet){
  const files = {}; let n = 0;
  return Object.assign(sheet, {
    countries: [], files,
    upsertCountry(r){ const i = this.countries.findIndex(x => x.id === r.id); if(i < 0) this.countries.push(r); else this.countries[i] = r; },
    deleteCountry(id){ this.countries = this.countries.filter(x => x.id !== id); },
    saveAudio(id, b64){ const fid = "f" + (++n); files[fid] = b64; return fid; },
    readAudio(fid){ return files[fid]; },
    dropAudio(fid){ delete files[fid]; }
  });
}
const d = withDrive(mem());
const C = (req) => ctx.handle(req, d);
const fr = { name:"Франція", capital:"Париж", continent:"Європа", lcd_name:"France", lcd_capital:"Paris", text:"Сир." };

assert.equal(C({ action:"add_country", teacherKey:"bad", id:"FR", country:fr }).error, "bad_key");
assert.equal(C({ action:"add_country", teacherKey:"k", id:"fr1", country:fr }).error, "bad_id");
assert.equal(C({ action:"add_country", teacherKey:"k", id:"FR", country:{ name:"", lcd_name:"France", text:"x" } }).error, "bad_country");
assert.equal(C({ action:"add_country", teacherKey:"k", id:"FR", country:fr, audio:"A".repeat(7000001) }).error, "too_big");
assert.equal(C({ action:"add_country", teacherKey:"k", id:"FR", country:fr, audio:"AAAA" }).ok, true);
assert.equal(Object.keys(d.files).length, 1);
const clist = C({ action:"countries" });
assert.equal(clist.ok, true);
assert.equal(clist.countries.length, 1);
assert.equal(clist.countries[0].id, "FR");
assert.equal(clist.countries[0].fields.lcd_name, "France");
assert.equal(clist.countries[0].has_audio, true);
assert.equal(clist.countries[0].audio_file, undefined, "id файлу на Drive назовні не віддаємо");
assert.equal(C({ action:"audio", id:"FR" }).audio, "AAAA");
assert.equal(C({ action:"audio", id:"JP" }).error, "no_audio");
/* новий текст без нового mp3 — старий запис лишається */
C({ action:"add_country", teacherKey:"k", id:"FR", country:Object.assign({}, fr, { text:"Новий." }) });
assert.equal(C({ action:"countries" }).countries[0].fields.text, "Новий.");
assert.equal(C({ action:"audio", id:"FR" }).audio, "AAAA");
/* новий mp3 замінює старий, старий файл прибирається */
C({ action:"add_country", teacherKey:"k", id:"FR", country:fr, audio:"BBBB" });
assert.equal(C({ action:"audio", id:"FR" }).audio, "BBBB");
assert.equal(Object.keys(d.files).length, 1);
assert.equal(C({ action:"delete_country", teacherKey:"x", id:"FR" }).error, "bad_key");
assert.equal(C({ action:"delete_country", teacherKey:"k", id:"FR" }).ok, true);
assert.equal(C({ action:"countries" }).countries.length, 0);
assert.equal(Object.keys(d.files).length, 0);
/* ---------- doPost: публічне читання країн — без блокування й без аркуша з кодом учнів ---------- */
{
  const calls = { lock:0, sheetsRead:[] };
  const range = (vals) => ({ getValues:() => vals, setValues(){}, setNumberFormat(){}, getValue:() => "k", setValue(){} });
  const sheetObj = (name, vals) => ({ getDataRange(){ calls.sheetsRead.push(name); return range(vals); },
    getRange:() => range(vals), appendRow(){}, deleteRow(){}, getLastRow:() => vals.length });
  const book = { getSheetByName:(n) => sheetObj(n, n === "countries"
      ? [["id"], ["FR", "Франція", "", "", "France", "Paris", "Сир.", "f1", "2026"]] : [["h"]]),
    insertSheet:(n) => sheetObj(n, [["h"]]) };
  const g = {
    SpreadsheetApp:{ getActiveSpreadsheet:() => book },
    LockService:{ getScriptLock:() => { calls.lock++; return { waitLock(){}, releaseLock(){} }; } },
    ContentService:{ MimeType:{ JSON:"json" }, createTextOutput:(t) => ({ setMimeType(){ return t; } }) },
    DriveApp:{ getFileById:() => ({ getBlob:() => ({ getBytes:() => [73, 68, 51] }) }) },
    Utilities:{ base64Encode:() => "SUQz" }
  };
  const c2 = Object.assign({}, g); vm.createContext(c2);
  vm.runInContext(fs.readFileSync(new URL("../globe/apps-script/Code.gs", import.meta.url), "utf8"), c2);
  const out = JSON.parse(c2.doPost({ postData:{ contents: JSON.stringify({ action:"countries" }) } }));
  assert.equal(out.ok, true);
  assert.equal(out.countries[0].id, "FR");
  assert.equal(calls.lock, 0, "читання країн не чекає на блокування");
  assert.deepEqual(calls.sheetsRead, ["countries"], "читається лише аркуш countries");
  const a = JSON.parse(c2.doPost({ postData:{ contents: JSON.stringify({ action:"audio", id:"FR" }) } }));
  assert.equal(a.audio, "SUQz");
  assert.equal(calls.lock, 0);
}
/* ---------- країни кнопок: однакова відповідність для всіх учнів ---------- */
/* об'єкти з vm-контексту мають інші прототипи — порівнюємо як JSON */
const same = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));
{
  const b = Object.assign(mem(), { buttons: [], saveButtons(list){ this.buttons = list; } });
  const B = (req) => ctx.handle(req, b);
  same(B({ action:"buttons" }), { ok:true, buttons:[] }, "читання публічне й без ключа");
  assert.equal(B({ action:"set_buttons", teacherKey:"bad", buttons:["UA"] }).error, "bad_key");
  assert.equal(B({ action:"set_buttons", buttons:["UA"] }).error, "bad_key");
  assert.equal(B({ action:"set_buttons", teacherKey:"k", buttons:["u1"] }).error, "bad_id");
  assert.equal(B({ action:"set_buttons", teacherKey:"k", buttons:"UA" }).error, "bad_buttons");
  assert.equal(B({ action:"set_buttons", teacherKey:"k", buttons:Array(9).fill("UA") }).error, "bad_buttons");
  const saved = B({ action:"set_buttons", teacherKey:"k", buttons:[" ua ", "AU", "", "JP"] });
  same(saved, { ok:true, buttons:["UA", "AU", "", "JP"] });
  same(b.buttons, ["UA", "AU", "", "JP"]);
  same(B({ action:"buttons" }).buttons, ["UA", "AU", "", "JP"]);
}
/* ---------- doPost: читання кнопок — без блокування, лише аркуш settings ---------- */
{
  const calls = { lock:0, read:[], wrote:null };
  const cell = (name) => ({ getValue:() => name === "settings" ? "UA,AU,,JP" : "", setValue(v){ calls.wrote = v; },
    setNumberFormat(){} });
  const sheetObj = (name) => ({ getRange:(a) => { calls.read.push(name + "!" + a); return cell(name); },
    getDataRange:() => { calls.read.push(name); return { getValues:() => [["h"]] }; }, getLastRow:() => 1 });
  const g = {
    SpreadsheetApp:{ getActiveSpreadsheet:() => ({ getSheetByName:(n) => sheetObj(n), insertSheet:(n) => sheetObj(n) }) },
    LockService:{ getScriptLock:() => { calls.lock++; return { waitLock(){}, releaseLock(){} }; } },
    ContentService:{ MimeType:{ JSON:"json" }, createTextOutput:(t) => ({ setMimeType(){ return t; } }) }
  };
  const c3 = Object.assign({}, g); vm.createContext(c3);
  vm.runInContext(fs.readFileSync(new URL("../globe/apps-script/Code.gs", import.meta.url), "utf8"), c3);
  const out = JSON.parse(c3.doPost({ postData:{ contents: JSON.stringify({ action:"buttons" }) } }));
  same(out, { ok:true, buttons:["UA", "AU", "", "JP"] });
  assert.equal(calls.lock, 0);
  same(calls.read, ["settings!B2"], "читається лише клітинка з країнами кнопок");
}
console.log("ok");
