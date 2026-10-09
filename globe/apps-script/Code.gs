/* ==========================================================================
   Сховище коду учнів для сторінки Touch The Globe (#/globe).

   Цей файл вставляється в Google Apps Script, прив'язаний до Google
   Таблиці вчителя (як — у README.md поруч). Сайт статичний, тому код учнів
   зберігає саме цей скрипт:

     аркуш classes  — коди класів, яким можна зберігати (стовпчик A з 2-го рядка)
     аркуш settings — у клітинці B1 ключ учителя (без нього код інших не видно)
     аркуш code     — по рядку на учня й задачу: останній збережений код
     аркуш history  — кожне збереження окремим рядком (на випадок «я все стер»)

   Сторінка надсилає POST з JSON {action, ...}:
     save — {cls, name, task, code, problems}    зберегти свою задачу
     load — {cls, name}                          свій код на новому комп'ютері
     list — {cls, teacherKey}                    учні класу (без коду)
     get  — {cls, name, teacherKey}              код одного учня

   handle() — лише логіка, без Google: її перевіряє
   tests/test_globe_appscript.mjs.
   ========================================================================== */

var TASKS = ["task1.py", "task2.py", "task3.py", "task4.py", "task5.py"];
var MAX_CODE = 20000;   /* у клітинці таблиці вміщається 50 000 символів */
/* ключ, який ставить setup(): він є в репозиторії, тож не відкриває нічого */
var DEFAULT_KEY = "змініть-мене";

function normName(name){
  return String(name || "").replace(/\s+/g, " ").trim();
}

function normClass(cls){
  return normName(cls).toUpperCase();
}

function studentKey(name){
  return normName(name).toLowerCase();
}

function tasksOf(rows, cls, key){
  var tasks = {};
  rows.forEach(function(r){
    if(r.cls === cls && r.key === key)
      tasks[r.task] = { code: r.code, problems: r.problems, updated: r.updated };
  });
  return tasks;
}

function handle(req, sheets){
  req = req || {};
  var cls = normClass(req.cls);
  var name = normName(req.name);
  var teacher = req.teacherKey !== undefined;

  if(["save", "load", "list", "get"].indexOf(req.action) < 0) return { ok: false, error: "bad_action" };
  if(teacher){
    if(!sheets.teacherKey || String(sheets.teacherKey) === DEFAULT_KEY ||
       String(req.teacherKey) !== String(sheets.teacherKey))
      return { ok: false, error: "bad_key" };
  }
  var known = sheets.classes.map(normClass);
  if(known.indexOf(cls) < 0) return { ok: false, error: "bad_class" };

  if(req.action === "list"){
    if(!teacher) return { ok: false, error: "bad_key" };
    return { ok: true, rows: sheets.rows.filter(function(r){ return r.cls === cls; }).map(function(r){
      return { name: r.name, task: r.task, problems: r.problems, updated: r.updated };
    }) };
  }

  if(!name) return { ok: false, error: "bad_name" };
  var key = studentKey(name);

  if(req.action === "get"){
    if(!teacher) return { ok: false, error: "bad_key" };
    return { ok: true, tasks: tasksOf(sheets.rows, cls, key) };
  }
  if(req.action === "load") return { ok: true, tasks: tasksOf(sheets.rows, cls, key) };

  /* save */
  if(TASKS.indexOf(req.task) < 0) return { ok: false, error: "bad_task" };
  var code = String(req.code || "");
  if(code.length > MAX_CODE) return { ok: false, error: "too_long" };
  var row = {
    cls: cls, key: key, name: name, task: req.task, code: code,
    problems: Number(req.problems) || 0, updated: new Date().toISOString()
  };
  sheets.upsert(row);
  sheets.append(row);
  return { ok: true, updated: row.updated };
}

/* ---------------- Google Таблиця ---------------- */

var CODE_COLUMNS = ["cls", "key", "name", "task", "code", "problems", "updated"];

/* Текст, що починається з = + - @, таблиця прочитала б як формулу. */
function asText(v){
  v = String(v);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function sheet(book, name, header){
  var sh = book.getSheetByName(name);
  if(!sh){
    sh = book.insertSheet(name);
    if(header) sh.getRange(1, 1, 1, header.length).setValues([header]);
  }
  return sh;
}

function sheetsFromSpreadsheet(){
  var book = SpreadsheetApp.getActiveSpreadsheet();
  var codeSh = sheet(book, "code", CODE_COLUMNS);
  var histSh = sheet(book, "history", ["updated", "cls", "name", "task", "problems", "code"]);
  var classSh = sheet(book, "classes", ["Код класу"]);
  var setSh = sheet(book, "settings");

  var data = codeSh.getDataRange().getValues().slice(1);
  var rows = data.map(function(v){
    var r = {};
    CODE_COLUMNS.forEach(function(c, i){ r[c] = c === "problems" ? Number(v[i]) || 0 : String(v[i]); });
    return r;
  });
  var classes = classSh.getDataRange().getValues().slice(1)
    .map(function(v){ return String(v[0]); }).filter(function(c){ return c.trim(); });

  return {
    classes: classes,
    teacherKey: String(setSh.getRange("B1").getValue() || ""),
    rows: rows,
    upsert: function(r){
      var values = [CODE_COLUMNS.map(function(c){ return asText(r[c]); })];
      for(var i = 0; i < rows.length; i++){
        if(rows[i].cls === r.cls && rows[i].key === r.key && rows[i].task === r.task){
          codeSh.getRange(i + 2, 1, 1, CODE_COLUMNS.length).setValues(values);
          rows[i] = r;
          return;
        }
      }
      codeSh.appendRow(values[0]);
      rows.push(r);
    },
    append: function(r){
      histSh.appendRow([r.updated, r.cls, asText(r.name), r.task, r.problems, asText(r.code)]);
    }
  };
}

function doPost(e){
  var lock = LockService.getScriptLock();
  var out;
  try {
    lock.waitLock(15000);
    out = handle(JSON.parse(e.postData.contents), sheetsFromSpreadsheet());
  } catch(err){
    out = { ok: false, error: "server", detail: String(err) };
  } finally {
    try { lock.releaseLock(); } catch(_){}
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Запусти один раз вручну (Run → setup): створить аркуші й заголовки. */
function setup(){
  var book = SpreadsheetApp.getActiveSpreadsheet();
  sheet(book, "code", CODE_COLUMNS).getRange("A:G").setNumberFormat("@");
  sheet(book, "history", ["updated", "cls", "name", "task", "problems", "code"]).getRange("A:F").setNumberFormat("@");
  var classes = sheet(book, "classes", ["Код класу"]);
  if(classes.getLastRow() < 2) classes.getRange("A2").setValue("9A");
  var settings = sheet(book, "settings");
  if(!settings.getRange("A1").getValue()){
    settings.getRange("A1").setValue("Ключ учителя:");
    settings.getRange("B1").setValue(DEFAULT_KEY);
  }
}
