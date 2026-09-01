import { apiFetch } from "../../api/http";
import type {
  PaginatedProveedores,
  Proveedor,
  ProveedorFilters,
  ProveedorPayload,
  ProveedorUpdatePayload,
} from "./proveedores.types";

const BASE_PATH = "/api/v1/proveedores";

export function listarProveedores(filters: ProveedorFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.q) params.set("q", filters.q);
  if (filters.tipo) params.set("tipo", filters.tipo);
  if (filters.activo) params.set("activo", filters.activo);

  return apiFetch<PaginatedProveedores>(`${BASE_PATH}?${params.toString()}`);
}

export function obtenerProveedor(id: number) {
  return apiFetch<Proveedor>(`${BASE_PATH}/${id}`);
}

export function crearProveedor(payload: ProveedorPayload) {
  return apiFetch<Proveedor>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarProveedor(id: number, payload: ProveedorUpdatePayload) {
  return apiFetch<Proveedor>(`${BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function cambiarEstadoProveedor(id: number, activo: boolean) {
  return apiFetch<Proveedor>(`${BASE_PATH}/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ activo }),
  });
}
