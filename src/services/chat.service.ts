import { ChatRepository } from "../repositories/chat.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { ServiceProviderRepository } from "../repositories/serviceprovider.repository";
import { HttpError } from "../errors/http-error";
import { SendMessageDTO } from "../dtos/chat.dto";

export class ChatService {

    private chatRepo = new ChatRepository();        // ← moved inside class
    private bookingRepo = new BookingRepository();  // ← moved inside class
    private providerRepo = new ServiceProviderRepository(); // ← moved inside class

    private async resolveRole(
        bookingId: string,
        userId: string
    ): Promise<{ role: "user" | "provider"; partnerId: string }> {
        const booking = await this.bookingRepo.getBookingById(bookingId);
        if (!booking) throw new HttpError(404, "Booking not found");

        const bookingUserId =
            (booking.user_id as any)?._id?.toString() ?? booking.user_id?.toString();
        const bookingProviderId =
            (booking.provider_id as any)?._id?.toString() ?? booking.provider_id?.toString();

        if (bookingUserId === userId) {
            return { role: "user", partnerId: bookingProviderId };
        }

        const provider = await this.providerRepo.getProviderByUserId(userId);
        if (provider && provider._id.toString() === bookingProviderId) {
            return { role: "provider", partnerId: bookingUserId };
        }

        throw new HttpError(403, "You are not part of this booking");
    }

    async sendMessage(userId: string, dto: SendMessageDTO) {
        const { role } = await this.resolveRole(dto.booking_id, userId);
        return await this.chatRepo.createMessage({
            booking_id: dto.booking_id as any,
            sender_id: userId as any,
            sender_role: role,
            content: dto.content,
        });
    }

    async getMessages(userId: string, bookingId: string, page: number, size: number) {
        await this.resolveRole(bookingId, userId);
        return await this.chatRepo.getMessagesByBookingId(bookingId, page, size);
    }

    async markAsRead(userId: string, bookingId: string) {
        await this.resolveRole(bookingId, userId);
        await this.chatRepo.markAsRead(bookingId, userId);
    }

    async getUnreadCount(userId: string, bookingId: string) {
        await this.resolveRole(bookingId, userId);
        return await this.chatRepo.getUnreadCount(bookingId, userId);
    }
}