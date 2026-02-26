import { z } from "zod";
import mongoose from "mongoose";

export const SEVERITY_MULTIPLIERS = {
    normal: 1.0,
    emergency: 1.4,
    urgent: 1.8,
} as const;

export type BookingSeverity = keyof typeof SEVERITY_MULTIPLIERS;

export const BookingSchema = z.object({
    user_id: z.instanceof(mongoose.Types.ObjectId),
    provider_id: z.instanceof(mongoose.Types.ObjectId),
    scheduled_at: z.date(),
    address: z.string().min(1),
    note: z.string().optional(),
    price_per_hour: z.number().min(0),          // base price 
    severity: z.enum(["normal", "emergency", "urgent"]).default("normal"),
    effective_price_per_hour: z.number().min(0), // base × multiplier
    status: z.enum(["pending", "accepted", "rejected", "completed", "cancelled"]).default("pending"),
});

export type BookingType = z.infer<typeof BookingSchema>;
export type BookingStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";