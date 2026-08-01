// --- Spellbound Clash 3D Game Engine ---

// --- 1. GAME STATE ---
let gold = 80;
let playerHp = 100;
let enemyHp = 100;
let mode = 'PLAY'; // 'PLAY', 'BUILD_WIZARD', 'EDIT_SLOTS'
let selectedWizard = null;
let lastTime = Date.now();

// Auto Wave System Variables
let waveCount = 0;
let waveTimer = 0;
let waveInterval = 6.0;

// --- 2. 3D PATH & TEAM WIZARD SLOTS DEFINITION ---
const pathNodes = [
    { x: -26, z: 4 },
    { x: -14, z: 4 },
    { x: -14, z: -6 },
    { x: 14, z: -6 },
    { x: 14, z: 4 },
    { x: 26, z: 4 }
];

const playerBasePos = pathNodes[0];
const enemyBasePos = pathNodes[pathNodes.length - 1];

// Separate Wizard Slots per Team
let wizardSlots = [
    // Blue Team Slots (Player - Left Side X < 0)
    { x: -20, z: -10, team: 'player' },
    { x: -12, z: -10, team: 'player' },
    { x: -4, z: -10, team: 'player' },
    { x: -16, z: -1, team: 'player' },
    { x: -8, z: -1, team: 'player' },
    { x: -20, z: 9, team: 'player' },
    { x: -12, z: 9, team: 'player' },
    { x: -4, z: 9, team: 'player' },

    // Red Team Slots (Enemy AI - Right Side X > 0)
    { x: 4, z: -10, team: 'enemy' },
    { x: 12, z: -10, team: 'enemy' },
    { x: 20, z: -10, team: 'enemy' },
    { x: 8, z: -1, team: 'enemy' },
    { x: 16, z: -1, team: 'enemy' },
    { x: 4, z: 9, team: 'enemy' },
    { x: 12, z: 9, team: 'enemy' },
    { x: 20, z: 9, team: 'enemy' }
];

// Collections
const knights = [];
const wizards = [];
const projectiles = [];
const slotMeshes = [];
const floatingTexts = [];

// Questions for Age 8+
const questions = [
    { q: "Which word rhymes with 'KNIGHT'?", opts: ["Light", "Kite", "Fright", "All of these"], a: "All of these" },
    { q: "Which word means 'VERY BRAVE'?", opts: ["Timid", "Courageous", "Silent", "Sleepy"], a: "Courageous" },
    { q: "Select the ACTION word (Verb):", opts: ["Shield", "Charge", "Armor", "Castle"], a: "Charge" },
    { q: "Find the synonym for 'SWIFT':", opts: ["Slow", "Fast", "Heavy", "Dark"], a: "Fast" },
    { q: "Which spell prefix means 'AGAIN'?", opts: ["Pre-", "Un-", "Re-", "Dis-"], a: "Re-" },
    { q: "What is the antonym (opposite) of 'DEFEND'?", opts: ["Protect", "Attack", "Guard", "Save"], a: "Attack" },
    { q: "Which is a NOUN?", opts: ["Quickly", "Magical", "Wizard", "Run"], a: "Wizard" }
];

// --- 3. THREE.JS SCENE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);
scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 34, 28);
camera.lookAt(0, -2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
container.appendChild(renderer.domElement);

function updateCameraViewport() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;

    const baseFov = 50;
    const targetAspect = 1.65;

    if (aspect < targetAspect) {
        const verticalFovRad = baseFov * (Math.PI / 180);
        const horizontalFovRad = 2 * Math.atan(Math.tan(verticalFovRad / 2) * targetAspect);
        camera.fov = (2 * Math.atan(Math.tan(horizontalFovRad / 2) / aspect)) * (180 / Math.PI);
    } else {
        camera.fov = baseFov;
    }

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', updateCameraViewport);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfffaed, 0.95);
dirLight.position.set(20, 45, 25);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 150;
dirLight.shadow.camera.left = -35;
dirLight.shadow.camera.right = 35;
dirLight.shadow.camera.top = 25;
dirLight.shadow.camera.bottom = -25;
scene.add(dirLight);

const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.35);
scene.add(hemiLight);

// --- 4. ENVIRONMENT & MESH BUILDERS ---
const groundGeo = new THREE.PlaneGeometry(70, 45);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.8, metalness: 0.1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function buildPathMesh() {
    const group = new THREE.Group();
    const pathWidth = 3.6;
    const pathMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });

    for (let i = 0; i < pathNodes.length - 1; i++) {
        const p1 = pathNodes[i];
        const p2 = pathNodes[i + 1];

        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, dz);

        const segGeo = new THREE.PlaneGeometry(pathWidth, len + (i < pathNodes.length - 2 ? pathWidth : 0));
        const seg = new THREE.Mesh(segGeo, pathMat);
        seg.rotation.x = -Math.PI / 2;
        seg.rotation.z = -angle;
        seg.position.set((p1.x + p2.x) / 2, 0.02, (p1.z + p2.z) / 2);
        seg.receiveShadow = true;
        group.add(seg);
    }

    return group;
}
scene.add(buildPathMesh());

// Lightweight model helpers
function mat(color, roughness = 0.65, metalness = 0.05, emissive = 0x000000) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive });
}

function mesh(geometry, material, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    object.castShadow = true;
    object.receiveShadow = true;
    return object;
}

