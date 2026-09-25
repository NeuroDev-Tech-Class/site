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


# ---------------- Tests for sum_numbers ----------------

def test_sum_numbers_exists():
    """Ensure sum_numbers function is defined."""
    module = _reimport_module()
    _get_function(module, "sum_numbers")


def test_sum_numbers_base_case():
    """Test sum_numbers with base case (n=1)."""
    module = _reimport_module()
    sum_numbers = _get_function(module, "sum_numbers")

    assert sum_numbers(1) == 1, "sum_numbers(1) should return 1."


def test_sum_numbers_small_values():
    """Test sum_numbers with small values."""
    module = _reimport_module()
    sum_numbers = _get_function(module, "sum_numbers")

    assert sum_numbers(5) == 15, "sum_numbers(5) should return 15 (1+2+3+4+5)."
    assert sum_numbers(3) == 6, "sum_numbers(3) should return 6 (1+2+3)."


def test_sum_numbers_larger_value():
    """Test sum_numbers with a larger value."""
    module = _reimport_module()
    sum_numbers = _get_function(module, "sum_numbers")

    assert sum_numbers(10) == 55, "sum_numbers(10) should return 55."
    assert sum_numbers(100) == 5050, "sum_numbers(100) should return 5050."


# ---------------- Tests for power ----------------

def test_power_exists():
    """Ensure power function is defined."""
    module = _reimport_module()
    _get_function(module, "power")


def test_power_base_case():
    """Test power with exponent 0 (base case)."""
    module = _reimport_module()
    power = _get_function(module, "power")

    assert power(2, 0) == 1, "Any number to the power of 0 should be 1."
    assert power(5, 0) == 1, "power(5, 0) should return 1."
    assert power(100, 0) == 1, "power(100, 0) should return 1."


def test_power_exponent_one():
    """Test power with exponent 1."""
    module = _reimport_module()
    power = _get_function(module, "power")

    assert power(7, 1) == 7, "power(7, 1) should return 7."
    assert power(3, 1) == 3, "power(3, 1) should return 3."


def test_power_various_values():
    """Test power with various base and exponent combinations."""
    module = _reimport_module()
    power = _get_function(module, "power")

    assert power(2, 3) == 8, "power(2, 3) should return 8."
    assert power(5, 2) == 25, "power(5, 2) should return 25."
    assert power(3, 4) == 81, "power(3, 4) should return 81."
    assert power(10, 3) == 1000, "power(10, 3) should return 1000."


# ---------------- Tests for reverse_string ----------------

def test_reverse_string_exists():
    """Ensure reverse_string function is defined."""
    module = _reimport_module()
    _get_function(module, "reverse_string")


def test_reverse_string_empty():
    """Test reverse_string with empty string (base case)."""
    module = _reimport_module()
    reverse_string = _get_function(module, "reverse_string")

    assert reverse_string("") == "", "reverse_string('') should return ''."


def test_reverse_string_single_char():
    """Test reverse_string with single character."""
    module = _reimport_module()
    reverse_string = _get_function(module, "reverse_string")

    assert reverse_string("a") == "a", "reverse_string('a') should return 'a'."


def test_reverse_string_words():
    """Test reverse_string with various words."""
    module = _reimport_module()
    reverse_string = _get_function(module, "reverse_string")

    assert reverse_string("hello") == "olleh", "reverse_string('hello') should return 'olleh'."
    assert reverse_string("Python") == "nohtyP", "reverse_string('Python') should return 'nohtyP'."
    assert reverse_string("ab") == "ba", "reverse_string('ab') should return 'ba'."


def test_reverse_string_palindrome():
    """Test reverse_string with a palindrome."""
    module = _reimport_module()
    reverse_string = _get_function(module, "reverse_string")

    assert reverse_string("racecar") == "racecar", \
        "reverse_string('racecar') should return 'racecar' (palindrome)."


# ---------------- Tests for is_palindrome ----------------

def test_is_palindrome_exists():
    """Ensure is_palindrome function is defined."""
    module = _reimport_module()
    _get_function(module, "is_palindrome")


def test_is_palindrome_empty_and_single():
    """Test is_palindrome with empty string and single character."""
    module = _reimport_module()
    is_palindrome = _get_function(module, "is_palindrome")

    assert is_palindrome("") == True, "Empty string is a palindrome."
    assert is_palindrome("a") == True, "Single character is a palindrome."


def test_is_palindrome_true_cases():
    """Test is_palindrome with actual palindromes."""
    module = _reimport_module()
    is_palindrome = _get_function(module, "is_palindrome")

    assert is_palindrome("racecar") == True, "'racecar' is a palindrome."
    assert is_palindrome("noon") == True, "'noon' is a palindrome."
    assert is_palindrome("level") == True, "'level' is a palindrome."
    assert is_palindrome("madam") == True, "'madam' is a palindrome."


def test_is_palindrome_false_cases():
    """Test is_palindrome with non-palindromes."""
    module = _reimport_module()
    is_palindrome = _get_function(module, "is_palindrome")

    assert is_palindrome("hello") == False, "'hello' is not a palindrome."
    assert is_palindrome("python") == False, "'python' is not a palindrome."
    assert is_palindrome("ab") == False, "'ab' is not a palindrome."


# ---------------- Tests for fibonacci_memo (Optional) ----------------

def test_fibonacci_memo_exists():
    """Ensure fibonacci_memo function is defined."""
    module = _reimport_module()
    _get_function(module, "fibonacci_memo")


def test_fibonacci_memo_base_cases():
    """Test fibonacci_memo with base cases."""
    module = _reimport_module()
    fibonacci_memo = _get_function(module, "fibonacci_memo")

    result_0 = fibonacci_memo(0)
    result_1 = fibonacci_memo(1)

    # Allow for either 0-indexed or 1-indexed Fibonacci
    assert result_0 in [0, 1], f"fibonacci_memo(0) should return 0 or 1, got {result_0}."
    assert result_1 in [1, 1], f"fibonacci_memo(1) should return 1, got {result_1}."


def test_fibonacci_memo_sequence():
    """Test fibonacci_memo produces correct Fibonacci numbers."""
    module = _reimport_module()
    fibonacci_memo = _get_function(module, "fibonacci_memo")

    # Standard 0-indexed Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...
    # Or 1-indexed: 1, 1, 2, 3, 5, 8, 13...
    fib_7 = fibonacci_memo(7)
    assert fib_7 in [13, 21], f"fibonacci_memo(7) should return 13 (0-indexed) or 21 (1-indexed), got {fib_7}."

    fib_10 = fibonacci_memo(10)
    assert fib_10 in [55, 89], f"fibonacci_memo(10) should return 55 (0-indexed) or 89 (1-indexed), got {fib_10}."


def test_fibonacci_memo_performance():
    """Test fibonacci_memo can handle larger values quickly (due to memoization)."""
    module = _reimport_module()
    fibonacci_memo = _get_function(module, "fibonacci_memo")

    # This would be very slow without memoization
    result = fibonacci_memo(30)
    assert result in [832040, 1346269], \
        f"fibonacci_memo(30) should return 832040 (0-indexed) or 1346269 (1-indexed), got {result}."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
