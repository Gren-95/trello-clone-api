export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  isArchived: boolean;
  background?: string;
  isTemplate: boolean;
  isFavorite: boolean;
  members?: {
    userId: string;
    role: 'owner' | 'admin' | 'member';
  }[];
  lists: List[];
}

export interface List {
  id: string;
  boardId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  position?: number;
  cards: Card[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Card {
  id: string;
  listId: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  labels?: string[];
  position?: number;
  checklist: ChecklistItem[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  content?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CommentRequest {
  text: string;
}

export interface LogoutResponse {
  message: string;
}

export interface Error {
  error: string;
  message?: string;
} 