import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploads } from "../middlewares/upload.middleware";

let authController = new AuthController();
const router = Router();

router.post("/register", authController.register)
router.post("/login", authController.login)

router.get("/whoami", authorizedMiddleware, authController.getProfile);

router.put(
    "/update-profile",
    authorizedMiddleware,
    uploads.single("image"), // "image" - field name from frontend/client
    authController.updateProfile
)

// router.post(
//     "/send-reset-password-email",
//     authController.requestPasswordChange
// )
export default router;