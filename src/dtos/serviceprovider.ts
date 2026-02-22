import { z } from "zod";

export const CreateProviderProfileDTO = z.object({
    bio: z.string().min(10, "Bio must be at least 10 characters"),
    experience_years: z.coerce.number().min(0).max(50),
    phone: z.string().min(10, "Enter a valid phone number"),
    address: z.string().min(3, "Address is required"),
    serviceCategoryId: z.coerce.number().refine(val => val !== null && val !== undefined, { message: "Please select a service category" }),
});

export type CreateProviderProfileDTO = z.infer<typeof CreateProviderProfileDTO>;

export const UpdateProviderProfileDTO = CreateProviderProfileDTO.partial();
export type UpdateProviderProfileDTO = z.infer<typeof UpdateProviderProfileDTO>;