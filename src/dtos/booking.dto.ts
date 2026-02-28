import z from "zod";

export const CreateBookingDTO = z.object({
    provider_id:  z.string().min(1, "Provider ID is required"),
    scheduled_at: z.string().min(1, "Scheduled date & time is required"),
    address:      z.string().min(1, "Address is required"),
    note:         z.string().optional(),
    phone_number: z.string().min(10, "Enter a valid phone number"),   
    severity:     z.enum(["normal", "emergency", "urgent"]).default("normal"),
});
export type CreateBookingDTO = z.infer<typeof CreateBookingDTO>;

export const UpdateBookingStatusDTO = z.object({
    status: z.enum(["accepted", "rejected", "completed", "cancelled"]),
});
export type UpdateBookingStatusDTO = z.infer<typeof UpdateBookingStatusDTO>;