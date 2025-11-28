// api/db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",          // "db" en Docker, "localhost" fuera
  database: process.env.DB_NAME || "BaulDeLaMusica",
  password: process.env.DB_PASSWORD || "postgre1234",
  port: process.env.DB_PORT || 5432,
});

export default pool;

// db.js
/*import { Pool } from "pg";
//import pkg from "pg";
//const { Pool }=pkg

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "postgre1234",
  database: "BaulDeLaMusica",
  max: 10,
  idleTimeoutMillis: 10000
});

pool.on("error", (err) => {
  console.error("PG pool error:", err);
});

export default pool;*/
