# PEP 8: Python Style Guide

Python’s **PEP 8** is the official style guide for writing clean, readable, and consistent Python code.  
Following these conventions helps make your code more maintainable and easier for others (and your future self) to understand.

---

## Indentation

Use **4 spaces** per indentation level. Never use tabs.

```python
# Example
def function_example(argument1, argument2):
    if argument1 > argument2:  # 4 spaces
        result = argument1     # 8 spaces
    else:
        result = argument2
    return result
```

---

## Maximum Line Length (79-character limit)

Keep lines to a **maximum of 79 characters**.  
If a line is too long, use parentheses for implicit line continuation.

```python
# Don't:
def my_function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z):
    return a + b + c + d + e + f + g + h + i + j + k + l + m + n + o + p + q + r + s + t + u + v + w + x + y + z

# Do:
def my_function(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z):
    return (
        a + b + c + d + e + f + g + h + i + j + k + l + m + n
        + o + p + q + r + s + t + u + v + w + x + y + z
    )
```

---

## Naming Conventions

- **Functions and variables:** `lower_case_with_underscores`  
- **Classes:** `CapitalizedWords`  
- **Constants:** `UPPER_CASE_WITH_UNDERSCORES`

```python
def calculate_area(width, height):
    return width * height


class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height
```

---

## Imports

Imports should be grouped in the following order:

1. **Standard library imports**
2. **Third-party imports**
3. **Local application imports**

Each group should be separated by a blank line.

```python
# Standard library imports
import os
import sys

# Third-party imports
import numpy as np

# Local application imports
from my_package import my_module
```

---

## Whitespace

- Two blank lines between **top-level functions** and **class definitions**.  
- One blank line between **methods** inside a class.

```python
def function_one():
    pass


def function_two():
    pass


class MyClass:
    def method_one(self):
        pass

    def method_two(self):
        pass
```

---

## Inline Comments

Use inline comments **sparingly** and only when necessary to clarify code.

```python
x = 1
y = 2
x = x + y  # Add y to x and store the result back in x
```

---

## Trailing Commas

Include a **trailing comma** when breaking lists, tuples, or dictionaries across multiple lines.

```python
my_list = [
    'item1',
    'item2',
    'item3',  # Trailing comma
]
```

---

## String Quotes

Both single (`'`) and double (`"`) quotes are fine — just **stay consistent** throughout your project.

```python
my_string = 'string'
my_string = "string"  # Both are acceptable
```

---

## Spaces Around Operators

Use spaces **around operators and after commas**, but **not inside parentheses or brackets**.

```python
# Don't:
z=10

# Do:
z = 10

result = x * (y + z) - x
my_list = [1, 2, 3, 4]
```

---

## Identity vs. Equality

Use **`is`** to compare to `None`, and avoid explicit boolean comparisons.

```python
# Incorrect:
if x == None:
    pass

# Correct:
if x is None:
    pass

# Incorrect:
if x == True:
    pass

# Correct:
if x:
    pass
```

---

### Summary

| Rule | Best Practice |
|------|----------------|
| Indentation | 4 spaces per level |
| Line Length | 79 characters max |
| Function & Variable Names | lowercase_with_underscores |
| Class Names | CapitalizedWords |
| Constants | UPPER_CASE_WITH_UNDERSCORES |
| Imports | Standard → Third-Party → Local |
| Spaces | Around operators, after commas |
| Compare to None | Use `is` or `is not` |

---

Adhering to **PEP 8** ensures that your code is clean, consistent, and Pythonic. Tools like `flake8`, `black`, and `pylint` can automatically check and enforce these conventions.
