"""Перевірки CSS-токенів редизайну v2.

- жодного зашитого кольору поза блоками :root (токенами): інакше в темній
  темі на сторінці лишаться світлі латки;
- кожна var(--x) у css/, js/ та index.html визначена десь у css/;
- (Task 6) темна тема однакова в обох блоках і тримає контраст AA.

Запуск з кореня репозиторію: python -m unittest tests/test_css_tokens.py -v
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = sorted((ROOT / "css").glob("*.css"))
COLOR = re.compile(r"#[0-9a-fA-F]{3,8}\b|rgba?\(")
# файли, де зашиті кольори вже замінено токенами (розширюється в Task 2–5)
MIGRATED = []
LIGHT = (":root",)


def declarations(text):
    """[(стек селекторів, декларація)]: коментарі викинуто, @media дає стек із двох."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    stack, buf, out = [], "", []
    for ch in text:
        if ch == "{":
            stack.append(re.sub(r"\s+", " ", buf.strip()))
            buf = ""
        elif ch == "}":
            if buf.strip():
                out.append((tuple(stack), buf.strip()))
            stack.pop()
            buf = ""
        elif ch == ";" and stack:
            if buf.strip():
                out.append((tuple(stack), buf.strip()))
            buf = ""
        else:
            buf += ch
    return out


def css_decls(names=None):
    """(файл, стек, декларація) з усіх css/ або лише з перелічених файлів."""
    for f in CSS:
        if names is None or f.name in names:
            for stack, decl in declarations(f.read_text(encoding="utf-8")):
                yield f.name, stack, decl


def tokens(stack_match):
    """{--назва: значення} з блоків base.css, чий стек селекторів == stack_match."""
    out = {}
    for _, stack, decl in css_decls(["base.css"]):
        if stack == stack_match and decl.startswith("--"):
            k, v = decl.split(":", 1)
            out[k.strip()] = v.strip()
    return out


class Tokens(unittest.TestCase):
    def test_new_tokens_defined(self):
        light = tokens(LIGHT)
        need = ["--accent", "--syn-kw", "--syn-fn", "--syn-num", "--syn-str", "--syn-cmt",
                "--shadow-1", "--shadow-2", "--shadow-3", "--paper-dot", "--on-tc", "--tc",
                "--tc-vars", "--tc-cond", "--tc-loops", "--tc-func", "--tc-coll", "--tc-tests",
                "--faint", "--hl-ink", "--scrim", "--i-line", "--j-line", "--n-line", "--stop-line"]
        self.assertEqual([t for t in need if t not in light], [])

    def test_every_var_is_defined(self):
        defined = {d.split(":", 1)[0].strip() for _, _, d in css_decls() if d.startswith("--")}
        used = set()
        for _, _, decl in css_decls():
            used.update(re.findall(r"var\((--[\w-]+)", decl))
        for f in [ROOT / "index.html", *sorted((ROOT / "js").rglob("*.js"))]:
            used.update(re.findall(r"var\((--[\w-]+)", f.read_text(encoding="utf-8")))
        # "var(--tc-" + тема + ")" у JS — динамічний префікс, а не назва
        used = {u for u in used if not u.endswith("-")}
        self.assertEqual(sorted(used - defined), [])

    def test_no_hardcoded_colors(self):
        bad = [f"{name}: {stack[-1]} {{ {decl} }}"
               for name, stack, decl in css_decls(MIGRATED)
               if COLOR.search(decl) and ":root" not in stack[-1]]
        self.assertEqual(bad, [], "\n" + "\n".join(bad))


if __name__ == "__main__":
    unittest.main()
