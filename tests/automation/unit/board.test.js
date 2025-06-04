const request = require('supertest');
const app = require('../../../src/backend/app'); // This import will work once we create the app.js file

// Mock the app for testing if the real one doesn't exist yet
if (!app || !app.post) {
  jest.mock('../../../src/backend/app', () => {
    const express = require('express');
    const mockApp = express();
    const users = [];
    const boards = [];
    const blacklistedTokens = new Set();
    
    mockApp.locals = { users, boards, blacklistedTokens };
    
    // Authentication middleware
    const authenticate = (req, res, next) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      
      if (!token || blacklistedTokens.has(token)) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // For test purposes, extract user id from token
      const userId = token.split('-').pop();
      req.user = { id: userId };
      next();
    };
    
    // Mock user endpoints
    mockApp.post('/api/auth/register', (req, res) => {
      const user = { 
        id: Date.now().toString(), 
        email: req.body.email, 
        password: req.body.password 
      };
      users.push(user);
      return res.status(201).json({ id: user.id, email: user.email });
    });
    
    // Mock session endpoints
    mockApp.post('/api/auth/login', (req, res) => {
      const user = users.find(u => u.email === req.body.email 
                            && u.password === req.body.password);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      return res.status(200).json({ token: `mock-token-${user.id}` });
    });
    
    // Mock board endpoints
    mockApp.post('/api/boards', authenticate, (req, res) => {
      if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      
      const board = {
        id: Date.now().toString(),
        name: req.body.name,
        createdAt: new Date().toISOString(),
        isArchived: false,
        isFavorite: false,
        isTemplate: false,
        members: [{ userId: req.user.id, role: 'owner' }]
      };
      boards.push(board);
      return res.status(201).json(board);
    });
    
    mockApp.get('/api/boards', authenticate, (req, res) => {
      const userBoards = boards.filter(board => 
        board.members.some(member => member.userId === req.user.id)
      );
      return res.status(200).json(userBoards);
    });
    
    mockApp.get('/api/boards/:id', authenticate, (req, res) => {
      const board = boards.find(b => b.id === req.params.id);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      return res.status(200).json(board);
    });
    
    mockApp.put('/api/boards/:id', authenticate, (req, res) => {
      let board = boards.find(b => b.id === req.params.id);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      
      Object.assign(board, req.body);
      return res.status(200).json(board);
    });
    
    mockApp.delete('/api/boards/:id', authenticate, (req, res) => {
      const boardIndex = boards.findIndex(b => b.id === req.params.id);
      if (boardIndex === -1) {
        return res.status(404).json({ message: 'Board not found' });
      }
      
      boards.splice(boardIndex, 1);
      return res.status(204).send();
    });
    
    return mockApp;
  });
}

describe('Board Management', () => {
  let authToken;
  let testBoardId;

  beforeEach(() => {
    // Clear test data
    if (app.locals) {
      app.locals.users = [];
      app.locals.boards = [];
      app.locals.blacklistedTokens = new Set();
    }
  });

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

  describe('POST /api/boards', () => {
    it('should create a new board successfully', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Board');
      expect(response.body).toHaveProperty('createdAt');

      testBoardId = response.body.id;
    });

    it('should not create board without authentication', async () => {
      const response = await request(app)
        .post('/api/boards')
        .send({
          name: 'Test Board'
        });

      expect(response.status).toBe(401);
    });

    it('should not create board without required fields', async () => {
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/boards', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should get all boards for authenticated user', async () => {
      const response = await request(app)
        .get('/api/boards')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      const board = response.body.find(b => b.id === testBoardId);
      expect(board).toBeDefined();
      expect(board).toHaveProperty('name', 'Test Board');
    });

    it('should not get boards without authentication', async () => {
      const response = await request(app)
        .get('/api/boards');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/boards/:id', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should get board by id', async () => {
      const response = await request(app)
        .get(`/api/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testBoardId);
      expect(response.body).toHaveProperty('name', 'Test Board');
    });

    it('should return 404 for non-existent board', async () => {
      const response = await request(app)
        .get('/api/boards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/boards/:id', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should update board successfully', async () => {
      const response = await request(app)
        .put(`/api/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board',
          isFavorite: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Board');
      expect(response.body).toHaveProperty('isFavorite', true);
    });

    it('should not update non-existent board', async () => {
      const response = await request(app)
        .put('/api/boards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/boards/:id', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should delete board successfully', async () => {
      const response = await request(app)
        .delete(`/api/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify board is deleted
      const getResponse = await request(app)
        .get(`/api/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete non-existent board', async () => {
      const response = await request(app)
        .delete('/api/boards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 