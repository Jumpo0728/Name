const request = require('supertest');
const server = require('../server/server');
const db = require('../server/db');
const redis = require('../server/redis');

// Clean up DB before tests
beforeAll((done) => {
    db.run("DELETE FROM users", () => {
        db.run("DELETE FROM projects", done);
    });
});

afterAll((done) => {
    server.close();
    db.close();
    // redis.quit(); // If redis was connected
    done();
});

describe('Auth API', () => {
    let token;

    test('should signup a new user', async () => {
        const res = await request(server)
            .post('/api/auth/signup')
            .send({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(201);
    });

    test('should login user', async () => {
        const res = await request(server)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('accessToken');
        token = res.body.accessToken;
    });

    test('should fail login with wrong password', async () => {
        const res = await request(server)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toEqual(401);
    });
});
