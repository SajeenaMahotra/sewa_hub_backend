import { NotificationRepository } from "../repositories/notification.repository";
import { socketService } from "./socket.service";
import mongoose from "mongoose";

const notifRepo = new NotificationRepository();

interface CreateNotifParams {
    recipient_id: string;
    type: string;
    title: string;
    message: string;
    booking_id?: string;
}

export class NotificationService {

    // Central method — saves to DB + emits real-time if user is online
    async notify(params: CreateNotifParams) {
        const notif = await notifRepo.create({
            recipient_id: new mongoose.Types.ObjectId(params.recipient_id),
            type: params.type as any,
            title: params.title,
            message: params.message,
            booking_id: params.booking_id
                ? new mongoose.Types.ObjectId(params.booking_id)
                : undefined,
        });

        socketService.sendToUser(params.recipient_id, "notification", notif);
        return notif;
    }

    async getMyNotifications(userId: string, page: number, size: number) {
        return await notifRepo.getByRecipient(userId, page, size);
    }

    async markAllRead(userId: string) {
        return await notifRepo.markAllRead(userId);
    }

    async markOneRead(notifId: string, userId: string) {
        return await notifRepo.markOneRead(notifId, userId);
    }
}

export const notificationService = new NotificationService();