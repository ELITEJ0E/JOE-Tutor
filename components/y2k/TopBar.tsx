/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  FileText,
  User as UserIcon,
} from 'lucide-react';
import { useAgent, useUI, useUser } from '../../lib/state';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { getCharacterConfig } from '../../lib/characters/character-registry';

export const TopBar: React.FC = () => {
  const { current: currentAgent } = useAgent();
  const { name, topic } = useUser();
  const {
    setShowUserConfig,
    setShowHelpModal,
    outputModality,
    setOutputModality,
    setActiveSection,
    setSelectedTutorModalAgent,
  } = useUI();
  const { connected } = useLiveAPIContext();

  const charConfig = getCharacterConfig(currentAgent.id);

  return (
    <header className="h-16 px-6 bg-white/90 backdrop-blur-md border-b border-[#FFDCE6] flex items-center justify-between select-none z-20">
      {/* Left: Language & Active Topic */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#FFF0F4] border border-[#FFD3DF] px-3.5 py-1.5 rounded-full shadow-sm">
          <span className="text-base">{charConfig.appearance.flag}</span>
          <span className="text-xs font-black tracking-wide text-[#E6194B]">
            {charConfig.appearance.language}
          </span>
          <span className="text-xs text-[#DC1949]/50">•</span>
          <span className="text-xs font-bold text-[#825263]">
            {charConfig.appearance.level}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-[#8C6473]">
          <span className="text-[#E6194B]">✦</span>
          <span>{topic || 'Casual Spoken Immersion & Fluency'}</span>
        </div>
      </div>

      {/* Right: Live Status, Quick Tutor Pill, Audio Toggle, User */}
      <div className="flex items-center gap-3">
        {/* Live session pill */}
        <div
          onClick={() => setActiveSection('live-tutor')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            connected
              ? 'bg-[#E6194B] text-white border-[#E6194B] shadow-sm shadow-[#E6194B]/30'
              : 'bg-[#FFF5F8] text-[#8C6473] border-[#FFD8E3] hover:border-[#FFB3C6]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-white animate-ping' : 'bg-[#E6194B]'
            }`}
          />
          <span>{connected ? 'Live Session Active' : 'Ready to Connect'}</span>
        </div>

        {/* Current Tutor Profile Button */}
        <button
          onClick={() => setSelectedTutorModalAgent(currentAgent)}
          className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white hover:bg-[#FFF5F8] border border-[#FFD3DF] rounded-full shadow-sm transition-all group"
          title="View & Customize Tutor Profile"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden border border-[#FFB8CB] bg-pink-100 flex-shrink-0">
            {charConfig.avatar.portrait ? (
              <img
                src={charConfig.avatar.portrait}
                alt={currentAgent.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <span className="text-xs flex items-center justify-center h-full">✿</span>
            )}
          </div>
          <span className="text-xs font-extrabold text-[#2A0E17] group-hover:text-[#E6194B] transition-colors">
            {currentAgent.name.split(' ')[0]}
          </span>
          <Sparkles className="w-3 h-3 text-[#E6194B] opacity-70 group-hover:opacity-100" />
        </button>

        {/* Modality Toggle (Audio / Both / Text) */}
        <button
          onClick={() => {
            const next =
              outputModality === 'audio'
                ? 'both'
                : outputModality === 'both'
                ? 'text'
                : 'audio';
            setOutputModality(next);
          }}
          className="p-2 rounded-xl bg-[#FFF5F8] text-[#E6194B] hover:bg-[#FFEAF1] border border-[#FFD8E3] transition-colors"
          title={`Output mode: ${outputModality}. Click to toggle.`}
        >
          {outputModality === 'audio' && <Volume2 className="w-4 h-4" />}
          {outputModality === 'both' && (
            <div className="flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" />
              <FileText className="w-3.5 h-3.5" />
            </div>
          )}
          {outputModality === 'text' && <VolumeX className="w-4 h-4" />}
        </button>

        {/* Help */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="p-2 rounded-xl bg-[#FFF5F8] text-[#8C6473] hover:text-[#E6194B] hover:bg-[#FFEAF1] border border-[#FFD8E3] transition-colors"
          title="User Guide & Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Settings */}
        <button
          onClick={() => setShowUserConfig(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF0F4] hover:bg-[#FFE0EB] border border-[#FFD3DF] text-[#E6194B] font-bold text-xs shadow-sm transition-all"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{name || 'My Profile'}</span>
        </button>
      </div>
    </header>
  );
};
