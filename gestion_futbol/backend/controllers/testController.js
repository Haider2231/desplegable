const pool = require("../db");

module.exports = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Error en la base de datos");
  }
};
