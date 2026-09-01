import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../api/http";
import { listarTodosProveedores } from "../proveedores/proveedores.api";
import type { Proveedor } from "../proveedores/proveedores.types";
import { actualizarFactura, crearFactura, obtenerFactura } from "./facturas.api";
import type {
  Factura,
  FacturaCreatePayload,
  FacturaUpdatePayload,
  ModalidadCompra,
} from "./facturas.types";

interface FormState {
  proveedor_id: string;
  numero_factura: string;
  monto_total: string;
  fecha_vencimiento: string;
  modalidad_compra: "" | ModalidadCompra;
  nit_emisor: string;
  nombre_emisor: string;
  serie: string;
  fecha_emision: string;
  categoria_gasto: string;
  adjunto_url: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  proveedor_id: "",
  numero_factura: "",
  monto_total: "",
  fecha_vencimiento: "",
  modalidad_compra: "",
  nit_emisor: "",
  nombre_emisor: "",
  serie: "",
  fecha_emision: "",
  categoria_gasto: "",
  adjunto_url: "",
};

function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return <label className="block"><span className="form-label">{label} {required && <span className="text-sigefi-red">*</span>}</span>{children}{hint && !error && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}{error && <span className="field-error">{error}</span>}</label>;
}

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function validate(form: FormState, editing: boolean): FormErrors {
  const errors: FormErrors = {};
  if (!editing && (!form.proveedor_id || !Number.isInteger(Number(form.proveedor_id)))) errors.proveedor_id = "Seleccione un proveedor.";
  if (!form.numero_factura.trim()) errors.numero_factura = "El número de factura es obligatorio.";
  else if (form.numero_factura.trim().length > 50) errors.numero_factura = "El número no puede superar 50 caracteres.";
  if (!form.monto_total.trim()) errors.monto_total = "El monto total es obligatorio.";
  else if (!Number.isFinite(Number(form.monto_total))) errors.monto_total = "Ingrese un monto numérico válido.";
  if (!form.fecha_vencimiento) errors.fecha_vencimiento = "La fecha de vencimiento es obligatoria.";
  if (!editing && !form.modalidad_compra) errors.modalidad_compra = "Seleccione una modalidad de compra.";
  if (form.nit_emisor.trim().length > 20) errors.nit_emisor = "El NIT no puede superar 20 caracteres.";
  if (form.nombre_emisor.trim().length > 150) errors.nombre_emisor = "El nombre no puede superar 150 caracteres.";
  if (form.serie.trim().length > 50) errors.serie = "La serie no puede superar 50 caracteres.";
  if (form.categoria_gasto.trim().length > 80) errors.categoria_gasto = "La categoría no puede superar 80 caracteres.";
  if (form.adjunto_url.trim().length > 255) errors.adjunto_url = "La referencia no puede superar 255 caracteres.";
  return errors;
}

function knownEditBlock(factura: Factura | null) {
  if (!factura) return "";
  if (factura.estadoAprobacion === "aprobada") return "No se puede editar una factura ya aprobada.";
  if (factura.estadoPago !== "pendiente") return "No se puede editar una factura con pagos registrados.";
  return "";
}

