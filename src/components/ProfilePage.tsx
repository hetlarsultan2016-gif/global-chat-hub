import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';
import { isSoundEnabled, setSoundEnabled } from '@/lib/notificationSound';

export default function ProfilePage() {
  const { currentUserId } = useChatStore();
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) return;
      const { data } = await supabase.from('profiles').select('*').eq('user_id', currentUserId).single();
      if (data) { setProfile(data); setBio(data.bio || ''); setAge(data.age?.toString() || ''); }
    };
    fetchProfile();
  }, [currentUserId]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;
    
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${currentUserId}/avatar.${ext}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now();
      
      // Update profile
      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', currentUserId);
      setProfile((prev: any) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setLoading(true);
    await supabase.from('profiles').update({ bio: bio || null, age: age ? parseInt(age) : null }).eq('user_id', currentUserId);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const genderLabel = (g: string | null) => {
    if (g === 'male') return 'ذكر';
    if (g === 'female') return 'أنثى';
    return 'غير محدد';
  };

  const getInitial = (name: string) => name?.charAt(0) || '?';

  return (
    <div className="flex flex-col items-center gap-5 py-4" style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-3xl font-bold shadow-lg">
          {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="صورة" /> : getInitial(profile?.username || '')}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm shadow-lg hover:opacity-90 transition-opacity"
        >
          {uploading ? '⏳' : '📷'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </div>

      {profile && (
        <div className="text-center">
          <h3 className="font-bold text-lg">{profile.username}</h3>
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground mt-1">
            <span>{genderLabel(profile.gender)}</span>
            <span>·</span>
            <span>{profile.age ? `${profile.age} سنة` : 'العمر غير محدد'}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <span className="online-dot active" />
              متصل
            </span>
          </div>
          <div className="mt-2 bg-primary/10 text-primary text-xs px-3 py-1 rounded-lg inline-block">
            المستوى {profile.level}
          </div>
        </div>
      )}

      <div className="w-full max-w-sm space-y-3 mt-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">نبذة عنك</label>
          <input className="input-field" placeholder="اكتب نبذة قصيرة..." value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">العمر</label>
          <input className="input-field" type="number" placeholder="العمر" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <button disabled={loading} onClick={handleSave} className="w-full btn-primary">
          {loading ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
