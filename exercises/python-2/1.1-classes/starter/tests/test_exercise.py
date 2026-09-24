# tests/test_exercise.py

import importlib
import sys
from types import ModuleType

MODULE_NAME = "exercise"
CLASS_NAME = "Book"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Re-import the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_class(module: ModuleType):
    cls = getattr(module, CLASS_NAME, None)
    assert cls is not None, f"Expected class '{CLASS_NAME}' to be defined."
    assert isinstance(cls, type), f"'{CLASS_NAME}' must be a class."
    return cls


# ---------------- Tests ----------------

def test_class_definition_and_attributes():
    """Ensure Book class exists and initializes attributes properly."""
    module = _reimport_module()
    Book = _get_class(module)

    b = Book("1984", "George Orwell", 1949, "Dystopian")
    for attr in ("title", "author", "year_published", "genre"):
        assert hasattr(b, attr), f"Book object should have attribute '{attr}'."

    assert b.title == "1984"
    assert b.author == "George Orwell"
    assert b.year_published == 1949
    assert b.genre.lower() == "dystopian"


def test_display_info_returns_formatted_string():
    """display_info should return a readable formatted string with all details."""
    module = _reimport_module()
    Book = _get_class(module)

    b = Book("Dune", "Frank Herbert", 1965, "Science Fiction")
    assert hasattr(b, "display_info"), "Book should have a display_info() method."
    text = b.display_info()
    assert isinstance(text, str), "display_info() must return a string."
    for field in ("Dune", "Frank Herbert", "1965", "Science"):
        assert field in text, f"'{field}' expected in display_info() output."


def test_update_year_method_updates_attribute():
    """update_year should modify year_published attribute."""
    module = _reimport_module()
    Book = _get_class(module)

    b = Book("Test", "Author", 2000, "Genre")
    assert hasattr(b, "update_year"), "Book should have update_year() method."
    b.update_year(2025)
    assert b.year_published == 2025, "update_year() must change year_published value."


def test_multiple_objects_created(monkeypatch, capsys):
    """Ensure at least three Book objects are instantiated in the module."""
    module = _reimport_module()
    Book = _get_class(module)

    books = [
        v for v in vars(module).values() if isinstance(v, Book)
    ]
    assert len(books) >= 3, f"Expected at least three Book objects, found {len(books)}."

    # Ensure print output contains some book info
    out = capsys.readouterr().out
    assert out, "Expected the script to print something (likely from display_info())."
    for b in books:
        assert b.title in out or b.author in out, (
            "Printed output should include book info via display_info() calls."
        )


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last
import pytest  # noqa: E402
