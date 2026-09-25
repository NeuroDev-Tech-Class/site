const loops = require('../practice');

// Helper to capture console.log output
let outputData = "";
const storeLog = input => (outputData += input + "\n");

beforeEach(() => {
  outputData = "";
  jest.spyOn(console, "log").mockImplementation(storeLog);
});

afterEach(() => {
  console.log.mockRestore();
});


// ======================================================
// 1. printOneToTen (PRINTS)
// ======================================================
test('printOneToTen should print numbers 1 through 10', () => {
  loops.printOneToTen();
  const expected = "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n";
  expect(outputData).toBe(expected);
});


// ======================================================
// 2. sumOneToHundred (RETURNS)
// ======================================================
test('sumOneToHundred should return 5050', () => {
  expect(loops.sumOneToHundred()).toBe(5050);
});
test('sumOneToHundred should return a number', () => {
  expect(typeof loops.sumOneToHundred()).toBe("number");
});


// ======================================================
// 3. printEvens (PRINTS)
// ======================================================
test('printEvens(20) should print even numbers up to 20', () => {
  loops.printEvens(20);
  const expected = "2\n4\n6\n8\n10\n12\n14\n16\n18\n20\n";
  expect(outputData).toBe(expected);
});

test('printEvens(7) should print even numbers up to 7', () => {
  loops.printEvens(7);
  const expected = "2\n4\n6\n";
  expect(outputData).toBe(expected);
});

test('printEvens(1) should print nothing', () => {
  loops.printEvens(1);
  expect(outputData).toBe("");
});


// ======================================================
// 4. multiplicationTable5 (PRINTS)
// ======================================================
test('multiplicationTable5(5) should print 5x1 through 5x5', () => {
  loops.multiplicationTable5(5);
  const expected = "5\n10\n15\n20\n25\n";
  expect(outputData).toBe(expected);
});

test('multiplicationTable5(1) should print only 5', () => {
  loops.multiplicationTable5(1);
  expect(outputData.trim()).toBe("5");
});


// ======================================================
// 5. factorial (RETURNS)
// ======================================================
test('factorial(5) should return 120', () => {
  expect(loops.factorial(5)).toBe(120);
});
test('factorial(0) should return 1', () => {
  expect(loops.factorial(0)).toBe(1);
});
test('factorial(3) should return 6', () => {
  expect(loops.factorial(3)).toBe(6);
});


// ======================================================
// 6. countVowels (RETURNS)
// ======================================================
test('countVowels("hello") should return 2', () => {
  expect(loops.countVowels("hello")).toBe(2);
});
test('countVowels("aeiou") should return 5', () => {
  expect(loops.countVowels("aeiou")).toBe(5);
});
test('countVowels("rhythm") should return 0', () => {
  expect(loops.countVowels("rhythm")).toBe(0);
});
test('countVowels("Banana") should return 3', () => {
  expect(loops.countVowels("Banana")).toBe(3);
});


// ======================================================
// 7. miniMultiplicationTable (PRINTS)
// ======================================================
test('miniMultiplicationTable(3) should print a 3x3 multiplication table', () => {
  loops.miniMultiplicationTable(3);
  const expected = "1 2 3\n2 4 6\n3 6 9\n";
  expect(outputData).toBe(expected);
});

test('miniMultiplicationTable(2) should print a 2x2 multiplication table', () => {
  loops.miniMultiplicationTable(2);
  const expected = "1 2\n2 4\n";
  expect(outputData).toBe(expected);
});


// ======================================================
// 8. countdown (PRINTS)
// ======================================================
test('countdown(5) should print 5 4 3 2 1 Go!', () => {
  loops.countdown(5);
  const expected = "5\n4\n3\n2\n1\nGo!\n";
  expect(outputData).toBe(expected);
});

test('countdown(0) should print only "Go!"', () => {
  loops.countdown(0);
  expect(outputData.trim()).toBe("Go!");
});

test('countdown(-2) should print only "Go!"', () => {
  loops.countdown(-2);
  expect(outputData.trim()).toBe("Go!");
});