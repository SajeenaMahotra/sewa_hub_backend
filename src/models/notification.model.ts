import mongoose, { Document, Schema } from "mongoose";
import { NotificationType } from "../types/notification.type";

const NotificationSchema: Schema = new Schema<NotificationType>(
    {
        recipient_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        type: {
            type: String,
            enum: ["booking_created", "booking_accepted", "booking_rejected", "booking_completed", "booking_cancelled"],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        booking_id: { type: Schema.Types.ObjectId, ref: "Booking" },
        is_read: { type: Boolean, default: false },
    },
    { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export interface INotification extends NotificationType, Document {
    _id: mongoose.Types.ObjectId;
    created_at: Date;
}

export const NotificationModel = mongoose.model<INotification>("Notification", NotificationSchema);