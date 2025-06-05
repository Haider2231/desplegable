const express = require("express");
const router = express.Router();
const disponibilidadController = require("../controllers/disponibilidadController");

// POST: agregar disponibilidad
router.post("/", disponibilidadController.addDisponibilidad);

// GET: obtener disponibilidades por cancha
router.get("/cancha/:cancha_id", disponibilidadController.getDisponibilidadesByCancha);

// POST: agregar disponibilidades en batch
router.post("/batch", disponibilidadController.addDisponibilidadesBatch);


// DELETE: eliminar disponibilidad por ID
router.delete("/:id", disponibilidadController.deleteDisponibilidad);   

module.exports = router;
