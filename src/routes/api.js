import { Router } from "express";
import { getAsteroids,getAsteroidById } from "../controllers/meteor.js";
import { getAirburst, getDirectImpact, getEarthState } from "../controllers/geo.js";

const router = Router();

router.get("", (req, res) => {
  res.send("api api api!");
});

router.get("/asteroids", getAsteroids);
router.get("/asteroids/:id", getAsteroidById);
router.get("/airburst", getAirburst);
router.get("/directimpact", getDirectImpact);
router.get("/earth-state", getEarthState);

export default router;