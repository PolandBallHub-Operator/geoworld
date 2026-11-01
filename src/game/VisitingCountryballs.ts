import * as THREE from 'three';
import { CountryId, ExpressionId, VisitingBall, BallEmotion } from '../types/game';
import { COUNTRIES, COUNTRY_KEYS, GEOGRAPHY_QUIZZES } from '../data/countries';
import { CountryballMeshActor } from '../graphics/countryballMesh';
import { VoxelWorld } from './voxelWorld';

export class VisitingCountryballsManager {
  private scene: THREE.Scene;
  private world: VoxelWorld;
  public balls: {
    data: VisitingBall;
    actor: CountryballMeshActor;
    shadowMesh: THREE.Mesh;
    speechSprite: THREE.Sprite | null;
    currentEmotion: BallEmotion;
    blinkTimer: number;
    smileTimer: number;
  }[] = [];

  constructor(scene: THREE.Scene, world: VoxelWorld) {
    this.scene = scene;
    this.world = world;
    this.spawnInitialVisitors();
  }

  private spawnInitialVisitors() {
    const availableCountries: CountryId[] = [
      'germany',
      'france',
      'italy',
      'poland',
      'england472x600',
      'russia',
      'austria',
      'china',
      'sierraleone',
    ];
    const friendlyGreetings = [
      'こんにちは！世界の地理を探検しよう！',
      'Hallo! ドイツのライン川は有名だよ！',
      'Bonjour! エッフェル塔を見に来てね！',
      'Ciao! 地中海性気候は最高だよ！',
      'Hello! 仲良く平和条約を結ぼう！',
      'Ni Hao! 長江の長さは6300kmだよ！',
    ];

    for (let i = 0; i < 5; i++) {
      const cId = availableCountries[i % availableCountries.length];
      const eId: ExpressionId = i % 2 === 0 ? 'happy.png' : 'smile.png';
      const startX = (Math.random() - 0.5) * 40;
      const startZ = (Math.random() - 0.5) * 40;
      const quiz = GEOGRAPHY_QUIZZES[i % GEOGRAPHY_QUIZZES.length];

      const ballData: VisitingBall = {
        id: `vis_${i}_${cId}`,
        countryId: cId,
        expressionId: eId,
        name: COUNTRIES[cId].name,
        x: startX,
        z: startZ,
        targetX: startX + (Math.random() - 0.5) * 15,
        targetZ: startZ + (Math.random() - 0.5) * 15,
        speed: 1.2 + Math.random() * 0.8,
        speechBubble: friendlyGreetings[i % friendlyGreetings.length],
        bubbleTimer: 5.0,
        geographyQuiz: quiz,
      };

      this.createBallMesh(ballData);
    }
  }

  private createBallMesh(data: VisitingBall) {
    const y = this.world.getHeightAt(data.x, data.z);

    // 1. Soft radial shadow
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 64;
    shadowCanvas.height = 64;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const g = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
      g.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = g;
      sCtx.fillRect(0, 0, 64, 64);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(1.6, 1.6);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    shadowMesh.position.y = 0.02;

    // 2. Authentic 3D CountryballMesh Actor
    const actor = new CountryballMeshActor(data.countryId, 0.7);
    actor.group.position.set(data.x, y + 0.65, data.z);
    actor.group.add(shadowMesh);
    shadowMesh.position.set(0, -0.63, 0);

    // 3. Name badge sprite
    const sprite = this.createLabelSprite(
      COUNTRIES[data.countryId].flagEmoji + ' ' + COUNTRIES[data.countryId].name
    );
    sprite.position.y = 1.45;
    actor.group.add(sprite);

    this.scene.add(actor.group);

    this.balls.push({
      data,
      actor,
      shadowMesh,
      speechSprite: sprite,
      currentEmotion: 'normal',
      blinkTimer: 2.0 + Math.random() * 3.0,
      smileTimer: 0,
    });
  }

