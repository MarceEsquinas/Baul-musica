// api/src/routes/playlists.js
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";


const router = express.Router();
const JWT_SECRET = "cambia_esta_clave_super_secreta"; // usa .env en prod

// Auth router
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET); // { id_usuario, nombre, rol }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

// GET /api/playlists -> listas del usuario con recuento de elementos
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.id_usuario;

  try {
    const q = `
      SELECT l.id_lista,
             l.nombre_lista,
             l.creada_en,
             COALESCE(COUNT(el.id_elemento_lista), 0) AS num_elementos
      FROM lista l
      LEFT JOIN elemento_lista el ON el.id_lista = l.id_lista
      WHERE l.id_usuario = $1
      GROUP BY l.id_lista
      ORDER BY l.creada_en DESC NULLS LAST, l.id_lista DESC;
    `;
    const { rows } = await pool.query(q, [userId]);
    res.json(rows);
  } catch (e) {
    console.error("GET /playlists error:", e);
    res.status(500).json({ message: "Error obteniendo playlists" });
  }
});

export default router;
