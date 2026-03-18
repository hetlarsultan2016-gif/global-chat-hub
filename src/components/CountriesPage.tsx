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
      const { data } = await supabase
        .from('rooms')
        .select('*')
        .order('is_pinned', { ascending: false });
      if (data) setRooms(data);
    };
    fetchRooms();
  }, []);

  if (selectedRoom) {
    return (
      <div className="flex flex-col h-full">
        <button onClick={() => setSelectedRoom(null)} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold mb-3 self-start transition-all active:scale-95">
          ← رجوع
        </button>
        <p className="text-sm text-muted-foreground mb-2">{selectedRoom.image} {selectedRoom.name}</p>
        <ChatBox roomId={selectedRoom.id} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => setSelectedRoom(room)}
          className="bg-card border border-border text-foreground p-4 rounded-xl font-semibold text-sm hover:bg-secondary transition-all active:scale-95 text-right"
        >
          <span className="text-lg block mb-1">{room.image}</span>
          <span className="block">{room.name}</span>
          {room.description && (
            <span className="text-xs text-muted-foreground block mt-1 font-normal">{room.description}</span>
          )}
        </button>
      ))}
    </div>
  );
}
