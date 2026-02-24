import { Router } from "express";
import { BookingController } from "../controllers/booking.controller";
import { authorizedMiddleware } from "../middlewares/authorized.middleware";

const router = Router();
const bookingController = new BookingController();

router.use(authorizedMiddleware);  // all booking routes require auth

router.post("/", bookingController.createBooking);       // customer: create
router.get("/my", bookingController.getMyBookings);       // customer: my bookings
router.get("/provider", bookingController.getProviderBookings); // provider: incoming bookings
router.patch("/:id/status", bookingController.updateStatus);        // provider: accept/reject/complete
router.patch("/:id/cancel", bookingController.cancelBooking);       // customer: cancel pending

export default router;