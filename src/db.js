// db.js
import { Pool } from "pg";

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

export default pool;
