type AuthUser = {
  id: string;
  name: string;
  email: string;
  token: string;
};

import { auth } from "./firebase";
import { API_BASE } from "./apiBase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
const AUTH_STORAGE_KEY = "genfit_auth_user";

const listeners = new Set<(user: AuthUser | null) => void>();

const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const emitAuthChange = () => {
  const user = getStoredUser();
  listeners.forEach((cb) => cb(user));
};

const saveAuth = (token: string, user: { id: string; name: string; email: string }) => {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      token,
    })
  );
  emitAuthChange();
};

const saveFirebaseUser = async (firebaseUser: { uid: string; displayName: string | null; email: string | null; getIdToken: () => Promise<string> }) => {
  const token = await firebaseUser.getIdToken();
  saveAuth(token, {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email || "Google User",
    email: firebaseUser.email || "",
  });
};

const readResponseBody = async (res: Response) => {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return { error: text };
};

const parseResponse = async (res: Response) => {
  const data = await readResponseBody(res);
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error("Backend database is unavailable. Please restart backend and verify MongoDB Atlas IP access.");
    }
    throw new Error(data?.error || `Auth request failed (${res.status})`);
  }
  return data;
};

export const signupUser = async (name: string, email: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await parseResponse(res);
    saveAuth(data.token, data.user);
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach the GenFit auth API. Check VITE_API_BASE_URL or backend deployment (${API_BASE || '/api'}).`);
    }

    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await parseResponse(res);
    saveAuth(data.token, data.user);
    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach the GenFit auth API. Check VITE_API_BASE_URL or backend deployment (${API_BASE || '/api'}).`);
    }

    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await signInWithPopup(auth, provider);
    await saveFirebaseUser(result.user);
    return result;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Unable to reach Firebase authentication. Check the Firebase config in genfit-frontend/services/firebase.ts.`);
    }

    throw error instanceof Error ? error : new Error("Google sign-in failed.");
  }
};

export const logoutUser = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChange();
};

export const listenAuth = (callback: (user: AuthUser | null) => void) => {
  callback(getStoredUser());
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
};