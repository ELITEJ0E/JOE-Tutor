/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './companion-voice-roster.css';
import './gender-board-responsive.css';
import cn from 'classnames';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { Agent } from '../lib/presets/agents';
import { getCharacterIntroduction } from '../lib/presets/character-intros';
import { localizedCompanionTagline, localizedCompanionName } from '../lib/companion-display-i18n';
import { useAgent, useUI, useUser } from '../lib/state';
import { useUiTranslation } from '../hooks/use-ui-translation';
import { UI_LANGUAGE_OPTIONS, UiLanguage } from '../lib/ui-i18n';
import { Languages } from 'lucide-react';
import {
  Sparkles,
  BookOpen,
  LineChart,
  HelpCircle,
  MessageSquare,
  ClipboardList,
  Volume2,
  ChevronDown,
  Settings,
  Bug,
  GraduationCap,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import chloeIdleImg from '../src/assets/images/chloe_tutor_idle_1790148991910.jpg';

export default function Header() {
  const t = useUiTranslation();
  const {
    showUserConfig,
    setShowUserConfig,
    setShowDebugModal,
    setShowAgentEdit,
    changeCount,
    theme,
    mainTab,
    setMainTab,
    documentTab,
    setDocumentTab,
    outputModality,
    setOutputModality,
    uiLanguage,
    setUiLanguage,
  } = useUI();
  const { name, topic } = useUser();
  const { current, setCurrent, availablePresets } = useAgent();
  const { disconnect, connected } = useLiveAPIContext();

  const [showRoomList, setShowRoomList] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [genderFilter, setGenderFilter] = useState<'female' | 'male'>('female');
  const [showOutputMenu, setShowOutputMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const outputMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);
  const personaTriggerRef = useRef<HTMLButtonElement>(null);
  const visiblePresets = useMemo(
    () => availablePresets.filter(agent =>
      (agent.gender || (['sam','tom','rahul','ramon','ari','hiro','hans','newton'].includes(agent.id) ? 'male' : 'female')) === genderFilter
    ),
    [availablePresets, genderFilter]
  );

  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      if (outputMenuRef.current && !outputMenuRef.current.contains(e.target as Node)) {
        setShowOutputMenu(false);
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setShowViewMenu(false);
      }
    };
    window.addEventListener('click', closeDropdowns);
    return () => window.removeEventListener('click', closeDropdowns);
  }, []);

  useEffect(() => {
    if (!showRoomList) return;
    const onOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!personaMenuRef.current?.contains(target) && !personaTriggerRef.current?.contains(target)) {
        setShowRoomList(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowRoomList(false);
        personaTriggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [showRoomList]);

  function changeAgent(agent: Agent | string) {
    disconnect();
    setCurrent(agent);
  }

  const isSuperUser = name === 'Root' || name === 'root';
  const hasAvatar = !!current.avatarUrl;

  return (
    <header className="joe-tutor-header">
      {/* Brand & Persona Switcher */}
      <div className="header-brand-section">
        <div className="brand-logo-wrap">
          <div className="brand-avatar-thumbnail">
            {hasAvatar ? (
              <img src={current.avatarUrl} alt={current.name} className="brand-avatar-img" />
            ) : (
              <div
                className="brand-avatar-fallback flex items-center justify-center font-bold text-xs text-white uppercase"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: current.bodyColor || '#3A86FF',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                }}
              >
                {current.name.charAt(0)}
              </div>
            )}
            <span
              className={cn('brand-status-dot', {
                connected: connected,
              })}
            />
          </div>

          <div className="brand-text-block">
            <div className="brand-title-row">
              <span className="brand-name">{t('TUTORS')}</span>
            </div>
            <div className="brand-persona-selector">
              <button
                ref={personaTriggerRef}
                type="button"
                aria-haspopup="listbox"
                aria-controls="joe-persona-menu"
                className="persona-dropdown-trigger"
                aria-label={"Switch tutor, current: " + current.name}
                aria-expanded={showRoomList}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!showRoomList) setGenderFilter(current.gender || (['sam','tom','rahul','ramon','ari','hiro','hans','newton'].includes(current.id) ? 'male' : 'female'));
                  setShowRoomList(!showRoomList);
                }}
                title="Click to switch tutors and companions"
              >
                <span className="current-persona-name">
                  {current.name.split(' (')[0]}
                </span>
                <ChevronDown size={12} className={cn('chevron-icon', { open: showRoomList })} />
              </button>
            </div>
          </div>
        </div>

        {/* Persona Dropdown Menu */}
        <AnimatePresence>
          {showRoomList && (
          <motion.div
            ref={personaMenuRef}
            id="joe-persona-menu"
            role="group"
            aria-label={t("Choose your tutor or companion")}
            className="persona-dropdown-menu"
            initial={{ opacity: 0, y: -8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dropdown-section-title">
              <span>{t('Choose your tutor or companion')}</span>
            </div>
            <div className="companion-gender-switch" role="group" aria-label="Companion gender">
              <button type="button" aria-pressed={genderFilter === 'female'} className={genderFilter === 'female' ? 'active' : ''} onClick={() => setGenderFilter('female')}>{t('Female')}</button>
              <button type="button" aria-pressed={genderFilter === 'male'} className={genderFilter === 'male' ? 'active' : ''} onClick={() => setGenderFilter('male')}>{t('Male')}</button>
            </div>
            <ul className="persona-list">
              {visiblePresets.map((agent) => (
                <li key={agent.id}>
                  <button
                    className={cn('persona-option-btn', { active: agent.id === current.id })}
                    title={localizedCompanionTagline(agent, uiLanguage)}
                    onClick={() => {
                      changeAgent(agent);
                      setShowRoomList(false);
                    }}
                  >
                    {agent.avatarUrl ? (
                      <img
                        src={agent.avatarUrl}
                        alt={agent.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1.5px solid rgba(217, 4, 41, 0.25)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: agent.bodyColor || '#64748b',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          flexShrink: 0,
                          border: '1.5px solid rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {agent.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="persona-info-wrap">
                      <span className="persona-name-text">{localizedCompanionName(agent, uiLanguage)}</span>
                      <span className="persona-voice-text">{localizedCompanionTagline(agent, uiLanguage)}</span>
                    </div>
                    {agent.id === current.id && (
                      <CheckCircle2 size={14} className="text-cherry-500 ml-auto" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Tab Navigation Bar */}
      <nav className="header-nav-tabs">
        <button
          className={cn('header-nav-tab', { active: mainTab === 'document' })}
          onClick={() => {
            setMainTab('document');
            if (mainTab !== 'document') setDocumentTab('rendered');
          }}
          title="Interactive Study Notes and Mathematical Derivations"
        >
          <BookOpen size={15} />
          <span className="tab-text">{t('Notes')}</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'visuals' })}
          onClick={() => setMainTab('visuals')}
          title="Mathematical Function Plots and Concept Diagrams"
        >
          <LineChart size={15} />
          <span className="tab-text">{t('Visuals Lab')}</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'quiz' })}
          onClick={() => setMainTab('quiz')}
          title="Active Recall Practice and Flashcards"
        >
          <HelpCircle size={15} />
          <span className="tab-text">{t('Quiz & Recall')}</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'transcript' })}
          onClick={() => setMainTab('transcript')}
          title="Full Conversation Dialogue Transcript"
        >
          <MessageSquare size={15} />
          <span className="tab-text">{t('Transcript')}</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'minutes' })}
          onClick={() => setMainTab('minutes')}
          title="Structured Summary and Key Takeaways"
        >
          <ClipboardList size={15} />
          <span className="tab-text">{t('Minutes')}</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'audio-log' })}
          onClick={() => setMainTab('audio-log')}
          title="Raw Audio Snippets and Log"
        >
          <Volume2 size={15} />
          <span className="tab-text">{t('Audio')}</span>
        </button>
      </nav>

      {/* Right Controls Area */}
      <div className="header-right-controls">
        <label className="joe-header-language" title="Change app display language">
          <Languages size={16} aria-hidden="true" />
          <select
            aria-label="App display language"
            value={uiLanguage}
            onChange={event => setUiLanguage(event.currentTarget.value as UiLanguage)}
          >
            {UI_LANGUAGE_OPTIONS.map(option =>
              <option key={option.id} value={option.id}>{option.label}</option>
            )}
          </select>
        </label>
        {/* Topic Badge if set */}
        {topic && (
          <div className="header-topic-badge" title={`Active Study Subject: ${topic}`}>
            <Sparkles size={12} className="text-cherry-500" />
            <span className="topic-text-truncate">{topic}</span>
          </div>
        )}

        {/* Edit Counter */}
        <div className="header-stat-badge" title="Tutor Note Updates">
          <span className="stat-label">{t('Edits:')}</span>
          <span className="stat-value">{changeCount}</span>
        </div>

        {/* SuperUser Debug */}
        {isSuperUser && (
          <button
            className="header-icon-button"
            onClick={() => setShowDebugModal(true)}
            title="Debug Diagnostics"
          >
            <Bug size={17} />
          </button>
        )}

        {/* Settings Toggle */}
        <button
          className={cn('header-icon-button', { active: showUserConfig })}
          onClick={() => setShowUserConfig(!showUserConfig)}
          title={t("Companion & Session")}
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Five touch-friendly tabs, separate from the desktop navigation. */}
      <nav className="mobile-tutor-nav" aria-label="Mobile workspace navigation">
        <button type="button" className={cn('mobile-nav-item', {active: mainTab === 'document'})}
          aria-current={mainTab === 'document' ? 'page' : undefined}
          onClick={() => {setMainTab('document'); setShowMobileMore(false);}}>
          <BookOpen size={20}/><span>{t('Notes')}</span>
        </button>
        <button type="button" className={cn('mobile-nav-item', {active: mainTab === 'visuals'})}
          aria-current={mainTab === 'visuals' ? 'page' : undefined}
          onClick={() => {setMainTab('visuals'); setShowMobileMore(false);}}>
          <LineChart size={20}/><span>{t('Visuals')}</span>
        </button>
        <button type="button" className="mobile-nav-item mobile-nav-tutor"
          onClick={() => {setMainTab('document'); setShowMobileMore(false); document.getElementById('tutor-session-action')?.focus();}}
          title={t("Tutor")}>
          <Volume2 size={20}/><span>{t('Tutor')}</span>
        </button>
        <button type="button" className={cn('mobile-nav-item', {active: mainTab === 'quiz'})}
          aria-current={mainTab === 'quiz' ? 'page' : undefined}
          onClick={() => {setMainTab('quiz'); setShowMobileMore(false);}}>
          <HelpCircle size={20}/><span>{t('Quiz')}</span>
        </button>
        <button type="button" className={cn('mobile-nav-item', {active: showMobileMore || ['transcript','minutes','audio-log'].includes(mainTab)})}
          aria-expanded={showMobileMore} aria-controls="mobile-tutor-more"
          onClick={() => setShowMobileMore(v => !v)}>
          <Layers size={20}/><span>{t('More')}</span>
        </button>
      </nav>
      {showMobileMore && (
        <>
          <button type="button" className="mobile-tutor-more-backdrop" aria-label={t("Close more menu")} onClick={() => setShowMobileMore(false)} />
          <div className="mobile-tutor-more-sheet" id="mobile-tutor-more" role="menu" aria-label="More workspace tools">
            <strong>{t('More tools')}</strong>
            <button role="menuitem" type="button" onClick={() => {setMainTab('transcript');setShowMobileMore(false);}}><MessageSquare size={18}/> {t('Transcript')}</button>
            <button role="menuitem" type="button" onClick={() => {setMainTab('minutes');setShowMobileMore(false);}}><ClipboardList size={18}/> {t('Minutes & summaries')}</button>
            <button role="menuitem" type="button" onClick={() => {setMainTab('audio-log');setShowMobileMore(false);}}><Volume2 size={18}/> {t('Audio history')}</button>
            <button role="menuitem" type="button" onClick={() => {setShowUserConfig(true);setShowMobileMore(false);}}><Settings size={18}/> {t('Preferences')}</button>
          </div>
        </>
      )}
    </header>
  );
}
