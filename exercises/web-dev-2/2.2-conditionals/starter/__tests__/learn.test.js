const conditionals = require('../practice');

test('lessThanOrEqualToZero should return false when given 5', () => {
  expect(conditionals.lessThanOrEqualToZero(5)).toEqual(false);
});

test('lessThanOrEqualToZero should return true when given 0', () => {
  expect(conditionals.lessThanOrEqualToZero(0)).toEqual(true);
});

test('lessThanOrEqualToZero should return true when given -5', () => {
  expect(conditionals.lessThanOrEqualToZero(-5)).toEqual(true);
});

test('divisible should return false when given 1', () => {
  expect(conditionals.divisible(1)).toEqual(false);
});

test('divisible should return true when given 100', () => {
  expect(conditionals.divisible(100)).toEqual(true);
});

test('divisible should return true when given 1000', () => {
  expect(conditionals.divisible(1000)).toEqual(true);
});

test('divisible should return true when given 111000', () => {
  expect(conditionals.divisible(111000)).toEqual(true);
});

test('divisible should return false when given -1', () => {
  expect(conditionals.divisible(-1)).toEqual(false);
});

test('divisible should return true when given 0', () => {
  expect(conditionals.divisible(0)).toEqual(true);
});

test('divisible should return true when given -100', () => {
  expect(conditionals.divisible(-100)).toEqual(true);
});

test('makesTen should return true when given (9, 10)', () => {
  expect(conditionals.makesTen(9, 10)).toEqual(true);
});

test('makesTen should return false when given (9, 9)', () => {
  expect(conditionals.makesTen(9, 9)).toEqual(false);
});

test('makesTen should return true when given (1, 9)', () => {
  expect(conditionals.makesTen(1, 9)).toEqual(true);
});

test('makesTen should return true when given (10, 1)', () => {
  expect(conditionals.makesTen(10, 1)).toEqual(true);
});

test('makesTen should return true when given (10, 10)', () => {
  expect(conditionals.makesTen(10, 10)).toEqual(true);
});

test('makesTen should return true when given (8, 2)', () => {
  expect(conditionals.makesTen(8, 2)).toEqual(true);
});

test('makesTen should return false when given (8, 3)', () => {
  expect(conditionals.makesTen(8, 3)).toEqual(false);
});

test('makesTen should return true when given (10, 42)', () => {
  expect(conditionals.makesTen(10, 42)).toEqual(true);
});

test('makesTen should return true when given (12, -2)', () => {
  expect(conditionals.makesTen(12, -2)).toEqual(true);
});

test('divisibleByFive should return false when given 7', () => {
  expect(conditionals.divisibleByFive(7)).toEqual(false);
});

test('divisibleByFive should return true when given 5', () => {
  expect(conditionals.divisibleByFive(5)).toEqual(true);
});

test('divisibleByFive should return true when given 15', () => {
  expect(conditionals.divisibleByFive(15)).toEqual(true);
});

test('divisibleByFive should return false when given 33', () => {
  expect(conditionals.divisibleByFive(33)).toEqual(false);
});

test('divisibleByFive should return false when given -18', () => {
  expect(conditionals.divisibleByFive(-18)).toEqual(false);
});

test('divisibleByFive should return false when given 999', () => {
  expect(conditionals.divisibleByFive(999)).toEqual(false);
});

test('divisibleByFive should return false when given 2', () => {
  expect(conditionals.divisibleByFive(2)).toEqual(false);
});

test('dividesEvenly should return true when given (98, 7)', () => {
  expect(conditionals.dividesEvenly(98, 7)).toEqual(true);
});

test('dividesEvenly should return false when given (87, 49)', () => {
  expect(conditionals.dividesEvenly(87, 49)).toEqual(false);
});

test('dividesEvenly should return false when given (34, 14)', () => {
  expect(conditionals.dividesEvenly(34, 14)).toEqual(false);
});

test('dividesEvenly should return true when given (78, 6)', () => {
  expect(conditionals.dividesEvenly(78, 6)).toEqual(true);
});

test('dividesEvenly should return false when given (30, 4)', () => {
  expect(conditionals.dividesEvenly(30, 4)).toEqual(false);
});

test('dividesEvenly should return false when given (87, 73)', () => {
  expect(conditionals.dividesEvenly(87, 73)).toEqual(false);
});

test('dividesEvenly should return false when given (74, 7)', () => {
  expect(conditionals.dividesEvenly(74, 7)).toEqual(false);
});

