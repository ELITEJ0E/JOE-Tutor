/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';
import {
  Agent,
  ChloeTutor,
  JoeTutor,
  Alice,
  Amelie,
  Ari,
  Hans,
  Hiro,
  Irene,
  Yuna,
  Jiwon,
  XiaoYuTaiwan,
  Nicha,
  Luca,
  TianXiWei,
  Newton,
  Olga,
  Rahul,
  Ramon,
  Sam,
  Tom,
  Ethan, Joon, Haruka, Hao, YuChen, Niran, Anika, Sofia, Julien, Noa, Lena, Maxim, Marco, Ada,
} from './presets/agents';
import { themes } from './themes';
import { LanguagePreference, NotesLanguage, readLanguagePreference, saveLanguagePreference } from './language-preferences';
import { UiLanguage, UI_LANGUAGE_OPTIONS } from './ui-i18n';
import { FONT_OPTIONS, PLACEHOLDER_DOC } from './constants';

/**
 * ===================================================================
 *  ZUSTAND STATE MANAGEMENT
 * ===================================================================
 * This file centralizes the application's global state using Zustand.
 * Each "slice" of the state is managed by its own store.
 * ===================================================================
 */

/**
 * `useUser` Store
 * Manages all settings and context related to the end-user.
 */
export type PdfFile = {
  name: string;
  text: string;
};

export type User = {
  name?: string;
  info?: string;
  topic?: string;
  format: 'Markdown' | 'HTML';
  pdfFiles: PdfFile[];
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setInfo: (info: string) => void;
    setTopic: (topic: string) => void;
    setFormat: (format: 'Markdown' | 'HTML') => void;
    addPdfFile: (file: PdfFile) => void;
    removePdfFile: (name: string) => void;
    clearPdfFiles: () => void;
  } & User
>(set => ({
  name: '',
  info: '',
  topic: '',
  format: 'Markdown',
  pdfFiles: [],
  setName: name => set({ name }),
  setInfo: info => set({ info }),
  setTopic: topic => set({ topic }),
  setFormat: format => set({ format }),
  addPdfFile: file => set(state => ({ pdfFiles: [...state.pdfFiles, file] })),
  removePdfFile: name => set(state => ({ pdfFiles: state.pdfFiles.filter(f => f.name !== name) })),
  clearPdfFiles: () => set({ pdfFiles: [] }),
}));

/**
 * `useAgent` Store
 * Manages the state of the AI agents, including the currently active agent
 * and the list of available agents.
 */
function getAgentById(id: string) {
  const { availablePersonal, availablePresets } = useAgent.getState();
  return (
    availablePersonal.find(agent => agent.id === id) ||
    availablePresets.find(agent => agent.id === id)
  );
}

export const useAgent = create<{
  current: Agent;
  availablePresets: Agent[];
  availablePersonal: Agent[];
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (agentId: string, adjustments: Partial<Agent>) => void;
}>(set => ({
  current: ChloeTutor,
  availablePresets: [
    // English
    ChloeTutor, Alice, Irene, Sam, Tom, Ethan,
    // Korean, Japanese, Taiwanese Mandarin, Thai and Mandarin
    Yuna, Joon, Haruka, Hiro, XiaoYuTaiwan, YuChen, Nicha, Niran, TianXiWei, Hao,
    // Additional languages
    Rahul, Anika, Ramon, Sofia, Amelie, Julien, Ari, Noa,
    Hans, Lena, Newton, Ada, Olga, Maxim, Luca, Marco,
  ],
  availablePersonal: [],

  addAgent: (agent: Agent) => {
    set(state => ({
      availablePersonal: [...state.availablePersonal, agent],
      current: agent,
    }));
  },
  setCurrent: (agent: Agent | string) =>
    set({ current: typeof agent === 'string' ? getAgentById(agent) : agent }),
  update: (agentId: string, adjustments: Partial<Agent>) => {
    let agent = getAgentById(agentId);
    if (!agent) return;
    const updatedAgent = { ...agent, ...adjustments };
    set(state => ({
      availablePresets: state.availablePresets.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      availablePersonal: state.availablePersonal.map(a =>
        a.id === agentId ? updatedAgent : a
      ),
      current: state.current.id === agentId ? updatedAgent : state.current,
    }));
  },
}));

