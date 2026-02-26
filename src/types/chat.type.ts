import { z } from "zod";
import mongoose from "mongoose";

export const MessageSchema = z.object({
    booking_id: z.instanceof(mongoose.Types.ObjectId),
    sender_id: z.instanceof(mongoose.Types.ObjectId),
    sender_role: z.enum(["user", "provider"]),
    content: z.string().min(1),
    is_read: z.boolean().default(false),
});

export type MessageType = z.infer<typeof MessageSchema>;