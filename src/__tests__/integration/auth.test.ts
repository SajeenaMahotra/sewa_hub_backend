import request from 'supertest';
import app from '../../app';
import { UserModel } from '../../models/user.model';
import { JWT_SECRET } from '../../config';
import jwt from 'jsonwebtoken';

describe(
    'Authentication Integration Tests', // describe test suite
    () => {//what to run
        const testUser = { //according to your UserModel
            fullname: 'Test User',
            email: 'test@example.com',
            password: 'Password123',
            confirmPassword: 'Password123'
        }

        let authToken: string;
        let userId: string;

        beforeAll(async () => {
            await UserModel.deleteMany({ email: testUser.email });
        });
        afterAll(async () => {
            await UserModel.deleteMany({ email: testUser.email });
        });

        describe(
            'POST /api/auth/register', // nested describe block
            () => {
                test( // actual test case
                    'should register a new user', // test case description
                    async () => { // test case implementation
                        const response = await request(app)
                            .post('/api/auth/register')
                            .send(testUser)

                        expect(response.status).toBe(201);
                        expect(response.body).toHaveProperty(
                            'message',
                            'User Created'
                        );
                    }
                )

                test('should not register a user with duplicate email', async () => {
                    const response = await request(app)
                        .post('/api/auth/register')
                        .send(testUser);

                    expect(response.status).toBe(403);
                    expect(response.body).toHaveProperty('success', false);
                    expect(response.body).toHaveProperty('message', 'Email already in use');
                });

                test('should not register a user without fullname', async () => {
                    const invalidUser = {
                        email: 'nofullname@example.com',
                        password: 'Password123!',
                        role: 'user'
                    };

                    const response = await request(app)
                        .post('/api/auth/register')
                        .send(invalidUser);

                    expect(response.status).toBe(400);
                    expect(response.body).toHaveProperty('success', false);
                });


                test('should not register a user without email', async () => {
                    const invalidUser = {
                        fullname: 'No Email User',
                        password: 'Password123!',
                        role: 'user'
                    };

                    const response = await request(app)
                        .post('/api/auth/register')
                        .send(invalidUser);

                    expect(response.status).toBe(400);
                    expect(response.body).toHaveProperty('success', false);
                });

                test('should not register a user with invalid email format', async () => {
                    const invalidUser = {
                        fullname: 'Invalid Email',
                        email: 'not-an-email',
                        password: 'Password123!',
                        role: 'user'
                    };

                    const response = await request(app)
                        .post('/api/auth/register')
                        .send(invalidUser);

                    expect(response.status).toBe(400);
                    expect(response.body).toHaveProperty('success', false);
                });

                test('should not register a user with password less than 6 characters', async () => {
                    const invalidUser = {
                        fullname: 'Short Password',
                        email: 'short@example.com',
                        password: '12345',
                        role: 'user'
                    };

                    const response = await request(app)
                        .post('/api/auth/register')
                        .send(invalidUser);

                    expect(response.status).toBe(400);
                    expect(response.body).toHaveProperty('success', false);
                });

                test('should hash the password before storing in database', async () => {
                    const user = await UserModel.findOne({ email: testUser.email });

                    expect(user).toBeTruthy();
                    expect(user?.password).not.toBe(testUser.password);
                    expect(user?.password.length).toBeGreaterThan(20);
                });

            }
        );

        describe('POST/api/auth/login', () => {
            test('should login an existing user with correct credentials', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testUser.email, password: testUser.password });

                expect(response.status).toBe(200);
                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('message', 'Login successful');
                expect(response.body).toHaveProperty('token');
                expect(response.body).toHaveProperty('data');

                // Save token for later tests
                authToken = response.body.token;
                userId = response.body.data._id;
            });

            test('should return a valid JWT token on login', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testUser.email, password: testUser.password });

                const token = response.body.token;
                const decoded = jwt.verify(token, JWT_SECRET) as any;

                expect(decoded).toHaveProperty('id');
                expect(decoded).toHaveProperty('email', testUser.email);
                expect(decoded).toHaveProperty('fullname', testUser.fullname);
            });

            test('should not login with incorrect password', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testUser.email, password: 'WrongPassword!' });

                expect(response.status).toBe(401);
                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'Invalid credentials');
            });

            test('should not login with non-existent email', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'nonexistent@example.com', password: 'Password123!' });

                expect(response.status).toBe(404);
                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('message', 'User not found');
            });

            test('should not login without email', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ password: 'Password123!' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            test('should not login without password', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: testUser.email });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

            test('should not login with invalid email format', async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({ email: 'invalid-email', password: 'Password123!' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('success', false);
            });

        });

    }
);