import { useAuth } from "../features/auth/AuthContext";
import { nombreRol } from "../features/auth/rutasPorRol";

/**
 * Placeholder temporal: aquí van las pantallas reales de cada rol (5.3
 * Proveedores/Facturas, 5.4 Semáforo, 5.9 Bandeja de aprobaciones, etc.),
 * que todavía no se han conectado. Sirve para confirmar visualmente que el
 * login + enrutamiento por rol funcionan de punta a punta mientras esas
 * tareas se integran.
 */
export default function DashboardPlaceholder() {
  const { usuario, logout } = useAuth();
  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <div>
          <p className="text-sm text-slate-500">SIGEFI · {nombreRol[usuario.rol]}</p>
          <p className="font-semibold text-slate-900">{usuario.nombre}</p>
        </div>
        <button
          onClick={logout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cerrar sesión
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-lg font-semibold text-slate-900">
          Bienvenido, {usuario.nombre}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sesión iniciada correctamente como <strong>{nombreRol[usuario.rol]}</strong>.
          Esta pantalla es temporal — aquí se conectará el dashboard real de este rol
          (tareas 5.3 en adelante).
        </p>
      </main>
    </div>
  );
}
