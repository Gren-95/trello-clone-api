import axios from 'axios';
import type { AuthResponse, Board, Card, List, User } from '../types';

const API_URL = 'http://localhost:3066';

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
    const response = await api.post<AuthResponse>('/sessions', { username, password });
    return response.data;
  },
  register: async (username: string, password: string): Promise<User> => {
    const response = await api.post<User>('/users', { username, password });
    return response.data;
  },
  logout: async (): Promise<void> => {
    await api.delete('/sessions');
    localStorage.removeItem('token');
  },
};

// User endpoints
export const users = {
  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    await api.put(`/users/${userId}`, { currentPassword, newPassword });
  },
  deleteAccount: async (): Promise<void> => {
    await api.delete('/users');
  },
};

// Board endpoints
export const boards = {
  getAll: async (): Promise<Board[]> => {
    const response = await api.get<Board[]>('/boards');
    return response.data;
  },
  getById: async (id: string): Promise<Board> => {
    const response = await api.get<Board>(`/boards/${id}`);
    return response.data;
  },
  create: async (name: string): Promise<Board> => {
    const response = await api.post<Board>('/boards', { name });
    return response.data;
  },
  update: async (id: string, data: Partial<Board>): Promise<Board> => {
    const response = await api.put<Board>(`/boards/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/boards/${id}`);
  },
};

// List endpoints
export const lists = {
  getAllByBoardId: async (boardId: string): Promise<List[]> => {
    const response = await api.get<List[]>(`/boards/${boardId}/lists`);
    return response.data;
  },
  create: async (boardId: string, title: string): Promise<List> => {
    const response = await api.post<List>(`/boards/${boardId}/lists`, { title });
    return response.data;
  },
  getById: async (listId: string): Promise<List> => {
    const response = await api.get<List>(`/lists/${listId}`);
    return response.data;
  },
  getByBoardIdAndListId: async (boardId: string, listId: string): Promise<List> => {
    const response = await api.get<List>(`/boards/${boardId}/lists/${listId}`);
    return response.data;
  },
  update: async (id: string, data: Partial<List>): Promise<List> => {
    const response = await api.put<List>(`/lists/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/lists/${id}`);
  },
};

// Card endpoints
export const cards = {
  create: async (listId: string, title: string): Promise<Card> => {
    const response = await api.post<Card>(`/lists/${listId}/cards`, { title });
    return response.data;
  },
  update: async (id: string, data: Partial<Card>): Promise<Card> => {
    const response = await api.put<Card>(`/cards/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/cards/${id}`);
  },
  move: async (id: string, listId: string, position: number): Promise<Card> => {
    const response = await api.put<Card>(`/cards/${id}`, { listId, position });
    return response.data;
  },
};

export default api; 