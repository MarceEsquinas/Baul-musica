// api/src/routes/lists.js
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cambia_esta_clave_super_secreta";

// ---------- middleware auth ----------
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    console.error("JWT ERROR:", e.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}
// GET /api/lists/public  -> listas públicas de todos los usuarios (solo logueados)

router.get("/public", requireAuth, async (req, res) => {
  try {
    const q = `
      SELECT 
        l.id_lista,
        l.nombre_lista,
        l.creada_en,
        l.es_publica,
        u.nombre AS nombre_usuario,
        u.apellidos AS apellidos_usuario,
        COUNT(el.id_elemento_lista) AS num_elementos
      FROM lista l
      JOIN usuario u ON u.id_usuario = l.id_usuario
      LEFT JOIN elemento_lista el ON el.id_lista = l.id_lista
      WHERE l.es_publica = true
      GROUP BY l.id_lista, u.nombre, u.apellidos
      ORDER BY l.creada_en DESC;
    `;

    const { rows } = await pool.query(q);
    res.json(rows);
  } catch (e) {
    console.error("GET /lists/public error:", e);
    res.status(500).json({ message: "Error obteniendo listas públicas" });
  }
});
// ---------- GET /api/lists/:id_lista (info de la lista) ----------
router.get("/:id_lista", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);
  console.log("GET /api/lists/:id_lista →", idLista, "user", req.user.id_usuario);

  try {
    const { rows } = await pool.query(
      "SELECT id_lista, nombre_lista, creada_en FROM lista WHERE id_lista = $1 AND id_usuario = $2",
      [idLista, req.user.id_usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Lista no encontrada" });
    }

    return res.json(rows[0]);
  } catch (e) {
    console.error("GET /lists/:id_lista error:", e);
    return res.status(500).json({ message: "Error obteniendo la lista" });
  }
});
// PATCH /api/lists/:id_lista/public  -> marcar lista pública/privada
router.patch("/:id_lista/public", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);
  const { es_publica } = req.body; // true o false

  if (typeof es_publica !== "boolean") {
    return res.status(400).json({ message: "es_publica debe ser true o false" });
  }

  try {
    // solo el dueño puede cambiar esto
    const upd = await pool.query(
      `
      UPDATE lista
      SET es_publica = $1
      WHERE id_lista = $2 AND id_usuario = $3
      RETURNING id_lista, nombre_lista, es_publica
      `,
      [es_publica, idLista, req.user.id_usuario]
    );

    if (upd.rowCount === 0) {
      return res.status(404).json({ message: "Lista no encontrada" });
    }

    res.json(upd.rows[0]);
  } catch (e) {
    console.error("PATCH /lists/:id_lista/public error:", e);
    res.status(500).json({ message: "No se pudo actualizar la visibilidad" });
  }
});



// ---------- GET /api/lists/:id_lista/items (elementos de la lista) ----------
router.get("/:id_lista/items", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);
  console.log("GET /api/lists/:id_lista/items →", idLista, "user", req.user.id_usuario);

  try {
    const { rows } = await pool.query(
      `
      SELECT 
        el.id_elemento_lista,
        el.id_album,
        el.id_cancion,
        a.nombre_album,
        c.nombre_cancion
      FROM elemento_lista el
      LEFT JOIN album a   ON a.id_album   = el.id_album
      LEFT JOIN cancion c ON c.id_cancion = el.id_cancion
      WHERE el.id_lista = $1 AND el.id_usuario = $2
      ORDER BY el.id_elemento_lista DESC
      `,
      [idLista, req.user.id_usuario]
    );

    return res.json(rows);
  } catch (e) {
    console.error("GET /lists/:id_lista/items error:", e);
    return res.status(500).json({ message: "Error obteniendo items de la lista" });
  }
});

// ---------- POST /api/lists/:id_lista/items (añadir álbum/canción) ----------
router.post("/:id_lista/items", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);
  const { tipo, id_album, id_cancion } = req.body;

  console.log("POST /api/lists/:id_lista/items →", { idLista, tipo, id_album, id_cancion });

  if (!tipo || (tipo !== "album" && tipo !== "cancion")) {
    return res.status(400).json({ message: "Tipo inválido" });
  }

  try {
    // comprobar que la lista es del usuario
    const ownList = await pool.query(
      "SELECT 1 FROM lista WHERE id_lista = $1 AND id_usuario = $2",
      [idLista, req.user.id_usuario]
    );
    if (ownList.rowCount === 0) {
      return res.status(404).json({ message: "Lista no encontrada" });
    }

    if (tipo === "album") {
      const albumCheck = await pool.query(
        "SELECT 1 FROM album WHERE id_album = $1 AND id_usuario = $2",
        [id_album, req.user.id_usuario]
      );
      if (albumCheck.rowCount === 0) {
        return res.status(404).json({ message: "Álbum no encontrado" });
      }

      await pool.query(
        "INSERT INTO elemento_lista (id_usuario, id_album, id_lista) VALUES ($1, $2, $3)",
        [req.user.id_usuario, id_album, idLista]
      );

      return res.status(201).json({ ok: true });
    }

    if (tipo === "cancion") {
      const songCheck = await pool.query(
        "SELECT 1 FROM cancion WHERE id_cancion = $1 AND id_usuario = $2",
        [id_cancion, req.user.id_usuario]
      );
      if (songCheck.rowCount === 0) {
        return res.status(404).json({ message: "Canción no encontrada" });
      }

      await pool.query(
        "INSERT INTO elemento_lista (id_usuario, id_cancion, id_lista) VALUES ($1, $2, $3)",
        [req.user.id_usuario, id_cancion, idLista]
      );

      return res.status(201).json({ ok: true });
    }
  } catch (e) {
    console.error("POST /lists/:id_lista/items error:", e);
    return res.status(500).json({ message: "No se pudo añadir a la lista" });
  }
});

// ---------- DELETE /api/lists/:id_lista/items/:id_elemento_lista ----------
router.delete("/:id_lista/items/:id_elemento_lista", requireAuth, async (req, res) => {
  const idLista = parseInt(req.params.id_lista, 10);
  const idItem  = parseInt(req.params.id_elemento_lista, 10);

  console.log("DELETE /api/lists/:id_lista/items/:id_elemento →", { idLista, idItem });

  try {
    const del = await pool.query(
      "DELETE FROM elemento_lista WHERE id_elemento_lista = $1 AND id_lista = $2 AND id_usuario = $3",
      [idItem, idLista, req.user.id_usuario]
    );

    if (del.rowCount === 0) {
      return res.status(404).json({ message: "Elemento no encontrado" });
    }

    return res.status(204).send();
  } catch (e) {
    console.error("DELETE lista:item error:", e);
    return res.status(500).json({ message: "No se pudo eliminar el elemento" });
  }
});

export default router;

