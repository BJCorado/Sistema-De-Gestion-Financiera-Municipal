import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { FacturaDetailPage } from "./features/facturas/FacturaDetailPage";
import { FacturaFormPage } from "./features/facturas/FacturaFormPage";
import { FacturasPage } from "./features/facturas/FacturasPage";
import { InicioPage } from "./features/inicio/InicioPage";
import { ProveedorDetailPage } from "./features/proveedores/ProveedorDetailPage";
import { ProveedorFormPage } from "./features/proveedores/ProveedorFormPage";
import { ProveedoresPage } from "./features/proveedores/ProveedoresPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const rolesGestion = ["compras", "servicios"] as const;

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <InicioPage /> },
          { path: "proveedores", element: <ProveedoresPage /> },
          { path: "proveedores/:id", element: <ProveedorDetailPage /> },
          {
            element: <ProtectedRoute rolesPermitidos={[...rolesGestion]} />,
            children: [
              { path: "proveedores/nuevo", element: <ProveedorFormPage /> },
              { path: "proveedores/:id/editar", element: <ProveedorFormPage /> },
            ],
          },
          { path: "facturas", element: <FacturasPage /> },
          { path: "facturas/:id", element: <FacturaDetailPage /> },
          {
            element: <ProtectedRoute rolesPermitidos={[...rolesGestion]} />,
            children: [
              { path: "facturas/nueva", element: <FacturaFormPage /> },
              { path: "facturas/:id/editar", element: <FacturaFormPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
