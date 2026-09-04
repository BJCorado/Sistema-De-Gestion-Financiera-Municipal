import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ApiError } from "../../api/http";
import { useAuth } from "../auth/useAuth";
import { listarTodosProveedores } from "../proveedores/proveedores.api";
import type { Proveedor } from "../proveedores/proveedores.types";
import {
  EstadoAprobacionBadge,
  EstadoOcrBadge,
  EstadoPagoBadge,
  ModalidadBadge,
  SemaforoBadge,
} from "./FacturaBadges";
import { listarFacturas } from "./facturas.api";
import type {
  EstadoAprobacion,
  EstadoOcr,
  EstadoPago,
  Factura,
  ModalidadCompra,
  PaginatedFacturas,
} from "./facturas.types";

const LIMIT = 20;

interface LocationState {
  message?: string;
}

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "No fue posible cargar las facturas. Intente nuevamente.";
}

function formatCurrency(value: string | number) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function canEdit(factura: Factura) {
  return factura.estadoAprobacion !== "aprobada" && factura.estadoPago === "pendiente";
}

function getPageItems(current: number, total: number): Array<number | "left" | "right"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: Array<number | "left" | "right"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("left");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push("right");
  pages.push(total);
  return pages;
}

export function FacturasPage() {
  const { usuario } = useAuth();
  const canManage = usuario?.rol === "compras" || usuario?.rol === "servicios";
  const location = useLocation();
  const navigationMessage = (location.state as LocationState | null)?.message ?? "";
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [estadoPago, setEstadoPago] = useState<"" | EstadoPago>("");
  const [estadoAprobacion, setEstadoAprobacion] = useState<"" | EstadoAprobacion>("");
  const [estadoOcr, setEstadoOcr] = useState<"" | EstadoOcr>("");
  const [modalidad, setModalidad] = useState<"" | ModalidadCompra>("");
  const [proveedorId, setProveedorId] = useState("");
  const [orden, setOrden] = useState<"" | "antiguedad">("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedFacturas | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providerError, setProviderError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(navigationMessage);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void listarTodosProveedores("todos")
      .then((data) => {
        if (active) setProveedores(data);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setProviderError(
            requestError instanceof ApiError
              ? requestError.message
              : "No fue posible cargar el catálogo de proveedores.",
          );
        }
      })
      .finally(() => {
        if (active) setProvidersLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextQuery = searchInput.trim();
      if (nextQuery !== query) {
        setLoading(true);
        setError("");
        setQuery(nextQuery);
        setPage(1);
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [query, searchInput]);

  useEffect(() => {
    let active = true;
    void listarFacturas({
      q: query || undefined,
      estado_pago: estadoPago || undefined,
      estado_aprobacion: estadoAprobacion || undefined,
      estado_ocr: estadoOcr || undefined,
      modalidad_compra: modalidad || undefined,
      proveedor_id: proveedorId ? Number(proveedorId) : undefined,
      orden: orden || undefined,
      page,
      limit: LIMIT,
    })
      .then((response) => {
        if (active) setResult(response);
      })
      .catch((requestError: unknown) => {
        if (active) setError(readableError(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [estadoAprobacion, estadoOcr, estadoPago, modalidad, orden, page, proveedorId, query, refreshKey]);

  const providerNames = useMemo(
    () => new Map(proveedores.map((proveedor) => [proveedor.id, proveedor.nombre])),
    [proveedores],
  );
  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / LIMIT));
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const firstItem = result && result.total > 0 ? (result.page - 1) * result.limit + 1 : 0;
  const lastItem = result ? Math.min(result.page * result.limit, result.total) : 0;

  function beginFilterChange() {
    setLoading(true);
    setError("");
    setPage(1);
  }

  function clearFilters() {
    setLoading(true);
    setError("");
    setSearchInput("");
    setQuery("");
    setEstadoPago("");
    setEstadoAprobacion("");
    setEstadoOcr("");
    setModalidad("");
    setProveedorId("");
    setOrden("");
    setPage(1);
    setRefreshKey((value) => value + 1);
  }

  return (
    <section className="mx-auto max-w-[100rem]">
      <div className="page-heading">
        <div>
          <p className="page-kicker">Cuentas por pagar</p>
          <h1 className="page-title">Facturas (consolidado)</h1>
          <p className="page-subtitle">Consulta y gestión de facturas municipales con su estado de vencimiento.</p>
        </div>
        {canManage && (
          <Link to="/facturas/nueva" className="btn-primary shrink-0">
            <span className="text-lg leading-none" aria-hidden="true">+</span>
            Nueva factura
          </Link>
        )}
      </div>

      {success && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          <span>{success}</span>
          <button type="button" className="font-bold text-green-700" aria-label="Cerrar mensaje" onClick={() => setSuccess("")}>×</button>
        </div>
      )}
      {error && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          <span>{error}</span>
          <button type="button" className="font-bold text-red-700" aria-label="Cerrar error" onClick={() => setError("")}>×</button>
        </div>
      )}
      {providerError && (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          Las facturas pueden consultarse, pero el catálogo de proveedores no está disponible: {providerError}
        </div>
      )}

      <div className="panel mb-5 p-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          <label className="block md:col-span-2 xl:col-span-2">
            <span className="form-label">Búsqueda</span>
            <input
              type="search"
              className="form-control"
              placeholder="Buscar por número de factura..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="form-label">Proveedor</span>
            <select className="form-control" value={proveedorId} disabled={providersLoading || proveedores.length === 0} onChange={(event) => { beginFilterChange(); setProveedorId(event.target.value); }}>
              <option value="">Todos</option>
              {proveedores.map((proveedor) => <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}{proveedor.activo ? "" : " (inactivo)"}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="form-label">Estado de pago</span>
            <select className="form-control" value={estadoPago} onChange={(event) => { beginFilterChange(); setEstadoPago(event.target.value as "" | EstadoPago); }}>
              <option value="">Todos</option><option value="pendiente">Pendiente</option><option value="parcial">Parcial</option><option value="pagada">Pagada</option>
            </select>
          </label>
          <label className="block">
            <span className="form-label">Aprobación</span>
            <select className="form-control" value={estadoAprobacion} onChange={(event) => { beginFilterChange(); setEstadoAprobacion(event.target.value as "" | EstadoAprobacion); }}>
              <option value="">Todos</option><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="rechazada">Rechazada</option>
            </select>
          </label>
          <label className="block">
            <span className="form-label">Estado OCR</span>
            <select className="form-control" value={estadoOcr} onChange={(event) => { beginFilterChange(); setEstadoOcr(event.target.value as "" | EstadoOcr); }}>
              <option value="">Todos</option><option value="no_aplica">No aplica</option><option value="procesando">Procesando</option><option value="extraido_pendiente_revision">Pendiente de revisión</option><option value="verificado">Verificado</option>
            </select>
          </label>
          <label className="block">
            <span className="form-label">Modalidad</span>
            <select className="form-control" value={modalidad} onChange={(event) => { beginFilterChange(); setModalidad(event.target.value as "" | ModalidadCompra); }}>
              <option value="">Todas</option><option value="baja_cuantia">Baja cuantía</option><option value="compra_directa">Compra directa</option><option value="cotizacion">Cotización</option><option value="licitacion">Licitación</option>
            </select>
          </label>
          <label className="block">
            <span className="form-label">Orden</span>
            <select className="form-control" value={orden} onChange={(event) => { beginFilterChange(); setOrden(event.target.value as "" | "antiguedad"); }}>
              <option value="">Vencimiento</option><option value="antiguedad">Antigüedad</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-secondary" onClick={clearFilters}>Limpiar filtros</button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-[#e7eaf2] px-5 py-3.5">
          <p className="text-[12.5px] font-bold text-[#1b2340]">Listado de facturas</p>
          <p className="mt-1 text-[10.5px] text-[#8891ab]">{result?.total ?? 0} facturas según los filtros aplicados.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1480px] border-collapse text-left text-xs">
            <thead className="bg-[#f5f7fb] text-[10px] font-semibold uppercase tracking-wide text-[#6c7590]">
              <tr>
                <th className="px-4 py-3">Factura</th><th className="px-4 py-3">Proveedor</th><th className="px-4 py-3">Monto</th><th className="px-4 py-3">Emisión</th><th className="px-4 py-3">Vencimiento</th><th className="px-4 py-3">Aprobación</th><th className="px-4 py-3">Pago</th><th className="px-4 py-3">OCR</th><th className="px-4 py-3">Modalidad</th><th className="px-4 py-3">Días restantes</th><th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7eaf2] bg-white">
              {loading && Array.from({ length: 5 }, (_, row) => (
                <tr key={row} aria-hidden="true">{Array.from({ length: 11 }, (_, cell) => <td key={cell} className="px-4 py-4"><span className="block h-4 animate-pulse rounded bg-slate-100" /></td>)}</tr>
              ))}
              {!loading && result?.data.map((factura) => (
                <tr key={factura.id} className="transition-colors hover:bg-[#f8f9fc]">
                  <td className="px-4 py-4 font-semibold text-slate-900">{factura.numeroFactura}</td>
                  <td className="px-4 py-4 text-slate-700">{providerNames.get(factura.proveedorId) ?? `Proveedor #${factura.proveedorId}`}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">{formatCurrency(factura.montoTotal)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(factura.fechaEmision)}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(factura.fechaVencimiento)}</td>
                  <td className="px-4 py-4"><EstadoAprobacionBadge estado={factura.estadoAprobacion} /></td>
                  <td className="px-4 py-4"><EstadoPagoBadge estado={factura.estadoPago} /></td>
                  <td className="px-4 py-4"><EstadoOcrBadge estado={factura.estadoOcr} /></td>
                  <td className="px-4 py-4"><ModalidadBadge modalidad={factura.modalidadCompra} /></td>
                  <td className="px-4 py-4"><SemaforoBadge color={factura.color} dias={factura.dias_restantes} /></td>
                  <td className="px-4 py-4"><div className="flex justify-end gap-1"><Link className="table-action" to={`/facturas/${factura.id}`} title="Ver factura" aria-label={`Ver factura ${factura.numeroFactura}`}>Ver</Link>{canManage && canEdit(factura) && <Link className="table-action" to={`/facturas/${factura.id}/editar`} title="Editar factura" aria-label={`Editar factura ${factura.numeroFactura}`}>Editar</Link>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !error && result?.data.length === 0 && <div className="px-6 py-14 text-center"><p className="font-semibold text-slate-700">No se encontraron facturas.</p><p className="mt-1 text-sm text-slate-500">Modifique o limpie los filtros para intentar nuevamente.</p></div>}
        {!loading && result && result.total > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Mostrando <strong>{firstItem}</strong>–<strong>{lastItem}</strong> de <strong>{result.total}</strong></p>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Paginación de facturas">
              <button type="button" className="pagination-button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => Math.max(1, value - 1)); }}>Anterior</button>
              {pageItems.map((item) => typeof item === "number" ? <button key={item} type="button" className={`pagination-number ${item === page ? "pagination-number-active" : ""}`} aria-current={item === page ? "page" : undefined} onClick={() => { if (item !== page) { setLoading(true); setPage(item); } }}>{item}</button> : <span key={item} className="px-1 text-slate-400" aria-hidden="true">…</span>)}
              <button type="button" className="pagination-button" disabled={page >= totalPages} onClick={() => { setLoading(true); setPage((value) => Math.min(totalPages, value + 1)); }}>Siguiente</button>
            </nav>
          </div>
        )}
      </div>
    </section>
  );
}
