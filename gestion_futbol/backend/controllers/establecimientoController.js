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
    // Cambia req.file a req.files?.imagen[0] para multer.fields
    if (req.files && req.files.imagen && req.files.imagen[0]) {
      imagen_url = `/uploads/${req.files.imagen[0].filename}`;
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
      `INSERT INTO establecimientos (nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagen_url, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente') RETURNING *`,
      [nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagen_url]
    );
    const establecimiento = result.rows[0];

    // SOLO crear canchas aquí, NO en el frontend
    for (let i = 0; i < cantidad_canchas; i++) {
      // Al crear la cancha, asigna la imagen_url del establecimiento como imagen principal de la cancha
      await pool.query(
        `INSERT INTO canchas (establecimiento_id, nombre, dueno_id) VALUES ($1, $2, $3) RETURNING id`,
        [establecimiento.id, `Cancha ${i + 1}`, dueno_id]
      ).then(async (canchaRes) => {
        const canchaId = canchaRes.rows[0].id;
        if (imagen_url) {
          // Guarda la imagen en cancha_imagenes para que se muestre en el mapa
          await pool.query(
            `INSERT INTO cancha_imagenes (cancha_id, url, orden) VALUES ($1, $2, 0)`,
            [canchaId, imagen_url]
          );
        }
      });
    }

    // Guardar documentos si existen (req.files.documentos)
    if (req.files && req.files.documentos) {
      for (let i = 0; i < req.files.documentos.length; i++) {
        const archivo = req.files.documentos[i];
        const url = `/uploads/${archivo.filename}`;
        await pool.query(
          `INSERT INTO documentos_establecimiento (establecimiento_id, url, tipo) VALUES ($1, $2, $3)`,
          [establecimiento.id, url, archivo.mimetype]
        );
      }
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
