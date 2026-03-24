import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStore } from '@/lib/chatStore';
import UserActionMenu from './UserActionMenu';

interface ChatBoxProps {
  roomId: string;
  showEmoji?: boolean;
}

interface MessageWithProfile {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

const EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '❤️', '🔥', '😎', '🤗', '💪', '🥰', '😢'];

export default function ChatBox({ roomId, showEmoji = true }: ChatBoxProps) {
  const { currentUserId, currentUsername } = useChatStore();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [actionMenu, setActionMenu] = useState<{ userId: string; username: string; avatarUrl: string | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const profilesCache = useRef<Record<string, { username: string; avatar_url: string | null }>>({});

  const resolveProfile = useCallback(async (userId: string) => {
    if (profilesCache.current[userId]) return profilesCache.current[userId];
    const { data } = await supabase.from('profiles').select('user_id, username, avatar_url').eq('user_id', userId).single();
    if (data) {
      profilesCache.current[data.user_id] = { username: data.username, avatar_url: data.avatar_url };
      return profilesCache.current[data.user_id];
    }
    return { username: 'مجهول', avatar_url: null };
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, text, created_at, user_id')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (!data) return;

    const userIds = [...new Set(data.map(m => m.user_id))];
    const uncached = userIds.filter(id => !profilesCache.current[id]);
    if (uncached.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', uncached);
      if (profiles) {
        profiles.forEach(p => {
          profilesCache.current[p.user_id] = { username: p.username, avatar_url: p.avatar_url };
        });
      }
    }

    setMessages(data.map(m => ({
      ...m,
      username: profilesCache.current[m.user_id]?.username || 'مجهول',
      avatar_url: profilesCache.current[m.user_id]?.avatar_url || null,
    })));
  }, [roomId]);

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, async (payload) => {
        const newMsg = payload.new as any;
        // Skip if it's our own optimistic message
        if (newMsg.user_id === currentUserId) {
          // Replace optimistic with real
          setMessages(prev => {
            const hasOptimistic = prev.some(m => m.id.startsWith('optimistic-'));
            if (hasOptimistic) {
              return prev.map(m =>
                m.id.startsWith('optimistic-') && m.text === newMsg.text
                  ? { ...m, id: newMsg.id, created_at: newMsg.created_at }
                  : m
              );
            }
            return prev;
          });
          return;
        }
        // For other users' messages, append directly
        const profile = await resolveProfile(newMsg.user_id);
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, {
            id: newMsg.id,
            text: newMsg.text,
            created_at: newMsg.created_at,
            user_id: newMsg.user_id,
            username: profile.username,
            avatar_url: profile.avatar_url,
          }];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, currentUserId, loadMessages, resolveProfile]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserId) return;
    const msg = text;
    setText('');

    // Optimistic update - show message instantly
    const optimisticId = `optimistic-${Date.now()}`;
    const myProfile = profilesCache.current[currentUserId] || { username: currentUsername || 'أنت', avatar_url: null };
    setMessages(prev => [...prev, {
      id: optimisticId,
      text: msg,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      username: myProfile.username,
      avatar_url: myProfile.avatar_url,
    }]);

    await supabase.from('messages').insert({ room_id: roomId, user_id: currentUserId, text: msg });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getInitial = (name: string) => name?.charAt(0) || '?';

  const handleAvatarClick = (m: MessageWithProfile) => {
    if (m.user_id === currentUserId) return;
    setActionMenu({ userId: m.user_id, username: m.username, avatarUrl: m.avatar_url });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/50 rounded-2xl border border-border mb-2">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12 opacity-60">لا توجد رسائل بعد...</p>
        )}
        {messages.map((m) => {
          const isMine = m.user_id === currentUserId;
          return (
            <div key={m.id} className={`message-bubble max-w-[80%] flex gap-2 ${isMine ? 'flex-row-reverse mr-0 ml-auto' : 'ml-0 mr-auto'}`}>
              {!isMine && (
                <div
                  onClick={() => handleAvatarClick(m)}
                  className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
                >
                  {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(m.username)}
                </div>
              )}
              <div className={`px-3.5 py-2 text-sm ${isMine ? 'message-sent' : 'message-received'}`}>
                {!isMine && (
                  <span
                    onClick={() => handleAvatarClick(m)}
                    className="font-semibold text-xs opacity-70 block mb-0.5 cursor-pointer hover:opacity-100 transition-opacity"
                  >
                    {m.username}
                  </span>
                )}
                <span className="leading-relaxed">{m.text}</span>
                <div className={`text-[10px] opacity-40 mt-1 ${isMine ? 'text-left' : 'text-right'}`}>{formatTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {showEmojis && (
        <div className="flex gap-1 mb-2 flex-wrap px-1" style={{ animation: 'slideUp 0.2s ease' }}>
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setText(text + e)} className="text-lg hover:bg-secondary rounded-lg p-1.5 transition-colors active:scale-90">
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-group">
        <input
          className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
          placeholder="اكتب رسالتك..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        {showEmoji && (
          <button onClick={() => setShowEmojis(!showEmojis)} className={`text-lg p-1 rounded-lg transition-colors ${showEmojis ? 'bg-primary/15' : 'hover:bg-secondary'}`}>
            😊
          </button>
        )}
        <button onClick={handleSend} disabled={!text.trim()} className="btn-primary px-4 py-2 disabled:opacity-30 disabled:shadow-none">
          إرسال
        </button>
      </div>

      {actionMenu && (
        <UserActionMenu
          userId={actionMenu.userId}
          username={actionMenu.username}
          avatarUrl={actionMenu.avatarUrl}
          onClose={() => setActionMenu(null)}
        />
      )}
    </div>
  );
}
