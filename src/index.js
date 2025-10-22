// index.js
import express from "express";
import cors from "cors";
import pool from "./db.js"; // conexión centralizada

const app = express();

app.use(cors({                                             //le damos permiso para que se conecte con local host
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:5173"],
  credentials: false,
}));
app.use(express.json());

const frases = [
  "No te rindas nunca",
  "Al mal tiempo buena cara",
  "Donde las dan, las toman"
]
var contador = 0

function getFrase() {
  if (contador >= frases.length - 1) {
    contador = 0
  }
  contador++
  return frases[contador]
}

// Healthcheck / raíz
app.get("/", (_req, res) => {
  res.json({ frase: getFrase()});
});

// Ejemplo: listar usuarios (usa tu tabla 'usuario')
app.get("/api/usuarios", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id_usuario, nombre, apellidos, dni, correo, rol FROM usuario ORDER BY id_usuario DESC"
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error consultando usuarios" });
  }
});

const PORT = process.env.PORT || 2000;

(async () => {
  try {
    await pool.query("SELECT 1"); // prueba la BD antes de levantar
    console.log("BD conectada ✅");
    app.listen(PORT, () => {
      console.log(`Servidor listo en http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error("No se pudo conectar a la BD:", e);
    process.exit(1);
  }
})();