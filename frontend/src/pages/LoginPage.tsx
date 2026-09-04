import { useId, useState, type FormEvent, type SVGProps } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../features/auth/useAuth";
import { rutaInicioPorRol } from "../features/auth/rutasPorRol";

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 10V7a5 5 0 0 1 10 0v3M6 10h12a1 1 0 0 1 1 1v9H5v-9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 14v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 6.5h16v11H4v-11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m5 7.5 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeIcon({ closed = false, ...props }: SVGProps<SVGSVGElement> & { closed?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      {closed && (
        <path d="m5 5 14 14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      )}
    </svg>
  );
}

function RoleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M6.5 20v-2.2c0-2.8 2.5-4.8 5.5-4.8s5.5 2 5.5 4.8V20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoginIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 5h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M4 12h11m0 0-3.5-3.5M15 12l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { usuario, login, iniciandoSesion, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const errorId = useId();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  if (usuario) {
    const destino =
      (location.state as { from?: string } | null)?.from ?? rutaInicioPorRol[usuario.rol];
    return <Navigate to={destino} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const usuarioAutenticado = await login(correo, password);
      navigate(rutaInicioPorRol[usuarioAutenticado.rol], { replace: true });
    } catch {
      // AuthContext conserva y expone el mensaje entendible para el usuario.
    }
  }

  return (
    <div className="flex min-h-screen flex-col border-t-[6px] border-sigefi-blue-800 bg-[#f8fafc] lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <div className="grid min-h-0 flex-1 md:grid-cols-[52%_48%] lg:grid-cols-[55%_45%]">
        <section
          className="relative hidden min-h-[680px] overflow-hidden bg-[#f9fbfc] bg-cover bg-center bg-no-repeat md:flex md:flex-col md:items-center lg:min-h-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(249,251,252,0) 74%, rgba(249,251,252,0.98) 100%), url('/images/login-background.png')",
          }}
        >
          <div className="login-brand-block relative z-10 flex w-full flex-col items-center px-8 pb-[clamp(10rem,25vh,15rem)] pt-[clamp(1.25rem,3vh,3rem)] text-center lg:px-12">
            <img
              src="/images/logo-municipalidad.png"
              alt="Escudo de la Municipalidad de Chiquimulilla, Santa Rosa"
              className="login-brand-logo h-[clamp(150px,22vh,235px)] w-auto object-contain drop-shadow-[0_10px_14px_rgba(15,23,42,0.13)]"
            />
            <p className="login-brand-title mt-1 font-serif text-[clamp(3.2rem,5vw,5.5rem)] font-bold leading-none tracking-[0.035em] text-sigefi-blue-800 drop-shadow-sm">
              SIGEFI
            </p>
            <h2 className="login-brand-subtitle mt-4 text-[clamp(1.05rem,1.45vw,1.5rem)] font-bold leading-tight text-sigefi-green-dark">
              Sistema de Gestión Financiera Municipal
            </h2>
            <p className="login-brand-description mt-3 max-w-[540px] text-[clamp(0.78rem,0.9vw,0.95rem)] leading-6 text-slate-600">
              Plataforma integrada para la gestión eficiente y transparente
              <br className="hidden lg:block" /> de los procesos financieros de la Municipalidad.
            </p>
          </div>
        </section>

        <main className="relative flex min-h-[680px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#ffffff_0%,#f8fafc_62%,#eff4f8_100%)] px-4 py-6 sm:px-8 md:px-[clamp(2rem,4vw,5rem)] md:py-8 lg:min-h-0 lg:py-4">
          <div className="login-card relative w-full max-w-[540px] rounded-[18px] border border-slate-200 bg-white px-6 py-7 shadow-[0_18px_48px_-18px_rgba(15,42,84,0.24)] sm:px-9 sm:py-8 lg:px-10 lg:py-7">
            <div className="mb-7 flex items-center justify-center gap-4 md:hidden">
              <img
                src="/images/logo-municipalidad.png"
                alt="Escudo de la Municipalidad de Chiquimulilla, Santa Rosa"
                className="h-24 w-auto shrink-0 object-contain"
              />
              <div>
                <p className="font-serif text-4xl font-bold tracking-[0.04em] text-sigefi-blue-800">
                  SIGEFI
                </p>
                <p className="mt-1 max-w-52 text-xs font-bold leading-snug text-sigefi-green-dark">
                  Sistema de Gestión Financiera Municipal
                </p>
              </div>
            </div>

            <div className="login-lock mx-auto flex size-[60px] items-center justify-center rounded-full bg-sigefi-blue-50 text-sigefi-blue-700">
              <LockIcon className="size-8" />
            </div>

            <div className="login-heading mt-4 text-center">
              <h1 className="text-[clamp(1.65rem,2.2vw,2rem)] font-bold tracking-[-0.025em] text-slate-900">
                Inicio de sesión
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Bienvenido al{" "}
                <span className="font-semibold text-sigefi-green-dark">
                  Sistema de Gestión Financiera Municipal
                </span>
                <br />
                Por favor, ingrese sus credenciales para continuar.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="login-form mt-6 space-y-4">
              <div>
                <label htmlFor="correo" className="mb-2 block text-sm font-bold text-slate-800">
                  Correo institucional
                </label>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="correo"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    required
                    value={correo}
                    onChange={(event) => setCorreo(event.target.value)}
                    placeholder="usuario@munichiquimulilla.gob.gt"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className="login-input min-h-12 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-sigefi-blue-700 focus:ring-4 focus:ring-sigefi-blue-100/65"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-800">
                  Contraseña
                </label>
                <div className="relative">
                  <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-500" />
                  <input
                    id="password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ingrese su contraseña"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className="login-input min-h-12 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-sigefi-blue-700 focus:ring-4 focus:ring-sigefi-blue-100/65"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-500 transition hover:bg-slate-50 hover:text-sigefi-blue-800 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-sigefi-blue-700"
                    aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <EyeIcon closed={mostrarPassword} className="size-5" />
                  </button>
                </div>
              </div>

              {error && (
                <div
                  id={errorId}
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-5 text-red-700"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-sigefi-red text-[10px] font-bold text-white"
                  >
                    !
                  </span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={iniciandoSesion}
                aria-busy={iniciandoSesion}
                className="login-submit flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-gradient-to-r from-sigefi-blue-700 to-[#0642a2] px-5 text-sm font-bold text-white shadow-[0_10px_22px_-12px_rgba(6,69,149,0.9)] transition hover:brightness-95 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sigefi-blue-700 disabled:cursor-wait disabled:opacity-70"
              >
                {iniciandoSesion ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                    />
                    Validando credenciales…
                  </>
                ) : (
                  <>
                    <LoginIcon className="size-6" />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>

            <div className="login-role mt-5 rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white px-5 py-4 text-emerald-950">
              <div className="flex items-center gap-4">
                <div className="login-role-icon flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sigefi-green to-green-800 text-white shadow-sm">
                  <RoleIcon className="size-7" />
                </div>
                <div>
                  <p className="text-base font-bold text-sigefi-green-dark">Acceso por rol asignado</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    El sistema identificará automáticamente el rol asociado a su cuenta al iniciar
                    sesión.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="login-footer relative z-20 flex min-h-16 shrink-0 flex-col items-center justify-center gap-1.5 border-t-4 border-sigefi-yellow bg-gradient-to-r from-[#073774] via-[#064eb7] to-[#073774] px-6 py-3 text-center sm:flex-row sm:justify-between sm:px-[clamp(2.5rem,6vw,6rem)]">
        <p className="text-lg font-bold italic tracking-wide text-sigefi-yellow sm:text-xl">
          ¡En Dios Confiamos!
        </p>
        <p className="text-xs font-semibold text-white sm:text-sm">
          Municipalidad de Chiquimulilla, Santa Rosa
        </p>
      </footer>
    </div>
  );
}
