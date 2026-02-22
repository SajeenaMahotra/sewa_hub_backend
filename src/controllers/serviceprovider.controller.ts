import { Request, Response } from "express";
import { ProviderService } from "../services/serviceprovider.service";
import { CreateProviderProfileDTO, UpdateProviderProfileDTO } from "../dtos/serviceprovider";
import z from "zod";

const providerService = new ProviderService();

export class ProviderController {

    async setupProfile(req: Request, res: Response) {
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
}