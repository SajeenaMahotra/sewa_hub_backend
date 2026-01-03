import {z} from "zod";

export const UserSchema = z.object({
    fullname: z.string().min(1,).max(100),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(["user", "admin"]).default("user"),
});

export type UserType = z.infer<typeof UserSchema>;