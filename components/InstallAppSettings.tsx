import React, { useEffect, useState } from 'react';
import { Download, Smartphone, CheckCircle2 } from 'lucide-react';
import { useUiTranslation } from '../hooks/use-ui-translation';
import {
  canPromptInstall,
  isStandaloneApp,
  onInstallAvailabilityChanged,
  promptPwaInstall,
} from '../lib/pwa-install';

function iosSafari(): boolean {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/** The install button is browser-driven; it never promises unsupported devices. */
export default function InstallAppSettings() {
  const t = useUiTranslation();
  const [available, setAvailable] = useState(canPromptInstall);
  const [installed, setInstalled] = useState(isStandaloneApp);
  const [installing, setInstalling] = useState(false);
  useEffect(() => onInstallAvailabilityChanged(() => {
    setAvailable(canPromptInstall());
    setInstalled(isStandaloneApp());
  }), []);

  return (
    <section className="joe-pwa-install" aria-labelledby="joe-pwa-heading">
      <div className="joe-pwa-heading">
        <Smartphone size={21} aria-hidden="true"/>
        <div>
          <h3 id="joe-pwa-heading">{t('Install JOE Tutor')}</h3>
          <p>{t('Launch it from your home screen like an app.')}</p>
        </div>
      </div>
      {installed ? (
        <p className="joe-pwa-success"><CheckCircle2 size={17}/> {t('Installed as an app on this device.')}</p>
      ) : available ? (
        <button type="button" disabled={installing} className="joe-pwa-install-button" onClick={async () => {
          setInstalling(true);
          try {
            const accepted = await promptPwaInstall();
            if (accepted) setInstalled(true);
          } catch (error) {
            console.warn('PWA install prompt not available:', error);
          } finally {
            setInstalling(false);
          }
        }}><Download size={17}/> {t(installing ? 'Opening install prompt…' : 'Install app')}</button>
      ) : iosSafari() ? (
        <p className="joe-pwa-hint">In Safari, tap <strong>Share</strong> and choose <strong>Add to Home Screen</strong>. If you use Chrome on iOS, open this site in Safari first.</p>
      ) : (
        <p className="joe-pwa-hint">Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong> when available. On desktop Chrome, look for the install icon in the address bar.</p>
      )}
      <p className="joe-pwa-disclaimer">{t('Notes shell can open offline after installation. Gemini chat, microphones, Fish Audio and live tutoring need an Internet connection.')}</p>
    </section>
  );
}
