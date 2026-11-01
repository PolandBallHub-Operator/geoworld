import React, { useState, useEffect } from 'react';
import { Play, Settings, Share2, Twitter, Sparkles, Globe, Shuffle, BookOpen, Server } from 'lucide-react';
import { CountryBallAvatar } from './CountryBallAvatar';
import { CountryId, ExpressionId } from '../types/game';
import { getRandomCountry, getRandomExpression, COUNTRIES } from '../data/countries';
import { soundManager } from '../utils/audio';

interface TitleScreenProps {
  onPlay: () => void;
  onOpenPlayServer: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onPlay, onOpenPlayServer, onOpenSettings }) => {
  // Random mascot balls that shuffle
  const [mascots, setMascots] = useState<Array<{ country: CountryId; expression: ExpressionId }>>([
    { country: 'japan', expression: 'happy.png' },
    { country: 'poland', expression: 'lol.png' },
    { country: 'germany', expression: 'smile.png' },
    { country: 'usa', expression: 'surprise.png' },
    { country: 'france', expression: 'itome.png' },
  ]);

  const [shareSuccess, setShareSuccess] = useState(false);

  // Randomize all mascots on mount and when shuffle button is clicked
  const randomizeMascots = () => {
    soundManager.playClick();
    setMascots([
      { country: getRandomCountry(), expression: getRandomExpression() },
      { country: getRandomCountry(), expression: getRandomExpression() },
      { country: getRandomCountry(), expression: getRandomExpression() },
      { country: getRandomCountry(), expression: getRandomExpression() },
      { country: getRandomCountry(), expression: getRandomExpression() },
    ]);
  };

  useEffect(() => {
    randomizeMascots();
  }, []);

  const handleShareX = () => {
    soundManager.playClick();
    const text = encodeURIComponent(
      '🌍『地理クラブ』で自分だけの世界を3D建築中！世界の国ボールたちと平和な外交や地形エディットを楽しもう！ #地理クラブ #Polandball #学習ゲーム'
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  const handleBrowserShare = async () => {
    soundManager.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: '地理クラブ (Geography Club)',
          text: '中高生向け！健全でポップな3D地球・国ボールサンドボックスゲーム',
          url: window.location.href,
        });
      } catch {
        // Share cancelled or declined
      }
    } else {
      // Fallback: Copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2500);
      } catch {
        // Fallback prompt
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-300 select-none text-slate-800">
      {/* Decorative floating clouds & geography motifs */}
      <div className="absolute top-10 left-8 opacity-75 animate-bounce" style={{ animationDuration: '6s' }}>
        <div className="w-28 h-10 bg-white/80 rounded-full blur-[1px] shadow-sm" />
      </div>
      <div className="absolute top-28 right-16 opacity-70 animate-bounce" style={{ animationDuration: '8s' }}>
        <div className="w-40 h-12 bg-white/85 rounded-full blur-[1px] shadow-sm" />
      </div>
      <div className="absolute bottom-20 left-12 opacity-60 pointer-events-none">
        <Globe className="w-48 h-48 text-emerald-600/20" />
      </div>

      {/* Top Bar with title badge & settings */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-2xl shadow-md border-2 border-sky-200">
          <BookOpen className="w-5 h-5 text-sky-600" />
          <span className="text-sm font-bold text-sky-900 tracking-wide">
            中高生向け グローバル学習サンドボックス
          </span>
        </div>

        <button
          onClick={() => {
            soundManager.playClick();
            onOpenSettings();
          }}
          className="flex items-center gap-2 bg-white/95 hover:bg-white text-slate-700 px-4 py-2 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all border-2 border-slate-200 active:scale-95"
          title="設定"
        >
          <Settings className="w-5 h-5 text-slate-600" />
          <span>設定</span>
        </button>
      </div>

      {/* Center Hero Section */}
      <div className="flex flex-col items-center justify-center my-auto z-10 text-center max-w-2xl">
        {/* Animated Bouncing Countryballs Row */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-4">
          {mascots.map((m, idx) => (
            <div
              key={idx}
              className="relative cursor-pointer transform hover:-translate-y-2 transition-transform duration-200"
              onClick={randomizeMascots}
              title={`${COUNTRIES[m.country].name}ボール (タップでランダムシャッフル)`}
            >
              <CountryBallAvatar
                countryId={m.country}
                expressionId={m.expression}
                size={idx === 2 ? 88 : 64}
                className="drop-shadow-xl"
              />
              {idx === 2 && (
                <span className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 font-black text-xs px-2 py-0.5 rounded-full border border-white shadow">
                  ★
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Mascot shuffle trigger */}
        <button
          onClick={randomizeMascots}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900/80 bg-white/70 hover:bg-white px-3 py-1 rounded-full mb-6 transition-colors shadow-sm"
        >
          <Shuffle className="w-3.5 h-3.5" />
          アイコンをランダムチェンジ！
        </button>

        {/* Pop Title */}
        <div className="relative mb-2">
          <h1 className="text-5xl sm:text-7xl font-black text-white tracking-wider drop-shadow-[0_6px_0_rgba(14,116,144,1)] text-stroke">
            地理クラブ
          </h1>
          <span className="absolute -top-4 -right-8 bg-amber-400 text-amber-950 font-extrabold text-xs sm:text-sm px-3 py-1 rounded-full rotate-12 shadow-lg border-2 border-white">
            3Dワールド
          </span>
        </div>

        <p className="text-sky-950 font-bold text-base sm:text-lg mb-8 max-w-md drop-shadow-sm">
          山や川をつくり、国境をひろげて、世界中の国ボールと平和な外交を楽しもう！
        </p>

        {/* Big PLAY & Play Server Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => {
              soundManager.playClick();
              onPlay();
            }}
            className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-2xl sm:text-3xl px-10 py-5 rounded-3xl shadow-[0_8px_0_rgba(180,83,9,1)] hover:shadow-[0_4px_0_rgba(180,83,9,1)] hover:translate-y-1 active:translate-y-2 transition-all duration-150 border-4 border-white"
          >
            <Play className="w-8 h-8 fill-current transition-transform group-hover:scale-110" />
            <span>Play</span>
            <Sparkles className="w-6 h-6 text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenPlayServer();
            }}
            className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xl sm:text-2xl px-8 py-5 rounded-3xl shadow-[0_8px_0_rgba(30,58,138,1)] hover:shadow-[0_4px_0_rgba(30,58,138,1)] hover:translate-y-1 active:translate-y-2 transition-all duration-150 border-4 border-white"
            title="友達のPeerサーバーに参加する"
          >
            <Server className="w-7 h-7 transition-transform group-hover:rotate-12" />
            <span>Play Server</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Bar: X share & Browser share */}
      <div className="w-full max-w-2xl flex flex-wrap items-center justify-center gap-3 z-10">
        <button
          onClick={handleShareX}
          className="flex items-center gap-2 bg-black hover:bg-neutral-800 text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <Twitter className="w-4 h-4 fill-current" />
          <span>Xで共有</span>
        </button>

        <button
          onClick={handleBrowserShare}
          className="flex items-center gap-2 bg-white/95 hover:bg-white text-sky-800 font-bold text-sm px-5 py-2.5 rounded-2xl shadow-md hover:shadow-lg transition-all border-2 border-sky-100 active:scale-95"
        >
          <Share2 className="w-4 h-4 text-sky-600" />
          <span>みんなに共有 (Share)</span>
        </button>

        {shareSuccess && (
          <div className="fixed bottom-6 bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg animate-bounce">
            リンクをクリップボードにコピーしました！
          </div>
        )}
      </div>
    </div>
  );
};
