# tests/test_exercise.py

import importlib
import sys
import builtins
import re
from types import ModuleType
from typing import List

MODULE_NAME = "exercise"
FUNC_NAME = "fizzBuzz"


def _reimport_module(monkeypatch, inputs=None):
    """Safely re-import student module to handle import-time calls."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    if inputs:
        it = iter(inputs)
        monkeypatch.setattr(builtins, "input", lambda _prompt=None: next(it))
    return importlib.import_module(MODULE_NAME)


def _get_func(module: ModuleType):
    func = getattr(module, FUNC_NAME, None)
    assert callable(func), f"{FUNC_NAME}() must be defined and callable"
    return func


def _extract_lines(output: str):
    """Return non-empty stripped output lines."""
    return [line.strip() for line in output.splitlines() if line.strip()]


# ---------------- TESTS ----------------

def test_function_exists(monkeypatch):
    module = _reimport_module(monkeypatch)
    func = getattr(module, FUNC_NAME, None)
    assert callable(func), f"{FUNC_NAME}() must be defined and callable."


def test_correct_output(monkeypatch, capsys):
    """
    Runs fizzBuzz() and verifies:
      - It prints 100 lines
      - Correct 'Fizz', 'Buzz', 'FizzBuzz' replacements
    """
    module = _reimport_module(monkeypatch)
    func = _get_func(module)

    result = func()
    out = capsys.readouterr().out
    lines = _extract_lines(out)

    # Should print 100 lines
    assert len(lines) == 100, f"Expected 100 lines, got {len(lines)}."

    for i, line in enumerate(lines, start=1):
        expected = None
        if i % 15 == 0:
            expected = "FizzBuzz"
        elif i % 3 == 0:
            expected = "Fizz"
        elif i % 5 == 0:
            expected = "Buzz"
        else:
            expected = str(i)

        assert line == expected, f"Line {i}: expected {expected!r}, got {line!r}."

    # Should return None or an empty string — output happens via print
    assert result is None or result == "", "Function should return None or empty string."


def test_includes_fizzbuzz_patterns(monkeypatch, capsys):
    """Ensure both Fizz and Buzz patterns appear at least once."""
    module = _reimport_module(monkeypatch)
    func = _get_func(module)
    func()
    out = capsys.readouterr().out.lower()

    assert "fizz" in out, "Output must include the word 'Fizz'."
    assert "buzz" in out, "Output must include the word 'Buzz'."


def test_output_formatting(monkeypatch, capsys):
    """Ensure each result is printed on its own line (no commas or lists)."""
    module = _reimport_module(monkeypatch)
    func = _get_func(module)
    func()
    out = capsys.readouterr().out

    # No commas or brackets, and should contain line breaks
    assert "," not in out, "Output should not contain commas."
    assert "[" not in out and "]" not in out, "Output should not look like a list."
    assert "\n" in out, "Output should have newlines between entries."


def test_reimport_safe(monkeypatch):
    """Verify that re-importing the module doesn’t raise exceptions."""
    _reimport_module(monkeypatch)
    _reimport_module(monkeypatch)


# pytest import for this pattern
import pytest  # noqa: E402