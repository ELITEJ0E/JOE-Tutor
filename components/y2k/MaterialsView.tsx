/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Sparkles,
  Download,
  Trash2,
  CheckCircle,
  Play,
  FileCheck,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useUser, useAgent, useUI } from '../../lib/state';
import { extractTextFromPdf } from '../../lib/pdf-parser';

interface CuratedMaterial {
  id: string;
  title: string;
  category: string;
  language: string;
  flag: string;
  description: string;
  pages: number;
  sampleSnippets: string[];
}

const CURATED_MATERIALS: CuratedMaterial[] = [
  {
    id: 'mat-kr-food',
    title: 'Seoul Cafe & Street Food Dialogues',
    category: 'Daily Conversation',
    language: 'Korean',
    flag: '🇰🇷',
    description: 'Essential phrases for ordering coffee, street tteokbokki, payment etiquette, and polite requests.',
    pages: 6,
    sampleSnippets: [
      '아이스 아메리카노 한 잔 부탁드려요 (One iced Americano please)',
      '덜 달게 해주실 수 있나요? (Could you make it less sweet?)',
      '여기서 먹고 갈게요 (I will eat here / For here)',
    ],
  },
  {
    id: 'mat-jp-travel',
    title: 'Tokyo Transit & Station Navigation',
    category: 'Travel & Navigation',
    language: 'Japanese',
    flag: '🇯🇵',
    description: 'Key vocabulary for Suica cards, Shinkansen booking, asking for directions, and finding exits.',
    pages: 8,
    sampleSnippets: [
      'すみません、渋谷駅はどちらですか？ (Excuse me, which way is Shibuya Station?)',
      'ICカードのチャージはどこでできますか？ (Where can I recharge my IC card?)',
    ],
  },
  {
    id: 'mat-zh-biz',
    title: 'Business Introductions & Networking',
    category: 'Business & Etiquette',
    language: 'Mandarin',
    flag: '🇨🇳',
    description: 'Formally presenting business cards, introducing your team, polite inquiries, and email closings.',
    pages: 10,
    sampleSnippets: [
      '这是我的名片，请多指教 (Here is my business card, nice to meet you)',
      '很高兴有机会与贵公司合作 (Glad to have the chance to cooperate with your company)',
    ],
  },
  {
    id: 'mat-fr-bistro',
    title: 'Parisian Bistro Dining & Wine Pairing',
    category: 'Culinary & Culture',
    language: 'French',
    flag: '🇫🇷',
    description: 'Ordering courses, asking for recommendations, tipping customs, and wine descriptors.',
    pages: 5,
    sampleSnippets: [
      'Une table pour deux, s’il vous plaît (A table for two, please)',
      'Quel vin recommandez-vous avec ce plat? (What wine do you recommend with this dish?)',
    ],
  },
  {
    id: 'mat-es-market',
    title: 'Mercado Fresh Produce & Bargaining',
    category: 'Local Life',
    language: 'Spanish',
    flag: '🇪🇸',
    description: 'Conversations with market vendors, asking about freshness, weights in kilograms, and polite compliments.',
    pages: 7,
    sampleSnippets: [
      '¿A cuánto están las fresas hoy? (How much are the strawberries today?)',
      'Deme medio kilo de queso, por favor (Give me half a kilo of cheese, please)',
    ],
  },
];

