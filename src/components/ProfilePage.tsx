import { useState } from 'react';
import { useChatStore, getUsers, saveUsers } from '@/lib/chatStore';

export default function ProfilePage() {
  const { currentUser } = useChatStore();
  const users = getUsers();
  const user = users.find((u) => u.name === currentUser);

  const [status, setStatus] = useState(user?.status || '');
  const [age, setAge] = useState(user?.age || '');
  const [profilePic, setProfilePic] = useState(user?.profile || '');

  const handleSave = () => {
    const allUsers = getUsers();
    const u = allUsers.find((x) => x.name === currentUser);
    if (!u) return;
    u.status = status || u.status;
    u.age = age || u.age;
    u.profile = profilePic || u.profile;
    saveUsers(allUsers);
    alert('تم حفظ الملف الشخصي');
  };

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePic(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden">
        {profilePic && <img src={profilePic} className="w-full h-full object-cover" alt="صورة" />}
      </div>
      <label className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all active:scale-95">
        تغيير الصورة
        <input type="file" accept="image/*" onChange={handlePicChange} className="hidden" />
      </label>

      <div className="w-full max-w-sm space-y-3">
        <input
          className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
          placeholder="الحالة الشخصية"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <input
          className="chat-input-group w-full bg-card border-border text-foreground placeholder:text-muted-foreground"
          placeholder="العمر"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold transition-all active:scale-95">
          حفظ التغييرات
        </button>
      </div>

      {user && (
        <div className="text-muted-foreground text-sm text-center space-y-1 mt-4">
          <p>الاسم: {user.name}</p>
          <p>النوع: {user.gender}</p>
          <p>العمر: {user.age}</p>
        </div>
      )}
    </div>
  );
}