function addBattlements(parent, width, depth, y, material) {
    const size = 0.48;
    const positions = [];
    for (let x = -width / 2 + size / 2; x <= width / 2 - size / 2; x += 1.0) {
        positions.push([x, y, -depth / 2], [x, y, depth / 2]);
    }
    for (let z = -depth / 2 + 1; z <= depth / 2 - 1; z += 1.0) {
        positions.push([-width / 2, y, z], [width / 2, y, z]);
    }
    positions.forEach(([x, py, z]) => parent.add(mesh(new THREE.BoxGeometry(size, 0.65, size), material, x, py, z)));
}

function addEye(parent, x, y, z, color = 0x111827) {
    const eye = mesh(new THREE.SphereGeometry(0.045, 6, 6), new THREE.MeshBasicMaterial({ color }), x, y, z);
    eye.castShadow = false;
    parent.add(eye);
}

function addScenery() {
    const trunkMat = mat(0x5b371b, 0.95);
    const leafMats = [mat(0x267a3b, 0.9), mat(0x3f9b4f, 0.9), mat(0x1f6b36, 0.9)];
    const rockMat = mat(0x64748b, 1);
    const reserved = [...pathNodes, ...wizardSlots];

    for (let i = 0; i < 34; i++) {
        const x = -32 + Math.random() * 64;
        const z = -19 + Math.random() * 38;
        if (reserved.some(p => Math.hypot(p.x - x, p.z - z) < 4.0)) continue;
        const tree = new THREE.Group();
        tree.add(mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.8, 7), trunkMat, 0, 0.9, 0));
        const crown = mesh(new THREE.DodecahedronGeometry(0.9 + Math.random() * 0.35, 0), leafMats[i % leafMats.length], 0, 2.05, 0);
        crown.scale.y = 1.25;
        tree.add(crown);
        tree.position.set(x, 0, z);
        tree.rotation.y = Math.random() * Math.PI;
        scene.add(tree);
    }

    for (let i = 0; i < 18; i++) {
        const x = -32 + Math.random() * 64;
        const z = -19 + Math.random() * 38;
        if (reserved.some(p => Math.hypot(p.x - x, p.z - z) < 3.2)) continue;
        const rock = mesh(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.45, 0), rockMat, x, 0.25, z);
        rock.scale.set(1.2, 0.65, 0.9);
        rock.rotation.set(Math.random(), Math.random(), Math.random());
        scene.add(rock);
    }
}

// Castle Builder
function createCastleMesh(teamColor) {
    const castle = new THREE.Group();
    const stoneMat = mat(0x718096, 0.9);
    const lightStone = mat(0x94a3b8, 0.85);
    const darkMat = mat(0x273449, 0.8, 0.15);
    const roofMat = mat(teamColor, 0.45, 0.15);
    const goldMat = mat(0xfbbf24, 0.3, 0.75);

    const base = mesh(new THREE.CylinderGeometry(3.8, 4.2, 0.7, 12), darkMat, 0, 0.35, 0);
    castle.add(base);

    const keep = mesh(new THREE.BoxGeometry(4.8, 4.2, 4.8), stoneMat, 0, 2.65, 0);
    castle.add(keep);
    addBattlements(castle, 4.8, 4.8, 5.08, lightStone);

    const towerOffsets = [[-2.25, -2.25], [-2.25, 2.25], [2.25, -2.25], [2.25, 2.25]];
    towerOffsets.forEach(([ox, oz]) => {
        const tower = mesh(new THREE.CylinderGeometry(0.92, 1.08, 5.4, 12), stoneMat, ox, 3.0, oz);
        castle.add(tower);
        const rim = mesh(new THREE.CylinderGeometry(1.12, 1.12, 0.42, 12), lightStone, ox, 5.72, oz);
        castle.add(rim);
        const roof = mesh(new THREE.ConeGeometry(1.28, 2.1, 12), roofMat, ox, 7.0, oz);
        castle.add(roof);
        const windowMesh = mesh(new THREE.BoxGeometry(0.3, 0.65, 0.08), darkMat, ox, 3.3, oz + (oz > 0 ? 0.96 : -0.96));
        castle.add(windowMesh);
    });

    const gateFrame = mesh(new THREE.BoxGeometry(2.0, 2.7, 0.35), lightStone, 0, 1.7, 2.53);
    castle.add(gateFrame);
    const gate = mesh(new THREE.BoxGeometry(1.35, 2.3, 0.42), darkMat, 0, 1.35, 2.73);
    castle.add(gate);
    for (let x = -0.45; x <= 0.45; x += 0.3) {
        castle.add(mesh(new THREE.BoxGeometry(0.07, 2.15, 0.08), goldMat, x, 1.35, 2.97));
    }

    const crest = mesh(new THREE.OctahedronGeometry(0.45, 0), roofMat, 0, 4.15, 2.55);
    castle.add(crest);
    const pole = mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.0, 8), darkMat, 0, 6.3, 0);
    castle.add(pole);
    const flag = mesh(new THREE.BoxGeometry(1.5, 0.8, 0.08), roofMat, 0.75, 7.35, 0);
    flag.userData.flag = true;
    castle.add(flag);

    castle.userData.animate = (time) => {
        flag.rotation.y = Math.sin(time * 0.003) * 0.14;
    };
    return castle;
}
const blueCastle = createCastleMesh(0x38bdf8);
blueCastle.position.set(playerBasePos.x - 2, 0, playerBasePos.z);
scene.add(blueCastle);

const redCastle = createCastleMesh(0xf43f5e);
redCastle.position.set(enemyBasePos.x + 2, 0, enemyBasePos.z);
scene.add(redCastle);
addScenery();

