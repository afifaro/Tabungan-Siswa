// firebase.js — inisialisasi Firebase (compat) with provided config
const firebaseConfig = {
  apiKey: "AIzaSyD6h40vY7anmvLPHwnL-zQFGYmHvXXFvhA",
  authDomain: "tabungasiswa.firebaseapp.com",
  projectId: "tabungasiswa",
  storageBucket: "tabungasiswa.firebasestorage.app",
  messagingSenderId: "419761759477",
  appId: "1:419761759477:web:3d38545ab3b7b06e8f11bc",
  measurementId: "G-E0FD1K3QB3"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// expose globally
window.FB = { auth, db, storage };
