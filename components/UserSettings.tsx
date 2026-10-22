/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import SettingsSheet from './SettingsSheet';
import ConversationMemorySettings from './ConversationMemorySettings';
import { AnimatePresence, motion } from 'motion/react';
import './companion-settings.css';
import { useAgent, useUI, useUser } from '../lib/state';
import { Theme, themes } from '../lib/themes';
import { FONT_OPTIONS, PLACEHOLDER_DOC } from '../lib/constants';
import React, { useState, useRef, useEffect, useId } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { FileUp, X, FileText, Loader2, ChevronDown } from 'lucide-react';

// Set up PDF.js worker
// Using unpkg as it's often more reliable for specific versioned assets
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FormatOption = 'Markdown' | 'HTML';
const FORMAT_OPTIONS: FormatOption[] = ['Markdown', 'HTML'];

/**
 * A custom dropdown component for settings.
 */
const CustomDropdown = React.memo(function CustomDropdown({
  value, options, onChange, placeholder,
}: {
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', keyDown);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', keyDown);
    };
  }, [isOpen]);

  const choose = (option: string) => {
    onChange(option);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div className="custom-dropdown-container" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="custom-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen(open => !open)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setIsOpen(true);
            requestAnimationFrame(() => {
              const selected = containerRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
              (selected || containerRef.current?.querySelector<HTMLElement>('[role="option"]'))?.focus();
            });
          }
        }}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={16} className={isOpen ? 'joe-dropdown-chevron-open' : ''} aria-hidden="true" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listId}
            role="listbox"
            aria-label="Choose document font"
            className="custom-dropdown-menu"
            initial={{ opacity: 0, y: -7, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.985 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {options.map((option, index) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                tabIndex={value === option ? 0 : -1}
                className={`custom-dropdown-item ${value === option ? 'active' : ''}`}
                onClick={() => choose(option)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    choose(option);
                  } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
                    const items = containerRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
                    items?.[next]?.focus();
                  }
                }}
              >
                {option}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * A modal for configuring user settings for the writing session.
 * It features a modern, "jazzy" design for a more engaging user experience.
 */
export default function UserSettings() {
  // Hooks to manage user-specific data (name, info, topic, etc.)
  const { name, info, topic, format, setName, setInfo, setTopic, setFormat, pdfFiles, addPdfFile, removePdfFile } =
    useUser();
  // Hooks to manage UI state (modal visibility, current theme)
  const { setShowUserConfig, font, setFont, useSearch, setUseSearch, documentContent } = useUI();
  // Hooks to manage agent state (needed for updating agent color on theme change)
  const { current: agent, update: updateAgent } = useAgent();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * A placeholder function that currently just closes the modal.
   * Could be expanded in the future if client-side settings need more complex handling.
   */
  function updateClient() {
    setShowUserConfig(false);
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files) as File[]) {
        if (file.type !== 'application/pdf') continue;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }

        addPdfFile({
          name: file.name,
          text: fullText,
        });
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      alert('Failed to parse PDF. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <SettingsSheet onClose={() => setShowUserConfig(false)} title="Companion & Session">

      <div className="userSettings jazzy">
        <h2>Companion & Session Settings</h2>
        <p className="config-description">Personalize conversations, study sessions, document appearance, and your companion experience.</p>
        <ConversationMemorySettings />

        <form
          onSubmit={e => {
            e.preventDefault();
            setShowUserConfig(false);
            updateClient();
          }}
        >
          <div className="settings-grid">
            <div>
              <p>Your Name</p>
              <input
                type="text"
                name="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What do you like to be called?"
              />
            </div>

            <div>
              <p>Topic or Conversation Focus (Optional)</p>
              <input
                type="text"
                name="topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Chat, Japanese practice, mathematics, creative writing"
              />
            </div>
          </div>

          <div className="settings-grid">
            <div>
              <p>Document Font</p>
              <CustomDropdown
                value={font}
                options={FONT_OPTIONS}
                onChange={setFont}
                placeholder="Select a font"
              />
            </div>

            <div>
              <p>Voice Companion</p>
              <div className="companion-settings-display">
                <strong>{agent.name}</strong>
                <span>Choose another character from the companion menu at the top left.</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={useSearch}
                onChange={e => setUseSearch(e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Allow web search when helpful</span>
            </label>
          </div>

          <details style={{ marginTop: '15px' }}>
            <summary>About You (Optional)</summary>
            <div className="details-content">
              <p className="context-description">
                Share background details or preferences to help your companion respond more naturally.
              </p>
              <textarea
                rows={3}
                name="info"
                value={info}
                onChange={e => setInfo(e.target.value)}
                placeholder="e.g., names, facts, style preferences"
              />

              <div className="context-section" style={{ marginTop: '20px' }}>
                <p>PDF Context</p>
                <div className="pdf-upload-container">
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                  <button
                    type="button"
                    className="pdf-upload-button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <FileUp size={18} />
                    )}
                    <span>{isUploading ? 'Processing...' : 'Upload PDFs'}</span>
                  </button>

                  {pdfFiles.length > 0 && (
                    <div className="pdf-list">
                      {pdfFiles.map(file => (
                        <div key={file.name} className="pdf-item">
                          <FileText size={14} className="pdf-icon" />
                          <span className="pdf-name" title={file.name}>{file.name}</span>
                          <button
                            type="button"
                            className="pdf-remove"
                            onClick={() => removePdfFile(file.name)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </details>

          {documentContent === PLACEHOLDER_DOC && (
            <div>
              <p>Output Format</p>
              <div className="format-selector">
                {FORMAT_OPTIONS.map(f => (
                  <label key={f} className="format-option">
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      checked={format === f}
                      onChange={() => setFormat(f)}
                    />
                    <span>{f}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button className="button primary" style={{ marginTop: '20px' }}>Let’s go!</button>
        </form>
      </div>
    </SettingsSheet>
  );
}
