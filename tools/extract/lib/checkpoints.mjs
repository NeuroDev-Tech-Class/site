// Lesson pages and notes that ask students to produce work become checkpoints. tools/extract/checkpoints.json says
// which, and with what form fields; keys are a lesson path under assets/pdfs, or "note:<course>:<legacy key>".
import { JSDOM } from 'jsdom';

export const FIELD_TYPES = ['longText', 'shortText', 'url', 'file', 'image', 'code', 'checklist', 'mentorSignOff'];
export const FORM_INSTRUCTION = 'Submit your work with the form below.';

const SUBMISSION_EMAIL = /neurodevtechcoach@gmail\.com|instructor@neurodevtech\.com/i;
// "email/send/share ... to/with your (tech) coach/instructor": an instruction to hand work in, not a lesson about email
const SEND_TO_COACH = /\b(email|e-mail|send|share)\b[^.!?]*\b(to|with)\b[^.!?]*\b(tech coach|coach|instructor)\b/i;

export function validateSpec(spec, targets) {
  const problems = [];
  for (const [key, checkpoint] of Object.entries(spec)) {
    const say = message => problems.push(`${key}: ${message}`);
    const known = key.startsWith('note:') ? targets.notes.has(key) : targets.lessons.has(key);
    if (!known) say('no course item has this page');
    const fields = checkpoint.fields || [];
    if (!fields.length) say('has no fields');

    const ids = new Set();
    for (const field of fields) {
      if (ids.has(field.id)) say(`field id ${field.id} is used twice`);
      ids.add(field.id);
      if (!FIELD_TYPES.includes(field.type)) say(`${field.id} has unknown type ${field.type}`);
      if (!field.label?.trim()) say(`${field.id} has no label`);
      if (field.type === 'file' && !field.accept?.length) say(`file ${field.id} lists no accepted extensions`);
      if (field.type === 'checklist' && !field.items?.length) say(`checklist ${field.id} has no items`);
    }
    for (const group of checkpoint.required_one_of || []) {
      for (const id of group) if (!ids.has(id)) say(`required_one_of names ${id}, which is not a field`);
    }
    if (Boolean(checkpoint.requires_sign_off) !== fields.some(f => f.type === 'mentorSignOff')) {
      say('requires_sign_off does not match its mentorSignOff fields');
    }
  }
  return problems;
}

const asksForEmailedWork = text => SUBMISSION_EMAIL.test(text) || SEND_TO_COACH.test(text);
const textOf = el => el.textContent.replace(/\s+/g, ' ').trim();

/** The sentences telling students to email their work become one sentence pointing at the form; the rest of the
 *  paragraph stays. Only the innermost paragraph or list item is changed. */
export function replaceSubmissionEmails(html, where, found) {
  const holder = JSDOM.fragment('<div></div>').firstChild;
  holder.innerHTML = html;
  const matches = [...holder.querySelectorAll('p, li')].filter(el => asksForEmailedWork(textOf(el)));
  for (const el of matches) {
    if (matches.some(other => other !== el && el.contains(other))) continue;
    const before = textOf(el);
    const kept = before.split(/(?<=[.!?:])\s+/).filter(sentence => !asksForEmailedWork(sentence));
    const after = [...kept, FORM_INSTRUCTION].join(' ');
    // Anything besides the email link itself would be flattened to plain text: say so, so a person checks it
    const markup = [...el.querySelectorAll('*')].some(child => !(child.tagName === 'A' && SUBMISSION_EMAIL.test(child.textContent)));
    found.push({ kind: 'email-replaced', where, before, after, flattened: markup && kept.length > 0 });
    el.textContent = after;
  }
  return holder.innerHTML;
}
