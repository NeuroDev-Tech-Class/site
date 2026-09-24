# Debugging

**Debugging** is an essential skill for any developer.  
It helps you understand why your code isn’t working as expected and how to fix it.  

In Python, there are several debugging techniques, such as using **print statements**, **Python’s built-in debugger (`pdb`)**, or **IDE debugging tools**.

---

## Debugging Using Print Statements

One of the simplest and most common ways to debug is to print out variables at key stages of your program to check their values and flow.

```python
def add_numbers(x, y):
    print(f"Adding {x} and {y}")
    result = x + y
    print(f"The result is {result}")
    return result

add_numbers(5, 3)  # Prints "Adding 5 and 3" and "The result is 8"
```

This method is quick and easy, but for complex code, it can clutter your output and miss deeper issues.

---

## Debugging with IDEs

Most modern IDEs (like **VS Code**, **PyCharm**, or **Thonny**) have powerful built-in debugging tools.

In **VS Code**, for example:

1. Click on the **Run** menu, then select **Start Debugging** or press **F5**.  
2. The **Run and Debug** panel appears on the left, showing variables, call stack, and breakpoints.

---

### Breakpoints

You can add a **breakpoint** by clicking next to a line number in your code editor — a red dot appears.  
When the debugger runs, it pauses execution at these breakpoints, allowing you to:

- Inspect variable values  
- Step through your code line by line  
- Control program flow (continue, step in, step out, etc.)

Breakpoints are especially useful for finding logical errors or verifying that certain sections of code are being executed.

---

Debugging effectively will save you time and help you understand how your code behaves.  
Remember: **Debugging isn’t just about fixing errors — it’s about learning how your code works.**
