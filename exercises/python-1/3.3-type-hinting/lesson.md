# Type Hinting

Python is a **dynamically typed language**, which means that the type of a variable is checked only during **runtime**.  
However, as your programs grow in size and complexity, it’s helpful to have a way to check types earlier — before running your code.

---

## What Is Type Hinting?

**Type hinting** was introduced in **Python 3.5**.  
It allows you to annotate your code to suggest the expected data types of variables, function arguments, and return values.

Type hints **don’t affect the actual runtime behavior** of your program — they are purely informational.  
They help with **readability**, **documentation**, and **static type checking** tools (like `mypy` or IDE autocompletion).

---

## Example: Without Type Hints

```python
def describe_age(age):
    return f"You are {age} years old."
```

---

## Example: With Type Hints

```python
def describe_age(age: int) -> str:
    return f"You are {age} years old."
```

Here’s what each part means:

- `age: int` → The parameter `age` is expected to be an **integer**.  
- `-> str` → The function is expected to **return a string**.

---

## Using Built-in Types in Hints

You can use built-in types like `int`, `float`, `str`, `list`, `dict`, etc.

```python
def square_list(numbers: list[int]) -> list[int]:
    return [n ** 2 for n in numbers]
```

---

## Using the `typing` Module

For more complex or older Python versions (before 3.9), use the **`typing`** module.

```python
from typing import List, Dict

def total_sales(sales: Dict[str, int]) -> int:
    return sum(sales.values())

def find_largest(numbers: List[int]) -> int:
    return max(numbers)
```

- `Dict[str, int]` → A dictionary with **string keys** and **integer values**.  
- `List[int]` → A list containing integers.

---

## Why Use Type Hints?

Type hints make your code:

- **More readable** — It’s clear what types are expected.  
- **Easier to debug** — Type checkers can catch mistakes early.  
- **Better for collaboration** — Other developers can immediately understand the data structure expectations.

---

### Example of a Static Type Check

You can use **mypy** (a popular static type checker) to validate your hints:

```
pip install mypy
mypy your_script.py
```

This will report any type mismatches it finds — helping you catch potential errors **before runtime**.

---

Type hinting is one of the best practices for writing clear, maintainable Python code — especially in large projects or collaborative environments.
