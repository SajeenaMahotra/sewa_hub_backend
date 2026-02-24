import { BookingModel, IBooking } from "../models/booking.model";
import { BookingStatus } from "../types/booking.type";

export class BookingRepository {

    async createBooking(data: Partial<IBooking>): Promise<IBooking> {
        const booking = new BookingModel(data);
        return await booking.save();
    }

    async getBookingById(id: string): Promise<IBooking | null> {
        return await BookingModel.findById(id)
            .populate("user_id", "fullname email imageUrl")
            .populate({
                path: "provider_id",
                populate: { path: "Useruser_id", select: "fullname email imageUrl" },
            });
    }

    // Bookings made BY a customer
    async getBookingsByUserId(
        userId: string,
        page: number,
        size: number
    ): Promise<{ bookings: IBooking[]; total: number }> {
        const filter = { user_id: userId };
        const [bookings, total] = await Promise.all([
            BookingModel.find(filter)
                .populate({
                    path: "provider_id",
                    populate: { path: "Useruser_id", select: "fullname email imageUrl" },
                })
                .sort({ created_at: -1 })
                .skip((page - 1) * size)
                .limit(size),
            BookingModel.countDocuments(filter),
        ]);
        return { bookings, total };
    }

    // Bookings assigned TO a provider
    async getBookingsByProviderId(
        providerId: string,
        page: number,
        size: number
    ): Promise<{ bookings: IBooking[]; total: number }> {
        const filter = { provider_id: providerId };
        const [bookings, total] = await Promise.all([
            BookingModel.find(filter)
                .populate("user_id", "fullname email imageUrl")
                .sort({ created_at: -1 })
                .skip((page - 1) * size)
                .limit(size),
            BookingModel.countDocuments(filter),
        ]);
        return { bookings, total };
    }

    async updateStatus(id: string, status: BookingStatus): Promise<IBooking | null> {
        return await BookingModel.findByIdAndUpdate(
            id,
            { $set: { status } },
            { new: true }
        );
    }

    // Only cancel if booking belongs to user AND is still pending
    async cancelBooking(id: string, userId: string): Promise<IBooking | null> {
        return await BookingModel.findOneAndUpdate(
            { _id: id, user_id: userId, status: "pending" },
            { $set: { status: "cancelled" } },
            { new: true }
        );
    }
}
