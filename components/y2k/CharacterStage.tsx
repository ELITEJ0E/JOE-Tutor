/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Volume2,
  Mic,
  SlidersHorizontal,
  Heart,
  ChevronDown,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useAgent, useUI } from '../../lib/state';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { getCharacterConfig } from '../../lib/characters/character-registry';
import {
  EMOTION_STYLES,
  TEACHING_STYLES,
  EXPLANATION_LEVELS,
  EmotionStyleId,
  TeachingStyleId,
  ExplanationLevelId,
} from '../../lib/personalities/personality-system';
import BasicFace from '../demo/basic-face/BasicFace';

interface CharacterStageProps {
  className?: string;
  isCompact?: boolean;
}

export const CharacterStage: React.FC<CharacterStageProps> = ({
  className = '',
  isCompact = false,
}) => {
  const { current: currentAgent, setCurrent: setCurrentAgent } = useAgent();
  const { agentState, speechBubbleText } = useUI();
  const { volumeRef, connected } = useLiveAPIContext();

  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [isTalking, setIsTalking] = useState<boolean>(false);
  const [useClassic3DFace, setUseClassic3DFace] = useState<boolean>(false);
  const [showTuningDrawer, setShowTuningDrawer] = useState<boolean>(false);

  const faceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const talkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const config = getCharacterConfig(currentAgent.id);

  // Poll volume level smoothly with requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const updateAudioStatus = () => {
      const vol = volumeRef.current || 0;
      setVolumeLevel(vol);

      if (vol > 0.04) {
        setIsTalking(true);
        if (talkingTimeoutRef.current) {
          clearTimeout(talkingTimeoutRef.current);
        }
        talkingTimeoutRef.current = setTimeout(() => {
          setIsTalking(false);
        }, 1200);
      }

      animId = requestAnimationFrame(updateAudioStatus);
    };

    animId = requestAnimationFrame(updateAudioStatus);
    return () => {
      cancelAnimationFrame(animId);
      if (talkingTimeoutRef.current) {
        clearTimeout(talkingTimeoutRef.current);
      }
    };
  }, [volumeRef]);

  // Determine active visual stage state
  let stageState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'disconnected' = 'disconnected';
  if (!connected) {
    stageState = 'disconnected';
  } else if (isTalking) {
    stageState = 'speaking';
  } else if (agentState === 'thinking') {
    stageState = 'thinking';
  } else {
    stageState = 'listening';
  }

  // Active personality options
  const currentEmotion =
    EMOTION_STYLES[currentAgent.personalityConfig?.emotionStyle || config.personalityDefaults.emotionStyle] ||
    EMOTION_STYLES.cute;

  const currentTeaching =
    TEACHING_STYLES[currentAgent.personalityConfig?.teachingStyle || config.personalityDefaults.teachingStyle] ||
    TEACHING_STYLES.balanced;

  const currentLevel =
    EXPLANATION_LEVELS[currentAgent.personalityConfig?.explanationLevel || config.personalityDefaults.explanationLevel] ||
    EXPLANATION_LEVELS.normal;

  const handleUpdateEmotion = (id: EmotionStyleId) => {
    setCurrentAgent({
      ...currentAgent,
      personalityConfig: {
        ...currentAgent.personalityConfig,
        emotionStyle: id,
      },
    });
  };

  const handleUpdateTeaching = (id: TeachingStyleId) => {
    setCurrentAgent({
      ...currentAgent,
      personalityConfig: {
        ...currentAgent.personalityConfig,
        teachingStyle: id,
      },
    });
  };

  const handleUpdateLevel = (id: ExplanationLevelId) => {
    setCurrentAgent({
      ...currentAgent,
      personalityConfig: {
        ...currentAgent.personalityConfig,
        explanationLevel: id,
      },
    });
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-between rounded-3xl bg-white border border-[#FFDCE6] shadow-md overflow-hidden select-none p-4 lg:p-6 ${className}`}
    >
      {/* Specular Card Shine */}
      <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/70 via-white/10 to-transparent pointer-events-none z-10" />

      {/* Top Header & Toggles */}
      <div className="w-full flex items-center justify-between z-20 mb-3">
        {/* Tutor Identity */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.appearance.flag}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-display font-black text-lg text-[#2A0E17]">
                {config.name}
              </h2>
              <span className="text-[11px] font-bold text-[#E6194B] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFD3DF]">
                {currentEmotion.badge}
              </span>
            </div>
            <p className="text-[11px] text-[#8C6473] font-medium">
              {config.appearance.language} • {currentLevel.name.split('/')[0]}
            </p>
          </div>
        </div>

        {/* View Toggle (Character Stage vs 3D Face) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setUseClassic3DFace(!useClassic3DFace)}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF5F8] text-[#8C6473] hover:text-[#E6194B] border border-[#FFD8E3] transition-colors"
            title="Toggle between Photocard Character Stage and 3D Face"
          >
            {useClassic3DFace ? 'Photocard View' : '3D Face'}
          </button>

          <button
            onClick={() => setShowTuningDrawer(!showTuningDrawer)}
            className={`p-2 rounded-full border transition-colors ${
              showTuningDrawer
                ? 'bg-[#E6194B] text-white border-[#E6194B]'
                : 'bg-[#FFF5F8] text-[#8C6473] hover:text-[#E6194B] border-[#FFD8E3]'
            }`}
            title="Tune Persona & Emotion"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Tuning Drawer */}
      {showTuningDrawer && (
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-[#FFF5F8] border border-[#FFCBD9] text-xs space-y-3 z-20 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-[#2A0E17]">
            <span className="flex items-center gap-1.5 text-[#E6194B]">
              <Sparkles className="w-3.5 h-3.5" />
              Tune Persona & Spoken Style
            </span>
            <button
              onClick={() => setShowTuningDrawer(false)}
              className="text-[#A87285] hover:text-[#2A0E17]"
            >
              ✕
            </button>
          </div>

          {/* Emotion selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#7C5564] mb-1">
              Affective Tone:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(EMOTION_STYLES) as EmotionStyleId[]).map(key => {
                const em = EMOTION_STYLES[key];
                const active =
                  (currentAgent.personalityConfig?.emotionStyle || config.personalityDefaults.emotionStyle) === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleUpdateEmotion(key)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      active
                        ? 'bg-[#E6194B] text-white shadow-sm'
                        : 'bg-white text-[#7C5564] hover:bg-[#FFE8EE] border border-[#FFD9E4]'
                    }`}
                  >
                    {em.badge}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teaching Style selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#7C5564] mb-1">
              Teaching Method:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TEACHING_STYLES) as TeachingStyleId[]).map(key => {
                const ts = TEACHING_STYLES[key];
                const active =
                  (currentAgent.personalityConfig?.teachingStyle || config.personalityDefaults.teachingStyle) === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleUpdateTeaching(key)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      active
                        ? 'bg-[#2A0E17] text-white'
                        : 'bg-white text-[#7C5564] hover:bg-[#FFE8EE] border border-[#FFD9E4]'
                    }`}
                  >
                    {ts.name.split('&')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Center Avatar Area */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center py-4 min-h-[220px]">
        {/* Dynamic Audio Wave Rings */}
        {stageState === 'speaking' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="absolute rounded-full border-2 border-[#FF2B66]/40 animate-ping"
              style={{
                width: `${180 + volumeLevel * 200}px`,
                height: `${180 + volumeLevel * 200}px`,
              }}
            />
            <div
              className="absolute rounded-full bg-[#FF6584]/15 animate-pulse"
              style={{
                width: `${150 + volumeLevel * 120}px`,
                height: `${150 + volumeLevel * 120}px`,
              }}
            />
          </div>
        )}

        {/* Listening Pulse Waves */}
        {stageState === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full border border-[#FFD0DD]/60 animate-pulse-ring" />
          </div>
        )}

        {/* Visual Choice: Classic 3D Face OR Photocard Portrait */}
        {useClassic3DFace ? (
          <div className="w-44 h-44 rounded-full overflow-hidden shadow-xl border-4 border-white bg-gradient-to-tr from-[#FFEAF1] to-[#FFF5F8] flex items-center justify-center relative">
            <canvas
              ref={faceCanvasRef}
              className="w-full h-full"
              width={250}
              height={250}
            />
            <BasicFace
              canvasRef={faceCanvasRef}
              color={currentAgent.bodyColor}
              isTalking={isTalking}
            />
          </div>
        ) : (
          <div
            className={`relative rounded-3xl p-2 bg-white border-2 shadow-xl transition-all duration-300 ${
              stageState === 'speaking'
                ? 'border-[#E6194B] shadow-[#E6194B]/30 scale-105'
                : stageState === 'listening'
                ? 'border-[#FFB0C4] shadow-[#FF6584]/20'
                : 'border-[#FFE0EB]'
            }`}
            style={{
              width: isCompact ? '180px' : '210px',
              height: isCompact ? '230px' : '270px',
            }}
          >
            {/* Top Shine Bar on Photocard */}
            <div className="absolute inset-x-2 top-2 h-28 bg-gradient-to-b from-white/50 to-transparent rounded-t-2xl pointer-events-none z-10" />

            <div className="w-full h-full rounded-2xl overflow-hidden bg-pink-50 relative flex items-center justify-center">
              {config.avatar.portrait ? (
                <img
                  src={config.avatar.portrait}
                  alt={currentAgent.name}
                  className={`w-full h-full object-cover transition-transform duration-300 ${
                    currentAgent.id === 'olga' || currentAgent.id === 'luca'
                      ? stageState === 'speaking' ? 'scale-[1.23]' : 'scale-[1.18]'
                      : stageState === 'speaking' ? 'scale-105' : 'scale-100'
                  }`}
                />
              ) : (
                <div className="text-center p-4">
                  <span className="text-5xl">{config.appearance.flag}</span>
                  <p className="font-display font-black text-xl text-[#E6194B] mt-2">
                    {config.name}
                  </p>
                </div>
              )}

              {/* Real-time Status Badge overlay on bottom */}
              <div className="absolute bottom-2 inset-x-2 flex items-center justify-center z-20">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-md border ${
                    stageState === 'speaking'
                      ? 'bg-[#E6194B]/90 text-white border-white'
                      : stageState === 'listening'
                      ? 'bg-white/90 text-[#E6194B] border-[#FFCBD9]'
                      : stageState === 'thinking'
                      ? 'bg-amber-500/90 text-white border-white'
                      : 'bg-black/60 text-white border-white/20'
                  }`}
                >
                  {stageState === 'speaking' && (
                    <>
                      <Volume2 className="w-3 h-3 animate-bounce" />
                      <span>Speaking ♡</span>
                    </>
                  )}
                  {stageState === 'listening' && (
                    <>
                      <Mic className="w-3 h-3 text-[#E6194B] animate-pulse" />
                      <span>Listening...</span>
                    </>
                  )}
                  {stageState === 'thinking' && (
                    <>
                      <Sparkles className="w-3 h-3 animate-spin" />
                      <span>Thinking...</span>
                    </>
                  )}
                  {stageState === 'disconnected' && <span>Ready to Start</span>}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Speech Bubble Display */}
      <div className="w-full mt-2">
        <div className="relative bg-gradient-to-r from-[#FFF5F8] to-[#FFEBF2] border border-[#FFCBD9] rounded-2xl p-3 shadow-sm text-center">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FFF5F8] border-t border-l border-[#FFCBD9] rotate-45" />

          <p className="text-xs font-semibold text-[#2A0E17] leading-relaxed relative z-10 italic">
            "{speechBubbleText || config.appearance.samplePhrase}"
          </p>
        </div>
      </div>
    </div>
  );
};
