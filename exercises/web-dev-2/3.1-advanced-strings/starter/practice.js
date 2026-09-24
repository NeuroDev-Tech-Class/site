// ======================================================
// JavaScript Practice: String & Logic Exercises
// ======================================================
//
// Each problem below explains what your function should do.
// Try writing the function where it says "your code here".
// Test your function with the examples provided.
// ======================================================


// 1. Vowel Replacer
// Create a function that replaces all the vowels in a string
// with a specified character.
//
// Examples:
// replaceVowels("the aardvark", "#") ➔ "th# ##rdv#rk"
// replaceVowels("minnie mouse", "?") ➔ "m?nn?? m??s?"
// replaceVowels("shakespeare", "*")  ➔ "sh*k*sp**r*"
function replaceVowels(str, ch) {
    // your code here
}


// 2. Strange Pair
// A pair of strings form a strange pair if:
// - The 1st string's first letter = 2nd string's last letter.
// - The 1st string's last letter = 2nd string's first letter.
//
// Examples:
// isStrangePair("ratio", "orator")      ➔ true
// isStrangePair("sparkling", "groups") ➔ true
// isStrangePair("bush", "hubris")      ➔ false
// isStrangePair("", "")                ➔ true
function isStrangePair(str1, str2) {
    // your code here
}


// 3. The Full Length of a Google
// Return "Google" with the correct number of "o"s given n.
// If n ≤ 1, return "invalid".
//
// Examples:
// googlify(10)  ➔ "Goooooooooogle"
// googlify(23)  ➔ "Gooooooooooooooooooooooogle"
// googlify(2)   ➔ "Google"
// googlify(-2)  ➔ "invalid"
function googlify(n) {
    // your code here
}


// 4. Smaller String Number
// Return the smaller number as a string.
// If both tie, return either number.
//
// Examples:
// smallerNum("21", "44")   ➔ "21"
// smallerNum("1500", "1")  ➔ "1"
// smallerNum("5", "5")     ➔ "5"
function smallerNum(n1, n2) {
    // your code here
}


// 5. Owofied a Sentence
// Turn every "i" into "wi", every "e" into "we",
// and add " owo" at the end.
//
// Examples:
// owofied("I'm gonna ride 'til I can't no more")
//   ➔ "I'm gonna rwidwe 'twil I can't no morwe owo"
// owofied("Do you ever feel like a plastic bag")
//   ➔ "Do you wevwer fwewel lwikwe a plastwic bag owo"
// owofied("Cause baby you're a firework")
//   ➔ "Causwe baby you'rwe a fwirwework owo"
function owofied(sentence) {
    // your code here
}


// 6. Count Syllables
// Count the number of syllables in a word.
// Each syllable is separated with a dash ("-").
//
// Examples:
// numberSyllables("buf-fet")        ➔ 2
// numberSyllables("beau-ti-ful")   ➔ 3
// numberSyllables("mon-u-men-tal") ➔ 4
// numberSyllables("on-o-mat-o-poe-ia") ➔ 6
function numberSyllables(word) {
    // your code here
}


// 7. Is the String a Palindrome?
// Return true if the string reads the same forwards and backwards.
//
// Examples:
// checkPalindrome("mom")     ➔ true
// checkPalindrome("scary")   ➔ false
// checkPalindrome("reviver") ➔ true
// checkPalindrome("stressed")➔ false
function checkPalindrome(str) {
    // your code here
}


// 8. Retrieve the Subreddit
// Extract the name of the subreddit from a given URL.
//
// Examples:
// subReddit("https://www.reddit.com/r/funny/")         ➔ "funny"
// subReddit("https://www.reddit.com/r/relationships/") ➔ "relationships"
// subReddit("https://www.reddit.com/r/mildlyinteresting/") ➔ "mildlyinteresting"
function subReddit(link) {
    // your code here
}


// 9. Little Dictionary
// Extract words that start with the same letters as the initial word.
//
// Examples:
// dictionary("bu", ["button", "breakfast", "border"]) ➔ ["button"]
// dictionary("tri", ["triplet", "tries", "trip", "piano", "tree"])
//   ➔ ["triplet", "tries", "trip"]
// dictionary("beau", ["pastry", "delicious", "name", "boring"]) ➔ []
function dictionary(initial, words) {
    // your code here
}


// 10. Between Words
// Return true if "word" is found between "first" and "last"
// in dictionary order.
//
// Examples:
// isBetween("apple", "banana", "azure") ➔ true
// isBetween("monk", "monument", "monkey") ➔ true
// isBetween("bookend", "boolean", "boost") ➔ false
function isBetween(first, last, word) {
    // your code here
}


// 11. Find the Amount of Potatoes
// Count how many times "potato" appears in a string.
//
// Examples:
// potatoes("potato")       ➔ 1
// potatoes("potatopotato") ➔ 2
// potatoes("potatoapple")  ➔ 1
function potatoes(str) {
    // your code here
}


// 12. What's Hiding Amongst the Crowd?
// Extract the lowercase word hidden among uppercase letters.
//
// Examples:
// detectWord("UcUNFYGaFYFYGtNUH") ➔ "cat"
// detectWord("bEEFGBuFBRrHgUHlNFYaYr") ➔ "burglar"
// detectWord("YFemHUFBbezFBYzFBYLleGBYEFGBMENTment") ➔ "embezzlement"
function detectWord(str) {
    // your code here
}


module.exports = {
  replaceVowels,
  isStrangePair,
  googlify,
  smallerNum,
  owofied,
  numberSyllables,
  checkPalindrome,
  subReddit,
  dictionary,
  isBetween,
  potatoes,
  detectWord
};