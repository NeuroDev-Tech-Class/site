# JavaScript Advanced Strings

In this lesson, we’ll explore **advanced string manipulation techniques** in JavaScript.  
These methods help you search, modify, split, and convert strings efficiently.

---

## The `includes()` Method

The `.includes()` method performs a **case-sensitive** search to check if one string contains another.  
It returns `true` if found, or `false` otherwise.

```javascript
const sentence = "The quick brown fox jumps over the lazy dog.";
const word = "fox";

console.log(
  `The word "${word}" ${
    sentence.includes(word) ? "is" : "is not"
  } in the sentence`,
);
// Output: The word "fox" is in the sentence
```

---

## String Conversion with `String()`

The `String()` function converts any value into a string.

```javascript
let num = 23498;
let str = String(num);
console.log(str);
// Output: "23498"
```

---

## Number Conversion with `Number()`

The `Number()` function converts a value into a number.  
If the conversion fails (e.g., the value isn’t numeric), it returns `NaN` (Not a Number).

```javascript
let str = "23478";
let num = Number(str);
console.log(num);
// Output: 23478
```

---

## `startsWith()` and `endsWith()`

- **`startsWith()`** checks if a string begins with a given substring.  
- **`endsWith()`** checks if it ends with a given substring.

```javascript
const str2 = "Saturday night plans";

console.log(str2.startsWith("Sat")); // true
console.log(str2.endsWith("plans")); // true
```

These methods return `true` or `false`.

---

## The `at()` Method

The `.at()` method returns the character at a specific index.  
It also supports **negative indexes**, counting backward from the end.

```javascript
const sentence2 = "The quick brown fox jumps over the lazy dog.";

console.log(sentence2.at(5));  // "u"
console.log(sentence2.at(-4)); // "d"
```

---

## `replace()` and `replaceAll()`

Both methods are used to **replace parts of a string**:
- `replace()` changes **only the first** occurrence.
- `replaceAll()` changes **every** occurrence.

```javascript
const paragraph = "I think Ruth's dog is cuter than your dog!";

console.log(paragraph.replace("Ruth's", "my"));
// Output: "I think my dog is cuter than your dog!"

console.log(paragraph.replaceAll("i", "AI"));
// Output: "I thAInk Ruth's dog AIs cuter than your dog!"
```

---

## The `split()` Method

The `.split()` method divides a string into an **array of substrings** based on a given separator.

```javascript
const str3 = "The quick brown fox jumps over the lazy dog.";

const words = str3.split(" ");
console.log(words[3]); // "fox"

const chars = str3.split("");
console.log(chars[8]); // "k"

const strCopy = str3.split();
console.log(strCopy);
// Output: ["The quick brown fox jumps over the lazy dog."]
```

### Common Uses of `split()`
| Separator | Example | Result |
|------------|----------|---------|
| `" "` | `"a b c".split(" ")` | `["a", "b", "c"]` |
| `","` | `"a,b,c".split(",")` | `["a", "b", "c"]` |
| `""` | `"abc".split("")` | `["a", "b", "c"]` |

---

## Summary

| Method | Description | Example | Output |
|---------|--------------|----------|---------|
| `includes()` | Checks if string contains substring | `"fox".includes("f")` | `true` |
| `String()` | Converts value to string | `String(123)` | `"123"` |
| `Number()` | Converts value to number | `Number("42")` | `42` |
| `startsWith()` | Checks if string begins with substring | `"Hello".startsWith("He")` | `true` |
| `endsWith()` | Checks if string ends with substring | `"Hello".endsWith("lo")` | `true` |
| `at()` | Gets character by index | `"Hello".at(1)` | `"e"` |
| `replace()` | Replace first match | `"hi hi".replace("hi", "bye")` | `"bye hi"` |
| `replaceAll()` | Replace all matches | `"hi hi".replaceAll("hi", "bye")` | `"bye bye"` |
| `split()` | Split string into array | `"a b".split(" ")` | `["a", "b"]` |

---

### Key Takeaways
- Strings are powerful and flexible in JavaScript.  
- Use `includes()`, `startsWith()`, and `endsWith()` to search text.  
- Use `replace()` or `replaceAll()` for text replacement.  
- Use `split()` to break strings into arrays.  
- Use `String()` and `Number()` for type conversions.  
- The `at()` method provides an easy way to access characters, including from the end.