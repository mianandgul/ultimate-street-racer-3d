import * as THREE from 'three';

export interface CarRig {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  frontWheelPivots: THREE.Group[];
  exhaustPositions: THREE.Vector3[];
  bodyMesh: THREE.Mesh | null;
  brakeLightMesh: THREE.Mesh | null;
  headlightBeams: THREE.Group | null;
  setBodyColor: (colorHex: string) => void;
  setBraking: (isBraking: boolean) => void;
}

// High-detail shared materials
const tireMaterial = new THREE.MeshStandardMaterial({
  color: 0x1f242d,
  roughness: 0.85,
  metalness: 0.1,
});

const rimMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  roughness: 0.15,
  metalness: 0.9,
});

const caliperMaterial = new THREE.MeshStandardMaterial({
  color: 0xef4444,
  roughness: 0.3,
  metalness: 0.5,
});

const glassMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.05,
  metalness: 0.95,
  transparent: true,
  opacity: 0.88,
});

const headlightMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
});

const taillightOffMat = new THREE.MeshBasicMaterial({
  color: 0x991b1b,
});

const taillightOnMat = new THREE.MeshBasicMaterial({
  color: 0xff1e27,
});

const carbonMaterial = new THREE.MeshStandardMaterial({
  color: 0x18181b,
  roughness: 0.45,
  metalness: 0.6,
});

const exhaustMaterial = new THREE.MeshStandardMaterial({
  color: 0x94a3b8,
  roughness: 0.2,
  metalness: 0.95,
});

// Helper: Create a forward road projection headlight beam
function createHeadlightBeams(): THREE.Group {
  const beamGroup = new THREE.Group();

  const beamGeo = new THREE.PlaneGeometry(3.6, 22);
  beamGeo.rotateX(-Math.PI / 2);

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const beamL = new THREE.Mesh(beamGeo, beamMat);
  beamL.position.set(-0.65, 0.06, 12.0);
  const beamR = new THREE.Mesh(beamGeo, beamMat);
  beamR.position.set(0.65, 0.06, 12.0);

  beamGroup.add(beamL, beamR);
  return beamGroup;
}

// Helper: Create a detailed sports wheel with visible brake caliper & spokes
function createDetailedWheel(radius: number, width: number): THREE.Group {
  const wheelGroup = new THREE.Group();

  // Rubber Tire
  const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 18);
  tireGeo.rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, tireMaterial);
  tire.castShadow = true;
  tire.receiveShadow = true;
  wheelGroup.add(tire);

  // Wheel Rim Outer Lip
  const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width * 1.03, 14);
  rimGeo.rotateZ(Math.PI / 2);
  const rim = new THREE.Mesh(rimGeo, rimMaterial);
  wheelGroup.add(rim);

  // Brake Disc & Caliper
  const discGeo = new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width * 0.5, 12);
  discGeo.rotateZ(Math.PI / 2);
  const disc = new THREE.Mesh(discGeo, carbonMaterial);
  wheelGroup.add(disc);

  const caliperGeo = new THREE.BoxGeometry(width * 0.8, radius * 0.28, radius * 0.24);
  const caliper = new THREE.Mesh(caliperGeo, caliperMaterial);
  caliper.position.set(0, radius * 0.35, 0);
  wheelGroup.add(caliper);

  // Center hub
  const hubGeo = new THREE.CylinderGeometry(radius * 0.26, radius * 0.26, width * 1.08, 8);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, rimMaterial);
  wheelGroup.add(hub);

  return wheelGroup;
}

/**
 * Creates Player Car 1: Apex GT (Sleek sports coupe)
 */
