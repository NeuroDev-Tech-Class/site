const arraysPractice = require('../practice');

// 1. isFourLetters
test('isFourLetters should return ["Pair"] when given ["Tomato","Potato","Pair"]', () => {
  expect(arraysPractice.isFourLetters(["Tomato","Potato","Pair"])).toEqual(["Pair"]);
});
test('isFourLetters should return ["Bear"] when given ["Kangaroo","Bear","Fox"]', () => {
  expect(arraysPractice.isFourLetters(["Kangaroo","Bear","Fox"])).toEqual(["Bear"]);
});
test('isFourLetters should return ["Ryan","Matt"] when given ["Ryan","Kieran","Jason","Matt"]', () => {
  expect(arraysPractice.isFourLetters(["Ryan","Kieran","Jason","Matt"])).toEqual(["Ryan","Matt"]);
});
test('isFourLetters should return [] when given ["One","Two","Three"]', () => {
  expect(arraysPractice.isFourLetters(["One","Two","Three"])).toEqual([]);
});

// 2. hurdleJump
test('hurdleJump should return true when given [1,2,3,4,5], 5', () => {
  expect(arraysPractice.hurdleJump([1,2,3,4,5], 5)).toEqual(true);
});
test('hurdleJump should return false when given [5,5,3,4,5], 3', () => {
  expect(arraysPractice.hurdleJump([5,5,3,4,5], 3)).toEqual(false);
});
test('hurdleJump should return true when given [], 10', () => {
  expect(arraysPractice.hurdleJump([], 10)).toEqual(true);
});
test('hurdleJump should return false when given [1,2,1], 1', () => {
  expect(arraysPractice.hurdleJump([1,2,1], 1)).toEqual(false);
});

// 3. addEnding
test('addEnding should return ["cleverly","meekly","hurriedly","nicely"] when given ["clever","meek","hurried","nice"], "ly"', () => {
  expect(arraysPractice.addEnding(["clever","meek","hurried","nice"], "ly")).toEqual(["cleverly","meekly","hurriedly","nicely"]);
});
test('addEnding should return ["newer","panderer","scooper"] when given ["new","pander","scoop"], "er"', () => {
  expect(arraysPractice.addEnding(["new","pander","scoop"], "er")).toEqual(["newer","panderer","scooper"]);
});
test('addEnding should return [] when given [], "ly"', () => {
  expect(arraysPractice.addEnding([], "ly")).toEqual([]);
});
test('addEnding should return ["a!","b!","c!"] when given ["a","b","c"], "!"', () => {
  expect(arraysPractice.addEnding(["a","b","c"], "!")).toEqual(["a!","b!","c!"]);
});

// 4. correctStream
test('correctStream should return [1,1,-1] when given ["it","is","find"], ["it","is","fine"]', () => {
  expect(arraysPractice.correctStream(["it","is","find"], ["it","is","fine"])).toEqual([1,1,-1]);
});
test('correctStream should return [1,-1,1,1,1] when given ["april","showrs","bring","may","flowers"], ["april","showers","bring","may","flowers"]', () => {
  expect(arraysPractice.correctStream(["april","showrs","bring","may","flowers"], ["april","showers","bring","may","flowers"])).toEqual([1,-1,1,1,1]);
});
test('correctStream should return [] when given [], []', () => {
  expect(arraysPractice.correctStream([], [])).toEqual([]);
});
test('correctStream should return [-1,-1] when given ["hello","world"], ["hi","earth"]', () => {
  expect(arraysPractice.correctStream(["hello","world"], ["hi","earth"])).toEqual([-1,-1]);
});

// 5. countdown
test('countdown should return [5,4,3,2,1,0] when given 5', () => {
  expect(arraysPractice.countdown(5)).toEqual([5,4,3,2,1,0]);
});
test('countdown should return [1,0] when given 1', () => {
  expect(arraysPractice.countdown(1)).toEqual([1,0]);
});
test('countdown should return [0] when given 0', () => {
  expect(arraysPractice.countdown(0)).toEqual([0]);
});
test('countdown should return [3,2,1,0] when given 3', () => {
  expect(arraysPractice.countdown(3)).toEqual([3,2,1,0]);
});

// 6. negate
test('negate should return [-1,-2,-3,-4] when given [1,2,3,4]', () => {
  expect(arraysPractice.negate([1,2,3,4])).toEqual([-1,-2,-3,-4]);
});
test('negate should return [1,-2,3,-4] when given [-1,2,-3,4]', () => {
  expect(arraysPractice.negate([-1,2,-3,4])).toEqual([1,-2,3,-4]);
});
test('negate should return [] when given []', () => {
  expect(arraysPractice.negate([])).toEqual([]);
});
test('negate should return [0,-1] when given [0,1]', () => {
  expect(arraysPractice.negate([0,1])).toEqual([0,-1]);
});

