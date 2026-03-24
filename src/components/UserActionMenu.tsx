import { useState } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

interface UserActionMenuProps {
  userId: string;
  username: string;
  avatarUrl: string | null;
  position?: { x: number; y: number };
  onClose: () => void;
}

export default function UserActionMenu({ userId, username, avatarUrl, onClose }: UserActionMenuProps) {
  const { currentUserId, setSelectedPrivateUserId, setActivePage, setViewProfileUserId } = useChatStore();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleProfile = () => {
    setViewProfileUserId(userId);
    setActivePage('viewProfile');
    onClose();
  };

  const handlePrivateMsg = () => {
    setSelectedPrivateUserId(userId);
    setActivePage('private');
    onClose();
  };

  const handleAddFriend = async () => {
    if (!currentUserId || adding) return;
    setAdding(true);
    try {
      await supabase.from('friends' as any).insert({ user_id: currentUserId, friend_id: userId } as any);
      setAdded(true);
    } catch {
      // already friends or error
    }
    setAdding(false);
  };

  const getInitial = (name: string) => name?.charAt(0) || '?';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-card p-4 rounded-2xl border border-border w-[85%] max-w-[280px] space-y-2"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <div className="flex items-center gap-3 pb-2 border-b border-border">
          <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-lg font-bold flex-shrink-0">
            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="" /> : getInitial(username)}
          </div>
          <span className="font-bold text-sm">{username}</span>
        </div>

        <button onClick={handleProfile} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm">
          <span>👤</span>
          <span>الملف الشخصي</span>
        </button>

        <button onClick={handlePrivateMsg} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm">
          <span>📩</span>
          <span>رسالة خاصة</span>
        </button>

        <button
          onClick={handleAddFriend}
          disabled={adding || added}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-sm disabled:opacity-50"
        >
          <span>{added ? '✅' : '➕'}</span>
          <span>{added ? 'تم الإرسال' : adding ? 'جاري...' : 'إضافة صديق'}</span>
        </button>

        <button onClick={onClose} className="w-full text-center text-xs text-muted-foreground py-1.5 hover:text-foreground transition-colors">
          إغلاق
        </button>
      </div>
    </div>
  );
}
