# tests/test_exercise.py

import importlib
import sys
from typing import List, Tuple, Optional
from types import ModuleType
import builtins

MODULE_NAME = "exercise"
FUNC_NAME = "findLargestZCoord"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_func(module: ModuleType):
    func = getattr(module, FUNC_NAME, None)
    assert callable(func), f"{FUNC_NAME}() must be defined and callable in {MODULE_NAME}.py"
    return func


# ---------------- Tests ----------------

def test_function_exists_and_callable():
    module = _reimport_module()
    func = _get_func(module)
    assert callable(func)


def test_basic_example_matches_prompt(capsys):
    """Example from the prompt should return (10, 10, 12)."""
    module = _reimport_module()
    func = _get_func(module)

    coords = [(1, 2, 1), (10, 10, 12), (5, 15, 6), (7, 18, 9)]
    result = func(coords)

    # Ensure returned type and content
    assert isinstance(result, tuple), "Function should return a tuple."
    assert result == (10, 10, 12), f"Expected (10, 10, 12), got {result!r}"

    # If the student also prints, that's fine; we just ignore output
    _ = capsys.readouterr()


def test_negative_and_mixed_values():
    """Handles negative z and mixed values correctly."""
    module = _reimport_module()
    func = _get_func(module)

    coords = [(-1, -2, -3), (0, 0, 0), (4, -5, -1), (2, 2, 1)]
    # Largest z is 1 at (2, 2, 1)
    assert func(coords) == (2, 2, 1)


def test_tie_breaker_returns_first_encountered():
    """If multiple tuples share the same max z, the first should be returned."""
    module = _reimport_module()
    func = _get_func(module)

    coords = [(1, 1, 5), (9, 9, 5), (2, 2, 4)]
    assert func(coords) == (1, 1, 5), "On ties, return the first tuple with the max z."


def test_does_not_mutate_input():
    """The input list should not be modified by the function."""
    module = _reimport_module()
    func = _get_func(module)

    coords = [(0, 0, 0), (3, 3, 3), (2, 2, 2)]
    snapshot = list(coords)  # shallow copy
    _ = func(coords)
    assert coords == snapshot, "Input list must not be mutated."


def test_return_is_3_tuple_of_numbers():
    """Ensure return value structure is (x, y, z) of numeric types."""
    module = _reimport_module()
    func = _get_func(module)

    coords = [(1.5, 2.25, 0.5), (9.0, 1.0, 7.0)]
    result = func(coords)
    assert isinstance(result, tuple), "Return must be a tuple."
    assert len(result) == 3, "Return tuple must have three elements."
    x, y, z = result
    for v in (x, y, z):
        assert isinstance(v, (int, float)), "Tuple elements should be numeric."


def test_empty_input_returns_none_or_raises_valueerror():
    """
    For an empty list:
      - either return None, OR
      - raise ValueError.
    Both behaviors are accepted to keep the assignment simple.
    """
    module = _reimport_module()
    func = _get_func(module)

    empty: List[Tuple[float, float, float]] = []
    try:
        ret = func(empty)
    except ValueError:
        # Accept raising ValueError
        return
    else:
        # Or accept returning None
        assert ret is None, "On empty input, return None or raise ValueError."


def test_reimport_safe():
    """Re-importing should not crash, even if module prints example output."""
    _reimport_module()
    _reimport_module()


# Keep pytest import at end to avoid lint noise on some setups
import pytest  # noqa: E402