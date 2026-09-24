# Operator Overloading

## Overview

Operator overloading lets you define how operators behave with user-defined objects. For example, the add (`+`) operator performs addition with integers and concatenation with strings. With operator overloading, you can define how the addition operator should behave with instances of your custom classes.

### Why Use Operator Overloading?

- **Intuitive Interaction**: Allows your custom objects to interact with Python's built-in operators
- **Code Clarity**: Makes your classes more intuitive and easier to use
- **Readability**: Helps make your code cleaner and more readable

---

## Dunder Methods

Python lets you overload operators by defining special methods in your class. These methods have double underscores (`__`) at the beginning and end of their names. These are called **"dunder" methods**.

### Common Operators and Their Dunder Methods

| Operator | Dunder Method | Description |
|----------|---------------|-------------|
| Addition | `__add__(self, other)` | Handles `a + b` |
| Subtraction | `__sub__(self, other)` | Handles `a - b` |
| Multiplication | `__mul__(self, other)` | Handles `a * b` |
| Division | `__truediv__(self, other)` | Handles `a / b` |
| String Representation | `__str__(self)` | Handles `str(a)` and `print(a)` |

---

## Example 1: Overloading the Addition Operator

We'll create a `BankAccount` class and overload the `+` operator to merge two bank accounts.

```python
class BankAccount:
    def __init__(self, balance):
        self.balance = balance

    # Overload the + operator
    def __add__(self, other):
        # Make sure the other object is a BankAccount instance
        if isinstance(other, BankAccount):
            # Merge the balances of the two accounts
            return BankAccount(self.balance + other.balance)
        else:
            raise ValueError("Can only add BankAccount to another BankAccount")

    # Overload the str operator to print the account balance in a nice format
    def __str__(self):
        return f"BankAccount(balance: ${self.balance:.2f})"
```

### Usage:

```python
# Create two bank accounts
account1 = BankAccount(1000.50)
account2 = BankAccount(2500.75)

# Merge the two accounts using the overloaded + operator
merged_account = account1 + account2

# Print the result
print(merged_account)  # Output: BankAccount(balance: $3501.25)
```

### Key Points:
- The `__add__()` method defines behavior for the `+` operator
- Type checking ensures we only add `BankAccount` objects together
- The `__str__()` method controls how the object is displayed as a string
- Returns a new `BankAccount` object with the combined balance

---

## Example 2: Overloading the Multiplication Operator

Now, let's extend the `BankAccount` class to overload the `*` operator to multiply the balance by a number.

```python
class BankAccount:
    def __init__(self, balance):
        self.balance = balance

    def __add__(self, other):
        if isinstance(other, BankAccount):
            return BankAccount(self.balance + other.balance)
        else:
            raise ValueError("Can only add BankAccount to another BankAccount")

    def __mul__(self, multiplier):
        if isinstance(multiplier, (int, float)):
            return BankAccount(self.balance * multiplier)
        else:
            raise ValueError("Can only multiply BankAccount by an int or float")

    def __str__(self):
        return f"BankAccount(balance: ${self.balance:.2f})"
```

### Usage:

```python
# Create a bank account
account = BankAccount(1010.25)

# Multiply the account balance by 3 using the overloaded * operator
multiplied_account = account * 3

# Print the result
print(multiplied_account)  # Output: BankAccount(balance: $3030.75)
```

### Key Points:
- The `__mul__()` method defines behavior for the `*` operator
- Type checking ensures we only multiply by `int` or `float` values
- Returns a new `BankAccount` object with the multiplied balance
- Both `__add__()` and `__mul__()` can coexist in the same class

---

## Benefits of Operator Overloading

1. **Intuitive API**: Makes custom classes work naturally with built-in operators
2. **Better Readability**: Code is cleaner and easier to understand
3. **Consistency**: Custom objects behave similarly to built-in types
4. **Type Safety**: Can enforce type checking within overloaded methods
5. **Flexibility**: Define custom logic for how operators interact with your objects

---

## Best Practices

- Always perform type checking to ensure the operands are compatible
- Return appropriate types (usually a new instance of your class)
- Raise meaningful errors when operations aren't supported
- Keep overloaded operator behavior intuitive and predictable
- Use dunder methods sparingly and only when they make sense for your class

