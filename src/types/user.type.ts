import {z} from "zod";

export const UserSchema = z.object({
    fullname: z.string().min(1,).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["user", "provider","admin"]).default("user"),
    imageUrl: z.string().optional(),
    isProfileSetup: z.boolean().default(false),
});

export type UserType = z.infer<typeof UserSchema>;