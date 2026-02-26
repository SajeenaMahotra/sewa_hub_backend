import { IMessage } from "../models/message.model";

export class ChatRepository {
    private get model() {
        return require("../models/message.model").MessageModel;
    }

    async createMessage(data: Partial<IMessage>): Promise<IMessage> {
        const message = new this.model(data);
        return (await message.save()).populate("sender_id", "fullname email imageUrl");
    }

    async getMessagesByBookingId(
        bookingId: string,
        page: number,
        size: number
    ): Promise<{ messages: IMessage[]; total: number }> {
        const filter = { booking_id: bookingId };
        const [messages, total] = await Promise.all([
            this.model.find(filter)
                .populate("sender_id", "fullname email imageUrl")
                .sort({ created_at: -1 })
                .skip((page - 1) * size)
                .limit(size),
            this.model.countDocuments(filter),
        ]);
        return { messages: messages.reverse(), total };
    }

    async markAsRead(bookingId: string, recipientId: string): Promise<void> {
        await this.model.updateMany(
            { booking_id: bookingId, sender_id: { $ne: recipientId }, is_read: false },
            { $set: { is_read: true } }
        );
    }

    async getUnreadCount(bookingId: string, userId: string): Promise<number> {
        return this.model.countDocuments({
            booking_id: bookingId,
            sender_id: { $ne: userId },
            is_read: false,
        });
    }
}