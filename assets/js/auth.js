// Authentication System for Tech Class
import { 
  auth, 
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from './firebase-config.js';

// User state
let currentUser = null;
let userData = null;

// Session management
const SESSION_KEY = 'nd_session_expiry';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Initialize auth system - handle case where DOM is already loaded
// (auth.js is dynamically imported so DOMContentLoaded may have already fired)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

async function initAuth() {
  createAuthModal();
  createUserMenu();
  
  // Listen for auth state changes
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      // Check session expiry (only applies when Remember Me was not used)
      const expiry = localStorage.getItem(SESSION_KEY);
      if (expiry && Date.now() > Number(expiry)) {
        localStorage.removeItem(SESSION_KEY);
        await signOut(auth);
        return;
      }
      // Fetch user data from Firestore
      userData = await getUserData(user.uid);
      updateUIForLoggedInUser();
    } else {
      userData = null;
      updateUIForLoggedOutUser();
    }
  });
}

// Create the authentication modal HTML
function createAuthModal() {
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-modal-content">
      <button class="auth-modal-close" aria-label="Close">&times;</button>
      
      <!-- Login Form -->
      <div id="login-form" class="auth-form active">
        <h2>Welcome Back</h2>
        <p class="auth-subtitle">Sign in to track your progress</p>
        
        <form id="login-form-element">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input type="email" id="login-email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" required autocomplete="current-password">
          </div>
          <div class="form-group remember-row">
            <label class="remember-label">
              <input type="checkbox" id="login-remember" autocomplete="off">
              Remember me
            </label>
          </div>
          <div class="form-error" id="login-error"></div>
          <button type="submit" class="auth-btn primary">Sign In</button>
        </form>
        
        <div class="auth-links">
          <button type="button" class="link-btn" id="show-forgot">Forgot Password?</button>
          <p>Don't have an account? <button type="button" class="link-btn" id="show-register">Register</button></p>
        </div>
      </div>
      
      <!-- Register Form -->
      <div id="register-form" class="auth-form">
        <h2>Create Account</h2>
        <p class="auth-subtitle">Start your learning journey</p>
        
        <form id="register-form-element">
          <div class="form-row">
            <div class="form-group">
              <label for="register-firstname">First Name</label>
              <input type="text" id="register-firstname" required autocomplete="given-name">
            </div>
            <div class="form-group">
              <label for="register-lastname">Last Name</label>
              <input type="text" id="register-lastname" required autocomplete="family-name">
            </div>
          </div>
          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" required minlength="6" autocomplete="new-password">
            <span class="form-hint">At least 6 characters</span>
          </div>
          <div class="form-group">
            <label for="register-confirm">Confirm Password</label>
            <input type="password" id="register-confirm" required autocomplete="new-password">
          </div>
          <div class="form-error" id="register-error"></div>
          <button type="submit" class="auth-btn primary">Register</button>
        </form>
        
        <div class="auth-links">
          <p>Already have an account? <button type="button" class="link-btn" id="show-login">Sign In</button></p>
        </div>
      </div>
      
      <!-- Forgot Password Form -->
      <div id="forgot-form" class="auth-form">
        <h2>Reset Password</h2>
        <p class="auth-subtitle">We'll send you a reset link</p>
        
        <form id="forgot-form-element">
          <div class="form-group">
            <label for="forgot-email">Email</label>
            <input type="email" id="forgot-email" required autocomplete="email">
          </div>
          <div class="form-error" id="forgot-error"></div>
          <div class="form-success" id="forgot-success"></div>
          <button type="submit" class="auth-btn primary">Send Reset Link</button>
        </form>
        
        <div class="auth-links">
          <button type="button" class="link-btn" id="back-to-login">Back to Sign In</button>
        </div>
      </div>
      
      <!-- Pending Approval Message -->
      <div id="pending-form" class="auth-form">
        <h2>Account Pending</h2>
        <div class="pending-icon">⏳</div>
        <p class="auth-subtitle">Your account is awaiting admin approval.</p>
        <p>You'll receive an email once your account has been approved. In the meantime, you can browse our course catalog.</p>
        <button type="button" class="auth-btn secondary" id="pending-ok">Got it</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  setupModalListeners();
}

