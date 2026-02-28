import { BookingRepository } from "../repositories/booking.repository";
import { ServiceProviderRepository } from "../repositories/serviceprovider.repository";
import { HttpError } from "../errors/http-error";
import { CreateBookingDTO } from "../dtos/booking.dto";
import { SEVERITY_MULTIPLIERS, BookingSeverity } from "../types/booking.type";
import { notificationService } from "./notification.service";

const bookingRepo  = new BookingRepository();
const providerRepo = new ServiceProviderRepository();

export class BookingService {

    async createBooking(userId: string, data: CreateBookingDTO) {
        const provider = await providerRepo.getProviderById(data.provider_id);
        if (!provider) throw new HttpError(404, "Provider not found");

        const providerUserId = (provider.Useruser_id as any)?._id?.toString()
            ?? provider.Useruser_id?.toString();
        if (providerUserId === userId) {
            throw new HttpError(400, "You cannot book yourself");
        }

        const severity       = (data.severity ?? "normal") as BookingSeverity;
        const multiplier     = SEVERITY_MULTIPLIERS[severity];
        const basePrice      = provider.price_per_hour;
        const effectivePrice = parseFloat((basePrice * multiplier).toFixed(2));

        const booking = await bookingRepo.createBooking({
            user_id:                userId as any,
            provider_id:            data.provider_id as any,
            scheduled_at:           new Date(data.scheduled_at),
            address:                data.address,
            note:                   data.note,
            phone_number:           data.phone_number,           // ← new
            price_per_hour:         basePrice,
            severity,
            effective_price_per_hour: effectivePrice,
            status:                 "pending",
        });

        if (providerUserId) {
            const formattedDate = new Date(data.scheduled_at).toLocaleString("en-US", {
                timeZone: "Asia/Kathmandu",
                dateStyle: "medium",
                timeStyle: "short",
            });

            await notificationService.notify({
                recipient_id: providerUserId,
                type:         "booking_created",
                title:        "New Booking Request",
                message:      `You have a new ${severity} booking request scheduled for ${formattedDate} at ${data.address}.`,
                booking_id:   booking._id.toString(),
            });
        }

        return booking;
    }

    async getMyBookings(userId: string, page: number, size: number) {
        return await bookingRepo.getBookingsByUserId(userId, page, size);
    }

    async getProviderBookings(userId: string, page: number, size: number) {
        const provider = await providerRepo.getProviderByUserId(userId);
        if (!provider) throw new HttpError(404, "Provider profile not found");
        return await bookingRepo.getBookingsByProviderId(provider._id.toString(), page, size);
    }

    async updateBookingStatus(bookingId: string, userId: string, status: string) {
        const booking = await bookingRepo.getBookingById(bookingId);
        if (!booking) throw new HttpError(404, "Booking not found");

        const provider          = await providerRepo.getProviderByUserId(userId);
        const bookingProviderId = (booking.provider_id as any)?._id?.toString()
            ?? booking.provider_id?.toString();

        if (!provider || provider._id.toString() !== bookingProviderId) {
            throw new HttpError(403, "Only the provider can update booking status");
        }

        const updated = await bookingRepo.updateStatus(bookingId, status as any);

        const customerUserId = (booking.user_id as any)?._id?.toString()
            ?? booking.user_id?.toString();

        const titleMap: Record<string, string> = {
            accepted:  "Booking Accepted ✅",
            rejected:  "Booking Rejected ❌",
            completed: "Booking Completed 🎉",
        };

        await notificationService.notify({
            recipient_id: customerUserId,
            type:         `booking_${status}` as any,
            title:        titleMap[status] ?? "Booking Updated",
            message:      `Your booking has been ${status}.`,
            booking_id:   bookingId,
        });

        return updated;
    }

    async cancelBooking(bookingId: string, userId: string) {
        const cancelled = await bookingRepo.cancelBooking(bookingId, userId);
        if (!cancelled) throw new HttpError(400, "Cannot cancel this booking. It may already be accepted or not yours.");

        const booking        = await bookingRepo.getBookingById(bookingId);
        const providerUserId = (booking?.provider_id as any)?.Useruser_id?._id?.toString();
        if (providerUserId) {
            await notificationService.notify({
                recipient_id: providerUserId,
                type:         "booking_cancelled",
                title:        "Booking Cancelled",
                message:      "A customer has cancelled their pending booking.",
                booking_id:   bookingId,
            });
        }

        return cancelled;
    }

    async getBookingById(bookingId: string) {
        const booking = await bookingRepo.getBookingById(bookingId);
        if (!booking) throw new HttpError(404, "Booking not found");
        return booking;
    }
}