type AuthUser = {
  id: string;
  name: string;
  email: string;
  token: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
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

const parseResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 503) {
      throw new Error("Backend database is unavailable. Please restart backend and verify MongoDB Atlas IP access.");
    }
    throw new Error(data?.error || "Auth request failed");
  }
  return data;
};

export const signupUser = async (name: string, email: string, password: string) => {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await parseResponse(res);
  saveAuth(data.token, data.user);
  return data;
};

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await parseResponse(res);
  saveAuth(data.token, data.user);
  return data;
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