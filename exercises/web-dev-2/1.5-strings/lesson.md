# JavaScript String Manipulation

Strings are sequences of characters used to represent text.  
JavaScript provides many ways to **manipulate** strings — to combine, slice, format, and transform them.

---

## Concatenation (Combining Strings)

**Concatenation** means joining two or more strings together using the `+` operator.

```javascript
let str1 = "Hello";
let str2 = "world";
let str3 = str1 + " " + str2;
console.log(str3);
```

Output:
```
Hello world
```

You can also concatenate directly inside a `console.log()`:

```javascript
console.log("Good" + " " + "morning!");
```

---

## Slicing (Extracting a Portion of a String)

You can extract parts of a string using the `.slice()` method.

```javascript
let str4 = "JavaScript is awesome";

console.log(str4.slice(0, 10));   // "JavaScript" (characters 0–9)
console.log(str4.slice(11, 13));  // "is" (characters 11–12)
console.log(str4.slice(14, 21));  // "awesome" (characters 14–20)
```

- JavaScript indexing starts at **0**.  
- The **start index** is **inclusive** (included).  
- The **end index** is **exclusive** (not included).

You can also access a single character by index using square brackets:

```javascript
console.log(str4[0]);  // "J"
```

---

## String Formatting (Inserting Variables)

You can insert variables into strings using **template literals**, enclosed in **backticks (`)** and `${}` placeholders.

```javascript
let myName = "Topher";
let age = 26;

console.log(`My name is ${myName} and I'm ${age} years old.`);
```

Output:
```
My name is Topher and I'm 26 years old.
```

This is called **string interpolation** and is the preferred modern method for formatting strings.

---

## New Lines and Escape Characters

The `\n` character creates a new line (line break).

```javascript
console.log("\nI \nlove \nJavaScript");
```

Output:
```
I 
love 
JavaScript
```

Other escape characters include:
| Character | Description |
|------------|-------------|
| `\n` | New line |
| `\t` | Tab space |
| `\\` | Backslash |
| `\"` | Double quote |
| `\'` | Single quote |

---

## Common String Methods

### `.toUpperCase()` and `.toLowerCase()`

Change the case of a string.

```javascript
let myName = "roo";
myName = myName.toUpperCase();
console.log(myName);  // "ROO"

myName = myName.toLowerCase();
console.log(myName);  // "roo"
```

---

### `.trim()`

Removes extra spaces from the beginning and end of a string.

```javascript
let game = "Minecraft     ";
console.log(game + "is fun.");  // "Minecraft     is fun."

game = game.trim();
console.log(game + "is fun.");  // "Minecraftis fun."
```

---

### `.length`

Returns the number of characters in a string.

```javascript
let sentence = "The quick brown fox jumps over the lazy dog.";
let len = sentence.length;

console.log(len);
```

Output:
```
44
```

---

## Summary

| Method | Description | Example |
|--------|--------------|----------|
| `+` | Concatenate strings | `"Hi" + " there"` → `"Hi there"` |
| `.slice(start, end)` | Extract part of a string | `"Hello".slice(1, 3)` → `"el"` |
| `.toUpperCase()` | Convert to uppercase | `"hi".toUpperCase()` → `"HI"` |
| `.toLowerCase()` | Convert to lowercase | `"HI".toLowerCase()` → `"hi"` |
| `.trim()` | Remove spaces from ends | `" test ".trim()` → `"test"` |
| `.length` | Get number of characters | `"Hello".length` → `5` |

---

You now know how to:
- Combine and slice strings  
- Insert variables dynamically  
- Use escape characters  
- Apply common string methods for formatting and cleaning text