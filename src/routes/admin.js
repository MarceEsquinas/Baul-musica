import express from "express";
import pool from "../db.js";
import requireAuth from "../middleware/requireAuth.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();

/* 
   GET /api/admin/users
   Lista todos los usuarios
 */
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const q = `
      SELECT id_usuario, nombre, apellidos, correo, rol
      FROM usuario
      ORDER BY id_usuario ASC
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error obteniendo usuarios" });
  }
});

/* 
   DELETE /api/admin/users/:id
 */
router.delete("/users/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    await pool.query("DELETE FROM usuario WHERE id_usuario = $1", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "No se pudo borrar el usuario" });
  }
});

/* 
   GET /api/admin/reviews
 */
router.get("/reviews", requireAdmin, async (req, res) => {
  try {
    const q = `
      SELECT r.id_resenia, r.puntuacion, r.mejor_musico, r.fecha_hora,
             u.nombre AS usuario,
             el.id_elemento_lista
      FROM resenia r
      JOIN usuario u ON u.id_usuario = r.id_usuario
      JOIN elemento_lista el ON el.id_elemento_lista = r.id_elemento_lista
      ORDER BY r.fecha_hora DESC
    `;
    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error obteniendo reseñas" });
  }
});

/* 
   DELETE /api/admin/reviews/:id
 */
router.delete("/reviews/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    await pool.query("DELETE FROM resenia WHERE id_resenia = $1", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: "No se pudo borrar la reseña" });
  }
});

export default router;
