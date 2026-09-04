import { Router } from "express";
import * as controlador from "./facturas.controller";
import { autenticar, permitirRoles } from "../middlewares/auth.middleware";

const router = Router();

router.use(autenticar);

router.get("/", permitirRoles("compras", "servicios", "administracion"), controlador.listar);
router.get("/:id", permitirRoles("compras", "servicios", "administracion"), controlador.obtener);
router.post("/", permitirRoles("compras", "servicios"), controlador.crear);
router.put("/:id", permitirRoles("compras", "servicios"), controlador.editar);

export default router;
