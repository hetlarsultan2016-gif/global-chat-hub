import { useEffect, useRef, useState } from 'react';
import { getMessages, sendTextMessage, sendMediaMessage, ChatMessage, useChatStore } from '@/lib/chatStore';

interface ChatBoxProps {
  chatId: string;
  showEmoji?: boolean;
  showMedia?: boolean;
}

const EMOJIS = ['😀', '😂', '😍', '👍', '🎉', '❤️', '🔥', '😎', '🤗', '💪'];

export default function ChatBox({ chatId, showEmoji = true, showMedia = true }: ChatBoxProps) {
  const { currentUser } = useChatStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => setMessages(getMessages(chatId));
    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !currentUser) return;
    sendTextMessage(chatId, currentUser, text);
    setText('');
    setMessages(getMessages(chatId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleFile = (type: 'image' | 'audio') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : 'audio/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !currentUser) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        sendMediaMessage(chatId, currentUser, type, e.target?.result as string);
        setMessages(getMessages(chatId));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 border border-border rounded-2xl bg-background mb-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد...</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`message-bubble max-w-[85%] px-4 py-2.5 text-sm ${
              m.user === currentUser ? 'message-sent self-end ml-auto' : 'message-received self-start mr-auto'
            }`}
          >
            <span className="font-semibold text-xs opacity-80 block mb-1">{m.user}</span>
            {m.type === 'text' && <span>{m.msg}</span>}
            {m.type === 'image' && <img src={m.data} className="max-w-[200px] rounded-lg mt-1" alt="صورة" />}
            {m.type === 'audio' && <audio controls src={m.data} className="mt-1 max-w-[200px]" />}
            <div className="text-[10px] opacity-50 mt-1 text-left">{m.time}</div>
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
        {showMedia && (
          <>
            <button onClick={() => handleFile('image')} className="bg-transparent text-muted-foreground hover:text-foreground p-1 text-lg">
              📷
            </button>
            <button onClick={() => handleFile('audio')} className="bg-transparent text-muted-foreground hover:text-foreground p-1 text-lg">
              🎤
            </button>
          </>
        )}
        <button onClick={handleSend} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95">
          إرسال
        </button>
      </div>
    </div>
  );
}
