import mongoose, { Document, Schema } from "mongoose";
import { BookingType } from "../types/booking.type";

const BookingSchema: Schema = new Schema<BookingType>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    provider_id: {
        type: Schema.Types.ObjectId,
        ref: "ServiceProvider",
        required: true,
    },
    scheduled_at: {
        type: Date,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    note: {
        type: String,
    },
    phone_number: {
        type: String,
        required: true,                         // ← new
    },
    price_per_hour: {
        type: Number,
        required: true,
    },
    severity: {
        type: String,
        enum: ["normal", "emergency", "urgent"],
        default: "normal",
        required: true,
    },
    effective_price_per_hour: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
        default: "pending",
    },
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

export interface IBooking extends BookingType, Document {
    _id: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);