/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import cn from 'classnames';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { Agent } from '../lib/presets/agents';
import { useAgent, useUI, useUser } from '../lib/state';
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
import joeAvatarImg from '../src/assets/images/joe_tutor_avatar_1790137644113.jpg';

export default function Header() {
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
  } = useUI();
  const { name, topic } = useUser();
  const { current, setCurrent, availablePresets } = useAgent();
  const { disconnect, connected } = useLiveAPIContext();

  const [showRoomList, setShowRoomList] = useState(false);
  const [showOutputMenu, setShowOutputMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);

  const outputMenuRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      setShowRoomList(false);
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

  function changeAgent(agent: Agent | string) {
    disconnect();
    setCurrent(agent);
  }

  const isSuperUser = name === 'Root' || name === 'root';
  const isJoeTutor = current.id === 'joe_tutor';

  return (
    <header className="joe-tutor-header">
      {/* Brand & Persona Switcher */}
      <div className="header-brand-section">
        <div className="brand-logo-wrap">
          <div className="brand-avatar-thumbnail">
            {isJoeTutor ? (
              <img src={joeAvatarImg} alt="JOE Tutor" className="brand-avatar-img" />
            ) : (
              <div
                className="brand-avatar-dot"
                style={{ backgroundColor: current.bodyColor }}
              />
            )}
            <span
              className={cn('brand-status-dot', {
                connected: connected,
              })}
            />
          </div>

          <div className="brand-text-block">
            <div className="brand-title-row">
              <span className="brand-name">JOE TUTOR</span>
              <span className="brand-tag">Y2K POP</span>
            </div>
            <div className="brand-persona-selector">
              <button
                className="persona-dropdown-trigger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoomList(!showRoomList);
                }}
                title="Switch Learning Companion Persona"
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
        {showRoomList && (
          <div className="persona-dropdown-menu" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-section-title">Select Companion Persona</div>
            <ul className="persona-list">
              {availablePresets.map((agent) => (
                <li key={agent.id}>
                  <button
                    className={cn('persona-option-btn', { active: agent.id === current.id })}
                    onClick={() => {
                      changeAgent(agent);
                      setShowRoomList(false);
                    }}
                  >
                    <span
                      className="persona-color-chip"
                      style={{ backgroundColor: agent.bodyColor }}
                    />
                    <div className="persona-info-wrap">
                      <span className="persona-name-text">{agent.name}</span>
                      <span className="persona-voice-text">Voice: {agent.voice}</span>
                    </div>
                    {agent.id === current.id && (
                      <CheckCircle2 size={14} className="text-cherry-500 ml-auto" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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
          <span className="tab-text">Notes</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'visuals' })}
          onClick={() => setMainTab('visuals')}
          title="Mathematical Function Plots and Concept Diagrams"
        >
          <LineChart size={15} />
          <span className="tab-text">Visuals Lab</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'quiz' })}
          onClick={() => setMainTab('quiz')}
          title="Active Recall Practice and Flashcards"
        >
          <HelpCircle size={15} />
          <span className="tab-text">Quiz & Recall</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'transcript' })}
          onClick={() => setMainTab('transcript')}
          title="Full Conversation Dialogue Transcript"
        >
          <MessageSquare size={15} />
          <span className="tab-text">Transcript</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'minutes' })}
          onClick={() => setMainTab('minutes')}
          title="Structured Summary and Key Takeaways"
        >
          <ClipboardList size={15} />
          <span className="tab-text">Minutes</span>
        </button>

        <button
          className={cn('header-nav-tab', { active: mainTab === 'audio-log' })}
          onClick={() => setMainTab('audio-log')}
          title="Raw Audio Snippets and Log"
        >
          <Volume2 size={15} />
          <span className="tab-text">Audio</span>
        </button>
      </nav>

      {/* Right Controls Area */}
      <div className="header-right-controls">
        {/* Topic Badge if set */}
        {topic && (
          <div className="header-topic-badge" title={`Active Study Subject: ${topic}`}>
            <Sparkles size={12} className="text-cherry-500" />
            <span className="topic-text-truncate">{topic}</span>
          </div>
        )}

        {/* Edit Counter */}
        <div className="header-stat-badge" title="Tutor Note Updates">
          <span className="stat-label">Edits:</span>
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
          title="Session & Companion Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
