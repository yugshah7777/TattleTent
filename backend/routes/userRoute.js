import express from "express"
import { getUsers } from "../controllers/userControllers.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/search', protect, adminOnly, getUsers);

export default router;
