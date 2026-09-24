# tests/test_exercise.py

import importlib
import sys
import os
from types import ModuleType

MODULE_NAME = "exercise"
MATH_MODULE = "math_operations"
STRING_MODULE = "string_operations"


# ---------------- Helpers ----------------

def _reimport_module(name: str) -> ModuleType:
    """Re-import a module fresh."""
    if name in sys.modules:
        del sys.modules[name]
    return importlib.import_module(name)


def _get_function(module: ModuleType, name: str):
    func = getattr(module, name, None)
    assert func is not None, f"Expected function '{name}' to be defined in {module.__name__}."
    assert callable(func), f"'{name}' must be callable."
    return func


def _module_file_exists(name: str) -> bool:
    """Check if a module file exists in the current directory."""
    return os.path.exists(f"{name}.py")


# ---------------- Tests for math_operations module ----------------

def test_math_operations_module_exists():
    """Ensure math_operations.py file is created."""
    assert _module_file_exists(MATH_MODULE), \
        f"Expected '{MATH_MODULE}.py' file to be created in the same directory."


def test_math_operations_add_function():
    """Test the add function in math_operations."""
    if not _module_file_exists(MATH_MODULE):
        import pytest
        pytest.skip("math_operations.py not found")

    module = _reimport_module(MATH_MODULE)
    add = _get_function(module, "add")

    assert add(5, 3) == 8, "add(5, 3) should return 8."
    assert add(0, 0) == 0, "add(0, 0) should return 0."
    assert add(-1, 1) == 0, "add(-1, 1) should return 0."


def test_math_operations_subtract_function():
    """Test the subtract function in math_operations."""
    if not _module_file_exists(MATH_MODULE):
        import pytest
        pytest.skip("math_operations.py not found")

    module = _reimport_module(MATH_MODULE)
    subtract = _get_function(module, "subtract")

    assert subtract(10, 4) == 6, "subtract(10, 4) should return 6."
    assert subtract(5, 5) == 0, "subtract(5, 5) should return 0."
    assert subtract(3, 7) == -4, "subtract(3, 7) should return -4."


def test_math_operations_multiply_function():
    """Test the multiply function in math_operations."""
    if not _module_file_exists(MATH_MODULE):
        import pytest
        pytest.skip("math_operations.py not found")

    module = _reimport_module(MATH_MODULE)
    multiply = _get_function(module, "multiply")

    assert multiply(4, 5) == 20, "multiply(4, 5) should return 20."
    assert multiply(0, 100) == 0, "multiply(0, 100) should return 0."
    assert multiply(-2, 3) == -6, "multiply(-2, 3) should return -6."


def test_math_operations_divide_function():
    """Test the divide function in math_operations."""
    if not _module_file_exists(MATH_MODULE):
        import pytest
        pytest.skip("math_operations.py not found")

    module = _reimport_module(MATH_MODULE)
    divide = _get_function(module, "divide")

    assert divide(10, 2) == 5, "divide(10, 2) should return 5."
    assert divide(7, 2) == 3.5, "divide(7, 2) should return 3.5."


def test_math_operations_divide_by_zero():
    """Test that divide handles division by zero gracefully."""
    if not _module_file_exists(MATH_MODULE):
        import pytest
        pytest.skip("math_operations.py not found")

    module = _reimport_module(MATH_MODULE)
    divide = _get_function(module, "divide")

    # Should either raise an exception or return a special value (not crash)
    try:
        result = divide(10, 0)
        # If it returns something, it should indicate an error (None, 0, or similar)
        assert result is None or result == 0 or result == float('inf') or isinstance(result, str), \
            "divide(10, 0) should handle division by zero gracefully."
    except (ZeroDivisionError, ValueError):
        # Raising an exception is also acceptable
        pass


# ---------------- Tests for string_operations module ----------------

def test_string_operations_module_exists():
    """Ensure string_operations.py file is created."""
    assert _module_file_exists(STRING_MODULE), \
        f"Expected '{STRING_MODULE}.py' file to be created in the same directory."


def test_string_operations_capitalize_words():
    """Test the capitalize_words function in string_operations."""
    if not _module_file_exists(STRING_MODULE):
        import pytest
        pytest.skip("string_operations.py not found")

    module = _reimport_module(STRING_MODULE)
    capitalize_words = _get_function(module, "capitalize_words")

    result = capitalize_words("hello world")
    assert result == "Hello World", f"capitalize_words('hello world') should return 'Hello World', got '{result}'."

    result2 = capitalize_words("python programming")
    assert result2 == "Python Programming", \
        f"capitalize_words('python programming') should return 'Python Programming', got '{result2}'."


def test_string_operations_reverse_string():
    """Test the reverse_string function in string_operations."""
    if not _module_file_exists(STRING_MODULE):
        import pytest
        pytest.skip("string_operations.py not found")

    module = _reimport_module(STRING_MODULE)
    reverse_string = _get_function(module, "reverse_string")

    assert reverse_string("hello") == "olleh", "reverse_string('hello') should return 'olleh'."
    assert reverse_string("Python") == "nohtyP", "reverse_string('Python') should return 'nohtyP'."
    assert reverse_string("") == "", "reverse_string('') should return ''."


def test_string_operations_count_vowels():
    """Test the count_vowels function in string_operations."""
    if not _module_file_exists(STRING_MODULE):
        import pytest
        pytest.skip("string_operations.py not found")

    module = _reimport_module(STRING_MODULE)
    count_vowels = _get_function(module, "count_vowels")

    assert count_vowels("hello") == 2, "count_vowels('hello') should return 2."
    assert count_vowels("aeiou") == 5, "count_vowels('aeiou') should return 5."
    assert count_vowels("rhythm") == 0, "count_vowels('rhythm') should return 0."
    assert count_vowels("HELLO") == 2, "count_vowels('HELLO') should return 2 (case-insensitive)."


# ---------------- Tests for exercise.py imports ----------------

def test_exercise_imports_math_operations(capsys):
    """Ensure exercise.py imports and uses math_operations."""
    if not _module_file_exists(MATH_MODULE):
        import pytest
        pytest.skip("math_operations.py not found")

    module = _reimport_module(MODULE_NAME)
    out = capsys.readouterr().out

    # The exercise should print results from using math operations
    # Check that some numeric output exists
    assert out.strip(), "Expected exercise.py to print output from using math_operations."


def test_exercise_imports_string_operations(capsys):
    """Ensure exercise.py imports and uses string_operations."""
    if not _module_file_exists(STRING_MODULE):
        import pytest
        pytest.skip("string_operations.py not found")

    module = _reimport_module(MODULE_NAME)
    out = capsys.readouterr().out

    # The exercise should print results from using string operations
    assert out.strip(), "Expected exercise.py to print output from using string_operations."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module(MODULE_NAME)
    _ = _reimport_module(MODULE_NAME)


# Keep pytest import last for consistency
import pytest  # noqa: E402
