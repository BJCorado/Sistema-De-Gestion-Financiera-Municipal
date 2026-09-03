import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { ApiError } from "../../api/http";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAuth } from "../auth/useAuth";
import { cambiarEstadoProveedor, obtenerProveedor } from "./proveedores.api";
import { ProveedorStatusBadge, TipoProveedorBadge } from "./ProveedorStatusBadge";
import type { Proveedor } from "./proveedores.types";

interface LocationState {
  message?: string;
}

function DetailItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0 sm:border-b-0 sm:py-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-slate-800">{value || "—"}</dd>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ProveedorDetailPage() {
  const { usuario } = useAuth();
  const canEdit = usuario?.rol === "compras" || usuario?.rol === "servicios";
  const { id: idParam } = useParams();
  const location = useLocation();
  const providerId = Number(idParam);
  const validId = Number.isInteger(providerId) && providerId > 0;
  const navigationMessage = (location.state as LocationState | null)?.message ?? "";
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(validId);
  const [notFound, setNotFound] = useState(!validId);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(navigationMessage);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let active = true;

    void obtenerProveedor(providerId)
      .then((response) => {
        if (active) setProveedor(response);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          setNotFound(true);
        } else {
          setError(
            requestError instanceof ApiError
              ? requestError.message
              : "No fue posible cargar el proveedor.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [providerId, validId]);

  async function changeStatus() {
    if (!proveedor) return;
    const nextStatus = !proveedor.activo;
    setChangingStatus(true);
    setError("");

    try {
      const updated = await cambiarEstadoProveedor(proveedor.id, nextStatus);
      setProveedor(updated);
      setSuccess(`Proveedor ${nextStatus ? "reactivado" : "desactivado"} correctamente.`);
      setConfirmOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "No fue posible cambiar el estado del proveedor.",
      );
      setConfirmOpen(false);
    } finally {
      setChangingStatus(false);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl" aria-busy="true">
        <div className="mb-6 h-24 animate-pulse rounded bg-slate-200/70" />
        <div className="panel grid gap-5 p-6 sm:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />)}
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="panel px-6 py-14 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-sigefi-blue-50 text-sigefi-blue-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Proveedor no encontrado.</h1>
          <p className="mt-2 text-sm text-slate-600">El registro solicitado no existe o no está disponible.</p>
          <Link to="/proveedores" className="btn-primary mt-6">Volver a proveedores</Link>
        </div>
      </section>
    );
  }

  if (!proveedor) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">
          {error || "No fue posible mostrar la información del proveedor."}
        </div>
        <Link to="/proveedores" className="btn-secondary mt-5">Volver a proveedores</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/proveedores" className="text-sm font-semibold text-sigefi-blue-700 hover:text-sigefi-blue-900">
            ← Volver a proveedores
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Detalle de proveedor</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Ficha administrativa del proveedor municipal.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canEdit && <Link to={`/proveedores/${proveedor.id}/editar`} className="btn-primary">Editar</Link>}
          <button
            type="button"
            className={proveedor.activo ? "btn-danger" : "btn-success"}
            onClick={() => setConfirmOpen(true)}
          >
            {proveedor.activo ? "Desactivar" : "Reactivar"}
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
          <span>{success}</span>
          <button type="button" className="font-bold text-green-700" aria-label="Cerrar mensaje" onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</div>
      )}

      <article className="panel overflow-hidden">
        <div className="h-1 bg-sigefi-yellow" />
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sigefi-blue-700">Proveedor</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{proveedor.nombre}</h2>
          </div>
          <ProveedorStatusBadge activo={proveedor.activo} />
        </div>

        <dl className="grid px-5 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 sm:px-6 sm:py-6 lg:grid-cols-3">
          <DetailItem label="Nombre" value={proveedor.nombre} />
          <DetailItem label="NIT" value={proveedor.nit} />
          <div className="border-b border-slate-100 py-4 sm:border-b-0 sm:py-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</dt>
            <dd className="mt-1.5"><TipoProveedorBadge tipo={proveedor.tipo} /></dd>
          </div>
          <DetailItem label="Contacto" value={proveedor.contacto} />
          <DetailItem label="Teléfono" value={proveedor.telefono} />
          <DetailItem label="Correo electrónico" value={proveedor.correo} />
          <DetailItem label="Dirección" value={proveedor.direccion} />
          <DetailItem label="Fecha de creación" value={formatDate(proveedor.creadoEn)} />
          <div className="py-4 sm:py-0">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</dt>
            <dd className="mt-1.5"><ProveedorStatusBadge activo={proveedor.activo} /></dd>
          </div>
        </dl>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title={proveedor.activo ? "¿Deseas desactivar este proveedor?" : "¿Deseas reactivar este proveedor?"}
        description={`${proveedor.nombre} quedará ${proveedor.activo ? "inactivo" : "activo"} en el sistema.`}
        confirmLabel={proveedor.activo ? "Desactivar" : "Reactivar"}
        tone={proveedor.activo ? "danger" : "success"}
        busy={changingStatus}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void changeStatus()}
      />
    </section>
  );
}
