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
    pendiente: "bg-[#fff0d6] text-[#c96f10]",
    aprobada: "bg-[#e1f6e9] text-[#168248]",
    rechazada: "bg-[#fbe4e7] text-[#c52e40]",
  } satisfies Record<EstadoAprobacion, string>;
  return <span className={`status-badge ${colors[estado]}`}>{labels.aprobacion[estado]}</span>;
}

export function EstadoPagoBadge({ estado }: { estado: EstadoPago }) {
  const colors = {
    pendiente: "bg-[#eef0f5] text-[#626a82]",
    parcial: "bg-[#fff0d6] text-[#c96f10]",
    pagada: "bg-[#e1f6e9] text-[#168248]",
  } satisfies Record<EstadoPago, string>;
  return <span className={`status-badge ${colors[estado]}`}>{labels.pago[estado]}</span>;
}

export function EstadoOcrBadge({ estado }: { estado: EstadoOcr }) {
  const colors = {
    no_aplica: "bg-[#eef0f5] text-[#626a82]",
    procesando: "bg-[#e5ecff] text-[#294ca7]",
    extraido_pendiente_revision: "bg-[#fff0d6] text-[#c96f10]",
    verificado: "bg-[#e1f6e9] text-[#168248]",
  } satisfies Record<EstadoOcr, string>;
  return <span className={`status-badge ${colors[estado]}`}>{labels.ocr[estado]}</span>;
}

export function ModalidadBadge({ modalidad }: { modalidad: ModalidadCompra }) {
  return <span className="status-badge bg-[#eef0f5] text-[#525b78]">{labels.modalidad[modalidad]}</span>;
}

export function SemaforoBadge({ color, dias }: { color?: SemaforoColor; dias?: number }) {
  if (!color || dias === undefined) return <span className="text-slate-400">—</span>;
  const colors = {
    verde: "bg-[#e1f6e9] text-[#168248]",
    amarillo: "bg-[#fff0d6] text-[#c96f10]",
    rojo: "bg-[#fbe4e7] text-[#c52e40]",
  } satisfies Record<SemaforoColor, string>;
  const dot = {
    verde: "bg-green-500",
    amarillo: "bg-yellow-400",
    rojo: "bg-red-500",
  } satisfies Record<SemaforoColor, string>;
  const label = {
    verde: "En tiempo",
    amarillo: "Próxima a vencer",
    rojo: "Crítica",
  } satisfies Record<SemaforoColor, string>;
  const plazo =
    dias < 0
      ? `Vencida hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "día" : "días"}`
      : dias === 0
        ? "Vence hoy"
        : `Vence en ${dias} ${dias === 1 ? "día" : "días"}`;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${colors[color]}`}>
      <span className={`size-2 rounded-full ${dot[color]}`} aria-hidden="true" />
      {label[color]} · {plazo}
    </span>
  );
}
