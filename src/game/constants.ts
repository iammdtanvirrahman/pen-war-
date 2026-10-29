import * as THREE from 'three';
import { AiLevel, PenModelOption } from '../types/game';

export const TABLE_URL = '/assets/table/models/gallinera_table_4k.glb';
export const PEN_URL = '/assets/pens/models/faber-castell_pen.glb';
export const WOOD_URL = '/assets/table/textures/gallinera_table_diff_4k.jpg';

export const PLAYER_COLORS = [0xff4d5e, 0x4cc9f0];
export const PLAYER_HEX = ['#ff4d5e', '#4cc9f0'];

export const PEN_MODELS: PenModelOption[] = [
  {
    id: 'faber_castell',
    name: 'Faber-Castell Grip 2011',
    subtitle: 'Classic GLB Asset',
    description: 'Authentic 3D model with signature grip dots and spring-loaded metal clip. Superbly balanced.',
    previewImage: '/assets/pens/previews/faber_castell.svg',
    weight: 0.042,
    speedFactor: 1.0,
    spinFactor: 1.0,
    source: 'asset',
  },
  {
    id: 'fineliner',
    name: 'Precision Fineliner',
    subtitle: 'High Stability',
    description: 'Slender matte drafting casing with knurled grip ring. Low aerodynamic drag and straight slide.',
    previewImage: '/assets/pens/previews/fineliner.svg',
    weight: 0.038,
    speedFactor: 1.08,
    spinFactor: 0.88,
    source: 'procedural',
  },
  {
    id: 'tactical',
    name: 'Heavy Tactical Pen',
    subtitle: 'High Momentum',
    description: 'Solid machined metal with ribbed facets and weighted tungsten glass-breaker cap. Hits opponents hard.',
    previewImage: '/assets/pens/previews/tactical.svg',
    weight: 0.052,
    speedFactor: 0.92,
    spinFactor: 1.15,
    source: 'procedural',
  },
  {
    id: 'rollerball',
    name: 'Gel Rollerball',
    subtitle: 'High Spin',
    description: 'Comfort rubber grip with ergonomic taper. Sensitive off-centre strikes produce dramatic curl.',
    previewImage: '/assets/pens/previews/rollerball.svg',
    weight: 0.040,
    speedFactor: 1.04,
    spinFactor: 1.25,
    source: 'procedural',
  },
];

export const COLOR_PALETTE_P1 = [
  { name: 'Crimson Flame', hex: '#ff4d5e' },
  { name: 'Blaze Orange', hex: '#f97316' },
  { name: 'Champion Gold', hex: '#eab308' },
  { name: 'Midnight Onyx', hex: '#27272a' },
  { name: 'Rose Metal', hex: '#fb7185' },
];

export const COLOR_PALETTE_P2 = [
  { name: 'Neon Cyan', hex: '#4cc9f0' },
  { name: 'Electric Purple', hex: '#a855f7' },
  { name: 'Emerald Jade', hex: '#10b981' },
  { name: 'Titanium White', hex: '#e4e4e7' },
  { name: 'Cobalt Blue', hex: '#3b82f6' },
];

export const ALL_PLAYER_COLORS = [
  '#ff4d5e', // P1: Crimson
  '#4cc9f0', // P2: Neon Cyan
  '#10b981', // P3: Emerald
  '#f59e0b', // P4: Amber Gold
  '#a855f7', // P5: Electric Purple
  '#ec4899', // P6: Hot Pink
];

export const DEFAULT_PLAYERS = [
  { id: 0, name: 'Player 1', model: 'faber_castell' as const, color: '#ff4d5e', accentColor: '#ffffff', isAi: false, aiLevel: 'medium' as const },
  { id: 1, name: 'Player 2', model: 'fineliner' as const, color: '#4cc9f0', accentColor: '#ffffff', isAi: false, aiLevel: 'medium' as const },
  { id: 2, name: 'Player 3', model: 'tactical' as const, color: '#10b981', accentColor: '#ffffff', isAi: true, aiLevel: 'medium' as const },
  { id: 3, name: 'Player 4', model: 'rollerball' as const, color: '#f59e0b', accentColor: '#ffffff', isAi: true, aiLevel: 'medium' as const },
  { id: 4, name: 'Player 5', model: 'faber_castell' as const, color: '#a855f7', accentColor: '#ffffff', isAi: true, aiLevel: 'medium' as const },
  { id: 5, name: 'Player 6', model: 'tactical' as const, color: '#ec4899', accentColor: '#ffffff', isAi: true, aiLevel: 'medium' as const },
];

export const DEFAULT_PLAYER_1 = {
  name: 'Player 1',
  model: 'faber_castell' as const,
  color: '#ff4d5e',
  accentColor: '#ffffff',
};

export const DEFAULT_PLAYER_2 = {
  name: 'Player 2',
  model: 'faber_castell' as const,
  color: '#4cc9f0',
  accentColor: '#ffffff',
};

export const PEN_MASS = 0.04;
export const TARGET_PEN_LENGTH = 0.72;

export const V_MIN = 0.75;
export const V_MAX = 5.8; // controlled launch speed range (world units/s)
export const MIN_PULL = 0.10;
export const MAX_PULL = 1.3; // slingshot pull range on the table (world units)
export const TABLE_DECEL = 2.15; // tabletop kinetic friction: longer, controllable pen slides
export const ROLL_DAMP = 4.6; // moderate axial rolling resistance; preserve believable spin
export const FIXED_STEP = 1 / 120; // 120Hz fixed step for ultra-smooth physical motion

export const AI_LEVELS: Record<AiLevel, { pool: number; angle: number; power: number; offset: number }> = {
  easy: { pool: 4, angle: 0.2, power: 0.28, offset: 0.5 },
  medium: { pool: 2, angle: 0.08, power: 0.12, offset: 0.2 },
  hard: { pool: 1, angle: 0.025, power: 0.05, offset: 0.05 },
};

export const UP = new THREE.Vector3(0, 1, 0);
export const YAWS = [0.1, -0.12, 0.07, -0.06];

export const clamp = THREE.MathUtils.clamp;
export const lerp = THREE.MathUtils.lerp;
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export const pullToPower = (d: number) => clamp((d - MIN_PULL) / (MAX_PULL - MIN_PULL), 0, 1);
export const speedOf = (p: number) => V_MIN + (V_MAX - V_MIN) * Math.pow(p, 1.15);
export const powerOfSpeed = (v: number) => Math.pow(clamp((v - V_MIN) / (V_MAX - V_MIN), 0, 1), 1 / 1.15);
