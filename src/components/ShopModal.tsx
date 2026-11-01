import React, { useState } from 'react';
import { X, Coins, Check, Lock, Sparkles, Globe, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CountryId, ExpressionId, PlayerStats } from '../types/game';
import { COUNTRIES, EXPRESSIONS, COUNTRY_KEYS, EXPRESSION_KEYS } from '../data/countries';
import { CountryBallAvatar } from './CountryBallAvatar';
import { soundManager } from '../utils/audio';

interface ShopModalProps {
  stats: PlayerStats;
  onClose: () => void;
  onBuyCountry: (countryId: CountryId, price: number) => void;
  onBuyExpression: (expressionId: ExpressionId, price: number) => void;
  onEquipCountry: (countryId: CountryId) => void;
  onEquipExpression: (expressionId: ExpressionId) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  stats,
  onClose,
  onBuyCountry,
  onBuyExpression,
  onEquipCountry,
  onEquipExpression,
}) => {
  const [activeTab, setActiveTab] = useState<'countries' | 'expressions'>('countries');

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-slate-50 rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 border-b-4 border-amber-500">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛍️</span>
            <div>
              <h2 className="text-2xl font-black text-amber-950">ワールドショップ</h2>
              <p className="text-xs font-bold text-amber-900">
                コインで新しい国ボールや表情を開放しよう！
              </p>
            </div>
          </div>

          {/* Current Coins display */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-2xl shadow-inner border border-amber-300">
              <Coins className="w-6 h-6 text-amber-500 fill-amber-400 animate-bounce" />
              <span className="text-xl font-black text-amber-950">
                {stats.coins.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-amber-800">コイン</span>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-2 text-amber-950 hover:bg-amber-400/50 rounded-full transition-colors"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 bg-white border-b border-slate-200">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('countries');
            }}
            className={`flex items-center gap-2 px-6 py-3 font-black text-sm rounded-t-2xl border-t-2 border-x-2 transition-all ${
              activeTab === 'countries'
                ? 'bg-slate-50 text-sky-700 border-sky-400 shadow-sm'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Globe className="w-5 h-5 text-sky-500" />
            <span>国ボール ({COUNTRY_KEYS.length})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('expressions');
            }}
            className={`flex items-center gap-2 px-6 py-3 font-black text-sm rounded-t-2xl border-t-2 border-x-2 transition-all ${
              activeTab === 'expressions'
                ? 'bg-slate-50 text-amber-700 border-amber-400 shadow-sm'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-800'
            }`}
          >
            <Smile className="w-5 h-5 text-amber-500" />
            <span>表情パック ({EXPRESSION_KEYS.length})</span>
          </button>
        </div>

        {/* Shop Items Grid Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'countries' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COUNTRY_KEYS.map((cId) => {
                const country = COUNTRIES[cId];
                const isUnlocked = stats.unlockedCountries.includes(cId);
                const isEquipped = stats.selectedCountry === cId;
                const canAfford = stats.coins >= country.price;

                return (
                  <div
                    key={cId}
                    className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all bg-white shadow-sm hover:shadow-md ${
                      isEquipped
                        ? 'border-sky-500 ring-2 ring-sky-300 bg-sky-50/40'
                        : isUnlocked
                        ? 'border-emerald-300'
                        : 'border-slate-200 opacity-95'
                    }`}
                  >
                    {/* Equipped Badge */}
                    {isEquipped && (
                      <span className="absolute top-3 right-3 bg-sky-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow">
                        装備中
                      </span>
                    )}

                    <div className="flex items-start gap-3 mb-3">
                      <CountryBallAvatar
                        countryId={cId}
                        expressionId={stats.selectedExpression}
                        size={64}
                        className="border-2 border-slate-100 bg-slate-50"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{country.flagEmoji}</span>
                          <h3 className="font-black text-slate-800 text-base">
                            {country.name}
                          </h3>
                        </div>
                        <p className="text-xs font-bold text-slate-500">{country.nameEn}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          首都: <span className="font-semibold text-slate-800">{country.capital}</span>
                        </p>
                      </div>
                    </div>

                    {/* Geography Fact Card */}
                    <div className="bg-slate-100/80 rounded-xl p-2.5 text-xs text-slate-700 leading-relaxed mb-4 border border-slate-200">
                      <span className="font-bold text-sky-700 block mb-0.5">📚 地理ワンポイント:</span>
                      {country.geographyFact}
                    </div>

                    {/* Bottom Action */}
                    <div>
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-2 bg-sky-100 text-sky-800 font-bold text-sm rounded-xl cursor-default"
                        >
                          使用中
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onEquipCountry(cId);
                          }}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow transition-all active:scale-95"
                        >
                          これにする！ (装備)
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              soundManager.playCoin();
                              triggerConfetti();
                              onBuyCountry(cId, country.price);
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2 flex items-center justify-center gap-2 font-black text-sm rounded-xl shadow transition-all ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 active:scale-95'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                          <span>{country.price} コインで開放</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Expressions Tab */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EXPRESSION_KEYS.map((eId) => {
                const exp = EXPRESSIONS[eId];
                const isUnlocked = stats.unlockedExpressions.includes(eId);
                const isEquipped = stats.selectedExpression === eId;
                const canAfford = stats.coins >= exp.price;

                return (
                  <div
                    key={eId}
                    className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all bg-white shadow-sm hover:shadow-md ${
                      isEquipped
                        ? 'border-amber-500 ring-2 ring-amber-300 bg-amber-50/40'
                        : isUnlocked
                        ? 'border-emerald-300'
                        : 'border-slate-200'
                    }`}
                  >
                    {isEquipped && (
                      <span className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow">
                        装備中
                      </span>
                    )}

                    <div className="flex items-center gap-4 mb-3">
                      <CountryBallAvatar
                        countryId={stats.selectedCountry}
                        expressionId={eId}
                        size={64}
                        className="border-2 border-slate-100 bg-slate-50"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{exp.emoji}</span>
                          <h3 className="font-black text-slate-800 text-base">{exp.name}</h3>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{exp.description}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {isEquipped ? (
                        <button
                          disabled
                          className="w-full py-2 bg-amber-100 text-amber-800 font-bold text-sm rounded-xl cursor-default"
                        >
                          使用中
                        </button>
                      ) : isUnlocked ? (
                        <button
                          onClick={() => {
                            soundManager.playClick();
                            onEquipExpression(eId);
                          }}
                          className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow transition-all active:scale-95"
                        >
                          この表情にする！
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              soundManager.playCoin();
                              triggerConfetti();
                              onBuyExpression(eId, exp.price);
                            }
                          }}
                          disabled={!canAfford}
                          className={`w-full py-2 flex items-center justify-center gap-2 font-black text-sm rounded-xl shadow transition-all ${
                            canAfford
                              ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 active:scale-95'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-4 h-4" />
                          <span>{exp.price} コインで開放</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
