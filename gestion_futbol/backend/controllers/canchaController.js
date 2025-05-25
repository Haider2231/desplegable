const pool = require("../db");

// Obtener canchas de un establecimiento o por dueño
exports.getCanchas = async (req, res) => {
  try {
    const { establecimiento_id, dueno_id } = req.query;
    let result;
    if (establecimiento_id) {
      result = await pool.query(
        `SELECT c.id AS cancha_id, c.establecimiento_id, c.nombre, c.dueno_id,
                json_agg(CONCAT('https://canchassinteticas', ci.url)) AS imagenes
         FROM canchas c
         LEFT JOIN cancha_imagenes ci ON c.id = ci.cancha_id
         WHERE c.establecimiento_id = $1
         GROUP BY c.id`,
        [establecimiento_id]
      );
    } else if (dueno_id) {
      result = await pool.query(
        `SELECT c.id AS cancha_id, c.establecimiento_id, c.nombre, c.dueno_id,
                json_agg(CONCAT('https://canchassinteticas', ci.url)) AS imagenes
         FROM canchas c
         LEFT JOIN cancha_imagenes ci ON c.id = ci.cancha_id
         WHERE c.dueno_id = $1
         GROUP BY c.id`,
        [dueno_id]
      );
    } else {
      result = await pool.query(
        `SELECT c.id AS cancha_id, c.establecimiento_id, c.nombre, c.dueno_id,
                json_agg(CONCAT('https://canchassinteticas', ci.url)) AS imagenes
         FROM canchas c
         LEFT JOIN cancha_imagenes ci ON c.id = ci.cancha_id
         GROUP BY c.id`
      );
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las canchas" });
  }
};

// Registrar una nueva cancha asociada a un establecimiento
exports.createCancha = async (req, res) => {
  const { establecimiento_id, nombre } = req.body;
  try {
    // Usa el nombre recibido o uno por defecto
    const nombreCancha = nombre && nombre.trim() ? nombre : "Cancha";
    const result = await pool.query(
      `INSERT INTO canchas (establecimiento_id, nombre) VALUES ($1, $2) RETURNING *`,
      [establecimiento_id, nombreCancha]
    );
    const cancha = result.rows[0];

    // Guardar imágenes si existen
    if (req.files && req.files.length > 0) {
      const canchaId = cancha.cancha_id || cancha.id;
      for (let i = 0; i < req.files.length; i++) {
        const archivo = req.files[i];
        const url = `/uploads/${archivo.filename}`;
        try {
          await pool.query(
            `INSERT INTO cancha_imagenes (cancha_id, url, orden) VALUES ($1, $2, $3)`,
            [canchaId, url, i]
          );
        } catch (imgErr) {
          console.error("Error al guardar imagen de cancha:", imgErr);
        }
      }
    }

    res.status(201).json({ mensaje: "Cancha registrada con éxito", cancha });
  } catch (error) {
    console.error("Error al registrar la cancha:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error al registrar la cancha", detalle: error.message });
    }
  }
};

// GET /establecimientos/:id/canchas
exports.getCanchasByEstablecimiento = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.id AS cancha_id, c.establecimiento_id,
              json_agg(CONCAT('https://canchassinteticas', ci.url)) AS imagenes
       FROM canchas c
       LEFT JOIN cancha_imagenes ci ON c.id = ci.cancha_id
       WHERE c.establecimiento_id = $1
       GROUP BY c.id`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener canchas del establecimiento" });
  }
};

// GET /canchas/:id/disponibilidad
exports.getDisponibilidadByCancha = async (req, res) => {
  const { id } = req.params;
  try {
    // Trae la disponibilidad y el precio del establecimiento asociado
    const result = await pool.query(
      `SELECT d.*, e.precio
       FROM disponibilidades d
       JOIN canchas c ON d.cancha_id = c.id
       JOIN establecimientos e ON c.establecimiento_id = e.id
       WHERE d.cancha_id = $1`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener disponibilidad de la cancha" });
  }
};

// GET /establecimientos/:id/canchas-con-horarios
exports.getCanchasConHorariosByEstablecimiento = async (req, res) => {
  const { id } = req.params;
  try {
    // Trae canchas y el precio del establecimiento
    const canchasRes = await pool.query(
      `SELECT c.id AS cancha_id, c.establecimiento_id, c.nombre, e.precio
       FROM canchas c
       JOIN establecimientos e ON c.establecimiento_id = e.id
       WHERE c.establecimiento_id = $1`,
      [id]
    );
    const canchas = canchasRes.rows;
    // Trae horarios de todas las canchas de ese establecimiento
    const horariosRes = await pool.query(
      `SELECT d.*, d.cancha_id
       FROM disponibilidades d
       WHERE d.cancha_id = ANY($1::int[])`,
      [canchas.map(c => c.cancha_id)]
    );
    // Asocia horarios a cada cancha
    const horariosPorCancha = {};
    horariosRes.rows.forEach(h => {
      if (!horariosPorCancha[h.cancha_id]) horariosPorCancha[h.cancha_id] = [];
      horariosPorCancha[h.cancha_id].push(h);
    });
    const resultado = canchas.map(c => ({
      ...c,
      horarios: horariosPorCancha[c.cancha_id] || []
    }));
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener canchas y horarios" });
  }
};
