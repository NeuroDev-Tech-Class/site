// ======================================================
// JavaScript Practice: Exceptions
// ======================================================
//
// Each problem below explains what your code should do.
// Try writing the code where it says "your code here".
// Use console.log() to check your answers.
// ======================================================


// 1. Basic try...catch
// Write a try...catch block that divides 10 by 0.
// Catch the error and print "Error caught!".
function divideByZero() {
    // your code here
}


// 2. Custom Error
// Write a function checkAge(age) that throws an error
// if age is less than 18, otherwise returns "Access granted".
function checkAge(age) {
    // your code here
}


// 3. Using finally
// Write a try...catch...finally block where:
// - try prints "Start"
// - catch prints the error
// - finally prints "End"
function tryCatchFinally() {
    // your code here
}


// 4. Manual Throw
// Write a function greet(name) that throws an error
// if name is empty, otherwise returns "Hello, name!".
function greet(name) {
    // your code here
}


// 5. JSON Parsing
// Write a try...catch block that parses this bad JSON:
// "{ name: 'Alice' }"
// Catch the error and print "Invalid JSON".
function parseBadJSON() {
    // your code here
}


// 6. Valid JSON
// Write a try...catch block that parses this good JSON:
// '{ "name": "Alice" }'
// Print the name value.
function parseGoodJSON() {
    // your code here
}


// 7. Nested try...catch
// Write nested try...catch blocks where the inner catch
// rethrows the error, and the outer catch prints it.
function nestedErrors() {
    // your code here
}


// 8. Divide Function
// Write a function divide(a, b) that throws an error if b is 0.
// Use try...catch to safely call divide(10, 2) and divide(10, 0).
function safeDivide() {
    // your code here
}


// 9. Throwing Strings
// JavaScript lets you throw anything (not just Error objects).
// Throw a string "Bad value!" and catch it.
function throwString() {
    // your code here
}


// 10. Multiple Operations
// In one try block, do 3 operations:
// - console.log(10/2)
// - console.log(10/0)
// - JSON.parse("oops")
// Catch the first error and print its message.
function multipleErrors() {
    // your code here

}

module.exports = {
  divideByZero,
  checkAge,
  tryCatchFinally,
  greet,
  parseBadJSON,
  parseGoodJSON,
  nestedErrors,
  safeDivide,
  throwString,
  multipleErrors
};
