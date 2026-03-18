import { useState } from 'react';
import ChatBox from './ChatBox';

const COUNTRIES = ['اليمن', 'السعودية', 'الإمارات', 'قطر', 'الكويت', 'البحرين', 'عمان', 'مصر', 'العراق', 'الأردن'];

export default function CountriesPage() {
  const [selected, setSelected] = useState('');

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <button onClick={() => setSelected('')} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl text-sm font-semibold mb-3 self-start transition-all active:scale-95">
          ← رجوع
        </button>
        <p className="text-sm text-muted-foreground mb-2">🌎 دردشة {selected}</p>
        <ChatBox chatId={`country_${selected}`} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {COUNTRIES.map((c) => (
        <button
          key={c}
          onClick={() => setSelected(c)}
          className="bg-card border border-border text-foreground p-4 rounded-xl font-semibold text-sm hover:bg-secondary transition-all active:scale-95"
        >
          🌎 {c}
        </button>
      ))}
    </div>
  );
}
