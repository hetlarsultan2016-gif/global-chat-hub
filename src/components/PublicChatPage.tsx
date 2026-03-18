import { useChatStore } from '@/lib/chatStore';
import ChatBox from './ChatBox';

export default function PublicChatPage() {
  const { currentUser } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <p className="text-primary font-bold text-sm">مرحباً {currentUser}!</p>
        <p className="text-destructive text-xs">"ما يلفظ من قول إلا لديه رقيب عتيد"</p>
      </div>
      <ChatBox chatId="publicChat" />
    </div>
  );
}