export function createApexGT(colorHex: string = '#ef4444'): CarRig {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const frontWheelPivots: THREE.Group[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.15,
    metalness: 0.82,
  });

  // 1. Lower Chassis & Aerodynamic Body
  const chassisGeo = new THREE.BoxGeometry(1.9, 0.44, 4.3);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.y = 0.38;
  chassis.castShadow = true;
  root.add(chassis);

  // 2. Aerodynamic Cockpit Canopy
  const cabinGeo = new THREE.BoxGeometry(1.52, 0.48, 2.2);
  const cabin = new THREE.Mesh(cabinGeo, glassMaterial);
  cabin.position.set(0, 0.78, -0.2);
  cabin.castShadow = true;
  root.add(cabin);

  // 3. Sleek Roof panel
  const roofGeo = new THREE.BoxGeometry(1.42, 0.06, 1.5);
  const roof = new THREE.Mesh(roofGeo, bodyMat);
  roof.position.set(0, 1.04, -0.2);
  root.add(roof);

  // 4. Side Mirrors (Left & Right)
  const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.16);
  const mirrorL = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorL.position.set(-1.02, 0.72, 0.4);
  const mirrorR = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorR.position.set(1.02, 0.72, 0.4);
  root.add(mirrorL, mirrorR);

  // 5. Front Carbon Splitter
  const splitterGeo = new THREE.BoxGeometry(1.94, 0.08, 0.55);
  const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitter.position.set(0, 0.2, 2.1);
  root.add(splitter);

  // 6. Hood vents
  const ventGeo = new THREE.BoxGeometry(0.3, 0.04, 0.6);
  const ventL = new THREE.Mesh(ventGeo, carbonMaterial);
  ventL.position.set(-0.4, 0.62, 1.1);
  const ventR = new THREE.Mesh(ventGeo, carbonMaterial);
  ventR.position.set(0.4, 0.62, 1.1);
  root.add(ventL, ventR);

  // 7. Rear Wing / Spoiler
  const wingPostGeo = new THREE.BoxGeometry(0.08, 0.38, 0.12);
  const postLeft = new THREE.Mesh(wingPostGeo, carbonMaterial);
  postLeft.position.set(-0.68, 0.78, -1.95);
  const postRight = new THREE.Mesh(wingPostGeo, carbonMaterial);
  postRight.position.set(0.68, 0.78, -1.95);
  root.add(postLeft, postRight);

  const wingBladeGeo = new THREE.BoxGeometry(1.85, 0.06, 0.45);
  const wingBlade = new THREE.Mesh(wingBladeGeo, bodyMat);
  wingBlade.position.set(0, 0.98, -2.0);
  root.add(wingBlade);

  // 8. Bright Headlights (Projector LEDs)
  const hlGeo = new THREE.BoxGeometry(0.38, 0.14, 0.1);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMaterial);
  hlLeft.position.set(-0.68, 0.46, 2.16);
  const hlRight = new THREE.Mesh(hlGeo, headlightMaterial);
  hlRight.position.set(0.68, 0.46, 2.16);
  root.add(hlLeft, hlRight);

  // 9. Continuous Red LED Taillight Bar
  const tlGeo = new THREE.BoxGeometry(1.7, 0.12, 0.08);
  const brakeLightMesh = new THREE.Mesh(tlGeo, taillightOnMat);
  brakeLightMesh.position.set(0, 0.52, -2.16);
  root.add(brakeLightMesh);

  // 10. Dual Exhaust Pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.28, 8);
  exhaustGeo.rotateX(Math.PI / 2);
  const exLeft = new THREE.Mesh(exhaustGeo, exhaustMaterial);
  exLeft.position.set(-0.48, 0.28, -2.2);
  const exRight = new THREE.Mesh(exhaustGeo, exhaustMaterial);
  exRight.position.set(0.48, 0.28, -2.2);
  root.add(exLeft, exRight);

  // 11. Headlight Road Beams
  const beams = createHeadlightBeams();
  root.add(beams);

  // 12. Wheels Setup
  const wheelRadius = 0.38;
  const wheelWidth = 0.26;
  const wheelZFront = 1.4;
  const wheelZRear = -1.4;
  const wheelX = 1.0;

  // Front Left
  const flPivot = new THREE.Group();
  flPivot.position.set(-wheelX, wheelRadius, wheelZFront);
  const flWheel = createDetailedWheel(wheelRadius, wheelWidth);
  flPivot.add(flWheel);
  root.add(flPivot);
  frontWheelPivots.push(flPivot);
  wheels.push(flWheel.children[0] as THREE.Mesh);

  // Front Right
  const frPivot = new THREE.Group();
  frPivot.position.set(wheelX, wheelRadius, wheelZFront);
  const frWheel = createDetailedWheel(wheelRadius, wheelWidth);
  frPivot.add(frWheel);
  root.add(frPivot);
  frontWheelPivots.push(frPivot);
  wheels.push(frWheel.children[0] as THREE.Mesh);

  // Rear Left
  const rlGroup = createDetailedWheel(wheelRadius, wheelWidth);
  rlGroup.position.set(-wheelX, wheelRadius, wheelZRear);
  root.add(rlGroup);
  wheels.push(rlGroup.children[0] as THREE.Mesh);

  // Rear Right
  const rrGroup = createDetailedWheel(wheelRadius, wheelWidth);
  rrGroup.position.set(wheelX, wheelRadius, wheelZRear);
  root.add(rrGroup);
  wheels.push(rrGroup.children[0] as THREE.Mesh);

  return {
    group: root,
    wheels,
    frontWheelPivots,
    exhaustPositions: [
      new THREE.Vector3(-0.48, 0.28, -2.3),
      new THREE.Vector3(0.48, 0.28, -2.3),
    ],
    bodyMesh: chassis,
    brakeLightMesh,
    headlightBeams: beams,
    setBodyColor: (c: string) => {
      bodyMat.color.set(c);
      wingBlade.material = bodyMat;
      roof.material = bodyMat;
    },
    setBraking: (isBraking: boolean) => {
      brakeLightMesh.material = isBraking ? taillightOnMat : taillightOffMat;
    },
  };
}

