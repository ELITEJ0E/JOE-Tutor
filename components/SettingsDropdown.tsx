import React, { memo, useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export type SettingsOption = { value: string; label: string };
type Props = {
  id?: string;
  value: string;
  options: readonly (SettingsOption | string)[];
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
};

/** Reusable accessible dropdown for all Preferences fields (font + languages). */
const SettingsDropdown = memo(function SettingsDropdown({
  id, value, options, onChange, label, placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const menuId = generatedId + '-menu';
  const normalized = options.map(item => typeof item === 'string' ? { value: item, label: item } : item);
  const selected = normalized.find(item => item.value === value);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const focusOption = (index: number) => {
    requestAnimationFrame(() => {
      root.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')[index]?.focus();
    });
  };
  return (
    <div className="custom-dropdown-container" ref={root}>
      <button id={id} ref={trigger} type="button" className="custom-dropdown-trigger"
        aria-label={label} aria-haspopup="listbox" aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(previous => !previous)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            const index = Math.max(0, normalized.findIndex(item => item.value === value));
            focusOption((index + (event.key === 'ArrowDown' ? 1 : -1) + normalized.length) % normalized.length);
          }
        }}>
        <span>{selected?.label || placeholder || value}</span>
        <ChevronDown size={16} className={open ? 'joe-dropdown-chevron-open' : ''} aria-hidden="true"/>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div id={menuId} role="listbox" aria-label={label}
            className="custom-dropdown-menu"
            initial={{ opacity: 0, y: -7, scale: .985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: .985 }}
            transition={{ duration: .15, ease: 'easeOut' }}>
            {normalized.map((option, index) => (
              <button key={option.value} type="button" role="option"
                aria-selected={value === option.value}
                className={`custom-dropdown-item ${value === option.value ? 'active' : ''}`}
                tabIndex={value === option.value ? 0 : -1}
                onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}
                onKeyDown={event => {
                  if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    focusOption((index + (event.key === 'ArrowDown' ? 1 : -1) + normalized.length) % normalized.length);
                  } else if (event.key === 'Home' || event.key === 'End') {
                    event.preventDefault();
                    focusOption(event.key === 'Home' ? 0 : normalized.length - 1);
                  }
                }}>
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
export default SettingsDropdown;
