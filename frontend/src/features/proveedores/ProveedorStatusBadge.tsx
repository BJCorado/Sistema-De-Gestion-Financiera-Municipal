import type { TipoProveedor } from "./proveedores.types";

export function ProveedorStatusBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        activo ? "bg-[#e1f6e9] text-[#168248]" : "bg-[#fbe4e7] text-[#c52e40]"
      }`}
    >
      <span className={`size-1.5 rounded-full ${activo ? "bg-sigefi-green" : "bg-sigefi-red"}`} />
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}

export function TipoProveedorBadge({ tipo }: { tipo: TipoProveedor }) {
  return (
    <span className="inline-flex rounded-full bg-[#eef0f5] px-2.5 py-1 text-[10.5px] font-semibold text-[#525b78]">
      {tipo === "bien" ? "Bienes" : "Servicios"}
    </span>
  );
}
