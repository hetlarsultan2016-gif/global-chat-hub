import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

interface PrivateMsg {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
}

export default function PrivateChatPage() {
  const { currentUserId, selectedPrivateUserId, setSelectedPrivateUserId } = useChatStore();
  const [users, setUsers] = useState<{ user_id: string; username: string }[]>([]);
  const [messages, setMessages] = useState<PrivateMsg[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('profiles').select('user_id, username').neq('user_id', currentUserId || '');
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages' }, () => loadMessages())
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
    await supabase.from('private_messages').insert({ sender_id: currentUserId, receiver_id: selectedPrivateUserId, text: msg });
  };

  const getSenderName = (senderId: string) => {
    if (senderId === currentUserId) return 'أنت';
    return users.find(x => x.user_id === senderId)?.username || 'مجهول';
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const selectedUsername = users.find(u => u.user_id === selectedPrivateUserId)?.username;

  return (
    <div className="flex flex-col h-full" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📩</span>
        <h2 className="font-bold text-base">الرسائل الخاصة</h2>
      </div>

      <select
        className="input-field mb-3"
        value={selectedPrivateUserId}
        onChange={(e) => setSelectedPrivateUserId(e.target.value)}
      >
        <option value="">اختر العضو للمحادثة</option>
        {users.map((u) => (
          <option key={u.user_id} value={u.user_id}>{u.username}</option>
        ))}
      </select>

      {selectedPrivateUserId ? (
        <div className="flex flex-col flex-1 min-h-0">
          {selectedUsername && (
            <div className="bg-card/50 rounded-xl px-3 py-2 mb-2 border border-border flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                {selectedUsername.charAt(0)}
              </div>
              <span className="text-sm font-semibold">{selectedUsername}</span>
            </div>
          )}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/50 rounded-2xl border border-border mb-2">
            {messages.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-12 opacity-60">لا توجد رسائل بعد...</p>
            )}
            {messages.map((m) => {
              const isMine = m.sender_id === currentUserId;
              return (
                <div key={m.id} className={`message-bubble max-w-[80%] ${isMine ? 'mr-0 ml-auto' : 'ml-0 mr-auto'}`}>
                  <div className={`px-3.5 py-2 text-sm ${isMine ? 'message-sent' : 'message-received'}`}>
                    {!isMine && <span className="font-semibold text-xs opacity-70 block mb-0.5">{getSenderName(m.sender_id)}</span>}
                    <span className="leading-relaxed">{m.text}</span>
                    <div className={`text-[10px] opacity-40 mt-1 ${isMine ? 'text-left' : 'text-right'}`}>{formatTime(m.created_at)}</div>
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
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 gap-2">
          <span className="text-4xl">📩</span>
          <span className="text-sm">اختر عضواً لبدء المحادثة</span>
        </div>
      )}
    </div>
  );
}
