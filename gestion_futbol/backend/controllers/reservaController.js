const pool = require("../db");
const nodemailer = require("nodemailer");
const facturaController = require("./facturaController");

// Función para enviar correo al propietario
async function enviarCorreoPropietario({ propietarioEmail, establecimiento, cancha, fecha, hora_inicio, hora_fin, abono, restante, usuario }) {
  // Configura tu transporter (ajusta según tu proveedor SMTP)
  const transporter = nodemailer.createTransport({
    service: "gmail", // o tu proveedor
    auth: {
      user: process.env.EMAIL_USER, // tu correo
      pass: process.env.EMAIL_PASS, // tu contraseña o app password
    },
  });

  const mailOptions = {
    from: `"Fútbol Piloto" <${process.env.EMAIL_USER}>`,
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

  await transporter.sendMail(mailOptions);
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
        await enviarCorreoPropietario({
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
      // No detiene la reserva si falla el correo, solo loguea
      console.error("Error enviando correo al propietario:", correoErr);
    }
    // --- Fin correo propietario ---

    res.status(201).json({ message: "Reserva creada exitosamente", reserva_id: result.rows[0].id });
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error al crear la reserva:", error, error.stack);
    res.status(500).json({ error: "Error al crear la reserva", detalle: error.message });
  }
};

// Obtener reservas del usuario autenticado (para historial, pagos pendientes, pagos completados)
exports.getReservasByUsuario = async (req, res) => {
  const usuario_id = req.user?.userId;
  try {
    const result = await pool.query(
      `SELECT r.id, r.fecha_reserva, r.estado, 
              d.fecha, d.hora_inicio, d.hora_fin, 
              c.nombre AS cancha_nombre, 
              e.nombre AS establecimiento_nombre,  -- <--- AGREGA ESTA LINEA
              f.abono, f.restante
       FROM reservas r
       JOIN disponibilidades d ON r.disponibilidad_id = d.id
       JOIN canchas c ON d.cancha_id = c.id
       JOIN establecimientos e ON c.establecimiento_id = e.id  -- <--- AGREGA ESTE JOIN
       LEFT JOIN facturas f ON f.reserva_id = r.id
       WHERE r.usuario_id = $1
       ORDER BY r.fecha_reserva DESC`,
      [usuario_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener reservas:", error);
    res.status(500).json({ error: "Error al obtener reservas" });
  }
};

// Crear reserva y generar factura (con abono parcial, estado pendiente)
exports.createReservaConFactura = async (req, res) => {
  const { disponibilidad_id, abono } = req.body;
  const usuario_id = req.user?.userId || null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Trae también el establecimiento_id para la factura
    const disponibilidadCheck = await client.query(
      `SELECT d.*, e.precio, c.nombre AS cancha_nombre, e.direccion, c.id AS cancha_id, c.establecimiento_id, e.nombre AS establecimiento_nombre, e.dueno_id
       FROM disponibilidades d
       JOIN canchas c ON d.cancha_id = c.id
       JOIN establecimientos e ON c.establecimiento_id = e.id
       WHERE d.id = $1 AND d.disponible = true`,
      [disponibilidad_id]
    );
    if (disponibilidadCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: "La disponibilidad no existe o ya fue reservada." });
    }
    const disp = disponibilidadCheck.rows[0];
    // Validar que el precio exista y sea un número válido
    if (!disp.precio || isNaN(disp.precio)) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: "La cancha no tiene un precio válido configurado." });
    }
    const precio = parseInt(disp.precio, 10);

    // Validación de abono: mínimo 10.000, múltiplo de 5.000, máximo 90% del precio
    let abonoReal = abono || precio;
    if (typeof abonoReal !== "number") abonoReal = parseInt(abonoReal, 10);
    if (isNaN(abonoReal) || abonoReal < 10000) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: "El abono debe ser un número mayor o igual a $10.000." });
    }
    if (abonoReal % 5000 !== 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: "El abono debe ser múltiplo de $5.000." });
    }
    const maxAbono = Math.floor(precio * 0.9);
    if (abonoReal > maxAbono) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: `El abono máximo permitido es el 90% del valor: $${maxAbono}` });
    }
    if (abonoReal === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: "El abono debe ser mayor a 0." });
    }
    const restante = precio - abonoReal;

    // Crear la reserva con estado pendiente
    const reservaResult = await client.query(
      `INSERT INTO reservas (usuario_id, disponibilidad_id, fecha_reserva, estado)
       VALUES ($1, $2, NOW(), 'pendiente') RETURNING id, usuario_id, disponibilidad_id, fecha_reserva, estado`,
      [usuario_id, disponibilidad_id]
    );
    const reserva = reservaResult.rows[0];

    // Marcar la disponibilidad como no disponible
    await client.query(
      "UPDATE disponibilidades SET disponible = false WHERE id = $1",
      [disponibilidad_id]
    );

    // Lógica para crear la factura y generar el PDF (dentro de la transacción)
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
        estado: "pendiente",
        client // usa el mismo cliente de la transacción
      });
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      console.error("Error al generar factura/PDF:", err);
      return res.status(500).json({ error: "No se pudo generar la factura PDF" });
    }

    await client.query("COMMIT");

    // --- Enviar correo al propietario (fuera de la transacción, no afecta la reserva) ---
    try {
      // Obtener email y nombre del propietario
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

    res.json({
      ...reserva,
      factura_url: factura.factura_url,
      abono: abonoReal,
      monto: precio,
      restante,
      fecha: disp.fecha,
      hora_fin: disp.hora_fin,
      estado: "pendiente"
    });
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    console.error("Error al crear la reserva:", error, error.stack);
    res.status(500).json({ error: "Error al crear la reserva", detalle: error.message });
  }
};

