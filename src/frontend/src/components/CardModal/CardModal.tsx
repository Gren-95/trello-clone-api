import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Box, 
  TextField, 
  Button, 
  Typography, 
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  CircularProgress,
  Paper,
  Avatar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CommentIcon from '@mui/icons-material/Comment';
import { cards } from '../../services/api';
import type { Card, ChecklistItem, Comment as CommentType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface CardModalProps {
  open: boolean;
  onClose: () => void;
  listId: string;
  cardId: string | null;
  boardId: string;
  onCardUpdated: () => void;
}

export default function CardModal({ open, onClose, listId, cardId, boardId, onCardUpdated }: CardModalProps) {
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [addingChecklistItem, setAddingChecklistItem] = useState(false);
  const [showAddChecklistItem, setShowAddChecklistItem] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (open && cardId) {
      fetchCard();
    } else {
      setCard(null);
      setLoading(false);
    }
  }, [open, cardId, listId]);

  const fetchCard = async () => {
    if (!cardId) return;
    
    try {
      setLoading(true);
      const cardData = await cards.getById(listId, cardId);
      setCard(cardData);
      setTitle(cardData.title);
      setDescription(cardData.description || '');
    } catch (err) {
      console.error('Error fetching card:', err);
      setError('Failed to load card details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!cardId) return;
    
    try {
      setSaving(true);
      console.log('Before saving - Description:', description);
      
      // Update the card with the new title and description
      await cards.update(cardId, { 
        title, 
        description 
      });
      
      // Fetch the updated card data to ensure we have the latest state
      const updatedCard = await cards.getById(listId, cardId);
      console.log('After saving - Card:', updatedCard);
      console.log('After saving - Description:', updatedCard.description);
      
      // Make sure we're keeping the description value in our state
      setDescription(updatedCard.description || '');
      setCard(updatedCard);
      
      // Show a brief success message
      setError('');
      setSuccess('Card saved successfully! Page will refresh...');
      setSaving(false);
      
      // Delay the reload slightly to give feedback to the user that save was successful
      setTimeout(() => {
        // Notify parent component about the update
        onCardUpdated();
      }, 1000);
    } catch (err) {
      console.error('Error updating card:', err);
      setError('Failed to update card');
      setSuccess('');
      setSaving(false);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!cardId || !newChecklistItem.trim()) return;
    
    try {
      setAddingChecklistItem(true);
      await cards.addChecklist(cardId, newChecklistItem);
      const updatedCard = await cards.getById(listId, cardId);
      setCard(updatedCard);
      setNewChecklistItem('');
      setShowAddChecklistItem(false);
      onCardUpdated();
    } catch (err) {
      console.error('Error adding checklist item:', err);
      setError('Failed to add checklist item');
    } finally {
      setAddingChecklistItem(false);
    }
  };

  const handleToggleChecklistItem = async (itemId: string, isCompleted: boolean) => {
    if (!cardId || !card) return;
    
    try {
      // Optimistically update UI
      setCard({
        ...card,
        checklist: card.checklist.map(item => 
          item.id === itemId ? { ...item, completed: !isCompleted } : item
        )
      });
      
      const updatedCard = await cards.updateChecklistItem(cardId, itemId, !isCompleted);
      
      // Update with server response
      setCard(updatedCard);
      onCardUpdated();
    } catch (err) {
      console.error('Error updating checklist item:', err);
      setError('Failed to update checklist item');
      
      // Revert on error
      setCard({
        ...card,
        checklist: card.checklist.map(item => 
          item.id === itemId ? { ...item, completed: isCompleted } : item
        )
      });
    }
  };

  const handleAddComment = async () => {
    if (!cardId || !newComment.trim()) return;
    
    try {
      setAddingComment(true);
      await cards.addComment(cardId, newComment);
      // Fetch the updated card data to ensure we have the latest comments
      const updatedCard = await cards.getById(listId, cardId);
      setCard(updatedCard);
      setNewComment('');
      // Call onCardUpdated to update the parent component
      onCardUpdated();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          maxHeight: '85vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        pb: 1
      }}>
        <Box sx={{ width: '90%' }}>
          <TextField
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                fontSize: '1.2rem',
                fontWeight: 600
              }
            }}
          />
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        
        {success && (
          <Typography color="success" sx={{ mb: 2, fontWeight: 'bold', color: 'green' }}>
            {success}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="Add a more detailed description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ListAltIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  Checklist
                </Typography>
              </Box>
              
              {card?.checklist && card.checklist.length > 0 ? (
                <List>
                  {card.checklist.map((item) => (
                    <ListItem key={item.id} dense>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={item.completed}
                          onChange={() => handleToggleChecklistItem(item.id, item.completed)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        sx={{ 
                          textDecoration: item.completed ? 'line-through' : 'none',
                          color: item.completed ? 'text.secondary' : 'text.primary'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1, mb: 2 }}>
                  No checklist items yet
                </Typography>
              )}
              
              {showAddChecklistItem ? (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add an item"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    disabled={addingChecklistItem}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      disabled={!newChecklistItem.trim() || addingChecklistItem}
                      onClick={handleAddChecklistItem}
                    >
                      {addingChecklistItem ? <CircularProgress size={20} /> : 'Add'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setShowAddChecklistItem(false);
                        setNewChecklistItem('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setShowAddChecklistItem(true)}
                  startIcon={<ListAltIcon />}
                >
                  Add Item
                </Button>
              )}
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CommentIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1">
                  Comments
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={addingComment}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="contained"
                    disabled={!newComment.trim() || addingComment}
                    onClick={handleAddComment}
                  >
                    {addingComment ? <CircularProgress size={20} /> : 'Add Comment'}
                  </Button>
                </Box>
              </Box>
              
              {card?.comments && card.comments.length > 0 ? (
                <Box>
                  {card.comments.map((comment) => (
                    <Box key={comment.id} sx={{ mb: 2 }}>
                      <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 1,
                              bgcolor: 'primary.main' 
                            }}
                          >
                            {comment.userId.substring(0, 1).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              User {comment.userId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(comment.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2">
                          {comment.text || comment.content}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No comments yet
                </Typography>
              )}
            </Box>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Card Information
            </Typography>
            {card && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(card.createdAt)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Updated: {formatDate(card.updatedAt)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSaveCard}
          disabled={!title.trim() || saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 