/**
 * `useUI` Store
 * Manages the state of the user interface, such as the visibility of modals,
 * the selected theme, and other UI-related flags.
 */
export type TutorSection = 'home' | 'live-tutor' | 'materials' | 'notes' | 'study-tools' | 'history' | 'settings';

export const useUI = create<{
  activeSection: TutorSection;
  setActiveSection: (section: TutorSection) => void;
  selectedTutorModalAgent: Agent | null;
  setSelectedTutorModalAgent: (agent: Agent | null) => void;
  showWelcomeScreen: boolean;
  setShowWelcomeScreen: (show: boolean) => void;
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
  showDebugModal: boolean;
  setShowDebugModal: (show: boolean) => void;
  showHelpModal: boolean;
  setShowHelpModal: (show: boolean) => void;
  showDisclaimer: boolean;
  setShowDisclaimer: (show: boolean) => void;
  theme: string;
  setTheme: (themeName: string) => void;
  font: string;
  setFont: (fontName: string) => void;
  uiLanguage: UiLanguage;
  setUiLanguage: (language: UiLanguage) => void;
  conversationLanguage: LanguagePreference;
  setConversationLanguage: (language: LanguagePreference) => void;
  notesLanguage: NotesLanguage;
  setNotesLanguage: (language: NotesLanguage) => void;
  suppressRedundantLogs: boolean;
  setSuppressRedundantLogs: (suppress: boolean) => void;
  suppressStaleAgentResponses: boolean;
  setSuppressStaleAgentResponses: (suppress: boolean) => void;
  suppressPostFlushAudio: boolean;
  setSuppressPostFlushAudio: (suppress: boolean) => void;
  changeCount: number;
  incrementChangeCount: () => void;
  agentState: string | null;
  setAgentState: (state: string | null) => void;
  mainTab: 'document' | 'transcript' | 'minutes' | 'audio-log' | 'visuals' | 'quiz';
  setMainTab: (tab: 'document' | 'transcript' | 'minutes' | 'audio-log' | 'visuals' | 'quiz') => void;
  documentTab: 'editor' | 'rendered';
  setDocumentTab: (tab: 'editor' | 'rendered') => void;
  speechBubbleText: string | null;
  setSpeechBubbleText: (text: string | null) => void;
  documentContent: string;
  setDocumentContent: (content: string | ((prev: string) => string)) => void;
  outputModality: 'audio' | 'text' | 'both';
  setOutputModality: (modality: 'audio' | 'text' | 'both') => void;
  useSearch: boolean;
  setUseSearch: (useSearch: boolean) => void;
  liveApiModel: string;
  setLiveApiModel: (model: string) => void;
}>(set => ({
  activeSection: 'home',
  setActiveSection: (section: TutorSection) => set({ activeSection: section }),
  selectedTutorModalAgent: null,
  setSelectedTutorModalAgent: (agent: Agent | null) => set({ selectedTutorModalAgent: agent }),
  showWelcomeScreen: true,
  setShowWelcomeScreen: (show: boolean) => set({ showWelcomeScreen: show }),
  showUserConfig: false,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
  showDebugModal: false,
  setShowDebugModal: (show: boolean) => set({ showDebugModal: show }),
  showHelpModal: false,
  setShowHelpModal: (show: boolean) => set({ showHelpModal: show }),
  showDisclaimer: false,
  setShowDisclaimer: (show: boolean) => set({ showDisclaimer: show }),
  theme: themes[0].name,
  setTheme: (themeName: string) => set({ theme: themeName }),
  font: 'Plus Jakarta Sans',
  setFont: (fontName: string) => set({ font: fontName }),
  uiLanguage: (() => {
    try {
      const saved = window.localStorage.getItem('joe-tutor:ui-language');
      return UI_LANGUAGE_OPTIONS.find(option => option.id === saved)?.id || 'en';
    } catch { return 'en'; }
  })(),
  setUiLanguage: (language: UiLanguage) => {
    try { window.localStorage.setItem('joe-tutor:ui-language', language); }
    catch { /* Storage may be blocked. */ }
    set({ uiLanguage: language });
  },
  conversationLanguage: readLanguagePreference('joe-tutor:conversation-language', 'companion'),
  setConversationLanguage: (language: LanguagePreference) => {
    saveLanguagePreference('joe-tutor:conversation-language', language);
    set({ conversationLanguage: language });
  },
  notesLanguage: readLanguagePreference('joe-tutor:notes-language', 'en') as NotesLanguage,
  setNotesLanguage: (language: NotesLanguage) => {
    saveLanguagePreference('joe-tutor:notes-language', language);
    set({ notesLanguage: language });
  },
  suppressRedundantLogs: false, // Default to OFF
  setSuppressRedundantLogs: (suppress: boolean) =>
    set({ suppressRedundantLogs: suppress }),
  suppressStaleAgentResponses: false, // Default to OFF to prevent double-speaking
  setSuppressStaleAgentResponses: (suppress: boolean) =>
    set({ suppressStaleAgentResponses: suppress }),
  suppressPostFlushAudio: true, // Default to ON
  setSuppressPostFlushAudio: (suppress: boolean) =>
    set({ suppressPostFlushAudio: suppress }),
  changeCount: 0,
  incrementChangeCount: () =>
    set(state => ({ changeCount: state.changeCount + 1 })),
  agentState: null,
  setAgentState: (state: string | null) => set({ agentState: state }),
  mainTab: 'document',
  setMainTab: (tab: 'document' | 'transcript' | 'minutes' | 'audio-log') => set({ mainTab: tab }),
  documentTab: 'rendered',
  setDocumentTab: (tab: 'editor' | 'rendered') => set({ documentTab: tab }),
  speechBubbleText: null,
  setSpeechBubbleText: (text: string | null) => set({ speechBubbleText: text }),
  documentContent: PLACEHOLDER_DOC,
  setDocumentContent: (content: string | ((prev: string) => string)) =>
    set(state => ({
      documentContent:
        typeof content === 'function' ? content(state.documentContent) : content,
    })),
  outputModality: 'audio',
  setOutputModality: (modality: 'audio' | 'text' | 'both') => set({ outputModality: modality }),
  useSearch: false,
  setUseSearch: (useSearch: boolean) => set({ useSearch }),
  liveApiModel: 'gemini-2.5-flash-native-audio-preview-09-2025',
  setLiveApiModel: (model: string) => set({ liveApiModel: model }),
}));

