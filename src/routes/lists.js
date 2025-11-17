// api/src/routes/lists.js
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cambia_esta_clave_super_secreta";

// middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Token requerido" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}

//get:lista todos los elementos de las canciones y albums en una lista.
router.get("/:id_lista/items", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);

  try {
    // Verificar que la lista pertenece al usuario
    const ownList = await pool.query(
      "SELECT 1 FROM lista WHERE id_lista = $1 AND id_usuario = $2",
      [idLista, req.user.id_usuario]
    );
    if (ownList.rowCount === 0) {
      return res.status(404).json({ message: "Lista no encontrada" });
    }

    const q = `
      SELECT 
        el.id_elemento_lista,
        el.id_album,
        el.id_cancion,
        a.nombre_album,
        c.nombre_cancion
      FROM elemento_lista el
      LEFT JOIN album a ON a.id_album = el.id_album
      LEFT JOIN cancion c ON c.id_cancion = el.id_cancion
      WHERE el.id_lista = $1 AND el.id_usuario = $2
      ORDER BY el.id_elemento_lista DESC
    `;

    const { rows } = await pool.query(q, [idLista, req.user.id_usuario]);
    res.json(rows);
  } catch (e) {
    console.error("GET /lists/:id_lista/items error:", e);
    res.status(500).json({ message: "Error obteniendo items de la lista" });
  }
});

// post:añade elementos a una lista
router.post("/:id_lista/items", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);
  const { tipo, id_album, id_cancion } = req.body;

  // Validar
  if (!tipo || (tipo !== "album" && tipo !== "cancion")) {
    return res.status(400).json({ message: "Tipo inválido" });
  }

  try {
    // Verificar que la lista pertenece al usuario
    const ownList = await pool.query(
      "SELECT 1 FROM lista WHERE id_lista = $1 AND id_usuario = $2",
      [idLista, req.user.id_usuario]
    );
    if (ownList.rowCount === 0) {
      return res.status(404).json({ message: "Lista no encontrada" });
    }

    // Si añade álbum
    if (tipo === "album") {
      const albumCheck = await pool.query(
        "SELECT 1 FROM album WHERE id_album = $1 AND id_usuario = $2",
        [id_album, req.user.id_usuario]
      );
      if (albumCheck.rowCount === 0) {
        return res.status(404).json({ message: "Álbum no encontrado" });
      }

      await pool.query(
        `INSERT INTO elemento_lista (id_usuario, id_album, id_lista)
         VALUES ($1, $2, $3)`,
        [req.user.id_usuario, id_album, idLista]
      );

      return res.status(201).json({ ok: true });
    }

    // Si añade canción
    if (tipo === "cancion") {
      const songCheck = await pool.query(
        "SELECT 1 FROM cancion WHERE id_cancion = $1 AND id_usuario = $2",
        [id_cancion, req.user.id_usuario]
      );
      if (songCheck.rowCount === 0) {
        return res.status(404).json({ message: "Canción no encontrada" });
      }

      await pool.query(
        `INSERT INTO elemento_lista (id_usuario, id_cancion, id_lista)
         VALUES ($1, $2, $3)`,
        [req.user.id_usuario, id_cancion, idLista]
      );

      return res.status(201).json({ ok: true });
    }
  } catch (e) {
    console.error("POST /lists/:id_lista/items error:", e);
    res.status(500).json({ message: "No se pudo añadir a la lista" });
  }
});

// delete: eliminar lista
router.delete("/:id_lista/items/:id_elemento_lista", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);
  const idItem = parseInt(req.params.id_elemento_lista, 10);

  try {
    const del = await pool.query(
      "DELETE FROM elemento_lista WHERE id_elemento_lista = $1 AND id_lista = $2 AND id_usuario = $3",
      [idItem, idLista, req.user.id_usuario]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Elemento no encontrado" });
    }

    res.status(204).send();
  } catch (e) {
    console.error("DELETE lista:item error:", e);
    res.status(500).json({ message: "No se pudo eliminar el elemento" });
  }
});

export default router;
