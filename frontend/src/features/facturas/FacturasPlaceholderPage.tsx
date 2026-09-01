export function FacturasPlaceholderPage() {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-sm font-semibold text-sigefi-blue-700">Gestión administrativa</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Facturas</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Administración de facturas municipales.</p>
      </div>

      <div className="panel overflow-hidden">
        <div className="h-1 bg-sigefi-yellow" />
        <div className="px-6 py-14 text-center sm:px-8">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-sigefi-blue-50 text-sigefi-blue-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 3h9l3 3v15H6V3Zm9 0v4h4M9 11h6m-6 4h6m-6 4h4" />
            </svg>
          </div>
          <p className="mt-4 font-semibold text-slate-800">Pantalla pendiente de implementación</p>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Este módulo no forma parte de la etapa actual.
          </p>
        </div>
      </div>
    </section>
  );
}
