import { create } from 'zustand';

interface ChatStore {
  currentUserId: string | null;
  currentUsername: string | null;
  activePage: string;
  selectedPrivateUserId: string;
  setCurrentUser: (id: string | null, username: string | null) => void;
  setActivePage: (page: string) => void;
  setSelectedPrivateUserId: (id: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentUserId: null,
  currentUsername: null,
  activePage: 'login',
  selectedPrivateUserId: '',
  setCurrentUser: (id, username) => set({ currentUserId: id, currentUsername: username }),
  setActivePage: (page) => set({ activePage: page }),
  setSelectedPrivateUserId: (id) => set({ selectedPrivateUserId: id }),
}));
