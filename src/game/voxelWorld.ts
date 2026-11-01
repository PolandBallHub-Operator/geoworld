import * as THREE from 'three';
import { BlockType, CityBuildingType, CountryId, PlacedBlock } from '../types/game';
import { COUNTRIES } from '../data/countries';

export const WORLD_SIZE = 64; // 64x64 grid
export const TILE_SIZE = 2; // Each tile is 2x2 units
export const HALF_SIZE = (WORLD_SIZE * TILE_SIZE) / 2;
export const SEA_LEVEL = 1.0;
export const VOXEL_SIZE = 1.0;

export interface CityObject {
  id: string;
  type: CityBuildingType;
  x: number;
  z: number;
  group: THREE.Group;
}

export interface TerritoryMarker {
  id: string;
  x: number;
  z: number;
  countryId: CountryId;
  group: THREE.Group;
}

export class VoxelWorld {
  public scene: THREE.Scene;
  public heights: Float32Array; // 65x65 vertices
  public blockTypes: Uint8Array; // 64x64 tiles
  public territoryGrid: Int16Array;
  public claimedTilesCount = 0;

  // Render objects
  public terrainMesh: THREE.Mesh;
  private terrainGeometry: THREE.PlaneGeometry;
  private waterMesh: THREE.Mesh;
  private treeGroup: THREE.Group;
  private cityGroup: THREE.Group;
  private territoryGroup: THREE.Group;

  // Placed 3D Blocks (Minecraft-like building system)
  public placedBlocksGroup: THREE.Group;
  public placedBlocksMap: Map<
    string,
    { x: number; y: number; z: number; type: string; mesh: THREE.Mesh; customTextureUrl?: string }
  > = new Map();

  // Active props
  public cityObjects: CityObject[] = [];
  public territoryMarkers: TerritoryMarker[] = [];
  public trees: { x: number; z: number; group: THREE.Group }[] = [];

  // Reusable materials & shared cube geometry
  private terrainMaterial: THREE.MeshStandardMaterial;
  private waterMaterial: THREE.MeshPhysicalMaterial;
  private cubeGeometry: THREE.BoxGeometry;
  private materialCache: Map<string, THREE.Material> = new Map();

