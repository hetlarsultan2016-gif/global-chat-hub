import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStore } from '@/lib/chatStore';

interface UserProfile {
  user_id: string;
  username: string;
  is_online: boolean;
  avatar_url: string | null;
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  is_pinned: boolean;
}

interface Message {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  room_id: string;
  username?: string;
  room_name?: string;
}

type Tab = 'messages' | 'users' | 'rooms' | 'moderators';

interface UserRole {
  user_id: string;
  role: string;
  username?: string;
}

export default function AdminPage() {
  const { currentUserId } = useChatStore();
  const [tab, setTab] = useState<Tab>('messages');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [loading, setLoading] = useState(false);

  // New room form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomImage, setNewRoomImage] = useState('🏠');
  const [showAddRoom, setShowAddRoom] = useState(false);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('user_id, username, is_online, avatar_url').order('username');
    if (data) setUsers(data);
  }, []);

  const loadRoles = useCallback(async () => {
    const { data } = await supabase.from('user_roles').select('user_id, role');
    if (data) {
      const userIds = [...new Set((data as any[]).map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, username').in('user_id', userIds);
      const nameMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.username]));
      setRoles((data as any[]).map((r: any) => ({ ...r, username: nameMap[r.user_id] || 'مجهول' })));
    }
  }, []);

  const loadRooms = useCallback(async () => {
    const { data } = await supabase.from('rooms').select('*').order('name');
    if (data) setRooms(data);
  }, []);

  const loadMessages = useCallback(async () => {
    const query = supabase.from('messages').select('id, text, created_at, user_id, room_id').order('created_at', { ascending: false }).limit(50);
    if (selectedRoom) query.eq('room_id', selectedRoom);
    const { data } = await query;
    if (data) {
      // Batch resolve profiles and rooms
      const userIds = [...new Set(data.map(m => m.user_id))];
      const roomIds = [...new Set(data.map(m => m.room_id))];
      const [{ data: profiles }, { data: roomsData }] = await Promise.all([
        supabase.from('profiles').select('user_id, username').in('user_id', userIds),
        supabase.from('rooms').select('id, name').in('id', roomIds),
      ]);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.username]));
      const roomMap = Object.fromEntries((roomsData || []).map(r => [r.id, r.name]));
      setMessages(data.map(m => ({ ...m, username: profileMap[m.user_id] || 'مجهول', room_name: roomMap[m.room_id] || '?' })));
    }
  }, [selectedRoom]);

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'rooms') loadRooms();
    if (tab === 'messages') loadMessages();
    if (tab === 'moderators') { loadRoles(); loadUsers(); }
  }, [tab, loadUsers, loadRooms, loadMessages, loadRoles]);

  const deleteMessage = async (id: string) => {
    setLoading(true);
    await supabase.from('messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    setLoading(false);
  };

  const banUser = async (userId: string) => {
    if (userId === currentUserId) return;
    setLoading(true);
    await supabase.from('blocked_users' as any).insert({ blocker_id: currentUserId, blocked_id: userId } as any);
    setLoading(false);
    alert('تم حظر المستخدم');
  };

  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    setLoading(true);
    await supabase.from('rooms').insert({ name: newRoomName, description: newRoomDesc || null, image: newRoomImage || '🏠' });
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomImage('🏠');
    setShowAddRoom(false);
    await loadRooms();
    setLoading(false);
  };

  const deleteRoom = async (id: string) => {
    setLoading(true);
    await supabase.from('rooms').delete().eq('id', id);
    setRooms(prev => prev.filter(r => r.id !== id));
    setLoading(false);
  };

  const togglePin = async (room: Room) => {
    await supabase.from('rooms').update({ is_pinned: !room.is_pinned }).eq('id', room.id);
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_pinned: !r.is_pinned } : r));
  };

  const assignRole = async (userId: string, role: string) => {
    setLoading(true);
    await supabase.from('user_roles').insert({ user_id: userId, role } as any);
    await loadRoles();
    setLoading(false);
  };

  const removeRole = async (userId: string, role: string) => {
    setLoading(true);
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', role as any);
    await loadRoles();
    setLoading(false);
  };

  const formatTime = (d: string) => new Date(d).toLocaleString('ar', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getInitial = (n: string) => n?.charAt(0) || '?';

  const filteredUsers = users.filter(u => !search || u.username.toLowerCase().includes(search.toLowerCase()));
  const filteredMessages = messages.filter(m => !search || m.text.includes(search) || (m.username || '').includes(search));
  const modRoleUserIds = roles.map(r => r.user_id);
  const nonModUsers = filteredUsers.filter(u => !modRoleUserIds.includes(u.user_id));

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'messages', icon: '💬', label: 'الرسائل' },
    { id: 'users', icon: '👥', label: 'المستخدمين' },
    { id: 'rooms', icon: '🏠', label: 'الغرف' },
    { id: 'moderators', icon: '🛡️', label: 'المشرفين' },
  ];

  return (
    <div className="flex flex-col h-full space-y-3" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center gap-2">
        <span className="text-lg">🛡️</span>
        <h2 className="font-bold text-base">لوحة الإدارة</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card/80 rounded-xl p-1 border border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <input className="input-field" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} />

      {/* Messages Tab */}
      {tab === 'messages' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <div className="flex gap-2 mb-2">
            <select className="input-field text-xs flex-1" value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
              <option value="">كل الغرف</option>
              {rooms.length === 0 && <option disabled>جاري التحميل...</option>}
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {filteredMessages.map(m => (
            <div key={m.id} className="flex items-start gap-2 p-2.5 bg-card rounded-xl border border-border">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-primary">{m.username}</span>
                  <span className="text-[10px] text-muted-foreground">· {m.room_name}</span>
                  <span className="text-[10px] text-muted-foreground mr-auto">{formatTime(m.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed break-words">{m.text}</p>
              </div>
              <button
                onClick={() => deleteMessage(m.id)}
                disabled={loading}
                className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors text-xs flex-shrink-0"
                title="حذف الرسالة"
              >
                🗑️
              </button>
            </div>
          ))}
          {filteredMessages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8 opacity-60">لا توجد رسائل</p>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="flex-1 overflow-y-auto space-y-1.5">
          {filteredUsers.map(u => (
            <div key={u.user_id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold">
                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(u.username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{u.username}</p>
                <span className={`text-[10px] ${u.is_online ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {u.is_online ? '🟢 متصل' : '⚫ غير متصل'}
                </span>
              </div>
              {u.user_id !== currentUserId && (
                <button
                  onClick={() => banUser(u.user_id)}
                  disabled={loading}
                  className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded-lg transition-colors"
                >
                  🚫 حظر
                </button>
              )}
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8 opacity-60">لا يوجد نتائج</p>
          )}
        </div>
      )}

      {/* Rooms Tab */}
      {tab === 'rooms' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <button
            onClick={() => setShowAddRoom(!showAddRoom)}
            className="w-full btn-primary text-sm py-2"
          >
            {showAddRoom ? '✕ إلغاء' : '+ إضافة غرفة جديدة'}
          </button>

          {showAddRoom && (
            <div className="p-3 bg-card rounded-xl border border-border space-y-2" style={{ animation: 'slideUp 0.2s ease' }}>
              <input className="input-field" placeholder="اسم الغرفة" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} />
              <input className="input-field" placeholder="وصف الغرفة (اختياري)" value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} />
              <input className="input-field" placeholder="أيقونة (مثال: 🏠)" value={newRoomImage} onChange={e => setNewRoomImage(e.target.value)} />
              <button onClick={addRoom} disabled={!newRoomName.trim() || loading} className="w-full btn-primary text-sm py-2 disabled:opacity-30">
                إنشاء الغرفة
              </button>
            </div>
          )}

          {rooms.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <span className="text-xl flex-shrink-0">{r.image}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{r.name}</span>
                  {r.is_pinned && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">مثبت</span>}
                </div>
                {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => togglePin(r)} className="text-xs hover:bg-secondary p-1.5 rounded-lg transition-colors" title={r.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}>
                  {r.is_pinned ? '📌' : '📍'}
                </button>
                <button onClick={() => deleteRoom(r.id)} disabled={loading} className="text-xs text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors" title="حذف الغرفة">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
