# Dictionaries

**Dictionaries** are a type of data structure that store a collection of **key-value pairs**.  
Keys are typically strings or numbers, and values can be any type of Python object.  

Dictionaries are also known as **maps**, **hash maps**, or **associative arrays**.

---

## Creating a Dictionary

You can create an empty dictionary or initialize one with key-value pairs.

```python
empty_dict = {}

fruit_colors = {'apple': 'red', 'banana': 'yellow', 'grape': 'purple'}
```

---

## Accessing Values

You can access a value by using its key in square brackets:

```python
print(fruit_colors['apple'])   # Output: 'red'
print(fruit_colors['banana'])  # Output: 'yellow'
```

If you try to access a key that doesn’t exist, Python raises a **KeyError**:

```python
# print(fruit_colors['orange'])  # Raises KeyError
```

To avoid errors, use the `.get()` method and specify a default value:

```python
print(fruit_colors.get('orange', 'unknown'))  # Output: 'unknown'
```

---

## Modifying Values

You can change the value for an existing key like this:

```python
fruit_colors['apple'] = 'green'
print(fruit_colors['apple'])  # Output: 'green'
```

---

## Adding New Key-Value Pairs

You can add a new key-value pair by simply assigning it:

```python
fruit_colors['blueberry'] = 'blue'
print(fruit_colors['blueberry'])  # Output: 'blue'
```

---

## Removing Key-Value Pairs

Use the `del` statement to remove a key-value pair:

```python
del fruit_colors['grape']
# print(fruit_colors['grape'])  # Raises KeyError
```

---

## Iterating Over Dictionaries

You can loop through keys using a `for` loop:

```python
for fruit in fruit_colors:
    print(fruit)
```
This prints all the keys (e.g., `'apple'`, `'banana'`, `'blueberry'`).

To access both keys and values, use the `.items()` method:

```python
for fruit, color in fruit_colors.items():
    print(f'{fruit} is {color}')
```
Output:

```
apple is green
banana is yellow
blueberry is blue
```

---

## Dictionary Comprehensions

Like list comprehensions, you can build dictionaries dynamically:

```python
fruits = ['apple', 'banana', 'orange']
fruit_lengths = {fruit: len(fruit) for fruit in fruits}
print(fruit_lengths)  # Output: {'apple': 5, 'banana': 6, 'orange': 6}
```

---

Dictionaries are powerful and efficient tools for mapping keys to values — essential for data organization and quick lookups.
