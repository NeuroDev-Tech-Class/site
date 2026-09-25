# tests/test_exercise.py

import importlib
import sys
import builtins
import re
from types import ModuleType
from typing import List, Optional, Tuple

MODULE_NAME = "exercise"
FUNC_NAME = "calculator"


# ----------------- Helpers -----------------

def _set_inputs(monkeypatch, inputs: List[str]) -> None:
    it = iter(inputs)
    monkeypatch.setattr(builtins, "input", lambda _prompt=None: next(it))


def _reimport_with_inputs(monkeypatch, inputs: Optional[List[str]] = None) -> ModuleType:
    """
    Re-import the student's module, optionally feeding some inputs in case
    they call calculator() at import time. This keeps tests resilient.
    """
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    if inputs is not None:
        _set_inputs(monkeypatch, inputs)
    return importlib.import_module(MODULE_NAME)


def _get_func(module: ModuleType):
    func = getattr(module, FUNC_NAME, None)
    assert callable(func), f"{FUNC_NAME}() must be defined and callable in {MODULE_NAME}.py"
    return func


def _nonempty_lines(out: str) -> List[str]:
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def _last_line(out: str) -> str:
    lines = _nonempty_lines(out)
    return lines[-1] if lines else ""


def _extract_first_float(text: str) -> float:
    m = re.search(r"[-+]?\d+(?:\.\d+)?", text)
    if not m:
        raise AssertionError(f"No numeric value found in: {text!r}")
    return float(m.group(0))


def _last_result_number(out: str) -> Optional[float]:
    """
    From the captured output, find the last line containing 'Result'
    and extract its numeric value. Return None if no such line exists.
    """
    lines = _nonempty_lines(out)
    for ln in reversed(lines):
        if "result" in ln.lower():
            try:
                return _extract_first_float(ln)
            except AssertionError:
                return None
    return None


# ----------------- Tests -----------------

def test_function_exists(monkeypatch):
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])
    _get_func(module)  # asserts callable


def test_single_addition_then_quit(monkeypatch, capsys):
    """
    One full iteration (2 + 3) then quit.
    Order expected per assignment: num1, num2, operator.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])  # safe if called at import
    func = _get_func(module)

    # Iteration 1: 2 + 3
    # Iteration 2: (dummy numbers), operator 'q' to exit cleanly
    _set_inputs(monkeypatch, ["2", "3", "+", "0", "0", "q"])
    ret = func()
    out = capsys.readouterr().out

    # Validate printed result
    num = _last_result_number(out)
    assert num is not None, "Expected a printed 'Result: ...' line."
    assert num == 5 or num == 5.0

    # Function should return a string (per assignment requirement)
    assert isinstance(ret, str)
    # Usually the final return should be the last message printed.
    # Accept either the printed result line or the quit message.
    assert ("result" in ret.lower()) or ("exiting" in ret.lower())


def test_multiple_operations_then_quit(monkeypatch, capsys):
    """
    Do three operations in one run, verifying the loop:
      10 - 4 = 6
      6 * 2 = 12
      12 / 3 = 4
    then quit.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])
    func = _get_func(module)

    _set_inputs(
        monkeypatch,
        [
            "10", "4", "-",     # 6
            "6", "2", "*",      # 12
            "12", "3", "/",     # 4
            "0", "0", "q"       # quit
        ],
    )
    ret = func()
    out = capsys.readouterr().out

    # Verify that the last printed result is 4
    num = _last_result_number(out)
    assert num is not None, "Expected at least one 'Result: ...' line."
    assert num == 4 or abs(num - 4.0) < 1e-9

    assert isinstance(ret, str)
    assert ("result" in ret.lower()) or ("exiting" in ret.lower())


def test_invalid_operator_then_continue(monkeypatch, capsys):
    """
    Provide an invalid operator, expect 'Invalid operator' message,
    then perform a valid operation and quit.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])
    func = _get_func(module)

    _set_inputs(
        monkeypatch,
        [
            "5", "5", "x",    # invalid operator
            "2", "8", "+",    # valid op
            "0", "0", "q",    # quit
        ],
    )
    ret = func()
    out = capsys.readouterr().out

    # Check invalid operator message appeared
    assert "invalid" in out.lower() and "operator" in out.lower(), "Expected 'Invalid operator' message."

    # And that a valid result was later printed (2 + 8 = 10)
    num = _last_result_number(out)
    assert num is not None
    assert num == 10 or abs(num - 10.0) < 1e-9

    assert isinstance(ret, str)


def test_zero_division_handled(monkeypatch, capsys):
    """
    Division by zero should be caught and the user notified with the error name.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])
    func = _get_func(module)

    _set_inputs(
        monkeypatch,
        [
            "10", "0", "/",   # ZeroDivisionError
            "0", "0", "q",    # then quit
        ],
    )
    ret = func()
    out = capsys.readouterr().out

    assert "zerodivisionerror" in out.lower(), "Expected 'ZeroDivisionError' mentioned to the user."
    # It should continue running after the error and allow quitting
    assert isinstance(ret, str)
    assert "exiting" in ret.lower() or "result" in ret.lower()


def test_value_error_handled(monkeypatch, capsys):
    """
    Invalid numeric input should raise ValueError and be handled with a message.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])
    func = _get_func(module)

    _set_inputs(
        monkeypatch,
        [
            "ten", "2", "+",  # ValueError on 'ten'
            "0", "0", "q",    # then quit
        ],
    )
    ret = func()
    out = capsys.readouterr().out

    assert "valueerror" in out.lower(), "Expected 'ValueError' mentioned to the user."
    assert isinstance(ret, str)


def test_quit_message_and_return(monkeypatch, capsys):
    """
    When operator is 'q', the program should print 'Exiting calculator'
    (or similar) and break. The function should return that message as a string.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])
    func = _get_func(module)

    _set_inputs(monkeypatch, ["0", "0", "q"])
    ret = func()
    out = capsys.readouterr().out

    # Check printed quit message
    assert "exit" in out.lower(), "Expected an exit message to be printed."
    assert isinstance(ret, str)
    assert "exit" in ret.lower(), "Expected the function to return the exit message."


def test_returns_string_for_results(monkeypatch, capsys):
    """
    Ensure that when an operation succeeds, the function returns a string
    containing the same numeric result that was printed.
    """
    module = _reimport_with_inputs(monkeypatch, inputs=["0", "0", "q"])
    func = _get_func(module)

    _set_inputs(monkeypatch, ["7", "8", "*", "0", "0", "q"])  # 56 then quit
    ret = func()
    out = capsys.readouterr().out

    printed_num = _last_result_number(out)
    assert printed_num is not None, "Expected a printed result."
    assert isinstance(ret, str)
    # Extract a number from the returned string; it should match printed
    returned_num = _extract_first_float(ret)
    assert abs(printed_num - returned_num) < 1e-9, f"Return text should include the printed result ({printed_num})."


# Place pytest import after helpers to avoid forward ref hiccups on some setups
import pytest  # noqa: E402