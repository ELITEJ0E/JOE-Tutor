/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { useUI } from '../lib/state';
import { ArrowRight, Sparkles, BookOpen, LineChart, HelpCircle } from 'lucide-react';
import joeAvatarImg from '../src/assets/images/joe_tutor_avatar_1790137644113.jpg';

const TUTOR_SUBJECTS = [
  'Calculus & Real Analysis',
  'Organic Chemistry',
  'Quantum Mechanics',
  'Macroeconomics',
  'Data Structures & Algorithms',
  'World History & Geopolitics',
  'Neuroscience',
  'Linear Algebra',
  'Creative Writing',
  'Biochemistry',
  'Philosophy & Ethics',
  'Statistics & Probability',
];

/**
 * The initial welcome screen for JOE Tutor.
 * Presents a warm, premium, Y2K-inspired entry sequence introducing
 * your intelligent personal AI learning companion.
 */
export default function WelcomeScreen() {
  const { setShowWelcomeScreen, setShowDisclaimer } = useUI();
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Generate random positions and animations for academic subjects
  const floatingElements = useMemo(() => {
    return TUTOR_SUBJECTS.map((text, i) => ({
      text,
      id: i,
      top: `${Math.random() * 75 + 12}%`,
      left: `${Math.random() * 75 + 12}%`,
      fontSize: `${Math.random() * 0.4 + 0.85}rem`,
      delay: `${Math.random() * 4}s`,
      duration: `${Math.random() * 8 + 10}s`,
      opacity: Math.random() * 0.35 + 0.15,
    }));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setIsExiting(true);
    setTimeout(() => {
      setShowWelcomeScreen(false);
      setShowDisclaimer(true);
    }, 600);
  }

  return (
    <div
      className={`welcome-screen-shroud ${isVisible ? 'visible' : ''} ${
        isExiting ? 'exiting' : ''
      }`}
    >
      {/* Floating Subject Particles */}
      <div className="floating-container">
        {floatingElements.map((el) => (
          <div
            key={el.id}
            className="floating-text"
            style={{
              top: el.top,
              left: el.left,
              fontSize: el.fontSize,
              animationDelay: el.delay,
              animationDuration: el.duration,
              opacity: el.opacity,
            } as React.CSSProperties}
          >
            {el.text}
          </div>
        ))}
      </div>

      <div className="welcome-screen">
        <div className="welcome-content">
          {/* Avatar Hero Badge */}
          <div className="welcome-avatar-wrap">
            <div className="welcome-avatar-glow" />
            <img
              src={joeAvatarImg}
              alt="JOE Tutor"
              className="welcome-avatar-img"
            />
            <span className="welcome-status-pill">
              <span className="welcome-dot" /> Live Voice Companion
            </span>
          </div>

          <div className="welcome-header">
            <h1 className="welcome-title">
              JOE <span className="welcome-title-accent">TUTOR</span>
            </h1>
            <p className="welcome-subtitle">
              Your intelligent personal tutor who is always there beside you.
            </p>
          </div>

          {/* Core Feature Highlights */}
          <div className="welcome-features-row">
            <div className="welcome-feat-card">
              <div className="feat-icon-wrap">
                <Sparkles size={16} className="text-cherry-500" />
              </div>
              <div>
                <strong className="feat-title">Conversational Tutoring</strong>
                <p className="feat-desc">Natural 2-way voice dialogue that adapts to your learning pace.</p>
              </div>
            </div>

            <div className="welcome-feat-card">
              <div className="feat-icon-wrap">
                <LineChart size={16} className="text-cherry-500" />
              </div>
              <div>
                <strong className="feat-title">Math & Diagram Lab</strong>
                <p className="feat-desc">Live LaTeX derivations, function plots, and AI concept illustrations.</p>
              </div>
            </div>

            <div className="welcome-feat-card">
              <div className="feat-icon-wrap">
                <HelpCircle size={16} className="text-cherry-500" />
              </div>
              <div>
                <strong className="feat-title">Active Recall & Quizzes</strong>
                <p className="feat-desc">Instant practice cards and downloadable PDF study guides.</p>
              </div>
            </div>
          </div>

          <button onClick={handleClose} className="start-button glass-button">
            <span>Meet JOE & Start Learning</span>
            <ArrowRight size={18} className="arrow-icon" />
          </button>

          <div className="powered-by-gemini welcome-footer">
            <span className="gemini-sparkle-icon">✦</span>
            <span>Powered by Gemini Live Multimodal API</span>
          </div>
        </div>
      </div>
    </div>
  );
}
