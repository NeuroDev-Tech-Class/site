# tests/test_exercise.py

import importlib
import sys
from types import ModuleType
from typing import Any, Dict, List

MODULE_NAME = "exercise"
FUNC_NAME = "textManip"

# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Reload the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_func(module: ModuleType):
    fn = getattr(module, FUNC_NAME, None)
    assert callable(fn), f"{FUNC_NAME}() must be defined and callable."
    return fn


def _lowercase_sequence_expected(text: str) -> List[str]:
    """All lowercase letters from text, in order."""
    return [ch for ch in text if ch.islower()]


# ---------------- Tests ----------------

def test_function_exists_and_import_uses_re():
    module = _reimport_module()
    fn = _get_func(module)
    # Ensure they import the 're' module in their code
    with open("exercise.py", "r", encoding="utf-8") as f:
        src = f.read().lower()
    assert "import re" in src, "Expected 'import re' in the solution."


def test_returns_dict_with_expected_answers():
    module = _reimport_module()
    fn = _get_func(module)

    text = "The quick brown fox jumps over the lazy dog 123."
    result = fn(text)
    assert isinstance(result, dict), "Function must return a dictionary of results."

    # 1) findall occurrences of 'o' -> should be ['o','o','o','o']
    # We don't know the student's key naming, so search values.
    findall_o_ok = any(
        isinstance(v, list) and v == ['o', 'o', 'o', 'o']
        for v in result.values()
    )
    assert findall_o_ok, "Expected a list equal to ['o','o','o','o'] from a findall over 'o'."

    # 2) search first digit -> first digit should be '1' (accept Match or '1')
    def _is_first_digit_value(v: Any) -> bool:
        try:
            import re as _re
            if hasattr(v, "group") and callable(getattr(v, "group")):
                return v.group() == "1"
            return v == "1" or v == 1
        except Exception:
            return False

    search_digit_ok = any(_is_first_digit_value(v) for v in result.values())
    assert search_digit_ok, "Expected the first digit found by search to be '1' (match or string)."

    # 3) sub replace whitespace with underscores
    expected_sub = "The_quick_brown_fox_jumps_over_the_lazy_dog_123."
    sub_ok = any(isinstance(v, str) and v == expected_sub for v in result.values())
    assert sub_ok, f"Expected whitespace replaced string to be '{expected_sub}'."

    # 4) findall all lowercase letters (metacharacter)
    expected_lower_list = _lowercase_sequence_expected(text)
    lowercase_ok = any(
        isinstance(v, list) and v == expected_lower_list
        for v in result.values()
    )
    assert lowercase_ok, (
        "Expected a list of all lowercase letters from the string (e.g., using r'[a-z]')."
    )

    # 5) split on whitespace
    expected_split = ["The", "quick", "brown", "fox", "jumps", "over", "the", "lazy", "dog", "123."]
    split_ok = any(
        isinstance(v, list) and v == expected_split
        for v in result.values()
    )
    assert split_ok, "Expected a list split on whitespace equal to the words in the sentence."


def test_keys_reference_regex_methods_somehow():
    """
    The prompt asks for keys that correspond to regex methods.
    Be flexible: accept keys that contain method names like 'findall', 'search', 'sub', 'split'.
    """
    module = _reimport_module()
    fn = _get_func(module)
    text = "The quick brown fox jumps over the lazy dog 123."
    result = fn(text)

    keys_lower = [str(k).lower() for k in result.keys()]
    contains_any = lambda word: any(word in k for k in keys_lower)

    assert contains_any("findall"), "Expected at least one key indicating 'findall'."
    assert contains_any("search"), "Expected a key indicating 'search'."
    assert contains_any("sub"), "Expected a key indicating 'sub'."
    assert contains_any("split"), "Expected a key indicating 'split'."


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
