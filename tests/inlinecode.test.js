"use strict";
(function(){
/* Код у тексті: inlinecode.js фарбує <code> у прозі тим самим PyEditor.highlight,
   що й редактор, і не чіпає віджети, <pre>, редактори та самостійні роботи. */
function page(html){
  const s = document.createElement("section");
  s.className = "page";
  s.innerHTML = html;
  document.getElementById("sandbox").appendChild(s);
  return s;
}

T.test("код у тексті: фрагмент у прозі розфарбовано, текст той самий", () => {
  const s = page(`<p>Рядок <code>print(x)</code> і <code>for i in range(3)</code></p>`);
  try {
    T.eq(InlineCode.paint(s), 2);
    const [a, b] = s.querySelectorAll("code");
    T.eq(a.innerHTML, PyEditor.highlight("print(x)"));
    T.ok(a.classList.contains("syn"), "нема класу syn");
    T.eq(b.textContent, "for i in range(3)");
    T.ok(b.querySelector(".kw"), "for не підсвічено як ключове слово");
  } finally { s.remove(); }
});

T.test("код у тексті: віджет, pre, редактор, самостійна й вкладена розмітка — без змін", () => {
  const s = page(
    `<div class="widget"><code>for</code></div>` +
    `<pre><code>if x:</code></pre>` +
    `<div class="pytask"><code>len(a)</code></div>` +
    `<div data-check-root><code>print(1)</code></div>` +
    `<p><code><b>x</b> = 1</code></p>`);
  try {
    const before = s.innerHTML;
    T.eq(InlineCode.paint(s), 0);
    T.eq(s.innerHTML, before);
  } finally { s.remove(); }
});

T.test("код у тексті: ліва колонка шпаргалки розфарбована, права — ні", () => {
  const s = page(`<table class="cheat"><tr><td>len(a)</td><td>довжина a</td></tr></table>`);
  try {
    InlineCode.paint(s);
    const [code, text] = s.querySelectorAll("td");
    T.eq(code.innerHTML, PyEditor.highlight("len(a)"));
    T.eq(text.innerHTML, "довжина a");
  } finally { s.remove(); }
});

T.test("код у тексті: повторний прохід нічого не міняє; < і & не ламаються", () => {
  const s = page(`<p><code>a &lt; b &amp;&amp; c</code></p>`);
  try {
    InlineCode.paint(s);
    const once = s.innerHTML;
    T.eq(InlineCode.paint(s), 0);
    T.eq(s.innerHTML, once);
    T.eq(s.querySelector("code").textContent, "a < b && c");
  } finally { s.remove(); }
});
})();
