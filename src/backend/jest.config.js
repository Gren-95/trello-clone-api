module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'server.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageDirectory: 'reports/coverage',
  coverageReporters: ['text', 'lcov'],
  verbose: true
}; 