import app from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import { createServer } from "http";         
import { initChatSocket } from "./chat.gateway";
import { socketService } from "./services/socket.service";

async function startServer() {
    await connectDatabase();

    const httpServer = createServer(app);     
    initChatSocket(httpServer); 
    socketService.initialize(httpServer);

    httpServer.listen(                        
        PORT,
        () => {
            console.log(`Server: http://localhost:${PORT}`);
        }
    );
}

startServer();