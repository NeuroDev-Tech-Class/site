# JavaScript Arrays

An **array** is a type of data structure in JavaScript used to **store a collection of items**.  
Arrays are:
- **Ordered** – items have a specific position (index)
- **Mutable** – items can be changed
- **Allow duplicates**

---

## Creating an Array

```javascript
let fruits = ['apple', 'banana', 'cherry'];
```

---

## Accessing Items in an Array

Array items are accessed using **index numbers**, starting at **0**.

```javascript
console.log(fruits[0]);  // 'apple'
console.log(fruits[1]);  // 'banana'
console.log(fruits[fruits.length - 1]); // 'cherry' (last item)
```

---

## Modifying an Array

You can change a specific item by assigning a new value to an index.

```javascript
fruits[1] = 'orange';
console.log(fruits); // ['apple', 'orange', 'cherry']
```

---

## Looping Through an Array

You can loop through arrays using several methods.

### 1. Traditional `for` Loop
```javascript
for (let i = 0; i < fruits.length; i++) {
    console.log(fruits[i]);
}
```

### 2. `for...of` Loop (cleaner)
```javascript
for (let fruit of fruits) {
    console.log(fruit);
}
```

---

## Checking if an Item Exists

Use the `.includes()` method to see if an element is in the array.

```javascript
if (fruits.includes('apple')) {
    console.log('Yes, apple is in the fruits array.');
}
```

---

## Adding and Removing Items

### Add to the End
```javascript
fruits.push('banana');
console.log(fruits); // ['apple', 'orange', 'cherry', 'banana']
```

### Remove from the End
```javascript
fruits.pop();
console.log(fruits); // ['apple', 'orange', 'cherry']
```

### Add to the Beginning
```javascript
fruits.unshift('kiwi');
console.log(fruits); // ['kiwi', 'apple', 'orange', 'cherry']
```

### Remove from the Beginning
```javascript
fruits.shift();
console.log(fruits); // ['apple', 'orange', 'cherry']
```

---

## Removing a Specific Item

Use `.indexOf()` to find the index of an item, and `.splice()` to remove it.

```javascript
let index = fruits.indexOf('cherry');
if (index !== -1) {
    fruits.splice(index, 1);
}
console.log(fruits); // ['apple', 'orange']
```

---

## Sorting and Reversing

### Sort Alphabetically
```javascript
fruits.sort();
console.log(fruits); // ['apple', 'orange']
```

### Reverse Order
```javascript
fruits.reverse();
console.log(fruits); // ['orange', 'apple']
```

---

## Slicing an Array

`.slice()` creates a **copy** of a section of an array without changing the original.

```javascript
let numbers = [0, 1, 2, 3, 4, 5];

let slice1 = numbers.slice(2, 4); // [2, 3]
let slice2 = numbers.slice(0, 3); // [0, 1, 2]
let slice3 = numbers.slice(3);    // [3, 4, 5]

console.log(slice1);
console.log(slice2);
console.log(slice3);
```

---

## Summary

| Method | Description | Example |
|---------|--------------|----------|
| `push()` | Add to the end | `arr.push('x')` |
| `pop()` | Remove from the end | `arr.pop()` |
| `unshift()` | Add to the beginning | `arr.unshift('x')` |
| `shift()` | Remove from the beginning | `arr.shift()` |
| `indexOf()` | Find position of an element | `arr.indexOf('x')` |
| `splice()` | Remove or replace elements | `arr.splice(2, 1)` |
| `slice()` | Copy a portion of an array | `arr.slice(1, 3)` |
| `sort()` | Sort items | `arr.sort()` |
| `reverse()` | Reverse the array | `arr.reverse()` |
| `includes()` | Check if item exists | `arr.includes('x')` |

---

### Key Takeaways
- Arrays are ordered lists that can hold multiple data types.
- Use indexes to access or modify elements.
- Use array methods to add, remove, or rearrange items.
- `slice()` creates copies; `splice()` changes the original array.