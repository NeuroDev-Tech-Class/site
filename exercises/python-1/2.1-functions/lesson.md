# Functions

A **function** (sometimes called a *subroutine*) is a block of reusable code that performs a specific task.  
Functions help break down complex programs into smaller, more manageable pieces, making your code easier to read, understand, and maintain.

A function may or may not take one or more inputs, and may or may not return an output value.

---

## Defining a Function

We define a function using the `def` keyword.  
The line that starts with `def` is called the **function header**.

If there are any parameters, they go inside the parentheses `()`, separated by commas.  
The body of the function is indented beneath the header.

```python
def square(x):
    print(x ** 2)  # This function takes a number and prints the square of it.

square(3)  # This will print 9
```

---

## Functions Without Return Values

Sometimes functions don’t return anything. These are often called **void functions**.

```python
def greet(name):
    print(f"Hello, {name}!")

greet("Roo")  # Prints "Hello, Roo!"
```

This function doesn’t return a value — it just performs an action (printing).

---

## Multiple Parameters

Functions can be defined with multiple parameters.

```python
def print_name_age(name, age):
    print(f"{name} is {age} years old.")

print_name_age("Alice", 30)  # Prints "Alice is 30 years old."
```

---

## Default Parameter Values

You can define parameters with default values.  
If no argument is provided for that parameter, the default value is used.

```python
def repeat(word, times=3):
    print(word * times)

repeat("hello")    # Prints "hellohellohello"
repeat("bye", 2)   # Prints "byebye"
```

---

## Returning Values

The `return` keyword outputs a value from a function.  
Once a function returns, it stops executing and sends the result back to where it was called.

```python
def add_numbers(x, y):
    sum = x + y
    return sum

result = add_numbers(5, 7)
print(result)  # Prints 12
```

---

## Arbitrary Number of Arguments

Use `*args` to allow a function to take any number of arguments.  
Inside the function, `args` behaves like a tuple.

```python
def multiply(*args):
    product = 1
    for arg in args:
        product *= arg
    return product

result = multiply(2, 3, 4)
print(result)  # Prints 24
```

---

## Passing Functions as Arguments

Functions can be passed as arguments to other functions.

```python
def do_twice(func, x):
    return func(func(x))

result = do_twice(square, 2)  # Calls the 'square' function twice
print(result)  # Prints 16
```

---

## Nested Functions

Functions can be defined inside other functions — these are called **nested functions**.

```python
def outer():
    print("Outer function")

    def inner():
        print("Inner function")

    inner()

outer()  # Prints "Outer function" and then "Inner function"
```
