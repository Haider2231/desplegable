const express = require("express");
const router = express.Router();
const reservaController = require("../controllers/reservaController");
const { verificarToken } = require("../middlewares/authMiddleware");

// SOLO UNA RUTA POR VERBO Y PATH
router.post("/", verificarToken, reservaController.createReservaConFactura);

// ⚠️ Si NO tienes la función getReservasByUsuario exportada como función, comenta o elimina la siguiente línea:
// router.get("/:usuario_id", verificarToken, reservaController.getReservasByUsuario);

// AGREGA ESTA RUTA PARA EL HISTORIAL Y PAGOS PENDIENTES DEL USUARIO AUTENTICADO
router.get("/mis-reservas", verificarToken, reservaController.getReservasByUsuario);

router.delete("/:reserva_id", verificarToken, reservaController.cancelReserva);
router.get("/cancha/:cancha_id", verificarToken, reservaController.getReservasByCancha);
// Historial de abonos y pagos del usuario autenticado
router.get("/historial-abonos", verificarToken, reservaController.getHistorialAbonos);

// Historial de abonos y pagos del propietario (todas sus canchas)
router.get("/historial-abonos-propietario", verificarToken, reservaController.getHistorialAbonosPropietario);

router.post("/:reserva_id/pagar-saldo", verificarToken, reservaController.pagarSaldoReserva);

router.post("/:reserva_id/cancelar", verificarToken, reservaController.cancelReserva);
// router.get("/mis-reservas", verificarToken, reservaController.getMisReservas);

module.exports = router;
