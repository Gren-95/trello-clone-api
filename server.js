const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const path = require('path');
const swaggerDocument = require('./swagger.json');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Load OpenAPI specification from YAML file
const swaggerDocumentYAML = YAML.load(path.join(__dirname, 'openapi.yaml'));

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// In-memory storage
let boards = [];
let lists = [];
let cards = [];

// GET /boards
app.get('/api/v1/boards', (req, res) => {
  res.status(200).json(boards);
});

// POST /boards
app.post('/api/v1/boards', (req, res) => {
  const { name } = req.body;
  const newBoard = { id: Date.now().toString(), name, createdAt: new Date().toISOString() };
  boards.push(newBoard);
  res.status(201).json(newBoard);
});

app.get('/api/v1/boards/:boardId/lists', (req, res) => {
  const boardLists = lists.filter(list => list.boardId === req.params.boardId);
  res.json(boardLists);
});

app.post('/api/v1/boards/:boardId/lists', (req, res) => {
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

app.post('/api/v1/lists/:listId/cards', (req, res) => {
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

app.get('/api/v1/lists/:listId/cards', (req, res) => {
  const listCards = cards.filter(card => card.listId === req.params.listId);
  res.json(listCards);
});

app.delete('/api/v1/boards/:boardId', (req, res) => {
  const boardId = req.params.boardId;
  boards = boards.filter(board => board.id !== boardId);
  // Also delete associated lists and cards
  const boardLists = lists.filter(list => list.boardId === boardId);
  const listIds = boardLists.map(list => list.id);
  lists = lists.filter(list => list.boardId !== boardId);
  cards = cards.filter(card => !listIds.includes(card.listId));
  res.status(204).send();
});

app.delete('/api/v1/lists/:listId', (req, res) => {
  const listId = req.params.listId;
  lists = lists.filter(list => list.id !== listId);
  // Also delete associated cards
  cards = cards.filter(card => card.listId !== listId);
  res.status(204).send();
});

app.delete('/api/v1/cards/:cardId', (req, res) => {
  const cardId = req.params.cardId;
  cards = cards.filter(card => card.id !== cardId);
  res.status(204).send();
});

app.patch('/api/v1/cards/:cardId/move', (req, res) => {
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

app.patch('/api/v1/boards/:boardId', (req, res) => {
  const { boardId } = req.params;
  const { name } = req.body;
  
  const board = boards.find(b => b.id === boardId);
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  
  board.name = name;
  res.json(board);
});

app.put('/api/v1/lists/:listId', (req, res) => {
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

app.put('/api/v1/cards/:cardId', (req, res) => {
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
  console.log(`API Docs available at http://localhost:${port}/api-docs`);
});
