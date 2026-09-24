# Basic Data Types

A **data type** is a classification of data that tells the computer how to interpret and use it.  
It gives context to the data.

In Python, there are several built-in data types.

---

## Integers

An **integer** (or `int`) is a whole number.

```python
print(42)
print(0)
print(-17)
```

---

## Floats

Short for **floating point number** — a number with a decimal point.

```python
print(3.14)
print(0.5)
print(-2.0)
```

---

## Strings

A **string** is a sequence of characters enclosed in quotes.

```python
print("Hello, world!")
print('Python is cool.')  # Can be written with " " or ' '.
print("1234")  # Even though this looks like a number, it's not.
```

---

## Booleans

A **boolean** is a logical value that is either `True` or `False`.

```python
print(True)   # Not a string because there are no quotes.
print(False)  # Must be capitalized; Python is case-sensitive.
print(2 > 3)  # Evaluates to False, because 2 is not greater than 3.
```

---

## Checking Data Types

You can check something’s data type using the `type()` function.

```python
print(type(3))       # Prints <class 'int'>
print(type(1.1))     # Prints <class 'float'>
print(type("Yellow"))  # Prints <class 'str'>
print(type(10 > 5))    # Prints <class 'bool'>
```