/**
 * Creates Player Car 2: Viper X (Muscular V10 GT)
 */
export function createViperX(colorHex: string = '#2563eb'): CarRig {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const frontWheelPivots: THREE.Group[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.14,
    metalness: 0.85,
  });

  // 1. Wide Body Chassis
  const mainChassis = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.46, 4.5), bodyMat);
  mainChassis.position.y = 0.38;
  mainChassis.castShadow = true;
  root.add(mainChassis);

  // 2. Muscular Rear Fenders
  const fenders = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 1.7), bodyMat);
  fenders.position.set(0, 0.44, -1.1);
  root.add(fenders);

  // 3. Fastback Cockpit
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.46, 2.3), glassMaterial);
  cabin.position.set(0, 0.76, -0.3);
  root.add(cabin);

  // 4. Twin Racing Stripes
  const stripeGeo = new THREE.BoxGeometry(0.2, 0.03, 4.52);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.2 });
  const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
  stripe1.position.set(-0.28, 0.62, 0);
  const stripe2 = new THREE.Mesh(stripeGeo, stripeMat);
  stripe2.position.set(0.28, 0.62, 0);
  root.add(stripe1, stripe2);

  // 5. Massive High-Mount GT Spoiler
  const wingPostGeo = new THREE.BoxGeometry(0.08, 0.5, 0.16);
  const postL = new THREE.Mesh(wingPostGeo, carbonMaterial);
  postL.position.set(-0.75, 0.82, -2.0);
  const postR = new THREE.Mesh(wingPostGeo, carbonMaterial);
  postR.position.set(0.75, 0.82, -2.0);
  root.add(postL, postR);

  const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.08, 0.5), carbonMaterial);
  wingBlade.position.set(0, 1.1, -2.05);
  root.add(wingBlade);

  // 6. Side Mirrors
  const mirrorGeo = new THREE.BoxGeometry(0.24, 0.12, 0.16);
  const mirrorL = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorL.position.set(-1.08, 0.72, 0.4);
  const mirrorR = new THREE.Mesh(mirrorGeo, bodyMat);
  mirrorR.position.set(1.08, 0.72, 0.4);
  root.add(mirrorL, mirrorR);

  // 7. Quad Center Exhaust
  const quadExGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
  quadExGeo.rotateX(Math.PI / 2);
  [-0.38, -0.13, 0.13, 0.38].forEach((xPos) => {
    const pipe = new THREE.Mesh(quadExGeo, exhaustMaterial);
    pipe.position.set(xPos, 0.26, -2.3);
    root.add(pipe);
  });

  // 8. Angular Front Headlights
  const hlGeo = new THREE.BoxGeometry(0.42, 0.15, 0.1);
  const hlL = new THREE.Mesh(hlGeo, headlightMaterial);
  hlL.position.set(-0.75, 0.46, 2.26);
  const hlR = new THREE.Mesh(hlGeo, headlightMaterial);
  hlR.position.set(0.75, 0.46, 2.26);
  root.add(hlL, hlR);

  // 9. Quad Red Taillights
  const brakeGroup = new THREE.Group();
  [-0.68, -0.38, 0.38, 0.68].forEach((xPos) => {
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), taillightOnMat);
    tl.position.set(xPos, 0.5, -2.26);
    brakeGroup.add(tl);
  });
  root.add(brakeGroup);

  // 10. Headlight Road Beams
  const beams = createHeadlightBeams();
  root.add(beams);

  // 11. Large Sports Wheels
  const wRadius = 0.4;
  const wWidth = 0.28;
  const wZFront = 1.45;
  const wZRear = -1.4;
  const wX = 1.08;

  const flPivot = new THREE.Group();
  flPivot.position.set(-wX, wRadius, wZFront);
  const flWheel = createDetailedWheel(wRadius, wWidth);
  flPivot.add(flWheel);
  root.add(flPivot);
  frontWheelPivots.push(flPivot);
  wheels.push(flWheel.children[0] as THREE.Mesh);

  const frPivot = new THREE.Group();
  frPivot.position.set(wX, wRadius, wZFront);
  const frWheel = createDetailedWheel(wRadius, wWidth);
  frPivot.add(frWheel);
  root.add(frPivot);
  frontWheelPivots.push(frPivot);
  wheels.push(frWheel.children[0] as THREE.Mesh);

  const rl = createDetailedWheel(wRadius, wWidth);
  rl.position.set(-wX, wRadius, wZRear);
  root.add(rl);
  wheels.push(rl.children[0] as THREE.Mesh);

  const rr = createDetailedWheel(wRadius, wWidth);
  rr.position.set(wX, wRadius, wZRear);
  root.add(rr);
  wheels.push(rr.children[0] as THREE.Mesh);

  return {
    group: root,
    wheels,
    frontWheelPivots,
    exhaustPositions: [
      new THREE.Vector3(-0.25, 0.26, -2.4),
      new THREE.Vector3(0.25, 0.26, -2.4),
    ],
    bodyMesh: mainChassis,
    brakeLightMesh: brakeGroup.children[0] as THREE.Mesh,
    headlightBeams: beams,
    setBodyColor: (c: string) => {
      bodyMat.color.set(c);
      fenders.material = bodyMat;
    },
    setBraking: (isBraking: boolean) => {
      const mat = isBraking ? taillightOnMat : taillightOffMat;
      brakeGroup.children.forEach((c) => {
        (c as THREE.Mesh).material = mat;
      });
    },
  };
}

