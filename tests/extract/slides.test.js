import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deckId, slidesFromMarkdown, withSlides } from '../../tools/extract/lib/slides.mjs';

const DECK = `## What Is Version Control?

A way to keep every version of your work.

---

## Why use it

- Go back to any earlier version
- Work together without overwriting each other

![A branching timeline](/images/slides/version-control/branches.webp)
`;

test('a deck id comes from any Google Slides address', () => {
  assert.equal(deckId('https://docs.google.com/presentation/d/1AfwUX_T-dBr3/edit?usp=sharing'), '1AfwUX_T-dBr3');
  assert.equal(deckId('https://docs.google.com/presentation/u/0/d/1A5Wxnjh8/'), '1A5Wxnjh8');
  assert.equal(deckId('https://example.com/slides'), null);
  assert.equal(deckId('https://example.com/d/not-a-deck'), null);
});

test('slides are separated by --- lines and each becomes its own HTML', () => {
  const slides = slidesFromMarkdown(DECK, 'version-control');
  assert.equal(slides.length, 2);
  assert.equal(slides[0], '<h2>What Is Version Control?</h2>\n<p>A way to keep every version of your work.</p>');
  assert.match(slides[1], /<li>Go back to any earlier version<\/li>/);
  assert.match(slides[1], /<img src="\/images\/slides\/version-control\/branches.webp" alt="A branching timeline">/);
});

test('an empty slide or markup outside the lesson vocabulary is refused, naming the deck and slide', () => {
  assert.throws(() => slidesFromMarkdown('## One\n\n---\n\n---\n\n## Three\n', 'deck-a'), /deck-a: slide 2 is empty/);
  assert.throws(() => slidesFromMarkdown('# Too big\n', 'deck-b'), /deck-b: slide 1 has tag <h1>/);
  assert.throws(() => slidesFromMarkdown('<script>alert(1)</script>\n', 'deck-c'), /deck-c: slide 1 has tag <script>/);
});

test('a slides item with a deck file carries its slides instead of the Google link; others keep theirs', () => {
  const course = {
    id: 'python-2',
    units: [{ items: [
      { id: 'i_s', type: 'slides', title: 'Slideshow - Git', payload: { slides_url: 'https://docs.google.com/presentation/d/DECK1/edit' } },
      { id: 'i_t', type: 'slides', title: 'Slideshow - Other', payload: { slides_url: 'https://docs.google.com/presentation/d/DECK2/edit' } },
      { id: 'i_r', type: 'lesson', title: 'Reading', payload: { legacy_path: 'x.html' } },
    ] }],
  };
  const used = new Set();
  const [git, other, reading] = withSlides(course, new Map([['DECK1', ['<h2>One</h2>']]]), used).units[0].items;
  assert.deepEqual(git.payload, { slides: ['<h2>One</h2>'] });
  assert.deepEqual(other.payload, { slides_url: 'https://docs.google.com/presentation/d/DECK2/edit' });
  assert.deepEqual(reading.payload, { legacy_path: 'x.html' });
  assert.equal(git.id, 'i_s');
  assert.deepEqual([...used], ['DECK1']);
});
