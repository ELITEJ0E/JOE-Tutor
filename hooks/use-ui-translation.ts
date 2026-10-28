import { useCallback } from 'react';
import { useUI } from '../lib/state';
import { translateUi } from '../lib/ui-i18n';

/** Only subscribes to display language, never the active audio stream. */
export function useUiTranslation() {
  const language = useUI(state => state.uiLanguage);
  return useCallback((english: string, params?: Record<string, string | number>) =>
    translateUi(language, english, params), [language]);
}
