  // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";



const firebaseConfig = {
  apiKey: "AIzaSyBOgbfiMy6PyZlGuEWQ7UFJzEQkZtcC2k4",
  authDomain: "romano-bef61.firebaseapp.com",
  projectId: "romano-bef61",
  storageBucket: "romano-bef61.firebasestorage.app",
  messagingSenderId: "400332830373",
  appId: "1:400332830373:web:970c081c75d2ddfde0bf4c",
  measurementId: "G-3TM623C4Z6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);