# tests/test_exercise.py

import importlib
import sys
import builtins
from types import ModuleType
from typing import List
import re

MODULE_NAME = "exercise"
FUNC_NAME = "myList"


# ----------------- Helpers -----------------

def _set_inputs(monkeypatch, inputs: List[str]) -> None:
    it = iter(inputs)
    monkeypatch.setattr(builtins, "input", lambda _prompt=None: next(it))


def _reimport_with_inputs(monkeypatch, inputs: List[str] = None) -> ModuleType:
    """Re-import the student's module, optionally feeding inputs."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    if inputs:
        _set_inputs(monkeypatch, inputs)
    return importlib.import_module(MODULE_NAME)


def _get_func(module: ModuleType):
    func = getattr(module, FUNC_NAME, None)
    assert callable(func), f"{FUNC_NAME}() must be defined and callable"
    return func


def _extract_ints(text: str) -> List[int]:
    """Extract all integers from the text output."""
    return [int(x) for x in re.findall(r"-?\d+", text)]


# ----------------- Tests -----------------

def test_function_exists(monkeypatch):
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "0", "0", "0"])
    func = _get_func(module)
    assert callable(func)


def test_sum_max_min_correct(monkeypatch, capsys):
    """
    Provide 5 numbers and check that the sum, max, and min are correct
    in both printed output and returned list.
    """
    nums = ["5", "10", "3", "8", "2"]
    module = _reimport_with_inputs(monkeypatch, inputs=nums)
    func = _get_func(module)

    ret = func()
    out = capsys.readouterr().out

    # Extract numbers printed
    printed_nums = _extract_ints(out)
    assert printed_nums, "Expected numeric values printed in output."

    # Expected results
    total = 5 + 10 + 3 + 8 + 2
    largest = 10
    smallest = 2

    # Verify printed values contain all expected numbers
    assert str(total) in out, f"Expected sum {total} printed."
    assert str(largest) in out, f"Expected max {largest} printed."
    assert str(smallest) in out, f"Expected min {smallest} printed."

    # Verify return value
    assert isinstance(ret, list), "Function must return a list."
    assert len(ret) == 3, "Returned list should contain three elements (sum, max, min)."
    assert all(isinstance(x, (int, float)) for x in ret), "All return values must be numeric."
    assert ret[0] == total, f"First returned value should be the sum ({total})."
    assert ret[1] == largest, f"Second returned value should be the max ({largest})."
    assert ret[2] == smallest, f"Third returned value should be the min ({smallest})."


def test_handles_negative_numbers(monkeypatch, capsys):
    """Ensure negatives are processed correctly."""
    nums = ["-2", "0", "5", "-10", "7"]
    module = _reimport_with_inputs(monkeypatch, inputs=nums)
    func = _get_func(module)

    ret = func()
    out = capsys.readouterr().out

    total = -2 + 0 + 5 + -10 + 7
    largest = 7
    smallest = -10

    assert str(total) in out
    assert str(largest) in out
    assert str(smallest) in out

    assert isinstance(ret, list)
    assert ret == [total, largest, smallest]


def test_prompts_five_times(monkeypatch, capsys):
    """
    Ensure the function prompts the user exactly five times.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["1", "2", "3", "4", "5"])
    func = _get_func(module)

    prompt_count = {"count": 0}

    def fake_input(prompt=None):
        prompt_count["count"] += 1
        return str(prompt_count["count"])

    monkeypatch.setattr(builtins, "input", fake_input)
    func()
    _ = capsys.readouterr().out

    assert prompt_count["count"] == 5, f"Expected 5 prompts, got {prompt_count['count']}"


def test_return_type_and_order(monkeypatch):
    """Ensure return order is [sum, max, min]."""
    nums = ["1", "2", "3", "4", "5"]
    module = _reimport_with_inputs(monkeypatch, inputs=nums)
    func = _get_func(module)
    ret = func()
    assert isinstance(ret, list)
    assert ret[0] == sum([1, 2, 3, 4, 5])
    assert ret[1] == 5
    assert ret[2] == 1


def test_reimport_safe(monkeypatch):
    """Ensure multiple imports don't crash."""
    _reimport_with_inputs(monkeypatch, inputs=["1", "2", "3", "4", "5"])
    _reimport_with_inputs(monkeypatch, inputs=["1", "2", "3", "4", "5"])


# pytest import at end for consistency
import pytest  # noqa: E402