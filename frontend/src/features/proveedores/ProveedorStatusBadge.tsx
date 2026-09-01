import type { TipoProveedor } from "./proveedores.types";

export function ProveedorStatusBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        activo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}
    >
      <span className={`size-1.5 rounded-full ${activo ? "bg-sigefi-green" : "bg-sigefi-red"}`} />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

export function TipoProveedorBadge({ tipo }: { tipo: TipoProveedor }) {
  return (
    <span className="inline-flex rounded-full bg-sigefi-blue-50 px-2.5 py-1 text-xs font-semibold text-sigefi-blue-800">
      {tipo === "bien" ? "Bienes" : "Servicios"}
    </span>
  );
}
