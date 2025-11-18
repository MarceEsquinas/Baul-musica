// api/src/routes/playlists.js
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cambia_esta_clave_super_secreta";


router.delete("/:id", requireAuth, async (req, res) => {
  const userId = req.user.id_usuario;
  const idLista = parseInt(req.params.id, 10);
  if (Number.isNaN(idLista)) {
    return res.status(400).json({ message: "ID de lista inválido" });
  }

  try {
    // Solo borrar si la lista pertenece al usuario
    const del = await pool.query(
      "DELETE FROM lista WHERE id_lista = $1 AND id_usuario = $2 RETURNING id_lista",
      [idLista, userId]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Lista no encontrada" });
    }

    // elemento_lista se borra por ON DELETE CASCADE
    return res.status(204).send(); // sin contenido
  } catch (e) {
    console.error("DELETE /playlists/:id error:", e);
    return res.status(500).json({ message: "No se pudo borrar la lista" });
  }
});




// Middleware de autenticación
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contiene id_usuario, nombre, rol
    next();
  } catch (e) {
    console.error("JWT error:", e.name, e.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

//  GET /api/playlists → obtener listas del usuario
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
    res.status(500).json({ message: "Error obteniendo las listas" });
  }
});

//  POST /api/playlists → crear nueva lista
router.post("/", requireAuth, async (req, res) => {
  const userId = req.user.id_usuario;
  const { nombre_lista } = req.body;

  if (!nombre_lista || !nombre_lista.trim()) {
    return res
      .status(400)
      .json({ message: "El nombre de la lista es obligatorio" });
  }

  try {
    const insert = await pool.query(
      `INSERT INTO lista (id_usuario, nombre_lista)
       VALUES ($1, $2)
       RETURNING id_lista, nombre_lista, creada_en`,
      [userId, nombre_lista.trim()]
    );

    const nueva = { ...insert.rows[0], num_elementos: 0 };
    res.status(201).json(nueva);
  } catch (e) {
    console.error("POST /playlists error:", e);
    res.status(500).json({ message: "No se pudo crear la lista" });
  }
});

export default router;

