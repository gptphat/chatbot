// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5viSC4k4OlqzBqZrouTo1EUM9X0ycQYs",
  authDomain: "test-19dfe.firebaseapp.com",
  projectId: "test-19dfe",
  storageBucket: "test-19dfe.appspot.com",
  messagingSenderId: "271519556146",
  appId: "1:271519556146:web:cef1abe2e18833ef3c122b",
  measurementId: "G-6E50KSNWF6"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const goggleAuthProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(firebaseApp);

export { auth, goggleAuthProvider, db };
