export interface User {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  id: string;
  name: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  lists: List[];
}

export interface List {
  id: string;
  title: string;
  boardId: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  cards: Card[];
}

export interface Card {
  id: string;
  title: string;
  description: string;
  listId: string;
  position: number;
  dueDate: string | null;
  labels: Label[];
  attachments: Attachment[];
  checklist: ChecklistItem[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
} 