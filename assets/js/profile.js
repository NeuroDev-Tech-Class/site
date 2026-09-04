// Profile Dashboard - Shows user progress and certificates
import { 
  auth, 
  db,
  onAuthStateChanged,
  doc,
  getDoc
} from './firebase-config.js';
import { courseMetadata } from './course-metadata.js';
import { formatName, isAdmin } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Redirect to home if not logged in
      window.location.href = 'index.html';
      return;
    }
    
    const userData = await getUserData(user.uid);
    if (!userData) {
      window.location.href = 'index.html';
      return;
    }
    
    // Check if user is approved
    if (userData.status !== 'approved') {
      window.location.href = 'index.html';
      return;
    }
    
    // Check if admin - redirect to admin dashboard
    if (isAdmin(userData)) {
      window.location.href = 'admin.html';
      return;
    }
    
    displayDashboard(userData);
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

function displayDashboard(userData) {
  // Update welcome message
  document.getElementById('welcome-message').textContent = 
    `Welcome back, ${formatName(userData.firstName)}!`;
  
  // Calculate stats
  const courseProgress = userData.courses || {};
  const certificates = userData.certificates || [];
  
  let coursesStarted = 0;
  let coursesCompleted = 0;
  let totalTasksCompleted = 0;
  const courseData = [];
  
  for (const [courseId, progress] of Object.entries(courseProgress)) {
    const metadata = courseMetadata[courseId];
    if (!metadata) continue;
    
    const completedItems = Object.entries(progress)
      .filter(([k, v]) => !k.startsWith('_') && v === true).length;
    const totalItems = progress._total || metadata.totalItems;
    const percentage = Math.round((completedItems / totalItems) * 100);
    
    if (completedItems > 0) {
      coursesStarted++;
      totalTasksCompleted += completedItems;
      
      courseData.push({
        id: courseId,
        name: metadata.name,
        completed: completedItems,
        total: totalItems,
        percentage
      });
      
      if (percentage >= 100) {
        coursesCompleted++;
      }
    }
  }
  
  // Update stats
  document.getElementById('courses-started').textContent = coursesStarted;
  document.getElementById('courses-completed').textContent = coursesCompleted;
  document.getElementById('certificates-earned').textContent = certificates.length;
  document.getElementById('tasks-completed').textContent = totalTasksCompleted;
  
  // Display courses
  displayCourses(courseData);
  
  // Display certificates
  displayCertificates(certificates);
}

function displayCourses(courseData) {
  const container = document.getElementById('courses-container');
  
  if (courseData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
        </svg>
        <p>Start a course from the <a href="catalog.html">Course Catalog</a>!</p>
      </div>
    `;
    return;
  }
  
  // Sort by percentage (in progress first, then completed)
  courseData.sort((a, b) => {
    if (a.percentage >= 100 && b.percentage < 100) return 1;
    if (b.percentage >= 100 && a.percentage < 100) return -1;
    return b.percentage - a.percentage;
  });
  
  container.innerHTML = courseData.map(course => `
    <a href="courses/${course.id}.html" class="course-card ${course.percentage >= 100 ? 'completed' : ''}">
      <div class="course-info">
        <h3>${course.name}</h3>
        <span class="course-tasks">${course.completed} / ${course.total} tasks</span>
      </div>
      <div class="progress-ring-container">
        <svg class="progress-ring" viewBox="0 0 36 36">
          <path class="progress-ring-bg"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke-width="3"
          />
          <path class="progress-ring-fill"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke-width="3"
            stroke-dasharray="${course.percentage}, 100"
          />
        </svg>
        <span class="progress-text">${course.percentage}%</span>
      </div>
    </a>
  `).join('');
}

function displayCertificates(certificates) {
  const container = document.getElementById('certificates-container');
  
  if (certificates.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <p>Complete courses to earn certificates!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = certificates.map(cert => `
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

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
