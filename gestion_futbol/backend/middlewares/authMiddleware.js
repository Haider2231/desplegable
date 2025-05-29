const jwt = require("jsonwebtoken");

function verificarToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ error: "Token no proporcionado" });
  }
  jwt.verify(token.split(" ")[1], "miclaveultrasecreta", (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token inválido" });
    }
    req.user = decoded;
    next();
  });
}

function verificarRol(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ error: "No autenticado o sin rol" });
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}

module.exports = { verificarToken, verificarRol };
