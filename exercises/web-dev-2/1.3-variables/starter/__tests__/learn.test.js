require('../practice');

test('Expecting ', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  expect(consoleSpy).toHaveBeenCalledWith(18.849552);
  consoleSpy.mockRestore();
});