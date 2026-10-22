/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  History,
  Play,
  Volume2,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Award,
} from 'lucide-react';
import { useAgent, useUI } from '../../lib/state';

interface SessionRecord {
  id: string;
  tutorName: string;
  flag: string;
  avatar?: string;
  language: string;
  topic: string;
  date: string;
  duration: string;
  wordsSpoken: number;
  xpEarned: number;
  highlights: string[];
}

const PAST_SESSIONS: SessionRecord[] = [
  {
    id: 'sess-1',
    tutorName: 'Jiyeon (지연)',
    flag: '🇰🇷',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    language: 'Korean',
    topic: 'Hongdae Cafe Ordering & Customizing Sweetness',
    date: 'Today, 2:15 PM',
    duration: '14 mins',
    wordsSpoken: 184,
    xpEarned: 150,
    highlights: [
      'Mastered "-해 주시겠어요?" (Would you please do...)',
      'Corrected pronunciation of "영수증" (receipt)',
      'Completed roleplay scenario with 98% accuracy',
    ],
  },
  {
    id: 'sess-2',
    tutorName: 'Yuki (雪)',
    flag: '🇯🇵',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
    language: 'Japanese',
    topic: 'Tokyo Train Station Directions & Suica Recharge',
    date: 'Yesterday, 8:40 PM',
    duration: '21 mins',
    wordsSpoken: 260,
    xpEarned: 220,
    highlights: [
      'Practiced "〜はどこですか" for station exits',
      'Understood JR Yamanote Line transfer instructions',
      'Polite counters: 〜つ (hitotsu, futatsu)',
    ],
  },
  {
    id: 'sess-3',
    tutorName: '田曦薇 (Tian Xi Wei)',
    flag: '🇨🇳',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    language: 'Mandarin',
    topic: 'Night Market Street Food & Bargaining',
    date: 'Sep 20, 4:10 PM',
    duration: '18 mins',
    wordsSpoken: 215,
    xpEarned: 190,
    highlights: [
      'Differentiated 2nd and 3rd tones in "多少钱" (duōshao qián)',
      'Practiced saying "太贵了，便宜一点吧" playfully',
    ],
  },
  {
    id: 'sess-4',
    tutorName: 'Camille (카미유)',
    flag: '🇫🇷',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
    language: 'French',
    topic: 'Parisian Bistro Ordering & Asking for Recommendations',
    date: 'Sep 17, 11:30 AM',
    duration: '12 mins',
    wordsSpoken: 140,
    xpEarned: 130,
    highlights: [
      'French nasal vowels pronunciation practice',
      'Asking "L’addition s’il vous plaît" naturally',
    ],
  },
];

export const HistoryView: React.FC = () => {
  const { setActiveSection } = useUI();
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(PAST_SESSIONS[0]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FFF5F8] via-[#FFFDFB] to-[#FFF5F8] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFDCE6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#E6194B]">
              Practice Logs & Journey
            </span>
            <span className="text-xs">📜</span>
          </div>
          <h1 className="font-display font-black text-3xl text-[#2A0E17]">
            Session History & Milestones
          </h1>
          <p className="text-sm text-[#7D5464] font-medium mt-1">
            Revisit your voice conversations, grammar feedback, and earned XP.
          </p>
        </div>

        {/* Total stats summary */}
        <div className="flex items-center gap-3 bg-white border border-[#FFD9E4] rounded-2xl px-4 py-2.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-[#FFE4ED] text-[#E6194B] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-black text-lg text-[#2A0E17]">
              690 XP Total
            </div>
            <p className="text-[10px] font-bold text-[#A87285]">
              4 Sessions Completed
            </p>
          </div>
        </div>
      </div>

      {/* History Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="space-y-3 lg:col-span-2">
          {PAST_SESSIONS.map(sess => {
            const isSelected = selectedSession?.id === sess.id;
            return (
              <div
                key={sess.id}
                onClick={() => setSelectedSession(sess)}
                className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-white border-[#E6194B] shadow-md shadow-[#E6194B]/10'
                    : 'bg-white/80 border-[#FFDCE6] hover:bg-white hover:border-[#FFB0C4]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Tutor Avatar */}
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-[#FFCBD9] bg-pink-100 flex-shrink-0">
                    {sess.avatar ? (
                      <img src={sess.avatar} alt={sess.tutorName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl flex items-center justify-center h-full">
                        {sess.flag}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#E6194B]">
                        {sess.flag} {sess.tutorName}
                      </span>
                      <span className="text-[10px] text-[#8C6473] font-bold">
                        • {sess.date}
                      </span>
                    </div>
                    <h3 className="font-display font-black text-sm text-[#2A0E17] mt-0.5">
                      {sess.topic}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-[#7C5564] font-medium mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#E6194B]" /> {sess.duration}
                      </span>
                      <span>•</span>
                      <span>{sess.wordsSpoken} words spoken</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#FFE8EE]">
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    +{sess.xpEarned} XP
                  </span>
                  <span className="text-xs font-bold text-[#E6194B] flex items-center gap-1">
                    <span>Review details</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Session Detail Card */}
        {selectedSession && (
          <div className="p-5 rounded-3xl bg-white border border-[#FFCBD9] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#E6194B]">
              <Sparkles className="w-4 h-4" />
              <span>Session Report</span>
            </div>

            <div>
              <h3 className="font-display font-black text-lg text-[#2A0E17]">
                {selectedSession.topic}
              </h3>
              <p className="text-xs text-[#7C5564] mt-0.5 font-medium">
                Tutor: {selectedSession.tutorName} ({selectedSession.language})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-2xl bg-[#FFF8FA] border border-[#FFE8EE] text-center">
                <span className="text-[10px] font-black text-[#A87285] uppercase">
                  Duration
                </span>
                <p className="font-display font-black text-base text-[#2A0E17]">
                  {selectedSession.duration}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[#FFF8FA] border border-[#FFE8EE] text-center">
                <span className="text-[10px] font-black text-[#A87285] uppercase">
                  Words Spoken
                </span>
                <p className="font-display font-black text-base text-[#E6194B]">
                  {selectedSession.wordsSpoken}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black text-[#2A0E17]">
                Key Highlights & Feedback:
              </span>
              <div className="space-y-1.5">
                {selectedSession.highlights.map((h, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#FFF5F8] border border-[#FFE0EA] text-xs text-[#4A2D3A] font-medium leading-relaxed"
                  >
                    ♡ {h}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveSection('live-tutor')}
                className="w-full y2k-candy-btn text-xs py-2.5 justify-center"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Repeat Similar Drill with {selectedSession.tutorName.split(' ')[0]}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
