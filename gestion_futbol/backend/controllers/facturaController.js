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
  client // <-- recibe el cliente de la transacción si se pasa
}) => {
  // Validaciones estrictas para evitar errores de PDF
  if (
    !reservaId ||
    !usuarioId ||
    !precio ||
    abono === undefined ||
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
  const restante = precio - abono;

  // Usa el cliente de la transacción si se pasa, si no usa pool
  const db = client || pool;

  // 1. Guarda la factura en la base de datos
  const result = await db.query(
    `INSERT INTO facturas (reserva_id, usuario_id, monto, abono, restante, fecha)
     VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, fecha`,
    [reservaId, usuarioId, precio, abono, precio - abono]
  );
  const facturaId = result.rows[0].id;
  const fechaFactura = result.rows[0].fecha;

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
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(fs.createWriteStream(pdfPath));

    // Encabezado con fondo verde y branding de la web
    doc
      .rect(0, 0, doc.page.width, 70)
      .fill("#43e97b");

    // Logo de la web (opcional, si tienes un logo PNG en /uploads/logo.png)
    const logoPath = path.join(__dirname, "..", "uploads", "logo.png");
    if (fs.existsSync(logoPath)) {
      // Logo más arriba y centrado
      doc.image(logoPath, doc.page.width - 120, 10, { width: 50, align: "center" });
    }

    // Título y subtítulo
    doc
      .fillColor("#fff")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("Fútbol Piloto", 40, 18, { align: "left" })
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Factura de Reserva", 0, 28, { align: "center" })
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
      .rect(40, 180, 515, 90)
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
      .text(`Fecha de juego: ${fecha ? new Date(fecha).toLocaleDateString("es-CO") : ""}`, 50, 250)
      .text(`Horario: ${hora_inicio} - ${hora_fin}`, 320, 250);

    // Línea separadora más abajo para evitar sobreposición
    doc.moveTo(40, 280).lineTo(555, 280).strokeColor("#43e97b").stroke();

    // Detalles de pago (recuadro, borde verde)
    doc
      .rect(40, 290, 515, 90)
      .strokeColor("#43e97b")
      .lineWidth(1.5)
      .stroke()
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#388e3c")
      .text("Resumen de Pago:", 50, 297)
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#222")
      .text("Valor total:", 50, 317)
      .text("Abono realizado:", 50, 337)
      .text("Restante por pagar:", 50, 357)
      .font("Helvetica-Bold")
      .fillColor("#388e3c")
      .text(`$${precio}`, 200, 317)
      .fillColor("#43e97b")
      .text(`$${abono}`, 200, 337)
      .fillColor("#d32f2f")
      .text(`$${precio - abono}`, 200, 357)
      .fillColor("black");

    // Mensaje final centrado y datos de contacto
    doc
      .fontSize(15)
      .font("Helvetica-Bold")
      .fillColor("#388e3c")
      .text("¡Gracias por reservar en Fútbol Piloto!", 0, 400, { align: "center" });

    // Franja inferior personalizada con branding y contacto
    const footerY = 440;
    doc
      .rect(0, footerY, doc.page.width, 50)
      .fill("#43e97b");
    doc
      .fillColor("#fff")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Sitio web: https://canchassinteticas.site", 0, footerY + 10, { align: "center" })
      .font("Helvetica")
      .fontSize(12)
      .text("Contacto: futbolupiloto@gmail.com", 0, footerY + 28, { align: "center" });

    // Sello personalizado de la web
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#fff")
      .text("Factura generada por Fútbol Piloto - Tu plataforma de reservas de canchas sintéticas", 0, footerY + 42, { align: "center" });

    doc.end();
  } catch (err) {
    // Si falla la generación del PDF, elimina la factura de la base de datos
    await pool.query("DELETE FROM facturas WHERE id = $1", [facturaId]);
    throw new Error("Error al generar el archivo PDF de la factura");
  }

  // 3. Devuelve la URL del PDF (ya no se usará, pero se mantiene para compatibilidad)
  return {
    factura_url: `/facturas/${facturaId}/pdf`
  };
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
      user: "diazmontejodiegoalejandro@gmail.com",
      pass: "mpcnakbsmmhalwak",
    },
  });

  await transporter.sendMail({
    from: "diazmontejodiegoalejandro@gmail.com",
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

// Llama a esta función automáticamente al generar la factura
exports.generarYEnviarFactura = async (facturaId, userEmail) => {
  // ...genera el PDF como siempre...
  // Después de generar el PDF:
  await exports.enviarFacturaPorCorreo(facturaId, userEmail);
  // ...devuelve la URL o lo que necesites...
};