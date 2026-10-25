import * as THREE from 'three';

export type EnvironmentTheme = 'cyber_night' | 'sunset' | 'daylight';

export interface HighwayChunk {
  group: THREE.Group;
  z: number;
}

export class HighwayEnvironment {
  public scene: THREE.Scene;
  public roadGroup: THREE.Group;
  public chunks: HighwayChunk[] = [];
  public chunkLength = 100;
  public chunkCount = 6;
  public roadWidth = 16.5;
  public currentTheme: EnvironmentTheme = 'cyber_night';

  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private fog!: THREE.FogExp2;

  // Road materials & textures
  private roadMaterial!: THREE.MeshStandardMaterial;
  private barrierMaterial!: THREE.MeshStandardMaterial;
  private grassMaterial!: THREE.MeshStandardMaterial;
  private buildingMaterials: THREE.MeshStandardMaterial[] = [];
  private treeTrunkMat!: THREE.MeshStandardMaterial;
  private treeFoliageMat!: THREE.MeshStandardMaterial;
  private streetLampGlowMat!: THREE.MeshBasicMaterial;
  private reflectorMat!: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, theme: EnvironmentTheme = 'cyber_night') {
    this.scene = scene;
    this.currentTheme = theme;
    this.roadGroup = new THREE.Group();
    this.scene.add(this.roadGroup);

    this.initMaterials();
    this.initLighting();
    this.initChunks();
  }

  /**
   * Generates a bright, high-contrast highway texture with clearly visible
   * lane markings, glowing cat's eyes/reflectors, and crisp rumble strips.
   */
  private createRoadTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Brighter, cleaner modern asphalt base (not pitch black!)
    ctx.fillStyle = '#2c3340';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle realistic asphalt grain
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const val = Math.floor(45 + Math.random() * 20);
      ctx.fillStyle = `rgb(${val}, ${val + 5}, ${val + 10})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // 2. High-contrast outer road edges (solid fluorescent yellow lines)
    ctx.fillStyle = '#facc15';
    ctx.fillRect(38, 0, 16, 1024);
    ctx.fillRect(1024 - 54, 0, 16, 1024);

    // 3. Crisp shoulder rumble strips (alternating vibrant red & pure white)
    for (let y = 0; y < 1024; y += 64) {
      ctx.fillStyle = (y / 64) % 2 === 0 ? '#ef4444' : '#ffffff';
      ctx.fillRect(8, y, 24, 52);
      ctx.fillRect(1024 - 32, y, 24, 52);
    }

    // 4. 3 Dashed white lane dividers (crisp & bright for maximum visibility)
    ctx.fillStyle = '#ffffff';
    const laneDivs = [282, 512, 742];
    for (let y = 16; y < 1024; y += 128) {
      laneDivs.forEach((lx) => {
        // Bright dashed white stripe
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx - 7, y, 14, 76);

        // Reflective amber cat's eye marker at each stripe end
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(lx, y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  private initMaterials() {
    const roadTex = this.createRoadTexture();
    this.roadMaterial = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.5,
      metalness: 0.15,
    });

    this.barrierMaterial = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      roughness: 0.3,
      metalness: 0.7,
    });

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.05,
    });

    // Vibrant modern building materials with rich glowing tones
    const buildingColors = [0x1e293b, 0x0f172a, 0x1e1b4b, 0x172554, 0x1e3a5f];
    this.buildingMaterials = buildingColors.map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          roughness: 0.35,
          metalness: 0.6,
        })
    );

    this.treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5c2e0b, roughness: 0.9 });
    this.treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.7 });

    this.streetLampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff3a1 });
    this.reflectorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  }

  private initLighting() {
    // 1. Ambient Light for balanced overall visibility
    this.ambientLight = new THREE.AmbientLight(0x64748b, 0.8);
    this.scene.add(this.ambientLight);

    // 2. Hemisphere Light: Sky/ground contrast
    this.hemiLight = new THREE.HemisphereLight(0xa5b4fc, 0x1e293b, 1.1);
    this.scene.add(this.hemiLight);

    // 3. Directional Key Light: sharp, bright vehicle & road speculars
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    this.dirLight.position.set(25, 45, 25);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 180;
    this.dirLight.shadow.camera.left = -30;
    this.dirLight.shadow.camera.right = 30;
    this.dirLight.shadow.camera.top = 30;
    this.dirLight.shadow.camera.bottom = -30;
    this.dirLight.shadow.bias = -0.0004;
    this.scene.add(this.dirLight);

    // 4. Fog: Set to a lighter, more open density (0.0038) so distant highway is clearly visible!
    this.fog = new THREE.FogExp2(0x0f172a, 0.0038);
    this.scene.fog = this.fog;
    this.scene.background = new THREE.Color(0x0f172a);

    this.applyTheme(this.currentTheme);
  }

  public applyTheme(theme: EnvironmentTheme) {
    this.currentTheme = theme;
    if (theme === 'cyber_night') {
      // Balanced, attractive night sky (deep luminous twilight with clear visibility)
      this.scene.background = new THREE.Color(0x0a1128);
      this.fog.color.set(0x0a1128);
      this.fog.density = 0.0038;
      this.ambientLight.color.set(0x384c70);
      this.ambientLight.intensity = 0.85;
      this.hemiLight.color.set(0x93c5fd);
      this.hemiLight.groundColor.set(0x1e293b);
      this.hemiLight.intensity = 1.1;
      this.dirLight.color.set(0x67e8f9);
      this.dirLight.intensity = 1.35;
    } else if (theme === 'sunset') {
      // Warm, vibrant dusk
      this.scene.background = new THREE.Color(0x3b1239);
      this.fog.color.set(0x3b1239);
      this.fog.density = 0.0035;
      this.ambientLight.color.set(0x63324f);
      this.ambientLight.intensity = 0.9;
      this.hemiLight.color.set(0xfdba74);
      this.hemiLight.groundColor.set(0x4a044e);
      this.hemiLight.intensity = 1.2;
      this.dirLight.color.set(0xfb923c);
      this.dirLight.intensity = 1.5;
    } else {
      // Crisp sunny daylight
      this.scene.background = new THREE.Color(0x38bdf8);
      this.fog.color.set(0xbae6fd);
      this.fog.density = 0.0028;
      this.ambientLight.color.set(0x94a3b8);
      this.ambientLight.intensity = 0.95;
      this.hemiLight.color.set(0xffffff);
      this.hemiLight.groundColor.set(0x475569);
      this.hemiLight.intensity = 1.3;
      this.dirLight.color.set(0xfffbeb);
      this.dirLight.intensity = 1.6;
    }
  }

  private createTree(x: number, z: number): THREE.Group {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);

    // Palm / street tree with visible canopy
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 4.8, 6), this.treeTrunkMat);
    trunk.position.y = 2.4;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.5, 7), this.treeFoliageMat);
    foliage.position.y = 5.2;
    foliage.castShadow = true;
    tree.add(foliage);

    return tree;
  }

  private createSkyscraper(x: number, z: number, height: number, width: number, depth: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const mat = this.buildingMaterials[Math.floor(Math.random() * this.buildingMaterials.length)];
    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
    building.position.y = height / 2;
    group.add(building);

    // Vibrant window panels (warm gold and cyan neon)
    const winColors = [0xfef08a, 0x38bdf8, 0xa7f3d0, 0xf472b6];
    const winMat = new THREE.MeshBasicMaterial({
      color: winColors[Math.floor(Math.random() * winColors.length)],
    });

    const windowStripCount = Math.floor(height / 8);
    for (let i = 1; i <= windowStripCount; i++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(width * 0.85, 0.45, depth + 0.15), winMat);
      win.position.y = i * 7.5;
      group.add(win);
    }

    // Decorative illuminated neon roof border
    const roofBorderMat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x06b6d4 : 0xf59e0b,
    });
    const roofBorder = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.4, depth + 0.3), roofBorderMat);
    roofBorder.position.y = height + 0.2;
    group.add(roofBorder);

    // Roof antenna with glowing beacon
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 6, 4),
      new THREE.MeshBasicMaterial({ color: 0xff0055 })
    );
    antenna.position.set(0, height + 3, 0);
    group.add(antenna);

    return group;
  }

  private createStreetLamp(x: number, z: number, flip: boolean): THREE.Group {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0, z);

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8.2, 8), poleMat);
    pole.position.y = 4.1;
    lamp.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.14), poleMat);
    arm.position.set(flip ? -1.0 : 1.0, 8.1, 0);
    lamp.add(arm);

    // Glowing Lamp Head with downward cone of light
    const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.35), this.streetLampGlowMat);
    lampHead.position.set(flip ? -2.0 : 2.0, 8.0, 0);
    lamp.add(lampHead);

    // Streetlight road illumination puddle
    const poolGeo = new THREE.PlaneGeometry(3.8, 5.5);
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(flip ? -2.0 : 2.0, 0.03, 0);
    lamp.add(pool);

    return lamp;
  }

  private createGantrySign(z: number): THREE.Group {
    const gantry = new THREE.Group();
    gantry.position.set(0, 0, z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

    // Left and Right Tower Legs
    const legGeo = new THREE.CylinderGeometry(0.25, 0.3, 9.5, 8);
    const legL = new THREE.Mesh(legGeo, metalMat);
    legL.position.set(-this.roadWidth / 2 - 1.4, 4.75, 0);
    const legR = new THREE.Mesh(legGeo, metalMat);
    legR.position.set(this.roadWidth / 2 + 1.4, 4.75, 0);
    gantry.add(legL, legR);

    // Horizontal Truss
    const truss = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 3.6, 0.9, 0.9), metalMat);
    truss.position.set(0, 8.8, 0);
    gantry.add(truss);

    // Bright illuminated digital Highway Sign Panel
    const signMat = new THREE.MeshBasicMaterial({ color: 0x0284c7 });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.4, 0.2), signMat);
    signBoard.position.set(0, 7.5, 0);
    gantry.add(signBoard);

    // Glowing Neon Border
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const borderTop = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.12, 0.25), borderMat);
    borderTop.position.set(0, 8.75, 0);
    const borderBottom = new THREE.Mesh(new THREE.BoxGeometry(8.7, 0.12, 0.25), borderMat);
    borderBottom.position.set(0, 6.25, 0);
    gantry.add(borderTop, borderBottom);

    return gantry;
  }

  private createChunk(z: number, hasGantry: boolean): THREE.Group {
    const chunk = new THREE.Group();
    chunk.position.z = z;

    // 1. Road Surface
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.chunkLength);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, this.roadMaterial);
    road.position.set(0, 0, this.chunkLength / 2);
    road.receiveShadow = true;
    chunk.add(road);

    // 2. Roadside Grass / Dirt banks on left and right
    const grassGeo = new THREE.PlaneGeometry(60, this.chunkLength);
    grassGeo.rotateX(-Math.PI / 2);
    const grassLeft = new THREE.Mesh(grassGeo, this.grassMaterial);
    grassLeft.position.set(-this.roadWidth / 2 - 30, -0.02, this.chunkLength / 2);
    grassLeft.receiveShadow = true;
    const grassRight = new THREE.Mesh(grassGeo, this.grassMaterial);
    grassRight.position.set(this.roadWidth / 2 + 30, -0.02, this.chunkLength / 2);
    grassRight.receiveShadow = true;
    chunk.add(grassLeft, grassRight);

    // 3. Highway Guardrails (Left and Right) with reflective cat's eyes
    const railGeo = new THREE.BoxGeometry(0.24, 0.7, this.chunkLength);
    const railL = new THREE.Mesh(railGeo, this.barrierMaterial);
    railL.position.set(-this.roadWidth / 2 - 0.2, 0.38, this.chunkLength / 2);
    const railR = new THREE.Mesh(railGeo, this.barrierMaterial);
    railR.position.set(this.roadWidth / 2 + 0.2, 0.38, this.chunkLength / 2);
    chunk.add(railL, railR);

    // Reflectors on barriers every 10 meters
    for (let step = 5; step < this.chunkLength; step += 10) {
      const refL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.4), this.reflectorMat);
      refL.position.set(-this.roadWidth / 2 - 0.05, 0.5, step);
      const refR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.4), this.reflectorMat);
      refR.position.set(this.roadWidth / 2 + 0.05, 0.5, step);
      chunk.add(refL, refR);
    }

    // 4. Street Lamps along the highway (every 30m for vibrant lighting)
    for (let step = 10; step < this.chunkLength; step += 32) {
      chunk.add(this.createStreetLamp(-this.roadWidth / 2 - 1.2, step, false));
      chunk.add(this.createStreetLamp(this.roadWidth / 2 + 1.2, step + 16, true));
    }

    // 5. Roadside Trees / Palms
    for (let step = 8; step < this.chunkLength; step += 24) {
      chunk.add(this.createTree(-this.roadWidth / 2 - 4.0, step));
      chunk.add(this.createTree(this.roadWidth / 2 + 4.0, step + 12));
    }

    // 6. City Skyline Skyscraper Clusters
    for (let step = 6; step < this.chunkLength; step += 28) {
      const h1 = 35 + Math.random() * 55;
      const h2 = 40 + Math.random() * 60;
      chunk.add(this.createSkyscraper(-this.roadWidth / 2 - 22 - Math.random() * 12, step, h1, 15, 15));
      chunk.add(this.createSkyscraper(this.roadWidth / 2 + 22 + Math.random() * 12, step + 14, h2, 15, 15));
    }

    // 7. Optional Overhead Gantry
    if (hasGantry) {
      chunk.add(this.createGantrySign(this.chunkLength / 2));
    }

    return chunk;
  }

  private initChunks() {
    for (let i = 0; i < this.chunkCount; i++) {
      const z = -this.chunkLength * 2 + i * this.chunkLength;
      const hasGantry = i % 2 === 1;
      const group = this.createChunk(z, hasGantry);
      this.roadGroup.add(group);
      this.chunks.push({ group, z });
    }
  }

  public update(playerZ: number) {
    // Keep directional light following player so shadows are sharp
    this.dirLight.position.z = playerZ + 25;
    this.dirLight.target.position.z = playerZ;
    this.dirLight.target.updateMatrixWorld();

    // Recycle chunks when behind player
    const recycleThreshold = playerZ - this.chunkLength * 1.5;

    for (const chunk of this.chunks) {
      if (chunk.z + this.chunkLength < recycleThreshold) {
        let maxZ = -Infinity;
        for (const c of this.chunks) {
          if (c.z > maxZ) maxZ = c.z;
        }
        chunk.z = maxZ + this.chunkLength;
        chunk.group.position.z = chunk.z;
      }
    }
  }

  public reset(startZ: number = 0) {
    this.chunks.forEach((chunk, i) => {
      chunk.z = startZ - this.chunkLength * 2 + i * this.chunkLength;
      chunk.group.position.z = chunk.z;
    });
  }
}
