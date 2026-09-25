# JavaScript Functions

A **function** is a reusable block of code that performs a task.  
Functions make your code **organized**, **readable**, and **reusable**.

Functions can:
- Take inputs (called **parameters**)
- Return outputs (using **return**)
- Be reused multiple times throughout your program

---

## Defining a Function

A basic function is created using the `function` keyword.

```javascript
function square(x) {
    console.log(x * x); // prints the square of x
}

square(3); // Prints 9
```

---

## Functions Without Return Values

If a function doesn’t use `return`, it still runs code inside —  
but the function’s output value will be **`undefined`**.

```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
}

greet("Roo"); // Prints "Hello, Roo!"
```

---

## Functions With Multiple Parameters

You can include multiple inputs (parameters) separated by commas.

```javascript
function printNameAge(name, age) {
    console.log(`${name} is ${age} years old.`);
}

printNameAge("Alice", 30); // Prints "Alice is 30 years old."
```

---

## Default Parameters

You can give parameters **default values** in case no argument is provided.

```javascript
function repeat(word, times = 3) {
    console.log(word.repeat(times));
}

repeat("hello");  // Prints "hellohellohello"
repeat("bye", 2); // Prints "byebye"
```

---

## Returning Values

Functions can **return** values to be used later in your code.

```javascript
function addNumbers(x, y) {
    let sum = x + y;
    return sum; // output the value
}

let result = addNumbers(5, 7);
console.log(result); // Prints 12
```

A `return` statement ends the function immediately and sends back a value.

---

## Arbitrary Number of Arguments (`...args`)

You can accept **any number of inputs** using **rest parameters** (`...args`).

```javascript
function multiply(...args) {
    let product = 1;
    for (let arg of args) {
        product *= arg;
    }
    return product;
}

console.log(multiply(2, 3, 4)); // Prints 24
```

---

## Functions as Arguments (Higher-Order Functions)

Functions can take **other functions** as inputs or even return them.

```javascript
function doTwice(func, x) {
    return func(func(x));
}

function squareNumber(x) {
    return x * x;
}

console.log(doTwice(squareNumber, 2)); // Prints 16
```

---

## Nested Functions

You can define a function **inside another function**.

```javascript
function outer() {
    console.log("Outer function");
    
    function inner() {
        console.log("Inner function");
    }

    inner();
}

outer();
```

Output:
```
Outer function
Inner function
```

---

## Function Expressions

Functions can be stored in variables — this is called a **function expression**.

```javascript
const squareExpr = function(x) {
    return x * x;
};

console.log(squareExpr(4)); // 16
```

---

## Arrow Functions

Arrow functions provide a **shorter syntax**, often used for simple functions or callbacks.

```javascript
const squareArrow = (x) => x * x;

console.log(squareArrow(4)); // 16
```

You can omit parentheses for a single parameter and omit `{}` when returning one line.

---

## Summary

| Concept | Description | Example |
|----------|--------------|----------|
| `function` | Defines a reusable block of code | `function greet() {}` |
| Parameters | Inputs a function accepts | `function add(x, y)` |
| Default Parameters | Provide fallback values | `function greet(name = "Guest")` |
| Return | Sends back a value | `return x + y` |
| `...args` | Collects unlimited inputs | `function add(...nums)` |
| Function Expression | Store a function in a variable | `const f = function(x){}` |
| Arrow Function | Short function syntax | `const f = x => x * 2` |

---

### Key Takeaways
- Functions can **take parameters** and **return results**.
- Parameters can have **default values**.
- Use `...args` for **flexible argument lists**.
- Functions return `undefined` if no `return` is used.
- You can **nest** functions or **pass them** as arguments.