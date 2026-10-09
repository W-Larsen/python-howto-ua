/* ==========================================================================
   «Країни кнопок» на сторінці вчителя (#/globe-teacher).

   Вчитель закріплює країну за кожною кнопкою глобуса: кнопка 1 — UA,
   кнопка 2 — AU… Таблиця однакова для всіх учнів: гра «Блискавка» і
   вікторина беруть з неї правильну відповідь, тож task2 і task3 не залежать
   від task1. Зберігається в Google Таблиці (js/globe/store.js), на плату
   потрапляє в student_code.h, у Python-проєкт — у settings.py
   (BUTTON_COUNTRIES). Якщо учень у task1 поставив на кнопку іншу країну,
   код працює, а перевірка лише попереджає.
   ========================================================================== */
"use strict";
window.GlobeButtonsAdmin = (function(){

const esc = (s) => PyEditor.esc(s);

/* opts.key() — ключ учителя з форми вгорі сторінки */
function mount(el, opts){
  el.innerHTML = `
  <section class="gt-countries gt-buttons">
    <h2>Країни кнопок</h2>
    <p>Яку країну вмикає кожна кнопка глобуса — однаково для всіх учнів. Гра «Блискавка» і вікторина беруть правильну
      відповідь звідси, тож задачі 2 і 3 не залежать від задачі 1. Учні мають поставити в <code>task1.py</code> ту саму
      країну; якщо поставлять іншу, код усе одно працюватиме, але перевірка їх попередить.</p>
    <form class="gt-bform" autocomplete="off">
      <div class="gt-scroll gt-bscroll" data-role="grid"></div>
      <div class="gt-actions">
        <button type="submit" class="ctl primary" data-role="bsave">Зберегти кнопки</button>
        <div class="gt-cmsg" data-role="bmsg" aria-live="polite"></div>
      </div>
    </form>
  </section>`;

  const form = el.querySelector("form");
  const grid = el.querySelector('[data-role="grid"]');
  const msg = el.querySelector('[data-role="bmsg"]');

  function say(html, kind){
    msg.innerHTML = html || "";
    msg.className = "gt-cmsg " + (kind || "");
  }

  /* Селекти створюються один раз; далі міняються лише їхні варіанти, тож фокус не губиться.
     Країна, яку вже вибрано на іншій кнопці (навіть не збережену), з цього списку зникає. */
  const selects = () => [...grid.querySelectorAll("select")];

  function refresh(){
    const countries = GlobeRuntime.countries();
    const picked = selects().map(sel => sel.value);
    selects().forEach((sel, i) => {
      const taken = picked.filter((id, j) => id && j !== i);
      const mine = picked[i];
      sel.innerHTML = `<option value="">— не закріплено —</option>` +
        countries.filter(c => !taken.includes(c.id))
          .map(c => `<option value="${esc(c.id)}">${esc(c.id)} — ${esc(c.lcd_name)}</option>`).join("") +
        (mine && !countries.some(c => c.id === mine)
          ? `<option value="${esc(mine)}">${esc(mine)} — такої країни немає</option>` : "");
      sel.value = mine;
    });
  }

  function render(){
    const chosen = GlobeRuntime.buttons();
    grid.innerHTML = `<table class="gt-table gt-btable"><thead><tr><th>Кнопка</th><th>Країна</th></tr></thead><tbody>` +
      Array.from({ length: GlobeRuntime.buttonCount() }, (_, i) =>
        `<tr><td class="gt-name">${i + 1}</td><td><select name="b${i}" aria-label="Кнопка ${i + 1}"><option value="${esc(chosen[i] || "")}"></option></select></td></tr>`).join("") +
      `</tbody></table>`;
    selects().forEach((sel, i) => { sel.value = chosen[i] || ""; });
    refresh();
  }

  async function save(){
    const key = opts.key();
    if(!key){ say("Впишіть ключ учителя у форму вгорі сторінки.", "bad"); return; }
    const list = Array.from({ length: GlobeRuntime.buttonCount() }, (_, i) => form.elements["b" + i].value);
    const btn = el.querySelector('[data-role="bsave"]');
    btn.disabled = true;
    say("Зберігаю…");
    try {
      const r = await GlobeStore.setButtons(key, list);
      if(!r.ok){ say(esc(GlobeStore.errorText(r.error)), "bad"); return; }
      const fresh = await GlobeRuntime.loadButtons();
      render();
      if(!fresh.ok){ say(`Збережено, але список не оновився: ${esc(GlobeRuntime.buttonsError)} Оновіть сторінку.`, "bad"); return; }
      say(`Збережено. Учні побачать таблицю після оновлення сторінки. Скетч і Python-проєкт скачайте заново — таблиця
        вшита в <code>student_code.h</code> і <code>settings.py</code>.`, "ok");
    } catch(e){
      say(esc(e.message || String(e)), "bad");
    } finally { btn.disabled = false; }
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); save(); });
  grid.addEventListener("change", refresh);
  /* нову країну додали на цій сторінці — вона одразу з'являється в списках */
  const onCountries = () => { if(el.isConnected) refresh(); };
  window.addEventListener("globe:countries", onCountries);
  /* таблицю перечитали зі сховища — показуємо її, а не те, що було при завантаженні */
  window.addEventListener("globe:buttons", () => { if(el.isConnected) render(); });
  render();
  if(GlobeRuntime.buttonsError) say(`Не вдалося завантажити таблицю: ${esc(GlobeRuntime.buttonsError)} Оновіть сторінку.`, "bad");
  return { render };
}

return { mount };
})();
