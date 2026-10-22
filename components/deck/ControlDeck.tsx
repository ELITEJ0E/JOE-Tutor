/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { usePerfLogStore, useUI, useUser, useAgent } from '../../lib/state';
import { AudioRecorder } from '../../lib/audio-recorder';
import { QUICK_TOPICS } from '../../lib/constants';
import {
  Mic,
  MicOff,
  Play,
  Square,
  Send,
  MessageSquare,
  Sparkles,
  HelpCircle,
  FileDown,
  LineChart,
  BookOpen,
  Volume2,
  ChevronUp,
  RotateCcw,
  Undo2,
  Redo2,
  Copy,
  Check,
  LoaderCircle,
  AudioLines,
  AlertCircle,
} from 'lucide-react';

export type ControlDeckProps = {
  onExportPdf?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

const USER_AUDIO_INPUT_DETECTION_THRESHOLD = 0.01;
const USER_TALKING_STATE_COOLDOWN_MS = 1500;

export default function ControlDeck({
  onExportPdf,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ControlDeckProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTopicDrawer, setShowTopicDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userMicLevel, setUserMicLevel] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const firstAudioChunkSentRef = useRef(false);
  const bufferedAudioRef = useRef<string[]>([]);

  const {
    showAgentEdit,
    showUserConfig,
    mainTab,
    setMainTab,
    documentContent,
    outputModality,
    setOutputModality,
    agentState,
  } = useUI();
  const { topic, setTopic } = useUser();
  const { current } = useAgent();
  const { addLog: addPerfLog } = usePerfLogStore();
  const { client, connected, connect, disconnect, isConnecting } = useLiveAPIContext();

  // Reset audio flags on disconnect
  useEffect(() => {
    if (!connected && !isConnecting) {
      firstAudioChunkSentRef.current = false;
      setUserMicLevel(0);
    }
  }, [connected, isConnecting]);

  // Monitor mic level and report meaningful voice activity for idle follow-ups.
  // This prevents companions from speaking over someone who's still talking.
  useEffect(() => {
    let lastVoiceEvent = 0;
    let voiceStartedAt = 0;
    const onVolume = (vol: number) => {
      setUserMicLevel(vol);
      const now = Date.now();
      if (!muted && connected && vol > 0.048) {
        if (!voiceStartedAt) voiceStartedAt = now;
        // A short sustained signal is more reliable than random mic noise
        // for postponing quiet-time companion prompts.
        if (now - voiceStartedAt >= 300 && now - lastVoiceEvent > 950) {
          lastVoiceEvent = now;
          window.dispatchEvent(new Event('joe:user-voice-activity'));
        }
      } else {
        voiceStartedAt = 0;
      }
    };

    audioRecorder.on('volume', onVolume);
    return () => {
      audioRecorder.off('volume', onVolume);
    };
  }, [audioRecorder, connected, muted]);

  // Disconnect if settings open
  useEffect(() => {
    if (showAgentEdit || showUserConfig) {
      if (connected) disconnect();
    }
  }, [showUserConfig, showAgentEdit, connected, disconnect]);

  // Manage Audio Pipeline
  useEffect(() => {
    const handleError = (e: any) => {
      console.error('Live API Error in ControlDeck:', e);
      bufferedAudioRef.current = [];
    };

    client.on('error', handleError);

    const onData = (base64: string) => {
      // Always deliver captured microphone PCM to Gemini Live when the mic is
      // enabled. UI speech/loading states are not reliable mic mute signals:
      // blocking them previously dropped real user speech (especially on mobile).
      // Browser echoCancellation/noiseSuppression handle playback echo instead.
      if (connected && !isConnecting) {
        if (bufferedAudioRef.current.length > 0) {
          bufferedAudioRef.current.forEach((data) => {
            client.sendRealtimeInput({
              media: {
                mimeType: 'audio/pcm;rate=24000',
                data,
              },
            });
          });
          bufferedAudioRef.current = [];
        }

        if (!firstAudioChunkSentRef.current) {
          addPerfLog({
            turn: 0,
            event: 'User Audio: First Chunk Sent',
            details: { size: base64.length },
          });
          firstAudioChunkSentRef.current = true;
        }

        client.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=24000',
            data: base64,
          },
        });
      } else if (isConnecting) {
        bufferedAudioRef.current.push(base64);
      }
    };

    let cancelled = false;
    if (connected && !isConnecting && !muted && audioRecorder) {
      audioRecorder.on('data', onData);
      void audioRecorder.start().then(() => {
        if (cancelled) void audioRecorder.stop();
      }).catch((err) => {
        console.error('Microphone start failed:', err);
        useUI.getState().setAgentState('Microphone unavailable');
      });
    } else {
      void audioRecorder.stop().catch(err => console.warn('Microphone stop failed:', err));
      bufferedAudioRef.current = [];
    }

    return () => {
      cancelled = true;
      client.off('error', handleError);
      audioRecorder.off('data', onData);
    };
  }, [connected, isConnecting, client, muted, audioRecorder, addPerfLog]);

  // Focus input
  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);

  const handleSendText = (promptToSend?: string) => {
    const text = promptToSend || textInput;
    if (text.trim() && connected) {
      window.dispatchEvent(new Event('joe:user-text-sent'));
      client.send({ text });
      if (!promptToSend) {
        // Keep the composer open for an uninterrupted text conversation.
        setTextInput('');
        inputRef.current?.focus();
      }
    }
  };

  const handleSelectTopic = (topicItem: (typeof QUICK_TOPICS)[0]) => {
    setTopic(topicItem.label);
    setShowTopicDrawer(false);

    if (connected) {
      client.send({
        text: `Let's focus on this topic: "${topicItem.label}". ${topicItem.prompt}`,
      });
    } else {
      connect();
    }
  };

  const handleQuickAction = (actionPrompt: string, targetTab?: typeof mainTab) => {
    if (targetTab) {
      setMainTab(targetTab);
    }
    if (connected) {
      client.send({ text: actionPrompt });
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(documentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="control-deck-footer">
      {/* Quick Action Chips Bar */}
      <div className="control-deck-chips-bar">
        <div className="chips-scroll-container">
          <button
            className="deck-chip-btn"
            onClick={() => setShowTopicDrawer(!showTopicDrawer)}
          >
            <Sparkles size={13} className="text-cherry-500" />
            <span>Topics ({topic || 'Select'})</span>
            <ChevronUp size={13} className={cn('chip-chevron', { open: showTopicDrawer })} />
          </button>

          <button
            className="deck-chip-btn"
            onClick={() =>
              handleQuickAction(
                'Please explain the core principles of what we are currently discussing step-by-step.'
              )
            }
          >
            <span>Explain Step-by-Step</span>
          </button>

          <button
            className="deck-chip-btn"
            onClick={() => {
              setMainTab('visuals');
              handleQuickAction(
                'Can you plot a mathematical graph of this concept and describe the curves?'
              );
            }}
          >
            <LineChart size={13} />
            <span>Plot Math Graph</span>
          </button>

          <button
            className="deck-chip-btn"
            onClick={() => {
              setMainTab('visuals');
              handleQuickAction(
                'Please generate a clear visual diagram illustrating the main process we are studying.'
              );
            }}
          >
            <span>Generate Diagram</span>
          </button>

          <button
            className="deck-chip-btn"
            onClick={() => {
              setMainTab('quiz');
              handleQuickAction(
                'Give me a challenging quiz question to test my understanding of what we just learned.'
              );
            }}
          >
            <HelpCircle size={13} />
            <span>Quiz Me</span>
          </button>

          <button
            className="deck-chip-btn"
            onClick={() => {
              setMainTab('minutes');
              handleQuickAction(
                'Summarize our session into structured study notes with key definitions and takeaways.'
              );
            }}
          >
            <BookOpen size={13} />
            <span>Summarize Notes</span>
          </button>
        </div>
      </div>

      {/* Topic Selection Drawer */}
      {showTopicDrawer && (
        <div className="deck-topics-drawer">
          <div className="drawer-header">
            <span className="drawer-title">Choose a Subject or Problem to Master:</span>
            <button
              className="drawer-close-btn"
              onClick={() => setShowTopicDrawer(false)}
            >
              ✕
            </button>
          </div>
          <div className="topics-grid">
            {QUICK_TOPICS.map((item) => (
              <button
                key={item.label}
                className={cn('topic-card-btn', { active: topic === item.label })}
                onClick={() => handleSelectTopic(item)}
              >
                <div className="topic-icon-wrap">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="topic-text-wrap">
                  <span className="topic-label">{item.label}</span>
                  <span className="topic-prompt-preview">{item.prompt}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Prompt Drawer */}
      {showTextInput && (
        <div className="deck-text-input-bar">
          <div className="text-input-inner">
            <input
              ref={inputRef}
              type="text"
              className="deck-input-field"
              placeholder={`Ask ${current.name.split(" (")[0]} anything…`}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendText();
                if (e.key === 'Escape') setShowTextInput(false);
              }}
            />
            <button
              className="deck-send-btn"
              onClick={() => handleSendText()}
              disabled={!textInput.trim() || !connected}
            >
              <Send size={15} />
              <span>Send</span>
            </button>
            <button
              className="deck-input-close"
              onClick={() => setShowTextInput(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Deck Controls Island */}
      <div className="control-deck-island">
        {/* Left Side: Document Quick Actions */}
        <div className="deck-group left">
          {onUndo && (
            <button
              className="deck-tool-btn"
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo last edit (Ctrl+Z)"
            >
              <Undo2 size={16} />
            </button>
          )}
          {onRedo && (
            <button
              className="deck-tool-btn"
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo edit (Ctrl+Y)"
            >
              <Redo2 size={16} />
            </button>
          )}
          <button
            className="deck-tool-btn"
            onClick={handleCopyNotes}
            title="Copy Study Notes"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
          {onExportPdf && (
            <button
              className="deck-tool-btn"
              onClick={onExportPdf}
              title="Export Study Packet (PDF)"
            >
              <FileDown size={16} />
              <span className="tool-btn-label">PDF</span>
            </button>
          )}
        </div>

        {/* Center: Hero Action Button (Connect / Stop) */}
        <div className="deck-group center">
          <button
            id="tutor-session-action"
            type="button"
            aria-label={connected ? 'Pause active voice session' : 'Start a voice session with your tutor'}
            className={cn('hero-connect-button', {
              'is-connected': connected,
              'is-connecting': isConnecting,
            })}
            onClick={() => {
              if (connected) {
                disconnect();
              } else {
                connect();
              }
            }}
            disabled={isConnecting}
            title={connected ? 'Pause Session' : 'Start Session with JOE Tutor'}
          >
            <div className="hero-button-inner">
              {isConnecting ? (
                <div className="hero-spinner" />
              ) : connected ? (
                <>
                  <Square size={18} className="fill-current" />
                  <span className="hero-button-text">Pause Session</span>
                </>
              ) : (
                <>
                  <Play size={20} className="fill-current translate-x-0.5" />
                  <span className="hero-button-text">Start Tutoring</span>
                </>
              )}
            </div>
            {/* Live pulsating ring when connected */}
            {connected && <div className="hero-pulse-ring" />}
          </button>
        </div>

        {/* Live response status: distinguish listening, generating and audible speech. */}
        {connected && (
          <div className="joe-voice-state" role="status" aria-live="polite" aria-label={agentState === 'Fish Audio unavailable' ? 'Fish Audio voice is unavailable' : agentState === 'Speaking' ? 'Companion speaking' : agentState === 'Thinking' ? 'Companion preparing a reply' : 'Listening'}>
            {agentState === 'Thinking' ? (
              <><LoaderCircle size={16} className="joe-voice-spinner" /><span>Composing reply…</span></>
            ) : agentState === 'Generating voice' ? (
              <><LoaderCircle size={16} className="joe-voice-spinner" /><span>Preparing voice…</span></>
            ) : agentState === 'Speaking' ? (
              <><span className="joe-voice-bars" aria-hidden="true"><i /><i /><i /><i /><i /></span><span>Speaking</span></>
            ) : agentState === 'Fish Audio unavailable' ? (
              <><AlertCircle size={16} /><span>Fish Audio unavailable</span></>
            ) : (
              <><AudioLines size={16} /><span>{agentState === 'Listening' ? 'Listening…' : 'Ready to listen'}</span></>
            )}
          </div>
        )}

        {/* Right Side: Mic & Modality */}
        <div className="deck-group right">
          {/* Mic Mute Toggle with live level indicator */}
          <button
            className={cn('deck-tool-btn mic-btn', {
              'is-muted': muted,
              'is-active': connected && !muted,
            })}
            onClick={() => setMuted(!muted)}
            disabled={!connected}
            title={muted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {muted ? (
              <MicOff size={18} className="text-cherry-500" />
            ) : (
              <div className="mic-icon-wrap">
                <Mic size={18} />
                {connected && !muted && (
                  <span
                    className="mic-level-dot"
                    style={{
                      transform: `scale(${1 + Math.min(userMicLevel * 10, 2)})`,
                    }}
                  />
                )}
              </div>
            )}
            <span className="tool-btn-label">{muted ? 'Muted' : 'Mic'}</span>
          </button>

          {/* Type / Text Toggle */}
          <button
            className={cn('deck-tool-btn', { active: showTextInput })}
            onClick={() => setShowTextInput(!showTextInput)}
            title="Type a message or formula to tutor"
          >
            <MessageSquare size={17} />
            <span className="tool-btn-label">Text</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
