/**
 * Test utilities for automation tests
 */

/**
 * Creates a mock JWT token for testing
 * @param {Object} payload - The payload to include in the token
 * @returns {string} - A mock JWT token
 */
function createMockToken(payload = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64');
  const signature = 'mocksignature';
  return `${header}.${body}.${signature}`;
}

/**
 * Generate test user data
 * @returns {Object} - User data with random username
 */
function generateTestUser() {
  const randId = Math.floor(Math.random() * 10000);
  return {
    username: `test_user_${randId}`,
    email: `test${randId}@example.com`,
    password: 'Test123!'
  };
}

/**
 * Generate test board data
 * @returns {Object} - Board data with random name
 */
function generateTestBoard() {
  const randId = Math.floor(Math.random() * 10000);
  return {
    name: `Test Board ${randId}`
  };
}

/**
 * Generate test list data
 * @returns {Object} - List data with random title
 */
function generateTestList() {
  const randId = Math.floor(Math.random() * 10000);
  return {
    title: `Test List ${randId}`
  };
}

/**
 * Generate test card data
 * @returns {Object} - Card data with random title
 */
function generateTestCard() {
  const randId = Math.floor(Math.random() * 10000);
  return {
    title: `Test Card ${randId}`,
    description: `This is a test card description ${randId}`
  };
}

module.exports = {
  createMockToken,
  generateTestUser,
  generateTestBoard,
  generateTestList,
  generateTestCard
}; 