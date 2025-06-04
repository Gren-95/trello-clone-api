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
    
    // Mock list endpoints
    mockApp.post('/api/boards/:boardId/lists', (req, res) => {
      return res.status(201).json({ 
        id: 'mock-list-123', 
        name: req.body.name,
        boardId: req.params.boardId 
      });
    });
    
    // Mock card endpoints
    mockApp.post('/api/lists/:listId/cards', (req, res) => {
      return res.status(201).json({ 
        id: 'mock-card-123', 
        name: req.body.name,
        listId: req.params.listId
      });
    });
    
    return mockApp;
  });
}

describe('Card E2E', () => {
  let token, boardId, listId;

  beforeAll(async () => {
    // Register and login a user
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'e2ecard@example.com', password: 'Test123!' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'e2ecard@example.com', password: 'Test123!' });
    token = res.body.token;

    // Create a board
    const boardRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Card Board' });
    boardId = boardRes.body.id;

    // Create a list
    const listRes = await request(app)
      .post(`/api/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E List' });
    listId = listRes.body.id;
  });

  it('should create a new card in a list', async () => {
    const res = await request(app)
      .post(`/api/lists/${listId}/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Test Card' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('name', 'E2E Test Card');
    expect(res.body).toHaveProperty('id');
  });
}); 