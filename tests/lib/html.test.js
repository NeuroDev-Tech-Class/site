import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, join, isSafeHtml } from '../../assets/js/lib/html.js';

test('interpolated strings are escaped', () => {
  const out = String(html`<p>${'<script>alert(1)</script>'}</p>`);
  assert.equal(out, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
});

test('attribute values are escaped so quotes cannot break out', () => {
  const out = String(html`<a title="${'x" onmouseover="alert(1)'}">t</a>`);
  assert.equal(out.includes('" onmouseover'), false);
  assert.equal(out, '<a title="x&quot; onmouseover=&quot;alert(1)">t</a>');
});

test('raw passes markup through untouched', () => {
  assert.equal(String(html`<div>${raw('<b>ok</b>')}</div>`), '<div><b>ok</b></div>');
});

test('nested html fragments are not double-escaped', () => {
  const inner = html`<em>${'a & b'}</em>`;
  assert.equal(String(html`<p>${inner}</p>`), '<p><em>a &amp; b</em></p>');
});

test('arrays of fragments are concatenated', () => {
  const items = ['<x>', 'y'].map(v => html`<li>${v}</li>`);
  assert.equal(String(html`<ul>${items}</ul>`), '<ul><li>&lt;x&gt;</li><li>y</li></ul>');
});

test('join concatenates with an escaped separator', () => {
  assert.equal(String(join(['a', html`<b>b</b>`], ' <> ')), 'a &lt;&gt; <b>b</b>');
});

test('null, undefined and false render as nothing; numbers render as text', () => {
  assert.equal(String(html`[${null}${undefined}${false}${0}${42}]`), '[042]');
});

test('the result is recognisable as safe and stringifies', () => {
  const frag = html`<i></i>`;
  assert.equal(isSafeHtml(frag), true);
  assert.equal(isSafeHtml('<i></i>'), false);
  assert.equal(`${frag}`, '<i></i>');
});
