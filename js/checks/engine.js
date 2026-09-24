/* ==========================================================================
   Рушій самостійних робіт. Кожен тест — окремий файл у js/checks/<клас>/,
   який викликає CheckEngine.define({...}). Рушій будує сторінку тесту
   #/<slug>, при першому візиті видає учневі свій набір (варіант кожного
   завдання й порядок відповідей), зберігає чернетку й остаточний результат
   у localStorage (одна спроба) і показує результат за посиланням
   #/<slug>/r/<дані> у будь-якому браузері.

   Типи завдань:
     mcq     — варіанти відповіді; credit 1 / 0.5 (майже правильно: логіка
               правильна, але синтаксична помилка, або у «що виведе?» —
               правильне значення, але не той тип, зайві пробіли, вивід
               на кожному кроці циклу) / 0, помножений на points слота;
               необов'язкове поле code — програма для питань «що виведе?»;
     code    — написати функцію; перевіряється прихованими тестами;
     program — написати програму з input()/print(); рушій підставляє
               приховані вхідні дані й звіряє вивід.
   Чисті функції (бали, пункти результату, посилання) — js/checks/core.js,
   Python — js/checks/python.js.
   ========================================================================== */
"use strict";
window.CheckEngine = (function(){

const C = CheckCore;
const esc = PyEditor.esc;
const DEFS = {};

const store = {
  get(k){ try { return window.localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { window.localStorage.setItem(k, v); } catch(e){} },
  del(k){ try { window.localStorage.removeItem(k); } catch(e){} }
};
const readJSON = (k, fallback) => {
  const raw = store.get(k);
  if(raw === null) return fallback;
  try { return JSON.parse(raw); } catch(e){ return fallback; }
};
const writeJSON = (k, v) => store.set(k, JSON.stringify(v));

/* Тексти завдань (q, intro, hint, explain) — звичайні рядки з легкою
   розміткою: `код` → <code>, порожній рядок — новий абзац, рядки з «- » —
   список, інший перенос — новий рядок. Решта екранується. */
const inline = (s) => esc(s).replace(/`([^`\n]+)`/g, "<code>$1</code>");
const plain = (s) => String(s).replace(/`/g, "");
function rich(text){
  return String(text).split(/\n{2,}/).map(block => {
    let html = "", para = [], list = [];
    const flushPara = () => { if(para.length) html += `<p>${para.map(inline).join("<br>")}</p>`; para = []; };
    const flushList = () => { if(list.length) html += `<ul>${list.map(l => `<li>${inline(l)}</li>`).join("")}</ul>`; list = []; };
    block.split("\n").forEach(line => {
      if(line.startsWith("- ")){ flushPara(); list.push(line.slice(2)); }
      else { flushList(); para.push(line); }
    });
    flushPara(); flushList();
    return html;
  }).join("");
}
/* lede і rules — готовий HTML; без блочного тега на початку — один абзац */
const blockHtml = (html) => /^\s*<(p|ul|ol|div)[\s>]/.test(html) ? html : `<p>${html}</p>`;

/* def: { slug, storage, title, lede, rules, slots, acHidden?, shareVersion? } */
function define(def){
  def.shareVersion = def.shareVersion || 1;
  def.acHidden = def.acHidden || {};
  DEFS[def.slug] = def;
  window.PageInit[def.slug] = () => mount(def);
}
const get = (slug) => DEFS[slug];

/* з консолі браузера: await CheckEngine.selfTest()  або  selfTest("check-9") */
async function selfTest(slug){
  const slugs = slug ? [slug] : Object.keys(DEFS);
  const problems = [];
  for(const s of slugs) problems.push(...await CheckPy.validate(DEFS[s]));
  if(problems.length) console.error("Самоперевірка: проблеми\n" + problems.join("\n"));
  else console.info("Самоперевірка: усе гаразд — " + slugs.join(", "));
  return problems;
}

function skeleton(def){
  return `
  <header class="top">
    <h1>${esc(def.title)}</h1>
    <div class="lede">${blockHtml(def.lede)}</div>
  </header>

  <div class="callout warn" data-part="rules">${blockHtml(def.rules)}</div>

  <div class="hero check-hero" data-part="progress-wrap">
    <div class="check-prog">
      <div class="check-prog-bar"><i data-part="progress-fill"></i></div>
      <span class="check-prog-text" data-part="progress-text"></span>
    </div>
  </div>

  <div class="store-loading" data-part="loading">
    <span class="shop-spin" aria-hidden="true"></span>
    <span>Готуємо завдання й запускаємо Python у браузері… Уперше це може зайняти кілька секунд.</span>
  </div>

  <div data-part="body" hidden>
    <div data-part="slots"></div>
    <div class="check-finish">
      <button type="button" class="ctl primary" data-part="finish">Завершити тест</button>
      <p class="check-finish-note">Після завершення побачиш бали й правильні відповіді. Змінити відповіді потім буде не можна.</p>
    </div>
  </div>

  <div data-part="results" hidden></div>`;
}

/* ================================================================== сторінка тесту */
function mount(def){
  const SLOTS = def.slots;
  const KEY = { pick: def.storage + "_pick", draft: def.storage + "_draft", result: def.storage + "_result" };
  const OWN_RE = new RegExp("^#/?" + def.slug + "(/|$)");
  const SHARE_RE = new RegExp("^#/?" + def.slug + "/r/([A-Za-z0-9_-]+)$");

  const root = document.querySelector(`#page-${def.slug} [data-check-root]`);
  root.innerHTML = skeleton(def);
  const $p = (name) => root.querySelector(`[data-part="${name}"]`);
  const cardOf = (slot) => root.querySelector(`[data-slot="${slot.id}"]`);
  const part = (card, role) => card.querySelector(`[data-role="${role}"]`);

  /* ---------- набір учня ---------- */
  /* Набір створюється лише тоді, коли учень справді відкриває свій тест, —
     перегляд чужого результату за посиланням нічого не записує. */
  let pick = null;
  function ensurePick(){
    pick = readJSON(KEY.pick, null);
    if(!pick){
      pick = C.makePick(SLOTS);
      writeJSON(KEY.pick, pick);
    }
  }
  const variantOf = (slot) => slot.variants[pick[slot.id].variant];

  /* ---------- чернетка ---------- */
  const draft = readJSON(KEY.draft, null) || {};
  draft.mcq = draft.mcq || {};
  draft.code = draft.code || {};
  draft.stdin = draft.stdin || {};
  const saveDraft = () => writeJSON(KEY.draft, draft);

  /* ---------- картки завдань ---------- */
  const head = (slot, n) =>
    `<div class="checkq-head"><span class="checkq-n">Завдання ${n} · ${C.pointsLabel(slot.points)}</span></div>`;

  const editorHtml = (label) => `
      <div class="pyed">
        <pre class="pyed-hl pysrc" data-role="hl" aria-hidden="true"></pre>
        <textarea class="pyed-ta" data-role="editor" spellcheck="false" autocapitalize="off"
          autocomplete="off" autocorrect="off" data-gramm="false" aria-label="${esc(label)}"></textarea>
      </div>`;

  const controlsHtml = (hint) => `
      <div class="controls pyt-controls">
        <details class="pyt-hint"><summary>Підказка</summary>${rich(hint)}</details>
        <span class="pyt-kbd">Ctrl+Enter — запустити</span>
        <button type="button" class="ctl" data-act="run" disabled>▶ Запустити</button>
      </div>
      <div class="pyt-msg" data-role="msg" hidden></div>`;

  function mcqCard(slot, n){
    const variant = variantOf(slot);
    const chosen = draft.mcq[slot.id];
    const opts = pick[slot.id].order.map(idx => {
      const opt = variant.options[idx];
      const on = chosen === idx;
      return `<label class="checkq-opt${on ? " on" : ""}" data-idx="${idx}">
        <input type="radio" name="mcq_${def.slug}_${slot.id}" value="${idx}" ${on ? "checked" : ""}>
        <pre>${esc(opt.text)}</pre>
      </label>`;
    }).join("");
    return `
    <article class="checkq" data-slot="${slot.id}" data-type="mcq">
      ${head(slot, n)}
      <div class="checkq-text">${rich(variant.q)}</div>
      ${variant.code ? `<pre class="checkq-code pysrc">${PyEditor.highlight(variant.code)}</pre>` : ""}
      <div class="checkq-opts" role="radiogroup" aria-label="${esc(plain(variant.q))}">${opts}</div>
    </article>`;
  }

  function codeCard(slot, n){
    const variant = variantOf(slot);
    return `
    <article class="checkq" data-slot="${slot.id}" data-type="code">
      ${head(slot, n)}
      <div class="checkq-text"><p class="checkq-title">${esc(variant.title)}</p>${rich(variant.intro)}</div>
      ${editorHtml("Код функції " + variant.fn)}
      ${controlsHtml(variant.hint)}
    </article>`;
  }

  function programCard(slot, n){
    const variant = variantOf(slot);
    const rows = Math.max(2, variant.sample.split("\n").length);
    return `
    <article class="checkq" data-slot="${slot.id}" data-type="program">
      ${head(slot, n)}
      <div class="checkq-text"><p class="checkq-title">${esc(variant.title)}</p>${rich(variant.intro)}</div>
      <div class="checkq-io">
        <div><span>Приклад: ввели</span><pre>${esc(variant.sample)}</pre></div>
        <div><span>Має вивести</span><pre>${esc(variant.sampleOut)}</pre></div>
      </div>
      ${editorHtml("Код програми")}
      <label class="checkq-stdin">
        <span>Вхідні дані для запуску — кожне значення з нового рядка</span>
        <textarea data-role="stdin" rows="${rows}" spellcheck="false" autocapitalize="off"
          autocomplete="off" autocorrect="off" data-gramm="false"></textarea>
      </label>
      ${controlsHtml(variant.hint)}
      <pre class="checkq-out" data-role="out" hidden></pre>
    </article>`;
  }

  function setMsg(card, html, kind){
    const el = part(card, "msg");
    el.hidden = !html;
    el.innerHTML = html || "";
    el.className = "pyt-msg " + (kind || "");
  }

  function wireMcq(card, slot){
    card.addEventListener("change", (e) => {
      const input = e.target.closest("input[type=radio]");
      if(!input) return;
      const idx = +input.value;
      draft.mcq[slot.id] = idx;
      saveDraft();
      card.querySelectorAll(".checkq-opt").forEach(l => l.classList.toggle("on", +l.dataset.idx === idx));
      updateProgress();
    });
  }

  /* редактор коду зі збереженням у чернетку; onRun — що робить «Запустити» */
  function wireEditorFor(card, slot, onRun){
    const ta = part(card, "editor");
    ta.value = draft.code[slot.id] != null ? draft.code[slot.id] : variantOf(slot).starter;
    const run = () => { if(CheckPy.isReady()) onRun(ta.value); };
    PyEditor.wireEditor(ta, part(card, "hl"), {
      hiddenWords: def.acHidden[slot.id],
      minRows: 8,
      onInput: (value) => { draft.code[slot.id] = value; saveDraft(); updateProgress(); },
      onRun: run
    });
    card.querySelector('[data-act="run"]').addEventListener("click", run);
  }

  function wireCode(card, slot){
    const variant = variantOf(slot);
    wireEditorFor(card, slot, (source) => {
      const err = CheckPy.install(variant.fn, source);
      if(err) setMsg(card, esc(err), "bad");
      else setMsg(card, "Код виконується без помилок. Це не каже, чи правильна відповідь, — лише те, що код запускається.", "good");
    });
  }

  function wireProgram(card, slot){
    const stdin = part(card, "stdin");
    const out = part(card, "out");
    stdin.value = draft.stdin[slot.id] != null ? draft.stdin[slot.id] : variantOf(slot).sample;
    stdin.addEventListener("input", () => { draft.stdin[slot.id] = stdin.value; saveDraft(); });
    wireEditorFor(card, slot, (source) => {
      const r = CheckPy.runProgram(source, stdin.value);
      out.hidden = false;
      out.textContent = r.out === "" ? "(програма нічого не вивела)" : r.out;
      out.classList.toggle("empty", r.out === "");
      if(r.error) setMsg(card, esc(r.error), "bad");
      else setMsg(card, "Програма завершилась без помилок. Це не каже, чи правильна відповідь, — лише те, що вона працює на цих даних.", "good");
    });
  }

  const CARD = { mcq:mcqCard, code:codeCard, program:programCard };
  const WIRE = { mcq:wireMcq, code:wireCode, program:wireProgram };

  function renderSlots(){
    $p("slots").innerHTML = SLOTS.map((slot, i) => CARD[slot.type](slot, i + 1)).join("");
    SLOTS.forEach(slot => WIRE[slot.type](cardOf(slot), slot));
  }

  /* ---------- прогрес ---------- */
  function answeredCount(){
    return SLOTS.filter(slot => {
      if(slot.type === "mcq") return draft.mcq[slot.id] != null;
      const code = draft.code[slot.id];
      return !!code && code.trim() !== variantOf(slot).starter.trim();
    }).length;
  }

  function updateProgress(){
    const n = answeredCount();
    $p("progress-fill").style.width = (n / SLOTS.length * 100) + "%";
    $p("progress-text").textContent = `Відповіли ${n} з ${SLOTS.length}`;
  }

  /* ---------- оцінювання ---------- */
  function gradeAll(){
    const items = SLOTS.map(slot => {
      const v = pick[slot.id].variant;
      const variant = slot.variants[v];
      if(slot.type === "mcq"){
        const idx = draft.mcq[slot.id];
        return C.mcqItem(slot, v, idx != null ? idx : null);
      }
      const source = draft.code[slot.id] != null ? draft.code[slot.id] : variant.starter;
      if(slot.type === "code"){
        const g = CheckPy.gradeCode(variant, source);
        return C.codeItem(slot, v, source, g.passed, g.error);
      }
      return C.programItem(slot, v, source, CheckPy.gradeProgram(variant, source));
    });
    return C.withTotal(SLOTS, items, new Date().toISOString());
  }

  /* ---------- посилання на результат ---------- */
  async function shareUrl(result){
    const payload = C.buildPayload(SLOTS, def.shareVersion, result, readJSON(KEY.pick, {}));
    if(!payload) return null;
    return location.href.split("#")[0] + "#/" + def.slug + "/r/" + await C.packShare(payload);
  }

  function wireShare(box, result){
    const wrap = box.querySelector(".checkr-share");
    const input = wrap.querySelector("input");
    const btn = wrap.querySelector("button");
    shareUrl(result).then(url => {
      if(!url || !wrap.isConnected) return;
      input.value = url;
      wrap.hidden = false;
    }).catch(err => console.error("не вдалося зібрати посилання", err));

    let timer = null;
    btn.addEventListener("click", async () => {
      input.select();
      let ok = false;
      try { await navigator.clipboard.writeText(input.value); ok = true; }
      catch(e){ try { ok = document.execCommand("copy"); } catch(e2){} }
      btn.textContent = ok ? "Скопійовано ✓" : "Натисни Ctrl+C";
      clearTimeout(timer);
      timer = setTimeout(() => { btn.textContent = "Копіювати"; }, 2000);
    });
  }

  /* ---------- екран результатів ---------- */
  function resultBadge(item){
    if(item.type === "mcq") return item.earned === item.points ? "ok" : (item.earned > 0 ? "partial" : "bad");
    return item.passed ? "ok" : "bad";
  }

  const itemHead = (n, name, item) =>
    `<div class="checkr-item-head"><b>${n}. ${esc(name)}</b><span>${C.fmtPoints(item.earned)} / ${C.pointsLabel(item.points)}</span></div>`;

  const codeBlocks = (item) => `
      <p class="checkr-code-t">Твій код:</p>
      <pre class="checkr-code pysrc">${PyEditor.highlight(item.yourCode)}</pre>
      <p class="checkr-code-t">Приклад правильного розв'язку:</p>
      <pre class="checkr-code ref pysrc">${PyEditor.highlight(item.solution)}</pre>`;

  function mcqResult(item, n){
    const chosenCls = item.chosenText == null ? "" : (item.chosenCredit === 1 ? "ok" : (item.chosenCredit > 0 ? "partial" : "bad"));
    const chosenRow = item.chosenText == null
      ? `<li class="chosen bad"><b>Твоя відповідь:</b> (не відповів)</li>`
      : `<li class="chosen ${chosenCls}"><b>Твоя відповідь:</b> ${esc(item.chosenText)}</li>`;
    const correctRow = item.chosenCredit === 1 ? "" :
      `<li class="correct"><b>Правильно:</b> ${esc(item.correctText)}</li>`;
    return `<article class="checkr-item ${resultBadge(item)}">
      ${itemHead(n, item.topic, item)}
      <div class="checkr-q">${rich(item.question)}</div>
      ${item.code ? `<pre class="checkr-code pysrc">${PyEditor.highlight(item.code)}</pre>` : ""}
      <ul class="checkr-opts">${chosenRow}${correctRow}</ul>
      <div class="checkr-explain">${rich(item.explain)}</div>
    </article>`;
  }

  function codeResult(item, n){
    return `<article class="checkr-item ${resultBadge(item)}">
      ${itemHead(n, item.title, item)}
      <p class="checkr-q">${item.passed ? "Усі приховані тести пройдено." : (item.error ? esc(item.error) : "Не всі приховані тести пройдено.")}</p>
      ${codeBlocks(item)}
    </article>`;
  }

  function programResult(item, n){
    const fail = item.passed || item.failInput == null ? "" : `
      <div class="checkr-io">
        <div><span>Ввели</span><pre>${esc(item.failInput)}</pre></div>
        <div><span>Очікувалось</span><pre>${esc(item.failExpected)}</pre></div>
        <div><span>Твоя програма вивела</span><pre>${esc(item.failOut || "(нічого)")}</pre>${
          item.error ? `<p class="checkr-io-err">${esc(item.error)}</p>` : ""}</div>
      </div>`;
    return `<article class="checkr-item ${resultBadge(item)}">
      ${itemHead(n, item.title, item)}
      <p class="checkr-q">${item.passed ? "Усі приховані набори даних пройдено." : "Не всі приховані набори даних пройдено. Перший, на якому програма помилилась:"}</p>
      ${fail}
      ${codeBlocks(item)}
    </article>`;
  }

  const RESULT = { mcq:mcqResult, code:codeResult, program:programResult };

  /* shared — результат відкрито за посиланням, а не з цього браузера */
  function renderResults(result, shared){
    $p("body").hidden = true;
    $p("progress-wrap").hidden = true;
    $p("loading").hidden = true;
    const box = $p("results");
    box.hidden = false;

    const items = result.items.map((item, i) => RESULT[item.type](item, i + 1)).join("");
    const when = result.finishedAt
      ? new Date(result.finishedAt).toLocaleString("uk-UA", { dateStyle:"long", timeStyle:"short" }) : "";

    const note = shared
      ? `<p>Це результат, яким поділилися за посиланням${when ? ` · тест завершено ${esc(when)}` : ""}.
           Нижче — усі завдання з правильними відповідями.</p>
         <a class="checkr-own" href="#/${def.slug}">До власного тесту →</a>`
      : `<p>Результат збережено в цьому браузері. Нижче — усі завдання з правильними відповідями.</p>
         <div class="checkr-share" hidden>
           <p class="checkr-share-t">Посилання на цей результат: відкривається в будь-якому браузері, можна надіслати вчителю.</p>
           <div class="checkr-share-row">
             <input type="text" class="checkr-share-url" readonly aria-label="Посилання на результат">
             <button type="button" class="ctl">Копіювати</button>
           </div>
         </div>`;

    box.innerHTML = `
      <div class="checkr-score">
        <div class="checkr-score-n">${C.fmtPoints(result.total)}<span> / ${C.fmtPoints(result.max)}</span></div>
        ${note}
      </div>
      <div class="checkr-list">${items}</div>`;

    if(!shared) wireShare(box, result);
  }

  /* ---------- завершення тесту ---------- */
  function wireFinish(){
    const btn = $p("finish");
    btn.addEventListener("click", () => {
      if(btn.dataset.armed !== "1"){
        btn.dataset.armed = "1";
        btn.textContent = "Точно? Натисни ще раз — переграти не можна";
        return;
      }
      const result = gradeAll();
      writeJSON(KEY.result, result);
      store.del(KEY.draft);
      renderResults(result, false);
      /* кнопка була внизу довгої сторінки — повертаємо на початок, де видно бал;
         фокус (для читачів екрана) ставимо до скролу, щоб не перервати анімацію */
      const score = $p("results").querySelector(".checkr-score");
      score.tabIndex = -1;
      score.focus({ preventScroll:true });
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top:0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- режими сторінки ---------- */
  /* #/<slug> — власний тест цього браузера, #/<slug>/r/<дані> — результат за
     посиланням. Між ними можна ходити без перезавантаження, тож власний тест
     запускається один раз, а далі лише ховається й показується. */
  let bootState = "idle";         /* idle → loading → ready | failed */
  let viewToken = 0;              /* щоб запізніле розпакування не перемалювало інший режим */

  function startTest(){
    ensurePick();
    renderSlots();
    updateProgress();
    wireFinish();

    bootState = "loading";
    const loadingEl = $p("loading");
    CheckPy.boot().then(() => {
      root.querySelectorAll('[data-act="run"]').forEach(b => b.disabled = false);
      bootState = "ready";
    }).catch((err) => {
      console.error("Python не завантажився", err);
      loadingEl.innerHTML = `<b>Не вдалося завантажити Python.</b> Для практичних завдань потрібен інтернет: інтерпретатор підвантажується з cdn.jsdelivr.net. Перевір з'єднання й онови сторінку. Питання з варіантами відповіді можна проходити й так — вони не потребують Python.`;
      loadingEl.classList.add("err");
      bootState = "failed";
    }).then(() => {
      if(!SHARE_RE.test(location.hash)) showOwn();
    });
  }

  function showOwn(){
    $p("rules").hidden = false;
    const existing = readJSON(KEY.result, null);
    if(existing){
      const fresh = C.refreshMcq(SLOTS, existing);
      if(fresh.total !== existing.total) writeJSON(KEY.result, fresh);
      renderResults(fresh, false);
      return;
    }
    $p("results").hidden = true;
    $p("progress-wrap").hidden = false;
    if(bootState === "idle") startTest();
    $p("loading").hidden = bootState === "ready";
    $p("body").hidden = bootState === "loading";
  }

  async function showShared(data, token){
    ["rules", "progress-wrap", "loading", "body"].forEach(name => { $p(name).hidden = true; });
    const box = $p("results");
    box.hidden = false;
    box.innerHTML = "";

    let result = null;
    try { result = C.parsePayload(SLOTS, def.shareVersion, await C.unpackShare(data)); }
    catch(err){ console.error("не вдалося розпакувати посилання", err); }
    if(token !== viewToken) return;

    if(result && result !== "stale"){
      renderResults(result, true);
      return;
    }
    const why = result === "stale"
      ? "Посилання створене для попередньої версії завдань — відтоді стартовий код змінився, тож відновити відповіді не вийде."
      : "Посилання пошкоджене (можливо, його обрізало під час копіювання) або браузер застарий.";
    box.innerHTML = `<div class="store-loading err"><span><b>Не вдалося відкрити результат.</b>
      ${why} <a href="#/${def.slug}">До власного тесту →</a></span></div>`;
  }

  function route(){
    const token = ++viewToken;
    const m = location.hash.match(SHARE_RE);
    if(m) showShared(m[1], token);
    else showOwn();
  }

  /* роутер уже показав сторінку; тут лише перемикаємо режим усередині неї */
  window.addEventListener("hashchange", () => {
    if(OWN_RE.test(location.hash)) route();
  });
  route();
}

return { define, get, selfTest };

})();
