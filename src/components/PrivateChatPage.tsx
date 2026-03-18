import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

interface PrivateMsg {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  sender_profile?: { username: string } | null;
}

export default function PrivateChatPage() {
  const { currentUserId, selectedPrivateUserId, setSelectedPrivateUserId } = useChatStore();
  const [users, setUsers] = useState<{ user_id: string; username: string }[]>([]);
  const [messages, setMessages] = useState<PrivateMsg[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username')
        .neq('user_id', currentUserId || '');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, [currentUserId]);

  const loadMessages = async () => {
    if (!selectedPrivateUserId || !currentUserId) return;
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedPrivateUserId}),and(sender_id.eq.${selectedPrivateUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    loadMessages();
    if (!selectedPrivateUserId) return;

    const channel = supabase
      .channel(`pm-${currentUserId}-${selectedPrivateUserId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedPrivateUserId, currentUserId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserId || !selectedPrivateUserId) return;
    const msg = text;
    setText('');
    await supabase.from('private_messages').insert({
      sender_id: currentUserId,
      receiver_id: selectedPrivateUserId,
      text: msg,
    });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === currentUserId) return 'أنت';
    const u = users.find(x => x.user_id === senderId);
    return u?.username || 'مجهول';
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <select
        className="chat-input-group w-full bg-card border-border text-foreground mb-3"
        value={selectedPrivateUserId}
        onChange={(e) => setSelectedPrivateUserId(e.target.value)}
      >
        <option value="">اختر العضو</option>
        {users.map((u) => (
          <option key={u.user_id} value={u.user_id}>{u.username}</option>
        ))}
      </select>

      {selectedPrivateUserId ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 border border-border rounded-2xl bg-background mb-3">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد...</p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`message-bubble max-w-[85%] px-4 py-2.5 text-sm ${
                  m.sender_id === currentUserId ? 'message-sent self-end ml-auto' : 'message-received self-start mr-auto'
                }`}
              >
                <span className="font-semibold text-xs opacity-80 block mb-1">{getSenderName(m.sender_id)}</span>
                <span>{m.text}</span>
                <div className="text-[10px] opacity-50 mt-1 text-left">{formatTime(m.created_at)}</div>
              </div>
            ))}
          </div>

          <div className="chat-input-group">
            <input
              className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
              placeholder="اكتب رسالتك هنا..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            />
            <button onClick={handleSend} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95">
              إرسال
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          اختر عضواً لبدء المحادثة
        </div>
      )}
    </div>
  );
}
