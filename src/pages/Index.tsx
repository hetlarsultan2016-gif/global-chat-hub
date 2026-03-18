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

const NAV_ITEMS = [
  { id: 'public', icon: '💬', label: 'عام' },
  { id: 'dating', icon: '❤️', label: 'تعارف' },
  { id: 'countries', icon: '🌎', label: 'الدول' },
  { id: 'private', icon: '📩', label: 'رسائل' },
  { id: 'online', icon: '👥', label: 'أعضاء' },
  { id: 'profile', icon: '👤', label: 'حسابي' },
];

const PAGES: Record<string, React.FC> = {
  public: PublicChatPage,
  dating: DatingChatPage,
  countries: CountriesPage,
  private: PrivateChatPage,
  online: OnlineUsers,
  profile: ProfilePage,
};

export default function Index() {
  const { activePage, setActivePage, currentUserId, currentUsername, setCurrentUser } = useChatStore();

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single();
        setCurrentUser(session.user.id, profile?.username || 'مستخدم');
        if (activePage === 'login') setActivePage('public');
        // Mark online
        await supabase.from('profiles').update({ is_online: true }).eq('user_id', session.user.id);
      } else {
        setCurrentUser(null, null);
        setActivePage('login');
      }
    });

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', session.user.id)
          .single();
        setCurrentUser(session.user.id, profile?.username || 'مستخدم');
        setActivePage('public');
        await supabase.from('profiles').update({ is_online: true }).eq('user_id', session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!currentUserId || activePage === 'login') {
    return <LoginPage />;
  }

  const PageComponent = PAGES[activePage] || PublicChatPage;

  const handleLogout = async () => {
    if (currentUserId) {
      await supabase.from('profiles').update({ is_online: false }).eq('user_id', currentUserId);
    }
    await supabase.auth.signOut();
    setCurrentUser(null, null);
    setActivePage('login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" dir="rtl">
      <header className="glass-header border-b border-border px-4 py-3 text-center font-bold text-lg z-50 flex items-center justify-between">
        <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={handleLogout}>
          خروج
        </span>
        <span>🌍 الدردشة العالمية</span>
        <span className="text-xs text-muted-foreground">{currentUsername}</span>
      </header>

      <nav className="flex justify-around bg-card border-b border-border px-2 py-1 overflow-x-auto z-40">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`nav-item-chat min-w-[50px] ${activePage === item.id ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px]">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="h-full flex flex-col">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
