// Course content generator with Firebase authentication
// Dynamically generates course content and tracks progress in Firestore

import { 
  auth, 
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  updateDoc,
  setDoc
} from './firebase-config.js';

let currentUser = null;
let userData = null;
let courseId = null;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Get course ID from the page (use filename without extension)
  const pathParts = window.location.pathname.split('/');
  const filename = pathParts[pathParts.length - 1];
  courseId = filename.replace('.html', '');
  
  // Listen for auth state
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      userData = userDoc.exists() ? userDoc.data() : null;
    } else {
      userData = null;
    }
    // Generate content once auth state is known
    generateCourseContent();
  });
});


function generateCourseContent() {
  const dataScript = document.getElementById("unit-data");
  if (!dataScript) {
    console.error("No unit data found.");
    return;
  }

  let unitData = [];
  try {
    unitData = JSON.parse(dataScript.textContent);
  } catch (error) {
    console.error("Error parsing JSON data:", error);
    return;
  }

  // Create container if it doesn't exist
  let container = document.getElementById("unit-sections");
  if (!container) {
    container = document.createElement("div");
    container.id = "unit-sections";
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.appendChild(container);
    }
  }
  
  // Clear existing content
  container.innerHTML = '';

  // Check if user is authenticated and approved
  const isApproved = userData && userData.status === 'approved';
  
  // Get saved progress from user data
  const userCourseProgress = userData?.courses?.[courseId] || {};

  unitData.forEach((unit, unitIndex) => {
    const section = document.createElement("section");

    // Unit Title and Description
    const header = document.createElement("h2");
    header.textContent = unit.title;

    const description = document.createElement("p");
    description.textContent = unit.description;

    section.appendChild(header);
    section.appendChild(description);

    unit.content.forEach((item, itemIndex) => {
      const div = document.createElement("div");
      const label = document.createElement("label");

      // Checkbox logic
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-checkbox";

      // Create a unique key for this item
      const itemKey = `${unitIndex}-${itemIndex}`;
      
      // Load saved state
      checkbox.checked = userCourseProgress[itemKey] === true;
      
      // Save checkbox changes
      checkbox.addEventListener("change", async () => {
        if (!currentUser) {
          checkbox.checked = false;
          if (window.openAuthModal) {
            window.openAuthModal('login');
          }
          return;
        }
        
        if (!isApproved) {
          checkbox.checked = false;
          if (window.showPendingMessage) {
            window.showPendingMessage();
          }
          return;
        }
        
        await saveProgress(itemKey, checkbox.checked);
      });
      
      label.appendChild(checkbox);

      // YouTube videos
      if (item.type === "video") {
        label.appendChild(document.createTextNode(`Video - ${item.title}`));
        div.appendChild(label);
        const videoContainer = document.createElement("div");
        videoContainer.className = "video-responsive";

        const iframe = document.createElement("iframe");
        iframe.src = item.url;
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.loading = "lazy";

        videoContainer.appendChild(iframe);
        div.appendChild(videoContainer);
      }

      // Inline HTML content
      else if (item.type === "html") {
        const text = document.createTextNode(item.title || "");
        label.appendChild(text);

        const htmlContainer = document.createElement("span");
        htmlContainer.innerHTML = item.html;
        htmlContainer.style.display = "inline-block";
        
        // Add click handler to links in HTML content
        htmlContainer.querySelectorAll('a').forEach(link => {
          const originalHref = link.href;
          link.addEventListener('click', (e) => {
            if (!currentUser) {
              e.preventDefault();
              if (window.openAuthModal) {
                window.openAuthModal('login');
              }
            } else if (!isApproved) {
              e.preventDefault();
              if (window.showPendingMessage) {
                window.showPendingMessage();
              }
            }
          });
        });
        
        label.appendChild(htmlContainer);
        div.appendChild(label);
      }

      // Google Slides — opens in slides.html wrapper
      else if (item.url && item.url.includes('docs.google.com/presentation')) {
        const link = document.createElement('a');
        link.textContent = item.title;
        if (isApproved) {
          link.href = `slides.html?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title)}`;
        } else {
          link.href = 'javascript:void(0)';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentUser) {
              if (window.openAuthModal) window.openAuthModal('login');
            } else {
              if (window.showPendingMessage) window.showPendingMessage();
            }
          });
        }
        label.appendChild(link);
        div.appendChild(label);
      }

      // Google Forms — opens in form.html wrapper
      else if (item.url && item.url.includes('docs.google.com/forms')) {
        const link = document.createElement('a');
        link.textContent = item.title;
        if (isApproved) {
          link.href = `form.html?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title)}`;
        } else {
          link.href = 'javascript:void(0)';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            if (!currentUser) {
              if (window.openAuthModal) window.openAuthModal('login');
            } else {
              if (window.showPendingMessage) window.showPendingMessage();
            }
          });
        }
        label.appendChild(link);
        div.appendChild(label);
      }

      // All other link types (with auth protection)
      else {
        const link = document.createElement("a");
        link.textContent = item.title;

        // External links & PDFs open in new tab
        const isExternal =
          item.url &&
          (item.url.startsWith("http") || item.url.endsWith(".pdf"));

        if (isApproved) {
          link.href = item.url;
          if (isExternal) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
          }
        } else {
          link.href = "javascript:void(0)";
          link.addEventListener("click", (e) => {
            e.preventDefault();
            if (!currentUser) {
              if (window.openAuthModal) {
                window.openAuthModal('login');
              }
            } else {
              if (window.showPendingMessage) {
                window.showPendingMessage();
              }
            }
          });
        }

        label.appendChild(link);
        div.appendChild(label);
      }

      section.appendChild(div);
    });

    container.appendChild(section);
  });

  // Save actual item count so progress displays use the real total
  if (isApproved) {
    const actualTotal = unitData.reduce((sum, unit) => sum + unit.content.length, 0);
    saveCourseTotal(actualTotal);
  }
}

// Store actual course total so profile/admin can use it instead of hardcoded values
async function saveCourseTotal(total) {
  if (!currentUser) return;
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      [`courses.${courseId}._total`]: total
    });
  } catch (e) {
    // Non-critical — progress display will fall back to hardcoded value
  }
}

// Save progress to Firestore
async function saveProgress(itemKey, checked) {
  if (!currentUser) return;
  
  try {
    const userRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentCourses = userDoc.data().courses || {};
      const currentCourseProgress = currentCourses[courseId] || {};
      
      currentCourseProgress[itemKey] = checked;
      currentCourses[courseId] = currentCourseProgress;
      
      await updateDoc(userRef, {
        courses: currentCourses
      });
    }
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

