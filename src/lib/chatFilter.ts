// Patterns to detect external contact info in chat messages
const PHONE_REGEX = /(\+?\d{1,4}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,6}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi;
const URL_REGEX = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
const SOCIAL_REGEX = /(facebook|fb|instagram|insta|whatsapp|wa\.me|telegram|t\.me|twitter|x\.com|linkedin|snapchat|tiktok|signal|viber|discord)[.:\/\s@]?\s*[\w\-\.\/]*/gi;
const SOCIAL_HANDLE_REGEX = /@[\w.]{3,30}/g;
// Arabic obfuscation patterns (e.g. "واتساب" "فيسبوك" "تليجرام")
const ARABIC_SOCIAL_REGEX = /(واتساب|واتس|فيسبوك|انستجرام|انستا|تليجرام|تلجرام|تويتر|لينكدان|سناب|تيك توك|ديسكورد)/gi;

export function containsExternalContact(text: string): boolean {
  return (
    PHONE_REGEX.test(text) ||
    EMAIL_REGEX.test(text) ||
    URL_REGEX.test(text) ||
    SOCIAL_REGEX.test(text) ||
    SOCIAL_HANDLE_REGEX.test(text) ||
    ARABIC_SOCIAL_REGEX.test(text)
  );
}

export const BLOCKED_MESSAGE_EN = "⚠️ Message blocked: Sharing external contact information (phone numbers, emails, URLs, social media) is not allowed for your safety. Please keep communication within the platform.";
export const BLOCKED_MESSAGE_AR = "⚠️ تم حظر الرسالة: مشاركة وسائل التواصل الخارجية (أرقام هاتف، بريد إلكتروني، روابط، سوشيال ميديا) غير مسموحة لحمايتك. يرجى التواصل عبر المنصة فقط.";
