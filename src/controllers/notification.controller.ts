import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";

export class NotificationController {

    async getMyNotifications(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const page = parseInt(req.query.page as string) || 1;
            const size = parseInt(req.query.size as string) || 20;

            const result = await notificationService.getMyNotifications(userId, page, size);
            return res.status(200).json({ success: true, data: result });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async markAllRead(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
            await notificationService.markAllRead(userId);
            return res.status(200).json({ success: true, message: "All notifications marked as read" });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async markOneRead(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
            const updated = await notificationService.markOneRead(req.params.id as string, userId);
            return res.status(200).json({ success: true, data: updated });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}