import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  AppBar,
  Toolbar,
  Container,
  Tooltip,
  InputAdornment,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { boards } from '../services/api';
import type { Board } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function Boards() {
  const [userBoards, setUserBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openNewBoardDialog, setOpenNewBoardDialog] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allBoards, setAllBoards] = useState<Board[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchBoards();
  }, []);

  useEffect(() => {
    // Filter boards based on search query
    if (searchQuery.trim() === '') {
      setUserBoards(allBoards);
    } else {
      const regex = new RegExp(searchQuery, 'i'); // Case-insensitive search
      const filteredBoards = allBoards.filter(board => regex.test(board.name));
      setUserBoards(filteredBoards);
    }
  }, [searchQuery, allBoards]);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const fetchedBoards = await boards.getAll();
      setAllBoards(fetchedBoards);
      setUserBoards(fetchedBoards);
    } catch (err) {
      console.error('Error fetching boards:', err);
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;

    try {
      setCreating(true);
      const newBoard = await boards.create(newBoardName);
      const updatedBoards = [...allBoards, newBoard];
      setAllBoards(updatedBoards);
      setUserBoards(updatedBoards);
      setOpenNewBoardDialog(false);
      setNewBoardName('');
    } catch (err) {
      console.error('Error creating board:', err);
      setError('Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleFavorite = async (board: Board) => {
    try {
      const updatedBoard = await boards.update(board.id, {
        isFavorite: !board.isFavorite
      });
      
      const updatedBoards = allBoards.map(b => 
        b.id === updatedBoard.id ? updatedBoard : b
      );
      
      setAllBoards(updatedBoards);
      setUserBoards(prev => prev.map(b => 
        b.id === updatedBoard.id ? updatedBoard : b
      ));
    } catch (err) {
      console.error('Error updating board:', err);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoardId) return;
    
    try {
      await boards.delete(deletingBoardId);
      const updatedBoards = allBoards.filter(board => board.id !== deletingBoardId);
      setAllBoards(updatedBoards);
      setUserBoards(prev => prev.filter(board => board.id !== deletingBoardId));
      setDeleteDialogOpen(false);
      setDeletingBoardId(null);
    } catch (err) {
      console.error('Error deleting board:', err);
      setError('Failed to delete board');
    }
  };

  const openDeleteDialog = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingBoardId(boardId);
    setDeleteDialogOpen(true);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" width="100%">
        <CircularProgress />
      </Box>
    );
  }

  const favoriteBoards = userBoards.filter(board => board.isFavorite);
  const otherBoards = userBoards.filter(board => !board.isFavorite);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Trello Clone
          </Typography>
          <Box display="flex" alignItems="center">
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.username}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={() => navigate('/settings')}
              aria-label="Settings"
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, flexGrow: 1 }} className="container-content">
        {/* Search and Create Bar */}
        <Box sx={{ display: 'flex', mb: 3, gap: 2, alignItems: 'center' }}>
          <Paper sx={{ p: 2, flexGrow: 1 }}>
            <TextField
              fullWidth
              placeholder="Search boards by title..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Paper>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewBoardDialog(true)}
            sx={{ 
              display: 'none',
              height: '100%',
              bgcolor: '#026AA7',
              '&:hover': { bgcolor: '#01588a' }
            }}
          >
            Create Board
          </Button>
        </Box>
        
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

        {userBoards.length === 0 && !loading && (
          <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" color="textSecondary">
              {searchQuery ? "No boards match your search" : "You don't have any boards yet"}
            </Typography>
            {searchQuery ? (
              <Button 
                variant="text" 
                onClick={() => setSearchQuery('')}
                sx={{ mt: 1 }}
              >
                Clear search
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setOpenNewBoardDialog(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Board
              </Button>
            )}
          </Paper>
        )}

      {favoriteBoards.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2 }}>
            ⭐ Favorite Boards
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            {favoriteBoards.map((board) => (
              <Box key={board.id} sx={{ width: { xs: '100%', sm: '45%', md: '30%', lg: '23%' } }}>
                <Card 
                  sx={{ 
                    height: '100px',
                    cursor: 'pointer',
                    bgcolor: '#026AA7',
                    color: 'white',
                    '&:hover': { opacity: 0.9 }
                  }}
                  onClick={() => navigate(`/board/${board.id}`)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" noWrap>{board.name}</Typography>
                        <Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(board);
                        }}
                        sx={{ color: 'white' }}
                      >
                        <StarIcon />
                      </IconButton>
                          <Tooltip title="Delete board">
                            <IconButton 
                              size="small" 
                              onClick={(e) => openDeleteDialog(board.id, e)}
                              sx={{ color: 'white' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </>
      )}

        {otherBoards.length > 0 && (
          <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        All Boards
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {otherBoards.map((board) => (
          <Box key={board.id} sx={{ width: { xs: '100%', sm: '45%', md: '30%', lg: '23%' } }}>
            <Card 
              sx={{ 
                height: '100px',
                cursor: 'pointer',
                bgcolor: '#026AA7',
                color: 'white',
                '&:hover': { opacity: 0.9 }
              }}
              onClick={() => navigate(`/board/${board.id}`)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" noWrap>{board.name}</Typography>
                        <Box>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(board);
                    }}
                    sx={{ color: 'white' }}
                  >
                    <StarBorderIcon />
                  </IconButton>
                          <Tooltip title="Delete board">
                            <IconButton 
                              size="small" 
                              onClick={(e) => openDeleteDialog(board.id, e)}
                              sx={{ color: 'white' }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
        <Box sx={{ width: { xs: '100%', sm: '45%', md: '30%', lg: '23%' } }}>
          <Card 
            sx={{ 
              height: '100px',
              cursor: 'pointer',
              bgcolor: 'rgba(2, 106, 167, 0.1)',
              '&:hover': { bgcolor: 'rgba(2, 106, 167, 0.2)' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setOpenNewBoardDialog(true)}
          >
            <CardContent>
              <Box display="flex" alignItems="center">
                <AddIcon sx={{ mr: 1 }} />
                <Typography>Create New Board</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
          </>
        )}
      </Container>

      {/* Create Board Dialog */}
      <Dialog 
        open={openNewBoardDialog} 
        onClose={() => {
          if (!creating) {
            setOpenNewBoardDialog(false);
            setNewBoardName('');
          }
        }}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '450px',
            borderRadius: '8px'
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#f0f0f0', pb: 2 }}>
          Create New Board
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Board Name"
            fullWidth
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            disabled={creating}
            placeholder="Enter board name"
            variant="outlined"
            InputProps={{
              sx: { borderRadius: '4px' }
            }}
            helperText="Give your board a clear, descriptive name"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setOpenNewBoardDialog(false);
              setNewBoardName('');
            }} 
            disabled={creating}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBoard} 
            variant="contained" 
            disabled={!newBoardName.trim() || creating}
            startIcon={creating ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ 
              bgcolor: '#026AA7',
              '&:hover': { bgcolor: '#01588a' },
              '&.Mui-disabled': { bgcolor: 'rgba(2, 106, 167, 0.3)' }
            }}
          >
            {creating ? 'Creating...' : 'Create Board'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Board Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Board</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this board? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteBoard} 
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 