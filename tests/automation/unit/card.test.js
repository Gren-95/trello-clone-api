const request = require('supertest');
const app = require('../../../server');

describe('Card Management', () => {
  let authToken;
  let testBoardId;
  let testListId;
  let testCardId;

  beforeEach(async () => {
    // Clear test data
    app.locals.users = [];
    app.locals.boards = [];
    app.locals.blacklistedTokens = new Set();

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

    // Create a test board
    const boardResponse = await request(app)
      .post('/boards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Board'
      });

    testBoardId = boardResponse.body.id;

    // Create a test list
    const listResponse = await request(app)
      .post(`/boards/${testBoardId}/lists`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test List'
      });

    testListId = listResponse.body.id;
  });

  describe('POST /lists/:listId/cards', () => {
    it('should create a new card successfully', async () => {
      const response = await request(app)
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Card'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test Card');
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
        .post(`/lists/${testListId}/cards`)
        .send({
          title: 'Test Card'
        });

      expect(response.status).toBe(401);
    });

    it('should not create card without required fields', async () => {
      const response = await request(app)
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should not create card in non-existent list', async () => {
      const response = await request(app)
        .post('/lists/nonexistent/cards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Card'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /cards/:cardId', () => {
    beforeEach(async () => {
      // Create a test card
      const response = await request(app)
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Card'
        });

      testCardId = response.body.id;
    });

    it('should update card successfully', async () => {
      const response = await request(app)
        .put(`/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Card',
          description: 'Updated description',
          position: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated Card');
      expect(response.body).toHaveProperty('description', 'Updated description');
      expect(response.body).toHaveProperty('position', 1);
    });

    it('should not update non-existent card', async () => {
      const response = await request(app)
        .put('/cards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Card',
          position: 1
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /cards/:cardId', () => {
    beforeEach(async () => {
      // Create a test card
      const response = await request(app)
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Card'
        });

      testCardId = response.body.id;
    });

    it('should delete card successfully', async () => {
      const response = await request(app)
        .delete(`/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify card is deleted
      const getResponse = await request(app)
        .get(`/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete non-existent card', async () => {
      const response = await request(app)
        .delete('/cards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /cards/:cardId (move)', () => {
    let targetListId;

    beforeEach(async () => {
      // Create a test card
      const cardResponse = await request(app)
        .post(`/lists/${testListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Card'
        });

      testCardId = cardResponse.body.id;

      // Create a target list
      const listResponse = await request(app)
        .post(`/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Target List'
        });

      targetListId = listResponse.body.id;
    });

    it('should move card to another list successfully', async () => {
      const response = await request(app)
        .put(`/cards/${testCardId}`)
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
        .get(`/lists/${targetListId}/cards`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      const card = listResponse.body.find(c => c.id === testCardId);
      expect(card).toBeDefined();
      expect(card.listId).toBe(targetListId);
    });

    it('should not move card to non-existent list', async () => {
      const response = await request(app)
        .put(`/cards/${testCardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          listId: 'nonexistent',
          position: 0
        });

      expect(response.status).toBe(404);
    });
  });
}); 