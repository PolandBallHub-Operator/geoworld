import React, { useState, useRef, useEffect } from 'react';
import {
  Coins,
  ArrowUp,
  Zap,
  Eye,
  Home,
  Settings as SettingsIcon,
  Pickaxe,
  Box,
  Droplets,
  Mountain,
  Building2,
  Trees,
  Brush,
  Flag,
  Handshake,
  Search,
  Sparkles,
  Sliders,
  MessageSquare,
  Route,
  Grid,
  Layers,
} from 'lucide-react';
import { CountryBallAvatar } from './CountryBallAvatar';
import { CountryId, ExpressionId, ToolType, CityBuildingType } from '../types/game';
import { COUNTRIES } from '../data/countries';
import { soundManager } from '../utils/audio';

interface GameHUDProps {
  countryId: CountryId;
  expressionId: ExpressionId;
  coins: number;
  territoryKm2: number;
  currentTool: ToolType;
  selectedBuilding: CityBuildingType;
  selectedBlockType: string;
  isFirstPerson: boolean;
  isDashing: boolean;
  peerCode?: string;
  isMultiplayer?: boolean;
  unreadChatCount?: number;
  onSelectTool: (tool: ToolType) => void;
  onSelectBuilding: (building: CityBuildingType) => void;
  onOpenBlockMenu: () => void;
  onTogglePerspective: () => void;
  onToggleDash: () => void;
  onJump: () => void;
  onAction: () => void;
  onBackToLobby: () => void;
  onOpenSettings: () => void;
  onOpenBallCustomizer: () => void;
  onToggleChatDrawer?: () => void;
  onJoystickMove: (move: { x: number; y: number }) => void;
  latestActionMsg?: string;
  scanInfo?: { biome: string; elevation: number; territoryOwner: string };
}

