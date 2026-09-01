import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./components/AppLayout";
import { FacturaDetailPage } from "./features/facturas/FacturaDetailPage";
import { FacturaFormPage } from "./features/facturas/FacturaFormPage";
import { FacturasPage } from "./features/facturas/FacturasPage";
import { InicioPage } from "./features/inicio/InicioPage";
import { ProveedorDetailPage } from "./features/proveedores/ProveedorDetailPage";
import { ProveedorFormPage } from "./features/proveedores/ProveedorFormPage";
import { ProveedoresPage } from "./features/proveedores/ProveedoresPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <InicioPage /> },
      { path: "proveedores", element: <ProveedoresPage /> },
      { path: "proveedores/nuevo", element: <ProveedorFormPage /> },
      { path: "proveedores/:id/editar", element: <ProveedorFormPage /> },
      { path: "proveedores/:id", element: <ProveedorDetailPage /> },
      { path: "facturas", element: <FacturasPage /> },
      { path: "facturas/nueva", element: <FacturaFormPage /> },
      { path: "facturas/:id/editar", element: <FacturaFormPage /> },
      { path: "facturas/:id", element: <FacturaDetailPage /> },
    ],
  },
]);
