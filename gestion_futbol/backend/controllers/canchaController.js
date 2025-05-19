const pool = require("../db");

// Obtener todas las canchas
exports.getCanchas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id AS cancha_id, 
             c.nombre, 
             c.direccion, 
             c.lat, 
             c.lng, 
             c.dueno_id, 
             c.telefono_contacto,
             json_agg(CONCAT('http://localhost:5000', ci.url)) AS imagenes
      FROM canchas c
      LEFT JOIN cancha_imagenes ci ON c.id = ci.cancha_id
      GROUP BY c.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener canchas:", error);
    res.status(500).json({ error: "Error al obtener canchas" });
  }
};

// Registrar una nueva cancha
exports.createCancha = async (req, res) => {
  const { nombre, direccion, lat, lng, dueno_id, telefono_contacto } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO canchas (nombre, direccion, lat, lng, dueno_id, telefono_contacto) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nombre, direccion, lat, lng, dueno_id, telefono_contacto]
    );
    const cancha = result.rows[0];

    // Guardar imágenes si existen
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const archivo = req.files[i];
        const url = `/uploads/${archivo.filename}`;
        await pool.query(
          `INSERT INTO cancha_imagenes (cancha_id, url, orden) VALUES ($1, $2, $3)`,
          [cancha.id, url, i]
        );
      }
    }

    res.status(201).json({ mensaje: "Cancha registrada con éxito", cancha });
  } catch (error) {
    console.error("Error al registrar la cancha:", error);
    res.status(500).json({ error: "Error al registrar la cancha" });
  }
};
