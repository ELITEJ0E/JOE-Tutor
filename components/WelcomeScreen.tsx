/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { useAgent, useUI } from '../lib/state';
import { useUiTranslation } from '../hooks/use-ui-translation';
import { getCharacterIntroduction } from '../lib/presets/character-intros';
import { localizedCompanionTagline } from '../lib/companion-display-i18n';
import {
  ArrowRight, AudioLines, BookOpen, BrainCircuit, ChartNoAxesCombined,
  CheckCircle2, Heart, Sparkles, WandSparkles,
} from 'lucide-react';
import './welcome-redesign.css';

export default function WelcomeScreen() {
  const t = useUiTranslation();
  const { setShowWelcomeScreen, uiLanguage } = useUI();
  const { current } = useAgent();
  const intro = getCharacterIntroduction(current);
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), 50);
    return () => window.clearTimeout(timer);
  }, []);

  const close = () => {
    if (isExiting) return;
    setIsExiting(true);
    window.setTimeout(() => setShowWelcomeScreen(false), 330);
  };

  return (
    <div className={`welcome-screen-shroud joe-home-overlay ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
      <main className="joe-homepage" aria-label="JOE Tutor welcome">
        <div className="joe-homepage-grid">
          <section className="joe-home-copy">
            <div className="joe-home-brand"><span className="joe-home-brand-mark"><Sparkles size={17}/></span> JOE TUTOR <span className="joe-home-brand-separator"/> <span className="joe-home-brand-sub">{t('YOUR LEARNING SPACE')}</span></div>
            <div className="joe-home-intro-pill"><span className="joe-home-live-dot"/> {t('Learn naturally. Talk freely. Create together.')}</div>
            <h1>{t('Your space to')}<br/><em>{t('learn, think')}</em> <span>{t('& connect.')}</span></h1>
            <p className="joe-home-lead">{t('Real-time conversations, beautifully organized notes, visual explanations, and companions who adapt to you.')}</p>
            <div className="joe-home-actions">
              <button className="joe-home-primary" onClick={close}><span>{t('Enter JOE Tutor')}</span><ArrowRight size={20}/></button>
              <span className="joe-home-action-note"><CheckCircle2 size={15}/> {t('Learn at your own pace')}</span>
            </div>
            <div className="joe-home-feature-line">
              <span><AudioLines size={16}/> {t('Natural voice conversations')}</span>
              <span><BookOpen size={16}/> {t('Smart notes')}</span>
              <span><BrainCircuit size={16}/> {t('Practice & recall')}</span>
            </div>
          </section>

          <section className="joe-home-visual" aria-label="Selected AI companion">
            <div className="joe-home-visual-orbit joe-home-visual-orbit-one"/>
            <div className="joe-home-visual-orbit joe-home-visual-orbit-two"/>
            <div className="joe-home-visual-light"/>
            <span className="joe-home-visual-label"><span className="joe-home-visual-dot"/> {t('YOUR COMPANION')}</span>
            <div className="joe-home-character">
              {current.avatarUrl ? <img src={current.avatarUrl} alt={current.name} draggable={false}/> : <div className="joe-home-character-fallback"><Sparkles size={70}/></div>}
            </div>
            <div className="joe-home-identity">
              <span>{t('MEET YOUR COMPANION')}</span>
              <h2>{current.name.split(' (')[0]}</h2>
              <p>{localizedCompanionTagline(current, uiLanguage)}</p>
            </div>
            <div className="joe-home-talk"><span><Heart size={14}/></span> “{intro.firstGreeting}”</div>
          </section>
        </div>
        <section className="joe-home-toolbelt" aria-label="Learning tools">
          <div className="joe-home-tool"><span className="joe-home-tool-icon pink"><BookOpen size={20}/></span><div><strong>{t('Study smarter')}</strong><p>{t('Notes, summaries, and structured takeaways.')}</p></div></div>
          <div className="joe-home-tool"><span className="joe-home-tool-icon peach"><ChartNoAxesCombined size={20}/></span><div><strong>{t('See ideas clearly')}</strong><p>{t('Visuals, equations, and interactive graphs.')}</p></div></div>
          <div className="joe-home-tool"><span className="joe-home-tool-icon lilac"><WandSparkles size={20}/></span><div><strong>{t('Make it yours')}</strong><p>{t('Practice, create, or just have a conversation.')}</p></div></div>
        </section>
        <div className="joe-home-footer"><span>JOE TUTOR <span aria-hidden="true">✦</span> {t('A MORE PERSONAL WAY TO LEARN')}</span><span>{t('Built for curiosity, not just classrooms.')}</span></div>
      </main>
    </div>
  );
}
