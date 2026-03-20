import { useEffect } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';
import LoginPage from '@/components/LoginPage';
import PublicChatPage from '@/components/PublicChatPage';
import DatingChatPage from '@/components/DatingChatPage';
import PrivateChatPage from '@/components/PrivateChatPage';
import ProfilePage from '@/components/ProfilePage';
import OnlineUsers from '@/components/OnlineUsers';
import CountriesPage from '@/components/CountriesPage';
import RoomsPage from '@/components/RoomsPage';

const NAV_ITEMS = [
  { id: 'public', icon: '💬', label: 'عام' },
  { id: 'dating', icon: '❤️', label: 'تعارف' },
  { id: 'rooms', icon: '🏠', label: 'الغرف' },
  { id: 'countries', icon: '🌎', label: 'الدول' },
  { id: 'private', icon: '📩', label: 'رسائل' },
  { id: 'online', icon: '👥', label: 'أعضاء' },
  { id: 'profile', icon: '👤', label: 'حسابي' },
];

const PAGES: Record<string, React.FC> = {
  public: PublicChatPage,
  dating: DatingChatPage,
  rooms: RoomsPage,
  countries: CountriesPage,
  private: PrivateChatPage,
  online: OnlineUsers,
  profile: ProfilePage,
};

export default function Index() {
  const { activePage, setActivePage, currentUserId, currentUsername, setCurrentUser } = useChatStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', session.user.id).single();
        setCurrentUser(session.user.id, profile?.username || 'مستخدم');
        if (activePage === 'login') setActivePage('public');
        await supabase.from('profiles').update({ is_online: true }).eq('user_id', session.user.id);
      } else {
        setCurrentUser(null, null);
        setActivePage('login');
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', session.user.id).single();
        setCurrentUser(session.user.id, profile?.username || 'مستخدم');
        setActivePage('public');
        await supabase.from('profiles').update({ is_online: true }).eq('user_id', session.user.id);
      }
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
      {/* Header */}
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

      {/* Navigation */}
      <nav className="flex bg-card/80 backdrop-blur-sm border-b border-border px-1 py-1 overflow-x-auto z-40 gap-0.5" style={{ scrollbarWidth: 'none' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`nav-item-chat min-w-[44px] flex-shrink-0 ${
              activePage === item.id
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="h-full flex flex-col p-3">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
