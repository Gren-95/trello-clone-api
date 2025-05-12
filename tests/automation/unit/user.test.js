const request = require('supertest');
const app = require('../../../server');

describe('User Registration', () => {
  beforeEach(() => {
    // Clear any test data before each test
    app.locals.users = [];
  });

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        username: 'testuser',
        password: 'Test123!'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('username', 'testuser');
    expect(response.body).not.toHaveProperty('password');
  });

  it('should not register a user with existing username', async () => {
    // First registration
    await request(app)
      .post('/users')
      .send({
        username: 'testuser',
        password: 'Test123!'
      });

    // Try to register the same username again
    const response = await request(app)
      .post('/users')
      .send({
        username: 'testuser',
        password: 'Test123!'
      });

    expect(response.status).toBe(409);
  });

  it('should not register a user without required fields', async () => {
    const response = await request(app)
      .post('/users')
      .send({
        username: 'testuser'
        // Missing password
      });

    expect(response.status).toBe(400);
  });
}); 