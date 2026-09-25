# tests/test_exercise.py

import importlib
import sys
from types import ModuleType

MODULE_NAME = "exercise"
CLASS_NAME = "BankAccount"


# ---------------- Helpers ----------------

def _reimport_module() -> ModuleType:
    """Re-import the student's module fresh."""
    if MODULE_NAME in sys.modules:
        del sys.modules[MODULE_NAME]
    return importlib.import_module(MODULE_NAME)


def _get_class(module: ModuleType):
    cls = getattr(module, CLASS_NAME, None)
    assert cls is not None, f"Expected class '{CLASS_NAME}' to be defined."
    assert isinstance(cls, type), f"'{CLASS_NAME}' must be a class."
    return cls


# ---------------- Tests ----------------

def test_class_definition_and_init():
    """Ensure BankAccount class exists and initializes with a balance."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    account = BankAccount(1000.00)
    assert hasattr(account, "balance"), "BankAccount must have 'balance' attribute."
    assert account.balance == 1000.00, "BankAccount balance should match initialized value."


def test_add_operator_overloading():
    """Ensure __add__ method combines two BankAccount balances."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    acc1 = BankAccount(500.00)
    acc2 = BankAccount(300.00)

    combined = acc1 + acc2
    assert isinstance(combined, BankAccount), "__add__ should return a BankAccount instance."
    assert combined.balance == 800.00, "__add__ should combine both balances."


def test_sub_operator_exists():
    """Ensure __sub__ method is defined."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    account = BankAccount(1000.00)
    assert hasattr(account, "__sub__"), "BankAccount must have __sub__ method defined."
    assert callable(account.__sub__), "__sub__ must be callable."


def test_sub_operator_with_numeric_value():
    """Ensure __sub__ works with a numeric value to withdraw money."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    account = BankAccount(1000.00)
    result = account - 300.00

    assert isinstance(result, BankAccount), "__sub__ should return a BankAccount instance."
    assert abs(result.balance - 700.00) < 0.01, \
        f"Expected balance 700.00 after subtracting 300, got {result.balance}"


def test_sub_operator_with_integer():
    """Ensure __sub__ works with integer values as well."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    account = BankAccount(500)
    result = account - 100

    assert isinstance(result, BankAccount), "__sub__ should return a BankAccount instance."
    assert result.balance == 400, f"Expected balance 400 after subtracting 100, got {result.balance}"


def test_sub_operator_does_not_modify_original():
    """Ensure __sub__ returns a new BankAccount, not modifying the original."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    original = BankAccount(1000.00)
    original_balance = original.balance
    result = original - 200.00

    assert original.balance == original_balance, \
        "Original account balance should not change after subtraction."
    assert result is not original, "__sub__ should return a new BankAccount, not the same instance."


def test_str_method():
    """Ensure __str__ returns a formatted string representation."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    account = BankAccount(1234.56)
    string_rep = str(account)

    assert isinstance(string_rep, str), "__str__ must return a string."
    assert "1234.56" in string_rep or "1,234.56" in string_rep, \
        "String representation should include the balance."
    assert "BankAccount" in string_rep or "balance" in string_rep.lower(), \
        "String representation should indicate it's a BankAccount."


def test_chained_operations():
    """Ensure operators can be chained together."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    acc1 = BankAccount(1000.00)
    acc2 = BankAccount(500.00)

    # Chain: combine two accounts, then withdraw
    result = (acc1 + acc2) - 200.00

    assert isinstance(result, BankAccount), "Chained operations should return a BankAccount."
    assert abs(result.balance - 1300.00) < 0.01, \
        f"Expected 1300.00 after combining 1000+500 and subtracting 200, got {result.balance}"


def test_multiple_subtractions():
    """Ensure multiple subtractions work correctly."""
    module = _reimport_module()
    BankAccount = _get_class(module)

    account = BankAccount(1000.00)
    result1 = account - 100.00
    result2 = result1 - 150.00
    result3 = result2 - 250.00

    assert abs(result3.balance - 500.00) < 0.01, \
        f"Expected 500.00 after multiple subtractions, got {result3.balance}"


def test_reimport_safe():
    """Re-importing should not crash."""
    _ = _reimport_module()
    _ = _reimport_module()


# Keep pytest import last for consistency
import pytest  # noqa: E402
