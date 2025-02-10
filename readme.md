# Trello Clone

A simple Trello clone built with React and Express, featuring drag-and-drop functionality and real-time updates.

## Features

- Create, edit, and delete boards
- Create, edit, and delete lists within boards
- Create, edit, and delete cards within lists
- Drag and drop cards between lists
- Real-time updates
- OpenAPI/Swagger documentation
- Responsive design

### Backend

- Node.js
- Express
- OpenAPI/Swagger for API documentation
- CORS for cross-origin resource sharing

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation & Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install and start the backend:

```bash
# Make sure you're in the root directory, NOT the frontend directory
npm install
npm init -y  # If package.json doesn't exist
npm install express cors swagger-ui-express
node server.js
```

The backend server will start at http://localhost:3000

## API Documentation

The API documentation is available at http://localhost:3000/api-docs when the backend server is running.

## Usage

1. Open your browser and navigate to http://localhost:5173
2. Start creating boards and lists!

## Development URLs

- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api-docs
