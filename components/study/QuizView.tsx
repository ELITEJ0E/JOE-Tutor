/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useUI, useUser } from '../../lib/state';
import { Sparkles, HelpCircle, CheckCircle2, RotateCcw, ArrowRight, Lightbulb, BookOpen } from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function QuizView() {
  const { documentContent } = useUI();
  const { topic } = useUser();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [activeTab, setActiveTab] = useState<'quiz' | 'flashcards'>('quiz');
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Generate dynamic questions based on current document content
  const questions: QuizQuestion[] = useMemo(() => {
    // If user has mathematical or specific content in document
    const text = documentContent.toLowerCase();

    if (text.includes('derivative') || text.includes('calculus') || text.includes('slope')) {
      return [
        {
          id: 1,
          question: 'What does the first derivative f\'(x) geometrically represent for a curve y = f(x)?',
          options: [
            'The total area under the curve between two points',
            'The slope of the tangent line at any point x',
            'The point of inflection where curvature reverses',
            'The horizontal asymptote of the function'
          ],
          correctIndex: 1,
          explanation: 'The derivative f\'(x) is defined as the limit of the difference quotient and gives the instantaneous rate of change or tangent slope at x.'
        },
        {
          id: 2,
          question: 'By the Power Rule, what is the derivative of f(x) = x^4 - 3x^2 + 5?',
          options: [
            '4x^3 - 6x',
            '4x^4 - 6x + 5',
            'x^3 - 3x',
            '4x^3 - 6x + 5'
          ],
          correctIndex: 0,
          explanation: 'd/dx(x^n) = n*x^(n-1). Thus d/dx(x^4) = 4x^3, d/dx(-3x^2) = -6x, and the derivative of constant 5 is 0.'
        },
        {
          id: 3,
          question: 'If f\'(c) = 0 and f\'\'(c) > 0, what does the Second Derivative Test tell us about x = c?',
          options: [
            'x = c is a local maximum',
            'x = c is an inflection point',
            'x = c is a local minimum',
            'The test is inconclusive'
          ],
          correctIndex: 2,
          explanation: 'A zero first derivative means a stationary point, and a positive second derivative indicates concave up (opening upwards), confirming a local minimum.'
        }
      ];
    }

    if (text.includes('reaction') || text.includes('nucleophilic') || text.includes('chemistry')) {
      return [
        {
          id: 1,
          question: 'In an SN2 substitution mechanism, which rate law describes the reaction kinetics?',
          options: [
            'Rate = k[Substrate]',
            'Rate = k[Substrate][Nucleophile]',
            'Rate = k[Nucleophile]^2',
            'Rate = k[Substrate] / [Leaving Group]'
          ],
          correctIndex: 1,
          explanation: 'SN2 stands for Substitution Nucleophilic Bimolecular; both the nucleophile and the alkyl halide participate in the single rate-determining step.'
        },
        {
          id: 2,
          question: 'What stereochemical consequence occurs during an SN2 attack on a chiral center?',
          options: [
            'Retention of stereochemical configuration',
            'Racemization (50/50 mixture of enantiomers)',
            'Inversion of configuration (Walden inversion)',
            'No stereochemical effect'
          ],
          correctIndex: 2,
          explanation: 'Because the nucleophile attacks from the backside (opposite the leaving group), complete inversion of stereochemistry occurs.'
        }
      ];
    }

    // Default universal tutor study questions
    return [
      {
        id: 1,
        question: 'Which active recall technique is most effective for long-term conceptual retention?',
        options: [
          'Passive re-reading of highlighting text multiple times',
          'Self-testing through practice questions and spaced retrieval',
          'Copying paragraphs verbatim into a notebook',
          'Cramming right before an examination'
        ],
        correctIndex: 1,
        explanation: 'Empirical cognitive science shows spaced retrieval testing strengthens neural pathways and produces deeper conceptual retention than re-reading.'
      },
      {
        id: 2,
        question: 'How does the Feynman Technique help in mastering difficult academic topics?',
        options: [
          'By memorizing exact formulas without understanding variables',
          'By explaining the concept in plain, simple terms as if teaching a beginner',
          'By reading advanced graduate research papers first',
          'By avoiding diagrams and visual aids'
        ],
        correctIndex: 1,
        explanation: 'Teaching a concept simply exposes your knowledge gaps, forcing you to distill foundational principles and remove jargon.'
      },
      {
        id: 3,
        question: 'What is the primary benefit of linking algebraic concepts to visual graphs?',
        options: [
          'It eliminates the need for mathematical rigor',
          'It activates dual-coding theory, pairing verbal/symbolic memory with spatial intuition',
          'It makes computation slower',
          'Graphs are only for presentation purposes'
        ],
        correctIndex: 1,
        explanation: 'Dual-coding theory demonstrates that learning improves when abstract mathematical notation is paired with visual and spatial representations.'
      }
    ];
  }, [documentContent]);

  const flashcards = useMemo(() => {
    return questions.map(q => ({
      front: q.question,
      back: `${q.options[q.correctIndex]}\n\n💡 Explanation: ${q.explanation}`,
    }));
  }, [questions]);

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    setShowExplanation(prev => ({ ...prev, [questionId]: true }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowExplanation({});
  };

  const totalScore = Object.entries(selectedAnswers).reduce((acc, [qId, optIdx]) => {
    const q = questions.find(item => item.id === Number(qId));
    return q && q.correctIndex === optIdx ? acc + 1 : acc;
  }, 0);

  return (
    <div className="quiz-view-container">
      {/* View Header */}
      <div className="quiz-header">
        <div className="quiz-title-wrap">
          <div className="quiz-icon-badge">
            <Sparkles size={20} className="text-cherry-500" />
          </div>
          <div>
            <h2 className="quiz-title">Practice & Retention Lab</h2>
            <p className="quiz-subtitle">
              Interactive check-for-understanding questions based on {topic ? `"${topic}"` : 'your current study session'}.
            </p>
          </div>
        </div>

        <div className="quiz-controls-right">
          <div className="quiz-tab-switcher">
            <button
              className={`quiz-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <HelpCircle size={14} />
              <span>Multiple Choice</span>
            </button>
            <button
              className={`quiz-tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setActiveTab('flashcards')}
            >
              <BookOpen size={14} />
              <span>Flashcards</span>
            </button>
          </div>

          {activeTab === 'quiz' && (
            <button className="quiz-reset-btn" onClick={handleReset} title="Reset Quiz">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'quiz' ? (
        <div className="quiz-questions-list">
          {/* Score banner if answered */}
          {Object.keys(selectedAnswers).length > 0 && (
            <div className="quiz-score-banner">
              <span className="score-text">
                Current Score: <strong>{totalScore}</strong> / {questions.length} answered
              </span>
              <span className="score-percentage">
                ({Math.round((totalScore / questions.length) * 100)}%)
              </span>
            </div>
          )}

          {questions.map((q, qIndex) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const selectedOpt = selectedAnswers[q.id];
            const isCorrect = selectedOpt === q.correctIndex;

            return (
              <div key={q.id} className="quiz-question-card">
                <div className="question-number">Question {qIndex + 1}</div>
                <h3 className="question-text">{q.question}</h3>

                <div className="question-options-grid">
                  {q.options.map((opt, optIndex) => {
                    let optionClass = 'quiz-option-btn';
                    if (isAnswered) {
                      if (optIndex === q.correctIndex) {
                        optionClass += ' is-correct';
                      } else if (selectedOpt === optIndex) {
                        optionClass += ' is-incorrect';
                      } else {
                        optionClass += ' is-disabled';
                      }
                    }

                    return (
                      <button
                        key={optIndex}
                        className={optionClass}
                        onClick={() => !isAnswered && handleSelectOption(q.id, optIndex)}
                        disabled={isAnswered}
                      >
                        <span className="option-letter">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="option-label">{opt}</span>
                        {isAnswered && optIndex === q.correctIndex && (
                          <CheckCircle2 size={16} className="option-icon text-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && showExplanation[q.id] && (
                  <div className={`quiz-explanation ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <div className="explanation-header">
                      <Lightbulb size={16} />
                      <span>{isCorrect ? 'Brilliant! Correct answer.' : 'Good attempt! Review explanation:'}</span>
                    </div>
                    <p className="explanation-text">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flashcards Mode */
        <div className="flashcards-container">
          <div className="flashcard-counter">
            Card {cardIndex + 1} of {flashcards.length}
          </div>

          <div
            className={`flashcard-3d ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="flashcard-face flashcard-front">
              <span className="face-label">Question</span>
              <p className="flashcard-text">{flashcards[cardIndex].front}</p>
              <span className="click-to-flip">Click to flip for answer ↻</span>
            </div>
            <div className="flashcard-face flashcard-back">
              <span className="face-label">Answer & Explanation</span>
              <p className="flashcard-text">{flashcards[cardIndex].back}</p>
              <span className="click-to-flip">Click to flip back ↻</span>
            </div>
          </div>

          <div className="flashcard-nav">
            <button
              className="flashcard-btn"
              disabled={cardIndex === 0}
              onClick={() => {
                setIsFlipped(false);
                setCardIndex(prev => Math.max(0, prev - 1));
              }}
            >
              Previous
            </button>
            <button
              className="flashcard-btn primary"
              disabled={cardIndex === flashcards.length - 1}
              onClick={() => {
                setIsFlipped(false);
                setCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
              }}
            >
              <span>Next Card</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
