import { UserService } from "../services/user.service";
import { ChangePasswordDTO, CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { Request, Response } from "express";
import z from "zod";
import { IUser } from "../models/user.model";
import jwt from "jsonwebtoken";                  
import { JWT_SECRET } from "../config"; 

let userService = new UserService();
export class AuthController {
    async register(req: Request, res: Response) {
        try {
            const parsedData = CreateUserDTO.safeParse(req.body); // validate request body
            if (!parsedData.success) { 
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const userData: CreateUserDTO = parsedData.data;
            const newUser = await userService.createUser(userData);

            return res.status(201).json(
                { success: true, message: "User Created", data: newUser }
            );
        } catch (error: Error | any) { 
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async login(req: Request, res: Response) {
        try {
            const parsedData = LoginUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                )
            }
            const loginData: LoginUserDTO = parsedData.data;
            const { token, user } = await userService.loginUser(loginData);
            return res.status(200).json(
                { success: true, message: "Login successful", data: user, token }
            );

        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(400).json(
                    { success: false, message: "User Id Not found" }
                );
            }
            const user = await userService.getUserById(userId);
            return res.status(200).json(
                { success: true, data: user, message: "User profile fetched successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(400).json(
                    { success: false, message: "User Id Not found" }
                );
            }
            const parsedData = UpdateUserDTO.safeParse(req.body);
            if (!parsedData.success) {
                return res.status(400).json(
                    { success: false, message: z.prettifyError(parsedData.error) }
                ); // z.prettifyError - better error messages (zod)
            }
            if (req.file) {
                
                parsedData.data.imageUrl = `/uploads/${req.file.filename}`;
            }
            const updatedUser = await userService.updateUser(userId, parsedData.data);
            return res.status(200).json(
                { success: true, data: updatedUser, message: "User profile updated successfully" }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    async requestPasswordChange(req: Request, res: Response) {
        try {
            const { email } = req.body;
            const user = await userService.sendResetPasswordEmail(email);
            return res.status(200).json(
                { success: true, 
                    data: user,
                    message: "Password reset email sent" }
            )
        } catch (error: Error | any) {
            return res.status(error.statusCode || 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            )
        }
    }

    async resetPassword(req: Request<{token: string}>, res: Response) {
        try {

           const token = req.params.token;
            const { newPassword } = req.body;
            await userService.resetPassword(token, newPassword);
            return res.status(200).json(
                { success: true, message: "Password has been reset successfully." }
            );
        } catch (error: Error | any) {
            return res.status(error.statusCode ?? 500).json(
                { success: false, message: error.message || "Internal Server Error" }
            );
        }
    }

    // Google OAuth callback handler
async googleCallback(req: Request, res: Response) {
    try {
        const user = req.user as IUser;
        const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

        const payload = {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            role: user.role,
            isProfileSetup: user.isProfileSetup,
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

        // Redirect to frontend with token
        return res.redirect(`${CLIENT_URL}/auth/google/success?token=${token}`);
    } catch (error: any) {
        const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
        return res.redirect(`${CLIENT_URL}/auth/google/error`);
    }
}

async changePassword(req: Request, res: Response) {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const parsedData = ChangePasswordDTO.safeParse(req.body);
        if (!parsedData.success) {
            return res.status(400).json({
                success: false,
                message: z.prettifyError(parsedData.error)
            });
        }

        const { currentPassword, newPassword } = parsedData.data;
        const result = await userService.changePassword(userId, currentPassword, newPassword);

        return res.status(200).json({ success: true, ...result });
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
}

async deleteAccount(req: Request, res: Response) {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
        await userService.deleteAccount(userId);
        return res.status(200).json({ success: true, message: "Account deleted successfully" });
    } catch (error: any) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
}
}