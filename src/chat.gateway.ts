import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatService } from "./services/chat.service";

interface AuthPayload {
    _id: string;
    email: string;
}

const chatService = new ChatService();

function authenticateSocket(socket: Socket): AuthPayload {
    const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) throw new Error("No token provided");

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const decoded = jwt.verify(token, secret) as any;
    
    // Handle different payload shapes — adjust field names to match your JWT
    const id = decoded._id ?? decoded.id ?? decoded.userId ?? decoded.sub;
    if (!id) throw new Error("Invalid token payload");

    return { _id: id.toString(), email: decoded.email ?? "" };
}

export function initChatSocket(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        path: "/socket.io",
        cors: {
            origin: process.env.CLIENT_URL ?? "*",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    //  Auth middleware 
    io.use((socket, next) => {
        try {
            const user = authenticateSocket(socket);
            (socket as any).user = user;
            next();
        } catch (err: any) {
            next(new Error("Unauthorized: " + err.message));
        }
    });

    //  Connection handler 
    io.on("connection", (socket: Socket) => {
        const user = (socket as any).user as AuthPayload;
        console.log(`[Chat] User connected: ${user._id} (${socket.id})`);

        //  Join a booking chat room 
        // Client emits: socket.emit("join_room", { bookingId })
        socket.on("join_room", async ({ bookingId }: { bookingId: string }) => {
            try {
                // Verify the user belongs to this booking before joining
                const { messages, total } = await chatService.getMessages(user._id, bookingId, 1, 30);
                await chatService.markAsRead(user._id, bookingId);

                socket.join(bookingId);
                socket.emit("room_joined", { bookingId, messages, total });
                console.log(`[Chat] ${user._id} joined room ${bookingId}`);
            } catch (err: any) {
                socket.emit("error", { message: err.message });
            }
        });

        //  Send a message
        // Client emits: socket.emit("send_message", { bookingId, content })
        socket.on(
            "send_message",
            async ({ bookingId, content }: { bookingId: string; content: string }) => {
                try {
                    const message = await chatService.sendMessage(user._id, {
                        booking_id: bookingId,
                        content,
                    });

                    // Broadcast to EVERYONE in the room (including sender)
                    io.to(bookingId).emit("new_message", message);

                    // Auto mark as read for the sender (they just sent it)
                    await chatService.markAsRead(user._id, bookingId);
                } catch (err: any) {
                    socket.emit("error", { message: err.message });
                }
            }
        );

        //  Mark messages as read 
        // Client emits: socket.emit("mark_read", { bookingId })
        socket.on("mark_read", async ({ bookingId }: { bookingId: string }) => {
            try {
                await chatService.markAsRead(user._id, bookingId);
                // Notify the OTHER party so they can update "seen" indicators
                socket.to(bookingId).emit("messages_read", { byUserId: user._id, bookingId });
            } catch (err: any) {
                socket.emit("error", { message: err.message });
            }
        });

        //  Typing indicators
        socket.on("typing_start", ({ bookingId }: { bookingId: string }) => {
            socket.to(bookingId).emit("user_typing", { userId: user._id, bookingId });
        });

        socket.on("typing_stop", ({ bookingId }: { bookingId: string }) => {
            socket.to(bookingId).emit("user_stopped_typing", { userId: user._id, bookingId });
        });

        //  Leave room 
        socket.on("leave_room", ({ bookingId }: { bookingId: string }) => {
            socket.leave(bookingId);
            console.log(`[Chat] ${user._id} left room ${bookingId}`);
        });

        socket.on("disconnect", () => {
            console.log(`[Chat] User disconnected: ${user._id} (${socket.id})`);
        });
    });

    return io;
}