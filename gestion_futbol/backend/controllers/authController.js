const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Usa node-fetch solo si fetch no existe globalmente
let fetchFn = global.fetch;
if (!fetchFn) {
  fetchFn = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "diazmontejodiegoalejandro@gmail.com",
    pass: "mpcnakbsmmhalwak",
  },
});

// Guardar tokens de recuperación temporalmente (en producción usar DB)
const resetTokens = {};

// Asegúrate de definir usuariosPendientes ANTES de usarlo en cualquier función
// Guardamos también la expiración del código de verificación (30 minutos)
const usuariosPendientes = {};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("[LOGIN][INICIO]", { email });
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      console.error("[LOGIN] Usuario no encontrado:", email);
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });
    }
    const user = result.rows[0];
    if (!user.verificado) {
      console.error("[LOGIN] Usuario no verificado:", email);
      return res.status(401).json({ error: "Debes verificar tu cuenta antes de iniciar sesión" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.error("[LOGIN] Contraseña incorrecta:", email);
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });
    }
    const token = jwt.sign(
      { userId: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      "miclaveultrasecreta",
      { expiresIn: "1h" }
    );
    console.log("[LOGIN] Usuario autenticado:", email);
    res.json({ token });
  } catch (error) {
    console.error("[LOGIN] Error al iniciar sesión:", error, error.stack);
    res.status(500).json({ error: "Error al iniciar sesión", detalle: error.message, stack: error.stack });
  }
};

