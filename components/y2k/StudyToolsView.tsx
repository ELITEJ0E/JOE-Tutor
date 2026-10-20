/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Zap,
  Sparkles,
  RotateCw,
  CheckCircle,
  XCircle,
  Volume2,
  Mic,
  Flame,
  Award,
  Play,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { useAgent, useUI } from '../../lib/state';

interface Flashcard {
  id: string;
  front: string;
  sub: string;
  back: string;
  explanation: string;
  category: string;
}

const FLASHCARD_DECK: Flashcard[] = [
  {
    id: 'fc-1',
    front: '얼마나 걸려요?',
    sub: 'eol-ma-na geol-lyeo-yo?',
    back: 'How long does it take?',
    explanation: 'Used when asking for transit duration, walking times, or cooking estimate.',
    category: 'Korean 🇰🇷',
  },
  {
    id: 'fc-2',
    front: 'これをおすすめします',
    sub: 'Kore o osusume shimasu',
    back: 'I recommend this one',
    explanation: 'Polite restaurant/store phrase used when suggesting items.',
    category: 'Japanese 🇯🇵',
  },
  {
    id: 'fc-3',
    front: '请问洗手间在哪里？',
    sub: 'Qǐngwèn xǐshǒujiān zài nǎlǐ?',
    back: 'Excuse me, where is the restroom?',
    explanation: 'Essential travel question with polite introductory "请问" (qǐngwèn).',
    category: 'Mandarin 🇨🇳',
  },
  {
    id: 'fc-4',
    front: 'L’addition, s’il vous plaît',
    sub: 'lah-dee-syohn seel voo pleh',
    back: 'The check / bill, please',
    explanation: 'Standard way to ask for the bill at any cafe or restaurant in France.',
    category: 'French 🇫🇷',
  },
  {
    id: 'fc-5',
    front: '¿Puede hablar más despacio?',
    sub: 'Pweh-deh ah-blahr mahs dehs-pah-syoh',
    back: 'Could you speak more slowly?',
    explanation: 'Invaluable phrase when speaking with native Spanish speakers.',
    category: 'Spanish 🇪🇸',
  },
];

const SCENARIOS = [
  {
    id: 'sc-1',
    title: 'Ordering at a Lively Night Market',
    difficulty: 'Beginner',
    time: '5 mins',
    desc: 'Practice asking prices, requesting food spicy/non-spicy, and paying with cash or QR code.',
  },
  {
    id: 'sc-2',
    title: 'Hotel Check-in & Asking for Luggage Storage',
    difficulty: 'Intermediate',
    time: '7 mins',
    desc: 'Review reservation details, ask for an early check-in, and request your bags be held safely.',
  },
  {
    id: 'sc-3',
    title: 'Job Interview & Career Background',
    difficulty: 'Advanced',
    time: '12 mins',
    desc: 'Politely introduce yourself, answer questions regarding your past projects and strengths.',
  },
];

