# Loops

**Loops** are used to execute a block of code repeatedly, as long as a certain condition is met.  
There are two main types of loops in Python: **for loops** and **while loops**.

---

## For Loops

A **for loop** is used to iterate over a sequence (such as a list, string, or tuple) and execute a block of code once per item in that sequence.

```python
fruits = ["strawberry", "lemon", "kiwi"]
for fruit in fruits:
    print(fruit)
    # The variable "fruit" represents each item in the list "fruits"
```

---

You can also loop through strings:

```python
word = "sesquipedalian"
for char in word:
    print(char)
    # Prints every character in the string on its own line
```

---

### Using `range()`

`range()` is a built-in function that returns a sequence of numbers.  
It can take up to three arguments: `start`, `stop`, and `step`.

```python
for i in range(1, 6):
    print(i)
    # Prints numbers 1 through 5 (stops before 6)
```

If you omit the start value, it defaults to `0`:

```python
for i in range(4):
    print(i)
    # Prints 0, 1, 2, 3
```

You can also include a third argument for the step value (how much to increment each time):

```python
for i in range(10, 20, 2):
    print(i)
    # Prints even numbers from 10 to 18
```

---

## While Loops

A **while loop** repeatedly executes a block of code as long as a specified condition remains `True`.

```python
i = 1
while i < 6:
    print(i)
    i += 1
```

Here, `i` starts at 1 and increments by 1 until it reaches 6.

---

## Loop Control Statements

Python provides special statements to modify loop behavior:

### `break`

Terminates the loop entirely.

```python
animals = ["sheep", "pig", "cow"]
for animal in animals:
    if animal == "pig":
        break
    print(animal)
    # Prints "sheep" and stops when it reaches "pig"
```

Another example:

```python
numbers = [1, 3, 5, 4, 7, 9, 10, 11]
for num in numbers:
    if num % 2 == 0:
        print("The first even number is", num)
        break
```

---

### `continue`

Skips the current iteration and continues with the next one.

```python
trees = ["oak", "birch", "spruce"]
for tree in trees:
    if tree == "birch":
        continue
    print(tree)
    # Prints "oak" and "spruce", skips "birch"
```

---

### `pass`

Acts as a placeholder — it does nothing when executed.  
Useful when a statement is required syntactically but you don’t want to run any code yet.

```python
metals = ["gold", "iron", "copper"]
for metal in metals:
    pass
    # Nothing happens — 'pass' prevents a syntax error
```
