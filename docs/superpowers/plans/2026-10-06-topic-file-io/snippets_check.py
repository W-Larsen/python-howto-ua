"""Звірка віджетів теми «Файли» зі справжнім Python.

Кадри плеєрів у js/pages/files.js написані вручну. Тут кожна програма з
віджетів і задач «Перевір себе» виконується по-справжньому в тимчасовій
папці, а її вивід і вміст файлів порівнюються з тим, що показує сторінка.
Якщо змінюєш код або дані у віджеті — зміни й тут, і навпаки.

Запуск з кореня репозиторію:
    PYTHONIOENCODING=utf-8 python docs/superpowers/plans/2026-10-06-topic-file-io/snippets_check.py
"""
import contextlib
import io
import os
import pathlib
import tempfile
import textwrap
import unittest

NAMES = "Оля\nІван\nПетро\n"
STUDENTS = "name,class,grade\nОля,9-А,11\nІван,9-Б,9\nНіна,9-А,12\n"
QUOTED = 'name,class,grade\n"Іваненко, Оля",9-А,11\nПетро,9-Б,9\n'
CRLF = "\r\n"
LF = "\n"


def run(code, files=None, cwd_sub=""):
    """Виконує code у чистій тимчасовій папці з файлами files.

    Віддає (вивід, {ім'я: вміст}, {ім'я: сирий вміст}). У «вмісті» CRLF
    зведено до LF: Windows у текстовому режимі пише CRLF, а сторінка
    показує кінець рядка однаково на всіх системах. Сирий вміст потрібен
    там, де CRLF і є суттю (csv). Якщо програма впала, останній рядок
    виводу — «Тип: повідомлення», як у консолі.
    """
    with tempfile.TemporaryDirectory() as tmp:
        root = pathlib.Path(tmp)
        for name, text in (files or {}).items():
            p = root / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(text.encode("utf-8"))
        old = os.getcwd()
        os.chdir(root / cwd_sub)
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                try:
                    exec(textwrap.dedent(code), {"__name__": "__main__"})
                except Exception as e:  # noqa: BLE001 — показуємо як консоль
                    name = type(e).__name__
                    if type(e).__module__ == "io":
                        name = "io." + name
                    print(f"{name}: {e}")
        finally:
            os.chdir(old)
        raw = {p.relative_to(root).as_posix(): p.read_bytes().decode("utf-8")
               for p in root.rglob("*") if p.is_file()}
        files = {k: v.replace(CRLF, LF) for k, v in raw.items()}
        return buf.getvalue(), files, raw


class Modes(unittest.TestCase):
    """6.2 open і режими"""
    CODE = '''
        f = open("names.txt", "{m}", encoding="utf-8")
        f.write("Ніна\\n")
        f.close()
        print("готово")
    '''

    def test_w(self):
        out, files, _ = run(self.CODE.format(m="w"), {"names.txt": NAMES})
        self.assertEqual(out, "готово\n")
        self.assertEqual(files["names.txt"], "Ніна\n")

    def test_a(self):
        out, files, _ = run(self.CODE.format(m="a"), {"names.txt": NAMES})
        self.assertEqual(out, "готово\n")
        self.assertEqual(files["names.txt"], NAMES + "Ніна\n")

    def test_r(self):
        out, files, _ = run(self.CODE.format(m="r"), {"names.txt": NAMES})
        self.assertEqual(out, "io.UnsupportedOperation: not writable\n")
        self.assertEqual(files["names.txt"], NAMES)


class With(unittest.TestCase):
    """6.3 with"""

    def test_close_version(self):
        out, _, _ = run('''
            f = open("names.txt", "a", encoding="utf-8")
            f.write("Ніна\\n")
            f.write(100)
            f.close()
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "TypeError: write() argument must be str, not int\n")

    def test_with_version(self):
        out, files, _ = run('''
            with open("names.txt", "a", encoding="utf-8") as f:
                f.write("Ніна\\n")
                f.write(100)
            print("сюди не дійдемо")
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "TypeError: write() argument must be str, not int\n")
        self.assertEqual(files["names.txt"], NAMES + "Ніна\n")


class Read(unittest.TestCase):
    """6.4 читання"""

    def test_read_twice(self):
        out, _, _ = run('''
            with open("names.txt", encoding="utf-8") as f:
                text = f.read()
                again = f.read()
            print(text)
            print(repr(again))
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "Оля\nІван\nПетро\n\n''\n")

    def test_for_line(self):
        out, _, _ = run('''
            with open("names.txt", encoding="utf-8") as f:
                for line in f:
                    print(line)
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "Оля\n\nІван\n\nПетро\n\n")

    def test_for_rstrip(self):
        out, _, _ = run('''
            with open("names.txt", encoding="utf-8") as f:
                for line in f:
                    print(line.rstrip())
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "Оля\nІван\nПетро\n")

    def test_readlines(self):
        out, _, _ = run('''
            with open("names.txt", encoding="utf-8") as f:
                lines = f.readlines()
            print(lines)
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "['Оля\\n', 'Іван\\n', 'Петро\\n']\n")


