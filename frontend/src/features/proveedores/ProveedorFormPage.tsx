import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ApiError } from "../../api/http";
import { useAuth } from "../auth/useAuth";
import {
  actualizarProveedor,
  crearProveedor,
  obtenerProveedor,
} from "./proveedores.api";
import type {
  ProveedorPayload,
  ProveedorUpdatePayload,
  TipoProveedor,
} from "./proveedores.types";

interface FormState {
  nombre: string;
  nit: string;
  tipo: "" | TipoProveedor;
  contacto: string;
  telefono: string;
  correo: string;
  direccion: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = {
  nombre: "",
  nit: "",
  tipo: "",
  contacto: "",
  telefono: "",
  correo: "",
  direccion: "",
};

function FormField({
  label,
  required = false,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="form-label">
        {label} {required && <span className="text-sigefi-red">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const name = form.nombre.trim();
  const nit = form.nit.trim();
  const email = form.correo.trim();

  if (!name) errors.nombre = "El nombre del proveedor es obligatorio.";
  else if (name.length < 3) errors.nombre = "El nombre debe tener al menos 3 caracteres.";
  else if (name.length > 150) errors.nombre = "El nombre no puede superar 150 caracteres.";

  if (!nit) errors.nit = "El NIT es obligatorio.";
  if (form.tipo !== "bien" && form.tipo !== "servicio") {
    errors.tipo = "Seleccione Bienes o Servicios.";
  }
  if (form.contacto.trim().length > 120) {
    errors.contacto = "El contacto no puede superar 120 caracteres.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.correo = "Ingrese un correo electrónico válido.";
  }
  if (form.direccion.trim().length > 255) {
    errors.direccion = "La dirección no puede superar 255 caracteres.";
  }

  return errors;
}

export function ProveedorFormPage() {
  const { usuario } = useAuth();
  const tipoPorRol: "" | TipoProveedor =
    usuario?.rol === "compras" ? "bien" : usuario?.rol === "servicios" ? "servicio" : "";
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const editing = idParam !== undefined;
  const providerId = Number(idParam);
  const validId = !editing || (Number.isInteger(providerId) && providerId > 0);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, tipo: tipoPorRol });
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(editing);
  const [notFound, setNotFound] = useState(!validId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing || !validId) return;

    let active = true;

    void obtenerProveedor(providerId)
      .then((proveedor) => {
        if (!active) return;
        setForm({
          nombre: proveedor.nombre,
          nit: proveedor.nit,
          tipo: proveedor.tipo,
          contacto: proveedor.contacto ?? "",
          telefono: proveedor.telefono ?? "",
          correo: proveedor.correo ?? "",
          direccion: proveedor.direccion ?? "",
        });
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 404) {
          setNotFound(true);
        } else {
          setGeneralError(
            requestError instanceof ApiError
              ? requestError.message
              : "No fue posible cargar el proveedor.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [editing, providerId, validId]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setGeneralError("Revise los campos señalados antes de continuar.");
      return;
    }

    setSaving(true);
    setGeneralError("");
    setErrors({});

    const commonPayload: ProveedorUpdatePayload = {
      nombre: form.nombre.trim(),
      nit: form.nit.trim(),
      contacto: form.contacto.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      direccion: form.direccion.trim(),
    };

    try {
      const proveedor = editing
        ? await actualizarProveedor(providerId, commonPayload)
        : await crearProveedor({
            ...commonPayload,
            tipo: form.tipo as TipoProveedor,
          } satisfies ProveedorPayload);

      navigate(`/proveedores/${proveedor.id}`, {
        replace: true,
        state: {
          message: editing
            ? "Proveedor actualizado correctamente."
            : "Proveedor creado correctamente.",
        },
      });
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setGeneralError(requestError.message);
        const backendErrors: FormErrors = {};
        requestError.detalles.forEach((detail) => {
          if (detail.campo in form) {
            backendErrors[detail.campo as keyof FormState] = detail.mensaje;
          }
        });
        setErrors(backendErrors);
      } else {
        setGeneralError("No fue posible guardar el proveedor. Intente nuevamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <section className="mx-auto max-w-4xl">
        <div className="panel px-6 py-14 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Proveedor no encontrado.</h1>
          <p className="mt-2 text-sm text-slate-600">No existe un proveedor asociado al identificador solicitado.</p>
          <Link to="/proveedores" className="btn-primary mt-6">Volver a proveedores</Link>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-5xl" aria-busy="true">
        <div className="mb-6 h-20 animate-pulse rounded bg-slate-200/70" />
        <div className="panel space-y-5 p-6">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="h-11 animate-pulse rounded bg-slate-100" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="page-heading">
        <div>
        <Link to="/proveedores" className="text-xs font-semibold text-sigefi-blue-700 hover:text-sigefi-blue-900">
          ← Volver a proveedores
        </Link>
        <h1 className="page-title">
          {editing ? "Editar proveedor" : "Nuevo proveedor"}
        </h1>
        <p className="page-subtitle">
          {editing
            ? "Actualice la información general y de contacto del proveedor."
            : "Registre un proveedor municipal de bienes o servicios."}
        </p>
        </div>
      </div>

      {generalError && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {generalError}
        </div>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        <div className="panel overflow-hidden">
          <div className="h-1 bg-sigefi-yellow" />

          <fieldset className="border-b border-[#e7eaf2] p-5 sm:p-6">
            <legend className="text-base font-bold text-sigefi-blue-900">Información general</legend>
            <p className="mt-1 text-sm text-slate-500">Datos de identificación y clasificación del proveedor.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormField label="Tipo de proveedor" required error={errors.tipo} hint={editing || tipoPorRol ? "La clasificación está definida por el rol y no puede modificarse." : undefined}>
                <select
                  className={`form-control ${errors.tipo ? "form-control-error" : ""} ${editing || tipoPorRol ? "bg-slate-100 text-slate-600" : ""}`}
                  value={form.tipo}
                  disabled={editing || Boolean(tipoPorRol)}
                  onChange={(event) => updateField("tipo", event.target.value as FormState["tipo"])}
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="bien">Bienes</option>
                  <option value="servicio">Servicios</option>
                </select>
              </FormField>

              <FormField label="Nombre del proveedor" required error={errors.nombre}>
                <input
                  className={`form-control ${errors.nombre ? "form-control-error" : ""}`}
                  type="text"
                  value={form.nombre}
                  maxLength={150}
                  autoComplete="organization"
                  onChange={(event) => updateField("nombre", event.target.value)}
                />
              </FormField>

              <FormField label="NIT" required error={errors.nit}>
                <input
                  className={`form-control ${errors.nit ? "form-control-error" : ""}`}
                  type="text"
                  value={form.nit}
                  maxLength={20}
                  placeholder="Ej. 1234567-8"
                  onChange={(event) => updateField("nit", event.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="p-5 sm:p-6">
            <legend className="text-base font-bold text-sigefi-blue-900">Contacto</legend>
            <p className="mt-1 text-sm text-slate-500">Información opcional para comunicación con el proveedor.</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FormField label="Nombre del contacto" error={errors.contacto}>
                <input
                  className={`form-control ${errors.contacto ? "form-control-error" : ""}`}
                  type="text"
                  value={form.contacto}
                  maxLength={120}
                  autoComplete="name"
                  onChange={(event) => updateField("contacto", event.target.value)}
                />
              </FormField>

              <FormField label="Teléfono" error={errors.telefono}>
                <input
                  className={`form-control ${errors.telefono ? "form-control-error" : ""}`}
                  type="tel"
                  value={form.telefono}
                  maxLength={20}
                  autoComplete="tel"
                  onChange={(event) => updateField("telefono", event.target.value)}
                />
              </FormField>

              <FormField label="Correo electrónico" error={errors.correo}>
                <input
                  className={`form-control ${errors.correo ? "form-control-error" : ""}`}
                  type="email"
                  value={form.correo}
                  maxLength={150}
                  autoComplete="email"
                  onChange={(event) => updateField("correo", event.target.value)}
                />
              </FormField>

              <FormField label="Dirección" error={errors.direccion}>
                <textarea
                  className={`form-control min-h-24 resize-y ${errors.direccion ? "form-control-error" : ""}`}
                  value={form.direccion}
                  maxLength={255}
                  autoComplete="street-address"
                  onChange={(event) => updateField("direccion", event.target.value)}
                />
              </FormField>
            </div>
          </fieldset>

          <div className="flex flex-col-reverse gap-3 border-t border-[#e7eaf2] bg-[#f8f9fc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={() => navigate(editing ? `/proveedores/${providerId}` : "/proveedores")}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-success" disabled={saving}>
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar proveedor"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
