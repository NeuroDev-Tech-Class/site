document.querySelector("header").innerHTML = `
  <img
    src="assets/images/logo-white.png"
    alt="NeuroDev Logo"
    class="logo"
  />
  <nav>
    <a href="index.html">Home</a>
    <a href="catalog.html">Course Catalog</a>
    <a href="resources.html">Resources</a>
  </nav>
`;

// Determine correct path for auth module based on environment
const isLocalDev = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
const basePath = isLocalDev && !window.location.pathname.includes('/site/') ? '' : '/site/';
const authPath = basePath + 'assets/js/auth.js';

// Load auth module after header is ready
import(authPath).catch(err => console.error('Failed to load auth module:', err));

// Protect reading material pages — block content until approval is confirmed
if (window.location.pathname.includes('/assets/pdfs/')) {
  const overlay = document.createElement('div');
  overlay.id = 'auth-guard-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0',
    'background:var(--bg-color,#0e1117)',
    'z-index:9998',
    'display:flex', 'align-items:center', 'justify-content:center',
    'font-family:sans-serif', 'font-size:0.875rem',
    'color:#888', 'letter-spacing:0.04em'
  ].join(';');
  overlay.textContent = 'Verifying access\u2026';
  document.body.appendChild(overlay);

  import(basePath + 'assets/js/content-guard.js')
    .then(({ requireApproval }) => requireApproval())
    .catch(() => window.location.replace(basePath + 'index.html'));
}