// Build Wizard Slot Markers
const slotRingGeo = new THREE.RingGeometry(0.8, 1.2, 24);
const blueSlotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
const redSlotMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });

function refreshSlotMeshes() {
    slotMeshes.forEach(m => scene.remove(m));
    slotMeshes.length = 0;

    wizardSlots.forEach(s => {
        const isPlayerSlot = s.team === 'player' || s.x < 0;
        const mat = isPlayerSlot ? blueSlotMat : redSlotMat;

        const group = new THREE.Group();

        const mesh = new THREE.Mesh(slotRingGeo, mat);
        mesh.rotation.x = -Math.PI / 2;
        group.add(mesh);

        const innerGeo = new THREE.CircleGeometry(0.4, 16);
        const innerMat = new THREE.MeshBasicMaterial({ color: isPlayerSlot ? 0x0284c7 : 0xbe123c, transparent: true, opacity: 0.5 });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        innerMesh.rotation.x = -Math.PI / 2;
        group.add(innerMesh);

        group.position.set(s.x, 0.05, s.z);
        group.userData = { isSlot: true, slotData: s };
        scene.add(group);

        mesh.userData = { isSlot: true, slotData: s };
        slotMeshes.push(mesh);
    });
}
refreshSlotMeshes();

// Floating 3D Gold Text
function createFloatingGoldText(x, y, z, textStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.font = '900 44px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(textStr, 128, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(4.5, 2.25, 1);
    scene.add(sprite);

    floatingTexts.push({ sprite, life: 1.0 });
}

// 3D Health Bar Creator for Mega Knights
function createHealthBarTexture(curHp, maxHp) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 24;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 128, 24);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, 128, 24);

    const pct = Math.max(0, curHp / maxHp);
    ctx.fillStyle = pct > 0.5 ? '#22c55e' : (pct > 0.2 ? '#eab308' : '#ef4444');
    ctx.fillRect(3, 3, Math.floor(122 * pct), 18);

    return new THREE.CanvasTexture(canvas);
}

