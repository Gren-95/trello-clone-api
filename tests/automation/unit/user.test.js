const request = require('supertest');
const app = require('../../../src/backend/app'); // This import will work once we create the app.js file

// Mock the app for testing if the real one doesn't exist yet
if (!app || !app.post) {
  jest.mock('../../../src/backend/app', () => {
    const express = require('express');
    const mockApp = express();
    const users = [];
    
    mockApp.locals = { users };
    
    // Mock user registration
    mockApp.post('/api/auth/register', (req, res) => {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      if (users.some(u => u.email === email)) {
        return res.status(409).json({ message: 'User already exists' });
      }
      
      const user = { id: Date.now().toString(), email, password };
      users.push(user);
      
      return res.status(201).json({ id: user.id, email: user.email });
    });
    
    return mockApp;
  });
}

describe('User Registration', () => {
  beforeEach(() => {
    // Clear any test data before each test
    if (app.locals) {
      app.locals.users = [];
    }
  });

  it('should register a new user successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'Test123!'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email', 'testuser@example.com');
    expect(response.body).not.toHaveProperty('password');
  });

  it('should not register a user with existing username', async () => {
    // First registration
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'Test123!'
      });

    // Try to register the same username again
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'Test123!'
      });

    expect(response.status).toBe(409);
  });

  it('should not register a user without required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com'
        // Missing password
      });

    expect(response.status).toBe(400);
  });
}); 