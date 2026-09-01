import { apiFetch } from "../../api/http";
import type {
  Factura,
  FacturaCreatePayload,
  FacturaFilters,
  FacturaUpdatePayload,
  PaginatedFacturas,
} from "./facturas.types";

const BASE_PATH = "/api/v1/facturas";

export function listarFacturas(filters: FacturaFilters) {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });

  if (filters.q) params.set("q", filters.q);
  if (filters.estado_pago) params.set("estado_pago", filters.estado_pago);
  if (filters.estado_aprobacion) params.set("estado_aprobacion", filters.estado_aprobacion);
  if (filters.estado_ocr) params.set("estado_ocr", filters.estado_ocr);
  if (filters.modalidad_compra) params.set("modalidad_compra", filters.modalidad_compra);
  if (filters.proveedor_id) params.set("proveedor_id", String(filters.proveedor_id));
  if (filters.orden) params.set("orden", filters.orden);

  return apiFetch<PaginatedFacturas>(`${BASE_PATH}?${params.toString()}`);
}

export function obtenerFactura(id: number) {
  return apiFetch<Factura>(`${BASE_PATH}/${id}`);
}

export function crearFactura(payload: FacturaCreatePayload) {
  return apiFetch<Factura>(BASE_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function actualizarFactura(id: number, payload: FacturaUpdatePayload) {
  return apiFetch<Factura>(`${BASE_PATH}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