export const MaterialsView: React.FC = () => {
  const { pdfFiles, addPdfFile, removePdfFile } = useUser();
  const { setActiveSection } = useUI();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
      console.error('Failed to parse PDF:', e);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const filteredCurated = CURATED_MATERIALS.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#FFF5F8] via-[#FFFDFB] to-[#FFF5F8] p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#FFDCE6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#E6194B]">
              Learning Library
            </span>
            <span className="text-xs">📚</span>
          </div>
          <h1 className="font-display font-black text-3xl text-[#2A0E17]">
            Lesson Materials & PDF Context
          </h1>
          <p className="text-sm text-[#7D5464] font-medium mt-1">
            Upload course PDFs or activate curated curriculum sheets for your Gemini Live tutor.
          </p>
        </div>

        {/* Upload Button */}
        <label className="y2k-candy-btn cursor-pointer inline-flex items-center gap-2 self-start sm:self-auto">
          <Upload className="w-4 h-4" />
          <span>{isUploading ? 'Extracting Text...' : 'Upload PDF Document'}</span>
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* User Uploaded Documents Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#E6194B]" />
            <h2 className="font-display font-black text-lg text-[#2A0E17]">
              Your Uploaded Documents ({pdfFiles?.length || 0})
            </h2>
          </div>
          <span className="text-xs font-bold text-[#8C6473]">
            These PDFs are fed into Gemini Live tutor's active context!
          </span>
        </div>

        {(!pdfFiles || pdfFiles.length === 0) ? (
          <div className="p-8 rounded-3xl bg-white border-2 border-dashed border-[#FFCBD9] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F4] text-[#E6194B] flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-base text-[#2A0E17]">
              No custom PDFs uploaded yet
            </h3>
            <p className="text-xs text-[#7C5564] max-w-md mx-auto">
              Upload textbook chapters, travel itineraries, homework sheets, or vocabulary lists. Your AI tutor will ground questions and practice drills directly on your text!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pdfFiles.map(pdf => (
              <div
                key={pdf.name}
                className="p-4 rounded-2xl bg-white border border-[#FFDCE6] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FFE4ED] text-[#E6194B] flex items-center justify-center font-black text-xs">
                        PDF
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xs text-[#2A0E17] truncate" title={pdf.name}>
                          {pdf.name}
                        </h4>
                        <p className="text-[10px] text-[#8C6473] mt-0.5">
                          {pdf.text.length.toLocaleString()} characters extracted
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removePdfFile(pdf.name)}
                      className="text-[#A87285] hover:text-[#E6194B] p-1 transition-colors"
                      title="Remove PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-[11px] text-[#6F4C5B] mt-3 line-clamp-3 bg-[#FFF8FA] p-2.5 rounded-xl border border-[#FFE8EE] italic">
                    "{pdf.text.slice(0, 160)}..."
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#FFE5ED] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Active in AI context
                  </span>
                  <button
                    onClick={() => setActiveSection('live-tutor')}
                    className="text-xs font-bold text-[#E6194B] hover:underline inline-flex items-center gap-1"
                  >
                    Practice this →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Curated Study Packs */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E6194B]" />
            <h2 className="font-display font-black text-lg text-[#2A0E17]">
              Curated Curriculum Packs
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8C6473]" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search curriculum..."
                className="pl-8 pr-3 py-1.5 rounded-full bg-white border border-[#FFDCE6] text-xs text-[#2A0E17] placeholder:text-[#A87285] focus:outline-none focus:border-[#E6194B]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCurated.map(mat => (
            <div
              key={mat.id}
              className="p-5 rounded-3xl bg-white border border-[#FFDCE6] shadow-sm flex flex-col justify-between hover:border-[#FFB0C4] hover:shadow-md transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{mat.flag}</span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#E6194B] bg-[#FFF0F4] px-2 py-0.5 rounded-full border border-[#FFD8E3]">
                    {mat.category}
                  </span>
                </div>

                <h3 className="font-display font-black text-base text-[#2A0E17] group-hover:text-[#E6194B] transition-colors">
                  {mat.title}
                </h3>
                <p className="text-xs text-[#7C5564] mt-1 line-clamp-2">
                  {mat.description}
                </p>

                <div className="mt-3 space-y-1.5 bg-[#FFF8FA] p-3 rounded-2xl border border-[#FFE8EE]">
                  <span className="text-[10px] font-black text-[#A87285] uppercase tracking-wider">
                    Key Drill Excerpts:
                  </span>
                  {mat.sampleSnippets.map((snip, idx) => (
                    <p key={idx} className="text-[11px] text-[#4A2D3A] font-medium truncate">
                      • {snip}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#FFE5ED] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8C6473]">
                  {mat.pages} Pages • Ready
                </span>
                <button
                  onClick={() => {
                    const sampleText = `${mat.title}\n${mat.description}\n` + mat.sampleSnippets.join('\n');
                    addPdfFile({ name: `${mat.title}.pdf`, text: sampleText });
                    setActiveSection('live-tutor');
                  }}
                  className="y2k-candy-btn text-xs px-3.5 py-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Study Pack →</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
