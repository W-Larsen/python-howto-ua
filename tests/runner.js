/* Мінімальний тест-раннер для tests/checks.html. Тести виконуються по черзі,
   у порядку реєстрації; fn може бути async. Підсумок — у #summary і
   window.T_DONE (його читає агент через javascript_tool). */
"use strict";
window.T = (function(){
  const cases = [];
  const fmt = (v) => { try { return JSON.stringify(v); } catch(e){ return String(v); } };

  function test(name, fn){ cases.push({ name, fn }); }
  function eq(actual, expected, msg){
    if(fmt(actual) !== fmt(expected))
      throw new Error((msg ? msg + ": " : "") + "очікувалось " + fmt(expected) + ", отримано " + fmt(actual));
  }
  function ok(cond, msg){ if(!cond) throw new Error(msg || "умова хибна"); }
  /* чекає, поки cond() стане правдою; кидає помилку через ms мілісекунд */
  async function until(cond, ms){
    const end = Date.now() + (ms || 40000);
    while(!cond()){
      if(Date.now() > end) throw new Error("не дочекались: " + cond);
      await new Promise(r => setTimeout(r, 50));
    }
  }
  async function run(){
    const out = document.getElementById("out");
    let pass = 0, fail = 0;
    for(const c of cases){
      const li = document.createElement("li");
      try { await c.fn(); pass++; li.className = "pass"; li.textContent = "✓ " + c.name; }
      catch(err){
        fail++; li.className = "fail";
        li.textContent = "✗ " + c.name + " — " + (err && err.message ? err.message : err);
        console.error(c.name, err);
      }
      out.appendChild(li);
    }
    const summary = document.getElementById("summary");
    summary.textContent = `PASS ${pass} FAIL ${fail}`;
    summary.className = fail ? "fail" : "pass";
    window.T_DONE = { pass, fail };
  }
  return { test, eq, ok, until, run };
})();
