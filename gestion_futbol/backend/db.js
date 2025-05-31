// db.js
const { Pool } = require('pg');
require('dotenv').config();

console.log("DATABASE_URL:", process.env.DATABASE_URL); // <-- agrega esto

let pool;

if (process.env.DATABASE_URL) {
  // En Render usaremos la URL completa y SSL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // En local seguimos con el host, puerto, usuario, etc.
  pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

// Probar conexión
pool.connect()
  .then(() => console.log('🟢 Conexión exitosa a PostgreSQL'))
  .catch(err => console.error('🔴 Error conectando a PostgreSQL:', err));

module.exports = pool;
