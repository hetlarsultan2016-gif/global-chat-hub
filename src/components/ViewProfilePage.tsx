import { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

export default function ViewProfilePage() {
  const { viewProfileUserId, currentUserId, setActivePage, setSelectedPrivateUserId } = useChatStore();
  const [profile, setProfile] = useState<any>(null);
  const [hasLiked, setHasLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (!viewProfileUserId) return;
    supabase.from('profiles').select('*').eq('user_id', viewProfileUserId).single().then(({ data }) => {
      if (data) setProfile(data);
    });
    // Check if already liked
    if (currentUserId && viewProfileUserId) {
      supabase.from('profile_likes' as any).select('id').eq('liker_id', currentUserId).eq('liked_id', viewProfileUserId).then(({ data }) => {
        setHasLiked(!!(data && (data as any[]).length > 0));
      });
    }
  }, [viewProfileUserId, currentUserId]);

  if (!profile) return <div className="flex items-center justify-center py-12 text-muted-foreground">جاري التحميل...</div>;

  const genderLabel = (g: string | null) => {
    if (g === 'male') return 'ذكر';
    if (g === 'female') return 'أنثى';
    return 'غير محدد';
  };

  const getInitial = (name: string) => name?.charAt(0) || '?';

  const handleMessage = () => {
    setSelectedPrivateUserId(viewProfileUserId!);
    setActivePage('private');
  };

  const handleLike = async () => {
    if (!currentUserId || !viewProfileUserId || liking) return;
    setLiking(true);
    if (hasLiked) {
      await supabase.from('profile_likes' as any).delete().eq('liker_id', currentUserId).eq('liked_id', viewProfileUserId);
      setHasLiked(false);
      setProfile((prev: any) => prev ? { ...prev, likes_count: Math.max(0, (prev.likes_count || 0) - 1) } : prev);
    } else {
      await supabase.from('profile_likes' as any).insert({ liker_id: currentUserId, liked_id: viewProfileUserId } as any);
      setHasLiked(true);
      setProfile((prev: any) => prev ? { ...prev, likes_count: (prev.likes_count || 0) + 1 } : prev);
    }
    setLiking(false);
  };

  return (
    <div className="flex flex-col items-center gap-5 py-4" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <button onClick={() => setActivePage('public')} className="self-start text-xs text-muted-foreground hover:text-foreground transition-colors">
        → رجوع
      </button>

      <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-3xl font-bold shadow-lg">
        {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitial(profile.username)}
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-bold text-lg" style={{ color: profile.name_color || undefined }}>{profile.username}</h3>
        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <span>{genderLabel(profile.gender)}</span>
          <span>·</span>
          <span>{profile.age ? `${profile.age} سنة` : 'غير محدد'}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className={`online-dot ${profile.is_online ? 'active' : 'inactive'}`} />
            {profile.is_online ? 'متصل' : 'غير متصل'}
          </span>
        </div>
        {profile.country && <p className="text-sm text-muted-foreground">🌍 {profile.country}</p>}
        {profile.bio && <p className="text-primary text-sm bg-primary/10 px-4 py-2 rounded-xl">{profile.bio}</p>}
        <div className="flex items-center justify-center gap-2">
          <div className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-lg">المستوى {profile.level}</div>
          <div className="bg-destructive/10 text-destructive text-xs px-3 py-1 rounded-lg">❤️ {profile.likes_count || 0}</div>
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={handleMessage} className="btn-primary flex-1 px-4">📩 مراسلة</button>
        <button
          onClick={handleLike}
          disabled={liking}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${hasLiked ? 'bg-destructive text-destructive-foreground' : 'bg-destructive/10 text-destructive hover:bg-destructive/20'}`}
        >
          {hasLiked ? '💔 إلغاء' : '❤️ إعجاب'}
        </button>
      </div>
    </div>
  );
}
