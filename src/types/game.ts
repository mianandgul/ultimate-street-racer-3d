import type * as THREE from 'three';

export interface CarStats {
  id: string;
  name: string;
  category: string;
  price: number;
  topSpeed: number; // km/h (e.g. 210 - 290)
  acceleration: number; // 0-100 score
  handling: number; // 0-100 score
  nitroCapacity: number; // seconds of nitro
  description: string;
  unlockedByDefault?: boolean;
}

export interface CarUpgradeLevels {
  speed: number; // 0 to 5
  accel: number; // 0 to 5
  handling: number; // 0 to 5
  nitro: number; // 0 to 5
}

export interface PlayerCarSave {
  unlockedCars: string[];
  selectedCarId: string;
  colors: Record<string, string>; // carId -> hex color
  upgrades: Record<string, CarUpgradeLevels>;
  coins: number;
  highScore: number;
  bestDistance: number;
  racesCount: number;
}

export type GameScreen = 'menu' | 'garage' | 'countdown' | 'playing' | 'paused' | 'gameover';

export type CameraViewMode = 'chase' | 'hood' | 'far';

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  graphicsQuality: 'high' | 'medium' | 'low';
  controlMode: 'buttons' | 'tilt';
}

export interface ControlInputs {
  steerLeft: boolean;
  steerRight: boolean;
  accelerate: boolean;
  brake: boolean;
  nitro: boolean;
}

export interface TrafficCar {
  id: number;
  type: 'sedan' | 'suv' | 'truck' | 'sport';
  mesh: THREE.Group;
  lane: number;
  targetLane: number;
  x: number;
  z: number;
  speed: number; // m/s
  length: number;
  width: number;
  laneChangeTimer: number;
  color: string;
}

export interface CollectibleItem {
  id: number;
  type: 'coin' | 'nitro' | 'magnet';
  mesh: THREE.Group;
  x: number;
  z: number;
  collected: boolean;
}

export interface RaceSummary {
  distance: number;
  score: number;
  coinsEarned: number;
  nearMisses: number;
  maxSpeed: number;
  isNewHighScore: boolean;
}
