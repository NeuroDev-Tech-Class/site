# Unit Testing

**Unit testing** is a software testing method that checks whether individual units of source code work correctly.  
A *unit* represents the smallest testable part of software — typically a function or method with specific inputs and a single output.

---

## Using Assertions for Simple Tests

Python’s built-in `assert` statement can be used for quick, simple unit tests.  
It checks if a condition is `True`; if not, it raises an **AssertionError**.

### Example

Let’s say we have a function in a file called `utils.py`:

```python
def add_numbers(a, b):
    return a + b
```

We can create another file called `test_utils.py` to test this function.

---

## Writing Tests with `assert`

```python
import utils  # Make sure utils.py is in the same directory

# Test positive numbers
result = utils.add_numbers(1, 2)
assert result == 3, f"Error: expected 3 but got {result}"

# Test negative numbers
result = utils.add_numbers(-1, -1)
assert result == -2, f"Error: expected -2 but got {result}"

# Test zero
result = utils.add_numbers(0, 0)
assert result == 0, f"Error: expected 0 but got {result}"

print("All tests passed.")
```

If all tests pass, you’ll see:

```
All tests passed.
```

If a test fails, Python raises an **AssertionError** with the provided message.

---

## How to Run the Tests

Simply execute the file in your terminal:

```
python test_utils.py
```

This will run all the assertions in order.

---

## Why Use Unit Testing?

Unit testing helps you:

- Verify that code changes don’t break existing functionality  
- Catch bugs early in development  
- Improve confidence in your code’s correctness  
- Serve as documentation for how your functions are expected to behave

---

## Moving Beyond `assert`: The `unittest` Module

Python also includes the **`unittest`** framework for more structured and extensive testing.

Example:

```python
import unittest
from utils import add_numbers

class TestUtils(unittest.TestCase):
    def test_add_positive(self):
        self.assertEqual(add_numbers(1, 2), 3)

    def test_add_negative(self):
        self.assertEqual(add_numbers(-1, -1), -2)

    def test_add_zero(self):
        self.assertEqual(add_numbers(0, 0), 0)

if __name__ == "__main__":
    unittest.main()
```

Run this file, and you’ll see detailed results like:

```
...
----------------------------------------------------------------------
Ran 3 tests in 0.001s

OK
```

---

Unit testing is a critical part of professional development, ensuring each piece of code behaves exactly as intended before integration with the rest of your program.