// Create user menu in header
function createUserMenu() {
  const header = document.querySelector('header');
  if (!header) return;
  
  // Create user menu container
  const userMenu = document.createElement('div');
  userMenu.id = 'user-menu';
  userMenu.className = 'user-menu';
  userMenu.innerHTML = `
    <button id="user-icon-btn" class="user-icon-btn" aria-label="User menu">
      <svg class="user-icon" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
    </button>
    <div id="user-dropdown" class="user-dropdown">
      <!-- Content populated dynamically -->
    </div>
  `;
  
  header.appendChild(userMenu);
  
  // Toggle dropdown
  const iconBtn = document.getElementById('user-icon-btn');
  const dropdown = document.getElementById('user-dropdown');
  
  iconBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      dropdown.classList.remove('show');
    }
  });
}

// Setup modal event listeners
function setupModalListeners() {
  const modal = document.getElementById('auth-modal');
  const closeBtn = modal.querySelector('.auth-modal-close');
  
  // Close modal
  closeBtn.addEventListener('click', closeAuthModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAuthModal();
  });
  
  // Form switching
  document.getElementById('show-register').addEventListener('click', () => showForm('register'));
  document.getElementById('show-login').addEventListener('click', () => showForm('login'));
  document.getElementById('show-forgot').addEventListener('click', () => showForm('forgot'));
  document.getElementById('back-to-login').addEventListener('click', () => showForm('login'));
  document.getElementById('pending-ok').addEventListener('click', closeAuthModal);
  
  // Form submissions
  document.getElementById('login-form-element').addEventListener('submit', handleLogin);
  document.getElementById('register-form-element').addEventListener('submit', handleRegister);
  document.getElementById('forgot-form-element').addEventListener('submit', handleForgotPassword);
}

// Show specific form in modal
function showForm(formName) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return; // Guard against modal not existing
  
  document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
  const targetForm = document.getElementById(`${formName}-form`);
  if (targetForm) targetForm.classList.add('active');
  // Clear errors
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-success').forEach(el => el.textContent = '');
}

// Open auth modal
function openAuthModal(formName = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) {
    // Modal not created yet - wait and retry
    setTimeout(() => openAuthModal(formName), 100);
    return;
  }
  showForm(formName);
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

// Close auth modal
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
  // Reset forms
  document.querySelectorAll('.auth-form form').forEach(form => form.reset());
  document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.form-success').forEach(el => el.textContent = '');
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('login-remember').checked;
  const errorEl = document.getElementById('login-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    await signInWithEmailAndPassword(auth, email, password);

    // Set or clear session expiry based on Remember Me
    if (rememberMe) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_DURATION_MS));
    }

    closeAuthModal();
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
}

// Handle registration
async function handleRegister(e) {
  e.preventDefault();
  const firstName = document.getElementById('register-firstname').value.trim();
  const lastName = document.getElementById('register-lastname').value.trim();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('register-confirm').value;
  const errorEl = document.getElementById('register-error');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  // Validate passwords match
  if (password !== confirm) {
    errorEl.textContent = 'Passwords do not match.';
    return;
  }
  
  // Check if this is the base super admin email
  const SUPERADMIN_EMAIL = 'neurodevtechcoach@gmail.com';
  const isSuperAdmin = email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase();

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Create user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      firstName,
      lastName,
      email,
      role: isSuperAdmin ? 'superadmin' : 'student',
      status: isSuperAdmin ? 'approved' : 'pending', // Super admin auto-approved
      studentType: 'current',
      createdAt: serverTimestamp(),
      courses: {},
      certificates: []
    });
    
    if (isSuperAdmin) {
      // Super admin is auto-approved, close modal and continue
      closeAuthModal();
    } else {
      // Sign out since they need approval
      await signOut(auth);
      showForm('pending');
    }
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Register';
  }
}

