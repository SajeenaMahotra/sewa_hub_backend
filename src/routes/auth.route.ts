import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";
import { uploads } from "../middlewares/upload.middleware";
import passport from "../config/passport";

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

router.post(
    "/send-reset-password-email",
    authController.requestPasswordChange
)

router.post("/request-password-reset", authController.requestPasswordChange);
router.post("/reset-password/:token", authController.resetPassword);
router.delete("/delete-account", authorizedMiddleware, authController.deleteAccount);


// Pass role (user/provider) via state param: /auth/google?role=provider
router.get("/google", (req, res, next) => {
    const role = req.query.role === "provider" ? "provider" : "user";
    passport.authenticate("google", {
        scope: ["profile", "email"],
        state: role,          // forwarded to strategy via req.query.state
        session: false,
    })(req, res, next);
});

router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/api/auth/google/error" }),
    authController.googleCallback
);

router.get("/google/error", (req, res) => {
    res.status(401).json({ success: false, message: "Google authentication failed" });
});

// --- Change password (logged in) ---
router.post("/change-password", authorizedMiddleware, authController.changePassword);
export default router;