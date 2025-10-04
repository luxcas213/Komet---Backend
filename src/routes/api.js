import { Router } from "express";
import { getAsteroids,getAsteroidById } from "../controllers/meteor.js";
const router = Router();

router.get("", (req, res) => {
  res.send("api api api!");
});

router.get("/asteroids", getAsteroids);
router.get("/asteroids/:id", getAsteroidById);
export default router;