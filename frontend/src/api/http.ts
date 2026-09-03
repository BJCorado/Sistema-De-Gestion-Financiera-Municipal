export interface ApiErrorDetail {
  campo: string;
  mensaje: string;
}

interface ApiErrorBody {
  error?: string;
  detalles?: ApiErrorDetail[];
}

const TOKEN_KEY = "sigefi_token";
let onUnauthorized: (() => void) | null = null;

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "La solicitud contiene datos inválidos.",
  401: "No fue posible identificar el rol del usuario.",
  403: "No tiene permisos para realizar esta operación.",
  404: "El recurso solicitado no fue encontrado.",
  409: "La operación entra en conflicto con el estado actual del registro.",
  500: "Ocurrió un error interno en el servidor.",
  502: "No fue posible conectar con el backend. Verifique que el servidor esté en ejecución.",
  503: "El servicio no está disponible temporalmente.",
  504: "El servidor tardó demasiado en responder.",
};

export class ApiError extends Error {
  readonly status: number;
  readonly detalles: ApiErrorDetail[];

  constructor(status: number, message: string, detalles: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detalles = detalles;
  }
}

export function getToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function registerOnUnauthorized(handler: (() => void) | null): () => void {
  onUnauthorized = handler;
  return () => {
    if (onUnauthorized === handler) onUnauthorized = null;
  };
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "No fue posible conectar con el servidor. Verifique que el backend esté en ejecución.",
    );
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | T | null;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    if (response.status === 401) {
      clearToken();
      onUnauthorized?.();
    }
    throw new ApiError(
      response.status,
      (response.status < 500 ? errorBody?.error : undefined) ||
        DEFAULT_MESSAGES[response.status] ||
        "No fue posible completar la solicitud.",
      Array.isArray(errorBody?.detalles) ? errorBody.detalles : [],
    );
  }

  return body as T;
}
