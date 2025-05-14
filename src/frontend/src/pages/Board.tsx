import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  IconButton,
  CircularProgress,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  ClickAwayListener
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import { boards, lists, cards } from '../services/api';
import type { Board as BoardType, List, Card as CardType } from '../types';
import CardModal from '../components/CardModal/CardModal';

export default function Board() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [addingCardToListId, setAddingCardToListId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [editedBoardName, setEditedBoardName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editedListTitle, setEditedListTitle] = useState('');
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  
  // Refs for drag positions
  const dragListRef = useRef<HTMLDivElement | null>(null);
  const dragCardRef = useRef<HTMLDivElement | null>(null);
  const editListInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  // Focus input when editing list title
  useEffect(() => {
    if (editingListId && editListInputRef.current) {
      editListInputRef.current.focus();
    }
  }, [editingListId]);

  const fetchBoard = async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      const fetchedBoard = await boards.getById(boardId);
      // Ensure all IDs are strings for consistency
      const processedBoard = {
        ...fetchedBoard,
        lists: fetchedBoard.lists.map(list => ({
          ...list,
          id: String(list.id),
          cards: (list.cards || []).map(card => ({
            ...card,
            id: String(card.id)
          }))
        }))
      };
      setBoard(processedBoard);
      setEditedBoardName(processedBoard.name);
    } catch (err) {
      console.error('Error fetching board:', err);
      setError('Failed to load board');
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    if (!boardId) return;
    try {
      // Fetch the board data which should include lists with cards
      const freshBoardData = await boards.getById(boardId);
      
      // Process the data to ensure all properties are preserved
      const processedBoardData = {
        ...freshBoardData,
        lists: freshBoardData.lists.map(list => ({
          ...list,
          id: String(list.id),
          cards: (list.cards || []).map(card => ({
            ...card,
            id: String(card.id)
          }))
        }))
      };
      
      setBoard(processedBoardData);
      
      // Also update each list to ensure we have the latest data
      const fetchedLists = await lists.getAllByBoardId(boardId);
      if (board) {
        // Map the cards from each list, preserving all their properties including description
        const processedLists = fetchedLists.map(list => ({
          ...list,
          id: String(list.id),
          cards: (list.cards || []).map(card => ({
            ...card,
            id: String(card.id)
          }))
        }));
        
        // Update board with fetched lists
        setBoard({
          ...processedBoardData,
          lists: processedLists
        });
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError('Failed to load lists');
    }
  };

  const handleUpdateBoardName = async () => {
    if (!boardId || !editedBoardName.trim() || !board) return;
    
    try {
      const updatedBoard = await boards.update(boardId, {
        name: editedBoardName
      });
      
      setBoard({
        ...board,
        name: updatedBoard.name
      });
      
      setEditNameDialogOpen(false);
    } catch (err) {
      console.error('Error updating board name:', err);
      setError('Failed to update board name');
    }
  };

  const handleCreateList = async () => {
    if (!boardId || !newListTitle.trim()) return;
    try {
      const newList = await lists.create(boardId, newListTitle);
      setBoard(prev => prev ? {
        ...prev,
        lists: [...prev.lists, { ...newList, id: String(newList.id), cards: [] }]
      } : null);
      setNewListTitle('');
      setAddingList(false);
    } catch (err) {
      console.error('Error creating list:', err);
      setError('Failed to create list');
    }
  };

  const startEditListTitle = (list: List) => {
    setEditingListId(list.id);
    setEditedListTitle(list.title);
  };

  const handleUpdateListTitle = async () => {
    if (!editingListId || !editedListTitle.trim() || !board) return;
    
    try {
      const updatedList = await lists.update(editingListId, {
        title: editedListTitle
      });
      
      // Update board with updated list
      setBoard({
        ...board,
        lists: board.lists.map(list => 
          list.id === editingListId 
            ? { ...list, title: updatedList.title }
            : list
        )
      });
      
      setEditingListId(null);
    } catch (err) {
      console.error('Error updating list title:', err);
      setError('Failed to update list title');
    }
  };

  const cancelEditListTitle = () => {
    setEditingListId(null);
  };

  const handleCreateCard = async (listId: string) => {
    if (!newCardTitle.trim()) return;
    try {
      const newCard = await cards.create(listId, newCardTitle);
      setBoard(prev => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map(list =>
            list.id === listId
              ? { ...list, cards: [...(list.cards || []), { ...newCard, id: String(newCard.id) }] }
              : list
          )
        };
      });
      setNewCardTitle('');
      setAddingCardToListId(null);
    } catch (err) {
      console.error('Error creating card:', err);
      setError('Failed to create card');
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await lists.delete(String(listId));
      setBoard(prev => prev ? {
        ...prev,
        lists: prev.lists.filter(list => list.id !== listId)
      } : null);
    } catch (err) {
      console.error('Error deleting list:', err);
      setError('Failed to delete list');
    }
  };

  const handleDeleteCard = async (cardId: string, listId: string) => {
    try {
      await cards.delete(String(cardId));
      setBoard(prev => {
        if (!prev) return null;
        return {
          ...prev,
          lists: prev.lists.map(list =>
            list.id === listId
              ? { ...list, cards: (list.cards || []).filter(card => card.id !== cardId) }
              : list
          )
        };
      });
    } catch (err) {
      console.error('Error deleting card:', err);
      setError('Failed to delete card');
    }
  };

  const openCardModal = (cardId: string, listId: string) => {
    setSelectedCardId(cardId);
    setSelectedListId(listId);
    setCardModalOpen(true);
  };

  const handleCardUpdated = () => {
    // Force reload the current page to ensure everything is updated
    window.location.reload();
  };

  const handleCloseCardModal = () => {
    setCardModalOpen(false);
    setSelectedCardId(null);
    setSelectedListId(null);
  };

  // Handle starting to drag a list
  const handleListDragStart = (e: React.DragEvent<HTMLDivElement>, list: List, index: number) => {
    dragListRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    
    // Store list data in dataTransfer
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'list',
      id: list.id,
      index
    }));
    
    // Add visual feedback
    setTimeout(() => {
      if (dragListRef.current) {
        dragListRef.current.style.opacity = '0.5';
      }
    }, 0);
    
    setDraggedItem({
      type: 'list',
      list,
      index
    });
  };
  
  // Handle starting to drag a card
  const handleCardDragStart = (e: React.DragEvent<HTMLDivElement>, card: CardType, listId: string, index: number) => {
    // Stop propagation to prevent list handlers from being triggered
    e.stopPropagation();
    
    dragCardRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    
    // Store card data in dataTransfer
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'card',
      id: card.id,
      listId,
      index
    }));
    
    // Add visual feedback
    setTimeout(() => {
      if (dragCardRef.current) {
        dragCardRef.current.style.opacity = '0.5';
      }
    }, 0);
    
    setDraggedItem({ type: 'card', card, listId, index });
  };
  
  // Handle drag over for lists - should only be used for list dragging
  const handleListDragOver = (e: React.DragEvent<HTMLDivElement>, listId: string) => {
    // If we're dragging a card, don't do list-related operations
    const dragData = draggedItem;
    if (dragData && dragData.type === 'card') {
      return;
    }
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Only set dragOverListId if we're dragging a list, not a card
    if (draggedItem && draggedItem.type === 'list') {
      setDragOverListId(listId);
    }
  };
  
  // Handle drag end (cleanup)
  const handleDragEnd = () => {
    if (dragListRef.current) {
      dragListRef.current.style.opacity = '1';
      dragListRef.current = null;
    }
    
    if (dragCardRef.current) {
      dragCardRef.current.style.opacity = '1';
      dragCardRef.current = null;
    }
    
    setDraggedItem(null);
    setDragOverListId(null);
  };
  
  // Handle dropping a list
  const handleListDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    
    if (!dragData || dragData.type !== 'list' || !board) return;
    
    // If not moving, just return
    if (dragData.index === dropIndex) {
      handleDragEnd();
      return;
    }
    
    try {
      // Create a new array of lists
      const newLists = Array.from(board.lists);
      const [movedList] = newLists.splice(dragData.index, 1);
      newLists.splice(dropIndex, 0, movedList);
      
      // Update UI first
      setBoard({
        ...board,
        lists: newLists
      });
      
      // Then update backend
      await lists.update(String(movedList.id), {
        position: dropIndex
      });
    } catch (error) {
      console.error('Error moving list:', error);
      fetchBoard(); // Refresh on error
    } finally {
      handleDragEnd();
    }
  };
  
  // Handle dropping a card
  const handleCardDrop = async (e: React.DragEvent<HTMLDivElement>, dropListId: string, dropIndex: number) => {
    // Stop propagation to prevent list handlers from being triggered
    e.stopPropagation();
    
    e.preventDefault();
    
    if (!e.dataTransfer.getData('application/json')) {
      console.error('No drag data found');
      return;
    }
    
    const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
    
    if (!dragData || dragData.type !== 'card' || !board) return;
    
    // If not moving, just return
    if (dragData.listId === dropListId && dragData.index === dropIndex) {
      handleDragEnd();
      return;
    }
    
    console.log('Drag data:', dragData);
    console.log('Drop target:', { listId: dropListId, position: dropIndex });
    
    try {
      // Find source and destination lists
      const sourceList = board.lists.find(list => list.id === dragData.listId);
      const destList = board.lists.find(list => list.id === dropListId);
      
      if (!sourceList || !destList) {
        console.error('Source or destination list not found');
        handleDragEnd();
        return;
      }
      
      // Create copies of the card arrays
      const sourceCards = Array.from(sourceList.cards || []);
      const destCards = dragData.listId === dropListId 
        ? sourceCards 
        : Array.from(destList.cards || []);
      
      // Remove card from source list
      const [movedCard] = sourceCards.splice(dragData.index, 1);
      
      // Update the card's listId if moving to a different list
      if (dragData.listId !== dropListId) {
        // Convert to number for server, but store as string for UI consistency
        movedCard.listId = dropListId;
      }
      
      // Add card to destination list
      if (dragData.listId === dropListId) {
        sourceCards.splice(dropIndex, 0, movedCard);
      } else {
        destCards.splice(dropIndex, 0, movedCard);
      }
      
      // Update UI first for responsiveness
      setBoard({
        ...board,
        lists: board.lists.map(list => {
          if (list.id === dragData.listId) {
            return { ...list, cards: sourceCards };
          }
          if (list.id === dropListId) {
            return { ...list, cards: destCards };
          }
          return list;
        })
      });
      
      // Log all parameters before the API call
      console.log('Calling API to move card:', { 
        cardId: String(movedCard.id), 
        listId: dropListId,
        position: dropIndex,
        sameList: dragData.listId === dropListId
      });
      
      let updatedCard;
      
      // Make the API call to move the card
      if (dragData.listId === dropListId) {
        // If moving within the same list, use updateInList
        updatedCard = await cards.updateInList(dropListId, String(movedCard.id), {
          position: dropIndex
        });
      } else {
        // If moving to a different list, use the standard update endpoint
        updatedCard = await cards.update(String(movedCard.id), {
          listId: dropListId,
          position: dropIndex
        });
      }
      
      console.log('Updated card from server:', updatedCard);
      
      // Force a board refresh to ensure consistency with server state
      fetchBoard();
    } catch (error) {
      console.error('Error moving card:', error);
      fetchBoard(); // Refresh on error
    } finally {
      handleDragEnd();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, callback: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" width="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!board || !board.lists) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Board not found or data is not available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      bgcolor: '#f0f2f5',
      overflow: 'hidden'
    }}>
      {/* Board header with back button */}
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="back"
            onClick={() => navigate('/boards')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {board.name}
          </Typography>
          <Tooltip title="Edit board name">
            <IconButton
              color="inherit"
              aria-label="edit board name"
              onClick={() => setEditNameDialogOpen(true)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Error message display */}
        {error && (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
        )}

      {/* Single scrollable container - ONLY scrollable parent */}
      <Box sx={{ 
        flexGrow: 1,
        overflowX: 'auto',
        overflowY: 'hidden',
        p: 2
      }} className="container-content">
        <Box sx={{ 
          height: '100%',
          display: 'inline-flex',
          pb: 1
        }}>
          <Box sx={{
            display: 'flex',
            height: '100%'
          }}>
            {board.lists.map((list, index) => {
              const listId = String(list.id);
              return (
                <div
                  key={listId}
                  draggable={editingListId !== listId}
                  onDragStart={(e) => handleListDragStart(e, list, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    // Only handle list drag events at this level
                    if (draggedItem && draggedItem.type === 'list') {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    // Only handle list drop events, not card drop events
                    if (draggedItem && draggedItem.type === 'list') {
                      handleListDrop(e, index);
                    }
                  }}
                  style={{
                    userSelect: 'none',
                    width: '280px',
                    marginRight: '16px',
                    height: 'fit-content',
                    maxHeight: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#ebecf0',
                    borderRadius: '3px',
                    boxShadow: draggedItem?.type === 'list' && draggedItem.list.id === list.id ? 'none' : 'none',
                    opacity: draggedItem?.type === 'list' && draggedItem.list.id === list.id ? '0.5' : '1',
                    border: dragOverListId === list.id ? '2px dashed #0079bf' : 'none',
                  }}
                >
                  {/* List header */}
                  <div
                    style={{
                      padding: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTopLeftRadius: '3px',
                      borderTopRightRadius: '3px',
                      cursor: editingListId === listId ? 'default' : 'grab',
                      backgroundColor: '#ebecf0'
                    }}
                  >
                    {editingListId === listId ? (
                      <ClickAwayListener onClickAway={handleUpdateListTitle}>
                        <TextField
                          inputRef={editListInputRef}
                          fullWidth
                          variant="standard"
                          size="small"
                          value={editedListTitle}
                          onChange={(e) => setEditedListTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, handleUpdateListTitle)}
                          autoFocus
                          sx={{ 
                            '& .MuiInputBase-root': {
                              fontSize: '14px',
                              fontWeight: 600
                            }
                          }}
                        />
                      </ClickAwayListener>
                    ) : (
                      <div 
                        style={{ 
                          fontSize: '14px', 
                          fontWeight: 600,
                          flex: 1,
                          padding: '4px'
                        }}
                        onClick={() => startEditListTitle(list)}
                      >
                      {list.title}
                    </div>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteList(listId)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </div>

                  {/* Cards container */}
                  <div 
                    style={{ 
                      padding: '0 8px 8px 8px',
                      minHeight: '20px',
                      flexGrow: 1
                    }}
                    onDragOver={(e) => {
                      // Only respond to card drag events, not list drag events
                      if (!draggedItem || draggedItem.type !== 'card') {
                        return;
                      }
                      
                      e.preventDefault();
                      e.stopPropagation(); // Stop propagation to prevent list handlers from being triggered
                      e.dataTransfer.dropEffect = 'move';
                      
                      // Only set dragOverListId if we're dragging a card
                      setDragOverListId(listId);
                    }}
                    onDrop={(e) => {
                      // Only handle card drop events, not list drop events
                      if (!draggedItem || draggedItem.type !== 'card') {
                        return;
                      }
                      
                      // Let the child card handlers deal with this if target is a card
                      if (e.target !== e.currentTarget) {
                        return;
                      }
                      
                      // Handle dropping a card at the end of this list
                      e.stopPropagation();
                      handleCardDrop(e, listId, list.cards.length);
                    }}
                  >
                    <div
                      style={{
                        minHeight: '2px'
                      }}
                    >
                      {(list.cards || []).map((card, cardIndex) => {
                        const cardId = String(card.id);
                        return (
                          <div 
                            key={cardId}
                            draggable
                            onDragStart={(e) => handleCardDragStart(e, card, listId, cardIndex)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => handleCardDrop(e, listId, cardIndex)}
                            style={{
                              marginBottom: '8px',
                              opacity: draggedItem?.type === 'card' && draggedItem.card.id === card.id ? '0.5' : '1',
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: '#fff',
                                padding: '8px 12px',
                                borderRadius: '3px',
                                boxShadow: '0 1px 0 rgba(9,30,66,.25)',
                                cursor: 'grab',
                                position: 'relative'
                              }}
                              onClick={(e) => {
                                if (e.defaultPrevented) return; // Skip if this was part of a drag
                                openCardModal(cardId, listId);
                              }}
                            >
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center' 
                              }}>
                                <div style={{ fontSize: '14px', wordBreak: 'break-word' }}>
                                  {card.title}
                                </div>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCard(cardId, listId);
                                  }}
                                  style={{
                                    opacity: 0,
                                    padding: '2px'
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.opacity = '0';
                                  }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Empty card placeholder for drop target */}
                      {list.cards.length === 0 && (
                        <div 
                          style={{ 
                            minHeight: '20px', 
                            width: '100%' 
                          }}
                          onDragOver={(e) => {
                            // Only respond to card drag events, not list drag events
                            if (!draggedItem || draggedItem.type !== 'card') {
                              return;
                            }
                            
                            e.preventDefault();
                            e.stopPropagation(); // Stop propagation to prevent list handlers
                            e.dataTransfer.dropEffect = 'move';
                          }}
                          onDrop={(e) => {
                            // Only handle card drop events, not list drop events
                            if (!draggedItem || draggedItem.type !== 'card') {
                              return;
                            }
                            
                            e.stopPropagation();
                            handleCardDrop(e, listId, 0);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Add card button/form */}
                  <div style={{ padding: '8px' }}>
                    {addingCardToListId === listId ? (
                      <div>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Enter card title..."
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, () => handleCreateCard(listId))}
                          autoFocus
                          style={{ marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleCreateCard(listId)}
                          >
                            Add Card
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setAddingCardToListId(null);
                              setNewCardTitle('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        startIcon={<AddIcon />}
                        style={{ 
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          color: '#5e6c84',
                          width: '100%'
                        }}
                        onClick={() => setAddingCardToListId(listId)}
                      >
                        Add a card
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add list button/form */}
            <div style={{ 
              width: '280px',
              flexShrink: 0
            }}>
              {addingList ? (
                <div style={{ 
                  width: '100%', 
                  padding: '8px',
                  backgroundColor: 'white',
                  borderRadius: '3px'
                }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter list title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, handleCreateList)}
                    autoFocus
                    style={{ marginBottom: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleCreateList}
                    >
                      Add List
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setAddingList(false);
                        setNewListTitle('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  onClick={() => setAddingList(true)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AddIcon />
                    <span>Add another list</span>
                  </div>
                </div>
              )}
            </div>
          </Box>
        </Box>
      </Box>

      {/* Edit Board Name Dialog */}
      <Dialog open={editNameDialogOpen} onClose={() => setEditNameDialogOpen(false)}>
        <DialogTitle>Edit Board Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Board Name"
            fullWidth
            value={editedBoardName}
            onChange={(e) => setEditedBoardName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e as React.KeyboardEvent<HTMLInputElement>, handleUpdateBoardName)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateBoardName} 
            variant="contained"
            disabled={!editedBoardName.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Card Modal */}
      {boardId && selectedListId && (
        <CardModal
          open={cardModalOpen}
          onClose={handleCloseCardModal}
          listId={selectedListId}
          cardId={selectedCardId}
          boardId={boardId}
          onCardUpdated={handleCardUpdated}
        />
      )}
    </Box>
  );
} 