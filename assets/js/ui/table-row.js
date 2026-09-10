import { html } from '../lib/html.js';

export const loadingRow = colspan => html`
  <tr>
    <td colspan="${colspan}" class="loading-state">
      <div class="spinner"></div>
      <p>Loading...</p>
    </td>
  </tr>
`;

export const emptyRow = (colspan, message) => html`
  <tr>
    <td colspan="${colspan}" class="empty-state"><p>${message}</p></td>
  </tr>
`;