  private createLabelSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.roundRect(10, 8, 236, 48, 16);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2563eb';
      ctx.stroke();

      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.6, 0.4, 1);
    return sprite;
  }

  /**
   * Temporarily triggers joyful expression when player talks to or signs treaty with visitor,
   * automatically opening eyes back to normal after duration.
   */
  public triggerVisitorGreeting(ballId: string) {
    const b = this.balls.find((item) => item.data.id === ballId);
    if (b) {
      b.currentEmotion = 'happy';
      b.actor.setEmotion('happy');
      b.smileTimer = 2.2;
    }
  }

  /**
   * Resolves physical sphere collision between player and NPC balls,
   * and between NPCs, so characters bump into each other realistically.
   */
  public resolveCollisions(playerPos: THREE.Vector3, playerRadius = 0.75): boolean {
    const npcRadius = 0.70;
    const minPlayerDist = playerRadius + npcRadius; // 1.45m
    let hadCollision = false;

    // 1. Player <-> NPC collision resolution
    for (const b of this.balls) {
      const dx = playerPos.x - b.data.x;
      const dz = playerPos.z - b.data.z;
      const dist = Math.hypot(dx, dz);

      if (dist < minPlayerDist && dist > 0.0001) {
        hadCollision = true;
        const overlap = minPlayerDist - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        // Push player away and nudge NPC back
        playerPos.x += nx * overlap * 0.70;
        playerPos.z += nz * overlap * 0.70;

        b.data.x -= nx * overlap * 0.30;
        b.data.z -= nz * overlap * 0.30;

        // Soft elastic bounce response
        b.actor.setSquash(1.08, 0.92);
      }
    }

    // 2. NPC <-> NPC collision resolution
    const minNpcDist = npcRadius * 2.0; // 1.40m
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const b1 = this.balls[i];
        const b2 = this.balls[j];
        const dx = b1.data.x - b2.data.x;
        const dz = b1.data.z - b2.data.z;
        const dist = Math.hypot(dx, dz);

        if (dist < minNpcDist && dist > 0.0001) {
          const overlap = minNpcDist - dist;
          const nx = dx / dist;
          const nz = dz / dist;

          b1.data.x += nx * overlap * 0.5;
          b1.data.z += nz * overlap * 0.5;
          b2.data.x -= nx * overlap * 0.5;
          b2.data.z -= nz * overlap * 0.5;
        }
      }
    }

    return hadCollision;
  }

  public update(dt: number, playerX: number, playerZ: number) {
    const time = Date.now() * 0.001;

    for (const b of this.balls) {
      const data = b.data;
      const distToPlayer = Math.hypot(playerX - data.x, playerZ - data.z);

      // Handle eye emotion timer & natural blinking (never get stuck closed!)
      if (b.smileTimer > 0) {
        b.smileTimer -= dt;
        if (b.smileTimer <= 0) {
          b.currentEmotion = 'normal';
          b.actor.setEmotion('normal');
        }
      } else {
        b.blinkTimer -= dt;
        if (b.blinkTimer <= 0) {
          b.actor.setEmotion('blink');
          setTimeout(() => {
            b.actor.setEmotion(b.currentEmotion || 'normal');
          }, 140);
          b.blinkTimer = 3.0 + Math.random() * 3.5;
        }
      }

      if (distToPlayer < 4.0) {
        // Face player and greet
        const angle = Math.atan2(playerX - data.x, playerZ - data.z);
        b.actor.group.rotation.y = angle;

        // Idle breathing hop
        const groundY = this.world.getHeightAt(data.x, data.z);
        b.actor.group.position.set(data.x, groundY + 0.65 + Math.sin(time * 3) * 0.04, data.z);

        // Keep eyes open with friendly expression (only temporary smile, never permanently closed)
        if (distToPlayer < 2.5 && b.smileTimer <= 0 && b.currentEmotion === 'normal') {
          b.currentEmotion = 'happy';
          b.actor.setEmotion('happy');
          b.smileTimer = 1.8; // Smile for 1.8s then open back to normal
        }
      } else {
        // When away from player, ensure eyes are open normal
        if (b.currentEmotion !== 'normal' && b.smileTimer <= 0) {
          b.currentEmotion = 'normal';
          b.actor.setEmotion('normal');
        }

        const dx = data.targetX - data.x;
        const dz = data.targetZ - data.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.5) {
          const moveDist = Math.min(dist, data.speed * dt);
          data.x += (dx / dist) * moveDist;
          data.z += (dz / dist) * moveDist;
          b.actor.group.rotation.y = Math.atan2(dx, dz);

          // Hopping walk
          const hop = Math.abs(Math.sin(time * 6)) * 0.12;
          const groundY = this.world.getHeightAt(data.x, data.z);
          b.actor.group.position.set(data.x, groundY + 0.65 + hop, data.z);
          b.actor.setSquash(1.0 + hop * 0.5, 1.0 - hop * 0.25);
        } else {
          data.targetX = (Math.random() - 0.5) * 50;
          data.targetZ = (Math.random() - 0.5) * 50;
          b.actor.setSquash(1.0, 1.0);
        }
      }
    }
  }

  public getNearestVisitor(x: number, z: number, maxDist = 4.5): VisitingBall | null {
    let nearest: VisitingBall | null = null;
    let minD = maxDist;
    for (const b of this.balls) {
      const d = Math.hypot(x - b.data.x, z - b.data.z);
      if (d < minD) {
        minD = d;
        nearest = b.data;
      }
    }
    return nearest;
  }

  public dispose() {
    for (const b of this.balls) {
      this.scene.remove(b.actor.group);
      b.actor.dispose();
      b.shadowMesh.geometry.dispose();
    }
    this.balls = [];
  }
}
