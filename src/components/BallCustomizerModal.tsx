import React, { useRef } from 'react';
import { X, Sliders, Image as ImageIcon, Sparkles, RotateCcw, Check } from 'lucide-react';
import { PlayerStats } from '../types/game';
import { soundManager } from '../utils/audio';

interface BallCustomizerModalProps {
  stats: PlayerStats;
  onUpdateStats: (newStats: Partial<PlayerStats>) => void;
  onClose: () => void;
}

export const BallCustomizerModal: React.FC<BallCustomizerModalProps> = ({
  stats,
  onUpdateStats,
  onClose,
}) => {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFrontImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundManager.playClick();
        onUpdateStats({
          selectedCountry: 'custom',
          customFrontFlagDataUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundManager.playClick();
        onUpdateStats({
          selectedCountry: 'custom',
          customBackFlagDataUrl: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetCustomFlags = () => {
    soundManager.playClick();
    onUpdateStats({
      customFrontFlagDataUrl: undefined,
      customBackFlagDataUrl: undefined,
    });
  };

  const handleResetSlidres = () => {
    soundManager.playClick();
    onUpdateStats({
      outlineThickness: 0.095,
      eyeScale: 1.0,
      eyeSpacing: 1.0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-400 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-sky-500" />
            <h3 className="text-xl font-black text-slate-800">国ボールカスタマイズ</h3>
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

        {/* 1. Custom Flag Dual File Pickers */}
        <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-sky-950 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <span>オリジナルカスタム国旗 (表・裏)</span>
            </span>
            {(stats.customFrontFlagDataUrl || stats.customBackFlagDataUrl) && (
              <button
                onClick={handleResetCustomFlags}
                className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>リセット</span>
              </button>
            )}
          </div>
          <p className="text-xs text-slate-600 font-bold leading-relaxed">
            長方形の画像もボール全体へ余白なく綺麗に自動ラップされます。
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Front Flag Picker */}
            <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-black text-slate-700 mb-2">表面 (目側)</span>
              {stats.customFrontFlagDataUrl ? (
                <img
                  src={stats.customFrontFlagDataUrl}
                  alt="Front flag"
                  className="w-16 h-12 object-cover rounded-lg border border-slate-300 mb-2 shadow-inner"
                />
              ) : (
                <div className="w-16 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs mb-2">
                  未設定
                </div>
              )}
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={handleFrontImageUpload}
                className="hidden"
              />
              <button
                onClick={() => frontInputRef.current?.click()}
                className="w-full py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                画像を選択
              </button>
            </div>

            {/* Back Flag Picker */}
            <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-black text-slate-700 mb-2">裏面 (背面側)</span>
              {stats.customBackFlagDataUrl ? (
                <img
                  src={stats.customBackFlagDataUrl}
                  alt="Back flag"
                  className="w-16 h-12 object-cover rounded-lg border border-slate-300 mb-2 shadow-inner"
                />
              ) : (
                <div className="w-16 h-12 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs mb-2">
                  {stats.customFrontFlagDataUrl ? '表面と共通' : '未設定'}
                </div>
              )}
              <input
                ref={backInputRef}
                type="file"
                accept="image/*"
                onChange={handleBackImageUpload}
                className="hidden"
              />
              <button
                onClick={() => backInputRef.current?.click()}
                className="w-full py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
              >
                画像を選択
              </button>
            </div>
          </div>
        </div>

        {/* 2. Shape, Outline & Eye Sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-black text-sm text-slate-800">ボールの見た目微調整</span>
            <button
              onClick={handleResetSlidres}
              className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>初期値に戻す</span>
            </button>
          </div>

          {/* Outline Thickness Slider */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-700">
              <span>黒アウトラインの太さ</span>
              <span className="font-mono text-sky-600">{stats.outlineThickness.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.03"
              max="0.16"
              step="0.005"
              value={stats.outlineThickness}
              onChange={(e) => onUpdateStats({ outlineThickness: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Eye Size Slider */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-700">
              <span>目の大きさ (サイズ)</span>
              <span className="font-mono text-sky-600">{stats.eyeScale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.05"
              value={stats.eyeScale}
              onChange={(e) => onUpdateStats({ eyeScale: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Eye Spacing Slider */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-1.5 text-xs font-bold text-slate-700">
              <span>目の間隔 (寄り目 ↔ 離れ目)</span>
              <span className="font-mono text-sky-600">{stats.eyeSpacing.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.6"
              step="0.05"
              value={stats.eyeSpacing}
              onChange={(e) => onUpdateStats({ eyeSpacing: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>

        {/* Complete button */}
        <div className="pt-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white font-black rounded-2xl shadow-md transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>設定を反映して閉じる</span>
          </button>
        </div>
      </div>
    </div>
  );
};
