import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const chatController = new ChatController();

router.use(authorizedMiddleware);

router.post("/", (req, res) => chatController.sendMessage(req, res));
router.get("/:bookingId", (req, res) => chatController.getMessages(req, res));
router.patch("/:bookingId/read", (req, res) => chatController.markAsRead(req, res));
router.get("/:bookingId/unread", (req, res) => chatController.getUnreadCount(req, res));

export default router;