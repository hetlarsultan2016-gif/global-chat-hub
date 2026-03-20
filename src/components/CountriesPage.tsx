import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ChatBox from './ChatBox';

interface Room {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
}

export default function CountriesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*').order('is_pinned', { ascending: false });
      if (data) setRooms(data);
    };
    fetchRooms();
  }, []);

  if (selectedRoom) {
    return (
      <div className="flex flex-col h-full" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <button
          onClick={() => setSelectedRoom(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 self-start px-2 py-1 rounded-lg hover:bg-secondary"
        >
          <span>→</span>
          <span>رجوع</span>
        </button>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="text-xl">{selectedRoom.image}</span>
          <p className="font-bold text-sm">{selectedRoom.name}</p>
        </div>
        <ChatBox roomId={selectedRoom.id} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌎</span>
        <h2 className="font-bold text-base">غرف الدول</h2>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {rooms.map((room) => (
          <button key={room.id} onClick={() => setSelectedRoom(room)} className="card-room text-right">
            <span className="text-2xl block mb-2">{room.image}</span>
            <span className="font-bold text-sm block">{room.name}</span>
            {room.description && (
              <span className="text-[11px] text-muted-foreground block mt-1 line-clamp-2 leading-relaxed">{room.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
