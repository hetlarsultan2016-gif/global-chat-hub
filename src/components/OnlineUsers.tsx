import { useState, useEffect } from 'react';
import { getUsers, useChatStore } from '@/lib/chatStore';

export default function OnlineUsers() {
  const { currentUser, setSelectedPrivateUser, setActivePage } = useChatStore();
  const [users, setUsers] = useState(getUsers());
  const [search, setSearch] = useState('');
  const [selectedModal, setSelectedModal] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setUsers(getUsers()), 2000);
    return () => clearInterval(interval);
  }, []);

  const filtered = users
    .filter((u) => u.name !== currentUser)
    .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()));

  const modalUser = users.find((u) => u.name === selectedModal);

  const startChat = () => {
    if (!selectedModal) return;
    setSelectedPrivateUser(selectedModal);
    setSelectedModal(null);
    setActivePage('private');
  };

  return (
    <div className="space-y-3">
      <input
        className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
        placeholder="بحث بين المتصلين..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="space-y-2">
        {filtered.map((u) => (
          <div
            key={u.name}
            onClick={() => setSelectedModal(u.name)}
            className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer hover:bg-secondary transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
              {u.profile && <img src={u.profile} className="w-full h-full object-cover" alt="" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{u.name}</p>
              <p className="text-xs text-muted-foreground">{u.gender} · {u.age} سنة</p>
            </div>
            <span className="text-xs text-primary">{u.status}</span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">لا يوجد أعضاء متصلين</p>
        )}
      </div>

      {selectedModal && modalUser && (
        <div className="modal-overlay" onClick={() => setSelectedModal(null)}>
          <div className="bg-card p-6 rounded-2xl border border-border w-[90%] max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden">
                {modalUser.profile && <img src={modalUser.profile} className="w-full h-full object-cover" alt="" />}
              </div>
              <h3 className="font-bold text-lg">{modalUser.name}</h3>
              <p className="text-muted-foreground text-sm">{modalUser.gender} · {modalUser.age} سنة</p>
              <p className="text-primary text-sm">{modalUser.status}</p>
            </div>
            <button onClick={startChat} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
              مراسلة خاصة
            </button>
            <button onClick={() => setSelectedModal(null)} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
