const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const pool = require("../db");

// Nuevo método para obtener el nombre del establecimiento por establecimiento_id
async function getEstablecimientoNombreByEstId(establecimiento_id) {
  const result = await pool.query(
    "SELECT nombre FROM establecimientos WHERE id = $1",
    [establecimiento_id]
  );
  return result.rows[0]?.nombre || "Establecimiento desconocido";
}

// Si solo tienes cancha_id, primero obtén el establecimiento_id y luego el nombre
async function getEstablecimientoNombreByCanchaId(cancha_id) {
  const canchaRes = await pool.query(
    "SELECT establecimiento_id FROM canchas WHERE id = $1",
    [cancha_id]
  );
  const establecimiento_id = canchaRes.rows[0]?.establecimiento_id;
  if (!establecimiento_id) return "Establecimiento desconocido";
  return await getEstablecimientoNombreByEstId(establecimiento_id);
}

exports.crearFacturaYGenerarPDF = async ({
  reservaId,
  usuarioId,
  precio,
  abono,
  fecha_reserva,
  cancha_nombre,
  direccion,
  fecha,
  hora_inicio,
  hora_fin,
  cancha_id,
  estado = "pendiente", // nuevo
  client,
  pagoFinal = false // NUEVO: indica si es la factura final (pago completado)
}) => {
  // Validaciones estrictas para evitar errores de PDF
  if (
    !reservaId ||
    !usuarioId ||
    precio === undefined || precio === null ||
    abono === undefined || abono === null ||
    !cancha_nombre ||
    !direccion ||
    !fecha ||
    !hora_inicio ||
    !hora_fin ||
    !cancha_id
  ) {
    throw new Error("Faltan datos requeridos para generar la factura PDF");
  }

  // Calcula el restante correctamente
  let restante = precio - abono;
  let abonoMostrado = abono;
  let pagoFinalMostrado = 0;

  // Si es pago final, el usuario paga el restante y el abono ya fue pagado antes
  if (pagoFinal) {
    abonoMostrado = abono; // abono ya pagado antes
    pagoFinalMostrado = restante; // lo que paga ahora
    restante = 0;
  }

  // Usa el cliente de la transacción si se pasa, si no usa pool
  const db = client || pool;

  // 1. Guarda la factura en la base de datos SOLO si no existe para esta reserva
  let facturaId;
  let fechaFactura;
  const facturaExistente = await db.query(
    `SELECT id, fecha FROM facturas WHERE reserva_id = $1`,
    [reservaId]
  );
  if (facturaExistente.rows.length > 0) {
    // Ya existe, actualiza el estado y los montos
    facturaId = facturaExistente.rows[0].id;
    fechaFactura = facturaExistente.rows[0].fecha;
    await db.query(
      `UPDATE facturas SET abono = $1, restante = $2, estado = $3, monto = $4 WHERE id = $5`,
      [abono, restante, estado, precio, facturaId]
    );
  } else {
    // No existe, crea la factura
    const result = await db.query(
      `INSERT INTO facturas (reserva_id, usuario_id, monto, abono, restante, fecha, estado)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6) RETURNING id, fecha`,
      [reservaId, usuarioId, precio, abono, restante, estado]
    );
    facturaId = result.rows[0].id;
    fechaFactura = result.rows[0].fecha;
  }

  // Obtener el nombre del usuario
  const usuarioResult = await pool.query(
    "SELECT nombre FROM usuarios WHERE id = $1",
    [usuarioId]
  );
  const nombreUsuario = usuarioResult.rows[0]?.nombre || "Usuario desconocido";

  // Obtener el nombre del establecimiento usando el nuevo método
  let establecimiento_nombre = "Establecimiento desconocido";
  if (cancha_id) {
    establecimiento_nombre = await getEstablecimientoNombreByCanchaId(cancha_id);
  }

  // 2. Genera el PDF personalizado y coherente con la web
  const pdfPath = path.join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
  try {
    // El problema es que los textos del footer son muy largos y PDFKit los "empuja" fuera de la página, creando páginas nuevas.
    // Solución: Usa un footer más alto y reduce el tamaño de fuente, o divide el texto largo en dos líneas.

    const pageWidth = 595.28;
    const pageHeight = 480;
    const footerHeight = 80; // Footer más alto
    const footerY = pageHeight - footerHeight;

    const doc = new PDFDocument({ margin: 40, size: [pageWidth, pageHeight] });
    doc.pipe(fs.createWriteStream(pdfPath));

    // Encabezado
    doc.rect(0, 0, pageWidth, 70).fill("#43e97b");
    const logoPath = path.join(__dirname, "..", "uploads", "logo.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth - 120, 10, { width: 50 });
    }
    doc
      .fillColor("#fff")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("Fútbol Piloto", 40, 18, { align: "left" })
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Factura de Reserva", 0, 28, { align: "center", width: pageWidth })
      .fillColor("black");

    // Datos de la factura y fecha
    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#222")
      .text(`Factura N°: ${facturaId}`, 40, 85)
      .text(`Fecha de emisión: ${fechaFactura}`, 40, 105);

    // Línea separadora
    doc.moveTo(40, 120).lineTo(555, 120).strokeColor("#43e97b").stroke();

    // Datos del cliente (recuadro, borde verde)
    doc
      .rect(40, 130, 515, 40)
      .strokeColor("#43e97b")
      .lineWidth(1.5)
      .stroke()
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#388e3c")
      .text("Datos del Cliente:", 50, 137)
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#222")
      .text(`Nombre: ${nombreUsuario}`, 200, 137);

    // Datos de la reserva (recuadro, borde verde)
    doc
      .rect(40, 180, 515, 70) // Reduce el alto del bloque
      .strokeColor("#43e97b")
      .lineWidth(1.5)
      .stroke()
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#388e3c")
      .text("Detalles de la Reserva:", 50, 187)
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#222")
      .text(`Establecimiento: ${establecimiento_nombre}`, 50, 205)
      .text(`Cancha: ${cancha_nombre}`, 50, 220)
      .text(`Dirección: ${direccion}`, 50, 235)
      .text(`Fecha de juego: ${fecha ? new Date(fecha).toLocaleDateString("es-CO") : ""}`, 320, 205)
      .text(`Horario: ${hora_inicio} - ${hora_fin}`, 320, 220);

    // Línea separadora más abajo para evitar sobreposición
    doc.moveTo(40, 260).lineTo(555, 260).strokeColor("#43e97b").stroke();

    // Detalles de pago (recuadro, borde verde)
    doc
      .rect(40, 270, 515, pagoFinal ? 90 : 70) // Más alto si es pago final
      .strokeColor("#43e97b")
      .lineWidth(1.5)
      .stroke()
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#388e3c")
      .text("Resumen de Pago:", 50, 277)
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#222")
      .text("Valor total:", 50, 297)
      .text("Abono realizado:", 50, 312)
      .text(pagoFinal ? "Valor pagado ahora:" : "Restante por pagar:", 50, 327)
      .font("Helvetica-Bold")
      .fillColor("#388e3c")
      .text(`$${precio}`, 200, 297)
      .fillColor("#43e97b")
      .text(`$${abonoMostrado}`, 200, 312)
      .fillColor(pagoFinal ? "#388e3c" : "#d32f2f")
      .text(pagoFinal ? `$${pagoFinalMostrado}` : `$${precio - abonoMostrado}`, 200, 327)
      .fillColor("black");

    // Estado de la factura (PENDIENTE o PAGADA)
    let statusLabel = "";
    let statusColor = "#d32f2f";
    if (pagoFinal || estado === "pagada") {
      statusLabel = "PAGADA";
      statusColor = "#388e3c";
    } else if (estado === "pendiente") {
      statusLabel = "PENDIENTE";
      statusColor = "#d32f2f";
    }
    // Mostrar el estado en la parte superior derecha del PDF
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(statusColor)
      .text(statusLabel, pageWidth - 160, 85, { align: "left", width: 120 });

    // Mensaje destacado según el estado, debajo del resumen de pago
    if (pagoFinal || estado === "pagada") {
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#388e3c")
        .text("PAGO FINALIZADO - RESERVA COMPLETAMENTE PAGADA", 50, 355, { align: "left" });
      doc.font("Helvetica").fontSize(13).fillColor("#388e3c")
        .text("Incluye abono y pago final.", 50, 375, { align: "left" });
    } else if (estado === "pendiente") {
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#fbc02d")
        .text("ABONO REGISTRADO - PAGO PENDIENTE", 50, 355, { align: "left" });
      doc.font("Helvetica").fontSize(13).fillColor("#d32f2f")
        .text("Esta factura corresponde a un abono. El pago final está pendiente.", 50, 375, { align: "left" });
    }

    // Mensaje final centrado (ajusta la posición Y para que no se salga)
    doc
      .fontSize(15)
      .font("Helvetica-Bold")
      .fillColor("#388e3c")
      .text("¡Gracias por reservar en Fútbol Piloto!", 0, 405, { align: "center", width: pageWidth });

    // --- FOOTER AL FINAL DE LA HOJA ---
    doc.save();
    doc.rect(0, footerY, pageWidth, footerHeight).fill("#43e97b");
    doc.restore();

    // Footer ajustado para evitar desbordamiento y nueva página
    doc
      .fillColor("#fff")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Factura generada por Fútbol Piloto - Tu plataforma de reservas", 0, footerY + 10, { align: "center", width: pageWidth })
      .font("Helvetica")
      .fontSize(14)
      .text("Contacto: futbolupiloto@gmail.com",0, footerY + 21, { align: "center", width: pageWidth })
      .font("Helvetica-Bold")
      doc.end();
  } catch (err) {
    await pool.query("DELETE FROM facturas WHERE id = $1", [facturaId]);
    throw new Error("Error al generar el archivo PDF de la factura");
  }

  return { facturaId };
};

