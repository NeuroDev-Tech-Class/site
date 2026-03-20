// Admin Dashboard - Student management and certificate awarding
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  addDoc,
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
let selectedCourseId = null;
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

  // Student view — back button and award cert
  document.getElementById('sv-back-btn').addEventListener('click', closeStudentView);
  document.getElementById('sv-award-cert-btn').addEventListener('click', awardCertificate);

  // Test results view — back button
  document.getElementById('tr-back-btn').addEventListener('click', closeTestResultsView);

  // Populate course select in student view
  const select = document.getElementById('sv-cert-select');
  Object.entries(courseMetadata).forEach(([id, data]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = data.name;
    select.appendChild(option);
  });
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
      <tr data-id="${student.id}" class="clickable-row" tabindex="0" role="button" aria-label="View ${student.firstName} ${student.lastName}" onclick="viewStudent('${student.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();viewStudent('${student.id}');}">
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
            <button class="action-btn toggle" onclick="event.stopPropagation(); toggleStudentType('${student.id}', 'old')">Move to Old</button>
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
      <tr data-id="${student.id}" class="clickable-row" tabindex="0" role="button" aria-label="View ${student.firstName} ${student.lastName}" onclick="viewStudent('${student.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();viewStudent('${student.id}');}">
        <td>
          <div class="student-name">
            <strong>${student.firstName} ${student.lastName}</strong>
            <span class="student-email">${student.email}</span>
          </div>
        </td>
        <td>${certs} certificate${certs !== 1 ? 's' : ''}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn toggle" onclick="event.stopPropagation(); toggleStudentType('${student.id}', 'current')">Move to Current</button>
            <button class="action-btn delete" onclick="event.stopPropagation(); deleteStudent('${student.id}')">Delete</button>
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
      const completed = Object.entries(progress)
        .filter(([k, v]) => !k.startsWith('_') && v === true).length;
      const total = progress._total || metadata.totalItems;
      totalCompleted += completed;
      totalItems += total;
    }
  });

  if (totalItems === 0) return 0;
  return Math.round((totalCompleted / totalItems) * 100);
}

