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
