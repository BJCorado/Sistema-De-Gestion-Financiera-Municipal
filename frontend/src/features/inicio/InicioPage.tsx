import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ApiError } from "../../api/http";
import {
  EstadoAprobacionBadge,
  EstadoPagoBadge,
  SemaforoBadge,
} from "../facturas/FacturaBadges";
import { listarTodasFacturas } from "../facturas/facturas.api";
import type {
  FacturaConSemaforo,
  SemaforoColor,
} from "../facturas/facturas.types";
import { listarTodosProveedores } from "../proveedores/proveedores.api";
import type { Proveedor } from "../proveedores/proveedores.types";

type FiltroSemaforo = "todas" | SemaforoColor;

const MAX_FILAS = 10;

const resumen = [
  {
    color: "rojo",
    titulo: "Vencimiento crítico",
    descripcion: "Menos de 15 días; incluye vencidas.",
    borde: "border-l-red-500",
    punto: "bg-red-500",
    texto: "text-red-700",
  },
  {
    color: "amarillo",
    titulo: "Próximas a vencer",
    descripcion: "Entre 15 y 30 días, inclusive.",
    borde: "border-l-amber-400",
    punto: "bg-amber-400",
    texto: "text-amber-700",
  },
  {
    color: "verde",
    titulo: "En tiempo",
    descripcion: "Más de 30 días para vencer.",
    borde: "border-l-green-500",
    punto: "bg-green-500",
    texto: "text-green-700",
  },
] satisfies Array<{
  color: SemaforoColor;
  titulo: string;
  descripcion: string;
  borde: string;
  punto: string;
  texto: string;
}>;

function mensajeError(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "No fue posible cargar el resumen de vencimientos. Verifique la conexión e intente nuevamente.";
}

function formatearMoneda(value: string | number): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(amount);
}

function formatearFecha(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function InicioPage() {
  const [facturas, setFacturas] = useState<FacturaConSemaforo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filtro, setFiltro] = useState<FiltroSemaforo>("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [providerWarning, setProviderWarning] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([
      listarTodasFacturas(),
      listarTodosProveedores("todos"),
    ]).then(([facturasResult, proveedoresResult]) => {
      if (!active) return;

      if (facturasResult.status === "fulfilled") {
        setFacturas(facturasResult.value);
      } else {
        setFacturas([]);
        setError(mensajeError(facturasResult.reason));
      }

      if (proveedoresResult.status === "fulfilled") {
        setProveedores(proveedoresResult.value);
      } else {
        setProveedores([]);
        setProviderWarning("No fue posible cargar los nombres de proveedores; se mostrarán sus identificadores.");
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const cantidades = useMemo(
    () => ({
      rojo: facturas.filter((factura) => factura.color === "rojo").length,
      amarillo: facturas.filter((factura) => factura.color === "amarillo").length,
      verde: facturas.filter((factura) => factura.color === "verde").length,
    }),
    [facturas],
  );

  const facturasOrdenadas = useMemo(() => {
    const seleccionadas =
      filtro === "todas"
        ? facturas
        : facturas.filter((factura) => factura.color === filtro);

    return [...seleccionadas].sort(
      (a, b) =>
        a.dias_restantes - b.dias_restantes ||
        new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime() ||
        a.id - b.id,
    );
  }, [facturas, filtro]);

  const proveedoresPorId = useMemo(
    () => new Map(proveedores.map((proveedor) => [proveedor.id, proveedor.nombre])),
    [proveedores],
  );

  const filasVisibles = facturasOrdenadas.slice(0, MAX_FILAS);

  return (
    <section className="mx-auto max-w-[100rem]">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold text-sigefi-blue-700">Panel principal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Resumen administrativo de vencimientos de facturas municipales.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn-secondary shrink-0"
            onClick={() => {
              setLoading(true);
              setError("");
              setProviderWarning("");
              setRefreshKey((value) => value + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {providerWarning && !error && (
        <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          {providerWarning}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3" aria-busy={loading}>
        {resumen.map((item) => (
          <article key={item.color} className={`panel border-l-4 p-5 ${item.borde}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-xs font-bold uppercase tracking-wide ${item.texto}`}>
                  {item.color}
                </p>
                <h2 className="mt-1 text-base font-bold text-slate-900">{item.titulo}</h2>
              </div>
              <span className={`mt-1 size-3 shrink-0 rounded-full ${item.punto}`} aria-hidden="true" />
            </div>
            {loading ? (
              <div className="mt-4 h-9 w-24 animate-pulse rounded bg-slate-100" aria-hidden="true" />
            ) : (
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {cantidades[item.color]}
                <span className="ml-2 text-sm font-medium text-slate-500">
                  {cantidades[item.color] === 1 ? "factura" : "facturas"}
                </span>
              </p>
            )}
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.descripcion}</p>
          </article>
        ))}
      </div>

      <div className="panel mt-5 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Facturas por vencimiento</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Ordenadas desde las vencidas y más urgentes hasta las de mayor plazo.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600" id="semaforo-filter-label">
              Filtrar por semáforo
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-labelledby="semaforo-filter-label">
              {(["todas", "rojo", "amarillo", "verde"] as const).map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  aria-pressed={filtro === opcion}
                  className={`rounded-md border px-3 py-2 text-xs font-semibold capitalize transition ${
                    filtro === opcion
                      ? "border-sigefi-blue-700 bg-sigefi-blue-700 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => setFiltro(opcion)}
                >
                  {opcion}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Vencimiento</th>
                <th className="px-4 py-3">Aprobación</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Semáforo</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading &&
                Array.from({ length: 5 }, (_, row) => (
                  <tr key={row} aria-hidden="true">
                    {Array.from({ length: 8 }, (_, cell) => (
                      <td key={cell} className="px-4 py-4">
                        <span className="block h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!loading && !error && filasVisibles.map((factura) => (
                <tr key={factura.id} className="transition-colors hover:bg-sigefi-blue-50/40">
                  <td className="px-4 py-4 font-semibold text-slate-900">{factura.numeroFactura}</td>
                  <td className="px-4 py-4 text-slate-700">
                    {proveedoresPorId.get(factura.proveedorId) ?? `Proveedor #${factura.proveedorId}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-800">
                    {formatearMoneda(factura.montoTotal)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {formatearFecha(factura.fechaVencimiento)}
                  </td>
                  <td className="px-4 py-4">
                    <EstadoAprobacionBadge estado={factura.estadoAprobacion} />
                  </td>
                  <td className="px-4 py-4">
                    <EstadoPagoBadge estado={factura.estadoPago} />
                  </td>
                  <td className="px-4 py-4">
                    <SemaforoBadge color={factura.color} dias={factura.dias_restantes} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/facturas/${factura.id}`}
                      className="table-action"
                      aria-label={`Ver factura ${factura.numeroFactura}`}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && facturasOrdenadas.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold text-slate-700">
              {facturas.length === 0
                ? "No hay facturas registradas."
                : "No hay facturas en esta categoría."}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {facturas.length === 0
                ? "El resumen aparecerá cuando existan facturas disponibles."
                : "Seleccione otro estado del semáforo para consultar sus registros."}
            </p>
          </div>
        )}

        {!loading && !error && facturasOrdenadas.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando <strong>{filasVisibles.length}</strong> de <strong>{facturasOrdenadas.length}</strong> facturas en esta selección.
            </p>
            <Link to="/facturas" className="font-semibold text-sigefi-blue-700 hover:text-sigefi-blue-900">
              Ver listado completo →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
