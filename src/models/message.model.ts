import mongoose, { Document, Schema } from "mongoose";
import { MessageType } from "../types/chat.type";

const MessageSchema: Schema = new Schema<MessageType>(
    {
        booking_id: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            index: true,
        },
        sender_id: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sender_role: {
            type: String,
            enum: ["user", "provider"],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        is_read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

export interface IMessage extends MessageType, Document {
    _id: mongoose.Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

export const MessageModel = mongoose.model<IMessage>("Message", MessageSchema);