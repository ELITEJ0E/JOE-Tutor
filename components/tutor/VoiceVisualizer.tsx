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
    const draw = (now: number) => {
      if (now - lastDraw >= 75) {
        lastDraw = now;
        // The floor keeps the speaking indicator alive on devices that cannot
        // provide real audio metering; louder speech produces higher bars.
        const measured = Math.min(1, volumeRef.current * 3);
        const amplitude = Math.max(.28, measured);
        bars.forEach((bar, index) => {
          const wave = .48 + .52 * (.5 + .5 * Math.sin(now / 115 + index * 1.75));
          bar.style.transform = `scaleY(${Math.min(1, .17 + amplitude * wave).toFixed(3)})`;
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
