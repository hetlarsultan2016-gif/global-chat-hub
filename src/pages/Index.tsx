import { useEffect } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';
import { playNotificationSound } from '@/lib/notificationSound';
import LoginPage from '@/components/LoginPage';
import PublicChatPage from '@/components/PublicChatPage';
import DatingChatPage from '@/components/DatingChatPage';
import PrivateChatPage from '@/components/PrivateChatPage';
import ProfilePage from '@/components/ProfilePage';
import OnlineUsers from '@/components/OnlineUsers';
import CountriesPage from '@/components/CountriesPage';
import RoomsPage from '@/components/RoomsPage';
import ViewProfilePage from '@/components/ViewProfilePage';
import FriendsPage from '@/components/FriendsPage';

const NAV_ITEMS = [
  { id: 'public', icon: '💬', label: 'عام' },
  { id: 'dating', icon: '❤️', label: 'تعارف' },
  { id: 'rooms', icon: '🏠', label: 'الغرف' },
  { id: 'countries', icon: '🌎', label: 'الدول' },
  { id: 'private', icon: '📩', label: 'رسائل' },
  { id: 'friends', icon: '🤝', label: 'أصدقاء' },
  { id: 'online', icon: '👥', label: 'أعضاء' },
  { id: 'profile', icon: '👤', label: 'حسابي' },
];

const PAGES: Record<string, React.FC> = {
  public: PublicChatPage,
  dating: DatingChatPage,
  rooms: RoomsPage,
  countries: CountriesPage,
  private: PrivateChatPage,
  friends: FriendsPage,
  online: OnlineUsers,
  profile: ProfilePage,
  viewProfile: ViewProfilePage,
};

export default function Index() {
  const { activePage, setActivePage, currentUserId, currentUsername, setCurrentUser, unreadCount, setUnreadCount, setBlockedUserIds } = useChatStore();

  // Load blocked users
  useEffect(() => {
    if (!currentUserId) return;
    const loadBlocked = async () => {
      const { data } = await supabase.from('blocked_users' as any).select('blocked_id').eq('blocker_id', currentUserId);
      if (data) setBlockedUserIds((data as any[]).map((b: any) => b.blocked_id));
    };
    loadBlocked();
  }, [currentUserId]);

  // Fetch unread count
  useEffect(() => {
    if (!currentUserId) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('private_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };
    fetchUnread();
    const channel = supabase
      .channel(`unread-${currentUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  useEffect(() => {
    const handleSession = (session: any) => {
      if (session?.user) {
        const username = session.user.user_metadata?.username || 'مستخدم';
        const store = useChatStore.getState();
        store.setCurrentUser(session.user.id, username);
        if (store.activePage === 'login') store.setActivePage('public');
        supabase.from('profiles').update({ is_online: true }).eq('user_id', session.user.id).then(() => {});
      } else {
        const store = useChatStore.getState();
        store.setCurrentUser(null, null);
        store.setActivePage('login');
      }
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!currentUserId || activePage === 'login') return <LoginPage />;

  const PageComponent = PAGES[activePage] || PublicChatPage;

  const handleLogout = async () => {
    if (currentUserId) await supabase.from('profiles').update({ is_online: false }).eq('user_id', currentUserId);
    await supabase.auth.signOut();
    setCurrentUser(null, null);
    setActivePage('login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" dir="rtl">
      <header className="glass-header px-4 py-3 z-50 flex items-center justify-between">
        <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10">
          خروج
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <span className="font-bold text-sm">الدردشة العالمية</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="online-dot active" />
          <span className="text-xs text-muted-foreground">{currentUsername}</span>
        </div>
      </header>

      <nav className="flex bg-card/80 backdrop-blur-sm border-b border-border px-1 py-1 overflow-x-auto z-40 gap-0.5" style={{ scrollbarWidth: 'none' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`nav-item-chat min-w-[44px] flex-shrink-0 relative ${
              activePage === item.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.id === 'private' && unreadCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full flex flex-col p-3">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
