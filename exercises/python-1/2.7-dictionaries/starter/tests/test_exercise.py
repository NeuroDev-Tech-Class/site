# tests/test_exercise.py

import importlib
import sys
import builtins
from types import ModuleType
from typing import List, Optional

MODULE_NAME = "exercise"


# ----------------- Helpers -----------------

def _reimport_with_inputs(monkeypatch, inputs: Optional[List[str]] = None) -> ModuleType:
    """
    Re-import the student's module. If they call main() at import time,
    we can feed a minimal input script here so import doesn't hang.
    """
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    if inputs is not None:
        it = iter(inputs)
        monkeypatch.setattr(builtins, "input", lambda _prompt=None: next(it))
    return importlib.import_module(MODULE_NAME)


def _get_attr(module: ModuleType, name: str):
    obj = getattr(module, name, None)
    assert obj is not None, f"{name} must be defined in {MODULE_NAME}.py"
    return obj


# ----------------- Tests: romanToInt -----------------

def test_function_exists_and_signature(monkeypatch):
    # If main() is called at import-time, quit immediately
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    romanToInt = _get_attr(module, "romanToInt")
    assert callable(romanToInt), "romanToInt must be callable"
    # Signature: must accept exactly 1 positional arg (not enforced strictly here, but we call with 1)


def test_single_symbols(monkeypatch):
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    romanToInt = _get_attr(module, "romanToInt")
    assert romanToInt("I") == 1
    assert romanToInt("V") == 5
    assert romanToInt("X") == 10
    assert romanToInt("L") == 50
    assert romanToInt("C") == 100
    assert romanToInt("D") == 500
    assert romanToInt("M") == 1000


def test_additive_cases(monkeypatch):
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    romanToInt = _get_attr(module, "romanToInt")
    assert romanToInt("III") == 3
    assert romanToInt("VIII") == 8
    assert romanToInt("LXVI") == 66
    assert romanToInt("MMXXV") == 2025


def test_subtractive_pairs(monkeypatch):
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    romanToInt = _get_attr(module, "romanToInt")
    # Classical subtractive combos
    assert romanToInt("IV") == 4
    assert romanToInt("IX") == 9
    assert romanToInt("XL") == 40
    assert romanToInt("XC") == 90
    assert romanToInt("CD") == 400
    assert romanToInt("CM") == 900


def test_mixed_examples(monkeypatch):
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    romanToInt = _get_attr(module, "romanToInt")
    assert romanToInt("LVIII") == 58            # 50 + 5 + 3
    assert romanToInt("MCMXCIV") == 1994        # 1000 + (900) + (90) + (4)


def test_lowercase_is_ok_via_main_only(monkeypatch, capsys):
    """
    The spec says main() should .upper() user input. So romanToInt()
    can assume uppercase; we verify that main() handles lowercase input.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["xiv", "q"])
    main = _get_attr(module, "main")
    assert callable(main)
    ret = main()  # should convert 'xiv' -> 14, then quit on 'q'
    out = capsys.readouterr().out
    assert "14" in out, "main() should print 14 for 'xiv'"
    # Return value from main may be None or a string — both acceptable
    assert ret is None or isinstance(ret, str)


def test_empty_string_behavior(monkeypatch):
    """
    For an empty string, we accept either:
      - result == 0, or
      - raising a ValueError (or KeyError).
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    romanToInt = _get_attr(module, "romanToInt")
    try:
        val = romanToInt("")
    except (ValueError, KeyError):
        # Accept raising for invalid input
        return
    else:
        assert val == 0, "Empty input may return 0, or raise ValueError/KeyError."


def test_invalid_characters_raise(monkeypatch):
    """
    romanToInt() itself should raise on invalid characters (e.g. 'A'),
    since input validation is handled by main()'s try/except.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    romanToInt = _get_attr(module, "romanToInt")
    raised = False
    try:
        _ = romanToInt("AB")
    except Exception:
        raised = True
    assert raised, "romanToInt should raise on invalid characters"


# ----------------- Tests: main() loop & messaging -----------------

def test_main_quit_message(monkeypatch, capsys):
    module = _reimport_with_inputs(monkeypatch, inputs=["q"])
    main = _get_attr(module, "main")
    main()
    out = capsys.readouterr().out.lower()
    # Should indicate quitting/exiting
    assert "q" in out or "exit" in out or "quit" in out


def test_main_handles_invalid_then_valid_then_quit(monkeypatch, capsys):
    """
    Feed an invalid numeral, expect an error message, then a valid one,
    then quit. main() should keep looping appropriately.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["notroman", "XLII", "Q"])
    main = _get_attr(module, "main")
    main()
    out = capsys.readouterr().out.lower()
    # Error message should appear
    assert "valid" in out or "invalid" in out or "error" in out
    # 42 should appear after valid input
    assert "42" in out


def test_reimport_safe(monkeypatch):
    # Ensure import side effects are safe on multiple imports
    _ = _reimport_with_inputs(monkeypatch, inputs=["q"])
    _ = _reimport_with_inputs(monkeypatch, inputs=["q"])


# Keep pytest import at end for consistency with earlier suites
import pytest  # noqa: E402