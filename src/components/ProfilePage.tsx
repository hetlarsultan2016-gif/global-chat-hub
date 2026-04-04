import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';
import { isSoundEnabled, setSoundEnabled } from '@/lib/notificationSound';

const NAME_COLORS = [
  { label: 'افتراضي', value: '' },
  { label: 'أحمر', value: 'hsl(0, 80%, 50%)' },
  { label: 'أزرق', value: 'hsl(220, 80%, 50%)' },
  { label: 'أخضر', value: 'hsl(140, 70%, 40%)' },
  { label: 'بنفسجي', value: 'hsl(270, 70%, 50%)' },
  { label: 'ذهبي', value: 'hsl(45, 90%, 45%)' },
  { label: 'وردي', value: 'hsl(330, 80%, 55%)' },
  { label: 'برتقالي', value: 'hsl(25, 90%, 50%)' },
];

const FONT_STYLES = [
  { label: 'عادي', value: 'normal' },
  { label: 'مائل', value: 'italic' },
  { label: 'عريض', value: 'bold' },
  { label: 'عريض مائل', value: 'bold-italic' },
];

export default function ProfilePage() {
  const { currentUserId } = useChatStore();
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [nameColor, setNameColor] = useState('');
  const [fontColor, setFontColor] = useState('');
  const [fontStyle, setFontStyle] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUserId) return;
      const { data } = await supabase.from('profiles').select('*').eq('user_id', currentUserId).single();
      if (data) {
        setProfile(data);
        setBio(data.bio || '');
        setAge(data.age?.toString() || '');
        setNameColor((data as any).name_color || '');
        setFontColor((data as any).font_color || '');
        setFontStyle((data as any).font_style || 'normal');
      }
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
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = urlData.publicUrl + '?t=' + Date.now();
      await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', currentUserId);
      setProfile((prev: any) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
    } catch (err) {
      console.error('Upload error:', err);
    }
    setUploading(false);
  };

  const handleDeleteAvatar = async () => {
    if (!currentUserId) return;
    setUploading(true);
    try {
      await supabase.from('profiles').update({ avatar_url: null }).eq('user_id', currentUserId);
      setProfile((prev: any) => prev ? { ...prev, avatar_url: null } : prev);
    } catch (err) {
      console.error('Delete avatar error:', err);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!currentUserId) return;
    setLoading(true);
    await supabase.from('profiles').update({
      bio: bio || null,
      age: age ? parseInt(age) : null,
      name_color: nameColor || null,
      font_color: fontColor || null,
      font_style: fontStyle,
    } as any).eq('user_id', currentUserId);
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
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            {uploading ? '⏳' : '📷'}
          </button>
          {profile?.avatar_url && (
            <button
              onClick={handleDeleteAvatar}
              disabled={uploading}
              className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-sm shadow-lg hover:opacity-90 transition-opacity"
            >
              🗑️
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      </div>

      {profile && (
        <div className="text-center">
          <h3 className="font-bold text-lg" style={{ color: nameColor || undefined }}>{profile.username}</h3>
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
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-lg">
              المستوى {profile.level}
            </div>
            <div className="bg-destructive/10 text-destructive text-xs px-3 py-1 rounded-lg">
              ❤️ {(profile as any).likes_count || 0} إعجاب
            </div>
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

        {/* Name Color */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">🎨 لون الاسم</label>
          <div className="flex gap-2 flex-wrap">
            {NAME_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setNameColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${nameColor === c.value ? 'border-primary scale-110' : 'border-border'}`}
                style={{ backgroundColor: c.value || 'hsl(var(--foreground))' }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Font Color */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">✏️ لون خط الرسائل</label>
          <div className="flex gap-2 flex-wrap">
            {NAME_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setFontColor(c.value)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${fontColor === c.value ? 'border-primary scale-110' : 'border-border'}`}
                style={{ backgroundColor: c.value || 'hsl(var(--foreground))' }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Font Style */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">🔤 شكل الخط</label>
          <div className="flex gap-2 flex-wrap">
            {FONT_STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setFontStyle(s.value)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${fontStyle === s.value ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground'}`}
                style={{
                  fontStyle: s.value.includes('italic') ? 'italic' : 'normal',
                  fontWeight: s.value.includes('bold') ? 'bold' : 'normal',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
          <span className="text-sm font-medium">🔔 الإشعارات الصوتية</span>
          <button
            onClick={() => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); }}
            className={`w-11 h-6 rounded-full relative transition-colors ${soundOn ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-all ${soundOn ? 'right-0.5' : 'right-auto left-0.5'}`} />
          </button>
        </div>

        {/* Preview */}
        <div className="bg-secondary/30 rounded-xl px-4 py-3 space-y-1">
          <label className="text-xs text-muted-foreground block">👁️ معاينة شكل رسالتك</label>
          <div className="bg-card rounded-xl px-3 py-2">
            <span className="text-xs font-semibold block mb-0.5" style={{ color: nameColor || undefined }}>{profile?.username || 'اسمك'}</span>
            <span
              className="text-sm"
              style={{
                color: fontColor || undefined,
                fontStyle: fontStyle.includes('italic') ? 'italic' : 'normal',
                fontWeight: fontStyle.includes('bold') ? 'bold' : 'normal',
              }}
            >
              هذا مثال على رسالتك 💬
            </span>
          </div>
        </div>

        <button disabled={loading} onClick={handleSave} className="w-full btn-primary">
          {loading ? 'جاري الحفظ...' : saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
}
