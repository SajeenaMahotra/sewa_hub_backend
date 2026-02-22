import { z } from "zod";

export const CreateProviderProfileDTO = z.object({
    bio: z.string().min(10, "Bio must be at least 10 characters"),
    experience_years: z.string().transform((val) => parseInt(val, 10)).pipe(
        z.number().min(0).max(50)
    ),
    phone: z.string().min(10, "Enter a valid phone number"),
    address: z.string().min(3, "Address is required"),
    serviceCategoryId: z.string().min(1, "Please select a service category"),
    imageUrl: z.string().optional(),
});

export type CreateProviderProfileDTO = z.infer<typeof CreateProviderProfileDTO>;

export const UpdateProviderProfileDTO = z.object({
    bio: z.string().min(10).optional(),
    experience_years: z.string().transform((val) => parseInt(val, 10)).pipe(
        z.number().min(0).max(50)
    ).optional(),
    phone: z.string().min(10).optional(),
    address: z.string().optional(),
    serviceCategoryId: z.string().optional(),
    imageUrl: z.string().optional(),
});

export type UpdateProviderProfileDTO = z.infer<typeof UpdateProviderProfileDTO>;