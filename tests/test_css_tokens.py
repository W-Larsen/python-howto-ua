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
# усі файли css/ (css_decls(None) — без фільтра)
MIGRATED = None
LIGHT = (":root",)
DARK_A = (':root[data-theme="dark"]',)
DARK_B = ("@media (prefers-color-scheme:dark)", ':root:not([data-theme="light"])')
TOPICS = ["vars", "cond", "loops", "func", "coll", "tests"]
# (текст, тло, мінімум): основний текст і дрібні підписи — AA 4.5
PAIRS = [
    ("--body", "--card", 4.5), ("--body", "--page", 4.5), ("--ink", "--card", 4.5),
    ("--muted", "--card", 4.5), ("--muted", "--panel", 4.5), ("--muted", "--panel-2", 4.5),
    ("--i", "--card", 4.5), ("--i", "--i-soft", 4.5), ("--j", "--card", 4.5), ("--j", "--j-soft", 4.5),
    ("--n", "--card", 4.5), ("--n", "--n-soft", 4.5), ("--stop", "--card", 4.5),
    ("--stop", "--stop-soft", 4.5), ("--term-ink", "--term", 4.5), ("--term-hi", "--term", 4.5),
    ("--accent", "--card", 4.5), ("--accent", "--page", 4.5),
    ("--syn-kw", "--card", 4.5), ("--syn-fn", "--card", 4.5), ("--syn-str", "--card", 4.5),
    ("--syn-num", "--card", 4.5), ("--syn-kw", "--panel", 4.5), ("--syn-fn", "--panel", 4.5),
    ("--syn-str", "--panel", 4.5), ("--syn-num", "--panel", 4.5),
    ("--hl-ink", "--hl", 4.5), ("--card", "--i", 4.5), ("--card", "--ink", 4.5),
]


def hex6(v):
    v = v.lower()
    return "#" + "".join(c * 2 for c in v[1:]) if len(v) == 4 else v


def mix(a, b, p):
    """color-mix(in srgb, a p, b): поканально в sRGB, як це робить браузер."""
    ca = [int(a[i:i + 2], 16) for i in (1, 3, 5)]
    cb = [int(b[i:i + 2], 16) for i in (1, 3, 5)]
    return "#" + "".join("%02x" % round(x * p + y * (1 - p)) for x, y in zip(ca, cb))


def resolve(value, env):
    v = value.strip()
    if re.fullmatch(r"#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6}", v):
        return hex6(v)
    m = re.fullmatch(r"var\((--[\w-]+)\)", v)
    if m:
        return resolve(env[m.group(1)], env)
    m = re.fullmatch(r"color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)", v)
    if m:
        return mix(resolve(m.group(1), env), resolve(m.group(3), env), float(m.group(2)) / 100)
    raise ValueError("не вмію розібрати колір: " + v)


def contrast(a, b):
    def lum(h):
        def ch(i):
            c = int(h[i:i + 2], 16) / 255
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        return 0.2126 * ch(1) + 0.7152 * ch(3) + 0.0722 * ch(5)
    x, y = sorted([lum(a), lum(b)], reverse=True)
    return (x + 0.05) / (y + 0.05)


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

    def test_dark_blocks_identical(self):
        a = [d for _, s, d in css_decls(["base.css"]) if s == DARK_A]
        b = [d for _, s, d in css_decls(["base.css"]) if s == DARK_B]
        self.assertTrue(a, 'нема блоку :root[data-theme="dark"]')
        self.assertEqual(a, b, "блоки темної теми мають бути однакові")

    def test_dark_covers_tokens(self):
        dark = tokens(DARK_A)
        need = ["--page", "--card", "--panel", "--panel-2", "--ink", "--body", "--muted", "--rule",
                "--rule-soft", "--i", "--i-soft", "--j", "--j-soft", "--n", "--n-soft", "--hl",
                "--hl-bar", "--stop", "--stop-soft", "--term", "--term-ink", "--term-hi",
                "--accent", "--syn-kw", "--syn-fn", "--syn-str", "--syn-cmt", "--shadow-1",
                "--shadow-2", "--shadow-3", "--paper-dot", "--on-tc", "--tc-vars", "--tc-cond",
                "--tc-loops", "--tc-func", "--tc-coll", "--faint", "--hl-ink", "--scrim"]
        self.assertEqual([t for t in need if t not in dark], [])

    def test_contrast_aa(self):
        light = tokens(LIGHT)
        derived = {d.split(":", 1)[0].strip(): d.split(":", 1)[1].strip()
                   for _, _, d in css_decls() if d.startswith(("--tc-soft", "--tc-ink"))}
        fails = []
        for theme, env in (("світла", dict(light)), ("темна", {**light, **tokens(DARK_A)})):
            for fg, bg, need in PAIRS:
                c = contrast(resolve(env[fg], env), resolve(env[bg], env))
                if c < need:
                    fails.append(f"{theme}: {fg} на {bg} = {c:.2f} < {need}")
            for t in TOPICS:
                e = {**env, **derived, "--tc": env["--tc-" + t]}
                # обкладинка: великий текст --on-tc на --tc — 3:1; плашки 11px — 4.5
                for fg, bg, need in (("--on-tc", "--tc", 3), ("--tc-ink", "--tc-soft", 4.5)):
                    c = contrast(resolve(e[fg], e), resolve(e[bg], e))
                    if c < need:
                        fails.append(f"{theme}/{t}: {fg} на {bg} = {c:.2f} < {need}")
        self.assertEqual(fails, [], "\n" + "\n".join(fails))


if __name__ == "__main__":
    unittest.main()
