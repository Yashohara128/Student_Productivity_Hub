// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjzE30NZXDZsT-DuC9cBrksOjg0UsQM34",
  authDomain: "gpa-tracker-29cd2.firebaseapp.com",
  projectId: "gpa-tracker-29cd2",
  storageBucket: "gpa-tracker-29cd2.firebasestorage.app",
  messagingSenderId: "856930093441",
  appId: "1:856930093441:web:60a026cccbc6ceae120080",
  measurementId: "G-YELCCNX12Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
