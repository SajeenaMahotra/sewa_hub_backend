import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../../app";

import { UserModel } from "../../models/user.model";
import { BookingModel } from "../../models/booking.model";
import { ServiceProviderModel } from "../../models/serviceprovider.model";
import { MessageModel } from "../../models/message.model";

const JWT_SECRET = process.env.JWT_SECRET || "testsecret";

describe("Chat API", () => {
  let userToken: string;
  let providerToken: string;
  let outsiderToken: string;

  let bookingId: string;
  let providerProfileId: string;

  let userId: string;
  let providerUserId: string;

  beforeEach(async () => {
  // Clear all collections
  await MessageModel.deleteMany({});
  await BookingModel.deleteMany({});
  await ServiceProviderModel.deleteMany({});
  await UserModel.deleteMany({});

  // ─── Create User ───────────────────────────────────────
  const user = await UserModel.create({
    fullname: "User One",
    email: "user@test.com",
    password: "hashed",
  });
  userId = user._id.toString();

  userToken = jwt.sign(
    { _id: user._id, id: user._id },
    JWT_SECRET
  );

  // ─── Create Provider User ──────────────────────────────
  const providerUser = await UserModel.create({
    fullname: "Provider One",
    email: "provider@test.com",
    password: "hashed",
  });
  providerUserId = providerUser._id.toString();

  providerToken = jwt.sign(
    { _id: providerUser._id, id: providerUser._id },
    JWT_SECRET
  );

  // ─── Create Outsider User ─────────────────────────────
  const outsider = await UserModel.create({
    fullname: "Outsider",
    email: "outsider@test.com",
    password: "hashed",
  });

  outsiderToken = jwt.sign(
    { _id: outsider._id, id: outsider._id },
    JWT_SECRET
  );

  const providerProfile = await ServiceProviderModel.create({
    Useruser_id: providerUser._id,          
    experience_years: 3,                     
    price_per_hour: 500,                    
    is_verified: 1,                          
    rating: 0,                               
    ratingCount: 0,                           
    ServiceCategorycatgeory_id: new mongoose.Types.ObjectId(), 
  });

  providerProfileId = (providerProfile as any)._id.toString();

  //  Create Booking 
  const booking = await BookingModel.create({
    user_id: user._id,
    provider_id: providerProfile._id,
    scheduled_at: new Date(),
    address: "Kathmandu",
    phone_number: "9800000000",
    price_per_hour: providerProfile.price_per_hour,       
    effective_price_per_hour: providerProfile.price_per_hour, 
  });

  bookingId = booking._id.toString();
});

  //  Send message as user
  test("should send message as user", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        booking_id: bookingId,
        content: "Hello provider",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe("Hello provider");
  });

  //  Send message as provider
  test("should send message as provider", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${providerToken}`)
      .send({
        booking_id: bookingId,
        content: "Hello user",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sender_role).toBe("provider");
  });

  // 3️⃣ Not part of booking
  test("should return 403 if not part of booking", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send({
        booking_id: bookingId,
        content: "Hack attempt",
      });

    expect(res.status).toBe(403);
  });

  // 4️⃣ Booking not found
  test("should return 404 if booking not found", async () => {
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        booking_id: fakeId,
        content: "Test",
      });

    expect(res.status).toBe(404);
  });

  // 5️⃣ Get messages
  test("should get messages with pagination", async () => {
    await MessageModel.create({
      booking_id: bookingId,
      sender_id: userId,
      sender_role: "user",
      content: "Test message",
    });

    const res = await request(app)
      .get(`/api/chat/${bookingId}?page=1&size=10`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages.length).toBe(1);
  });

  // 6️⃣ Mark as read
  test("should mark messages as read", async () => {
    await MessageModel.create({
      booking_id: bookingId,
      sender_id: userId,
      sender_role: "user",
      content: "Unread message",
      is_read: false,
    });

    const res = await request(app)
      .patch(`/api/chat/${bookingId}/read`)
      .set("Authorization", `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
  });

  // 7️⃣ Get unread count
  test("should get unread count", async () => {
    await MessageModel.create({
      booking_id: bookingId,
      sender_id: userId,
      sender_role: "user",
      content: "Unread message",
      is_read: false,
    });

    const res = await request(app)
      .get(`/api/chat/${bookingId}/unread`)
      .set("Authorization", `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.unread).toBe(1);
  });
});