test('dividesEvenly should return true when given (87, 29)', () => {
  expect(conditionals.dividesEvenly(87, 29)).toEqual(true);
});

test('dividesEvenly should return true when given (48, 24)', () => {
  expect(conditionals.dividesEvenly(48, 24)).toEqual(true);
});

test('dividesEvenly should return false when given (99, 20)', () => {
  expect(conditionals.dividesEvenly(99, 20)).toEqual(false);
});

test('dividesEvenly should return true when given (98, 49)', () => {
  expect(conditionals.dividesEvenly(98, 49)).toEqual(true);
});

test('dividesEvenly should return false when given (100, 6)', () => {
  expect(conditionals.dividesEvenly(100, 6)).toEqual(false);
});

test('isEvenOrOdd should return "odd" when given 3', () => {
  expect(conditionals.isEvenOrOdd(3)).toEqual("odd");
});

test('isEvenOrOdd should return "even" when given 0', () => {
  expect(conditionals.isEvenOrOdd(0)).toEqual("even");
});

test('isEvenOrOdd should return "odd" when given 7', () => {
  expect(conditionals.isEvenOrOdd(7)).toEqual("odd");
});

test('isEvenOrOdd should return "even" when given 12', () => {
  expect(conditionals.isEvenOrOdd(12)).toEqual("even");
});

test('isEvenOrOdd should return "even" when given 6474', () => {
  expect(conditionals.isEvenOrOdd(6474)).toEqual("even");
});

test('isEvenOrOdd should return "odd" when given 371', () => {
  expect(conditionals.isEvenOrOdd(371)).toEqual("odd");
});

test('isEvenOrOdd should return "odd" when given 3', () => {
  expect(conditionals.isEvenOrOdd(3)).toEqual("odd");
});

test('isEvenOrOdd should return "even" when given 153387008', () => {
  expect(conditionals.isEvenOrOdd(153387008)).toEqual("even");
});

test('isEvenOrOdd should return "odd" when given 301', () => {
  expect(conditionals.isEvenOrOdd(301)).toEqual("odd");
});

test('isEvenOrOdd should return "odd" when given -3', () => {
  expect(conditionals.isEvenOrOdd(-3)).toEqual("odd");
});

test('isEvenOrOdd should return "even" when given 0', () => {
  expect(conditionals.isEvenOrOdd(0)).toEqual("even");
});

test('isEvenOrOdd should return "odd" when given -7', () => {
  expect(conditionals.isEvenOrOdd(-7)).toEqual("odd");
});

test('word should return 0 when given "zero"', () => {
  expect(conditionals.word("zero")).toEqual(0);
});

test('word should return 1 when given "one"', () => {
  expect(conditionals.word("one")).toEqual(1);
});

test('word should return 2 when given "two"', () => {
  expect(conditionals.word("two")).toEqual(2);
});

test('word should return 3 when given "three"', () => {
  expect(conditionals.word("three")).toEqual(3);
});

test('word should return 4 when given "four"', () => {
  expect(conditionals.word("four")).toEqual(4);
});

test('word should return 5 when given "five"', () => {
  expect(conditionals.word("five")).toEqual(5);
});

test('word should return 6 when given "six"', () => {
  expect(conditionals.word("six")).toEqual(6);
});

test('word should return 7 when given "seven"', () => {
  expect(conditionals.word("seven")).toEqual(7);
});

test('word should return 8 when given "eight"', () => {
  expect(conditionals.word("eight")).toEqual(8);
});

test('word should return 9 when given "nine"', () => {
  expect(conditionals.word("nine")).toEqual(9);
});

test('monthName should return "January" when given 1', () => {
  expect(conditionals.monthName(1)).toEqual("January");
});

test('monthName should return "February" when given 2', () => {
  expect(conditionals.monthName(2)).toEqual("February");
});

test('monthName should return "March" when given 3', () => {
  expect(conditionals.monthName(3)).toEqual("March");
});

test('monthName should return "April" when given 4', () => {
  expect(conditionals.monthName(4)).toEqual("April");
});

test('monthName should return "May" when given 5', () => {
  expect(conditionals.monthName(5)).toEqual("May");
});

test('monthName should return "June" when given 6', () => {
  expect(conditionals.monthName(6)).toEqual("June");
});

test('monthName should return "July" when given 7', () => {
  expect(conditionals.monthName(7)).toEqual("July");
});

test('monthName should return "August" when given 8', () => {
  expect(conditionals.monthName(8)).toEqual("August");
});