// Global functions for onclick handlers
window.approveStudent = async function(studentId) {
  const student = allStudents.find(s => s.id === studentId);
  if (!student) return;

  try {
    await updateDoc(doc(db, 'users', studentId), {
      status: 'approved',
      approvedAt: serverTimestamp()
    });
    student.status = 'approved';
    updateStats();
    renderTables();
  } catch (error) {
    console.error('Error approving student:', error);
    alert('Failed to approve student. Please try again.');
    return;
  }

  // Queue approval email — runs after approval succeeds
  try {
    const siteUrl = window.location.origin + '/site/';
    await addDoc(collection(db, 'mail'), {
      to: student.email,
      message: {
        subject: 'Your NeuroDev Account Has Been Approved!',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222;">
            <h2 style="color:#44aadd;margin-top:0;">Welcome to NeuroDev, ${student.firstName}!</h2>
            <p>Great news — your account has been approved. You can now log in and access your student dashboard to track your course progress and certificates.</p>
            <a href="${siteUrl}profile.html"
               style="display:inline-block;background:#44aadd;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:20px 0;">
              Go to My Dashboard
            </a>
            <p style="color:#666;font-size:0.9rem;">If you have any questions, feel free to reach out to your tech coach.</p>
            <p style="color:#666;font-size:0.9rem;">— The NeuroDev Team</p>
          </div>
        `
      }
    });
  } catch (emailError) {
    console.warn('Approval email failed to queue:', emailError);
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

window.viewStudent = async function(studentId) {
  try {
    const snap = await getDoc(doc(db, 'users', studentId));
    if (!snap.exists()) return;
    selectedStudent = { id: studentId, ...snap.data() };
    const idx = allStudents.findIndex(s => s.id === studentId);
    if (idx >= 0) allStudents[idx] = selectedStudent;
  } catch (error) {
    console.error('Error loading student data:', error);
    selectedStudent = allStudents.find(s => s.id === studentId);
    if (!selectedStudent) return;
  }

  // Fetch test results from separate collection keyed by email
  if (selectedStudent.email) {
    try {
      const trSnap = await getDoc(doc(db, 'testResults', selectedStudent.email));
      selectedStudent.testResults = trSnap.exists() ? trSnap.data() : {};
    } catch (e) {
      selectedStudent.testResults = {};
    }
  }

  renderStudentView();
  document.getElementById('dashboard-view').style.display = 'none';
  document.getElementById('student-view').classList.add('active');
};

function renderStudentView() {
  const s = selectedStudent;

  document.getElementById('sv-student-name').textContent = `${s.firstName} ${s.lastName}`;
  document.getElementById('sv-student-email').textContent = s.email;

  // Compute stats
  const courseProgress = s.courses || {};
  const certificates = s.certificates || [];
  let coursesStarted = 0, coursesCompleted = 0, tasksCompleted = 0;
  const courseData = [];

  for (const [courseId, progress] of Object.entries(courseProgress)) {
    const meta = courseMetadata[courseId];
    if (!meta) continue;
    const completed = Object.entries(progress)
      .filter(([k, v]) => !k.startsWith('_') && v === true).length;
    const total = progress._total || meta.totalItems;
    const pct = Math.round((completed / total) * 100);
    if (completed > 0) {
      coursesStarted++;
      tasksCompleted += completed;
      courseData.push({ id: courseId, name: meta.name, completed, total, pct });
      if (pct >= 100) coursesCompleted++;
    }
  }

  document.getElementById('sv-courses-started').textContent = coursesStarted;
  document.getElementById('sv-courses-completed').textContent = coursesCompleted;
  document.getElementById('sv-certs-earned').textContent = certificates.length;
  document.getElementById('sv-tasks-completed').textContent = tasksCompleted;

  // Courses grid
  const coursesContainer = document.getElementById('sv-courses-container');
  if (courseData.length === 0) {
    coursesContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>
        <p>No courses started yet.</p>
      </div>
    `;
  } else {
    courseData.sort((a, b) => {
      if (a.pct >= 100 && b.pct < 100) return 1;
      if (b.pct >= 100 && a.pct < 100) return -1;
      return b.pct - a.pct;
    });
    coursesContainer.innerHTML = courseData.map(c => `
      <div class="course-card ${c.pct >= 100 ? 'completed' : ''} clickable" onclick="viewCourseResults('${c.id}')">
        <div class="course-info">
          <h3>${c.name}</h3>
          <span class="course-tasks">${c.completed} / ${c.total} tasks</span>
          <span class="view-results-hint">View test results →</span>
        </div>
        <div class="progress-ring-container">
          <svg class="progress-ring" viewBox="0 0 36 36">
            <path class="progress-ring-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke-width="3"/>
            <path class="progress-ring-fill"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke-width="3" stroke-dasharray="${c.pct}, 100"/>
          </svg>
          <span class="progress-text">${c.pct}%</span>
        </div>
      </div>
    `).join('');
  }

  // Certificates grid
  const certsContainer = document.getElementById('sv-certs-container');
  if (certificates.length === 0) {
    certsContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <p>No certificates earned yet.</p>
      </div>
    `;
  } else {
    certsContainer.innerHTML = certificates.map(cert => `
      <div class="certificate-card">
        <div class="certificate-badge">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div class="certificate-info">
          <h3>${cert.courseName}</h3>
          <span class="certificate-date">Awarded ${formatDate(cert.awardedAt)}</span>
        </div>
      </div>
    `).join('');
  }

  // Reset cert select
  document.getElementById('sv-cert-select').value = '';
}

function closeStudentView() {
  document.getElementById('student-view').classList.remove('active');
  document.getElementById('dashboard-view').style.display = '';
  selectedStudent = null;
}

// ─── Test Results View ─────────────────────────────────────────────────────────

window.viewCourseResults = function(courseId) {
  if (!selectedStudent) return;
  selectedCourseId = courseId;
  const meta = courseMetadata[courseId];
  document.getElementById('tr-course-name').textContent = meta ? meta.name : courseId;
  document.getElementById('tr-student-name').textContent =
    `${selectedStudent.firstName} ${selectedStudent.lastName}`;
  document.getElementById('student-view').classList.remove('active');
  document.getElementById('test-results-view').classList.add('active');

  // Clear stale content immediately then render test results without waiting for fetch
  document.getElementById('tr-checklist').innerHTML = '';
  document.getElementById('tr-content').innerHTML = '';
  renderTestResultsContent(courseId);

  // Fetch course structure in parallel; populate checklist when ready
  fetchCourseStructure(courseId).then(unitData => {
    if (!unitData || selectedCourseId !== courseId || !selectedStudent) return;
    renderCourseChecklist(unitData, selectedStudent.courses?.[courseId] || {});
  }).catch(() => {});
};

async function fetchCourseStructure(courseId) {
  try {
    const res = await fetch(new URL('courses/' + courseId + '.html', window.location.href));
    if (!res.ok) return null;
    const html = await res.text();
    const parser = new DOMParser();
    const parsed = parser.parseFromString(html, 'text/html');
    const scriptEl = parsed.getElementById('unit-data');
    if (!scriptEl) return null;
    return JSON.parse(scriptEl.textContent);
  } catch (e) {
    return null;
  }
}

function getItemType(item) {
  if (item.type === 'video') return 'Video';
  if (item.type === 'html') return 'Reading';
  if (item.url?.includes('presentation')) return 'Slides';
  if (item.url?.includes('/forms/')) return 'Test';
  return 'Reading';
}

function renderCourseChecklist(unitData, progress) {
  const container = document.getElementById('tr-checklist');
  if (!unitData) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <section class="dashboard-section checklist-section">
      <h2>Course Items</h2>
      ${unitData.map((unit, unitIndex) => `
        <div class="checklist-unit">
          <h3>${unit.title}</h3>
          <div class="checklist-items">
            ${unit.content.map((item, itemIndex) => {
              const key = `${unitIndex}-${itemIndex}`;
              const checked = progress[key] === true;
              const type = getItemType(item);
              return `
                <div class="checklist-item ${checked ? 'checked' : ''}">
                  <span class="checklist-status">${checked ? '✓' : '○'}</span>
                  <span class="checklist-type-badge">${type}</span>
                  <span class="checklist-title">${item.title}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `;
}

function renderTestResultsContent(courseId) {
  const container = document.getElementById('tr-content');
  const testResults = selectedStudent.testResults || {};

  // Results are stored as flat keys: "courseId_unitKey"
  const prefix = courseId + '_';
  const unitResults = Object.entries(testResults)
    .filter(([k]) => k.startsWith(prefix))
    .map(([k, v]) => [k.slice(prefix.length), v])
    .sort(([a], [b]) => a.localeCompare(b));

  if (unitResults.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:3rem 0;">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z"/>
        </svg>
        <p>No test results for this course yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = unitResults.map(([unitKey, result]) => {
    const scorePct = result.total > 0 ? Math.round((result.score / result.total) * 100) : null;
    const scoreDisplay = result.score != null
      ? (result.total ? `${result.score} / ${result.total} &nbsp;(${scorePct}%)` : `${result.score} pts`)
      : 'Not graded';
    const answers = result.answers || {};
    const unitLabel = unitKey.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return `
      <div class="test-result-card">
        <div class="test-result-header">
          <h3>${unitLabel}</h3>
          <div class="test-result-meta">
            <span class="test-score ${scorePct === null ? '' : scorePct >= 70 ? 'pass' : 'fail'}">${scoreDisplay}</span>
            <span class="test-date">${formatDate(result.submittedAt)}</span>
          </div>
        </div>
        ${Object.keys(answers).length > 0 ? `
          <div class="test-answers">
            <h4>Answers</h4>
            ${Object.entries(answers).map(([q, a]) => `
              <div class="answer-row">
                <span class="answer-question">${q}</span>
                <span class="answer-value">${a}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function closeTestResultsView() {
  document.getElementById('test-results-view').classList.remove('active');
  document.getElementById('student-view').classList.add('active');
  selectedCourseId = null;
}

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

// ─── Certificate PDF Generation ──────────────────────────────────────────────

async function generateCertificatePdf(studentName, courseName, awardDate) {
  const { PDFDocument, StandardFonts, rgb } = await import('https://esm.sh/pdf-lib@1.17.1');

  const templateBytes = await fetch('assets/pdfs/Certificate-Template.docx.pdf')
    .then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  const boldFont    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Adjust the y values below to match where blank lines appear in your template.
  // y=0 is the bottom edge; y=height is the top. Landscape letter: width≈792, height≈612.

  const nameSize = 38;
  const nameW = boldFont.widthOfTextAtSize(studentName, nameSize);
  page.drawText(studentName, {
    x: (width - nameW) / 2,
    y: height * 0.47,   // ← move up/down to hit the name line
    size: nameSize, font: boldFont, color: rgb(0.08, 0.08, 0.08)
  });

  const courseSize = 22;
  const courseW = regularFont.widthOfTextAtSize(courseName, courseSize);
  page.drawText(courseName, {
    x: (width - courseW) / 2,
    y: height * 0.36,   // ← move up/down to hit the course line
    size: courseSize, font: regularFont, color: rgb(0.2, 0.2, 0.2)
  });

  const dateSize = 14;
  const dateW = regularFont.widthOfTextAtSize(awardDate, dateSize);
  page.drawText(awardDate, {
    x: (width - dateW) / 2,
    y: height * 0.27,   // ← move up/down to hit the date line
    size: dateSize, font: regularFont, color: rgb(0.35, 0.35, 0.35)
  });

  const pdfBytes = await pdfDoc.save();
  let binary = '';
  const bytes = new Uint8Array(pdfBytes);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function awardCertificate() {
  if (!selectedStudent) return;

  const courseId = document.getElementById('sv-cert-select').value;
  if (!courseId) {
    alert('Please select a course.');
    return;
  }

  const courseName = courseMetadata[courseId].name;
  const existingCerts = selectedStudent.certificates || [];

  if (existingCerts.some(c => c.courseId === courseId)) {
    alert('This student already has a certificate for this course.');
    return;
  }

  const btn = document.getElementById('sv-award-cert-btn');
  btn.disabled = true;
  btn.textContent = 'Awarding...';

  try {
    const awardDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const newCert = { courseId, courseName, awardedAt: new Date().toISOString() };

    await updateDoc(doc(db, 'users', selectedStudent.id), {
      certificates: [...existingCerts, newCert]
    });
    selectedStudent.certificates = [...existingCerts, newCert];

    // Generate certificate PDF and email it
    try {
      btn.textContent = 'Generating PDF...';
      const studentName = `${selectedStudent.firstName} ${selectedStudent.lastName}`;
      const pdfBase64 = await generateCertificatePdf(studentName, courseName, awardDate);

      await addDoc(collection(db, 'mail'), {
        to: selectedStudent.email,
        message: {
          subject: `Your NeuroDev Certificate — ${courseName}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222;">
              <h2 style="color:#44aadd;margin-top:0;">Congratulations, ${selectedStudent.firstName}!</h2>
              <p>You've earned a certificate of completion for <strong>${courseName}</strong>.</p>
              <p>Your certificate is attached to this email. You can save or print it for your records.</p>
              <p style="color:#666;font-size:0.9rem;">Keep up the great work — The NeuroDev Team</p>
            </div>
          `,
          attachments: [{
            filename: `NeuroDev-Certificate-${courseId}.pdf`,
            content: pdfBase64,
            encoding: 'base64'
          }]
        }
      });
    } catch (emailError) {
      console.warn('Certificate email failed:', emailError);
    }

    renderStudentView();
    updateStats();
    renderTables();
    alert(`Certificate awarded for ${courseName}! An email has been sent to ${selectedStudent.email}.`);
  } catch (error) {
    console.error('Error awarding certificate:', error);
    alert('Failed to award certificate. Please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Award Certificate';
  }
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
  document.getElementById('dashboard-view').appendChild(tabContent);

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
