import * as THREE from 'three';
import { TrafficCar } from '../types/game';
import { createTrafficVehicle } from './carModels';

// High-contrast, high-visibility automotive colors
const TRAFFIC_COLORS = [
  '#f59e0b', // Vibrant Amber / Taxi
  '#0284c7', // Sky / Cobalt Blue
  '#10b981', // Crisp Emerald
  '#ef4444', // Crimson Red
  '#8b5cf6', // Violet Metallic
  '#f8fafc', // Blizzard Pearl White
  '#f97316', // Sunset Orange
  '#ec4899', // Hot Magenta
];

export class TrafficManager {
  private scene: THREE.Scene;
  public traffic: TrafficCar[] = [];
  public lanes = [-6, -2, 2, 6];
  private nextTrafficId = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnCar(laneIndex: number, z: number, playerSpeedKmH: number): TrafficCar {
    const lane = this.lanes[laneIndex];
    const types: ('sedan' | 'suv' | 'truck' | 'sport')[] = ['sedan', 'suv', 'truck', 'sport', 'sedan'];
    const type = types[Math.floor(Math.random() * types.length)];
    const color = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];

    const mesh = createTrafficVehicle(type, color);
    mesh.position.set(lane, 0, z);
    this.scene.add(mesh);

    // Speed in m/s (1 m/s = 3.6 km/h)
    let speedKmH = 75;
    if (type === 'truck') speedKmH = 50 + Math.random() * 15;
    else if (type === 'sport') speedKmH = 95 + Math.random() * 20;
    else speedKmH = 70 + Math.random() * 20;

    // Dimensions for AABB collision
    let length = 4.2;
    let width = 2.0;
    if (type === 'truck') {
      length = 8.5;
      width = 2.4;
    } else if (type === 'suv') {
      length = 4.4;
      width = 2.1;
    }

    const trafficCar: TrafficCar = {
      id: this.nextTrafficId++,
      type,
      mesh,
      lane: laneIndex,
      targetLane: laneIndex,
      x: lane,
      z,
      speed: speedKmH / 3.6,
      length,
      width,
      laneChangeTimer: 6 + Math.random() * 8,
      color,
    };

    this.traffic.push(trafficCar);
    return trafficCar;
  }

  public spawnInitialTraffic(startZ: number) {
    let currentZ = startZ + 45;
    for (let i = 0; i < 7; i++) {
      currentZ += 28 + Math.random() * 32;
      const laneIdx = Math.floor(Math.random() * this.lanes.length);
      this.spawnCar(laneIdx, currentZ, 100);
    }
  }

  public update(playerZ: number, playerSpeed: number, delta: number, distanceTraveled: number) {
    // Gradual difficulty scaling
    const difficultyFactor = Math.min(1.8, 1.0 + distanceTraveled / 2500);
    const targetTrafficCount = Math.floor(6 * difficultyFactor);

    // Update traffic cars
    for (const car of this.traffic) {
      // Forward motion
      car.z += car.speed * delta;
      car.mesh.position.z = car.z;

      // Lane change decision
      car.laneChangeTimer -= delta;
      if (car.laneChangeTimer <= 0 && car.lane === car.targetLane) {
        car.laneChangeTimer = 8 + Math.random() * 10;
        if (Math.random() < 0.35) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          const newLane = car.lane + dir;
          if (newLane >= 0 && newLane < this.lanes.length) {
            car.targetLane = newLane;
          }
        }
      }

      // Smooth lane transition with gentle steering tilt
      if (car.lane !== car.targetLane) {
        const targetX = this.lanes[car.targetLane];
        car.x += (targetX - car.x) * delta * 2.8;
        car.mesh.position.x = car.x;
        car.mesh.rotation.y = (targetX - car.x) * 0.08;

        if (Math.abs(car.x - targetX) < 0.08) {
          car.x = targetX;
          car.lane = car.targetLane;
          car.mesh.rotation.y = 0;
        }
      }
    }

    // Clean up traffic that fell behind
    const despawnZ = playerZ - 35;
    this.traffic = this.traffic.filter((car) => {
      if (car.z < despawnZ) {
        this.scene.remove(car.mesh);
        return false;
      }
      return true;
    });

    // Spawn new traffic ahead
    let maxZ = playerZ + 40;
    for (const car of this.traffic) {
      if (car.z > maxZ) maxZ = car.z;
    }

    if (this.traffic.length < targetTrafficCount && maxZ < playerZ + 250) {
      const laneIdx = Math.floor(Math.random() * this.lanes.length);
      const spawnDist = 42 + Math.random() * 38;
      this.spawnCar(laneIdx, maxZ + spawnDist, playerSpeed);
    }
  }

  public checkCollisions(playerX: number, playerZ: number, playerWidth: number = 1.9, playerLength: number = 4.2) {
    let crashedCar: TrafficCar | null = null;
    let nearMiss = false;

    const pHalfW = playerWidth * 0.44;
    const pHalfL = playerLength * 0.44;

    for (const car of this.traffic) {
      const cHalfW = car.width * 0.44;
      const cHalfL = car.length * 0.44;

      const dx = Math.abs(playerX - car.x);
      const dz = Math.abs(playerZ - car.z);

      // Direct collision
      if (dx < pHalfW + cHalfW && dz < pHalfL + cHalfL) {
        crashedCar = car;
        break;
      }

      // Near miss check: within close lateral distance while overtaking
      if (!crashedCar && dx < pHalfW + cHalfW + 0.95 && dz < pHalfL + cHalfL + 1.25) {
        nearMiss = true;
      }
    }

    return { crashedCar, nearMiss };
  }

  public reset() {
    for (const car of this.traffic) {
      this.scene.remove(car.mesh);
    }
    this.traffic = [];
  }
}
