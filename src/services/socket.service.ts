import { Server as HttpServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";

class SocketService {
    private io: SocketServer | null = null;

    // Map of userId → socketId (for targeting specific users)
    private userSocketMap = new Map<string, string>();

    initialize(httpServer: HttpServer) {
        this.io = new SocketServer(httpServer, {
            cors: { origin: "*", methods: ["GET", "POST"] }, // tighten in production
        });

        this.io.on("connection", (socket: Socket) => {
            console.log(`Socket connected: ${socket.id}`);

            // Client must emit "register" with their userId after connecting
            socket.on("register", (userId: string) => {
                this.userSocketMap.set(userId, socket.id);
                console.log(`User ${userId} registered with socket ${socket.id}`);
            });

            socket.on("disconnect", () => {
                // Clean up the map on disconnect
                for (const [uid, sid] of this.userSocketMap.entries()) {
                    if (sid === socket.id) {
                        this.userSocketMap.delete(uid);
                        break;
                    }
                }
                console.log(`Socket disconnected: ${socket.id}`);
            });
        });
    }

    // Send a real-time notification to a specific user (if they're online)
    sendToUser(userId: string, event: string, payload: object) {
        if (!this.io) return;
        const socketId = this.userSocketMap.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, payload);
        }
        // If user is offline → notification is still saved in DB, they'll see it on next load
    }

    getIO() {
        return this.io;
    }
}

// Singleton
export const socketService = new SocketService();