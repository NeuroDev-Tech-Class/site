# tests/test_exercise.py

import importlib
import sys
import builtins
from types import ModuleType
import re

MODULE_NAME = "exercise"


# ----------------- Helpers -----------------

def _reimport_module() -> ModuleType:
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


# ----------------- Tests -----------------

def test_variables_exist_and_types(monkeypatch):
    """
    Ensure that myBudget, itemCost, and leftoverChange exist and have proper types.
    """
    module = _reimport_module()

    # Existence
    assert hasattr(module, "myBudget"), "Expected variable 'myBudget' to be defined."
    assert hasattr(module, "itemCost"), "Expected variable 'itemCost' to be defined."
    assert hasattr(module, "leftoverChange"), "Expected variable 'leftoverChange' to be defined."

    myBudget = getattr(module, "myBudget")
    itemCost = getattr(module, "itemCost")
    leftoverChange = getattr(module, "leftoverChange")

    # Type checks
    assert isinstance(myBudget, int), f"'myBudget' should be an integer, got {type(myBudget).__name__}"
    assert isinstance(itemCost, float), f"'itemCost' should be a float, got {type(itemCost).__name__}"
    assert isinstance(leftoverChange, (int, float)), "'leftoverChange' should be numeric (int or float)."


def test_leftoverChange_correct(monkeypatch):
    """
    leftoverChange should equal myBudget - itemCost (within a small tolerance for floats).
    """
    module = _reimport_module()
    myBudget = module.myBudget
    itemCost = module.itemCost
    leftoverChange = module.leftoverChange

    expected = myBudget - itemCost
    assert abs(leftoverChange - expected) < 1e-9, (
        f"Expected leftoverChange = myBudget - itemCost ({expected}), got {leftoverChange}"
    )


def test_prints_leftoverChange(monkeypatch, capsys):
    """
    The program should print the leftoverChange value.
    """
    module = _reimport_module()
    out = capsys.readouterr().out.strip()

    assert out, "Expected the program to print something."
    # It should contain the numeric value of leftoverChange (allow for formatting differences)
    value_str = str(module.leftoverChange)
    assert value_str in out, f"Expected printed output to include leftoverChange value ({value_str})."


def test_reimport_safe():
    """Re-importing should not crash or require input."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
