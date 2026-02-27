import { NotificationModel, INotification } from "../models/notification.model";

export class NotificationRepository {
    async create(data: Partial<INotification>): Promise<INotification> {
        return await NotificationModel.create(data);
    }

    async getByRecipient(
        recipientId: string,
        page: number,
        size: number
    ): Promise<{ notifications: INotification[]; total: number; unread: number }> {
        const filter = { recipient_id: recipientId };
        const [notifications, total, unread] = await Promise.all([
            NotificationModel.find(filter)
                .sort({ created_at: -1 })
                .skip((page - 1) * size)
                .limit(size),
            NotificationModel.countDocuments(filter),
            NotificationModel.countDocuments({ ...filter, is_read: false }),
        ]);
        return { notifications, total, unread };
    }

    async markAllRead(recipientId: string): Promise<void> {
        await NotificationModel.updateMany(
            { recipient_id: recipientId, is_read: false },
            { $set: { is_read: true } }
        );
    }

    async markOneRead(id: string, recipientId: string): Promise<INotification | null> {
        return await NotificationModel.findOneAndUpdate(
            { _id: id, recipient_id: recipientId },
            { $set: { is_read: true } },
            { new: true }
        );
    }
}