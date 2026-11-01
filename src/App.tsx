/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { TitleScreen } from './components/TitleScreen';
import { TopLobby } from './components/TopLobby';
import { GameCanvas, GameCanvasHandle } from './game/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { ShopModal } from './components/ShopModal';
import { DiplomacyModal } from './components/DiplomacyModal';
import { SettingsModal } from './components/SettingsModal';
import { BallCustomizerModal } from './components/BallCustomizerModal';
import { HostServerModal, PlayServerModal } from './components/PeerServerModals';
import { PeerChatDrawer } from './components/PeerChatDrawer';
import { BlockMenuModal } from './components/BlockMenuModal';
import { CustomBallModal } from './components/CustomBallModal';
import {
  CountryId,
  ExpressionId,
  ToolType,
  CityBuildingType,
  PlayerStats,
  WorldSlot,
  GameSettings,
  VisitingBall,
  RemotePeerState,
  PeerChatMessage,
  CustomBallDef,
  CustomBlockDef,
  BallEmotion,
  SharedWorldData,
} from './types/game';
import { soundManager } from './utils/audio';
import { PeerNetworkManager } from './utils/peerNetwork';

type ScreenState = 'title' | 'top' | 'game';

const STORAGE_KEY_STATS = 'geography_club_stats_v3';
const STORAGE_KEY_WORLDS = 'geography_club_worlds_v3';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('title');

  // Player Stats with persistent local storage
  // Default eyeScale: 0.80x, eyeSpacing: 1.40x
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STATS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          coins: 350,
          username: 'ちり探検隊員',
          selectedCountry: 'japan',
          selectedExpression: 'happy.png',
          unlockedCountries: ['japan', 'poland', 'usa'],
          unlockedExpressions: ['normal.png', 'happy.png'],
          discoveredFactsCount: 0,
          signedTreatiesCount: 0,
          outlineThickness: 0.095,
          eyeScale: 0.80,
          eyeSpacing: 1.40,
          customBalls: [],
          customBlocks: [],
          ...parsed,
        };
      } catch {
        // fallback
      }
    }
    return {
      coins: 350,
      username: 'ちり探検隊員',
      selectedCountry: 'japan',
      selectedExpression: 'happy.png',
      unlockedCountries: ['japan', 'poland', 'usa'],
      unlockedExpressions: ['normal.png', 'happy.png'],
      discoveredFactsCount: 0,
      signedTreatiesCount: 0,
      outlineThickness: 0.095,
      eyeScale: 0.80,
      eyeSpacing: 1.40,
      customBalls: [],
      customBlocks: [],
    };
  });

  // World slots with persistence
  const [worlds, setWorlds] = useState<WorldSlot[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORLDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 'world_default_1',
        name: '大河と豊かな平野',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
        terrainSeed: 101,
        preset: 'plains_river',
        territorySizeKm2: 1250,
        blocksModifiedCount: 14,
        establishedNationName: '平和のくに',
        placedBlocks: [],
      },
      {
        id: 'world_default_2',
        name: 'エメラルド多島海',
        createdAt: Date.now() - 43200000,
        updatedAt: Date.now(),
        terrainSeed: 202,
        preset: 'archipelago',
        territorySizeKm2: 850,
        blocksModifiedCount: 5,
        establishedNationName: 'アイランド連邦',
        placedBlocks: [],
      },
    ];
  });

  const [selectedWorldId, setSelectedWorldId] = useState<string>(
    worlds[0]?.id || 'world_default_1'
  );

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    soundEnabled: true,
    bgmEnabled: false,
    mouseSensitivity: 0.0028,
    viewDistance: 'medium',
    showHelpers: true,
    outlineThickness: stats.outlineThickness,
    eyeScale: stats.eyeScale,
    eyeSpacing: stats.eyeSpacing,
  });

  // Modals & Panels
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBallCustomizerOpen, setIsBallCustomizerOpen] = useState(false);
  const [activeDiplomat, setActiveDiplomat] = useState<VisitingBall | null>(null);
  const [showHostServerModal, setShowHostServerModal] = useState(false);
  const [showPlayServerModal, setShowPlayServerModal] = useState(false);
  const [showBlockMenuModal, setShowBlockMenuModal] = useState(false);
  const [showCustomBallModal, setShowCustomBallModal] = useState(false);

  // In-Game Sandbox States
  const [currentTool, setCurrentTool] = useState<ToolType>('pickaxe');
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuildingType>('house');
  const [selectedBlockType, setSelectedBlockType] = useState<string>('grass');
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [joystickMove, setJoystickMove] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [touchLookDelta, setTouchLookDelta] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const [actionFeedbackMsg, setActionFeedbackMsg] = useState<string>('');
  const [scanInfo, setScanInfo] = useState<{ biome: string; elevation: number; territoryOwner: string } | undefined>(
    undefined
  );

  // Multiplayer Peer State
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [peerCode, setPeerCode] = useState('');
  const [multiplayerWorld, setMultiplayerWorld] = useState<SharedWorldData | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeerState[]>([]);
  const [chatMessages, setChatMessages] = useState<PeerChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  const gameCanvasRef = useRef<GameCanvasHandle>(null);
  const peerManagerRef = useRef<PeerNetworkManager | null>(null);

  // Persist stats and worlds
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORLDS, JSON.stringify(worlds));
  }, [worlds]);

  const activeWorld = worlds.find((w) => w.id === selectedWorldId) || worlds[0];

  const handleEarnCoins = (amount: number, reason: string) => {
    setStats((prev) => ({
      ...prev,
      coins: prev.coins + amount,
    }));
    setActionFeedbackMsg(`+${amount}🪙 ${reason}`);
    setTimeout(() => {
      setActionFeedbackMsg('');
    }, 2800);
  };

  const handleModifyWorld = (action: string) => {
    setWorlds((prev) =>
      prev.map((w) => {
        if (w.id === selectedWorldId) {
          const territoryAdd = action === '領土拡大宣言' ? 250 : 0;
          return {
            ...w,
            updatedAt: Date.now(),
            blocksModifiedCount: w.blocksModifiedCount + 1,
            territorySizeKm2: w.territorySizeKm2 + territoryAdd,
          };
        }
        return w;
      })
    );
    setActionFeedbackMsg(`アクション: ${action}`);
    setTimeout(() => {
      setActionFeedbackMsg('');
    }, 1800);
  };

  const handleCreateWorld = (name: string, preset: WorldSlot['preset']) => {
    const newWorld: WorldSlot = {
      id: `world_${Date.now()}`,
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      terrainSeed: Math.floor(Math.random() * 99999),
      preset,
      territorySizeKm2: 500,
      blocksModifiedCount: 0,
      establishedNationName: `${stats.username}国`,
      placedBlocks: [],
    };
    setWorlds((prev) => [newWorld, ...prev]);
    setSelectedWorldId(newWorld.id);
  };

  const handleDeleteWorld = (id: string) => {
    setWorlds((prev) => prev.filter((w) => w.id !== id));
    if (selectedWorldId === id) {
      const remaining = worlds.filter((w) => w.id !== id);
      if (remaining.length > 0) {
        setSelectedWorldId(remaining[0].id);
      }
    }
  };

  // --- .PBWORLD EXPORT & IMPORT ---
  const handleExportWorld = (worldId: string) => {
    const targetWorld = worlds.find((w) => w.id === worldId) || activeWorld;
    // Collect placed blocks from active engine if current
    let liveBlocks = targetWorld.placedBlocks || [];
    if (currentScreen === 'game' && selectedWorldId === worldId && gameCanvasRef.current) {
      liveBlocks = gameCanvasRef.current.getPlacedBlocks();
    }

    const exportData = {
      format: 'geography_club_world',
      version: '1.0',
      exportedAt: Date.now(),
      world: {
        ...targetWorld,
        placedBlocks: liveBlocks,
      },
      customBlocks: stats.customBlocks || [],
      customBalls: stats.customBalls || [],
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${targetWorld.name.replace(/\s+/g, '_')}.pbworld`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    soundManager.playCoin();
    setActionFeedbackMsg(`ワールド「${targetWorld.name}」をエクスポートしました！`);
    setTimeout(() => setActionFeedbackMsg(''), 3000);
  };

  const handleImportWorld = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const importedWorldData = parsed.world || parsed;

        const newWorld: WorldSlot = {
          id: `world_imported_${Date.now()}`,
          name: importedWorldData.name ? `${importedWorldData.name} (インポート)` : 'インポートワールド',
          createdAt: importedWorldData.createdAt || Date.now(),
          updatedAt: Date.now(),
          terrainSeed: importedWorldData.terrainSeed || Math.floor(Math.random() * 99999),
          preset: importedWorldData.preset || 'plains_river',
          territorySizeKm2: importedWorldData.territorySizeKm2 || 1000,
          blocksModifiedCount: importedWorldData.blocksModifiedCount || 0,
          establishedNationName: importedWorldData.establishedNationName || '平和のくに',
          placedBlocks: importedWorldData.placedBlocks || [],
        };

        setWorlds((prev) => [newWorld, ...prev]);
        setSelectedWorldId(newWorld.id);

        // Import custom blocks and custom balls if present in file
        if (Array.isArray(parsed.customBlocks) && parsed.customBlocks.length > 0) {
          setStats((prev) => ({
            ...prev,
            customBlocks: [...(prev.customBlocks || []), ...parsed.customBlocks],
          }));
        }
        if (Array.isArray(parsed.customBalls) && parsed.customBalls.length > 0) {
          setStats((prev) => ({
            ...prev,
            customBalls: [...(prev.customBalls || []), ...parsed.customBalls],
          }));
        }

        soundManager.playDiplomacyFanfare();
        confetti({ particleCount: 60, spread: 80 });
        setActionFeedbackMsg(`ワールド「${newWorld.name}」をインポートしました！`);
        setTimeout(() => setActionFeedbackMsg(''), 3000);
      } catch {
        setActionFeedbackMsg('ファイルの読み込みに失敗しました。正しい.pbworldファイルか確認してください');
        setTimeout(() => setActionFeedbackMsg(''), 3500);
      }
    };
    reader.readAsText(file);
  };

  // --- MULTIPLAYER SETUP & NETWORKING ---
  const createPeerCallbacks = () => {
    return {
      onStatusChange: (status: string, code?: string) => {
        if (code) setPeerCode(code);
        setActionFeedbackMsg(`Peer: ${status}`);
        setTimeout(() => setActionFeedbackMsg(''), 3000);
      },
      onWorldInit: (world: SharedWorldData, peers: RemotePeerState[]) => {
        setMultiplayerWorld(world);
        if (peers && peers.length > 0) {
          setRemotePeers(peers);
        }
        if (world.customBlocks && world.customBlocks.length > 0) {
          setStats((prev) => {
            const existingIds = new Set((prev.customBlocks || []).map((b) => b.id));
            const toAdd = world.customBlocks!.filter((b) => !existingIds.has(b.id));
            if (toAdd.length === 0) return prev;
            return {
              ...prev,
              customBlocks: [...(prev.customBlocks || []), ...toAdd],
            };
          });
        }
        setActionFeedbackMsg(`相手のワールド「${world.name}」を同期しました！`);
        setTimeout(() => setActionFeedbackMsg(''), 3500);
      },
      onPeerJoin: (peer: RemotePeerState) => {
        setRemotePeers((prev) => [...prev.filter((p) => p.id !== peer.id), peer]);
        const msg: PeerChatMessage = {
          id: `sys_${Date.now()}`,
          sender: '🌐 システム',
          text: `${peer.name} さんが参加しました！`,
          time: Date.now(),
        };
        setChatMessages((prev) => [...prev, msg]);
        soundManager.playCoin();
      },
      onPeerLeave: (peerId: string) => {
        setRemotePeers((prev) => prev.filter((p) => p.id !== peerId));
        const msg: PeerChatMessage = {
          id: `sys_${Date.now()}`,
          sender: '🌐 システム',
          text: `プレイヤーが退出しました`,
          time: Date.now(),
        };
        setChatMessages((prev) => [...prev, msg]);
      },
      onPeerMove: (peerState: RemotePeerState) => {
        setRemotePeers((prev) => {
          const idx = prev.findIndex((p) => p.id === peerState.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = peerState;
            return next;
          }
          return [...prev, peerState];
        });
      },
      onChatMessage: (msg: PeerChatMessage) => {
        setChatMessages((prev) => [...prev, msg]);
        soundManager.playClick();
        setUnreadChatCount((prev) => prev + 1);
      },
      onBlockPlace: (data: { x: number; y: number; z: number; type: string; customTextureUrl?: string }) => {
        gameCanvasRef.current?.placeRemoteBlock(data.x, data.y, data.z, data.type, data.customTextureUrl);
        handleBlockPlacedLocal(data.x, data.y, data.z, data.type, data.customTextureUrl, false);
      },
      onBlockRemove: (data: { x: number; y: number; z: number }) => {
        gameCanvasRef.current?.removeRemoteBlock(data.x, data.y, data.z);
        handleBlockRemovedLocal(data.x, data.y, data.z, false);
      },
      onError: (err: string) => {
        setActionFeedbackMsg(err);
        setTimeout(() => setActionFeedbackMsg(''), 4000);
      },
    };
  };

  const handleStartHostServer = async (password: string) => {
    setShowHostServerModal(false);
    const manager = new PeerNetworkManager(createPeerCallbacks());
    peerManagerRef.current = manager;

    const getWorldData = (): SharedWorldData => {
      const targetWorld = worlds.find((w) => w.id === selectedWorldId) || worlds[0];
      const liveBlocks = gameCanvasRef.current?.getPlacedBlocks() || targetWorld.placedBlocks || [];
      return {
        name: targetWorld.name,
        preset: targetWorld.preset,
        terrainSeed: targetWorld.terrainSeed,
        territorySizeKm2: targetWorld.territorySizeKm2,
        establishedNationName: targetWorld.establishedNationName,
        placedBlocks: liveBlocks,
        customBlocks: stats.customBlocks || [],
      };
    };

    try {
      const initialWorld = getWorldData();
      setMultiplayerWorld(initialWorld);
      const code = await manager.startHost(password, getWorldData);
      setPeerCode(code);
      setIsMultiplayer(true);
      setIsHost(true);
      setCurrentScreen('game');
      soundManager.playCoin();
      confetti({ particleCount: 40, spread: 60 });
      setActionFeedbackMsg(`サーバー起動！PEERコード: ${code}`);
      setTimeout(() => setActionFeedbackMsg(''), 4000);
    } catch {
      setActionFeedbackMsg('サーバーの起動に失敗しました');
    }
  };

  const handleJoinServer = async (targetCode: string, password: string): Promise<boolean> => {
    const manager = new PeerNetworkManager(createPeerCallbacks());
    peerManagerRef.current = manager;

    const playerInfo: Partial<RemotePeerState> = {
      name: stats.username,
      country: stats.selectedCountry,
      frontFlagUrl: stats.customFrontFlagDataUrl,
      backFlagUrl: stats.customBackFlagDataUrl,
      eyeScale: stats.eyeScale || 0.8,
      eyeSpacing: stats.eyeSpacing || 1.4,
      outlineThickness: stats.outlineThickness || 0.095,
      position: { x: 0, y: 3, z: 0 },
      facingYaw: 0,
      emotion: 'happy',
    };

    const result = await manager.joinServer(targetCode, password, playerInfo);
    if (result.success && result.world) {
      setMultiplayerWorld(result.world);
      if (result.peers && result.peers.length > 0) {
        setRemotePeers(result.peers);
      }
      if (result.world.customBlocks && result.world.customBlocks.length > 0) {
        setStats((prev) => {
          const existingIds = new Set((prev.customBlocks || []).map((b) => b.id));
          const toAdd = result.world!.customBlocks!.filter((b) => !existingIds.has(b.id));
          if (toAdd.length === 0) return prev;
          return {
            ...prev,
            customBlocks: [...(prev.customBlocks || []), ...toAdd],
          };
        });
      }
      setShowPlayServerModal(false);
      setPeerCode(targetCode);
      setIsMultiplayer(true);
      setIsHost(false);
      setCurrentScreen('game');
      soundManager.playDiplomacyFanfare();
      confetti({ particleCount: 50, spread: 70 });
      setActionFeedbackMsg(`ホストのワールド「${result.world.name}」に参加しました！`);
      setTimeout(() => setActionFeedbackMsg(''), 3000);
      return true;
    }
    return false;
  };

  const handleDisconnect = () => {
    if (peerManagerRef.current) {
      peerManagerRef.current.disconnect();
      peerManagerRef.current = null;
    }
    setIsMultiplayer(false);
    setIsHost(false);
    setMultiplayerWorld(null);
    setPeerCode('');
    setRemotePeers([]);
    setChatMessages([]);
    setUnreadChatCount(0);
    setIsChatDrawerOpen(false);
    setCurrentScreen('top');
  };

  // In-Game Block sync handlers
  const handleBlockPlacedLocal = (
    x: number,
    y: number,
    z: number,
    type: string,
    customTextureUrl?: string,
    broadcast = true
  ) => {
    if (isMultiplayer && !isHost) {
      // Guest in multiplayer server: update multiplayerWorld placed blocks
      setMultiplayerWorld((prev) => {
        if (!prev) return null;
        const oldBlocks = prev.placedBlocks || [];
        const filtered = oldBlocks.filter((b) => !(b.x === x && b.y === y && b.z === z));
        return {
          ...prev,
          placedBlocks: [...filtered, { x, y, z, type, customTextureUrl }],
        };
      });
    } else {
      // Host or singleplayer: update persistent worlds
      setWorlds((prev) =>
        prev.map((w) => {
          if (w.id === selectedWorldId) {
            const oldBlocks = w.placedBlocks || [];
            const filtered = oldBlocks.filter((b) => !(b.x === x && b.y === y && b.z === z));
            return {
              ...w,
              updatedAt: Date.now(),
              blocksModifiedCount: w.blocksModifiedCount + 1,
              placedBlocks: [...filtered, { x, y, z, type, customTextureUrl }],
            };
          }
          return w;
        })
      );
      if (isMultiplayer && isHost) {
        setMultiplayerWorld((prev) => {
          if (!prev) return null;
          const oldBlocks = prev.placedBlocks || [];
          const filtered = oldBlocks.filter((b) => !(b.x === x && b.y === y && b.z === z));
          return {
            ...prev,
            placedBlocks: [...filtered, { x, y, z, type, customTextureUrl }],
          };
        });
      }
    }

    if (broadcast && peerManagerRef.current) {
      peerManagerRef.current.sendBlockPlace(x, y, z, type, customTextureUrl);
    }
  };

  const handleBlockRemovedLocal = (x: number, y: number, z: number, broadcast = true) => {
    if (isMultiplayer && !isHost) {
      setMultiplayerWorld((prev) => {
        if (!prev) return null;
        const oldBlocks = prev.placedBlocks || [];
        return {
          ...prev,
          placedBlocks: oldBlocks.filter((b) => !(b.x === x && b.y === y && b.z === z)),
        };
      });
    } else {
      setWorlds((prev) =>
        prev.map((w) => {
          if (w.id === selectedWorldId) {
            const oldBlocks = w.placedBlocks || [];
            return {
              ...w,
              updatedAt: Date.now(),
              placedBlocks: oldBlocks.filter((b) => !(b.x === x && b.y === y && b.z === z)),
            };
          }
          return w;
        })
      );
      if (isMultiplayer && isHost) {
        setMultiplayerWorld((prev) => {
          if (!prev) return null;
          const oldBlocks = prev.placedBlocks || [];
          return {
            ...prev,
            placedBlocks: oldBlocks.filter((b) => !(b.x === x && b.y === y && b.z === z)),
          };
        });
      }
    }

    if (broadcast && peerManagerRef.current) {
      peerManagerRef.current.sendBlockRemove(x, y, z);
    }
  };

  // Add Custom Ball
  const handleAddCustomBall = (newBall: CustomBallDef) => {
    setStats((prev) => ({
      ...prev,
      customBalls: [...(prev.customBalls || []), newBall],
      selectedCountry: 'custom',
      customFrontFlagDataUrl: newBall.frontFlagUrl,
      customBackFlagDataUrl: newBall.backFlagUrl,
    }));
    setActionFeedbackMsg(`新しい国ボール「${newBall.name}」を作成しました！`);
    setTimeout(() => setActionFeedbackMsg(''), 3000);
  };

  // Add Custom Block
  const handleAddCustomBlock = (newBlock: CustomBlockDef) => {
    setStats((prev) => ({
      ...prev,
      customBlocks: [...(prev.customBlocks || []), newBlock],
    }));
    setSelectedBlockType(newBlock.id);
    setActionFeedbackMsg(`カスタムブロック「${newBlock.name}」を追加しました！`);
    setTimeout(() => setActionFeedbackMsg(''), 3000);
  };

  // Delete Custom Block
  const handleDeleteCustomBlock = (blockId: string) => {
    setStats((prev) => ({
      ...prev,
      customBlocks: (prev.customBlocks || []).filter((b) => b.id !== blockId),
    }));
    if (selectedBlockType === blockId) {
      setSelectedBlockType('grass');
    }
    setActionFeedbackMsg('カスタムブロックを削除しました');
    setTimeout(() => setActionFeedbackMsg(''), 2000);
  };

  // Stable callback for joystick updates to prevent unnecessary HUD re-renders
  const handleJoystickMove = useCallback((move: { x: number; y: number }) => {
    setJoystickMove(move);
  }, []);

  const currentWorldPreset = isMultiplayer && multiplayerWorld ? multiplayerWorld.preset : activeWorld?.preset;
  const currentWorldSeed = isMultiplayer && multiplayerWorld ? multiplayerWorld.terrainSeed : activeWorld?.terrainSeed;
  const currentPlacedBlocks = isMultiplayer && multiplayerWorld ? (multiplayerWorld.placedBlocks || []) : (activeWorld?.placedBlocks || []);
  const currentTerritoryKm2 = isMultiplayer && multiplayerWorld ? multiplayerWorld.territorySizeKm2 : (activeWorld?.territorySizeKm2 || 1000);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans">
      {/* 1. TITLE SCREEN */}
      {currentScreen === 'title' && (
        <TitleScreen
          onPlay={() => setCurrentScreen('top')}
          onOpenPlayServer={() => setShowPlayServerModal(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* 2. TOP SCREEN (Lobby) */}
      {currentScreen === 'top' && (
        <TopLobby
          stats={stats}
          worlds={worlds}
          selectedWorldId={selectedWorldId}
          onSelectWorld={(id) => setSelectedWorldId(id)}
          onCreateWorld={handleCreateWorld}
          onDeleteWorld={handleDeleteWorld}
          onExportWorld={handleExportWorld}
          onImportWorld={handleImportWorld}
          onStartGame={() => setCurrentScreen('game')}
          onOpenHostServer={() => setShowHostServerModal(true)}
          onOpenCustomBallModal={() => setShowCustomBallModal(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onBackToTitle={() => setCurrentScreen('title')}
          onUpdateUsername={(newName) =>
            setStats((prev) => ({ ...prev, username: newName }))
          }
        />
      )}

      {/* 3. GAME SCREEN (3D Sandbox & HUD) */}
      {currentScreen === 'game' && (
        <div className="relative w-full h-full">
          {/* Full-bleed Three.js 3D Viewport with Minecraft camera/movement */}
          <GameCanvas
            key={isMultiplayer ? `server_${peerCode}_${currentWorldPreset}_${currentWorldSeed}` : `local_${activeWorld?.id}`}
            ref={gameCanvasRef}
            countryId={stats.selectedCountry}
            expressionId={stats.selectedExpression}
            currentTool={currentTool}
            selectedBuilding={selectedBuilding}
            selectedBlockType={selectedBlockType}
            customBlocks={stats.customBlocks || []}
            isFirstPerson={isFirstPerson}
            isDashing={isDashing}
            joystickMove={joystickMove}
            touchLookDelta={touchLookDelta}
            outlineThickness={stats.outlineThickness}
            eyeScale={stats.eyeScale}
            eyeSpacing={stats.eyeSpacing}
            customFrontFlagDataUrl={stats.customFrontFlagDataUrl}
            customBackFlagDataUrl={stats.customBackFlagDataUrl}
            remotePeers={remotePeers}
            worldPreset={currentWorldPreset}
            worldSeed={currentWorldSeed}
            placedBlocks={currentPlacedBlocks}
            onInteractVisitor={(visitor) => {
              setActiveDiplomat(visitor);
            }}
            onModifyWorld={handleModifyWorld}
            onScanLocation={(info) => {
              setScanInfo(info);
            }}
            onCoinsEarned={handleEarnCoins}
            onRequireFirstPersonForBuilding={() => {
              setActionFeedbackMsg('🧱 建築は一人称視点（一人称ボタン）にしてから行えます！');
              setTimeout(() => setActionFeedbackMsg(''), 3000);
            }}
            onBlockPlacedSync={(x, y, z, type, customUrl) => {
              handleBlockPlacedLocal(x, y, z, type, customUrl, true);
            }}
            onBlockRemovedSync={(x, y, z) => {
              handleBlockRemovedLocal(x, y, z, true);
            }}
            onPlayerPosSync={(pos, yaw, emotion) => {
              if (peerManagerRef.current) {
                peerManagerRef.current.sendPlayerSync({
                  position: pos,
                  facingYaw: yaw,
                  emotion,
                });
              }
            }}
          />

          {/* HUD Overlay with Jump next to Dash & Touch Look */}
          <GameHUD
            countryId={stats.selectedCountry}
            expressionId={stats.selectedExpression}
            coins={stats.coins}
            territoryKm2={currentTerritoryKm2}
            currentTool={currentTool}
            selectedBuilding={selectedBuilding}
            selectedBlockType={selectedBlockType}
            isFirstPerson={isFirstPerson}
            isDashing={isDashing}
            peerCode={peerCode}
            isMultiplayer={isMultiplayer}
            unreadChatCount={unreadChatCount}
            onSelectTool={(tool) => setCurrentTool(tool)}
            onSelectBuilding={(building) => setSelectedBuilding(building)}
            onOpenBlockMenu={() => setShowBlockMenuModal(true)}
            onTogglePerspective={() => setIsFirstPerson((prev) => !prev)}
            onToggleDash={() => setIsDashing((prev) => !prev)}
            onJump={() => {
              gameCanvasRef.current?.jump();
            }}
            onAction={() => {
              gameCanvasRef.current?.useTool();
            }}
            onBackToLobby={handleDisconnect}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenBallCustomizer={() => setIsBallCustomizerOpen(true)}
            onToggleChatDrawer={() => {
              setIsChatDrawerOpen((prev) => !prev);
              setUnreadChatCount(0);
            }}
            onJoystickMove={handleJoystickMove}
            latestActionMsg={actionFeedbackMsg}
            scanInfo={scanInfo}
          />

          {/* In-game Peer Chat Drawer */}
          {isChatDrawerOpen && (
            <PeerChatDrawer
              peerCode={peerCode}
              isHost={isHost}
              messages={chatMessages}
              connectedPeers={remotePeers}
              onSendMessage={(text) => {
                if (peerManagerRef.current) {
                  peerManagerRef.current.sendChatMessage(text, stats.username);
                }
              }}
              onClose={() => setIsChatDrawerOpen(false)}
            />
          )}
        </div>
      )}

      {/* SHOP MODAL */}
      {isShopOpen && (
        <ShopModal
          stats={stats}
          onClose={() => setIsShopOpen(false)}
          onBuyCountry={(cId, price) => {
            setStats((prev) => ({
              ...prev,
              coins: prev.coins - price,
              unlockedCountries: [...prev.unlockedCountries, cId],
              selectedCountry: cId,
            }));
          }}
          onBuyExpression={(eId, price) => {
            setStats((prev) => ({
              ...prev,
              coins: prev.coins - price,
              unlockedExpressions: [...prev.unlockedExpressions, eId],
              selectedExpression: eId,
            }));
          }}
          onEquipCountry={(cId) => {
            setStats((prev) => ({ ...prev, selectedCountry: cId }));
          }}
          onEquipExpression={(eId) => {
            setStats((prev) => ({ ...prev, selectedExpression: eId }));
          }}
        />
      )}

      {/* BALL CUSTOMIZER MODAL */}
      {isBallCustomizerOpen && (
        <BallCustomizerModal
          stats={stats}
          onUpdateStats={(updates) => setStats((prev) => ({ ...prev, ...updates }))}
          onClose={() => setIsBallCustomizerOpen(false)}
        />
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) =>
            setSettings((prev) => ({ ...prev, ...newSettings }))
          }
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* PEACEFUL DIPLOMACY MODAL */}
      {activeDiplomat && (
        <DiplomacyModal
          visitor={activeDiplomat}
          onClose={() => setActiveDiplomat(null)}
          onSignTreaty={() => {
            handleEarnCoins(150, '平和友好文化条約調印');
            setStats((prev) => ({
              ...prev,
              signedTreatiesCount: prev.signedTreatiesCount + 1,
            }));
          }}
          onAnswerQuiz={(correct, reward) => {
            handleEarnCoins(reward, correct ? '地理クイズ正解ボーナス' : '地理クイズ参加賞');
            if (correct) {
              setStats((prev) => ({
                ...prev,
                discoveredFactsCount: prev.discoveredFactsCount + 1,
              }));
            }
          }}
        />
      )}

      {/* HOST SERVER MODAL */}
      {showHostServerModal && (
        <HostServerModal
          onConfirm={handleStartHostServer}
          onClose={() => setShowHostServerModal(false)}
        />
      )}

      {/* PLAY SERVER (JOIN) MODAL */}
      {showPlayServerModal && (
        <PlayServerModal
          onJoin={handleJoinServer}
          onClose={() => setShowPlayServerModal(false)}
          onFailReturnHome={(errMsg) => {
            setShowPlayServerModal(false);
            setCurrentScreen('title');
            setActionFeedbackMsg(errMsg);
            setTimeout(() => setActionFeedbackMsg(''), 3500);
          }}
        />
      )}

      {/* BLOCK MENU MODAL */}
      {showBlockMenuModal && (
        <BlockMenuModal
          selectedBlock={selectedBlockType}
          onSelectBlock={(bId) => {
            setSelectedBlockType(bId);
            setCurrentTool('block');
          }}
          customBlocks={stats.customBlocks || []}
          onAddCustomBlock={handleAddCustomBlock}
          onDeleteCustomBlock={handleDeleteCustomBlock}
          onClose={() => setShowBlockMenuModal(false)}
        />
      )}

      {/* CUSTOM BALL CREATION MODAL */}
      {showCustomBallModal && (
        <CustomBallModal
          onAddBall={handleAddCustomBall}
          onClose={() => setShowCustomBallModal(false)}
        />
      )}
    </main>
  );
}
