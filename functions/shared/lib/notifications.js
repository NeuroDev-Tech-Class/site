import { fullName, toDate } from './format.js';
import { scoreLabel, statusLabel } from './submissions.js';

// One place for every sentence an inbox notification or an activity line shows, so the wording
// the functions store matches what the UI renders. Plain text: escaping happens at render.
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
const kindWord = sub => (sub?.kind === 'checkpoint' ? 'checkpoint' : 'test');

// The stored gradedAt, not the current time, so a retry rebuilds the same id and a re-grade does not.
const gradedStamp = sub => toDate(sub?.gradedAt)?.getTime() ?? null;

const activityBase = (type, { actor, subjectUid, subjectName, courseId = '', courseName = '', link }) => ({
  type,
  actorUid: actor?.uid || '',
  actorName: actorNameOf(actor),
  subjectUid,
  subjectName,
  courseId,
  courseName,
  link
});

export function gradedNotification(sub, actor) {
  const stamp = gradedStamp(sub);
  if (stamp === null) return null;
  return {
    id: `${sub.id}__graded__${stamp}`,
    type: NOTIFICATION_TYPES.SUBMISSION_GRADED,
    title: `${sub.itemTitle} graded`,
    body: `${sub.courseName}: you scored ${scoreLabel(sub)}. ${statusLabel(sub)}.`,
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
      subjectName: sub.studentName,
      courseId: sub.courseId || '',
      courseName: sub.courseName || '',
      link: gradeLink(sub.id)
    }),
    summary: `${actorOr(actor, 'An admin')} graded ${sub.studentName}'s ${sub.itemTitle} (${scoreLabel(sub)})`
  };
}

export function receivedNotification(sub) {
  return {
    id: `${sub.id}__received`,
    type: NOTIFICATION_TYPES.SUBMISSION_RECEIVED,
    title: `New ${kindWord(sub)} to grade`,
    body: `${sub.studentName} submitted ${sub.itemTitle} (${sub.courseName}).`,
    link: gradeLink(sub.id),
    actorName: sub.studentName
  };
}

export function receivedActivity(sub) {
  return {
    id: `received__${sub.id}`,
    ...activityBase(NOTIFICATION_TYPES.SUBMISSION_RECEIVED, {
      actor: { uid: sub.studentUid, name: sub.studentName },
      subjectUid: sub.studentUid,
      subjectName: sub.studentName,
      courseId: sub.courseId || '',
      courseName: sub.courseName || '',
      link: gradeLink(sub.id)
    }),
    summary: `${sub.studentName} submitted ${sub.itemTitle}`
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
      subjectName: fullName(user),
      link: studentLink(uid)
    }),
    summary: `${actorOr(actor, 'An admin')} approved ${fullName(user)}`
  };
}

export function certificateNotification(cert, actor) {
  return {
    id: `cert__${cert.courseId}`,
    type: NOTIFICATION_TYPES.CERTIFICATE_AWARDED,
    title: `${cert.courseName} certificate awarded`,
    body: 'Your certificate has been emailed to you.',
    link: PROFILE,
    actorName: actorNameOf(actor)
  };
}

export function certificateActivity(uid, user, cert, actor) {
  return {
    id: `cert__${uid}__${cert.courseId}`,
    ...activityBase(NOTIFICATION_TYPES.CERTIFICATE_AWARDED, {
      actor,
      subjectUid: uid,
      subjectName: fullName(user),
      courseId: cert.courseId,
      courseName: cert.courseName,
      link: studentLink(uid)
    }),
    summary: `${actorOr(actor, 'An admin')} awarded ${fullName(user)} the ${cert.courseName} certificate`
  };
}

export function registrationNotification(uid, user) {
  return {
    id: `signup__${uid}`,
    type: NOTIFICATION_TYPES.NEW_REGISTRATION,
    title: 'New registration',
    body: `${fullName(user)} signed up and is waiting for approval.`,
    link: 'admin.html#/students?tab=pending',
    actorName: fullName(user)
  };
}

export function registrationActivity(uid, user) {
  return {
    id: `signup__${uid}`,
    ...activityBase(NOTIFICATION_TYPES.NEW_REGISTRATION, {
      actor: { uid, name: fullName(user) },
      subjectUid: uid,
      subjectName: fullName(user),
      link: studentLink(uid)
    }),
    summary: `${fullName(user)} signed up`
  };
}