export const GameHUD: React.FC<GameHUDProps> = ({
  countryId,
  expressionId,
  coins,
  territoryKm2,
  currentTool,
  selectedBuilding,
  selectedBlockType,
  isFirstPerson,
  isDashing,
  peerCode,
  isMultiplayer,
  unreadChatCount = 0,
  onSelectTool,
  onSelectBuilding,
  onOpenBlockMenu,
  onTogglePerspective,
  onToggleDash,
  onJump,
  onAction,
  onBackToLobby,
  onOpenSettings,
  onOpenBallCustomizer,
  onToggleChatDrawer,
  onJoystickMove,
  latestActionMsg,
  scanInfo,
}) => {
  const country = COUNTRIES[countryId] || COUNTRIES.japan;

  // Uninterrupted Virtual Joystick with Multi-touch identifier support
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const onJoystickMoveRef = useRef(onJoystickMove);
  useEffect(() => {
    onJoystickMoveRef.current = onJoystickMove;
  }, [onJoystickMove]);

  // Handle calculation from client coordinates
  const processJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const radius = rect.width / 2;
    const dist = Math.hypot(dx, dy);

    if (dist < 3) {
      if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
      setKnobPos({ x: 0, y: 0 });
      onJoystickMoveRef.current({ x: 0, y: 0 });
      return;
    }

    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }
    setKnobPos({ x: knobX, y: knobY });

    // Send normalized continuous movement to game:
    // x: right (+1), left (-1)
    // y: forward (+1 = knob up, so -knobY), backward (-1 = knob down, so +knobY)
    onJoystickMoveRef.current({
      x: knobX / radius,
      y: -knobY / radius,
    });
  };

  const resetJoystick = () => {
    activeTouchIdRef.current = null;
    isMouseDownRef.current = false;
    if (knobRef.current) knobRef.current.style.transform = 'translate(0px, 0px)';
    setKnobPos({ x: 0, y: 0 });
    onJoystickMoveRef.current({ x: 0, y: 0 });
  };

  // TOUCH EVENTS (Mobile Multi-touch: completely immune to other fingers on screen)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (activeTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    activeTouchIdRef.current = touch.identifier;
    processJoystickMove(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (activeTouchIdRef.current === null) return;
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t.identifier === activeTouchIdRef.current) {
          processJoystickMove(t.clientX, t.clientY);
          break;
        }
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (activeTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchIdRef.current) {
          resetJoystick();
          break;
        }
      }
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, []);

  // MOUSE EVENTS (Desktop Fallback)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    isMouseDownRef.current = true;
    processJoystickMove(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      processJoystickMove(e.clientX, e.clientY);
    };

    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        resetJoystick();
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  // Tools definition
  const tools: Array<{
    id: ToolType;
    label: string;
    sub: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    { id: 'pickaxe', label: 'ツルハシ', sub: '掘削・採掘', icon: <Pickaxe className="w-5 h-5" />, color: 'from-amber-600 to-amber-700' },
    { id: 'block', label: 'ブロック建築', sub: '1人称で配置', icon: <Box className="w-5 h-5" />, color: 'from-emerald-600 to-emerald-700' },
    { id: 'terrain_add', label: '地形追加', sub: '盛り土・地面造成', icon: <Layers className="w-5 h-5" />, color: 'from-amber-700 to-amber-800' },
    { id: 'road', label: '道路舗装', sub: '道路を敷設', icon: <Route className="w-5 h-5" />, color: 'from-slate-700 to-slate-800' },
    { id: 'water', label: '河川・海', sub: '水路を引く', icon: <Droplets className="w-5 h-5" />, color: 'from-sky-500 to-blue-600' },
    { id: 'mountain', label: '山岳造成', sub: '険しい山脈', icon: <Mountain className="w-5 h-5" />, color: 'from-stone-600 to-stone-700' },
    { id: 'city', label: '施設建築', sub: '街・学校・風車', icon: <Building2 className="w-5 h-5" />, color: 'from-indigo-600 to-indigo-700' },
    { id: 'forest', label: '自動植林', sub: '森林ブラシ', icon: <Trees className="w-5 h-5" />, color: 'from-green-600 to-emerald-800' },
    { id: 'smooth', label: 'スムース', sub: 'なめらかに', icon: <Brush className="w-5 h-5" />, color: 'from-cyan-600 to-cyan-700' },
    { id: 'territory', label: '建国・領土', sub: '国境を拡大', icon: <Flag className="w-5 h-5" />, color: 'from-rose-500 to-red-600' },
    { id: 'diplomacy', label: '平和外交', sub: '他国と交流', icon: <Handshake className="w-5 h-5" />, color: 'from-amber-500 to-orange-500' },
    { id: 'scanner', label: '地理調査', sub: '地形スキャン', icon: <Search className="w-5 h-5" />, color: 'from-violet-600 to-purple-700' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden font-sans">
      {/* 1. FIRST-PERSON RETICLE CROSSHAIR: + がたの照準 */}
      {isFirstPerson && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="relative flex items-center justify-center">
            {/* Horizontal line */}
            <div className="w-5 h-0.5 bg-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            {/* Vertical line */}
            <div className="h-5 w-0.5 bg-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] absolute" />
            {/* Center dot */}
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-black/40 absolute" />
          </div>
        </div>
      )}

      {/* 2. TOP STATUS BAR (Left & Right) */}
      <div className="w-full flex items-start justify-between">
        {/* 左上ステータス */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/95 px-4 py-2.5 rounded-2xl shadow-lg border-2 border-sky-300 backdrop-blur-sm max-w-sm sm:max-w-md">
          <CountryBallAvatar
            countryId={countryId}
            expressionId={expressionId}
            size={52}
            className="ring-2 ring-sky-400"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{country.flagEmoji}</span>
              <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                {country.name}
              </h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                平和条約加盟国
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 mt-0.5">
              <span className="text-rose-600 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" />
                領土: {territoryKm2.toLocaleString()} km²
              </span>
              <span className="text-emerald-600 flex items-center gap-1">
                🕊️ 平和度 100%
              </span>
            </div>
          </div>
        </div>

        {/* Center Toast Message */}
        {latestActionMsg && (
          <div className="hidden md:flex items-center gap-2 bg-slate-900/80 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-fade">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{latestActionMsg}</span>
          </div>
        )}

        {/* 右上ステータス */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-2.5">
          {/* Peer Code display if multiplayer */}
          {isMultiplayer && peerCode && (
            <div className="hidden lg:flex items-center gap-1.5 bg-indigo-900/90 text-white px-3 py-1.5 rounded-2xl border border-indigo-400 text-xs font-bold shadow">
              <span className="text-indigo-200">PEER:</span>
              <span className="font-mono text-amber-300">{peerCode}</span>
            </div>
          )}

          {/* Text Chat Drawer Toggle */}
          {isMultiplayer && onToggleChatDrawer && (
            <button
              onClick={() => {
                soundManager.playClick();
                onToggleChatDrawer();
              }}
              className="relative p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-md border-2 border-white active:scale-95 transition-all"
              title="テキストチャット"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                  {unreadChatCount}
                </span>
              )}
            </button>
          )}

          {/* Coins Counter */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-300 px-3.5 py-2 rounded-2xl shadow-md border-2 border-white">
            <Coins className="w-5 h-5 text-amber-950 fill-amber-500 animate-pulse" />
            <span className="text-base sm:text-lg font-black text-amber-950">
              {coins.toLocaleString()}
            </span>
          </div>

          {/* Ball Customizer Quick Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenBallCustomizer();
            }}
            className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-2 rounded-2xl font-black text-xs shadow-md border-2 border-amber-300 active:scale-95 transition-all"
            title="ボールのカスタム（目・アウトライン・国旗画像）"
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">カスタム</span>
          </button>

          {/* Perspective Switch Button */}
          <button
            onClick={() => {
              soundManager.playClick();
              onTogglePerspective();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl font-black text-xs shadow-md border-2 transition-all active:scale-95 ${
              isFirstPerson
                ? 'bg-emerald-500 text-white border-white'
                : 'bg-white/95 hover:bg-white text-slate-800 border-slate-200'
            }`}
            title="視点を切り替え (一人称 ↔ 三人称)"
          >
            <Eye className="w-4 h-4" />
            <span>{isFirstPerson ? '一人称' : '三人称'}</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenSettings();
            }}
            className="p-2.5 bg-white/95 hover:bg-white text-slate-700 rounded-2xl shadow-md border-2 border-slate-200 active:scale-95 transition-all"
            title="設定"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* Back to Lobby */}
          <button
            onClick={() => {
              soundManager.playClick();
              onBackToLobby();
            }}
            className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl shadow-md border-2 border-white active:scale-95 transition-all"
            title="ワールド一覧に戻る"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. FIRST PERSON NOTICE BANNER FOR BUILDING */}
      {(currentTool === 'block' || currentTool === 'road') && !isFirstPerson && (
        <div className="self-center bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl border-2 border-amber-400 shadow-2xl flex items-center gap-3 text-xs font-bold pointer-events-auto animate-bounce">
          <span>⚠️ ブロック・道路建築は一人称視点で行えます</span>
          <button
            onClick={() => {
              soundManager.playClick();
              onTogglePerspective();
            }}
            className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-3 py-1 rounded-xl font-black transition-all shadow"
          >
            👁️ 一人称に切り替える
          </button>
        </div>
      )}

      {/* 4. LOWER AREA: Left Joystick, Center GUI Hotbar, Right Jump & Dash & Action */}
      <div className="w-full flex items-end justify-between gap-2">
        {/* 画面左: スティック (マルチタッチで途切れない専用タッチ追尾) */}
        <div className="pointer-events-auto flex items-end gap-3 pb-2 pl-1 select-none">
          <div
            ref={joystickContainerRef}
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/40 border-4 border-white/60 shadow-xl touch-none flex items-center justify-center backdrop-blur-sm cursor-grab active:cursor-grabbing select-none"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-full h-0.5 bg-white" />
              <div className="h-full w-0.5 bg-white absolute" />
            </div>

            <div
              ref={knobRef}
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              }}
            />
          </div>
        </div>

        {/* 画面下部中央: GUI 手持ちアイテムバー */}
        <div className="pointer-events-auto flex flex-col items-center max-w-2xl mx-auto pb-1 z-20">
          {/* Sub-selector for Block types / Block Menu */}
          {currentTool === 'block' && (
            <div className="flex items-center gap-2 bg-slate-900/90 text-white px-3.5 py-1.5 rounded-full mb-2 shadow-lg border border-emerald-400 text-xs font-bold">
              <span className="text-emerald-300">選択中: {selectedBlockType}</span>
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenBlockMenu();
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-white px-2.5 py-0.5 rounded-lg font-black flex items-center gap-1 transition-all"
              >
                <Grid className="w-3.5 h-3.5" />
                <span>ブロックメニュー</span>
              </button>
            </div>
          )}

          {/* Sub-selector for City buildings */}
          {currentTool === 'city' && (
            <div className="flex items-center gap-1.5 bg-slate-900/85 text-white px-3 py-1.5 rounded-full mb-2 shadow-lg border border-indigo-400 text-xs font-bold">
              <span className="text-indigo-300 mr-1">施設:</span>
              {[
                { id: 'house', label: '🏠 民家・大使館' },
                { id: 'school', label: '🏫 地理アカデミー' },
                { id: 'windmill', label: '💨 風力発電所' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectBuilding(b.id as CityBuildingType);
                  }}
                  className={`px-2.5 py-1 rounded-full transition-all ${
                    selectedBuilding === b.id
                      ? 'bg-indigo-500 text-white font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}

          {/* Main Hotbar Dock */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-slate-700/80 backdrop-blur-md overflow-x-auto max-w-full">
            {tools.map((t, index) => {
              const isActive = currentTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    soundManager.playClick();
                    onSelectTool(t.id);
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl sm:rounded-2xl min-w-[50px] sm:min-w-[62px] transition-all ${
                    isActive
                      ? `bg-gradient-to-t ${t.color} text-white shadow-lg ring-2 ring-white scale-105 -translate-y-1`
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                  title={`${t.label}: ${t.sub}`}
                >
                  <span className="absolute top-0.5 right-1 text-[9px] font-black opacity-60">
                    {index + 1}
                  </span>
                  <div className="my-0.5">{t.icon}</div>
                  <span className="text-[10px] sm:text-xs font-black tracking-tighter truncate">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 画面右下: ジャンプボタンはダッシュボタンの横に配置！ */}
        <div className="pointer-events-auto flex items-end gap-2.5 pb-2 pr-1 touch-none">
          {/* 行動 / ツール実行ボタン */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onAction();
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 text-amber-950 font-black flex flex-col items-center justify-center shadow-[0_5px_0_rgba(180,83,9,1)] active:translate-y-1 active:shadow-none border-2 border-white transition-all text-xs sm:text-sm select-none touch-none"
            title="ツール実行"
          >
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
            <span>使う</span>
          </button>

          {/* ジャンプボタン (ダッシュボタンの横) */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              onJump();
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white font-black flex flex-col items-center justify-center shadow-[0_4px_0_rgba(14,116,144,1)] active:translate-y-1 active:shadow-none border-2 border-white transition-all text-xs select-none touch-none"
            title="ジャンプ"
          >
            <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
            <span>ジャンプ</span>
          </button>

          {/* ダッシュボタン */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              soundManager.playClick();
              onToggleDash();
            }}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full font-black flex flex-col items-center justify-center shadow-[0_4px_0_rgba(185,28,28,1)] active:translate-y-1 active:shadow-none border-2 border-white transition-all text-xs select-none touch-none ${
              isDashing
                ? 'bg-rose-500 text-white ring-4 ring-rose-300'
                : 'bg-gradient-to-tr from-red-500 to-rose-400 text-white'
            }`}
            title="ダッシュ切替"
          >
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current stroke-[2]" />
            <span>{isDashing ? 'ダッシュ中' : 'ダッシュ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