/**
 * Creates Player Car 3: Phantom Hypercar (LMP / Exotic Prototype)
 */
export function createPhantomHypercar(colorHex: string = '#8b5cf6'): CarRig {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const frontWheelPivots: THREE.Group[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.12,
    metalness: 0.9,
  });

  // Low-slung LeMans Prototype body
  const underpan = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 4.6), carbonMaterial);
  underpan.position.y = 0.24;
  root.add(underpan);

  const mainBody = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.4, 4.4), bodyMat);
  mainBody.position.y = 0.36;
  mainBody.castShadow = true;
  root.add(mainBody);

  // Central Jet Bubble Canopy
  const bubbleCanopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    glassMaterial
  );
  bubbleCanopy.scale.set(0.92, 0.68, 1.85);
  bubbleCanopy.position.set(0, 0.5, -0.1);
  root.add(bubbleCanopy);

  // Shark Fin Stabilizer
  const finGeo = new THREE.BoxGeometry(0.06, 0.52, 1.5);
  const fin = new THREE.Mesh(finGeo, carbonMaterial);
  fin.position.set(0, 0.8, -1.15);
  root.add(fin);

  // Curved Active Aero Rear Wing
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.45), bodyMat);
  wing.position.set(0, 0.95, -2.15);
  root.add(wing);

  // Twin LED Blade lights
  const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.1), headlightMaterial);
  bladeL.position.set(-0.78, 0.4, 2.3);
  const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.1), headlightMaterial);
  bladeR.position.set(0.78, 0.4, 2.3);
  root.add(bladeL, bladeR);

  // Futuristic Tail Light Neon Strip
  const tailLight = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.08), taillightOnMat);
  tailLight.position.set(0, 0.44, -2.32);
  root.add(tailLight);

  // Dual High-Mounted Exhausts
  const exGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.32, 8);
  exGeo.rotateX(Math.PI / 2);
  const exL = new THREE.Mesh(exGeo, exhaustMaterial);
  exL.position.set(-0.42, 0.52, -2.26);
  const exR = new THREE.Mesh(exGeo, exhaustMaterial);
  exR.position.set(0.42, 0.52, -2.26);
  root.add(exL, exR);

  // Headlight Road Beams
  const beams = createHeadlightBeams();
  root.add(beams);

  // Wheels
  const wRadius = 0.37;
  const wWidth = 0.26;
  const wZFront = 1.48;
  const wZRear = -1.42;
  const wX = 1.08;

  const flPivot = new THREE.Group();
  flPivot.position.set(-wX, wRadius, wZFront);
  const flWheel = createDetailedWheel(wRadius, wWidth);
  flPivot.add(flWheel);
  root.add(flPivot);
  frontWheelPivots.push(flPivot);
  wheels.push(flWheel.children[0] as THREE.Mesh);

  const frPivot = new THREE.Group();
  frPivot.position.set(wX, wRadius, wZFront);
  const frWheel = createDetailedWheel(wRadius, wWidth);
  frPivot.add(frWheel);
  root.add(frPivot);
  frontWheelPivots.push(frPivot);
  wheels.push(frWheel.children[0] as THREE.Mesh);

  const rl = createDetailedWheel(wRadius, wWidth);
  rl.position.set(-wX, wRadius, wZRear);
  root.add(rl);
  wheels.push(rl.children[0] as THREE.Mesh);

  const rr = createDetailedWheel(wRadius, wWidth);
  rr.position.set(wX, wRadius, wZRear);
  root.add(rr);
  wheels.push(rr.children[0] as THREE.Mesh);

  return {
    group: root,
    wheels,
    frontWheelPivots,
    exhaustPositions: [
      new THREE.Vector3(-0.42, 0.52, -2.4),
      new THREE.Vector3(0.42, 0.52, -2.4),
    ],
    bodyMesh: mainBody,
    brakeLightMesh: tailLight,
    headlightBeams: beams,
    setBodyColor: (c: string) => {
      bodyMat.color.set(c);
      wing.material = bodyMat;
    },
    setBraking: (isBraking: boolean) => {
      tailLight.material = isBraking ? taillightOnMat : taillightOffMat;
    },
  };
}

