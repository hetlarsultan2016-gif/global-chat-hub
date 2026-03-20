import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ChatBox from './ChatBox';

export default function DatingChatPage() {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      const { data } = await supabase.from('rooms').select('id').eq('name', 'الغرفة العامة').single();
      if (data) setRoomId(data.id);
    };
    fetchRoom();
  }, []);

  if (!roomId) return <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3 bg-card/50 rounded-xl px-4 py-3 border border-border flex items-center gap-2">
        <span className="text-lg">❤️</span>
        <p className="font-bold text-sm">غرفة التعارف</p>
      </div>
      <ChatBox roomId={roomId} />
    </div>
  );
}
