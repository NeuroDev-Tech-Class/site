// Custom auth claims mirror role and status from users/{uid}. Rules read the token, not the document.
export function claimsFor(userDoc) {
  if (!userDoc) return null;
  const claims = {};
  if (typeof userDoc.role === 'string') claims.role = userDoc.role;
  if (typeof userDoc.status === 'string') claims.status = userDoc.status;
  return claims;
}

function sameClaims(current, next) {
  if (next === null) return current.role === undefined && current.status === undefined;
  return current.role === next.role && current.status === next.status;
}

export async function syncClaims(auth, uid, userDoc, { dryRun = false } = {}) {
  const next = claimsFor(userDoc);
  let user;
  try {
    user = await auth.getUser(uid);
  } catch (err) {
    if (err.code === 'auth/user-not-found') return { changed: false, reason: 'no-auth-user' };
    throw err;
  }
  if (sameClaims(user.customClaims || {}, next)) return { changed: false };
  if (!dryRun) await auth.setCustomUserClaims(uid, next);
  return { changed: true, claims: next };
}
