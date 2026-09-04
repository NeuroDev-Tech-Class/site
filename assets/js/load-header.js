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

// Build absolute URLs so dynamic imports never produce bare specifiers
const authModuleUrl = new URL(basePath + 'assets/js/auth.js', document.baseURI).toString();

// Load auth module after header is ready
import(authModuleUrl).catch(err => console.error('Failed to load auth module:', err));

// Protect reading material pages — block content until approval is confirmed
if (window.location.pathname.includes('/assets/pdfs/')) {
  const overlay = document.createElement('div');
  overlay.id = 'auth-guard-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0',
    'background:var(--background-color,#252b31)',
    'z-index:9998',
    'display:flex', 'align-items:center', 'justify-content:center'
  ].join(';');
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);

  const contentGuardUrl = new URL(basePath + 'assets/js/content-guard.js', document.baseURI).toString();
  import(contentGuardUrl)
    .then(({ requireApproval }) => requireApproval())
    .catch(() => window.location.replace(basePath + 'index.html'));
}
