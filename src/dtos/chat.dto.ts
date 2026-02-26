import z from "zod";

export const SendMessageDTO = z.object({
    booking_id: z.string().min(1, "Booking ID is required"),
    content: z.string().min(1, "Message content is required"),
});
export type SendMessageDTO = z.infer<typeof SendMessageDTO>;

export const GetMessagesDTO = z.object({
    page: z.coerce.number().default(1),
    size: z.coerce.number().default(30),
});
export type GetMessagesDTO = z.infer<typeof GetMessagesDTO>;