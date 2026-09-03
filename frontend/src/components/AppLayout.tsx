import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../features/auth/useAuth";
import { nombreRol } from "../features/auth/rutasPorRol";

type NavigationIconName = "dashboard" | "providers" | "invoices";

const navigation: Array<{
  to: string;
  label: string;
  icon: NavigationIconName;
  end?: boolean;
}> = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/proveedores", label: "Proveedores", icon: "providers" },
  { to: "/facturas", label: "Facturas", icon: "invoices" },
];

function NavigationIcon({ name }: { name: NavigationIconName }) {
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
      </svg>
    );
  }

  if (name === "providers") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7-1a3 3 0 0 1 0 6m2 4v-1.5a3.5 3.5 0 0 0-2.2-3.25" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 3h9l3 3v15H6V3Zm9 0v4h4M9 11h6m-6 4h6m-6 4h4" />
    </svg>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();
  const initials = usuario?.nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || "SF";

  return (
    <div className="min-h-screen bg-sigefi-surface text-slate-800">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden"
          aria-label="Cerrar menú de navegación"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="main-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto bg-sigefi-blue-950 text-white shadow-xl transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-white/10 px-5 py-6 text-center">
          <img
            src="/images/logo-municipalidad.png"
            alt="Escudo de la Municipalidad de Chiquimulilla, Santa Rosa"
            className="mx-auto h-24 w-24 object-contain"
          />
          <p className="mt-3 text-2xl font-bold tracking-[0.16em] text-white">SIGEFI</p>
          <div className="mx-auto mt-2 h-0.5 w-12 bg-sigefi-yellow" />
          <p className="mt-3 text-xs leading-5 text-blue-100">
            Sistema de Gestión<br />Financiera Municipal
          </p>
        </div>

        <div className="px-4 pt-6">
          <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-blue-200/75">
            Menú principal
          </p>
        </div>

        <nav aria-label="Navegación principal" className="mt-3 space-y-1 px-3">
          {navigation.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  "relative flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-sigefi-yellow text-sigefi-blue-950 shadow-sm"
                    : "text-blue-50 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              <NavigationIcon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 px-5 py-5">
          <p className="text-xs leading-5 text-blue-200">Municipalidad de Chiquimulilla</p>
          <p className="text-[0.68rem] text-blue-300">Santa Rosa, Guatemala</p>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-white hover:text-sigefi-yellow md:hidden"
            onClick={logout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-60">
        <header className="sticky top-0 z-20 flex h-17 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-md border border-slate-200 text-sigefi-blue-900 hover:bg-slate-50 lg:hidden"
              aria-label="Abrir menú de navegación"
              aria-controls="main-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>

            <span className="text-base font-bold tracking-wide text-sigefi-blue-900">SIGEFI</span>
            <span className="hidden h-6 w-px bg-slate-300 sm:block" aria-hidden="true" />
            <span className="hidden truncate text-sm text-slate-500 sm:block">
              Sistema de Gestión Financiera Municipal
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-500">{usuario?.nombre}</p>
              <p className="text-sm font-semibold text-slate-800">
                {usuario ? nombreRol[usuario.rol] : "SIGEFI"}
              </p>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-sigefi-blue-50 text-xs font-bold text-sigefi-blue-800" aria-hidden="true">
              {initials}
            </div>
            <button
              type="button"
              className="hidden text-sm font-semibold text-sigefi-blue-800 hover:text-sigefi-blue-950 md:inline"
              onClick={logout}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
