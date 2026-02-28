import { HttpError } from "../errors/http-error";
import { CreateProviderProfileDTO, UpdateProviderProfileDTO } from "../dtos/serviceprovider";
import { ServiceProviderRepository } from "../repositories/serviceprovider.repository";
import { UserRepository } from "../repositories/user.repository";
import { BookingRepository } from "../repositories/booking.repository";

const bookingRepo = new BookingRepository();
const providerRepo = new ServiceProviderRepository();
const userRepo = new UserRepository();

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

        await userRepo.updateUser(userId, { isProfileSetup: true } as any);

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

    async getAllProviders(page: number, size: number, categoryId?: string) {
        return await providerRepo.getAllProviders(page, size, undefined, categoryId);
    }

    async getProviderById(id: string) {
        const provider = await providerRepo.getProviderById(id);
        if (!provider) {
            throw new HttpError(404, "Provider not found");
        }
        return provider;
    }

    async rateProvider(bookingId: string, userId: string, rating: number) {
        const booking = await bookingRepo.getBookingById(bookingId);
        if (!booking) throw new HttpError(404, "Booking not found");

        const bookingUserId = (booking.user_id as any)?._id?.toString()
            ?? booking.user_id?.toString();

        if (bookingUserId !== userId.toString())
            throw new HttpError(403, "Not your booking");

        if (booking.status !== "completed")
            throw new HttpError(400, "Can only rate completed bookings");

        const providerId = (booking.provider_id as any)?._id?.toString()
            ?? booking.provider_id?.toString();
        const updated = await providerRepo.rateProvider(providerId, rating);
        if (!updated) throw new HttpError(404, "Provider not found");
        return updated;
    }
}