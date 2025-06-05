const pool = require("../db");
const path = require("path");
// Crear un establecimiento (soporta multipart/form-data)

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
    let imagenes_urls = [];
    // Permite varias imágenes (soporta tanto 'imagenes' como 'imagen' por compatibilidad)
    if (req.files && req.files.imagenes && req.files.imagenes.length > 0) {
      imagenes_urls = req.files.imagenes.map(img => `/uploads/${img.filename}`);
      console.log("Imágenes subidas:", imagenes_urls);
    } else if (req.files && req.files.imagen && req.files.imagen.length > 0) {
      // Soporta el caso legacy de un solo campo 'imagen'
      imagenes_urls = req.files.imagen.map(img => `/uploads/${img.filename}`);
      console.log("Imagen subida (legacy):", imagenes_urls);
    } else {
      console.log("No se recibieron imágenes en el request");
    }
    // Validación robusta (acepta 0 como precio, lat, lng válidos)
    if (
      !nombre ||
      !direccion ||
      !dueno_id ||
      !telefono ||
      (precio === undefined || precio === null || precio === "") ||
      lat === undefined || lat === null || lat === "" ||
      lng === undefined || lng === null || lng === ""
    ) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }
    // Fuerza el estado a 'pendiente' al crear
    const result = await pool.query(
      `INSERT INTO establecimientos (nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagen_url, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente') RETURNING *`,
      [nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagenes_urls[0] || null]
    );
    const establecimiento = result.rows[0];

    // SOLO crear canchas aquí, NO en el frontend
    for (let i = 0; i < cantidad_canchas; i++) {
      const canchaRes = await pool.query(
        `INSERT INTO canchas (establecimiento_id, nombre, dueno_id) VALUES ($1, $2, $3) RETURNING id`,
        [establecimiento.id, `Cancha ${i + 1}`, dueno_id]
      );
      const canchaId = canchaRes.rows[0].id;
      // Asocia todas las imágenes subidas a la cancha
      for (let j = 0; j < imagenes_urls.length; j++) {
        const img_url = imagenes_urls[j];
        const imgExists = await pool.query(
          `SELECT 1 FROM cancha_imagenes WHERE cancha_id = $1 AND url = $2`,
          [canchaId, img_url]
        );
        if (imgExists.rowCount === 0) {
          await pool.query(
            `INSERT INTO cancha_imagenes (cancha_id, url, orden) VALUES ($1, $2, $3)`,
            [canchaId, img_url, j]
          );
        }
      }
    }

    // Guardar documentos si existen (varios)
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
