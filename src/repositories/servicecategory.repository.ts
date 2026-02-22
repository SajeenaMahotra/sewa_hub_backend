import { ServiceCategoryModel, IServiceCategory } from "../models/servicecategory.model";

export interface IServiceCategoryRepository {
    create(data: Partial<IServiceCategory>): Promise<IServiceCategory>;
    getAll(): Promise<IServiceCategory[]>;
    getById(id: string): Promise<IServiceCategory | null>;
    update(id: string, data: Partial<IServiceCategory>): Promise<IServiceCategory | null>;
    delete(id: string): Promise<boolean>;
}

export class ServiceCategoryRepository implements IServiceCategoryRepository {
    async create(data: Partial<IServiceCategory>): Promise<IServiceCategory> {
        const category = new ServiceCategoryModel(data);
        return await category.save();
    }

    async getAll(): Promise<IServiceCategory[]> {
        return await ServiceCategoryModel.find().sort({ category_name: 1 });
    }

    async getById(id: string): Promise<IServiceCategory | null> {
        return await ServiceCategoryModel.findById(id);
    }

    async update(id: string, data: Partial<IServiceCategory>): Promise<IServiceCategory | null> {
        return await ServiceCategoryModel.findByIdAndUpdate(
            id, { $set: data }, { new: true }
        );
    }

    async delete(id: string): Promise<boolean> {
        const result = await ServiceCategoryModel.findByIdAndDelete(id);
        return result ? true : false;
    }
}