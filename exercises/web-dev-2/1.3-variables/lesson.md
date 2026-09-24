# JavaScript Variables and Operations

A **variable** is a user-defined container of data.  
When you declare a variable, you **give it a name** and **assign it a value**.

Variables can:
- Store any data type.
- Be changed or manipulated throughout the program.

To declare a variable, you use the `=` symbol to assign a value.

---

## Declaring Variables

```javascript
const num = 3;
let str = "Hello";
```

There are two main ways to declare variables in JavaScript:

- **`const`** – used for variables that **cannot be changed** later in the code.  
- **`let`** – used for variables that **can be changed** later.

Both are **block-scoped**, meaning they are only usable in the section (block) of code where they are defined.

---

## Printing Variable Values

```javascript
console.log(num);
```

Output:
```
3
```

You can also assign the result of an **expression** to a variable:

```javascript
let num2 = 42 + 27;
```

---

## Mathematical Operations

JavaScript supports all the basic math operations you’d expect:

| Symbol | Operation | Example | Result |
|---------|------------|----------|---------|
| `+` | Addition | `3 + 2` | `5` |
| `-` | Subtraction | `10 - 4` | `6` |
| `*` | Multiplication | `3 * 7` | `21` |
| `/` | Division | `10 / 2` | `5` |
| `**` | Exponentiation | `3 ** 2` | `9` |
| `%` | Modulo (remainder) | `10 % 3` | `1` |

---

## Example: Using Variables in Math

```javascript
let addSub = num + num2 - 23;
let multDiv = num * num2 / 2;
let exp = num ** 3;
let mod = num2 % num;  // corrected from num1 to num

console.log(addSub);
console.log(multDiv);
console.log(exp);
console.log(mod);
```

---

## Operator Order (Precedence)

Operators in JavaScript are executed in this specific order — not necessarily from left to right:

1. **Parentheses** `()`
2. **Exponents** `**`
3. **Multiplication** `*` and **Division** `/`
4. **Addition** `+` and **Subtraction** `-`

Example:
```javascript
console.log(3 + 4 * 2);  // 11, not 14, because * happens before +
console.log((3 + 4) * 2); // 14, parentheses run first
```

---

You now know how to:
- Declare and use variables with `let` and `const`
- Perform mathematical operations
- Understand operator precedence in JavaScript