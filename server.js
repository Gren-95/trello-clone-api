const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const path = require('path');
const swaggerDocument = YAML.load('./openapi.yaml');
const app = express();
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());

// Load OpenAPI specification from YAML file
const swaggerDocumentYAML = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Serve Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In-memory storage
let boards = [];
let lists = [];
let cards = [];

// Add JWT secret key (in production, this should be in environment variables)
const JWT_SECRET = 'your-secret-key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Login endpoint (for testing purposes)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // In a real application, you would validate credentials against a database
  // This is just for demonstration
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Apply authentication middleware to all routes except login
app.use('/*', (req, res, next) => {
  if (req.path === '/login') {
    return next();
  }
  authenticateToken(req, res, next);
});

// GET /boards
app.get('/boards', (req, res) => {
  res.status(200).json(boards);
});

// POST /boards
app.post('/boards', (req, res) => {
  const { name } = req.body;
  const newBoard = { id: Date.now().toString(), name, createdAt: new Date().toISOString() };
  boards.push(newBoard);
  res.status(201).json(newBoard);
});

app.get('/boards/:boardId/lists', (req, res) => {
  const boardLists = lists.filter(list => list.boardId === req.params.boardId);
  res.json(boardLists);
});

app.post('/boards/:boardId/lists', (req, res) => {
  const { title } = req.body;
  const newList = {
    id: Date.now().toString(),
    boardId: req.params.boardId,
    title,
    createdAt: new Date().toISOString()
  };
  lists.push(newList);
  res.status(201).json(newList);
});

app.post('/lists/:listId/cards', (req, res) => {
  const { title, description } = req.body;
  const newCard = {
    id: Date.now().toString(),
    listId: req.params.listId,
    title,
    description,
    createdAt: new Date().toISOString()
  };
  cards.push(newCard);
  res.status(201).json(newCard);
});

app.get('/lists/:listId/cards', (req, res) => {
  const listCards = cards.filter(card => card.listId === req.params.listId);
  res.json(listCards);
});

app.delete('/boards/:boardId', (req, res) => {
  const boardId = req.params.boardId;
  boards = boards.filter(board => board.id !== boardId);
  // Also delete associated lists and cards
  const boardLists = lists.filter(list => list.boardId === boardId);
  const listIds = boardLists.map(list => list.id);
  lists = lists.filter(list => list.boardId !== boardId);
  cards = cards.filter(card => !listIds.includes(card.listId));
  res.status(204).send();
});

app.delete('/lists/:listId', (req, res) => {
  const listId = req.params.listId;
  lists = lists.filter(list => list.id !== listId);
  // Also delete associated cards
  cards = cards.filter(card => card.listId !== listId);
  res.status(204).send();
});

app.delete('/cards/:cardId', (req, res) => {
  const cardId = req.params.cardId;
  cards = cards.filter(card => card.id !== cardId);
  res.status(204).send();
});

app.patch('/cards/:cardId/move', (req, res) => {
  const { cardId } = req.params;
  const { listId } = req.body;
  
  const cardIndex = cards.findIndex(card => card.id === cardId);
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  cards[cardIndex] = {
    ...cards[cardIndex],
    listId
  };
  
  res.json(cards[cardIndex]);
});

app.patch('/boards/:boardId', (req, res) => {
  const { boardId } = req.params;
  const { name } = req.body;
  
  const board = boards.find(b => b.id === boardId);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  
  board.name = name;
  res.json(board);
});

app.put('/lists/:listId', (req, res) => {
  const { listId } = req.params;
  const { title, boardId } = req.body;
  
  const listIndex = lists.findIndex(l => l.id === listId);
  if (listIndex === -1) {
    return res.status(404).json({ 
      error: 'List not found',
      message: `No list found with ID: ${listId}`
    });
  }
  
  lists[listIndex] = {
    ...lists[listIndex],
    title: title || lists[listIndex].title,
    boardId: boardId || lists[listIndex].boardId,
    updatedAt: new Date().toISOString()
  };
  
  res.json(lists[listIndex]);
});

app.put('/cards/:cardId', (req, res) => {
  const { cardId } = req.params;
  const { title, description, listId } = req.body;
  
  const cardIndex = cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  cards[cardIndex] = {
    ...cards[cardIndex],
    title: title || cards[cardIndex].title,
    description: description || cards[cardIndex].description,
    listId: listId || cards[cardIndex].listId,
    updatedAt: new Date().toISOString()
  };
  
  res.json(cards[cardIndex]);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Docs available at http://localhost:${port}/docs`);
});
