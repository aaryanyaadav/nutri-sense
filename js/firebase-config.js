// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Replace this with your actual Firebase Project Configuration!
// You can get this from Firebase Console -> Project Settings -> General -> Web App
const firebaseConfig = {

  apiKey: "AIzaSyBofuDLIdx0xMk0nv0KEglh1tGqmR0dbr8",

  authDomain: "nutri-sense-app.firebaseapp.com",

  projectId: "nutri-sense-app",

  storageBucket: "nutri-sense-app.firebasestorage.app",

  messagingSenderId: "150084774521",

  appId: "1:150084774521:web:b3b68a6275e07857d202a8"

};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase not initialized correctly. Did you add your config?", error);
}

export { auth, db };
