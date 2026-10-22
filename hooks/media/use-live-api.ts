/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState, MutableRefObject } from 'react';
import { GenAILiveClient } from '../../lib/genai-live-client';
import { LiveConnectConfig } from '@google/genai';
import { AudioStreamer } from '../../lib/audio-streamer';
import { audioContext } from '../../lib/utils';
import VolMeterWorket from '../../lib/worklets/vol-meter';
import { DEFAULT_LIVE_API_MODEL } from '../../lib/constants';
import { useAgent, usePerfLogStore, useUI } from '../../lib/state';

/**
 * The shape of the object returned by the `useLiveApi` hook.
 * It provides access to the API client, its configuration, connection state,
 * and control functions.
 */
export type UseLiveApiResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  connect: () => Promise<void>;
  disconnect: () => void;
  connected: boolean;
  isConnecting: boolean;
  stopAudio: () => void;
  volumeRef: MutableRefObject<number>;
  audioStreamerRef: MutableRefObject<AudioStreamer | null>;
  setMuted: (muted: boolean) => void;
  isFishVoiceActive: () => boolean;
  speakFishGreeting: (text: string) => Promise<boolean>;
};

/**
 * A comprehensive hook for managing the entire lifecycle of a GenAI Live API connection.
 * It encapsulates the client initialization, audio streaming setup, connection management,
 * and event handling.
 *
 * @param apiKey The Google AI API key.
 * @param model The specific model to use for the connection.
 * @returns An object containing the client instance, state, and control functions.
 */
