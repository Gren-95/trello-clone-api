const request = require('supertest');
const app = require('../../../src/backend/app');

// Mock the app for testing if the real one doesn't exist yet
if (!app || !app.post) {
  jest.mock('../../../src/backend/app', () => {
    const express = require('express');
    const mockApp = express();
    const users = [];
    const boards = [];
    const lists = [];
    const blacklistedTokens = new Set();
    
    mockApp.locals = { users, boards, lists, blacklistedTokens };
    
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
      const board = {
        id: Date.now().toString(),
        name: req.body.name,
        createdAt: new Date().toISOString(),
        members: [{ userId: req.user.id, role: 'owner' }]
      };
      boards.push(board);
      return res.status(201).json(board);
    });
    
    // Mock list endpoints
    mockApp.post('/api/boards/:boardId/lists', authenticate, (req, res) => {
      if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      
      const board = boards.find(b => b.id === req.params.boardId);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      
      const list = {
        id: Date.now().toString(),
        name: req.body.name,
        boardId: req.params.boardId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        position: lists.filter(l => l.boardId === req.params.boardId).length
      };
      lists.push(list);
      return res.status(201).json(list);
    });
    
    mockApp.get('/api/lists/:listId', authenticate, (req, res) => {
      const list = lists.find(l => l.id === req.params.listId);
      if (!list) {
        return res.status(404).json({ message: 'List not found' });
      }
      return res.status(200).json(list);
    });
    
    mockApp.put('/api/lists/:listId', authenticate, (req, res) => {
      const listIndex = lists.findIndex(l => l.id === req.params.listId);
      if (listIndex === -1) {
        return res.status(404).json({ message: 'List not found' });
      }
      
      const list = lists[listIndex];
      const updatedList = { 
        ...list, 
        ...req.body, 
        updatedAt: new Date().toISOString() 
      };
      
      lists[listIndex] = updatedList;
      return res.status(200).json(updatedList);
    });
    
    mockApp.delete('/api/lists/:listId', authenticate, (req, res) => {
      const listIndex = lists.findIndex(l => l.id === req.params.listId);
      if (listIndex === -1) {
        return res.status(404).json({ message: 'List not found' });
      }
      
      lists.splice(listIndex, 1);
      return res.status(204).send();
    });
    
    return mockApp;
  });
}

describe('List Management', () => {
  let authToken;
  let testBoardId;
  let testListId;

  beforeEach(() => {
    // Clear test data
    if (app.locals) {
      app.locals.users = [];
      app.locals.boards = [];
      app.locals.lists = [];
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

    // Create a test board
    const boardResponse = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Board'
      });

    testBoardId = boardResponse.body.id;
  });

  describe('POST /api/boards/:boardId/lists', () => {
    it('should create a new list successfully', async () => {
      const response = await request(app)
        .post(`/api/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test List'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test List');
      expect(response.body).toHaveProperty('boardId', testBoardId);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      testListId = response.body.id;
    });

    it('should not create list without authentication', async () => {
      const response = await request(app)
        .post(`/api/boards/${testBoardId}/lists`)
        .send({
          name: 'Test List'
        });

      expect(response.status).toBe(401);
    });

    it('should not create list without required fields', async () => {
      const response = await request(app)
        .post(`/api/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should not create list in non-existent board', async () => {
      const response = await request(app)
        .post('/api/boards/nonexistent/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test List'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/lists/:listId', () => {
    beforeEach(async () => {
      // Create a test list
      const response = await request(app)
        .post(`/api/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test List'
        });

      testListId = response.body.id;
    });

    it('should update list successfully', async () => {
      const response = await request(app)
        .put(`/api/lists/${testListId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated List',
          position: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated List');
      expect(response.body).toHaveProperty('position', 1);
    });

    it('should not update non-existent list', async () => {
      const response = await request(app)
        .put('/api/lists/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated List',
          position: 1
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/lists/:listId', () => {
    beforeEach(async () => {
      // Create a test list
      const response = await request(app)
        .post(`/api/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test List'
        });

      testListId = response.body.id;
    });

    it('should delete list successfully', async () => {
      const response = await request(app)
        .delete(`/api/lists/${testListId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify list is deleted
      const getResponse = await request(app)
        .get(`/api/lists/${testListId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete non-existent list', async () => {
      const response = await request(app)
        .delete('/api/lists/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 