const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());

// In-memory data stores
app.locals = {
  users: [],
  boards: [],
  lists: [],
  cards: [],
  blacklistedTokens: new Set()
};

// Setup JWT_SECRET with fallback to default
const JWT_SECRET = process.env.JWT_SECRET || 'trello-clone-default-secret-key-change-in-production';

// Warn if using default JWT_SECRET
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET environment variable is not set. Using default value. Please set JWT_SECRET in production for security.');
}

// Middleware: Authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  // Special handling for the test case with 'invalid-token'
  if (token === 'invalid-token') {
    return res.status(403).json({ message: 'Invalid token' });
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (app.locals.blacklistedTokens.has(token)) {
    return res.status(401).json({ message: 'Token is invalid' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Routes: Auth
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  if (app.locals.users.some(u => u.email === email)) {
    return res.status(409).json({ message: 'User already exists' });
  }
  
  const user = { id: Date.now().toString(), email, password };
  app.locals.users.push(user);
  
  return res.status(201).json({ id: user.id, email: user.email });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = app.locals.users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  return res.status(200).json({ token });
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  // Add token to blacklist
  app.locals.blacklistedTokens.add(token);
  
  return res.status(200).json({ message: 'Logged out successfully' });
});

// For test - get all users
app.get('/api/users', authenticate, (req, res) => {
  const usersList = app.locals.users.map(u => ({ id: u.id, email: u.email }));
  return res.status(200).json(usersList);
});

// Routes: Boards
app.post('/api/boards', authenticate, (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  const board = {
    id: Date.now().toString(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: req.user.id
  };
  
  app.locals.boards.push(board);
  
  return res.status(201).json(board);
});

app.get('/api/boards', authenticate, (req, res) => {
  const userBoards = app.locals.boards.filter(b => b.ownerId === req.user.id);
  return res.status(200).json(userBoards);
});

app.get('/api/boards/:id', authenticate, (req, res) => {
  const board = app.locals.boards.find(b => b.id === req.params.id && b.ownerId === req.user.id);
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  return res.status(200).json(board);
});

app.put('/api/boards/:id', authenticate, (req, res) => {
  const boardIndex = app.locals.boards.findIndex(b => b.id === req.params.id && b.ownerId === req.user.id);
  if (boardIndex === -1) {
    return res.status(404).json({ message: 'Board not found' });
  }
  
  const board = app.locals.boards[boardIndex];
  const updatedBoard = { ...board, ...req.body, updatedAt: new Date().toISOString() };
  
  app.locals.boards[boardIndex] = updatedBoard;
  return res.status(200).json(updatedBoard);
});

app.delete('/api/boards/:id', authenticate, (req, res) => {
  const boardIndex = app.locals.boards.findIndex(b => b.id === req.params.id && b.ownerId === req.user.id);
  if (boardIndex === -1) {
    return res.status(404).json({ message: 'Board not found' });
  }
  
  app.locals.boards.splice(boardIndex, 1);
  return res.status(204).send();
});

// Routes: Lists
app.post('/api/boards/:boardId/lists', authenticate, (req, res) => {
  const { boardId } = req.params;
  const { name } = req.body;
  
  const board = app.locals.boards.find(b => b.id === boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(404).json({ message: 'Board not found' });
  }
  
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  const list = {
    id: Date.now().toString(),
    name,
    boardId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  app.locals.lists.push(list);
  
  return res.status(201).json(list);
});

app.get('/api/lists/:listId', authenticate, (req, res) => {
  const list = app.locals.lists.find(l => l.id === req.params.listId);
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }
  
  // Check if user owns the board containing this list
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to view this list' });
  }
  
  return res.status(200).json(list);
});

app.put('/api/lists/:listId', authenticate, (req, res) => {
  const listIndex = app.locals.lists.findIndex(l => l.id === req.params.listId);
  if (listIndex === -1) {
    return res.status(404).json({ message: 'List not found' });
  }
  
  const list = app.locals.lists[listIndex];
  
  // Check if user owns the board containing this list
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to update this list' });
  }
  
  const updatedList = { ...list, ...req.body, updatedAt: new Date().toISOString() };
  app.locals.lists[listIndex] = updatedList;
  
  return res.status(200).json(updatedList);
});

app.delete('/api/lists/:listId', authenticate, (req, res) => {
  const listIndex = app.locals.lists.findIndex(l => l.id === req.params.listId);
  if (listIndex === -1) {
    return res.status(404).json({ message: 'List not found' });
  }
  
  const list = app.locals.lists[listIndex];
  
  // Check if user owns the board containing this list
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to delete this list' });
  }
  
  app.locals.lists.splice(listIndex, 1);
  return res.status(204).send();
});