/**
 * `useLogStore` Store
 * Manages a rolling list of log entries for the debug modal.
 */
export type LogEntry = {
  timestamp: Date;
  endTimestamp?: Date;
  turn?: number;
  api: string;
  inputSize: number | string;
  outputSize: number | string;
  status: 'success' | 'error';
  error?: string;
  prompt?: string;
  response?: string;
  audioSize?: number;
  audioBlob?: Blob;
  promptVersion?: number;
};

const MAX_LOG_ENTRIES = 50;

export const useLogStore = create<{
  logs: LogEntry[];
  suppressedLogs: LogEntry[];
  suppressedAudioCount: number;
  addLog: (log: Omit<LogEntry, 'timestamp'> & { timestamp?: Date }) => void;
  addSuppressedLog: (log: Omit<LogEntry, 'timestamp'> & { timestamp?: Date }) => void;
  incrementSuppressedAudioCount: () => void;
}>(set => ({
  logs: [],
  suppressedLogs: [],
  suppressedAudioCount: 0,
  addLog: log => {
    set(state => {
      const { timestamp, ...rest } = log;
      const newLog: LogEntry = { ...rest, timestamp: timestamp || new Date() };
      const updatedLogs = [newLog, ...state.logs];
      // Keep the log array from growing indefinitely.
      if (updatedLogs.length > MAX_LOG_ENTRIES) {
        updatedLogs.pop();
      }
      // Sort logs by timestamp descending (latest first)
      updatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return { logs: updatedLogs };
    });
  },
  addSuppressedLog: log => {
    set(state => {
      const { timestamp, ...rest } = log;
      const newLog: LogEntry = { ...rest, timestamp: timestamp || new Date() };
      const updatedLogs = [newLog, ...state.suppressedLogs];
      if (updatedLogs.length > MAX_LOG_ENTRIES) {
        updatedLogs.pop();
      }
      updatedLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return { suppressedLogs: updatedLogs };
    });
  },
  incrementSuppressedAudioCount: () =>
    set(state => ({ suppressedAudioCount: state.suppressedAudioCount + 1 })),
}));

