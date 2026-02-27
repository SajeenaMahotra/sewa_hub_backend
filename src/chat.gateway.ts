import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatService } from "./services/chat.service";

interface AuthPayload {
    _id: string;
    email: string;
}

const chatService = new ChatService();

// ─── Notification socket map (userId → Set of socketIds) ────────────────────
const userSocketMap = new Map<string, Set<string>>();

// ─── Exported sender — used by NotificationService ──────────────────────────
let _io: SocketIOServer | null = null;

export function sendNotificationToUser(userId: string, payload: object) {
    if (!_io) return;
    const sids = userSocketMap.get(userId);
    if (!sids || sids.size === 0) return;
    sids.forEach((sid) => _io!.of("/notifications").to(sid).emit("notification", payload));
}

// ─── Auth helper (used by chat namespace only) ───────────────────────────────
function authenticateSocket(socket: Socket): AuthPayload {
    const token =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) throw new Error("No token provided");

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not configured");

    const decoded = jwt.verify(token, secret) as any;
    const id = decoded._id ?? decoded.id ?? decoded.userId ?? decoded.sub;
    if (!id) throw new Error("Invalid token payload");

    return { _id: id.toString(), email: decoded.email ?? "" };
}

// ─── Main init ───────────────────────────────────────────────────────────────
export function initChatSocket(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        path: "/socket.io",
        cors: {
            origin: ["http://localhost:3000", "http://localhost:3003", "http://localhost:3005"],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    _io = io;

    // ════════════════════════════════════════════════════════════════════
    //  /chat namespace  — JWT protected (your original logic, unchanged)
    // ════════════════════════════════════════════════════════════════════
    const chatNS = io.of("/chat");

    chatNS.use((socket, next) => {
        try {
            const user = authenticateSocket(socket);
            (socket as any).user = user;
            next();
        } catch (err: any) {
            next(new Error("Unauthorized: " + err.message));
        }
    });

    chatNS.on("connection", (socket: Socket) => {
        const user = (socket as any).user as AuthPayload;
        console.log(`[Chat] User connected: ${user._id} (${socket.id})`);

        // Join a booking chat room
        socket.on("join_room", async ({ bookingId }: { bookingId: string }) => {
            try {
                const { messages, total } = await chatService.getMessages(user._id, bookingId, 1, 30);
                await chatService.markAsRead(user._id, bookingId);
                socket.join(bookingId);
                socket.emit("room_joined", { bookingId, messages, total });
                console.log(`[Chat] ${user._id} joined room ${bookingId}`);
            } catch (err: any) {
                socket.emit("error", { message: err.message });
            }
        });

        // Send a message
        socket.on(
            "send_message",
            async ({ bookingId, content }: { bookingId: string; content: string }) => {
                try {
                    const message = await chatService.sendMessage(user._id, {
                        booking_id: bookingId,
                        content,
                    });
                    chatNS.to(bookingId).emit("new_message", message);
                    await chatService.markAsRead(user._id, bookingId);
                } catch (err: any) {
                    socket.emit("error", { message: err.message });
                }
            }
        );

        // Mark messages as read
        socket.on("mark_read", async ({ bookingId }: { bookingId: string }) => {
            try {
                await chatService.markAsRead(user._id, bookingId);
                socket.to(bookingId).emit("messages_read", { byUserId: user._id, bookingId });
            } catch (err: any) {
                socket.emit("error", { message: err.message });
            }
        });

        // Typing indicators
        socket.on("typing_start", ({ bookingId }: { bookingId: string }) => {
            socket.to(bookingId).emit("user_typing", { userId: user._id, bookingId });
        });
        socket.on("typing_stop", ({ bookingId }: { bookingId: string }) => {
            socket.to(bookingId).emit("user_stopped_typing", { userId: user._id, bookingId });
        });

        // Leave room
        socket.on("leave_room", ({ bookingId }: { bookingId: string }) => {
            socket.leave(bookingId);
            console.log(`[Chat] ${user._id} left room ${bookingId}`);
        });

        socket.on("disconnect", () => {
            console.log(`[Chat] User disconnected: ${user._id} (${socket.id})`);
        });
    });

    
    //  /notifications namespace  — no auth middleware (userId sent by client)
    const notifNS = io.of("/notifications");

    notifNS.on("connection", (socket: Socket) => {
        console.log(`[Notif] Socket connected: ${socket.id}`);

        socket.on("register", (userId: string) => {
            if (!userId) return;
            if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
            userSocketMap.get(userId)!.add(socket.id);
            console.log(`[Notif] User ${userId} registered → ${socket.id}`);
        });

        socket.on("disconnect", () => {
            for (const [uid, sids] of userSocketMap.entries()) {
                if (sids.has(socket.id)) {
                    sids.delete(socket.id);
                    if (sids.size === 0) userSocketMap.delete(uid);
                    break;
                }
            }
            console.log(`[Notif] Socket disconnected: ${socket.id}`);
        });
    });

    return io;
}