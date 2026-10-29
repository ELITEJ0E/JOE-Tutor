/**
 * Bottom-docked portrait companion.
 * Preserves the original character images and Gemini Live integration.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useAgent, useUI } from '../../lib/state';
import { getCharacterIntroduction } from '../../lib/presets/character-intros';
import { ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import { useUiTranslation } from '../../hooks/use-ui-translation';
import './docked-companion.css';

function TutorAvatar() {
  const t = useUiTranslation();
  // Narrow Zustand selectors avoid rerendering the portrait for unrelated
  // settings, input status and transcript updates.
  const current = useAgent(state => state.current);
  const agentState = useUI(state => state.agentState);
  const speechBubbleText = useUI(state => state.speechBubbleText);
  const setSpeechBubbleText = useUI(state => state.setSpeechBubbleText);
  const { connected, volumeRef } = useLiveAPIContext();
  const [isTalking, setIsTalking] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [visibleText, setVisibleText] = useState<string | null>(null);
  const [greetingPreview, setGreetingPreview] = useState<string | null>(null);
  const lastSpeaking = useRef(0);
  const dockRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let frame = 0;
    let lastChecked = 0;
    const tick = (now: number) => {
      if (now - lastChecked > 70) {
        lastChecked = now;
        const measured = connected ? Math.min(1, volumeRef.current * 3) : 0;
        const voicePlaying = connected && agentState === 'Speaking';
        if (measured > .08) lastSpeaking.current = now;
        const next = connected && (voicePlaying || now - lastSpeaking.current < 400);
        // Directly update a CSS variable without a React render per frame.
        dockRef.current?.style.setProperty('--joe-voice-level', String(voicePlaying ? Math.max(.12, measured) : 0));
        setIsTalking(prev => prev === next ? prev : next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [connected, volumeRef, agentState]);

  useEffect(() => {
    setVisibleText(speechBubbleText);
    if (!speechBubbleText) return;
    // Keep words on screen while the companion is composing or speaking, then
    // dismiss shortly after the reply finishes instead of lingering for 9s.
    const delay = agentState === 'Thinking' || agentState === 'Speaking' ? 10000 : 4200;
    const id = window.setTimeout(() => {
      setVisibleText(null);
      setSpeechBubbleText(null);
    }, delay);
    return () => window.clearTimeout(id);
  }, [speechBubbleText, setSpeechBubbleText, agentState]);

  useEffect(() => {
    if (!connected) {
      setGreetingPreview(null);
      return;
    }
    // A brief preview appears only when a live session actually connects.
    // Once the live transcript arrives it takes precedence over this preview.
    setGreetingPreview(getCharacterIntroduction(current).firstGreeting);
    const id = window.setTimeout(() => setGreetingPreview(null), 3600);
    return () => window.clearTimeout(id);
  }, [connected, current.id]);

  const status = t(!connected ? 'Ready to chat' : agentState === 'Fish Audio unavailable' ? 'Fish Audio unavailable' : (isTalking || agentState === 'Speaking') ? 'Speaking' : agentState === 'Generating voice' ? 'Preparing voice' : agentState === 'Thinking' ? 'Composing reply' : 'Listening');
  const name = current.name.split(' (')[0];
  const bubbleText = visibleText || greetingPreview;
  return (
    <aside ref={dockRef} className={'chloe-dock' + (minimized ? ' chloe-dock--minimized' : '') + ((isTalking || agentState === 'Speaking') ? ' chloe-dock--speaking' : '')} aria-label={name + ' companion'}>
      {bubbleText && !minimized && (
        <div className="chloe-dock-bubble">
          <button aria-label="Dismiss speech bubble" onClick={() => { setVisibleText(null); setGreetingPreview(null); setSpeechBubbleText(null); }}><X size={13}/></button>
          <strong>{name} says</strong>
          <p>{bubbleText}</p>
        </div>
      )}
      {!minimized && <div className="chloe-dock-portrait" aria-hidden="true">
        {current.avatarUrl ? <img src={current.avatarUrl} alt="" draggable={false} decoding="async"/> : <div className="chloe-dock-monogram"><Sparkles size={52}/></div>}
      </div>}
      <div className="chloe-dock-base">
        <span className="chloe-dock-signal"><span className={'chloe-dock-dot'+ (connected ? ' connected':'')}/></span>
        <span className="chloe-dock-meta"><strong>{name}</strong><small>{status}</small></span>
        <VoiceVisualizer active={connected && (isTalking || agentState === 'Speaking')} className="chloe-dock-level"/>
        <button type="button" onClick={() => setMinimized(v=>!v)} title={minimized ? 'Show assistant' : 'Hide assistant'} aria-label={minimized ? 'Show assistant' : 'Hide assistant'}>
          {minimized ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}
        </button>
      </div>
    </aside>
  );
}

export default React.memo(TutorAvatar);
