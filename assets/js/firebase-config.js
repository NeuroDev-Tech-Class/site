// Firebase Configuration for Tech Class
// Using CDN imports for compatibility with static hosting

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJj1ZmLKIA7Q-QPzdrwDDEP1XkGmHZj9E",
  authDomain: "tech-certificates-af7c3.firebaseapp.com",
  projectId: "tech-certificates-af7c3",
  storageBucket: "tech-certificates-af7c3.firebasestorage.app",
  messagingSenderId: "658861298832",
  appId: "1:658861298832:web:0e2b1712f1bd27bc87f415",
  measurementId: "G-HNTKW46C6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for use in other modules
export { 
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
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp
};
