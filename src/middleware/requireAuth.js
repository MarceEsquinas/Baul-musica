import jwt from "jsonwebtoken";

// La MISMA clave que en auth.js
const JWT_SECRET = process.env.JWT_SECRET || "cambia_esta_clave_super_secreta";

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const token = header.slice(7); // quita "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // tenemos el id_usuario, nombre, rol...
    next();
  } catch (err) {
    console.error("JWT ERROR:", err.message);
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export default requireAuth;
