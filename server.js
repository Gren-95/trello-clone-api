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

// Update in-memory storage to include users
let users = [];
let boards = [];
let lists = [];
let cards = [];

// Add JWT secret key (in production, this should be in environment variables)
const JWT_SECRET = 'your-secret-key';
const revokedTokens = new Set();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Check if token is revoked
  if (revokedTokens.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    req.token = token; // Store token for logout
    next();
  });
};

// Login endpoint (for testing purposes)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    const userExists = users.find(u => u.username === username);
    if (!userExists) {
      res.status(401).json({ error: 'User not found' });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  }
});

// Move register endpoint before the authentication middleware
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  
  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already taken' });
  }
  
  const newUser = {
    id: Date.now().toString(),
    username,
    password, // In production, this should be hashed
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  // Don't send password in response
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Add users endpoint - place this after the register endpoint but before the authentication middleware
app.get('/users', (req, res) => {
  // Return all users but remove passwords
  const safeUsers = users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  
  res.json(safeUsers);
});

// Fix authentication middleware to exclude both login and register routes
app.use('/*', (req, res, next) => {
  if (req.path === '/login' || req.path === '/register' || req.path === '/docs') {
    return next();
  }
  authenticateToken(req, res, next);
});

// GET /boards
app.get('/boards', authenticateToken, (req, res) => {
  const userBoards = boards.filter(board => board.userId === req.user.userId);
  res.status(200).json(userBoards);
});

// POST /boards
app.post('/boards', (req, res) => {
  const { name } = req.body;
  const newBoard = { 
    id: Date.now().toString(), 
    name, 
    userId: req.user.userId,
    createdAt: new Date().toISOString() 
  };
  boards.push(newBoard);
  res.status(201).json(newBoard);
});

app.get('/boards/:boardId', authenticateToken, (req, res) => {
  const board = boards.find(b => b.id === req.params.boardId);
  
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  
  if (board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to view this board' });
  }
  
  res.json(board);
});

app.get('/boards/:boardId/lists', authenticateToken, (req, res) => {
  const board = boards.find(b => b.id === req.params.boardId);
  
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  
  if (board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to view this board\'s lists' });
  }
  
  const boardLists = lists.filter(list => list.boardId === req.params.boardId);
  res.json(boardLists);
});

app.post('/boards/:boardId/lists', (req, res) => {
  const { title } = req.body;
  const board = boards.find(b => b.id === req.params.boardId);
  
  // Check if board exists and user owns it
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  if (board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to add lists to this board' });
  }

  const newList = {
    id: Date.now().toString(),
    boardId: req.params.boardId,
    userId: req.user.userId,
    title,
    createdAt: new Date().toISOString()
  };
  lists.push(newList);
  res.status(201).json(newList);
});

app.post('/lists/:listId/cards', (req, res) => {
  const { title, description } = req.body;
  const list = lists.find(l => l.id === req.params.listId);
  
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }
  
  // Check if user owns the board that contains this list
  const board = boards.find(b => b.id === list.boardId);
  if (!board || board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to add cards to this list' });
  }

  const newCard = {
    id: Date.now().toString(),
    listId: req.params.listId,
    userId: req.user.userId,
    title,
    description,
    createdAt: new Date().toISOString()
  };
  cards.push(newCard);
  res.status(201).json(newCard);
});

app.get('/lists/:listId/cards', (req, res) => {
  const list = lists.find(l => l.id === req.params.listId);
  
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }
  
  // Check if user owns the board that contains this list
  const board = boards.find(b => b.id === list.boardId);
  if (!board || board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to view cards in this list' });
  }

  const listCards = cards.filter(card => card.listId === req.params.listId);
  res.json(listCards);
});

app.delete('/boards/:boardId', (req, res) => {
  const boardId = req.params.boardId;
  const board = boards.find(b => b.id === boardId);
  
  if (!board) {
    return res.status(404).json({ error: 'Board not found' });
  }
  
  if (board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to delete this board' });
  }
  
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
  const list = lists.find(l => l.id === listId);
  
  if (!list) {
    return res.status(404).json({ error: 'List not found' });
  }
  
  // Check if user owns the board that contains this list
  const board = boards.find(b => b.id === list.boardId);
  if (!board || board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to delete this list' });
  }

  lists = lists.filter(list => list.id !== listId);
  // Also delete associated cards
  cards = cards.filter(card => card.listId !== listId);
  res.status(204).send();
});

app.delete('/cards/:cardId', (req, res) => {
  const cardId = req.params.cardId;
  const card = cards.find(c => c.id === cardId);
  
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  // Check if user owns the board that contains this card
  const list = lists.find(l => l.id === card.listId);
  const board = boards.find(b => b.id === list.boardId);
  if (!board || board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to delete this card' });
  }

  cards = cards.filter(card => card.id !== cardId);
  res.status(204).send();
});

app.patch('/cards/:cardId/move', (req, res) => {
  const { cardId } = req.params;
  const { listId } = req.body;
  
  const card = cards.find(c => c.id === cardId);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  
  // Check if user owns both the source and target boards
  const sourceList = lists.find(l => l.id === card.listId);
  const targetList = lists.find(l => l.id === listId);
  const sourceBoard = boards.find(b => b.id === sourceList.boardId);
  const targetBoard = boards.find(b => b.id === targetList.boardId);
  
  if (!sourceBoard || !targetBoard || 
      sourceBoard.userId !== req.user.userId || 
      targetBoard.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to move this card' });
  }

  const cardIndex = cards.findIndex(c => c.id === cardId);
  cards[cardIndex] = {
    ...cards[cardIndex],
    listId,
    updatedAt: new Date().toISOString()
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
  
  if (board.userId !== req.user.userId) {
    return res.status(403).json({ error: 'Not authorized to modify this board' });
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

// Add logout endpoint before the authentication middleware
app.post('/logout', authenticateToken, (req, res) => {
  // Add token to revoked tokens set
  revokedTokens.add(req.token);
  
  // In a production environment, you might want to clean up old tokens
  // Here's a simple cleanup of tokens that are over 24 hours old
  const cleanupTokens = () => {
    revokedTokens.forEach(token => {
      try {
        const decoded = jwt.decode(token);
        if (decoded.exp * 1000 < Date.now()) {
          revokedTokens.delete(token);
        }
      } catch (err) {
        // If token is invalid, remove it
        revokedTokens.delete(token);
      }
    });
  };

  // Clean up old tokens
  cleanupTokens();

  res.json({ message: 'Successfully logged out' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Docs available at http://localhost:${port}/docs`);
});
