const pool = require("../db");
const path = require("path");

// Crear un establecimiento (soporta multipart/form-data)
exports.createEstablecimiento = async (req, res) => {
  try {
    // Los campos pueden venir como string (de FormData)
    const nombre = req.body.nombre;
    const direccion = req.body.direccion;
    const dueno_id = req.body.dueno_id;
    const telefono = req.body.telefono;
    const precio = req.body.precio;
    const lat = req.body.lat;
    const lng = req.body.lng;
    const cantidad_canchas = parseInt(req.body.cantidad_canchas, 10) || 0;
    let imagen_url = null;
    if (req.file) {
      imagen_url = `/uploads/${req.file.filename}`;
    }
    // Validación robusta (acepta 0 como precio válido)
    if (
      !nombre ||
      !direccion ||
      !dueno_id ||
      !telefono ||
      (precio === undefined || precio === null || precio === "") ||
      !lat ||
      !lng
    ) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    const result = await pool.query(
      `INSERT INTO establecimientos (nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagen_url]
    );
    const establecimiento = result.rows[0];

    // SOLO crear canchas aquí, NO en el frontend
    for (let i = 0; i < cantidad_canchas; i++) {
      await pool.query(
        `INSERT INTO canchas (establecimiento_id, nombre, dueno_id) VALUES ($1, $2, $3)`,
        [establecimiento.id, `Cancha ${i + 1}`, dueno_id]
      );
    }

    res.status(201).json(establecimiento);
  } catch (error) {
    console.error("Error al crear establecimiento:", error);
    res.status(500).json({ error: "Error al crear establecimiento" });
  }
};

// Obtener establecimientos por dueño
exports.getEstablecimientosByDueno = async (req, res) => {
  const { dueno_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM establecimientos WHERE dueno_id = $1`,
      [dueno_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener establecimientos" });
  }
};

// Obtener todos los establecimientos (para el mapa)
exports.getAllEstablecimientos = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM establecimientos");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener establecimientos" });
  }
};
