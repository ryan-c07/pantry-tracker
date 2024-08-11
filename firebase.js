// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDEcKskXdLH5ZVOqkfSgSrm5vypB1yM84",
  authDomain: "inventory-management-2adb9.firebaseapp.com",
  projectId: "inventory-management-2adb9",
  storageBucket: "inventory-management-2adb9.appspot.com",
  messagingSenderId: "139719471960",
  appId: "1:139719471960:web:9067822f587145de9a6b2d",
  measurementId: "G-Y9QEXWBPF4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export {firestore}