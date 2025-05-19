const express = require("express");
const router = express.Router();
const estadisticasController = require("../controllers/estadisticasController");
const { verificarToken } = require("../middlewares/authMiddleware");

router.get("/usuario", verificarToken, estadisticasController.usuario);
router.get("/propietario", verificarToken, estadisticasController.propietario);
router.get("/admin", verificarToken, estadisticasController.admin);

module.exports = router;