class Sort(unittest.TestCase):
    """6.5 читаємо в список і сортуємо"""

    def test_sorted(self):
        out, _, _ = run('''
            names = []
            with open("names.txt", encoding="utf-8") as f:
                for line in f:
                    names.append(line.rstrip())
            for name in sorted(names):
                print("привіт,", name)
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "привіт, Іван\nпривіт, Оля\nпривіт, Петро\n")


class Missing(unittest.TestCase):
    """6.6 коли файлу немає"""
    PLAIN = '''
        with open("names.txt", encoding="utf-8") as f:
            print(f.read().rstrip())
        print("кінець програми")
    '''
    GUARD = '''
        try:
            with open("names.txt", encoding="utf-8") as f:
                print(f.read().rstrip())
        except FileNotFoundError:
            print("файлу names.txt немає")
        print("кінець програми")
    '''

    def test_plain_exists(self):
        out, _, _ = run(self.PLAIN, {"names.txt": NAMES})
        self.assertEqual(out, "Оля\nІван\nПетро\nкінець програми\n")

    def test_plain_missing(self):
        out, _, _ = run(self.PLAIN)
        self.assertEqual(out, "FileNotFoundError: [Errno 2] No such file or directory: 'names.txt'\n")

    def test_guard_exists(self):
        out, _, _ = run(self.GUARD, {"names.txt": NAMES})
        self.assertEqual(out, "Оля\nІван\nПетро\nкінець програми\n")

    def test_guard_missing(self):
        out, _, _ = run(self.GUARD)
        self.assertEqual(out, "файлу names.txt немає\nкінець програми\n")


class Paths(unittest.TestCase):
    """6.7 де шукається файл: відносний шлях рахується від папки запуску"""
    CODE = '''
        from pathlib import Path
        path = Path("data") / "names.txt"
        if path.exists():
            print(path.read_text(encoding="utf-8").rstrip())
        else:
            print("файлу немає")
    '''
    FILES = {"main.py": "", "data/names.txt": NAMES}

    def test_from_project(self):
        out, _, _ = run(self.CODE, self.FILES)
        self.assertEqual(out, "Оля\nІван\nПетро\n")

    def test_from_data(self):
        out, _, _ = run(self.CODE, self.FILES, cwd_sub="data")
        self.assertEqual(out, "файлу немає\n")


class Csv(unittest.TestCase):
    """6.8–6.10 CSV"""

    def test_split(self):
        out, _, _ = run('''
            with open("students.csv", encoding="utf-8") as f:
                for line in f:
                    row = line.rstrip().split(",")
                    print(len(row), row)
        ''', {"students.csv": QUOTED})
        self.assertEqual(out,
            "3 ['name', 'class', 'grade']\n"
            "4 ['\"Іваненко', ' Оля\"', '9-А', '11']\n"
            "3 ['Петро', '9-Б', '9']\n")

    def test_reader(self):
        out, _, _ = run('''
            import csv
            with open("students.csv", encoding="utf-8") as f:
                for row in csv.reader(f):
                    print(len(row), row)
        ''', {"students.csv": QUOTED})
        self.assertEqual(out,
            "3 ['name', 'class', 'grade']\n"
            "3 ['Іваненко, Оля', '9-А', '11']\n"
            "3 ['Петро', '9-Б', '9']\n")

    DICT = '''
        import csv
        students = []
        with open("students.csv", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                students.append(row)
        for s in sorted(students, key=lambda s: KEY):
            print(s["name"], s["grade"])
    '''

    def test_dictreader_str_sort(self):
        out, _, _ = run(self.DICT.replace("KEY", 's["grade"]'), {"students.csv": STUDENTS})
        self.assertEqual(out, "Оля 11\nНіна 12\nІван 9\n")

    def test_dictreader_int_sort(self):
        out, _, _ = run(self.DICT.replace("KEY", 'int(s["grade"])'), {"students.csv": STUDENTS})
        self.assertEqual(out, "Іван 9\nОля 11\nНіна 12\n")

    def test_dictwriter(self):
        _, files, raw = run('''
            import csv
            students = [{"name": "Оля", "grade": 11}, {"name": "Іван", "grade": 9}]
            with open("grades.csv", "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["name", "grade"])
                writer.writeheader()
                for s in students:
                    writer.writerow(s)
        ''')
        self.assertEqual(files["grades.csv"], "name,grade\nОля,11\nІван,9\n")
        # csv сам пише CRLF на будь-якій системі — тому й потрібен newline=""
        self.assertEqual(raw["grades.csv"], "name,grade" + CRLF + "Оля,11" + CRLF + "Іван,9" + CRLF)


class Tasks(unittest.TestCase):
    """«Перевір себе»"""

    def test_t1_append_twice(self):
        code = '''
            with open("log.txt", "a", encoding="utf-8") as f:
                f.write("старт\\n")
        '''
        _, files, _ = run(code + code)
        self.assertEqual(files["log.txt"], "старт\nстарт\n")

    def test_t2_w_then_read(self):
        out, _, _ = run('''
            with open("a.txt", "w", encoding="utf-8") as f:
                f.write("раз")
                f.write("два")
            with open("a.txt", encoding="utf-8") as f:
                print(f.read())
        ''')
        self.assertEqual(out, "раздва\n")

    def test_t3_second_read(self):
        out, _, _ = run('''
            with open("names.txt", encoding="utf-8") as f:
                print(len(f.read()))
                print(len(f.read()))
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "15\n0\n")

    def test_t4_split(self):
        out, _, _ = run('''print(len('"Коваль, Ніна",9-Б,12'.split(",")))''')
        self.assertEqual(out, "4\n")

    def test_t5_w_on_missing(self):
        _, files, _ = run('''
            with open("new.txt", "w", encoding="utf-8") as f:
                pass
        ''')
        self.assertEqual(files["new.txt"], "")

    def test_t6_in_with_newlines(self):
        out, _, _ = run('''
            with open("names.txt", encoding="utf-8") as f:
                names = f.readlines()
            print("Оля" in names)
        ''', {"names.txt": NAMES})
        self.assertEqual(out, "False\n")


if __name__ == "__main__":
    unittest.main(verbosity=2)
