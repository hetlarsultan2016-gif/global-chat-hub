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
  const [error, setError] = useState('');

  const toAsciiEmail = (name: string) => {
    const ascii = Array.from(name.toLowerCase().replace(/\s+/g, '_'))
      .map(c => c.charCodeAt(0) > 127 ? c.charCodeAt(0).toString(36) : c)
      .join('');
    return `${ascii}@chat.app`;
  };

  const handleLogin = async () => {
    if (!username || !password) { setError('أدخل اسم المستخدم وكلمة المرور'); return; }
    setLoading(true);
    setError('');
    try {
      const email = toAsciiEmail(username);
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError('اسم المستخدم أو كلمة المرور غير صحيحة'); return; }
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', data.user.id).single();
        setCurrentUser(data.user.id, profile?.username || username);
        setActivePage('public');
      }
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!username || !password || !gender || !age) { setError('أكمل جميع البيانات'); return; }
    if (password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true);
    setError('');
    try {
      const email = `${username.toLowerCase().replace(/\s+/g, '_')}@chat.app`;
      const genderValue = gender === 'ذكر' ? 'male' : 'female';
      const { data, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, age: parseInt(age), gender: genderValue } },
      });
      if (authError) {
        setError(authError.message.includes('already registered') ? 'اسم المستخدم مستخدم بالفعل' : 'حدث خطأ، حاول مرة أخرى');
        return;
      }
      if (data.user) {
        setCurrentUser(data.user.id, username);
        setActivePage('public');
      }
    } finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError('');
    try {
      const guestName = 'زائر_' + Math.random().toString(36).substring(2, 7);
      const email = `${guestName}@chat.app`;
      const guestPass = 'guest_' + Math.random().toString(36).substring(2, 12);
      const { data, error: authError } = await supabase.auth.signUp({
        email, password: guestPass,
        options: { data: { username: 'زائر', gender: null, age: null } },
      });
      if (authError) { setError('حدث خطأ، حاول مرة أخرى'); return; }
      if (data.user) { setCurrentUser(data.user.id, 'زائر'); setActivePage('public'); }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-sm" style={{ animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-secondary mx-auto flex items-center justify-center text-4xl mb-4 shadow-lg">
            🌍
          </div>
          <h1 className="text-2xl font-bold tracking-tight">الدردشة العالمية</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isRegister ? 'أنشئ حسابك وانضم إلينا' : 'سجل دخولك وابدأ الدردشة'}
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-4 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <input className="input-field" placeholder="اسم المستخدم" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="input-field" type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
          {isRegister && (
            <>
              <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">اختر النوع</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
              <input className="input-field" type="number" placeholder="العمر" value={age} onChange={(e) => setAge(e.target.value)} />
            </>
          )}
        </div>

        {isRegister ? (
          <div className="space-y-3">
            <button disabled={loading} onClick={handleRegister} className="w-full btn-primary">
              {loading ? 'جاري التحميل...' : 'إنشاء الحساب'}
            </button>
            <button onClick={() => { setIsRegister(false); setError(''); }} className="w-full btn-secondary">
              لديك حساب؟ سجل دخولك
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button disabled={loading} onClick={handleLogin} className="w-full btn-primary">
              {loading ? 'جاري التحميل...' : 'تسجيل الدخول'}
            </button>
            <button disabled={loading} onClick={handleGuest} className="w-full btn-secondary">
              الدخول كزائر
            </button>
            <p onClick={() => { setIsRegister(true); setError(''); }}
               className="text-center text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-sm pt-2">
              ليس لديك حساب؟ أنشئ حساباً جديداً
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
