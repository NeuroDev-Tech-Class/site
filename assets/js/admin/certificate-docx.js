export function getOrdinalSuffix(day) {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  const mod10 = day % 10;
  if (mod10 === 1) return 'st';
  if (mod10 === 2) return 'nd';
  if (mod10 === 3) return 'rd';
  return 'th';
}

export function formatCertificateDatePhrase(date) {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  return `Given this ${day}${getOrdinalSuffix(day)} day of ${month}, ${date.getFullYear()},`;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function uint8ToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function base64ToUint8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function sanitizeFilePart(value) {
  return String(value || '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_');
}

export function buildCertificateFileName(courseName, studentName) {
  return `NeuroDev-${sanitizeFilePart(courseName)}-${sanitizeFilePart(studentName)}.docx`;
}

// Returns the filled certificate as base64 so it can be both downloaded and attached to mail.
export async function generateCertificateDocx({ JSZip, templateBytes }, studentName, courseName, date) {
  const zip = await JSZip.loadAsync(templateBytes);
  const documentXmlFile = zip.file('word/document.xml');
  if (!documentXmlFile) throw new Error('Invalid DOCX template: missing word/document.xml');

  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();

  let documentXml = await documentXmlFile.async('string');
  documentXml = documentXml
    .replace(/\[STUDENT NAME\]/g, xmlEscape(studentName))
    .replace(/\[COURSE\]/g, xmlEscape(courseName))
    .replace(/Given this XXth day of Month,\s*20XX,/g, xmlEscape(formatCertificateDatePhrase(date)))
    // Fallbacks for a template whose date phrase is split across runs.
    .replace(/XXth/g, xmlEscape(`${day}${getOrdinalSuffix(day)}`))
    .replace(/\bMonth\b/g, xmlEscape(month))
    .replace(/20XX/g, xmlEscape(String(year)));

  zip.file('word/document.xml', documentXml);
  return uint8ToBase64(await zip.generateAsync({ type: 'uint8array' }));
}
