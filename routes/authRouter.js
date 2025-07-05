import express from "express";
import authController from "../controllers/authControllers.js";
import authenticate from "../middleware/authenticate.js";
import upload from "../middleware/upload.js";

const authRouter = express.Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authenticate, authController.logout);
authRouter.get("/current", authenticate, authController.getCurrent);
authRouter.patch("/avatars", authenticate, upload.single("avatar"), authController.updateAvatar);

export default authRouter;
