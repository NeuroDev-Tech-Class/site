# JavaScript Syntax

Each line in JavaScript contains instructions for the computer to execute.  
Similar to Python, JavaScript executes instructions **line-by-line from top to bottom.**

Unlike Python, indentation at the beginning of each line is for readability only.  
However, it is standard practice to use indentation.

---

## Comments in JavaScript

In JavaScript, we use special symbols to make comments — these are lines that the computer **ignores** when running the program.

```javascript
// This is a single-line comment

/*
This is a multi-line comment
It can span several lines
*/
```

Comments are used by developers to **explain what sections of code do.**  
They make the code easier to read and understand — both for you and for others.

In this course, comments will be used often to help explain new coding concepts.

---

## What Is JavaScript Used For?

JavaScript is primarily used for **web development**.  
When you browse websites, most interactive or dynamic features (buttons, animations, pop-ups, etc.) are created using JavaScript.

This first course will help you:
- Get familiar with JavaScript syntax.
- Learn how to run code.
- Later, use it to make **webpages and interactive projects**.

---

## Printing to the Console

You can print (output) messages in JavaScript using `console.log()`:

```javascript
console.log("Hello World");
```

This line **prints text to the console** — not the screen of a website, but the developer console where you can test your code.

### Try It Yourself

1. Open your terminal.
2. Type:
   ```bash
   node
   ```
   This opens the Node.js environment.
3. Copy and paste:
   ```javascript
   console.log("Hello World");
   ```
   Press **Enter** to see the output.

---

## Expressions in `console.log()`

You can also perform calculations inside `console.log()`:

```javascript
console.log(2 + 4);
```

This prints:
```
6
```

Anything placed inside the parentheses will be evaluated before printing.

---

## The Semicolon (`;`)

Notice the **semicolon** at the end of each line:

```javascript
console.log("Hello World");
console.log(2 + 4);
```

In JavaScript, semicolons are used to **end a statement**.  
They tell the computer where one instruction stops and the next one begins.

While not always required, it’s good practice to include them — especially as your programs become more complex.

---

You now know:
- How to write and run JavaScript code.
- How comments work.
- How to print results to the console.
- Why semicolons matter in JavaScript.
