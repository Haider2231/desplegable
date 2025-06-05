const express = require("express");
const router = express.Router();
const establecimientoController = require("../controllers/establecimientoController");
const canchaController = require("../controllers/canchaController");
const { verificarToken, verificarRol } = require("../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Asegúrate de que la carpeta uploads existe
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configura multer para imagen de establecimiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });
// POST: Crear establecimiento (soporta imagen y documentos)
router.post(
  "/",
  verificarToken,
  verificarRol(["usuario", "propietario", "admin"]),
  upload.fields([
    { name: "imagen", maxCount: 1 },
    { name: "documentos", maxCount: 10 }
  ]),
  establecimientoController.createEstablecimiento
);

// GET: Documentos de establecimiento
router.get("/documentos/:establecimiento_id", async (req, res) => {
  const pool = require("../db");
  const establecimiento_id = req.params.establecimiento_id;
  try {
    const result = await pool.query(
      "SELECT id, url, tipo FROM documentos_establecimiento WHERE establecimiento_id = $1",
      [establecimiento_id]
    );
    const docs = result.rows.map(doc => ({
      ...doc,
      url: doc.url.startsWith("http")
        ? doc.url
        : `${process.env.BACKEND_URL || "https://canchassinteticas.site"}${doc.url}`
    }));
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener documentos" });
  }
});

// GET: Establecimientos pendientes (validador)
router.get("/pendientes", verificarToken, verificarRol(["validador"]), async (req, res) => {
  const pool = require("../db");
  try {
    const result = await pool.query(
      "SELECT * FROM establecimientos WHERE estado = 'pendiente'"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener establecimientos pendientes" });
  }
});

// POST: Validar establecimiento (validador)
router.post("/:establecimiento_id/validar", verificarToken, verificarRol(["validador"]), async (req, res) => {
  const pool = require("../db");
  const { establecimiento_id } = req.params;
  const { aprobar, motivo } = req.body;
  try {
    if (aprobar) {
      await pool.query(
        "UPDATE establecimientos SET estado = 'activo', motivo_rechazo = NULL WHERE id = $1",
        [establecimiento_id]
      );
      // Cambia el rol del usuario a propietario
      const est = await pool.query("SELECT dueno_id, nombre FROM establecimientos WHERE id = $1", [establecimiento_id]);
      if (est.rows.length > 0) {
        await pool.query("UPDATE usuarios SET rol = 'propietario' WHERE id = $1", [est.rows[0].dueno_id]);
        // Enviar correo de aprobación
        const dueno = await pool.query("SELECT email, nombre FROM usuarios WHERE id = $1", [est.rows[0].dueno_id]);
        if (dueno.rows.length > 0) {
          const nodemailer = require("nodemailer");
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER || "diazmontejodiegoalejandro@gmail.com",
              pass: process.env.EMAIL_PASS || "mpcnakbsmmhalwak",
            },
          });
          await transporter.sendMail({
            from: process.env.EMAIL_USER || "diazmontejodiegoalejandro@gmail.com",
            to: dueno.rows[0].email,
            subject: "¡Establecimiento aprobado!",
            html: `<h2>¡Tu establecimiento <b>${est.rows[0].nombre}</b> ha sido aprobado!</h2>
                   <p>Ya puedes gestionar tus canchas y horarios desde el panel de gestión.</p>
                   <p>Si tienes alguna duda, contáctanos a través de la plataforma o por correo.</p>
                   <hr>
                   <p>¡Gracias por confiar en Fútbol Piloto!</p>`
          });
        }
      }
    } else {
      // Asegúrate de que la columna motivo_rechazo exista en la tabla establecimientos
      await pool.query(
        "UPDATE establecimientos SET estado = 'rechazado', motivo_rechazo = $1 WHERE id = $2",
        [motivo, establecimiento_id]
      );
      // Enviar correo al dueño con el motivo de rechazo
      const est = await pool.query("SELECT dueno_id, nombre FROM establecimientos WHERE id = $1", [establecimiento_id]);
      if (est.rows.length > 0) {
        const dueno = await pool.query("SELECT email, nombre FROM usuarios WHERE id = $1", [est.rows[0].dueno_id]);
        if (dueno.rows.length > 0) {
          const nodemailer = require("nodemailer");
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER || "diazmontejodiegoalejandro@gmail.com",
              pass: process.env.EMAIL_PASS || "mpcnakbsmmhalwak",
            },
          });
          await transporter.sendMail({
            from: process.env.EMAIL_USER || "diazmontejodiegoalejandro@gmail.com",
            to: dueno.rows[0].email,
            subject: "Solicitud de establecimiento rechazada",
            html: `<h2>Tu solicitud para el establecimiento <b>${est.rows[0].nombre}</b> fue rechazada.</h2>
                   <p><b>Motivo:</b> ${motivo}</p>
                   <p>Puedes corregir los datos y volver a intentarlo.</p>`
          });
        }
      }
    }
    res.json({ message: "Validación realizada" });
  } catch (err) {
    console.error("Error al validar el establecimiento:", err);
    res.status(500).json({ error: "Error al validar el establecimiento" });
  }
});

// POST: Reenviar solicitud de establecimiento (actualiza datos y documentos, pone estado en 'pendiente')
router.post("/:establecimiento_id/reenviar", verificarToken, upload.fields([
  { name: "imagen", maxCount: 1 },
  { name: "documentos", maxCount: 10 }
]), async (req, res) => {
  const pool = require("../db");
  const { establecimiento_id } = req.params;
  try {
    let imagen_url = null;
    if (req.files && req.files.imagen && req.files.imagen[0]) {
      imagen_url = `/uploads/${req.files.imagen[0].filename}`;
    }
    await pool.query(
      `UPDATE establecimientos SET
        nombre = $1,
        direccion = $2,
        telefono = $3,
        precio = $4,
        cantidad_canchas = $5,
        imagen_url = COALESCE($6, imagen_url),
        estado = 'pendiente',
        motivo_rechazo = NULL
      WHERE id = $7`,
      [
        req.body.nombre,
        req.body.direccion,
        req.body.telefono,
        req.body.precio,
        req.body.cantidad_canchas,
        imagen_url,
        establecimiento_id
      ]
    );
    if (req.files && req.files.documentos && req.files.documentos.length > 0) {
      await pool.query("DELETE FROM documentos_establecimiento WHERE establecimiento_id = $1", [establecimiento_id]);
      for (let i = 0; i < req.files.documentos.length; i++) {
        const archivo = req.files.documentos[i];
        const url = `/uploads/${archivo.filename}`;
        await pool.query(
          `INSERT INTO documentos_establecimiento (establecimiento_id, url, tipo) VALUES ($1, $2, $3)`,
          [establecimiento_id, url, archivo.mimetype]
        );
      }
    }
    res.json({ message: "Solicitud reenviada para revisión" });
  } catch (err) {
    console.error("Error al reenviar la solicitud:", err);
    res.status(500).json({ error: "Error al reenviar la solicitud" });
  }
});

// GET: Establecimientos por dueño
router.get("/dueno/:dueno_id", verificarToken, establecimientoController.getEstablecimientosByDueno);

// GET: Lista todos los establecimientos (para el mapa)
router.get("/", establecimientoController.getAllEstablecimientos);

// GET: Lista las canchas de un establecimiento
router.get("/:id/canchas", canchaController.getCanchasByEstablecimiento);

// NUEVO: Lista las canchas de un establecimiento CON sus horarios
router.get("/:id/canchas-con-horarios", canchaController.getCanchasConHorariosByEstablecimiento);

module.exports = router;
