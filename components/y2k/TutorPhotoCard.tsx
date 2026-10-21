/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, ArrowRight, Heart, SlidersHorizontal } from 'lucide-react';
import { Agent } from '../../lib/presets/agents';
import { getCharacterConfig } from '../../lib/characters/character-registry';
import { useAgent, useUI } from '../../lib/state';

interface TutorPhotoCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  onOpenDetails: (agent: Agent) => void;
}

export const TutorPhotoCard: React.FC<TutorPhotoCardProps> = ({
  agent,
  onSelect,
  onOpenDetails,
}) => {
  const { current: currentAgent } = useAgent();
  const { setActiveSection } = useUI();
  const config = getCharacterConfig(agent.id);
  const isSelected = currentAgent.id === agent.id;

  const handleStudyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(agent);
    setActiveSection('live-tutor');
  };

  return (
    <div
      onClick={() => onSelect(agent)}
      className={`group relative flex flex-col justify-between rounded-3xl bg-white p-3.5 transition-all duration-300 cursor-pointer ${
        isSelected
          ? 'border-2 border-[#E6194B] shadow-xl shadow-[#E6194B]/20 -translate-y-1'
          : 'border border-[#FFDCE6] shadow-sm hover:border-[#FFB0C4] hover:shadow-lg hover:-translate-y-1'
      }`}
    >
      {/* Specular Photocard Gloss Highlight */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/60 via-white/10 to-transparent rounded-t-3xl pointer-events-none z-10" />

      {/* Top Media / Portrait Section */}
      <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[#FFEAF1] border border-[#FFD9E4]">
        {(agent.avatarUrl || config.avatar.portrait) ? (
          <img
            src={(agent.avatarUrl || config.avatar.portrait)}
            alt={agent.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <span className="text-4xl mb-2">{config.appearance.flag}</span>
            <span className="font-extrabold text-[#E6194B] text-lg">
              {config.name}
            </span>
          </div>
        )}

        {/* Top Badges (Sticker Style) */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-none">
          {/* Flag & Language Pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-white shadow-sm text-xs font-black text-[#2A0E17]">
            <span>{config.appearance.flag}</span>
            <span>{config.appearance.language}</span>
          </span>

          {/* Special badge */}
          {config.appearance.badge && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E6194B] text-white shadow-sm text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-2.5 h-2.5" />
              {config.appearance.badge}
            </span>
          )}
        </div>

        {/* Active Selection Glow Ring */}
        {isSelected && (
          <div className="absolute bottom-2.5 right-2.5 z-20">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[#E6194B] font-extrabold text-[11px] shadow-md border border-[#FFD3DF]">
              <Heart className="w-3 h-3 fill-current text-[#E6194B]" />
              Active Tutor
            </span>
          </div>
        )}
      </div>

      {/* Info & Persona Details */}
      <div className="mt-3.5 px-1 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display font-black text-lg tracking-tight text-[#2A0E17] group-hover:text-[#E6194B] transition-colors">
              {config.name}
            </h3>
            <span className="text-xs font-bold text-[#A87285] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFDCE6]">
              {config.appearance.level}
            </span>
          </div>

          <p className="text-xs text-[#6F4C5B] font-medium line-clamp-1 mt-1">
            {config.appearance.tagline}
          </p>

          {/* Traits pills */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {config.personalityDefaults.baseTraits.slice(0, 2).map((trait, i) => (
              <span
                key={i}
                className="text-[11px] font-bold text-[#825263] bg-[#FFF8FA] px-2 py-0.5 rounded-lg border border-[#FFE2EB]"
              >
                ✿ {trait}
              </span>
            ))}
            <span className="text-[11px] font-bold text-[#E6194B] bg-[#FFF0F4] px-2 py-0.5 rounded-lg border border-[#FFD3DF]">
              {agent.voice}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-[#FFE5ED] flex items-center gap-2">
          <button
            onClick={handleStudyClick}
            className={`flex-1 py-2 px-3 rounded-full text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-[#FF2B66] to-[#E6194B] text-white shadow-md shadow-[#E6194B]/30 hover:scale-[1.02]'
                : 'bg-[#FFF0F5] text-[#E6194B] hover:bg-[#FFE0EB] border border-[#FFD3DF]'
            }`}
          >
            <span>{isSelected ? 'Continue' : 'Study Now'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(agent);
            }}
            className="p-2 rounded-full bg-white hover:bg-[#FFF0F5] border border-[#FFD9E4] text-[#A87285] hover:text-[#E6194B] transition-colors"
            title="Tutor details & voice customization"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
