import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { ApiError } from "../../api/http";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../auth/useAuth";
import { cambiarEstadoProveedor, listarProveedores } from "./proveedores.api";
import { ProveedorStatusBadge, TipoProveedorBadge } from "./ProveedorStatusBadge";
import type {
  PaginatedProveedores,
  Proveedor,
  TipoProveedor,
} from "./proveedores.types";

const LIMIT = 20;

type EstadoFilter = "todos" | "true" | "false";

interface LocationState {
  message?: string;
}

function readableError(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "No fue posible cargar los proveedores. Intente nuevamente.";
}

function getPageItems(current: number, total: number): Array<number | "ellipsis-left" | "ellipsis-right"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) pages.push("ellipsis-left");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < total - 1) pages.push("ellipsis-right");
  pages.push(total);

  return pages;
}

export function ProveedoresPage() {
  const { usuario } = useAuth();
  const scopedTipo: "" | TipoProveedor =
    usuario?.rol === "compras" ? "bien" : usuario?.rol === "servicios" ? "servicio" : "";
  const canManage = usuario?.rol === "compras" || usuario?.rol === "servicios";
  const location = useLocation();
  const navigationMessage = (location.state as LocationState | null)?.message ?? "";
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<"" | TipoProveedor>(scopedTipo);
  const [estado, setEstado] = useState<EstadoFilter>("todos");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedProveedores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(navigationMessage);
  const [statusTarget, setStatusTarget] = useState<Proveedor | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

    void listarProveedores({
      q: query || undefined,
      tipo: tipo || undefined,
      activo: estado,
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
  }, [estado, page, query, refreshKey, tipo]);

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / LIMIT));
  const pageItems = useMemo(() => getPageItems(page, totalPages), [page, totalPages]);
  const firstItem = result && result.total > 0 ? (result.page - 1) * result.limit + 1 : 0;
  const lastItem = result ? Math.min(result.page * result.limit, result.total) : 0;

  function clearFilters() {
    setLoading(true);
    setError("");
    setSearchInput("");
    setQuery("");
    setTipo(scopedTipo);
    setEstado("todos");
    setPage(1);
    setRefreshKey((value) => value + 1);
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;

    const nextStatus = !statusTarget.activo;
    setChangingStatus(true);
    setError("");

    try {
      await cambiarEstadoProveedor(statusTarget.id, nextStatus);
      setSuccess(`Proveedor ${nextStatus ? "reactivado" : "desactivado"} correctamente.`);
      setStatusTarget(null);
      setLoading(true);
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      setError(readableError(requestError));
      setStatusTarget(null);
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sigefi-blue-700">Gestión administrativa</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Proveedores</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Consulta y gestión de proveedores municipales.
          </p>
        </div>
        {canManage && (
          <Link to="/proveedores/nuevo" className="btn-primary shrink-0">
            <span className="text-lg leading-none" aria-hidden="true">+</span>
            Nuevo proveedor
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

      <div className="panel mb-5 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto] lg:items-end">
          <label className="block">
            <span className="form-label">Búsqueda</span>
            <span className="relative block">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
              </svg>
              <input
                type="search"
                className="form-control pl-10"
                placeholder="Buscar por NIT, nombre o contacto..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </span>
          </label>

          <label className="block">
            <span className="form-label">Tipo</span>
            <select
              className="form-control"
              value={tipo}
              disabled={Boolean(scopedTipo)}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setTipo(event.target.value as "" | TipoProveedor);
                setPage(1);
              }}
            >
              {!scopedTipo && <option value="">Todos</option>}
              {usuario?.rol !== "servicios" && <option value="bien">Bienes</option>}
              {usuario?.rol !== "compras" && <option value="servicio">Servicios</option>}
            </select>
          </label>

          <label className="block">
            <span className="form-label">Estado</span>
            <select
              className="form-control"
              value={estado}
              onChange={(event) => {
                setLoading(true);
                setError("");
                setEstado(event.target.value as EstadoFilter);
                setPage(1);
              }}
            >
              <option value="todos">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </label>

          <button type="button" className="btn-secondary whitespace-nowrap" onClick={clearFilters}>
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <p className="text-sm font-bold text-slate-900">Listado de proveedores</p>
          <p className="mt-1 text-xs text-slate-500">{result?.total ?? 0} proveedores registrados según los filtros aplicados.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-5 py-3">NIT</th>
                <th className="px-5 py-3">Nombre del proveedor</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Contacto</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && Array.from({ length: 5 }, (_, index) => (
                <tr key={index} aria-hidden="true">
                  {Array.from({ length: 7 }, (_, cell) => (
                    <td key={cell} className="px-5 py-4"><span className="block h-4 animate-pulse rounded bg-slate-100" /></td>
                  ))}
                </tr>
              ))}

              {!loading && result?.data.map((proveedor) => (
                <tr key={proveedor.id} className="transition-colors hover:bg-sigefi-blue-50/40">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">{proveedor.nit}</td>
                  <td className="px-5 py-4 font-semibold text-slate-900">{proveedor.nombre}</td>
                  <td className="px-5 py-4"><TipoProveedorBadge tipo={proveedor.tipo} /></td>
                  <td className="px-5 py-4 text-slate-600">{proveedor.contacto || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-600">{proveedor.telefono || "—"}</td>
                  <td className="px-5 py-4"><ProveedorStatusBadge activo={proveedor.activo} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link className="table-action" to={`/proveedores/${proveedor.id}`} title="Ver proveedor" aria-label={`Ver proveedor ${proveedor.nombre}`}>Ver</Link>
                      {canManage && <Link className="table-action" to={`/proveedores/${proveedor.id}/editar`} title="Editar proveedor" aria-label={`Editar proveedor ${proveedor.nombre}`}>Editar</Link>}
                      <button
                        type="button"
                        className={proveedor.activo ? "table-action-danger" : "table-action-success"}
                        title={proveedor.activo ? "Desactivar proveedor" : "Reactivar proveedor"}
                        aria-label={`${proveedor.activo ? "Desactivar" : "Reactivar"} proveedor ${proveedor.nombre}`}
                        onClick={() => setStatusTarget(proveedor)}
                      >
                        {proveedor.activo ? "Desactivar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && result?.data.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold text-slate-700">No se encontraron proveedores.</p>
            <p className="mt-1 text-sm text-slate-500">Modifique o limpie los filtros para intentar nuevamente.</p>
          </div>
        )}

        {!loading && result && result.total > 0 && (
          <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Mostrando <strong>{firstItem}</strong>–<strong>{lastItem}</strong> de <strong>{result.total}</strong>
            </p>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Paginación de proveedores">
              <button type="button" className="pagination-button" disabled={page <= 1} onClick={() => { setLoading(true); setPage((value) => Math.max(1, value - 1)); }}>Anterior</button>
              {pageItems.map((item) =>
                typeof item === "number" ? (
                  <button
                    key={item}
                    type="button"
                    className={`pagination-number ${item === page ? "pagination-number-active" : ""}`}
                    aria-current={item === page ? "page" : undefined}
                    onClick={() => {
                      if (item !== page) {
                        setLoading(true);
                        setPage(item);
                      }
                    }}
                  >
                    {item}
                  </button>
                ) : (
                  <span key={item} className="px-1 text-slate-400" aria-hidden="true">…</span>
                ),
              )}
              <button type="button" className="pagination-button" disabled={page >= totalPages} onClick={() => { setLoading(true); setPage((value) => Math.min(totalPages, value + 1)); }}>Siguiente</button>
            </nav>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(statusTarget)}
        title={statusTarget?.activo ? "¿Deseas desactivar este proveedor?" : "¿Deseas reactivar este proveedor?"}
        description={statusTarget ? `${statusTarget.nombre} quedará ${statusTarget.activo ? "inactivo" : "activo"} en el sistema.` : ""}
        confirmLabel={statusTarget?.activo ? "Desactivar" : "Reactivar"}
        tone={statusTarget?.activo ? "danger" : "success"}
        busy={changingStatus}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => void confirmStatusChange()}
      />
    </section>
  );
}
