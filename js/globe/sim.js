/* ==========================================================================
   Симулятор глобуса: дисплей, кнопки 1–5 / Q / G, рядок команд як у
   globe press і журнал «що сталося». Його монтують сторінка учня (#/globe)
   і сторінка вчителя (#/globe-teacher).

   Два режими:
     • команди — увімкнути глобус і виконати '1 2 3', 'q 2 3 1', 'g 2:600';
       стрічка подій програється з тими самими паузами, що й на платі;
     • живий — натискаєш кнопку на «корпусі», і код спрацьовує одразу
       (у грі час відповіді справжній, а тайм-аут ловить tick() кожні 200 мс).

   Чому події живого режиму стають у чергу, а не перебивають одна одну:
   обв'язка рахує час як max(віртуальний, справжній) — рівно так само, як
   тут рахується busyUntil. Тож те, що гравець бачить на екрані, і те, що
   «думає» глобус, не розходяться.
   ========================================================================== */
"use strict";
window.GlobeSim = (function(){

const esc = (s) => PyEditor.esc(s);
const PRESETS = [
  { cmd:"", label:"лише ввімкнути" },
  { cmd:"1 2 3 4 5", label:"1 2 3 4 5" },
  { cmd:"q 2 3 1", label:"q 2 3 1", title:"вікторина: відповіді кнопками 2, 3, 1" },
  { cmd:"g 2:600 1:3000", label:"g 2:600 1:3000", title:"гра: кнопка 2 за 600 мс, кнопка 1 за 3 с" }
];
let uid = 0;

function problemText(p){ return p.text || p.message; }

function mount(el, opts){
  opts = opts || {};
  const id = "gsim" + (++uid);
  el.innerHTML = `
  <div class="gsim">
    <div class="gsim-device">
      <div class="gsim-screen"><canvas class="gsim-lcd" role="img" aria-label="Дисплей глобуса"></canvas></div>
      <div class="gsim-keys" role="group" aria-label="Кнопки глобуса">
        ${[1, 2, 3, 4, 5].map(n => `<button type="button" class="gsim-key" data-key="${n}" disabled title="Кнопка ${n}">${n}</button>`).join("")}
        <button type="button" class="gsim-key mode" data-key="q" disabled title="Вікторина (task3)">Q</button>
        <button type="button" class="gsim-key mode" data-key="g" disabled title="Гра «Блискавка» (task2)">G</button>
      </div>
    </div>
    <form class="gsim-cmd" autocomplete="off">
      <label class="gsim-cmd-l" for="${id}-cmd">Команди — як <code>globe press</code></label>
      <div class="gsim-cmd-row">
        <input id="${id}-cmd" class="gsim-cmd-in" type="text" spellcheck="false" autocapitalize="off"
          placeholder="наприклад: 1 2 3" value="${esc(opts.command || "1 2 3")}">
        <button type="submit" class="ctl primary gsim-run" disabled>▶ Запустити</button>
      </div>
      <div class="gsim-presets">${PRESETS.map(p =>
        `<button type="button" class="gsim-chip" data-cmd="${esc(p.cmd)}"${p.title ? ` title="${esc(p.title)}"` : ""}>${esc(p.label)}</button>`).join("")}</div>
    </form>
    <div class="gsim-log-h">
      <span>Що сталося</span>
      <label class="gsim-sound"><input type="checkbox" checked> звук</label>
    </div>
    <ol class="gsim-log" aria-live="polite"></ol>
  </div>`;

  const $ = (s) => el.querySelector(s);
  const lcd = GlobeLCD.create($(".gsim-lcd"));
  const logEl = $(".gsim-log");
  const input = $(".gsim-cmd-in");
  const soundBox = $(".gsim-sound input");
  const player = new Audio();
  let timers = [], busyUntil = 0, live = false, ticker = null;

  /* ---------- журнал ---------- */
  const LABEL = { warn:"увага", error:"помилка", print:"print", note:"", info:"" };
  function log(kind, text){
    const li = document.createElement("li");
    li.className = "gsim-" + kind;
    li.innerHTML = (LABEL[kind] ? `<b>${LABEL[kind]}</b> ` : "") + esc(text);
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
  }
  function clearLog(){ logEl.innerHTML = ""; }
  function logProblems(problems){
    problems.forEach(p => log(p.level === "error" ? "error" : "warn", problemText(p)));
  }

  /* ---------- програвання стрічки ---------- */
  function stop(){
    timers.forEach(clearTimeout);
    timers = [];
    busyUntil = 0;
    player.pause();
  }
  async function sound(code){
    if(!soundBox.checked) return;
    const url = await GlobeRuntime.audioUrl(code);
    if(!url){ log("note", "(звук " + code + ": запису немає)"); return; }
    player.src = url;
    player.play().catch(() => {});
  }
  function apply(e){
    if(e.kind === "frame") lcd.draw(e.rows, e.inv);
    else if(e.kind === "blink") lcd.blink(e.times);
    else if(e.kind === "sound") sound(e.id);
    else log(e.kind, e.text);
  }
  /* append — у чергу за тим, що ще грає (живий режим); інакше з нуля */
  function play(events, append){
    const now = performance.now();
    if(!append) stop();
    const start = Math.max(busyUntil, now);
    let end = start;
    events.forEach(e => {
      timers.push(setTimeout(() => apply(e), start - now + e.t));
      end = Math.max(end, start + e.t);
    });
    busyUntil = end;
  }
  function show(r, append){
    play(r.events || [], append);
    if(r.error) log("error", r.error);
  }
  const hasErrors = (problems) => (problems || []).some(p => p.level === "error");

  /* ---------- режим команд ---------- */
  async function run(command){
    if(!GlobeRuntime.isReady()) return;
    command = command === undefined ? input.value : command;
    if(opts.beforeRun && (await opts.beforeRun(command)) === false) return;
    resetLive();
    const r = GlobeRuntime.run(opts.sources(), command);
    clearLog();
    log("info", "▶ globe press " + (command.trim() || "(лише ввімкнути)"));
    if(hasErrors(r.problems)){
      if(opts.onProblems) opts.onProblems(r.problems); else logProblems(r.problems);
      log("error", "Код не запущено — спершу виправ помилки.");
      return;
    }
    if(opts.onProblems) opts.onProblems(r.problems); else logProblems(r.problems);
    show(r, false);
  }

  /* ---------- живий режим ---------- */
  function resetLive(){
    live = false;
    if(ticker){ clearInterval(ticker); ticker = null; }
  }
  function syncTicker(){
    const playing = GlobeRuntime.liveMode() === "game";
    if(playing && !ticker){
      ticker = setInterval(() => {
        if(!live){ resetLive(); return; }
        const r = GlobeRuntime.liveTick();
        if((r.events || []).length || r.error) show(r, true);
        if(GlobeRuntime.liveMode() !== "game"){ clearInterval(ticker); ticker = null; }
      }, 200);
    }
    if(!playing && ticker){ clearInterval(ticker); ticker = null; }
  }
  async function key(token){
    if(!GlobeRuntime.isReady()) return;
    if(!live){
      if(opts.beforeRun && (await opts.beforeRun(null)) === false) return;
      stop();
      clearLog();
      log("info", "Глобус увімкнено — тисни кнопки.");
      const r = GlobeRuntime.liveStart(opts.sources());
      if(opts.onProblems) opts.onProblems(r.problems); else logProblems(r.problems);
      if(hasErrors(r.problems)){ log("error", "Код не запущено — спершу виправ помилки."); return; }
      live = true;
      show(r, true);
    }
    log("info", "кнопка " + token.toUpperCase());
    show(GlobeRuntime.livePress(token), true);
    syncTicker();
  }

  /* ---------- події ---------- */
  $(".gsim-cmd").addEventListener("submit", (e) => { e.preventDefault(); run(); });
  $(".gsim-presets").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cmd]");
    if(!b) return;
    input.value = b.dataset.cmd;
    run();
  });
  $(".gsim-keys").addEventListener("click", (e) => {
    const b = e.target.closest("[data-key]");
    if(b) key(b.dataset.key);
  });
  soundBox.addEventListener("change", () => { if(!soundBox.checked) player.pause(); });

  function enable(on){
    el.querySelectorAll(".gsim-key, .gsim-run").forEach(b => { b.disabled = !on; });
  }

  GlobeRuntime.boot().then(() => {
    enable(true);
    if(opts.autoBoot !== false) run("");
  }).catch(err => log("error", err.message));

  return {
    run,
    /* код змінився — живий глобус увімкнеться заново з новим кодом */
    reset(){ if(live){ resetLive(); log("note", "Код змінився — глобус увімкнеться заново."); } },
    stop(){ stop(); resetLive(); },
    log, clearLog, lcd,
    get command(){ return input.value; }
  };
}

return { mount };
})();
