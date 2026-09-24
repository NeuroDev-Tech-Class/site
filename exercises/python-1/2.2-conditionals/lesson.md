# Conditionals

**If statements** help control program flow based on certain conditions.  
The keyword `if` is followed by a logical expression that evaluates to a boolean (`True` or `False`).  
If the expression is `True`, the indented code block underneath the `if` statement will execute.  
If it's `False`, the code block underneath the `else` statement (if present) will execute.

---

## Basic If-Else Statement

```python
age = int(input("What is your age? "))
if age < 18:
    print("You are not old enough to vote.")
else:
    print("You are old enough to vote.")
```

The logical expression here checks whether or not the user's age is at least 18.  
If they're under 18, the first `print()` executes. Otherwise, the second does.

---

## Nested If Statements

You can nest one `if` statement inside another.

```python
if age >= 16:
    if age >= 21:
        print("You can legally rent a car.")
    else:
        print("You can legally drive but can't rent a car.")
else:
    print("You are not old enough to drive.")
```

In this example:
- If the person is under 16, the last message prints.  
- If they're 16 or older, the program checks again to see if they're 21 or older.  
  If so, they can rent a car; otherwise, they can only drive.

---

## Using `elif` for Multiple Conditions

The `elif` keyword (short for **else if**) allows you to check multiple conditions in order.

```python
x = int(input("Give me an integer. "))

if x > 0:
    print("That integer is positive.")
elif x == 0:
    print("That integer is zero.")
else:
    print("That integer is negative.")
```

Here:
- The first condition checks if the number is positive.
- If not, the next checks if it's zero.
- If neither is true, we conclude the number is negative.

Using `elif` statements is often more elegant and readable than using multiple nested `if` statements.

---

## Optional Else Block

Not all `if` statements need an accompanying `else`.

```python
myNum = int(input("Give me your favorite number. "))
print(f"Your favorite number is {myNum}.")

if myNum % 2 == 0:
    print("Your favorite number is even.")
```

Here, the program only prints the "even" message if the condition is met.  
If the number is odd, it simply moves on.

---

## Checking for Membership

You can use `if` statements to check if a value exists within a **list** or other sequence types.

```python
fruits = ["apple", "banana", "orange"]
if "apple" in fruits:
    print("You like apples!")
```

This prints `"You like apples!"` because `'apple'` is indeed in the list `fruits`.

---

## What Is a List?

A **list** is an ordered sequence of items enclosed in square brackets (`[]`) and separated by commas.  
Lists can hold multiple data types, including integers, floats, strings, and even other lists.

Lists make it easy to add, remove, and modify elements — they’ll be covered in more detail later.
