const request = require('supertest');
const app = require('../../../server');

describe('Board Management', () => {
  let authToken;
  let testBoardId;

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
  });

  describe('POST /boards', () => {
    it('should create a new board successfully', async () => {
      const response = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Board');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('isArchived', false);
      expect(response.body).toHaveProperty('isFavorite', false);
      expect(response.body).toHaveProperty('isTemplate', false);
      expect(response.body).toHaveProperty('members');
      expect(Array.isArray(response.body.members)).toBe(true);
      expect(response.body.members[0]).toHaveProperty('role', 'owner');
      expect(response.body.members[0]).toHaveProperty('userId');

      testBoardId = response.body.id;
    });

    it('should not create board without authentication', async () => {
      const response = await request(app)
        .post('/boards')
        .send({
          name: 'Test Board'
        });

      expect(response.status).toBe(401);
    });

    it('should not create board without required fields', async () => {
      const response = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('GET /boards', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should get all boards for authenticated user', async () => {
      const response = await request(app)
        .get('/boards')
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
        .get('/boards');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /boards/:id', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should get board by id', async () => {
      const response = await request(app)
        .get(`/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testBoardId);
      expect(response.body).toHaveProperty('name', 'Test Board');
    });

    it('should return 404 for non-existent board', async () => {
      const response = await request(app)
        .get('/boards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /boards/:id', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should update board successfully', async () => {
      const response = await request(app)
        .put(`/boards/${testBoardId}`)
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
        .put('/boards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Board'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /boards/:id', () => {
    beforeEach(async () => {
      // Create a test board
      const response = await request(app)
        .post('/boards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Board'
        });

      testBoardId = response.body.id;
    });

    it('should delete board successfully', async () => {
      const response = await request(app)
        .delete(`/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify board is deleted
      const getResponse = await request(app)
        .get(`/boards/${testBoardId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete non-existent board', async () => {
      const response = await request(app)
        .delete('/boards/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 