import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import { connectDatabase } from "../../database/mongodb";
import { UserModel } from "../../models/user.model";
import { NotificationModel } from "../../models/notification.model";
import { BookingModel } from "../../models/booking.model";
import { ServiceProviderModel } from "../../models/serviceprovider.model";
import { ServiceCategoryModel } from "../../models/servicecategory.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let userToken: string;
let otherUserToken: string;
let userId: string;
let notifId: string;
let bookingId: string;

beforeAll(async () => {
  await connectDatabase();

  const hashedPassword = await bcrypt.hash("password123", 10);

  //  Seed primary user 
  const user = await UserModel.create({
    fullname: "Notif User",
    email: `notifuser_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "user",
  });
  userId = user._id.toString();
  userToken = jwt.sign(
    { id: user._id, role: "user" },
    process.env.JWT_SECRET as string
  );

  //  Seed other user (for isolation tests) 
  const otherUser = await UserModel.create({
    fullname: "Other User",
    email: `othernotif_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "user",
  });
  otherUserToken = jwt.sign(
    { id: otherUser._id, role: "user" },
    process.env.JWT_SECRET as string
  );

  // ── Seed a booking (needed for booking_id reference) ──────────
  const category = await ServiceCategoryModel.create({
    category_name: `NotifCat_${Date.now()}`,
  });
  const providerUser = await UserModel.create({
    fullname: "Provider",
    email: `notifprovider_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "provider",
    isProfileSetup: true,
  });
  const provider = await ServiceProviderModel.create({
    Useruser_id: providerUser._id,
    ServiceCategorycatgeory_id: category._id,
    experience_years: 2,
    price_per_hour: 300,
    is_verified: 0,
    rating: 0,
    ratingCount: 0,
  });
  const booking = await BookingModel.create({
    user_id: user._id,
    provider_id: provider._id,
    scheduled_at: new Date(Date.now() + 86400000),
    address: "456 Notif Lane",
    phone_number: "9800000002",
    price_per_hour: 300,
    severity: "normal",
    effective_price_per_hour: 300,
    status: "pending",
  });
  bookingId = booking._id.toString();

  //  Seed multiple notifications for the primary user 
  const notifications = await NotificationModel.insertMany([
    {
      recipient_id: user._id,
      type: "booking_created",
      title: "Booking Created",
      message: "Your booking has been created.",
      booking_id: booking._id,
      is_read: false,
    },
    {
      recipient_id: user._id,
      type: "booking_accepted",
      title: "Booking Accepted",
      message: "Your booking was accepted.",
      booking_id: booking._id,
      is_read: false,
    },
    {
      recipient_id: user._id,
      type: "booking_completed",
      title: "Booking Completed",
      message: "Your booking is complete.",
      booking_id: booking._id,
      is_read: false,
    },
  ]);

  // Save one notif ID for single-read tests
  notifId = notifications[0]._id.toString();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Notification API", () => {


  it("should fetch my notifications", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.notifications)).toBe(true);
    expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(3);
  });

  it("should mark one notification as read", async () => {
    const res = await request(app)
      .patch(`/api/notifications/${notifId}/read`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_read).toBe(true);
  });

  it("should mark all notifications as read", async () => {
    const res = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/read/i);
  });

  it("should have all notifications read after mark-all", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const unread = res.body.data.notifications.filter(
      (n: any) => n.is_read === false
    );
    expect(unread.length).toBe(0);
  });

  it("should not return another user's notifications", async () => {
    const res = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${otherUserToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications.length).toBe(0);
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/notifications");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 on mark-all without token", async () => {
    const res = await request(app).patch("/api/notifications/read-all");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
  
  it("should return 401 on mark-one without token", async () => {
    const res = await request(app).patch(
      `/api/notifications/${notifId}/read`
    );

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});