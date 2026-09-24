# tests/test_exercise.py

import importlib
import sys
import builtins
from types import ModuleType
import re
from typing import Optional

MODULE_NAME = "exercise"

# --------------- Helpers ---------------

def _reimport_module() -> ModuleType:
    """Re-import the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _maybe_call_print_func(module: ModuleType, capsys) -> None:
    """
    If the student provided a function to do the printing, call it to
    generate output; otherwise, rely on import-time prints.
    We support common names: printBasics, print_basics, main.
    """
    for name in ("printBasics", "print_basics", "main"):
        fn = getattr(module, name, None)
        if callable(fn):
            # Call once; ignore return
            fn()
            _ = capsys.readouterr()  # clear any prior output from the call
            break  # Found a callable; done


def _collect_output(module: ModuleType, capsys) -> str:
    """
    Collect the output after possibly invoking a print function.
    """
    out = capsys.readouterr().out
    return out


def _is_int_line(s: str) -> bool:
    s = s.strip()
    if s in ("True", "False"):
        return False
    # Must be an integer with optional leading sign, no decimal point
    return bool(re.fullmatch(r"[+-]?\d+", s))


def _is_float_line(s: str) -> bool:
    s = s.strip()
    if s in ("True", "False"):
        return False
    # Accept typical float representations (with decimal or scientific notation)
    if "." in s or "e" in s.lower():
        try:
            float(s)
            return True
        except ValueError:
            return False
    return False


def _is_bool_line(s: str) -> bool:
    return s.strip() in ("True", "False")


def _is_string_line(s: str) -> bool:
    """
    A 'string line' here means a non-empty line that is neither a pure
    integer, nor a float, nor a boolean literal.
    """
    s = s.strip()
    if not s:
        return False
    if _is_int_line(s) or _is_float_line(s) or _is_bool_line(s):
        return False
    return True


# --------------- Tests ---------------

def test_import_runs_without_input(monkeypatch):
    """
    Importing the module should not try to read input.
    If the student calls input(), this test will fail.
    """
    def _no_input(_prompt=None):
        raise AssertionError("Program should not call input() for this assignment.")
    monkeypatch.setattr(builtins, "input", _no_input)

    _ = _reimport_module()  # should not raise


def test_prints_four_types(monkeypatch, capsys):
    """
    The program should print at least one integer, one float, one string, and one boolean.
    We accept any order and additional harmless prints; we only require that all four
    categories appear at least once.
    """
    module = _reimport_module()

    # If a function exists to perform printing, call it; otherwise rely on import-time prints.
    _maybe_call_print_func(module, capsys)

    out = _collect_output(module, capsys)
    lines = [ln for ln in (ln.strip() for ln in out.splitlines()) if ln != ""]

    assert lines, "Expected the program to print something."

    has_int = any(_is_int_line(ln) for ln in lines)
    has_float = any(_is_float_line(ln) for ln in lines)
    has_bool = any(_is_bool_line(ln) for ln in lines)
    has_str = any(_is_string_line(ln) for ln in lines)

    assert has_int, "Expected at least one integer to be printed."
    assert has_float, "Expected at least one float to be printed."
    assert has_bool, "Expected at least one boolean (True/False) to be printed."
    assert has_str, "Expected at least one string to be printed."


def test_optional_print_function_callable():
    """
    If the student provided a function (printBasics/print_basics/main),
    ensure it is callable. If none exist, that's okay.
    """
    module = _reimport_module()
    funcs = [getattr(module, n, None) for n in ("printBasics", "print_basics", "main")]
    callables = [f for f in funcs if callable(f)]
    if callables:
        assert callable(callables[0]), "Provided print function must be callable."


def test_reimport_safe(capsys):
    """
    Re-importing should not crash; ignore any repeated prints.
    """
    _ = _reimport_module()
    _ = capsys.readouterr()
    _ = _reimport_module()
    _ = capsys.readouterr()


# Keep pytest import last for consistency with your other suites
import pytest  # noqa: E402
