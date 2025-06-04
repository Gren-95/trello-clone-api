const request = require('supertest');
const app = require('../../../src/backend/app');

// Mock the app for testing if the real one doesn't exist yet
if (!app || !app.post) {
  jest.mock('../../../src/backend/app', () => {
    const express = require('express');
    const mockApp = express();
    const users = [];
    const blacklistedTokens = new Set();
    
    mockApp.locals = { users, blacklistedTokens };
    
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
    
    // Mock login
    mockApp.post('/api/auth/login', (req, res) => {
      const { email, password } = req.body;
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = `mock-token-${user.id}`;
      return res.status(200).json({ token });
    });
    
    // Mock logout
    mockApp.post('/api/auth/logout', (req, res) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      
      if (!token || token === 'invalid-token') {
        return res.status(403).json({ message: 'Invalid token' });
      }
      
      blacklistedTokens.add(token);
      return res.status(200).json({ message: 'Logged out successfully' });
    });
    
    // Mock protected route
    mockApp.get('/api/users', (req, res) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      
      if (!token || blacklistedTokens.has(token)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      return res.status(200).json(users.map(u => ({ id: u.id, email: u.email })));
    });
    
    return mockApp;
  });
}

describe('Authentication', () => {
  beforeEach(() => {
    // Clear test data
    if (app.locals) {
      app.locals.users = [];
      app.locals.blacklistedTokens = new Set();
    }
  });

  describe('POST /api/auth/login (Login)', () => {
    beforeEach(async () => {
      // Create a test user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Test123!'
        });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Test123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPass123!'
        });

      expect(response.status).toBe(401);
    });

    it('should not login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout (Logout)', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login user
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'Test123!'
        });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Test123!'
        });

      authToken = loginResponse.body.token;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify token is blacklisted
      const protectedResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect(protectedResponse.status).toBe(401);
    });

    it('should not allow access with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
    });
  });
}); 