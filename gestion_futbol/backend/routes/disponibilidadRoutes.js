const express = require("express");
const router = express.Router();
const disponibilidadController = require("../controllers/disponibilidadController");

router.post("/", disponibilidadController.addDisponibilidad);
router.get("/cancha/:cancha_id", disponibilidadController.getDisponibilidadesByCancha);

module.exports = router;
