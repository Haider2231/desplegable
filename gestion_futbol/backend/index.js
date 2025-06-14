const express = require("express");
const cors = require('cors');
const path = require("path");
const app = express();
const fs = require("fs");
const PORT = process.env.PORT || 5000;

//app.use(cors({
//  origin: "http://localhost:5173",
//  credentials: true
//}));

app.use(cors({
  origin: [
    "https://canchassinteticas.site",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas organizadas
const authRoutes = require("./routes/authRoutes");
app.use("/auth", authRoutes);
app.use("/canchas", require("./routes/canchaRoutes"));
app.use("/reservas", require("./routes/reservaRoutes"));
app.use("/disponibilidades", require("./routes/disponibilidadRoutes"));
app.use("/estadisticas", require("./routes/estadisticasRoutes"));
app.get("/test-db", require("./controllers/testController"));
// Agrega la ruta de facturas
app.use("/facturas", require("./routes/facturaRoutes"));
app.use("/establecimientos", require("./routes/establecimientoRoutes"));

// Sirve archivos estáticos del build de React
app.use(express.static(path.join(__dirname, "..", "frontend", "dist")));


app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
});

app.use((err, req, res, next) => {
  console.error("Error no capturado:", err.stack || err);
  res.status(500).json({ error: "Error interno del servidor", detalle: err.message });
});

console.log("Conectando a la base de datos...");

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

// ADVERTENCIA: La carpeta /uploads NO debe perderse al redesplegar.
// Si usas un VPS, asegúrate de que /uploads es persistente.
// Si usas Railway/Heroku, considera usar S3 o Cloudinary para archivos subidos.
