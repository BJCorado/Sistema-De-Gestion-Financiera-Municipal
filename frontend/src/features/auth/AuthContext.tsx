import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api, { clearToken, getToken, registerOn401, setToken } from "../../lib/api";
import type { LoginResponse, Usuario } from "./types";

interface AuthContextValue {
  usuario: Usuario | null;
  /** true mientras se valida un token guardado al cargar la app (GET /auth/me). */
  cargando: boolean;
  /** true mientras se procesa un intento de inicio de sesión. */
  iniciandoSesion: boolean;
  error: string | null;
  login: (correo: string, password: string) => Promise<Usuario>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [iniciandoSesion, setIniciandoSesion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearToken();
    setUsuario(null);
  }, []);

  // Si el backend rechaza el token en cualquier petición (401), cerramos sesión local.
  useEffect(() => {
    registerOn401(() => setUsuario(null));
  }, []);

  // Al cargar la app: si hay un token guardado de una sesión anterior, lo validamos
  // contra GET /auth/me en vez de asumir que sigue siendo válido (puede haber expirado).
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCargando(false);
      return;
    }
    api
      .get<Usuario>("/auth/me")
      .then((res) => setUsuario(res.data))
      .catch(() => clearToken())
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (correo: string, password: string) => {
    setIniciandoSesion(true);
    setError(null);
    try {
      const res = await api.post<LoginResponse>("/auth/login", { correo, password });
      setToken(res.data.token);
      setUsuario(res.data.usuario);
      return res.data.usuario;
    } catch (err) {
      const mensaje =
        (axiosMessage(err) as string | undefined) ?? "No se pudo iniciar sesión. Intenta de nuevo.";
      setError(mensaje);
      throw err;
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

function axiosMessage(err: unknown): string | undefined {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error ===
      "string"
  ) {
    return (err as { response: { data: { error: string } } }).response.data.error;
  }
  return undefined;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
