// src/auth/auth.routes.ts
import { Router } from "express";
import * as controlador from "./auth.controller";
import { autenticar } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", controlador.login);
router.get("/me", autenticar, controlador.me);

// TODO (ficha 8.8, Javier): POST /auth/otp/solicitar — HU-29.

export default router;