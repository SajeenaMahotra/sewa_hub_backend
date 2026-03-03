import request from "supertest";
import app from "../../app";
import { UserModel } from "../../models/user.model";
import { BookingModel } from "../../models/booking.model";
import { ServiceProviderModel } from "../../models/serviceprovider.model";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config";
import mongoose from "mongoose";

describe("Booking Integration Tests", () => {

  const customerData = {
    fullname: "Customer User",
    email: "customer@test.com",
    password: "Password123"
  };

  const providerUserData = {
    fullname: "Provider User",
    email: "provider@test.com",
    password: "Password123"
  };

  let customerToken: string;
  let providerToken: string;
  let customerId: string;
  let providerUserId: string;
  let providerProfileId: string;
  let bookingId: string;

  beforeAll(async () => {
    await UserModel.deleteMany({ email: { $in: [customerData.email, providerUserData.email] } });
    await BookingModel.deleteMany({});
    await ServiceProviderModel.deleteMany({});

    // Create customer
    const customer = await UserModel.create(customerData);
    customerId = customer._id.toString();

    customerToken = jwt.sign(
      { id: customer._id, email: customer.email, fullname: customer.fullname },
      JWT_SECRET
    );

    // Create provider user
    const providerUser = await UserModel.create({
      ...providerUserData,
      role: "provider"
    });

    providerUserId = providerUser._id.toString();

    providerToken = jwt.sign(
      { id: providerUser._id, email: providerUser.email, fullname: providerUser.fullname },
      JWT_SECRET
    );

    // Create provider profile
    const providerProfile = await ServiceProviderModel.create({
      experience_years: 5,
      is_verified: 1,
      rating: 4.5,
      Useruser_id: providerUser._id,
      ServiceCategorycatgeory_id: new mongoose.Types.ObjectId(),
      price_per_hour: 100,
      ratingCount: 0
    });

    providerProfileId = providerProfile._id.toString();
  });

  afterAll(async () => {
    await BookingModel.deleteMany({});
    await ServiceProviderModel.deleteMany({});
    await UserModel.deleteMany({ email: { $in: [customerData.email, providerUserData.email] } });
  });


  // CREATE BOOKING
  

  test("should create booking successfully", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        provider_id: providerProfileId,
        scheduled_at: new Date().toISOString(),
        address: "Kathmandu",
        phone_number: "9800000000",
        severity: "normal"
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body.data).toHaveProperty("status", "pending");

    bookingId = response.body.data._id;
  });

  test("should not create booking without token", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .send({});

    expect(response.status).toBe(401);
  });

  test("should not create booking with invalid provider", async () => {
    const response = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        provider_id: new mongoose.Types.ObjectId(),
        scheduled_at: new Date().toISOString(),
        address: "Kathmandu",
        phone_number: "9800000000"
      });

    expect(response.status).toBe(404);
  });

  // =========================
  // GET MY BOOKINGS
  // =========================

  test("should get my bookings (customer)", async () => {
    const response = await request(app)
      .get("/api/bookings/mybooking")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.bookings.length).toBeGreaterThan(0);
  });

  // =========================
  // GET PROVIDER BOOKINGS
  // =========================

  test("should get provider bookings", async () => {
    const response = await request(app)
      .get("/api/bookings/provider")
      .set("Authorization", `Bearer ${providerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  // =========================
  // UPDATE STATUS
  // =========================

  test("provider should accept booking", async () => {
    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${providerToken}`)
      .send({ status: "accepted" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("accepted");
  });

  test("customer should NOT update booking status", async () => {
    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ status: "completed" });

    expect(response.status).toBe(403);
  });

  // =========================
  // CANCEL BOOKING
  // =========================

  test("customer should cancel booking (if pending)", async () => {

    // create new pending booking
    const newBooking = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        provider_id: providerProfileId,
        scheduled_at: new Date().toISOString(),
        address: "Kathmandu",
        phone_number: "9800000000"
      });

    const pendingId = newBooking.body.data._id;

    const response = await request(app)
      .patch(`/api/bookings/${pendingId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test("should not cancel someone else's booking", async () => {
    const response = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${providerToken}`);

    expect(response.status).toBe(400);
  });

});