// api/src/routes/albums.js
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

// GET /api/albums -> álbumes del usuario
router.get("/", requireAuth, async (req, res) => {
  try {
    const q = `
      SELECT a.id_album, a.nombre_album, a.genero, a.fecha
      FROM album a
      WHERE a.id_usuario = $1
      ORDER BY a.id_album DESC`;
    const { rows } = await pool.query(q, [req.user.id_usuario]);
    res.json(rows);
  } catch (e) {
    console.error("GET /albums error:", e);
    res.status(500).json({ message: "Error obteniendo álbumes" });
  }
});

// POST /api/albums -> crear álbum
router.post("/", requireAuth, async (req, res) => {
  const { nombre_album, genero, fecha } = req.body;
  if (!nombre_album || !nombre_album.trim() || !genero || !genero.trim()) {
    return res.status(400).json({ message: "Nombre y género son obligatorios" });
  }
  try {
    const q = `
      INSERT INTO album (id_usuario, nombre_album, genero, fecha)
      VALUES ($1, $2, $3, $4)
      RETURNING id_album, nombre_album, genero, fecha`;
    const { rows } = await pool.query(q, [
      req.user.id_usuario,
      nombre_album.trim(),
      genero.trim(),
      fecha || null,
    ]);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error("POST /albums error:", e);
    res.status(500).json({ message: "No se pudo crear el álbum" });
  }
});

// POST /api/albums/:id_album/songs -> asociar canción a álbum
router.post("/:id_album/songs", requireAuth, async (req, res) => {
  const idAlbum = parseInt(req.params.id_album, 10);
  const { id_cancion, genero } = req.body;
  if (Number.isNaN(idAlbum) || !id_cancion) {
    return res.status(400).json({ message: "Datos inválidos" });
  }
  try {
    // validaciones: álbum y canción del mismo usuario
    const [alb, song] = await Promise.all([
      pool.query("SELECT 1 FROM album WHERE id_album=$1 AND id_usuario=$2", [idAlbum, req.user.id_usuario]),
      pool.query("SELECT 1 FROM cancion WHERE id_cancion=$1 AND id_usuario=$2", [id_cancion, req.user.id_usuario]),
    ]);
    if (alb.rowCount === 0 || song.rowCount === 0) {
      return res.status(404).json({ message: "Álbum o canción no encontrados" });
    }

    await pool.query(
      `INSERT INTO album_detalle (id_album, id_cancion, genero)
       VALUES ($1, $2, $3)`,
      [idAlbum, id_cancion, genero || null]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ message: "Esa canción ya está en el álbum" });
    }
    console.error("POST /albums/:id_album/songs error:", e);
    res.status(500).json({ message: "No se pudo asociar la canción" });
  }
});

// GET /api/albums/:id_album/songs -> listar canciones de un álbum
router.get("/:id_album/songs", requireAuth, async (req, res) => {
  const idAlbum = parseInt(req.params.id_album, 10);
  if (Number.isNaN(idAlbum)) return res.status(400).json({ message: "ID inválido" });
  try {
    // verificar propiedad del álbum
    const own = await pool.query("SELECT 1 FROM album WHERE id_album=$1 AND id_usuario=$2", [idAlbum, req.user.id_usuario]);
    if (own.rowCount === 0) return res.status(404).json({ message: "Álbum no encontrado" });

    const q = `
      SELECT c.id_cancion, c.nombre_cancion, c.fecha_cancion, ad.genero
      FROM album_detalle ad
      JOIN cancion c ON c.id_cancion = ad.id_cancion
      WHERE ad.id_album = $1
      ORDER BY c.id_cancion DESC`;
    const { rows } = await pool.query(q, [idAlbum]);
    res.json(rows);
  } catch (e) {
    console.error("GET /albums/:id_album/songs error:", e);
    res.status(500).json({ message: "Error obteniendo canciones del álbum" });
  }
});

// DELETE /api/albums/:id_album/songs/:id_cancion -> quitar canción del álbum
router.delete("/:id_album/songs/:id_cancion", requireAuth, async (req, res) => {
  const idAlbum = parseInt(req.params.id_album, 10);
  const idCancion = parseInt(req.params.id_cancion, 10);
  if (Number.isNaN(idAlbum) || Number.isNaN(idCancion)) {
    return res.status(400).json({ message: "IDs inválidos" });
  }
  try {
    // verificar que el álbum es del usuario
    const own = await pool.query("SELECT 1 FROM album WHERE id_album=$1 AND id_usuario=$2", [idAlbum, req.user.id_usuario]);
    if (own.rowCount === 0) return res.status(404).json({ message: "Álbum no encontrado" });

    await pool.query("DELETE FROM album_detalle WHERE id_album=$1 AND id_cancion=$2", [idAlbum, idCancion]);
    res.status(204).send();
  } catch (e) {
    console.error("DELETE /albums/:id_album/songs/:id_cancion error:", e);
    res.status(500).json({ message: "No se pudo quitar la canción" });
  }
});

export default router;
