# Trello Clone API

A RESTful API for a Trello-like application with boards, lists, cards, and comments. This project includes comprehensive test coverage with manual test cases, unit tests, and end-to-end tests.

## Project Structure

```
my-app-repo/                      
├── .github/
│   └── workflows/
│       └── ci.yml                # CI pipeline configuration
├── src/                          # Application source code
│   ├── frontend/                 # Frontend code (not implemented in this repo)
│   └── backend/                  # Backend API code
├── tests/                        # All tests and related artifacts
│   ├── manual/                   # Manual tests
│   │   ├── testplan.md           # 19-section test plan
│   │   └── testcases/            # Manual test cases (TC-001 through TC-020)
│   └── automation/               # Automated tests
│       ├── e2e/                  # End-to-end tests
│       ├── unit/                 # Unit tests
│       └── helpers/              # Test helper utilities
├── reports/                      # Test run reports and artifacts
│   ├── testrun_*.md              # Test run reports
│   ├── screenshots/              # Test screenshots
│   └── coverage/                 # Code coverage reports
└── README.md                     # This file
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trello-clone-api.git
   cd trello-clone-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the tests

#### Manual Tests

Manual tests are documented in the `tests/manual/` directory. They include:

- A comprehensive test plan (`tests/manual/testplan.md`)
- 20 detailed test cases covering key functionality (`tests/manual/testcases/`)

To review manual test artifacts:
```bash
# Navigate to the test plan
cat tests/manual/testplan.md

# List all test cases
ls -l tests/manual/testcases/
```

#### Automated Tests

Run all tests:
```bash
npm test
```

Run only unit tests:
```bash
npm run test:unit
```

Run only end-to-end tests:
```bash
npm run test:e2e
```

### Test Reports

Test run reports are stored in the `reports/` directory:
```bash
# View latest test run report
cat reports/testrun_2024-03-19.md
```

## QA Overview

This project follows a comprehensive QA strategy:

1. **Test Planning**: Detailed 19-section test plan covering all aspects of testing
2. **Test Cases**: 20 detailed manual test cases covering critical functionality
3. **Unit Testing**: Jest-based unit tests for all backend components
4. **E2E Testing**: Supertest-based end-to-end tests for API flows
5. **Reporting**: Detailed test run reports with pass/fail status and defect tracking

## CI/CD

The project includes GitHub Actions workflows in `.github/workflows/ci.yml` that:

1. Build the application
2. Run all automated tests
3. Generate test reports
4. Upload reports as artifacts

## License

MIT