// --- 5. ENTITY BUILDERS ---
function createKnightMesh(team, isMega = false) {
    const knight = new THREE.Group();
    const isPlayer = team === 'player';
    const armorColor = isMega ? 0xf4b942 : (isPlayer ? 0xb8c6d9 : 0x591622);
    const secondaryColor = isPlayer ? 0x1478b8 : 0xc92f4b;
    const clothColor = isPlayer ? 0x0c4a6e : 0x641220;
    const plumeColor = isMega ? 0xffe066 : (isPlayer ? 0x42c5f5 : 0xff5a73);

    const armorMat = mat(armorColor, 0.26, 0.82);
    const trimMat = mat(0xf8d66d, 0.3, 0.7);
    const secMat = mat(secondaryColor, 0.6);
    const clothMat = mat(clothColor, 0.85);
    const skinMat = mat(0xf2bd8b, 0.8);
    const darkMat = mat(0x202938, 0.65, 0.45);

    const torso = mesh(new THREE.CylinderGeometry(0.52, 0.63, 1.05, 10), clothMat, 0, 0.95, 0);
    knight.add(torso);
    const breastplate = mesh(new THREE.SphereGeometry(0.62, 12, 8), armorMat, 0, 1.12, 0.02);
    breastplate.scale.set(1, 0.8, 0.72);
    knight.add(breastplate);
    const belt = mesh(new THREE.CylinderGeometry(0.57, 0.57, 0.16, 10), trimMat, 0, 0.65, 0);
    knight.add(belt);

    const head = mesh(new THREE.SphereGeometry(0.34, 12, 10), skinMat, 0, 1.72, 0);
    knight.add(head);
    addEye(knight, -0.12, 1.77, 0.31);
    addEye(knight, 0.12, 1.77, 0.31);

    const helmet = mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.75), armorMat, 0, 1.9, -0.02);
    knight.add(helmet);
    const noseGuard = mesh(new THREE.BoxGeometry(0.09, 0.42, 0.08), darkMat, 0, 1.76, 0.35);
    knight.add(noseGuard);
    const plume = mesh(new THREE.ConeGeometry(isMega ? 0.19 : 0.12, isMega ? 0.95 : 0.65, 7), mat(plumeColor, 0.5, 0.05, isMega ? 0x7c4a00 : 0x000000), 0, 2.42, -0.08);
    plume.rotation.x = -0.28;
    knight.add(plume);

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.58, 1.2, 0);
    leftArm.add(mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.72, 8), armorMat, 0, -0.25, 0));
    const shield = mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 8), secMat, -0.12, -0.2, 0.24);
    shield.rotation.x = Math.PI / 2;
    leftArm.add(shield);
    const boss = mesh(new THREE.SphereGeometry(0.14, 8, 6), trimMat, -0.12, -0.2, 0.33);
    leftArm.add(boss);
    knight.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.58, 1.22, 0);
    rightArm.add(mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.72, 8), armorMat, 0, -0.25, 0));
    const sword = mesh(new THREE.BoxGeometry(0.1, 1.2, 0.16), armorMat, 0.12, -0.65, 0.2);
    sword.rotation.z = -0.18;
    rightArm.add(sword);
    rightArm.add(mesh(new THREE.BoxGeometry(0.46, 0.08, 0.13), trimMat, 0.12, -0.1, 0.2));
    knight.add(rightArm);

    const leftLeg = mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.65, 8), darkMat, -0.23, 0.27, 0);
    const rightLeg = mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.65, 8), darkMat, 0.23, 0.27, 0);
    knight.add(leftLeg, rightLeg);

    if (isMega) {
        const shoulderGeo = new THREE.SphereGeometry(0.28, 8, 6);
        knight.add(mesh(shoulderGeo, armorMat, -0.58, 1.42, 0));
        knight.add(mesh(shoulderGeo, armorMat, 0.58, 1.42, 0));
        const aura = new THREE.PointLight(isPlayer ? 0x38bdf8 : 0xffa62b, 1.6, 5);
        aura.position.set(0, 1.5, 0);
        knight.add(aura);
    }

    knight.userData.parts = { leftArm, rightArm, leftLeg, rightLeg, plume };
    knight.scale.setScalar(isMega ? 1.55 : 1.0);
    return knight;
}
// Wizard Mesh Generator (Standard, Fire, Ice with Level 3 Swift Boots & Level 4 Teleport Aura)
function createWizardMesh(team, type = 'standard', level = 1) {
    const wizard = new THREE.Group();
    const isPlayer = team === 'player';
    let robeColor = isPlayer ? 0x176fa6 : 0xa91f3d;
    let hatColor = isPlayer ? 0x0b3c68 : 0x64152a;
    let crystalColor = 0xf8cf4a;
    if (type === 'fire') { robeColor = 0xd94b19; hatColor = 0x77220f; crystalColor = 0xff6a00; }
    if (type === 'ice') { robeColor = 0x1789bd; hatColor = 0x0b4f75; crystalColor = 0x73dcff; }

    const robeMat = mat(robeColor, 0.72);
    const robeDark = mat(hatColor, 0.78);
    const crystalMat = mat(crystalColor, 0.25, 0.1, crystalColor);
    crystalMat.emissiveIntensity = level >= 4 ? 1.7 : 1.05;
    const woodMat = mat(0x6b3d1e, 0.95);
    const skinMat = mat(0xf1bc8b, 0.82);
    const trimMat = mat(0xf4d35e, 0.4, 0.4);

    const robe = mesh(new THREE.ConeGeometry(0.76, 1.65, 12), robeMat, 0, 0.82, 0);
    wizard.add(robe);
    const mantle = mesh(new THREE.SphereGeometry(0.52, 12, 8), robeDark, 0, 1.35, 0);
    mantle.scale.set(1.2, 0.45, 0.9);
    wizard.add(mantle);
    const belt = mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.13, 12), trimMat, 0, 0.82, 0);
    wizard.add(belt);

    const head = mesh(new THREE.SphereGeometry(0.35, 12, 10), skinMat, 0, 1.76, 0);
    wizard.add(head);
    addEye(wizard, -0.12, 1.82, 0.31);
    addEye(wizard, 0.12, 1.82, 0.31);
    const beard = mesh(new THREE.ConeGeometry(0.27, 0.65, 8), mat(level >= 3 ? 0xe5e7eb : 0xcbd5e1, 0.95), 0, 1.48, 0.25);
    beard.rotation.x = -0.12;
    wizard.add(beard);

    const brim = mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 12), robeDark, 0, 2.02, 0);
    wizard.add(brim);
    const hat = mesh(new THREE.ConeGeometry(0.48, 1.05, 12), robeDark, -0.04, 2.55, 0);
    hat.rotation.z = -0.18;
    wizard.add(hat);
    const hatBand = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12), trimMat, 0, 2.16, 0);
    wizard.add(hatBand);

    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.66, 1.12, 0.12);
    staffGroup.add(mesh(new THREE.CylinderGeometry(0.055, 0.07, 2.35, 8), woodMat, 0, 0, 0));
    const crystalGeo = type === 'fire' ? new THREE.DodecahedronGeometry(0.3, 0) : new THREE.OctahedronGeometry(0.3, 0);
    const crystal = mesh(crystalGeo, crystalMat, 0, 1.25, 0);
    staffGroup.add(crystal);
    const crystalLight = new THREE.PointLight(crystalColor, 1.15, 4.5);
    crystalLight.position.set(0, 1.25, 0);
    staffGroup.add(crystalLight);
    wizard.add(staffGroup);

    const hand = mesh(new THREE.SphereGeometry(0.12, 8, 6), skinMat, 0.62, 1.12, 0.12);
    wizard.add(hand);

    if (level >= 3) {
        const bootMat = mat(0xf4bf36, 0.4, 0.5, 0x5c3a00);
        wizard.add(mesh(new THREE.BoxGeometry(0.35, 0.23, 0.55), bootMat, -0.3, 0.18, 0.1));
        wizard.add(mesh(new THREE.BoxGeometry(0.35, 0.23, 0.55), bootMat, 0.3, 0.18, 0.1));
    }
    if (level >= 4) {
        const teleMat = new THREE.MeshBasicMaterial({ color: 0xb56cff, side: THREE.DoubleSide, transparent: true, opacity: 0.72 });
        const teleRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.08, 8, 30), teleMat);
        teleRing.rotation.x = Math.PI / 2;
        teleRing.position.y = 0.2;
        teleRing.userData.teleRing = true;
        wizard.add(teleRing);
    }

    wizard.userData.parts = { staffGroup, crystal, hat };
    wizard.scale.setScalar(1.12);
    return wizard;
}
// --- 6. GAME CLASSES ---
class WizardEntity {
    constructor(x, z, team) {
        this.homeX = x;
        this.homeZ = z;
        this.team = team;
        this.hp = 60;
        this.maxHp = 60;
        this.range = 17;
        this.type = 'standard'; // 'standard', 'fire', 'ice'
        this.level = 1; // 1: Standard, 2: Elemental, 3: Swift Boots, 4: Teleport Master
        this.state = 'ACTIVE';
        this.lastShot = 0;

        this.mesh = createWizardMesh(team, this.type, this.level);
        this.mesh.position.set(x, 0, z);
        this.mesh.userData = { entity: this };
        scene.add(this.mesh);
    }

