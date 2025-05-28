const pool = require("../db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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
  cancha_id // <-- asegúrate de pasar cancha_id al llamar a este método
}) => {
  // Calcula el restante correctamente
  const restante = precio - abono;

  // 1. Guarda la factura en la base de datos
  const result = await pool.query(
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

  // 2. Genera el PDF con los campos personalizados y mejor diseño
  const pdfPath = path.join(__dirname, "..", "uploads", `factura_${facturaId}.pdf`);
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(pdfPath));

  // Encabezado con fondo de color y título centrado
  doc
    .rect(0, 0, doc.page.width, 60)
    .fill("#007991")
    .fillColor("#fff")
    .fontSize(24)
    .font("Helvetica-Bold")
    .text("Factura de Reserva de Cancha", 0, 20, { align: "center" })
    .fillColor("black");

  // Datos de la factura y fecha
  doc
    .fontSize(12)
    .font("Helvetica")
    .text(`Factura N°: ${facturaId}`, 40, 75)
    .text(`Fecha de emisión: ${fechaFactura}`, 40, 95);

  // Línea separadora
  doc.moveTo(40, 115).lineTo(555, 115).strokeColor("#007991").stroke();

  // Datos del cliente (recuadro)
  doc
    .rect(40, 125, 515, 40)
    .strokeColor("#b2f7ef")
    .lineWidth(1)
    .stroke()
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#007991")
    .text("Datos del Cliente:", 50, 132)
    .font("Helvetica")
    .fontSize(12)
    .fillColor("black")
    .text(`Nombre: ${nombreUsuario}`, 200, 132);

  // Datos de la reserva (recuadro)
  doc
    .rect(40, 175, 515, 90)
    .strokeColor("#b2f7ef")
    .lineWidth(1)
    .stroke()
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#007991")
    .text("Detalles de la Reserva:", 50, 182)
    .font("Helvetica")
    .fontSize(12)
    .fillColor("black")
    .text(`Establecimiento: ${establecimiento_nombre}`, 50, 200)
    .text(`Cancha: ${cancha_nombre}`, 50, 215)
    .text(`Dirección: ${direccion}`, 50, 230);

  // Fecha y horario en una línea separada abajo para evitar sobreposición
  doc
    .text(`Fecha de juego: ${fecha ? new Date(fecha).toLocaleDateString("es-CO") : ""}`, 50, 250)
    .text(`Horario: ${hora_inicio} - ${hora_fin}`, 320, 250);

  // Línea separadora más abajo para evitar sobreposición
  doc.moveTo(40, 285).lineTo(555, 285).strokeColor("#007991").stroke();

  // Detalles de pago (recuadro) - baja el cuadro para que no se sobreponga
  doc
    .rect(40, 295, 515, 90)
    .strokeColor("#b2f7ef")
    .lineWidth(1)
    .stroke()
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor("#007991")
    .text("Resumen de Pago:", 50, 302)
    .font("Helvetica")
    .fontSize(12)
    .fillColor("black")
    .text("Valor total:", 50, 322)
    .text("Abono realizado:", 50, 342)
    .text("Restante por pagar:", 50, 362)
    .font("Helvetica-Bold")
    .fillColor("#388e3c")
    .text(`$${precio}`, 200, 322)
    .fillColor("#007991")
    .text(`$${abono}`, 200, 342)
    .fillColor("#d32f2f")
    .text(`$${precio - abono}`, 200, 362)
    .fillColor("black");

  // Mensaje final centrado
  doc
    .fontSize(15)
    .font("Helvetica-Bold")
    .fillColor("#007991")
    .text("¡Gracias por su reserva!", 0, 400, { align: "center" })
    .fillColor("black");

  doc.end();

  // 3. Devuelve la URL del PDF
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