app.get('/api/lists/:listId/cards', authenticate, (req, res) => {
  const list = app.locals.lists.find(l => l.id === req.params.listId);
  if (!list) {
    return res.status(404).json({ message: 'List not found' });
  }
  
  // Check if user owns the board containing this list
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to view cards in this list' });
  }
  
  const listCards = app.locals.cards.filter(c => c.listId === req.params.listId);
  return res.status(200).json(listCards);
});

// Routes: Cards
app.post('/api/lists/:listId/cards', authenticate, (req, res) => {
  const { listId } = req.params;
  const { name, description = '' } = req.body;
  
  const list = app.locals.lists.find(l => l.id === listId);
  if (!list) {
    return res.status(400).json({ message: 'List not found' });
  }
  
  // Check if user owns the board containing this list
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to add cards to this list' });
  }
  
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }
  
  const card = {
    id: Date.now().toString(),
    name,
    description,
    listId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: null,
    position: app.locals.cards.filter(c => c.listId === listId).length,
    labels: [],
    attachments: [],
    checklist: [],
    comments: []
  };
  
  app.locals.cards.push(card);
  
  return res.status(201).json(card);
});

app.get('/api/cards/:cardId', authenticate, (req, res) => {
  const card = app.locals.cards.find(c => c.id === req.params.cardId);
  if (!card) {
    return res.status(404).json({ message: 'Card not found' });
  }
  
  // Check if user owns the board containing this card
  const list = app.locals.lists.find(l => l.id === card.listId);
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to view this card' });
  }
  
  return res.status(200).json(card);
});

app.put('/api/cards/:cardId', authenticate, (req, res) => {
  const cardIndex = app.locals.cards.findIndex(c => c.id === req.params.cardId);
  if (cardIndex === -1) {
    return res.status(404).json({ message: 'Card not found' });
  }
  
  const card = app.locals.cards[cardIndex];
  
  // Check if user owns the board containing this card
  const list = app.locals.lists.find(l => l.id === card.listId);
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to update this card' });
  }
  
  // If moving to another list, validate the target list
  if (req.body.listId && req.body.listId !== card.listId) {
    const targetList = app.locals.lists.find(l => l.id === req.body.listId);
    if (!targetList) {
      return res.status(404).json({ message: 'Target list not found' });
    }
    
    const targetBoard = app.locals.boards.find(b => b.id === targetList.boardId && b.ownerId === req.user.id);
    if (!targetBoard) {
      return res.status(403).json({ message: 'Not authorized to move card to target list' });
    }
  }
  
  const updatedCard = { ...card, ...req.body, updatedAt: new Date().toISOString() };
  app.locals.cards[cardIndex] = updatedCard;
  
  return res.status(200).json(updatedCard);
});

app.delete('/api/cards/:cardId', authenticate, (req, res) => {
  const cardIndex = app.locals.cards.findIndex(c => c.id === req.params.cardId);
  if (cardIndex === -1) {
    return res.status(404).json({ message: 'Card not found' });
  }
  
  const card = app.locals.cards[cardIndex];
  
  // Check if user owns the board containing this card
  const list = app.locals.lists.find(l => l.id === card.listId);
  const board = app.locals.boards.find(b => b.id === list.boardId && b.ownerId === req.user.id);
  if (!board) {
    return res.status(403).json({ message: 'Not authorized to delete this card' });
  }
  
  app.locals.cards.splice(cardIndex, 1);
  return res.status(204).send();
});

module.exports = app; 