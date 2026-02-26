import mongoose, { Document, Schema } from "mongoose";

export interface IServiceProvider extends Document {
    experience_years: number;
    is_verified: number;       // 0 = unverified, 1 = verified
    rating: number;
    bio?: string;
    phone?: string;
    address?: string;
    imageUrl?: string;
    Useruser_id: mongoose.Types.ObjectId;
    ServiceCategorycatgeory_id: mongoose.Types.ObjectId;
    price_per_hour: number;
    ratingCount: number;
    created_at: Date;
}

const ServiceProviderSchema = new Schema<IServiceProvider>(
    {
        experience_years: {
            type: Number,
            required: true,
            min: 0,
            max: 50,
        },
        is_verified: {
            type: Number,
            default: 0,         // admin sets to 1 after verification
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        bio: {
            type: String,
        },
        phone: {
            type: String,
        },
        address: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
        Useruser_id: {
            type: Schema.Types.ObjectId,
            ref: "User",        // must match your User model name
            required: true,
            unique: true,       // one provider profile per user
        },
        ServiceCategorycatgeory_id: {
            type: Schema.Types.ObjectId,
            ref: "ServiceCategory",
            required: true,
        },
        price_per_hour: {
            type: Number,
            required: true,
            min: 0,
        },
        ratingCount: {
    type: Number,
    default: 0,
},
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

export const ServiceProviderModel = mongoose.model<IServiceProvider>(
    "ServiceProvider",
    ServiceProviderSchema
);