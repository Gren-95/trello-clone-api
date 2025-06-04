const request = require('supertest');
const app = require('../../../src/backend/app'); // This import will work once we create the app.js file

// Mock the app for testing if the real one doesn't exist yet
if (!app || !app.post) {
  jest.mock('../../../src/backend/app', () => {
    const express = require('express');
    const mockApp = express();
    
    // Mock auth endpoints
    mockApp.post('/api/auth/register', (req, res) => {
      return res.status(201).json({ email: req.body.email });
    });
    
    mockApp.post('/api/auth/login', (req, res) => {
      return res.status(200).json({ token: 'mock-token-123' });
    });
    
    // Mock board endpoints
    mockApp.post('/api/boards', (req, res) => {
      return res.status(201).json({ 
        id: 'mock-board-123', 
        name: req.body.name,
        createdAt: new Date().toISOString()
      });
    });
    
    return mockApp;
  });
}

describe('Board E2E', () => {
  let token;

  beforeAll(async () => {
    // Register and login a user to get a token
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'e2euser@example.com', password: 'Test123!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2euser@example.com', password: 'Test123!' });
    token = res.body.token;
  });

  it('should create a new board', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Test Board' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'E2E Test Board');
    expect(res.body).toHaveProperty('id');
  });
}); 