exports.getFacturasByCancha = async (req, res) => {
  const { cancha_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT f.*, d.id AS disponibilidad_id
       FROM facturas f
       JOIN reservas r ON f.reserva_id = r.id
       JOIN disponibilidades d ON r.disponibilidad_id = d.id
       WHERE d.cancha_id = $1`,
      [cancha_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener facturas de la cancha" });
  }
};


exports.getFacturaByDisponibilidad = async (req, res) => {
  try {
    const disponibilidadId = req.params.id;
    const result = await pool.query(
      `SELECT f.abono, f.restante, f.usuario_id AS user_id
         FROM facturas f
         JOIN reservas r ON f.reserva_id = r.id
         WHERE r.disponibilidad_id = $1
         LIMIT 1`,
      [disponibilidadId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "No hay factura para esta disponibilidad" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener la factura" });
  }
};

exports.enviarFacturaPorCorreo = async (facturaId, userEmail) => {
  const pdfPath = path.join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
  if (!fs.existsSync(pdfPath)) return false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "trasmileniopruebas@gmailcom",
      pass: "nhbrvpeyyljakcze",
    },
  });

  await transporter.sendMail({
    from: "trasmileniopruebas@gmailcom",
    to: userEmail,
    subject: "Factura de tu reserva - Fútbol Piloto",
    text: "Adjuntamos la factura PDF de tu reserva. ¡Gracias por reservar!",
    attachments: [
      {
        filename: `factura_${facturaId}.pdf`,
        path: pdfPath,
      },
    ],
  });
  return true;
};

exports.enviarFacturaPorCorreoPendiente = async (facturaId, userEmail, disp, abono, restante) => {
  const pdfPath = path.join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
  if (!fs.existsSync(pdfPath)) return false;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "trasmileniopruebas@gmailcom",
      pass: process.env.EMAIL_PASS || "nhbrvpeyyljakcze",
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER || "trasmileniopruebas@gmailcom",
    to: userEmail,
    subject: "Factura de tu reserva - Abono registrado (pendiente de pago final)",
    html: `trasmileniopruebas@gmailcom
      <h2>¡Reserva registrada!</h2>
      <p>Tu abono fue registrado para la siguiente reserva:</p>
      <ul>
        <li><b>Establecimiento:</b> ${disp.establecimiento_nombre}</li>
        <li><b>Cancha:</b> ${disp.cancha_nombre}</li>
        <li><b>Fecha:</b> ${disp.fecha}</li>
        <li><b>Horario:</b> ${disp.hora_inicio} - ${disp.hora_fin}</li>
        <li><b>Abono pagado:</b> $${abono}</li>
        <li><b>Restante por pagar:</b> $${restante}</li>
      </ul>
      <p><b>Recuerda:</b> Tu reserva está pendiente de pago final. Adjuntamos la factura PDF de tu abono.</p>
      <p>Cuando completes el pago, recibirás una nueva factura confirmando la reserva.</p>
      <hr>
      <p>¡Gracias por reservar en Fútbol Piloto!</p>
    `,
    attachments: [
      {
        filename: `factura_${facturaId}.pdf`,
        path: pdfPath,
      },
    ],
  });
  return true;
};

// Llama a esta función automáticamente al generar la factura
exports.generarYEnviarFactura = async (facturaId, userEmail) => {
  // ...genera el PDF como siempre...
  // Después de generar el PDF:
  await exports.enviarFacturaPorCorreo(facturaId, userEmail);
  // ...devuelve la URL o lo que necesites...
};