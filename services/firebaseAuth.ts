import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Signup
export const signupUser = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

// Login
export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

// Logout
export const logoutUser = () => signOut(auth);

// Auth state listener
export const listenAuth = (callback: any) =>
  onAuthStateChanged(auth, callback);