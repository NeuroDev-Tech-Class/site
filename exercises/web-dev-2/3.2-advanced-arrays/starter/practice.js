// ======================================================
// JavaScript Practice: Array Exercises
// ======================================================
//
// Each problem below explains what your function should do.
// Try writing the function where it says "your code here".
// Test your function with the examples provided.
// ======================================================


// 1. Return the Four Letter Strings
// Create a function that takes an array of strings and 
// returns the words that are exactly four letters.
//
// Examples:
// isFourLetters(["Tomato", "Potato", "Pair"]) ➔ ["Pair"]
// isFourLetters(["Kangaroo", "Bear", "Fox"])  ➔ ["Bear"]
// isFourLetters(["Ryan", "Kieran", "Jason", "Matt"]) ➔ ["Ryan", "Matt"]
function isFourLetters(arr) {
    // your code here
}


// 2. Hurdle Jump
// Determine whether a hurdler can clear all the hurdles.
// Return true if jump height >= every hurdle. 
// Return true also for an empty array.
//
// Examples:
// hurdleJump([1, 2, 3, 4, 5], 5) ➔ true
// hurdleJump([5, 5, 3, 4, 5], 3) ➔ false
// hurdleJump([5, 4, 5, 6], 10)   ➔ true
// hurdleJump([1, 2, 1], 1)       ➔ false
function hurdleJump(hurdles, jumpHeight) {
    // your code here
}


// 3. Word Endings
// Add a string ending to each word in an array.
//
// Examples:
// addEnding(["clever", "meek", "hurried", "nice"], "ly")
//   ➔ ["cleverly", "meekly", "hurriedly", "nicely"]
// addEnding(["new", "pander", "scoop"], "er")
//   ➔ ["newer", "panderer", "scooper"]
function addEnding(arr, ending) {
    // your code here
}


// 4. Typing Game
// Compare two arrays: user-typed words vs correct words.
// Output an array of 1s (correct) and -1s (incorrect).
//
// Examples:
// correctStream(["it", "is", "find"], ["it", "is", "fine"]) ➔ [1, 1, -1]
// correctStream(["april","showrs","bring","may","flowers"],
//               ["april","showers","bring","may","flowers"]) ➔ [1, -1, 1, 1, 1]
function correctStream(user, correct) {
    // your code here
}


// 5. Generate a Countdown of Numbers
// Return an array counting down from a number to 0.
//
// Examples:
// countdown(5) ➔ [5, 4, 3, 2, 1, 0]
// countdown(1) ➔ [1, 0]
// countdown(0) ➔ [0]
function countdown(start) {
    // your code here
}


// 6. Negate the Array of Numbers
// Negate every number in an array.
//
// Examples:
// negate([1, 2, 3, 4])   ➔ [-1, -2, -3, -4]
// negate([-1, 2, -3, 4]) ➔ [1, -2, 3, -4]
// negate([])             ➔ []
function negate(arr) {
    // your code here
}


// 7. Find the Smallest Number
// Return the smallest number in an array.
//
// Examples:
// findSmallestNum([34, 15, 88, 2]) ➔ 2
// findSmallestNum([34, -345, -1, 100]) ➔ -345
// findSmallestNum([-76, 1.345, 1, 0]) ➔ -76
function findSmallestNum(arr) {
    // your code here
}


// 8. Next Element in Arithmetic Sequence
// Given an arithmetic sequence, return the next element.
//
// Examples:
// nextElement([3, 5, 7, 9])   ➔ 11
// nextElement([-5, -6, -7])   ➔ -8
// nextElement([2, 2, 2, 2])   ➔ 2
function nextElement(arr) {
    // your code here
}


// 9. X and Y Coordinates
// Combine two arrays (x and y) into coordinate pairs.
//
// Examples:
// convertCartesian([1,5,3,3,4],[5,8,9,1,0]) ➔ [[1,5],[5,8],[3,9],[3,1],[4,0]]
// convertCartesian([9,8,3],[1,1,1]) ➔ [[9,1],[8,1],[3,1]]
function convertCartesian(x, y) {
    // your code here
}


// 10. Applying Discounts
// Apply a percentage discount string to each number.
//
// Examples:
// getDiscounts([2, 4, 6, 11], "50%")  ➔ [1, 2, 3, 5.5]
// getDiscounts([10,20,40,80], "75%") ➔ [7.5, 15, 30, 60]
// getDiscounts([100], "45%")         ➔ [45]
function getDiscounts(nums, d) {
    // your code here
}


// 11. Filter by Digit Length
// Return numbers that have exactly `num` digits.
//
// Examples:
// filterDigitLength([88,232,4,9721,555], 3) ➔ [232, 555]
// filterDigitLength([2,7,8,9,1012], 1)      ➔ [2, 7, 8, 9]
// filterDigitLength([32,88,74,91,300,4050], 1) ➔ []
function filterDigitLength(arr, num) {
    // your code here
}


// 12. Get the File Extension
// Return file extensions from an array of filenames.
//
// Examples:
// getExtension(["code.html", "code.css"]) ➔ ["html", "css"]
// getExtension(["project1.jpg","project1.pdf","project1.mp3"])
//   ➔ ["jpg","pdf","mp3"]
function getExtension(arr) {
    // your code here
}


module.exports = {
  isFourLetters,
  hurdleJump,
  addEnding,
  correctStream,
  countdown,
  negate,
  findSmallestNum,
  nextElement,
  convertCartesian,
  getDiscounts,
  filterDigitLength,
  getExtension
};