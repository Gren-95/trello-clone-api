import axios from 'axios';
import type { AuthResponse, Board, Card, Comment, List, User } from '../types';

const API_URL = 'http://localhost:3066'; // Using the development server URL from OpenAPI

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    console.log('[api] auth.login called', { username });
    const response = await api.post<AuthResponse>('/sessions', { username, password });
    return response.data;
  },
  register: async (username: string, password: string): Promise<User> => {
    console.log('[api] auth.register called', { username });
    const response = await api.post<User>('/users', { username, password });
    return response.data;
  },
  logout: async (): Promise<void> => {
    console.log('[api] auth.logout called');
    await api.delete('/sessions');
    localStorage.removeItem('token');
  },
};

// User endpoints
export const users = {
  getAll: async (): Promise<User[]> => {
    console.log('[api] users.getAll called');
    const response = await api.get<User[]>('/users');
    return response.data;
  },
  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    console.log('[api] users.changePassword called', { userId });
    await api.put(`/users/${userId}`, { currentPassword, newPassword });
  },
  deleteAccount: async (): Promise<void> => {
    console.log('[api] users.deleteAccount called');
    await api.delete('/users');
  },
};

// Board endpoints
export const boards = {
  getAll: async (): Promise<Board[]> => {
    console.log('[api] boards.getAll called');
    const response = await api.get<Board[]>('/boards');
    return response.data;
  },
  getById: async (id: string): Promise<Board> => {
    console.log('[api] boards.getById called', { id });
    const response = await api.get<Board>(`/boards/${id}`);
    return response.data;
  },
  create: async (name: string): Promise<Board> => {
    console.log('[api] boards.create called', { name });
    const response = await api.post<Board>('/boards', { name });
    return response.data;
  },
  update: async (id: string, data: Partial<Board>): Promise<Board> => {
    console.log('[api] boards.update called', { id, data });
    const response = await api.put<Board>(`/boards/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    console.log('[api] boards.delete called', { id });
    await api.delete(`/boards/${id}`);
  },
};

// List endpoints
export const lists = {
  getAllByBoardId: async (boardId: string): Promise<List[]> => {
    console.log('[api] lists.getAllByBoardId called', { boardId });
    const response = await api.get<List[]>(`/boards/${boardId}/lists`);
    return response.data;
  },
  create: async (boardId: string, title: string): Promise<List> => {
    console.log('[api] lists.create called', { boardId, title });
    const response = await api.post<List>(`/boards/${boardId}/lists`, { title });
    return response.data;
  },
  getById: async (listId: string): Promise<List> => {
    console.log('[api] lists.getById called', { listId });
    const response = await api.get<List>(`/lists/${listId}`);
    return response.data;
  },
  getByBoardIdAndListId: async (boardId: string, listId: string): Promise<List> => {
    console.log('[api] lists.getByBoardIdAndListId called', { boardId, listId });
    const response = await api.get<List>(`/boards/${boardId}/lists/${listId}`);
    return response.data;
  },
  update: async (id: string, data: Partial<List>): Promise<List> => {
    console.log('[api] lists.update called', { id, data });
    const response = await api.put<List>(`/lists/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    console.log('[api] lists.delete called', { id });
    await api.delete(`/lists/${id}`);
  },
};

// Card endpoints
export const cards = {
  getByListId: async (listId: string): Promise<Card[]> => {
    console.log('[api] cards.getByListId called', { listId });
    const response = await api.get<Card[]>(`/lists/${listId}/cards`);
    return response.data;
  },
  create: async (listId: string, title: string, description?: string, dueDate?: string, labels?: string[]): Promise<Card> => {
    console.log('[api] cards.create called', { listId, title, description, dueDate, labels });
    const response = await api.post<Card>(`/lists/${listId}/cards`, { 
      title, 
      description, 
      dueDate, 
      labels 
    });
    return response.data;
  },
  update: async (id: string, data: Partial<Card>): Promise<Card> => {
    console.log('[api] cards.update called', { id, data });
    const response = await api.put<Card>(`/cards/${id}`, data);
    return response.data;
  },
  // For updating a card within a specific list
  updateInList: async (listId: string, cardId: string, data: Partial<Card>): Promise<Card> => {
    console.log('[api] cards.updateInList called', { listId, cardId, data });
    const response = await api.put<Card>(`/lists/${listId}/cards`, { 
      id: cardId,
      ...data
    });
    return response.data;
  },
  delete: async (id: string, listId?: string): Promise<void> => {
    console.log('[api] cards.delete called', { id, listId });
    await api.delete(`/cards/${id}`);
  },
  getById: async (listId: string, cardId: string): Promise<Card> => {
    console.log('[api] cards.getById called', { listId, cardId });
    const response = await api.get<Card>(`/lists/${listId}/cards/${cardId}`);
    return response.data;
  },
  move: async (id: string, listId: string, position: number): Promise<Card> => {
    console.log('[api] cards.move called', { id, listId, position });
    // Using the cards.update method which matches the OpenAPI spec
    return await cards.update(id, { listId, position });
  },
  addChecklist: async (cardId: string, title: string): Promise<void> => {
    console.log('[api] cards.addChecklist called', { cardId, title });
    await api.post(`/cards/${cardId}/checklist`, { title });
  },
  addChecklistItem: async (cardId: string, text: string): Promise<Card> => {
    console.log('[api] cards.addChecklistItem called', { cardId, text });
    // Add checklist item using the addChecklist method
    await api.post(`/cards/${cardId}/checklist`, { title: text });
    // Return the updated card
    // Since we need the full card after adding a checklist item,
    // we make an additional request to get the card
    const response = await api.get<Card>(`/cards/${cardId}`);
    return response.data;
  },
  addComment: async (cardId: string, text: string): Promise<Comment> => {
    console.log('[api] cards.addComment called', { cardId, text });
    const response = await api.post<Comment>(`/cards/${cardId}/comments`, { text });
    return response.data;
  },
  updateChecklistItem: async (cardId: string, itemId: string, isCompleted: boolean): Promise<Card> => {
    console.log('[api] cards.updateChecklistItem called', { cardId, itemId, isCompleted });
    const response = await api.patch<Card>(`/cards/${cardId}/checklist/${itemId}`, { completed: isCompleted });
    return response.data;
  }
};

// Comments endpoints
export const comments = {
  getAll: async (authorId?: string): Promise<Comment[]> => {
    console.log('[api] comments.getAll called', { authorId });
    const params = authorId ? { authorId } : undefined;
    const response = await api.get<Comment[]>('/comments', { params });
    return response.data;
  },
  create: async (text: string): Promise<Comment> => {
    console.log('[api] comments.create called', { text });
    const response = await api.post<Comment>('/comments', { text });
    return response.data;
  },
  getById: async (commentId: string): Promise<Comment> => {
    console.log('[api] comments.getById called', { commentId });
    const response = await api.get<Comment>(`/comments/${commentId}`);
    return response.data;
  },
  update: async (commentId: string, text: string): Promise<Comment> => {
    console.log('[api] comments.update called', { commentId, text });
    const response = await api.patch<Comment>(`/comments/${commentId}`, { text });
    return response.data;
  },
  delete: async (commentId: string): Promise<void> => {
    console.log('[api] comments.delete called', { commentId });
    await api.delete(`/comments/${commentId}`);
  }
};

export default api; 