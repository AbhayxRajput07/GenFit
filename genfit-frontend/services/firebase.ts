import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDUaAJNrmFHzOqX53jK3ZKX9_GC3m63WME",
  authDomain: "genfit-eb7da.firebaseapp.com",
  projectId: "genfit-eb7da",
  storageBucket: "genfit-eb7da.firebasestorage.app",
  messagingSenderId: "43193260670",
  appId: "1:43193260670:web:2ff83313d6a7f327f6962f",
  measurementId: "G-WF74S3EHSD"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);