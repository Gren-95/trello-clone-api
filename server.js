const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;

// Check for required environment variables
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is not set');
    process.exit(1);
}

// Load OpenAPI specifications with fallback
let swaggerDocEN, swaggerDocET;

// Try to load English docs
try {
    swaggerDocEN = YAML.load(path.join(__dirname, 'docs/en/openapi.yaml'));
} catch (error) {
    console.error('Error loading English documentation:', error.message);
    try {
        // Fallback to root openapi.yaml
        swaggerDocEN = YAML.load(path.join(__dirname, 'openapi.yaml'));
        console.log('Using fallback openapi.yaml for English documentation');
        
        // Ensure docs/en directory exists
        if (!fs.existsSync(path.join(__dirname, 'en'))) {
            fs.mkdirSync(path.join(__dirname, 'en'), { recursive: true });
        }
        
        // Copy openapi.yaml to docs/en/
        fs.copyFileSync(
            path.join(__dirname, 'openapi.yaml'),
            path.join(__dirname, 'docs/en/openapi.yaml')
        );
    } catch (fallbackError) {
        console.error('Error loading fallback documentation:', fallbackError.message);
        process.exit(1);
    }
}

// Try to load Estonian docs
try {
    swaggerDocET = YAML.load(path.join(__dirname, 'docs/et/openapi.yaml'));
} catch (error) {
    console.error('Error loading Estonian documentation:', error.message);
    // Don't use English as fallback, just exit
    console.error('Estonian documentation is required');
    process.exit(1);
}

// Setup Swagger UI instances with language-specific configurations
const swaggerUiOptsEN = {
    explorer: true,
    swaggerOptions: {
        url: 'https://docs.bee-srv.me/openapi-en.yaml',
        docExpansion: 'list'
    }
};

const swaggerUiOptsET = {
    explorer: true,
    swaggerOptions: {
        url: 'https://docs.bee-srv.me/openapi-et.yaml',
        docExpansion: 'list'
    }
};

// Serve English docs at /en
app.use('/en', 
    swaggerUi.serve, 
    (req, res) => {
        let html = swaggerUi.generateHTML(swaggerDocEN, {
            ...swaggerUiOptsEN,
            customSiteTitle: "API Documentation - English"
        });
        res.send(html);
    }
);

// Serve Estonian docs at /et
app.use('/et', 
    swaggerUi.serve, 
    (req, res) => {
        let html = swaggerUi.generateHTML(swaggerDocET, {
            ...swaggerUiOptsET,
            customSiteTitle: "API Dokumentatsioon - Eesti"
        });
        res.send(html);
    }
);

// Middleware to parse JSON
app.use(express.json());

// Add this line to enable parsing JSON in DELETE requests
app.use((req, res, next) => {
    if (req.method === 'DELETE' && req.headers['content-type'] === 'application/json') {
        express.json()(req, res, next);
    } else {
        next();
    }
});

// Store blacklisted (logged out) tokens
const blacklistedTokens = new Set();

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is required.' });
    }

    // Check if token is blacklisted (logged out)
    if (blacklistedTokens.has(token)) {
        return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        req.token = token; // Store token for logout
        next();
    });
};

// In-memory storage (for demonstration purposes)
let users = [];
let boards = [];
let lists = [];
let cards = [];
let comments = [];

// Add this helper function at the top
const createErrorResponse = (message) => ({
    error: message
});

// User routes
app.post('/users', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Check if username already exists
    if (users.find(u => u.username === username)) {
        return res.status(409).json({ error: 'Username already exists.' });
    }

    const newUser = {
        id: users.length + 1,
        username,
        password,
        createdAt: new Date().toISOString()
    };
    users.push(newUser);

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

app.get('/users', authenticateToken, (req, res) => {
    // Don't send passwords in response
    const safeUsers = users.map(({ password, ...user }) => user);
    res.status(200).json(safeUsers);
});

// Add the new PUT endpoint with userId parameter
app.put('/users/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId);
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    // Validate new password length
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    // Check if user is trying to change their own password
    if (userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this user.' });
    }

    // Find the user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password
    if (users[userIndex].password !== currentPassword) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Update password
    users[userIndex].password = newPassword;

    res.status(200).json({ message: 'Password updated successfully' });
});

app.delete('/users', authenticateToken, (req, res) => {
    // Only allow users to delete their own account
    users = users.filter(u => u.id !== req.user.id);
    res.status(204).send();
});

// Authentication routes
app.post('/sessions', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
});

