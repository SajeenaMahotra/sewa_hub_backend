import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';

describe('Admin User Management Integration Tests', () => {
    const adminUser = {
        fullname: 'Admin User',
        email: 'admin@example.com',
        password: 'AdminPass123!',
        confirmPassword: 'AdminPass123!',
        role: 'admin'
    };

    const regularUser = {
        fullname: 'Regular User',
        email: 'user@example.com',
        password: 'UserPass123!',
        confirmPassword: 'UserPass123!',
        role: 'user'
    };

    let adminToken: string;
    let userToken: string;
    let createdUserId: string;
    let regularUserId: string;

    beforeAll(async () => {
        await UserModel.deleteMany({});

        // Create admin user - register as regular user first
        const adminResponse = await request(app)
            .post('/api/auth/register')
            .send({
                fullname: adminUser.fullname,
                email: adminUser.email,
                password: adminUser.password,
                confirmPassword: adminUser.confirmPassword,
                role: 'user' // Register as user first
            });

        if (adminResponse.status !== 201) {
            throw new Error(`Admin registration failed: ${JSON.stringify(adminResponse.body)}`);
        }

        // Manually update role to admin in database (like you do in MongoDB Compass)
        await UserModel.findOneAndUpdate(
            { email: adminUser.email },
            { role: 'admin' }
        );

        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: adminUser.email, password: adminUser.password });

        if (adminLogin.status !== 200) {
            throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.body)}`);
        }

        adminToken = adminLogin.body.token;

        // Create regular user
        const userResponse = await request(app)
            .post('/api/auth/register')
            .send(regularUser);

        if (userResponse.status !== 201) {
            throw new Error(`User registration failed: ${JSON.stringify(userResponse.body)}`);
        }

        regularUserId = userResponse.body.data._id;

        const userLogin = await request(app)
            .post('/api/auth/login')
            .send({ email: regularUser.email, password: regularUser.password });

        if (userLogin.status !== 200) {
            throw new Error(`User login failed: ${JSON.stringify(userLogin.body)}`);
        }

        userToken = userLogin.body.token;
    });

    afterAll(async () => {
        await UserModel.deleteMany({});
    });

    describe('POST /api/admin/users - Create User', () => {
        test('should create a new user as admin', async () => {
            const newUser = {
                fullname: 'New Admin Created User',
                email: 'newuser@example.com',
                password: 'NewPass123!',
                confirmPassword: 'NewPass123!',
                role: 'user'
            };

            const response = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'User Created');
            expect(response.body.data).toHaveProperty('_id');
            expect(response.body.data).toHaveProperty('email', newUser.email);

            createdUserId = response.body.data._id;
        });

        test('should hash password when creating user as admin', async () => {
            const user = await UserModel.findById(createdUserId);

            expect(user).toBeTruthy();
            expect(user?.password).not.toBe('NewPass123!');
            expect(user?.password.length).toBeGreaterThan(20);
        });

    });

    describe('GET /api/admin/users - Get All Users', () => {
        test('should get all users as admin', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'All Users Retrieved');
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body).toHaveProperty('pagination');
        });

        test('should return pagination metadata', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.body.pagination).toHaveProperty('page');
            expect(response.body.pagination).toHaveProperty('size');
            expect(response.body.pagination).toHaveProperty('totalItems');
            expect(response.body.pagination).toHaveProperty('totalPages');
        });
    });


    describe('GET /api/admin/users/:id - Get User By ID', () => {
        test('should get user by ID as admin', async () => {
            const response = await request(app)
                .get(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'Single User Retrieved');
            expect(response.body.data).toHaveProperty('_id', createdUserId);
        });
    });

    describe('PUT /api/admin/users/:id - Update User', () => {
        test('should update user fullname as admin', async () => {
            const updateData = {
                fullname: 'Updated Fullname'
            };

            const response = await request(app)
                .put(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'User Updated');
            expect(response.body.data).toHaveProperty('fullname', 'Updated Fullname');
        });

        test('should update multiple fields at once', async () => {
            const updateData = {
                fullname: 'Multi Update',
                email: 'multiupdate@example.com'
            };

            const response = await request(app)
                .put(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('fullname', 'Multi Update');
            expect(response.body.data).toHaveProperty('email', 'multiupdate@example.com');
        });
    });

    describe('DELETE /api/admin/users/:id - Delete User', () => {
        test('should delete user as admin', async () => {
            const response = await request(app)
                .delete(`/api/admin/users/${createdUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', 'User Deleted');
        });
    });
});