const arrays = require('../practice');

// 1. getFirst
test('getFirst should return 1 when given [1,2,3]', () => {
  expect(arrays.getFirst([1,2,3])).toEqual(1);
});
test('getFirst should return "cat" when given ["cat","dog","fish"]', () => {
  expect(arrays.getFirst(["cat","dog","fish"])).toEqual("cat");
});
test('getFirst should return undefined when given []', () => {
  expect(arrays.getFirst([])).toEqual(undefined);
});
test('getFirst should return true when given [true,false]', () => {
  expect(arrays.getFirst([true,false])).toEqual(true);
});

// 2. getLast
test('getLast should return 3 when given [1,2,3]', () => {
  expect(arrays.getLast([1,2,3])).toEqual(3);
});
test('getLast should return "fish" when given ["cat","dog","fish"]', () => {
  expect(arrays.getLast(["cat","dog","fish"])).toEqual("fish");
});
test('getLast should return undefined when given []', () => {
  expect(arrays.getLast([])).toEqual(undefined);
});
test('getLast should return false when given [true,false]', () => {
  expect(arrays.getLast([true,false])).toEqual(false);
});

// 3. arrayLength
test('arrayLength should return 3 when given [5,10,15]', () => {
  expect(arrays.arrayLength([5,10,15])).toEqual(3);
});
test('arrayLength should return 0 when given []', () => {
  expect(arrays.arrayLength([])).toEqual(0);
});
test('arrayLength should return 1 when given ["apple"]', () => {
  expect(arrays.arrayLength(["apple"])).toEqual(1);
});
test('arrayLength should return 4 when given [1,2,3,4]', () => {
  expect(arrays.arrayLength([1,2,3,4])).toEqual(4);
});

// 4. includesValue
test('includesValue should return true when given ["apple","banana"], "banana"', () => {
  expect(arrays.includesValue(["apple","banana"], "banana")).toEqual(true);
});
test('includesValue should return false when given ["apple","banana"], "cherry"', () => {
  expect(arrays.includesValue(["apple","banana"], "cherry")).toEqual(false);
});
test('includesValue should return true when given [1,2,3], 1', () => {
  expect(arrays.includesValue([1,2,3], 1)).toEqual(true);
});
test('includesValue should return false when given [], 5', () => {
  expect(arrays.includesValue([], 5)).toEqual(false);
});

// 5. addToEnd
test('addToEnd should return [1,2,3] when given [1,2], 3', () => {
  expect(arrays.addToEnd([1,2], 3)).toEqual([1,2,3]);
});
test('addToEnd should return ["a","b","c"] when given ["a","b"], "c"', () => {
  expect(arrays.addToEnd(["a","b"], "c")).toEqual(["a","b","c"]);
});
test('addToEnd should return [5] when given [], 5', () => {
  expect(arrays.addToEnd([], 5)).toEqual([5]);
});
test('addToEnd should return [true,false,true] when given [true,false], true', () => {
  expect(arrays.addToEnd([true,false], true)).toEqual([true,false,true]);
});

// 6. removeLast
test('removeLast should return [1,2] when given [1,2,3]', () => {
  expect(arrays.removeLast([1,2,3])).toEqual([1,2]);
});
test('removeLast should return [] when given [5]', () => {
  expect(arrays.removeLast([5])).toEqual([]);
});
test('removeLast should return ["a","b"] when given ["a","b","c"]', () => {
  expect(arrays.removeLast(["a","b","c"])).toEqual(["a","b"]);
});
test('removeLast should return [] when given []', () => {
  expect(arrays.removeLast([])).toEqual([]);
});

// 7. reverseArray
test('reverseArray should return [3,2,1] when given [1,2,3]', () => {
  expect(arrays.reverseArray([1,2,3])).toEqual([3,2,1]);
});
test('reverseArray should return ["c","b","a"] when given ["a","b","c"]', () => {
  expect(arrays.reverseArray(["a","b","c"])).toEqual(["c","b","a"]);
});
test('reverseArray should return [] when given []', () => {
  expect(arrays.reverseArray([])).toEqual([]);
});
test('reverseArray should return [true,false] when given [false,true]', () => {
  expect(arrays.reverseArray([false,true])).toEqual([true,false]);
});

// 8. sortArray
test('sortArray should return ["apple","banana","cherry"] when given ["cherry","apple","banana"]', () => {
  expect(arrays.sortArray(["cherry","apple","banana"])).toEqual(["apple","banana","cherry"]);
});
test('sortArray should return ["a","b","c"] when given ["c","b","a"]', () => {
  expect(arrays.sortArray(["c","b","a"])).toEqual(["a","b","c"]);
});
test('sortArray should return [] when given []', () => {
  expect(arrays.sortArray([])).toEqual([]);
});
test('sortArray should return ["dog","elephant","zebra"] when given ["zebra","dog","elephant"]', () => {
  expect(arrays.sortArray(["zebra","dog","elephant"])).toEqual(["dog","elephant","zebra"]);
});

// 9. sliceArray
test('sliceArray should return [1,2] when given [0,1,2,3,4], 1, 3', () => {
  expect(arrays.sliceArray([0,1,2,3,4], 1, 3)).toEqual([1,2]);
});
test('sliceArray should return [2,3,4] when given [0,1,2,3,4,5], 2, 5', () => {
  expect(arrays.sliceArray([0,1,2,3,4,5], 2, 5)).toEqual([2,3,4]);
});
test('sliceArray should return [] when given [1,2,3], 2, 2', () => {
  expect(arrays.sliceArray([1,2,3], 2, 2)).toEqual([]);
});
test('sliceArray should return [5] when given [5,6,7], 0, 1', () => {
  expect(arrays.sliceArray([5,6,7], 0, 1)).toEqual([5]);
});

// 10. printAll
test('printAll should return [10,20,30] when given [10,20,30]', () => {
  expect(arrays.printAll([10,20,30])).toEqual([10,20,30]);
});
test('printAll should return [] when given []', () => {
  expect(arrays.printAll([])).toEqual([]);
});
test('printAll should return ["a","b","c"] when given ["a","b","c"]', () => {
  expect(arrays.printAll(["a","b","c"])).toEqual(["a","b","c"]);
});
test('printAll should return [true,false] when given [true,false]', () => {
  expect(arrays.printAll([true,false])).toEqual([true,false]);
});
