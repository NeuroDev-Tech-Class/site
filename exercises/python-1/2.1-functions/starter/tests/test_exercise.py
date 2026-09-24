# test_exercise.py
# Pytest test suite for the "exercise.py" assignment.
# Checks:
#  - calculateArea exists, has correct signature, and returns correct values
#  - main() reads two inputs, converts to float, uses calculateArea, and prints the area
#  - Works whether students call main() at import time or not

import importlib
import inspect
import sys
from types import ModuleType
from typing import List

import pytest


MODULE_NAME = "exercise"


def _reimport_with_inputs(monkeypatch: pytest.MonkeyPatch, inputs: List[str]) -> ModuleType:
    seq = inputs.copy()

    def _fake_input(prompt: str = "") -> str:
        if not seq:
            # Provide a clear failure if the student's code asks for more inputs than expected
            raise AssertionError("Your program requested more inputs than provided by the test.")
        return seq.pop(0)

    monkeypatch.setattr("builtins.input", _fake_input, raising=True)

    # Ensure a fresh import each time
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _call_main_with_inputs(module: ModuleType, monkeypatch: pytest.MonkeyPatch, inputs: List[str]) -> None:
    """Call module.main() while patching input with a provided sequence."""
    seq = inputs.copy()

    def _fake_input(prompt: str = "") -> str:
        if not seq:
            raise AssertionError("Your program requested more inputs than provided by the test.")
        return seq.pop(0)

    monkeypatch.setattr("builtins.input", _fake_input, raising=True)
    module.main()


def test_calculate_area_signature_and_results(monkeypatch: pytest.MonkeyPatch):
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0"])  # satisfy potential import-time main()

    # Function exists
    assert hasattr(module, "calculateArea"), "Expected a function named calculateArea(length, width)."
    func = module.calculateArea
    assert callable(func), "calculateArea must be callable."

    # Signature: exactly two parameters (length, width)
    sig = inspect.signature(func)
    assert len(sig.parameters) == 2, "calculateArea should take exactly two parameters."

    # Correct results
    assert func(5, 10) == 50
    assert func(0, 10) == 0
    assert func(10, 0) == 0
    assert func(3.5, 2) == pytest.approx(7.0)
    assert func(2.5, 2.5) == pytest.approx(6.25)


def test_main_integration_integers(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture):
    # Re-import; if student's file calls main() on import, provide inputs for that run
    module = _reimport_with_inputs(monkeypatch, inputs=["5", "10"])
    # If they didn't call main() at import time, call it explicitly:
    # Provide a second set of inputs so this test passes either way.
    _call_main_with_inputs(module, monkeypatch, inputs=["5", "10"])

    out = capsys.readouterr().out.lower()
    # Look for the numeric result "50" somewhere in printed output
    assert "50" in out, f"Expected to see '50' in output for inputs 5 and 10. Got: {out!r}"


def test_main_integration_floats(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture):
    module = _reimport_with_inputs(monkeypatch, inputs=["3.5", "2"])
    _call_main_with_inputs(module, monkeypatch, inputs=["3.5", "2"])

    out = capsys.readouterr().out
    # Accept either '7' or '7.0' depending on student formatting, but prefer exact float string
    assert ("7.0" in out) or ("7" in out), f"Expected area 7.0 (or 7) in output. Got: {out!r}"


def test_no_crash_on_varied_spacing_and_prompts(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture):
    """
    Smoke test to ensure the program doesn't rely on specific prompt text
    and still produces correct output with typical inputs.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["12", "0.5"])
    _call_main_with_inputs(module, monkeypatch, inputs=["12", "0.5"])

    out = capsys.readouterr().out
    assert "6" in out, f"Expected area 6 in output for inputs 12 and 0.5. Got: {out!r}"
