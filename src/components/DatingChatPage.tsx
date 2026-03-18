import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ChatBox from './ChatBox';

export default function DatingChatPage() {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      // Use the first non-pinned room or create a dating concept
      // For dating, we'll reuse the public room concept with a dedicated room
      const { data } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', 'الغرفة العامة')
        .single();
      if (data) setRoomId(data.id);
    };
    fetchRoom();
  }, []);

  if (!roomId) return <div className="text-center text-muted-foreground py-8">جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <p className="text-sm text-muted-foreground">❤️ غرفة التعارف</p>
      </div>
      <ChatBox roomId={roomId} />
    </div>
  );
}
