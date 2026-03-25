// Banned words list for content moderation
const BANNED_WORDS = [
  'سكس', 'نيك', 'زب', 'كس', 'شرموط', 'عاهر', 'قحب', 'متناك', 'زاني',
  'porn', 'sex', 'nude', 'xxx', 'fuck', 'dick', 'pussy', 'ass', 'bitch', 'whore',
  'naked', 'horny', 'boobs', 'penis', 'vagina',
];

const BANNED_BIO_PATTERNS = [
  /\b(سكس|نيك|زب|كس|شرموط|عاهر|قحب)\b/i,
  /\b(porn|sex|nude|xxx|fuck|naked|horny)\b/i,
  /\b(snapchat|snap|سناب)\s*(chat)?\s*[:.]?\s*\S+/i,
  /\b(whatsapp|واتس)\s*[:.]?\s*\+?\d+/i,
];

export function filterMessage(text: string): { clean: string; blocked: boolean } {
  let clean = text;
  let blocked = false;

  for (const word of BANNED_WORDS) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    if (regex.test(clean)) {
      blocked = true;
      clean = clean.replace(regex, '***');
    }
  }

  return { clean, blocked };
}

export function isProfileClean(bio: string | null, username: string): { clean: boolean; reason?: string } {
  if (username) {
    for (const word of BANNED_WORDS) {
      if (username.toLowerCase().includes(word.toLowerCase())) {
        return { clean: false, reason: 'اسم المستخدم يحتوي على محتوى مسيء' };
      }
    }
  }

  if (bio) {
    for (const pattern of BANNED_BIO_PATTERNS) {
      if (pattern.test(bio)) {
        return { clean: false, reason: 'النبذة تحتوي على محتوى مسيء' };
      }
    }
  }

  return { clean: true };
}
