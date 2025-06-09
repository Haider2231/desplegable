const pool = require("../db");
const nodemailer = require("nodemailer");
const facturaController = require("./facturaController");

// Función para enviar correo al propietario
async function enviarCorreoPropietario({ propietarioEmail, establecimiento, cancha, fecha, hora_inicio, hora_fin, abono, restante, usuario }) {
  // Configura tu transporter (ajusta según tu proveedor SMTP)
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) {
    console.error("Faltan credenciales de correo: EMAIL_USER o EMAIL_PASS no están definidas.");
    throw new Error("Faltan credenciales de correo");
  }
  const transporter = require("nodemailer").createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { disponibilidad_id, abono } = req.body;
    const usuario_id = req.user?.userId || null;
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
    client.release();

    // --- Enviar correo al propietario (fuera de la transacción, no afecta la reserva) ---
    let usuario; // <--- define usuario aquí para usarlo después
    try {
      // Obtener email y nombre del propietario
      const propietario = await pool.query(
        `SELECT email, nombre FROM usuarios WHERE id = $1`,
        [disp.dueno_id]
      );
      const propietarioEmail = propietario.rows[0]?.email;
      usuario = await pool.query(
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

    // --- Enviar factura PDF al usuario con mensaje de pendiente ---
    try {
      // Asegúrate de que usuario esté definido y tenga la estructura correcta
      const userEmail = usuario && usuario.rows && usuario.rows[0] && usuario.rows[0].email;
      if (userEmail && factura && factura.facturaId) {
        const facturaController = require("./facturaController");
        await facturaController.enviarFacturaPorCorreoPendiente(
          factura.facturaId,
          userEmail,
          disp,
          abonoReal,
          restante
        );
      }
    } catch (correoErr) {
      console.error("Error enviando factura PDF al usuario:", correoErr);
    }
    // --- Fin correo usuario ---

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
    // Trae el valor restante antes de actualizar
    const facturaRes = await client.query(
      `UPDATE facturas SET restante = 0, estado = 'pagada' WHERE reserva_id = $1 RETURNING id, usuario_id, restante, monto, abono`,
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

    // --- Enviar la factura PDF real como adjunto y regenerar el PDF con estado pagada ---
    try {
      const usuarioRes = await pool.query(
        `SELECT email, nombre FROM usuarios WHERE id = $1`,
        [reservaRes.rows[0].usuario_id]
      );
      const usuario = usuarioRes.rows[0];
      const facturaId = facturaRes.rows[0].id;

      // Traer datos completos de la reserva para el PDF
      const reservaDatos = await pool.query(
        `SELECT r.fecha_reserva, d.fecha, d.hora_inicio, d.hora_fin, c.nombre AS cancha_nombre, e.direccion, c.id AS cancha_id
         FROM reservas r
         JOIN disponibilidades d ON r.disponibilidad_id = d.id
         JOIN canchas c ON d.cancha_id = c.id
         JOIN establecimientos e ON c.establecimiento_id = e.id
         WHERE r.id = $1`,
        [reserva_id]
      );
      const datos = reservaDatos.rows[0] || {};

      // Regenerar el PDF de la factura con estado pagada (pagoFinal = true)
      await facturaController.crearFacturaYGenerarPDF({
        reservaId: reserva_id,
        usuarioId: reservaRes.rows[0].usuario_id,
        precio: facturaRes.rows[0].monto,
        abono: facturaRes.rows[0].abono,
        fecha_reserva: datos.fecha_reserva,
        cancha_nombre: datos.cancha_nombre,
        direccion: datos.direccion,
        fecha: datos.fecha,
        hora_inicio: datos.hora_inicio,
        hora_fin: datos.hora_fin,
        cancha_id: datos.cancha_id,
        estado: "pagada",
        pagoFinal: true
      });

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

    res.json({
      message: "Pago completado y reserva confirmada",
      pagado: facturaRes.rows[0].restante,
      monto: facturaRes.rows[0].monto,
      abono: facturaRes.rows[0].abono
    });
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

// Historial de abonos y pagos del usuario
exports.getHistorialAbonos = async (req, res) => {
  const usuario_id = req.user?.userId;
  try {
    const result = await pool.query(
      `SELECT r.id AS reserva_id, r.fecha_reserva, d.fecha, d.hora_inicio, d.hora_fin, 
              c.nombre AS cancha, e.nombre AS establecimiento, 
              f.abono, f.restante, f.estado AS estado_pago, f.id AS factura_id, f.monto AS total
       FROM reservas r
       JOIN disponibilidades d ON r.disponibilidad_id = d.id
       JOIN canchas c ON d.cancha_id = c.id
       JOIN establecimientos e ON c.establecimiento_id = e.id
       LEFT JOIN facturas f ON f.reserva_id = r.id
       WHERE r.usuario_id = $1
       ORDER BY r.fecha_reserva DESC` ,
      [usuario_id]
    );
    const historial = result.rows.map(row => ({
      fecha: row.fecha_reserva,
      cancha: row.cancha,
      establecimiento: row.establecimiento,
      abono: row.abono,
      restante: row.restante,
      estado: row.estado_pago,
      factura_url: row.factura_id ? `/uploads/factura_${row.factura_id}.pdf` : null,
      hora_inicio: row.hora_inicio,
      hora_fin: row.hora_fin,
      total: row.total
    }));
    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial de abonos:", error);
    res.status(500).json({ error: "Error al obtener historial de abonos", detalle: error.message });
  }
};

// Historial de abonos y pagos de todas las reservas de las canchas del propietario
exports.getHistorialAbonosPropietario = async (req, res) => {
  const propietario_id = req.user?.userId;
  try {
    const result = await pool.query(
      `SELECT r.fecha_reserva, d.fecha, d.hora_inicio, d.hora_fin,
              c.nombre AS cancha, e.nombre AS establecimiento,
              f.abono, f.restante, f.estado AS estado_pago, f.id AS factura_id, f.monto AS total,
              u.nombre AS usuario_nombre, u.email AS usuario_email, u.telefono AS usuario_telefono
       FROM reservas r
       JOIN disponibilidades d ON r.disponibilidad_id = d.id
       JOIN canchas c ON d.cancha_id = c.id
       JOIN establecimientos e ON c.establecimiento_id = e.id
       LEFT JOIN facturas f ON f.reserva_id = r.id
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE e.dueno_id = $1
       ORDER BY r.fecha_reserva DESC`,
      [propietario_id]
    );
    const historial = result.rows.map(row => ({
      fecha_reserva: row.fecha_reserva,
      cancha: row.cancha,
      hora_inicio: row.hora_inicio, // <-- Asegura que se incluya
      hora_fin: row.hora_fin,       // <-- Asegura que se incluya
      usuario: row.usuario_nombre,
      email: row.usuario_email,
      telefono: row.usuario_telefono,
      abono: row.abono,
      estado: row.estado_pago === 'pagada' ? 'Pagado' : 'Pendiente',
      restante: row.restante,
      total: row.total,
      valor_restante_pagado: row.estado_pago === 'pagada' && row.total && row.abono != null ? (row.total - row.abono) : null
    }));
    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial de abonos del propietario:", error);
    res.status(500).json({ error: "Error al obtener historial de abonos del propietario", detalle: error.message });
  }
};
