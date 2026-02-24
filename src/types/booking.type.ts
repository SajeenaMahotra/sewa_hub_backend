import { z } from "zod";
import mongoose from "mongoose";

export const BookingSchema = z.object({
    user_id: z.instanceof(mongoose.Types.ObjectId),
    provider_id: z.instanceof(mongoose.Types.ObjectId),
    scheduled_at: z.date(),
    address: z.string().min(1),
    note: z.string().optional(),
    price_per_hour: z.number().min(0),
    status: z.enum(["pending", "accepted", "rejected", "completed", "cancelled"]).default("pending"),
});

export type BookingType = z.infer<typeof BookingSchema>;
export type BookingStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";