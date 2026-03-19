// Content access guard — protects course material from unapproved/unauthenticated users.
// Used by:
//   - load-header.js  (auto-applied to all /assets/pdfs/ reading pages)
//   - slides.html     (gates the slideshow iframe)
//   - form.html       (gates the quiz iframe)

import { auth, db, doc, getDoc, onAuthStateChanged } from './firebase-config.js';

/**
 * Verifies the current user is authenticated and approved.
 * Redirects to the home page immediately if not.
 * Removes the #auth-guard-overlay (if present) and calls onApproved() on success.
 *
 * @param {Function} [onApproved] - Optional callback run once access is confirmed.
 */
export function requireApproval(onApproved) {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      unsubscribe();
      window.location.replace('index.html');
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (!snap.exists() || snap.data().status !== 'approved') {
        unsubscribe();
        window.location.replace('index.html');
        return;
      }
    } catch {
      unsubscribe();
      window.location.replace('index.html');
      return;
    }

    // Access confirmed — stop listening and reveal content
    unsubscribe();
    document.getElementById('auth-guard-overlay')?.remove();
    if (onApproved) onApproved();
  });
}
