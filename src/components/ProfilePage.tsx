import { useState, useEffect } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

export default function ProfilePage() {
  const { currentUserId } = useChatStore();
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUserId)
        .single();
      if (data) {
        setProfile(data);
        setBio(data.bio || '');
        setAge(data.age?.toString() || '');
      }
    };
    fetchProfile();
  }, [currentUserId]);

  const handleSave = async () => {
    if (!currentUserId) return;
    setLoading(true);
    await supabase
      .from('profiles')
      .update({
        bio: bio || null,
        age: age ? parseInt(age) : null,
      })
      .eq('user_id', currentUserId);
    setLoading(false);
    alert('تم حفظ الملف الشخصي');
  };

  const genderLabel = (g: string | null) => {
    if (g === 'male') return 'ذكر';
    if (g === 'female') return 'أنثى';
    return 'غير محدد';
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden">
        {profile?.avatar_url && <img src={profile.avatar_url} className="w-full h-full object-cover" alt="صورة" />}
      </div>

      <div className="w-full max-w-sm space-y-3">
        <input
          className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
          placeholder="نبذة عنك"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <input
          className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
          placeholder="العمر"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <button disabled={loading} onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50">
          {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>

      {profile && (
        <div className="text-muted-foreground text-sm text-center space-y-1 mt-4">
          <p>الاسم: {profile.username}</p>
          <p>النوع: {genderLabel(profile.gender)}</p>
          <p>العمر: {profile.age || 'غير محدد'}</p>
          <p>المستوى: {profile.level}</p>
        </div>
      )}
    </div>
  );
}
