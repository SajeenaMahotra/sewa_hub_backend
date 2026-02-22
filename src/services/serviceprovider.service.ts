import { HttpError } from "../errors/http-error";
import { CreateProviderProfileDTO, UpdateProviderProfileDTO } from "../dtos/serviceprovider";
import { ServiceProviderRepository } from "../repositories/serviceprovider.repository";

const providerRepo = new ServiceProviderRepository();

export class ProviderService {

    async setupProfile(userId: string, data: CreateProviderProfileDTO & { imageUrl?: string }) {
        const existing = await providerRepo.getProviderByUserId(userId);
        if (existing) {
            throw new HttpError(409, "Provider profile already exists");
        }

        const profile = await providerRepo.createProvider({
            ...data,
            Useruser_id: userId as any,
            ServiceCategorycatgeory_id: data.serviceCategoryId as any,
            is_verified: 0,
            rating: 0,
        });

        return profile;
    }

    async getProfileByUserId(userId: string) {
        const profile = await providerRepo.getProviderByUserId(userId);
        if (!profile) {
            throw new HttpError(404, "Provider profile not found");
        }
        return profile;
    }

    async updateProfile(userId: string, data: UpdateProviderProfileDTO & { imageUrl?: string }) {
        const profile = await providerRepo.getProviderByUserId(userId);
        if (!profile) {
            throw new HttpError(404, "Provider profile not found");
        }
        const updated = await providerRepo.updateProviderByUserId(userId, data);
        return updated;
    }

    async hasProfile(userId: string): Promise<boolean> {
        const profile = await providerRepo.getProviderByUserId(userId);
        return !!profile;
    }
}