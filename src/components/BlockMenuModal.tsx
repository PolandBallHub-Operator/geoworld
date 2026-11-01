import React, { useRef } from 'react';
import { X, Plus, Box, Image as ImageIcon, Sparkles, Check, Trash2 } from 'lucide-react';
import { BlockType, CustomBlockDef } from '../types/game';
import { soundManager } from '../utils/audio';

interface BlockMenuModalProps {
  selectedBlock: string;
  onSelectBlock: (blockId: string) => void;
  customBlocks: CustomBlockDef[];
  onAddCustomBlock: (newBlock: CustomBlockDef) => void;
  onDeleteCustomBlock: (blockId: string) => void;
  onClose: () => void;
}

export const STANDARD_BLOCKS: { id: BlockType; name: string; color: string; desc: string }[] = [
  { id: 'grass', name: '芝生ブロック', color: 'bg-green-600', desc: '緑豊かな標準ブロック' },
  { id: 'dirt', name: '土ブロック', color: 'bg-amber-800', desc: '素朴な土ブロック' },
  { id: 'stone', name: '石ブロック', color: 'bg-slate-500', desc: '丈夫な石材ブロック' },
  { id: 'wood', name: '木材ブロック', color: 'bg-amber-700', desc: 'あたたかみのある木材' },
  { id: 'leaves', name: '葉ブロック', color: 'bg-emerald-600', desc: '木々を彩る緑の葉' },
  { id: 'brick', name: '赤レンガ', color: 'bg-red-700', desc: '建築に最適なレンガ' },
  { id: 'cobblestone', name: '丸石・敷石', color: 'bg-neutral-600', desc: 'クラシックな石畳' },
  { id: 'road', name: 'アスファルト道路', color: 'bg-slate-800', desc: '中央白線つきの道路' },
  { id: 'glass', name: 'ガラスブロック', color: 'bg-sky-200 text-sky-900', desc: '透き通る半透明ガラス' },
  { id: 'lantern', name: 'ランタンブロック', color: 'bg-amber-400 text-amber-950', desc: '温かく光る光源' },
  { id: 'sand', name: '砂ブロック', color: 'bg-amber-300 text-amber-900', desc: '海岸や砂漠の砂' },
  { id: 'snow', name: '雪ブロック', color: 'bg-blue-50 text-blue-900', desc: '白銀の雪ブロック' },
];

export const BlockMenuModal: React.FC<BlockMenuModalProps> = ({
  selectedBlock,
  onSelectBlock,
  customBlocks,
  onAddCustomBlock,
  onDeleteCustomBlock,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomBlockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        soundManager.playCoin();
        const blockName = file.name.replace(/\.[^/.]+$/, '').slice(0, 12) || 'カスタム';
        const newDef: CustomBlockDef = {
          id: `cblock_${Date.now()}`,
          name: blockName,
          textureDataUrl: dataUrl,
        };
        onAddCustomBlock(newDef);
        onSelectBlock(newDef.id);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border-4 border-emerald-400 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Box className="w-6 h-6 text-emerald-600" />
            <div>
              <h3 className="text-xl font-black text-slate-800">建築ブロックメニュー</h3>
              <p className="text-xs text-slate-500 font-bold">
                好きなブロックを選んで一人称視点で自由に建築しよう！
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 1. Standard Blocks Grid */}
          <div>
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
              基本ブロックパレット
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {STANDARD_BLOCKS.map((b) => {
                const isSelected = selectedBlock === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectBlock(b.id);
                      onClose();
                    }}
                    className={`relative p-3 rounded-2xl border-2 text-left transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300 shadow-md scale-102'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl shadow-inner mb-2 flex items-center justify-center font-black text-white text-xs ${b.color} border border-black/10`}
                    >
                      🧱
                    </div>
                    <span className="font-black text-slate-800 text-xs text-center truncate w-full">
                      {b.name}
                    </span>
                    <span className="text-[10px] text-slate-500 text-center truncate w-full">
                      {b.desc}
                    </span>
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Custom Block Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>オリジナルカスタムブロック</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  お気に入りの画像やテクスチャを読み込んでマイブロックを作成できます
                </p>
              </div>

              {/* Upload trigger */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>画像から作成</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomBlockUpload}
                className="hidden"
              />
            </div>

            {/* Custom Blocks Grid */}
            {customBlocks.length === 0 ? (
              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-bold">
                まだカスタムブロックはありません。「画像から作成」で好きなブロックを追加してみよう！
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {customBlocks.map((cb) => {
                  const isSelected = selectedBlock === cb.id;
                  return (
                    <div
                      key={cb.id}
                      onClick={() => {
                        soundManager.playClick();
                        onSelectBlock(cb.id);
                        onClose();
                      }}
                      className={`relative p-3 rounded-2xl border-2 text-left transition-all flex flex-col items-center justify-center cursor-pointer group ${
                        isSelected
                          ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300 shadow-md scale-102'
                          : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Delete Custom Block Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playClick();
                          onDeleteCustomBlock(cb.id);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-90 text-white flex items-center justify-center shadow-md transition-all z-10"
                        title="このカスタムブロックを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>

                      <img
                        src={cb.textureDataUrl}
                        alt={cb.name}
                        className="w-12 h-12 rounded-xl object-cover shadow border border-slate-300 mb-2"
                      />
                      <span className="font-black text-slate-800 text-xs text-center truncate w-full">
                        {cb.name}
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold">オリジナル</span>
                      {isSelected && (
                        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shadow">
                          ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black rounded-xl text-xs transition-all"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
