import { z } from "zod";
import mongoose from "mongoose";

export const NotificationSchema = z.object({
    recipient_id: z.instanceof(mongoose.Types.ObjectId), // user who receives it
    type: z.enum([
        "booking_created",       // → provider gets this
        "booking_accepted",      // → customer gets this
        "booking_rejected",      // → customer gets this
        "booking_completed",     // → customer gets this
        "booking_cancelled",     // → provider gets this
    ]),
    title: z.string(),
    message: z.string(),
    booking_id: z.instanceof(mongoose.Types.ObjectId).optional(),
    is_read: z.boolean().default(false),
});

export type NotificationType = z.infer<typeof NotificationSchema>;