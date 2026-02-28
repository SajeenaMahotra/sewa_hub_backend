import { Request, Response } from "express";
import { ProviderService } from "../services/serviceprovider.service";
import { CreateProviderProfileDTO, RateProviderDTO, UpdateProviderProfileDTO } from "../dtos/serviceprovider";
import z from "zod";

const providerService = new ProviderService();

export class ProviderController {

    async setupProfile(req: Request, res: Response) {
        console.log("BODY:", req.body);
        console.log("FILE:", req.file);

        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const parsedData = CreateProviderProfileDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error),
                });
            }

            const data = { ...parsedData.data } as any;
            if (req.file) {
                data.imageUrl = `/uploads/${req.file.filename}`;
            }

            const profile = await providerService.setupProfile(userId, data);
            return res.status(201).json({
                success: true,
                message: "Provider profile created successfully",
                data: profile,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async getMyProfile(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const profile = await providerService.getProfileByUserId(userId);
            return res.status(200).json({
                success: true,
                message: "Provider profile fetched successfully",
                data: profile,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }

            const parsedData = UpdateProviderProfileDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json({
                    success: false,
                    message: z.prettifyError(parsedData.error),
                });
            }

            const data = { ...parsedData.data } as any;
            if (req.file) {
                data.imageUrl = `/uploads/${req.file.filename}`;
            }

            const updated = await providerService.updateProfile(userId, data);
            return res.status(200).json({
                success: true,
                message: "Provider profile updated successfully",
                data: updated,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async getAllProviders(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const size = parseInt(req.query.size as string) || 12;
            const categoryId = req.query.categoryId as string | undefined;

            const { providers, total } = await providerService.getAllProviders(page, size, categoryId);

            return res.status(200).json({
                success: true,
                message: "Providers fetched successfully",
                data: { providers, total, page, size },
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    async getProviderById(req: Request, res: Response) {
        try {
            const id = req.params["id"] as string;
            const provider = await providerService.getProviderById(id);
            return res.status(200).json({
                success: true,
                message: "Provider fetched successfully",
                data: provider,
            });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({
                success: false,
                message: error.message || "Internal Server Error",
            });
        }
    }

    // serviceprovider.controller.ts
    async rateProvider(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

            const bookingId = req.params["bookingId"] as string;
            const parsed = RateProviderDTO.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ success: false, message: z.prettifyError(parsed.error) });


            const updated = await providerService.rateProvider(bookingId, userId.toString(), parsed.data.rating);
            return res.status(200).json({ success: true, message: "Rating submitted", data: updated });
        } catch (error: any) {
            return res.status(error.statusCode ?? 500).json({ success: false, message: error.message });
        }
    }
}