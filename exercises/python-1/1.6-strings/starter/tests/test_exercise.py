# tests/test_exercise.py

import importlib
import sys
import builtins
from types import ModuleType

MODULE_NAME = "exercise"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Reload the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


# ---------------- Tests ----------------

def test_variables_exist_and_types():
    """Ensure that myName and age are defined with correct types."""
    module = _reimport_module()

    assert hasattr(module, "myName"), "Expected variable 'myName' to be defined."
    assert hasattr(module, "age"), "Expected variable 'age' to be defined."

    myName = getattr(module, "myName")
    age = getattr(module, "age")

    assert isinstance(myName, str), f"'myName' should be a string, got {type(myName).__name__}"
    assert isinstance(age, int), f"'age' should be an integer, got {type(age).__name__}"


def test_prints_full_sentence(monkeypatch, capsys):
    """
    The program should print a formatted sentence including both
    the name and age, like:
      "My name is <name>, and I am <age> years old."
    """
    module = _reimport_module()
    out = capsys.readouterr().out.strip()

    assert out, "Expected the program to print something."
    lower_out = out.lower()
    assert "my name is" in lower_out, "Output should include 'My name is'."
    assert "i am" in lower_out, "Output should include 'I am'."

    # Must contain the actual variable values
    assert str(module.myName).split()[0] in out, "Output should include the name."
    assert str(module.age) in out, "Output should include the age number."


def test_prints_first_three_letters(monkeypatch, capsys):
    """
    Ensure the student's program also prints the first 3 letters of their name
    on a separate line (by slicing).
    """
    module = _reimport_module()
    out = capsys.readouterr().out.strip().splitlines()
    myName = module.myName
    expected_slice = myName[:3]

    found = any(expected_slice in line for line in out)
    assert found, f"Expected output to include the first 3 letters of name ('{expected_slice}')."


def test_string_slicing_used():
    """Ensure string slicing syntax [:3] appears in the source code."""
    import ast
    with open("exercise.py", "r", encoding="utf-8") as f:
        source = f.read()
    tree = ast.parse(source)
    source_lower = source.lower()
    assert "[:3" in source_lower or "[: 3" in source_lower, "Expected slicing syntax [:3] in code."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
