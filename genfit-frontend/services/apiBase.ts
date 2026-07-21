const normalizedApiBase = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE = normalizedApiBase || (import.meta.env.DEV ? "http://localhost:5000" : "");