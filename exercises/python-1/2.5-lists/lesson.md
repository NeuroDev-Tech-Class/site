# Lists

**Lists** are a type of data structure in Python used to store a collection of items.  
They are **ordered**, **mutable** (able to be changed), and allow **duplicate elements**.

---

## Creating a List

```python
fruits = ['apple', 'banana', 'cherry']
```

---

## Accessing Items in a List

```python
print(fruits[0])   # Output: 'apple'. Indexing starts at 0, not 1
print(fruits[1])   # Output: 'banana'
print(fruits[-1])  # Output: 'cherry'. -1 indexes the last item
```

Negative indexing works backward from the end of the list (`-2` = second to last, etc.).

---

## Reassigning an Item

```python
fruits[1] = 'orange'
print(fruits)  # Output: ['apple', 'orange', 'cherry']
```

---

## Looping Through a List

```python
for fruit in fruits:
    print(fruit)
```

---

## Checking if an Item Exists

```python
if 'apple' in fruits:
    print('Yes, apple is in the fruits list.')
```

---

## Adding and Removing Items

### Append (add to the end)

```python
fruits.append('banana')
print(fruits)  # Output: ['apple', 'orange', 'cherry', 'banana']
```

### Remove

```python
fruits.remove('cherry')
print(fruits)  # Output: ['apple', 'orange', 'banana']
```

---

## Sorting and Reversing Lists

```python
fruits.sort()
print(fruits)  # Output: ['apple', 'banana', 'orange']

fruits.reverse()
print(fruits)  # Output: ['orange', 'banana', 'apple']
```

---

## Slicing Lists and Strings

**Slicing** extracts a specific section of a sequence (like a list or string).  
The syntax is `sequence[start:end]` — the start index is **inclusive**, the end index is **exclusive**.

### List Slicing

```python
numbers = [0, 1, 2, 3, 4, 5]
slice1 = numbers[2:4]  # [2, 3]
print(slice1)

slice2 = numbers[:3]   # [0, 1, 2]
print(slice2)

slice3 = numbers[3:]   # [3, 4, 5]
print(slice3)
```

### String Slicing

```python
text = "Hello, world!"
slice4 = text[7:12]  # "world"
print(slice4)
```

---

## List Comprehensions

**List comprehensions** provide a concise way to create lists.  
They consist of an expression followed by a `for` clause, and can include additional `for` or `if` conditions.

### Example: List of Squares

```python
squares = [x**2 for x in range(10)]
print(squares)  # Output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

### Example: List of Even Numbers

```python
evens = [x for x in range(10) if x % 2 == 0]
print(evens)  # Output: [0, 2, 4, 6, 8]
```

### Example: Nested List Comprehensions

```python
combinations = [(x, y) for x in [1, 2, 3] for y in [3, 1, 4] if x != y]
print(combinations)  # Output: [(1, 3), (1, 4), (2, 3), (2, 1), (2, 4), (3, 1), (3, 4)]
```
