import { useState, useEffect } from 'react';
import { useChatStore, getUsers } from '@/lib/chatStore';
import ChatBox from './ChatBox';

export default function PrivateChatPage() {
  const { currentUser, selectedPrivateUser, setSelectedPrivateUser } = useChatStore();
  const [users, setUsers] = useState(getUsers());

  useEffect(() => {
    const interval = setInterval(() => setUsers(getUsers()), 2000);
    return () => clearInterval(interval);
  }, []);

  const otherUsers = users.filter((u) => u.name !== currentUser);
  const chatId = selectedPrivateUser ? `privateChat_${selectedPrivateUser}` : '';

  return (
    <div className="flex flex-col h-full">
      <select
        className="chat-input-group w-full bg-card border-border text-foreground mb-3"
        value={selectedPrivateUser}
        onChange={(e) => setSelectedPrivateUser(e.target.value)}
      >
        <option value="">اختر العضو</option>
        {otherUsers.map((u) => (
          <option key={u.name} value={u.name}>{u.name}</option>
        ))}
      </select>
      {chatId ? <ChatBox chatId={chatId} /> : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          اختر عضواً لبدء المحادثة
        </div>
      )}
    </div>
  );
}
