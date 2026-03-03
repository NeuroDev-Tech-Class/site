// Admin Dashboard - Student management and certificate awarding
import { 
  auth, 
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp
} from './firebase-config.js';

// Course metadata for progress calculation
const courseMetadata = {
  'digital-literacy': { name: 'Digital Literacy', totalItems: 45 },
  'ai-usage': { name: 'AI Usage & Prompt Engineering', totalItems: 15 },
  'office-software': { name: 'Office Software', totalItems: 30 },
  'python-1': { name: 'Python I - Programming Fundamentals', totalItems: 50 },
  'python-2': { name: 'Python II - Object-Oriented Programming', totalItems: 35 },
  'hardware': { name: 'Computer Hardware', totalItems: 20 },
  'linux': { name: 'Introduction to Linux', totalItems: 40 },
  'web-dev-1': { name: 'Web Development I - HTML & CSS', totalItems: 45 },
  'web-dev-2': { name: 'Web Development II - JavaScript', totalItems: 40 },
  'web-dev-3': { name: 'Web Development III - Web Apps', totalItems: 35 },
  'unreal-engine': { name: 'Intro to Unreal Engine', totalItems: 50 },
  'blender-zbrush-mini': { name: 'Intro to Blender & ZBrush', totalItems: 45 },
  'gimp': { name: '2D Digital Art - GIMP', totalItems: 40 },
  'audacity': { name: 'Audio Software - Audacity', totalItems: 30 },
  'davinci-resolve': { name: 'Video Software - DaVinci Resolve', totalItems: 35 }
};

let allStudents = [];
let selectedStudent = null;
let currentUserRole = null;
let allAdmins = [];

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    const userData = await getUserData(user.uid);
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      window.location.href = 'index.html';
      return;
    }

    currentUserRole = userData.role;

    if (currentUserRole === 'superadmin') {
      document.getElementById('welcome-message').textContent =
        `Super Admin — ${userData.firstName} ${userData.lastName}`;
      injectAdminTab();
    }

    initializeDashboard();
    loadAllStudents();

    if (currentUserRole === 'superadmin') {
      loadAdmins();
    }
  });
});

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

function initializeDashboard() {
  // Tab switching — event delegation supports dynamically injected tabs
  document.querySelector('.admin-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.admin-tab');
    if (!tab) return;
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById(`${tab.dataset.tab}-tab`);
    if (content) content.classList.add('active');
  });
  
  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('student-modal').addEventListener('click', (e) => {
    if (e.target.id === 'student-modal') closeModal();
  });
  
  // Populate course select
  const select = document.getElementById('cert-course-select');
  Object.entries(courseMetadata).forEach(([id, data]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = data.name;
    select.appendChild(option);
  });
  
  // Award certificate button
  document.getElementById('award-cert-btn').addEventListener('click', awardCertificate);
}

