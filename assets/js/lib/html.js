import { escapeHtml } from './escape-html.js';

class SafeHtml {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

function render(value) {
  if (value instanceof SafeHtml) return value.value;
  if (value === null || value === undefined || value === false) return '';
  if (Array.isArray(value)) return value.map(render).join('');
  return escapeHtml(value);
}

// Tagged template: every interpolation is escaped unless it is already SafeHtml.
export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, i) => {
    out += render(value) + strings[i + 1];
  });
  return new SafeHtml(out);
}

// Opt out of escaping. Only for markup that has already been sanitized.
export function raw(markup) {
  return new SafeHtml(markup === null || markup === undefined ? '' : String(markup));
}

export function join(items, separator = '') {
  return new SafeHtml(items.map(render).join(render(separator)));
}

export function isSafeHtml(value) {
  return value instanceof SafeHtml;
}