// Replace the POST /sessions/logout endpoint with this
app.delete('/sessions', authenticateToken, (req, res) => {
    // Add the token to blacklist
    blacklistedTokens.add(req.token);
    res.status(200).json({ message: 'Successfully logged out.' });
});

// Board routes
app.post('/boards', authenticateToken, (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json(createErrorResponse('Board name is required.'));
    }

    const newBoard = {
        id: boards.length + 1,
        name,
        userId: req.user.id,
        createdAt: new Date().toISOString(),
        isArchived: false,
        isTemplate: false,
        isFavorite: false,
        members: [{ userId: req.user.id, role: 'owner' }]
    };
    
    boards.push(newBoard);

    // Set Location header
    const location = `/boards/${newBoard.id}`;
    res.setHeader('Location', location);
    
    res.status(201).json(newBoard);
});

app.get('/boards', authenticateToken, (req, res) => {
    const userBoards = boards.filter(board => 
        board.members.some(member => member.userId === req.user.id)
    );
    res.status(200).json(userBoards);
});

app.get('/boards/:boardId', authenticateToken, (req, res) => {
    const boardId = parseInt(req.params.boardId);
    
    const board = boards.find(b => b.id === boardId);
    
    if (!board) {
        return res.status(404).json({ error: 'Board not found.' });
    }

    if (!board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to view this board.' });
    }

    res.status(200).json(board);
});

app.put('/boards/:boardId', authenticateToken, (req, res) => {
    const boardId = parseInt(req.params.boardId);
    const { name, background, isTemplate, isFavorite, isArchived } = req.body;

    // Find the board
    const boardIndex = boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) {
        return res.status(404).json({ error: 'Board not found.' });
    }

    const board = boards[boardIndex];
    
    // Check if user has permission to update the board
    if (!board.members.some(member => 
        member.userId === req.user.id && 
        ['owner', 'admin'].includes(member.role)
    )) {
        return res.status(403).json({ error: 'Not authorized to update this board.' });
    }

    // Update board properties if provided
    if (name && typeof name === 'string') board.name = name;
    if (background && typeof background === 'string') board.background = background;
    if (typeof isTemplate === 'boolean') board.isTemplate = isTemplate;
    if (typeof isFavorite === 'boolean') board.isFavorite = isFavorite;
    if (typeof isArchived === 'boolean') board.isArchived = isArchived;

    // Update timestamp
    board.updatedAt = new Date().toISOString();

    res.status(200).json(board);
});

app.delete('/boards/:boardId', authenticateToken, (req, res) => {
    const boardId = parseInt(req.params.boardId);
    
    const boardIndex = boards.findIndex(b => b.id === boardId);
    
    if (boardIndex === -1) {
        return res.status(404).json({ error: 'Board not found.' });
    }

    const board = boards[boardIndex];
    if (!board.members.some(member => member.userId === req.user.id && member.role === 'owner')) {
        return res.status(403).json({ error: 'Not authorized to delete this board.' });
    }

    boards.splice(boardIndex, 1);
    res.status(204).send();
});

// List routes
app.put('/lists/:listId', authenticateToken, (req, res) => {
    const listId = parseInt(req.params.listId);
    const { title, position } = req.body;

    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex === -1) {
        return res.status(404).json({ error: 'List not found.' });
    }

    const list = lists[listIndex];

    // Check if user has permission to update the list
    const board = boards.find(b => b.id === list.boardId);
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to update this list.' });
    }

    // Update only provided fields
    if (title !== undefined) {
        list.title = title;
    }
    if (position !== undefined && Number.isInteger(position) && position >= 0) {
        list.position = position;
    }

    list.updatedAt = new Date().toISOString();

    res.status(200).json(list);
});

app.delete('/lists/:listId', authenticateToken, (req, res) => {
    const listId = parseInt(req.params.listId);
    
    const listIndex = lists.findIndex(l => l.id === listId);
    if (listIndex === -1) {
        return res.status(404).json({ error: 'List not found.' });
    }

    const list = lists[listIndex];

    // Check if user has permission to delete the list
    const board = boards.find(b => b.id === list.boardId);
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to delete this list.' });
    }

    lists.splice(listIndex, 1);
    res.status(204).send();
});

app.get('/boards/:boardId/lists', authenticateToken, (req, res) => {
    const { boardId } = req.params;
    const board = boards.find(b => b.id === parseInt(boardId));
    
    if (!board) {
        return res.status(404).json({ error: 'Board not found.' });
    }

    if (!board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to view lists in this board.' });
    }

    const boardLists = lists.filter(list => list.boardId === parseInt(boardId));
    res.status(200).json(boardLists);
});

