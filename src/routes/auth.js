import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "cambia_esta_clave_super_secreta";
router.get("/health", (req, res) => {
  res.json({ ok: true, route: "/api/auth/health" });
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) Buscar usuario por correo
    const result = await pool.query(
      "SELECT id_usuario, nombre, rol, password FROM usuario WHERE correo = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    // 2) Comparar contraseña
   // const ok = await bcrypt.compare(password, user.password);
   const ok = password === user.password;
    if (!ok) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    // 3) Generar token
    const token = jwt.sign(
      { id_usuario: user.id_usuario, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 4) Responder
    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;


/*// api/src/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pkg from "pg";
import pool from "../db.js";
const { Pool } = pkg;

//const router = express.Router();

//  Ajusta estos valores o usa variables de entorno
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "BaulDeLaMusica",
  password: "postgre1234",
  port: 5432,
});

const router = express.Router();
//const JWT_SECRET = "clave_secreta_segura"; // cámbiala por una segura

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1) Buscar usuario por correo
    const result = await pool.query(
      "SELECT * FROM usuario WHERE correo = $1",
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    // 2) Validar contraseña (hash en BD)
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Contraseña incorrecta" });

    // 3) Generar token
    const token = jwt.sign(
      { id_usuario: user.id_usuario, nombre: user.nombre, rol: user.rol },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 4) Responder
    res.json({
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

export default router;
*/