export const StudyToolsView: React.FC = () => {
  const { current: currentAgent } = useAgent();
  const { setActiveSection } = useUI();

  // Flashcard practice state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [learnedCount, setLearnedCount] = useState<number>(3);
  const [streak, setStreak] = useState<number>(7);

  const card = FLASHCARD_DECK[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((currentIndex + 1) % FLASHCARD_DECK.length);
  };

  const handleMarkKnown = () => {
    setLearnedCount(learnedCount + 1);
    handleNext();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FFF5F8] via-[#FFFDFB] to-[#FFF5F8] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFDCE6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#E6194B]">
              Practice & Fluency Drills
            </span>
            <span className="text-xs">⚡</span>
          </div>
          <h1 className="font-display font-black text-3xl text-[#2A0E17]">
            Interactive Study Tools
          </h1>
          <p className="text-sm text-[#7D5464] font-medium mt-1">
            Daily flashcard speed drills, scenario roleplay simulators, and speech shadowing.
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center gap-3 bg-white border border-[#FFD9E4] rounded-2xl px-4 py-2.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-[#FFE4ED] text-[#E6194B] flex items-center justify-center">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-display font-black text-lg text-[#2A0E17]">
                {streak} Day Streak!
              </span>
              <span className="text-xs">🔥</span>
            </div>
            <p className="text-[10px] font-bold text-[#A87285]">
              {learnedCount} cards mastered today
            </p>
          </div>
        </div>
      </div>

      {/* Main Flashcard Practice Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Flashcard Box */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#E6194B]" />
              <h2 className="font-display font-black text-lg text-[#2A0E17]">
                Interactive Quick-Flip Flashcard
              </h2>
            </div>
            <span className="text-xs font-bold text-[#8C6473]">
              Card {currentIndex + 1} of {FLASHCARD_DECK.length}
            </span>
          </div>

          {/* Flashcard Component with Y2K 3D Card Depth */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[280px] sm:min-h-[320px] rounded-3xl bg-white border-2 border-[#FFCBD9] p-6 shadow-lg flex flex-col justify-between cursor-pointer hover:border-[#FF9DB7] transition-all relative overflow-hidden group select-none"
          >
            {/* Specular Highlight */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/60 via-white/10 to-transparent pointer-events-none" />

            {/* Top Bar on Card */}
            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-black uppercase tracking-wider text-[#E6194B] bg-[#FFF0F4] px-2.5 py-0.5 rounded-full border border-[#FFD9E4]">
                {card.category}
              </span>
              <span className="text-xs font-bold text-[#A87285] flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                <span>Tap to flip</span>
              </span>
            </div>

            {/* Center Content */}
            <div className="my-auto text-center space-y-3 z-10 py-6">
              {!isFlipped ? (
                <div className="space-y-2 animate-fadeIn">
                  <h3 className="font-display font-black text-3xl sm:text-4xl text-[#2A0E17] tracking-tight">
                    {card.front}
                  </h3>
                  <p className="text-sm font-semibold text-[#8C6473] italic">
                    {card.sub}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn">
                  <span className="text-xs font-bold text-[#E6194B] uppercase tracking-wider">
                    English Translation & Nuance
                  </span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-[#E6194B]">
                    {card.back}
                  </h3>
                  <p className="text-xs text-[#5C3B49] max-w-md mx-auto leading-relaxed bg-[#FFF8FA] p-3 rounded-2xl border border-[#FFE8EE]">
                    {card.explanation}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Indicator */}
            <div className="text-center z-10">
              <span className="text-[11px] font-bold text-[#A87285]">
                {isFlipped ? '✿ Card explanation revealed' : '♡ Try saying it out loud before flipping!'}
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-full bg-white hover:bg-[#FFEAF1] border border-[#FFDCE6] text-xs font-bold text-[#7C5564] hover:text-[#2A0E17] transition-all flex items-center gap-2"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Skip / Next Card</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkKnown}
                className="y2k-candy-btn text-xs px-6 py-2.5 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>I Know This! (+1 XP)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Roleplay Scenario Simulator Cards */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#E6194B]" />
            <h2 className="font-display font-black text-lg text-[#2A0E17]">
              Live Scenario Drills
            </h2>
          </div>

          <div className="space-y-3">
            {SCENARIOS.map(sc => (
              <div
                key={sc.id}
                className="p-4 rounded-3xl bg-white border border-[#FFDCE6] shadow-sm hover:border-[#FFB0C4] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E6194B] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFD8E3]">
                      {sc.difficulty}
                    </span>
                    <span className="text-[10px] font-bold text-[#8C6473]">
                      ⏱️ {sc.time}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-sm text-[#2A0E17]">
                    {sc.title}
                  </h3>
                  <p className="text-[11px] text-[#7C5564] mt-1 leading-relaxed">
                    {sc.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#FFE8EE] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#A87285]">
                    Voice Roleplay
                  </span>
                  <button
                    onClick={() => setActiveSection('live-tutor')}
                    className="text-xs font-bold text-[#E6194B] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Start Drill</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
