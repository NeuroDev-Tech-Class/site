import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatName, fullName, isAdmin, toDate, formatDate, timeAgo } from '../../assets/js/lib/format.js';

const noonUtc = new Date('2026-09-08T12:00:00Z');

test('formatName fixes single-case words and keeps deliberate mixed case', () => {
  assert.equal(formatName('john'), 'John');
  assert.equal(formatName('SMITH'), 'Smith');
  assert.equal(formatName('McDonald'), 'McDonald');
  assert.equal(formatName('  mary   ann '), 'Mary Ann');
  assert.equal(formatName('anne-marie'), 'Anne-Marie');
  assert.equal(formatName(null), '');
});

test('fullName joins the formatted first and last names', () => {
  assert.equal(fullName({ firstName: 'john', lastName: 'SMITH' }), 'John Smith');
});

test('isAdmin is true for admin and superadmin only', () => {
  assert.equal(isAdmin({ role: 'admin' }), true);
  assert.equal(isAdmin({ role: 'superadmin' }), true);
  assert.equal(isAdmin({ role: 'student' }), false);
  assert.equal(isAdmin(null), false);
});

test('toDate accepts Timestamps, ISO strings, numbers and Dates, and rejects junk', () => {
  assert.equal(toDate({ toDate: () => noonUtc }).getTime(), noonUtc.getTime());
  assert.equal(toDate('2026-09-08T12:00:00Z').getTime(), noonUtc.getTime());
  assert.equal(toDate(noonUtc.getTime()).getTime(), noonUtc.getTime());
  assert.equal(toDate(noonUtc), noonUtc);
  assert.equal(toDate(null), null);
  assert.equal(toDate(undefined), null);
  assert.equal(toDate('not a date'), null);
});

test('formatDate renders short and long months in en-US', () => {
  assert.equal(formatDate(noonUtc), 'Sep 8, 2026');
  assert.equal(formatDate(noonUtc, { month: 'long' }), 'September 8, 2026');
  assert.equal(formatDate({ toDate: () => noonUtc }), 'Sep 8, 2026');
  assert.equal(formatDate('2026-09-08T12:00:00Z', { month: 'long' }), 'September 8, 2026');
});

test('formatDate returns the fallback for missing or invalid input', () => {
  assert.equal(formatDate(null), '');
  assert.equal(formatDate(undefined, { fallback: 'N/A' }), 'N/A');
  assert.equal(formatDate('garbage', { fallback: 'N/A' }), 'N/A');
});

test('timeAgo counts minutes, hours and days, then falls back to a date', () => {
  const now = new Date('2026-09-11T18:00:00Z');
  const ago = ms => timeAgo(new Date(now.getTime() - ms), now);
  assert.equal(ago(0), 'just now');
  assert.equal(ago(45 * 1000), 'just now');
  assert.equal(ago(60 * 1000), '1 minute ago');
  assert.equal(ago(5 * 60 * 1000), '5 minutes ago');
  assert.equal(ago(60 * 60 * 1000), '1 hour ago');
  assert.equal(ago(5 * 60 * 60 * 1000), '5 hours ago');
  assert.equal(ago(26 * 60 * 60 * 1000), 'yesterday');
  assert.equal(ago(3 * 24 * 60 * 60 * 1000), '3 days ago');
  assert.equal(ago(8 * 24 * 60 * 60 * 1000), 'Sep 3, 2026');
});

test('timeAgo accepts the shapes toDate accepts, and a clock running ahead', () => {
  const now = new Date('2026-09-11T18:00:00Z');
  const earlier = new Date('2026-09-11T17:00:00Z');
  assert.equal(timeAgo(earlier.toISOString(), now), '1 hour ago');
  assert.equal(timeAgo({ toDate: () => earlier }, now), '1 hour ago');
  assert.equal(timeAgo(new Date(now.getTime() + 60000), now), 'just now');
  assert.equal(timeAgo(null, now), '');
  assert.equal(timeAgo('garbage', now), '');
});
