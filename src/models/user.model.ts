import mongoose, {Document, Schema} from "mongoose";
import {UserType} from "../types/user.type.js";

const UserSchema: Schema = new Schema<UserType>({
    fullname: {type: String, required: true, maxlength: 100},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: { 
        type: String,
        enum: ["user", "admin"],
        default: "user"},
     imageUrl: { type: String , required: false},
}, {
    timestamps: true,
});
export interface IUser extends UserType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>("User", UserSchema);