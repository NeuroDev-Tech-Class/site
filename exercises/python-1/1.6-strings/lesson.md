# String Manipulation

There are many ways to manipulate strings in helpful ways.

---

## Concatenation

Concatenation means chaining two strings together.

```python
str1 = "Hello"
str2 = "world"
str3 = str1 + " " + str2
print(str3)
```

We define two string variables `str1` and `str2`, and use the `+` operator to concatenate them together, along with a space in between.  
The resulting string is stored in a new variable `str3`, which is then printed to the console.

---

## Slicing

Slicing means extracting a portion of a string.

```python
str4 = "Python is awesome"
print(str4[0:6])   # Prints "Python" (characters 0-5)
print(str4[7:9])   # Prints "is" (characters 7-8)
print(str4[10:17]) # Prints "awesome" (characters 10-16)
```

We define a string variable `str4` and use square brackets `[]` to slice the string into substrings.

In Python, indexing starts at 0, so the first character of a string is at index 0, the second is at index 1, and so on.  
When slicing, the starting index is **inclusive**, and the ending index is **exclusive**.

---

## Formatting

Formatting allows you to insert values into a string. There are several methods to do this.

```python
name = "Hayden"
age = 29
```

### Using the `%` Operator

```python
print("My name is %s and I am %d years old." % (name, age))
```

The `%` operator uses special formatting codes to insert values into the string.  
- `%s` for strings  
- `%d` for integers  
- `%f` for floats  

### Using `str.format()`

```python
print("My name is {} and I am {} years old.".format(name, age))
```

The `str.format()` method allows inserting values by placing them inside `{}`.  
You can use positional or keyword arguments to specify which values go where.

### Using f-Strings

```python
print(f"My name is {name} and I am {age} years old.")
```

**f-strings** are formatted string literals that begin with `f`.  
You can embed variables or even expressions directly inside `{}`.

---

## Additional Tricks for Formatting Strings

### New Lines

The `
` character represents a **newline** (line break) in the output.

```python
print("\nI \nlove \nPython")
```

Output:

```
I
love
Python
```

---

## Helpful String Methods

### `.upper()`

Converts a string into uppercase.

```python
name = "roo"
name = name.upper()
print(name)
```

### `.strip()`

Removes whitespace from the beginning and end of a string.

```python
game = "Minecraft     "
print(game, "is fun.")
game = game.strip()
print(game, "is fun.")
```

### `.count()`

Returns the number of times a specified value occurs in a string.

```python
sentence = "The quick brown fox jumps over the lazy dog."
e_count = sentence.count("e")
print(e_count)
```
