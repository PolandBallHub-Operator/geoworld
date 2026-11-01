import React, { useState, useRef } from 'react';
import { X, Sparkles, Image as ImageIcon, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CustomBallDef } from '../types/game';
import { soundManager } from '../utils/audio';

interface CustomBallModalProps {
  onAddBall: (ball: CustomBallDef) => void;
  onClose: () => void;
}

export const CustomBallModal: React.FC<CustomBallModalProps> = ({ onAddBall, onClose }) => {
  const [name, setName] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) setFrontImage(url);
    };
    reader.readAsDataURL(file);
  };

  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) setBackImage(url);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !frontImage) return;

    soundManager.playCoin();
    confetti({ particleCount: 50, spread: 70 });

    const newBall: CustomBallDef = {
      id: `cball_${Date.now()}`,
      name: name.trim(),
      frontFlagUrl: frontImage,
      backFlagUrl: backImage || frontImage,
      createdAt: Date.now(),
    };

    onAddBall(newBall);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-400 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-black text-slate-800">新しい国ボールを作る</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-black text-slate-700 block mb-1">国ボールの名前</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: マイスター国ボール"
            maxLength={18}
            required
            className="w-full px-3 py-2 font-bold text-sm border-2 border-slate-300 focus:border-amber-400 rounded-xl outline-none"
          />
        </div>

        {/* Flag pickers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-black text-slate-700 mb-1.5">表面 (顔側) *</span>
            {frontImage ? (
              <img
                src={frontImage}
                alt="Front"
                className="w-16 h-12 object-cover rounded-lg border border-slate-300 mb-2 shadow"
              />
            ) : (
              <div className="w-16 h-12 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[10px] mb-2 font-bold">
                画像必須
              </div>
            )}
            <input
              ref={frontInputRef}
              type="file"
              accept="image/*"
              onChange={handleFrontUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => frontInputRef.current?.click()}
              className="w-full py-1 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-lg transition-colors shadow-sm"
            >
              画像を選ぶ
            </button>
          </div>

          <div className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-black text-slate-700 mb-1.5">裏面 (背面側)</span>
            {backImage ? (
              <img
                src={backImage}
                alt="Back"
                className="w-16 h-12 object-cover rounded-lg border border-slate-300 mb-2 shadow"
              />
            ) : (
              <div className="w-16 h-12 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-[10px] mb-2 font-bold">
                表面と共通
              </div>
            )}
            <input
              ref={backInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => backInputRef.current?.click()}
              className="w-full py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              画像を選ぶ
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700 text-xs"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!frontImage || !name.trim()}
            className={`px-6 py-2.5 font-black text-sm rounded-xl shadow active:scale-95 transition-all flex items-center gap-1.5 ${
              frontImage && name.trim()
                ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>作成する！</span>
          </button>
        </div>
      </form>
    </div>
  );
};
