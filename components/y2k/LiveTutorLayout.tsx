/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  FileText,
  MessageSquare,
  Volume2,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  BookOpen,
} from 'lucide-react';
import { CharacterStage } from './CharacterStage';
import KeynoteCompanion from '../demo/keynote-companion/KeynoteCompanion';
import ControlTray from '../console/control-tray/ControlTray';
import { useAgent, useUI, useUser } from '../../lib/state';
import { getCharacterConfig } from '../../lib/characters/character-registry';

export const LiveTutorLayout: React.FC = () => {
  const { current: currentAgent } = useAgent();
  const { topic } = useUser();
  const { setActiveSection, setSelectedTutorModalAgent } = useUI();
  const [showStageSidebar, setShowStageSidebar] = useState<boolean>(true);

  const config = getCharacterConfig(currentAgent.id);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FFFDFB]">
      {/* Top Session Context Bar */}
      <div className="px-5 py-2.5 bg-white border-b border-[#FFDCE6] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.appearance.flag}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm text-[#2A0E17]">
                  {config.name}
                </span>
                <span className="text-[10px] font-bold text-[#E6194B] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFD9E4]">
                  {config.appearance.level}
                </span>
              </div>
              <p className="text-[11px] text-[#8C6473] font-medium truncate max-w-xs sm:max-w-md">
                Topic: {topic || config.appearance.favoriteTopic}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTutorModalAgent(currentAgent)}
            className="px-3 py-1.5 rounded-full bg-[#FFF5F8] text-[#8C6473] hover:text-[#E6194B] border border-[#FFD8E3] text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Change voice, emotion style or tutor"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tutor Settings</span>
          </button>

          <button
            onClick={() => setShowStageSidebar(!showStageSidebar)}
            className="px-3 py-1.5 rounded-full bg-[#FFF0F4] text-[#E6194B] border border-[#FFCBD9] text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showStageSidebar ? 'Hide Tutor Card' : 'Show Tutor Card'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left/Main Document & Interactive Canvas Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[#FFFDFB]">
          <div className="flex-1 overflow-hidden relative streaming-console">
            <main className="w-full h-full">
              <div className="main-app-area w-full h-full">
                <KeynoteCompanion />
              </div>
            </main>
          </div>
        </div>

        {/* Right Character Stage Sidebar */}
        {showStageSidebar && (
          <div className="w-full lg:w-80 2xl:w-96 p-4 border-t lg:border-t-0 lg:border-l border-[#FFDCE6] bg-gradient-to-b from-[#FFF5F8] to-[#FFFDFB] flex flex-col justify-between overflow-y-auto z-20 flex-shrink-0 max-h-80 lg:max-h-full">
            <CharacterStage isCompact={false} />

            {/* Quick tips & suggestions under stage */}
            <div className="mt-4 p-3.5 rounded-2xl bg-white border border-[#FFDCE6] shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#2A0E17]">
                <Sparkles className="w-3.5 h-3.5 text-[#E6194B]" />
                <span>Conversation Prompts</span>
              </div>
              <p className="text-[11px] text-[#7C5564] font-medium leading-relaxed">
                • "How do I politely say this in {config.appearance.language}?"<br />
                • "Let's do a roleplay scenario at a train station."<br />
                • "Can you correct my grammar and explain why?"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Tray for Audio, Mic, Screen Share, Connection */}
      <div className="border-t border-[#FFDCE6] bg-white flex-shrink-0 z-30 shadow-md">
        <ControlTray />
      </div>
    </div>
  );
};
