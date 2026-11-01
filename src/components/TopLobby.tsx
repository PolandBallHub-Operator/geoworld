import React, { useState, useRef } from 'react';
import {
  Coins,
  ShoppingBag,
  Play,
  Plus,
  Compass,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
  BookOpen,
  Server,
  Download,
  Upload,
  Sparkles,
} from 'lucide-react';
import { CountryBallAvatar } from './CountryBallAvatar';
import { PlayerStats, WorldSlot } from '../types/game';
import { COUNTRIES } from '../data/countries';
import { soundManager } from '../utils/audio';

interface TopLobbyProps {
  stats: PlayerStats;
  worlds: WorldSlot[];
  selectedWorldId: string;
  onSelectWorld: (id: string) => void;
  onCreateWorld: (name: string, preset: WorldSlot['preset']) => void;
  onDeleteWorld: (id: string) => void;
  onExportWorld: (id: string) => void;
  onImportWorld: (file: File) => void;
  onStartGame: () => void;
  onOpenHostServer: () => void;
  onOpenCustomBallModal: () => void;
  onOpenShop: () => void;
  onBackToTitle: () => void;
  onUpdateUsername: (newName: string) => void;
}

export const TopLobby: React.FC<TopLobbyProps> = ({
  stats,
  worlds,
  selectedWorldId,
  onSelectWorld,
  onCreateWorld,
  onDeleteWorld,
  onExportWorld,
  onImportWorld,
  onStartGame,
  onOpenHostServer,
  onOpenCustomBallModal,
  onOpenShop,
  onBackToTitle,
  onUpdateUsername,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorldName, setNewWorldName] = useState('僕らの新しい地球');
  const [newWorldPreset, setNewWorldPreset] = useState<WorldSlot['preset']>('plains_river');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(stats.username);
  const importInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES[stats.selectedCountry] || COUNTRIES.japan;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorldName.trim()) return;
    soundManager.playClick();
    onCreateWorld(newWorldName.trim(), newWorldPreset);
    setShowCreateModal(false);
    setNewWorldName('新しい世界');
  };

  const handleSaveUsername = () => {
    if (nameInput.trim()) {
      onUpdateUsername(nameInput.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-br from-sky-400 via-sky-200 to-emerald-200 overflow-hidden select-none text-slate-800">
      {/* 1. TOP BAR */}
      <div className="w-full flex items-center justify-between z-10">
        {/* 左上: 自分のユーザーネーム */}
        <div className="flex items-center gap-3 bg-white/95 px-4 py-2.5 rounded-2xl shadow-md border-2 border-sky-300">
          <CountryBallAvatar
            countryId={stats.selectedCountry}
            expressionId={stats.selectedExpression}
            size={48}
            className="ring-2 ring-sky-400"
          />

          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="border border-sky-400 rounded px-2 py-0.5 text-sm font-bold w-32 outline-none"
                    autoFocus
                    onBlur={handleSaveUsername}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                  />
                  <button
                    onClick={handleSaveUsername}
                    className="text-xs bg-sky-500 text-white font-bold px-2 py-0.5 rounded"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 text-base sm:text-lg">
                    {stats.username}
                  </span>
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      setNameInput(stats.username);
                      setIsEditingName(true);
                    }}
                    className="text-slate-400 hover:text-sky-600 transition-colors p-1"
                    title="名前を変更"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-sky-800">
              <span>{selectedCountry.flagEmoji} {selectedCountry.name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-700">ちり探検家 Rank 1</span>
            </div>
          </div>
        </div>

        {/* 国ボール作成 & タイトル戻る */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenCustomBallModal();
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs sm:text-sm px-3.5 py-2 rounded-2xl shadow-md border-2 border-white transition-all active:scale-95"
            title="自分だけのオリジナル国ボールを作成"
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>国ボール作成</span>
          </button>

          {/* Back to title button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onBackToTitle();
            }}
            className="hidden md:flex items-center gap-1.5 text-xs font-bold text-sky-950/80 bg-white/70 hover:bg-white px-3 py-2 rounded-xl border border-sky-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>タイトル画面</span>
          </button>
        </div>

        {/* 右上: マイコイン */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-400 to-amber-300 px-5 py-2.5 rounded-2xl shadow-lg border-2 border-white">
          <Coins className="w-6 h-6 text-amber-950 fill-amber-500 animate-pulse" />
          <div className="text-right">
            <span className="text-xs font-bold text-amber-950 block leading-none">マイコイン</span>
            <span className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
              {stats.coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. CENTER CONTENT: 今まで作ったワールド & 新規ワールド作成 */}
      <div className="flex-1 w-full max-w-4xl mx-auto my-4 flex flex-col justify-center z-10 overflow-hidden">
        {/* Geographic Knowledge Mini-Card for students */}
        <div className="bg-white/80 border border-sky-300 rounded-2xl px-4 py-2.5 mb-3 flex items-center gap-3 text-xs sm:text-sm text-sky-950 shadow-sm">
          <BookOpen className="w-5 h-5 text-sky-600 shrink-0" />
          <div className="truncate">
            <span className="font-black text-sky-800 mr-2">【本日の地理雑学】</span>
            <span>{selectedCountry.name}の地理ワンポイント: {selectedCountry.geographyFact}</span>
          </div>
        </div>

        {/* Worlds Card Box */}
        <div className="bg-white/95 rounded-3xl p-5 shadow-xl border-4 border-sky-300 flex flex-col max-h-[58vh]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Compass className="w-6 h-6 text-sky-600" />
                <span>今まで作ったワールド</span>
              </h2>
              <p className="text-xs text-slate-500 font-bold">
                冒険したいワールドを選択するか、新しい地形を作ろう！
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* ワールドインポート (.pbworld) */}
              <input
                ref={importInputRef}
                type="file"
                accept=".pbworld,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onImportWorld(file);
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => importInputRef.current?.click()}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm px-3 py-2 rounded-2xl border border-slate-300 shadow-sm transition-all active:scale-95"
                title=".pbworldファイルを読み込む"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">インポート</span>
                <span className="text-[10px] bg-slate-200 px-1 rounded">.pbworld</span>
              </button>

              {/* 新規ワールド作成 ボタン */}
              <button
                onClick={() => {
                  soundManager.playClick();
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs sm:text-sm px-3.5 py-2 rounded-2xl shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>新規作成</span>
              </button>
            </div>
          </div>

          {/* Worlds List (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {worlds.map((w) => {
              const isSelected = w.id === selectedWorldId;
              const presetNames = {
                plains_river: '平野と蛇行河川 (Plains & Rivers)',
                archipelago: '多島海・島国 (Archipelago Islands)',
                alps_mountain: 'アルプス山岳・高山帯 (Alpine Mountain)',
                continent_harbor: '大陸平野と天然の良港 (Harbor & Coast)',
              };

              return (
                <div
                  key={w.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectWorld(w.id);
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-300'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shrink-0 ${
                        isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      🌍
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-900 text-base">{w.name}</h4>
                        {isSelected && (
                          <span className="bg-sky-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            選択中
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-bold mt-1">
                        <span className="flex items-center gap-1 text-sky-700">
                          <Layers className="w-3.5 h-3.5" />
                          {presetNames[w.preset]}
                        </span>
                        <span className="flex items-center gap-1 text-emerald-700">
                          <MapPin className="w-3.5 h-3.5" />
                          領土: {w.territorySizeKm2.toLocaleString()} km²
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(w.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons: Export and Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playClick();
                        onExportWorld(w.id);
                      }}
                      className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                      title="ワールドをエクスポート (.pbworld)"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {worlds.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playClick();
                          onDeleteWorld(w.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="ワールドを削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR: 左下「始める」 & 「Peer server」 & 右下「ショップ」 */}
      <div className="w-full flex items-center justify-between z-10 pt-2">
        {/* 左下: 始める & Peer server */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              soundManager.playClick();
              onStartGame();
            }}
            className="group flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xl sm:text-2xl px-8 sm:px-12 py-4 rounded-3xl shadow-[0_6px_0_rgba(21,128,61,1)] hover:shadow-[0_3px_0_rgba(21,128,61,1)] hover:translate-y-1 active:translate-y-2 transition-all border-2 border-white"
          >
            <Play className="w-7 h-7 fill-current transition-transform group-hover:scale-110" />
            <span>始める</span>
          </button>

          <button
            onClick={() => {
              soundManager.playClick();
              onOpenHostServer();
            }}
            className="group flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black text-lg sm:text-xl px-6 sm:px-8 py-4 rounded-3xl shadow-[0_6px_0_rgba(49,46,129,1)] hover:shadow-[0_3px_0_rgba(49,46,129,1)] hover:translate-y-1 active:translate-y-2 transition-all border-2 border-white"
            title="一時パスワードを設定してPeerサーバーを起動"
          >
            <Server className="w-6 h-6 transition-transform group-hover:rotate-12" />
            <span>Peer server</span>
          </button>
        </div>

        {/* 右下: ショップ */}
        <button
          onClick={() => {
            soundManager.playClick();
            onOpenShop();
          }}
          className="group flex items-center gap-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xl sm:text-2xl px-8 sm:px-10 py-4 rounded-3xl shadow-[0_6px_0_rgba(180,83,9,1)] hover:shadow-[0_3px_0_rgba(180,83,9,1)] hover:translate-y-1 active:translate-y-2 transition-all border-2 border-white"
        >
          <ShoppingBag className="w-7 h-7 transition-transform group-hover:rotate-12" />
          <span>ショップ</span>
        </button>
      </div>

      {/* Modal: 新規ワールド作成 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-4 border-sky-400 space-y-4"
          >
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Plus className="w-6 h-6 text-sky-500" />
              <span>新しい地理ワールドを作る</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                ワールド名
              </label>
              <input
                type="text"
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                maxLength={24}
                className="w-full border-2 border-slate-300 focus:border-sky-500 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none"
                placeholder="例: 私たちの地球"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">
                地形プリセット
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'plains_river', title: '平野と河川', desc: '大河が流れる豊かな平原' },
                  { id: 'archipelago', title: '多島海・島国', desc: 'エメラルドの海と島々' },
                  { id: 'alps_mountain', title: 'アルプス山脈', desc: '険しい山と雪山' },
                  { id: 'continent_harbor', title: '大陸と良港', desc: '広大な陸地と港湾' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNewWorldPreset(item.id as WorldSlot['preset'])}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      newWorldPreset === item.id
                        ? 'border-sky-500 bg-sky-50 font-bold text-sky-900 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-black text-sm">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 font-bold text-slate-500 hover:text-slate-700"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-xl shadow active:scale-95 transition-all"
              >
                作成する！
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
