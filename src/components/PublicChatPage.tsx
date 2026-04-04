import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';
import ChatBox from './ChatBox';

export default function PublicChatPage() {
  const { currentUsername } = useChatStore();
  const [publicRoomId, setPublicRoomId] = useState<string | null>(null);
  const welcomeShown = useRef(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase.from('rooms').select('id').eq('name', 'الغرفة العامة').single();
      if (data) setPublicRoomId(data.id);
    };
    fetchRoom();
  }, []);

  useEffect(() => {
    if (publicRoomId && !welcomeShown.current) {
      welcomeShown.current = true;
      setShowWelcome(true);
      setTimeout(() => setShowWelcome(false), 5000);
    }
  }, [publicRoomId]);

  if (!publicRoomId) return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full">
      {showWelcome && (
        <div className="mb-3 bg-card/50 rounded-xl px-4 py-3 border border-border transition-opacity" style={{ animation: 'slideUp 0.3s ease' }}>
          <p className="font-bold text-sm">مرحباً <span className="text-primary">{currentUsername}</span> 👋</p>
          <p className="text-destructive/70 text-[11px] mt-1">"ما يلفظ من قول إلا لديه رقيب عتيد"</p>
        </div>
      )}
      <ChatBox roomId={publicRoomId} />
    </div>
  );
}
