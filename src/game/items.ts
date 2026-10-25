import * as THREE from 'three';
import { CollectibleItem } from '../types/game';

// Materials with enhanced visibility & bloom-like glow
const coinMaterial = new THREE.MeshStandardMaterial({
  color: 0xfacc15,
  metalness: 0.9,
  roughness: 0.15,
});

const coinStarMaterial = new THREE.MeshBasicMaterial({
  color: 0xfffbeb,
});

const coinHaloMaterial = new THREE.MeshBasicMaterial({
  color: 0xfde047,
  transparent: true,
  opacity: 0.45,
  side: THREE.DoubleSide,
  depthWrite: false,
});

const nitroTankMat = new THREE.MeshStandardMaterial({
  color: 0x0284c7,
  metalness: 0.8,
  roughness: 0.15,
});

const nitroGlowMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
});

const coneMat = new THREE.MeshStandardMaterial({
  color: 0xff5500,
  roughness: 0.35,
});

const coneStripeMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const coneBeaconMat = new THREE.MeshBasicMaterial({
  color: 0xfacc15,
});

export class ItemManager {
  private scene: THREE.Scene;
  public items: CollectibleItem[] = [];
  public obstacles: { id: number; mesh: THREE.Group; x: number; z: number; hit: boolean }[] = [];
  private nextItemId = 1;
  private nextObstacleId = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createCoinMesh(): THREE.Group {
    const group = new THREE.Group();

    // 1. Large Golden coin cylinder
    const coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.16, 20);
    coinGeo.rotateZ(Math.PI / 2);
    const coin = new THREE.Mesh(coinGeo, coinMaterial);
    group.add(coin);

    // 2. High-brightness central star embossing
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.18, 10), coinStarMaterial);
    center.rotateZ(Math.PI / 2);
    group.add(center);

    // 3. Glowing Golden Halo Disc
    const haloGeo = new THREE.RingGeometry(0.7, 1.05, 16);
    haloGeo.rotateY(Math.PI / 2);
    const halo = new THREE.Mesh(haloGeo, coinHaloMaterial);
    group.add(halo);

    // Positioned higher at 1.05m for ideal line of sight over the road
    group.position.y = 1.05;
    return group;
  }

  public createNitroMesh(): THREE.Group {
    const group = new THREE.Group();

    // Pressurized Blue Canister
    const tankGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.1, 14);
    const tank = new THREE.Mesh(tankGeo, nitroTankMat);
    group.add(tank);

    // Top valve cap
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.25, 8), nitroGlowMat);
    cap.position.y = 0.65;
    group.add(cap);

    // Glowing Neon Ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 8, 20), nitroGlowMat);
    ring.rotateX(Math.PI / 2);
    group.add(ring);

    group.position.y = 1.1;
    return group;
  }

  public createTrafficConeMesh(): THREE.Group {
    const group = new THREE.Group();

    // Square base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), coneMat);
    base.position.y = 0.04;
    group.add(base);

    // Fluorescent Orange Cone Body
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.95, 14), coneMat);
    cone.position.y = 0.51;
    cone.castShadow = true;
    group.add(cone);

    // Dual reflective white stripes for maximum contrast
    const stripe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.2, 14), coneStripeMat);
    stripe1.position.y = 0.5;
    const stripe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.14, 14), coneStripeMat);
    stripe2.position.y = 0.75;
    group.add(stripe1, stripe2);

    // Flashing top hazard beacon
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), coneBeaconMat);
    beacon.position.y = 1.04;
    group.add(beacon);

    return group;
  }

  public spawnCollectiblesAhead(startZ: number, count: number = 5) {
    const lanes = [-6, -2, 2, 6];
    let currentZ = startZ + 35;

    for (let i = 0; i < count; i++) {
      currentZ += 28 + Math.random() * 22;
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const isNitro = Math.random() < 0.25;

      const mesh = isNitro ? this.createNitroMesh() : this.createCoinMesh();
      mesh.position.x = lane;
      mesh.position.z = currentZ;
      this.scene.add(mesh);

      this.items.push({
        id: this.nextItemId++,
        type: isNitro ? 'nitro' : 'coin',
        mesh,
        x: lane,
        z: currentZ,
        collected: false,
      });

      // Clear hazard obstacle placement with plenty of dodge room
      if (Math.random() < 0.3) {
        const obsLane = lanes[Math.floor(Math.random() * lanes.length)];
        if (obsLane !== lane) {
          const obsMesh = this.createTrafficConeMesh();
          obsMesh.position.set(obsLane, 0, currentZ + 12);
          this.scene.add(obsMesh);

          this.obstacles.push({
            id: this.nextObstacleId++,
            mesh: obsMesh,
            x: obsLane,
            z: currentZ + 12,
            hit: false,
          });
        }
      }
    }
  }

  public update(playerZ: number, playerX: number, delta: number) {
    // Animate items (smooth rotation & floating bob)
    for (const item of this.items) {
      if (!item.collected) {
        item.mesh.rotation.y += delta * 4.0;
        item.mesh.position.y = 1.05 + Math.sin(Date.now() * 0.006 + item.id) * 0.14;

        // Subtle gentle magnet pull within 3.2m for great arcade feel
        const distZ = item.z - playerZ;
        const distX = item.x - playerX;
        if (distZ > -1.0 && distZ < 4.0 && Math.abs(distX) < 3.2) {
          item.x += (playerX - item.x) * delta * 5.0;
          item.mesh.position.x = item.x;
        }
      }
    }

    // Spawn more if furthest item is within sight
    let maxZ = playerZ;
    for (const it of this.items) {
      if (it.z > maxZ) maxZ = it.z;
    }

    if (maxZ < playerZ + 180) {
      this.spawnCollectiblesAhead(maxZ, 4);
    }

    // Despawn behind player
    const despawnZ = playerZ - 30;
    this.items = this.items.filter((item) => {
      if (item.z < despawnZ || item.collected) {
        this.scene.remove(item.mesh);
        return false;
      }
      return true;
    });

    this.obstacles = this.obstacles.filter((obs) => {
      if (obs.z < despawnZ) {
        this.scene.remove(obs.mesh);
        return false;
      }
      return true;
    });
  }

  public checkPlayerCollision(
    playerX: number,
    playerZ: number,
    playerRadius: number = 1.1
  ): { collectedItem: CollectibleItem | null; hitObstacle: boolean } {
    let collectedItem: CollectibleItem | null = null;
    let hitObstacle = false;

    // Generous, crisp item collection radius
    const itemCollectDistSq = (playerRadius + 1.2) ** 2;

    for (const item of this.items) {
      if (item.collected) continue;
      const dx = item.x - playerX;
      const dz = item.z - playerZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < itemCollectDistSq) {
        item.collected = true;
        this.scene.remove(item.mesh);
        collectedItem = item;
        break;
      }
    }

    // Obstacle collision check
    const obsHitDistSq = (playerRadius + 0.5) ** 2;

    for (const obs of this.obstacles) {
      if (obs.hit) continue;
      const dx = obs.x - playerX;
      const dz = obs.z - playerZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < obsHitDistSq) {
        obs.hit = true;
        obs.mesh.position.y += 2.2;
        obs.mesh.rotation.x += 1.8;
        obs.mesh.rotation.z += 1.8;
        hitObstacle = true;
      }
    }

    return { collectedItem, hitObstacle };
  }

  public reset() {
    for (const item of this.items) {
      this.scene.remove(item.mesh);
    }
    for (const obs of this.obstacles) {
      this.scene.remove(obs.mesh);
    }
    this.items = [];
    this.obstacles = [];
  }
}
