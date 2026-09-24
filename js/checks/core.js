/* ==========================================================================
   Ядро самостійних робіт — без DOM і без Python: вибір варіантів для учня,
   бали, порівняння виводу програм, пункти результату й посилання на
   результат. Використовують рушій (js/checks/engine.js) і тести
   (tests/checks.html).

   Посилання на результат (#/<slug>/r/<дані>): сервера немає, тож увесь
   результат їде в самому посиланні. Тексти питань, пояснення й розв'язки
   сторінка бере з даних тесту, а в посиланні лише відповіді учня —
   компактним масивом у порядку слотів:
     [версія, час завершення (секунди, base36), контрольна сума, пункти…]
     mcq     — [варіант, вибрана відповідь або -1]
     code    — [варіант, 1/0 тести пройдено, код, помилка]
     program — [варіант, 1/0, код, помилка, перший провалений набір або -1,
                вивід програми на ньому (до 500 символів)]
   Код зберігається як різниця зі стартовим: [скільки символів збігається
   на початку, скільки в кінці, що між ними], або 0, якщо учень його не
   чіпав. Тому стартовий код уже виданих варіантів не можна міняти: старі
   посилання відновили б код неправильно. Контрольна сума стартових кодів
   це ловить і показує помилку замість спотвореного коду. Нове — додавай
   новим варіантом у кінець списку.
   JSON стискається deflate-raw і кодується base64url; перша літера — формат
   ("z" стиснене, "j" — ні, для браузерів без CompressionStream).
   Це не захист: хто захоче, розпакує посилання й підмінить відповіді.
   ========================================================================== */
