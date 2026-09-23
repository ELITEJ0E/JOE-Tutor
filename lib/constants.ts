/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Default Live API model to use
 */
export const DEFAULT_LIVE_API_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

export const SUPPORTED_LIVE_MODELS = [
  'gemini-2.5-flash-native-audio-preview-09-2025',
  'gemini-2.0-flash-exp',
];

export const FONT_OPTIONS = [
  'Inter',
  'Plus Jakarta Sans',
  'Arial',
  'Verdana',
  'Georgia',
  'Times New Roman',
  'Roboto',
  'Montserrat',
  'Playfair Display',
  'Merriweather',
  'Space Mono',
];

export const PLACEHOLDER_DOC = `# Welcome to JOE Tutor! 🌸✨

I'm **JOE**, your interactive AI learning companion. Together, we can explore any subject, solve difficult problems, take interactive notes, and visualize complex ideas.

### How we learn together:
- 🎙️ **Natural Voice Conversation:** Just speak! I explain concepts step-by-step, answer your questions, and adapt to your pace.
- 📐 **Live Interactive Math:** Ask me to derive equations with LaTeX formatting (e.g. $$e^{i\\pi} + 1 = 0$$) or plot dynamic curves.
- 🎨 **Instant Diagrams & Visuals:** I can generate diagrams, illustrations, and maps on the fly.
- 📝 **Live Collaborative Notes:** As we discuss, I draft clean, structured study sheets you can edit anytime.
- ⚡ **Study Summaries & Quizzes:** Switch tabs anytime to review instant takeaways, generated flashcards, and test yourself!

*Press the pink **Start Tutoring Session** button below to begin!*`;

export const QUICK_TOPICS = [
  { label: 'Calculus & Derivatives', icon: 'functions', prompt: 'Teach me about calculus derivatives and plot a tangent line on a parabola.' },
  { label: 'Organic Chemistry', icon: 'science', prompt: 'Explain the mechanism of nucleophilic substitution reactions step-by-step.' },
  { label: 'Quantum Physics', icon: 'scatter_plot', prompt: 'Explain the wave-particle duality and the double-slit experiment.' },
  { label: 'Python & Data Structures', icon: 'terminal', prompt: 'Walk me through binary search trees and how insertion works.' },
  { label: 'World History', icon: 'public', prompt: 'Give me a structured summary of the Renaissance and its lasting cultural impacts.' },
  { label: 'Creative Writing', icon: 'stylus_note', prompt: 'Help me outline a high-concept sci-fi short story with a memorable protagonist.' },
];
