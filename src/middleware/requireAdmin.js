import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cambia_esta_clave_super_secreta";

const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token requerido" });
  }

  const token = auth.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.rol !== "admin") {
      return res.status(403).json({ message: "Acceso denegado (solo admin)" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export default requireAdmin;
