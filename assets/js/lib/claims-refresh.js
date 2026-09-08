// Claims update on the server; the client token lags until it is refreshed.
export function needsTokenRefresh(userDoc, claims) {
  if (!userDoc) return false;
  const token = claims || {};
  return token.role !== userDoc.role || token.status !== userDoc.status;
}

export async function refreshTokenIfStale(user, userDoc) {
  const { claims } = await user.getIdTokenResult();
  if (!needsTokenRefresh(userDoc, claims)) return false;
  await user.getIdToken(true);
  return true;
}
