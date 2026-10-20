/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Volume2,
  X,
  Play,
  Check,
} from 'lucide-react';
import { useAgent, useUI } from '../../lib/state';
import { Agent, INTERLOCUTOR_VOICES, INTERLOCUTOR_VOICE } from '../../lib/presets/agents';
import { getCharacterConfig } from '../../lib/characters/character-registry';
import {
  EMOTION_STYLES,
  TEACHING_STYLES,
  EXPLANATION_LEVELS,
  EmotionStyleId,
  TeachingStyleId,
  ExplanationLevelId,
} from '../../lib/personalities/personality-system';

export const TutorProfileModal: React.FC = () => {
  const { selectedTutorModalAgent, setSelectedTutorModalAgent, setActiveSection } = useUI();
  const { setCurrent: setCurrentAgent } = useAgent();

  if (!selectedTutorModalAgent) return null;

  const agent = selectedTutorModalAgent;
  const config = getCharacterConfig(agent.id);

  const [selectedVoice, setSelectedVoice] = useState<INTERLOCUTOR_VOICE>(agent.voice);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionStyleId>(
    agent.personalityConfig?.emotionStyle || config.personalityDefaults.emotionStyle
  );
  const [selectedTeaching, setSelectedTeaching] = useState<TeachingStyleId>(
    agent.personalityConfig?.teachingStyle || config.personalityDefaults.teachingStyle
  );
  const [selectedLevel, setSelectedLevel] = useState<ExplanationLevelId>(
    agent.personalityConfig?.explanationLevel || config.personalityDefaults.explanationLevel
  );

  const handleStartSession = () => {
    const updatedAgent: Agent = {
      ...agent,
      voice: selectedVoice,
      personalityConfig: {
        ...agent.personalityConfig,
        emotionStyle: selectedEmotion,
        teachingStyle: selectedTeaching,
        explanationLevel: selectedLevel,
      },
    };
    setCurrentAgent(updatedAgent);
    setSelectedTutorModalAgent(null);
    setActiveSection('live-tutor');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-[#FFCBD9] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#FFDCE6] flex items-center justify-between bg-gradient-to-r from-[#FFF5F8] to-[#FFF0F4]">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.appearance.flag}</span>
            <div>
              <h2 className="font-display font-black text-xl text-[#2A0E17]">
                {config.name} • {config.appearance.language} Tutor
              </h2>
              <p className="text-xs text-[#8C6473] font-medium">
                {config.appearance.tagline}
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTutorModalAgent(null)}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#FFEAF1] border border-[#FFD8E3] text-[#7C5564] hover:text-[#E6194B] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Profile Summary */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#FFF8FA] border border-[#FFE0EA]">
            {/* Portrait Frame */}
            <div className="relative w-28 h-36 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-pink-100 flex-shrink-0">
              {config.avatar.portrait ? (
                <img
                  src={config.avatar.portrait}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  {config.appearance.flag}
                </div>
              )}
            </div>

            {/* Profile Text */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-xs font-black text-[#E6194B] bg-[#FFF0F4] px-2.5 py-0.5 rounded-full border border-[#FFD3DF]">
                  {config.appearance.level}
                </span>
                <span className="text-xs font-bold text-[#7C5564] bg-white px-2 py-0.5 rounded-full border border-[#FFDCE6]">
                  Topic: {config.appearance.favoriteTopic}
                </span>
              </div>

              <p className="text-xs text-[#4A2D3A] italic leading-relaxed">
                "{config.appearance.samplePhrase}"
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
                {config.personalityDefaults.baseTraits.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-bold text-[#825263] bg-white px-2 py-0.5 rounded-lg border border-[#FFE0EA]"
                  >
                    ♡ {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#7C5564] mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#E6194B]" />
              <span>Gemini Spoken Voice:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INTERLOCUTOR_VOICES.map(voice => (
                <button
                  key={voice}
                  onClick={() => setSelectedVoice(voice)}
                  className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border flex items-center justify-between ${
                    selectedVoice === voice
                      ? 'bg-[#E6194B] text-white border-[#E6194B] shadow-sm shadow-[#E6194B]/20'
                      : 'bg-white text-[#7C5564] hover:bg-[#FFEAF1] border-[#FFDCE6]'
                  }`}
                >
                  <span>{voice}</span>
                  {selectedVoice === voice && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Emotional Persona Style */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#7C5564] mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-[#E6194B]" />
              <span>Emotional & Conversational Tone:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(EMOTION_STYLES) as EmotionStyleId[]).map(key => {
                const opt = EMOTION_STYLES[key];
                const isChosen = selectedEmotion === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedEmotion(key)}
                    className={`p-2.5 rounded-2xl text-left border transition-all ${
                      isChosen
                        ? 'bg-[#FFF0F4] border-[#E6194B] text-[#2A0E17] shadow-sm'
                        : 'bg-white border-[#FFDCE6] text-[#7C5564] hover:bg-[#FFF8FA]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{opt.name}</span>
                      <span className="text-[10px] text-[#E6194B]">{opt.badge}</span>
                    </div>
                    <p className="text-[11px] text-[#8C6473] mt-0.5 line-clamp-1">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Teaching Approach */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#7C5564] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E6194B]" />
              <span>Teaching Methodology:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(TEACHING_STYLES) as TeachingStyleId[]).map(key => {
                const opt = TEACHING_STYLES[key];
                const isChosen = selectedTeaching === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTeaching(key)}
                    className={`p-2.5 rounded-2xl text-left border transition-all ${
                      isChosen
                        ? 'bg-[#FFF0F4] border-[#E6194B] text-[#2A0E17] shadow-sm'
                        : 'bg-white border-[#FFDCE6] text-[#7C5564] hover:bg-[#FFF8FA]'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.name}</div>
                    <p className="text-[11px] text-[#8C6473] mt-0.5 line-clamp-1">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#FFDCE6] bg-[#FFF8FA] flex items-center justify-end gap-3">
          <button
            onClick={() => setSelectedTutorModalAgent(null)}
            className="px-4 py-2 rounded-full text-xs font-bold text-[#7C5564] hover:text-[#2A0E17]"
          >
            Cancel
          </button>

          <button
            onClick={handleStartSession}
            className="y2k-candy-btn text-xs px-6 py-2.5"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Session with {config.name} →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
