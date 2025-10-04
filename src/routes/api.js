import { Router } from "express";
import { getAsteroids } from "../controllers/meteor.js";
const router = Router();

router.get("", (req, res) => {
  res.send("¡akjhskjhak!");
});

router.get("/asteroids", getAsteroids);
export default router;