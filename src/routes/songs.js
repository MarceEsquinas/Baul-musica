// api/src/routes/songs.js
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cambia_esta_clave_super_secreta";

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Token inválido o expirado" }); }
}

// GET /api/songs -> canciones del usuario
router.get("/", requireAuth, async (req, res) => {
  try {
    const q = `
      SELECT id_cancion, nombre_cancion, fecha_cancion
      FROM cancion
      WHERE id_usuario = $1
      ORDER BY id_cancion DESC`;
    const { rows } = await pool.query(q, [req.user.id_usuario]);
    res.json(rows);
  } catch (e) {
    console.error("GET /songs error:", e);
    res.status(500).json({ message: "Error obteniendo canciones" });
  }
});

// POST /api/songs -> crear canción
router.post("/", requireAuth, async (req, res) => {
  const { nombre_cancion, fecha_cancion } = req.body;
  if (!nombre_cancion || !nombre_cancion.trim()) {
    return res.status(400).json({ message: "El nombre de la canción es obligatorio" });
  }
  try {
    const q = `
      INSERT INTO cancion (id_usuario, nombre_cancion, fecha_cancion)
      VALUES ($1, $2, $3)
      RETURNING id_cancion, nombre_cancion, fecha_cancion`;
    const { rows } = await pool.query(q, [
      req.user.id_usuario,
      nombre_cancion.trim(),
      fecha_cancion || null,
    ]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /songs error:", e);
    res.status(500).json({ message: "No se pudo crear la canción" });
  }
});

export default router;
