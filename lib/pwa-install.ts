// Browser-native PWA install prompt is usually offered only once per page
// load. Hold it at app startup so users can open Settings later and install.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
let deferredPrompt: InstallPromptEvent | null = null;
const UPDATE_EVENT = 'joe-tutor:install-change';
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event as InstallPromptEvent;
    window.dispatchEvent(new Event(UPDATE_EVENT));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event(UPDATE_EVENT));
  });
}
export function canPromptInstall(): boolean { return deferredPrompt !== null; }
export function isStandaloneApp(): boolean {
  return typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
export function onInstallAvailabilityChanged(listener: () => void): () => void {
  window.addEventListener(UPDATE_EVENT, listener);
  return () => window.removeEventListener(UPDATE_EVENT, listener);
}
export async function promptPwaInstall(): Promise<boolean> {
  const prompt = deferredPrompt;
  if (!prompt) return false;
  deferredPrompt = null;
  window.dispatchEvent(new Event(UPDATE_EVENT));
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome === 'accepted';
}
