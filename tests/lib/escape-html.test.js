import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../../assets/js/lib/escape-html.js';

test('escapes the five HTML special characters', () => {
  assert.equal(escapeHtml(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
});

test('leaves ordinary text untouched', () => {
  assert.equal(escapeHtml('Jane Doe / jane@example.com'), 'Jane Doe / jane@example.com');
});

test('coerces null and undefined to an empty string', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('coerces numbers and booleans to text', () => {
  assert.equal(escapeHtml(42), '42');
  assert.equal(escapeHtml(false), 'false');
});

test('an injected image tag contains no angle brackets after escaping', () => {
  const out = escapeHtml('<img src=x onerror=alert(1)>');
  assert.equal(out.includes('<'), false);
  assert.equal(out.includes('>'), false);
  assert.equal(out, '&lt;img src=x onerror=alert(1)&gt;');
});

test('escaping twice is visible, not idempotent', () => {
  assert.equal(escapeHtml(escapeHtml('<b>')), '&amp;lt;b&amp;gt;');
});
