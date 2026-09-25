const stringsLogic = require('../practice');

// 1. replaceVowels
test('replaceVowels should return "th# ##rdv#rk" when given "the aardvark" and "#"', () => {
  expect(stringsLogic.replaceVowels("the aardvark", "#")).toEqual("th# ##rdv#rk");
});
test('replaceVowels should return "m?nn?? m??s?" when given "minnie mouse" and "?"', () => {
  expect(stringsLogic.replaceVowels("minnie mouse", "?")).toEqual("m?nn?? m??s?");
});
test('replaceVowels should return "sh*k*sp**r*" when given "shakespeare" and "*"', () => {
  expect(stringsLogic.replaceVowels("shakespeare", "*")).toEqual("sh*k*sp**r*");
});
test('replaceVowels should return empty string when given "" and "*"', () => {
  expect(stringsLogic.replaceVowels("", "*")).toEqual("");
});

// 2. isStrangePair
test('isStrangePair should return true when given "ratio", "orator"', () => {
  expect(stringsLogic.isStrangePair("ratio", "orator")).toEqual(true);
});
test('isStrangePair should return true when given "sparkling", "groups"', () => {
  expect(stringsLogic.isStrangePair("sparkling", "groups")).toEqual(true);
});
test('isStrangePair should return false when given "bush", "hubris"', () => {
  expect(stringsLogic.isStrangePair("bush", "hubris")).toEqual(false);
});
test('isStrangePair should return true when given "", ""', () => {
  expect(stringsLogic.isStrangePair("", "")).toEqual(true);
});

// 3. googlify
test('googlify should return "Goooooooooogle" when given 10', () => {
  expect(stringsLogic.googlify(10)).toEqual("Goooooooooogle");
});
test('googlify should return "Gooooooooooooooooooooooogle" when given 23', () => {
  expect(stringsLogic.googlify(23)).toEqual("Gooooooooooooooooooooooogle");
});
test('googlify should return "Google" when given 2', () => {
  expect(stringsLogic.googlify(2)).toEqual("Google");
});
test('googlify should return "invalid" when given -2', () => {
  expect(stringsLogic.googlify(-2)).toEqual("invalid");
});

// 4. smallerNum
test('smallerNum should return "21" when given "21", "44"', () => {
  expect(stringsLogic.smallerNum("21", "44")).toEqual("21");
});
test('smallerNum should return "1" when given "1500", "1"', () => {
  expect(stringsLogic.smallerNum("1500", "1")).toEqual("1");
});
test('smallerNum should return "5" when given "5", "5"', () => {
  expect(stringsLogic.smallerNum("5", "5")).toEqual("5");
});
test('smallerNum should return "0" when given "0", "100"', () => {
  expect(stringsLogic.smallerNum("0", "100")).toEqual("0");
});

// 5. owofied
test('owofied should return "rwidwe owo" when given "ride"', () => {
  expect(stringsLogic.owofied("ride")).toEqual("rwidwe owo");
});
test('owofied should return "fwirwework owo" when given "firework"', () => {
  expect(stringsLogic.owofied("firework")).toEqual("fwirwework owo");
});
test('owofied should return "mwinniwe mouwse owo" when given "minnie mouse"', () => {
  expect(stringsLogic.owofied("minnie mouse")).toEqual("mwinniwe mouwse owo");
});
test('owofied should return "hwewllwo owo" when given "hello"', () => {
  expect(stringsLogic.owofied("hello")).toEqual("hwewllwo owo");
});

// 6. numberSyllables
test('numberSyllables should return 2 when given "buf-fet"', () => {
  expect(stringsLogic.numberSyllables("buf-fet")).toEqual(2);
});
test('numberSyllables should return 3 when given "beau-ti-ful"', () => {
  expect(stringsLogic.numberSyllables("beau-ti-ful")).toEqual(3);
});
test('numberSyllables should return 4 when given "mon-u-men-tal"', () => {
  expect(stringsLogic.numberSyllables("mon-u-men-tal")).toEqual(4);
});
test('numberSyllables should return 6 when given "on-o-mat-o-poe-ia"', () => {
  expect(stringsLogic.numberSyllables("on-o-mat-o-poe-ia")).toEqual(6);
});

