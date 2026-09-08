import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { handleUserWrite } from './lib/user-write.js';

const SITE_URL = 'https://neurodev-tech-class.github.io/site/';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

export const onUserWrite = onDocumentWritten('users/{uid}', async event => {
  const before = event.data?.before?.exists ? event.data.before.data() : null;
  const after = event.data?.after?.exists ? event.data.after.data() : null;
  const deps = { auth: getAuth(), db: getFirestore(), FieldValue, siteUrl: SITE_URL };
  await handleUserWrite(deps, event.params.uid, before, after);
});
