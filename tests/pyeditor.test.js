"use strict";
(function(){
/* Редактор: парні дужки й лапки. Друкуємо «як користувач» — keydown, а якщо
   рушій його не забрав, вставляємо символ сам, як це зробив би браузер. */
function editor(value, caret){
  const box = document.createElement("div");
  box.innerHTML = `<pre></pre><textarea></textarea>`;
  box.style.cssText = "position:absolute; left:-9999px; top:0";     /* поза екраном, але з фокусом */
  document.body.appendChild(box);
  const ta = box.querySelector("textarea");
  PyEditor.wireEditor(ta, box.querySelector("pre"));
  ta.value = value || "";
  ta.focus();
  ta.selectionStart = ta.selectionEnd = caret != null ? caret : ta.value.length;
  return ta;
}
function press(ta, key){
  const e = new KeyboardEvent("keydown", { key, bubbles:true, cancelable:true });
  ta.dispatchEvent(e);
  if(e.defaultPrevented) return;
  if(key === "Backspace"){
    if(ta.selectionStart === ta.selectionEnd) ta.selectionStart = Math.max(0, ta.selectionStart - 1);
    PyEditor.insertText(ta, "");
  } else PyEditor.insertText(ta, key);
}
const typeKeys = (ta, text) => [...text].forEach(k => press(ta, k));
/* значення з | на місці курсора */
const shown = (ta) => ta.value.slice(0, ta.selectionStart) + "|" + ta.value.slice(ta.selectionEnd);

T.test("редактор: ( ставить ) і курсор між ними; ) перескакує закриваючу", () => {
  const ta = editor("print");
  press(ta, "(");
  T.eq(shown(ta), "print(|)");
  typeKeys(ta, "x)");
  T.eq(shown(ta), "print(x)|");
});

T.test("редактор: лапки парні, друга лапка перескакує", () => {
  const ta = editor("print(", 6);
  typeKeys(ta, "\"Привіт\"");
  T.eq(shown(ta), "print(\"Привіт\"|");
  const tb = editor("x = ");
  press(tb, "'");
  T.eq(shown(tb), "x = '|'");
});

T.test("редактор: f-рядок — лапки й фігурні дужки парні", () => {
  const ta = editor("print(f");
  press(ta, "\"");
  T.eq(shown(ta), "print(f\"|\"");
  typeKeys(ta, "{name");
  T.eq(shown(ta), "print(f\"{name|}\"");
});

T.test("редактор: апостроф у тексті й у коментарі не подвоюється", () => {
  const ta = editor("print(\"Ім\")", 9);
  press(ta, "'");
  T.eq(shown(ta), "print(\"Ім'|\")");
  const tb = editor("# ім");
  typeKeys(tb, "'я (");
  T.eq(shown(tb), "# ім'я (|");
});

T.test("редактор: перед словом дужка не закривається; виділення обгортається", () => {
  const ta = editor("x = abc", 4);
  press(ta, "(");
  T.eq(shown(ta), "x = (|abc");
  const tb = editor("print(name)");
  tb.setSelectionRange(6, 10);
  press(tb, "\"");
  T.eq(tb.value, "print(\"name\")");
});

T.test("підсвітка: у f-рядку {вираз} — код, а не зелений рядок", () => {
  const html = PyEditor.highlight('print(f"Життів: {lives * 2}")');
  T.ok(html.includes('<span class="fpre">f</span>'), "префікс f");
  T.ok(html.includes('<span class="str">&quot;Життів: </span><span class="fmt">{</span>lives * <span class="num">2</span><span class="fmt">}</span><span class="str">&quot;</span>'), html);
  const box = document.createElement("div");
  box.innerHTML = html;
  T.eq(box.textContent, 'print(f"Життів: {lives * 2}")', "текст не змінився");
  T.ok(!PyEditor.highlight('print("{x}")').includes("fmt"), "звичайний рядок лишається рядком");
  T.ok(PyEditor.highlight('f"{{x}}"').includes('<span class="str">&quot;{{x}}&quot;</span>'), "{{ }} — просто текст");
  T.ok(PyEditor.highlight("f'{d[\"a\"]}'").includes('<span class="str">&quot;a&quot;</span>'), "рядок усередині виразу");
});

T.test("редактор: Enter після else: і Backspace у кінці тексту прибирає весь відступ", () => {
  const ta = editor("else:");
  press(ta, "Enter");
  T.eq(shown(ta), "else:\n    |");
  press(ta, "Backspace");
  T.eq(shown(ta), "else:\n|", "одразу 4 пробіли, а не 1");
  const tb = editor("for i in range(3):\n    if i:");
  press(tb, "Enter");
  T.eq(shown(tb), "for i in range(3):\n    if i:\n        |");
  press(tb, "Backspace");
  T.eq(shown(tb), "for i in range(3):\n    if i:\n    |", "з 8 до 4");
});

T.test("редактор: Backspace між порожньою парою прибирає обидві", () => {
  const ta = editor("print");
  press(ta, "(");
  press(ta, "Backspace");
  T.eq(shown(ta), "print|");
  const tb = editor("x = \"\"", 5);
  press(tb, "Backspace");
  T.eq(shown(tb), "x = |");
});

})();
