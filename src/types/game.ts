import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type GameMode = 'friend' | 'ai' | 'practice';
export type MatchFormat = 'single' | 'team';
export type AiLevel = 'easy' | 'medium' | 'hard';
export type MatchState = 'idle' | 'aim' | 'moving' | 'over';
export type PenModelType = 'faber_castell' | 'fineliner' | 'tactical' | 'rollerball';

export interface PenModelOption {
  id: PenModelType;
  name: string;
  subtitle: string;
  description: string;
  previewImage: string;
  weight: number; // in kg for physics
  speedFactor: number;
  spinFactor: number;
  source: 'asset' | 'procedural';
}

export interface PlayerCustomization {
  name: string;
  model: PenModelType;
  color: string; // Hex color for the pen barrel/accent
  accentColor: string;
}

export interface PlayerConfig {
  id: number;
  name: string;
  model: PenModelType;
  color: string;
  accentColor: string;
  isAi: boolean;
  aiLevel: AiLevel;
}

export interface GameSettings {
  mode: GameMode;
  format: MatchFormat;
  level: AiLevel;
  pens: number; // 1, 2, 3, or 4 pens per side/player
  playerCount: number; // 2, 3, 4, 5, 6 players in Single Duel; 2 or 3 per team in Team Battle
  players: PlayerConfig[];
  player1: PlayerCustomization;
  player2: PlayerCustomization;
}

export interface Piece {
  mesh: THREE.Group;
  body: CANNON.Body;
  player: number; // 0 (Player 1) or 1 (Player 2 / AI)
  idx: number;
  mats: THREE.Material[];
  halo: THREE.Group;
  haloMat: THREE.MeshBasicMaterial;
  length: number;
  radius: number;
  colR: number;
  yawDecel: number;
  alive: boolean;
  gone: boolean;
  removeAt: number;
  haloA: number;
}

export interface DeckConfig {
  cx: number;
  cz: number;
  halfX: number;
  halfZ: number;
  y: number;
  halfL: number;
  halfS: number;
  L: THREE.Vector3;
  S: THREE.Vector3;
  baseYaw: number;
}

export interface DragState {
  pc: Piece;
  s: number;
  F0: THREE.Vector3;
  pointerId: number;
  dir: THREE.Vector3 | null;
  power: number;
  speed: number;
  offset: THREE.Vector3;
}

export interface AiShotPlan {
  pc: Piece;
  s: number;
  dir: THREE.Vector3;
  speed: number;
  power: number;
  t: number;
  dur: number;
}

export interface CameraView {
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

export interface CameraTween {
  t: number;
  dur: number;
  fromT: THREE.Vector3;
  toT: THREE.Vector3;
  sFrom: THREE.Spherical;
  sTo: THREE.Spherical;
  dTheta: number;
}

export interface PowerUIState {
  visible: boolean;
  power: number;
  spinComment: string;
}