    takeDamage(amount, attackerTeam) {
        if (this.state !== 'ACTIVE') return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            if (attackerTeam === 'player' && this.team === 'enemy') {
                gold += 35;
                updateHUD();
                createFloatingGoldText(this.mesh.position.x, 2.5, this.mesh.position.z, "+35g");
            }
            this.triggerRecovery();
        }
    }

    triggerRecovery() {
        if (this.level >= 4) {
            // Level 4: Instant Teleport back to castle to heal instantly!
            let base = this.team === 'player' ? playerBasePos : enemyBasePos;
            this.mesh.position.set(base.x, 0, base.z);
            this.hp = this.maxHp;
            this.state = 'RETURNING';
            createFloatingGoldText(base.x, 3.5, base.z, "✨ Teleport!");
        } else {
            // Level 1-3: Walk back to castle to recover
            this.state = 'RETREATING';
        }
    }

    specialize(type) {
        this.type = type;
        this.level = 2; // Reaches L2 Elemental Specialization
        this.rebuildMesh();
    }

    upgradeSwift() {
        this.level = 3; // Reaches L3 Swift Boots
        this.rebuildMesh();
    }

    upgradeTeleport() {
        this.level = 4; // Reaches L4 Castle Teleport Master
        this.rebuildMesh();
    }

    rebuildMesh() {
        scene.remove(this.mesh);
        this.mesh = createWizardMesh(this.team, this.type, this.level);
        this.mesh.position.set(this.homeX, 0, this.homeZ);
        this.mesh.userData = { entity: this };
        scene.add(this.mesh);
    }

    update(dt) {
        const t = performance.now() * 0.001;
        const parts = this.mesh.userData.parts;
        if (parts) {
            parts.staffGroup.rotation.z = Math.sin(t * 2.1 + this.homeX) * 0.045;
            parts.crystal.rotation.y += dt * 0.0025;
            parts.hat.rotation.y = Math.sin(t * 1.3 + this.homeZ) * 0.04;
        }
        const teleRing = this.mesh.children.find(c => c.userData && c.userData.teleRing);
        if (teleRing) teleRing.rotation.z += dt * 0.0018;
        let base = this.team === 'player' ? playerBasePos : enemyBasePos;

        // Level 3+ Swift Boots gives 2.5x speed boost for quick castle healing!
        let speedMult = (this.level >= 3) ? 2.5 : 1.0;
        let speed = (9 * speedMult) * (dt / 1000);

        if (this.state === 'RETREATING') {
            if (this.moveTo(base.x, base.z, speed)) {
                this.hp = this.maxHp;
                this.state = 'RETURNING';
            }
        } else if (this.state === 'RETURNING') {
            if (this.moveTo(this.homeX, this.homeZ, speed)) {
                this.state = 'ACTIVE';
            }
        } else if (this.state === 'ACTIVE') {
            let now = Date.now();
            let fireInterval = this.type === 'fire' ? 900 : 1300;
            if (now - this.lastShot > fireInterval) {
                let target = knights.find(k => k.team !== this.team && Math.hypot(k.mesh.position.x - this.mesh.position.x, k.mesh.position.z - this.mesh.position.z) < this.range);
                if (target) {
                    projectiles.push(new ProjectileEntity(this.mesh.position.x, 1.8, this.mesh.position.z, target, this.team, this.type));
                    this.lastShot = now;
                }
            }
        }
    }

    moveTo(tx, tz, speed) {
        let dist = Math.hypot(tx - this.mesh.position.x, tz - this.mesh.position.z);
        if (dist <= speed) {
            this.mesh.position.x = tx;
            this.mesh.position.z = tz;
            return true;
        }
        let angle = Math.atan2(tx - this.mesh.position.x, tz - this.mesh.position.z);
        this.mesh.position.x += Math.sin(angle) * speed;
        this.mesh.position.z += Math.cos(angle) * speed;
        this.mesh.rotation.y = angle;
        return false;
    }

    destroy() {
        scene.remove(this.mesh);
    }
}

class KnightEntity {
    constructor(team, isMega = false) {
        this.team = team;
        this.isMega = isMega;
        this.pathIdx = team === 'player' ? 0 : pathNodes.length - 1;

        this.hp = isMega ? 160 : 15;
        this.maxHp = this.hp;
        this.speed = isMega ? 4.2 : 5.8;
        this.range = isMega ? 3.5 : 2.5;
        this.lastAttack = 0;
        this.slowTimer = 0;

        this.mesh = createKnightMesh(team, isMega);
        const startPos = pathNodes[this.pathIdx];
        this.mesh.position.set(startPos.x, 0, startPos.z);
        scene.add(this.mesh);

        if (isMega) {
            const mat = new THREE.SpriteMaterial({ map: createHealthBarTexture(this.hp, this.maxHp), transparent: true });
            this.hpSprite = new THREE.Sprite(mat);
            this.hpSprite.position.set(0, 3.2, 0);
            this.hpSprite.scale.set(2.4, 0.45, 1);
            this.mesh.add(this.hpSprite);
        }
    }

