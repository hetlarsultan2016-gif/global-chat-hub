import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ChatBox from './ChatBox';
import OnlineUsers from './OnlineUsers';

interface Room {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  is_pinned: boolean;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('name');
      if (data) setRooms(data);
    };
    fetchRooms();
  }, []);

  if (selectedRoom) {
    if (showMembers) {
      return (
        <div className="flex flex-col h-full" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <button
            onClick={() => setShowMembers(false)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 self-start px-2 py-1 rounded-lg hover:bg-secondary"
          >
            <span>→</span>
            <span>رجوع للمحادثة</span>
          </button>
          <OnlineUsers roomId={selectedRoom.id} />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setSelectedRoom(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
          >
            <span>→</span>
            <span>رجوع</span>
          </button>
          <button
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
          >
            <span>👥</span>
            <span>الأعضاء</span>
          </button>
        </div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xl">{selectedRoom.image}</span>
          <div>
            <p className="font-bold text-sm">{selectedRoom.name}</p>
            {selectedRoom.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{selectedRoom.description}</p>
            )}
          </div>
        </div>
        <ChatBox roomId={selectedRoom.id} />
      </div>
    );
  }

  return (
    <div className="space-y-3" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">🏠</span>
        <h2 className="font-bold text-base">غرف الدردشة</h2>
        <span className="text-xs text-muted-foreground mr-auto">{rooms.length} غرفة</span>
      </div>

      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => setSelectedRoom(room)}
          className="card-room w-full text-right flex items-start gap-3"
        >
          <span className="text-2xl mt-0.5 flex-shrink-0">{room.image}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">{room.name}</span>
              {room.is_pinned && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">مثبت</span>}
            </div>
            {room.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{room.description}</p>
            )}
          </div>
          <span className="text-muted-foreground text-xs mt-1">←</span>
        </button>
      ))}
    </div>
  );
}
