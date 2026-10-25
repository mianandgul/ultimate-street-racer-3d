import * as THREE from 'three';
import { CameraViewMode, CarStats, CarUpgradeLevels, ControlInputs, GameSettings, RaceSummary } from '../types/game';
import { sound } from './audio';
import { createApexGT, createCyberTurbo, createPhantomHypercar, createViperX, CarRig } from './carModels';
import { EnvironmentTheme, HighwayEnvironment } from './environment';
import { GameStorage } from './gameState';
import { ItemManager } from './items';
import { TrafficManager } from './traffic';

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: {
    speedKmH: number;
    nitroPercent: number;
    score: number;
    coins: number;
    distance: number;
    comboText: string | null;
  }) => void;
  onGameOver: (summary: RaceSummary) => void;
}

// Pre-allocated reusable vectors for zero GC allocation in render loop
const _targetPos = new THREE.Vector3();
const _lookAtPos = new THREE.Vector3();

export class RacingEngine {
  public container: HTMLElement;
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;

  // Environment & Managers
  public environment!: HighwayEnvironment;
  public trafficManager!: TrafficManager;
  public itemManager!: ItemManager;

  // Car rigs
  public currentRig: CarRig | null = null;
  public selectedCarId = 'apex_gt';
  public selectedColor = '#ef4444';
  public activeStats!: ReturnType<typeof GameStorage.calculateEffectiveStats>;

  // Controls state
  public inputs: ControlInputs = {
    steerLeft: false,
    steerRight: false,
    accelerate: false,
    brake: false,
    nitro: false,
  };

  // Car Physics State
  public playerX = 0;
  public playerZ = 0;
  public forwardSpeed = 0; // m/s
  public lateralSpeed = 0; // m/s
  public carRoll = 0;
  public carPitch = 0;
  public wheelAngle = 0;

  // Nitro State
  public currentNitro = 4.0;
  public maxNitro = 4.0;
  public isNitroActive = false;

  // Race Statistics
  public score = 0;
  public coinsEarned = 0;
  public distanceTraveled = 0;
  public nearMisses = 0;
  public maxSpeedAchieved = 0;
  public nearMissCooldown = 0;
  public comboTimer = 0;
  public comboMessage: string | null = null;

  // Game Engine State
  public isPlaying = false;
  public isPaused = false;
  public isGameOver = false;
  public isGarageMode = false;
  public timeScale = 1.0;

  // Camera settings (Optimized for clear vision of the car & road ahead)
  public cameraMode: CameraViewMode = 'chase';
  public baseFov = 62;
  private cameraTarget = new THREE.Vector3();
  private garageOrbitAngle = 0;

  // Nitro flames
  private flameMeshes: THREE.Mesh[] = [];

  // Particles
  private sparkGroup!: THREE.Group;
  private sparks: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

