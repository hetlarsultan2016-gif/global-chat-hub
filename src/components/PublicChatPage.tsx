import { useEffect, useState } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';
import ChatBox from './ChatBox';

export default function PublicChatPage() {
  const { currentUsername } = useChatStore();
  const [publicRoomId, setPublicRoomId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', 'الغرفة العامة')
        .single();
      if (data) setPublicRoomId(data.id);
    };
    fetchRoom();
  }, []);

  if (!publicRoomId) return <div className="text-center text-muted-foreground py-8">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <p className="text-primary font-bold text-sm">مرحباً {currentUsername}!</p>
        <p className="text-destructive text-xs">"ما يلفظ من قول إلا لديه رقيب عتيد"</p>
      </div>
      <ChatBox roomId={publicRoomId} />
    </div>
  );
}
