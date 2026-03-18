import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useChatStore } from '@/lib/chatStore';

interface ChatBoxProps {
  roomId: string;
  showEmoji?: boolean;
}

interface MessageWithProfile {
  id: string;
  text: string;
  created_at: string;
  user_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

const EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '❤️', '🔥', '😎', '🤗', '💪'];

export default function ChatBox({ roomId, showEmoji = true }: ChatBoxProps) {
  const { currentUserId } = useChatStore();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, text, created_at, user_id, profiles(username, avatar_url)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data as unknown as MessageWithProfile[]);
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`room-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !currentUserId) return;
    const msg = text;
    setText('');
    await supabase.from('messages').insert({
      room_id: roomId,
      user_id: currentUserId,
      text: msg,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 border border-border rounded-2xl bg-background mb-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد...</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`message-bubble max-w-[85%] px-4 py-2.5 text-sm ${
              m.user_id === currentUserId ? 'message-sent self-end ml-auto' : 'message-received self-start mr-auto'
            }`}
          >
            <span className="font-semibold text-xs opacity-80 block mb-1">
              {m.profiles?.username || 'مجهول'}
            </span>
            <span>{m.text}</span>
            <div className="text-[10px] opacity-50 mt-1 text-left">{formatTime(m.created_at)}</div>
          </div>
        ))}
      </div>

      {showEmojis && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {EMOJIS.map((e) => (
            <button key={e} onClick={() => setText(text + e)} className="text-lg bg-transparent hover:bg-secondary rounded-lg p-1 transition-all">
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-group">
        <input
          className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder:text-muted-foreground"
          placeholder="اكتب رسالتك هنا..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {showEmoji && (
          <button onClick={() => setShowEmojis(!showEmojis)} className="bg-transparent text-muted-foreground hover:text-foreground p-1 text-lg">
            😊
          </button>
        )}
        <button onClick={handleSend} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95">
          إرسال
        </button>
      </div>
    </div>
  );
}
