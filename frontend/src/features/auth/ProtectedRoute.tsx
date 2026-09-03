import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import type { RolUsuario } from "./types";

/**
 * RNF-04: la autorización por rol se valida en el backend (permitirRoles), pero
 * también la aplicamos aquí para no mostrarle al usuario pantallas a las que
 * de todas formas el backend le va a negar el acceso (HU-13 a HU-16).
 */
export function ProtectedRoute({ rolesPermitidos }: { rolesPermitidos?: RolUsuario[] }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Cargando sesión…
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
