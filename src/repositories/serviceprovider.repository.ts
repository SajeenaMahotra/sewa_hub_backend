import { ServiceProviderModel, IServiceProvider } from "../models/serviceprovider.model";

export interface IServiceProviderRepository {
    createProvider(data: Partial<IServiceProvider>): Promise<IServiceProvider>;
    getProviderById(id: string): Promise<IServiceProvider | null>;
    getProviderByUserId(userId: string): Promise<IServiceProvider | null>;
    getAllProviders(
        page: number,
        size: number,
        search?: string,
        categoryId?: string
    ): Promise<{ providers: IServiceProvider[]; total: number }>;
    updateProviderByUserId(userId: string, updateData: Partial<IServiceProvider>): Promise<IServiceProvider | null>;
    deleteProvider(id: string): Promise<boolean>;
}

export class ServiceProviderRepository implements IServiceProviderRepository {

    async createProvider(data: Partial<IServiceProvider>): Promise<IServiceProvider> {
        const provider = new ServiceProviderModel(data);
        return await provider.save();
    }

    async getProviderById(id: string): Promise<IServiceProvider | null> {
        return await ServiceProviderModel.findById(id).populate("Useruser_id", "fullname email imageUrl");
    }

    async getProviderByUserId(userId: string): Promise<IServiceProvider | null> {
        return await ServiceProviderModel.findOne({ Useruser_id: userId }).populate("Useruser_id", "fullname email imageUrl");
    }

    async getAllProviders(
        page: number,
        size: number,
        search?: string,
        categoryId?: string
    ): Promise<{ providers: IServiceProvider[]; total: number }> {
        const filter: Record<string, any> = {};

        if (categoryId && categoryId !== "all") {
            filter.ServiceCategorycatgeory_id = categoryId;
        }

        // Search is done via populated user fields — use aggregation for that
        // For now filter by verified status optionally
        const [providers, total] = await Promise.all([
            ServiceProviderModel.find(filter)
                .populate("Useruser_id", "fullname email imageUrl")
                .populate("ServiceCategorycatgeory_id", "category_name")
                .skip((page - 1) * size)
                .limit(size),
            ServiceProviderModel.countDocuments(filter),
        ]);

        return { providers, total };
    }

    async updateProviderByUserId(
        userId: string,
        updateData: Partial<IServiceProvider>
    ): Promise<IServiceProvider | null> {
        return await ServiceProviderModel.findOneAndUpdate(
            { Useruser_id: userId },
            { $set: updateData },
            { new: true }
        ).populate("Useruser_id", "fullname email imageUrl");
    }

    async deleteProvider(id: string): Promise<boolean> {
        const result = await ServiceProviderModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}