    updateHealthBar() {
        if (this.hpSprite) {
            this.hpSprite.material.map.dispose();
            this.hpSprite.material.map = createHealthBarTexture(this.hp, this.maxHp);
            this.hpSprite.material.map.needsUpdate = true;
        }
    }

    update(dt) {
        let now = Date.now();
        const parts = this.mesh.userData.parts;
        if (parts) {
            const walking = Math.sin(now * 0.012 + this.pathIdx) * 0.42;
            parts.leftLeg.rotation.x = walking;
            parts.rightLeg.rotation.x = -walking;
            parts.leftArm.rotation.x = -walking * 0.55;
            parts.rightArm.rotation.x = walking * 0.55;
            parts.plume.rotation.z = Math.sin(now * 0.009) * 0.08;
            this.mesh.position.y = Math.abs(Math.sin(now * 0.012 + this.pathIdx)) * 0.06;
        }
        let attacked = false;

        if (this.slowTimer > 0) {
            this.slowTimer -= dt / 1000;
        }

        let curSpeed = (this.slowTimer > 0) ? (this.speed * 0.45) : this.speed;

        let curX = this.mesh.position.x;
        let curZ = this.mesh.position.z;

        // 1. Fight opposing knights
        let enemyK = knights.find(k => k.team !== this.team && Math.hypot(k.mesh.position.x - curX, k.mesh.position.z - curZ) < (this.isMega ? 3.5 : 2.5));
        if (enemyK) {
            attacked = true;
            if (now - this.lastAttack > (this.isMega ? 800 : 1200)) {
                let dmg = this.isMega ? 35 : 15;
                enemyK.hp -= dmg;
                if (enemyK.isMega) enemyK.updateHealthBar();
                this.lastAttack = now;
            }
        }

        // 2. Attack Wizards
        if (!attacked) {
            let enemyW = wizards.find(w => w.team !== this.team && w.state === 'ACTIVE' && Math.hypot(w.mesh.position.x - curX, w.mesh.position.z - curZ) < 8.0);
            if (enemyW && now - this.lastAttack > 1500) {
                projectiles.push(new ProjectileEntity(curX, 1.2, curZ, enemyW, this.team, 'spear'));
                this.lastAttack = now;
            }
        }

        // 3. Move along 3D Path
        if (!attacked) {
            let targetIdx = this.team === 'player' ? this.pathIdx + 1 : this.pathIdx - 1;
            let targetNode = pathNodes[targetIdx];

            if (targetNode) {
                let dist = Math.hypot(targetNode.x - curX, targetNode.z - curZ);
                let moveAmt = curSpeed * (dt / 1000);

                if (dist <= moveAmt) {
                    this.mesh.position.x = targetNode.x;
                    this.mesh.position.z = targetNode.z;
                    this.pathIdx = targetIdx;
                } else {
                    let angle = Math.atan2(targetNode.x - curX, targetNode.z - curZ);
                    this.mesh.position.x += Math.sin(angle) * moveAmt;
                    this.mesh.position.z += Math.cos(angle) * moveAmt;
                    this.mesh.rotation.y = angle;
                }
            } else {
                let dmgAmt = this.isMega ? 30 : 10;
                if (this.team === 'player') enemyHp = Math.max(0, enemyHp - dmgAmt);
                else playerHp = Math.max(0, playerHp - dmgAmt);
                this.hp = 0;
            }
        }
    }

    destroy() {
        scene.remove(this.mesh);
    }
}

class ProjectileEntity {
    constructor(x, y, z, target, team, type) {
        this.target = target;
        this.team = team;
        this.type = type;
        this.speed = (type === 'fire') ? 26 : 22;

        let color = 0xfbbf24;
        if (type === 'fire') color = 0xff4500;
        else if (type === 'ice') color = 0x38bdf8;
        else if (type === 'standard') color = (team === 'player' ? 0x38bdf8 : 0xf43f5e);

        const pGeo = type === 'spear' ? new THREE.ConeGeometry(0.16, 0.75, 7) : new THREE.IcosahedronGeometry(type === 'fire' ? 0.46 : 0.31, 1);
        const pMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.3, roughness: 0.25 });

        this.mesh = new THREE.Mesh(pGeo, pMat);
        if (type === 'spear') this.mesh.rotation.x = Math.PI / 2;
        const glow = new THREE.PointLight(color, 1.2, 3.5);
        this.mesh.add(glow);
        this.mesh.position.set(x, y, z);
        scene.add(this.mesh);
    }

    update(dt) {
        let targetMesh = this.target.mesh;
        if (!targetMesh) return true;

        let tx = targetMesh.position.x;
        let ty = 1.2;
        let tz = targetMesh.position.z;

        let dist = Math.hypot(tx - this.mesh.position.x, tz - this.mesh.position.z);
        let moveAmt = this.speed * (dt / 1000);

        if (dist <= moveAmt) {
            let dmg = (this.type === 'fire') ? 35 : (this.type === 'ice' ? 15 : 20);

            if (this.target instanceof WizardEntity) {
                this.target.takeDamage(dmg, this.team);
            } else if (this.target instanceof KnightEntity) {
                this.target.hp -= dmg;
                if (this.target.isMega) this.target.updateHealthBar();

                if (this.type === 'ice') {
                    this.target.slowTimer = 3.5;
                }
            }

            scene.remove(this.mesh);
            return true;
        }

        let angle = Math.atan2(tx - this.mesh.position.x, tz - this.mesh.position.z);
        this.mesh.position.x += Math.sin(angle) * moveAmt;
        this.mesh.position.z += Math.cos(angle) * moveAmt;
        return false;
    }
}

