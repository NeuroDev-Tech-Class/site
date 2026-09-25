# Modules and Libraries

A **Python module** is a single `.py` file that defines functions, classes, and variables that can be used in other Python files.  
A **library** is a collection of multiple modules grouped together to provide related functionality.

---

## Built-in Libraries

Python comes with a large number of built-in modules called the **standard library**.  
These provide a wide range of functionality — from math operations to working with files, networking, and more.

### Example: Using the `math` Module

```python
import math

print(math.sqrt(16))  # prints "4.0"
```

Here, `sqrt` is a function from the `math` module.  
To use it, we must import the module first.

---

### Importing Specific Functions

Instead of importing the entire module, you can import only what you need:

```python
from math import sqrt

print(sqrt(16))  # prints "4.0"
```

This imports only the `sqrt` function, allowing us to use it directly without the `math.` prefix.  
However, other functions from the `math` module won’t be available unless explicitly imported.

---

### Example: Using the `random` Module

The built-in **`random`** module allows us to generate random numbers.

```python
import random

# This prints a random integer between 1 and 10
print(random.randint(1, 10))
```

The `randint()` function generates a random integer within a specified range.

---

## Third-Party Libraries

Beyond the standard library, the Python community has created **thousands of third-party libraries**.  
These libraries don’t come with Python by default but can be installed using **pip**.

### Installing a Third-Party Library

To install a package, type the following command in your terminal or command prompt:

```
pip install requests
```

### Example: Using the `requests` Library

`requests` is a popular third-party library used to make HTTP requests.

```python
import requests

response = requests.get('https://www.example.com')
print(response.status_code)  # prints the HTTP status code
```

This sends a GET request to the specified URL and prints the resulting status code.

---

## Import Conventions

It’s standard practice to import all modules **at the top of your Python file**.  
This makes it easy to see all dependencies in one place and improves readability.

---

### Summary

- **Modules**: Individual `.py` files that contain code you can reuse.  
- **Libraries**: Collections of modules providing related features.  
- **Standard Library**: Comes built into Python.  
- **Third-party Libraries**: Installed via `pip` and developed by the Python community.
