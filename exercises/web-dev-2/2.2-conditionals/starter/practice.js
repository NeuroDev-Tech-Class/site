// ======================================================
// JavaScript Practice: Logic Exercises
// ======================================================
//
// Each problem below explains what your function should do.
// Try writing the function where it says "your code here".
// Test your function with the examples provided.
// ======================================================


// 1. Is the Number Less than or Equal to Zero?
// Create a function that takes a number and returns true if
// it's less than or equal to zero, otherwise return false.
//
// Examples:
// lessThanOrEqualToZero(5)  ➔ false
// lessThanOrEqualToZero(0)  ➔ true
// lessThanOrEqualToZero(-2) ➔ true
function lessThanOrEqualToZero(num) {
    // your code here
}


// 2. Multiple of 100
// Create a function that takes an integer and returns true if
// it's exactly divisible by 100, otherwise false.
//
// Examples:
// divisible(1)    ➔ false
// divisible(1000) ➔ true
// divisible(100)  ➔ true
function divisible(num) {
    // your code here
}


// 3. Two Makes Ten
// Create a function that takes two integers (a and b).
// Return true if one is 10 OR if their sum is 10.
//
// Examples:
// makesTen(9, 10) ➔ true
// makesTen(9, 9)  ➔ false
// makesTen(1, 9)  ➔ true
function makesTen(a, b) {
    // your code here
}


// 4. Divisible by Five
// Return true if the integer is evenly divisible by 5.
// Otherwise, return false.
//
// Examples:
// divisibleByFive(5)   ➔ true
// divisibleByFive(-55) ➔ true
// divisibleByFive(37)  ➔ false
function divisibleByFive(n) {
    // your code here
}


// 5. Divides Evenly
// Given two integers (a, b), return true if a is evenly
// divisible by b. Otherwise return false.
// (a will always be >= b)
//
// Examples:
// dividesEvenly(98, 7) ➔ true   (98/7 = 14)
// dividesEvenly(85, 4) ➔ false  (85/4 = 21.25)
function dividesEvenly(a, b) {
    // your code here
}


// 6. Even or Odd
// Return "even" if the number is even, and "odd" if odd.
// Tests are case-sensitive, so return lowercase only.
//
// Examples:
// isEvenOrOdd(3)   ➔ "odd"
// isEvenOrOdd(146) ➔ "even"
// isEvenOrOdd(19)  ➔ "odd"
function isEvenOrOdd(num) {
    // your code here
}


// 7. Word Numbers
// Return a digit (0–9) based on the string word given.
// e.g. "one" → 1, "two" → 2, etc.
//
// Examples:
// word("one")  ➔ 1
// word("two")  ➔ 2
// word("nine") ➔ 9
function word(s) {
    // your code here
}


// 8. Month Name
// Return the name of the month (as a string) for a number (1–12).
//
// Examples:
// monthName(3)  ➔ "March"
// monthName(12) ➔ "December"
// monthName(6)  ➔ "June"
function monthName(num) {
    // your code here
}


// 9. Hello; Hello World; World
// If num is a multiple of 3, return "Hello".
// If num is a multiple of 5, return "World".
// If num is multiple of both 3 and 5, return "Hello World".
//
// Examples:
// helloWorld(3)  ➔ "Hello"
// helloWorld(5)  ➔ "World"
// helloWorld(15) ➔ "Hello World"
function helloWorld(num) {
    // your code here
}


// 10. Slice of Pie
// Check if it's possible to fairly split a pie given:
// total slices, number of people, slices each.
//
// Examples:
// equalSlices(11, 5, 2) ➔ true   (10 slices needed, 11 available)
// equalSlices(11, 5, 3) ➔ false  (15 slices needed, 11 available)
// equalSlices(8, 3, 2)  ➔ true
// equalSlices(8, 3, 3)  ➔ false
function equalSlices(total, people, each) {
    // your code here
}


// 11. Is It a Triangle?
// Return true if 3 side lengths can form a triangle.
// Hint: sum of any 2 sides must be greater than the 3rd.
//
// Examples:
// isTriangle(2, 3, 4) ➔ true
// isTriangle(3, 4, 5) ➔ true
// isTriangle(4, 3, 8) ➔ false
function isTriangle(a, b, c) {
    // your code here
}


// 12. Equality of 3 Values
// Return how many numbers are equal (0, 2, or 3).
//
// Examples:
// equal(3, 4, 3) ➔ 2
// equal(1, 1, 1) ➔ 3
// equal(3, 4, 1) ➔ 0
function equal(a, b, c) {
    // your code here
}


module.exports = {
  lessThanOrEqualToZero,
  divisible,
  makesTen,
  divisibleByFive,
  dividesEvenly,
  isEvenOrOdd,
  word,
  monthName,
  helloWorld,
  equalSlices,
  isTriangle,
  equal
};