export function useLiveApi({
  apiKey,
  model = DEFAULT_LIVE_API_MODEL,
}: {
  apiKey: string;
  model?: string;
}): UseLiveApiResults {
  // The GenAILiveClient is memoized to ensure a single, stable instance is used
  // throughout the component's lifecycle, preventing unnecessary reconnections.
  const client = useMemo(
    () => new GenAILiveClient(apiKey, model),
    [apiKey, model]
  );

  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const fishMode = useRef<'mei' | 'hao_zh' | null>(null);
  const fishText = useRef('');
  const fishController = useRef<AbortController | null>(null);
  const fishPlayer = useRef<HTMLAudioElement | null>(null);
  const fishAudioUrl = useRef<string | null>(null);
  const fishGeneration = useRef(0);
  const isFishVoiceActive = useCallback(() => fishMode.current !== null, []);

  const stopFish = useCallback(() => {
    fishGeneration.current += 1;
    fishController.current?.abort();
    fishController.current = null;
    fishPlayer.current?.pause();
    useUI.getState().setAgentState(null);
    fishPlayer.current = null;
    if (fishAudioUrl.current) URL.revokeObjectURL(fishAudioUrl.current);
    fishAudioUrl.current = null;
    fishText.current = '';
  }, []);


  // Play exactly the supplied words, without Gemini speech transcription.
  // One Fish request owns the whole utterance; the MP3 remains alive until onended.
  const speakFishGreeting = useCallback(async (text: string): Promise<boolean> => {
    const character = fishMode.current;
    if (!character || !text.trim()) return false;
    const spokenText = text.trim();
    const generation = ++fishGeneration.current;
    fishController.current?.abort();
    fishController.current = null;
    fishPlayer.current?.pause();
    fishPlayer.current = null;
    if (fishAudioUrl.current) URL.revokeObjectURL(fishAudioUrl.current);
    fishAudioUrl.current = null;
    const controller = new AbortController();
    fishController.current = controller;
    useUI.getState().setAgentState('Thinking');
    try {
      const response = await fetch('/api/fish-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, text: spokenText }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Fish Audio request failed (' + response.status + ')');
      const blob = await response.blob();
      if (generation !== fishGeneration.current || !blob.size) return false;
      const objectUrl = URL.createObjectURL(blob);
      const player = new Audio(objectUrl);
      fishAudioUrl.current = objectUrl;
      fishPlayer.current = player;
      player.onplaying = () => {
        if (generation === fishGeneration.current) useUI.getState().setAgentState('Speaking');
      };
      player.onended = () => {
        if (generation !== fishGeneration.current) return;
        useUI.getState().setAgentState('Waiting');
        if (fishAudioUrl.current === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          fishAudioUrl.current = null;
          fishPlayer.current = null;
        }
      };
      player.onerror = () => {
        if (generation !== fishGeneration.current) return;
        useUI.getState().setAgentState('Fish Audio unavailable');
        if (fishAudioUrl.current === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          fishAudioUrl.current = null;
          fishPlayer.current = null;
        }
      };
      await player.play();
      addPerfLog({ turn: 0, event: 'Fish Audio: Complete direct greeting submitted', details: { character, characters: spokenText.length } });
      return true;
    } catch (error) {
      if (controller.signal.aborted || generation !== fishGeneration.current) return false;
      console.error('Fish Audio voice playback failed:', error);
      useUI.getState().setAgentState('Fish Audio unavailable');
      return false;
    } finally {
      if (fishController.current === controller) fishController.current = null;
    }
  }, []);

  const volumeRef = useRef(0);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const { addLog: addPerfLog } = usePerfLogStore();

  // This effect sets up the AudioStreamer for handling audio playback from the server.
  // It also adds an AudioWorklet to measure the output volume, which is used for UI animations.
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: 'audio-out' }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        // Add a volume meter worklet to the audio pipeline.
        audioStreamerRef.current
          .addWorklet<any>('vumeter-out', VolMeterWorket, (ev: any) => {
            volumeRef.current = ev.data.volume;
          })
          .catch(err => {
            console.error('Error adding volume meter worklet:', err);
          });
      });
    }
  }, [audioStreamerRef]);

  // This is the core effect for binding to events from the GenAILiveClient.
  // It translates client events into state updates and actions (like playing audio).
  useEffect(() => {
    const onOpen = () => {
      addPerfLog({ turn: 0, event: 'Live API: WebSocket Opened' });
      setIsConnecting(true);
    };
    const onClose = () => {
      setConnected(false);
      setIsConnecting(false);
      stopFish();
      fishMode.current = null;
    };
    const onSetupComplete = () => {
      addPerfLog({ turn: 0, event: 'Live API: Setup Complete' });
      setConnected(true);
    };
    const stopAudioStreamer = () => {
      // The voice output is already safely gated from microphone input while
      // synthesizing or speaking. Ignore stray Live interruptions in that period.
      if (fishMode.current && (fishController.current || (fishPlayer.current && !fishPlayer.current.paused))) return;
      audioStreamerRef.current?.stop();
      stopFish();
    };

    const onOutputTranscription = (text: string) => {
      if (fishMode.current) fishText.current += text;
    };
    const onTurnComplete = async () => {
      const character = fishMode.current;
      const text = fishText.current.trim();
      fishText.current = '';
      if (!character || isMuted) return;

      // Don't silently replace a Mandarin character with Gemini's different voice.
      if (!text) {
        useUI.getState().setAgentState('Fish Audio unavailable');
        console.warn('Fish Audio: no complete output transcription for this turn.');
        return;
      }
      await speakFishGreeting(text.slice(0, 1200));
    };

    // When the client receives audio data, it's passed to the AudioStreamer for playback.
    const onAudio = (data: ArrayBuffer) => {
      if (isMuted || client.suppressPlayback) return;
      // Never play Gemini's voice for Mandarin Fish characters, even when
      // the endpoint is unavailable. Report the configuration error instead.
      const activeId = useAgent.getState().current.id;
      if (activeId === 'mei' || activeId === 'hao_zh') return;
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    };

    // Bind event listeners.
    client.on('open', onOpen);
    client.on('close', onClose);
    client.on('interrupted', stopAudioStreamer);
    client.on('audio', onAudio);
    client.on('setupcomplete', onSetupComplete);
    client.on('outputTranscription', onOutputTranscription);
    client.on('turncomplete', onTurnComplete);

    // Clean up event listeners on component unmount to prevent memory leaks.
    return () => {
      client.off('open', onOpen);
      client.off('close', onClose);
      client.off('interrupted', stopAudioStreamer);
      client.off('audio', onAudio);
      client.off('setupcomplete', onSetupComplete);
      client.off('outputTranscription', onOutputTranscription);
      client.off('turncomplete', onTurnComplete);
      stopFish();
      client.disconnect();
    };
  }, [client, addPerfLog, isMuted, stopFish, speakFishGreeting]);

  /**
   * Initiates a connection to the Live API using the currently stored configuration.
   */
  const connect = useCallback(async () => {
    if (!config) {
      throw new Error('Live API configuration has not been set.');
    }
    setIsConnecting(true);
    stopFish();
    fishMode.current = null;
    // Only enable Fish when the Vercel proxy confirms both API key and authorized voice ID.
    const id = useAgent.getState().current.id;
    if (id === 'mei' || id === 'hao_zh') {
      try {
        const response = await fetch(`/api/fish-tts?character=${id}`);
        if (response.ok && (await response.json()).enabled) fishMode.current = id;
        else {
          console.error('Fish Audio is not configured for ' + id + ' in this deployment.');
          useUI.getState().setAgentState('Fish Audio unavailable');
        }
      } catch {
        console.error('Fish Audio backend is missing or unreachable. Check /api/fish-tts in the deployed app.');
        useUI.getState().setAgentState('Fish Audio unavailable');
      }
    }
    addPerfLog({ turn: 0, event: 'Live API: Connecting...' });
    
    try {
      // GenAILiveClient.connect catches errors and returns a boolean indicating success.
      // We await the full connection process (which implies the session object is assigned)
      // before we update the state to stop 'connecting'.
      await client.connect(config);
    } finally {
      setIsConnecting(false);
    }
  }, [client, config, addPerfLog, stopFish]);

  /**
   * Disconnects from the Live API and stops any ongoing audio playback.
   */
  const disconnect = useCallback(async () => {
    client.disconnect();
    setConnected(false);
    setIsConnecting(false);
    audioStreamerRef.current?.stop();
    stopFish();
    fishMode.current = null;
  }, [setConnected, setIsConnecting, client, stopFish]);

  /**
   * Immediately stops audio playback without disconnecting the session.
   * This is used for handling interruptions.
   */
  const stopAudio = useCallback(() => {
    audioStreamerRef.current?.stop();
    stopFish();
  }, [stopFish]);

  return useMemo(() => ({
    client,
    config,
    setConfig,
    connect,
    connected,
    isConnecting,
    disconnect,
    volumeRef,
    audioStreamerRef,
    stopAudio,
    setMuted: setIsMuted,
    isFishVoiceActive,
    speakFishGreeting,
  }), [client, config, setConfig, connect, connected, isConnecting, disconnect, volumeRef, audioStreamerRef, stopAudio, setIsMuted, isFishVoiceActive, speakFishGreeting]);
}
