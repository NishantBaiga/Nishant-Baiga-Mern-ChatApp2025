import express from "express";
import { registerUser, loginUser, logoutUser, refreshToken, getUser } from "../controllers/auth.controller.js";
const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
// router.get("/refresh-token", refreshToken);
// router.get("/check-auth", getUser);
export default router;