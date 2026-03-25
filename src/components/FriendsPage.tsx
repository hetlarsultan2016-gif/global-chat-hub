import { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  created_at: string;
  profile?: { username: string; avatar_url: string | null; is_online: boolean };
}

export default function FriendsPage() {
  const { currentUserId, setSelectedPrivateUserId, setActivePage } = useChatStore();
  const [tab, setTab] = useState<'friends' | 'received' | 'sent'>('friends');
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [received, setReceived] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    if (!currentUserId) return;
    setLoading(true);

    const { data: allFriends } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

    if (!allFriends) { setLoading(false); return; }

    const otherIds = allFriends.map(f => f.user_id === currentUserId ? f.friend_id : f.user_id);
    const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url, is_online').in('user_id', otherIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const withProfiles = allFriends.map(f => {
      const otherId = f.user_id === currentUserId ? f.friend_id : f.user_id;
      return { ...f, profile: profileMap.get(otherId) || { username: 'مجهول', avatar_url: null, is_online: false } };
    });

    setFriends(withProfiles.filter(f => f.status === 'accepted'));
    setReceived(withProfiles.filter(f => f.status === 'pending' && f.friend_id === currentUserId));
    setSent(withProfiles.filter(f => f.status === 'pending' && f.user_id === currentUserId));
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [currentUserId]);

  const handleAccept = async (id: string) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', id);
    loadAll();
  };

  const handleReject = async (id: string) => {
    await supabase.from('friends').delete().eq('id', id);
    loadAll();
  };

  const handleMessage = (userId: string) => {
    setSelectedPrivateUserId(userId);
    setActivePage('private');
  };

  const getInitial = (name: string) => name?.charAt(0) || '?';
  const getOtherId = (f: FriendRequest) => f.user_id === currentUserId ? f.friend_id : f.user_id;

  const tabs = [
    { id: 'friends' as const, label: 'أصدقائي', count: friends.length },
    { id: 'received' as const, label: 'طلبات واردة', count: received.length },
    { id: 'sent' as const, label: 'طلبات مرسلة', count: sent.length },
  ];

  const currentList = tab === 'friends' ? friends : tab === 'received' ? received : sent;
  const emptyMsg = tab === 'friends' ? 'لا يوجد أصدقاء بعد' : tab === 'received' ? 'لا توجد طلبات واردة' : 'لا توجد طلبات مرسلة';

  return (
    <div className="flex flex-col h-full" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">👥</span>
        <h2 className="font-bold text-base">الأصدقاء</h2>
      </div>

      <div className="flex gap-1 mb-3 bg-secondary/50 rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all relative ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`absolute -top-1 -left-1 text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1 ${tab === t.id ? 'bg-primary-foreground text-primary' : 'bg-destructive text-destructive-foreground'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">جاري التحميل...</div>
      ) : currentList.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-2">
          <span className="text-4xl">👥</span>
          <span className="text-sm">{emptyMsg}</span>
        </div>
      ) : (
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {currentList.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <div className="relative flex-shrink-0">
                <div className="w-11 h-11 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-sm font-bold">
                  {f.profile?.avatar_url ? <img src={f.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(f.profile?.username || '')}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 online-dot ${f.profile?.is_online ? 'active' : 'inactive'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{f.profile?.username}</p>
                <p className="text-[10px] text-muted-foreground">{f.profile?.is_online ? 'متصل' : 'غير متصل'}</p>
              </div>
              <div className="flex gap-1.5">
                {tab === 'received' && (
                  <>
                    <button onClick={() => handleAccept(f.id)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">قبول</button>
                    <button onClick={() => handleReject(f.id)} className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-lg text-xs font-medium">رفض</button>
                  </>
                )}
                {tab === 'friends' && (
                  <button onClick={() => handleMessage(getOtherId(f))} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">💬</button>
                )}
                {tab === 'sent' && (
                  <button onClick={() => handleReject(f.id)} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs font-medium">إلغاء</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
