const request = require('supertest');
const app = require('../../../server');

describe('List Management', () => {
  let authToken;
  let testBoardId;
  let testListId;

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
  });

  describe('POST /boards/:boardId/lists', () => {
    it('should create a new list successfully', async () => {
      const response = await request(app)
        .post(`/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test List'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', 'Test List');
      expect(response.body).toHaveProperty('boardId', testBoardId);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      testListId = response.body.id;
    });

    it('should not create list without authentication', async () => {
      const response = await request(app)
        .post(`/boards/${testBoardId}/lists`)
        .send({
          title: 'Test List'
        });

      expect(response.status).toBe(401);
    });

    it('should not create list without required fields', async () => {
      const response = await request(app)
        .post(`/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should not create list in non-existent board', async () => {
      const response = await request(app)
        .post('/boards/nonexistent/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test List'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /lists/:listId', () => {
    beforeEach(async () => {
      // Create a test list
      const response = await request(app)
        .post(`/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test List'
        });

      testListId = response.body.id;
    });

    it('should update list successfully', async () => {
      const response = await request(app)
        .put(`/lists/${testListId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated List',
          position: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title', 'Updated List');
      expect(response.body).toHaveProperty('position', 1);
    });

    it('should not update non-existent list', async () => {
      const response = await request(app)
        .put('/lists/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated List',
          position: 1
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /lists/:listId', () => {
    beforeEach(async () => {
      // Create a test list
      const response = await request(app)
        .post(`/boards/${testBoardId}/lists`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test List'
        });

      testListId = response.body.id;
    });

    it('should delete list successfully', async () => {
      const response = await request(app)
        .delete(`/lists/${testListId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify list is deleted
      const getResponse = await request(app)
        .get(`/lists/${testListId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete non-existent list', async () => {
      const response = await request(app)
        .delete('/lists/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 