const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reservaController");
const { verificarToken } = require("../middlewares/authMiddleware");

router.post("/", verificarToken, reservaController.createReserva);
router.get("/:usuario_id", verificarToken, reservaController.getReservasByUsuario);
router.delete("/:reserva_id", verificarToken, reservaController.cancelReserva);
router.get("/cancha/:cancha_id", verificarToken, reservaController.getReservasByCancha);

module.exports = router;