app.post('/boards/:boardId/lists', authenticateToken, (req, res) => {
    const { boardId } = req.params;
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    const board = boards.find(b => b.id === parseInt(boardId));
    if (!board) {
        return res.status(404).json({ error: 'Board not found.' });
    }

    if (!board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to create lists in this board.' });
    }

    const newList = {
        id: lists.length + 1,
        boardId: parseInt(boardId),
        userId: req.user.id,
        title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    lists.push(newList);

    // Set Location header
    const location = `/lists/${newList.id}`;
    res.setHeader('Location', location);
    
    res.status(201).json(newList);
});

// Card routes
app.get('/lists/:listId/cards', authenticateToken, (req, res) => {
    const listId = parseInt(req.params.listId);
    const list = lists.find(l => l.id === listId);
    
    if (!list) {
        return res.status(404).json({ error: 'List not found.' });
    }

    // Check if user has permission to view cards
    const board = boards.find(b => b.id === list.boardId);
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to view cards in this list.' });
    }

    const listCards = cards.filter(card => card.listId === listId);
    res.status(200).json(listCards);
});

app.post('/lists/:listId/cards', authenticateToken, (req, res) => {
    const listId = parseInt(req.params.listId);
    const { title, description, dueDate, labels } = req.body;

    // Add validation for required fields according to OpenAPI spec
    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }
    if (!listId) {
        return res.status(400).json({ error: 'List ID is required.' });
    }

    const list = lists.find(l => l.id === listId);
    if (!list) {
        return res.status(404).json({ error: 'List not found.' });
    }

    // Check if user has permission to create cards
    const board = boards.find(b => b.id === list.boardId);
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to create cards in this list.' });
    }

    const newCard = {
        id: cards.length + 1,
        listId,
        userId: req.user.id,
        title,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: dueDate || null,
        labels: labels || [],
        attachments: [],
        checklist: [],
        comments: []
    };

    cards.push(newCard);

    // Set Location header
    const location = `/cards/${newCard.id}`;
    res.setHeader('Location', location);
    
    res.status(201).json(newCard);
});

app.get('/cards/:cardId', authenticateToken, (req, res) => {
    const cardId = parseInt(req.params.cardId);
    const card = cards.find(c => c.id === cardId);
    
    if (!card) {
        return res.status(404).json({ error: 'Card not found.' });
    }

    // Check if user has permission to view card
    const list = lists.find(l => l.id === card.listId);
    if (!list) {
        return res.status(404).json({ error: 'List not found.' });
    }

    const board = boards.find(b => b.id === list.boardId);
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to view this card.' });
    }

    res.status(200).json(card);
});

app.put('/cards/:cardId', authenticateToken, (req, res) => {
    const cardId = parseInt(req.params.cardId);
    const { title, description, dueDate, labels, listId, position } = req.body;

    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        return res.status(404).json({ error: 'Card not found.' });
    }

    const card = cards[cardIndex];
    const currentList = lists.find(l => l.id === card.listId);
    if (!currentList) {
        return res.status(404).json({ error: 'Current list not found.' });
    }

    // Check board membership for current list
    const currentBoard = boards.find(b => b.id === currentList.boardId);
    if (!currentBoard || !currentBoard.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to update this card.' });
    }

    // If moving to a different list, verify the target list exists and user has permission
    if (listId !== undefined) {
        // Convert listId to number if it's a string
        const targetListId = typeof listId === 'string' ? parseInt(listId) : listId;
        const targetList = lists.find(l => l.id === targetListId);
        if (!targetList) {
            return res.status(404).json({ error: 'Target list not found.' });
        }

        // Verify target list is in the same board
        if (targetList.boardId !== currentList.boardId) {
            return res.status(403).json({ error: 'Cannot move card to a different board.' });
        }

        card.listId = targetListId;
    }

    // Update other fields if provided
    if (title !== undefined) card.title = title;
    if (description !== undefined) card.description = description;
    if (dueDate !== undefined) card.dueDate = dueDate;
    if (labels !== undefined) card.labels = labels;
    if (position !== undefined && Number.isInteger(position) && position >= 0) {
        card.position = position;
    }

    card.updatedAt = new Date().toISOString();

    res.status(200).json(card);
});

