const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Puedes usar una variable global temporal para usuarios pendientes
const usuariosPendientes = {};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "diazmontejodiegoalejandro@gmail.com",
    pass: "mpcnakbsmmhalwak",
  },
});

// Guardar tokens de recuperación temporalmente (en producción usar DB)
const resetTokens = {};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (result.rowCount === 0) {
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });
    }
    const user = result.rows[0];
    if (!user.verificado) {
      return res.status(401).json({ error: "Debes verificar tu cuenta antes de iniciar sesión" });
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Correo o contraseña incorrectos" });
    }
    // Incluye nombre y email en el payload
    const token = jwt.sign(
      { userId: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      "miclaveultrasecreta",
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

exports.registerUser = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    // Verifica si el usuario ya existe y está verificado
    const userExist = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1 AND verificado = true",
      [email]
    );
    if (userExist.rowCount > 0) {
      return res.status(400).json({ error: "El usuario con ese correo ya existe y está verificado" });
    }
    // Si ya se había intentado registrar pero no se verificó, reenvía el código
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000);
    const hashedPassword = await bcrypt.hash(password, 10);

    usuariosPendientes[email] = {
      nombre,
      email,
      password: hashedPassword,
      rol,
      codigoVerificacion,
    };

    await transporter.sendMail({
      from: "diazmontejodiegoalejandro@gmail.com",
      to: email,
      subject: "Código de verificación",
      text: `Tu nuevo código de verificación es: ${codigoVerificacion}`,
    });

    res.status(200).json({ message: "Código reenviado. Verifica tu cuenta para activarla." });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el usuario" });
  }
};

exports.verifyUser = async (req, res) => {
  const { email, codigo } = req.body;
  try {
    const datosPendientes = usuariosPendientes[email];
    console.log("Verificando:", { email, codigo, esperado: datosPendientes?.codigoVerificacion });
    if (!datosPendientes || datosPendientes.codigoVerificacion !== parseInt(codigo)) {
      return res.status(400).json({ error: "Código incorrecto o usuario no encontrado" });
    }
    // Guardar usuario ahora sí en la base de datos
    const insertResult = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, verificado, codigo_verificacion)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [datosPendientes.nombre, datosPendientes.email, datosPendientes.password, datosPendientes.rol, true, datosPendientes.codigoVerificacion]
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

    res.status(200).json({ mensaje: "Cuenta verificada correctamente", token });
  } catch (error) {
    res.status(500).json({ error: "Error al verificar el usuario" });
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
      "SELECT id, nombre, email, rol FROM usuarios WHERE verificado = true ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Crear usuario (solo admin)
exports.createUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body;
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await require("../db").query(
      "INSERT INTO usuarios (nombre, email, password, rol, verificado) VALUES ($1, $2, $3, $4, true) RETURNING id, nombre, email, rol",
      [nombre, email, hashedPassword, rol]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
};

// Actualizar usuario (solo admin)
exports.updateUsuario = async (req, res) => {
  const { nombre, email, rol } = req.body;
  const { id } = req.params;
  if (!nombre || !email || !rol) {
    return res.status(400).json({ error: "Faltan datos requeridos" });
  }
  try {
    const result = await require("../db").query(
      "UPDATE usuarios SET nombre=$1, email=$2, rol=$3 WHERE id=$4 RETURNING id, nombre, email, rol",
      [nombre, email, rol, id]
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