"use strict";
window.CheckCore = (function(){

/* ============================ вибір варіанта для учня ============================ */
function shuffled(n, rnd){
  const a = Array.from({length:n}, (_, i) => i);
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* кожному слоту — випадковий варіант, а питанням ще й порядок відповідей.
   Варіант з retired:true новим учням не видається, але лишається в списку:
   на його номер посилаються вже видані набори й посилання на результати,
   тож видаляти варіанти не можна — лише виводити з обігу. */
function makePick(slots, rnd){
  rnd = rnd || Math.random;
  const pick = {};
  slots.forEach(slot => {
    const live = slot.variants.map((v, i) => i).filter(i => !slot.variants[i].retired);
    const variant = live[Math.floor(rnd() * live.length)];
    const entry = { variant };
    if(slot.type === "mcq") entry.order = shuffled(slot.variants[variant].options.length, rnd);
    pick[slot.id] = entry;
  });
  return pick;
}

/* ============================ бали ============================ */
const maxPoints = (slots) => slots.reduce((sum, s) => sum + s.points, 0);

/* 12 → "12", 11.5 → "11.5", 0.25 → "0.25" (toFixed(1) дав би "0.3") */
const fmtPoints = (n) => String(Math.round(n * 100) / 100);

/* 1 бал, 2 бали, 5 балів, 21 бал; дробові — завжди «бала»: 0.5 бала */
function pointsWord(n){
  if(!Number.isInteger(n)) return "бала";
  const d = n % 10, dd = n % 100;
  if(d === 1 && dd !== 11) return "бал";
  if(d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return "бали";
  return "балів";
}
const pointsLabel = (n) => fmtPoints(n) + " " + pointsWord(n);

/* ============================ вивід програм ============================ */
/* пробіли в кінці рядків і порожні рядки в кінці не рахуються — решта точно */
function normOutput(text){
  const lines = String(text).replace(/\r\n?/g, "\n").split("\n").map(l => l.replace(/\s+$/, ""));
  while(lines.length && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}
const sameOutput = (actual, expected) => normOutput(actual) === normOutput(expected);
const FAIL_OUT_MAX = 500;

/* ============================ пункти результату ============================ */
/* Пункт будується лише з номера варіанта й відповіді учня — так само
   і після тесту, і з посилання, яким поділилися. */
function mcqItem(slot, variantIdx, chosenIdx){
  const variant = slot.variants[variantIdx];
  const opt = chosenIdx != null ? variant.options[chosenIdx] : null;
  const correctIdx = variant.options.findIndex(o => o.credit === 1);
  const item = { slotId:slot.id, type:"mcq", topic:slot.topic, points:slot.points,
    variant:variantIdx, chosenIdx, earned:(opt ? opt.credit : 0) * slot.points,
    question:variant.q, chosenText: opt ? opt.text : null, chosenCredit: opt ? opt.credit : 0,
    correctText: variant.options[correctIdx].text, explain:variant.explain };
  if(variant.code) item.code = variant.code;
  return item;
}

function codeItem(slot, variantIdx, source, passed, error){
  const variant = slot.variants[variantIdx];
  return { slotId:slot.id, type:"code", topic:slot.topic, points:slot.points,
    variant:variantIdx, earned: passed ? slot.points : 0, passed,
    title:variant.title, yourCode:source, error: error || null, solution:variant.solution };
}

/* grade: { passed, error, failIdx (-1, якщо пройдено), failOut } */
function programItem(slot, variantIdx, source, grade){
  const variant = slot.variants[variantIdx];
  const t = grade.failIdx >= 0 ? variant.tests[grade.failIdx] : null;
  return { slotId:slot.id, type:"program", topic:slot.topic, points:slot.points,
    variant:variantIdx, earned: grade.passed ? slot.points : 0, passed: grade.passed,
    title:variant.title, yourCode:source, error: grade.error || null,
    failIdx: grade.failIdx, failInput: t ? t.input : null, failExpected: t ? t.output : null,
    failOut: grade.failOut || "", solution:variant.solution };
}

const withTotal = (slots, items, finishedAt) =>
  ({ total: items.reduce((sum, it) => sum + it.earned, 0), max:maxPoints(slots), items, finishedAt });

/* Питання перераховуються з поточних даних тесту — так само, як результат
   з посилання: якщо відтоді якійсь відповіді додали часткові бали, збережений
   результат покаже той самий бал. Код і програми не чіпаємо — їх оцінено
   прихованими тестами на момент завершення. */
function refreshMcq(slots, result){
  const known = Object.fromEntries(slots.map(s => [s.id, s]));
  const items = result.items.map(item => {
    const slot = known[item.slotId];
    if(item.type !== "mcq" || !slot || !slot.variants[item.variant] || item.chosenIdx === undefined) return item;
    return mcqItem(slot, item.variant, item.chosenIdx);
  });
  return Object.assign({}, result, { items, total: items.reduce((sum, it) => sum + it.earned, 0) });
}

/* ============================ посилання на результат ============================ */
/* FNV-1a — короткий відбиток стартових кодів вибраних варіантів */
function starterSum(variants){
  let h = 0x811c9dc5;
  const s = variants.map(v => v.starter).join("\u0000");
  for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(36);
}
const codeVariants = (slots, variantOf) =>
  slots.filter(s => s.type === "code" || s.type === "program").map(s => s.variants[variantOf(s)]);

function codeDiff(base, s){
  if(s === base) return 0;
  let p = 0;
  while(p < base.length && p < s.length && base[p] === s[p]) p++;
  let q = 0;
  while(q < base.length - p && q < s.length - p && base[base.length - 1 - q] === s[s.length - 1 - q]) q++;
  return [p, q, s.slice(p, s.length - q)];
}

const isIdx = (n, len) => Number.isInteger(n) && n >= 0 && n < len;

/* зворотне до codeDiff; null — різниця не пасує до цього стартового коду */
function applyDiff(base, d){
  if(d === 0) return base;
  if(!Array.isArray(d) || !isIdx(d[0], base.length + 1) || !isIdx(d[1], base.length + 1 - d[0])
     || typeof d[2] !== "string") return null;
  return base.slice(0, d[0]) + d[2] + base.slice(base.length - d[1]);
}

/* savedPick — набір учня з localStorage: результати, збережені до появи
   посилань, не мають variant/chosenIdx — дістаємо їх звідти й з тексту
   вибраної відповіді */
function buildPayload(slots, version, result, savedPick){
  savedPick = savedPick || {};
  const known = Object.fromEntries(slots.map(s => [s.id, s]));
  const byId = {};
  for(const item of result.items){
    const slot = known[item.slotId];
    const v = item.variant != null ? item.variant : (savedPick[item.slotId] || {}).variant;
    if(!slot || !slot.variants[v]) return null;
    const starter = slot.variants[v].starter;
    if(item.type === "mcq"){
      const idx = item.chosenIdx !== undefined ? item.chosenIdx
        : slot.variants[v].options.findIndex(o => o.text === item.chosenText);
      byId[slot.id] = [v, idx == null || idx < 0 ? -1 : idx];
    } else if(item.type === "code"){
      byId[slot.id] = [v, item.passed ? 1 : 0, codeDiff(starter, item.yourCode), item.error || ""];
    } else {
      byId[slot.id] = [v, item.passed ? 1 : 0, codeDiff(starter, item.yourCode), item.error || "",
        item.failIdx != null ? item.failIdx : -1, item.failOut || ""];
    }
  }
  if(slots.some(s => !byId[s.id])) return null;
  const t = Date.parse(result.finishedAt);
  return [version, isNaN(t) ? "" : Math.round(t / 1000).toString(36),
    starterSum(codeVariants(slots, s => byId[s.id][0])), ...slots.map(s => byId[s.id])];
}

/* зворотне до buildPayload; посилання — чужі дані, тож перевіряємо кожне
   поле. null — посилання пошкоджене, "stale" — створене до зміни
   стартового коду */
function parsePayload(slots, version, p){
  if(!Array.isArray(p) || p[0] !== version || p.length !== slots.length + 3) return null;
  const entries = p.slice(3);
  if(entries.some((e, i) => !Array.isArray(e) || !isIdx(e[0], slots[i].variants.length))) return null;
  if(p[2] !== starterSum(codeVariants(slots, s => entries[slots.indexOf(s)][0]))) return "stale";

  const items = [];
  for(let i = 0; i < slots.length; i++){
    const slot = slots[i], e = entries[i];
    const variant = slot.variants[e[0]];
    if(slot.type === "mcq"){
      if(e[1] !== -1 && !isIdx(e[1], variant.options.length)) return null;
      items.push(mcqItem(slot, e[0], e[1] === -1 ? null : e[1]));
      continue;
    }
    const code = applyDiff(variant.starter, e[2]);
    if(code === null || typeof e[3] !== "string") return null;
    if(slot.type === "code"){
      items.push(codeItem(slot, e[0], code, e[1] === 1, e[3]));
      continue;
    }
    if(!(e[4] === -1 || isIdx(e[4], variant.tests.length)) || typeof e[5] !== "string") return null;
    items.push(programItem(slot, e[0], code, { passed: e[1] === 1, error: e[3], failIdx: e[4], failOut: e[5] }));
  }
  const secs = typeof p[1] === "string" && /^[0-9a-z]{1,9}$/.test(p[1]) ? parseInt(p[1], 36) : NaN;
  return withTotal(slots, items, isNaN(secs) ? null : new Date(secs * 1000).toISOString());
}

function b64url(bytes){
  let bin = "";
  for(let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function unb64url(str){
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, ch => ch.charCodeAt(0));
}
const pipeBytes = (bytes, transform) =>
  new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer().then(b => new Uint8Array(b));

async function packShare(obj){
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let deflate = null;
  try { deflate = new CompressionStream("deflate-raw"); } catch(e){}
  if(!deflate) return "j" + b64url(bytes);
  return "z" + b64url(await pipeBytes(bytes, deflate));
}
async function unpackShare(str){
  let bytes = unb64url(str.slice(1));
  if(str[0] === "z") bytes = await pipeBytes(bytes, new DecompressionStream("deflate-raw"));
  else if(str[0] !== "j") throw new Error("невідомий формат посилання");
  return JSON.parse(new TextDecoder().decode(bytes));
}

return { makePick, maxPoints, fmtPoints, pointsWord, pointsLabel, normOutput, sameOutput, FAIL_OUT_MAX,
  mcqItem, codeItem, programItem, withTotal, refreshMcq, starterSum, codeDiff, applyDiff,
  buildPayload, parsePayload, packShare, unpackShare };

})();