/**
 * Creates Player Car 4: Cyber Turbo (Futuristic Jet Supercar)
 */
export function createCyberTurbo(colorHex: string = '#10b981'): CarRig {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const frontWheelPivots: THREE.Group[] = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.1,
    metalness: 0.95,
  });

  const neonAccentMat = new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
  });

  // Angular stealth wedge body
  const stealthBody = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.4, 4.6), bodyMat);
  stealthBody.position.y = 0.35;
  stealthBody.castShadow = true;
  root.add(stealthBody);

  // Cockpit
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.44, 2.1), glassMaterial);
  canopy.position.set(0, 0.7, -0.15);
  root.add(canopy);

  // Cyber Neon Edge Lines
  const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 4.5), neonAccentMat);
  edgeL.position.set(-1.02, 0.54, 0);
  const edgeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 4.5), neonAccentMat);
  edgeR.position.set(1.02, 0.54, 0);
  root.add(edgeL, edgeR);

  // Twin Plasma Thrusters (Exhaust)
  const thrusterGeo = new THREE.CylinderGeometry(0.16, 0.24, 0.45, 12);
  thrusterGeo.rotateX(Math.PI / 2);
  const thrusterL = new THREE.Mesh(thrusterGeo, exhaustMaterial);
  thrusterL.position.set(-0.55, 0.36, -2.3);
  const thrusterR = new THREE.Mesh(thrusterGeo, exhaustMaterial);
  thrusterR.position.set(0.55, 0.36, -2.3);
  root.add(thrusterL, thrusterR);

  // Neon Underglow Ring
  const underglow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 4.4),
    new THREE.MeshBasicMaterial({
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    })
  );
  underglow.rotateX(-Math.PI / 2);
  underglow.position.set(0, 0.06, 0);
  root.add(underglow);

  // Full-width front cyber lightbar
  const cyberLight = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.08), headlightMaterial);
  cyberLight.position.set(0, 0.38, 2.32);
  root.add(cyberLight);

  // Full-width rear neon lightbar
  const cyberTail = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.08), taillightOnMat);
  cyberTail.position.set(0, 0.48, -2.32);
  root.add(cyberTail);

  // Headlight Road Beams
  const beams = createHeadlightBeams();
  root.add(beams);

  // Wheels
  const wRadius = 0.38;
  const wWidth = 0.26;
  const wZFront = 1.45;
  const wZRear = -1.45;
  const wX = 1.08;

  const flPivot = new THREE.Group();
  flPivot.position.set(-wX, wRadius, wZFront);
  const flWheel = createDetailedWheel(wRadius, wWidth);
  flPivot.add(flWheel);
  root.add(flPivot);
  frontWheelPivots.push(flPivot);
  wheels.push(flWheel.children[0] as THREE.Mesh);

  const frPivot = new THREE.Group();
  frPivot.position.set(wX, wRadius, wZFront);
  const frWheel = createDetailedWheel(wRadius, wWidth);
  frPivot.add(frWheel);
  root.add(frPivot);
  frontWheelPivots.push(frPivot);
  wheels.push(frWheel.children[0] as THREE.Mesh);

  const rl = createDetailedWheel(wRadius, wWidth);
  rl.position.set(-wX, wRadius, wZRear);
  root.add(rl);
  wheels.push(rl.children[0] as THREE.Mesh);

  const rr = createDetailedWheel(wRadius, wWidth);
  rr.position.set(wX, wRadius, wZRear);
  root.add(rr);
  wheels.push(rr.children[0] as THREE.Mesh);

  return {
    group: root,
    wheels,
    frontWheelPivots,
    exhaustPositions: [
      new THREE.Vector3(-0.55, 0.36, -2.5),
      new THREE.Vector3(0.55, 0.36, -2.5),
    ],
    bodyMesh: stealthBody,
    brakeLightMesh: cyberTail,
    headlightBeams: beams,
    setBodyColor: (c: string) => {
      bodyMat.color.set(c);
    },
    setBraking: (isBraking: boolean) => {
      cyberTail.material = isBraking ? taillightOnMat : taillightOffMat;
    },
  };
}