/**
 * `usePerfLogStore` Store
 * Manages a rolling list of high-precision performance log entries for debugging latency.
 */
export type PerfLogEntry = {
  timestamp: number; // For display (Date.now())
  perfTimestamp: number; // For calculation (performance.now())
  sessionId: string;
  turn: number;
  event: string;
  delta?: number; // Time in ms since the previous performance log entry
  details?: any;
};

const MAX_PERF_LOG_ENTRIES = 200;

export const usePerfLogStore = create<{
  logs: PerfLogEntry[];
  sessionId: string | null;
  startNewSession: () => void;
  addLog: (log: Omit<PerfLogEntry, 'timestamp' | 'perfTimestamp' | 'delta' | 'sessionId'>) => void;
  clearLogs: () => void;
}>(set => ({
  logs: [],
  sessionId: null,
  startNewSession: () => set({ sessionId: `session_${Date.now()}` }),
  addLog: log => {
    set(state => {
      const nowPerf = performance.now();
      const nowReal = Date.now();
      const lastLog = state.logs[0];
      // Find the last log with the same session ID to calculate delta correctly
      const lastLogThisSession = state.logs.find(l => l.sessionId === state.sessionId);
      const delta = lastLogThisSession ? nowPerf - lastLogThisSession.perfTimestamp : undefined;

      const newLog: PerfLogEntry = {
        ...log,
        timestamp: nowReal,
        perfTimestamp: nowPerf,
        delta,
        sessionId: state.sessionId || 'session_unknown',
      };
      const updatedLogs = [newLog, ...state.logs];
      if (updatedLogs.length > MAX_PERF_LOG_ENTRIES) {
        updatedLogs.pop();
      }
      return { logs: updatedLogs };
    });
  },
  clearLogs: () => set({ logs: [], sessionId: null }),
}));


/**
 * Represents the state of a dynamic insert (like an image) in the document.
 */
export interface Insert {
  id: string; // The unique ID matching the placeholder tag, e.g., "img_12345"
  type: 'image'; // The type of insert.
  prompt: string; // The initial request, e.g., "a cat in a hat"
  status: 'loading' | 'done' | 'error'; // The current state
  data?: string | null; // The final data for rendering (e.g., base64 string for images)
  error?: string; // An error message, if applicable
}


/**
 * `useInsertStore` Store
 * Manages the state of all dynamic inserts within the document.
 */
export const useInsertStore = create<{
  inserts: Insert[];
  addInsert: (insert: Insert) => void;
  updateInsert: (id: string, updates: Partial<Insert>) => void;
  clearInserts: () => void;
}>(set => ({
  inserts: [],
  addInsert: (insert: Insert) =>
    set(state => ({ inserts: [...state.inserts, insert] })),
  updateInsert: (id: string, updates: Partial<Insert>) =>
    set(state => ({
      inserts: state.inserts.map(insert =>
        insert.id === id ? { ...insert, ...updates } : insert
      ),
    })),
  clearInserts: () => set({ inserts: [] }),
}));