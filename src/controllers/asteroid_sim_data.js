import { processingSimData } from "./processing_sim_data.js";

export const getAsteroidSimDataById = async (req, res) => {
    const { id } = req.params;
    const url = `https://komet-backend-phi.vercel.app/api/asteroids/${id}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const processedData = processingSimData(data);
        res.json(processedData);
    }
    catch (error) {
        console.error("❌ Error en getAsteroidSimDataById:", error.message);
        res.status(500).json({ error: "Error al obtener datos de simulación" });
    }
}