app.delete('/cards/:cardId', authenticateToken, (req, res) => {
    const cardId = parseInt(req.params.cardId);
    
    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        return res.status(404).json({ error: 'Card not found.' });
    }

    const card = cards[cardIndex];
    const list = lists.find(l => l.id === card.listId);
    if (!list) {
        return res.status(404).json({ error: 'List not found.' });
    }

    const board = boards.find(b => b.id === list.boardId);
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to delete this card.' });
    }

    cards.splice(cardIndex, 1);
    res.status(204).send();
});

app.post('/cards/:cardId/checklist', authenticateToken, (req, res) => {
    const cardId = parseInt(req.params.cardId);
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    const card = cards.find(c => c.id === cardId);
    if (!card) {
        return res.status(404).json({ error: 'Card not found.' });
    }

    const list = lists.find(l => l.id === card.listId);
    const board = boards.find(b => b.id === list.boardId);
    
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to add checklist to this card.' });
    }

    const newChecklist = {
        id: (card.checklist.length + 1).toString(),
        title,
        items: []
    };

    card.checklist.push(newChecklist);

    // Set Location header
    const location = `/cards/${cardId}/checklist/${newChecklist.id}`;
    res.setHeader('Location', location);
    
    res.status(201).json({ message: 'Checklist added successfully' });
});

app.post('/cards/:cardId/comments', authenticateToken, (req, res) => {
    const cardId = parseInt(req.params.cardId);
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Comment text is required.' });
    }

    const card = cards.find(c => c.id === cardId);
    if (!card) {
        return res.status(404).json({ error: 'Card not found.' });
    }

    const list = lists.find(l => l.id === card.listId);
    const board = boards.find(b => b.id === list.boardId);
    
    if (!board || !board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to comment on this card.' });
    }

    const newComment = {
        id: (card.comments.length + 1).toString(),
        userId: req.user.id,
        text,
        createdAt: new Date().toISOString()
    };

    card.comments.push(newComment);

    // Set Location header
    const location = `/cards/${cardId}/comments/${newComment.id}`;
    res.setHeader('Location', location);
    
    res.status(201).json(newComment);
});

// Comments routes
app.get('/comments', authenticateToken, (req, res) => {
    const { authorId } = req.query;
    
    let filteredComments = [...comments];
    
    if (authorId) {
        filteredComments = filteredComments.filter(comment => comment.userId === authorId);
    }
    
    res.status(200).json(filteredComments);
});

app.post('/comments', authenticateToken, (req, res) => {
    const { text } = req.body;

    // Validate required fields
    if (!text) {
        return res.status(400).json({ error: 'Text field is required.' });
    }

    const newComment = {
        id: comments.length + 1,
        text,
        userId: req.user.id,
        createdAt: new Date().toISOString()
    };

    comments.push(newComment);

    // Set Location header
    const location = `/comments/${newComment.id}`;
    res.setHeader('Location', location);
    
    res.status(201).json(newComment);
});

app.patch('/comments/:commentId', authenticateToken, (req, res) => {
    const { text } = req.body;
    const commentId = parseInt(req.params.commentId);

    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
        return res.status(404).json({ error: 'Comment not found.' });
    }

    // Check if user owns the comment
    if (comments[commentIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to update this comment.' });
    }

    // Update only provided fields
    if (text !== undefined) {
        comments[commentIndex].text = text;
    }

    res.status(200).json(comments[commentIndex]);
});

app.delete('/comments/:commentId', authenticateToken, (req, res) => {
    const commentId = parseInt(req.params.commentId);
    
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) {
        return res.status(404).json({ error: 'Comment not found.' });
    }

    // Check if user owns the comment
    if (comments[commentIndex].userId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to delete this comment.' });
    }

    comments.splice(commentIndex, 1);
    res.status(204).send();
});

// Update the PUT endpoint for users password change
app.put('/users/:id/password', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    // Validate new password length
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    // Find the user
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found.' });
    }

    // Verify current password
    if (users[userIndex].password !== currentPassword) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Update password
    users[userIndex].password = newPassword;

    res.status(200).json({ message: 'Password updated successfully' });
});

// Redirect root to English docs
app.get('/', (req, res) => {
    res.redirect('/en');
});

// Global error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'Something went wrong on the server'
    });
});

// Start the server
app.listen(port, () => {
    console.log(`API is running at https://bee-srv.me`);
    console.log(`Documentation is available in English: https://docs.bee-srv.me/en`);
    console.log(`Dokumentatsioon on kättesaadav eesti keeles: https://docs.bee-srv.me/et`);
}); 