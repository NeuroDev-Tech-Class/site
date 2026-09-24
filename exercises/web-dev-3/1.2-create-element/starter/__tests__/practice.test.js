/*
  REQUIRED SELECTORS:
  - #entry      type
  - #add        click
  - #remove     click
  - #pick       click
  - #list       content
  - #list > *   content
  - #notice     content
*/

async function typeEntry(text) {
  const entryField = await page.$('#entry');
  await entryField.click({ clickCount: 3 }); // select all text
  await page.keyboard.press('Backspace'); // erase selected text
  await entryField.type(text);
}

describe('Library Web App', () => {
  beforeEach(async () => {
    const filePath = require('path').join(__dirname, '..', 'client', 'index.html');
    await page.goto(`file://${filePath}`);
  });

  it('shows a heading with a title', async () => {
    const heading = await page.$('h1');
    const content = await page.evaluate(el => el.textContent, heading);

    await expect(heading).toBeTruthy();
    await expect(content.length).toBeGreaterThan(1);
  });

  it('shows an input and three buttons', async () => {
    await expect(await page.$('#entry')).toBeTruthy();
    await expect(await page.$('#add')).toBeTruthy();
    await expect(await page.$('#remove')).toBeTruthy();
    await expect(await page.$('#pick')).toBeTruthy();
  });

  it('starts with an empty list', async () => {
    await expect(await page.$('#list')).toBeTruthy();
    const items = await page.$$('#list > *');
    await expect(items.length).toBe(0);
  });

  it('adds an item to the list', async () => {
    const addButton = await page.$('#add');

    await typeEntry('An awesome item!');
    await addButton.click();

    await expect(await page.$('#list')).toMatchTextContent('An awesome item!');

    const items = await page.$$('#list > *');
    await expect(items.length).toBe(1);
  });

  it('adds three items to the list', async () => {
    const addButton = await page.$('#add');

    await typeEntry('An awesome item!');
    await addButton.click();
    await typeEntry('Another awesome item!');
    await addButton.click();
    await typeEntry('Yet another awesome item!');
    await addButton.click();

    await expect(await page.$('#list')).toMatchTextContent('An awesome item!');
    await expect(await page.$('#list')).toMatchTextContent('Another awesome item!');
    await expect(await page.$('#list')).toMatchTextContent('Yet another awesome item!');

    const items = await page.$$('#list > *');
    await expect(items.length).toBe(3);
  });

  it('prevents adding an invalid item to the list', async () => {
    const addButton = await page.$('#add');

    await typeEntry('');
    await addButton.click();

    const items = await page.$$('#list > *');
    await expect(items.length).toBe(0);
  });

  it('removes an item from the list', async () => {
    const addButton = await page.$('#add');
    const removeButton = await page.$('#remove');

    await typeEntry('An awesome item!');
    await addButton.click();

    await typeEntry('An awesome item!');
    await removeButton.click();

    await expect(await page.$('#list')).not.toMatchTextContent('An awesome item!');

    const items = await page.$$('#list > *');
    await expect(items.length).toBe(0);
  });

  it('removes three items from the list', async () => {
    const addButton = await page.$('#add');
    const removeButton = await page.$('#remove');

    await typeEntry('An awesome item!');
    await addButton.click();
    await typeEntry('Another awesome item!');
    await addButton.click();
    await typeEntry('Yet another awesome item!');
    await addButton.click();

    await typeEntry('An awesome item!');
    await removeButton.click();
    await typeEntry('Another awesome item!');
    await removeButton.click();
    await typeEntry('Yet another awesome item!');
    await removeButton.click();

    await expect(await page.$('#list')).not.toMatchTextContent('An awesome item!');
    await expect(await page.$('#list')).not.toMatchTextContent('Another awesome item!');
    await expect(await page.$('#list')).not.toMatchTextContent('Yet another awesome item!');

    const items = await page.$$('#list > *');
    await expect(items.length).toBe(0);
  });

  it('prevents removing an invalid item from the list', async () => {
    const addButton = await page.$('#add');
    const removeButton = await page.$('#remove');

    await typeEntry('An awesome item!');
    await addButton.click();

    await typeEntry('');
    await removeButton.click();

    await expect(await page.$('#list')).toMatchTextContent('An awesome item!');

    const items = await page.$$('#list > *');
    await expect(items.length).toBe(1);
  });

  it('picks an item from the list', async () => {
    const addButton = await page.$('#add');
    const pickButton = await page.$('#pick');

    await typeEntry('An awesome item!');
    await addButton.click();
    await pickButton.click();

    await expect(await page.$('#notice')).toMatchTextContent('An awesome item!');
  });
});
