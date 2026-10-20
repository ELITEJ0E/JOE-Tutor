/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Home,
  Headphones,
  BookOpen,
  FileText,
  Sparkles,
  Clock,
  Settings,
  Heart,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useUI } from '../../lib/state';

interface NavItem {
  id: 'home' | 'live-tutor' | 'materials' | 'notes' | 'study-tools' | 'history' | 'settings';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'live-tutor', label: 'Live Tutor', icon: Headphones, badge: 'LIVE' },
  { id: 'materials', label: 'Materials', icon: BookOpen },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'study-tools', label: 'Study Tools', icon: Sparkles },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeSection, setActiveSection, setShowUserConfig } = useUI();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between p-4 bg-[#FFF8FA] border-r border-[#FFDCE6] select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E6194B] to-[#FF6584] flex items-center justify-center shadow-md shadow-[#E6194B]/20 text-white font-black text-xl">
            J
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-xl tracking-tight text-[#E6194B]">
                JOE Tutor
              </span>
              <span className="text-xs">✨</span>
            </div>
            <p className="text-[11px] font-semibold text-[#A87285] tracking-wide">
              Learn Brighter Together
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'settings') {
                    setShowUserConfig(true);
                  } else {
                    setActiveSection(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E6194B] text-white shadow-md shadow-[#E6194B]/25 translate-x-1'
                    : 'text-[#5E3444] hover:bg-[#FFEAF1] hover:text-[#E6194B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#DC1949]'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive
                          ? 'bg-white text-[#E6194B]'
                          : 'bg-[#FFDEE7] text-[#DC1949]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Motivational Bottom Card */}
      <div className="space-y-3">
        {/* Streak Pill */}
        <div className="bg-white/80 rounded-2xl p-3 border border-[#FFD9E4] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#A87285]">
                Streak
              </p>
              <p className="text-xs font-black text-[#2A0E17]">7 Days on Fire!</p>
            </div>
          </div>
          <span className="text-xs font-black text-[#E6194B] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFD3DF]">
            1,240 XP
          </span>
        </div>

        {/* Sweet Daily Note */}
        <div className="bg-gradient-to-br from-[#FFE8EE] to-[#FFF5F8] border border-[#FFCBD9] rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1 text-[#E6194B] font-extrabold text-[11px]">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>A Better You Tomorrow</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#7C5564] font-medium">
            Good learning brings a brighter tomorrow. Keep going, superstar! ♡
          </p>
        </div>
      </div>
    </aside>
  );
};
