const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// Load OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, 'openapi.yaml'));

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

// Serve Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication token is required.' });
    }

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
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

// Replace the PUT /users/password endpoint with this
app.put('/users', authenticateToken, (req, res) => {
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
    const userIndex = users.findIndex(u => u.id === req.user.id);
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

    const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
    res.status(200).json({ token });
});

app.post('/sessions/logout', authenticateToken, (req, res) => {
    // In a real implementation, you would invalidate the token
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

app.get('/boards/:id', authenticateToken, (req, res) => {
    const board = boards.find(b => b.id === parseInt(req.params.id));
    
    if (!board) {
        return res.status(404).json({ error: 'Board not found.' });
    }

    if (!board.members.some(member => member.userId === req.user.id)) {
        return res.status(403).json({ error: 'Not authorized to view this board.' });
    }

    res.status(200).json(board);
});

app.put('/boards', authenticateToken, (req, res) => {
    // Validate required field
    if (!req.body.id) {
        return res.status(400).json({ error: 'Board ID is required.' });
    }

    // Convert id to number if it's a string
    const boardId = typeof req.body.id === 'string' ? parseInt(req.body.id) : req.body.id;

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

    // Extract only allowed fields to update
    const {
        name,
        background,
        isTemplate,
        isFavorite,
        isArchived
    } = req.body;

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

// Replace the existing DELETE /boards/:id endpoint with this
app.delete('/boards', authenticateToken, (req, res) => {
    // Validate required field
    if (!req.body.id) {
        return res.status(400).json({ error: 'Board ID is required.' });
    }

    // Convert id to number if it's a string
    const boardId = typeof req.body.id === 'string' ? parseInt(req.body.id) : req.body.id;
    
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

// Add this endpoint for getting a specific list
app.get('/lists/:listId', (req, res) => {
    const listId = parseInt(req.params.listId);
    const list = lists.find(l => l.id === listId);
    
    if (!list) {
        return res.status(404).json({ error: 'List not found.' });
    }

    res.status(200).json(list);
});

// Add PUT endpoint for updating a list
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

// Add DELETE endpoint for lists
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

// Start the server
app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
    console.log(`Documentation is running at http://localhost:${port}/docs`);
}); 