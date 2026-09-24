# JavaScript Comparison, Logic, and Assignment Operators

In this lesson, we’ll cover how to compare values, combine conditions, and assign values efficiently in JavaScript.

---

## Comparison Operators

Comparison operators are used to **compare two values** and return a **Boolean** result (`true` or `false`).

```javascript
let x = 5;
let y = 10;

console.log(x == y);   // Equal to: true if x is equal to y
console.log(x != y);   // Not equal to: true if x is not equal to y
console.log(x > y);    // Greater than: true if x is greater than y
console.log(x < y);    // Less than: true if x is less than y
console.log(x >= y);   // Greater than or equal to: true if x >= y
console.log(x <= y);   // Less than or equal to: true if x <= y
```

| Operator | Meaning | Example | Result |
|-----------|----------|----------|---------|
| `==` | Equal to (values only) | `5 == "5"` | `true` |
| `!=` | Not equal to | `5 != 3` | `true` |
| `>` | Greater than | `10 > 5` | `true` |
| `<` | Less than | `2 < 4` | `true` |
| `>=` | Greater than or equal to | `10 >= 10` | `true` |
| `<=` | Less than or equal to | `3 <= 5` | `true` |

---

## Strict Equality

JavaScript also has a **strict equality operator (`===`)** that checks **both value and data type**.

```javascript
x = 5;
y = "5";

console.log(x === y);  // false — different data types (number vs string)
```

| Operator | Meaning | Example | Result |
|-----------|----------|----------|---------|
| `===` | Equal **value and** type | `5 === "5"` | `false` |
| `!==` | Not equal **value or** type | `5 !== "5"` | `true` |

---

## Comparing Strings

When comparing strings, JavaScript uses the **ASCII value** of each character.  
This means it compares them in **alphabetical order** (A < B < C < ... < Z).

```javascript
console.log("X" > "Y");         // false — "X" is less than "Y"
console.log("Apple" < "Zebra"); // true — "A" comes before "Z"
```

---

## Logical Operators

Logical operators combine or modify conditions.

```javascript
x = 5;
y = 10;
let z = 15;

// AND (&&): true if both conditions are true
console.log(x < y && y < z);  // true

// OR (||): true if at least one condition is true
console.log(x > y || y < z);  // true

// NOT (!): reverses the truth value
console.log(!(x > y));        // true (because x > y is false)
```

| Operator | Name | Description | Example | Result |
|-----------|------|-------------|----------|---------|
| `&&` | AND | True if both conditions are true | `5 < 10 && 10 < 15` | `true` |
| `\|\|` | OR | True if at least one condition is true | `5 > 10 || 10 < 15` | `true` |
| `!` | NOT | Reverses true/false | `!(5 > 10)` | `true` |

---

## Assignment Operators

Assignment operators are used to **assign values** to variables.  
They can also **combine arithmetic** with assignment.

```javascript
x = 5;  // Basic assignment

x += 3;  // Add AND: x = x + 3
x -= 2;  // Subtract AND: x = x - 2
x *= 4;  // Multiply AND: x = x * 4
x /= 2;  // Divide AND: x = x / 2
x %= 3;  // Modulus AND: x = x % 3
x **= 2; // Exponent AND: x = x ** 2

console.log(x);
```

| Operator | Description | Example | Equivalent To |
|-----------|--------------|----------|----------------|
| `=` | Assign | `x = 5` | — |
| `+=` | Add and assign | `x += 3` | `x = x + 3` |
| `-=` | Subtract and assign | `x -= 2` | `x = x - 2` |
| `*=` | Multiply and assign | `x *= 4` | `x = x * 4` |
| `/=` | Divide and assign | `x /= 2` | `x = x / 2` |
| `%=` | Modulus and assign | `x %= 3` | `x = x % 3` |
| `**=` | Exponent and assign | `x **= 2` | `x = x ** 2` |

---

You now know how to:
- Compare values using comparison operators
- Use logical operators to combine conditions

- Use assignment operators to simplify math in your code

