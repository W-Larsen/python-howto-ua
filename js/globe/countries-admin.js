/* ==========================================================================
   «Країни глобуса» на сторінці вчителя (#/globe-teacher).

   Список усіх країн (з проєкту + додані вчителем) з номерами треків і ▶,
   форма «Додати країну» з mp3 учнів і кнопка «SD-картка». Країни
   зберігаються в Google Таблиці + Drive (js/globe/store.js); перевірка
   перед збереженням — ті самі правила, що й tools/validate_content.py
   (GlobeRuntime.checkCountry). Після збереження каталог перечитується, і
   нова країна одразу є в симуляторі, перевірці коду й архівах.
   ========================================================================== */
"use strict";
window.GlobeCountriesAdmin = (function(){

const esc = (s) => PyEditor.esc(s);
const MAX_MP3 = 5 * 1024 * 1024;
const FIELDS = [
  { k:"name", label:"Назва українською", ph:"Франція", req:true },
  { k:"capital", label:"Столиця українською", ph:"Париж" },
  { k:"lcd_name", label:"Назва для екрана (латиниця, до 14)", ph:"France", req:true, lcd:true },
  { k:"lcd_capital", label:"Столиця для екрана (латиниця, до 14)", ph:"Paris", lcd:true },
  { k:"continent", label:"Материк", ph:"Європа" }
];

/* opts.key() — ключ учителя з форми вгорі сторінки */
function mount(el, opts){
  el.innerHTML = `
  <section class="gt-countries" data-role="countries">
    <h2>Країни глобуса</h2>
    <p>Тут усі країни, які знає глобус: шість із проєкту і ті, що ви додали. Нова країна з аудіо учнів одразу з'являється в усіх:
      перевірка коду її приймає, симулятор грає її mp3, а архіви для плати її містять.</p>
    <div class="callout warn"><p><b>Після зміни списку країн скачайте заново і скетч, і SD-картку.</b> Номери треків
      розставляються за абеткою ID, тож нова країна зсуває номери інших — старий скетч зі старою карткою
      плутатиме записи.</p></div>
    <div class="gt-scroll"><table class="gt-table gt-ctable">
      <thead><tr><th>ID</th><th>Країна</th><th>На екрані</th><th>Трек</th><th>Аудіо</th><th></th></tr></thead>
      <tbody></tbody></table></div>
    <div class="gt-actions">
      <button type="button" class="ctl primary" data-act="add-country">＋ Додати країну</button>
      <button type="button" class="ctl" data-act="sdcard">⬇ SD-картка (.zip)</button>
    </div>
    <div data-role="sdmsg" hidden></div>
    <form class="gt-cform" hidden autocomplete="off">
      <h3 data-role="ctitle">Нова країна</h3>
      <div class="gt-cgrid">
        <label>ID (2–3 великі латинські літери)<input name="id" type="text" maxlength="3" required placeholder="FR"
          autocapitalize="characters" spellcheck="false"></label>
        ${FIELDS.map(f => `<label>${f.label}<input name="${f.k}" type="text" ${f.req ? "required" : ""}
          placeholder="${f.ph}"${f.lcd ? ' maxlength="30" spellcheck="false"' : ""}></label>`).join("")}
        <label class="gt-cwide">Текст розповіді (те, що звучить у записі)<textarea name="text" rows="4" required
          placeholder="Франція — країна сиру й Ейфелевої вежі."></textarea></label>
        <label class="gt-cwide">Аудіо учнів (.mp3, до 5 МБ)<input name="audio" type="file" accept=".mp3,audio/mpeg">
          <small data-role="audio-note"></small></label>
      </div>
      <div class="gt-cmsg" data-role="cmsg" aria-live="polite"></div>
      <div class="gt-actions">
        <button type="submit" class="ctl primary" data-role="csave">Зберегти країну</button>
        <button type="button" class="ctl" data-act="cancel-country">Скасувати</button>
      </div>
    </form>
  </section>`;

  const $ = (s) => el.querySelector(s);
  const tbody = $("tbody");
  const form = $(".gt-cform");
  const cmsg = $('[data-role="cmsg"]');
  const sdmsg = $('[data-role="sdmsg"]');
  const player = new Audio();
  let editing = null;

  function render(){
    const list = GlobeRuntime.countries();
    tbody.innerHTML = list.map(c => {
      const tag = c.override ? `<span class="gt-tag over">замінено</span>`
        : c.extra ? `<span class="gt-tag new">додано</span>` : `<span class="gt-tag">з проєкту</span>`;
      const actions = c.extra
        ? `<button type="button" class="gt-open" data-act="edit-country">Змінити</button>
           <button type="button" class="gt-open bad" data-act="delete-country">Прибрати</button>`
        : `<button type="button" class="gt-open" data-act="edit-country" title="Свій текст чи запис замість проєктного">Замінити</button>`;
      return `<tr data-id="${esc(c.id)}">
        <td class="gt-name">${esc(c.id)}</td>
        <td>${esc(c.name)}${c.capital ? `<br><small>${esc(c.capital)}</small>` : ""}</td>
        <td><code>${esc(c.lcd_name)}</code><br><code>${esc(c.lcd_capital)}</code></td>
        <td class="gt-track">${c.track}</td>
        <td><button type="button" class="gt-open" data-act="play" aria-label="Слухати ${esc(c.id)}">▶</button></td>
        <td><span class="gt-cell">${tag} ${actions}</span></td></tr>`;
    }).join("");
    const skipped = GlobeRuntime.skipped || [];
    if(skipped.length){
      tbody.insertAdjacentHTML("beforeend", skipped.map(s => `<tr class="gt-skipped"><td class="gt-name">${esc(s.id)}</td>
        <td colspan="5">Пропущено: ${esc(s.errors.join(" "))}</td></tr>`).join(""));
    }
  }

  function say(html, kind){
    cmsg.innerHTML = html || "";
    cmsg.className = "gt-cmsg " + (kind || "");
  }

  function openForm(c){
    editing = c ? c.id : null;
    form.reset();
    say("");
    form.hidden = false;
    $('[data-role="ctitle"]').textContent = c ? (c.extra ? "Змінити країну " : "Замінити країну проєкту ") + c.id : "Нова країна";
    form.elements.id.readOnly = !!c;
    if(c){
      form.elements.id.value = c.id;
      FIELDS.concat([{ k:"text" }]).forEach(f => { form.elements[f.k].value = c[f.k] || ""; });
    }
    $('[data-role="audio-note"]').textContent = c && (c.extra ? c.has_audio : true)
      ? "Запис уже є — новий файл його замінить; не обираєте — лишається той самий." : "";
    form.scrollIntoView({ behavior:"smooth", block:"start" });
    form.elements[c ? "name" : "id"].focus();
  }

  function readBase64(file){
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result).split(",")[1] || "");
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(file);
    });
  }

  async function save(){
    const key = opts.key();
    if(!key){ say("Впишіть ключ учителя у форму вгорі сторінки.", "bad"); return; }
    const id = form.elements.id.value.trim().toUpperCase();
    form.elements.id.value = id;
    const fields = {};
    FIELDS.concat([{ k:"text" }]).forEach(f => { fields[f.k] = form.elements[f.k].value.trim(); });
    const check = GlobeRuntime.checkCountry(id, fields);
    if(check.errors.length){
      say(`<b>Не збережено:</b><ul>${check.errors.map(e => `<li>${esc(e)}</li>`).join("")}</ul>`, "bad");
      return;
    }
    const file = form.elements.audio.files[0];
    if(file && file.size > MAX_MP3){ say(GlobeStore.errorText("too_big"), "bad"); return; }
    const isNew = !editing && !GlobeRuntime.countries().some(c => c.id === id);
    const btn = $('[data-role="csave"]');
    btn.disabled = true;
    say(file ? "Завантажую запис і зберігаю…" : "Зберігаю…");
    try {
      const b64 = file ? await readBase64(file) : "";
      const r = await GlobeStore.addCountry(key, id, fields, b64);
      if(!r.ok){ say(esc(GlobeStore.errorText(r.error)), "bad"); return; }
      await GlobeRuntime.loadCountries();
      render();
      form.hidden = true;
      const warn = check.warnings.length ? `<br><small>${check.warnings.map(esc).join("<br>")}</small>` : "";
      sdmsg.hidden = false;
      sdmsg.innerHTML = `<div class="callout"><p><b>${esc(id)}</b> збережено${isNew && !file ? ", але без аудіо — на глобусі вона буде мовчати" : ""}.
        Не забудьте скачати заново скетч і SD-картку.${warn}</p></div>`;
    } catch(e){
      say(esc(e.message || String(e)), "bad");
    } finally { btn.disabled = false; }
  }

  async function remove(btn, id){
    if(btn.dataset.armed !== "1"){
      btn.dataset.armed = "1";
      btn.textContent = "Точно прибрати?";
      setTimeout(() => { if(btn.isConnected){ btn.removeAttribute("data-armed"); btn.textContent = "Прибрати"; } }, 4000);
      return;
    }
    const key = opts.key();
    if(!key){ sdmsg.hidden = false; sdmsg.innerHTML = `<div class="callout warn"><p>Впишіть ключ учителя у форму вгорі сторінки.</p></div>`; return; }
    btn.disabled = true;
    const r = await GlobeStore.deleteCountry(key, id);
    if(!r.ok){
      btn.disabled = false;
      sdmsg.hidden = false;
      sdmsg.innerHTML = `<div class="callout warn"><p>${esc(GlobeStore.errorText(r.error))}</p></div>`;
      return;
    }
    await GlobeRuntime.loadCountries();
    render();
  }

  async function sdcard(btn){
    btn.disabled = true;
    try {
      const r = await GlobeBundle.sdcard();
      GlobeBundle.download(r.blob, "touch-the-globe-sd-card.zip");
      const miss = r.missing.length ? `<p>Без аудіо (на глобусі мовчатимуть): ${r.missing.map(c => esc(c.id)).join(", ")}.</p>` : "";
      sdmsg.hidden = false;
      sdmsg.innerHTML = `<div class="callout"><p>Розпакуйте архів і скопіюйте папку <code>01</code> у корінь microSD
        (FAT32), щоб на картці було <code>01/001.mp3</code>, <code>01/002.mp3</code>… Скетч скачайте з цієї ж сторінки — номери
        треків у ньому ті самі.</p>${miss}</div>`;
    } finally { btn.disabled = false; }
  }

  el.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]");
    if(!b) return;
    const tr = b.closest("tr[data-id]");
    const id = tr && tr.dataset.id;
    const act = b.dataset.act;
    if(act === "add-country") openForm(null);
    else if(act === "cancel-country") form.hidden = true;
    else if(act === "sdcard") sdcard(b);
    else if(act === "edit-country") openForm(GlobeRuntime.countries().find(c => c.id === id));
    else if(act === "delete-country") remove(b, id);
    else if(act === "play"){
      GlobeRuntime.audioUrl(id).then(url => {
        if(!url){ b.textContent = "—"; b.title = "запису немає"; return; }
        player.src = url;
        player.play().catch(() => {});
      });
    }
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); save(); });

  render();
  return { render };
}

return { mount };
})();
