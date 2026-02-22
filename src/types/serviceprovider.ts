import { z } from "zod";

export const ServiceProviderSchema = z.object({
    provider_id: z.number().optional(),
    experience_years: z.number().min(0).max(50),
    is_verified: z.number().default(0), // 0 = unverified, 1 = verified
    rating: z.number().min(0).max(5).default(0),
    bio: z.string().min(10).optional(),
    phone: z.string().min(10).optional(),
    address: z.string().optional(),
    imageUrl: z.string().optional(),
    Useruser_id: z.number(),
    ServiceCategorycatgeory_id: z.number(),
});

export type ServiceProviderType = z.infer<typeof ServiceProviderSchema>;

export const CreateProviderSchema = ServiceProviderSchema.omit({
    provider_id: true,
    is_verified: true,
    rating: true,
});

export type CreateProviderType = z.infer<typeof CreateProviderSchema>;

export const UpdateProviderSchema = CreateProviderSchema.partial();
export type UpdateProviderType = z.infer<typeof UpdateProviderSchema>;