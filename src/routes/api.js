import { Router } from "express";
import { getAsteroids,getAsteroidById } from "../controllers/meteor.js";
import { getAirburst, getDirectImpact } from "../controllers/geo.js";
import { runSimulation, simulationResults, getSimulationQueue } from "../controllers/simulation.js";

const router = Router();

router.get("", (req, res) => {
  res.send("api api api!");
});

router.get("/asteroids", getAsteroids);
router.get("/asteroids/:id", getAsteroidById);
router.get("/airburst", getAirburst);
router.get("/directimpact", getDirectImpact);

// Simulation endpoints
router.post("/runsimulation", runSimulation);
router.get("/simulationresults", simulationResults);
router.get("/simulationqueue", getSimulationQueue); // Bonus endpoint for debugging

export default router;