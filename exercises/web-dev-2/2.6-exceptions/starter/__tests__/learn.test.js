const exceptions = require('../practice');

// 1. divideByZero
test('divideByZero should return "Error caught!" when dividing by zero', () => {
  expect(exceptions.divideByZero()).toEqual("Error caught!");
});
test('divideByZero should not throw an error', () => {
  expect(() => exceptions.divideByZero()).not.toThrow();
});
test('divideByZero should return a string', () => {
  expect(typeof exceptions.divideByZero()).toBe("string");
});
test('divideByZero should always return "Error caught!"', () => {
  expect(exceptions.divideByZero()).toEqual("Error caught!");
});

// 2. checkAge
test('checkAge should return "Access granted" when given 18', () => {
  expect(exceptions.checkAge(18)).toEqual("Access granted");
});
test('checkAge should return "Access granted" when given 21', () => {
  expect(exceptions.checkAge(21)).toEqual("Access granted");
});
test('checkAge should throw an error when given 17', () => {
  expect(() => exceptions.checkAge(17)).toThrow();
});
test('checkAge should throw an error when given 0', () => {
  expect(() => exceptions.checkAge(0)).toThrow();
});

// 3. tryCatchFinally
test('tryCatchFinally should include "Start" and "End" in result', () => {
  const result = exceptions.tryCatchFinally();
  expect(result).toContain("Start");
  expect(result).toContain("End");
});
test('tryCatchFinally should return an array of strings', () => {
  expect(Array.isArray(exceptions.tryCatchFinally())).toBe(true);
});
test('tryCatchFinally should always end with "End"', () => {
  const result = exceptions.tryCatchFinally();
  expect(result[result.length - 1]).toEqual("End");
});
test('tryCatchFinally should include at least two messages', () => {
  expect(exceptions.tryCatchFinally().length).toBeGreaterThanOrEqual(2);
});

// 4. greet
test('greet should return "Hello, Alice!" when given "Alice"', () => {
  expect(exceptions.greet("Alice")).toEqual("Hello, Alice!");
});
test('greet should return "Hello, Bob!" when given "Bob"', () => {
  expect(exceptions.greet("Bob")).toEqual("Hello, Bob!");
});
test('greet should throw an error when given an empty string', () => {
  expect(() => exceptions.greet("")).toThrow();
});
test('greet should throw an error when given undefined', () => {
  expect(() => exceptions.greet(undefined)).toThrow();
});

// 5. parseBadJSON
test('parseBadJSON should return "Invalid JSON" when parsing bad JSON', () => {
  expect(exceptions.parseBadJSON()).toEqual("Invalid JSON");
});
test('parseBadJSON should not throw', () => {
  expect(() => exceptions.parseBadJSON()).not.toThrow();
});
test('parseBadJSON should return a string', () => {
  expect(typeof exceptions.parseBadJSON()).toBe("string");
});
test('parseBadJSON should always return "Invalid JSON"', () => {
  expect(exceptions.parseBadJSON()).toEqual("Invalid JSON");
});

// 6. parseGoodJSON
test('parseGoodJSON should return "Alice" when given good JSON', () => {
  expect(exceptions.parseGoodJSON()).toEqual("Alice");
});
test('parseGoodJSON should return a string', () => {
  expect(typeof exceptions.parseGoodJSON()).toBe("string");
});
test('parseGoodJSON should not throw', () => {
  expect(() => exceptions.parseGoodJSON()).not.toThrow();
});
test('parseGoodJSON should equal "Alice"', () => {
  expect(exceptions.parseGoodJSON()).toEqual("Alice");
});

// 7. nestedErrors
test('nestedErrors should return a string containing "Error"', () => {
  expect(exceptions.nestedErrors()).toContain("Error");
});
test('nestedErrors should not throw', () => {
  expect(() => exceptions.nestedErrors()).not.toThrow();
});
test('nestedErrors should return a string', () => {
  expect(typeof exceptions.nestedErrors()).toBe("string");
});
test('nestedErrors should always return same error message', () => {
  const first = exceptions.nestedErrors();
  const second = exceptions.nestedErrors();
  expect(first).toEqual(second);
});

// 8. safeDivide
test('safeDivide should return 5 when dividing 10 by 2', () => {
  expect(exceptions.safeDivide()).toContain(5);
});
test('safeDivide should include "Error" when dividing by 0', () => {
  expect(exceptions.safeDivide().join(" ")).toContain("Error");
});
test('safeDivide should return an array of results', () => {
  expect(Array.isArray(exceptions.safeDivide())).toBe(true);
});
test('safeDivide should include both successful and error results', () => {
  const result = exceptions.safeDivide();
  expect(result.length).toBeGreaterThanOrEqual(2);
});

// 9. throwString
test('throwString should return "Bad value!" when caught', () => {
  expect(exceptions.throwString()).toEqual("Bad value!");
});
test('throwString should not throw', () => {
  expect(() => exceptions.throwString()).not.toThrow();
});
test('throwString should return a string', () => {
  expect(typeof exceptions.throwString()).toBe("string");
});
test('throwString should always return "Bad value!"', () => {
  expect(exceptions.throwString()).toEqual("Bad value!");
});

// 10. multipleErrors
test('multipleErrors should return the first error message', () => {
  expect(typeof exceptions.multipleErrors()).toBe("string");
});
test('multipleErrors should not throw', () => {
  expect(() => exceptions.multipleErrors()).not.toThrow();
});
test('multipleErrors should return a non-empty string', () => {
  expect(exceptions.multipleErrors().length).toBeGreaterThan(0);
});
test('multipleErrors should include "Infinity" or "Unexpected token" in result', () => {
  const result = exceptions.multipleErrors();
  expect(result.includes("Infinity") || result.includes("Unexpected")).toBe(true);
});
