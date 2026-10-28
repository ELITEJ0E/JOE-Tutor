/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import SettingsSheet from './SettingsSheet';
import ConversationMemorySettings from './ConversationMemorySettings';
import InstallAppSettings from './InstallAppSettings';
import { LANGUAGE_OPTIONS, NOTES_LANGUAGE_OPTIONS, LanguagePreference, NotesLanguage } from '../lib/language-preferences';
import { UiLanguage, UI_LANGUAGE_OPTIONS } from '../lib/ui-i18n';
import SettingsDropdown from './SettingsDropdown';
import { useUiTranslation } from '../hooks/use-ui-translation';
import './companion-settings.css';
import { useAgent, useUI, useUser } from '../lib/state';
import { Theme, themes } from '../lib/themes';
import { FONT_OPTIONS, PLACEHOLDER_DOC } from '../lib/constants';
import React, { useState, useRef } from 'react';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { FileUp, X, FileText, Loader2 } from 'lucide-react';

// PDF parsing loads on demand; its worker is served locally by Vite.

type FormatOption = 'Markdown' | 'HTML';
const FORMAT_OPTIONS: FormatOption[] = ['Markdown', 'HTML'];

/**
 * A modal for configuring user settings for the writing session.
 * It features a modern, "jazzy" design for a more engaging user experience.
 */
export default function UserSettings() {
  // Hooks to manage user-specific data (name, info, topic, etc.)
  const { name, info, topic, format, setName, setInfo, setTopic, setFormat, pdfFiles, addPdfFile, removePdfFile } =
    useUser();
  // Hooks to manage UI state (modal visibility, current theme)
  const { setShowUserConfig, font, setFont, useSearch, setUseSearch, documentContent, conversationLanguage, setConversationLanguage, notesLanguage, setNotesLanguage, uiLanguage, setUiLanguage } = useUI();
  const t = useUiTranslation();
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
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
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
    <SettingsSheet onClose={() => setShowUserConfig(false)} title={t("Companion & Session")}>

      <div className="userSettings jazzy">
        <h2>{t("Companion & Session Settings")}</h2>
        <p className="config-description">Personalize conversations, study sessions, document appearance, and your companion experience.</p>
        <section className="joe-language-prefs" aria-label="Saved language preferences">
          <div className="joe-prefs-heading">
            <h3>{t("Language preferences")}</h3>
            <p>{t("Saved automatically on this device. Your companion's voice and personality stay the same.")}</p>
          </div>
          <div className="joe-language-fields">
            <div className="joe-language-field">
              <label htmlFor="joe-ui-language">{t('App language')}</label>
              <SettingsDropdown
                id="joe-ui-language"
                label={t('App language')}
                value={uiLanguage}
                options={UI_LANGUAGE_OPTIONS}
                onChange={value => setUiLanguage(value as UiLanguage)}
              />
            </div>
            <div className="joe-language-field">
              <label htmlFor="joe-conversation-language">{t('Conversation & spoken replies')}</label>
              <SettingsDropdown
                id="joe-conversation-language"
                label={t('Conversation & spoken replies')}
                value={conversationLanguage}
                options={LANGUAGE_OPTIONS.map(option => ({
                  value: option.id,
                  label: option.id === 'companion' ? t('Companion default') : option.id === 'auto' ? t('Match my language') : option.label,
                }))}
                onChange={value => setConversationLanguage(value as LanguagePreference)}
              />
            </div>
            <div className="joe-language-field">
              <label htmlFor="joe-notes-language">{t('Notes & study materials')}</label>
              <SettingsDropdown
                id="joe-notes-language"
                label={t('Notes & study materials')}
                value={notesLanguage}
                options={NOTES_LANGUAGE_OPTIONS.map(option => ({ value: option.id, label: option.label }))}
                onChange={value => setNotesLanguage(value as NotesLanguage)}
              />
            </div>
          </div>
          <p className="joe-prefs-footer" role="status" aria-live="polite">
            {t('App language')}: <strong>{UI_LANGUAGE_OPTIONS.find(option => option.id === uiLanguage)?.label || uiLanguage}</strong>
          </p>
          <p className="joe-prefs-footer">{t('App menus now switch languages immediately. Speech and notes languages are separate.')}</p>
          <p className="joe-prefs-footer">{t('A new voice session will use the selected speech language. Existing notes stay unchanged.')}</p>
        </section>
        <InstallAppSettings />
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
              <p>{t("Your Name")}</p>
              <input
                type="text"
                name="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="What do you like to be called?"
              />
            </div>

            <div>
              <p>{t("Topic or Conversation Focus (Optional)")}</p>
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
              <p>{t("Document Font")}</p>
              <SettingsDropdown
                label={t('Document Font')}
                value={font}
                options={FONT_OPTIONS}
                onChange={setFont}
                placeholder={t('Select a font')}
              />
            </div>

            <div>
              <p>{t("Voice Companion")}</p>
              <div className="companion-settings-display">
                <strong>{agent.name}</strong>
                <span>{t("Choose another character from the companion menu at the top left.")}</span>
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
              <span>{t("Allow web search when helpful")}</span>
            </label>
          </div>

          <details style={{ marginTop: '15px' }}>
            <summary>{t("About You (Optional)")}</summary>
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
                <p>{t("PDF Context")}</p>
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
                    <span>{isUploading ? t('Processing...') : t('Upload PDFs')}</span>
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
              <p>{t("Output Format")}</p>
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

          <button className="button primary" style={{ marginTop: '20px' }}>{t('Let’s go!')}</button>
        </form>
      </div>
    </SettingsSheet>
  );
}
