import { create } from 'zustand';

export interface User {
  name: string;
  pass: string;
  gender: string;
  age: string;
  profile: string;
  color: string;
  font: string;
  status: string;
}

export interface ChatMessage {
  user: string;
  msg?: string;
  type: 'text' | 'image' | 'audio';
  data?: string;
  color?: string;
  time: string;
}

interface ChatStore {
  currentUser: string | null;
  activePage: string;
  selectedPrivateUser: string;
  setCurrentUser: (user: string | null) => void;
  setActivePage: (page: string) => void;
  setSelectedPrivateUser: (user: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentUser: localStorage.getItem('user'),
  activePage: localStorage.getItem('user') ? 'public' : 'login',
  selectedPrivateUser: '',
  setCurrentUser: (user) => set({ currentUser: user }),
  setActivePage: (page) => set({ activePage: page }),
  setSelectedPrivateUser: (user) => set({ selectedPrivateUser: user }),
}));

// Helper functions for localStorage-based data
export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem('users') || '[]');
}

export function saveUsers(users: User[]) {
  localStorage.setItem('users', JSON.stringify(users));
}

export function getMessages(chatId: string): ChatMessage[] {
  return JSON.parse(localStorage.getItem(chatId) || '[]');
}

export function saveMessages(chatId: string, msgs: ChatMessage[]) {
  localStorage.setItem(chatId, JSON.stringify(msgs));
}

export function sendTextMessage(chatId: string, user: string, msg: string) {
  const msgs = getMessages(chatId);
  msgs.push({
    user,
    msg,
    type: 'text',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  saveMessages(chatId, msgs);
}

export function sendMediaMessage(chatId: string, user: string, type: 'image' | 'audio', data: string) {
  const msgs = getMessages(chatId);
  msgs.push({
    user,
    type,
    data,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  saveMessages(chatId, msgs);
}
