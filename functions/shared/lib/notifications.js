import { fullName, toDate } from './format.js';
import { scoreLabel, statusLabel } from './submissions.js';

// One place for every sentence an inbox notification or an activity line shows, so the wording
// the functions store matches what the UI renders. Plain text: escaping happens at render.
// Firestore rejects undefined in any field, so every value here falls back to something readable.
export const NOTIFICATION_TYPES = {
  SUBMISSION_GRADED: 'submission_graded',
  SUBMISSION_RECEIVED: 'submission_received',
  ACCOUNT_APPROVED: 'account_approved',
  CERTIFICATE_AWARDED: 'certificate_awarded',
  NEW_REGISTRATION: 'new_registration'
};

export const TYPE_LABELS = {
  [NOTIFICATION_TYPES.SUBMISSION_GRADED]: 'Work graded',
  [NOTIFICATION_TYPES.SUBMISSION_RECEIVED]: 'Work submitted',
  [NOTIFICATION_TYPES.ACCOUNT_APPROVED]: 'Account approved',
  [NOTIFICATION_TYPES.CERTIFICATE_AWARDED]: 'Certificate awarded',
  [NOTIFICATION_TYPES.NEW_REGISTRATION]: 'New registration'
};

const PROFILE = 'profile.html';
const gradeLink = id => `admin.html#/grade/${id}`;
const studentLink = uid => `admin.html#/students/${uid}`;

const actorNameOf = actor => actor?.name || '';
const actorOr = (actor, fallback) => actor?.name || fallback;
const displayName = user => fullName(user || {}).trim() || 'A student';

const studentOf = sub => sub.studentName || 'A student';
const ownItem = sub => sub.itemTitle || 'Your work';
const theirItem = sub => sub.itemTitle || 'their work';
// After a possessive ("Jane's ..."), the pronoun is already there.
const possessedItem = sub => sub.itemTitle || 'work';
const coursePrefix = name => (name ? `${name}: ` : '');
const courseSuffix = name => (name ? ` (${name})` : '');
const kindWord = sub => (sub?.kind === 'checkpoint' ? 'checkpoint' : 'test');

// The stored gradedAt, not the current time, so a retry rebuilds the same id and a re-grade does not.
const gradedStamp = sub => toDate(sub?.gradedAt)?.getTime() ?? null;

const activityBase = (type, { actor, subjectUid, subjectName, courseId, courseName, link }) => ({
  type,
  actorUid: actor?.uid || '',
  actorName: actorNameOf(actor),
  subjectUid: subjectUid || '',
  subjectName: subjectName || '',
  courseId: courseId || '',
  courseName: courseName || '',
  link
});

export function gradedNotification(sub, actor) {
  const stamp = gradedStamp(sub);
  if (stamp === null) return null;
  return {
    id: `${sub.id}__graded__${stamp}`,
    type: NOTIFICATION_TYPES.SUBMISSION_GRADED,
    title: `${ownItem(sub)} graded`,
    body: `${coursePrefix(sub.courseName)}you scored ${scoreLabel(sub)}. ${statusLabel(sub)}.`,
    link: PROFILE,
    actorName: actorNameOf(actor)
  };
}

export function gradedActivity(sub, actor) {
  const stamp = gradedStamp(sub);
  if (stamp === null) return null;
  return {
    id: `graded__${sub.id}__${stamp}`,
    ...activityBase(NOTIFICATION_TYPES.SUBMISSION_GRADED, {
      actor,
      subjectUid: sub.studentUid,
      subjectName: studentOf(sub),
      courseId: sub.courseId,
      courseName: sub.courseName,
      link: gradeLink(sub.id)
    }),
    summary: `${actorOr(actor, 'An admin')} graded ${studentOf(sub)}'s ${possessedItem(sub)} (${scoreLabel(sub)})`
  };
}

export function receivedNotification(sub) {
  return {
    id: `${sub.id}__received`,
    type: NOTIFICATION_TYPES.SUBMISSION_RECEIVED,
    title: `New ${kindWord(sub)} to grade`,
    body: `${studentOf(sub)} submitted ${theirItem(sub)}${courseSuffix(sub.courseName)}.`,
    link: gradeLink(sub.id),
    actorName: sub.studentName || ''
  };
}

export function receivedActivity(sub) {
  return {
    id: `received__${sub.id}`,
    ...activityBase(NOTIFICATION_TYPES.SUBMISSION_RECEIVED, {
      actor: { uid: sub.studentUid, name: sub.studentName },
      subjectUid: sub.studentUid,
      subjectName: studentOf(sub),
      courseId: sub.courseId,
      courseName: sub.courseName,
      link: gradeLink(sub.id)
    }),
    summary: `${studentOf(sub)} submitted ${theirItem(sub)}`
  };
}

export function approvedNotification(uid, actor) {
  return {
    id: `approved__${uid}`,
    type: NOTIFICATION_TYPES.ACCOUNT_APPROVED,
    title: 'Your account is approved',
    body: 'You can now open your courses and see your work.',
    link: PROFILE,
    actorName: actorNameOf(actor)
  };
}

export function approvedActivity(uid, user, actor) {
  return {
    id: `approved__${uid}`,
    ...activityBase(NOTIFICATION_TYPES.ACCOUNT_APPROVED, {
      actor,
      subjectUid: uid,
      subjectName: displayName(user),
      link: studentLink(uid)
    }),
    summary: `${actorOr(actor, 'An admin')} approved ${displayName(user)}`
  };
}

export function certificateNotification(cert, actor) {
  if (!cert?.courseId) return null;
  return {
    id: `cert__${cert.courseId}`,
    type: NOTIFICATION_TYPES.CERTIFICATE_AWARDED,
    title: cert.courseName ? `${cert.courseName} certificate awarded` : 'Certificate awarded',
    body: 'Your certificate has been emailed to you.',
    link: PROFILE,
    actorName: actorNameOf(actor)
  };
}

export function certificateActivity(uid, user, cert, actor) {
  if (!cert?.courseId) return null;
  const what = cert.courseName ? `the ${cert.courseName} certificate` : 'a certificate';
  return {
    id: `cert__${uid}__${cert.courseId}`,
    ...activityBase(NOTIFICATION_TYPES.CERTIFICATE_AWARDED, {
      actor,
      subjectUid: uid,
      subjectName: displayName(user),
      courseId: cert.courseId,
      courseName: cert.courseName,
      link: studentLink(uid)
    }),
    summary: `${actorOr(actor, 'An admin')} awarded ${displayName(user)} ${what}`
  };
}

export function registrationNotification(uid, user) {
  return {
    id: `signup__${uid}`,
    type: NOTIFICATION_TYPES.NEW_REGISTRATION,
    title: 'New registration',
    body: `${displayName(user)} signed up and is waiting for approval.`,
    link: 'admin.html#/students?tab=pending',
    actorName: displayName(user)
  };
}

export function registrationActivity(uid, user) {
  return {
    id: `signup__${uid}`,
    ...activityBase(NOTIFICATION_TYPES.NEW_REGISTRATION, {
      actor: { uid, name: displayName(user) },
      subjectUid: uid,
      subjectName: displayName(user),
      link: studentLink(uid)
    }),
    summary: `${displayName(user)} signed up`
  };
}