// 7. checkPalindrome
test('checkPalindrome should return true when given "mom"', () => {
  expect(stringsLogic.checkPalindrome("mom")).toEqual(true);
});
test('checkPalindrome should return false when given "scary"', () => {
  expect(stringsLogic.checkPalindrome("scary")).toEqual(false);
});
test('checkPalindrome should return true when given "reviver"', () => {
  expect(stringsLogic.checkPalindrome("reviver")).toEqual(true);
});
test('checkPalindrome should return false when given "stressed"', () => {
  expect(stringsLogic.checkPalindrome("stressed")).toEqual(false);
});

// 8. subReddit
test('subReddit should return "funny" when given "https://www.reddit.com/r/funny/"', () => {
  expect(stringsLogic.subReddit("https://www.reddit.com/r/funny/")).toEqual("funny");
});
test('subReddit should return "relationships" when given "https://www.reddit.com/r/relationships/"', () => {
  expect(stringsLogic.subReddit("https://www.reddit.com/r/relationships/")).toEqual("relationships");
});
test('subReddit should return "mildlyinteresting" when given "https://www.reddit.com/r/mildlyinteresting/"', () => {
  expect(stringsLogic.subReddit("https://www.reddit.com/r/mildlyinteresting/")).toEqual("mildlyinteresting");
});
test('subReddit should return "gaming" when given "https://www.reddit.com/r/gaming/"', () => {
  expect(stringsLogic.subReddit("https://www.reddit.com/r/gaming/")).toEqual("gaming");
});

// 9. dictionary
test('dictionary should return ["button"] when given "bu", ["button","breakfast","border"]', () => {
  expect(stringsLogic.dictionary("bu", ["button","breakfast","border"])).toEqual(["button"]);
});
test('dictionary should return ["triplet","tries","trip"] when given "tri", ["triplet","tries","trip","piano","tree"]', () => {
  expect(stringsLogic.dictionary("tri", ["triplet","tries","trip","piano","tree"])).toEqual(["triplet","tries","trip"]);
});
test('dictionary should return [] when given "beau", ["pastry","delicious","name","boring"]', () => {
  expect(stringsLogic.dictionary("beau", ["pastry","delicious","name","boring"])).toEqual([]);
});
test('dictionary should return ["apple"] when given "ap", ["apple","apricot","banana"]', () => {
  expect(stringsLogic.dictionary("ap", ["apple","apricot","banana"])).toEqual(["apple","apricot"]);
});

// 10. isBetween
test('isBetween should return true when given "apple", "banana", "azure"', () => {
  expect(stringsLogic.isBetween("apple", "banana", "azure")).toEqual(true);
});
test('isBetween should return true when given "monk", "monument", "monkey"', () => {
  expect(stringsLogic.isBetween("monk", "monument", "monkey")).toEqual(true);
});
test('isBetween should return false when given "bookend", "boolean", "boost"', () => {
  expect(stringsLogic.isBetween("bookend", "boolean", "boost")).toEqual(false);
});
test('isBetween should return false when given "apple", "banana", "carrot"', () => {
  expect(stringsLogic.isBetween("apple", "banana", "carrot")).toEqual(false);
});

// 11. potatoes
test('potatoes should return 1 when given "potato"', () => {
  expect(stringsLogic.potatoes("potato")).toEqual(1);
});
test('potatoes should return 2 when given "potatopotato"', () => {
  expect(stringsLogic.potatoes("potatopotato")).toEqual(2);
});
test('potatoes should return 1 when given "potatoapple"', () => {
  expect(stringsLogic.potatoes("potatoapple")).toEqual(1);
});
test('potatoes should return 0 when given "apple"', () => {
  expect(stringsLogic.potatoes("apple")).toEqual(0);
});

// 12. detectWord
test('detectWord should return "cat" when given "UcUNFYGaFYFYGtNUH"', () => {
  expect(stringsLogic.detectWord("UcUNFYGaFYFYGtNUH")).toEqual("cat");
});
test('detectWord should return "burglar" when given "bEEFGBuFBRrHgUHlNFYaYr"', () => {
  expect(stringsLogic.detectWord("bEEFGBuFBRrHgUHlNFYaYr")).toEqual("burglar");
});
test('detectWord should return "embezzlement" when given "YFemHUFBbezFBYzFBYLleGBYEFGBMENTment"', () => {
  expect(stringsLogic.detectWord("YFemHUFBbezFBYzFBYLleGBYEFGBMENTment")).toEqual("embezzlement");
});
test('detectWord should return "" when given "ABCDEF"', () => {
  expect(stringsLogic.detectWord("ABCDEF")).toEqual("");
});
