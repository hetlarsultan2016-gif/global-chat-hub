import { useState } from 'react';
import { useChatStore, getUsers, saveUsers, User } from '@/lib/chatStore';

export default function LoginPage() {
  const { setCurrentUser, setActivePage } = useChatStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');

  const handleLogin = () => {
    if (!username) return alert('أدخل اسم المستخدم');
    const users = getUsers();
    const user = users.find((u) => u.name === username && u.pass === password);
    if (!user) return alert('خطأ في البيانات');
    localStorage.setItem('user', username);
    setCurrentUser(username);
    setActivePage('public');
  };

  const handleRegister = () => {
    if (!username || !password || !gender || !age) return alert('اكمل جميع البيانات');
    const users = getUsers();
    if (users.some((u) => u.name === username)) return alert('اسم المستخدم موجود');
    const newUser: User = {
      name: username, pass: password, gender, age,
      profile: '', color: 'white', font: '13px Arial', status: 'متصل',
    };
    saveUsers([...users, newUser]);
    alert('تم إنشاء الحساب');
    setIsRegister(false);
  };

  const handleGuest = () => {
    localStorage.setItem('user', 'زائر');
    setCurrentUser('زائر');
    setActivePage('public');
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
            <button onClick={handleRegister} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
              إنشاء الحساب
            </button>
            <button onClick={() => setIsRegister(false)} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
              لديك حساب؟ تسجيل الدخول
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button onClick={handleLogin} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
              دخول
            </button>
            <button onClick={handleGuest} className="w-full bg-secondary text-secondary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
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
