# JavaScript Loops

Loops are a fundamental programming concept that allow you to **repeat code** multiple times.  
They’re often used to:
- Iterate through arrays and objects
- Repeat actions until a condition is met
- Perform calculations repeatedly

---

## For Loops

A **for loop** repeats a block of code a specific number of times.

### Syntax

```javascript
for (initialization; condition; increment) {
    // code to execute each loop
}
```

- **Initialization** – sets the starting value of the loop counter  
- **Condition** – the loop runs as long as this is `true`  
- **Increment** – how the counter changes after each loop  

---

### Example 1: Basic For Loop

```javascript
let total = 0;

for (let i = 0; i < 10; i++) {
    total += 1;  // Increment total each time
}

console.log(total);
```

**Explanation:**
- `i = 0`: The loop starts at 0.
- `i < 10`: The loop runs as long as `i` is less than 10.
- `i++`: After each loop, `i` increases by 1.
- The loop runs **10 times**.

---

### Example 2: For Loop with Variable Length

```javascript
let total = 0;
const length = 20;

for (let i = 0; i < length; i += 2) {
    total += 1;
}
```

Here, `i` increases by 2 each time instead of 1.  
The loop runs **10 times** because it goes 0, 2, 4, 6, 8, 10, 12, 14, 16, 18.

> 🧠 Tip: `i++` is the most common increment pattern, but you can adjust it as needed.

---

## Iterating Through Arrays and Objects

You’ll often use loops to go through each element in an array or key-value pair in an object.

### Example 1: Array Loop (`for...of`)

```javascript
let arr = [1, 2, 3, 4, 5];

for (let item of arr) {
    console.log(item);
}
```

**Output:**
```
1
2
3
4
5
```

- `for...of` loops through **values** in an array.

---

### Example 2: Object Loop (`for...in`)

```javascript
let person = { name: "Alice", age: 25, city: "Paris" };

for (let key in person) {
    console.log("for...in:", key, "=", person[key]);
}
```

**Output:**
```
for...in: name = Alice
for...in: age = 25
for...in: city = Paris
```

- `for...in` loops through **keys** in an object.

---

## While Loops

A **while loop** runs as long as a condition remains `true`.

### Example 1: Basic While Loop

```javascript
let n = 10;

while (n > 0) {
    n -= 1;
}
```

This loop will execute **10 times**, decreasing `n` each time until `n` reaches 0.

> ⚠️ Be careful! If the condition never becomes `false`, the loop will **never stop** (infinite loop).

---

### Example 2: Do...While Loop

A **do...while** loop always runs **at least once**, even if the condition is false initially.

```javascript
let i = 0;

do {
    console.log(i);
    i++;
} while (i < 3);
```

**Output:**
```
0
1
2
```

- The `do` block executes once before checking the condition.

---

## Loop Control Statements

JavaScript provides two main statements to control how loops behave:

---

### `break`

Stops the loop immediately and moves on to the code **after** the loop.

```javascript
for (let i = 0; i < 10; i++) {
    if (i === 5) {
        break;  // Loop stops when i = 5
    }
    console.log(i);
}
```

**Output:**
```
0
1
2
3
4
```

---

### `continue`

Skips the rest of the current iteration and jumps to the next one.

```javascript
for (let i = 0; i < 5; i++) {
    if (i === 2) {
        continue;  // Skip 2
    }
    console.log(i);
}
```

**Output:**
```
0
1
3
4
```

---

## Summary

| Loop Type | Purpose | Example |
|------------|----------|----------|
| `for` | Runs code a set number of times | `for (let i = 0; i < 10; i++)` |
| `for...of` | Loops through values in an array | `for (let item of arr)` |
| `for...in` | Loops through keys in an object | `for (let key in obj)` |
| `while` | Loops while condition is true | `while (x > 0)` |
| `do...while` | Always runs at least once | `do { ... } while (x > 0)` |
| `break` | Stops loop entirely | `if (x === 5) break;` |
| `continue` | Skips to next iteration | `if (x === 5) continue;` |

---

### Key Takeaways
- **For loops** are the most common for repeating a set number of times.  
- **While loops** run until a condition is false.  
- Use **`for...of`** for arrays and **`for...in`** for objects.  
- Use **`break`** to stop a loop early and **`continue`** to skip a specific iteration.