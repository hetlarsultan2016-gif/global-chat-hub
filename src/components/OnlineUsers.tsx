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

interface OnlineUsersProps {
  roomId?: string;
}

export default function OnlineUsers({ roomId }: OnlineUsersProps) {
  const { currentUserId, setSelectedPrivateUserId, setActivePage } = useChatStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedModal, setSelectedModal] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (roomId && !search.trim()) {
        // When in a room and not searching, show only users who sent messages in this room recently
        const { data: msgData } = await supabase
          .from('messages')
          .select('user_id')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .limit(100);
        if (msgData) {
          const roomUserIds = [...new Set(msgData.map(m => m.user_id))].filter(id => id !== currentUserId);
          if (roomUserIds.length > 0) {
            const { data } = await supabase
              .from('profiles')
              .select('user_id, username, gender, age, avatar_url, bio, is_online')
              .in('user_id', roomUserIds);
            if (data) { setUsers(data); return; }
          } else {
            setUsers([]); return;
          }
        }
      } else {
        // Default: show all users
        const { data } = await supabase
          .from('profiles')
          .select('user_id, username, gender, age, avatar_url, bio, is_online')
          .neq('user_id', currentUserId || '');
        if (data) setUsers(data);
      }
    };
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, [currentUserId, roomId, search]);

  const filtered = users.filter((u) => {
    if (search && !u.username.toLowerCase().includes(search.toLowerCase())) return false;
    if (genderFilter !== 'all' && u.gender !== genderFilter) return false;
    if (typeFilter === 'guest' && !u.username.startsWith('زائر_')) return false;
    if (typeFilter === 'member' && u.username.startsWith('زائر_')) return false;
    // When no search in global view, show only online users
    if (!roomId && !search.trim()) return u.is_online;
    return true;
  });
  const onlineCount = users.filter(u => u.is_online).length;

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

  const getInitial = (name: string) => name?.charAt(0) || '?';

  return (
    <div className="space-y-3" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">👥</span>
        <h2 className="font-bold text-base">{roomId ? 'أعضاء الغرفة' : 'الأعضاء المتصلون'}</h2>
        <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-lg mr-auto">
          {roomId ? `${filtered.length} عضو` : `${onlineCount} متصل`}
        </span>
      </div>

      <input className="input-field" placeholder="ابحث عن عضو (يظهر الكل عند البحث)..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="flex gap-2">
        <select className="input-field text-xs flex-1" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="all">الكل</option>
          <option value="male">ذكر</option>
          <option value="female">أنثى</option>
        </select>
        <select className="input-field text-xs flex-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">الكل</option>
          <option value="member">عضو</option>
          <option value="guest">زائر</option>
        </select>
      </div>

      <div className="space-y-1.5">
        {filtered.map((u) => (
          <div
            key={u.user_id}
            onClick={() => setSelectedModal(u)}
            className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer hover:bg-secondary transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold">
              {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(u.username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{u.username}</p>
              <p className="text-[11px] text-muted-foreground">
                {genderLabel(u.gender)} {u.age ? `· ${u.age} سنة` : ''}
                {u.username.startsWith('زائر_') ? ' · زائر' : ' · عضو'}
              </p>
            </div>
            <span className={`online-dot ${u.is_online ? 'active' : 'inactive'}`} />
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8 opacity-60">
            {search ? 'لا يوجد نتائج' : roomId ? 'لا يوجد أعضاء في الغرفة' : 'لا يوجد أعضاء متصلون'}
          </p>
        )}
      </div>

      {selectedModal && (
        <div className="modal-overlay" onClick={() => setSelectedModal(null)}>
          <div className="bg-card p-6 rounded-2xl border border-border w-[90%] max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}
               style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-2xl font-bold">
                {selectedModal.avatar_url ? <img src={selectedModal.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(selectedModal.username)}
              </div>
              <h3 className="font-bold text-lg">{selectedModal.username}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`online-dot ${selectedModal.is_online ? 'active' : 'inactive'}`} />
                <span>{selectedModal.is_online ? 'متصل الآن' : 'غير متصل'}</span>
              </div>
              <p className="text-muted-foreground text-sm">{genderLabel(selectedModal.gender)} {selectedModal.age ? `· ${selectedModal.age} سنة` : ''}</p>
              {selectedModal.bio && <p className="text-primary text-sm text-center">{selectedModal.bio}</p>}
            </div>
            <button onClick={startChat} className="w-full btn-primary">مراسلة خاصة</button>
            <button onClick={() => setSelectedModal(null)} className="w-full btn-secondary">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