  // Loop & timing
  private clock = new THREE.Clock();
  private animationFrameId = 0;
  private callbacks: GameEngineCallbacks;
  private settings: GameSettings;
  private isSoftwareGl = false;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks, initialSettings: GameSettings) {
    this.container = container;
    this.callbacks = callbacks;
    this.settings = initialSettings;

    this.detectSoftwareGl();
    this.initThree();
    this.initParticles();
    this.initSystems();
    this.startLoop();
  }

  private detectSoftwareGl() {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) {
        this.isSoftwareGl = true;
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      this.isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      this.isSoftwareGl = false;
    }
  }

  private initThree() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(this.baseFov, width / height, 0.2, 500);
    this.camera.position.set(0, 3.6, -7.5);

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !this.isSoftwareGl && this.settings.graphicsQuality !== 'low',
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    const pixelRatio = this.isSoftwareGl || this.settings.graphicsQuality === 'low'
      ? 1
      : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);

    this.renderer.shadowMap.enabled = !this.isSoftwareGl && this.settings.graphicsQuality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onWindowResize);
  }

  private initSystems() {
    this.environment = new HighwayEnvironment(this.scene, 'cyber_night');
    this.trafficManager = new TrafficManager(this.scene);
    this.itemManager = new ItemManager(this.scene);
  }

  private initParticles() {
    this.sparkGroup = new THREE.Group();
    this.scene.add(this.sparkGroup);
  }

  public setCar(carId: string, colorHex: string, baseStats: CarStats, upgrades?: CarUpgradeLevels) {
    this.selectedCarId = carId;
    this.selectedColor = colorHex;
    this.activeStats = GameStorage.calculateEffectiveStats(carId, baseStats, upgrades);
    this.maxNitro = this.activeStats.nitroCapacity;
    this.currentNitro = this.maxNitro;

    // Remove previous rig
    if (this.currentRig) {
      this.scene.remove(this.currentRig.group);
      this.removeFlameMeshes();
    }

    // Build new procedural car
    let rig: CarRig;
    switch (carId) {
      case 'viper_x':
        rig = createViperX(colorHex);
        break;
      case 'phantom_gt':
        rig = createPhantomHypercar(colorHex);
        break;
      case 'cyber_turbo':
        rig = createCyberTurbo(colorHex);
        break;
      case 'apex_gt':
      default:
        rig = createApexGT(colorHex);
        break;
    }

    this.currentRig = rig;
    this.scene.add(rig.group);
    this.createFlameMeshes(rig);
  }

  public setPaintColor(hex: string) {
    this.selectedColor = hex;
    if (this.currentRig) {
      this.currentRig.setBodyColor(hex);
    }
  }

  private createFlameMeshes(rig: CarRig) {
    this.removeFlameMeshes();
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });

    for (const pos of rig.exhaustPositions) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.85, 8), flameMat);
      cone.rotation.x = -Math.PI / 2;
      cone.position.copy(pos);
      cone.visible = false;
      rig.group.add(cone);
      this.flameMeshes.push(cone);
    }
  }

  private removeFlameMeshes() {
    for (const flame of this.flameMeshes) {
      flame.parent?.remove(flame);
    }
    this.flameMeshes = [];
  }

  public setEnvironmentTheme(theme: EnvironmentTheme) {
    this.environment.applyTheme(theme);
  }

  public setCameraMode(mode: CameraViewMode) {
    this.cameraMode = mode;
  }

  public setSettings(newSettings: GameSettings) {
    this.settings = newSettings;
    sound.updateSettings(
      newSettings.soundEnabled,
      newSettings.musicEnabled,
      newSettings.sfxVolume,
      newSettings.musicVolume
    );

    const pixelRatio = this.isSoftwareGl || newSettings.graphicsQuality === 'low'
      ? 1
      : Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && newSettings.graphicsQuality === 'high';
  }

  public startRace() {
    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.isGarageMode = false;
    this.timeScale = 1.0;

    // Reset physics & stats
    this.playerX = 0;
    this.playerZ = 0;
    this.forwardSpeed = 26; // Smooth rolling start ~94 km/h, accelerating to cruising speed
    this.lateralSpeed = 0;
    this.currentNitro = this.maxNitro;
    this.score = 0;
    this.coinsEarned = 0;
    this.distanceTraveled = 0;
    this.nearMisses = 0;
    this.maxSpeedAchieved = 0;
    this.nearMissCooldown = 0;
    this.comboTimer = 0;
    this.comboMessage = null;

    if (this.currentRig) {
      this.currentRig.group.position.set(0, 0, 0);
      this.currentRig.group.rotation.set(0, 0, 0);
      this.currentRig.setBraking(false);
    }

    // Reset environment & entities
    this.environment.reset(0);
    this.trafficManager.reset();
    this.trafficManager.spawnInitialTraffic(0);
    this.itemManager.reset();
    this.itemManager.spawnCollectiblesAhead(0, 5);

    // Audio
    sound.startEngine();
    sound.startMusic();
  }

  public enterGarageMode() {
    this.isGarageMode = true;
    this.isPlaying = false;
    this.isPaused = false;
    this.isGameOver = false;

    sound.stopEngine();
    sound.stopNitro();

    if (this.currentRig) {
      this.currentRig.group.position.set(0, 0, 0);
      this.currentRig.group.rotation.set(0, 0, 0);
      this.currentRig.setBraking(false);
    }
  }

  public pauseRace() {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = true;
    sound.stopEngine();
    sound.stopNitro();
  }

  public resumeRace() {
    if (!this.isPlaying || this.isGameOver) return;
    this.isPaused = false;
    sound.startEngine();
    sound.startMusic();
  }

  public triggerCrash() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isPlaying = false;

    sound.playCrash();
    sound.stopEngine();
    sound.stopNitro();

    // Dramatic crash sparks
    this.spawnSparks(this.playerX, 0.6, this.playerZ, 35);

    // Slow-down & spinout effect
    this.timeScale = 0.2;

    const currentSave = GameStorage.loadSave();
    const finalScore = Math.floor(this.score);
    const finalDistance = Math.floor(this.distanceTraveled);
    const isNewHighScore = finalScore > currentSave.highScore;

    const updatedCoins = currentSave.coins + this.coinsEarned;
    const updatedHighScore = Math.max(currentSave.highScore, finalScore);
    const updatedBestDistance = Math.max(currentSave.bestDistance, finalDistance);

    GameStorage.save({
      ...currentSave,
      coins: updatedCoins,
      highScore: updatedHighScore,
      bestDistance: updatedBestDistance,
      racesCount: currentSave.racesCount + 1,
    });

    const summary: RaceSummary = {
      distance: finalDistance,
      score: finalScore,
      coinsEarned: this.coinsEarned,
      nearMisses: this.nearMisses,
      maxSpeed: Math.floor(this.maxSpeedAchieved),
      isNewHighScore,
    };

    setTimeout(() => {
      this.callbacks.onGameOver(summary);
    }, 1200);
  }

  private spawnSparks(x: number, y: number, z: number, count: number = 20) {
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let i = 0; i < count; i++) {
      const spark = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), sparkMat);
      spark.position.set(x, y, z);
      this.sparkGroup.add(spark);

      this.sparks.push({
        mesh: spark,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          Math.random() * 9 + 4,
          (Math.random() - 0.5) * 14
        ),
        life: 0.8 + Math.random() * 0.4,
      });
    }
  }

  private spawnCoinSparkles(x: number, y: number, z: number, count: number = 14) {
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffe600 });
    for (let i = 0; i < count; i++) {
      const sparkle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), sparkleMat);
      sparkle.position.set(x, y, z);
      this.sparkGroup.add(sparkle);

      this.sparks.push({
        mesh: sparkle,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 8,
          Math.random() * 6 + 2.5,
          (Math.random() - 0.5) * 8
        ),
        life: 0.55 + Math.random() * 0.35,
      });
    }
  }

  private updateSparks(delta: number) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= delta;
      sp.vel.y -= 18 * delta;
      sp.mesh.position.addScaledVector(sp.vel, delta);

      if (sp.life <= 0) {
        this.sparkGroup.remove(sp.mesh);
        this.sparks.splice(i, 1);
      }
    }
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private startLoop() {
    const tick = () => {
      this.animationFrameId = requestAnimationFrame(tick);
      const rawDelta = Math.min(this.clock.getDelta(), 0.1);
      const delta = rawDelta * this.timeScale;

      this.update(delta);
      this.render();
    };

    tick();
  }

  private update(delta: number) {
    if (this.isGarageMode) {
      this.updateGarage(delta);
      return;
    }

    if (!this.isPlaying || this.isPaused) {
      if (this.isGameOver && this.currentRig) {
        // Dramatic slow spinout
        this.currentRig.group.rotation.y += delta * 4;
        this.currentRig.group.position.x += this.lateralSpeed * delta * 0.4;
        this.currentRig.group.position.z += this.forwardSpeed * delta * 0.3;
        this.updateSparks(delta);
      }
      return;
    }

    this.updatePlayerPhysics(delta);
    this.updateTrafficAndItems(delta);
    this.updateScoring(delta);
    this.updateCamera(delta);
    this.updateSparks(delta);

    // Sync stats with UI
    const speedKmH = this.forwardSpeed * 3.6;
    if (speedKmH > this.maxSpeedAchieved) {
      this.maxSpeedAchieved = speedKmH;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= delta;
      if (this.comboTimer <= 0) {
        this.comboMessage = null;
      }
    }

    this.callbacks.onStatsUpdate({
      speedKmH: Math.floor(speedKmH),
      nitroPercent: Math.floor((this.currentNitro / this.maxNitro) * 100),
      score: Math.floor(this.score),
      coins: this.coinsEarned,
      distance: Math.floor(this.distanceTraveled),
      comboText: this.comboMessage,
    });
  }

  private updatePlayerPhysics(delta: number) {
    const stats = this.activeStats;
    const baseTopSpeedMs = stats.topSpeed / 3.6;
    const nitroTopSpeedMs = (stats.topSpeed * 1.3) / 3.6;

    // 1. Automatic Forward Cruising Speed (smooth, consistent & increases with distance)
    const baseCruisingSpeed = 38 + (baseTopSpeedMs - 38) * 0.7; // ~145-180 km/h baseline
    const distanceBonus = Math.min(18, this.distanceTraveled / 120); // +1 km/h per 100m, capped
    const targetSpeed = this.isNitroActive ? nitroTopSpeedMs : (baseCruisingSpeed + distanceBonus);

    // Continuous smooth automatic forward acceleration
    this.forwardSpeed = THREE.MathUtils.damp(this.forwardSpeed, targetSpeed, 3.2, delta);

    // Nitro handling
    if (this.isNitroActive) {
      this.currentNitro = Math.max(0, this.currentNitro - delta * 0.85);
      if (this.currentNitro <= 0) {
        this.isNitroActive = false;
        sound.stopNitro();
        this.flameMeshes.forEach((f) => (f.visible = false));
      } else {
        const s = 0.85 + Math.random() * 0.45;
        this.flameMeshes.forEach((f) => f.scale.set(s, s, s));
      }
    } else {
      // Natural slow nitro recharge
      this.currentNitro = Math.min(this.maxNitro, this.currentNitro + delta * 0.18);
    }

    // 2. Responsive Left and Right Steering with Instant Stop on Release
    const handlingFactor = stats.handling / 100;
    const maxLateralSpeed = 11.5 + handlingFactor * 9.5;

    let targetSteer = 0;
    if (this.inputs.steerLeft) targetSteer += 1; // +X is screen LEFT
    if (this.inputs.steerRight) targetSteer -= 1; // -X is screen RIGHT

    if (targetSteer !== 0) {
      const targetLatSpeed = targetSteer * maxLateralSpeed;
      this.lateralSpeed = THREE.MathUtils.damp(this.lateralSpeed, targetLatSpeed, 15, delta);
    } else {
      // Car stops steering immediately when button is released
      this.lateralSpeed = THREE.MathUtils.damp(this.lateralSpeed, 0, 24, delta);
      if (Math.abs(this.lateralSpeed) < 0.15) {
        this.lateralSpeed = 0;
      }
    }

    // Move player continuously forward and laterally
    this.playerX += this.lateralSpeed * delta;
    this.playerZ += this.forwardSpeed * delta;
    this.distanceTraveled = this.playerZ;

    // Road boundaries (-7.15 to 7.15)
    const roadLimit = 7.15;
    if (this.playerX < -roadLimit) {
      this.playerX = -roadLimit;
      this.lateralSpeed = 0;
    } else if (this.playerX > roadLimit) {
      this.playerX = roadLimit;
      this.lateralSpeed = 0;
    }

    // 3. Car Visual Roll, Pitch and Wheel Steering
    if (this.currentRig) {
      this.currentRig.group.position.set(this.playerX, 0, this.playerZ);

      // Roll: Subtle lean into cornering
      const targetRoll = this.lateralSpeed * 0.018;
      this.carRoll = THREE.MathUtils.damp(this.carRoll, targetRoll, 12, delta);

      // Pitch: Subtle squat during nitro
      const targetPitch = this.isNitroActive ? -0.04 : 0;
      this.carPitch = THREE.MathUtils.damp(this.carPitch, targetPitch, 8, delta);

      this.currentRig.group.rotation.set(this.carPitch, this.lateralSpeed * 0.018, this.carRoll);

      // Front wheels steering turn angle
      const targetWheelAngle = (targetSteer * Math.PI) / 8;
      this.wheelAngle = THREE.MathUtils.damp(this.wheelAngle, targetWheelAngle, 16, delta);
      this.currentRig.frontWheelPivots.forEach((pivot) => {
        pivot.rotation.y = this.wheelAngle;
      });

      // Spin all wheels based on forward motion
      const spinSpeed = (this.forwardSpeed / 0.38) * delta;
      this.currentRig.wheels.forEach((wheel) => {
        wheel.rotation.x += spinSpeed;
      });
    }

    // Update sound engine pitch
    const speedRatio = this.forwardSpeed / nitroTopSpeedMs;
    sound.updateEngine(speedRatio, true);
  }

  private updateTrafficAndItems(delta: number) {
    this.environment.update(this.playerZ);
    this.trafficManager.update(this.playerZ, this.forwardSpeed, delta, this.distanceTraveled);
    this.itemManager.update(this.playerZ, this.playerX, delta);

    // Collision check with AI traffic
    const { crashedCar, nearMiss } = this.trafficManager.checkCollisions(this.playerX, this.playerZ);
    if (crashedCar) {
      this.triggerCrash();
      return;
    }

    // Near miss detection
    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown -= delta;
    } else if (nearMiss && this.forwardSpeed > 30) {
      this.nearMisses++;
      this.score += 150;
      this.currentNitro = Math.min(this.maxNitro, this.currentNitro + this.maxNitro * 0.25);
      this.comboMessage = '⚡ NEAR MISS +150!';
      this.comboTimer = 1.6;
      this.nearMissCooldown = 1.0;
      sound.playNearMiss();
    }

    // Collectibles & Obstacles collision check
    const { collectedItem, hitObstacle } = this.itemManager.checkPlayerCollision(this.playerX, this.playerZ);
    if (collectedItem) {
      if (collectedItem.type === 'coin') {
        this.coinsEarned += 1;
        this.score += 50;
        this.comboMessage = '+1 COIN!';
        this.comboTimer = 1.0;
        this.spawnCoinSparkles(collectedItem.x, 1.05, collectedItem.z);
        sound.playCoin();
      } else if (collectedItem.type === 'nitro') {
        this.currentNitro = this.maxNitro;
        this.isNitroActive = true;
        sound.startNitro();
        this.flameMeshes.forEach((f) => (f.visible = true));
        this.comboMessage = '🔥 NITRO BOOST!';
        this.comboTimer = 1.4;
        sound.playCoin();
      }
    }

    if (hitObstacle) {
      // Hitting road hazard cone triggers crash sequence
      this.triggerCrash();
      return;
    }
  }

  private updateScoring(delta: number) {
    // 1 point per meter + speed multiplier
    const speedKmH = this.forwardSpeed * 3.6;
    const speedMultiplier = Math.max(1.0, speedKmH / 120);
    this.score += this.forwardSpeed * delta * speedMultiplier;
  }

  /**
   * Enhanced Camera: Positioned higher with great forward view of the road,
   * upcoming traffic, and coins while keeping the car distinct in the lower screen.
   */
  private updateCamera(delta: number) {
    const speedFraction = Math.min(1.0, this.forwardSpeed / 75);

    if (this.cameraMode === 'chase') {
      // Elevated, forward-clearing chase view
      _targetPos.set(
        this.playerX * 0.65,
        3.5 + speedFraction * 0.35,
        this.playerZ - 7.6 - speedFraction * 1.5
      );
      _lookAtPos.set(this.playerX * 0.75, 1.4, this.playerZ + 28);
    } else if (this.cameraMode === 'hood') {
      // Immersive hood view looking far down the asphalt
      _targetPos.set(this.playerX, 0.95, this.playerZ + 0.8);
      _lookAtPos.set(this.playerX, 0.95, this.playerZ + 32);
    } else {
      // Helicopter / Far view
      _targetPos.set(this.playerX * 0.4, 6.5, this.playerZ - 12.0);
      _lookAtPos.set(this.playerX, 1.0, this.playerZ + 20);
    }

    // Smooth camera interpolation
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, _targetPos.x, 8.5, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, _targetPos.y, 8.0, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, _targetPos.z, 14.0, delta);

    this.cameraTarget.lerp(_lookAtPos, 0.16);
    this.camera.lookAt(this.cameraTarget);

    // FOV Warp during Nitro
    const targetFov = this.isNitroActive ? 74 : this.baseFov;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 6, delta);
    this.camera.updateProjectionMatrix();
  }

  private updateGarage(delta: number) {
    this.garageOrbitAngle += delta * 0.45;
    const radius = 5.8;
    const camX = Math.sin(this.garageOrbitAngle) * radius;
    const camZ = Math.cos(this.garageOrbitAngle) * radius;
    const camY = 2.3;

    this.camera.position.set(camX, camY, camZ);
    this.camera.lookAt(0, 0.65, 0);

    if (this.currentRig) {
      this.currentRig.group.position.set(0, 0, 0);
      this.currentRig.group.rotation.set(0, 0, 0);
      this.currentRig.setBraking(false);
    }
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    sound.stopEngine();
    sound.stopNitro();
    sound.stopMusic();

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
