import express from "express";
import cors from "cors";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import playListRoutes from "./routes/playList.js";
import songsRoutes from "./routes/songs.js";
import albumsRoutes from "./routes/albums.js";
import listsRoutes from "./routes/lists.js";
import ReviewsRoutes from "./routes/reviews.js";


const app = express();

// CORS: permite Vite en localhost y 127.0.0.1
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173 , http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true,
  })
);

app.use(express.json());

// Rutas API
app.use("/api/reviews", ReviewsRoutes);
app.use("/api/lists",listsRoutes)
app.use("/api/songs", songsRoutes);
app.use("/api/albums", albumsRoutes);
app.use("/api/playList", playListRoutes)
app.use("/api/auth", authRoutes);


// Healthcheck opcional
app.get("/", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 2000;

(async () => {
  try {
    await pool.query("SELECT 1"); // prueba BD
    console.log("BD conectada ✅");
    app.listen(PORT, () =>
      console.log(`Servidor listo en http://localhost:${PORT}`)
    );
  } catch (e) {
    console.error("No se pudo conectar a la BD:", e);
    process.exit(1);
  }
})();
