import { FormEvent, useId, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { rutaInicioPorRol } from "../features/auth/rutasPorRol";

/**
 * Pantalla de inicio de sesión (HU-16, RNF-03).
 *
 * Nota de diseño: el mockup de Figma (tarea 3.3, frame "Login (admin)")
 * mostraba 3 tarjetas para "elegir" el rol antes de iniciar sesión. Eso
 * tenía sentido cuando el prototipo no tenía backend real; ahora el rol
 * viene firmado dentro del JWT que devuelve POST /auth/login (RNF-04) y ya
 * no lo elige el usuario en la UI. Se conserva el panel de marca/slogan del
 * mockup, pero se quitó el selector de tarjetas por no tener función real —
 * si el equipo prefiere mantenerlo solo como elemento visual, es un ajuste
 * directo sobre este componente.
 *
 * Layout: la tarjeta de login "flota" centrada sobre un fondo claro (fiel
 * al mockup), en vez de ocupar toda la pantalla de borde a borde. La
 * tipografía del panel de marca se ajustó a esta tarjeta más angosta
 * (tamaños más chicos, interlineado más relajado) para que no se vea
 * amontonada.
 *
 * Accesibilidad / buenas prácticas aplicadas:
 * - Un solo <h1> real en la página ("Iniciar sesión"); el panel de marca es
 *   contenido de apoyo (<aside>), no otro nivel de encabezado.
 * - El error de autenticación se anuncia con role="alert" y queda asociado
 *   a los campos vía aria-describedby / aria-invalid.
 * - Foco inicial en el campo de correo y estados de foco visibles en los
 *   inputs (ya definidos en el diseño anterior, se conservan).
 */
export default function LoginPage() {
  const { usuario, login, iniciandoSesion, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const errorId = useId();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  // Si ya hay sesión activa (o se acaba de restaurar desde localStorage),
  // no tiene sentido mostrar el login: mandamos directo al dashboard del rol.
  if (usuario) {
    const destino =
      (location.state as { from?: string } | null)?.from ?? rutaInicioPorRol[usuario.rol];
    return <Navigate to={destino} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const u = await login(correo, password);
      navigate(rutaInicioPorRol[u.rol], { replace: true });
    } catch {
      // El mensaje de error ya queda expuesto vía `error` del contexto.
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 sm:px-6">
      {/* Tarjeta flotante — dos paneles con esquinas redondeadas y sombra,
          en vez de ocupar toda la pantalla (fiel al mockup de Figma). */}
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
        {/* Panel izquierdo — marca (contenido de apoyo, no es el foco principal de la página) */}
        <aside
          aria-label="Información institucional"
          className="hidden w-1/2 flex-col justify-center gap-10 bg-navy p-12 text-white lg:flex"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-base font-bold">
              SF
            </div>
            <div>
              <p className="text-lg font-bold leading-tight">SIGEFI</p>
              <p className="text-xs text-white/70">Municipalidad de Chiquimulilla</p>
            </div>
          </div>

          <div>
            <p className="text-lg font-semibold leading-snug text-balance">
              Sistema de Gestión Financiera Municipal
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Cuentas por pagar, semáforo de vencimientos, aprobación multinivel y flujo de caja
              en un solo lugar.
            </p>
          </div>

          <div>
            <p className="text-base font-semibold leading-snug text-balance">
              Chiquimulilla está cambiando
            </p>
            <p className="mt-1.5 font-['Caveat',_cursive] text-3xl font-bold leading-tight text-gold">
              Tu Muni está trabajando
            </p>
          </div>

          <div className="space-y-1 text-[11px] leading-relaxed text-white/50">
            <p>Municipalidad de Chiquimulilla, Santa Rosa</p>
            <p>Administración 2020 – 2028</p>
            <p>Prototipo funcional — Proyecto Seminario</p>
            <p>Datos de ejemplo, sin información financiera real.</p>
          </div>
        </aside>

        {/* Panel derecho — formulario (contenido principal de la página) */}
        <main className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-1/2 lg:px-14">
          {/* Marca compacta, visible solo cuando el panel izquierdo se oculta (móvil) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
              SF
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">SIGEFI</p>
              <p className="text-xs text-slate-500">Municipalidad de Chiquimulilla</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-2xl font-bold leading-tight text-slate-900">Iniciar sesión</h1>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Ingresa con tu correo institucional para continuar.
            </p>

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-slate-700">
                  Correo institucional
                </label>
                <input
                  id="correo"
                  type="email"
                  autoComplete="username"
                  autoFocus
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@munichiquimulilla.gob.gt"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/20"
                />
              </div>

              {error && (
                <div
                  id={errorId}
                  role="alert"
                  className="rounded-lg bg-semaforo-rojo/10 px-3.5 py-2.5 text-sm text-semaforo-rojo"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={iniciandoSesion}
                aria-busy={iniciandoSesion}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {iniciandoSesion ? "Ingresando…" : "Iniciar sesión"}
              </button>
            </form>

            <div className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
              ¿Necesitas ayuda? soporte@munichiquimulilla.gob.gt
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
