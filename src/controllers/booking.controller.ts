import { Request, Response } from "express";
import { BookingService } from "../services/booking.service";
import { CreateBookingDTO, UpdateBookingStatusDTO } from "../dtos/booking.dto";
import z from "zod";

const bookingService = new BookingService();

export class BookingController {

    async createBooking(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const parsed = CreateBookingDTO.safeParse(req.body);
            if (!parsed.success) return res.status(400).json({
                success: false,
                message: z.prettifyError(parsed.error),
            });

            const booking = await bookingService.createBooking(userId, parsed.data);
            return res.status(201).json({
                success: true,
                message: "Booking request sent successfully",
                data: booking,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }

    async getMyBookings(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const page = parseInt(req.query.page as string) || 1;
            const size = parseInt(req.query.size as string) || 10;

            const { bookings, total } = await bookingService.getMyBookings(userId, page, size);
            return res.status(200).json({ success: true, data: { bookings, total, page, size } });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }

    async getProviderBookings(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const page = parseInt(req.query.page as string) || 1;
            const size = parseInt(req.query.size as string) || 10;

            const { bookings, total } = await bookingService.getProviderBookings(userId, page, size);
            return res.status(200).json({ success: true, data: { bookings, total, page, size } });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }

    async updateStatus(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const bookingId = req.params["id"] as string;
            const parsed = UpdateBookingStatusDTO.safeParse(req.body);
            if (!parsed.success) return res.status(400).json({
                success: false,
                message: z.prettifyError(parsed.error),
            });

            const updated = await bookingService.updateBookingStatus(bookingId, userId, parsed.data.status);
            return res.status(200).json({
                success: true,
                message: `Booking ${parsed.data.status}`,
                data: updated,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }

    async cancelBooking(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const bookingId = req.params["id"] as string;
            const cancelled = await bookingService.cancelBooking(bookingId, userId);
            return res.status(200).json({ success: true, message: "Booking cancelled", data: cancelled });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }
}