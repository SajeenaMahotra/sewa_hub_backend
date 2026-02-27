import { sendNotificationToUser } from "../chat.gateway";

class SocketService {
    sendToUser(userId: string, event: string, payload: object) {
        sendNotificationToUser(userId, payload);
    }
}

export const socketService = new SocketService();