const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres", // Cambia por tu usuario de postgres
  host: "localhost",
  database: "gestion_canchas", // Cambia por tu base de datos
  password: "root",    // Cambia por tu contraseña
  port: 5432,
});

async function insertarUsuarios() {
  const passwordPlano = "test1234";
  const passwordHash = await bcrypt.hash(passwordPlano, 10);

  for (let i = 1; i <= 50; i++) {
    // Nombres y apellidos de ejemplo
    const nombres = ["Juan", "Ana", "Pedro", "Luisa", "Carlos", "Sofia", "Miguel", "Laura", "Diego", "Valentina", "Andres", "Camila", "Jorge", "Daniela", "Oscar", "Paula", "Felipe", "Maria", "David", "Sara"];
    const apellidos = ["Gomez", "Martinez", "Rodriguez", "Lopez", "Perez", "Garcia", "Morales", "Torres", "Ramirez", "Vargas", "Castro", "Ruiz", "Jimenez", "Mendez", "Herrera", "Silva", "Cruz", "Ortega", "Rojas", "Navarro"];
    const nombre = `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;
    const email = `usuario${i}_${nombre.toLowerCase().replace(/ /g, ".")}@test.com`;
    const rol = "usuario";
    try {
      await pool.query(
        `INSERT INTO usuarios (nombre, email, password, rol, verificado)
         VALUES ($1, $2, $3, $4, $5)`,
        [nombre, email, passwordHash, rol, true]
      );
      console.log(`Insertado: ${email}`);
    } catch (err) {
      console.error(`Error insertando ${email}:`, err.message);
    }
  }
  await pool.end();
  console.log("Inserción terminada.");
}

insertarUsuarios();
