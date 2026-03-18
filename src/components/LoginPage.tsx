import { useState } from 'react';
import { useChatStore } from '@/lib/chatStore';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const { setCurrentUser, setActivePage } = useChatStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return alert('أدخل اسم المستخدم وكلمة المرور');
    setLoading(true);
    try {
      const email = `${username.toLowerCase().replace(/\s+/g, '_')}@chat.app`;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert('خطأ في البيانات: ' + error.message);
        return;
      }
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', data.user.id)
          .single();
        setCurrentUser(data.user.id, profile?.username || username);
        setActivePage('public');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username || !password || !gender || !age) return alert('اكمل جميع البيانات');
    setLoading(true);
    try {
      const email = `${username.toLowerCase().replace(/\s+/g, '_')}@chat.app`;
      const genderValue = gender === 'ذكر' ? 'male' : 'female';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, age: parseInt(age), gender: genderValue },
        },
      });
      if (error) {
        if (error.message.includes('already registered')) {
          alert('اسم المستخدم موجود');
        } else {
          alert('خطأ: ' + error.message);
        }
        return;
      }
      if (data.user) {
        alert('تم إنشاء الحساب بنجاح');
        setCurrentUser(data.user.id, username);
        setActivePage('public');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    try {
      const guestName = 'زائر_' + Math.random().toString(36).substring(2, 7);
      const email = `${guestName}@chat.app`;
      const guestPass = 'guest_' + Math.random().toString(36).substring(2, 12);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: guestPass,
        options: { data: { username: 'زائر', gender: null, age: null } },
      });
      if (error) {
        alert('خطأ في الدخول كزائر');
        return;
      }
      if (data.user) {
        setCurrentUser(data.user.id, 'زائر');
        setActivePage('public');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">🌍</h1>
          <h2 className="text-xl font-bold">{isRegister ? 'إنشاء حساب' : 'مرحباً بك'}</h2>
          <p className="text-muted-foreground text-sm mt-1">الدردشة العالمية</p>
        </div>

        <div className="space-y-3">
          <input
            className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {isRegister && (
            <>
              <select
                className="chat-input-group w-full bg-card border-border text-foreground"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">النوع</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
              <input
                className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
                placeholder="العمر"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </>
          )}
        </div>

        {isRegister ? (
          <div className="space-y-3">
            <button disabled={loading} onClick={handleRegister} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50">
              {loading ? 'جاري التحميل...' : 'إنشاء الحساب'}
            </button>
            <button onClick={() => setIsRegister(false)} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
              لديك حساب؟ تسجيل الدخول
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button disabled={loading} onClick={handleLogin} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50">
              {loading ? 'جاري التحميل...' : 'دخول'}
            </button>
            <button disabled={loading} onClick={handleGuest} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50">
              الدخول كزائر
            </button>
            <p onClick={() => setIsRegister(true)} className="text-center text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-sm">
              إنشاء حساب جديد
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
