import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  ApiError,
  apiFetch,
  clearToken,
  getToken,
  registerOnUnauthorized,
  setToken,
} from "../../api/http";
import { AuthContext } from "./auth-context";
import type { LoginResponse, Usuario } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(() => Boolean(getToken()));
  const [iniciandoSesion, setIniciandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearToken();
    setUsuario(null);
    setError(null);
  }, []);

  useEffect(() => registerOnUnauthorized(() => setUsuario(null)), []);

  useEffect(() => {
    if (!getToken()) {
      return;
    }

    void apiFetch<Usuario>("/api/v1/auth/me")
      .then((response) => setUsuario(response))
      .catch(() => clearToken())
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (correo: string, password: string) => {
    setIniciandoSesion(true);
    setError(null);

    try {
      const response = await apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ correo, password }),
      });
      setToken(response.token);
      setUsuario(response.usuario);
      return response.usuario;
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "No se pudo iniciar sesión. Intenta de nuevo.";
      setError(message);
      throw requestError;
    } finally {
      setIniciandoSesion(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ usuario, cargando, iniciandoSesion, error, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
