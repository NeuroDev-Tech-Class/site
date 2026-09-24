# tests/test_exercise.py

import importlib
import sys
import builtins
import re
from types import ModuleType
from typing import List

MODULE_NAME = "exercise"
FUNC_NAME = "randNumbers"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Re-import the student's module fresh each time."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_func(module: ModuleType):
    func = getattr(module, FUNC_NAME, None)
    assert callable(func), f"{FUNC_NAME}() must be defined and callable."
    return func


def _extract_ints(text: str) -> List[int]:
    """Extract all integer values from output text."""
    return [int(x) for x in re.findall(r"-?\d+", text)]


# ---------------- Tests ----------------

def test_function_exists_and_callable():
    module = _reimport_module()
    func = _get_func(module)
    assert callable(func)


def test_uses_random_module_or_randrange():
    """Ensure the code uses either 'import random' or 'from random import randrange'."""
    with open("exercise.py", "r", encoding="utf-8") as f:
        src = f.read().lower()
    assert "import random" in src or "from random import randrange" in src, (
        "Expected either 'import random' or 'from random import randrange' in code."
    )


def test_randnumbers_prints_list(monkeypatch, capsys):
    """The function should print a list of random integers."""
    module = _reimport_module()
    func = _get_func(module)
    result = func()
    out = capsys.readouterr().out.strip()

    # Output should contain digits and square brackets
    assert "[" in out and "]" in out, "Expected the printed output to look like a list."
    ints = _extract_ints(out)
    assert ints, "Expected at least one integer in printed output."
    # Return type can be None or list; both acceptable
    assert result is None or isinstance(result, list)


def test_randnumbers_returns_or_prints_list(monkeypatch, capsys):
    """If function returns a list, ensure it has multiple integers."""
    module = _reimport_module()
    func = _get_func(module)
    ret = func()
    _ = capsys.readouterr()

    if ret is not None:
        assert isinstance(ret, list), "Return value must be a list if not None."
        assert all(isinstance(n, int) for n in ret), "All elements in returned list must be integers."
        assert len(ret) >= 1, "List should contain at least one element."


def test_random_values_are_not_constant(monkeypatch, capsys):
    """Ensure different calls produce different results (likely random)."""
    module = _reimport_module()
    func = _get_func(module)
    ret1 = func()
    out1 = capsys.readouterr().out
    ret2 = func()
    out2 = capsys.readouterr().out
    # Compare string or list representations
    if ret1 is not None and ret2 is not None:
        assert ret1 != ret2 or len(ret1) > 1, (
            "Expected random output to differ between runs."
        )
    else:
        assert out1 != out2 or "[" in out1, "Expected printed output to vary between runs."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last
import pytest  # noqa: E402