/**
 * Creates highly visible AI Traffic Vehicles
 */
export function createTrafficVehicle(type: 'sedan' | 'suv' | 'truck' | 'sport', colorHex: string): THREE.Group {
  const root = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.3,
    metalness: 0.5,
  });

  if (type === 'truck') {
    // Semi Cargo Truck with hazard stripes and bright taillights
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 2.6), bodyMat);
    cab.position.set(0, 1.15, 2.5);
    cab.castShadow = true;
    root.add(cab);

    // Windshield
    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.1), glassMaterial);
    cabGlass.position.set(0, 1.45, 3.81);
    root.add(cabGlass);

    // Container Trailer with bright contrasting side
    const trailerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.3 });
    const trailer = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.4, 6.8), trailerMat);
    trailer.position.set(0, 1.5, -1.9);
    trailer.castShadow = true;
    root.add(trailer);

    // Amber roof hazard beacons
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beaconL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), beaconMat);
    beaconL.position.set(-0.8, 2.2, 2.6);
    const beaconR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 8), beaconMat);
    beaconR.position.set(0.8, 2.2, 2.6);
    root.add(beaconL, beaconR);

    // Wheels
    [-4.0, -2.0, 2.5].forEach((zPos) => {
      [-1.2, 1.2].forEach((xPos) => {
        const w = createDetailedWheel(0.48, 0.32);
        w.position.set(xPos, 0.48, zPos);
        root.add(w);
      });
    });

    // Highly visible rear light bar
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.1), taillightOnMat);
    tlL.position.set(-1.0, 0.65, -5.31);
    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.1), taillightOnMat);
    tlR.position.set(1.0, 0.65, -5.31);
    root.add(tlL, tlR);
  } else if (type === 'suv') {
    // Tall SUV with roof rails and distinct rear profile
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.68, 4.3), bodyMat);
    chassis.position.y = 0.52;
    chassis.castShadow = true;
    root.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.62, 2.9), glassMaterial);
    cabin.position.set(0, 1.1, -0.3);
    root.add(cabin);

    // Roof rack
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.8 });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 2.4), railMat);
    railL.position.set(-0.8, 1.48, -0.3);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 2.4), railMat);
    railR.position.set(0.8, 1.48, -0.3);
    root.add(railL, railR);

    // 4 Wheels
    [-1.35, 1.35].forEach((zPos) => {
      [-1.02, 1.02].forEach((xPos) => {
        const w = createDetailedWheel(0.4, 0.26);
        w.position.set(xPos, 0.4, zPos);
        root.add(w);
      });
    });

    // Bright taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), taillightOnMat);
    tlL.position.set(-0.72, 0.65, -2.16);
    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), taillightOnMat);
    tlR.position.set(0.72, 0.65, -2.16);
    root.add(tlL, tlR);
  } else {
    // Sedan or Sport Traffic Car
    const isSport = type === 'sport';
    const height = isSport ? 0.4 : 0.46;
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, height, 4.1), bodyMat);
    chassis.position.y = 0.38;
    chassis.castShadow = true;
    root.add(chassis);

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.48, 2.3), glassMaterial);
    cabin.position.set(0, 0.74, -0.2);
    root.add(cabin);

    // 4 Wheels
    [-1.3, 1.3].forEach((zPos) => {
      [-0.96, 0.96].forEach((xPos) => {
        const w = createDetailedWheel(0.36, 0.24);
        w.position.set(xPos, 0.36, zPos);
        root.add(w);
      });
    });

    // Bright Taillights
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), taillightOnMat);
    tlL.position.set(-0.66, 0.45, -2.06);
    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.08), taillightOnMat);
    tlR.position.set(0.66, 0.45, -2.06);
    root.add(tlL, tlR);
  }

  return root;
}
