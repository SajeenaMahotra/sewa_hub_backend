import request from "supertest";
import mongoose from "mongoose";
import app from "../../app";
import { connectDatabase } from "../../database/mongodb";
import { UserModel } from "../../models/user.model";
import { ServiceCategoryModel } from "../../models/servicecategory.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let adminToken: string;
let userToken: string;
let categoryId: string;

beforeAll(async () => {
  await connectDatabase();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // ── Seed admin user ────────────────────────────────────────────
  const admin = await UserModel.create({
    fullname: "Admin User",
    email: `admin_cat_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "admin",
  });
  adminToken = jwt.sign(
    { id: admin._id, role: "admin" },
    process.env.JWT_SECRET as string
  );

  // ── Seed regular user (no admin privileges) ───────────────────
  const user = await UserModel.create({
    fullname: "Regular User",
    email: `user_cat_${Date.now()}@test.com`,
    password: hashedPassword,
    role: "user",
  });
  userToken = jwt.sign(
    { id: user._id, role: "user" },
    process.env.JWT_SECRET as string
  );

  // ── Seed one category for read/update/delete tests ────────────
  const category = await ServiceCategoryModel.create({
    category_name: `Electrician_${Date.now()}`,
    description: "Electrical services",
  });
  categoryId = category._id.toString();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("ServiceCategory API", () => {

  // ─── 1. Fetch all categories (public) ─────────────────────────
  it("should fetch all categories without token", async () => {
    const res = await request(app).get("/api/service-categories");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  // ─── 2. Fetch category by ID (public) ─────────────────────────
  it("should fetch a category by ID", async () => {
    const res = await request(app).get(`/api/service-categories/${categoryId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(categoryId);
    expect(res.body.data).toHaveProperty("category_name");
  });

  // ─── 3. Fetch non-existent category returns 404 ───────────────
  it("should return 404 for non-existent category", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/service-categories/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ─── 4. Admin can create a category ───────────────────────────
  it("should allow admin to create a category", async () => {
    const res = await request(app)
      .post("/api/service-categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("category_name", `Plumbing_${Date.now()}`)
      .field("description", "Plumbing services");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("category_name");
  });

  // ─── 5. Cannot create category without token ──────────────────
  it("should return 401 when creating category without token", async () => {
    const res = await request(app)
      .post("/api/service-categories")
      .send({ category_name: "Carpentry" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ─── 6. Admin can update a category ───────────────────────────
  it("should allow admin to update a category", async () => {
    const res = await request(app)
      .put(`/api/service-categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Updated description" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe("Updated description");
  });

  // ─── 7. Admin can delete a category ───────────────────────────
  it("should allow admin to delete a category", async () => {
    const temp = await ServiceCategoryModel.create({
      category_name: `TempCat_${Date.now()}`,
    });

    const res = await request(app)
      .delete(`/api/service-categories/${temp._id}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  // ─── 8. Cannot delete category without token ──────────────────
  it("should return 401 when deleting category without token", async () => {
    const res = await request(app).delete(`/api/service-categories/${categoryId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});