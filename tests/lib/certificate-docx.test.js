import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  formatCertificateDatePhrase, buildCertificateFileName, generateCertificateDocx, base64ToUint8
} from '../../assets/js/admin/certificate-docx.js';

// The vendored UMD build is what the browser runs; load the same file here.
function loadJSZip() {
  const source = readFileSync(new URL('../../assets/vendor/jszip.min.js', import.meta.url), 'utf8');
  const module = { exports: {} };
  new Function('module', 'exports', source)(module, module.exports);
  return module.exports;
}

const templateBytes = readFileSync(new URL('../../assets/pdfs/Certificate-Template.docx', import.meta.url));

test('formatCertificateDatePhrase uses the right ordinal suffix', () => {
  const phrase = (y, m, d) => formatCertificateDatePhrase(new Date(y, m, d));
  assert.equal(phrase(2026, 8, 3), 'Given this 3rd day of September, 2026,');
  assert.equal(phrase(2026, 0, 1), 'Given this 1st day of January, 2026,');
  assert.equal(phrase(2026, 1, 2), 'Given this 2nd day of February, 2026,');
  assert.equal(phrase(2026, 10, 11), 'Given this 11th day of November, 2026,');
  assert.equal(phrase(2026, 11, 12), 'Given this 12th day of December, 2026,');
  assert.equal(phrase(2026, 2, 13), 'Given this 13th day of March, 2026,');
  assert.equal(phrase(2026, 3, 21), 'Given this 21st day of April, 2026,');
  assert.equal(phrase(2026, 4, 22), 'Given this 22nd day of May, 2026,');
  assert.equal(phrase(2026, 5, 23), 'Given this 23rd day of June, 2026,');
});

test('buildCertificateFileName strips unsafe characters and joins words with underscores', () => {
  assert.equal(
    buildCertificateFileName('Python I - Programming Fundamentals', 'Jane Doe'),
    'NeuroDev-Python_I_-_Programming_Fundamentals-Jane_Doe.docx'
  );
  assert.equal(buildCertificateFileName('A/B:C*D?E"F<G>H|I', ' x  y '), 'NeuroDev-ABCDEFGHI-x_y.docx');
});

test('base64ToUint8 round-trips bytes', () => {
  assert.deepEqual([...base64ToUint8(btoa('hi'))], [104, 105]);
});

test('generateCertificateDocx fills every placeholder in the real template and escapes XML', async () => {
  const JSZip = loadJSZip();
  const base64 = await generateCertificateDocx(
    { JSZip, templateBytes }, "Jane O'Brien & Co", 'Web Development I - HTML & CSS', new Date(2026, 8, 3)
  );
  const zip = await JSZip.loadAsync(base64ToUint8(base64));
  const xml = await zip.file('word/document.xml').async('string');
  assert.ok(xml.includes('Jane O&apos;Brien &amp; Co'));
  assert.ok(xml.includes('Web Development I - HTML &amp; CSS'));
  assert.ok(xml.includes('3rd day of September, 2026'));
  for (const leftover of ['[STUDENT NAME]', '[COURSE]', 'XXth', '20XX', 'Given this XXth']) {
    assert.equal(xml.includes(leftover), false, `template still contains ${leftover}`);
  }
});

test('generateCertificateDocx rejects a template without word/document.xml', async () => {
  const JSZip = loadJSZip();
  const empty = await new JSZip().file('readme.txt', 'x').generateAsync({ type: 'uint8array' });
  await assert.rejects(
    generateCertificateDocx({ JSZip, templateBytes: empty }, 'A', 'B', new Date(2026, 0, 1)),
    /missing word\/document\.xml/
  );
});
