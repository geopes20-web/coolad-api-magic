// ============================================
// ADVANCED CHAT FILTER — DETECTS ALL OBFUSCATION PATTERNS
// ============================================

// Step 1: Normalize obfuscated characters → standard form
function normalizeText(text: string): string {
  let t = text;

  // Remove zero-width / bidi control characters
  t = t.replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '');

  // Normalize Unicode (full-width → ASCII, etc.)
  t = t.normalize('NFKC');

  // Map common letter ↔ digit substitutions
  const charMap: Record<string, string> = {
    'O': '0', 'o': '0', 'Q': '0',
    'I': '1', 'l': '1', '|': '1', 'L': '1',
    'Z': '2', 'z': '2',
    'E': '3', 'e': '3',
    'A': '4', 'a': '4', '@': '4',
    'S': '5', 's': '5', '$': '5',
    'G': '6', 'b': '6',
    'T': '7', 't': '7',
    'B': '8',
    'g': '9', 'q': '9',
    // Arabic-Indic digits → ASCII
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };

  // Build a "digit-normalized" version (only for digit detection)
  const digitNormalized = t.split('').map(c => charMap[c] || c).join('');

  return digitNormalized;
}

// Step 2: Strip separators between digits (spaces, dashes, dots, slashes, hyphens, brackets)
function stripDigitSeparators(text: string): string {
  // Replace separator chars between digits with nothing
  return text.replace(/(\d)[\s\-\._/\\(),\[\]<>~`*'"]+(?=\d)/g, '$1');
}

// Step 3: Convert spelled-out numbers (English + Arabic) to digits
function convertSpelledNumbers(text: string): string {
  const map: Record<string, string> = {
    // English
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'oh': '0',
    // Arabic
    'صفر': '0', 'واحد': '1', 'اثنين': '2', 'اثنان': '2', 'تنين': '2',
    'ثلاثة': '3', 'ثلاث': '3', 'تلاتة': '3', 'اربعة': '4', 'أربعة': '4', 'اربع': '4',
    'خمسة': '5', 'خمس': '5', 'ستة': '6', 'ست': '6',
    'سبعة': '7', 'سبع': '7', 'ثمانية': '8', 'تمانية': '8', 'تمان': '8',
    'تسعة': '9', 'تسع': '9', 'عشرة': '10', 'عشر': '10',
  };
  let result = text.toLowerCase();
  for (const [word, digit] of Object.entries(map)) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  return result;
}

// Step 4: Patterns
const PATTERNS = {
  // Phone: 7-15 consecutive digits (after normalization & separator stripping)
  phone: /\d{7,15}/,

  // Egyptian phone formats: 010/011/012/015 + 8 digits, or +20
  egyptianPhone: /(\+?20|0)?1[0125]\d{8}/,

  // International phone: + followed by 7-15 digits
  intlPhone: /\+\d{7,15}/,

  // Email — handles obfuscation like [at], (at), أت, dot, نقطة
  email: /[\w.\-+]{2,}\s*(?:@|\[at\]|\(at\)|＠|أت|اَت|\bat\b)\s*[\w.\-]{2,}\s*(?:\.|dot|دوت|نقطة|\[dot\]|\(dot\))\s*[a-z]{2,10}/i,

  // Standard email
  emailStandard: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,

  // URL — http/https/www/short links
  url: /(?:https?:\/\/|www\.|ftp:\/\/)[^\s]{2,}/i,

  // Domain extensions
  domain: /\b[a-zA-Z0-9\-]{2,}\.(com|net|org|io|me|co|app|dev|info|biz|xyz|ly|gl|sh|tv|ai|gg|tk|cc|ru|de|fr|uk|eg|sa|ae|qa|kw|bh|om|ma|tn|dz|ye|sy|jo|lb|ps|iq|sd|so|mr|km|dj|ng|ke|gh|tz|ug|et|cm|sn|ml|bf|ne|td|cf|cg|cd|ga|gq|ao|mz|zw|zm|mw|bw|sz|ls|na|za|mg|mu|sc|re|yt)\b/i,

  // Social platform names + handles
  social: /(facebook|fb|instagram|insta|ig|whatsapp|whats|wa|telegram|tg|twitter|x\.com|linkedin|linked.in|snapchat|snap|tiktok|tik.tok|signal|viber|discord|disc|wechat|line|skype|zoom|gmeet|google.meet|hangouts|messenger|kik|threema|wickr|session)/i,

  // Arabic social platform names
  arabicSocial: /(واتساب|واتس|واتسب|فيسبوك|فيس بوك|فيس|انستجرام|انستقرام|انستا|انستغرام|تليجرام|تلجرام|تلغرام|تويتر|اكس|لينكدان|لينكد|سناب|سنابشات|تيك توك|تيكتوك|ديسكورد|ديسكور|ايميل|إيميل|بريد|جيميل|جي ميل|ياهو|هوتميل|اوتلوك|أوتلوك|زووم|سكايب|واي بر|فايبر|سيجنال|وي شات)/i,

  // Social handles (@username)
  handle: /@[\w.\-]{3,30}/,

  // Phone number context words (English + Arabic)
  phoneContext: /(call me|call my|my number|my phone|my mobile|my cell|reach me|contact me|whatsapp me|text me|كلمني|اتصل|رقمي|موبايلي|نمرتي|تليفوني|تواصل معي|واتس\s*اب|دوس على)/i,

  // Email context words
  emailContext: /(email me|my email|mail me|send to|راسلني|بريدي|ايميلي|إيميلي|على ميل|على بريد)/i,
};

interface FilterResult {
  blocked: boolean;
  patterns: string[];
  severity: 'low' | 'medium' | 'high';
}

export function analyzeMessage(text: string): FilterResult {
  if (!text || text.length < 3) return { blocked: false, patterns: [], severity: 'low' };

  const detected: string[] = [];
  const original = text;

  // Layer 1: normalized + digit-stripped (catches phone numbers in any disguise)
  const normalized = normalizeText(original);
  const noSeparators = stripDigitSeparators(normalized);
  const spelledOut = stripDigitSeparators(convertSpelledNumbers(noSeparators));

  // Phone detection (use the most aggressive normalization)
  if (PATTERNS.egyptianPhone.test(spelledOut)) detected.push('egyptian_phone');
  else if (PATTERNS.intlPhone.test(spelledOut)) detected.push('international_phone');
  else if (PATTERNS.phone.test(spelledOut)) detected.push('phone_number');

  // Email detection (test on lightly normalized text)
  if (PATTERNS.email.test(normalized) || PATTERNS.emailStandard.test(normalized)) {
    detected.push('email');
  }

  // URL / domain (test on original — case matters for URL schemes)
  if (PATTERNS.url.test(original)) detected.push('url');
  if (PATTERNS.domain.test(original)) detected.push('domain');

  // Social platforms (test on original)
  if (PATTERNS.social.test(original)) detected.push('social_platform');
  if (PATTERNS.arabicSocial.test(original)) detected.push('arabic_social');
  if (PATTERNS.handle.test(original)) detected.push('social_handle');

  // Context words combined with digits/letters anywhere = high suspicion
  const hasPhoneContext = PATTERNS.phoneContext.test(original);
  const hasEmailContext = PATTERNS.emailContext.test(original);
  const hasManyDigits = /\d{4,}/.test(spelledOut);

  if (hasPhoneContext && hasManyDigits) detected.push('phone_intent');
  if (hasEmailContext) detected.push('email_intent');

  const severity: 'low' | 'medium' | 'high' =
    detected.length >= 3 ? 'high' :
    detected.length >= 1 ? 'medium' : 'low';

  return {
    blocked: detected.length > 0,
    patterns: detected,
    severity,
  };
}

// Backwards-compatible API
export function containsExternalContact(text: string): boolean {
  return analyzeMessage(text).blocked;
}

export const BLOCKED_MESSAGE_EN = "⚠️ Message blocked: Sharing external contact info (phone, email, URLs, social media) is not allowed for your safety. Please keep all communication within the platform.";
export const BLOCKED_MESSAGE_AR = "⚠️ تم حظر الرسالة: مشاركة وسائل التواصل الخارجية (أرقام، بريد، روابط، سوشيال ميديا) غير مسموحة لحمايتك. يرجى التواصل عبر المنصة فقط.";
