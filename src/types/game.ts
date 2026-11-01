export type CountryId =
  | 'germany'
  | 'japan'
  | 'china'
  | 'italy'
  | 'sierraleone'
  | 'russia'
  | 'france'
  | 'poland'
  | 'england472x600'
  | 'usa'
  | 'korea'
  | 'austria'
  | 'custom'
  | string;

export type ExpressionId =
  | 'anger.png'
  | 'dissatisfaction.png'
  | 'happy.png'
  | 'itome.png'
  | 'lol.png'
  | 'normal.png'
  | 'plot.png'
  | 'smile.png'
  | 'surprise.png';

export type BallEmotion = 'normal' | 'happy' | 'worried' | 'blink' | 'squint' | 'plot';

export interface CustomBallDef {
  id: string;
  name: string;
  frontFlagUrl: string;
  backFlagUrl?: string;
  createdAt: number;
}

export interface CustomBlockDef {
  id: string;
  name: string;
  textureDataUrl: string;
}

export interface PlacedBlock {
  x: number;
  y: number;
  z: number;
  type: BlockType | string;
  customTextureUrl?: string;
}

export interface CountryInfo {
  id: CountryId;
  name: string;
  nameEn: string;
  flagEmoji: string;
  capital: string;
  continent: string;
  geographyFact: string;
  price: number;
  accessoryName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface ExpressionInfo {
  id: ExpressionId;
  name: string;
  description: string;
  price: number;
  emoji: string;
}

export type ToolType =
  | 'pickaxe'     // ⛏️ ツルハシ
  | 'block'       // 🧱 ブロック建築
  | 'terrain_add' // 🏔️ 地形追加（従来の盛り土造成）
  | 'road'        // 🛣️ 道路舗装
  | 'water'       // 🌊 川・海ツール
  | 'mountain'    // ⛰️ 山岳ツール
  | 'city'        // 🏙️ 都市・建築
  | 'forest'      // 🌲 自動植林ブラシ
  | 'smooth'      // 🖌️ スムースブラシ
  | 'territory'   // 🚩 建国・領土指定
  | 'diplomacy'   // 🤝 外交・交流
  | 'scanner';    // 🔍 地理スキャナー

export type BlockType =
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'sand'
  | 'snow'
  | 'water'
  | 'wood'
  | 'leaves'
  | 'brick'
  | 'road'
  | 'cobblestone'
  | 'glass'
  | 'lantern';

export type CityBuildingType =
  | 'house'
  | 'school'
  | 'townhall'
  | 'windmill'
  | 'bridge'
  | 'monument';

export interface WorldSlot {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  terrainSeed: number;
  preset: 'plains_river' | 'archipelago' | 'alps_mountain' | 'continent_harbor';
  territorySizeKm2: number;
  blocksModifiedCount: number;
  establishedNationName: string;
  placedBlocks?: PlacedBlock[];
  customBlocks?: CustomBlockDef[];
  customBalls?: CustomBallDef[];
}

export interface SharedWorldData {
  name: string;
  preset: WorldSlot['preset'];
  terrainSeed: number;
  territorySizeKm2: number;
  establishedNationName: string;
  placedBlocks: PlacedBlock[];
  customBlocks?: CustomBlockDef[];
}

export interface PlayerStats {
  coins: number;
  username: string;
  selectedCountry: CountryId;
  selectedExpression: ExpressionId;
  unlockedCountries: CountryId[];
  unlockedExpressions: ExpressionId[];
  discoveredFactsCount: number;
  signedTreatiesCount: number;
  // Customization settings (Defaults: eyeScale 0.80, eyeSpacing 1.40)
  outlineThickness: number;
  eyeScale: number;
  eyeSpacing: number;
  customFrontFlagDataUrl?: string;
  customBackFlagDataUrl?: string;
  customBalls?: CustomBallDef[];
  customBlocks?: CustomBlockDef[];
}

export interface VisitingBall {
  id: string;
  countryId: CountryId;
  expressionId: ExpressionId;
  name: string;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  speechBubble?: string;
  bubbleTimer?: number;
  geographyQuiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface GameSettings {
  soundEnabled: boolean;
  bgmEnabled: boolean;
  mouseSensitivity: number;
  viewDistance: 'low' | 'medium' | 'high';
  showHelpers: boolean;
  outlineThickness: number;
  eyeScale: number;
  eyeSpacing: number;
}

export interface PeerChatMessage {
  id: string;
  sender: string;
  text: string;
  time: number;
}

export interface RemotePeerState {
  id: string;
  name: string;
  country: CountryId;
  frontFlagUrl?: string;
  backFlagUrl?: string;
  eyeScale: number;
  eyeSpacing: number;
  outlineThickness: number;
  position: { x: number; y: number; z: number };
  facingYaw: number;
  emotion: BallEmotion;
}
