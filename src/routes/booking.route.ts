import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const bookingController = new BookingController();

router.use(authorizedMiddleware);  

router.post("/", bookingController.createBooking);      
router.get("/mybooking", bookingController.getMyBookings);       
router.get("/provider", bookingController.getProviderBookings);
router.patch("/:id/status", bookingController.updateStatus);       
router.patch("/:id/cancel", bookingController.cancelBooking);     
router.delete("/:id", bookingController.deleteBooking);
export default router;