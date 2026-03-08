// Patterns to detect external contact info in chat messages
const PHONE_REGEX = /(\+?\d{1,4}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,6}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi;
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+|[\w\-]+\.(com|net|org|io|me|co|app|dev|info|biz|xyz)\b/gi;
const SOCIAL_REGEX = /(facebook|fb|instagram|insta|whatsapp|wa\.me|telegram|t\.me|twitter|x\.com|linkedin|snapchat|tiktok|signal|viber|discord|wechat|line|skype|zoom|meet)[.:\/\s@]?\s*[\w\-\.\/]*/gi;
const SOCIAL_HANDLE_REGEX = /@[\w.]{3,30}/g;
// Arabic obfuscation patterns
const ARABIC_SOCIAL_REGEX = /(واتساب|واتس|فيسبوك|فيس|انستجرام|انستا|تليجرام|تلجرام|تويتر|لينكدان|سناب|سناب شات|تيك توك|تيكتوك|ديسكورد|ايميل|بريد|جيميل|ياهو|هوتميل|زووم|سكايب)/gi;
// Obfuscation: numbers written as words or with separators like "zero five..."
const OBFUSCATED_PHONE_REGEX = /(zero|one|two|three|four|five|six|seven|eight|nine|صفر|واحد|اثنين|ثلاثة|اربعة|خمسة|ستة|سبعة|ثمانية|تسعة)[\s\-_.,]*\1{0}([\s\-_.,]*(zero|one|two|three|four|five|six|seven|eight|nine|صفر|واحد|اثنين|ثلاثة|اربعة|خمسة|ستة|سبعة|ثمانية|تسعة)){4,}/gi;
// Numbers with deliberate separators: 0 5 5 1 2 3 4 5 6 7
const SPACED_DIGITS_REGEX = /\d[\s\-_.]{1,3}\d[\s\-_.]{1,3}\d[\s\-_.]{1,3}\d[\s\-_.]{1,3}\d[\s\-_.]{1,3}\d/g;
// "at" symbol obfuscation
const AT_OBFUSCATION_REGEX = /\b[\w.]+\s*(\[at\]|\(at\)|@|＠|أت)\s*[\w.]+\s*(\.|dot|دوت|نقطة)\s*(com|net|org|gmail|yahoo|hotmail|outlook)\b/gi;

export function containsExternalContact(text: string): boolean {
  // Normalize text: remove zero-width chars and normalize unicode
  const normalized = text.replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, '').normalize('NFKC');
  
  // Reset lastIndex for all regex (global flag)
  const patterns = [PHONE_REGEX, EMAIL_REGEX, URL_REGEX, SOCIAL_REGEX, SOCIAL_HANDLE_REGEX, ARABIC_SOCIAL_REGEX, OBFUSCATED_PHONE_REGEX, SPACED_DIGITS_REGEX, AT_OBFUSCATION_REGEX];
  patterns.forEach(r => r.lastIndex = 0);
  
  return (
    PHONE_REGEX.test(normalized) ||
    EMAIL_REGEX.test(normalized) ||
    URL_REGEX.test(normalized) ||
    SOCIAL_REGEX.test(normalized) ||
    SOCIAL_HANDLE_REGEX.test(normalized) ||
    ARABIC_SOCIAL_REGEX.test(normalized) ||
    OBFUSCATED_PHONE_REGEX.test(normalized) ||
    SPACED_DIGITS_REGEX.test(normalized) ||
    AT_OBFUSCATION_REGEX.test(normalized)
  );
}

export const BLOCKED_MESSAGE_EN = "⚠️ Message blocked: Sharing external contact information (phone numbers, emails, URLs, social media) is not allowed for your safety. Please keep communication within the platform.";
export const BLOCKED_MESSAGE_AR = "⚠️ تم حظر الرسالة: مشاركة وسائل التواصل الخارجية (أرقام هاتف، بريد إلكتروني، روابط، سوشيال ميديا) غير مسموحة لحمايتك. يرجى التواصل عبر المنصة فقط.";
