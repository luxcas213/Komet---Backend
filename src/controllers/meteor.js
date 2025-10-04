import { fetchAsteroids } from "../services/getdata.js";

export const getAsteroids = async (req, res) => {
  try {
    const data = await fetchAsteroids();
    res.json(data);
  } catch (error) {
    console.error("❌ Error en getAsteroids:", error.message);
    res.status(500).json({ error: "Error al obtener datos de NASA" });
  }
};