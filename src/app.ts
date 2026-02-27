import express, {Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import authRoutes from "./routes/auth.route";
import cors from "cors";
import path from 'path';
import adminUserRoutes from "./routes/admin/user.route";
import providerRouter from "./routes/serviceprovider.route";
import serviceCategoryRouter from "./routes/servicecategory.route";
import bookingRoutes from "./routes/booking.route";
import chatRoutes from "./routes/chat.route"; 
import notificationRoutes from "./routes/notification.route";  

const app: Application = express();

const corsOptions = {
    origin:[ 'http://localhost:3000', 'http://localhost:3003', 'http://localhost:3005' ],
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use("/api/provider", providerRouter);
app.use('/api/service-categories', serviceCategoryRouter);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);  
app.use("/api/notifications", notificationRoutes);

app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the API" });
});

export default app;