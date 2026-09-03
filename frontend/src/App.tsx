import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./features/auth/AuthContext";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { rutaInicioPorRol } from "./features/auth/rutasPorRol";
import LoginPage from "./pages/LoginPage";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import NotFound from "./pages/NotFound";

function Inicio() {
  const { usuario, cargando } = useAuth();
  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Navigate to={rutaInicioPorRol[usuario.rol]} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Inicio />} />

      <Route element={<ProtectedRoute rolesPermitidos={["compras"]} />}>
        <Route path="/compras" element={<DashboardPlaceholder />} />
      </Route>

      <Route element={<ProtectedRoute rolesPermitidos={["servicios"]} />}>
        <Route path="/servicios" element={<DashboardPlaceholder />} />
      </Route>

      <Route element={<ProtectedRoute rolesPermitidos={["administracion"]} />}>
        <Route path="/administracion" element={<DashboardPlaceholder />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
