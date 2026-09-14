import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { handleUserWrite } from './lib/user-write.js';
import { handleSubmissionWrite } from './lib/submission-write.js';
import { handleInboxWrite } from './lib/inbox-write.js';

const SITE_URL = 'https://neurodev-tech-class.github.io/site/';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

export const onUserWrite = onDocumentWritten('users/{uid}', async event => {
  const before = event.data?.before?.exists ? event.data.before.data() : null;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  const deps = { auth: getAuth(), db: getFirestore(), FieldValue, siteUrl: SITE_URL };
  await handleUserWrite(deps, event.params.uid, before, after);
});

export const onSubmissionWrite = onDocumentWritten('submissions/{id}', async event => {
  const before = event.data?.before?.exists ? event.data.before.data() : null;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  await handleSubmissionWrite({ db: getFirestore(), FieldValue }, event.params.id, before, after);
});

export const onInboxWrite = onDocumentWritten('users/{uid}/inbox/{notifId}', async event => {
  const before = event.data?.before?.exists ? event.data.before.data() : null;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  await handleInboxWrite({ db: getFirestore(), FieldValue }, event.params.uid, before, after);
});
