import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeFirestore } from '../helpers/fake-firestore.js';
import { mailRepo, approvalMailDoc, certificateMailDoc } from '../../assets/js/data/mail.js';

const student = { firstName: 'jane', lastName: 'doe', email: 'jane@example.com' };
const siteUrl = 'https://neurodev-tech-class.github.io/site/';

test('approval mail keeps the existing subject, greets by first name and links to the profile', () => {
  const mail = approvalMailDoc(student, siteUrl);
  assert.equal(mail.to, 'jane@example.com');
  assert.equal(mail.message.subject, 'Your NeuroDev Account Has Been Approved!');
  assert.match(mail.message.html, /Welcome to NeuroDev, Jane!/);
  assert.match(mail.message.html, new RegExp(`href="${siteUrl}profile.html"`));
});

test('approval mail escapes a hostile first name', () => {
  const mail = approvalMailDoc({ ...student, firstName: '<b>Jane</b>' }, siteUrl);
  assert.equal(mail.message.html.includes('<b>'), false);
  assert.match(mail.message.html, /Welcome to NeuroDev, &lt;b&gt;Jane&lt;\/b&gt;!/);
});

test('certificate mail carries the subject, course name and base64 attachment', () => {
  const mail = certificateMailDoc(student, 'Python I', { filename: 'NeuroDev-Python_I-Jane_Doe.docx', content: 'QUJD' });
  assert.equal(mail.message.subject, 'Your NeuroDev Certificate — Python I');
  assert.match(mail.message.html, /Congratulations, Jane!/);
  assert.match(mail.message.html, /<strong>Python I<\/strong>/);
  assert.deepEqual(mail.message.attachments, [{ filename: 'NeuroDev-Python_I-Jane_Doe.docx', content: 'QUJD', encoding: 'base64' }]);
});

test('queueCertificate adds a document to the mail collection', async () => {
  const fs = createFakeFirestore();
  const mail = mailRepo(fs);
  await mail.queueCertificate(student, 'Linux', { filename: 'x.docx', content: 'QUJD' });
  assert.deepEqual(fs.writes.map(w => [w.type, w.path.split('/')[0]]), [['add', 'mail']]);
  assert.equal(fs.get(fs.writes[0].path).message.subject, 'Your NeuroDev Certificate — Linux');
});

test('the browser repo has no approval sender; that lives in the onUserWrite function', () => {
  assert.equal(mailRepo(createFakeFirestore()).queueApproval, undefined);
});
