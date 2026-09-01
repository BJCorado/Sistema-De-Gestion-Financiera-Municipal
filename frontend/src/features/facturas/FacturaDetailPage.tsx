import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { ApiError } from "../../api/http";
import { obtenerProveedor } from "../proveedores/proveedores.api";
import type { Proveedor } from "../proveedores/proveedores.types";
import {
  EstadoAprobacionBadge,
  EstadoOcrBadge,
  EstadoPagoBadge,
  ModalidadBadge,
  SemaforoBadge,
} from "./FacturaBadges";
import { obtenerFactura } from "./facturas.api";
import type { Factura } from "./facturas.types";

interface LocationState { message?: string; }

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return <div className="border-b border-slate-100 py-4 last:border-b-0 sm:border-b-0 sm:py-0"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1.5 break-words text-sm font-medium text-slate-800">{children}</dd></div>;
}

function formatCurrency(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(amount) : "—";
}

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-GT", { day: "2-digit", month: "long", year: "numeric", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : { timeZone: "UTC" }) }).format(date);
}

function canEdit(factura: Factura) {
  return factura.estadoAprobacion !== "aprobada" && factura.estadoPago === "pendiente";
}

function isSafeLink(value: string) {
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function FacturaDetailPage() {
  const { id: idParam } = useParams();
  const location = useLocation();
  const facturaId = Number(idParam);
  const validId = Number.isInteger(facturaId) && facturaId > 0;
  const [factura, setFactura] = useState<Factura | null>(null);
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(validId);
  const [notFound, setNotFound] = useState(!validId);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState((location.state as LocationState | null)?.message ?? "");

  useEffect(() => {
    if (!validId) return;
    let active = true;
    void obtenerFactura(facturaId)
      .then(async (invoice) => {
        if (!active) return;
        setFactura(invoice);
        try {
          const provider = await obtenerProveedor(invoice.proveedorId);
          if (active) setProveedor(provider);
        } catch {
          // El detalle de la factura sigue siendo utilizable con el ID del proveedor.
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) setNotFound(true);
        else setError(requestError instanceof ApiError ? requestError.message : "No fue posible cargar la factura.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [facturaId, validId]);

  if (loading) return <section className="mx-auto max-w-6xl" aria-busy="true"><div className="mb-6 h-24 animate-pulse rounded bg-slate-200/70" /><div className="panel grid gap-5 p-6 sm:grid-cols-2">{Array.from({ length: 10 }, (_, index) => <div key={index} className="h-12 animate-pulse rounded bg-slate-100" />)}</div></section>;
  if (notFound) return <section className="mx-auto max-w-4xl"><div className="panel px-6 py-14 text-center"><h1 className="text-2xl font-bold text-slate-900">Factura no encontrada.</h1><p className="mt-2 text-sm text-slate-600">El registro solicitado no existe o no está disponible.</p><Link to="/facturas" className="btn-primary mt-6">Volver a facturas</Link></div></section>;
  if (!factura) return <section className="mx-auto max-w-4xl"><div className="rounded-md border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800" role="alert">{error || "No fue posible mostrar la información de la factura."}</div><Link to="/facturas" className="btn-secondary mt-5">Volver a facturas</Link></section>;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div><Link to="/facturas" className="text-sm font-semibold text-sigefi-blue-700 hover:text-sigefi-blue-900">← Volver a facturas</Link><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Detalle de factura</h1><p className="mt-2 text-sm text-slate-600">Información administrativa y financiera registrada.</p></div>
        {canEdit(factura) && <Link to={`/facturas/${factura.id}/editar`} className="btn-primary">Editar factura</Link>}
      </div>

      {success && <div className="mb-5 flex items-start justify-between gap-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status"><span>{success}</span><button type="button" className="font-bold text-green-700" aria-label="Cerrar mensaje" onClick={() => setSuccess("")}>×</button></div>}
      {error && <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{error}</div>}

      <article className="panel overflow-hidden">
        <div className="h-1 bg-sigefi-yellow" />
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-xs font-semibold uppercase tracking-wide text-sigefi-blue-700">Factura</p><h2 className="mt-1 text-xl font-bold text-slate-900">{factura.numeroFactura}</h2><p className="mt-1 text-sm text-slate-500">{proveedor?.nombre ?? `Proveedor #${factura.proveedorId}`}</p></div><SemaforoBadge color={factura.color} dias={factura.dias_restantes} /></div>

        <section className="border-b border-slate-200 p-5 sm:p-6"><h3 className="section-title">Documento y proveedor</h3><dl className="mt-4 grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 lg:grid-cols-3"><DetailItem label="Proveedor">{proveedor?.nombre ?? `Proveedor #${factura.proveedorId}`}</DetailItem><DetailItem label="NIT del proveedor">{proveedor?.nit ?? factura.nitEmisor}</DetailItem><DetailItem label="Número de factura">{factura.numeroFactura}</DetailItem><DetailItem label="Serie">{factura.serie || "—"}</DetailItem><DetailItem label="Modalidad"><ModalidadBadge modalidad={factura.modalidadCompra} /></DetailItem><DetailItem label="Categoría de gasto">{factura.categoriaGasto || "—"}</DetailItem></dl></section>

        <section className="border-b border-slate-200 p-5 sm:p-6"><h3 className="section-title">Emisor y receptor</h3><dl className="mt-4 grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7"><DetailItem label="Nombre del emisor">{factura.nombreEmisor}</DetailItem><DetailItem label="NIT del emisor">{factura.nitEmisor}</DetailItem><DetailItem label="Nombre del receptor">{factura.nombreReceptor}</DetailItem><DetailItem label="NIT del receptor">{factura.nitReceptor}</DetailItem></dl></section>

        <section className="border-b border-slate-200 p-5 sm:p-6"><h3 className="section-title">Información financiera</h3><dl className="mt-4 grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 lg:grid-cols-3"><DetailItem label="Monto total">{formatCurrency(factura.montoTotal)}</DetailItem><DetailItem label="Monto abonado">{formatCurrency(factura.montoAbonado)}</DetailItem><DetailItem label="Saldo pendiente">{formatCurrency(factura.saldoPendiente)}</DetailItem><DetailItem label="Fecha de emisión">{formatDate(factura.fechaEmision)}</DetailItem><DetailItem label="Fecha de vencimiento">{formatDate(factura.fechaVencimiento)}</DetailItem><DetailItem label="Días restantes"><SemaforoBadge color={factura.color} dias={factura.dias_restantes} /></DetailItem></dl></section>

        <section className="border-b border-slate-200 p-5 sm:p-6"><h3 className="section-title">Estados</h3><dl className="mt-4 grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 lg:grid-cols-3"><DetailItem label="Aprobación"><EstadoAprobacionBadge estado={factura.estadoAprobacion} /></DetailItem><DetailItem label="Pago"><EstadoPagoBadge estado={factura.estadoPago} /></DetailItem><DetailItem label="OCR"><EstadoOcrBadge estado={factura.estadoOcr} /></DetailItem></dl></section>

        <section className="border-b border-slate-200 p-5 sm:p-6"><h3 className="section-title">Verificación SAT</h3><dl className="mt-4 grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 lg:grid-cols-3"><DetailItem label="Número de autorización">{factura.numeroAutorizacionSat || "—"}</DetailItem><DetailItem label="Verificada">{factura.verificadoSat ? "Sí" : "No"}</DetailItem><DetailItem label="Discrepancia">{factura.discrepanciaSat ? "Sí" : "No"}</DetailItem><DetailItem label="Verificado por">{factura.verificadoPor ? `Usuario #${factura.verificadoPor}` : "—"}</DetailItem><DetailItem label="Fecha de verificación">{formatDate(factura.fechaVerificacionSat, true)}</DetailItem></dl></section>

        <section className="p-5 sm:p-6"><h3 className="section-title">Registro y adjunto</h3><dl className="mt-4 grid sm:grid-cols-2 sm:gap-x-10 sm:gap-y-7 lg:grid-cols-3"><DetailItem label="Registrado por">Usuario #{factura.registradoPor}</DetailItem><DetailItem label="Fecha de registro">{formatDate(factura.creadoEn, true)}</DetailItem><DetailItem label="Adjunto">{factura.adjuntoUrl ? isSafeLink(factura.adjuntoUrl) ? <a href={factura.adjuntoUrl} target="_blank" rel="noreferrer" className="text-sigefi-blue-700 underline hover:text-sigefi-blue-900">Abrir referencia</a> : factura.adjuntoUrl : "—"}</DetailItem></dl></section>
      </article>
    </section>
  );
}
