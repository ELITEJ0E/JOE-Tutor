/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileEdit,
  Plus,
  Trash2,
  Sparkles,
  BookMarked,
  Copy,
  Check,
  Download,
  Share2,
  Tag,
  Search,
} from 'lucide-react';
import { useUser, useAgent } from '../../lib/state';

interface StickyNote {
  id: string;
  title: string;
  category: 'vocab' | 'grammar' | 'pronunciation' | 'cultural';
  content: string;
  color: string;
  date: string;
}

const INITIAL_NOTES: StickyNote[] = [
  {
    id: 'note-1',
    title: 'Korean Politeness Endings (-요 vs -습니다)',
    category: 'grammar',
    content: '- 아/어요 is standard polite for daily life.\n- -ㅂ/습니다 is formal polite for announcements, news, or first meetings.\nTip: When in doubt, use -요!',
    color: '#FFF0F4',
    date: 'Today',
  },
  {
    id: 'note-2',
    title: 'Must-Know Cafe Vocab',
    category: 'vocab',
    content: '1. 포장 (takeout/to-go)\n2. 영수증 (receipt)\n3. 진동벨 (vibrating buzzer / pickup pager)\n4. 샷 추가 (add espresso shot)',
    color: '#FFFBEA',
    date: 'Yesterday',
  },
  {
    id: 'note-3',
    title: 'Pitch Accent in Japanese (箸 vs 橋)',
    category: 'pronunciation',
    content: '箸 (hashi - chopsticks): High on first syllable (HA-shi)\n橋 (hashi - bridge): High on second syllable (ha-SHI)\n端 (hashi - edge): Flat tone',
    color: '#F0F9FF',
    date: 'Sep 20',
  },
  {
    id: 'note-4',
    title: 'French Bistro Tipping Norms',
    category: 'cultural',
    content: 'Service is included by law in France (service compris). Leaving 1-2€ in coins on the table is a nice gesture for great service!',
    color: '#FDF2F8',
    date: 'Sep 18',
  },
];

export const NotesView: React.FC = () => {
  const { current: currentAgent } = useAgent();
  const [notes, setNotes] = useState<StickyNote[]>(INITIAL_NOTES);
  const [search, setSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'vocab' | 'grammar' | 'pronunciation' | 'cultural'>('vocab');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const colors = {
      vocab: '#FFFBEA',
      grammar: '#FFF0F4',
      pronunciation: '#F0F9FF',
      cultural: '#FDF2F8',
    };

    const newNote: StickyNote = {
      id: `note-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      content: newContent,
      color: colors[newCategory],
      date: 'Just now',
    };

    setNotes([newNote, ...notes]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  const handleCopy = (note: StickyNote) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeFilter === 'all' || n.category === activeFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FFF5F8] via-[#FFFDFB] to-[#FFF5F8] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFDCE6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#E6194B]">
              Personal Learning Notebook
            </span>
            <span className="text-xs">📝</span>
          </div>
          <h1 className="font-display font-black text-3xl text-[#2A0E17]">
            Study Notes & Sticky Cards
          </h1>
          <p className="text-sm text-[#7D5464] font-medium mt-1">
            Capture essential grammar rules, new words, and pronunciation pointers from your sessions.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="y2k-candy-btn inline-flex items-center gap-2 self-start sm:self-auto text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Sticky Note</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Notes' },
            { id: 'vocab', label: '📖 Vocab' },
            { id: 'grammar', label: '📐 Grammar' },
            { id: 'pronunciation', label: '🗣️ Pronunciation' },
            { id: 'cultural', label: '🍵 Culture' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'bg-[#E6194B] text-white shadow-sm'
                  : 'bg-white text-[#7C5564] hover:bg-[#FFEAF1] border border-[#FFDCE6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C6473]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="pl-8 pr-3 py-1.5 rounded-full bg-white border border-[#FFDCE6] text-xs text-[#2A0E17] placeholder:text-[#A87285] focus:outline-none focus:border-[#E6194B]"
          />
        </div>
      </div>

      {/* Add Note Modal/Card */}
      {isAdding && (
        <form
          onSubmit={handleAddNote}
          className="p-5 rounded-3xl bg-white border-2 border-[#FFCBD9] shadow-lg space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-base text-[#2A0E17] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E6194B]" />
              <span>Create New Note</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[#8C6473] hover:text-[#2A0E17] text-sm"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Note Title (e.g., Casual vs Formal verb stems)"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="sm:col-span-2 px-3.5 py-2 rounded-2xl bg-[#FFF8FA] border border-[#FFDCE6] text-xs font-bold text-[#2A0E17] focus:outline-none focus:border-[#E6194B]"
              required
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as any)}
              className="px-3.5 py-2 rounded-2xl bg-[#FFF8FA] border border-[#FFDCE6] text-xs font-bold text-[#2A0E17] focus:outline-none focus:border-[#E6194B]"
            >
              <option value="vocab">📖 Vocabulary</option>
              <option value="grammar">📐 Grammar Rule</option>
              <option value="pronunciation">🗣️ Pronunciation</option>
              <option value="cultural">🍵 Cultural Etiquette</option>
            </select>
          </div>

          <textarea
            placeholder="Write your study notes, examples, and tips here..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            rows={4}
            className="w-full p-3.5 rounded-2xl bg-[#FFF8FA] border border-[#FFDCE6] text-xs text-[#2A0E17] font-medium focus:outline-none focus:border-[#E6194B]"
            required
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-full text-xs font-bold text-[#7C5564] hover:text-[#2A0E17]"
            >
              Cancel
            </button>
            <button type="submit" className="y2k-candy-btn text-xs px-5 py-2">
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            className="relative rounded-3xl p-5 border border-[#FFCBD9] shadow-sm flex flex-col justify-between hover:shadow-md hover:scale-[1.02] transition-all"
            style={{ backgroundColor: note.color }}
          >
            {/* Top Pin/Tape decoration */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-white/60 backdrop-blur-sm rounded-sm border border-[#FFCBD9]/50 rotate-[-2deg]" />

            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E6194B] bg-white/80 px-2 py-0.5 rounded-full border border-[#FFCBD9]">
                  {note.category}
                </span>
                <span className="text-[10px] font-bold text-[#8C6473]">
                  {note.date}
                </span>
              </div>

              <h3 className="font-display font-black text-base text-[#2A0E17] mb-2 leading-snug">
                {note.title}
              </h3>

              <p className="text-xs text-[#4A2D3A] whitespace-pre-line leading-relaxed font-medium">
                {note.content}
              </p>
            </div>

            {/* Note Footer Actions */}
            <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between">
              <button
                onClick={() => handleCopy(note)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C5564] hover:text-[#E6194B] transition-colors"
              >
                {copiedId === note.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleDelete(note.id)}
                className="text-[#8C6473] hover:text-[#E6194B] p-1 transition-colors"
                title="Delete note"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
