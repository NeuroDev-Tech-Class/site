# JavaScript Exceptions

**Exceptions** are errors that occur during the execution of a program.  
Instead of letting the entire program crash, JavaScript allows us to **catch** these errors and handle them gracefully.

---

## Handling Errors with `try...catch`

The `try...catch` statement lets you test a block of code for errors.

```javascript
try {
    // Code that may throw an error
} catch (error) {
    // Code that runs if an error occurs
}
```

---

### Example: Basic `try...catch`

```javascript
try {
    let result = 10 / 0;
    console.log(result);
    throw new Error("This is a custom error!");
} catch (error) {
    console.log("An error occurred: " + error.message);
}
```

**Output:**
```
Infinity
An error occurred: This is a custom error!
```

Here’s what happens:
- The code inside `try` runs normally.
- When `throw new Error(...)` is executed, it triggers an exception.
- The `catch` block catches that exception and prints an error message.

---

## The `finally` Block

The `finally` block runs **no matter what happens** — whether an error occurs or not.

```javascript
try {
    console.log("Opening file...");
    throw new Error("File not found");
} catch (error) {
    console.log("Error: " + error.message);
} finally {
    console.log("Closing file... (always runs)");
}
```

**Output:**
```
Opening file...
Error: File not found
Closing file... (always runs)
```

Even though an error occurred, the `finally` block still ran.

---

## Throwing Errors Manually

You can create and throw your own custom errors using the `throw` keyword.

```javascript
function divide(a, b) {
    if (b === 0) {
        throw new Error("Cannot divide by zero");
    }
    return a / b;
}

try {
    console.log(divide(10, 2)); // 5
    console.log(divide(10, 0)); // throws error
} catch (error) {
    console.log("Caught: " + error.message);
}
```

**Output:**
```
5
Caught: Cannot divide by zero
```

This is useful when you want to enforce your own rules and stop execution under certain conditions.

---

## Nested `try...catch`

You can have `try...catch` blocks inside other ones.  
This allows you to handle errors locally and rethrow them to outer layers if needed.

```javascript
try {
    try {
        JSON.parse("{ bad json }");
    } catch (innerError) {
        console.log("Inner error: " + innerError.message);
        throw innerError; // rethrow the error to outer catch
    }
} catch (outerError) {
    console.log("Outer error: " + outerError.message);
}
```

**Output:**
```
Inner error: Unexpected token b in JSON at position 2
Outer error: Unexpected token b in JSON at position 2
```

The inner `catch` handled the error first, then passed it along to the outer `catch`.

---

## Summary

| Keyword | Description | Example |
|----------|--------------|----------|
| `try` | Code that may throw an error | `try { riskyCode(); }` |
| `catch` | Code that runs when an error occurs | `catch (err) { console.log(err); }` |
| `finally` | Code that always runs (optional) | `finally { cleanup(); }` |
| `throw` | Manually trigger an error | `throw new Error("Bad input");` |

---

### Key Takeaways
- Use `try...catch` to prevent errors from crashing your program.  
- `finally` always runs, whether or not an error occurred.  
- Use `throw` to manually create and raise your own errors.  
- Nested `try...catch` blocks allow fine-grained error handling.  
- Always include meaningful error messages to make debugging easier.