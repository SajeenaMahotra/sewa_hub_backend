import { Request, Response } from "express";
import { ServiceCategoryService } from "../services/servicecategory.service";

const categoryService = new ServiceCategoryService();

export class ServiceCategoryController {

    async getAll(req: Request, res: Response) {
        try {
            const categories = await categoryService.getAllCategories();
            return res.status(200).json({
                success: true,
                data: categories,
                message: "Categories fetched successfully",
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const category = await categoryService.getCategoryById(id);
            return res.status(200).json({ success: true, data: category });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { category_name, description } = req.body;
            if (!category_name) {
                return res.status(400).json({ success: false, message: "category_name is required" });
            }
            const data: any = { category_name, description };
            if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
            const category = await categoryService.createCategory(data);
            return res.status(201).json({
                success: true,
                data: category,
                message: "Category created successfully",
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const data: any = { ...req.body };
            if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;
            const category = await categoryService.updateCategory(id, data);
            return res.status(200).json({
                success: true,
                data: category,
                message: "Category updated successfully",
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async delete(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            await categoryService.deleteCategory(id);
            return res.status(200).json({
                success: true,
                message: "Category deleted successfully",
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }
}