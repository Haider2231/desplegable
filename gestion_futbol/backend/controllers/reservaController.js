const pool = require("../db");
const nodemailer = require("nodemailer");
const facturaController = require("./facturaController");

// Función para enviar correo al propietario
async function enviarCorreoPropietario({ propietarioEmail, establecimiento, cancha, fecha, hora_inicio, hora_fin, abono, restante, usuario }) {
  // Configura tu transporter (ajusta según tu proveedor SMTP)
  const transporter = nodemailer.createTransport({
    service: "gmail", // o tu proveedor
    auth: {
      user: "trasmileniopruebas@gmail.com", // tu correo
      pass: "nhbrvpeyyljakcze", // tu contraseña o app password
    },
  });

  const mailOptions = {
    from: '"Fútbol Piloto" <trasmileniopruebas@gmail.com>', // <-- corregido aquí
    to: propietarioEmail,
    subject: "Nueva reserva en tu establecimiento",
    html: `
      <h2>¡Nueva reserva realizada!</h2>
      <p><b>Establecimiento:</b> ${establecimiento.nombre}</p>
      <p><b>Cancha:</b> ${cancha.nombre}</p>
      <p><b>Fecha:</b> ${fecha}</p>
      <p><b>Hora:</b> ${hora_inicio} - ${hora_fin}</p>
      <p><b>Reservado por:</b> ${usuario.nombre} (${usuario.email})</p>
      <p><b>Abono pagado:</b> $${abono}</p>
      <p><b>Restante por pagar:</b> $${restante}</p>
      <hr>
      <p>Revisa tu panel para más detalles.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err) {
    return { success: false, error: err && err.message ? err.message : err };
  }
}

// Crear una reserva
exports.createReserva = async (req, res) => {
  const { disponibilidad_id, con_factura, abono, monto_total } = req.body;
  const usuario_id = req.user.userId;
  if (con_factura) {
    // Si viene de pago, usa la lógica de reserva con factura
    return exports.createReservaConFactura(req, res);
  }
  try {
    await pool.query("BEGIN");
    const result = await pool.query(
      `INSERT INTO reservas (usuario_id, disponibilidad_id, fecha_reserva)
       VALUES ($1, $2, NOW()) RETURNING id`,
      [usuario_id, disponibilidad_id]
    );
    await pool.query(
      "UPDATE disponibilidades SET disponible = false WHERE id = $1",
      [disponibilidad_id]
    );
    await pool.query("COMMIT");

    // --- Enviar correo al propietario ---
    let correoResult = { success: true };
    try {
      // Obtener datos de la reserva, cancha, establecimiento y propietario
      const reservaId = result.rows[0].id;
      const reservaInfo = await pool.query(
        `SELECT r.id, d.fecha, d.hora_inicio, d.hora_fin, c.nombre AS cancha_nombre, e.nombre AS establecimiento_nombre, e.dueno_id
         FROM reservas r
         JOIN disponibilidades d ON r.disponibilidad_id = d.id
         JOIN canchas c ON d.cancha_id = c.id
         JOIN establecimientos e ON c.establecimiento_id = e.id
         WHERE r.id = $1`,
        [reservaId]
      );
      const r = reservaInfo.rows[0];

      // Obtener email y nombre del propietario
      const propietario = await pool.query(
        `SELECT email, nombre FROM usuarios WHERE id = $1`,
        [r.dueno_id]
      );
      const propietarioEmail = propietario.rows[0]?.email;

      // Obtener datos del usuario que reservó
      const usuario = await pool.query(
        `SELECT nombre, email FROM usuarios WHERE id = $1`,
        [usuario_id]
      );

      // Como no hay factura ni abono en este flujo, solo notifica la reserva
      if (propietarioEmail) {
        correoResult = await enviarCorreoPropietario({
          propietarioEmail,
          establecimiento: { nombre: r.establecimiento_nombre },
          cancha: { nombre: r.cancha_nombre },
          fecha: r.fecha,
          hora_inicio: r.hora_inicio,
          hora_fin: r.hora_fin,
          abono: abono || "No aplica",
          restante: monto_total || "No aplica",
          usuario: usuario.rows[0]
        });
      }
    } catch (correoErr) {
      correoResult = { success: false, error: correoErr && correoErr.message ? correoErr.message : correoErr };
    }
    // --- Fin correo propietario ---

    res.status(201).json({
      message: "Reserva creada exitosamente",
      reserva_id: result.rows[0].id,
      correo: correoResult // <-- aquí puedes ver el resultado del correo en el frontend
    });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al crear la reserva:", error, error.stack);
    res.status(500).json({ error: "Error al crear la reserva", detalle: error.message });
  }
};

// Obtener reservas por usuario
exports.getReservasByUsuario = async (req, res) => {
  const { usuario_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.id AS reserva_id, r.fecha_reserva, 
              d.fecha, d.hora_inicio, d.hora_fin, 
              e.nombre AS establecimiento_nombre, c.nombre AS cancha_nombre, 
              f.abono, f.restante
       FROM reservas r
       JOIN disponibilidades d ON r.disponibilidad_id = d.id
       JOIN canchas c ON d.cancha_id = c.id
       JOIN establecimientos e ON c.establecimiento_id = e.id
       JOIN facturas f ON f.reserva_id = r.id -- solo reservas con factura
       WHERE r.usuario_id = $1
       ORDER BY d.fecha DESC, d.hora_inicio DESC`,
      [usuario_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No tienes reservas." });
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las reservas" });
  }
};

// Cancelar una reserva
exports.cancelReserva = async (req, res) => {
  const { reserva_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const reservaResult = await client.query(
      "SELECT * FROM reservas WHERE id = $1",
      [reserva_id]
    );
    if (reservaResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Reserva no encontrada" });
    }
    const disponibilidad_id = reservaResult.rows[0].disponibilidad_id;
    await client.query("DELETE FROM reservas WHERE id = $1", [reserva_id]);
    await client.query(
      "UPDATE disponibilidades SET disponible = true WHERE id = $1",
      [disponibilidad_id]
    );
    await client.query("COMMIT");
    res.status(200).json({ message: "Reserva cancelada exitosamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al cancelar la reserva:", error);
    res.status(500).json({ error: "Error al cancelar la reserva" });
  } finally {
    client.release();
  }
};

// Obtener reservas por cancha
exports.getReservasByCancha = async (req, res) => {
  const { cancha_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.id, d.fecha, d.hora_inicio, d.hora_fin
       FROM reservas r
       JOIN disponibilidades d ON r.disponibilidad_id = d.id
       WHERE d.cancha_id = $1`,
      [cancha_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener las reservas de la cancha:", error);
    res.status(500).json({ error: "Error al obtener las reservas de la cancha" });
  }
};

// Crear reserva y generar factura
exports.createReservaConFactura = async (req, res) => {
  const { disponibilidad_id, abono } = req.body;
  const usuario_id = req.user?.userId || null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Bloquea la fila de la disponibilidad para evitar doble reserva
    const disponibilidadCheck = await client.query(
      `SELECT d.*, e.precio, c.nombre AS cancha_nombre, e.direccion, c.id AS cancha_id, c.establecimiento_id, e.nombre AS establecimiento_nombre, e.dueno_id
       FROM disponibilidades d
       JOIN canchas c ON d.cancha_id = c.id
       JOIN establecimientos e ON c.establecimiento_id = e.id
       WHERE d.id = $1 AND d.disponible = true
       FOR UPDATE`,
      [disponibilidad_id]
    );
    if (disponibilidadCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "¡Este horario ya fue reservado por otro usuario! Por favor selecciona otro horario disponible." });
    }
    const disp = disponibilidadCheck.rows[0];
    // Validar que el precio exista y sea un número válido
    if (!disp.precio || isNaN(disp.precio)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "La cancha no tiene un precio válido configurado." });
    }
    // Validar que existan todos los datos requeridos para la factura
    if (
      !disp.cancha_nombre ||
      !disp.direccion ||
      !disp.fecha ||
      !disp.hora_inicio ||
      !disp.hora_fin ||
      !disp.cancha_id
    ) {
      await client.query("ROLLBACK");
      return res.status(500).json({ error: "Faltan datos requeridos para la factura. Contacta al administrador." });
    }
    const precio = parseInt(disp.precio, 10);
    const abonoReal = abono || precio;
    const restante = precio - abonoReal;

    // Crear la reserva
    const reservaResult = await client.query(
      `INSERT INTO reservas (usuario_id, disponibilidad_id, fecha_reserva)
       VALUES ($1, $2, NOW()) RETURNING id, usuario_id, disponibilidad_id, fecha_reserva`,
      [usuario_id, disponibilidad_id]
    );
    const reserva = reservaResult.rows[0];

    // Lógica para crear la factura y generar el PDF
    let factura;
    try {
      factura = await facturaController.crearFacturaYGenerarPDF({
        reservaId: reserva.id,
        usuarioId: reserva.usuario_id,
        precio,
        abono: abonoReal,
        fecha_reserva: reserva.fecha_reserva,
        cancha_nombre: disp.cancha_nombre,
        direccion: disp.direccion,
        fecha: disp.fecha,
        hora_inicio: disp.hora_inicio,
        hora_fin: disp.hora_fin,
        cancha_id: disp.cancha_id,
        client // <-- importante para la transacción
      });
    } catch (err) {
      await client.query("DELETE FROM reservas WHERE id = $1", [reserva.id]);
      await client.query("UPDATE disponibilidades SET disponible = true WHERE id = $1", [disponibilidad_id]);
      await client.query("ROLLBACK");
      console.error("Error al generar la factura PDF:", err);
      return res.status(500).json({ error: "No se pudo generar la factura PDF", detalle: err.message });
    }

    // Marcar la disponibilidad como no disponible SOLO después de que la factura se haya creado correctamente
    await client.query(
      "UPDATE disponibilidades SET disponible = false WHERE id = $1",
      [disponibilidad_id]
    );

    await client.query("COMMIT");

    // --- Enviar correo al propietario ---
    try {
      const propietario = await pool.query(
        `SELECT email, nombre FROM usuarios WHERE id = $1`,
        [disp.dueno_id]
      );
      const propietarioEmail = propietario.rows[0]?.email;
      const usuario = await pool.query(
        `SELECT nombre, email FROM usuarios WHERE id = $1`,
        [usuario_id]
      );
      if (propietarioEmail) {
        await enviarCorreoPropietario({
          propietarioEmail,
          establecimiento: { nombre: disp.establecimiento_nombre },
          cancha: { nombre: disp.cancha_nombre },
          fecha: disp.fecha,
          hora_inicio: disp.hora_inicio,
          hora_fin: disp.hora_fin,
          abono: abonoReal,
          restante,
          usuario: usuario.rows[0]
        });
      }
    } catch (correoErr) {
      console.error("Error enviando correo al propietario:", correoErr);
    }
    // --- Fin correo propietario ---

    // 2. Obtén el email del usuario
    const userResult = await pool.query("SELECT email FROM usuarios WHERE id = $1", [usuario_id]);
    const userEmail = userResult.rows[0]?.email;

    // 3. Envía la factura por correo automáticamente
    if (userEmail) {
      // Extrae el id de la factura del URL de forma segura
      let facturaId = null;
      const match = factura.factura_url && factura.factura_url.match(/factura_(\d+)\.pdf/);
      if (match && match[1]) {
        facturaId = match[1];
        try {
          await facturaController.enviarFacturaPorCorreo(
            facturaId,
            userEmail
          );
        } catch (correoFacturaErr) {
          console.error("Error enviando la factura por correo al usuario:", correoFacturaErr);
        }
      } else {
        console.error("No se pudo extraer el id de la factura para enviar por correo al usuario.");
      }
    } else {
      console.error("No se encontró el email del usuario para enviar la factura.");
    }

    res.json({
      ...reserva,
      factura_url: factura.factura_url,
      abono: abonoReal,
      monto: precio,
      restante,
      fecha: disp.fecha, // <-- para mostrar en la página de éxito
      hora_fin: disp.hora_fin
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear la reserva:", error, error.stack);
    res.status(500).json({ error: "Error al crear la reserva", detalle: error.message, stack: error.stack });
  } finally {
    client.release();
  }
};
