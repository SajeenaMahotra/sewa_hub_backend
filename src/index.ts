import app from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";
import { createServer } from "http";         
import { initChatSocket } from "./chat.gateway";

async function startServer() {
    await connectDatabase();

    const httpServer = createServer(app);     
    initChatSocket(httpServer); 

    httpServer.listen(                        
        PORT,
        () => {
            console.log(`Server: http://localhost:${PORT}`);
        }
    );
}

startServer();