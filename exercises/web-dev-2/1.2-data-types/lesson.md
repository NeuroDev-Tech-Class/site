# JavaScript Data Types

A **data type** is a classification of data that tells the computer **how to interpret and use it.**

JavaScript has several basic data types that you’ll use frequently.

---

## Integers (`int`)

**Integers** are whole numbers (no decimals).

```javascript
console.log(42);
console.log(3 + 9);
console.log(-15);
```

Output:
```
42
12
-15
```

---

## Floats (Floating Point Numbers)

**Floats** are numbers that include a decimal point.

```javascript
console.log(3.1415);
console.log(10.7 * 0.5);
console.log(-17.3);
```

Output:
```
3.1415
5.35
-17.3
```

---

## Strings (`str`)

**Strings** are text values made up of characters enclosed in quotes.  
They can use either **single (`'`)** or **double (`"`)** quotes.

```javascript
console.log("Hello World!");
console.log('Th1s 1s c00l');
console.log("#$&*(@#$*&^");
```

Output:
```
Hello World!
Th1s 1s c00l
#$&*(@#$*&^
```

---

## Booleans

**Booleans** are logical values that can only be **true** or **false**.

```javascript
console.log(true);
console.log(false);
console.log(3 > 2);
```

Output:
```
true
false
true
```

---

## Checking Data Types with `typeof`

You can use the `typeof` operator to check what kind of data type a value is.

```javascript
typeof "Hello";
typeof 3;
typeof 4.654;
typeof true;
```

Output:
```
'string'
'number'
'number'
'boolean'
```

---

You now know the four main data types in JavaScript:
1. **Integers** – whole numbers  
2. **Floats** – numbers with decimals  
3. **Strings** – text in quotes  
4. **Booleans** – true or false values

Use `typeof` to quickly identify the data type of any value in your code.