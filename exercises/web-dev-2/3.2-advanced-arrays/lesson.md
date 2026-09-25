# JavaScript Advanced Arrays

In this lesson, we’ll explore more **powerful array functions** such as `map()`, `reduce()`, and modern techniques for generating and transforming arrays.

---

## The `map()` Method

The `map()` method creates a **new array** by applying a given function to **each element** of the original array.  
It does **not** change the original array.

```javascript
const array = [1, 4, 9, 16];

// Pass a function to map
const mapped = array.map((x) => x * 2);

console.log(mapped);
// Output: [2, 8, 18, 32]
```

**Explanation:**
- `map()` calls the provided function once per element.
- The returned values form a new array.
- Arrow functions (`=>`) make the syntax concise.

### General Syntax

```javascript
const newArray = oldArray.map((item, index, array) => {
    // return new value for each element
});
```

---

## The `reduce()` Method

The `reduce()` method takes all elements in an array and **reduces** them into a single value (like a sum or total).  
It uses a callback function with two key parameters:
- `accumulator` – stores the running total or result
- `currentValue` – the current element being processed

```javascript
const arr = [1, 2, 3, 4];
const initialValue = 0;

const sumWithInitial = arr.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    initialValue
);

console.log(sumWithInitial);
// Output: 10
```

### General Syntax

```javascript
array.reduce((accumulator, currentValue) => {
    // combine or calculate something
    return accumulator;
}, initialValue);
```

**Common Uses of `reduce()`:**
| Task | Example |
|------|----------|
| Sum numbers | `arr.reduce((a, b) => a + b, 0)` |
| Concatenate strings | `arr.reduce((a, b) => a + b, "")` |
| Count items | `arr.reduce((acc, item) => acc + 1, 0)` |

---

## Array Creation with `Array.from()`

`Array.from()` can generate arrays dynamically using a mapping function.

### Example 1: Array of Squares

```javascript
let squares = Array.from({ length: 10 }, (_, x) => x ** 2);
console.log(squares);
// Output: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

- The first parameter defines the **length** of the array.
- The second parameter is a function that defines what each element should be.

---

### Example 2: Array of Even Numbers

```javascript
let evens = Array.from({ length: 10 }, (_, x) => x).filter(x => x % 2 === 0);
console.log(evens);
// Output: [0, 2, 4, 6, 8]
```

- `.filter()` is used here to select only even numbers from the array.

---

## Nested Loops for Combinations

You can use nested `for...of` loops to create combinations or pairs.

```javascript
let combinations = [];

for (let x of [1, 2, 3]) {
    for (let y of [3, 1, 4]) {
        if (x !== y) {
            combinations.push([x, y]);
        }
    }
}

console.log(combinations);
// Output: [[1,3],[1,4],[2,3],[2,1],[2,4],[3,1],[3,4]]
```

**Explanation:**
- The outer loop takes each element of the first array.
- The inner loop pairs it with each element of the second array.
- The condition `if (x !== y)` prevents pairing identical values.

---

## Summary

| Method / Concept | Description | Example | Output |
|------------------|--------------|----------|---------|
| `map()` | Creates new array by applying a function to each element | `[1, 2, 3].map(x => x * 2)` | `[2, 4, 6]` |
| `reduce()` | Reduces array to a single value | `[1, 2, 3].reduce((a,b)=>a+b,0)` | `6` |
| `filter()` | Filters elements by condition | `[1,2,3].filter(x=>x>1)` | `[2,3]` |
| `Array.from()` | Creates array from length or iterable | `Array.from({length:3}, (_,i)=>i)` | `[0,1,2]` |
| Nested Loops | Generate combinations or pairs | `for (let x of arr1){for (let y of arr2){...}}` | `[[1,3],[1,4],...]` |

---

### Key Takeaways
- `map()` transforms arrays element-by-element.  
- `reduce()` compresses arrays into a single value.  
- `filter()` extracts specific elements.  
- `Array.from()` creates arrays programmatically.  
- Loops can generate combinations, grids, or patterns easily.