import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

interface PrivateMsg {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
}

interface ConversationUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_online: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function PrivateChatPage() {
  const { currentUserId, currentUsername, selectedPrivateUserId, setSelectedPrivateUserId } = useChatStore();
  const [users, setUsers] = useState<{ user_id: string; username: string; avatar_url: string | null; is_online: boolean }[]>([]);
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const [messages, setMessages] = useState<PrivateMsg[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('user_id, username, avatar_url, is_online').neq('user_id', currentUserId || '');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, [currentUserId]);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    const { data: allMsgs } = await supabase
      .from('private_messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    if (!allMsgs) return;

    const convMap = new Map<string, { lastMsg: PrivateMsg; unread: number }>();
    allMsgs.forEach((m: any) => {
      const otherId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { lastMsg: m, unread: 0 });
      }
      if (m.receiver_id === currentUserId && !m.is_read) {
        const entry = convMap.get(otherId)!;
        entry.unread++;
      }
    });

    const convUsers: ConversationUser[] = [];
    convMap.forEach((val, oderId) => {
      const user = users.find(u => u.user_id === oderId);
      convUsers.push({
        user_id: oderId,
        username: user?.username || 'مجهول',
        avatar_url: user?.avatar_url || null,
        is_online: user?.is_online || false,
        unreadCount: val.unread,
        lastMessage: val.lastMsg.text,
        lastMessageTime: val.lastMsg.created_at,
      });
    });

    setConversations(convUsers);
  }, [currentUserId, users]);

  useEffect(() => {
    if (users.length > 0) loadConversations();
  }, [users, currentUserId, loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!selectedPrivateUserId || !currentUserId) return;
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedPrivateUserId}),and(sender_id.eq.${selectedPrivateUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      const unreadIds = data.filter((m: any) => m.receiver_id === currentUserId && !m.is_read).map((m: any) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('private_messages').update({ is_read: true } as any).in('id', unreadIds);
        loadConversations();
      }
    }
  }, [selectedPrivateUserId, currentUserId, loadConversations]);

  useEffect(() => {
    loadMessages();
    if (!selectedPrivateUserId || !currentUserId) return;
    const channel = supabase
      .channel(`pm-${currentUserId}-${selectedPrivateUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, (payload) => {
        const newMsg = payload.new as any;
        const isRelevant =
          (newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedPrivateUserId) ||
          (newMsg.sender_id === selectedPrivateUserId && newMsg.receiver_id === currentUserId);
        if (!isRelevant) return;

        if (newMsg.sender_id === currentUserId) {
          // Replace optimistic
          setMessages(prev => prev.map(m =>
            m.id.startsWith('optimistic-') && m.text === newMsg.text
              ? { ...newMsg }
              : m
          ));
        } else {
          // Append incoming & mark as read
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          supabase.from('private_messages').update({ is_read: true } as any).eq('id', newMsg.id).then(() => {});
        }
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedPrivateUserId, currentUserId, loadMessages, loadConversations]);

  // Global notification channel
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel(`pm-notify-${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, () => {
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, loadConversations]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserId || !selectedPrivateUserId) return;
    const msg = text;
    setText('');

    // Optimistic update
    const optimisticMsg: PrivateMsg = {
      id: `optimistic-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: selectedPrivateUserId,
      text: msg,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    await supabase.from('private_messages').insert({ sender_id: currentUserId, receiver_id: selectedPrivateUserId, text: msg });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === currentUserId) return 'أنت';
    return users.find(x => x.user_id === senderId)?.username || 'مجهول';
  };

  const getSenderAvatar = (senderId: string) => {
    return users.find(x => x.user_id === senderId)?.avatar_url || null;
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const selectedUser = users.find(u => u.user_id === selectedPrivateUserId);
  const getInitial = (name: string) => name?.charAt(0) || '?';

  if (!selectedPrivateUserId) {
    return (
      <div className="flex flex-col h-full" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📩</span>
          <h2 className="font-bold text-base">الرسائل الخاصة</h2>
        </div>

        <select className="input-field mb-3" value="" onChange={(e) => setSelectedPrivateUserId(e.target.value)}>
          <option value="">محادثة جديدة...</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>{u.username}</option>
          ))}
        </select>

        {conversations.length > 0 ? (
          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {conversations.map((c) => (
              <div
                key={c.user_id}
                onClick={() => setSelectedPrivateUserId(c.user_id)}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border cursor-pointer hover:bg-secondary transition-all active:scale-[0.98]"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-sm font-bold">
                    {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(c.username)}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 online-dot ${c.is_online ? 'active' : 'inactive'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{c.username}</p>
                    {c.lastMessageTime && (
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatTime(c.lastMessageTime)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 flex-shrink-0">
                    {c.unreadCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-2">
            <span className="text-4xl">📩</span>
            <span className="text-sm">لا توجد محادثات بعد</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center gap-3 mb-2 bg-card/50 rounded-xl px-3 py-2 border border-border">
        <button onClick={() => setSelectedPrivateUserId('')} className="text-muted-foreground hover:text-foreground text-sm transition-colors">→</button>
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold overflow-hidden">
            {selectedUser?.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(selectedUser?.username || '')}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 online-dot ${selectedUser?.is_online ? 'active' : 'inactive'}`} />
        </div>
        <div>
          <span className="text-sm font-semibold">{selectedUser?.username || 'مجهول'}</span>
          <p className="text-[10px] text-muted-foreground">{selectedUser?.is_online ? 'متصل الآن' : 'غير متصل'}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/50 rounded-2xl border border-border mb-2">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12 opacity-60">لا توجد رسائل بعد...</p>
        )}
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          const senderAvatar = getSenderAvatar(m.sender_id);
          return (
            <div key={m.id} className={`message-bubble max-w-[80%] flex gap-2 ${isMine ? 'flex-row-reverse mr-0 ml-auto' : 'ml-0 mr-auto'}`}>
              {!isMine && (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1 overflow-hidden">
                  {senderAvatar ? <img src={senderAvatar} className="w-full h-full object-cover" alt="" /> : getInitial(getSenderName(m.sender_id))}
                </div>
              )}
              <div className={`px-3.5 py-2 text-sm ${isMine ? 'message-sent' : 'message-received'}`}>
                {!isMine && <span className="font-semibold text-xs opacity-70 block mb-0.5">{getSenderName(m.sender_id)}</span>}
                <span className="leading-relaxed">{m.text}</span>
                <div className={`text-[10px] opacity-40 mt-1 flex items-center gap-1 ${isMine ? 'justify-start' : 'justify-end'}`}>
                  {formatTime(m.created_at)}
                  {isMine && <span>{m.is_read ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input-group">
        <input
          className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
          placeholder="اكتب رسالتك..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
        />
        <button onClick={handleSend} disabled={!text.trim()} className="btn-primary px-4 py-2 disabled:opacity-30 disabled:shadow-none">
          إرسال
        </button>
      </div>
    </div>
  );
}
