import { HttpError } from "../errors/http-error";
import { ServiceCategoryRepository } from "../repositories/servicecategory.repository";

const categoryRepo = new ServiceCategoryRepository();

export class ServiceCategoryService {
    async createCategory(data: { category_name: string; description?: string; imageUrl?: string }) {
        return await categoryRepo.create(data);
    }

    async getAllCategories() {
        return await categoryRepo.getAll();
    }

    async getCategoryById(id: string) {
        const category = await categoryRepo.getById(id);
        if (!category) throw new HttpError(404, "Category not found");
        return category;
    }

    async updateCategory(id: string, data: { category_name?: string; description?: string; imageUrl?: string }) {
        const category = await categoryRepo.getById(id);
        if (!category) throw new HttpError(404, "Category not found");
        return await categoryRepo.update(id, data);
    }

    async deleteCategory(id: string) {
        const category = await categoryRepo.getById(id);
        if (!category) throw new HttpError(404, "Category not found");
        return await categoryRepo.delete(id);
    }
}