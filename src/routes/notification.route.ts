import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const ctrl = new NotificationController();

router.use(authorizedMiddleware);

router.get("/",              ctrl.getMyNotifications); // GET  /notifications
router.patch("/read-all",   ctrl.markAllRead);         // PATCH /notifications/read-all
router.patch("/:id/read",   ctrl.markOneRead);         // PATCH /notifications/:id/read

export default router;