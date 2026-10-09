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
console.log("ok");
