/**
 * Bottom-docked portrait companion.
 * Preserves the original character images and Gemini Live integration.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useAgent, useUI } from '../../lib/state';
import { ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react';
import './docked-companion.css';

export default function TutorAvatar() {
  const { current } = useAgent();
  const { agentState, speechBubbleText, setSpeechBubbleText } = useUI();
  const { connected, volumeRef } = useLiveAPIContext();
  const [isTalking, setIsTalking] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [visibleText, setVisibleText] = useState<string | null>(null);
  const lastSpeaking = useRef(0);

  useEffect(() => {
    let frame = 0;
    let lastChecked = 0;
    const tick = (now: number) => {
      if (now - lastChecked > 70) {
        lastChecked = now;
        if (connected && volumeRef.current > .045) lastSpeaking.current = now;
        const next = connected && now - lastSpeaking.current < 450;
        setIsTalking(prev => prev === next ? prev : next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [connected, volumeRef]);

  useEffect(() => {
    setVisibleText(speechBubbleText);
    if (!speechBubbleText) return;
    const id = window.setTimeout(() => {
      setVisibleText(null);
      setSpeechBubbleText(null);
    }, 8500);
    return () => window.clearTimeout(id);
  }, [speechBubbleText, setSpeechBubbleText]);

  const status = !connected ? 'Ready to study' : isTalking ? 'Speaking' : agentState === 'Thinking' ? 'Thinking' : 'Listening';
  const name = current.name.split(' (')[0];
  return (
    <aside className={'chloe-dock' + (minimized ? ' chloe-dock--minimized' : '') + (isTalking ? ' chloe-dock--speaking' : '')} aria-label={name + ' companion'}>
      {visibleText && !minimized && (
        <div className="chloe-dock-bubble">
          <button aria-label="Dismiss speech bubble" onClick={() => { setVisibleText(null); setSpeechBubbleText(null); }}><X size={13}/></button>
          <strong>{name} says</strong>
          <p>{visibleText}</p>
        </div>
      )}
      {!minimized && <div className="chloe-dock-portrait" aria-hidden="true">
        {current.avatarUrl ? <img src={current.avatarUrl} alt="" draggable={false}/> : <div className="chloe-dock-monogram"><Sparkles size={52}/></div>}
      </div>}
      <div className="chloe-dock-base">
        <span className="chloe-dock-signal"><span className={'chloe-dock-dot'+ (connected ? ' connected':'')}/></span>
        <span className="chloe-dock-meta"><strong>{name}</strong><small>{status}</small></span>
        <span className={'chloe-dock-level' + (isTalking ? ' active' : '')}><i/><i/><i/><i/></span>
        <button type="button" onClick={() => setMinimized(v=>!v)} title={minimized ? 'Show assistant' : 'Hide assistant'} aria-label={minimized ? 'Show assistant' : 'Hide assistant'}>
          {minimized ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}
        </button>
      </div>
    </aside>
  );
}
