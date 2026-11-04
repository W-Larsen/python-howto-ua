/* ==========================================================================
   Python для самостійних робіт: один раз запускає Pyodide (спільний з
   практикою через PyEditor.bootPyodide) і обв'язку js/checks/harness.js,
   далі — запуск і оцінювання завдань «функція» й «програма» та
   самоперевірка пулів завдань (validate). Завдання з частковим балом
   (slot.partial) рахують, скільки прихованих тестів пройдено.
   Поки Python не завантажився (або не зміг — немає інтернету), будь-яка
   перевірка дає «не пройдено» з поясненням NOT_READY, а не кидає помилку.
   ========================================================================== */
"use strict";
window.CheckPy = (function(){

const NOT_READY = "Python не завантажився — це завдання не вдалося перевірити";
let booting = null, fns = null;

function boot(){
  if(!booting) booting = PyEditor.bootPyodide().then(py => {
    /* власний простір імен: Pyodide спільний з практикою (js/pages/shop.js),
       а її обв'язка має функції з тими самими іменами, напр. _error_text */
    const ns = py.globals.get("dict")();
    py.runPython(CheckHarness.PY, { globals:ns });
    fns = { install: ns.get("check_install"), test: ns.get("check_test"), run: ns.get("prog_run"),
      tryRun: ns.get("check_try") };
  });
  return booting;
}
const isReady = () => !!fns;

function install(name, source){
  if(!fns) return NOT_READY;
  try { return fns.install(name, source); } catch(err){ return String(err); }
}
/* скільки прихованих тестів пройдено: { passed, total } */
function testsRun(name, tests){
  if(!fns) return { passed:0, total:tests.length };
  try {
    const r = JSON.parse(fns.test(name, JSON.stringify(tests)));
    return { passed:r.passed, total:r.total };
  } catch(err){ return { passed:0, total:tests.length }; }
}
/* кнопка «Запустити» для функції: код виконується в папці з файлами-прикладами
   (files), повертається помилка й те, що код надрукував */
function tryCode(name, source, files){
  if(!fns) return { error:NOT_READY, out:"" };
  try { return JSON.parse(fns.tryRun(name, source, JSON.stringify(files || {}))); }
  catch(err){ return { error:String(err), out:"" }; }
}
function runProgram(source, inputText){
  if(!fns) return { out:"", error:NOT_READY };
  try { return JSON.parse(fns.run(source, inputText)); }
  catch(err){ return { out:"", error:String(err) }; }
}

/* passed — усі тести; passedCount — скільки з total (для часткового балу).
   Код встановлюється так само, як на «Запустити», — у папці з файлами-
   прикладами й без виводу: перевірочний print(f("numbers.txt")), який учень
   лишив у коді, не має валити оцінювання. */
function gradeCode(variant, source){
  const error = tryCode(variant.fn, source, variant.files).error;
  const total = variant.tests.length;
  const passedCount = error ? 0 : testsRun(variant.fn, variant.tests).passed;
  return { passed: passedCount === total, passedCount, total, error };
}

/* бал лише за всі набори; для першого проваленого запам'ятовуємо вивід */
function gradeProgram(variant, source){
  for(let i = 0; i < variant.tests.length; i++){
    const t = variant.tests[i];
    const r = runProgram(source, t.input);
    if(r.error || !CheckCore.sameOutput(r.out, t.output))
      return { passed:false, error:r.error, failIdx:i, failOut:r.out.slice(0, CheckCore.FAIL_OUT_MAX) };
  }
  return { passed:true, error:"", failIdx:-1, failOut:"" };
}

/* Самоперевірка пулу тесту def = { slug, slots, total? }: розв'язки проходять
   свої тести, стартовий код — ні, у питанні рівно одна повна відповідь,
   сума балів — def.total (за замовчуванням 12). */
async function validate(def){
  await boot();
  const problems = [];
  const add = (msg) => problems.push(msg);
  const total = def.total != null ? def.total : 12;
  const points = CheckCore.maxPoints(def.slots);
  if(points !== total) add(`${def.slug}: сума балів ${points}, а має бути ${total}`);
  const ids = def.slots.map(s => s.id);
  if(new Set(ids).size !== ids.length) add(`${def.slug}: id слотів повторюються`);

  def.slots.forEach(slot => slot.variants.forEach((v, vi) => {
    const where = `${def.slug}/${slot.id}#${vi}`;
    if(slot.type === "mcq"){
      const full = v.options.filter(o => o.credit === 1).length;
      if(full !== 1) add(`${where}: повних відповідей ${full}, а має бути 1`);
      if(v.options.length !== 4) add(`${where}: варіантів ${v.options.length}, а має бути 4`);
      if(!v.explain) add(`${where}: немає пояснення`);
      return;
    }
    if(slot.type === "code"){
      const sol = gradeCode(v, v.solution);
      if(!sol.passed) add(`${where}: розв'язок не проходить тести (${sol.passedCount} з ${sol.total})${sol.error ? ": " + sol.error : ""}`);
      const st = gradeCode(v, v.starter);
      if(st.passed) add(`${where}: стартовий код проходить тести`);
      if(slot.partial){
        if(st.passedCount > 0) add(`${where}: стартовий код проходить ${st.passedCount} тест(и), а має 0`);
        if(v.tests.length < 6) add(`${where}: прихованих тестів ${v.tests.length}, а для часткового балу треба щонайменше 6`);
      }
      if(v.files){
        const r = tryCode(v.fn, v.solution, v.files);
        if(r.error) add(`${where}: розв'язок падає на файлах-прикладах: ${r.error}`);
      }
      return;
    }
    const g = gradeProgram(v, v.solution);
    if(!g.passed) add(`${where}: розв'язок не проходить набір ${g.failIdx}: ${g.error || JSON.stringify(g.failOut)}`);
    if(gradeProgram(v, v.starter).passed) add(`${where}: стартовий код проходить тести`);
    if(v.tests.length < 4) add(`${where}: прихованих наборів ${v.tests.length}, а треба щонайменше 4`);
    const s = runProgram(v.solution, v.sample);
    if(s.error || !CheckCore.sameOutput(s.out, v.sampleOut)) add(`${where}: розв'язок на прикладі виводить не sampleOut`);
  }));
  return problems;
}

return { NOT_READY, boot, isReady, install, tryCode, runProgram, gradeCode, gradeProgram, validate };

})();
