require('../practice'); // replace with your actual file name

test('log all values and type correctly', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const calls = consoleSpy.mock.calls.map(call => call[0]);

  expect(calls[0].split(" ").length).toBe(8); 
  expect(calls[1].length).toBe(2);  

  consoleSpy.mockRestore();
});