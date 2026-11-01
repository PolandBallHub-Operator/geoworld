import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CountryId,
  ExpressionId,
  ToolType,
  CityBuildingType,
  VisitingBall,
  RemotePeerState,
  BallEmotion,
  CustomBlockDef,
  PlacedBlock,
} from '../types/game';
import { VoxelWorld, HALF_SIZE, SEA_LEVEL } from './voxelWorld';
import { CountryballMeshActor } from '../graphics/countryballMesh';
import { VisitingCountryballsManager } from './VisitingCountryballs';
import { soundManager } from '../utils/audio';

interface GameCanvasProps {
  countryId: CountryId;
  expressionId: ExpressionId;
  currentTool: ToolType;
  selectedBuilding: CityBuildingType;
  selectedBlockType: string;
  customBlocks: CustomBlockDef[];
  isFirstPerson: boolean;
  isDashing: boolean;
  joystickMove: { x: number; y: number };
  touchLookDelta: { dx: number; dy: number };
  outlineThickness: number;
  eyeScale: number;
  eyeSpacing: number;
  customFrontFlagDataUrl?: string;
  customBackFlagDataUrl?: string;
  remotePeers: RemotePeerState[];
  onInteractVisitor: (visitor: VisitingBall) => void;
  onModifyWorld: (action: string) => void;
  onScanLocation: (info: { biome: string; elevation: number; territoryOwner: string }) => void;
  onCoinsEarned: (amount: number, reason: string) => void;
  onRequireFirstPersonForBuilding?: () => void;
  onBlockPlacedSync?: (x: number, y: number, z: number, type: string, customTextureUrl?: string) => void;
  onBlockRemovedSync?: (x: number, y: number, z: number) => void;
  onPlayerPosSync?: (pos: { x: number; y: number; z: number }, yaw: number, emotion: BallEmotion) => void;
  worldPreset?: string;
  worldSeed?: number;
  placedBlocks?: PlacedBlock[];
}

export interface GameCanvasHandle {
  jump: () => void;
  useTool: () => void;
  placeRemoteBlock: (x: number, y: number, z: number, type: string, customTextureUrl?: string) => void;
  removeRemoteBlock: (x: number, y: number, z: number) => void;
  getPlacedBlocks: () => PlacedBlock[];
}

function createNameTagSprite(name: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(8, 8, 240, 48, 12);
    } else {
      ctx.rect(8, 8, 240, 48);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.slice(0, 14), 128, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.9, 0.48, 1);
  sprite.position.set(0, 1.35, 0);
  return sprite;
}

