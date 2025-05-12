const request = require('supertest');
const app = require('../../../server');

describe('Authentication', () => {
  beforeEach(() => {
    // Clear test data
    app.locals.users = [];
    app.locals.blacklistedTokens = new Set();
  });

  describe('POST /sessions (Login)', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/users')
        .send({
          username: 'testuser',
          password: 'Test123!'
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({
          username: 'testuser',
          password: 'Test123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({
          username: 'testuser',
          password: 'WrongPass123!'
        });

      expect(response.status).toBe(401);
    });

    it('should not login with non-existent user', async () => {
      const response = await request(app)
        .post('/sessions')
        .send({
          username: 'nonexistent',
          password: 'Test123!'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /sessions (Logout)', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login user
      await request(app)
        .post('/users')
        .send({
          username: 'testuser',
          password: 'Test123!'
        });

      const loginResponse = await request(app)
        .post('/sessions')
        .send({
          username: 'testuser',
          password: 'Test123!'
        });

      authToken = loginResponse.body.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .delete('/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify token is blacklisted
      const protectedResponse = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(protectedResponse.status).toBe(401);
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .delete('/sessions')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
    });
  });
}); 