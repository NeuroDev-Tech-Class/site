# Regular Expressions

A **regular expression** (or **regex**) is a sequence of characters that defines a search pattern.  
It’s often used to check if a string contains a particular pattern, extract specific data, or replace text.

Python provides a built-in module for working with regular expressions called **`re`**.

---

## Importing the `re` Module

```python
import re
```

The `re` module includes several functions for searching, matching, and manipulating strings.

---

## `findall()` — Find All Matches

The **`findall()`** function returns a list of all **non-overlapping** matches of a pattern in a string.

```python
print(re.findall("a", "Hello, my name is Ana."))
# Output: ['a', 'a']
```

> Note: It only matches lowercase `'a'`, not uppercase `'A'` — regex is **case-sensitive** by default.

---

## `search()` — Find the First Match

The **`search()`** function scans a string for the first occurrence of a pattern.  
It returns a **Match object** if a match is found, otherwise `None`.

```python
match = re.search("a", "Hello, my name is Ana.")
print(match)
# Output: <re.Match object; span=(11, 12), match='a'>
```

You can access the actual text matched using:

```python
print(match.group())  # Output: 'a'
```

---

## `sub()` — Replace Matches

The **`sub()`** function replaces all occurrences of a pattern with another string.

```python
print(re.sub("a", "X", "Hello, my name is Ana."))
# Output: 'Hello, my nXme is AnX.'
```

---

## Using Character Classes and Metacharacters

Regular expressions support **metacharacters** like `[a-z]` and `[0-9]` to represent character ranges.

```python
# Find all lowercase letters
print(re.findall("[a-z]", "Hello, my name is Ana."))
# Output: ['e', 'l', 'l', 'm', 'y', 'n', 'a', 'm', 'e', 'i', 's', 'n', 'a']

# Find all digits
print(re.findall("[0-9]", "I have 2 apples and 3 oranges."))
# Output: ['2', '3']
```

Common metacharacters:

| Pattern | Matches |
|----------|----------|
| `[a-z]` | Any lowercase letter |
| `[A-Z]` | Any uppercase letter |
| `[0-9]` | Any digit |
| `.` | Any character except newline |
| `\s` | Any whitespace character (space, tab, newline) |
| `\d` | Any digit (same as `[0-9]`) |
| `\w` | Any alphanumeric character (letters, digits, underscore) |

---

## `split()` — Split Strings by Pattern

The **`split()`** function splits a string where the pattern occurs.

```python
print(re.split("\s", "Split on spaces."))
# Output: ['Split', 'on', 'spaces.']
```

Here, `\s` represents **whitespace** characters, so it splits wherever spaces occur.

---

## Summary

| Function | Description |
|-----------|-------------|
| `findall()` | Returns all matches as a list |
| `search()` | Returns the first match as a Match object |
| `sub()` | Replaces matches with another string |
| `split()` | Splits the string at matches of the pattern |

---

Regular expressions are extremely powerful tools for text processing — once you master them, you’ll be able to handle complex search and replace operations efficiently.
