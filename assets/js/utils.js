function capitalize(word) {
  return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

function isSingleCase(word) {
  return word === word.toLowerCase() || word === word.toUpperCase();
}

// Fixes "john" and "SMITH" but leaves deliberate mixed case like "McDonald" alone
export function formatName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\s'-]+/g, word => (isSingleCase(word) ? capitalize(word) : word));
}

export function fullName(user) {
  return `${formatName(user.firstName)} ${formatName(user.lastName)}`;
}

export function isAdmin(user) {
  return user?.role === 'admin' || user?.role === 'superadmin';
}