test('monthName should return "September" when given 9', () => {
  expect(conditionals.monthName(9)).toEqual("September");
});

test('monthName should return "October" when given 10', () => {
  expect(conditionals.monthName(10)).toEqual("October");
});

test('monthName should return "November" when given 11', () => {
  expect(conditionals.monthName(11)).toEqual("November");
});

test('monthName should return "December" when given 12', () => {
  expect(conditionals.monthName(12)).toEqual("December");
});

test('helloWorld should return "Hello" when given 3', () => {
  expect(conditionals.helloWorld(3)).toEqual("Hello");
});

test('helloWorld should return "World" when given 5', () => {
  expect(conditionals.helloWorld(5)).toEqual("World");
});

test('helloWorld should return "Hello World" when given 15', () => {
  expect(conditionals.helloWorld(15)).toEqual("Hello World");
});

test('equalSlices should return true when given (8, 3, 2)', () => {
  expect(conditionals.equalSlices(8, 3, 2)).toEqual(true);
});

test('equalSlices should return false when given (8, 3, 3)', () => {
  expect(conditionals.equalSlices(8, 3, 3)).toEqual(false);
});

test('equalSlices should return true when given (24, 12, 2)', () => {
  expect(conditionals.equalSlices(24, 12, 2)).toEqual(true);
});

test('equalSlices should return false when given (5, 6, 1)', () => {
  expect(conditionals.equalSlices(5, 6, 1)).toEqual(false);
});

test('equalSlices should return true when given (5, 0, 100)', () => {
  expect(conditionals.equalSlices(5, 0, 100)).toEqual(true);
});

test('equalSlices should return true when given (15, 2, 7)', () => {
  expect(conditionals.equalSlices(15, 2, 7)).toEqual(true);
});

test('equalSlices should return false when given (15, 2, 8)', () => {
  expect(conditionals.equalSlices(15, 2, 8)).toEqual(false);
});

test('isTriangle should return true when given (4, 5, 6)', () => {
  expect(conditionals.isTriangle(4, 5, 6)).toEqual(true);
});

test('isTriangle should return true when given (3, 4, 6)', () => {
  expect(conditionals.isTriangle(3, 4, 6)).toEqual(true);
});

test('isTriangle should return false when given (2, 5, 7)', () => {
  expect(conditionals.isTriangle(2, 5, 7)).toEqual(false);
});

test('isTriangle should return false when given (2, 5, 9)', () => {
  expect(conditionals.isTriangle(2, 5, 9)).toEqual(false);
});

test('isTriangle should return false when given (2, 9, 5)', () => {
  expect(conditionals.isTriangle(2, 9, 5)).toEqual(false);
});

test('isTriangle should return false when given (9, 2, 5)', () => {
  expect(conditionals.isTriangle(9, 2, 5)).toEqual(false);
});

test('isTriangle should return true when given (11, 12, 20)', () => {
  expect(conditionals.isTriangle(11, 12, 20)).toEqual(true);
});

test('isTriangle should return true when given (14, 3, 12)', () => {
  expect(conditionals.isTriangle(14, 3, 12)).toEqual(true);
});

test('isTriangle should return false when given (23, 4, 28)', () => {
  expect(conditionals.isTriangle(23, 4, 28)).toEqual(false);
});

test('isTriangle should return false when given (21, 4, 25)', () => {
  expect(conditionals.isTriangle(21, 4, 25)).toEqual(false);
});

test('equal should return 0 when given (2, 3, 4)', () => {
  expect(conditionals.equal(2, 3, 4)).toEqual(0);
});

test('equal should return 2 when given (7, 3, 7)', () => {
  expect(conditionals.equal(7, 3, 7)).toEqual(2);
});

test('equal should return 3 when given (4, 4, 4)', () => {
  expect(conditionals.equal(4, 4, 4)).toEqual(3);
});

test('equal should return 0 when given (7, 3, 4)', () => {
  expect(conditionals.equal(7, 3, 4)).toEqual(0);
});

test('equal should return 2 when given (3, 3, 6)', () => {
  expect(conditionals.equal(3, 3, 6)).toEqual(2);
});

test('equal should return 3 when given (1, 1, 1)', () => {
  expect(conditionals.equal(1, 1, 1)).toEqual(3);
});

test('equal should return 0 when given (1, 7, 6)', () => {
  expect(conditionals.equal(1, 7, 6)).toEqual(0);
});

test('equal should return 3 when given (7, 7, 7)', () => {
  expect(conditionals.equal(7, 7, 7)).toEqual(3);
});