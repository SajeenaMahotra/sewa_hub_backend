import { Request, Response } from "express";
import { ChatService } from "../services/chat.service";
import { SendMessageDTO, GetMessagesDTO } from "../dtos/chat.dto";
import z from "zod";

export class ChatController {
    private chatService = new ChatService();

    async sendMessage(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = SendMessageDTO.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });

            const message = await this.chatService.sendMessage(userId, parsed.data); // ← this.
            return res.status(201).json({ success: true, data: message });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }

    async getMessages(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const bookingId = req.params["bookingId"] as string;
            const parsed = GetMessagesDTO.safeParse(req.query);
            if (!parsed.success)
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });

            const { page, size } = parsed.data;
            const { messages, total } = await this.chatService.getMessages(userId, bookingId, page, size); // ← this.
            return res.status(200).json({ success: true, data: { messages, total, page, size } });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }

    async markAsRead(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const bookingId = req.params["bookingId"] as string;
            await this.chatService.markAsRead(userId, bookingId); // ← this.
            return res.status(200).json({ success: true, message: "Messages marked as read" });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }

    async getUnreadCount(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const bookingId = req.params["bookingId"] as string;
            const count = await this.chatService.getUnreadCount(userId, bookingId); // ← this.
            return res.status(200).json({ success: true, data: { unread: count } });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }
}