# tests/test_exercise.py

import importlib
import sys
from types import ModuleType

MODULE_NAME = "exercise"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Re-import the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_function(module: ModuleType, name: str):
    func = getattr(module, name, None)
    assert func is not None, f"Expected function '{name}' to be defined."
    assert callable(func), f"'{name}' must be callable."
    return func


def _get_global_var(module: ModuleType, name: str):
    var = getattr(module, name, None)
    assert var is not None, f"Expected global variable '{name}' to be defined."
    return var


# ---------------- Tests for Task 1: demo_scope ----------------

def test_demo_scope_function_exists():
    """Ensure demo_scope function is defined."""
    module = _reimport_module()
    _get_function(module, "demo_scope")


def test_global_message_exists():
    """Ensure global_message is defined at module level."""
    module = _reimport_module()
    global_message = _get_global_var(module, "global_message")
    assert global_message == "I'm global", \
        f"global_message should be \"I'm global\", got \"{global_message}\"."


def test_demo_scope_prints_messages(capsys):
    """Ensure demo_scope prints both local and global messages."""
    module = _reimport_module()
    demo_scope = _get_function(module, "demo_scope")

    # Clear any previous output
    capsys.readouterr()

    demo_scope()
    out = capsys.readouterr().out.lower()

    assert "local" in out or "i'm local" in out, \
        "demo_scope() should print something about the local variable."
    assert "global" in out or "i'm global" in out, \
        "demo_scope() should print something about the global variable."


# ---------------- Tests for Task 2: increment_counter ----------------

def test_counter_variable_exists():
    """Ensure counter global variable is defined."""
    module = _reimport_module()
    counter = getattr(module, "counter", None)
    assert counter is not None, "Expected global variable 'counter' to be defined."


def test_increment_counter_function_exists():
    """Ensure increment_counter function is defined."""
    module = _reimport_module()
    _get_function(module, "increment_counter")


def test_increment_counter_modifies_global():
    """Ensure increment_counter uses global keyword to modify counter."""
    module = _reimport_module()
    increment_counter = _get_function(module, "increment_counter")

    # Get initial counter value
    initial = module.counter

    # Call increment_counter
    increment_counter()

    # Check that global counter was modified
    assert module.counter == initial + 1, \
        f"After calling increment_counter(), counter should be {initial + 1}, got {module.counter}."


def test_increment_counter_multiple_calls():
    """Ensure increment_counter works correctly when called multiple times."""
    module = _reimport_module()
    increment_counter = _get_function(module, "increment_counter")

    # Reset counter to known value
    module.counter = 0

    increment_counter()
    increment_counter()
    increment_counter()

    assert module.counter == 3, \
        f"After calling increment_counter() 3 times from 0, counter should be 3, got {module.counter}."


# ---------------- Tests for Task 3: outer_function ----------------

def test_outer_function_exists():
    """Ensure outer_function is defined."""
    module = _reimport_module()
    _get_function(module, "outer_function")


def test_outer_function_calls_inner_and_prints(capsys):
    """Ensure outer_function defines inner_function and prints from it."""
    module = _reimport_module()
    outer_function = _get_function(module, "outer_function")

    # Clear any previous output
    capsys.readouterr()

    outer_function()
    out = capsys.readouterr().out.lower()

    # Should print both outer_var and inner_var values
    assert "outer" in out, \
        "outer_function should result in printing something about outer_var."
    assert "inner" in out, \
        "outer_function should result in printing something about inner_var."


# ---------------- Tests for Task 4: shadow_demo ----------------

def test_name_global_variable_exists():
    """Ensure 'name' global variable is defined."""
    module = _reimport_module()
    name = _get_global_var(module, "name")
    assert name == "Global", f"Global 'name' should be 'Global', got '{name}'."


def test_shadow_demo_function_exists():
    """Ensure shadow_demo function is defined."""
    module = _reimport_module()
    _get_function(module, "shadow_demo")


def test_shadow_demo_prints_local(capsys):
    """Ensure shadow_demo prints the local 'name' variable."""
    module = _reimport_module()
    shadow_demo = _get_function(module, "shadow_demo")

    # Clear any previous output
    capsys.readouterr()

    shadow_demo()
    out = capsys.readouterr().out

    assert "Local" in out, "shadow_demo() should print 'Local' (the local variable)."


def test_shadow_demo_does_not_modify_global():
    """Ensure shadow_demo does not modify the global 'name' variable."""
    module = _reimport_module()
    shadow_demo = _get_function(module, "shadow_demo")

    # Store original value
    original = module.name

    # Call the function
    shadow_demo()

    # Global should remain unchanged
    assert module.name == original, \
        f"Global 'name' should remain '{original}' after shadow_demo(), got '{module.name}'."


def test_module_prints_output(capsys):
    """Ensure the module produces some printed output when run."""
    module = _reimport_module()
    out = capsys.readouterr().out
    assert out.strip(), "Expected the script to print some output demonstrating scope concepts."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