// --- 7. AUTO KNIGHT WAVE SYSTEM & ENEMY AI ---
function triggerKnightWave() {
    waveCount++;
    waveInterval = Math.max(2.2, 6.0 - (waveCount * 0.15));

    const batchSize = Math.min(4, 2 + Math.floor(waveCount / 6));
    for (let i = 0; i < batchSize; i++) {
        setTimeout(() => {
            knights.push(new KnightEntity('player', false));
            knights.push(new KnightEntity('enemy', false));
        }, i * 400);
    }
}

setInterval(() => {
    if (Math.random() < 0.25) {
        let availableSlots = wizardSlots.filter(s => (s.team === 'enemy' || s.x > 0) && !wizards.find(w => w.homeX === s.x && w.homeZ === s.z));
        if (availableSlots.length > 0) {
            let slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
            const wizType = Math.random() < 0.5 ? 'fire' : 'ice';
            const wiz = new WizardEntity(slot.x, slot.z, 'enemy');
            wiz.specialize(wizType);
            if (Math.random() < 0.4) wiz.upgradeSwift();
            wizards.push(wiz);
        }
    }

    if (Math.random() < 0.15) {
        knights.push(new KnightEntity('enemy', true));
    }
}, 4500);

setInterval(() => {
    gold += 1;
    updateHUD();
}, 1000);

// --- 8. UI HANDLERS ---
function updateHUD() {
    document.getElementById('gold').innerText = gold;
    document.getElementById('playerHp').innerText = playerHp;
    document.getElementById('enemyHp').innerText = enemyHp;
    document.getElementById('playerHpFill').style.width = playerHp + '%';
    document.getElementById('enemyHpFill').style.width = enemyHp + '%';
    const waveEl = document.getElementById('wave');
    if (waveEl) waveEl.innerText = Math.max(1, waveCount);
}

document.getElementById('btn-knight').onclick = () => {
    if (gold >= 40) {
        gold -= 40;
        knights.push(new KnightEntity('player', true));
        updateHUD();
    } else {
        alert("Not enough gold! Read the spellbook for +50g!");
    }
};

document.getElementById('btn-wizard').onclick = () => {
    mode = mode === 'BUILD_WIZARD' ? 'PLAY' : 'BUILD_WIZARD';
    const btn = document.getElementById('btn-wizard');
    btn.innerText = mode === 'BUILD_WIZARD' ? "❌ Cancel Build" : "🧙 Build Wizard (50g)";
    btn.classList.toggle('btn-active', mode === 'BUILD_WIZARD');
};

document.getElementById('btn-editor').onclick = () => {
    mode = mode === 'EDIT_SLOTS' ? 'PLAY' : 'EDIT_SLOTS';
    const btn = document.getElementById('btn-editor');
    btn.innerText = mode === 'EDIT_SLOTS' ? "❌ Stop Editing" : "🛠️ Toggle Edit Mode";
    btn.classList.toggle('btn-active', mode === 'EDIT_SLOTS');
};

document.getElementById('btn-spellbook').onclick = () => {
    const modal = document.getElementById('spellbook-modal');
    const qObj = questions[Math.floor(Math.random() * questions.length)];

    document.getElementById('spell-question').innerText = qObj.q;
    const optsDiv = document.getElementById('spell-options');
    optsDiv.innerHTML = '';

    qObj.opts.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'word-opt';
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === qObj.a) {
                gold += 50;
                updateHUD();
            } else {
                alert("Incorrect! Better luck next time!");
            }
            modal.classList.add('hidden');
        };
        optsDiv.appendChild(btn);
    });
    modal.classList.remove('hidden');
};

document.getElementById('btn-close-upgrade').onclick = () => {
    document.getElementById('upgrade-modal').classList.add('hidden');
    selectedWizard = null;
};

// Level 1 -> 2 Fire Specialization
document.getElementById('btn-upgrade-fire').onclick = () => {
    if (!selectedWizard) return;
    if (gold >= 40) {
        gold -= 40;
        selectedWizard.specialize('fire');
        updateHUD();
        openUpgradeModal(selectedWizard);
    } else alert("Not enough gold!");
};

// Level 1 -> 2 Ice Specialization
document.getElementById('btn-upgrade-ice').onclick = () => {
    if (!selectedWizard) return;
    if (gold >= 40) {
        gold -= 40;
        selectedWizard.specialize('ice');
        updateHUD();
        openUpgradeModal(selectedWizard);
    } else alert("Not enough gold!");
};

// Level 2 -> 3 Swift Boots
document.getElementById('btn-upgrade-swift').onclick = () => {
    if (!selectedWizard) return;
    if (gold >= 50) {
        gold -= 50;
        selectedWizard.upgradeSwift();
        updateHUD();
        openUpgradeModal(selectedWizard);
    } else alert("Not enough gold!");
};

// Level 3 -> 4 Castle Teleport
document.getElementById('btn-upgrade-teleport').onclick = () => {
    if (!selectedWizard) return;
    if (gold >= 80) {
        gold -= 80;
        selectedWizard.upgradeTeleport();
        updateHUD();
        openUpgradeModal(selectedWizard);
    } else alert("Not enough gold!");
};

