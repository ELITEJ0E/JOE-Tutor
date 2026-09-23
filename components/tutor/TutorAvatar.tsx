/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useAgent, useUI } from '../../lib/state';
import BasicFace from '../demo/basic-face/BasicFace';
import cn from 'classnames';
import { Volume2, Mic, Sparkles, MessageSquare, X } from 'lucide-react';
import joeAvatarImg from '../../src/assets/images/joe_tutor_avatar_1790137644113.jpg';

// Minimum volume level that indicates audio output is occurring.
const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.04;
const TALKING_STATE_COOLDOWN_MS = 1800;

export default function TutorAvatar() {
  const { agentState, speechBubbleText, setSpeechBubbleText, theme } = useUI();
  const { current } = useAgent();
  const { volumeRef, connected } = useLiveAPIContext();

  const [isTalking, setIsTalking] = useState(false);
  const [visibleText, setVisibleText] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const talkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const isJoeTutor = current.id === 'joe_tutor';

  // Handle speech bubble text
  useEffect(() => {
    if (speechBubbleText) {
      setVisibleText(speechBubbleText);
      if (bubbleTimeoutRef.current) {
        clearTimeout(bubbleTimeoutRef.current);
      }
      bubbleTimeoutRef.current = setTimeout(() => {
        setVisibleText(null);
        setSpeechBubbleText(null);
      }, 7000);
    }
  }, [speechBubbleText, setSpeechBubbleText]);

  // Set initial position
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setPosition({
      x: isMobile ? window.innerWidth - 120 : window.innerWidth - 240,
      y: 72,
    });
  }, []);

  // Window resize bounds
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (prev.x === -1000) return prev;
        const avatarWidth = 140;
        const avatarHeight = 140;

        return {
          x: Math.min(Math.max(12, prev.x), window.innerWidth - avatarWidth - 12),
          y: Math.min(Math.max(12, prev.y), window.innerHeight - avatarHeight - 12),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Monitor audio volume output
  useEffect(() => {
    let frameId: number;
    const checkTalking = () => {
      const vol = volumeRef.current || 0;
      setAudioLevel(vol);

      if (vol > AUDIO_OUTPUT_DETECTION_THRESHOLD) {
        setIsTalking(true);
        if (talkingTimeoutRef.current) {
          clearTimeout(talkingTimeoutRef.current);
        }
        talkingTimeoutRef.current = setTimeout(() => {
          setIsTalking(false);
        }, TALKING_STATE_COOLDOWN_MS);
      }
      frameId = requestAnimationFrame(checkTalking);
    };
    frameId = requestAnimationFrame(checkTalking);
    return () => cancelAnimationFrame(frameId);
  }, [volumeRef]);

  // Dragging handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.speech-bubble-close')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.speech-bubble-close')) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    };
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: Math.min(Math.max(10, e.clientX - dragOffset.current.x), window.innerWidth - 130),
          y: Math.min(Math.max(10, e.clientY - dragOffset.current.y), window.innerHeight - 130),
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0];
        setPosition({
          x: Math.min(Math.max(10, touch.clientX - dragOffset.current.x), window.innerWidth - 130),
          y: Math.min(Math.max(10, touch.clientY - dragOffset.current.y), window.innerHeight - 130),
        });
      }
    };

    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Status text label
  const getStatusDisplay = () => {
    if (!connected) return { text: 'OFFLINE', color: 'offline' };
    if (isTalking) return { text: 'SPEAKING', color: 'speaking' };
    if (agentState === 'Thinking') return { text: 'THINKING', color: 'thinking' };
    if (agentState === 'Writing') return { text: 'WRITING', color: 'writing' };
    return { text: 'LISTENING', color: 'listening' };
  };

  const status = getStatusDisplay();

  // Dynamic sound wave scale
  const waveScale = Math.min(1 + audioLevel * 1.8, 1.4);

  return (
    <div
      className={cn('tutor-avatar-wrapper', {
        'is-dragging': isDragging,
        'is-talking': isTalking,
        'is-connected': connected,
      })}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      title={`${current.name} (Drag anywhere)`}
    >
      {/* Outer reactive sound aura */}
      <div
        className={cn('tutor-halo-glow', status.color)}
        style={{
          transform: `scale(${waveScale})`,
          opacity: connected ? (isTalking ? 0.95 : 0.6) : 0.2,
        }}
      />

      {/* Main Avatar Card Frame */}
      <div className="tutor-avatar-frame">
        {isJoeTutor ? (
          <div className="tutor-portrait-container">
            <img
              src={joeAvatarImg}
              alt="JOE Tutor"
              className={cn('tutor-portrait-img', {
                'talking-bounce': isTalking,
              })}
            />
            {/* Live talking audio bar overlay */}
            {isTalking && (
              <div className="tutor-audio-bars">
                <span className="bar bar-1"></span>
                <span className="bar bar-2"></span>
                <span className="bar bar-3"></span>
                <span className="bar bar-4"></span>
              </div>
            )}
          </div>
        ) : (
          <div className="tutor-basic-canvas-wrap">
            <BasicFace
              canvasRef={canvasRef}
              radius={46}
              color={current.bodyColor}
              isTalking={isTalking}
            />
          </div>
        )}

        {/* Status indicator tag */}
        <div className={cn('tutor-status-badge', status.color)}>
          <span className="status-dot" />
          <span className="status-label-text">{status.text}</span>
        </div>
      </div>

      {/* Speech Bubble */}
      {visibleText && (
        <div className="tutor-speech-bubble" onClick={(e) => e.stopPropagation()}>
          <button
            className="speech-bubble-close"
            onClick={() => {
              setVisibleText(null);
              setSpeechBubbleText(null);
            }}
            title="Dismiss"
          >
            <X size={12} />
          </button>
          <div className="tutor-bubble-header">
            <Sparkles size={13} className="text-cherry-500" />
            <span className="bubble-speaker-name">{current.name.split(' (')[0]}</span>
          </div>
          <div className="tutor-bubble-body">{visibleText}</div>
          <div className="tutor-bubble-tail" />
        </div>
      )}
    </div>
  );
}
