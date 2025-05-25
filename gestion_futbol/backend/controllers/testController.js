const pool = require("../db");

module.exports = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ mensaje: "Conexión exitosa con la base de datos.", hora_actual: result.rows[0] });
  } catch (err) {
    res.status(500).json({ mensaje: "No se pudo conectar con la base de datos. Intenta nuevamente." });
  }
};
