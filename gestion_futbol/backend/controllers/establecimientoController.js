const pool = require("../db");
const path = require("path");

// Crear un establecimiento (soporta multipart/form-data)
exports.createEstablecimiento = async (req, res) => {
  const client = await pool.connect();
  try {
    console.log("Entrando a createEstablecimiento"); // <-- LOG INICIAL
    await client.query("BEGIN");
    // Los campos pueden venir como string (de FormData)
    const nombre = req.body.nombre;
    const direccion = req.body.direccion;
    const dueno_id = req.body.dueno_id;
    const telefono = req.body.telefono;
    const precio = req.body.precio;
    const lat = req.body.lat;
    const lng = req.body.lng;
    const cantidad_canchas = parseInt(req.body.cantidad_canchas, 10) || 0;
    // Cambia para soportar varias imágenes
    let imagenes_urls = [];
    if (req.files && req.files.imagenes && req.files.imagenes.length > 0) {
      imagenes_urls = req.files.imagenes.map(f => `/uploads/${f.filename}`);
    }
    // Para compatibilidad, la primera imagen será la principal
    let imagen_url = imagenes_urls.length > 0 ? imagenes_urls[0] : null;
    // Asegura que los campos de horario estén presentes
    const dias_disponibles = req.body.dias_disponibles; // Ej: "1,2,3,4,5,6,0" (lunes a domingo)
    const hora_apertura = req.body.hora_apertura; // Ej: "08:00"
    const hora_cierre = req.body.hora_cierre;     // Ej: "22:00"
    const duracion_turno = parseInt(req.body.duracion_turno, 10) || 60; // minutos

    // Validación robusta
    if (
      !nombre ||
      !direccion ||
      !dueno_id ||
      !telefono ||
      (precio === undefined || precio === null || precio === "") ||
      lat === undefined || lat === null || lat === "" ||
      lng === undefined || lng === null || lng === "" ||
      !dias_disponibles || !hora_apertura || !hora_cierre || !duracion_turno
    ) {
      await client.query("ROLLBACK");
      client.release();
      console.error("Faltan datos obligatorios:", {
        nombre, direccion, dueno_id, telefono, precio, lat, lng, dias_disponibles, hora_apertura, hora_cierre, duracion_turno
      });
      const fs = require("fs");
      fs.appendFileSync("errores_establecimiento.log", `[${new Date().toISOString()}] Faltan datos: ${JSON.stringify({
        nombre, direccion, dueno_id, telefono, precio, lat, lng, dias_disponibles, hora_apertura, hora_cierre, duracion_turno
      })}\n`);
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // Determina el estado según el rol y el campo recibido
    let estado = "pendiente";
    let esAdmin = false;
    if (
      req.user &&
      req.user.rol === "admin" &&
      req.body.estado &&
      req.body.estado.toLowerCase() === "activo"
    ) {
      estado = "activo";
      esAdmin = true;
    }

    // Inserta el establecimiento con el estado correcto
    let result;
    try {
      result = await client.query(
        `INSERT INTO establecimientos (nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagen_url, estado, dias_disponibles, hora_apertura, hora_cierre, duracion_turno)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
        [nombre, direccion, lat, lng, telefono, precio, dueno_id, cantidad_canchas, imagen_url, estado, dias_disponibles, hora_apertura, hora_cierre, duracion_turno]
      );
      console.log("Establecimiento insertado correctamente en la base de datos."); // <-- LOG
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      console.error("Error al crear el establecimiento (DB):", err);
      const fs = require("fs");
      fs.appendFileSync("errores_establecimiento.log", `[${new Date().toISOString()}] Error DB: ${err.message}\n`);
      return res.status(500).json({ error: "Error al crear el establecimiento (DB)", detalle: err.message });
    }
    const establecimiento = result.rows[0];

    // Guardar todas las imágenes en la tabla cancha_imagenes para cada cancha
    try {
      for (let i = 0; i < cantidad_canchas; i++) {
        const canchaRes = await client.query(
          `INSERT INTO canchas (establecimiento_id, nombre, dueno_id, estado) VALUES ($1, $2, $3, 'activa') RETURNING id`,
          [establecimiento.id, `Cancha ${i + 1}`, dueno_id]
        );
        const canchaId = canchaRes.rows[0].id;
        // Guarda todas las imágenes asociadas a la cancha
        for (let j = 0; j < imagenes_urls.length; j++) {
          await client.query(
            // CORRIGE: comillas dobles por simples en la query
            'INSERT INTO cancha_imagenes (cancha_id, url, orden) VALUES ($1, $2, $3)',
            [canchaId, imagenes_urls[j], j]
          );
        }
      }
      console.log("Canchas creadas correctamente."); // <-- LOG
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      console.error("Error al crear las canchas:", err);
      const fs = require("fs");
      fs.appendFileSync("errores_establecimiento.log", `[${new Date().toISOString()}] Error canchas: ${err.message}\n`);
      return res.status(500).json({ error: "Error al crear las canchas", detalle: err.message });
    }

    // Guardar documentos si existen (req.files.documentos)
    try {
      if (req.files && req.files.documentos) {
        for (let i = 0; i < req.files.documentos.length; i++) {
          const archivo = req.files.documentos[i];
          const url = `/uploads/${archivo.filename}`;
          await client.query(
            `INSERT INTO documentos_establecimiento (establecimiento_id, url, tipo) VALUES ($1, $2, $3)`,
            [establecimiento.id, url, archivo.mimetype]
          );
        }
      }
      console.log("Documentos guardados correctamente."); // <-- LOG
    } catch (err) {
      await client.query("ROLLBACK");
      client.release();
      console.error("Error al guardar documentos:", err);
      const fs = require("fs");
      fs.appendFileSync("errores_establecimiento.log", `[${new Date().toISOString()}] Error documentos: ${err.message}\n`);
      return res.status(500).json({ error: "Error al guardar documentos", detalle: err.message });
    }

    await client.query("COMMIT");
    client.release();
    console.log("Establecimiento creado y transacción confirmada."); // <-- LOG FINAL

    // Si el admin lo creó como activo, genera horarios para 15 días para todas las canchas
    if (esAdmin) {
      try {
        // Espera a que las canchas estén creadas antes de generar horarios
        await exports.generarHorariosEstablecimientoDias(establecimiento.id, 15);
      } catch (err) {
        console.error("Error generando horarios automáticos para admin:", err);
        // No detiene la creación, solo loguea
      }
    }

    res.status(200).json(establecimiento);
  } catch (error) {
    await client.query("ROLLBACK");
    client.release();
    console.error("Error al crear establecimiento (catch):", error, error.stack);
    const fs = require("fs");
    fs.appendFileSync("errores_establecimiento.log", `[${new Date().toISOString()}] Error catch: ${error.message}\n`);
    res.status(500).json({ error: "Error al crear establecimiento", detalle: error.message });
  }
};

// Obtener establecimientos por dueño
exports.getEstablecimientosByDueno = async (req, res) => {
  // Verifica que el usuario autenticado sea el dueño o admin
  const { dueno_id } = req.params;
  const user = req.user;
  if (!user || (user.userId != dueno_id && user.rol !== "admin")) {
    return res.status(403).json({ error: "No autorizado para ver estos establecimientos" });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM establecimientos WHERE dueno_id = $1`,
      [dueno_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener establecimientos" });
  }
};

// Obtener todos los establecimientos (para el mapa)
exports.getAllEstablecimientos = async (req, res) => {
  try {
    // Solo retorna los establecimientos activos
    const result = await pool.query("SELECT * FROM establecimientos WHERE estado = 'activo'");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener establecimientos" });
  }
};

// Genera horarios para N días a partir de hoy para todas las canchas del establecimiento
exports.generarHorariosEstablecimientoDias = async (establecimiento_id, diasACrear = 15) => {
  const pool = require("../db");
  // 2. Obtén info de días, horas y duración
  const est = await pool.query("SELECT * FROM establecimientos WHERE id = $1", [establecimiento_id]);
  if (!est.rows.length) {
    console.error("No existe el establecimiento:", establecimiento_id);
    return;
  }
  const { hora_apertura, hora_cierre, dias_disponibles, duracion_turno } = est.rows[0];
  // 3. Obtén canchas del establecimiento (usa id)
  const canchas = await pool.query("SELECT id FROM canchas WHERE establecimiento_id = $1", [establecimiento_id]);
  if (!canchas.rows.length) {
    console.error("No hay canchas para el establecimiento:", establecimiento_id);
    return;
  }
  // 4. Genera horarios para los próximos N días
  // Normaliza los días a números y filtra los válidos (0-6)
  let dias = [];
  if (typeof dias_disponibles === "string") {
    dias = dias_disponibles
      .split(",")
      .map(d => d.trim())
      .map(d => {
        const n = Number(d);
        return isNaN(n) ? null : n;
      })
      .filter(d => d !== null && d >= 0 && d <= 6);
  }
  // --- NUEVO: Normaliza hora_apertura y hora_cierre a 24h si vienen en formato 12h (AM/PM) ---
  // Si la hora es "12:00" sin AM/PM, asume que es medianoche (00:00) si apertura >= 18:00, si no, es mediodía (12:00)
  function to24HourFormat(hora, aperturaRaw) {
    // Si ya es HH:mm en 24h, retorna igual
    if (/^\d{2}:\d{2}$/.test(hora)) return hora;
    // Si es HH:mm AM/PM o variantes
    const match = hora.match(/^(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)$/i);
    if (!match) return hora;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const ampm = match[3].toLowerCase();
    if (ampm.includes("p") && h !== 12) h += 12;
    if (ampm.includes("a") && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  let horaApertura24 = to24HourFormat(hora_apertura);
  let horaCierre24 = to24HourFormat(hora_cierre);

  // --- CORRIGE: Si hora_cierre es "12:00" sin AM/PM, decide si es medianoche (00:00) solo si apertura es >= 18:00 (6pm), si no, es mediodía (12:00)
  if (
    hora_cierre.trim() === "12:00" &&
    !/am|pm|a\.m\.|p\.m\./i.test(hora_cierre)
  ) {
    const [hA, mA] = horaApertura24.split(":").map(Number);
    if (hA >= 18) {
      horaCierre24 = "00:00"; // Usar 00:00 para representar medianoche
    } else {
      horaCierre24 = "12:00";
    }
  }

  // Imprime los valores clave para depuración
  console.log("DEBUG dias_disponibles:", dias_disponibles);
  console.log("DEBUG dias (array):", dias);
  console.log("DEBUG hora_apertura (raw):", hora_apertura, "->", horaApertura24);
  console.log("DEBUG hora_cierre (raw):", hora_cierre, "->", horaCierre24);
  console.log("DEBUG duracion_turno:", duracion_turno);

  // Validación extra: si hora_apertura >= hora_cierre y no cruza medianoche, no se puede generar horarios
  const [hA, mA] = horaApertura24.split(":").map(Number);
  const [hC, mC] = horaCierre24.split(":").map(Number);
  let rangoValido = false;
  if (
    isNaN(hA) || isNaN(mA) || isNaN(hC) || isNaN(mC) ||
    hA > 23 || hC > 23 || mA > 59 || mC > 59
  ) {
    console.error("Horario de apertura/cierre inválido: formato incorrecto.");
    return;
  }
  // Permitir rangos nocturnos (ej: 20:00 a 00:00 o 23:59)
  // Permitir también el caso apertura == cierre (un solo turno)
  if (hA < hC || (hA === hC && mA < mC)) {
    rangoValido = true;
  } else if (hA > hC || (hA === hC && mA > mC)) {
    rangoValido = true;
  } else if (hA === hC && mA === mC) {
    rangoValido = true; // Permitir un solo turno de una hora
  }
  if (!rangoValido) {
    console.error("Horario de apertura/cierre inválido: rango no permitido.");
    return;
  }

  if (!Array.isArray(dias) || dias.length === 0) {
    console.error("dias_disponibles inválido o vacío:", dias_disponibles);
    return;
  }
  const hoy = new Date();
  let totalDisponibilidades = 0;
  for (let d = 0; d < diasACrear; d++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + d);
    // DEBUG: imprime el día de la semana y la fecha
    console.log("DEBUG fecha:", fecha.toISOString().slice(0, 10), "getDay():", fecha.getDay(), "dias:", dias);
    if (!dias.includes(fecha.getDay())) {
      console.log("DEBUG: Día no coincide, se omite:", fecha.toISOString().slice(0, 10));
      continue;
    }
    for (const cancha of canchas.rows) {
      let [h, m] = horaApertura24.split(":").map(Number);
      // Si el rango cruza medianoche, generamos hasta 23:59 y luego desde 00:00 hasta hora_cierre del día siguiente
      if (hA > hC || (hA === hC && mA > mC)) {
        // Primera parte: desde apertura hasta 23:59
        while (h < 23 || (h === 23 && m < 59)) {
          const inicio = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          let finH = h, finM = m + duracion_turno;
          if (finM >= 60) {
            finH += Math.floor(finM / 60);
            finM = finM % 60;
          }
          if (finH > 23 || (finH === 23 && finM > 59)) break;
          const fin = `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
          // DEBUG: imprime cada intento de inserción
          console.log("DEBUG INSERT disponibilidad:", {
            cancha_id: cancha.id,
            fecha: fecha.toISOString().slice(0, 10),
            inicio,
            fin
          });
          try {
            const result = await pool.query(
              `INSERT INTO disponibilidades (cancha_id, fecha, hora_inicio, hora_fin, disponible)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT DO NOTHING
               RETURNING id`,
              [cancha.id, fecha.toISOString().slice(0, 10), inicio, fin, true]
            );
            if (result.rowCount > 0) totalDisponibilidades++;
          } catch (err) {
            console.error("Error insertando disponibilidad:", err, {
              cancha_id: cancha.id,
              fecha: fecha.toISOString().slice(0, 10),
              inicio,
              fin
            });
          }
          h = finH;
          m = finM;
        }
        // Segunda parte: desde 00:00 hasta hora_cierre del día siguiente
        let nextDate = new Date(fecha);
        nextDate.setDate(nextDate.getDate() + 1);
        let nh = 0, nm = 0;
        while (nh < hC || (nh === hC && nm < mC)) {
          const inicio = `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
          let finH = nh, finM = nm + duracion_turno;
          if (finM >= 60) {
            finH += Math.floor(finM / 60);
            finM = finM % 60;
          }
          if (finH > hC || (finH === hC && finM > mC)) break;
          const fin = `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
          try {
            await pool.query(
              `INSERT INTO disponibilidades (cancha_id, fecha, hora_inicio, hora_fin, disponible)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT DO NOTHING
               RETURNING id`,
              [cancha.id, nextDate.toISOString().slice(0, 10), inicio, fin, true]
            );
          } catch (err) {
            console.error("Error insertando disponibilidad:", err, {
              cancha_id: cancha.id,
              fecha: nextDate.toISOString().slice(0, 10),
              inicio,
              fin
            });
          }
          nh = finH;
          nm = finM;
        }
      } else if (hA === hC && mA === mC) {
        // Caso especial: apertura == cierre, un solo turno
        const inicio = `${String(hA).padStart(2, "0")}:${String(mA).padStart(2, "0")}`;
        let finH = hA, finM = mA + duracion_turno;
        if (finM >= 60) {
          finH += Math.floor(finM / 60);
          finM = finM % 60;
        }
        const fin = `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
        try {
          await pool.query(
            `INSERT INTO disponibilidades (cancha_id, fecha, hora_inicio, hora_fin, disponible)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING
             RETURNING id`,
            [cancha.id, fecha.toISOString().slice(0, 10), inicio, fin, true]
          );
        } catch (err) {
          console.error("Error insertando disponibilidad:", err, {
            cancha_id: cancha.id,
            fecha: fecha.toISOString().slice(0, 10),
            inicio,
            fin
          });
        }
      } else {
        // Rango normal (no cruza medianoche)
        while (h < hC || (h === hC && m < mC)) {
          const inicio = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          let finH = h, finM = m + duracion_turno;
          if (finM >= 60) {
            finH += Math.floor(finM / 60);
            finM = finM % 60;
          }
          if (finH > hC || (finH === hC && finM > mC)) break;
          const fin = `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
          // DEBUG: imprime cada intento de inserción
          console.log("DEBUG INSERT disponibilidad:", {
            cancha_id: cancha.id,
            fecha: fecha.toISOString().slice(0, 10),
            inicio,
            fin
          });
          try {
            const result = await pool.query(
              `INSERT INTO disponibilidades (cancha_id, fecha, hora_inicio, hora_fin, disponible)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT DO NOTHING
               RETURNING id`,
              [cancha.id, fecha.toISOString().slice(0, 10), inicio, fin, true]
            );
            if (result.rowCount > 0) totalDisponibilidades++;
          } catch (err) {
            console.error("Error insertando disponibilidad:", err, {
              cancha_id: cancha.id,
              fecha: fecha.toISOString().slice(0, 10),
              inicio,
              fin
            });
          }
          h = finH;
          m = finM;
        }
      }
    }
  }
  console.log(`Horarios generados para establecimiento ${establecimiento_id} (${canchas.rows.length} canchas). Disponibilidades insertadas: ${totalDisponibilidades}`);
};

// Al aprobar el establecimiento, genera horarios automáticamente (para validadores)
exports.aprobarEstablecimientoYGenerarHorarios = async (establecimiento_id) => {
  const pool = require("../db");
  // 1. Cambia estado a activo
  await pool.query(
    "UPDATE establecimientos SET estado = 'activo', motivo_rechazo = NULL WHERE id = $1",
    [establecimiento_id]
  );
  // Genera solo 15 días de horarios
  await exports.generarHorariosEstablecimientoDias(establecimiento_id, 15);
};
