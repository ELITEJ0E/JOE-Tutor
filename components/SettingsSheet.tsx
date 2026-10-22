import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';

type SettingsSheetProps = {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
};

/** Accessible, animated right-side settings sheet with a real backdrop. */
export default function SettingsSheet({ children, onClose, title = 'Settings' }: SettingsSheetProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),summary,[tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <motion.div
      className="joe-settings-sheet-root"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
    >
      <div className="joe-settings-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <motion.aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="joe-settings-sheet-title"
        className="joe-settings-sheet-panel"
        initial={{ x: prefersReducedMotion ? 0 : '100%' }}
        animate={{ x: 0 }}
        exit={{ x: prefersReducedMotion ? 0 : '100%' }}
        transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 38, mass: 0.9 }}
        onKeyDown={onKeyDown}
      >
        <header className="joe-settings-sheet-header">
          <div>
            <span className="joe-settings-sheet-eyebrow">JOE TUTOR</span>
            <h2 id="joe-settings-sheet-title">{title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="joe-settings-sheet-close" aria-label="Close settings">
            <X size={20} />
          </button>
        </header>
        <div className="joe-settings-sheet-scroll">{children}</div>
      </motion.aside>
    </motion.div>,
    document.body
  );
}