// Handle forgot password
async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById('forgot-email').value;
  const errorEl = document.getElementById('forgot-error');
  const successEl = document.getElementById('forgot-success');
  const submitBtn = e.target.querySelector('button[type="submit"]');
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    errorEl.textContent = '';
    
    await sendPasswordResetEmail(auth, email);
    successEl.textContent = 'Reset link sent! Check your email.';
  } catch (error) {
    errorEl.textContent = getAuthErrorMessage(error.code);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Reset Link';
  }
}

// Get user data from Firestore
async function getUserData(uid) {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return { id: uid, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
  const dropdown = document.getElementById('user-dropdown');
  const iconBtn = document.getElementById('user-icon-btn');
  
  if (!userData || !dropdown || !iconBtn) return;
  
  // Update icon to show logged in state
  iconBtn.classList.add('logged-in');
  
  const isPending = userData.status === 'pending';
  const isAdmin = userData.role === 'admin' || userData.role === 'superadmin';
  
  if (isPending) {
    // Pending user - show limited menu
    iconBtn.classList.add('pending');
    dropdown.innerHTML = `
      <div class="user-info">
        <span class="user-name">${userData.firstName} ${userData.lastName}</span>
        <span class="user-email">${userData.email}</span>
      </div>
      <div class="dropdown-divider"></div>
      <div class="dropdown-item pending-status">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
        Pending Approval
      </div>
      <button class="dropdown-item" id="logout-btn">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
        Logout
      </button>
    `;
  } else {
    // Approved user - show full menu
    iconBtn.classList.remove('pending');
    const dashboardLink = isAdmin ? 'admin.html' : 'profile.html';
    const dashboardText = isAdmin ? 'Dashboard' : 'Profile';
    
    dropdown.innerHTML = `
      <div class="user-info">
        <span class="user-name">${userData.firstName} ${userData.lastName}</span>
        <span class="user-email">${userData.email}</span>
      </div>
      <div class="dropdown-divider"></div>
      <a href="${dashboardLink}" class="dropdown-item">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
        ${dashboardText}
      </a>
      <button class="dropdown-item" id="logout-btn">
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
        </svg>
        Logout
      </button>
    `;
  }
  
  // Logout handler
  document.getElementById('logout-btn').addEventListener('click', async () => {
    localStorage.removeItem(SESSION_KEY);
    await signOut(auth);
    dropdown.classList.remove('show');
  });
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
  const dropdown = document.getElementById('user-dropdown');
  const iconBtn = document.getElementById('user-icon-btn');
  
  if (!dropdown || !iconBtn) return;
  
  iconBtn.classList.remove('logged-in');
  
  dropdown.innerHTML = `
    <button class="dropdown-item" id="dropdown-login">
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
      </svg>
      Sign In
    </button>
    <button class="dropdown-item" id="dropdown-register">
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      Register
    </button>
  `;
  
  document.getElementById('dropdown-login').addEventListener('click', () => {
    dropdown.classList.remove('show');
    openAuthModal('login');
  });
  
  document.getElementById('dropdown-register').addEventListener('click', () => {
    dropdown.classList.remove('show');
    openAuthModal('register');
  });
}

// Convert Firebase error codes to user-friendly messages
function getAuthErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.'
  };
  return messages[code] || 'An error occurred. Please try again.';
}

// Show pending message when user tries to access protected content
function showPendingMessage() {
  openAuthModal('pending');
}

// Check if current user is pending approval
function isUserPending() {
  return userData && userData.status === 'pending';
}

// Check if current user is approved
function isUserApproved() {
  return userData && userData.status === 'approved';
}

// Export functions for use in other modules
export { 
  openAuthModal, 
  closeAuthModal, 
  showPendingMessage,
  isUserPending,
  isUserApproved,
  currentUser, 
  userData,
  getUserData
};

// Make functions available globally for inline handlers
window.openAuthModal = openAuthModal;
window.showPendingMessage = showPendingMessage;
window.isUserPending = isUserPending;
window.isUserApproved = isUserApproved;