export const GameCanvas = React.forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  props,
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(props);
  stateRef.current = props;

  const engineRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    world: VoxelWorld;
    player: CountryballMeshActor;
    visitors: VisitingCountryballsManager;
    shadowPlane: THREE.Mesh;
    clock: THREE.Clock;
    playerPos: THREE.Vector3;
    playerVel: THREE.Vector3;
    isGrounded: boolean;
    facingYaw: number;
    cameraYaw: number;
    cameraPitch: number;
    cameraDistance: number;
    walkCyclePhase: number;
    currentEmotion: BallEmotion;
    blinkTimer: number;
    keys: { [key: string]: boolean };
    raycaster: THREE.Raycaster;
    centerScreen: THREE.Vector2;
    blockHighlightMesh: THREE.Mesh;
    remoteActorMeshes: Map<string, { actor: CountryballMeshActor; nameSprite: THREE.Sprite }>;
  } | null>(null);

  // Expose imperative handle
  React.useImperativeHandle(ref, () => ({
    jump: () => {
      const engine = engineRef.current;
      if (engine && engine.isGrounded) {
        engine.playerVel.y = 10.5;
        engine.isGrounded = false;
        engine.currentEmotion = 'happy';
        engine.player.setEmotion('happy');
        soundManager.playJump();
      }
    },
    useTool: () => {
      triggerCurrentTool();
    },
    placeRemoteBlock: (x, y, z, type, customTextureUrl) => {
      engineRef.current?.world.placeVoxel(x, y, z, type, customTextureUrl);
    },
    removeRemoteBlock: (x, y, z) => {
      engineRef.current?.world.removeVoxel(x, y, z);
    },
    getPlacedBlocks: () => {
      return engineRef.current?.world.serializePlacedBlocks() || [];
    },
  }));

  const triggerCurrentTool = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const { playerPos, facingYaw, world, visitors, camera, raycaster, centerScreen } = engine;
    const {
      currentTool,
      selectedBuilding,
      selectedBlockType,
      customBlocks,
      countryId,
      isFirstPerson,
    } = stateRef.current;

    // Check interaction with visiting diplomat first if nearby
    const nearestVisitor = visitors.getNearestVisitor(playerPos.x, playerPos.z, 4.0);
    if (nearestVisitor) {
      soundManager.playDiplomacyFanfare();
      engine.player.setEmotion('happy');
      stateRef.current.onInteractVisitor(nearestVisitor);
      return;
    }

    // "一人称にしないと建築は不可にする"
    if ((currentTool === 'block' || currentTool === 'road') && !isFirstPerson) {
      if (stateRef.current.onRequireFirstPersonForBuilding) {
        stateRef.current.onRequireFirstPersonForBuilding();
      }
      return;
    }

    // Play tool swing animation / emotion (Cute Polandball squint, no scary pupils)
    engine.player.setEmotion('squint');
    setTimeout(() => {
      engine.player.setEmotion(engine.currentEmotion);
    }, 350);

    // In first person, raycast from camera center
    if (isFirstPerson) {
      raycaster.setFromCamera(centerScreen, camera);
      const objectsToTest: THREE.Object3D[] = [world.terrainMesh, world.placedBlocksGroup];
      const intersects = raycaster.intersectObjects(objectsToTest, true);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);

        if (currentTool === 'terrain_add') {
          // Traditional smooth terrain raising in first-person
          soundManager.playPlaceBlock();
          world.placeBlock(hit.point.x, hit.point.z, 2.8, 0.9);
          stateRef.current.onModifyWorld('盛り土・地形追加');
          return;
        }

        if (currentTool === 'block') {
          // Place block on hit face
          const placePos = hit.point.clone().addScaledVector(normal, 0.45);
          const bx = Math.floor(placePos.x);
          const by = Math.floor(placePos.y);
          const bz = Math.floor(placePos.z);

          // Check if custom block
          const customDef = customBlocks.find((cb) => cb.id === selectedBlockType);
          const customUrl = customDef ? customDef.textureDataUrl : undefined;

          const success = world.placeVoxel(bx, by, bz, selectedBlockType, customUrl);
          if (success) {
            soundManager.playPlaceBlock();
            stateRef.current.onModifyWorld('ブロック配置');
            stateRef.current.onBlockPlacedSync?.(bx, by, bz, selectedBlockType, customUrl);
          }
          return;
        }

        if (currentTool === 'road') {
          // Pave road
          soundManager.playPlaceBlock();
          world.paveRoad(hit.point.x, hit.point.z, 1.5);
          stateRef.current.onModifyWorld('道路舗装');
          return;
        }

        if (currentTool === 'pickaxe') {
          // Check if removing placed block
          soundManager.playDig();
          const removePos = hit.point.clone().addScaledVector(normal, -0.4);
          const rx = Math.floor(removePos.x);
          const ry = Math.floor(removePos.y);
          const rz = Math.floor(removePos.z);

          const removed = world.removeVoxel(rx, ry, rz);
          if (removed) {
            stateRef.current.onModifyWorld('ブロック採掘');
            stateRef.current.onCoinsEarned(5, 'ブロック回収');
            stateRef.current.onBlockRemovedSync?.(rx, ry, rz);
          } else {
            // Dig terrain
            world.dig(hit.point.x, hit.point.z, 2.4, 0.8);
            stateRef.current.onModifyWorld('地形掘削');
            if (Math.random() < 0.4) {
              stateRef.current.onCoinsEarned(10, '鉱物採掘ボーナス');
            }
          }
          return;
        }
      }
    }

    // Default target spot in front of player
    const forwardX = Math.sin(facingYaw);
    const forwardZ = Math.cos(facingYaw);
    const targetX = playerPos.x + forwardX * 2.2;
    const targetZ = playerPos.z + forwardZ * 2.2;

    switch (currentTool) {
      case 'terrain_add':
        soundManager.playPlaceBlock();
        world.placeBlock(targetX, targetZ, 2.8, 0.9);
        stateRef.current.onModifyWorld('盛り土・地形追加');
        break;

      case 'diplomacy': {
        soundManager.playDiplomacyFanfare();
        const nearest = visitors.getNearestVisitor(playerPos.x, playerPos.z, 5.5);
        if (nearest) {
          visitors.triggerVisitorGreeting(nearest.id);
          stateRef.current.onInteractVisitor(nearest);
        } else {
          stateRef.current.onModifyWorld('近くに外国の外交使節団がいません');
        }
        break;
      }

      case 'pickaxe':
        soundManager.playDig();
        world.dig(targetX, targetZ, 2.4, 0.8);
        stateRef.current.onModifyWorld('掘削');
        if (Math.random() < 0.4) {
          stateRef.current.onCoinsEarned(10, '鉱物採掘ボーナス');
        }
        break;

      case 'water':
        soundManager.playWater();
        world.carveWater(targetX, targetZ, 3.2);
        stateRef.current.onModifyWorld('河川・水路掘削');
        break;

      case 'mountain':
        soundManager.playPlaceBlock();
        world.raiseMountain(targetX, targetZ, 6.5, 3.0);
        stateRef.current.onModifyWorld('山岳造成');
        break;

      case 'forest':
        soundManager.playPlantForest();
        world.autoForest(targetX, targetZ, 5.0);
        stateRef.current.onModifyWorld('自動植林');
        break;

      case 'smooth':
        soundManager.playClick();
        world.smoothTerrain(targetX, targetZ, 4.5);
        stateRef.current.onModifyWorld('地形スムージング');
        break;

      case 'city':
        soundManager.playPlaceBlock();
        world.buildCity(targetX, targetZ, selectedBuilding);
        stateRef.current.onModifyWorld('都市建築');
        stateRef.current.onCoinsEarned(25, '都市発展ボーナス');
        break;

      case 'territory':
        soundManager.playTerritoryClaim();
        world.claimTerritory(targetX, targetZ, countryId, 4.5);
        stateRef.current.onModifyWorld('領土拡大宣言');
        stateRef.current.onCoinsEarned(50, '国境画定ボーナス');
        break;

      case 'scanner': {
        soundManager.playClick();
        const elev = Math.round(world.getHeightAt(targetX, targetZ) * 100) / 10;
        let biome = '緑豊かな温帯平野';
        if (elev < SEA_LEVEL + 0.5) biome = '清らかな河川・沿岸水域';
        else if (elev > 10.0) biome = '高山寒帯・氷河地形';
        else if (elev > 5.0) biome = '起伏に富んだ高原・丘陵';
        stateRef.current.onScanLocation({
          biome,
          elevation: elev,
          territoryOwner: 'プレイヤー国家領内',
        });
        stateRef.current.onCoinsEarned(15, '地理スキャン調査');
        break;
      }

      default:
        soundManager.playClick();
        break;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb0e0f8);
    scene.fog = new THREE.FogExp2(0xb0e0f8, 0.012);

    // 2. Camera (Minecraft perspective)
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 250);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Studio Environment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting
    const sunLight = new THREE.DirectionalLight(0xfff6e5, 1.9);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 120;
    const d = 35;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.normalBias = 0.02;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x86efac, 0.7);
    scene.add(hemiLight);

    // 6. Procedural Voxel World with Block system
    const world = new VoxelWorld(
      scene,
      stateRef.current.worldPreset || 'plains_river',
      stateRef.current.worldSeed || 42
    );
    if (stateRef.current.placedBlocks && stateRef.current.placedBlocks.length > 0) {
      world.loadPlacedBlocks(stateRef.current.placedBlocks);
    }

    // 7. Authentic 3D CountryballMesh Actor (Defaults: eyeScale 0.80, eyeSpacing 1.40)
    const player = new CountryballMeshActor(
      stateRef.current.countryId,
      0.8,
      null,
      null,
      stateRef.current.eyeScale || 0.80,
      stateRef.current.eyeSpacing || 1.40,
      stateRef.current.outlineThickness || 0.095
    );
    scene.add(player.group);

    // Contact shadow plane beneath player
    const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x090a10,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    scene.add(shadowPlane);

    // Block Placement Highlight Wireframe Box
    const highlightGeo = new THREE.BoxGeometry(1.02, 1.02, 1.02);
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      depthTest: false,
    });
    const blockHighlightMesh = new THREE.Mesh(highlightGeo, highlightMat);
    blockHighlightMesh.visible = false;
    scene.add(blockHighlightMesh);

    // 8. Visiting Diplomat Countryballs
    const visitors = new VisitingCountryballsManager(scene, world);

    // Movement & Kinematics State
    const playerPos = new THREE.Vector3(0, world.getHeightAt(0, 0) + 0.8, 0);
    const playerVel = new THREE.Vector3(0, 0, 0);
    let isGrounded = true;
    let facingYaw = 0;
    let cameraYaw = 0;
    let cameraPitch = 0.32;
    let cameraDistance = 6.5;
    let walkCyclePhase = 0;
    let currentEmotion: BallEmotion = 'normal';
    let blinkTimer = 3.5;

    const keys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'Space') {
        if (isGrounded) {
          playerVel.y = 10.5;
          isGrounded = false;
          currentEmotion = 'happy';
          player.setEmotion('happy');
          soundManager.playJump();
        }
      }
      if (e.code === 'KeyE') {
        triggerCurrentTool();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Minecraft-style PC Pointer Lock Mouse Look
    const canvas = renderer.domElement;
    const handleCanvasClick = () => {
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock?.();
      }
    };
    canvas.addEventListener('click', handleCanvasClick);

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        const sens = 0.0028;
        cameraYaw -= e.movementX * sens;
        cameraPitch += e.movementY * sens;
        cameraPitch = Math.max(-0.45, Math.min(1.20, cameraPitch));
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Multi-touch look on right half of screen
    let activeTouchId: number | null = null;
    let lastTouchX = 0;
    let lastTouchY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      const halfWidth = window.innerWidth / 2;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.clientX >= halfWidth && activeTouchId === null) {
          // Check if touch is on a UI element (e.g. jump, dash, tool hotbar)
          const elem = document.elementFromPoint(t.clientX, t.clientY);
          if (elem && (elem.closest('button') || elem.closest('.pointer-events-auto') || elem.closest('[data-control]'))) {
            continue; // UI controls handle their own events
          }
          activeTouchId = t.identifier;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === activeTouchId) {
          const dx = t.clientX - lastTouchX;
          const dy = t.clientY - lastTouchY;
          lastTouchX = t.clientX;
          lastTouchY = t.clientY;

          const sens = 0.0055;
          cameraYaw -= dx * sens;
          cameraPitch += dy * sens;
          cameraPitch = Math.max(-0.45, Math.min(1.20, cameraPitch));
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (activeTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === activeTouchId) {
          activeTouchId = null;
          break;
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const centerScreen = new THREE.Vector2(0, 0);

    engineRef.current = {
      renderer,
      scene,
      camera,
      world,
      player,
      visitors,
      shadowPlane,
      clock,
      playerPos,
      playerVel,
      isGrounded,
      facingYaw,
      cameraYaw,
      cameraPitch,
      cameraDistance,
      walkCyclePhase,
      currentEmotion,
      blinkTimer,
      keys,
      raycaster,
      centerScreen,
      blockHighlightMesh,
      remoteActorMeshes: new Map(),
    };

    let animId: number;
    const camTarget = new THREE.Vector3();
    const desiredCamPos = new THREE.Vector3();
    const _camForward = new THREE.Vector3();
    const _camRight = new THREE.Vector3();
    const _upVec = new THREE.Vector3(0, 1, 0);

    let syncTimer = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = performance.now() * 0.001;

      const { isFirstPerson, isDashing, joystickMove, touchLookDelta, currentTool } = stateRef.current;

      // Apply touch look delta from props if any
      if (touchLookDelta.dx !== 0 || touchLookDelta.dy !== 0) {
        cameraYaw -= touchLookDelta.dx * 0.0055;
        cameraPitch += touchLookDelta.dy * 0.0055;
        cameraPitch = Math.max(-0.45, Math.min(1.20, cameraPitch));
      }

      // --- MATHEMATICALLY ACCURATE CAMERA-RELATIVE VECTORS ---
      // Forward: where camera is pointing horizontally
      const forwardX = Math.sin(cameraYaw);
      const forwardZ = Math.cos(cameraYaw);
      // Right: Screen-right on horizontal plane (90 degrees clockwise from camera view)
      const rightX = -Math.cos(cameraYaw);
      const rightZ = Math.sin(cameraYaw);

      let moveX = 0;
      let moveZ = 0;

      // Keyboard Inputs (W/S: Forward/Back, D: Right, A: Left)
      if (keys['KeyW'] || keys['ArrowUp']) {
        moveX += forwardX;
        moveZ += forwardZ;
      }
      if (keys['KeyS'] || keys['ArrowDown']) {
        moveX -= forwardX;
        moveZ -= forwardZ;
      }
      if (keys['KeyD'] || keys['ArrowRight']) {
        moveX += rightX;
        moveZ += rightZ;
      }
      if (keys['KeyA'] || keys['ArrowLeft']) {
        moveX -= rightX;
        moveZ -= rightZ;
      }

      // Joystick Input (Minecraft PE / Roblox type)
      // joystickMove.y: +1 = Forward, -1 = Backward
      // joystickMove.x: +1 = Right, -1 = Left
      const joyLen = Math.hypot(joystickMove.x, joystickMove.y);
      if (joyLen > 0.05) {
        moveX += forwardX * joystickMove.y + rightX * joystickMove.x;
        moveZ += forwardZ * joystickMove.y + rightZ * joystickMove.x;
      }

      const inputLen = Math.hypot(moveX, moveZ);
      const baseSpeed = isDashing ? 9.5 : 5.8;
      const speedScale = joyLen > 0.05 ? Math.min(1.0, joyLen) : 1.0;
      const moveSpeed = baseSpeed * speedScale;

      if (inputLen > 0.001) {
        const normX = moveX / inputLen;
        const normZ = moveZ / inputLen;

        playerVel.x = normX * moveSpeed;
        playerVel.z = normZ * moveSpeed;

        // Character faces towards actual movement direction
        const targetFacingYaw = Math.atan2(normX, normZ);
        let diff = targetFacingYaw - facingYaw;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        facingYaw += diff * Math.min(1.0, 14 * dt);
      } else {
        // Friction on ground
        playerVel.x *= Math.pow(0.01, dt);
        playerVel.z *= Math.pow(0.01, dt);
      }

      // Dynamic Emotions (Lively Polandball!)
      blinkTimer -= dt;
      if (blinkTimer <= 0) {
        player.setEmotion('blink');
        setTimeout(() => {
          player.setEmotion(currentEmotion);
        }, 160);
        blinkTimer = 3.0 + Math.random() * 2.5;
      } else if (!isGrounded) {
        if (playerVel.y > 2.0) {
          player.setEmotion('happy');
        } else if (playerVel.y < -3.5) {
          player.setEmotion('worried');
        }
      } else if (isDashing && inputLen > 0.1) {
        player.setEmotion('squint');
      }

      // Gravity & Vertical Physics
      playerVel.y -= 26.0 * dt;
      playerPos.y += playerVel.y * dt;

      const ballRadius = 0.75;

      // Ceiling / Head Collision with placed blocks
      if (playerVel.y > 0) {
        const headY = playerPos.y + ballRadius;
        const checkBx = Math.floor(playerPos.x);
        const checkBy = Math.floor(headY);
        const checkBz = Math.floor(playerPos.z);
        if (world.hasVoxel(checkBx, checkBy, checkBz)) {
          playerPos.y = checkBy - ballRadius - 0.02;
          playerVel.y = 0;
        }
      }

      // Ground & Block Top Collision (Landing on terrain or placed blocks)
      const highestSurface = world.getHighestSurfaceAt(playerPos.x, playerPos.z, playerPos.y, 0.45);
      if (playerPos.y - ballRadius <= highestSurface) {
        playerPos.y = highestSurface + ballRadius;
        playerVel.y = 0;
        isGrounded = true;
      } else {
        isGrounded = false;
      }

      // Horizontal Collision: Test X with Block Obstacles & Auto Step-Up
      const candX = playerPos.x + playerVel.x * dt;
      const colX = world.checkBlockCollision(candX, playerPos.y, playerPos.z, 0.52);
      if (colX) {
        const stepHeight = (colX.blockY + 1.0) - (playerPos.y - ballRadius);
        if (isGrounded && stepHeight > 0 && stepHeight <= 0.65 && !world.hasVoxel(colX.blockX, colX.blockY + 1, colX.blockZ)) {
          playerPos.y += stepHeight + 0.02;
          playerPos.x = candX;
        } else {
          playerVel.x = 0;
          if (candX > playerPos.x) {
            playerPos.x = colX.blockX - 0.52 - 0.001;
          } else {
            playerPos.x = colX.blockX + 1.0 + 0.52 + 0.001;
          }
        }
      } else {
        playerPos.x = candX;
      }

      // Horizontal Collision: Test Z with Block Obstacles & Auto Step-Up
      const candZ = playerPos.z + playerVel.z * dt;
      const colZ = world.checkBlockCollision(playerPos.x, playerPos.y, candZ, 0.52);
      if (colZ) {
        const stepHeight = (colZ.blockY + 1.0) - (playerPos.y - ballRadius);
        if (isGrounded && stepHeight > 0 && stepHeight <= 0.65 && !world.hasVoxel(colZ.blockX, colZ.blockY + 1, colZ.blockZ)) {
          playerPos.y += stepHeight + 0.02;
          playerPos.z = candZ;
        } else {
          playerVel.z = 0;
          if (candZ > playerPos.z) {
            playerPos.z = colZ.blockZ - 0.52 - 0.001;
          } else {
            playerPos.z = colZ.blockZ + 1.0 + 0.52 + 0.001;
          }
        }
      } else {
        playerPos.z = candZ;
      }

      // Physical Sphere Collision with NPC Countryballs
      visitors.resolveCollisions(playerPos, ballRadius);

      // Keep within world bounds
      const maxBound = HALF_SIZE - 2;
      playerPos.x = THREE.MathUtils.clamp(playerPos.x, -maxBound, maxBound);
      playerPos.z = THREE.MathUtils.clamp(playerPos.z, -maxBound, maxBound);

      // Sync state back to ref
      if (engineRef.current) {
        engineRef.current.isGrounded = isGrounded;
        engineRef.current.facingYaw = facingYaw;
        engineRef.current.cameraYaw = cameraYaw;
        engineRef.current.cameraPitch = cameraPitch;
      }

      // Hopping & Waddling Walk Cycle
      const horizontalSpeed = Math.hypot(playerVel.x, playerVel.z);
      let hopY = 0;
      let waddleRoll = 0;
      let forwardLean = 0;
      let hopSquash = 1.0;

      if (isGrounded && horizontalSpeed > 0.4) {
        walkCyclePhase += horizontalSpeed * dt * 9.0;
        const hopStrength = Math.min(1.0, horizontalSpeed / 5.0);
        hopY = Math.abs(Math.sin(walkCyclePhase)) * 0.16 * hopStrength;
        waddleRoll = Math.sin(walkCyclePhase) * 0.08 * hopStrength;
        forwardLean = Math.min(0.2, (horizontalSpeed / 15.0) * 0.16);
        hopSquash = 1.0 + Math.sin(walkCyclePhase * 2.0) * 0.06 * hopStrength;
      } else if (isGrounded) {
        hopY = Math.sin(time * 2.5) * 0.02;
      } else {
        forwardLean = Math.max(-0.25, Math.min(0.25, playerVel.y * 0.02));
      }

      player.group.position.set(playerPos.x, playerPos.y + hopY, playerPos.z);
      player.group.rotation.y = facingYaw;
      player.group.rotation.x = forwardLean;
      player.group.rotation.z = waddleRoll;
      player.setSquash(hopSquash, 1.0 / Math.sqrt(hopSquash));

      // Contact shadow plane (rests on terrain or on top of placed blocks)
      shadowPlane.position.set(playerPos.x, highestSurface + 0.03, playerPos.z);
      const groundHeightDiff = playerPos.y - highestSurface;
      shadowPlane.scale.setScalar(Math.max(0.3, 1.2 - (groundHeightDiff - ballRadius) * 0.15));
      (shadowPlane.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0.1,
        0.38 - (groundHeightDiff - ballRadius) * 0.1
      );

      // Camera Positioning (Minecraft Third-person / First-person)
      if (isFirstPerson) {
        camera.position.set(
          playerPos.x + Math.sin(cameraYaw) * 0.1,
          playerPos.y + 0.35,
          playerPos.z + Math.cos(cameraYaw) * 0.1
        );
        camTarget.set(
          playerPos.x + Math.sin(cameraYaw) * 15,
          playerPos.y + 0.35 - Math.sin(cameraPitch) * 15,
          playerPos.z + Math.cos(cameraYaw) * 15
        );
        player.group.visible = false;

        // Block raycast highlight when in first person
        if (currentTool === 'block' || currentTool === 'road' || currentTool === 'pickaxe') {
          raycaster.setFromCamera(centerScreen, camera);
          const objectsToTest: THREE.Object3D[] = [world.terrainMesh, world.placedBlocksGroup];
          const hits = raycaster.intersectObjects(objectsToTest, true);
          if (hits.length > 0 && hits[0].distance < 12) {
            const hit = hits[0];
            const normal = hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0);
            const targetPos =
              currentTool === 'block' || currentTool === 'road'
                ? hit.point.clone().addScaledVector(normal, 0.45)
                : hit.point.clone().addScaledVector(normal, -0.4);

            blockHighlightMesh.position.set(
              Math.floor(targetPos.x) + 0.5,
              Math.floor(targetPos.y) + 0.5,
              Math.floor(targetPos.z) + 0.5
            );
            blockHighlightMesh.visible = true;
          } else {
            blockHighlightMesh.visible = false;
          }
        } else {
          blockHighlightMesh.visible = false;
        }
      } else {
        player.group.visible = true;
        blockHighlightMesh.visible = false;
        camTarget.set(playerPos.x, playerPos.y + 0.4, playerPos.z);

        const camDist = cameraDistance;
        const camH = Math.sin(cameraPitch) * camDist;
        const camR = Math.cos(cameraPitch) * camDist;

        desiredCamPos.set(
          playerPos.x - Math.sin(cameraYaw) * camR,
          playerPos.y + camH + 0.5,
          playerPos.z - Math.cos(cameraYaw) * camR
        );

        camera.position.x = THREE.MathUtils.damp(camera.position.x, desiredCamPos.x, 20, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, desiredCamPos.y, 20, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredCamPos.z, 20, dt);
      }
      camera.lookAt(camTarget);

      // Sun follows player
      sunLight.position.set(playerPos.x + 30, 45, playerPos.z + 25);
      sunLight.target.position.set(playerPos.x, playerPos.y, playerPos.z);
      sunLight.target.updateMatrixWorld();

      // Water animation & AI Visitors update
      world.update(time);
      visitors.update(dt, playerPos.x, playerPos.z);

      // Sync position to multiplayer peers (~15Hz)
      syncTimer += dt;
      if (syncTimer > 0.065) {
        syncTimer = 0;
        stateRef.current.onPlayerPosSync?.(
          { x: playerPos.x, y: playerPos.y, z: playerPos.z },
          facingYaw,
          currentEmotion
        );
      }

      // --- Render Remote Multiplayer Players ---
      const activePeers = stateRef.current.remotePeers || [];
      const activePeerIds = new Set(activePeers.map((p) => p.id));
      const remoteMap = engineRef.current?.remoteActorMeshes;

      if (remoteMap) {
        // Remove disconnected peers
        for (const [peerId, remoteObj] of remoteMap.entries()) {
          if (!activePeerIds.has(peerId)) {
            scene.remove(remoteObj.actor.group);
            remoteObj.actor.dispose();
            if (remoteObj.nameSprite.material.map) {
              remoteObj.nameSprite.material.map.dispose();
            }
            remoteObj.nameSprite.material.dispose();
            remoteMap.delete(peerId);
          }
        }

        // Add or update active peers
        for (const peer of activePeers) {
          let entry = remoteMap.get(peer.id);
          if (!entry) {
            const actor = new CountryballMeshActor(
              peer.country,
              0.8,
              null,
              null,
              peer.eyeScale || 0.8,
              peer.eyeSpacing || 1.4,
              peer.outlineThickness || 0.095
            );

            if (peer.frontFlagUrl || peer.backFlagUrl) {
              let fImg: HTMLImageElement | null = null;
              let bImg: HTMLImageElement | null = null;
              let pending = 0;
              const applyRemoteCustom = () => {
                if (pending === 0) actor.setCountry(peer.country, fImg, bImg);
              };
              if (peer.frontFlagUrl) {
                pending++;
                fImg = new Image();
                fImg.onload = () => {
                  pending--;
                  applyRemoteCustom();
                };
                fImg.src = peer.frontFlagUrl;
              }
              if (peer.backFlagUrl) {
                pending++;
                bImg = new Image();
                bImg.onload = () => {
                  pending--;
                  applyRemoteCustom();
                };
                bImg.src = peer.backFlagUrl;
              }
            }

            const nameSprite = createNameTagSprite(peer.name);
            actor.group.add(nameSprite);
            actor.group.position.set(peer.position.x, peer.position.y, peer.position.z);
            actor.group.rotation.y = peer.facingYaw;
            scene.add(actor.group);

            entry = { actor, nameSprite };
            remoteMap.set(peer.id, entry);
          }

          // Smooth position and rotation lerp
          entry.actor.group.position.x = THREE.MathUtils.damp(entry.actor.group.position.x, peer.position.x, 18, dt);
          entry.actor.group.position.y = THREE.MathUtils.damp(entry.actor.group.position.y, peer.position.y, 18, dt);
          entry.actor.group.position.z = THREE.MathUtils.damp(entry.actor.group.position.z, peer.position.z, 18, dt);

          let rDiff = peer.facingYaw - entry.actor.group.rotation.y;
          while (rDiff < -Math.PI) rDiff += Math.PI * 2;
          while (rDiff > Math.PI) rDiff -= Math.PI * 2;
          entry.actor.group.rotation.y += rDiff * Math.min(1.0, 16 * dt);

          if (peer.emotion) {
            entry.actor.setEmotion(peer.emotion);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleCanvasClick);
      if (engineRef.current) {
        for (const [, remoteObj] of engineRef.current.remoteActorMeshes.entries()) {
          scene.remove(remoteObj.actor.group);
          remoteObj.actor.dispose();
          if (remoteObj.nameSprite.material.map) {
            remoteObj.nameSprite.material.map.dispose();
          }
          remoteObj.nameSprite.material.dispose();
        }
        engineRef.current.remoteActorMeshes.clear();
      }
      visitors.dispose();
      world.dispose();
      player.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      highlightGeo.dispose();
      highlightMat.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update appearance when country, custom flags, outline, or eyes change
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    let frontImg: HTMLImageElement | null = null;
    let backImg: HTMLImageElement | null = null;
    let pendingLoads = 0;

    const checkApply = () => {
      if (pendingLoads === 0) {
        engine.player.setCountry(props.countryId, frontImg, backImg);
      }
    };

    if (props.countryId === 'custom' || props.countryId.startsWith('cball_')) {
      if (props.customFrontFlagDataUrl) {
        pendingLoads++;
        frontImg = new Image();
        frontImg.onload = () => {
          pendingLoads--;
          checkApply();
        };
        frontImg.src = props.customFrontFlagDataUrl;
      }
      if (props.customBackFlagDataUrl) {
        pendingLoads++;
        backImg = new Image();
        backImg.onload = () => {
          pendingLoads--;
          checkApply();
        };
        backImg.src = props.customBackFlagDataUrl;
      }
      if (pendingLoads === 0) {
        checkApply();
      }
    } else {
      engine.player.setCountry(props.countryId);
    }
  }, [props.countryId, props.customFrontFlagDataUrl, props.customBackFlagDataUrl]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.player.setOutlineThickness(props.outlineThickness);
    }
  }, [props.outlineThickness]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.player.setEyeScale(props.eyeScale);
    }
  }, [props.eyeScale]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.player.setEyeSpacing(props.eyeSpacing);
    }
  }, [props.eyeSpacing]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-crosshair"
      style={{ touchAction: 'none' }}
    />
  );
});