export function FacturaFormPage() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const editing = idParam !== undefined;
  const facturaId = Number(idParam);
  const validId = !editing || (Number.isInteger(facturaId) && facturaId > 0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(!validId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let active = true;

    const request = editing
      ? Promise.all([obtenerFactura(facturaId), listarTodosProveedores("todos")])
      : Promise.all([Promise.resolve(null), listarTodosProveedores("true")]);

    void request
      .then(([invoice, providerList]) => {
        if (!active) return;
        setProveedores(providerList);
        if (invoice) {
          setFactura(invoice);
          setForm({
            proveedor_id: String(invoice.proveedorId),
            numero_factura: invoice.numeroFactura,
            monto_total: String(invoice.montoTotal),
            fecha_vencimiento: toDateInput(invoice.fechaVencimiento),
            modalidad_compra: invoice.modalidadCompra,
            nit_emisor: invoice.nitEmisor,
            nombre_emisor: invoice.nombreEmisor,
            serie: invoice.serie ?? "",
            fecha_emision: toDateInput(invoice.fechaEmision),
            categoria_gasto: invoice.categoriaGasto ?? "",
            adjunto_url: invoice.adjuntoUrl ?? "",
          });
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404 && editing) setNotFound(true);
        else setGeneralError(requestError instanceof ApiError ? requestError.message : "No fue posible cargar la información del formulario.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [editing, facturaId, validId]);

  const selectedProvider = useMemo(() => proveedores.find((provider) => provider.id === Number(form.proveedor_id)) ?? null, [form.proveedor_id, proveedores]);
  const editBlock = knownEditBlock(factura);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editBlock) { setGeneralError(editBlock); return; }
    const validationErrors = validate(form, editing);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setGeneralError("Revise los campos señalados antes de continuar.");
      return;
    }

    setSaving(true);
    setGeneralError("");
    setErrors({});
    try {
      let saved: Factura;
      if (editing) {
        const payload: FacturaUpdatePayload = {
          numero_factura: form.numero_factura.trim(),
          monto_total: Number(form.monto_total),
          fecha_emision: form.fecha_emision,
          fecha_vencimiento: form.fecha_vencimiento,
          categoria_gasto: form.categoria_gasto.trim(),
        };
        saved = await actualizarFactura(facturaId, payload);
      } else {
        const payload: FacturaCreatePayload = {
          proveedor_id: Number(form.proveedor_id),
          numero_factura: form.numero_factura.trim(),
          monto_total: Number(form.monto_total),
          fecha_vencimiento: form.fecha_vencimiento,
          modalidad_compra: form.modalidad_compra as ModalidadCompra,
        };
        if (form.nit_emisor.trim()) payload.nit_emisor = form.nit_emisor.trim();
        if (form.nombre_emisor.trim()) payload.nombre_emisor = form.nombre_emisor.trim();
        if (form.serie.trim()) payload.serie = form.serie.trim();
        if (form.fecha_emision) payload.fecha_emision = form.fecha_emision;
        if (form.categoria_gasto.trim()) payload.categoria_gasto = form.categoria_gasto.trim();
        if (form.adjunto_url.trim()) payload.adjunto_url = form.adjunto_url.trim();
        saved = await crearFactura(payload);
      }
      navigate(`/facturas/${saved.id}`, { replace: true, state: { message: editing ? "Factura actualizada correctamente." : "Factura registrada correctamente." } });
    } catch (requestError) {
      setGeneralError(requestError instanceof ApiError ? requestError.message : "No fue posible guardar la factura. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  }

  if (notFound) return <section className="mx-auto max-w-4xl"><div className="panel px-6 py-14 text-center"><h1 className="text-2xl font-bold text-slate-900">Factura no encontrada.</h1><p className="mt-2 text-sm text-slate-600">No existe una factura asociada al identificador solicitado.</p><Link to="/facturas" className="btn-primary mt-6">Volver a facturas</Link></div></section>;
  if (loading) return <section className="mx-auto max-w-6xl" aria-busy="true"><div className="mb-6 h-20 animate-pulse rounded bg-slate-200/70" /><div className="panel space-y-5 p-6">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-11 animate-pulse rounded bg-slate-100" />)}</div></section>;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <Link to={editing ? `/facturas/${facturaId}` : "/facturas"} className="text-sm font-semibold text-sigefi-blue-700 hover:text-sigefi-blue-900">← Volver a facturas</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{editing ? "Editar factura" : "Registrar factura"}</h1>
        <p className="mt-2 text-sm text-slate-600">{editing ? "Modifique únicamente los datos habilitados por el backend." : "Registre una factura asociada a un proveedor municipal."}</p>
      </div>

      {generalError && <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{generalError}</div>}
      {editBlock && <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900" role="status">{editBlock}</div>}

      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="panel overflow-hidden">
          <div className="h-1 bg-sigefi-yellow" />
          <fieldset className="border-b border-slate-200 p-5 sm:p-6" disabled={Boolean(editBlock)}>
            <legend className="text-base font-bold text-sigefi-blue-900">Información de la factura</legend>
            <p className="mt-1 text-sm text-slate-500">Identificación, proveedor y modalidad de compra.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {editing ? <div><span className="form-label">Proveedor</span><div className="readonly-value">{selectedProvider?.nombre ?? `Proveedor #${form.proveedor_id}`}</div></div> : <Field label="Proveedor" required error={errors.proveedor_id}><select className={`form-control ${errors.proveedor_id ? "form-control-error" : ""}`} value={form.proveedor_id} onChange={(event) => updateField("proveedor_id", event.target.value)}><option value="">Seleccione un proveedor</option>{proveedores.map((provider) => <option key={provider.id} value={provider.id}>{provider.nombre} — {provider.nit}</option>)}</select></Field>}
              <Field label="Número de factura" required error={errors.numero_factura}><input className={`form-control ${errors.numero_factura ? "form-control-error" : ""}`} value={form.numero_factura} maxLength={50} onChange={(event) => updateField("numero_factura", event.target.value)} /></Field>
              {editing ? <div><span className="form-label">Modalidad de compra</span><div className="readonly-value">{form.modalidad_compra.replaceAll("_", " ")}</div></div> : <Field label="Modalidad de compra" required error={errors.modalidad_compra}><select className={`form-control ${errors.modalidad_compra ? "form-control-error" : ""}`} value={form.modalidad_compra} onChange={(event) => updateField("modalidad_compra", event.target.value as FormState["modalidad_compra"])}><option value="">Seleccione una modalidad</option><option value="baja_cuantia">Baja cuantía</option><option value="compra_directa">Compra directa</option><option value="cotizacion">Cotización</option><option value="licitacion">Licitación</option></select></Field>}
              {editing ? <div><span className="form-label">Serie</span><div className="readonly-value">{form.serie || "—"}</div></div> : <Field label="Serie" error={errors.serie}><input className={`form-control ${errors.serie ? "form-control-error" : ""}`} value={form.serie} maxLength={50} onChange={(event) => updateField("serie", event.target.value)} /></Field>}
            </div>
          </fieldset>

          {!editing && <fieldset className="border-b border-slate-200 p-5 sm:p-6"><legend className="text-base font-bold text-sigefi-blue-900">Datos del emisor</legend><p className="mt-1 text-sm text-slate-500">Si se dejan vacíos, el backend utilizará el NIT y nombre del proveedor.</p><div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="NIT del emisor" error={errors.nit_emisor}><input className={`form-control ${errors.nit_emisor ? "form-control-error" : ""}`} value={form.nit_emisor} maxLength={20} onChange={(event) => updateField("nit_emisor", event.target.value)} /></Field><Field label="Nombre del emisor" error={errors.nombre_emisor}><input className={`form-control ${errors.nombre_emisor ? "form-control-error" : ""}`} value={form.nombre_emisor} maxLength={150} onChange={(event) => updateField("nombre_emisor", event.target.value)} /></Field></div></fieldset>}

          <fieldset className="border-b border-slate-200 p-5 sm:p-6" disabled={Boolean(editBlock)}><legend className="text-base font-bold text-sigefi-blue-900">Montos y fechas</legend><div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="Monto total" required error={errors.monto_total}><input type="number" step="0.01" className={`form-control ${errors.monto_total ? "form-control-error" : ""}`} value={form.monto_total} onChange={(event) => updateField("monto_total", event.target.value)} /></Field><Field label="Categoría de gasto" error={errors.categoria_gasto}><input className={`form-control ${errors.categoria_gasto ? "form-control-error" : ""}`} value={form.categoria_gasto} maxLength={80} onChange={(event) => updateField("categoria_gasto", event.target.value)} /></Field><Field label="Fecha de emisión" error={errors.fecha_emision} hint={editing ? undefined : "Si no se indica, el backend utilizará la fecha actual."}><input type="date" className={`form-control ${errors.fecha_emision ? "form-control-error" : ""}`} value={form.fecha_emision} onChange={(event) => updateField("fecha_emision", event.target.value)} /></Field><Field label="Fecha de vencimiento" required error={errors.fecha_vencimiento}><input type="date" className={`form-control ${errors.fecha_vencimiento ? "form-control-error" : ""}`} value={form.fecha_vencimiento} onChange={(event) => updateField("fecha_vencimiento", event.target.value)} /></Field></div></fieldset>

          {!editing && <fieldset className="p-5 sm:p-6"><legend className="text-base font-bold text-sigefi-blue-900">Referencia documental</legend><p className="mt-1 text-sm text-slate-500">No se realiza carga de archivos; el backend sólo admite una referencia URL.</p><div className="mt-5"><Field label="URL del adjunto" error={errors.adjunto_url}><input type="text" className={`form-control ${errors.adjunto_url ? "form-control-error" : ""}`} value={form.adjunto_url} maxLength={255} placeholder="https://..." onChange={(event) => updateField("adjunto_url", event.target.value)} /></Field></div></fieldset>}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" className="btn-secondary" disabled={saving} onClick={() => navigate(editing ? `/facturas/${facturaId}` : "/facturas")}>Cancelar</button><button type="submit" className="btn-success" disabled={saving || Boolean(editBlock)}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar factura"}</button></div>
        </div>
      </form>
    </section>
  );
}
