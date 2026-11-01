import React, { useState } from 'react';
import { X, Handshake, Award, HelpCircle, CheckCircle2, Gift, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { VisitingBall } from '../types/game';
import { COUNTRIES } from '../data/countries';
import { CountryBallAvatar } from './CountryBallAvatar';
import { soundManager } from '../utils/audio';

interface DiplomacyModalProps {
  visitor: VisitingBall;
  onClose: () => void;
  onSignTreaty: () => void;
  onAnswerQuiz: (correct: boolean, reward: number) => void;
}

export const DiplomacyModal: React.FC<DiplomacyModalProps> = ({
  visitor,
  onClose,
  onSignTreaty,
  onAnswerQuiz,
}) => {
  const country = COUNTRIES[visitor.countryId];
  const [hasSigned, setHasSigned] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const quiz = visitor.geographyQuiz;

  const handleSign = () => {
    soundManager.playDiplomacyFanfare();
    confetti({ particleCount: 40, spread: 60 });
    setHasSigned(true);
    onSignTreaty();
  };

  const handleOptionSelect = (index: number) => {
    if (quizSubmitted || !quiz) return;
    soundManager.playClick();
    setSelectedOption(index);
    setQuizSubmitted(true);
    const correct = index === quiz.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      soundManager.playCoin();
      confetti({ particleCount: 60, spread: 80 });
      onAnswerQuiz(true, 100);
    } else {
      onAnswerQuiz(false, 20);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Handshake className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-black text-slate-800">平和外交サミット</h3>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visiting Countryball Intro */}
        <div className="flex items-center gap-4 bg-amber-50/70 p-4 rounded-2xl border border-amber-200">
          <CountryBallAvatar
            countryId={visitor.countryId}
            expressionId={visitor.expressionId}
            size={72}
            className="ring-2 ring-amber-400"
          />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{country.flagEmoji}</span>
              <h4 className="font-black text-slate-900 text-lg">{country.name} 特使</h4>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              大陸: <span className="font-bold text-sky-700">{country.continent}</span> | 首都: <span className="font-bold text-slate-800">{country.capital}</span>
            </p>
            <p className="text-xs font-bold text-amber-900 mt-2 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
              💬「{visitor.speechBubble || '平和な世界を一緒につくろう！'}」
            </p>
          </div>
        </div>

        {/* Action 1: Sign Peace Treaty */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>平和友好文化条約の締結</span>
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">
                戦いのない平和な交流条約を結び、文化を発展させます。
              </p>
            </div>

            <button
              onClick={handleSign}
              disabled={hasSigned}
              className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${
                hasSigned
                  ? 'bg-emerald-100 text-emerald-800 cursor-default flex items-center gap-1'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow active:scale-95'
              }`}
            >
              {hasSigned ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>条約締結済 (+150🪙)</span>
                </>
              ) : (
                '条約に調印する (+150🪙)'
              )}
            </button>
          </div>
        </div>

        {/* Action 2: Middle/High school Geography Quiz */}
        {quiz && (
          <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200">
            <h5 className="font-black text-sky-950 text-sm flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>{country.name}からの地理クイズ挑戦！ (+100🪙)</span>
            </h5>
            <p className="text-xs font-bold text-slate-700 mb-3">{quiz.question}</p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {quiz.options.map((opt, idx) => {
                let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:border-sky-300';
                if (quizSubmitted) {
                  if (idx === quiz.correctIndex) {
                    btnStyle = 'bg-emerald-500 text-white border-emerald-600 font-black';
                  } else if (idx === selectedOption) {
                    btnStyle = 'bg-red-500 text-white border-red-600 font-black';
                  } else {
                    btnStyle = 'bg-slate-100 text-slate-400 border-slate-200';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={quizSubmitted}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="mt-3 p-2.5 bg-white rounded-xl border border-sky-200 text-xs">
                <span className={`font-black ${isCorrect ? 'text-emerald-600' : 'text-amber-700'}`}>
                  {isCorrect ? '🎉 正解です！(+100コイン獲得)' : '💡 惜しい！勉強になりました！(+20コイン参加賞)'}
                </span>
                <p className="text-slate-600 mt-1">{quiz.explanation}</p>
              </div>
            )}
          </div>
        )}

        {/* Close */}
        <div className="flex justify-end pt-1">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-xl transition-all"
          >
            会話を終了する
          </button>
        </div>
      </div>
    </div>
  );
};
