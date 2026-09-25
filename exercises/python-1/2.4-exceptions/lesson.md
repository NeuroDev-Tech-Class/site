# Exception Handling

In programming, **exceptions** are errors that occur during program execution.  
**Exception handling** is the process of dealing with these errors in a clean and controlled manner.

In Python, exceptions are **objects** that represent errors.  
When an error occurs, Python creates an exception object and *raises* it.  
If the exception is not handled (or "caught") by the program, it will cause the program to terminate (crash) and display an error message.

---

## Basic Try-Except Block

To handle exceptions in Python, we use a `try-except` block.  
The code that might raise an exception goes in the `try` block, and the code that handles the exception goes in the `except` block.

```python
try:
    x = int("abcdefg")
except:
    print("Oops! That isn't a valid number.")
```

In this example, we attempt to convert a string to an integer using `int()`, which raises a `ValueError`.  
Because the code is inside a `try-except` block, the program doesn’t crash — instead, it prints a friendly message and continues execution.

---

## Catching Multiple Exceptions

You can catch multiple types of exceptions in a single try-except structure.  
Additionally, Python provides `else` and `finally` clauses for more precise control.

```python
try:
    divisor = int(input("Give me a divisor. "))
    x = 100 / divisor
except ZeroDivisionError:   # Do this if a ZeroDivisionError is raised
    print("Oops! Cannot divide by zero.")
except:                     # Do this if any other error is raised
    print("Not a valid integer.")
else:                       # Do this if no errors are raised
    print(x)
finally:                    # Do this at the end, no matter what
    print("The code block is finished.")
```

### What Happens Here

- If the user inputs **0**, the division operation raises a `ZeroDivisionError`, and the program prints `"Oops! Cannot divide by zero."`
- If the user inputs a **non-numeric string**, the `int()` function raises a `ValueError`, and `"Not a valid integer."` prints.
- If the user enters a **valid non-zero number**, no errors are raised, so the `else` block executes, printing the result of the division.
- Regardless of what the user inputs, the `finally` block executes, printing `"The code block is finished."`

---

## Why Use Exception Handling?

`try-except` blocks make your code safer and more user-friendly by handling unexpected situations gracefully.  
They’re an essential part of writing robust programs, and learning to use them effectively will make you a stronger Python programmer.

Remember — tools like this are meant to make a programmer’s life easier, not harder!
