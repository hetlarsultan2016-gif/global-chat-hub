import { useChatStore } from '@/lib/chatStore';
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
  { id: 'online', icon: '👥', label: 'متصلين' },
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
  const { activePage, setActivePage, currentUser, setCurrentUser } = useChatStore();

  if (!currentUser || activePage === 'login') {
    return <LoginPage />;
  }

  const PageComponent = PAGES[activePage] || PublicChatPage;

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setActivePage('login');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="glass-header border-b border-border px-4 py-3 text-center font-bold text-lg z-50 flex items-center justify-between">
        <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={handleLogout}>
          خروج
        </span>
        <span>🌍 الدردشة العالمية</span>
        <span className="text-xs text-muted-foreground">{currentUser}</span>
      </header>

      {/* Nav */}
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

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 min-h-0">
        <div className="h-full flex flex-col">
          <PageComponent />
        </div>
      </main>
    </div>
  );
}