// Nuevo: Pagar saldo restante (actualiza estado a pagada)
exports.pagarSaldoReserva = async (req, res) => {
  const { reserva_id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Verifica que la reserva exista y esté pendiente
    const reservaCheck = await client.query(
      "SELECT * FROM reservas WHERE id = $1 AND estado = 'pendiente'",
      [reserva_id]
    );
    if (reservaCheck.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: "Reserva no encontrada o ya pagada/cancelada" });
    }
    // Actualiza la factura
    const facturaRes = await client.query(
      `UPDATE facturas SET restante = 0, estado = 'pagada' WHERE reserva_id = $1 RETURNING id, usuario_id`,
      [reserva_id]
    );
    if (facturaRes.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: "Factura no encontrada para la reserva" });
    }
    // Actualiza la reserva
    const reservaRes = await client.query(
      `UPDATE reservas SET estado = 'confirmada' WHERE id = $1 RETURNING id, usuario_id`,
      [reserva_id]
    );
    if (reservaRes.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: "Reserva no encontrada" });
    }
    await client.query("COMMIT");
    client.release();

    // --- Enviar la factura PDF real como adjunto ---
    try {
      const usuarioRes = await pool.query(
        `SELECT email, nombre FROM usuarios WHERE id = $1`,
        [reservaRes.rows[0].usuario_id]
      );
      const usuario = usuarioRes.rows[0];
      const facturaId = facturaRes.rows[0].id;
      const pdfPath = require("path").join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
      const fs = require("fs");
      if (usuario && fs.existsSync(pdfPath)) {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        await transporter.sendMail({
          from: `"Fútbol Piloto" <${process.env.EMAIL_USER}>`,
          to: usuario.email,
          subject: "Factura de tu reserva",
          html: `
            <h2>¡Pago completado!</h2>
            <p>Hola ${usuario.nombre},</p>
            <p>Tu pago ha sido confirmado. Adjuntamos la factura PDF de tu reserva.</p>
            <p>¡Gracias por reservar con nosotros!</p>
          `,
          attachments: [
            {
              filename: `factura_${facturaId}.pdf`,
              path: pdfPath
            }
          ]
        });
      }
    } catch (correoErr) {
      console.error("Error enviando factura al usuario:", correoErr);
    }
    // --- Fin correo usuario ---

    res.json({ message: "Pago completado y reserva confirmada" });
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    console.error("Error al finalizar el pago:", error);
    res.status(500).json({ error: "Error al finalizar el pago", detalle: error.message });
  }
};

// Nuevo: Cancelar reserva (actualiza estado y libera disponibilidad)
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
      client.release();
      return res.status(404).json({ error: "Reserva no encontrada" });
    }
    const disponibilidad_id = reservaResult.rows[0].disponibilidad_id;
    await client.query(
      "UPDATE reservas SET estado = 'cancelada' WHERE id = $1",
      [reserva_id]
    );
    await client.query(
      "UPDATE facturas SET estado = 'cancelada' WHERE reserva_id = $1",
      [reserva_id]
    );
    await client.query(
      "UPDATE disponibilidades SET disponible = true WHERE id = $1",
      [disponibilidad_id]
    );
    await client.query("COMMIT");
    client.release();
    res.status(200).json({ message: "Reserva cancelada exitosamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    res.status(500).json({ error: "Error al cancelar la reserva" });
  }
};

// Obtener reservas por cancha
exports.getReservasByCancha = async (req, res) => {
  const { cancha_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.id AS reserva_id, r.fecha_reserva, 
              d.fecha, d.hora_inicio, d.hora_fin, c.nombre AS cancha_nombre, 
              c.direccion, c.lat, c.lng, r.estado
       FROM reservas r
       JOIN disponibilidades d ON r.disponibilidad_id = d.id
       JOIN canchas c ON d.cancha_id = c.id
       WHERE c.id = $1`,
      [cancha_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener reservas por cancha:", error);
    res.status(500).json({ error: "Error al obtener reservas por cancha" });
  }
};
