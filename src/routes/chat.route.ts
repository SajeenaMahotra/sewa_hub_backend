import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const chatController = new ChatController();

router.use(authorizedMiddleware);

router.post("/", chatController.sendMessage);                         // REST fallback: send message
router.get("/:bookingId", chatController.getMessages);                // paginated message history
router.patch("/:bookingId/read", chatController.markAsRead);          // mark as read
router.get("/:bookingId/unread", chatController.getUnreadCount);      // unread badge count

export default router;