function openUpgradeModal(wiz) {
    selectedWizard = wiz;
    const typeLabel = wiz.type === 'fire' ? '🔥 Fire Wizard' : (wiz.type === 'ice' ? '❄️ Ice Wizard' : 'Standard Wizard');
    const rankLabel = `L${wiz.level} ${typeLabel}` + (wiz.level === 3 ? ' (+Swift Boots)' : (wiz.level >= 4 ? ' (+Teleport Master)' : ''));

    document.getElementById('wiz-level').innerText = rankLabel;

    const btnFire = document.getElementById('btn-upgrade-fire');
    const btnIce = document.getElementById('btn-upgrade-ice');
    const btnSwift = document.getElementById('btn-upgrade-swift');
    const btnTeleport = document.getElementById('btn-upgrade-teleport');
    const maxMsg = document.getElementById('wiz-max-msg');

    // Hide all first
    btnFire.style.display = 'none';
    btnIce.style.display = 'none';
    btnSwift.style.display = 'none';
    btnTeleport.style.display = 'none';
    maxMsg.style.display = 'none';

    if (wiz.level === 1) {
        btnFire.style.display = 'block';
        btnIce.style.display = 'block';
    } else if (wiz.level === 2) {
        btnSwift.style.display = 'block';
    } else if (wiz.level === 3) {
        btnTeleport.style.display = 'block';
    } else {
        maxMsg.style.display = 'block';
    }

    document.getElementById('upgrade-modal').classList.remove('hidden');
}

// --- 9. 3D RAYCASTING & CLICK INTERACTION ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('#ui-layer') || e.target.closest('.modal')) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (mode === 'EDIT_SLOTS') {
        const intersects = raycaster.intersectObject(ground);
        if (intersects.length > 0) {
            const pt = intersects[0].point;
            let existingIdx = wizardSlots.findIndex(s => Math.hypot(s.x - pt.x, s.z - pt.z) < 2.5);
            if (existingIdx !== -1) {
                wizardSlots.splice(existingIdx, 1);
            } else {
                const teamSide = pt.x < 0 ? 'player' : 'enemy';
                wizardSlots.push({ x: Math.round(pt.x), z: Math.round(pt.z), team: teamSide });
            }
            refreshSlotMeshes();
        }
        return;
    }

    if (mode === 'BUILD_WIZARD') {
        const intersects = raycaster.intersectObjects(slotMeshes);
        if (intersects.length > 0) {
            let hitObject = intersects[0].object;
            let slotData = hitObject.userData.slotData || (hitObject.parent && hitObject.parent.userData.slotData);

            if (slotData) {
                const isPlayerSlot = slotData.team === 'player' || slotData.x < 0;

                if (!isPlayerSlot) {
                    alert("⚠️ Red Team Territory! You can only build wizards on Blue slots (Left Side).");
                    return;
                }

                let occupied = wizards.find(w => w.homeX === slotData.x && w.homeZ === slotData.z);
                if (!occupied) {
                    if (gold >= 50) {
                        gold -= 50;
                        wizards.push(new WizardEntity(slotData.x, slotData.z, 'player'));
                        updateHUD();
                        mode = 'PLAY';
                        document.getElementById('btn-wizard').innerText = "🧙 Build Wizard (50g)";
                        document.getElementById('btn-wizard').classList.remove('btn-active');
                    } else {
                        alert("Not enough gold!");
                    }
                } else {
                    alert("This slot already has a wizard!");
                }
            }
        }
        return;
    }

    // Default Play Mode: Click Wizard to upgrade
    const wizardMeshes = wizards.filter(w => w.team === 'player').map(w => w.mesh);
    const intersects = raycaster.intersectObjects(wizardMeshes, true);
    if (intersects.length > 0) {
        let topObj = intersects[0].object;
        while (topObj.parent && !topObj.userData.entity) {
            topObj = topObj.parent;
        }
        if (topObj.userData.entity) {
            openUpgradeModal(topObj.userData.entity);
        }
    }
});

// --- 10. ANIMATION & GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    let now = Date.now();
    let dt = now - lastTime;
    lastTime = now;

    waveTimer += dt / 1000;
    if (waveTimer >= waveInterval) {
        waveTimer = 0;
        triggerKnightWave();
    }

    wizards.forEach(w => w.update(dt));

    for (let i = knights.length - 1; i >= 0; i--) {
        let k = knights[i];
        k.update(dt);
        if (k.hp <= 0) {
            if (k.team === 'enemy') {
                let reward = k.isMega ? 50 : 15;
                gold += reward;
                updateHUD();
                createFloatingGoldText(k.mesh.position.x, 2.5, k.mesh.position.z, `+${reward}g`);
            }
            k.destroy();
            knights.splice(i, 1);
        }
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].update(dt)) {
            projectiles.splice(i, 1);
        }
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ft.life -= dt / 1000;
        ft.sprite.position.y += 0.04;
        ft.sprite.material.opacity = Math.max(0, ft.life);
        if (ft.life <= 0) {
            scene.remove(ft.sprite);
            floatingTexts.splice(i, 1);
        }
    }

    if (playerHp <= 0) {
        alert("Red Team Wins! Refreshing battle...");
        playerHp = 100; enemyHp = 100; gold = 80; waveCount = 0; updateHUD();
    }
    if (enemyHp <= 0) {
        alert("Blue Team Wins! Victory!");
        playerHp = 100; enemyHp = 100; gold = 80; waveCount = 0; updateHUD();
    }

    const animationTime = performance.now();
    if (blueCastle.userData.animate) blueCastle.userData.animate(animationTime);
    if (redCastle.userData.animate) redCastle.userData.animate(animationTime + 500);

    renderer.render(scene, camera);
}

updateCameraViewport();
updateHUD();
triggerKnightWave();
requestAnimationFrame(animate);
