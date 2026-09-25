# JavaScript Objects

Objects in JavaScript are **collections of key–value pairs**.  
They let you store and organize data with meaningful labels (called **keys**).  

- Keys are also called **properties**.  
- Values can be **any data type** — numbers, strings, arrays, functions, or even other objects!

---

## Creating an Object

```javascript
let person = {
    name: 'Alice',
    age: 25,
    isStudent: true
};
```

Here:
- `name`, `age`, and `isStudent` are **keys** (properties).
- `'Alice'`, `25`, and `true` are their corresponding **values**.

---

## Accessing Properties

You can access object properties using **dot notation** or **bracket notation**.

```javascript
console.log(person.name);     // 'Alice'
console.log(person['age']);   // 25
```

---

## Adding a New Property

```javascript
person.city = 'New York';
console.log(person);
// { name: 'Alice', age: 25, isStudent: true, city: 'New York' }
```

---

## Updating a Property

```javascript
person.age = 26;
console.log(person.age);  // 26
```

---

## Deleting a Property

```javascript
delete person.isStudent;
console.log(person);
// { name: 'Alice', age: 26, city: 'New York' }
```

---

## Looping Through an Object

You can use a **for...in** loop to iterate through all keys in an object.

```javascript
for (let key in person) {
    console.log(key, person[key]);
}
```

**Output:**
```
name Alice
age 26
city New York
```

---

## Checking if a Property Exists

```javascript
if ('name' in person) {
    console.log('Yes, name exists in person.');
}
```

---

## Nested Objects

Objects can contain other objects, forming a **nested structure**.

```javascript
let student = {
    name: 'Bob',
    grades: {
        math: 90,
        science: 85
    }
};

console.log(student.grades.math); // 90
```

---

## Objects with Functions (Methods)

Objects can also store **functions**, which are then called **methods**.

```javascript
let dog = {
    name: 'Rex',
    bark: function() {
        console.log('Woof!');
    }
};

dog.bark(); // 'Woof!'
```

You can also write this more simply using arrow function syntax:

```javascript
let cat = {
    name: 'Luna',
    meow() {
        console.log('Meow!');
    }
};

cat.meow(); // 'Meow!'
```

---

## Useful Built-In Object Methods

JavaScript provides several helpful methods for working with objects.

### `Object.keys()`
Returns an array of all **keys** in the object.

```javascript
console.log(Object.keys(person));
// ['name', 'age', 'city']
```

### `Object.values()`
Returns an array of all **values**.

```javascript
console.log(Object.values(person));
// ['Alice', 26, 'New York']
```

### `Object.entries()`
Returns an array of **[key, value]** pairs.

```javascript
console.log(Object.entries(person));
// [['name', 'Alice'], ['age', 26], ['city', 'New York']]
```

---

## Summary

| Method / Concept | Description | Example |
|------------------|--------------|----------|
| Dot notation | Access a property | `person.name` |
| Bracket notation | Access using a string key | `person['age']` |
| Add property | Add a new key/value | `person.city = 'NYC'` |
| Update property | Change an existing value | `person.age = 30` |
| Delete property | Remove a key/value pair | `delete person.isStudent` |
| `for...in` | Loop through all keys | `for (let key in obj)` |
| `in` | Check if key exists | `'name' in person` |
| `Object.keys()` | Get all keys | `Object.keys(obj)` |
| `Object.values()` | Get all values | `Object.values(obj)` |
| `Object.entries()` | Get [key, value] pairs | `Object.entries(obj)` |

---

### Key Takeaways
- Objects store data as **key–value pairs**.
- Use dot or bracket notation to access or modify properties.
- Objects can contain **nested data** or **functions (methods)**.
- Use built-in methods like `Object.keys()` and `Object.entries()` for iteration and inspection.