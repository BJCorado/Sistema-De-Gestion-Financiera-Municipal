import axios from "axios";

/**
 * Cliente HTTP central. Base URL configurable por entorno (.env → VITE_API_URL),
 * apuntando por defecto al backend local en desarrollo (contrato 3.2: /api/v1).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1",
});

const TOKEN_KEY = "sigefi_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Adjunta el JWT a cada petición saliente (contrato 3.2: Authorization: Bearer <JWT>).
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401 (token vencido/ inválido), limpiamos la sesión local.
// La redirección a /login la maneja AuthContext al detectar que ya no hay usuario.
let on401: (() => void) | null = null;
export function registerOn401(handler: () => void): void {
  on401 = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      on401?.();
    }
    return Promise.reject(error);
  }
);

export default api;
