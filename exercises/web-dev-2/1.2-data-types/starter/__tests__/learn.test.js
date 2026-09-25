require('../practice'); // replace with your actual file name

test('log all values and type correctly', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const calls = consoleSpy.mock.calls.map(call => call[0]);

  // Check there are exactly 5 logs
  expect(calls.length).toBe(5);

  expect(typeof calls[0]).toBe('number'); 
  expect(typeof calls[1]).toBe('number');  
  expect(typeof calls[2]).toBe('string');  
  expect(typeof calls[3]).toBe('boolean'); 
  expect(calls[4]).toBe('string');

  consoleSpy.mockRestore();
});