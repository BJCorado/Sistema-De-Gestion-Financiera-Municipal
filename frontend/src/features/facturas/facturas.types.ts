export type DecimalValue = string | number;
export type EstadoPago = "pendiente" | "parcial" | "pagada";
export type EstadoAprobacion = "pendiente" | "aprobada" | "rechazada";
export type EstadoOcr =
  | "no_aplica"
  | "procesando"
  | "extraido_pendiente_revision"
  | "verificado";
export type ModalidadCompra =
  | "baja_cuantia"
  | "compra_directa"
  | "cotizacion"
  | "licitacion";
export type SemaforoColor = "verde" | "amarillo" | "rojo";

export interface Factura {
  id: number;
  proveedorId: number;
  nitEmisor: string;
  nombreEmisor: string;
  nitReceptor: string;
  nombreReceptor: string;
  serie: string | null;
  registradoPor: number;
  numeroFactura: string;
  montoTotal: DecimalValue;
  montoAbonado: DecimalValue;
  saldoPendiente: DecimalValue;
  fechaEmision: string;
  fechaVencimiento: string;
  estadoAprobacion: EstadoAprobacion;
  estadoPago: EstadoPago;
  estadoOcr: EstadoOcr;
  modalidadCompra: ModalidadCompra;
  numeroAutorizacionSat: string | null;
  verificadoSat: boolean;
  discrepanciaSat: boolean;
  verificadoPor: number | null;
  fechaVerificacionSat: string | null;
  categoriaGasto: string | null;
  adjuntoUrl: string | null;
  creadoEn: string;
  dias_restantes?: number;
  color?: SemaforoColor;
  aprobacion_progreso?: unknown | null;
}

export interface FacturaFilters {
  q?: string;
  estado_pago?: EstadoPago;
  estado_aprobacion?: EstadoAprobacion;
  estado_ocr?: EstadoOcr;
  modalidad_compra?: ModalidadCompra;
  proveedor_id?: number;
  orden?: "antiguedad";
  page: number;
  limit: number;
}

export interface PaginatedFacturas {
  data: Factura[];
  page: number;
  limit: number;
  total: number;
}

export interface FacturaCreatePayload {
  proveedor_id: number;
  numero_factura: string;
  monto_total: number;
  fecha_vencimiento: string;
  modalidad_compra: ModalidadCompra;
  nit_emisor?: string;
  nombre_emisor?: string;
  serie?: string;
  fecha_emision?: string;
  estado_ocr?: EstadoOcr;
  categoria_gasto?: string;
  adjunto_url?: string;
}

export interface FacturaUpdatePayload {
  numero_factura: string;
  monto_total: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  categoria_gasto: string;
}
