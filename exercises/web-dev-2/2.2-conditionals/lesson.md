# JavaScript If Statements

**If statements** are used to make decisions in code.  
They check whether a condition (a Boolean expression) is `true` or `false`, and then execute specific code depending on the result.

---

## Basic Structure

In JavaScript, an `if` statement has this general structure:

```javascript
if (condition) {
    // Code to run if condition is true
} else if (anotherCondition) {
    // Code to run if the first condition is false and this one is true
} else {
    // Code to run if none of the above conditions are true
}
```

Each condition is written inside **parentheses `()`**, and each block of code is enclosed in **curly braces `{}`**.

---

## Example 1: Simple If/Else

```javascript
let randNum = Math.random() * 20;

if (randNum > 10) {
    console.log("It's more than 10");
} else {
    console.log("It's less than 10");
}
```

Here:
- `Math.random()` generates a random number between **0** and **1**.
- Multiplying it by **20** gives a number between **0** and **20**.
- The condition checks whether that number is greater than **10**.

---

## Example 2: Using Else If

`else if` allows you to check multiple conditions in order.

```javascript
let randNum2 = Math.random() * 20 - 10;

if (randNum2 > 0) {
    console.log("The integer is positive");
} else if (randNum2 == 0) {
    console.log("The integer is zero");
} else {
    console.log("The integer is negative");
}
```

In this example:
- If the number is greater than 0, it’s positive.
- If it equals 0, it’s zero.
- Otherwise, it’s negative.

---

## Example 3: If Without Else

Sometimes you only want to check a condition without needing an “else.”

```javascript
if (randNum2 == 5) {
    randNum2 += 1;
}
```

This simply adds 1 to `randNum2` **only if** its value is 5.

---

## Example 4: Single-Line If Statements

If the code inside your `if` or `else` is very short, you can write it all on one line:

```javascript
if (randNum == 4) randNum -= 1;
else randNum = 4;
```

This is functionally identical to using curly braces but takes up less space.  
Use this style only when your code is simple — readability is more important than brevity.

---

## Example 5: Ternary Operator

A **ternary operator** is a shorter way to write an `if/else` statement.  
It uses the following syntax:

```javascript
(condition) ? expressionIfTrue : expressionIfFalse;
```

### Example:
```javascript
(randNum2 == 4) ? randNum2 -= 1 : randNum2 = 4;
```

This means:
- If `randNum2` equals 4, subtract 1 from it.
- Otherwise, set it equal to 4.

Ternary operators are great for short, clear conditional expressions.

---

## Summary

| Keyword / Symbol | Description | Example |
|------------------|-------------|----------|
| `if` | Runs code if condition is true | `if (x > 5) console.log("Big");` |
| `else if` | Tests a new condition if previous one failed | `else if (x == 5)` |
| `else` | Runs code if all above conditions are false | `else console.log("Small");` |
| `? :` | Ternary operator for short if/else | `(x > 5) ? "Big" : "Small"` |

---

### Key Takeaways
- Use `if`, `else if`, and `else` to control program flow.
- Curly braces `{}` are required for multi-line blocks.
- The ternary operator provides a compact alternative for short conditions.
- `Math.random()` is useful for generating random values to test conditions.