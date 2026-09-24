require('../practice');

test('Expect the answer 14', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  expect(consoleSpy).toHaveBeenCalledWith(14);
  consoleSpy.mockRestore();
});