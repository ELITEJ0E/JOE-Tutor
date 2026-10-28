import React, { memo, useEffect, useRef } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';

/**
 * A tiny, composited voice visualizer shared by the portrait dock and footer.
 * Reads the mutable audio meter directly instead of rerendering React on each
 * audio frame. The subtle time variation also provides a graceful fallback on
 * iOS, where Web Audio analysis can be blocked by autoplay restrictions.
 */
function VoiceVisualizer({
  active,
  className = '',
}: {
  active: boolean;
  className?: string;
}) {
  const { volumeRef } = useLiveAPIContext();
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const bars = root.current?.querySelectorAll<HTMLElement>('i');
    if (!bars?.length) return;
    const setIdle = () => bars.forEach(bar => { bar.style.transform = 'scaleY(.22)'; });
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIdle();
      return;
    }
    let frame = 0;
    let lastDraw = 0;
    let smoothed = .16;
    const draw = (now: number) => {
      if (now - lastDraw >= 50) {
        lastDraw = now;
        // Smooth the real Gemini/Fish PCM output level without causing
        // component re-renders. On restricted mobile devices, retain a
        // moving fallback so active speech never looks like a static icon.
        const measured = Math.min(1, Math.max(0, volumeRef.current) * 4.5);
        const target = measured > .025 ? measured : .38;
        smoothed += (target - smoothed) * .30;
        bars.forEach((bar, index) => {
          const phase = now / 123 + index * 1.7;
          const oscillation = .38 + .62 * (.5 + .5 * Math.sin(phase));
          const beat = .08 * Math.sin(now / 210 + index * 2.3);
          const height = Math.max(.18, Math.min(1, .18 + smoothed * oscillation + beat));
          bar.style.transform = `scaleY(${height.toFixed(3)})`;
          bar.style.opacity = String(Math.min(1, .6 + height * .45));
        });
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      setIdle();
    };
  }, [active, volumeRef]);

  return (
    <span className={`joe-voice-eq ${className}${active ? ' active' : ''}`} ref={root} aria-hidden="true">
      <i/><i/><i/><i/><i/>
    </span>
  );
}

export default memo(VoiceVisualizer);
