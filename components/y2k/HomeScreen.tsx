/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Upload,
  Heart,
  ChevronRight,
  Filter,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { useAgent, useUI, useUser } from '../../lib/state';
import { Agent } from '../../lib/presets/agents';
import { TutorPhotoCard } from './TutorPhotoCard';
import { getCharacterConfig } from '../../lib/characters/character-registry';
import { extractTextFromPdf } from '../../lib/pdf-parser';

export const HomeScreen: React.FC = () => {
  const { current: currentAgent, setCurrent: setCurrentAgent, availablePresets, availablePersonal } = useAgent();
  const { name, topic, pdfFiles, addPdfFile } = useUser();
  const { setActiveSection, setSelectedTutorModalAgent } = useUI();
  const [filterLang, setFilterLang] = useState<string>('all');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const availableAgents = [...availablePresets, ...availablePersonal];
  const activeConfig = getCharacterConfig(currentAgent.id);

  // Available filter categories
  const categories = [
    { id: 'all', label: 'All Tutors' },
    { id: 'korean', label: '🇰🇷 Korean' },
    { id: 'english', label: '🇬🇧 English' },
    { id: 'chinese', label: '🇨🇳 Mandarin' },
    { id: 'french', label: '🇫🇷 French' },
    { id: 'spanish', label: '🇪🇸 Spanish' },
    { id: 'japanese', label: '🇯🇵 Japanese' },
    { id: 'other', label: '🌍 World' },
  ];

  const filteredAgents = availableAgents.filter(agent => {
    if (filterLang === 'all') return true;
    const cfg = getCharacterConfig(agent.id);
    const lang = cfg.appearance.language.toLowerCase();
    if (filterLang === 'korean') return lang.includes('korean');
    if (filterLang === 'english') return lang.includes('english');
    if (filterLang === 'chinese') return lang.includes('chinese') || lang.includes('mandarin');
    if (filterLang === 'french') return lang.includes('french');
    if (filterLang === 'spanish') return lang.includes('spanish');
    if (filterLang === 'japanese') return lang.includes('japanese');
    return !['korean', 'english', 'mandarin', 'chinese', 'french', 'spanish', 'japanese'].some(l => lang.includes(l));
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file.');
      return;
    }

    setIsUploading(true);
    try {
      const text = await extractTextFromPdf(file);
      addPdfFile({ name: file.name, text });
    } catch (e) {
      console.error('Failed to extract PDF:', e);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FFF5F8] via-[#FFFDFB] to-[#FFF5F8] p-6 lg:p-8 space-y-8">
      {/* Top Welcome & Motivational Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#FFDCE6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-black uppercase tracking-wider text-[#E6194B]">
              Daily Language Studio
            </span>
            <span className="text-xs">✨</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight text-[#2A0E17]">
            Who are you studying with today?
          </h1>
          <p className="text-sm text-[#7D5464] font-medium mt-1">
            Pick your language tutor to begin an immersive voice conversation.
          </p>
        </div>

        {/* Handwritten Accent Quote */}
        <div className="hidden sm:flex flex-col items-end justify-center bg-white/80 border border-[#FFD9E4] rounded-2xl px-4 py-2.5 shadow-sm">
          <span className="font-handwriting text-2xl text-[#E6194B] font-bold">
            Small steps, brighter you ♡
          </span>
          <span className="text-[11px] font-bold text-[#A87285]">
            15 mins daily practice = native fluency
          </span>
        </div>
      </div>

      {/* Hero Continue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Continue Studying Banner */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF0F4] via-[#FFE4ED] to-[#FFF5F8] border-2 border-[#FFCBD9] p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#FF2B66]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Tutor portrait frame */}
          <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden border-2 border-white shadow-lg bg-pink-100 flex-shrink-0">
            {(currentAgent.avatarUrl || activeConfig.avatar.portrait) ? (
              <img
                src={(currentAgent.avatarUrl || activeConfig.avatar.portrait)}
                alt={currentAgent.name}
                className={`w-full h-full object-cover ${currentAgent.id === 'olga' || currentAgent.id === 'luca' ? 'scale-[1.18]' : ''}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                {activeConfig.appearance.flag}
              </div>
            )}
            <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-black text-[#E6194B]">
              Continue
            </div>
          </div>

          {/* Details & CTA */}
          <div className="flex-1 flex flex-col justify-between space-y-3 w-full">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">{activeConfig.appearance.flag}</span>
                <span className="text-xs font-black uppercase tracking-wider text-[#E6194B]">
                  {activeConfig.appearance.language} • {activeConfig.appearance.level}
                </span>
              </div>
              <h2 className="font-display font-black text-2xl text-[#2A0E17] mt-0.5">
                {topic || 'Food & Dining — Ordering at a cafe'}
              </h2>
              <p className="text-xs text-[#6F4C5B] font-medium mt-1">
                with <span className="font-bold text-[#E6194B]">{activeConfig.name}</span> • {activeConfig.appearance.tagline}
              </p>
            </div>

            {/* Lesson progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#7D5464]">
                <span>Progress: 2 of 3 topics covered</span>
                <span className="text-[#E6194B]">68%</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#FFD9E4]">
                <div
                  className="h-full bg-gradient-to-r from-[#FF6584] to-[#E6194B] rounded-full transition-all duration-500"
                  style={{ width: '68%' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setActiveSection('live-tutor')}
                className="y2k-candy-btn text-sm"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Continue Session →</span>
              </button>

              <button
                onClick={() => setSelectedTutorModalAgent(currentAgent)}
                className="y2k-pill-secondary px-4 py-2 text-xs"
              >
                <span>Tutor Settings ✿</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Materials Card */}
        <div className="rounded-3xl bg-white border border-[#FFDCE6] p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#2A0E17]">
                <BookOpen className="w-4 h-4 text-[#E6194B]" />
                <span>Recent Materials</span>
              </div>
              <span className="text-[11px] font-bold text-[#A87285] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFDCE6]">
                {(pdfFiles?.length || 0) + 3} Files
              </span>
            </div>

            <div className="space-y-2">
              <div
                onClick={() => setActiveSection('materials')}
                className="p-2.5 rounded-2xl bg-[#FFF8FA] hover:bg-[#FFEAF1] border border-[#FFE0EA] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-[#FFE4ED] text-[#E6194B] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    PDF
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#2A0E17] truncate group-hover:text-[#E6194B]">
                      Restaurant Phrases & Vocabulary
                    </p>
                    <p className="text-[10px] text-[#A87285]">12 pages • Essential dialogue</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A87285] group-hover:text-[#E6194B] flex-shrink-0" />
              </div>

              <div
                onClick={() => setActiveSection('materials')}
                className="p-2.5 rounded-2xl bg-[#FFF8FA] hover:bg-[#FFEAF1] border border-[#FFE0EA] transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F3FF] text-[#2F80ED] flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    TXT
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-[#2A0E17] truncate group-hover:text-[#E6194B]">
                      Travel Conversations & Grammar
                    </p>
                    <p className="text-[10px] text-[#A87285]">8 pages • Cultural notes</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#A87285] group-hover:text-[#E6194B] flex-shrink-0" />
              </div>
            </div>
          </div>

          {/* Quick PDF upload trigger */}
          <div className="mt-4 pt-3 border-t border-[#FFE5ED]">
            <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#FFF0F4] hover:bg-[#FFE2EC] border border-[#FFD3DF] rounded-2xl text-xs font-bold text-[#E6194B] cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Parsing PDF...' : 'Upload Lesson PDF'}</span>
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Tutor Photocard Collection Section */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E6194B]" />
            <h2 className="font-display font-black text-xl text-[#2A0E17]">
              Collectible Tutor Photocards
            </h2>
            <span className="text-xs font-bold text-[#A87285] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFDCE6]">
              {availableAgents.length} Tutors Available
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterLang(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filterLang === cat.id
                    ? 'bg-[#E6194B] text-white shadow-sm shadow-[#E6194B]/20'
                    : 'bg-white text-[#7D5464] hover:bg-[#FFEAF1] border border-[#FFDCE6]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photocard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredAgents.map(agent => (
            <TutorPhotoCard
              key={agent.id}
              agent={agent}
              onSelect={selected => {
                setCurrentAgent(selected);
              }}
              onOpenDetails={selected => {
                setSelectedTutorModalAgent(selected);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
