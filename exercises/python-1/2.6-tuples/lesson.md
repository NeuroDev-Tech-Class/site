# Tuples

**Tuples** are another container data type in Python.  
They are **ordered** like lists, but **immutable**, meaning their values cannot be changed once created.  
Tuples are defined using **parentheses** `()` instead of square brackets `[]`.

---

## Creating a Tuple

```python
my_tuple = (1, 2, 3, 4, 5)
print(my_tuple)
```

Output:

```
(1, 2, 3, 4, 5)
```

---

## Accessing Tuple Elements

Accessing items in a tuple works the same way as with lists.

```python
print(my_tuple[0])     # Prints 1
print(my_tuple[2:4])   # Prints (3, 4)
```

You can use positive or negative indexing, and slicing works the same way as in lists.

---

## Tuples and Functions

Tuples can be used to **return multiple values** from a function.

```python
def calculate_rectangle(length, width):
    area = length * width
    perimeter = 2 * (length + width)
    return area, perimeter

result = calculate_rectangle(5, 3)
print("Area:", result[0])
print("Perimeter:", result[1])
```

Output:

```
Area: 15
Perimeter: 16
```

---

## Tuple Unpacking

You can unpack a tuple directly into multiple variables for cleaner code.

```python
area, perimeter = calculate_rectangle(6, 4)
print("Area:", area)
print("Perimeter:", perimeter)
```

Output:

```
Area: 24
Perimeter: 20
```

---

Tuples are often used when you want to group related data that shouldn't change — for example, coordinates, dimensions, or constant values.
