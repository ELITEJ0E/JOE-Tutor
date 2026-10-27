/** Local device preferences. A companion keeps its original language by default. */
export const LANGUAGE_OPTIONS = [
  { id: 'companion', label: 'Companion default' },
  { id: 'auto', label: 'Match my language' },
  { id: 'en', label: 'English' },
  { id: 'zh-CN', label: '中文（简体）' },
  { id: 'zh-TW', label: '中文（繁體）' },
  { id: 'ms', label: 'Bahasa Melayu' },
  { id: 'ja', label: '日本語' },
  { id: 'ko', label: '한국어' },
  { id: 'es', label: 'Español' },
  { id: 'fr', label: 'Français' },
  { id: 'de', label: 'Deutsch' },
  { id: 'th', label: 'ภาษาไทย' },
  { id: 'id', label: 'Bahasa Indonesia' },
  { id: 'ar', label: 'العربية' },
  { id: 'hi', label: 'हिन्दी' },
  { id: 'pt', label: 'Português' },
  { id: 'it', label: 'Italiano' },
] as const;
export type LanguagePreference = (typeof LANGUAGE_OPTIONS)[number]['id'];
export const NOTES_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter(option =>
  option.id !== 'companion' && option.id !== 'auto'
);
export type NotesLanguage = Exclude<LanguagePreference, 'companion' | 'auto'>;

export function preferenceLabel(id: LanguagePreference): string {
  return LANGUAGE_OPTIONS.find(entry => entry.id === id)?.label ?? 'English';
}

export function readLanguagePreference(key: string, fallback: LanguagePreference): LanguagePreference {
  try {
    const saved = window.localStorage.getItem(key);
    const match = LANGUAGE_OPTIONS.find(entry => entry.id === saved);
    return match ? match.id : fallback;
  } catch {
    return fallback;
  }
}

export function saveLanguagePreference(key: string, value: LanguagePreference): void {
  try { window.localStorage.setItem(key, value); }
  catch { /* Private browsing or disabled browser storage. */ }
}
