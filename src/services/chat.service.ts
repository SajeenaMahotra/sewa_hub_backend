import { ChatRepository } from "../repositories/chat.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { ServiceProviderRepository } from "../repositories/serviceprovider.repository";
import { HttpError } from "../errors/http-error";
import { SendMessageDTO } from "../dtos/chat.dto";

export class ChatService {

    private chatRepo = new ChatRepository();        // ← moved inside class
    private bookingRepo = new BookingRepository();  // ← moved inside class
    private providerRepo = new ServiceProviderRepository(); // ← moved inside class

    private async resolveRole(bookingId: string, userId: string) {
    const booking = await this.bookingRepo.getBookingById(bookingId);
    if (!booking) throw new HttpError(404, "Booking not found");

    const bookingUserId =
        (booking.user_id as any)?._id?.toString() ?? booking.user_id?.toString();
    const bookingProviderId =
        (booking.provider_id as any)?._id?.toString() ?? booking.provider_id?.toString();

    const userIdStr = userId.toString(); // ← ADD THIS

    console.log("resolveRole:", { bookingUserId, bookingProviderId, userIdStr });

    if (bookingUserId === userIdStr) {  // ← use userIdStr
        return { role: "user" as const, partnerId: bookingProviderId };
    }

    const provider = await this.providerRepo.getProviderByUserId(userIdStr);
    if (provider && provider._id.toString() === bookingProviderId) {
        return { role: "provider" as const, partnerId: bookingUserId };
    }

    throw new HttpError(403, "You are not part of this booking");
}
    async sendMessage(userId: string, dto: SendMessageDTO) {
    const userIdStr = userId.toString(); // ← ADD
    const { role } = await this.resolveRole(dto.booking_id, userIdStr);
    return await this.chatRepo.createMessage({
        booking_id: dto.booking_id as any,
        sender_id: userIdStr as any,  // ← use userIdStr
        sender_role: role,
        content: dto.content,
    });
}

async getMessages(userId: string, bookingId: string, page: number, size: number) {
    await this.resolveRole(bookingId, userId.toString()); // ← .toString()
    return await this.chatRepo.getMessagesByBookingId(bookingId, page, size);
}

async markAsRead(userId: string, bookingId: string) {
    await this.resolveRole(bookingId, userId.toString()); // ← .toString()
    await this.chatRepo.markAsRead(bookingId, userId.toString());
}

async getUnreadCount(userId: string, bookingId: string) {
    await this.resolveRole(bookingId, userId.toString()); // ← .toString()
    return await this.chatRepo.getUnreadCount(bookingId, userId.toString());
}
}