async function loadAllStudents() {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', 'student'));
    const snapshot = await getDocs(q);
    
    allStudents = [];
    snapshot.forEach(doc => {
      allStudents.push({ id: doc.id, ...doc.data() });
    });
    
    updateStats();
    renderTables();
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

function updateStats() {
  const currentStudents = allStudents.filter(s => 
    s.status === 'approved' && s.studentType === 'current'
  );
  const pendingStudents = allStudents.filter(s => s.status === 'pending');
  
  // Count active courses (students with any progress)
  let activeCourses = 0;
  let totalCerts = 0;
  
  currentStudents.forEach(student => {
    const courses = student.courses || {};
    Object.values(courses).forEach(progress => {
      const completed = Object.values(progress).filter(v => v === true).length;
      if (completed > 0) activeCourses++;
    });
    totalCerts += (student.certificates || []).length;
  });
  
  document.getElementById('total-students').textContent = currentStudents.length;
  document.getElementById('pending-count').textContent = pendingStudents.length;
  document.getElementById('courses-progress').textContent = activeCourses;
  document.getElementById('certs-awarded').textContent = totalCerts;
}

function renderTables() {
  renderPendingTable();
  renderCurrentTable();
  renderOldTable();
}

function renderPendingTable() {
  const tbody = document.getElementById('pending-tbody');
  const pending = allStudents.filter(s => s.status === 'pending');
  
  if (pending.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <p>No pending approvals</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = pending.map(student => `
    <tr data-id="${student.id}">
      <td>
        <div class="student-name">
          <strong>${student.firstName} ${student.lastName}</strong>
          <span class="student-email">${student.email}</span>
        </div>
      </td>
      <td>${formatDate(student.createdAt)}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn approve" onclick="approveStudent('${student.id}')">Approve</button>
          <button class="action-btn deny" onclick="denyStudent('${student.id}')">Deny</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderCurrentTable() {
  const tbody = document.getElementById('current-tbody');
  const current = allStudents.filter(s => 
    s.status === 'approved' && s.studentType === 'current'
  );
  
  if (current.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          <p>No current students</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = current.map(student => {
    const progress = calculateOverallProgress(student);
    const certs = (student.certificates || []).length;
    
    return `
      <tr data-id="${student.id}">
        <td>
          <div class="student-name">
            <strong>${student.firstName} ${student.lastName}</strong>
            <span class="student-email">${student.email}</span>
          </div>
        </td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-bar ${progress >= 100 ? 'complete' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
          </div>
          <span style="font-size: 0.8rem; color: #666;">${progress}% overall</span>
        </td>
        <td>${certs} certificate${certs !== 1 ? 's' : ''}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="viewStudent('${student.id}')">View</button>
            <button class="action-btn toggle" onclick="toggleStudentType('${student.id}', 'old')">Move to Old</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderOldTable() {
  const tbody = document.getElementById('old-tbody');
  const old = allStudents.filter(s => 
    s.status === 'approved' && s.studentType === 'old'
  );
  
  if (old.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <p>No old students</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = old.map(student => {
    const certs = (student.certificates || []).length;
    
    return `
      <tr data-id="${student.id}">
        <td>
          <div class="student-name">
            <strong>${student.firstName} ${student.lastName}</strong>
            <span class="student-email">${student.email}</span>
          </div>
        </td>
        <td>${certs} certificate${certs !== 1 ? 's' : ''}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn view" onclick="viewStudent('${student.id}')">View</button>
            <button class="action-btn toggle" onclick="toggleStudentType('${student.id}', 'current')">Move to Current</button>
            <button class="action-btn delete" onclick="deleteStudent('${student.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function calculateOverallProgress(student) {
  const courses = student.courses || {};
  let totalCompleted = 0;
  let totalItems = 0;
  
  Object.entries(courses).forEach(([courseId, progress]) => {
    const metadata = courseMetadata[courseId];
    if (metadata) {
      const completed = Object.values(progress).filter(v => v === true).length;
      totalCompleted += completed;
      totalItems += metadata.totalItems;
    }
  });
  
  if (totalItems === 0) return 0;
  return Math.round((totalCompleted / totalItems) * 100);
}

// Global functions for onclick handlers
window.approveStudent = async function(studentId) {
  try {
    await updateDoc(doc(db, 'users', studentId), {
      status: 'approved',
      approvedAt: serverTimestamp()
    });
    
    // Update local data
    const student = allStudents.find(s => s.id === studentId);
    if (student) student.status = 'approved';
    
    updateStats();
    renderTables();
  } catch (error) {
    console.error('Error approving student:', error);
    alert('Failed to approve student. Please try again.');
  }
};

window.denyStudent = async function(studentId) {
  if (!confirm('Are you sure you want to deny this registration? Their account will be permanently deleted.')) {
    return;
  }
  
  try {
    // Delete the user document from Firestore entirely
    await deleteDoc(doc(db, 'users', studentId));
    
    // Remove from local data
    allStudents = allStudents.filter(s => s.id !== studentId);
    
    updateStats();
    renderTables();
  } catch (error) {
    console.error('Error denying student:', error);
    alert('Failed to deny registration. Please try again.');
  }
};

window.viewStudent = function(studentId) {
  selectedStudent = allStudents.find(s => s.id === studentId);
  if (!selectedStudent) return;
  
  document.getElementById('modal-student-name').textContent = 
    `${selectedStudent.firstName} ${selectedStudent.lastName}`;
  document.getElementById('modal-student-email').textContent = 
    selectedStudent.email;
  
  // Render progress
  const progressList = document.getElementById('modal-progress-list');
  const courses = selectedStudent.courses || {};
  const courseEntries = Object.entries(courses);
  
  if (courseEntries.length === 0) {
    progressList.innerHTML = '<li>No courses started yet.</li>';
  } else {
    progressList.innerHTML = courseEntries
      .filter(([courseId]) => courseMetadata[courseId])
      .map(([courseId, progress]) => {
        const metadata = courseMetadata[courseId];
        const completed = Object.values(progress).filter(v => v === true).length;
        const percentage = Math.round((completed / metadata.totalItems) * 100);
        
        return `
          <li>
            <span class="progress-course-name">${metadata.name}</span>
            <div class="progress-right">
              <div class="progress-bar-container">
                <div class="progress-bar ${percentage >= 100 ? 'complete' : ''}" style="width: ${percentage}%"></div>
              </div>
              <span class="progress-pct">${percentage}%</span>
            </div>
          </li>
        `;
      }).join('');
  }
  
  // Render certificates
  const certsContainer = document.getElementById('modal-certificates');
  const certs = selectedStudent.certificates || [];
  
  if (certs.length === 0) {
    certsContainer.innerHTML = '<p>No certificates yet.</p>';
  } else {
    certsContainer.innerHTML = certs.map(cert => `
      <div class="cert-item">
        <span>${cert.courseName}</span>
        <span class="cert-date">${formatDate(cert.awardedAt)}</span>
      </div>
    `).join('');
  }
  
  // Show modal
  document.getElementById('student-modal').classList.add('show');
};

window.toggleStudentType = async function(studentId, newType) {
  try {
    await updateDoc(doc(db, 'users', studentId), {
      studentType: newType
    });
    
    // Update local data
    const student = allStudents.find(s => s.id === studentId);
    if (student) student.studentType = newType;
    
    updateStats();
    renderTables();
  } catch (error) {
    console.error('Error updating student type:', error);
    alert('Failed to update student. Please try again.');
  }
};

window.deleteStudent = async function(studentId) {
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;
  
  if (!confirm(`Permanently delete ${student.firstName} ${student.lastName}'s account? This cannot be undone.`)) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, 'users', studentId));
    allStudents = allStudents.filter(s => s.id !== studentId);
    updateStats();
    renderTables();
  } catch (error) {
    console.error('Error deleting student:', error);
    alert('Failed to delete student. Please try again.');
  }
};

async function awardCertificate() {
  if (!selectedStudent) return;
  
  const courseId = document.getElementById('cert-course-select').value;
  if (!courseId) {
    alert('Please select a course.');
    return;
  }
  
  const courseName = courseMetadata[courseId].name;
  
  // Check if already has this certificate
  const existingCerts = selectedStudent.certificates || [];
  if (existingCerts.some(c => c.courseId === courseId)) {
    alert('This student already has a certificate for this course.');
    return;
  }
  
  try {
    const newCert = {
      courseId,
      courseName,
      awardedAt: new Date().toISOString()
    };
    
    await updateDoc(doc(db, 'users', selectedStudent.id), {
      certificates: [...existingCerts, newCert]
    });
    
    // Update local data
    selectedStudent.certificates = [...existingCerts, newCert];
    
    // Update modal
    window.viewStudent(selectedStudent.id);
    
    // Update stats
    updateStats();
    renderTables();
    
    alert(`Certificate awarded for ${courseName}!`);
  } catch (error) {
    console.error('Error awarding certificate:', error);
    alert('Failed to award certificate. Please try again.');
  }
}

function closeModal() {
  document.getElementById('student-modal').classList.remove('show');
  selectedStudent = null;
  document.getElementById('cert-course-select').value = '';
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// ─── Super Admin Only ─────────────────────────────────────────────────────────

function injectAdminTab() {
  // Inject "Admins" tab button into the tab bar
  const tabsContainer = document.querySelector('.admin-tabs');
  const tabBtn = document.createElement('button');
  tabBtn.className = 'admin-tab';
  tabBtn.dataset.tab = 'admins';
  tabBtn.textContent = 'Admins';
  tabsContainer.appendChild(tabBtn);

  // Inject Admins tab content into main
  const tabContent = document.createElement('div');
  tabContent.id = 'admins-tab';
  tabContent.className = 'tab-content';
  tabContent.innerHTML = `
    <div class="tab-section-header">
      <h3 class="tab-section-title">Active Admins</h3>
      <button class="action-btn approve" id="add-admin-btn">+ Add Admin</button>
    </div>
    <div class="students-table-container">
      <table class="students-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Date Added</th>
          </tr>
        </thead>
        <tbody id="admins-tbody">
          <tr>
            <td colspan="3" class="loading-state">
              <div class="spinner"></div>
              <p>Loading...</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('main-content').appendChild(tabContent);

  // Inject "Add Admin" selection modal into body
  const addAdminModal = document.createElement('div');
  addAdminModal.id = 'add-admin-modal';
  addAdminModal.className = 'modal-overlay';
  addAdminModal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h2>Promote to Admin</h2>
          <span class="student-email">Select a current student to grant admin access</span>
        </div>
        <button class="modal-close" id="add-admin-modal-close">&times;</button>
      </div>
      <div class="modal-body" id="add-admin-list"></div>
    </div>
  `;
  document.body.appendChild(addAdminModal);

  // Wire up listeners
  document.getElementById('add-admin-btn').addEventListener('click', openAddAdminModal);
  document.getElementById('add-admin-modal-close').addEventListener('click', closeAddAdminModal);
  addAdminModal.addEventListener('click', (e) => {
    if (e.target.id === 'add-admin-modal') closeAddAdminModal();
  });
}

async function loadAdmins() {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    allAdmins = [];
    snapshot.forEach(d => allAdmins.push({ id: d.id, ...d.data() }));
    renderAdminsTable();
  } catch (error) {
    console.error('Error loading admins:', error);
  }
}

function renderAdminsTable() {
  const tbody = document.getElementById('admins-tbody');
  if (!tbody) return;

  if (allAdmins.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">
          <p>No other admins yet. Use <strong>+ Add Admin</strong> to promote a student.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = allAdmins.map(admin => `
    <tr>
      <td>
        <div class="student-name">
          <strong>${admin.firstName} ${admin.lastName}</strong>
        </div>
      </td>
      <td><span class="student-email">${admin.email}</span></td>
      <td>${formatDate(admin.createdAt)}</td>
    </tr>
  `).join('');
}

function openAddAdminModal() {
  renderAddAdminList();
  document.getElementById('add-admin-modal').classList.add('show');
}

function closeAddAdminModal() {
  document.getElementById('add-admin-modal').classList.remove('show');
}

function renderAddAdminList() {
  const container = document.getElementById('add-admin-list');
  const eligible = allStudents.filter(s => s.status === 'approved' && s.studentType === 'current');

  if (eligible.length === 0) {
    container.innerHTML = `<p class="add-admin-empty">No current students available to promote.</p>`;
    return;
  }

  container.innerHTML = eligible.map(s => `
    <div class="add-admin-item">
      <div class="student-name">
        <strong>${s.firstName} ${s.lastName}</strong>
        <span class="student-email">${s.email}</span>
      </div>
      <button class="action-btn approve" onclick="promoteToAdmin('${s.id}')">Make Admin</button>
    </div>
  `).join('');
}

window.promoteToAdmin = async function(studentId) {
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;

  if (!confirm(`Promote ${student.firstName} ${student.lastName} to admin?\n\nThey will have full access to the admin dashboard.`)) {
    return;
  }

  try {
    await updateDoc(doc(db, 'users', studentId), { role: 'admin' });

    // Move locally: remove from students, add to admins
    allStudents = allStudents.filter(s => s.id !== studentId);
    allAdmins.push({ ...student, role: 'admin' });

    updateStats();
    renderTables();
    renderAdminsTable();
    renderAddAdminList();
  } catch (error) {
    console.error('Error promoting student to admin:', error);
    alert('Failed to promote student. Please try again.');
  }
};
