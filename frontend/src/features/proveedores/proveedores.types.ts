export type TipoProveedor = "bien" | "servicio";

export interface Proveedor {
  id: number;
  nombre: string;
  nit: string;
  tipo: TipoProveedor;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  activo: boolean;
  creadoEn: string;
}

export interface ProveedorPayload {
  nombre: string;
  nit: string;
  tipo: TipoProveedor;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
}

export type ProveedorUpdatePayload = Omit<ProveedorPayload, "tipo">;

export interface ProveedorFilters {
  q?: string;
  tipo?: TipoProveedor;
  activo?: "true" | "false" | "todos";
  page: number;
  limit: number;
}

export interface PaginatedProveedores {
  data: Proveedor[];
  page: number;
  limit: number;
  total: number;
}
