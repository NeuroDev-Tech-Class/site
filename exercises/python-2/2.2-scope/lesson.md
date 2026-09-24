# Scope

## Overview

Scope refers to the region of the code where a variable is accessible. Understanding scope is crucial for writing clear and maintainable code. Python follows a specific hierarchy to determine which variables are accessible at any given point in your program.

### The Four Types of Scope

1. **Local Scope**
2. **Enclosing Scope** (Non-local)
3. **Global Scope**
4. **Built-in Scope**

---

## Local Scope

Variables declared inside a function are in the **local scope** and can only be accessed within that function.

```python
def my_function():
    local_var = "This is a local variable"
    print(local_var)    # Output: This is a local variable

my_function()
# print(local_var)      # ❌ Error: local_var is not accessible outside the function
```

### Key Points:
- Local variables exist only within the function where they're defined
- They are created when the function is called and destroyed when the function returns
- Each function call creates new local variables
- Attempting to access a local variable outside its function raises a `NameError`

---

## Enclosing Scope (Non-local)

This is also known as **non-local scope**. Variables in enclosing functions can be accessed in nested functions.

```python
def outer_function():
    outer_var = "This is an outer variable"

    def inner_function():
        inner_var = "This is an inner variable"
        print(outer_var)    # Output: This is an outer variable
        print(inner_var)    # Output: This is an inner variable
    
    # Notice how outer_var is accessible within the inner_function
    # Pay attention to indentation, it's how you can tell scope
    
    inner_function()
    # print(inner_var)      # ❌ Error: inner_var is not accessible outside inner_function

outer_function()
# Output: This is an outer variable; This is an inner variable
```

### Key Points:
- Enclosing scope applies to nested functions
- Inner functions can access variables from outer functions
- Outer functions **cannot** access variables from inner functions
- Indentation determines the scope hierarchy

---

## Global Scope

Variables declared outside of all functions are in the **global scope** and can be accessed from any function within the same module.

```python
global_var = "This is a global variable"

def another_function():
    print(global_var)  # Output: This is a global variable

another_function()
```

### Key Points:
- Global variables are accessible from anywhere in the module
- They exist for the entire lifetime of the program
- Global variables can be read from any function without special keywords

### Modifying Global Variables

To **modify** a global variable within a function, you must use the `global` keyword:

```python
counter = 0

def increment_counter():
    global counter  # Declare that we're modifying the global variable
    counter += 1

increment_counter()
increment_counter()
print(counter)  # Output: 2
```

### Important:
- Without the `global` keyword, Python treats `counter = ...` as creating a new local variable
- The `global` keyword tells Python to use the global variable instead
- Use the `global` keyword sparingly, as it can make code harder to follow

---

## Built-in Scope

**Built-in scope** includes built-in functions and exceptions provided by Python. Functions like `len()`, `print()`, `input()`, and more are always available without needing to import anything.

```python
print(len("Hello, World!"))  # Output: 13
print(max([1, 5, 3, 9, 2]))  # Output: 9
```

### Common Built-in Functions:
- `print()`, `input()`, `len()`, `max()`, `min()`, `sum()`, `range()`, `type()`, and many others

### Key Points:
- Built-in scope is the outermost scope
- Built-in names are always accessible
- Built-in functions are provided by the Python standard library
- You can override built-in names (not recommended!) by using them as variable names

---

## The LEGB Rule

Python follows the **LEGB rule** to resolve variable scope. When looking for a variable, Python searches in this order:

### LEGB Stands For:

| Letter | Scope | Description |
|--------|-------|-------------|
| **L** | **Local** | Variables defined within a function |
| **E** | **Enclosing** | Variables in the local scope of enclosing functions |
| **G** | **Global** | Variables defined at the module level |
| **B** | **Built-in** | Built-in functions and exceptions |

### Example:

```python
def scope_demo():
    local_var = "Local"
    
    def inner_demo():
        enclosing_var = "Enclosing"
        print(local_var)        # Found in Local scope (from outer function)
        print(enclosing_var)    # Found in Enclosing scope
    
    inner_demo()

scope_demo()
# Output: Local
#         Enclosing
```

### How Python Searches:

1. **L**: Checks if the variable is local to the current function
2. **E**: Checks if the variable is in an enclosing function's scope
3. **G**: Checks if the variable is global (at module level)
4. **B**: Checks if the variable is a built-in name
5. If not found: Raises a `NameError`

---

## Best Practices for Scope

1. **Keep Variables Local**: Use local variables whenever possible to avoid side effects
2. **Minimize Global Variables**: Globals make code harder to test and maintain
3. **Use the `global` Keyword Sparingly**: It makes code less readable
4. **Use Descriptive Names**: Makes it clear which scope a variable belongs to
5. **Understand LEGB**: Always remember Python's scope resolution order
6. **Avoid Variable Shadowing**: Don't reuse variable names in different scopes unnecessarily

### Example of Good Practice:

```python
# ✅ Good: Functions are self-contained
def calculate_total(items):
    total = 0  # Local variable
    for item in items:
        total += item
    return total

result = calculate_total([1, 2, 3])
print(result)  # Output: 6
```

---

## Summary

- **Scope** determines where variables are accessible in your code
- Python has **four scope levels**: Local, Enclosing, Global, and Built-in
- Use the **LEGB rule** to understand how Python resolves variable names
- Always use the `global` keyword when modifying global variables within functions
- Write code with minimal scope (prefer local variables) for better maintainability
- Understanding scope prevents bugs and makes your code more predictable

