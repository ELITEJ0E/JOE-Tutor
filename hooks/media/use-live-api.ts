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
import { useAgent, usePerfLogStore } from '../../lib/state';

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
  const fishFallbackAudio = useRef<ArrayBuffer[]>([]);
  const fishController = useRef<AbortController | null>(null);
  const fishPlayer = useRef<HTMLAudioElement | null>(null);
  const fishAudioUrl = useRef<string | null>(null);
  const fishGeneration = useRef(0);

  const stopFish = useCallback(() => {
    fishGeneration.current += 1;
    fishController.current?.abort();
    fishController.current = null;
    fishPlayer.current?.pause();
    fishPlayer.current = null;
    if (fishAudioUrl.current) URL.revokeObjectURL(fishAudioUrl.current);
    fishAudioUrl.current = null;
    fishText.current = '';
    fishFallbackAudio.current = [];
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
      audioStreamerRef.current?.stop();
      stopFish();
    };

    const onOutputTranscription = (text: string) => {
      if (fishMode.current) fishText.current += text;
    };
    const onTurnComplete = async () => {
      const character = fishMode.current;
      const text = fishText.current.trim();
      const pcm = fishFallbackAudio.current;
      fishText.current = '';
      fishFallbackAudio.current = [];
      if (!character || isMuted) return;
      if (!text) {
        pcm.forEach(chunk => audioStreamerRef.current?.addPCM16(new Uint8Array(chunk)));
        return;
      }
      const generation = ++fishGeneration.current;
      const controller = new AbortController();
      fishController.current = controller;
      try {
        const response = await fetch('/api/fish-tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ character, text: text.slice(0, 1200) }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Fish Audio unavailable');
        const audioBlob = await response.blob();
        if (generation !== fishGeneration.current || !audioBlob.size) return;
        const objectUrl = URL.createObjectURL(audioBlob);
        fishAudioUrl.current = objectUrl;
        const player = new Audio(objectUrl);
        fishPlayer.current = player;
        player.onended = () => {
          if (fishAudioUrl.current === objectUrl) {
            URL.revokeObjectURL(objectUrl);
            fishAudioUrl.current = null;
            fishPlayer.current = null;
          }
        };
        await player.play();
      } catch (error) {
        if (controller.signal.aborted || generation !== fishGeneration.current) return;
        console.warn('Fish Audio failed; replaying the Gemini voice for this reply.');
        pcm.forEach(chunk => audioStreamerRef.current?.addPCM16(new Uint8Array(chunk)));
      } finally {
        if (fishController.current === controller) fishController.current = null;
      }
    };

    // When the client receives audio data, it's passed to the AudioStreamer for playback.
    const onAudio = (data: ArrayBuffer) => {
      if (isMuted || client.suppressPlayback) return;
      if (fishMode.current) fishFallbackAudio.current.push(data);
      else audioStreamerRef.current?.addPCM16(new Uint8Array(data));
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
  }, [client, addPerfLog, isMuted, stopFish]);

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
      } catch {
        // Local development and unconfigured deployments retain Gemini Live.
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
  }), [client, config, setConfig, connect, connected, isConnecting, disconnect, volumeRef, audioStreamerRef, stopAudio, setIsMuted]);
}