// 7. findSmallestNum
test('findSmallestNum should return 2 when given [34,15,88,2]', () => {
  expect(arraysPractice.findSmallestNum([34,15,88,2])).toEqual(2);
});
test('findSmallestNum should return -345 when given [34,-345,-1,100]', () => {
  expect(arraysPractice.findSmallestNum([34,-345,-1,100])).toEqual(-345);
});
test('findSmallestNum should return -76 when given [-76,1.345,1,0]', () => {
  expect(arraysPractice.findSmallestNum([-76,1.345,1,0])).toEqual(-76);
});
test('findSmallestNum should return 0 when given [5,0,10]', () => {
  expect(arraysPractice.findSmallestNum([5,0,10])).toEqual(0);
});

// 8. nextElement
test('nextElement should return 11 when given [3,5,7,9]', () => {
  expect(arraysPractice.nextElement([3,5,7,9])).toEqual(11);
});
test('nextElement should return -8 when given [-5,-6,-7]', () => {
  expect(arraysPractice.nextElement([-5,-6,-7])).toEqual(-8);
});
test('nextElement should return 2 when given [2,2,2,2]', () => {
  expect(arraysPractice.nextElement([2,2,2,2])).toEqual(2);
});
test('nextElement should return 10 when given [4,7,10]', () => {
  expect(arraysPractice.nextElement([4,7,10])).toEqual(13);
});

// 9. convertCartesian
test('convertCartesian should return [[1,5],[5,8],[3,9],[3,1],[4,0]] when given [1,5,3,3,4],[5,8,9,1,0]', () => {
  expect(arraysPractice.convertCartesian([1,5,3,3,4],[5,8,9,1,0])).toEqual([[1,5],[5,8],[3,9],[3,1],[4,0]]);
});
test('convertCartesian should return [[9,1],[8,1],[3,1]] when given [9,8,3],[1,1,1]', () => {
  expect(arraysPractice.convertCartesian([9,8,3],[1,1,1])).toEqual([[9,1],[8,1],[3,1]]);
});
test('convertCartesian should return [] when given [],[]', () => {
  expect(arraysPractice.convertCartesian([],[])).toEqual([]);
});
test('convertCartesian should return [[0,0],[1,1]] when given [0,1],[0,1]', () => {
  expect(arraysPractice.convertCartesian([0,1],[0,1])).toEqual([[0,0],[1,1]]);
});

// 10. getDiscounts
test('getDiscounts should return [1,2,3,5.5] when given [2,4,6,11],"50%"', () => {
  expect(arraysPractice.getDiscounts([2,4,6,11],"50%")).toEqual([1,2,3,5.5]);
});
test('getDiscounts should return [7.5,15,30,60] when given [10,20,40,80],"75%"', () => {
  expect(arraysPractice.getDiscounts([10,20,40,80],"75%")).toEqual([7.5,15,30,60]);
});
test('getDiscounts should return [45] when given [100],"45%"', () => {
  expect(arraysPractice.getDiscounts([100], "45%")).toEqual([45]);
});
test('getDiscounts should return [0, 50, 100] when given [0, 100, 200], "50%"', () => {
  expect(arraysPractice.getDiscounts([0, 100, 200], "50%")).toEqual([0, 50, 100]);
});

// 11. filterDigitLength
test('filterDigitLength should return [232,555] when given [88,232,4,9721,555], 3', () => {
  expect(arraysPractice.filterDigitLength([88,232,4,9721,555], 3)).toEqual([232,555]);
});
test('filterDigitLength should return [2,7,8,9] when given [2,7,8,9,1012], 1', () => {
  expect(arraysPractice.filterDigitLength([2,7,8,9,1012], 1)).toEqual([2,7,8,9]);
});
test('filterDigitLength should return [] when given [32,88,74,91,300,4050], 1', () => {
  expect(arraysPractice.filterDigitLength([32,88,74,91,300,4050], 1)).toEqual([]);
});
test('filterDigitLength should return [1234] when given [123,1234,12345], 4', () => {
  expect(arraysPractice.filterDigitLength([123,1234,12345], 4)).toEqual([1234]);
});

// 12. getExtension
test('getExtension should return ["html","css"] when given ["code.html","code.css"]', () => {
  expect(arraysPractice.getExtension(["code.html","code.css"])).toEqual(["html","css"]);
});
test('getExtension should return ["jpg","pdf","mp3"] when given ["project1.jpg","project1.pdf","project1.mp3"]', () => {
  expect(arraysPractice.getExtension(["project1.jpg","project1.pdf","project1.mp3"])).toEqual(["jpg","pdf","mp3"]);
});
test('getExtension should return ["txt"] when given ["notes.txt"]', () => {
  expect(arraysPractice.getExtension(["notes.txt"])).toEqual(["txt"]);
});
test('getExtension should return [] when given []', () => {
  expect(arraysPractice.getExtension([])).toEqual([]);
});