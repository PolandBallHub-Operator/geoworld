import React from 'react';
import { X, Volume2, VolumeX, Music, Sliders, Check } from 'lucide-react';
import { GameSettings } from '../types/game';
import { soundManager } from '../utils/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-400 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-500" />
            <span>ゲーム設定</span>
          </h3>
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

        <div className="space-y-4">
          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-6 h-6 text-sky-600" />
              ) : (
                <VolumeX className="w-6 h-6 text-slate-400" />
              )}
              <div>
                <span className="font-black text-slate-800 text-sm block">効果音 (SE)</span>
                <span className="text-xs text-slate-500">掘削やジャンプの音声を再生</span>
              </div>
            </div>

            <button
              onClick={() => {
                const nextVal = !settings.soundEnabled;
                soundManager.setEnabled(nextVal);
                onUpdateSettings({ soundEnabled: nextVal });
                if (nextVal) soundManager.playClick();
              }}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                settings.soundEnabled ? 'bg-sky-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* BGM Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 text-emerald-600" />
              <div>
                <span className="font-black text-slate-800 text-sm block">環境BGM (癒やしメロディ)</span>
                <span className="text-xs text-slate-500">のんびりとした五音音階サウンド</span>
              </div>
            </div>

            <button
              onClick={() => {
                const nextVal = !settings.bgmEnabled;
                soundManager.toggleBgm(nextVal);
                onUpdateSettings({ bgmEnabled: nextVal });
              }}
              className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${
                settings.bgmEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Operational guide */}
          <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-900 leading-relaxed">
            <span className="font-black block mb-1">🎮 操作方法ガイド (Minecraft / Robloxスタイル):</span>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>PC: <kbd className="bg-white px-1 py-0.5 rounded border">W</kbd><kbd className="bg-white px-1 py-0.5 rounded border">A</kbd><kbd className="bg-white px-1 py-0.5 rounded border">S</kbd><kbd className="bg-white px-1 py-0.5 rounded border">D</kbd> でカメラ基準移動、マウス移動で視点変更（画面クリックで視点ロック）</li>
              <li>モバイル: 画面左のスティックでカメラ向きへ移動、画面右半分をスワイプして視点変更</li>
              <li>ジャンプ: 画面右下のジャンプボタン（ダッシュの横）またはスペースキー</li>
              <li>ツール使用: 画面右下の「使う」ボタンまたはクリック / Eキー</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl shadow active:scale-95 transition-all text-sm"
          >
            完了
          </button>
        </div>
      </div>
    </div>
  );
};