  constructor(scene: THREE.Scene, preset: string = 'plains_river', seed: number = 42) {
    this.scene = scene;
    const numVerts = (WORLD_SIZE + 1) * (WORLD_SIZE + 1);
    this.heights = new Float32Array(numVerts);
    this.blockTypes = new Uint8Array(WORLD_SIZE * WORLD_SIZE);
    this.territoryGrid = new Int16Array(WORLD_SIZE * WORLD_SIZE).fill(-1);

    this.treeGroup = new THREE.Group();
    this.cityGroup = new THREE.Group();
    this.territoryGroup = new THREE.Group();
    this.placedBlocksGroup = new THREE.Group();

    this.scene.add(this.treeGroup);
    this.scene.add(this.cityGroup);
    this.scene.add(this.territoryGroup);
    this.scene.add(this.placedBlocksGroup);

    this.cubeGeometry = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

    // Setup materials
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      flatShading: true,
    });

    this.waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x2288cc,
      transmission: 0.6,
      opacity: 0.8,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.333,
      depthWrite: false,
    });

    // Create Base Plane Geometry for terrain
    this.terrainGeometry = new THREE.PlaneGeometry(
      WORLD_SIZE * TILE_SIZE,
      WORLD_SIZE * TILE_SIZE,
      WORLD_SIZE,
      WORLD_SIZE
    );
    this.terrainGeometry.rotateX(-Math.PI / 2);

    this.terrainMesh = new THREE.Mesh(this.terrainGeometry, this.terrainMaterial);
    this.terrainMesh.receiveShadow = true;
    this.terrainMesh.castShadow = true;
    this.scene.add(this.terrainMesh);

    // Create Water Plane
    const waterGeom = new THREE.PlaneGeometry(
      WORLD_SIZE * TILE_SIZE * 1.5,
      WORLD_SIZE * TILE_SIZE * 1.5,
      16,
      16
    );
    waterGeom.rotateX(-Math.PI / 2);
    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMaterial);
    this.waterMesh.position.y = SEA_LEVEL;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    this.generateTerrain(preset, seed);
  }

  /**
   * Generates procedural geography based on preset
   */
  public generateTerrain(preset: string, seed: number) {
    const prng = (x: number, z: number) => {
      const v = Math.sin(x * 12.9898 + z * 78.233 + seed) * 43758.5453;
      return v - Math.floor(v);
    };

    const noise2D = (x: number, z: number) => {
      const i = Math.floor(x);
      const j = Math.floor(z);
      const fx = x - i;
      const fz = z - j;
      const s = fx * fx * (3 - 2 * fx);
      const t = fz * fz * (3 - 2 * fz);

      const a = prng(i, j);
      const b = prng(i + 1, j);
      const c = prng(i, j + 1);
      const d = prng(i + 1, j + 1);

      return a * (1 - s) * (1 - t) + b * s * (1 - t) + c * (1 - s) * t + d * s * t;
    };

    const fractal = (x: number, z: number) => {
      return (
        noise2D(x * 0.05, z * 0.05) * 4.0 +
        noise2D(x * 0.1, z * 0.1) * 2.0 +
        noise2D(x * 0.25, z * 0.25) * 0.8
      );
    };

    const vertCount = WORLD_SIZE + 1;
    for (let gz = 0; gz < vertCount; gz++) {
      for (let gx = 0; gx < vertCount; gx++) {
        const idx = gz * vertCount + gx;
        const worldX = (gx - vertCount / 2) * TILE_SIZE;
        const worldZ = (gz - vertCount / 2) * TILE_SIZE;

        let h = 2.0;
        if (preset === 'alps_mountain') {
          const dist = Math.sqrt(worldX * worldX + worldZ * worldZ) / HALF_SIZE;
          const mountainNoise = Math.pow(fractal(gx, gz), 1.8) * 2.2;
          h = Math.max(0.4, (1 - dist * 0.4) * mountainNoise);
        } else if (preset === 'archipelago') {
          const raw = fractal(gx, gz);
          h = raw > 2.5 ? (raw - 2.2) * 2.5 : 0.4;
        } else if (preset === 'continent_harbor') {
          const landRatio = (worldX + HALF_SIZE * 0.5) / (HALF_SIZE * 1.5);
          h = landRatio > 0.4 ? (landRatio - 0.4) * 5.0 + fractal(gx, gz) * 0.6 : 0.3;
        } else {
          const riverCurve = Math.sin(worldZ * 0.08) * 12;
          const riverDist = Math.abs(worldX - riverCurve);
          if (riverDist < 6) {
            h = 0.5 + (riverDist / 6) * 0.6;
          } else {
            h = 1.5 + fractal(gx, gz) * 0.8;
          }
        }

        this.heights[idx] = Math.max(0.2, h);
      }
    }

    this.rebuildTerrainMesh();

    // Starter trees
    for (let i = 0; i < 28; i++) {
      const tx = (Math.random() - 0.5) * (WORLD_SIZE * TILE_SIZE * 0.7);
      const tz = (Math.random() - 0.5) * (WORLD_SIZE * TILE_SIZE * 0.7);
      const ty = this.getHeightAt(tx, tz);
      if (ty > SEA_LEVEL + 0.5 && ty < 8.0) {
        this.addTree(tx, tz);
      }
    }
  }

  public rebuildTerrainMesh() {
    const pos = this.terrainGeometry.attributes.position;
    const colors: number[] = [];

    const cGrass = new THREE.Color(0x5ca038);
    const cSand = new THREE.Color(0xdfc07b);
    const cDirt = new THREE.Color(0x8a6338);
    const cStone = new THREE.Color(0x7e8489);
    const cSnow = new THREE.Color(0xf2f7fc);
    const cWaterBed = new THREE.Color(0x356e87);

    for (let i = 0; i < pos.count; i++) {
      const h = this.heights[i] || 0;
      pos.setY(i, h);

      const vertColor = new THREE.Color();
      if (h <= SEA_LEVEL + 0.3) {
        vertColor.copy(cWaterBed);
      } else if (h <= SEA_LEVEL + 0.8) {
        vertColor.copy(cSand);
      } else if (h < 5.0) {
        vertColor.copy(cGrass);
      } else if (h < 8.0) {
        vertColor.copy(cDirt);
      } else if (h < 12.0) {
        vertColor.copy(cStone);
      } else {
        vertColor.copy(cSnow);
      }

      colors.push(vertColor.r, vertColor.g, vertColor.b);
    }

    pos.needsUpdate = true;
    this.terrainGeometry.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(colors, 3)
    );
    this.terrainGeometry.computeVertexNormals();
  }

  public getHeightAt(x: number, z: number): number {
    const gx = (x + HALF_SIZE) / TILE_SIZE;
    const gz = (z + HALF_SIZE) / TILE_SIZE;

    const vertCount = WORLD_SIZE + 1;
    const i = Math.floor(gx);
    const j = Math.floor(gz);

    if (i < 0 || i >= WORLD_SIZE || j < 0 || j >= WORLD_SIZE) {
      return SEA_LEVEL;
    }

    const fx = gx - i;
    const fz = gz - j;

    const h00 = this.heights[j * vertCount + i] || 0;
    const h10 = this.heights[j * vertCount + (i + 1)] || 0;
    const h01 = this.heights[(j + 1) * vertCount + i] || 0;
    const h11 = this.heights[(j + 1) * vertCount + (i + 1)] || 0;

    return (
      h00 * (1 - fx) * (1 - fz) +
      h10 * fx * (1 - fz) +
      h01 * (1 - fx) * fz +
      h11 * fx * fz
    );
  }

  // --- MINECRAFT-STYLE BLOCK BUILDING SYSTEM ---

  private getBlockKey(bx: number, by: number, bz: number): string {
    return `${bx}_${by}_${bz}`;
  }

  /**
   * Generates or retrieves block material with authentic PBR finishes
   */
  public getBlockMaterial(type: string, customTextureUrl?: string): THREE.Material {
    const cacheKey = customTextureUrl ? `custom_${customTextureUrl.slice(-32)}` : type;
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!;
    }

    if (customTextureUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(customTextureUrl);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
        metalness: 0.05,
      });
      this.materialCache.set(cacheKey, mat);
      return mat;
    }

    // Procedural canvas textures for crisp zero-dependency block aesthetics
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    let roughness = 0.8;
    let metalness = 0.05;
    let transparent = false;
    let opacity = 1.0;
    let emissive = new THREE.Color(0x000000);

    switch (type) {
      case 'grass':
        ctx.fillStyle = '#558b2f';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#689f38';
        for (let i = 0; i < 40; i++) {
          ctx.fillRect(Math.random() * 60, Math.random() * 60, 4, 4);
        }
        break;

      case 'dirt':
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#5d4037';
        for (let i = 0; i < 30; i++) {
          ctx.fillRect(Math.random() * 60, Math.random() * 60, 5, 5);
        }
        break;

      case 'stone':
        ctx.fillStyle = '#78909c';
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, 56, 56);
        ctx.fillStyle = '#607d8b';
        ctx.fillRect(16, 16, 32, 32);
        break;

      case 'wood':
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#6d4c41';
        for (let y = 0; y < 64; y += 16) {
          ctx.fillRect(0, y, 64, 2);
        }
        break;

      case 'leaves':
        ctx.fillStyle = '#2e7d32';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#1b5e20';
        for (let i = 0; i < 60; i++) {
          ctx.fillRect(Math.random() * 60, Math.random() * 60, 3, 3);
        }
        break;

      case 'brick':
        ctx.fillStyle = '#b71c1c';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#cfd8dc';
        ctx.fillRect(0, 20, 64, 3);
        ctx.fillRect(0, 42, 64, 3);
        ctx.fillRect(30, 0, 3, 20);
        ctx.fillRect(15, 20, 3, 22);
        ctx.fillRect(45, 20, 3, 22);
        ctx.fillRect(30, 42, 3, 22);
        break;

      case 'cobblestone':
        ctx.fillStyle = '#616161';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.arc(18, 18, 12, 0, Math.PI * 2);
        ctx.arc(46, 20, 14, 0, Math.PI * 2);
        ctx.arc(28, 46, 15, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'road':
        ctx.fillStyle = '#263238'; // Dark asphalt
        ctx.fillRect(0, 0, 64, 64);
        // Yellow or white dashed line in center
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(28, 10, 8, 20);
        ctx.fillRect(28, 40, 8, 20);
        break;

      case 'glass':
        ctx.fillStyle = '#e1f5fe';
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = '#81d4fa';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 60, 60);
        transparent = true;
        opacity = 0.55;
        roughness = 0.1;
        break;

      case 'lantern':
        ctx.fillStyle = '#ffe082';
        ctx.fillRect(0, 0, 64, 64);
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 5;
        ctx.strokeRect(4, 4, 56, 56);
        emissive = new THREE.Color(0xffb300);
        break;

      default:
        ctx.fillStyle = '#9e9e9e';
        ctx.fillRect(0, 0, 64, 64);
        break;
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness,
      metalness,
      transparent,
      opacity,
      emissive,
    });

    this.materialCache.set(cacheKey, mat);
    return mat;
  }

  /**
   * Places a 3D block snapped to integer cube coordinates
   */
  public placeVoxel(
    x: number,
    y: number,
    z: number,
    type: string = 'stone',
    customTextureUrl?: string
  ): boolean {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);
    const key = this.getBlockKey(bx, by, bz);

    if (this.placedBlocksMap.has(key)) {
      return false; // Already occupied
    }

    const mat = this.getBlockMaterial(type, customTextureUrl);
    const mesh = new THREE.Mesh(this.cubeGeometry, mat);
    mesh.position.set(bx + 0.5, by + 0.5, bz + 0.5);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.placedBlocksGroup.add(mesh);
    this.placedBlocksMap.set(key, {
      x: bx,
      y: by,
      z: bz,
      type,
      mesh,
      customTextureUrl,
    });

    return true;
  }

  /**
   * Removes placed block at (x, y, z)
   */
  public removeVoxel(x: number, y: number, z: number): boolean {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);
    const key = this.getBlockKey(bx, by, bz);

    const block = this.placedBlocksMap.get(key);
    if (block) {
      this.placedBlocksGroup.remove(block.mesh);
      this.placedBlocksMap.delete(key);
      return true;
    }

    // If no block at integer coord, search adjacent
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const adjKey = this.getBlockKey(bx + dx, by + dy, bz + dz);
          const adj = this.placedBlocksMap.get(adjKey);
          if (adj) {
            this.placedBlocksGroup.remove(adj.mesh);
            this.placedBlocksMap.delete(adjKey);
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 🛣️ Road paving tool: lays flat road blocks on the terrain
   */
  public paveRoad(centerX: number, centerZ: number, radius = 2.0) {
    const bx = Math.floor(centerX);
    const bz = Math.floor(centerZ);

    for (let rx = -Math.floor(radius); rx <= Math.floor(radius); rx++) {
      for (let rz = -Math.floor(radius); rz <= Math.floor(radius); rz++) {
        const targetX = bx + rx;
        const targetZ = bz + rz;
        const groundY = Math.floor(this.getHeightAt(targetX + 0.5, targetZ + 0.5));
        this.placeVoxel(targetX, groundY, targetZ, 'road');
      }
    }
  }

  public serializePlacedBlocks(): PlacedBlock[] {
    const list: PlacedBlock[] = [];
    for (const b of this.placedBlocksMap.values()) {
      list.push({
        x: b.x,
        y: b.y,
        z: b.z,
        type: b.type,
        customTextureUrl: b.customTextureUrl,
      });
    }
    return list;
  }

  public loadPlacedBlocks(blocks: PlacedBlock[]) {
    // Clear old blocks
    for (const b of this.placedBlocksMap.values()) {
      this.placedBlocksGroup.remove(b.mesh);
    }
    this.placedBlocksMap.clear();

    if (Array.isArray(blocks)) {
      for (const b of blocks) {
        this.placeVoxel(b.x, b.y, b.z, b.type, b.customTextureUrl);
      }
    }
  }

  public hasVoxel(bx: number, by: number, bz: number): boolean {
    const key = this.getBlockKey(Math.floor(bx), Math.floor(by), Math.floor(bz));
    return this.placedBlocksMap.has(key);
  }

  public getHighestSurfaceAt(x: number, z: number, currentY: number, radius = 0.52): number {
    let highest = this.getHeightAt(x, z);

    const minBx = Math.floor(x - radius);
    const maxBx = Math.floor(x + radius);
    const minBz = Math.floor(z - radius);
    const maxBz = Math.floor(z + radius);

    for (let bx = minBx; bx <= maxBx; bx++) {
      for (let bz = minBz; bz <= maxBz; bz++) {
        const maxBy = Math.floor(currentY + 0.6);
        const minBy = Math.max(0, Math.floor(highest - 1));
        for (let by = maxBy; by >= minBy; by--) {
          if (this.hasVoxel(bx, by, bz)) {
            const blockTop = by + 1.0;
            if (blockTop <= currentY + 0.6) {
              if (blockTop > highest) {
                highest = blockTop;
              }
              break;
            }
          }
        }
      }
    }

    return highest;
  }

  public checkBlockCollision(
    x: number,
    y: number,
    z: number,
    radius = 0.55,
    bottomOffset = -0.55,
    topOffset = 0.55
  ): { collided: boolean; blockX: number; blockY: number; blockZ: number } | null {
    const minY = y + bottomOffset;
    const maxY = y + topOffset;
    const minBx = Math.floor(x - radius);
    const maxBx = Math.floor(x + radius);
    const minBy = Math.floor(minY);
    const maxBy = Math.floor(maxY);
    const minBz = Math.floor(z - radius);
    const maxBz = Math.floor(z + radius);

    for (let bx = minBx; bx <= maxBx; bx++) {
      for (let by = minBy; by <= maxBy; by++) {
        for (let bz = minBz; bz <= maxBz; bz++) {
          if (this.hasVoxel(bx, by, bz)) {
            const closestX = Math.max(bx, Math.min(x, bx + 1));
            const closestZ = Math.max(bz, Math.min(z, bz + 1));
            const distSq = (x - closestX) * (x - closestX) + (z - closestZ) * (z - closestZ);
            if (distSq < radius * radius && maxY > by && minY < by + 1) {
              return { collided: true, blockX: bx, blockY: by, blockZ: bz };
            }
          }
        }
      }
    }
    return null;
  }

  // --- STANDARD TERRAIN SHAPING TOOLS ---

  public dig(x: number, z: number, radius = 2.5, depth = 0.8) {
    const vertCount = WORLD_SIZE + 1;
    let modified = false;

    for (let gz = 0; gz < vertCount; gz++) {
      for (let gx = 0; gx < vertCount; gx++) {
        const wx = (gx - vertCount / 2) * TILE_SIZE;
        const wz = (gz - vertCount / 2) * TILE_SIZE;
        const dist = Math.hypot(wx - x, wz - z);
        if (dist <= radius) {
          const factor = 1 - dist / radius;
          const idx = gz * vertCount + gx;
          this.heights[idx] = Math.max(0.2, this.heights[idx] - depth * factor);
          modified = true;
        }
      }
    }

    if (modified) {
      this.rebuildTerrainMesh();
    }
  }

  public placeBlock(x: number, z: number, radius = 2.2, height = 0.8) {
    const vertCount = WORLD_SIZE + 1;
    for (let gz = 0; gz < vertCount; gz++) {
      for (let gx = 0; gx < vertCount; gx++) {
        const wx = (gx - vertCount / 2) * TILE_SIZE;
        const wz = (gz - vertCount / 2) * TILE_SIZE;
        const dist = Math.hypot(wx - x, wz - z);
        if (dist <= radius) {
          const factor = 1 - dist / radius;
          const idx = gz * vertCount + gx;
          this.heights[idx] = Math.min(18.0, this.heights[idx] + height * factor);
        }
      }
    }
    this.rebuildTerrainMesh();
  }

  public raiseMountain(x: number, z: number, radius = 7.0, peakHeight = 3.5) {
    const vertCount = WORLD_SIZE + 1;
    for (let gz = 0; gz < vertCount; gz++) {
      for (let gx = 0; gx < vertCount; gx++) {
        const wx = (gx - vertCount / 2) * TILE_SIZE;
        const wz = (gz - vertCount / 2) * TILE_SIZE;
        const dist = Math.hypot(wx - x, wz - z);
        if (dist <= radius) {
          const factor = Math.cos((dist / radius) * (Math.PI / 2));
          const idx = gz * vertCount + gx;
          this.heights[idx] = Math.min(22.0, this.heights[idx] + peakHeight * factor);
        }
      }
    }
    this.rebuildTerrainMesh();
  }

  public carveWater(x: number, z: number, radius = 3.5) {
    const vertCount = WORLD_SIZE + 1;
    for (let gz = 0; gz < vertCount; gz++) {
      for (let gx = 0; gx < vertCount; gx++) {
        const wx = (gx - vertCount / 2) * TILE_SIZE;
        const wz = (gz - vertCount / 2) * TILE_SIZE;
        const dist = Math.hypot(wx - x, wz - z);
        if (dist <= radius) {
          const idx = gz * vertCount + gx;
          const targetDepth = 0.4;
          const factor = 1 - dist / radius;
          this.heights[idx] = Math.min(
            this.heights[idx],
            this.heights[idx] * (1 - factor) + targetDepth * factor
          );
        }
      }
    }
    this.rebuildTerrainMesh();
  }

  public smoothTerrain(x: number, z: number, radius = 5.0) {
    const vertCount = WORLD_SIZE + 1;
    const tempHeights = new Float32Array(this.heights);

    for (let gz = 1; gz < vertCount - 1; gz++) {
      for (let gx = 1; gx < vertCount - 1; gx++) {
        const wx = (gx - vertCount / 2) * TILE_SIZE;
        const wz = (gz - vertCount / 2) * TILE_SIZE;
        const dist = Math.hypot(wx - x, wz - z);
        if (dist <= radius) {
          const idx = gz * vertCount + gx;
          const sum =
            tempHeights[idx - 1] +
            tempHeights[idx + 1] +
            tempHeights[idx - vertCount] +
            tempHeights[idx + vertCount];
          const avg = sum / 4;
          const blend = 0.6 * (1 - dist / radius);
          this.heights[idx] = this.heights[idx] * (1 - blend) + avg * blend;
        }
      }
    }
    this.rebuildTerrainMesh();
  }

  public autoForest(centerX: number, centerZ: number, radius = 6.0) {
    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;
      const tx = centerX + Math.cos(angle) * r;
      const tz = centerZ + Math.sin(angle) * r;
      const ty = this.getHeightAt(tx, tz);

      if (ty > SEA_LEVEL + 0.4 && ty < 10.0) {
        this.addTree(tx, tz);
      }
    }
  }

  public addTree(x: number, z: number) {
    const group = new THREE.Group();
    const y = this.getHeightAt(x, z);

    const trunkGeom = new THREE.CylinderGeometry(0.18, 0.28, 1.8, 6);
    trunkGeom.translate(0, 0.9, 0);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a3d28,
      roughness: 0.9,
      metalness: 0.05,
    });
    const trunk = new THREE.Mesh(trunkGeom, trunkMat);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    group.add(trunk);

    const leavesMat1 = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.75 });
    const leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.75 });

    const coneGeom1 = new THREE.ConeGeometry(1.2, 1.6, 7);
    coneGeom1.translate(0, 1.8, 0);
    const cone1 = new THREE.Mesh(coneGeom1, leavesMat1);
    cone1.castShadow = true;
    group.add(cone1);

    const coneGeom2 = new THREE.ConeGeometry(0.9, 1.4, 7);
    coneGeom2.translate(0, 2.6, 0);
    const cone2 = new THREE.Mesh(coneGeom2, leavesMat2);
    cone2.castShadow = true;
    group.add(cone2);

    const scale = 0.85 + Math.random() * 0.3;
    group.scale.set(scale, scale, scale);
    group.position.set(x, y, z);
    group.rotation.y = Math.random() * Math.PI * 2;

    this.treeGroup.add(group);
    this.trees.push({ x, z, group });
  }

  public claimTerritory(centerX: number, centerZ: number, countryId: CountryId, radius = 5.0) {
    const country = COUNTRIES[countryId] || COUNTRIES.japan;
    const group = new THREE.Group();
    const y = this.getHeightAt(centerX, centerZ);

    const stoneGeom = new THREE.BoxGeometry(0.7, 0.5, 0.7);
    stoneGeom.translate(0, 0.25, 0);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.8 });
    const stone = new THREE.Mesh(stoneGeom, stoneMat);
    stone.castShadow = true;
    group.add(stone);

    const poleGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
    poleGeom.translate(0, 1.25, 0);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.8,
      roughness: 0.2,
    });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.castShadow = true;
    group.add(pole);

    const flagGeom = new THREE.PlaneGeometry(0.9, 0.6);
    flagGeom.translate(0.45, 2.1, 0);
    const flagMat = new THREE.MeshStandardMaterial({
      color: country.primaryColor,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const flag = new THREE.Mesh(flagGeom, flagMat);
    group.add(flag);

    const ringGeom = new THREE.RingGeometry(radius * 0.95, radius, 32);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: country.secondaryColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.position.y = 0.05;
    group.add(ring);

    group.position.set(centerX, y, centerZ);
    this.territoryGroup.add(group);

    this.territoryMarkers.push({
      id: `tm_${Date.now()}`,
      x: centerX,
      z: centerZ,
      countryId,
      group,
    });

    this.claimedTilesCount += Math.floor(Math.PI * (radius / TILE_SIZE) * (radius / TILE_SIZE));
  }

  public buildCity(x: number, z: number, type: CityBuildingType = 'house') {
    const group = new THREE.Group();
    const y = this.getHeightAt(x, z);

    if (type === 'windmill') {
      const towerGeom = new THREE.CylinderGeometry(0.5, 0.9, 3.2, 8);
      towerGeom.translate(0, 1.6, 0);
      const towerMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 });
      const tower = new THREE.Mesh(towerGeom, towerMat);
      tower.castShadow = true;
      group.add(tower);

      const roofGeom = new THREE.ConeGeometry(0.7, 0.8, 8);
      roofGeom.translate(0, 3.6, 0);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      group.add(roof);

      const bladeGeom = new THREE.BoxGeometry(0.2, 3.0, 0.04);
      bladeGeom.translate(0, 0, 0.5);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const blades = new THREE.Mesh(bladeGeom, bladeMat);
      blades.position.set(0, 3.2, 0);
      group.add(blades);
    } else if (type === 'school') {
      const mainGeom = new THREE.BoxGeometry(3.0, 1.8, 2.0);
      mainGeom.translate(0, 0.9, 0);
      const mainMat = new THREE.MeshStandardMaterial({ color: 0xfffae6, roughness: 0.4 });
      const main = new THREE.Mesh(mainGeom, mainMat);
      main.castShadow = true;
      group.add(main);

      const roofGeom = new THREE.ConeGeometry(2.2, 1.0, 4);
      roofGeom.rotateY(Math.PI / 4);
      roofGeom.translate(0, 2.3, 0);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e88e5 });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      group.add(roof);

      const clockGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12);
      clockGeom.rotateX(Math.PI / 2);
      clockGeom.translate(0, 2.0, 1.02);
      const clockMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
      group.add(new THREE.Mesh(clockGeom, clockMat));
    } else {
      const wallGeom = new THREE.BoxGeometry(1.6, 1.3, 1.6);
      wallGeom.translate(0, 0.65, 0);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xffebcd, roughness: 0.6 });
      const wall = new THREE.Mesh(wallGeom, wallMat);
      wall.castShadow = true;
      group.add(wall);

      const roofGeom = new THREE.ConeGeometry(1.3, 0.9, 4);
      roofGeom.rotateY(Math.PI / 4);
      roofGeom.translate(0, 1.75, 0);
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.castShadow = true;
      group.add(roof);

      const doorGeom = new THREE.BoxGeometry(0.36, 0.6, 0.05);
      doorGeom.translate(0, 0.3, 0.82);
      const doorMat = new THREE.MeshStandardMaterial({ color: 0x4e342e });
      group.add(new THREE.Mesh(doorGeom, doorMat));
    }

    group.position.set(x, y, z);
    this.cityGroup.add(group);
    this.cityObjects.push({
      id: `city_${Date.now()}`,
      type,
      x,
      z,
      group,
    });
  }

  public update(time: number) {
    if (this.waterMesh) {
      this.waterMesh.position.y = SEA_LEVEL + Math.sin(time * 1.5) * 0.04;
    }
  }

  public dispose() {
    this.terrainGeometry.dispose();
    this.terrainMaterial.dispose();
    this.waterMaterial.dispose();
    this.cubeGeometry.dispose();
    this.scene.remove(this.terrainMesh);
    this.scene.remove(this.waterMesh);
    this.scene.remove(this.treeGroup);
    this.scene.remove(this.cityGroup);
    this.scene.remove(this.territoryGroup);
    this.scene.remove(this.placedBlocksGroup);
  }
}
