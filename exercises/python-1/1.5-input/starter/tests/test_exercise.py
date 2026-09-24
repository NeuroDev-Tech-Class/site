# tests/test_exercise.py

import importlib
import sys
import builtins
from types import ModuleType
import re

MODULE_NAME = "exercise"


# ---------------- Helpers ----------------

def _reimport_with_inputs(monkeypatch, inputs):
    """Re-import the student's module feeding specified inputs."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    it = iter(inputs)
    monkeypatch.setattr(builtins, "input", lambda _prompt=None: next(it))
    return importlib.import_module(MODULE_NAME)


def _extract_floats(text: str):
    """Extract all floating-point or integer numbers from a string."""
    return [float(x) for x in re.findall(r"-?\d+(?:\.\d+)?", text)]


# ---------------- Tests ----------------

def test_import_runs(monkeypatch):
    """Import should not hang; simulate one input."""
    module = _reimport_with_inputs(monkeypatch, inputs=["0"])
    assert module is not None


def test_converts_0c_to_32f(monkeypatch, capsys):
    """0°C should convert to 32°F."""
    module = _reimport_with_inputs(monkeypatch, inputs=["0"])
    out = capsys.readouterr().out
    nums = _extract_floats(out)
    # Expect approximately 32 in printed output
    assert any(abs(n - 32.0) < 1e-6 for n in nums), f"Expected 32.0°F, got {nums}"


def test_converts_100c_to_212f(monkeypatch, capsys):
    """100°C should convert to 212°F."""
    module = _reimport_with_inputs(monkeypatch, inputs=["100"])
    out = capsys.readouterr().out
    nums = _extract_floats(out)
    assert any(abs(n - 212.0) < 1e-6 for n in nums), f"Expected 212.0°F, got {nums}"


def test_converts_negative(monkeypatch, capsys):
    """-40°C should convert to -40°F (same temp in both scales)."""
    module = _reimport_with_inputs(monkeypatch, inputs=["-40"])
    out = capsys.readouterr().out
    nums = _extract_floats(out)
    assert any(abs(n - (-40.0)) < 1e-6 for n in nums), f"Expected -40.0°F, got {nums}"


def test_uses_input_and_float(monkeypatch):
    """Ensure the student uses input() and float() conversion."""
    import ast, io, os
    with open("exercise.py", "r", encoding="utf-8") as f:
        source = f.read()
    tree = ast.parse(source)
    src_lower = source.lower()
    assert "input" in src_lower, "Expected use of input() for user entry."
    assert "float" in src_lower, "Expected conversion to float()."


def test_prints_output(monkeypatch, capsys):
    """Ensure program prints the Fahrenheit result."""
    module = _reimport_with_inputs(monkeypatch, inputs=["20"])
    out = capsys.readouterr().out.strip()
    assert out, "Expected program to print the converted temperature."
    nums = _extract_floats(out)
    expected = (20 * 9 / 5) + 32
    assert any(abs(n - expected) < 1e-6 for n in nums), f"Expected printed value ≈ {expected}, got {nums}"


def test_reimport_safe(monkeypatch):
    """Re-importing should not crash."""
    _ = _reimport_with_inputs(monkeypatch, inputs=["0"])
    _ = _reimport_with_inputs(monkeypatch, inputs=["0"])


# Keep pytest import last
import pytest  # noqa: E402
