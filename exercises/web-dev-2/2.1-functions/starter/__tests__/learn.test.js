const logic = require('../practice');

// 1. lessThanOrEqualToZero
test('lessThanOrEqualToZero should return false when given 5', () => {
  expect(logic.lessThanOrEqualToZero(5)).toBe(false);
});
test('lessThanOrEqualToZero should return true when given 0', () => {
  expect(logic.lessThanOrEqualToZero(0)).toBe(true);
});
test('lessThanOrEqualToZero should return true when given -2', () => {
  expect(logic.lessThanOrEqualToZero(-2)).toBe(true);
});

// 2. divisible
test('divisible should return false when given 1', () => {
  expect(logic.divisible(1)).toBe(false);
});
test('divisible should return true when given 100', () => {
  expect(logic.divisible(100)).toBe(true);
});
test('divisible should return true when given 1000', () => {
  expect(logic.divisible(1000)).toBe(true);
});

// 3. makesTen
test('makesTen should return true when one input is 10', () => {
  expect(logic.makesTen(10, 1)).toBe(true);
});
test('makesTen should return true when sum equals 10', () => {
  expect(logic.makesTen(7, 3)).toBe(true);
});
test('makesTen should return false when neither equals 10 nor sums to 10', () => {
  expect(logic.makesTen(8, 4)).toBe(false);
});

// 4. divisibleByFive
test('divisibleByFive should return true for 5', () => {
  expect(logic.divisibleByFive(5)).toBe(true);
});
test('divisibleByFive should return true for -55', () => {
  expect(logic.divisibleByFive(-55)).toBe(true);
});
test('divisibleByFive should return false for 37', () => {
  expect(logic.divisibleByFive(37)).toBe(false);
});

// 5. dividesEvenly
test('dividesEvenly should return true when evenly divisible', () => {
  expect(logic.dividesEvenly(98, 7)).toBe(true);
});
test('dividesEvenly should return false when not evenly divisible', () => {
  expect(logic.dividesEvenly(85, 4)).toBe(false);
});
test('dividesEvenly should return true when dividing by itself', () => {
  expect(logic.dividesEvenly(42, 42)).toBe(true);
});

// 6. isEvenOrOdd
test('isEvenOrOdd should return "odd" for 3', () => {
  expect(logic.isEvenOrOdd(3)).toBe("odd");
});
test('isEvenOrOdd should return "even" for 146', () => {
  expect(logic.isEvenOrOdd(146)).toBe("even");
});
test('isEvenOrOdd should return "odd" for -7', () => {
  expect(logic.isEvenOrOdd(-7)).toBe("odd");
});

// 7. word
test('word should return 1 when given "one"', () => {
  expect(logic.word("one")).toBe(1);
});
test('word should return 5 when given "five"', () => {
  expect(logic.word("five")).toBe(5);
});
test('word should return 9 when given "nine"', () => {
  expect(logic.word("nine")).toBe(9);
});

// 8. monthName
test('monthName should return "March" for 3', () => {
  expect(logic.monthName(3)).toBe("March");
});
test('monthName should return "December" for 12', () => {
  expect(logic.monthName(12)).toBe("December");
});
test('monthName should return "June" for 6', () => {
  expect(logic.monthName(6)).toBe("June");
});

// 9. helloWorld
test('helloWorld should return "Hello" for multiples of 3', () => {
  expect(logic.helloWorld(9)).toBe("Hello");
});
test('helloWorld should return "World" for multiples of 5', () => {
  expect(logic.helloWorld(20)).toBe("World");
});
test('helloWorld should return "Hello World" for multiples of 15', () => {
  expect(logic.helloWorld(30)).toBe("Hello World");
});

// 10. equalSlices
test('equalSlices should return true if enough slices', () => {
  expect(logic.equalSlices(11, 5, 2)).toBe(true);
});
test('equalSlices should return false if not enough slices', () => {
  expect(logic.equalSlices(11, 5, 3)).toBe(false);
});
test('equalSlices should return true with no people', () => {
  expect(logic.equalSlices(5, 0, 10)).toBe(true);
});

// 11. isTriangle
test('isTriangle should return true for 3, 4, 5', () => {
  expect(logic.isTriangle(3, 4, 5)).toBe(true);
});
test('isTriangle should return false if one side is too large', () => {
  expect(logic.isTriangle(2, 3, 8)).toBe(false);
});
test('isTriangle should return true for 6, 7, 10', () => {
  expect(logic.isTriangle(6, 7, 10)).toBe(true);
});

// 12. equal
test('equal should return 3 when all numbers are equal', () => {
  expect(logic.equal(5, 5, 5)).toBe(3);
});
test('equal should return 2 when two numbers are equal', () => {
  expect(logic.equal(4, 4, 7)).toBe(2);
});
test('equal should return 0 when all numbers differ', () => {
  expect(logic.equal(2, 3, 4)).toBe(0);
});
