import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import apiroutes from "./routes/api.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", apiroutes);


// Rutas principales
app.get("/", (_, res) => {
    res.send("¡Bienvenido a la API de Komet!");
});
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

