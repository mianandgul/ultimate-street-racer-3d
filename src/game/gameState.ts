import { CarStats, CarUpgradeLevels, GameSettings, PlayerCarSave } from '../types/game';

export const CARS_CATALOG: CarStats[] = [
  {
    id: 'apex_gt',
    name: 'Apex GT',
    category: 'Twin-Turbo Sports Coupe',
    price: 0,
    topSpeed: 215, // km/h
    acceleration: 70,
    handling: 80,
    nitroCapacity: 4.0, // seconds
    description: 'Agile rear-wheel drive street racer with balanced cornering and crisp response.',
    unlockedByDefault: true,
  },
  {
    id: 'viper_x',
    name: 'Viper X',
    category: 'V10 Muscle Supercar',
    price: 600,
    topSpeed: 245,
    acceleration: 78,
    handling: 72,
    nitroCapacity: 4.5,
    description: 'Raw muscle power engineered for high straight-line velocity and menacing presence.',
    unlockedByDefault: false,
  },
  {
    id: 'phantom_gt',
    name: 'Phantom Hypercar',
    category: 'Hybrid Aero Prototype',
    price: 1800,
    topSpeed: 270,
    acceleration: 92,
    handling: 88,
    nitroCapacity: 5.2,
    description: 'Ground-effect active aerodynamics and electric launch motors deliver explosive speed.',
    unlockedByDefault: false,
  },
  {
    id: 'cyber_turbo',
    name: 'Cyber Turbo 2077',
    category: 'Futuristic Jet Prototype',
    price: 3500,
    topSpeed: 300,
    acceleration: 98,
    handling: 94,
    nitroCapacity: 6.0,
    description: 'Next-gen experimental prototype with plasma thrusters and maximum nitro capacity.',
    unlockedByDefault: false,
  },
];

export const COLOR_PALETTE = [
  { name: 'Racing Crimson', hex: '#ef4444' },
  { name: 'Electric Cobalt', hex: '#2563eb' },
  { name: 'Neon Emerald', hex: '#10b981' },
  { name: 'Sunburst Gold', hex: '#f59e0b' },
  { name: 'Cyber Purple', hex: '#8b5cf6' },
  { name: 'Stealth Matte Black', hex: '#1e293b' },
  { name: 'Blizzard Pearl', hex: '#f8fafc' },
  { name: 'Hyper Orange', hex: '#ea580c' },
];

const SAVE_KEY = 'usr3d_save_v1';
const SETTINGS_KEY = 'usr3d_settings_v1';

const DEFAULT_SAVE: PlayerCarSave = {
  unlockedCars: ['apex_gt'],
  selectedCarId: 'apex_gt',
  colors: {
    apex_gt: '#ef4444',
    viper_x: '#2563eb',
    phantom_gt: '#8b5cf6',
    cyber_turbo: '#10b981',
  },
  upgrades: {
    apex_gt: { speed: 0, accel: 0, handling: 0, nitro: 0 },
    viper_x: { speed: 0, accel: 0, handling: 0, nitro: 0 },
    phantom_gt: { speed: 0, accel: 0, handling: 0, nitro: 0 },
    cyber_turbo: { speed: 0, accel: 0, handling: 0, nitro: 0 },
  },
  coins: 100, // Starter bonus for fun first race
  highScore: 0,
  bestDistance: 0,
  racesCount: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  sfxVolume: 0.8,
  musicVolume: 0.45,
  graphicsQuality: 'high',
  controlMode: 'buttons',
};

export class GameStorage {
  public static loadSave(): PlayerCarSave {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_SAVE,
          ...parsed,
          unlockedCars: parsed.unlockedCars || DEFAULT_SAVE.unlockedCars,
          colors: { ...DEFAULT_SAVE.colors, ...parsed.colors },
          upgrades: { ...DEFAULT_SAVE.upgrades, ...parsed.upgrades },
        };
      }
    } catch {}
    return { ...DEFAULT_SAVE };
  }

  public static save(save: PlayerCarSave): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch {}
  }

  public static loadSettings(): GameSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {}
    return { ...DEFAULT_SETTINGS };
  }

  public static saveSettings(settings: GameSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }

  public static getUpgradeCost(currentLevel: number): number {
    return (currentLevel + 1) * 150;
  }

  public static calculateEffectiveStats(carId: string, baseStats: CarStats, upgrades?: CarUpgradeLevels) {
    const up = upgrades || { speed: 0, accel: 0, handling: 0, nitro: 0 };
    return {
      topSpeed: baseStats.topSpeed + up.speed * 8, // +40 km/h at max level
      acceleration: Math.min(100, baseStats.acceleration + up.accel * 5),
      handling: Math.min(100, baseStats.handling + up.handling * 4),
      nitroCapacity: baseStats.nitroCapacity + up.nitro * 0.5,
    };
  }
}
