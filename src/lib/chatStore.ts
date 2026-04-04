import { create } from 'zustand';

interface ChatStore {
  currentUserId: string | null;
  currentUsername: string | null;
  activePage: string;
  selectedPrivateUserId: string;
  unreadCount: number;
  replyToUsername: string | null;
  blockedUserIds: string[];
  isAdmin: boolean;
  setCurrentUser: (id: string | null, username: string | null) => void;
  setActivePage: (page: string) => void;
  setSelectedPrivateUserId: (id: string) => void;
  setUnreadCount: (count: number) => void;
  setReplyToUsername: (username: string | null) => void;
  setBlockedUserIds: (ids: string[]) => void;
  setIsAdmin: (val: boolean) => void;
  viewProfileUserId: string | null;
  setViewProfileUserId: (id: string | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentUserId: null,
  currentUsername: null,
  activePage: 'login',
  selectedPrivateUserId: '',
  unreadCount: 0,
  replyToUsername: null,
  blockedUserIds: [],
  viewProfileUserId: null,
  setCurrentUser: (id, username) => set({ currentUserId: id, currentUsername: username }),
  setActivePage: (page) => set({ activePage: page }),
  setSelectedPrivateUserId: (id) => set({ selectedPrivateUserId: id }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  setReplyToUsername: (username) => set({ replyToUsername: username }),
  setBlockedUserIds: (ids) => set({ blockedUserIds: ids }),
  setViewProfileUserId: (id) => set({ viewProfileUserId: id }),
}));
