import { BookingRepository } from "../repositories/booking.repository";
import { ServiceProviderRepository } from "../repositories/serviceprovider.repository";
import { HttpError } from "../errors/http-error";
import { CreateBookingDTO } from "../dtos/booking.dto";
import { SEVERITY_MULTIPLIERS, BookingSeverity } from "../types/booking.type";

const bookingRepo = new BookingRepository();
const providerRepo = new ServiceProviderRepository();

export class BookingService {

    async createBooking(userId: string, data: CreateBookingDTO) {
        const provider = await providerRepo.getProviderById(data.provider_id);
        if (!provider) throw new HttpError(404, "Provider not found");

        // Prevent provider booking themselves
        const providerUserId = (provider.Useruser_id as any)?._id?.toString()
            ?? provider.Useruser_id?.toString();
        if (providerUserId === userId) {
            throw new HttpError(400, "You cannot book yourself");
        }

        const severity = (data.severity ?? "normal") as BookingSeverity;
        const multiplier = SEVERITY_MULTIPLIERS[severity];
        const basePrice = provider.price_per_hour;
        const effectivePrice = parseFloat((basePrice * multiplier).toFixed(2));

        return await bookingRepo.createBooking({
            user_id: userId as any,
            provider_id: data.provider_id as any,
            scheduled_at: new Date(data.scheduled_at),
            address: data.address,
            note: data.note,
            price_per_hour: basePrice,           // base rate — never changes
            severity,
            effective_price_per_hour: effectivePrice, // what the customer pays per hour
            status: "pending",
        });
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

        // Verify requester is the provider for this booking
        const provider = await providerRepo.getProviderByUserId(userId);
        const bookingProviderId = (booking.provider_id as any)?._id?.toString()
            ?? booking.provider_id?.toString();

        if (!provider || provider._id.toString() !== bookingProviderId) {
            throw new HttpError(403, "Only the provider can update booking status");
        }

        return await bookingRepo.updateStatus(bookingId, status as any);
    }

    async cancelBooking(bookingId: string, userId: string) {
        const cancelled = await bookingRepo.cancelBooking(bookingId, userId);
        if (!cancelled) throw new HttpError(400, "Cannot cancel this booking. It may already be accepted or not yours.");
        return cancelled;
    }

    async getBookingById(bookingId: string) {
        const booking = await bookingRepo.getBookingById(bookingId);
        if (!booking) throw new HttpError(404, "Booking not found");
        return booking;
    }
}