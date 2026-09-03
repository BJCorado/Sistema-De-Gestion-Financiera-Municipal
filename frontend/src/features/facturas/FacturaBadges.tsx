import type {
  EstadoAprobacion,
  EstadoOcr,
  EstadoPago,
  ModalidadCompra,
  SemaforoColor,
} from "./facturas.types";

const labels = {
  aprobacion: {
    pendiente: "Pendiente",
    aprobada: "Aprobada",
    rechazada: "Rechazada",
  } satisfies Record<EstadoAprobacion, string>,
  pago: {
    pendiente: "Pendiente",
    parcial: "Parcial",
    pagada: "Pagada",
  } satisfies Record<EstadoPago, string>,
  ocr: {
    no_aplica: "No aplica",
    procesando: "Procesando",
    extraido_pendiente_revision: "Pendiente de revisión",
    verificado: "Verificado",
  } satisfies Record<EstadoOcr, string>,
  modalidad: {
    baja_cuantia: "Baja cuantía",
    compra_directa: "Compra directa",
    cotizacion: "Cotización",
    licitacion: "Licitación",
  } satisfies Record<ModalidadCompra, string>,
};

export function EstadoAprobacionBadge({ estado }: { estado: EstadoAprobacion }) {
  const colors = {
    pendiente: "bg-amber-50 text-amber-800",
    aprobada: "bg-green-50 text-green-700",
    rechazada: "bg-red-50 text-red-700",
  } satisfies Record<EstadoAprobacion, string>;
  return <span className={`status-badge ${colors[estado]}`}>{labels.aprobacion[estado]}</span>;
}

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  const colors = {
    pendiente: "bg-slate-100 text-slate-700",
    parcial: "bg-blue-50 text-blue-700",
    pagada: "bg-green-50 text-green-700",
  } satisfies Record<EstadoPago, string>;
  return <span className={`status-badge ${colors[estado]}`}>{labels.pago[estado]}</span>;
}

export function EstadoOcrBadge({ estado }: { estado: EstadoOcr }) {
  const colors = {
    no_aplica: "bg-slate-100 text-slate-600",
    procesando: "bg-blue-50 text-blue-700",
    extraido_pendiente_revision: "bg-amber-50 text-amber-800",
    verificado: "bg-green-50 text-green-700",
  } satisfies Record<EstadoOcr, string>;
  return <span className={`status-badge ${colors[estado]}`}>{labels.ocr[estado]}</span>;
}

export function ModalidadBadge({ modalidad }: { modalidad: ModalidadCompra }) {
  return <span className="status-badge bg-sigefi-blue-50 text-sigefi-blue-800">{labels.modalidad[modalidad]}</span>;
}

export function SemaforoBadge({ color, dias }: { color?: SemaforoColor; dias?: number }) {
  if (!color || dias === undefined) return <span className="text-slate-400">—</span>;
  const colors = {
    verde: "bg-green-50 text-green-800 ring-green-200",
    amarillo: "bg-yellow-50 text-yellow-800 ring-yellow-200",
    rojo: "bg-red-50 text-red-800 ring-red-200",
  } satisfies Record<SemaforoColor, string>;
  const dot = {
    verde: "bg-green-500",
    amarillo: "bg-yellow-400",
    rojo: "bg-red-500",
  } satisfies Record<SemaforoColor, string>;
  const label = {
    verde: "Verde",
    amarillo: "Amarillo",
    rojo: "Rojo",
  } satisfies Record<SemaforoColor, string>;
  const plazo =
    dias < 0
      ? `Vencida hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`
      : dias === 0
        ? "Vence hoy"
        : `${dias} ${dias === 1 ? "día" : "días"}`;
  return (
    <span className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${colors[color]}`}>
      <span className={`size-2 rounded-full ${dot[color]}`} aria-hidden="true" />
      {label[color]} — {plazo}
    </span>
  );
}
