import mongoose, { Document, Schema } from "mongoose";

export interface IServiceCategory extends Document {
    category_name: string;
    description?: string;
    imageUrl?: string;
    created_at: Date;
}

const ServiceCategorySchema = new Schema<IServiceCategory>(
    {
        category_name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    }
);

export const ServiceCategoryModel = mongoose.model<IServiceCategory>(
    "ServiceCategory",
    ServiceCategorySchema
);