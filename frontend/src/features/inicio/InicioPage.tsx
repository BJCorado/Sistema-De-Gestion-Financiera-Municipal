export function InicioPage() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold text-sigefi-blue-700">Panel principal</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Bienvenido al Sistema de Gestión Financiera Municipal.
        </p>
      </div>

      <div className="panel overflow-hidden">
        <div className="h-1 bg-sigefi-yellow" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              src="/images/logo-municipalidad.png"
              alt="Escudo de la Municipalidad de Chiquimulilla"
              className="h-24 w-24 shrink-0 object-contain"
            />
            <div>
              <h2 className="text-xl font-bold text-sigefi-blue-900">SIGEFI</h2>
              <p className="mt-1 text-sm font-medium text-sigefi-green">Sistema de Gestión Financiera Municipal</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                La estructura principal está preparada para incorporar los módulos autorizados del sistema.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="panel border-l-4 border-l-sigefi-blue-700 p-5">
          <p className="text-sm font-bold text-slate-900">Proveedores</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Módulo pendiente de la siguiente etapa funcional.</p>
        </div>
        <div className="panel border-l-4 border-l-sigefi-yellow p-5">
          <p className="text-sm font-bold text-slate-900">Facturas</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Módulo pendiente de implementación.</p>
        </div>
      </div>
    </section>
  );
}
