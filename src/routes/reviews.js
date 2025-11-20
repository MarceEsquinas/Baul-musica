// api/src/routes/reviews.js
import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

/* 
   POST /api/reviews
   Crear una reseña (puntuación + mejor miembro)
*/
router.post("/", requireAuth, async (req, res) => {
  const { id_elemento_lista, puntuacion, mejor_musico } = req.body;
  const id_usuario = req.user.id_usuario;

  if (!id_elemento_lista || !puntuacion) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  if (puntuacion < 1 || puntuacion > 5) {
    return res.status(400).json({ message: "La puntuación debe ser entre 1 y 5" });
  }

  try {
    // Validar que el elemento existe
    const check = await pool.query(
      "SELECT 1 FROM elemento_lista WHERE id_elemento_lista = $1",
      [id_elemento_lista]
    );
    if (check.rowCount === 0) {
      return res.status(404).json({ message: "Elemento no encontrado" });
    }

    // Insertar reseña
    const insert = await pool.query(
      `
      INSERT INTO resenia (id_usuario, id_elemento_lista, puntuacion, mejor_musico)
      VALUES ($1, $2, $3, $4)
      RETURNING id_resenia, fecha_hora
      `,
      [id_usuario, id_elemento_lista, puntuacion, mejor_musico || null]
    );

    res.status(201).json({
      message: "Reseña creada correctamente",
      reseña: insert.rows[0]
    });
  } catch (err) {
    console.error("POST /reviews error:", err);
    res.status(500).json({ message: "Error al crear la reseña" });
  }
});

/* 
   GET /api/reviews/element/:id_elemento_lista
   Obtener reseñas + media para un elemento de lista
*/
router.get("/element/:id", requireAuth, async (req, res) => {
  const idElemento = parseInt(req.params.id, 10);

  try {
    // Media + total
    const stats = await pool.query(
      `
      SELECT 
        AVG(puntuacion)::numeric(10,2) AS media,
        COUNT(*) AS total
      FROM resenia
      WHERE id_elemento_lista = $1
      `,
      [idElemento]
    );

    // Listado simple de reseñas
    const list = await pool.query(
      `
      SELECT 
        r.id_resenia,
        r.puntuacion,
        r.mejor_musico,
        r.fecha_hora,
        u.nombre AS usuario
      FROM resenia r
      JOIN usuario u ON u.id_usuario = r.id_usuario
      WHERE r.id_elemento_lista = $1
      ORDER BY r.fecha_hora DESC
      `,
      [idElemento]
    );

    res.json({
      media: stats.rows[0].media || 0,
      total: stats.rows[0].total || 0,
      reseñas: list.rows
    });

  } catch (err) {
    console.error("GET /reviews/element/:id error:", err);
    res.status(500).json({ message: "Error obteniendo reseñas" });
  }
});


export default router;
