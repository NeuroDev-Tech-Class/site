# Basic Python Syntax

In Python, each line of code contains its own instruction.  
These instructions are executed from top to bottom.

In some programming languages like Java and C++, indentation (spaces or tabs at the beginning of a line) is mainly for readability and doesn't affect the program. However, in Python, spacing and indentation _do_ matter.

## Comments

- The hash symbol `#` is used to write comments.
- Comments are ignored by Python when the code runs.
- They help explain what the code does or temporarily disable parts of code for testing.

```python
# This is a comment
```

You can use triple quotes for multi-line comments:

```python
"""
This is a
multi-line
comment
"""
```

## Printing to the Terminal

Here is a one-line Python program:

```python
print("Hello, world!")
```

- This prints `Hello, world!` to the terminal (sometimes called the **console**).
- Inside the parentheses is a **string** — a sequence of characters enclosed in quotes.
- The value inside the parentheses is called an **argument**:

  > An argument is any value passed to a function when it is called.

Some functions require multiple arguments, and some don't require any at all.

## Printing Numbers and Expressions

```python
print(2 + 2)
```

- Here, we passed a math expression (`2 + 2`) to `print()`.
- Python evaluates the expression and prints the result: `4`.

`print()` can accept many types of input, not just strings.
Unlike many other languages, Python automatically converts values to strings when printing.

## More Examples

```python
print("Python is fun!")
print(10 * 3)
print("The sum of 5 and 7 is", 5 + 7)
```

Output:

```
Python is fun!
30
The sum of 5 and 7 is 12
```

## Functions

- `print()` is just one of many built-in Python functions.
- Programmers can also define their own functions.
- We'll learn how to do that very soon, and that’s when programming gets really fun!
