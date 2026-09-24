# tests/test_exercise.py

import importlib
import sys
import builtins
import re
from types import ModuleType
from typing import List, Tuple

MODULE_NAME = "exercise"
FUNC_NAME = "tempConversion"


def _set_inputs(monkeypatch, inputs: List[str]) -> None:
    it = iter(inputs)
    monkeypatch.setattr(builtins, "input", lambda _prompt=None: next(it))


def _reimport_with_inputs(monkeypatch, inputs: List[str]) -> ModuleType:
    """
    Re-import the student's module, providing inputs in case
    they call tempConversion() at import time.
    """
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    _set_inputs(monkeypatch, inputs)
    return importlib.import_module(MODULE_NAME)


def _extract_first_float(text: str) -> float:
    m = re.search(r"[-+]?\d+(?:\.\d+)?", text)
    if not m:
        raise AssertionError(f"No numeric value found in: {text!r}")
    return float(m.group(0))


def _call_func_with_inputs(monkeypatch, module: ModuleType, inputs: List[str]) -> Tuple[str, str]:
    """
    Call tempConversion() while feeding inputs; return (stdout, return_str).
    """
    func = getattr(module, FUNC_NAME, None)
    assert callable(func), f"{FUNC_NAME}() must be defined and callable in {MODULE_NAME}.py"

    _set_inputs(monkeypatch, inputs)

    # Capture stdout via print() output
    # Using pytest's capsys is cleaner, but we want a reusable helper here,
    # so we'll rely on the test to capture via capsys where needed.
    # Instead, just call the function and let tests use capsys to read output.
    ret = func()
    # The tests will fetch stdout via capsys.readouterr().out
    return "", ret if ret is not None else ""


# ---------- Tests ----------

def test_menu_is_displayed(monkeypatch, capsys):
    """
    Ensure the menu text is shown to the user.
    We provide a minimal input set so the function can proceed.
    """
    # Protect against import-time execution by giving one input there.
    module = _reimport_with_inputs(monkeypatch, inputs=["3"])

    # Now call the function with a valid path to ensure normal flow.
    # Choice "1", then a dummy temperature.
    _set_inputs(monkeypatch, ["1", "32"])
    ret = getattr(module, FUNC_NAME)()

    captured = capsys.readouterr().out
    # Check key menu lines (flexible on spacing/line breaks).
    assert "Temperature Converter" in captured
    assert "Enter 1 to convert Fahrenheit to Celsius" in captured
    assert "Enter 2 to convert Celsius to Fahrenheit" in captured
    # Return value must be a string per assignment instructions
    assert isinstance(ret, str)


def test_f_to_c_examples(monkeypatch, capsys):
    """
    Test Fahrenheit to Celsius conversions (choice '1').
    32F -> 0C, 212F -> 100C
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["3"])

    # 32 F -> 0 C
    _set_inputs(monkeypatch, ["1", "32"])
    ret1 = getattr(module, FUNC_NAME)()
    out1 = capsys.readouterr().out

    printed_val1 = _extract_first_float(out1)
    returned_val1 = _extract_first_float(ret1)
    assert printed_val1 == pytest.approx(0.0, abs=1e-6)
    assert returned_val1 == pytest.approx(0.0, abs=1e-6)

    # 212 F -> 100 C
    _set_inputs(monkeypatch, ["1", "212"])
    ret2 = getattr(module, FUNC_NAME)()
    out2 = capsys.readouterr().out

    printed_val2 = _extract_first_float(out2)
    returned_val2 = _extract_first_float(ret2)
    assert printed_val2 == pytest.approx(100.0, abs=1e-6)
    assert returned_val2 == pytest.approx(100.0, abs=1e-6)


def test_c_to_f_examples(monkeypatch, capsys):
    """
    Test Celsius to Fahrenheit conversions (choice '2').
    0C -> 32F, 100C -> 212F
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["3"])

    # 0 C -> 32 F
    _set_inputs(monkeypatch, ["2", "0"])
    ret1 = getattr(module, FUNC_NAME)()
    out1 = capsys.readouterr().out

    printed_val1 = _extract_first_float(out1)
    returned_val1 = _extract_first_float(ret1)
    assert printed_val1 == pytest.approx(32.0, abs=1e-6)
    assert returned_val1 == pytest.approx(32.0, abs=1e-6)

    # 100 C -> 212 F
    _set_inputs(monkeypatch, ["2", "100"])
    ret2 = getattr(module, FUNC_NAME)()
    out2 = capsys.readouterr().out

    printed_val2 = _extract_first_float(out2)
    returned_val2 = _extract_first_float(ret2)
    assert printed_val2 == pytest.approx(212.0, abs=1e-6)
    assert returned_val2 == pytest.approx(212.0, abs=1e-6)


def test_invalid_input_branch(monkeypatch, capsys):
    """
    Any choice other than '1' or '2' should yield an 'Invalid input' message,
    both printed and returned as a string.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["1", "32"])  # satisfy any import-time call

    _set_inputs(monkeypatch, ["x"])  # invalid choice
    ret = getattr(module, FUNC_NAME)()
    out = capsys.readouterr().out

    # Case-insensitive check for "Invalid input. Please enter 1 or 2."
    assert "invalid" in out.lower()
    assert "1" in out and "2" in out
    assert isinstance(ret, str)
    assert "invalid" in ret.lower()
    assert "1" in ret and "2" in ret


def test_return_is_string_and_matches_output(monkeypatch, capsys):
    """
    Ensure the function returns a string containing the same numeric result it prints.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["2", "0"])  # harmless import-time run

    _set_inputs(monkeypatch, ["1", "98.6"])  # 98.6 F -> ~37 C
    ret = getattr(module, FUNC_NAME)()
    out = capsys.readouterr().out

    assert isinstance(ret, str)
    printed_val = _extract_first_float(out)
    returned_val = _extract_first_float(ret)
    assert printed_val == pytest.approx(returned_val, abs=1e-6)


# pytest import at top of file to avoid forward reference issues
import pytest