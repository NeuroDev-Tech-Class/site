# tests/test_exercise.py

import importlib
import sys
import builtins
import re
from pathlib import Path
from types import ModuleType
from typing import List, Optional

MODULE_NAME = "exercise"
FUNC_NAME = "appendRandNumbers"
FILENAME = "randNumber.txt"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Re-import the student's module fresh each time."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_func(module: ModuleType):
    fn = getattr(module, FUNC_NAME, None)
    assert callable(fn), f"{FUNC_NAME}() must be defined and callable."
    return fn


def _set_inputs(monkeypatch, inputs: List[str]) -> None:
    it = iter(inputs)
    monkeypatch.setattr(builtins, "input", lambda _prompt=None: next(it))


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def _tail_text(before_len: int, text: str) -> str:
    """Return the appended portion of 'text' given its previous length."""
    return text[before_len:]


def _extract_last_bracketed_list(text: str) -> Optional[str]:
    """
    Return the inner text of the last [...] segment, if any.
    """
    matches = list(re.finditer(r"\[([^\]]*)\]", text, flags=re.DOTALL))
    if not matches:
        return None
    return matches[-1].group(1)


def _extract_ints(text: str) -> List[int]:
    return [int(x) for x in re.findall(r"-?\d+", text)]


# ---------------- Tests ----------------

def test_import_does_not_prompt_for_input(monkeypatch, tmp_path):
    """
    Importing the module should not request input.
    If student calls input() at import-time, fail loudly.
    """
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(builtins, "input", lambda _p=None: (_ for _ in ()).throw(AssertionError(
        "Program should not call input() at import time."
    )))
    _ = _reimport_module()  # should not raise


def test_function_exists(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    module = _reimport_module()
    _get_func(module)  # asserts callable


def test_appends_requested_count_numbers(monkeypatch, tmp_path):
    """
    With input '5', the function should append a representation that includes 5 numbers.
    Preferably a Python list format [...]; if not, accept any text containing at least 5 ints.
    """
    monkeypatch.chdir(tmp_path)
    module = _reimport_module()
    func = _get_func(module)

    # Create file with seed content to detect append vs overwrite
    p = Path(FILENAME)
    p.write_text("SEED\n", encoding="utf-8")
    before = len(_read_text(p))

    _set_inputs(monkeypatch, ["5"])
    ret = func()  # may return None; acceptable

    after_text = _read_text(p)
    assert len(after_text) > before, "Expected content to be appended to randNumber.txt."

    appended = _tail_text(before, after_text)

    inner = _extract_last_bracketed_list(appended)
    if inner is not None:
        nums = _extract_ints(inner)
        assert len(nums) == 5, f"Expected 5 numbers in the appended list, found {len(nums)}."
    else:
        # Fallback: ensure at least 5 integers appear in appended text
        nums = _extract_ints(appended)
        assert len(nums) >= 5, f"Expected at least 5 integers in appended text, found {len(nums)}."

    # Return value may be None or any value; no strict requirement
    assert ret is None or isinstance(ret, (list, str)), "Return value is not constrained, but common is None/list/str."


def test_creates_correct_filename_and_appends(monkeypatch, tmp_path):
    """
    Ensure the file named exactly 'randNumber.txt' is created/used and that multiple calls append.
    """
    monkeypatch.chdir(tmp_path)
    module = _reimport_module()
    func = _get_func(module)

    # First append with 3 numbers
    _set_inputs(monkeypatch, ["3"])
    func()
    p = Path(FILENAME)
    assert p.exists(), f"Expected file '{FILENAME}' to be created."
    first_text = _read_text(p)
    first_len = len(first_text)

    # Second append with 4 numbers
    _set_inputs(monkeypatch, ["4"])
    func()
    second_text = _read_text(p)
    assert len(second_text) > first_len, "Expected the second call to append, not overwrite."

    # Check that there are at least two bracketed segments or total >= 7 ints appended
    appended = second_text[first_len:]
    lists_found = re.findall(r"\[([^\]]*)\]", second_text)
    if len(lists_found) >= 2:
        # good enough to indicate repeated appends as lists
        pass
    else:
        ints_total = _extract_ints(second_text)
        assert len(ints_total) >= 7, "Expected cumulative output to reflect multiple appends (>=7 numbers)."


def test_handles_zero_and_small_counts(monkeypatch, tmp_path):
    """
    If the student enters '0', accept an empty list ([]) or no ints appended.
    """
    monkeypatch.chdir(tmp_path)
    module = _reimport_module()
    func = _get_func(module)

    p = Path(FILENAME)
    before_text = _read_text(p)
    before_len = len(before_text)

    _set_inputs(monkeypatch, ["0"])
    func()
    after_text = _read_text(p)
    appended = _tail_text(before_len, after_text)

    # If bracketed list exists, allow it to be empty.
    inner = _extract_last_bracketed_list(appended)
    if inner is not None:
        nums = _extract_ints(inner)
        assert len(nums) == 0, "Expected zero numbers when input is 0."
    else:
        # No list representation—then ensure no new integers were appended
        nums = _extract_ints(appended)
        assert len(nums) == 0, "Expected no integers appended when input is 0."


def test_reimport_safe(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
