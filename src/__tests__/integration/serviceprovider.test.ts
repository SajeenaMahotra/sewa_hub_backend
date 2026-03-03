import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import { connectDatabase } from "../../database/mongodb";
import { UserModel } from "../../models/user.model";
import { ServiceProviderModel } from "../../models/serviceprovider.model";
import { ServiceCategoryModel } from "../../models/servicecategory.model";
import { BookingModel } from "../../models/booking.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let providerToken: string;
let userToken: string;
let otherUserToken: string;
let providerProfileId: string;
let categoryId: string;
let completedBookingId: string;
let pendingBookingId: string;
let otherUserBookingId: string;

beforeAll(async () => {
  await connectDatabase();


  const category = await ServiceCategoryModel.create({
    category_name: `Plumbing_${Date.now()}`,
  });
  categoryId = category._id.toString();

  const hashedPassword = await bcrypt.hash("password123", 10);


  const providerUser = await UserModel.create({
    fullname: "Test Provider",
    email: `provider_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "provider",
    isProfileSetup: true,
  });
  providerToken = jwt.sign(
    { id: providerUser._id, role: "provider" },
    process.env.JWT_SECRET as string
  );

  const providerProfile = await ServiceProviderModel.create({
    Useruser_id: providerUser._id,
    ServiceCategorycatgeory_id: category._id,
    experience_years: 3,
    price_per_hour: 500,
    bio: "Experienced plumber",
    is_verified: 0,
    rating: 0,
    ratingCount: 0,
  });
  providerProfileId = providerProfile._id.toString();

  const regularUser = await UserModel.create({
    fullname: "Test User",
    email: `user_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "user",
  });
  userToken = jwt.sign(
    { id: regularUser._id, role: "user" },
    process.env.JWT_SECRET as string
  );

  const otherUser = await UserModel.create({
    fullname: "Other User",
    email: `other_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "user",
  });
  otherUserToken = jwt.sign(
    { id: otherUser._id, role: "user" },
    process.env.JWT_SECRET as string
  );

  const baseBooking = {
    provider_id: providerProfile._id,
    scheduled_at: new Date(Date.now() + 86400000), // tomorrow
    address: "123 Test Street",
    phone_number: "9800000001",
    price_per_hour: 500,
    severity: "normal" as const,
    effective_price_per_hour: 500,
  };


  const completedBooking = await BookingModel.create({
    ...baseBooking,
    user_id: regularUser._id,
    status: "completed",
  });
  completedBookingId = completedBooking._id.toString();


  const pendingBooking = await BookingModel.create({
    ...baseBooking,
    user_id: regularUser._id,
    status: "pending",
  });
  pendingBookingId = pendingBooking._id.toString();


  const otherBooking = await BookingModel.create({
    ...baseBooking,
    user_id: otherUser._id,
    status: "completed",
  });
  otherUserBookingId = otherBooking._id.toString();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("ServiceProvider API", () => {

  it("should filter providers by categoryId", async () => {
    const res = await request(app).get(
      `/api/provider?categoryId=${categoryId}`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.providers)).toBe(true);
  });


  it("should rate provider for completed booking", async () => {
    const res = await request(app)
      .post(`/api/provider/rate/${completedBookingId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });


  it("should fail rating if booking is not completed", async () => {
    const res = await request(app)
      .post(`/api/provider/rate/${pendingBookingId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 4 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should not allow rating another user's booking", async () => {
    const res = await request(app)
      .post(`/api/provider/rate/${otherUserBookingId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ rating: 5 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should not fetch profile without token", async () => {
    const res = await request(app).get("/api/provider/profile");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});