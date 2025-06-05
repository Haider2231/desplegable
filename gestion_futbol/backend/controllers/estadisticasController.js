const pool = require("../db");

// Estadísticas para usuario (cliente)
exports.usuario = async (req, res) => {
  const userId = req.user.userId;
  try {
    // Total reservas y horas jugadas (JOIN reservas -> disponibilidades)
    const reservasRes = await pool.query(
      `SELECT COUNT(*) AS total_reservas, 
              COALESCE(SUM(EXTRACT(EPOCH FROM (d.hora_fin::time - d.hora_inicio::time))/3600),0) AS horas_jugadas
         FROM reservas r
         JOIN disponibilidades d ON r.disponibilidad_id = d.id
        WHERE r.usuario_id = $1`,
      [userId]
    );
    // Canchas más reservadas (JOIN reservas -> disponibilidades -> canchas)
    const canchasRes = await pool.query(
      `SELECT c.nombre, COUNT(*) AS reservas
         FROM reservas r
         JOIN disponibilidades d ON r.disponibilidad_id = d.id
         JOIN canchas c ON d.cancha_id = c.id
        WHERE r.usuario_id = $1
        GROUP BY c.nombre
        ORDER BY reservas DESC
        LIMIT 5`,
      [userId]
    );
    res.json({
      total_reservas: parseInt(reservasRes.rows[0].total_reservas),
      horas_jugadas: parseFloat(reservasRes.rows[0].horas_jugadas),
      canchas_mas_reservadas: canchasRes.rows.map(r => ({
        nombre: r.nombre,
        reservas: parseInt(r.reservas)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener estadísticas de usuario" });
  }
};

// Estadísticas para propietario
exports.propietario = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "No autenticado" });
    }
    const userId = req.user.userId;

    // Trae todas las canchas del propietario SOLO de establecimientos activos
    const canchasRes = await pool.query(
      `SELECT c.id, c.nombre, e.nombre AS establecimiento_nombre
         FROM canchas c
         JOIN establecimientos e ON c.establecimiento_id = e.id
        WHERE c.dueno_id = $1 AND e.estado = 'activo'`,
      [userId]
    );
    const canchaIds = canchasRes.rows.map(c => c.id);

    if (!canchaIds || canchaIds.length === 0) {
      return res.json({ total_reservas: 0, ingresos: 0, canchas: [] });
    }

    // Trae reservas y abonos (ingresos) por cancha SOLO de establecimientos activos
    const reservasDetalleRes = await pool.query(
      `SELECT 
          c.id AS cancha_id,
          c.nombre AS cancha_nombre,
          e.nombre AS establecimiento_nombre,
          COUNT(r.id) AS reservas,
          COALESCE(
            json_agg(
              json_build_object('abono', f.abono)
            ) FILTER (WHERE r.id IS NOT NULL AND f.abono IS NOT NULL),
            '[]'
          ) AS reservas_detalle
        FROM canchas c
        JOIN establecimientos e ON c.establecimiento_id = e.id
        LEFT JOIN disponibilidades d ON d.cancha_id = c.id
        LEFT JOIN reservas r ON d.id = r.disponibilidad_id
        LEFT JOIN facturas f ON f.reserva_id = r.id
        WHERE c.dueno_id = $1 AND e.estado = 'activo'
        GROUP BY c.id, c.nombre, e.nombre
        ORDER BY e.nombre, c.nombre`,
      [userId]
    );

    // Calcula totales
    let totalReservas = 0;
    let totalIngresos = 0;
    const canchas = reservasDetalleRes.rows.map(row => {
      const reservas = parseInt(row.reservas) || 0;
      let ingresos = 0;
      let reservas_detalle = [];
      try {
        reservas_detalle = Array.isArray(row.reservas_detalle)
          ? row.reservas_detalle
          : JSON.parse(row.reservas_detalle || "[]");
      } catch {
        reservas_detalle = [];
      }
      ingresos = reservas_detalle.reduce(
        (acc, r) => acc + (typeof r.abono === "number" ? r.abono : 0),
        0
      );
      totalReservas += reservas;
      totalIngresos += ingresos;
      return {
        cancha_id: row.cancha_id,
        nombre: row.cancha_nombre,
        establecimiento_nombre: row.establecimiento_nombre,
        reservas,
        ingresos,
        reservas_detalle
      };
    });

    res.json({
      total_reservas: totalReservas,
      ingresos: totalIngresos,
      canchas
    });
  } catch (err) {
    console.error("Error en estadisticas propietario:", err);
    res.status(500).json({ error: "Error al obtener estadísticas de propietario" });
  }
};

// Estadísticas para admin
exports.admin = async (req, res) => {
  try {
    // Usuarios registrados
    const usuariosRes = await pool.query(`SELECT COUNT(*) FROM usuarios WHERE verificado = true`);
    // Canchas
    const canchasRes = await pool.query(`SELECT COUNT(*) FROM canchas`);
    // Establecimientos
    const establecimientosRes = await pool.query(`SELECT COUNT(*) FROM establecimientos`);
    // Reservas totales
    const reservasRes = await pool.query(`SELECT COUNT(*) FROM reservas`);
    // Actividad por día (últimos 7 días)
    const actividadRes = await pool.query(
      `SELECT TO_CHAR(r.fecha_reserva, 'YYYY-MM-DD') AS fecha, COUNT(*) AS reservas
         FROM reservas r
        WHERE r.fecha_reserva >= NOW() - INTERVAL '7 days'
        GROUP BY fecha
        ORDER BY fecha`
    );
    res.json({
      usuarios: parseInt(usuariosRes.rows[0].count),
      canchas: parseInt(canchasRes.rows[0].count),
      establecimientos: parseInt(establecimientosRes.rows[0].count),
      reservas: parseInt(reservasRes.rows[0].count),
      actividad: actividadRes.rows.map(r => ({
        fecha: r.fecha,
        reservas: parseInt(r.reservas)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Error al obtener estadísticas de admin" });
  }
};
