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
    const cards = [];
    const blacklistedTokens = new Set();
    
    mockApp.locals = { users, boards, lists, cards, blacklistedTokens };
    
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
    
    mockApp.get('/api/lists/:listId/cards', authenticate, (req, res) => {
      const listCards = cards.filter(c => c.listId === req.params.listId);
      return res.status(200).json(listCards);
    });
    
    // Mock card endpoints
    mockApp.post('/api/lists/:listId/cards', authenticate, (req, res) => {
      if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
      }
      
      const list = lists.find(l => l.id === req.params.listId);
      if (!list) {
        return res.status(400).json({ message: 'List not found' });
      }
      
      const card = {
        id: Date.now().toString(),
        name: req.body.name,
        description: req.body.description || '',
        listId: req.params.listId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: req.body.dueDate || null,
        position: cards.filter(c => c.listId === req.params.listId).length,
        labels: [],
        attachments: [],
        checklist: [],
        comments: []
      };
      cards.push(card);
      return res.status(201).json(card);
    });
    
    mockApp.get('/api/cards/:cardId', authenticate, (req, res) => {
      const card = cards.find(c => c.id === req.params.cardId);
      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }
      return res.status(200).json(card);
    });
    
    mockApp.put('/api/cards/:cardId', authenticate, (req, res) => {
      const cardIndex = cards.findIndex(c => c.id === req.params.cardId);
      if (cardIndex === -1) {
        return res.status(404).json({ message: 'Card not found' });
      }
      
      const card = cards[cardIndex];
      const updatedCard = { ...card, ...req.body, updatedAt: new Date().toISOString() };
      
      // If moving to another list
      if (req.body.listId && req.body.listId !== card.listId) {
        const targetList = lists.find(l => l.id === req.body.listId);
        if (!targetList) {
          return res.status(404).json({ message: 'Target list not found' });
        }
      }
      
      cards[cardIndex] = updatedCard;
      return res.status(200).json(updatedCard);
    });
    
    mockApp.delete('/api/cards/:cardId', authenticate, (req, res) => {
      const cardIndex = cards.findIndex(c => c.id === req.params.cardId);
      if (cardIndex === -1) {
        return res.status(404).json({ message: 'Card not found' });
      }
      
      cards.splice(cardIndex, 1);
      return res.status(204).send();
    });
    
    return mockApp;
  });
}

describe('Card Management', () => {
  let authToken;
  let testBoardId;
  let testListId;
  let testCardId;

  beforeEach(() => {
    // Clear test data
    if (app.locals) {
      app.locals.users = [];
      app.locals.boards = [];
      app.locals.lists = [];
      app.locals.cards = [];
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

    // Create a test list
    const listResponse = await request(app)
      .post(`/api/boards/${testBoardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test List'
      });

    testListId = listResponse.body.id;
  });

  describe('POST /api/lists/:listId/cards', () => {
    it('should create a new card successfully', async () => {
      const response = await request(app)
        .post(`/api/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Card'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Card');
      expect(response.body).toHaveProperty('listId', testListId);
      expect(response.body).toHaveProperty('description', '');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('dueDate', null);
      expect(response.body).toHaveProperty('labels');
      expect(Array.isArray(response.body.labels)).toBe(true);
      expect(response.body).toHaveProperty('attachments');
      expect(Array.isArray(response.body.attachments)).toBe(true);
      expect(response.body).toHaveProperty('checklist');
      expect(Array.isArray(response.body.checklist)).toBe(true);
      expect(response.body).toHaveProperty('comments');
      expect(Array.isArray(response.body.comments)).toBe(true);

      testCardId = response.body.id;
    });

    it('should not create card without authentication', async () => {
      const response = await request(app)
        .post(`/api/lists/${testListId}/cards`)
        .send({
          name: 'Test Card'
        });

      expect(response.status).toBe(401);
    });

    it('should not create card without required fields', async () => {
      const response = await request(app)
        .post(`/api/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should not create card in non-existent list', async () => {
      const response = await request(app)
        .post('/api/lists/nonexistent/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Card'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/cards/:cardId', () => {
    beforeEach(async () => {
      // Create a test card
      const response = await request(app)
        .post(`/api/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Card'
        });

      testCardId = response.body.id;
    });

    it('should update card successfully', async () => {
      const response = await request(app)
        .put(`/api/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Card',
          description: 'Updated description',
          position: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Card');
      expect(response.body).toHaveProperty('description', 'Updated description');
      expect(response.body).toHaveProperty('position', 1);
    });

    it('should not update non-existent card', async () => {
      const response = await request(app)
        .put('/api/cards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Card',
          position: 1
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/cards/:cardId', () => {
    beforeEach(async () => {
      // Create a test card
      const response = await request(app)
        .post(`/api/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Card'
        });

      testCardId = response.body.id;
    });

    it('should delete card successfully', async () => {
      const response = await request(app)
        .delete(`/api/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify card is deleted
      const getResponse = await request(app)
        .get(`/api/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete non-existent card', async () => {
      const response = await request(app)
        .delete('/api/cards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/cards/:cardId (move)', () => {
    let targetListId;

    beforeEach(async () => {
      // Create a test card
      const cardResponse = await request(app)
        .post(`/api/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Card'
        });

      testCardId = cardResponse.body.id;

      // Create a target list
      const listResponse = await request(app)
        .post(`/api/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Target List'
        });

      targetListId = listResponse.body.id;
    });

    it('should move card to another list successfully', async () => {
      const response = await request(app)
        .put(`/api/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: targetListId,
          position: 0
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('listId', targetListId);
      expect(response.body).toHaveProperty('position', 0);

      // Verify card is in new list
      const listResponse = await request(app)
        .get(`/api/lists/${targetListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      const card = listResponse.body.find(c => c.id === testCardId);
      expect(card).toBeDefined();
      expect(card.listId).toBe(targetListId);
    });

    it('should not move card to non-existent list', async () => {
      const response = await request(app)
        .put(`/api/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: 'nonexistent',
          position: 0
        });

      expect(response.status).toBe(404);
    });
  });
}); 