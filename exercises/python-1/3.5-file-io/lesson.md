# File I/O

Python provides a built-in **`open()`** function for working with files.  
It takes two main arguments:  
1. The **name (or path)** of the file.  
2. The **mode** in which to open it.

---

## File Modes

| Mode | Description |
|------|--------------|
| `'r'` | Read mode (default) — opens a file for reading. Raises an error if the file doesn’t exist. |
| `'w'` | Write mode — creates a new file or overwrites an existing one. |
| `'a'` | Append mode — opens a file for writing but doesn’t erase existing content. |
| `'r+'` | Read and write mode. |
| `'b'` | Binary mode modifier (e.g., `'rb'`, `'wb'`). |

---

## Reading from a File

The simplest way to read a file is with **read mode (`'r'`)**:

```python
with open('example.txt', 'r') as f:
    content = f.read()
    print(content)
```

### How It Works

- `with` is used for **context management** — it ensures the file is automatically closed after use.  
- `f` is the **file object**, and `f.read()` reads the **entire file** as a string.  
- If the file doesn’t exist, Python raises a `FileNotFoundError`.

Example absolute path (Windows):

```python
with open('C:\Users\username\GitHub\TechClass\Python-I\unit3-advanced\example.txt', 'r') as f:
    content = f.read()
```

> **Note:** Use double backslashes (`\\`) in file paths, since a single backslash is an escape character.

---

## Writing to a File

To **write** text to a file, use **write mode (`'w'`)**:

```python
with open('output.txt', 'w') as f:
    f.write("Hello, world!")
```

- If the file doesn’t exist, it is **created**.  
- If the file already exists, its contents are **overwritten**.  
- `f.write()` writes a string to the file.

---

## Appending to a File

To **add new content** to an existing file without overwriting it, use **append mode (`'a'`)**:

```python
with open('output.txt', 'a') as f:
    f.write("\nThis is an additional line.")
```

- `\n` creates a **newline**.  
- After running this code, `output.txt` will contain two lines:

```
Hello, world!
This is an additional line.
```

---

## Best Practices

- Always use `with open()` to handle files — it ensures they are closed automatically.  
- Handle exceptions like `FileNotFoundError` when reading files.  
- Use absolute paths when working outside your current directory.  

---

### Example: Safe File Reading

```python
try:
    with open('data.txt', 'r') as f:
        data = f.read()
        print(data)
except FileNotFoundError:
    print("Error: File not found.")
```

---

File I/O is a foundational concept in Python — mastering it allows you to work with logs, data files, configuration files, and much more.
