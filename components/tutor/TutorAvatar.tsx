/**
 * Integrated 3D tutor companion dock.
 * Reuses the Gemini Live audio output from the existing tutor—no local model,
 * separate page, GPU server or paid avatar endpoint.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Minimize2, Maximize2, Move, RotateCcw, Sparkles, Volume2, X, Zap } from 'lucide-react';
import { useAgent, useUI } from '../../lib/state';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import Integrated3DAvatar from './Integrated3DAvatar';
import './integrated-avatar.css';

const TALKING_THRESHOLD = .038;
const TALKING_HOLD_MS = 280;

export default function TutorAvatar() {
  const { current, setCurrent } = useAgent();
  const { agentState, speechBubbleText, setSpeechBubbleText } = useUI();
  const { connected, volumeRef, disconnect } = useLiveAPIContext();
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 900);
  const [lowPower, setLowPower] = useState(true);
  const [rotate, setRotate] = useState(true);
  const [talking, setTalking] = useState(false);
  const [modelReady, setModelReady] = useState('Preparing');
  const [position, setPosition] = useState({ x: 0, y: 98 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastVoiceAt = useRef(0);
  const lastFrameAt = useRef(0);

  useEffect(() => {
    let frame = 0;
    const loop = (timestamp: number) => {
      if (timestamp - lastFrameAt.current >= 60) {
        lastFrameAt.current = timestamp;
        const volume = volumeRef.current || 0;
        if (connected && volume > TALKING_THRESHOLD) lastVoiceAt.current = performance.now();
        const next = connected && performance.now() - lastVoiceAt.current < TALKING_HOLD_MS;
        setTalking(prev => prev === next ? prev : next);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [connected, volumeRef]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!drag.current) return;
      const d = drag.current;
      const width = containerRef.current?.offsetWidth || 334;
      const height = containerRef.current?.offsetHeight || 430;
      const newX = Math.min(Math.max(8, d.x + event.clientX - d.pointerX), Math.max(8, window.innerWidth - width - 8));
      const newY = Math.min(Math.max(8, d.y + event.clientY - d.pointerY), Math.max(8, window.innerHeight - height - 8));
      setPosition({ x: newX, y: newY });
    };
    const onStop = () => { drag.current = null; setDragging(false); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onStop);
    window.addEventListener('pointercancel', onStop);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onStop); window.removeEventListener('pointercancel', onStop); };
  }, []);

  useEffect(() => {
    const onResize = () => {
      setPosition(p => ({
        x: Math.min(p.x, Math.max(8, window.innerWidth - (containerRef.current?.offsetWidth || 334) - 8)),
        y: Math.min(p.y, Math.max(8, window.innerHeight - (containerRef.current?.offsetHeight || 430) - 8)),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const status = !connected ? 'READY WHEN YOU ARE' : talking ? 'SPEAKING' : agentState === 'Thinking' ? 'THINKING' : 'LISTENING';
  const startDrag = (event: React.PointerEvent) => {
    if ((event.target as HTMLElement).closest('button')) return;
    if (window.innerWidth < 600) return;
    const node = containerRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    drag.current = { pointerX: event.clientX, pointerY: event.clientY, x: rect.left, y: rect.top };
    setDragging(true);
    setPosition({ x: rect.left, y: rect.top });
  };

  return <div
    ref={containerRef}
    className={'joe-companion-dock' + (open ? ' is-open' : ' is-compact') + (dragging ? ' is-dragging' : '')}
    style={position.x ? { left: position.x, top: position.y, right: 'auto' } : undefined}
  >
    {!open ? (
      <button className="joe-companion-reopen" onClick={() => setOpen(true)} title="Open integrated 3D tutor avatar">
        <span className="joe-companion-orb"><Sparkles size={20}/></span>
        <span><strong>3D Companion</strong><small>Tap to expand</small></span>
        <Maximize2 size={16}/>
      </button>
    ) : (
      <>
        <header className="joe-companion-header" onPointerDown={startDrag}>
          <span className="joe-companion-logo"><Sparkles size={18}/></span>
          <span className="joe-companion-header-label">
            <strong>{current.name.split(' (')[0]}</strong>
            <small><span className={'joe-companion-led' + (connected ? ' connected' : '')}/> {status}</small>
          </span>
          <span className="joe-companion-move" title="Drag to reposition"><Move size={14}/></span>
          <button type="button" aria-label="Minimize 3D companion" title="Minimize" onClick={() => setOpen(false)}><Minimize2 size={17}/></button>
        </header>
        <div className="joe-companion-scene">
          <div className="joe-companion-grid"/>
          <Integrated3DAvatar levelRef={volumeRef} talking={talking} enabled={open} lowPower={lowPower} rotate={rotate} onReady={setModelReady}/>
          <div className="joe-companion-scene-top"><span><span className="joe-companion-pulse"/> LIVE 3D</span><span>FREE WEBGL</span></div>
          <div className="joe-companion-caption">
            <div className="joe-companion-overline">INTERACTIVE CHARACTER</div>
            <div className="joe-companion-heading">A voice with a <em>presence.</em></div>
            <p>{modelReady === 'Ready' ? 'Real 3D human model · audio-reactive expression' : 'Real-time 3D animation · lightweight preview while loading'}</p>
          </div>
        </div>
        {speechBubbleText && <div className="joe-companion-bubble">
          <button aria-label="Dismiss message" onClick={() => setSpeechBubbleText(null)}><X size={12}/></button>
          {speechBubbleText}
        </div>}
        <footer className="joe-companion-footer">
          <button className={lowPower ? 'active' : ''} title="Toggle low-power rendering" onClick={() => setLowPower(v => !v)}><Zap size={15}/>{lowPower ? 'Eco / 24 FPS' : '30 FPS'}</button>
          <button className={rotate ? 'active' : ''} title="Toggle natural head turning" onClick={() => setRotate(v => !v)}><RotateCcw size={15}/> Motion</button>
          {current.id !== "mei" && <button title="Switch tutor voice and persona to Mei" onClick={() => { disconnect(); setCurrent("mei"); }}><Sparkles size={15}/> Mei</button>}
          <div className="joe-companion-audio"><Volume2 size={15}/><span className={talking ? 'active' : ''}/><span className={talking ? 'active' : ''}/><span className={talking ? 'active' : ''}/></div>
        </footer>
      </>
    )}
  </div>;
}
