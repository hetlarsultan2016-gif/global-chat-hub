import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStore } from '@/lib/chatStore';

interface Profile {
  user_id: string;
  username: string;
  gender: string | null;
  age: number | null;
  avatar_url: string | null;
  bio: string | null;
  is_online: boolean;
}

export default function OnlineUsers() {
  const { currentUserId, setSelectedPrivateUserId, setActivePage } = useChatStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedModal, setSelectedModal] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, gender, age, avatar_url, bio, is_online')
        .neq('user_id', currentUserId || '');
      if (data) setUsers(data);
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const startChat = () => {
    if (!selectedModal) return;
    setSelectedPrivateUserId(selectedModal.user_id);
    setSelectedModal(null);
    setActivePage('private');
  };

  const genderLabel = (g: string | null) => {
    if (g === 'male') return 'ذكر';
    if (g === 'female') return 'أنثى';
    return '';
  };

  return (
    <div className="space-y-3">
      <input
        className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
        placeholder="بحث بين الأعضاء..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="space-y-2">
        {filtered.map((u) => (
          <div
            key={u.user_id}
            onClick={() => setSelectedModal(u)}
            className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer hover:bg-secondary transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
              {u.avatar_url && <img src={u.avatar_url} className="w-full h-full object-cover" alt="" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{u.username}</p>
              <p className="text-xs text-muted-foreground">{genderLabel(u.gender)} {u.age ? `· ${u.age} سنة` : ''}</p>
            </div>
            <span className={`text-xs ${u.is_online ? 'text-primary' : 'text-muted-foreground'}`}>
              {u.is_online ? 'متصل' : 'غير متصل'}
            </span>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">لا يوجد أعضاء</p>
        )}
      </div>

      {selectedModal && (
        <div className="modal-overlay" onClick={() => setSelectedModal(null)}>
          <div className="bg-card p-6 rounded-2xl border border-border w-[90%] max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden">
                {selectedModal.avatar_url && <img src={selectedModal.avatar_url} className="w-full h-full object-cover" alt="" />}
              </div>
              <h3 className="font-bold text-lg">{selectedModal.username}</h3>
              <p className="text-muted-foreground text-sm">{genderLabel(selectedModal.gender)} {selectedModal.age ? `· ${selectedModal.age} سنة` : ''}</p>
              {selectedModal.bio && <p className="text-primary text-sm">{selectedModal.bio}</p>}
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
