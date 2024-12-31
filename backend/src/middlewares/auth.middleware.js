import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UserModel from "../models/user.model.js";
dotenv.config();

export const protectedRoute = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const { userId } = jwt.verify(
            accessToken,
            process.env.JWT_ACCESS_TOKEN_SECRET
        );

        const user = await UserModel.findById(userId).select("-password");
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Error in protectedRoute: ", error);
        res.status(500).json({ error: error.message });
    }
};
