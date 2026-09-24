# tests/test_exercise.py

import importlib
import sys
import builtins
from types import ModuleType
import re

MODULE_NAME = "exercise"


# ----------------- Helpers -----------------

def _reimport_module() -> ModuleType:
    """Reload the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _extract_numbers_from_output(out: str):
    """Return all numeric values (ints/floats) found in the output."""
    return [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", out)]


# ----------------- Tests -----------------

def test_two_integers_exist(monkeypatch):
    """
    The file should define at least two integer variables.
    We'll look for any top-level ints besides builtins.
    """
    module = _reimport_module()
    int_vars = [v for v in vars(module).values() if isinstance(v, int)]
    assert len(int_vars) >= 2, "Expected at least two integer variables defined."


def test_prints_five_operations(monkeypatch, capsys):
    """
    The program should print 5 numeric results:
      sum, difference, product, quotient, and power.
    """
    module = _reimport_module()
    out = capsys.readouterr().out.strip()
    assert out, "Expected the program to print something."

    nums = _extract_numbers_from_output(out)
    assert len(nums) >= 5, f"Expected at least 5 numeric results printed, got {len(nums)}."
    # We can't assert exact order or values since variable names and numbers are arbitrary,
    # but all results should be numeric.
    for n in nums:
        assert isinstance(n, float), "Printed results should be numeric."


def test_operations_correct(monkeypatch, capsys):
    """
    Verify that all five operations are correctly computed
    using the two integer variables in the file.
    """
    module = _reimport_module()
    out = capsys.readouterr().out.strip()

    # find integer vars
    names = [n for n, v in vars(module).items() if isinstance(v, int)]
    assert len(names) >= 2, "Expected at least two integer variables."
    a, b = [getattr(module, names[0]), getattr(module, names[1])]

    # Compute expected values
    expected_sum = a + b
    expected_diff = a - b
    expected_prod = a * b
    expected_quot = a / b
    expected_pow = a ** b

    printed_nums = _extract_numbers_from_output(out)
    # We just confirm all expected values appear in output (approx for float)
    found_sum = any(abs(n - expected_sum) < 1e-6 for n in printed_nums)
    found_diff = any(abs(n - expected_diff) < 1e-6 for n in printed_nums)
    found_prod = any(abs(n - expected_prod) < 1e-6 for n in printed_nums)
    found_quot = any(abs(n - expected_quot) < 1e-6 for n in printed_nums)
    found_pow = any(abs(n - expected_pow) < 1e-6 for n in printed_nums)

    assert found_sum, "Expected sum value printed."
    assert found_diff, "Expected difference value printed."
    assert found_prod, "Expected product value printed."
    assert found_quot, "Expected quotient value printed."
    assert found_pow, "Expected power result printed."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
