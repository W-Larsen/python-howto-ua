"""Тести Python-обв'язки сторінки Touch The Globe (globe/web_runner.py).

Знімок проєкту (globe/touch-the-globe.zip) розпаковується в тимчасову
папку - так само, як це робить Pyodide у браузері.
Запуск з кореня репозиторію: python3 -m unittest tests/test_globe_runner.py -v
"""
import pathlib
import unittest
import zipfile

SITE = pathlib.Path(__file__).resolve().parent.parent
ZIP = SITE / "globe" / "touch-the-globe.zip"


class Snapshot(unittest.TestCase):
    def test_zip_has_core_and_no_secrets(self):
        names = zipfile.ZipFile(ZIP).namelist()
        self.assertIn("Touch_The_Globe/globe_core/engine.py", names)
        self.assertIn("Touch_The_Globe/students/task1.py", names)
        self.assertNotIn("Touch_The_Globe/.env", names)
        self.assertFalse([n for n in names if "fixtures/solutions" in n])


if __name__ == "__main__":
    unittest.main()
