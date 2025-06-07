const cron = require("node-cron");
const pool = require("../db");
const { generarHorariosEstablecimientoDias } = require("../controllers/establecimientoController");

// Ejecuta todos los días a las 2am
cron.schedule("0 2 * * *", async () => {
  // Para cada establecimiento activo
  const establecimientos = await pool.query("SELECT * FROM establecimientos WHERE estado = 'activo'");
  for (const est of establecimientos.rows) {
    // Busca la última fecha de disponibilidad generada para alguna cancha de este establecimiento
    const canchas = await pool.query("SELECT id FROM canchas WHERE establecimiento_id = $1", [est.id]);
    if (!canchas.rows.length) continue;
    const canchaIds = canchas.rows.map(c => c.id);
    const { rows: fechas } = await pool.query(
      `SELECT MAX(fecha) AS max_fecha FROM disponibilidades WHERE cancha_id = ANY($1::int[])`,
      [canchaIds]
    );
    const maxFecha = fechas[0].max_fecha;
    if (!maxFecha) continue;
    const fechaUltima = new Date(maxFecha);
    const hoy = new Date();
    const diffDias = Math.ceil((fechaUltima - hoy) / (1000 * 60 * 60 * 24));
    // Si faltan menos de 1 día para quedarse sin horarios, genera otros 15 días
    if (diffDias < 1) {
      await generarHorariosEstablecimientoDias(est.id, 15);
      console.log(`Horarios generados para establecimiento ${est.id} (${est.nombre}) hasta ${fechaUltima.toISOString().slice(0,10)}`);
    }
  }
  console.log("Cron: Horarios futuros generados automáticamente si era necesario");
});