exports.registerUser = async (req, res) => {
  const { nombre, email, password, rol, captcha, telefono } = req.body;
  console.log("[REGISTER][INICIO]", { nombre, email, rol, telefono, captcha: !!captcha });
  if (!nombre || !email || !password || !rol || !telefono) {
    console.error("[REGISTER] Faltan datos requeridos", { nombre, email, password, rol, telefono });
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  if (!captcha) {
    console.error("[REGISTER] Captcha requerido");
    return res.status(400).json({ error: "Captcha requerido" });
  }
  const allowedDomains = [
    "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "upc.edu.co", "edu.co","unipiloto.edu.co","upiloto.edu.co"
  ];
  const emailParts = email.split("@");
  if (
    emailParts.length !== 2 ||
    !allowedDomains.some(domain => emailParts[1].toLowerCase().endsWith(domain))
  ) {
    console.error("[REGISTER] Dominio de correo no permitido:", email);
    return res.status(400).json({ error: "Debes registrar un correo válido y real (gmail, hotmail, outlook, yahoo, icloud, live, institucional, etc)." });
  }
  try {
    const secret = "6Lez21ArAAAAADY_nTN924-sB4CpIh_Ic92MIxIK";
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${captcha}`;
    // Usa fetchFn en vez de fetch
    const captchaRes = await fetchFn(verifyUrl, { method: "POST" });
    const captchaData = await captchaRes.json();
    console.log("[REGISTER][CAPTCHA]", captchaData);
    if (!captchaData.success) {
      console.error("[REGISTER] Captcha inválido:", captchaData);
      return res.status(400).json({ error: "Captcha inválido, inténtalo de nuevo." });
    }
    const userExist = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1 AND verificado = true",
      [email]
    );
    if (userExist.rowCount > 0) {
      console.error("[REGISTER] Usuario ya existe y está verificado:", email);
      return res.status(400).json({ error: "El usuario con ese correo ya existe y está verificado" });
    }
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await bcrypt.hash(password, 10);

    // --- VALIDACIÓN: Elimina usuarios pendientes con el mismo correo para evitar conflicto de clave única ---
    await pool.query("DELETE FROM usuarios WHERE email = $1 AND verificado = false", [email]);

    usuariosPendientes[email] = {
      nombre,
      email,
      password: hashedPassword,
      rol,
      telefono,
      codigoVerificacion,
      // Guardar expiración: 30 minutos desde ahora
      expires: Date.now() + 1000 * 60 * 30
    };

    await transporter.sendMail({
      from: "diazmontejodiegoalejandro@gmail.com",
      to: email,
      subject: "Código de verificación",
      text: `Tu nuevo código de verificación es: ${codigoVerificacion}`,
    });

    console.log("[REGISTER] Usuario pendiente creado y correo enviado:", email);
    res.status(200).json({ message: "Código reenviado. Verifica tu cuenta para activarla." });
  } catch (error) {
    // Log detallado para depuración
    console.error("[REGISTER] Error en registerUser:", error, error.stack);
    // Devuelve el stack y el mensaje real al frontend para depuración
    res.status(500).json({ error: "Error al registrar el usuario", detalle: error.message, stack: error.stack });
  }
};

exports.verifyUser = async (req, res) => {
  const { email, codigo } = req.body;
  console.log("[VERIFY][INICIO]", { email, codigo });
  try {
    const datosPendientes = usuariosPendientes[email];
    console.log("[VERIFY][PENDIENTE]", datosPendientes);
    // Verifica expiración del código (30 minutos)
    if (!datosPendientes || datosPendientes.codigoVerificacion !== parseInt(codigo) || !datosPendientes.expires || datosPendientes.expires < Date.now()) {
      return res.status(400).json({ error: "Código incorrecto, usuario no encontrado o código expirado (válido por 30 minutos)" });
    }
    // Guardar usuario ahora sí en la base de datos
    const insertResult = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, verificado, codigo_verificacion, telefono)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [datosPendientes.nombre, datosPendientes.email, datosPendientes.password, datosPendientes.rol, true, datosPendientes.codigoVerificacion, datosPendientes.telefono]
    );
    // Eliminar de pendientes
    delete usuariosPendientes[email];

    // Generar token con los datos del usuario recién registrado
    const userId = insertResult.rows[0].id;
    const token = jwt.sign(
      {
        userId,
        nombre: datosPendientes.nombre,
        email: datosPendientes.email,
        rol: datosPendientes.rol,
      },
      "miclaveultrasecreta",
      { expiresIn: "1h" }
    );

    console.log("[VERIFY] Usuario verificado y creado:", email);
    res.status(200).json({ mensaje: "Cuenta verificada correctamente", token });
  } catch (error) {
    console.error("[VERIFY] Error al verificar usuario:", error, error.stack);
    res.status(500).json({ error: "Error al verificar el usuario", detalle: error.message, stack: error.stack });
  }
};

// Enviar enlace de recuperación
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requerido" });
  try {
    const userResult = await pool.query("SELECT * FROM usuarios WHERE email = $1 AND verificado = true", [email]);
    if (userResult.rowCount === 0) {
      return res.status(400).json({ error: "No existe usuario con ese correo" });
    }
    // Generar token único y guardar temporalmente
    const token = crypto.randomBytes(32).toString("hex");
    resetTokens[token] = { email, expires: Date.now() + 1000 * 60 * 30 }; // 30 minutos
  
    const resetLink = `https://canchassinteticas.site/reset-password?token=${token}`;
    await transporter.sendMail({
      from: "diazmontejodiegoalejandro@gmail.com",
      to: email,
      subject: "Restablece tu contraseña",
      text: `Haz clic en el siguiente enlace para restablecer tu contraseña:\n${resetLink}\n\nEste enlace expira en 30 minutos.`,
    });

    res.json({ message: "Enlace de recuperación enviado al correo." });
  } catch (error) {
    res.status(500).json({ error: "Error al enviar el correo de recuperación" });
  }
};

// Restablecer contraseña usando el token
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Datos incompletos" });
  const data = resetTokens[token];
  if (!data || data.expires < Date.now()) {
    return res.status(400).json({ error: "Enlace inválido o expirado" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query("UPDATE usuarios SET password = $1 WHERE email = $2", [hashedPassword, data.email]);
    delete resetTokens[token];
    res.json({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al restablecer la contraseña" });
  }
};

exports.checkEmailExists = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requerido" });
  try {
    const result = await pool.query("SELECT 1 FROM usuarios WHERE email = $1 AND verificado = true", [email]);
    if (result.rowCount > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al verificar el correo" });
  }
};

// Obtener todos los usuarios (solo admin)
exports.getUsuarios = async (req, res) => {
  try {
    const result = await require("../db").query(
      "SELECT id, nombre, email, rol, telefono FROM usuarios WHERE verificado = true ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};


// Crear usuario (solo admin)
exports.createUsuario = async (req, res) => {
  const { nombre, email, password, rol, telefono } = req.body;
  if (!nombre || !email || !password || !rol || !telefono) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await require("../db").query(
      "INSERT INTO usuarios (nombre, email, password, rol, telefono, verificado) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, nombre, email, rol, telefono",
      [nombre, email, hashedPassword, rol, telefono]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
};



// Actualizar usuario (solo admin)
exports.updateUsuario = async (req, res) => {
  const { nombre, email, rol, telefono } = req.body;
  const { id } = req.params;
  if (!nombre || !email || !rol || !telefono) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const result = await require("../db").query(
      "UPDATE usuarios SET nombre=$1, email=$2, rol=$3, telefono=$4 WHERE id=$5 RETURNING id, nombre, email, rol, telefono",
      [nombre, email, rol, telefono, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// Eliminar usuario (solo admin)
exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    // Obtiene el email del usuario a borrar
    const userRes = await require("../db").query("SELECT email FROM usuarios WHERE id=$1", [id]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const email = userRes.rows[0].email;
    if (email === "haidermessi1369@gmail.com") {
      return res.status(403).json({ error: "No puedes borrar el administrador general." });
    }
    await require("../db").query("DELETE FROM usuarios WHERE id=$1", [id]);
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

exports.getPropietarios = async (req, res) => {
  try {
    const result = await require("../db").query(
      "SELECT id, nombre FROM usuarios WHERE rol = $1 AND verificado = true ORDER BY nombre",
      ["propietario"]
    );
    res.json(result.rows); // [{ nombre: "Propietario 1" }, ...]
  } catch (err) {
    res.status(500).json({ error: "Error al obtener propietarios" });
  }
};

exports.getUsuarioById = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await require("../db").query(
      "SELECT id, nombre, telefono FROM usuarios WHERE id = $1",
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuario" });
  }
};
