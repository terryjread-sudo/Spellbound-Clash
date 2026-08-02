// --- Yokai Siege: Legends of Japan V5.2 ---

// --- 1. GAME STATE ---
let gold = 80;
let playerHp = 100;
let enemyHp = 100;
let mode = 'PLAY'; // PLAY, BUILD_WIZARD, BUILD_SOHEI, BUILD_TORII, BUILD_ROPE, TARGET_HEAL
let gameActive = false;
let currentLevelIndex = 0;
let levelStartHp = 100;
let levelCorrect = 0;
let levelWrong = 0;
let shakeAmount = 0;
let selectedWizard = null;
let lastTime = Date.now();
let spellCharge = 100;
const maxSpellCharge = 100;
let readingStreak = 0;
let goldIncome = 0;
let incomeClock = 0;
let playerCastleMaxHp = 100;
let enemyCastleMaxHp = 100;
let playerWizardRangeBonus = 0;
let castleArmour = 0;
let currentQuestion = null;
let timeScale = 1;
let paused = false;
let goldRewardRate = Number(localStorage.getItem('yokaiGoldRewardRate') || 100) / 100;
let kotobaLevel = 1; // 3 Bushi at L1, +1 per upgrade, maximum 5
let readySoundPlayed = false;
let muteAudio = localStorage.getItem('yokaiMuteAudio') === '1';

// Auto Wave System Variables
let waveCount = 0;
let waveTimer = 0;
const WAVE_COUNTDOWN_SECONDS = 10;
let waveInterval = WAVE_COUNTDOWN_SECONDS;

const CAMPAIGN_LEVELS = [
 {name:'1. Sakura Gate',role:'defend',theme:0x78b86f,waves:5,difficulty:1,bossType:'gashadokuro',path:[[-52,8],[-30,8],[-30,-12],[0,-12],[0,8],[52,8]],slots:[[-42,15],[-34,1],[-22,1],[-15,-19],[-4,-5],[18,1]]},
 {name:'2. Moonlit Raid',role:'attack',theme:0x638aa0,waves:6,difficulty:1,bossType:'namazu',path:[[-52,-10],[-34,-10],[-34,12],[-10,12],[-10,-5],[22,-5],[22,12],[52,12]],slots:[[-44,-3],[-28,-18],[-27,18],[-15,5],[0,2],[28,5]]},
 {name:'3. Ember Shrine',role:'defend',theme:0xb47a4b,waves:6,difficulty:1,bossType:'gashadokuro',path:[[-52,12],[-38,12],[-38,-14],[-15,-14],[-15,8],[15,8],[15,-10],[38,-10],[38,12],[52,12]],slots:[[-45,4],[-31,4],[-24,-20],[-9,-5],[0,15],[23,0]]},
 {name:'4. Frost Pass Assault',role:'attack',theme:0x8cb8c5,waves:7,difficulty:2,bossType:'namazu',path:[[-52,0],[-38,0],[-38,-16],[-12,-16],[-12,16],[12,16],[12,-8],[36,-8],[36,8],[52,8]],slots:[[-45,8],[-31,-8],[-20,-9],[-5,8],[4,22],[20,0]]},
 {name:'5. Spirit Forest',role:'defend',theme:0x4f8f62,waves:7,difficulty:2,bossType:'orochi',path:[[-52,14],[-30,14],[-30,-14],[30,-14],[30,14],[-12,14],[-12,0],[12,0],[12,8],[52,8]],slots:[[-43,7],[-36,-4],[-20,-20],[-4,-7],[-20,20],[20,7]]},
 {name:'6. Shinobi Crossing',role:'attack',theme:0x766f91,waves:8,difficulty:2,bossType:'gashadokuro',path:[[-52,-14],[-28,-14],[-28,14],[-5,14],[-5,-6],[18,-6],[18,14],[38,14],[38,-4],[52,-4]],slots:[[-42,-7],[-34,5],[-21,20],[-12,5],[3,1],[25,7]]},
 {name:'7. Sacred Causeway',role:'defend',theme:0x5fa6b6,waves:8,difficulty:2,bossType:'namazu',path:[[-52,8],[-40,8],[-40,-16],[-20,-16],[-20,16],[5,16],[5,-16],[28,-16],[28,8],[52,8]],slots:[[-46,15],[-33,-8],[-26,8],[-13,-8],[-3,8],[12,-8]]},
 {name:'8. Orochi Run',role:'attack',theme:0xb06d4d,waves:9,difficulty:3,bossType:'orochi',path:[[-52,0],[-42,0],[-42,16],[-22,16],[-22,-16],[0,-16],[0,16],[22,16],[22,-8],[42,-8],[42,8],[52,8]],slots:[[-47,-7],[-35,8],[-28,-8],[-15,8],[-7,-9],[8,8]]},
 {name:'9. Yokai Labyrinth',role:'defend',theme:0x75689c,waves:9,difficulty:3,bossType:'gashadokuro',path:[[-52,-12],[-36,-12],[-36,14],[-18,14],[-18,-4],[0,-4],[0,14],[18,14],[18,-14],[38,-14],[38,6],[52,6]],slots:[[-45,-5],[-30,5],[-24,-11],[-12,5],[6,5],[24,-7]]},
 {name:'10. Palace of Eight Heads',role:'attack',theme:0x8b5962,waves:10,difficulty:3,bossType:'orochi',path:[[-52,10],[-40,10],[-40,-16],[-20,-16],[-20,16],[0,16],[0,-16],[20,-16],[20,16],[40,16],[40,0],[52,0]],slots:[[-46,3],[-33,-8],[-27,8],[-13,-8],[-7,8],[8,-8]]}
];
let campaignSave = JSON.parse(localStorage.getItem('yokaiSiegeCampaignV5') || '{"unlocked":1,"stars":{}}');

// --- 2. 3D PATH & TEAM WIZARD SLOTS DEFINITION ---
let pathNodes = [
    { x: -26, z: 4 },
    { x: -14, z: 4 },
    { x: -14, z: -6 },
    { x: 14, z: -6 },
    { x: 14, z: 4 },
    { x: 26, z: 4 }
];

let playerBasePos = pathNodes[0];
let enemyBasePos = pathNodes[pathNodes.length - 1];

// Separate Wizard Slots per Team
let wizardSlots = [
    // Every slot is deliberately close enough to the road for range to matter.
    { x: -21, z: 8, team: 'player' }, { x: -17, z: 0, team: 'player' },
    { x: -11, z: 0, team: 'player' }, { x: -9, z: -10, team: 'player' },
    { x: -3, z: -2, team: 'player' }, { x: -22, z: 0, team: 'player' },
    { x: 3, z: -2, team: 'enemy' }, { x: 9, z: -10, team: 'enemy' },
    { x: 11, z: 0, team: 'enemy' }, { x: 17, z: 0, team: 'enemy' },
    { x: 21, z: 8, team: 'enemy' }, { x: 22, z: 0, team: 'enemy' }
];

// Collections
const knights = [];
const wizards = [];
const projectiles = [];
const slotMeshes = [];
const floatingTexts = [];

// Very basic Japanese reading challenges for an eight-year-old.
// Every correct answer activates Kotoba Rally and summons Bushi.
const questions = [
    { q: "What does こんにちは (konnichiwa) mean?", opts: ["Hello", "Goodbye", "Thank you", "Water"], a: "Hello", difficulty: 1 },
    { q: "Which Japanese word means THANK YOU?", opts: ["Arigatō", "Sayonara", "Neko", "Aka"], a: "Arigatō", difficulty: 1 },
    { q: "What does ねこ (neko) mean?", opts: ["Cat", "Dog", "Bird", "Fish"], a: "Cat", difficulty: 1 },
    { q: "Which number is いち (ichi)?", opts: ["One", "Two", "Three", "Four"], a: "One", difficulty: 1 },
    { q: "What colour is あか (aka)?", opts: ["Red", "Blue", "White", "Black"], a: "Red", difficulty: 1 },
    { q: "What does みず (mizu) mean?", opts: ["Water", "Fire", "Mountain", "Moon"], a: "Water", difficulty: 1 },
    { q: "Which word means DOG?", opts: ["Inu", "Neko", "Tori", "Sakana"], a: "Inu", difficulty: 1 },
    { q: "What does おはよう (ohayō) mean?", opts: ["Good morning", "Good night", "Please", "Yes"], a: "Good morning", difficulty: 2 },
    { q: "Which number is さん (san)?", opts: ["Three", "Five", "Seven", "Ten"], a: "Three", difficulty: 2 },
    { q: "What does しろ (shiro) mean?", opts: ["White", "Yellow", "Green", "Purple"], a: "White", difficulty: 2 },
    { q: "Which Japanese word means MOUNTAIN?", opts: ["Yama", "Kawa", "Umi", "Sora"], a: "Yama", difficulty: 2 },
    { q: "What does さようなら (sayōnara) mean?", opts: ["Goodbye", "Welcome", "Excuse me", "Delicious"], a: "Goodbye", difficulty: 2 }
];

function distanceToPath(x, z) {
    let best = Infinity;
    for (let i = 0; i < pathNodes.length - 1; i++) {
        const a = pathNodes[i], b = pathNodes[i + 1];
        const dx = b.x - a.x, dz = b.z - a.z;
        const len2 = dx * dx + dz * dz;
        const t = Math.max(0, Math.min(1, ((x-a.x)*dx + (z-a.z)*dz) / len2));
        best = Math.min(best, Math.hypot(x - (a.x + t*dx), z - (a.z + t*dz)));
    }
    return best;
}
function nearestPathIndex(x, z) {
    let idx = 0, best = Infinity;
    pathNodes.forEach((p, i) => { const d=Math.hypot(p.x-x,p.z-z); if(d<best){best=d;idx=i;} });
    return idx;
}
function showBattleText(text) {
    const banner = document.getElementById('info-banner');
    banner.textContent = text;
    clearTimeout(showBattleText.timer);
    showBattleText.timer = setTimeout(() => banner.textContent = '⛩ Charge Kotoba Rally, answer basic Japanese, and summon Bushi!', 2600);
}

// --- 3. THREE.JS SCENE SETUP ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ed9f2);
scene.fog = new THREE.FogExp2(0xc9eaf4, 0.0045);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 66, 62);
camera.lookAt(0, -3, 0);

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

    const baseFov = 52;
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
const ambientLight = new THREE.AmbientLight(0xfff4dc, 0.82);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff0c2, 1.05);
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

const hemiLight = new THREE.HemisphereLight(0xbbe9ff, 0x4f6b43, 0.52);
scene.add(hemiLight);

// --- 4. ENVIRONMENT & MESH BUILDERS ---
const groundGeo = new THREE.PlaneGeometry(130, 78);
function makeGroundTexture(){
    const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
    x.fillStyle='#789b68'; x.fillRect(0,0,256,256);
    for(let i=0;i<1800;i++){const v=85+Math.floor(Math.random()*55);x.fillStyle=`rgba(${v-25},${v+20},${v-35},${0.05+Math.random()*.12})`;x.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*3,1+Math.random()*3)}
    for(let i=0;i<65;i++){x.strokeStyle='rgba(47,83,42,.22)';x.lineWidth=1;x.beginPath();const px=Math.random()*256,py=Math.random()*256;x.moveTo(px,py);x.lineTo(px+Math.random()*5-2.5,py-3-Math.random()*5);x.stroke()}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,5);t.encoding=THREE.sRGBEncoding;return t;
}
const groundMat = new THREE.MeshStandardMaterial({ color: 0x789b68, map:makeGroundTexture(), roughness: 0.96, metalness: 0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function buildPathMesh() {
    const group = new THREE.Group();
    const pathWidth = 3.6;
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x785536, roughness: 1 });
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xc99a5d, roughness: 0.98 });

    for (let i = 0; i < pathNodes.length - 1; i++) {
        const p1 = pathNodes[i];
        const p2 = pathNodes[i + 1];

        const dx = p2.x - p1.x;
        const dz = p2.z - p1.z;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dx, dz);

        const edgeGeo = new THREE.PlaneGeometry(pathWidth + 1.15, len + (i < pathNodes.length - 2 ? pathWidth + 1.15 : 0));
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.rotation.x = -Math.PI / 2; edge.rotation.z = -angle; edge.position.set((p1.x+p2.x)/2,0.014,(p1.z+p2.z)/2); edge.receiveShadow=true; group.add(edge);
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
let pathMeshGroup = buildPathMesh(); scene.add(pathMeshGroup);

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
scene.add(blueCastle); blueCastle.userData.isPlayerCastle=true;

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
        if (gameActive && CAMPAIGN_LEVELS[currentLevelIndex].role === 'defend' && s.team === 'enemy') return;
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
        this.homeX=x; this.homeZ=z; this.team=team; this.hp=60; this.maxHp=60;
        this.range=12 + (team === 'player' ? playerWizardRangeBonus : 0);
        this.type='standard'; this.level=1; this.state='ACTIVE'; this.lastShot=0; this.sleepTimer=0;
        this.route=[]; this.routePos=0;
        this.mesh=createWizardMesh(team,this.type,this.level); this.mesh.position.set(x,0,z);
        this.mesh.userData={entity:this}; scene.add(this.mesh);
    }
    takeDamage(amount, attackerTeam) {
        if (this.state !== 'ACTIVE' && this.state !== 'SLEEPING') return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp=0;
            if(attackerTeam==='player' && this.team==='enemy'){const r=Math.max(1,Math.round(35*goldRewardRate));gold+=r;updateHUD();createFloatingGoldText(this.mesh.position.x,2.5,this.mesh.position.z,`+${r}g`);}
            this.triggerRecovery();
        }
    }
    putToSleep(seconds=8) {
        if(this.state!=='ACTIVE') return false;
        this.state='SLEEPING'; this.sleepTimer=seconds;
        const cage=new THREE.Group(); cage.userData.disruptionCage=true;
        const mat=new THREE.MeshBasicMaterial({color:0xa855f7,transparent:true,opacity:.72});
        for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(1.05,.08,8,24),mat);ring.rotation.x=Math.PI/2;ring.position.y=.45+i*.65;cage.add(ring);}
        const icon=createTextSprite('💤 DISRUPTED','#c084fc'); icon.position.y=3.4; icon.scale.set(4.8,1.3,1); cage.add(icon);
        this.mesh.add(cage); this.mesh.traverse(o=>{if(o.material&&o.material.emissive)o.material.emissive.setHex(0x4c1d95);});
        playSound('disrupt'); createFloatingGoldText(this.mesh.position.x,3,this.mesh.position.z,'💤 DISRUPTED'); return true;
    }
    buildRoute(toBase) {
        const nearest=nearestPathIndex(this.homeX,this.homeZ);
        const baseIdx=this.team==='player'?0:pathNodes.length-1;
        const indexes=[];
        if(toBase){
            indexes.push(nearest);
            const step=baseIdx>nearest?1:-1;
            for(let i=nearest+step; step>0?i<=baseIdx:i>=baseIdx; i+=step) indexes.push(i);
        } else {
            const step=nearest>baseIdx?1:-1;
            for(let i=baseIdx+step; step>0?i<=nearest:i>=nearest; i+=step) indexes.push(i);
        }
        this.route=indexes.map(i=>({x:pathNodes[i].x,z:pathNodes[i].z}));
        if(!toBase) this.route.push({x:this.homeX,z:this.homeZ});
        this.routePos=0;
    }
    triggerRecovery() {
        const base=this.team==='player'?playerBasePos:enemyBasePos;
        if(this.level>=4){
            this.mesh.position.set(base.x,0,base.z); this.hp=this.maxHp; this.state='RETURNING';
            this.buildRoute(false); createFloatingGoldText(base.x,3.5,base.z,'✨ Teleport!');
        } else { this.state='RETREATING'; this.buildRoute(true); }
    }
    healNow() {
        this.hp=this.maxHp; this.sleepTimer=0;
        if(this.state==='SLEEPING') this.state='ACTIVE';
        const cage=this.mesh.children.find(c=>c.userData&&c.userData.disruptionCage); if(cage)this.mesh.remove(cage);
        this.mesh.rotation.z=0; playSound('heal');
        createFloatingGoldText(this.mesh.position.x,3,this.mesh.position.z,'💚 Healed');
    }
    specialize(type){this.type=type;this.level=2;this.rebuildMesh();}
    upgradeSwift(){this.level=3;this.rebuildMesh();}
    upgradeTeleport(){this.level=4;this.rebuildMesh();}
    rebuildMesh(){
        const pos=this.mesh.position.clone(); scene.remove(this.mesh); this.mesh=createWizardMesh(this.team,this.type,this.level);
        this.mesh.position.copy(pos); this.mesh.userData={entity:this}; scene.add(this.mesh);
    }
    update(dt) {
        const t=performance.now()*0.001, parts=this.mesh.userData.parts;
        if(parts){parts.staffGroup.rotation.z=Math.sin(t*2.1+this.homeX)*0.045;parts.crystal.rotation.y+=dt*0.0025;parts.hat.rotation.y=Math.sin(t*1.3+this.homeZ)*0.04;}
        const teleRing=this.mesh.children.find(c=>c.userData&&c.userData.teleRing); if(teleRing) teleRing.rotation.z+=dt*0.0018;
        if(this.state==='SLEEPING'){
            this.sleepTimer-=dt/1000; this.mesh.rotation.z=Math.sin(t*2)*0.08;
            if(this.sleepTimer<=0){this.state='ACTIVE';this.mesh.rotation.z=0;const cage=this.mesh.children.find(c=>c.userData&&c.userData.disruptionCage);if(cage)this.mesh.remove(cage);} else {const cage=this.mesh.children.find(c=>c.userData&&c.userData.disruptionCage);if(cage)cage.rotation.y+=dt*.003;}
            return;
        }
        // Deliberately slow at L1/L2. Swift Boots are a noticeable upgrade.
        const unitsPerSecond=this.level>=3?6.2:2.25;
        const moveAmount=unitsPerSecond*(dt/1000);
        if(this.state==='RETREATING'||this.state==='RETURNING'){
            const target=this.route[this.routePos];
            if(!target){
                if(this.state==='RETREATING'){this.hp=this.maxHp;this.state='RETURNING';this.buildRoute(false);}
                else this.state='ACTIVE';
                return;
            }
            if(this.moveTo(target.x,target.z,moveAmount)) this.routePos++;
            return;
        }
        const now=Date.now(), fireInterval=this.type==='fire'?900:1300;
        if(now-this.lastShot>fireInterval){
            const target=knights.find(k=>k.team!==this.team && Math.hypot(k.mesh.position.x-this.mesh.position.x,k.mesh.position.z-this.mesh.position.z)<this.range);
            if(target){projectiles.push(new ProjectileEntity(this.mesh.position.x,1.8,this.mesh.position.z,target,this.team,this.type));this.lastShot=now;}
        }
    }
    moveTo(tx,tz,speed){
        const dist=Math.hypot(tx-this.mesh.position.x,tz-this.mesh.position.z);
        if(dist<=speed){this.mesh.position.x=tx;this.mesh.position.z=tz;return true;}
        const angle=Math.atan2(tx-this.mesh.position.x,tz-this.mesh.position.z);
        this.mesh.position.x+=Math.sin(angle)*speed;this.mesh.position.z+=Math.cos(angle)*speed;this.mesh.rotation.y=angle;return false;
    }
    destroy(){scene.remove(this.mesh);}
}

class KnightEntity {
    constructor(team, isMega = false, unitType = 'knight') {
        this.team = team;
        this.unitType = unitType;
        this.isMega = isMega;
        this.pathIdx = team === 'player' ? 0 : pathNodes.length - 1;

        this.hp = unitType === 'disruptor' ? 30 : (isMega ? 160 : 15);
        this.maxHp = this.hp;
        this.speed = unitType === 'disruptor' ? 8.2 : (isMega ? 4.2 : 5.8);
        this.range = isMega ? 3.5 : 2.5;
        this.lastAttack = 0;
        this.slowTimer = 0;

        this.mesh = createKnightMesh(team, isMega);
        if (unitType === 'disruptor') { this.mesh.scale.multiplyScalar(0.85); this.mesh.traverse(o => { if(o.material && o.material.color) o.material.color.offsetHSL(0.12,0.15,0.05); }); }
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

        this.buffTimer=Math.max(0,(this.buffTimer||0)-dt/1000);this.drumBuff=Math.max(0,(this.drumBuff||0)-dt/1000);this.stunTimer=Math.max(0,(this.stunTimer||0)-dt/1000);let curSpeed=this.stunTimer>0?0:((this.slowTimer>0)?this.speed*.45:this.speed)*(this.buffTimer>0?1.45:1)*(this.drumBuff>0?1.3:1);

        let curX = this.mesh.position.x;
        let curZ = this.mesh.position.z;
        // Shinobis remain on the road and strike the first nearby eligible wizard.
        if (this.unitType === 'disruptor') {
            const target = wizards.find(w => w.team !== this.team && w.state === 'ACTIVE' && Math.hypot(w.mesh.position.x-curX,w.mesh.position.z-curZ) < 6.5);
            if (target && target.putToSleep(10)) {
                this.hp=0; burstParticles(target.mesh.position,0xa855f7,22); createFloatingGoldText(curX,2.5,curZ,'💥 Sacrifice'); return;
            }
        }

        // 1. Fight opposing knights
        let enemyK = this.unitType === 'disruptor' ? null : knights.find(k => k.team !== this.team && Math.hypot(k.mesh.position.x - curX, k.mesh.position.z - curZ) < (this.isMega ? 3.5 : 2.5));
        if (enemyK) {
            attacked = true;
            if (now - this.lastAttack > (this.isMega ? 800 : 1200)) {
                let dmg = this.isMega ? 35 : 15;
                enemyK.hp -= dmg; playSound('sword'); burstParticles(enemyK.mesh.position,0xffffff,6);
                if (enemyK.isMega) enemyK.updateHealthBar();
                this.lastAttack = now;
            }
        }

        // 2. Attack Wizards
        if (!attacked) {
            let enemyW = this.unitType === 'disruptor' ? null : wizards.find(w => w.team !== this.team && w.state === 'ACTIVE' && Math.hypot(w.mesh.position.x - curX, w.mesh.position.z - curZ) < 8.0);
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
                else playerHp = Math.max(0, playerHp - Math.max(1, dmgAmt - castleArmour));
                playSound('castle'); shakeAmount=Math.max(shakeAmount,this.isMega?1.2:.45); burstParticles((this.team==='player'?redCastle:blueCastle).position,0xf59e0b,this.isMega?28:12);
                this.reachedBase = true; // escaped units never award kill gold
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

            playSound(this.type==='fire'||this.type==='ice'?'magic':'impact'); burstParticles(this.mesh.position,this.type==='ice'?0x38bdf8:(this.type==='fire'?0xff4500:0xffffff),10);
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
    if(!gameActive) return;
    waveCount++;
    const level=CAMPAIGN_LEVELS[currentLevelIndex];
    waveInterval = Math.max(4.2, 8.4 - waveCount * 0.12);
    const batchSize=Math.min(5,2+Math.floor(waveCount/4));
    for(let i=0;i<batchSize;i++) setTimeout(()=>{
        if(level.role==='defend') knights.push(new KnightEntity('enemy',false,Math.random()<.16?'disruptor':'knight'));
        else knights.push(new KnightEntity('player',false,'knight'));
        if(level.role==='attack' && Math.random()<.72) knights.push(new KnightEntity('enemy',false,'knight'));
        if(waveCount===level.waves && i===batchSize-1) knights.push(new BossEntity(level.role==='defend'?'enemy':'enemy',level.bossType));
    },i*420);
}

setInterval(() => {
    if(!gameActive)return; const level=CAMPAIGN_LEVELS[currentLevelIndex];
    if (level.role !== 'defend' && Math.random() < 0.12 + level.difficulty*.05) {
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

    if (Math.random() < 0.15) knights.push(new KnightEntity('enemy', true));
    if (waveCount >= 3 && Math.random() < 0.18) knights.push(new KnightEntity('enemy', false, 'disruptor'));
}, 4500);



// --- 8. UI HANDLERS ---
function updateHUD() {
    document.getElementById('gold').innerText = gold;
    document.getElementById('playerHp').innerText = playerHp;
    document.getElementById('enemyHp').innerText = enemyHp;
    document.getElementById('playerHpFill').style.width = (playerHp/playerCastleMaxHp*100) + '%';
    document.getElementById('enemyHpFill').style.width = (enemyHp/enemyCastleMaxHp*100) + '%';
    const waveEl = document.getElementById('wave');
    if (waveEl) waveEl.innerText = waveCount;
    const charge=document.getElementById('spellCharge'); if(charge) charge.innerText=Math.floor(spellCharge);
    const fill=document.getElementById('spellChargeFill'); if(fill) fill.style.width=(spellCharge/maxSpellCharge*100)+'%';
    document.getElementById('btn-spellbook').style.setProperty('--charge',(spellCharge/maxSpellCharge*100)+'%');
    const streak=document.getElementById('readingStreak'); if(streak) streak.innerText=readingStreak;
    const rallyBtn=document.getElementById('btn-spellbook');
    rallyBtn.disabled = spellCharge < maxSpellCharge;
    rallyBtn.classList.toggle('ready', spellCharge >= maxSpellCharge);
    if (spellCharge >= maxSpellCharge && !readySoundPlayed) { readySoundPlayed=true; playSound('ready'); }
    if (spellCharge < maxSpellCharge) readySoundPlayed=false;
    const nextWave=document.getElementById('wave-countdown');
    if(nextWave){const left=Math.max(0,Math.ceil(WAVE_COUNTDOWN_SECONDS-waveTimer));nextWave.textContent=waveCount>=CAMPAIGN_LEVELS[currentLevelIndex].waves?'FINAL WAVE':`Next ${left}s`;nextWave.classList.toggle('urgent',left<=3&&waveCount<CAMPAIGN_LEVELS[currentLevelIndex].waves);}
    document.body.classList.toggle('low-health', playerHp/playerCastleMaxHp <= .3);
    document.querySelectorAll('#build-panel button[data-cost]').forEach(b=>b.classList.toggle('cannot-afford',gold<Number(b.dataset.cost)));
    const rallyLevel=document.getElementById('rally-level'); if(rallyLevel) rallyLevel.textContent=`Lv${kotobaLevel} · ${2+kotobaLevel} Bushi`;
    const stars=document.getElementById('starsTotal');if(stars)stars.textContent=Object.values(campaignSave.stars).reduce((a,b)=>a+b,0);
}

document.getElementById('btn-knight').onclick = () => {
    if (gold >= 80) {
        gold -= 80;
        knights.push(new KnightEntity('player', true, 'onna'));
        updateHUD();
    } else {
        showBattleText('You need 80 gold for an Onna-Musha.');
    }
};

document.getElementById('btn-wizard').onclick = () => {
    mode = mode === 'BUILD_WIZARD' ? 'PLAY' : 'BUILD_WIZARD';
    const btn = document.getElementById('btn-wizard');
    btn.innerText = mode === 'BUILD_WIZARD' ? "❌ Cancel Build" : "🧙 Build Wizard (50g)";
    btn.classList.toggle('btn-active', mode === 'BUILD_WIZARD');
};

function castReadingSpell(qObj) {
    const count = Math.min(5, 2 + kotobaLevel);
    for (let i=0; i<count; i++) {
        setTimeout(() => knights.push(new KnightEntity('player', false, 'knight')), i * 320);
    }
    const reward = Math.max(1, Math.round(8 * qObj.difficulty * goldRewardRate));
    gold += reward;
    if (readingStreak > 0 && readingStreak % 5 === 0) {
        setTimeout(() => knights.push(new KnightEntity('player', true, 'onna')), count * 320);
        showBattleText('🔥 Five-answer streak: an Onna-Musha joins the rally!');
    } else {
        showBattleText(`⛩ Kotoba Rally summoned ${count} Bushi!`);
    }
    createFloatingGoldText(0, 8, 0, `ことば +${count} Bushi · +${reward}g`);
    updateHUD();
}

document.getElementById('btn-spellbook').onclick = () => {
    if(spellCharge<maxSpellCharge){showBattleText('Kotoba Rally is still charging.');return;}
    spellCharge=0; {const pool=questions.filter(q=>q.difficulty<=CAMPAIGN_LEVELS[currentLevelIndex].difficulty);currentQuestion=pool[Math.floor(Math.random()*pool.length)];}; updateHUD();
    const modal=document.getElementById('spellbook-modal');
    document.getElementById('spell-question').innerText=currentQuestion.q;
    document.getElementById('spell-reward').innerText=`Kotoba Rally Lv${kotobaLevel}: summon ${Math.min(5,2+kotobaLevel)} Bushi • Japanese ${currentQuestion.difficulty}`;
    const optsDiv=document.getElementById('spell-options'); optsDiv.innerHTML='';
    currentQuestion.opts.forEach(opt=>{
        const btn=document.createElement('button'); btn.className='word-opt'; btn.innerText=opt;
        btn.onclick=()=>{
            if(opt===currentQuestion.a){levelCorrect++;readingStreak++;playSound('magic');castReadingSpell(currentQuestion);modal.classList.add('hidden');updateHUD();}
            else {levelWrong++;readingStreak=0;btn.classList.add('wrong');btn.disabled=true;document.getElementById('spell-feedback').innerText='Not quite — try another answer.';updateHUD();}
        }; optsDiv.appendChild(btn);
    });
    document.getElementById('spell-feedback').innerText=''; modal.classList.remove('hidden');
};


document.getElementById('btn-disruptor').onclick = () => {
    if(gold>=55){gold-=55;knights.push(new KnightEntity('player',false,'disruptor'));updateHUD();}
    else showBattleText('Not enough gold for a Shinobi.');
};
document.getElementById('btn-heal').onclick = () => {
    if(gold<45){showBattleText('Not enough gold for Healing Light.');return;}
    mode = mode==='TARGET_HEAL'?'PLAY':'TARGET_HEAL';
    document.getElementById('btn-heal').classList.toggle('btn-active',mode==='TARGET_HEAL');
    showBattleText(mode==='TARGET_HEAL'?'💚 Click one injured or disrupted wizard.':'Healing cancelled.');
};
document.getElementById('btn-close-castle').onclick=()=>document.getElementById('castle-modal').classList.add('hidden');
function buyCastleUpgrade(cost, action, message){if(gold<cost){showBattleText('Not enough gold.');return;}gold-=cost;action();updateHUD();showBattleText(message);}
document.getElementById('btn-fortify').onclick=()=>buyCastleUpgrade(100,()=>{playerCastleMaxHp+=25;playerHp+=25;},'🏰 Castle maximum health increased!');
document.getElementById('btn-treasury').onclick=()=>buyCastleUpgrade(120,()=>goldIncome++,'💰 Treasury now earns more gold each second!');
document.getElementById('btn-arcane').onclick=()=>buyCastleUpgrade(110,()=>{playerWizardRangeBonus+=2;wizards.filter(w=>w.team==='player').forEach(w=>w.range+=2);},'🔮 Every player wizard gained +2 range!');
document.getElementById('btn-kotoba').onclick=()=>{if(kotobaLevel>=3){showBattleText('Kotoba Rally is already at maximum strength.');return;}buyCastleUpgrade(90+kotobaLevel*30,()=>kotobaLevel++,`⛩ Kotoba Rally upgraded — now summons ${Math.min(5,3+kotobaLevel)} Bushi!`);};
document.getElementById('btn-armour').onclick=()=>buyCastleUpgrade(90,()=>castleArmour=Math.min(6,castleArmour+2),'🧱 Incoming castle damage reduced!');

document.getElementById('btn-close-upgrade').onclick = () => {
    document.getElementById('upgrade-modal').classList.add('hidden');
    selectedWizard = null;
};

// Level 1 -> 2 Fire Specialization
document.getElementById('btn-upgrade-fire').onclick = () => {
    if (!selectedWizard) return;
    if (gold >= 80) {
        gold -= 80;
        selectedWizard.specialize('fire');
        updateHUD();
        openUpgradeModal(selectedWizard);
    } else alert("Not enough gold!");
};

// Level 1 -> 2 Ice Specialization
document.getElementById('btn-upgrade-ice').onclick = () => {
    if (!selectedWizard) return;
    if (gold >= 80) {
        gold -= 80;
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
const castleUpgradeIcon=document.getElementById('castle-hover-upgrade');
window.addEventListener('pointermove',e=>{if(!gameActive)return;mouse.x=e.clientX/window.innerWidth*2-1;mouse.y=-(e.clientY/window.innerHeight)*2+1;raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObject(blueCastle,true).length>0;castleUpgradeIcon.classList.toggle('visible',hit);if(hit){const v=blueCastle.position.clone().project(camera);castleUpgradeIcon.style.left=((v.x*.5+.5)*innerWidth)+'px';castleUpgradeIcon.style.top=((-v.y*.5+.5)*innerHeight-48)+'px';}});
castleUpgradeIcon.onclick=()=>document.getElementById('castle-modal').classList.remove('hidden');


window.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('#ui-layer') || e.target.closest('.modal')) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);



    if (mode === 'TARGET_HEAL') {
        const healMeshes=wizards.filter(w=>w.team==='player').map(w=>w.mesh);
        const hits=raycaster.intersectObjects(healMeshes,true);
        if(hits.length){let obj=hits[0].object;while(obj.parent&&!obj.userData.entity)obj=obj.parent;const wiz=obj.userData.entity;
            if(wiz&&(wiz.hp<wiz.maxHp||wiz.state==='SLEEPING')){gold-=45;wiz.healNow();mode='PLAY';document.getElementById('btn-heal').classList.remove('btn-active');updateHUD();}
            else showBattleText('That wizard does not need healing.');
        } return;
    }

    if(mode==='BUILD_TORII'||mode==='BUILD_ROPE'){const hits=raycaster.intersectObject(ground);if(hits.length){const p=hits[0].point;if(mode==='BUILD_TORII')placeTorii(p.x,p.z);else placeRope(p.x,p.z);}return;}
    if(mode==='BUILD_SOHEI'){const hits=raycaster.intersectObjects(slotMeshes);if(hits.length){const sd=hits[0].object.userData.slotData;if(sd&&sd.team==='player'&&!wizards.find(w=>w.homeX===sd.x&&w.homeZ===sd.z)){if(gold>=70){gold-=70;wizards.push(new SoheiEntity(sd.x,sd.z,'player'));mode='PLAY';updateHUD();}else showBattleText('A Sōhei costs 70 gold.');}}return;}

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

// --- AUDIO, PARTICLES & CAMPAIGN ---
let audioCtx=null, musicTimer=null;
function tone(freq,duration=.08,type='sine',volume=.035,delay=0){if(muteAudio)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),v=audioCtx.createGain();o.type=type;o.frequency.value=freq;v.gain.setValueAtTime(volume,audioCtx.currentTime+delay);v.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+delay+duration);o.connect(v);v.connect(audioCtx.destination);o.start(audioCtx.currentTime+delay);o.stop(audioCtx.currentTime+delay+duration);}catch(e){}}
function playSound(kind){const m={sword:[180,.06,'square'],impact:[110,.07,'triangle'],magic:[620,.14,'sine'],castle:[70,.24,'sawtooth'],disrupt:[240,.3,'square'],heal:[520,.28,'sine'],ready:[880,.18,'sine']}[kind];if(m)tone(...m);}
function startMusic(){clearInterval(musicTimer);let i=0;const notes=[196,247,294,247,220,262,330,262];musicTimer=setInterval(()=>{if(gameActive)tone(notes[i++%notes.length],.32,'triangle',.009)},430);}
function victoryMusic(){[523,659,784,1047].forEach((n,i)=>tone(n,.35,'sine',.045,i*.13));}
function createTextSprite(text,color='#fff'){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const x=cv.getContext('2d');x.font='900 46px Segoe UI';x.textAlign='center';x.fillStyle=color;x.strokeStyle='#111827';x.lineWidth=8;x.strokeText(text,256,78);x.fillText(text,256,78);return new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthTest:false}));}
const particles=[];
function burstParticles(pos,color,count=10){for(let i=0;i<count;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.12,5,5),new THREE.MeshBasicMaterial({color}));m.position.copy(pos);m.position.y+=1;scene.add(m);particles.push({mesh:m,v:new THREE.Vector3((Math.random()-.5)*8,Math.random()*7+2,(Math.random()-.5)*8),life:.65});}}
function clearEntities(){[...knights].forEach(x=>x.destroy());[...wizards].forEach(x=>x.destroy());[...projectiles].forEach(x=>scene.remove(x.mesh));knights.length=wizards.length=projectiles.length=0;}
function slotsForLevel(level){const left=level.slots.map(([x,z])=>({x,z,team:'player'}));const right=left.map(s=>({x:-s.x,z:s.z,team:'enemy'}));return [...left,...right];}
function loadLevel(index){currentLevelIndex=index;const L=CAMPAIGN_LEVELS[index];gameActive=true;clearEntities();clearStructures();pathNodes=L.path.map(([x,z])=>({x,z}));playerBasePos=pathNodes[0];enemyBasePos=pathNodes[pathNodes.length-1];wizardSlots=slotsForLevel(L).filter(s=>distanceToPath(s.x,s.z)>2.3 && (L.role!=='defend' || s.team==='player'));scene.remove(pathMeshGroup);pathMeshGroup=buildPathMesh();scene.add(pathMeshGroup);blueCastle.position.set(playerBasePos.x-3,0,playerBasePos.z);redCastle.position.set(enemyBasePos.x+3,0,enemyBasePos.z);ground.material.color.setHex(L.theme);refreshSlotMeshes();
const defending=L.role==='defend';document.body.classList.toggle('defend-mode',defending);redCastle.visible=!defending;makeSacredTreePairs();playerCastleMaxHp=120;enemyCastleMaxHp=160;playerHp=120;enemyHp=160;gold=85;goldIncome=0;castleArmour=0;playerWizardRangeBonus=0;waveCount=0;waveTimer=0;readingStreak=0;spellCharge=0;kotobaLevel=1;readySoundPlayed=false;levelCorrect=0;levelWrong=0;castleVisualLevel=0;applyCastleVisual();document.getElementById('campaign-modal').classList.add('hidden');document.getElementById('levelName').textContent=L.name;document.getElementById('missionRole').textContent=L.role==='defend'?'🛡 DEFEND':'⛩ ATTACK';document.getElementById('objectiveText').textContent=L.role==='defend'?'Protect Hana Palace':'Destroy the Yokai Palace';document.getElementById('waveGoal').textContent=L.waves;updateHUD();showBattleText('⏳ First wave arrives in 10 seconds — prepare your defence!');startMusic();}
function renderCampaign(){const grid=document.getElementById('level-grid');grid.innerHTML='';CAMPAIGN_LEVELS.forEach((L,i)=>{const b=document.createElement('button');const unlocked=i<campaignSave.unlocked;b.className='level-card'+(unlocked?'':' locked');const stars=campaignSave.stars[i]||0;b.innerHTML=`<strong>${L.name}</strong><span>${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</span><small>${L.role==='defend'?'🛡 Defend':'⛩ Attack'} · ${L.waves} waves · ${bossDisplayName(L.bossType)}</small>`;b.disabled=!unlocked;b.onclick=()=>loadLevel(i);grid.appendChild(b);});document.getElementById('starsTotal').textContent=Object.values(campaignSave.stars).reduce((a,b)=>a+b,0);}
function finishLevel(won){if(!gameActive)return;gameActive=false;const L=CAMPAIGN_LEVELS[currentLevelIndex];let stars=0;if(won){stars=1+(playerHp>=60?1:0)+(levelWrong===0?1:0);campaignSave.stars[currentLevelIndex]=Math.max(campaignSave.stars[currentLevelIndex]||0,stars);campaignSave.unlocked=Math.max(campaignSave.unlocked,Math.min(CAMPAIGN_LEVELS.length,currentLevelIndex+2));localStorage.setItem('yokaiSiegeCampaignV5',JSON.stringify(campaignSave));victoryMusic();}document.getElementById('result-title').textContent=won?'🏆 Battle Won!':'🏰 Castle Fallen';document.getElementById('result-stars').textContent=won?'⭐'.repeat(stars)+'☆'.repeat(3-stars):'Try again';document.getElementById('result-summary').textContent=`${L.name} · ${levelCorrect} correct answers · Castle ${playerHp}/${playerCastleMaxHp}`;document.getElementById('btn-next-level').style.display=won&&currentLevelIndex<CAMPAIGN_LEVELS.length-1?'flex':'none';document.getElementById('result-modal').classList.remove('hidden');
}

// --- V5 JAPANESE FOLKLORE SYSTEMS ---
let structures=[], sacredTrees=[], castleVisualLevel=0;
function bossDisplayName(t){return t==='gashadokuro'?'Gashadokuro':t==='namazu'?'Namazu':'Yamata no Orochi';}
function clearStructures(){structures.forEach(s=>{if(s.mesh)scene.remove(s.mesh);if(s.a)scene.remove(s.a);if(s.b)scene.remove(s.b)});structures=[];sacredTrees.forEach(t=>scene.remove(t));sacredTrees=[];}
function makeToriiMesh(team='player'){const q=new THREE.Group(),teamMat=mat(team==='player'?0x167bb6:0xba2c32,.55,.25),black=mat(0x231815,.8);q.add(mesh(new THREE.BoxGeometry(.45,4,.45),teamMat,-1.4,2,0),mesh(new THREE.BoxGeometry(.45,4,.45),teamMat,1.4,2,0));q.add(mesh(new THREE.BoxGeometry(4,.38,.5),teamMat,0,4,0),mesh(new THREE.BoxGeometry(3.3,.28,.42),black,0,3.45,0));return q;}
function makeTree(x,z){const t=new THREE.Group();t.add(mesh(new THREE.CylinderGeometry(.22,.32,2.6,8),mat(0x684126,.95),0,1.3,0));for(let i=0;i<5;i++)t.add(mesh(new THREE.SphereGeometry(.65,8,6),mat(0xf59bb5,.8),Math.sin(i*1.4)*.7,2.7+Math.cos(i)*.3,Math.cos(i*1.4)*.7));t.position.set(x,0,z);scene.add(t);sacredTrees.push(t);return t;}
function makeSacredTreePairs(){for(let i=1;i<pathNodes.length-1;i+=3){const a=pathNodes[i-1],b=pathNodes[i],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;makeTree(b.x+nx*4,b.z+nz*4);makeTree(b.x-nx*4,b.z-nz*4);}}
function nearestPathPoint(x,z){let best={x:pathNodes[0].x,z:pathNodes[0].z,d:1e9};for(let i=0;i<pathNodes.length-1;i++){const a=pathNodes[i],b=pathNodes[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),px=a.x+t*dx,pz=a.z+t*dz,d=Math.hypot(x-px,z-pz);if(d<best.d)best={x:px,z:pz,d};}return best;}
function placeTorii(x,z){const p=nearestPathPoint(x,z);if(p.d>3){showBattleText('Place Torii Gates directly on the road.');return}if(gold<40){showBattleText('A Torii Gate costs 40 gold.');return}gold-=40;const m=makeToriiMesh('player');m.position.set(p.x,0,p.z);scene.add(m);structures.push({type:'torii',mesh:m,x:p.x,z:p.z,life:30});mode='PLAY';updateHUD();}
function placeRope(x,z){const p=nearestPathPoint(x,z);if(p.d>3){showBattleText('Stretch the shimenawa across a road near paired trees.');return}if(gold<50){showBattleText('Shimenawa costs 50 gold.');return}gold-=50;const rope=mesh(new THREE.TorusGeometry(2.8,.08,6,24,Math.PI),mat(0xe7d5a0,.9),p.x,.8,p.z);rope.rotation.x=Math.PI/2;scene.add(rope);structures.push({type:'rope',mesh:rope,x:p.x,z:p.z,armed:true,active:0});mode='PLAY';updateHUD();}
function updateStructures(dt){for(let i=structures.length-1;i>=0;i--){const s=structures[i];if(s.type==='torii'){s.life-=dt/1000;s.mesh.rotation.y=Math.sin(performance.now()*.001)*.03;knights.filter(k=>k.team==='player'&&Math.hypot(k.mesh.position.x-s.x,k.mesh.position.z-s.z)<2.4).forEach(k=>k.buffTimer=Math.max(k.buffTimer||0,5));if(s.life<=0){scene.remove(s.mesh);structures.splice(i,1)}}else{if(s.active>0)s.active-=dt/1000;const target=knights.find(k=>k.team==='enemy'&&Math.hypot(k.mesh.position.x-s.x,k.mesh.position.z-s.z)<2.5);if(target&&(s.armed||s.active>0)){target.stunTimer=Math.max(target.stunTimer||0,3);if(s.armed){s.armed=false;s.active=5;burstParticles(s.mesh.position,0xfff1b8,18);}}}}
}

createKnightMesh = function(team,isMega=false){
 const g=new THREE.Group(),ally=team==='player';const lacquer=mat(ally?0x174f78:0x8d2831,.5,.35),cloth=mat(ally?0x263f57:0x4a2025,.8),goldM=mat(0xd9aa3d,.32,.6),skin=mat(0xe8b184,.8),dark=mat(0x171717,.7);
 const torso=mesh(new THREE.CylinderGeometry(.48,.62,1.05,10),cloth,0,1,0);g.add(torso);
 for(let y=.7;y<1.5;y+=.24){const plate=mesh(new THREE.BoxGeometry(1.1,.18,.62),lacquer,0,y,.05);g.add(plate)}
 const head=mesh(new THREE.SphereGeometry(.32,10,8),skin,0,1.75,0);g.add(head);
 const kabuto=mesh(new THREE.SphereGeometry(.43,10,6,0,Math.PI*2,0,Math.PI/1.7),lacquer,0,1.95,0);g.add(kabuto);
 const crest=mesh(new THREE.TorusGeometry(.3,.07,6,14,Math.PI),goldM,0,2.22,.02);crest.rotation.z=Math.PI;g.add(crest);
 const legs=[];for(const x of[-.22,.22]){const l=mesh(new THREE.CylinderGeometry(.13,.17,.65,7),dark,x,.3,0);g.add(l);legs.push(l)}
 const arms=[];for(const x of[-.58,.58]){const a=new THREE.Group();a.position.set(x,1.2,0);a.add(mesh(new THREE.CylinderGeometry(.13,.17,.72,7),lacquer,0,-.25,0));g.add(a);arms.push(a)}
 if(isMega){const shaft=mesh(new THREE.CylinderGeometry(.055,.055,3.3,7),dark,.85,1.25,.1);shaft.rotation.z=-.24;g.add(shaft);const blade=mesh(new THREE.BoxGeometry(.16,1.15,.12),goldM,1.2,2.55,.1);blade.rotation.z=-.24;g.add(blade);g.scale.setScalar(1.55);const hair=mesh(new THREE.SphereGeometry(.34,9,7),dark,0,1.83,-.25);g.add(hair)}else{const katana=mesh(new THREE.BoxGeometry(.09,1.45,.13),goldM,.62,.9,.15);katana.rotation.z=-.45;g.add(katana)}
 g.userData.parts={leftArm:arms[0],rightArm:arms[1],leftLeg:legs[0],rightLeg:legs[1],plume:crest};return g;
};
createWizardMesh = function(team,type='standard',level=1){
 const g=new THREE.Group(),ally=team==='player';let c=ally?0xeee4d2:0x512f47,accent=ally?0x345b8a:0xa43b32;if(type==='fire'){c=0xe8c58f;accent=0xc53d21}if(type==='ice'){c=0xd8edf2;accent=0x3b8eaa}
 const robe=mesh(new THREE.ConeGeometry(.72,1.65,12),mat(c,.8),0,.82,0);g.add(robe);const sash=mesh(new THREE.CylinderGeometry(.55,.55,.15,10),mat(accent,.55),0,1.05,0);g.add(sash);const head=mesh(new THREE.SphereGeometry(.3,10,8),mat(0xe8b184,.8),0,1.7,0);g.add(head);const cap=mesh(new THREE.CylinderGeometry(.34,.42,.32,10),mat(0x161616,.72),0,1.98,0);g.add(cap);const staffGroup=new THREE.Group();staffGroup.position.set(.62,1.05,.1);staffGroup.add(mesh(new THREE.CylinderGeometry(.045,.055,2.2,7),mat(0x5b3823,.9),0,0,0));const crystal=mesh(new THREE.OctahedronGeometry(.24),mat(accent,.25,.1,accent),0,1.15,0);staffGroup.add(crystal);g.add(staffGroup);const paper=mesh(new THREE.BoxGeometry(.45,.7,.03),mat(0xfff4d7,.95),-.45,1.25,.45);g.add(paper);g.userData.parts={staffGroup,crystal,hat:cap};return g;
};
function addPagodaDetails(castle,ally){if(castle.userData.pagoda)return;castle.userData.pagoda=true;const white=mat(0xf4ead5,.85),roof=mat(ally?0x234f75:0x7d2b32,.48,.15),wood=mat(0x5b2c20,.8);for(let i=0;i<3;i++){const y=5+i*1.35,s=3.8-i*.75;castle.add(mesh(new THREE.BoxGeometry(s,1,s),white,0,y,0));const r=mesh(new THREE.CylinderGeometry(s*.78,s*.98,.35,4),roof,0,y+.65,0);r.rotation.y=Math.PI/4;castle.add(r)}castle.add(mesh(new THREE.CylinderGeometry(.08,.08,2,8),wood,0,9.4,0));}
addPagodaDetails(blueCastle,true);addPagodaDetails(redCastle,false);
function createSoheiMesh(team){const g=createWizardMesh(team,'standard',1);g.traverse(o=>{if(o.material&&o.material.color)o.material.color.offsetHSL(.09,-.2,.08)});const drum=mesh(new THREE.CylinderGeometry(.55,.55,.55,16),mat(0x8b2d20,.7),-.75,1,0);drum.rotation.z=Math.PI/2;g.add(drum);g.userData.drum=drum;return g;}
class SoheiEntity extends WizardEntity{constructor(x,z,team){super(x,z,team);scene.remove(this.mesh);this.type='sohei';this.range=10;this.mesh=createSoheiMesh(team);this.mesh.position.set(x,0,z);this.mesh.userData={entity:this};scene.add(this.mesh)}update(dt){const t=performance.now()*.006;this.mesh.rotation.z=Math.sin(t)*.025;knights.filter(k=>k.team===this.team&&Math.hypot(k.mesh.position.x-this.mesh.position.x,k.mesh.position.z-this.mesh.position.z)<this.range).forEach(k=>k.drumBuff=.25);}}
function makeBossMesh(type){const g=new THREE.Group();if(type==='gashadokuro'){const bone=mat(0xe8dfc7,.85);g.add(mesh(new THREE.SphereGeometry(1.3,12,10),bone,0,5.2,0),mesh(new THREE.CylinderGeometry(.7,.9,4,8),bone,0,2.8,0));for(let i=-1;i<=1;i+=2){g.add(mesh(new THREE.CylinderGeometry(.25,.3,4,8),bone,i*.9,2,0));g.add(mesh(new THREE.CylinderGeometry(.2,.25,4.5,8),bone,i*1.35,3.3,0));}}else if(type==='namazu'){g.add(mesh(new THREE.SphereGeometry(2.1,16,10),mat(0x334b55,.75),0,1.8,0));g.scale.z=1.8;g.add(mesh(new THREE.ConeGeometry(.7,2,8),mat(0x526c75,.8),0,2.2,-3));}else{for(let i=0;i<8;i++){const a=(i-3.5)*.28;const neck=mesh(new THREE.CylinderGeometry(.28,.4,3.3,8),mat(0x2f7d4b,.65),Math.sin(a)*2,2.5,Math.cos(a)*1.2);neck.rotation.z=a;g.add(neck);g.add(mesh(new THREE.SphereGeometry(.62,10,8),mat([0xb33a2d,0x5f9e47,0x5a8cc8,0x7fcce0][i%4],.55),Math.sin(a)*3,4,Math.cos(a)*1.8));}g.add(mesh(new THREE.SphereGeometry(1.4,12,10),mat(0x356d3f,.65),0,1.3,0));}return g;}
class BossEntity extends KnightEntity{constructor(team,type){super(team,true,'boss');scene.remove(this.mesh);this.bossType=type;this.hp=type==='orochi'?520:380;this.maxHp=this.hp;this.speed=type==='gashadokuro'?1.35:type==='namazu'?1.7:1.5;this.mesh=makeBossMesh(type);this.mesh.position.copy(pathNodes[this.pathIdx]);scene.add(this.mesh);const sm=new THREE.SpriteMaterial({map:createHealthBarTexture(this.hp,this.maxHp),transparent:true});this.hpSprite=new THREE.Sprite(sm);this.hpSprite.position.set(0,6.5,0);this.hpSprite.scale.set(5,.7,1);this.mesh.add(this.hpSprite);this.abilityClock=0;}update(dt){this.abilityClock+=dt/1000;if(this.bossType==='namazu'&&this.abilityClock>5){this.abilityClock=0;wizards.filter(w=>Math.hypot(w.mesh.position.x-this.mesh.position.x,w.mesh.position.z-this.mesh.position.z)<12).forEach(w=>w.putToSleep(3));shakeAmount=1.5;showBattleText('🌊 Namazu shakes the earth — nearby towers are stunned!');}if(this.bossType==='gashadokuro'){wizards.filter(w=>w.state==='ACTIVE'&&Math.hypot(w.mesh.position.x-this.mesh.position.x,w.mesh.position.z-this.mesh.position.z)<2.8).forEach(w=>w.putToSleep(6));}super.update(dt);}}
function applyCastleVisual(){[blueCastle,redCastle].forEach((c,ci)=>{c.scale.setScalar(1+castleVisualLevel*.08);c.traverse(o=>{if(o.material&&o.material.color&&castleVisualLevel>0&&ci===0)o.material.emissive&&o.material.emissive.setHex(castleVisualLevel>2?0x402000:0x101010)});});}
['btn-fortify','btn-armour','btn-treasury','btn-arcane','btn-kotoba'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{castleVisualLevel=Math.min(4,castleVisualLevel+1);applyCastleVisual();}));
document.getElementById('btn-sohei').onclick=()=>{mode=mode==='BUILD_SOHEI'?'PLAY':'BUILD_SOHEI';showBattleText(mode==='BUILD_SOHEI'?'Choose a tower circle for your Sōhei.':'Placement cancelled.');};
document.getElementById('btn-torii').onclick=()=>{mode=mode==='BUILD_TORII'?'PLAY':'BUILD_TORII';showBattleText('Click directly on the path to place a 30-second Torii Gate.');};
document.getElementById('btn-rope').onclick=()=>{mode=mode==='BUILD_ROPE'?'PLAY':'BUILD_ROPE';showBattleText('Click a path crossing between sacred cherry trees.');};
document.getElementById('btn-next-level').onclick=()=>{document.getElementById('result-modal').classList.add('hidden');loadLevel(Math.min(currentLevelIndex+1,CAMPAIGN_LEVELS.length-1));};
document.getElementById('btn-level-select').onclick=()=>{document.getElementById('result-modal').classList.add('hidden');document.getElementById('campaign-modal').classList.remove('hidden');renderCampaign();};
// V5.1 controls, tooltips and economy tuning
const speedButton=document.getElementById('btn-speed');
const pauseButton=document.getElementById('btn-pause');
speedButton.onclick=()=>{timeScale=timeScale===1?2:1;speedButton.textContent=timeScale===2?'1×':'2×';speedButton.classList.toggle('active',timeScale===2);showBattleText(`Battle speed: ${timeScale}×`);};
pauseButton.onclick=()=>{paused=!paused;pauseButton.textContent=paused?'▶':'Ⅱ';pauseButton.classList.toggle('active',paused);showBattleText(paused?'Battle paused.':'Battle resumed.');};
const goldSlider=document.getElementById('gold-rate'),goldLabel=document.getElementById('gold-rate-value');
goldSlider.value=String(Math.round(goldRewardRate*100));goldLabel.textContent=goldSlider.value+'%';
goldSlider.addEventListener('input',()=>{goldRewardRate=Number(goldSlider.value)/100;goldLabel.textContent=goldSlider.value+'%';localStorage.setItem('yokaiGoldRewardRate',goldSlider.value);});
const buildTooltip=document.getElementById('build-tooltip');
document.querySelectorAll('#build-panel button[data-tip]').forEach(b=>{b.addEventListener('mouseenter',()=>buildTooltip.textContent=b.dataset.tip);b.addEventListener('focus',()=>buildTooltip.textContent=b.dataset.tip);});

// V5.2 quality-of-life improvements
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&mode!=='PLAY'){mode='PLAY';showBattleText('Placement cancelled.');}});
window.addEventListener('contextmenu',e=>{if(mode!=='PLAY'){e.preventDefault();mode='PLAY';showBattleText('Placement cancelled.');}});
const muteButton=document.getElementById('btn-mute');
muteButton.textContent=muteAudio?'🔇':'🔊';
muteButton.onclick=()=>{muteAudio=!muteAudio;localStorage.setItem('yokaiMuteAudio',muteAudio?'1':'0');muteButton.textContent=muteAudio?'🔇':'🔊';showBattleText(muteAudio?'Sound muted.':'Sound enabled.');};

renderCampaign();

// --- 10. ANIMATION & GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);

    let now = Date.now();
    let rawDt = Math.min(100, now - lastTime);
    lastTime = now;
    let dt = paused ? 0 : rawDt * timeScale;

    if(gameActive){
      spellCharge=Math.min(maxSpellCharge,spellCharge+(dt/1000)*4);
      incomeClock+=dt/1000;if(goldIncome>0&&incomeClock>=5){incomeClock=0;gold+=Math.max(1,Math.round(goldIncome*goldRewardRate));updateHUD();}
      waveTimer += dt / 1000;
      const goal=CAMPAIGN_LEVELS[currentLevelIndex].waves;
      if (waveTimer >= WAVE_COUNTDOWN_SECONDS && waveCount < goal) { waveTimer = 0; triggerKnightWave(); }
    }

    updateStructures(dt);
    wizards.forEach(w => w.update(dt));

    for (let i = knights.length - 1; i >= 0; i--) {
        let k = knights[i];
        k.update(dt);
        if (k.hp <= 0) {
            if (k.team === 'enemy' && !k.reachedBase) {
                let reward = Math.max(1,Math.round((k.isMega ? 34 : (k.unitType==='disruptor'?15:10))*goldRewardRate));
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

    if (playerHp <= 0) finishLevel(false);
    const goal=CAMPAIGN_LEVELS[currentLevelIndex].waves;
    if (gameActive && CAMPAIGN_LEVELS[currentLevelIndex].role==='attack' && enemyHp<=0) finishLevel(true);
    // A battle also ends after the final wave has been cleared.
    if (gameActive && CAMPAIGN_LEVELS[currentLevelIndex].role==='defend' && waveCount>=goal && knights.filter(k=>k.team==='enemy').length===0 && waveTimer>2) finishLevel(true);
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt/1000;p.v.y-=12*dt/1000;p.mesh.position.addScaledVector(p.v,dt/1000);p.mesh.material.opacity=Math.max(0,p.life/.65);p.mesh.material.transparent=true;if(p.life<=0){scene.remove(p.mesh);particles.splice(i,1);}}
    if(shakeAmount>0){camera.position.x=(Math.random()-.5)*shakeAmount;camera.position.y=66+(Math.random()-.5)*shakeAmount;camera.position.z=62+(Math.random()-.5)*shakeAmount;shakeAmount*=.86;}else{camera.position.x=0;camera.position.y=66;camera.position.z=62;} camera.lookAt(0,-3,0);

    const animationTime = performance.now();
    if (blueCastle.userData.animate) blueCastle.userData.animate(animationTime);
    if (redCastle.userData.animate) redCastle.userData.animate(animationTime + 500);

    renderer.render(scene, camera);
}

updateCameraViewport();
updateHUD();
requestAnimationFrame(animate);


// --- V5.3 MODEL OVERHAUL ---
document.getElementById('version-badge').textContent = 'V5.3';

function v53AddEye(group, x, y, z, size=0.04, color=0x111827) {
    const eye = mesh(new THREE.SphereGeometry(size, 6, 6), new THREE.MeshBasicMaterial({ color }), x, y, z);
    eye.castShadow = false;
    group.add(eye);
}
function v53AddBrow(group, x, y, z, rot=0) {
    const brow = mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), mat(0x2a1b16, 1), x, y, z);
    brow.rotation.z = rot;
    group.add(brow);
}
function v53Katana(group, x, y, z, team='player') {
    const handle = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.9, 7), mat(0x3a2318, .9), x, y, z);
    handle.rotation.z = -0.15;
    group.add(handle);
    const guard = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 10), mat(0xe2b950, .4, .7), x+0.05, y+0.34, z);
    guard.rotation.x = Math.PI/2;
    guard.rotation.z = -0.15;
    group.add(guard);
    const blade = mesh(new THREE.BoxGeometry(0.08, 1.18, 0.08), mat(0xd9e3ea, .2, .85), x+0.12, y+0.88, z+0.02);
    blade.rotation.z = -0.36;
    group.add(blade);
    const tip = mesh(new THREE.ConeGeometry(0.05, 0.18, 6), mat(0xd9e3ea, .2, .85), x+0.33, y+1.39, z+0.02);
    tip.rotation.z = -0.36;
    group.add(tip);
    return { handle, blade };
}
function v53Naginata(group, x, y, z) {
    const shaft = mesh(new THREE.CylinderGeometry(0.05, 0.055, 3.2, 8), mat(0x5b3625, .95), x, y, z);
    shaft.rotation.z = -0.22;
    group.add(shaft);
    const collar = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), mat(0xe4ba5b, .4, .6), x+0.27, y+1.45, z);
    collar.rotation.z = -0.22;
    group.add(collar);
    const blade = mesh(new THREE.BoxGeometry(0.13, 1.08, 0.09), mat(0xe3edf3, .2, .88), x+0.54, y+1.86, z+0.03);
    blade.rotation.z = -0.24;
    group.add(blade);
    const hook = mesh(new THREE.BoxGeometry(0.1, 0.28, 0.08), mat(0xe3edf3, .2, .88), x+0.68, y+2.28, z+0.03);
    hook.rotation.z = -0.65;
    group.add(hook);
    return { shaft, blade };
}
function v53BackBanner(parent, ally=true, large=false) {
    const pole = mesh(new THREE.CylinderGeometry(0.04,0.04,large?2.2:1.8,7), mat(0x473426,.9), 0, large?2.05:1.85, -0.34);
    parent.add(pole);
    const cloth = mesh(new THREE.BoxGeometry(large?0.7:0.55, large?0.92:0.72, 0.05), mat(ally?0x4aa4dc:0xd45163, .6), large?0.36:0.28, large?2.38:2.14, -0.34);
    cloth.userData.banner = true;
    parent.add(cloth);
    return cloth;
}

createKnightMesh = function(team, isMega = false) {
    const g = new THREE.Group();
    const ally = team === 'player';
    const lacquer = mat(ally ? 0x294d77 : 0x7f2937, 0.45, 0.38);
    const cloth = mat(ally ? 0x324a5f : 0x4a262f, 0.9);
    const silk = mat(ally ? 0x3ea2d5 : 0xd45163, 0.58);
    const goldM = mat(0xd9aa3d, 0.3, 0.68);
    const steel = mat(0xd9e2ea, 0.18, 0.86);
    const skin = mat(isMega ? 0xeab6a0 : 0xe2ab8e, 0.78);
    const dark = mat(0x191919, 0.75);
    const hair = mat(0x1f1414, 0.95);

    // torso and armour skirts
    const waist = mesh(new THREE.CylinderGeometry(isMega?0.62:0.5, isMega?0.72:0.6, isMega?1.2:1.05, 10), cloth, 0, 1.0, 0);
    g.add(waist);
    for (let i = 0; i < 4; i++) {
        const lamella = mesh(new THREE.BoxGeometry(isMega?1.26:1.02, 0.18, 0.62), lacquer, 0, 0.72 + i * 0.22, 0.06);
        g.add(lamella);
    }
    const chest = mesh(new THREE.BoxGeometry(isMega?1.18:0.96, isMega?0.88:0.72, 0.62), lacquer, 0, 1.34, 0.08);
    g.add(chest);
    g.add(mesh(new THREE.BoxGeometry(isMega?1.34:1.08, 0.12, 0.18), goldM, 0, 1.68, 0.36));
    g.add(mesh(new THREE.CylinderGeometry(isMega?0.58:0.48,isMega?0.58:0.48,0.12,10), goldM, 0, 0.77, 0));

    // head/helmet or onna-musha styling
    const head = mesh(new THREE.SphereGeometry(isMega?0.34:0.31, 10, 8), skin, 0, 1.92, 0.02);
    g.add(head);
    v53AddEye(g, -0.1, 1.95, 0.28, 0.038); v53AddEye(g, 0.1, 1.95, 0.28, 0.038);
    v53AddBrow(g, -0.1, 2.03, 0.24, -0.15); v53AddBrow(g, 0.1, 2.03, 0.24, 0.15);

    let flourish;
    if (isMega) {
        g.add(mesh(new THREE.SphereGeometry(0.39, 10, 8, 0, Math.PI*2, 0, Math.PI/1.65), mat(0x642226, .55, .2), 0, 2.1, 0));
        g.add(mesh(new THREE.BoxGeometry(0.7, 0.14, 0.38), goldM, 0, 2.22, 0.2));
        const ponyTail = mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.74, 7), hair, 0, 1.78, -0.28);
        ponyTail.rotation.x = 0.45;
        g.add(ponyTail);
        // hair side locks to read as Onna-Musha from distance
        g.add(mesh(new THREE.CylinderGeometry(0.05,0.07,0.44,6), hair, -0.24, 1.85, 0.05));
        g.add(mesh(new THREE.CylinderGeometry(0.05,0.07,0.44,6), hair, 0.24, 1.85, 0.05));
        flourish = ponyTail;
    } else {
        const kabuto = mesh(new THREE.SphereGeometry(0.42, 10, 7, 0, Math.PI*2, 0, Math.PI/1.7), lacquer, 0, 2.11, 0);
        g.add(kabuto);
        const neckGuard = mesh(new THREE.CylinderGeometry(0.34,0.44,0.2,10), lacquer, 0, 1.72, -0.08);
        g.add(neckGuard);
        const horns = mesh(new THREE.TorusGeometry(0.26,0.05,6,14,Math.PI), goldM, 0, 2.36, 0.05);
        horns.rotation.z = Math.PI;
        g.add(horns);
        flourish = horns;
    }

    const leftArm = new THREE.Group();
    leftArm.position.set(-(isMega?0.72:0.62), 1.38, 0);
    leftArm.add(mesh(new THREE.CylinderGeometry(0.13,0.17,0.8,8), lacquer, 0, -0.28, 0));
    const leftFore = mesh(new THREE.CylinderGeometry(0.1,0.13,0.62,8), cloth, 0.04, -0.72, 0.05); leftFore.rotation.z = 0.1; leftArm.add(leftFore);
    const shoulderL = mesh(new THREE.SphereGeometry(isMega?0.24:0.2, 8, 6), lacquer, 0.02, 0.03, 0); leftArm.add(shoulderL);
    g.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(isMega?0.72:0.62, 1.38, 0);
    rightArm.add(mesh(new THREE.CylinderGeometry(0.13,0.17,0.8,8), lacquer, 0, -0.28, 0));
    const rightFore = mesh(new THREE.CylinderGeometry(0.1,0.13,0.62,8), cloth, -0.04, -0.72, 0.05); rightFore.rotation.z = -0.1; rightArm.add(rightFore);
    const shoulderR = mesh(new THREE.SphereGeometry(isMega?0.24:0.2, 8, 6), lacquer, -0.02, 0.03, 0); rightArm.add(shoulderR);
    g.add(rightArm);

    let weaponMain;
    if (isMega) {
        weaponMain = v53Naginata(g, 1.08, 1.42, 0.03).blade;
        const ribbon = mesh(new THREE.BoxGeometry(0.1,0.52,0.03), silk, 0.34, 2.0, 0.12); ribbon.userData.banner = true; g.add(ribbon);
    } else {
        weaponMain = v53Katana(g, 0.72, 0.75, 0.12, team).blade;
    }

    const shield = mesh(new THREE.BoxGeometry(isMega?0.24:0.18, isMega?0.5:0.4, 0.08), goldM, -0.28, 1.12, 0.36);
    shield.rotation.z = 0.1;
    leftArm.add(shield);

    const leftLeg = new THREE.Group(); leftLeg.position.set(-(isMega?0.25:0.22), 0.6, 0);
    leftLeg.add(mesh(new THREE.CylinderGeometry(0.12,0.16,0.75,7), dark, 0, -0.14, 0));
    leftLeg.add(mesh(new THREE.BoxGeometry(0.24,0.14,0.42), dark, 0, -0.54, 0.08));
    const rightLeg = new THREE.Group(); rightLeg.position.set(isMega?0.25:0.22, 0.6, 0);
    rightLeg.add(mesh(new THREE.CylinderGeometry(0.12,0.16,0.75,7), dark, 0, -0.14, 0));
    rightLeg.add(mesh(new THREE.BoxGeometry(0.24,0.14,0.42), dark, 0, -0.54, 0.08));
    g.add(leftLeg, rightLeg);

    const banner = v53BackBanner(g, ally, isMega);
    if (isMega) {
        const aura = new THREE.PointLight(ally ? 0x56b7f1 : 0xffb267, 1.25, 5.5);
        aura.position.set(0, 1.8, 0);
        g.add(aura);
        g.scale.setScalar(1.52);
    }

    g.userData.parts = { leftArm, rightArm, leftLeg, rightLeg, plume: flourish, banner, weaponMain };
    return g;
};

createWizardMesh = function(team, type = 'standard', level = 1) {
    const g = new THREE.Group();
    const ally = team === 'player';
    let robe = ally ? 0xf0eadf : 0x5b3043;
    let accent = ally ? 0x2f5f92 : 0xa33b32;
    let spirit = 0xf3c85f;
    if (type === 'fire') { robe = 0xf0d7b4; accent = 0xc94c25; spirit = 0xff6a00; }
    if (type === 'ice') { robe = 0xddeff5; accent = 0x4b9fbd; spirit = 0x7fd9ff; }
    const robeMat = mat(robe, .78);
    const accentMat = mat(accent, .55, .18);
    const trimMat = mat(0xe1bf6a, .34, .56);
    const skin = mat(0xe4af8a, .82);
    const ink = mat(0x141414, .82);
    const wood = mat(0x6b442c, .92);
    const crystal = mat(spirit, .22, .08, spirit);
    crystal.emissiveIntensity = level >= 4 ? 1.5 : 1.0;

    const robeBody = mesh(new THREE.ConeGeometry(0.78, 1.78, 12), robeMat, 0, 0.86, 0); g.add(robeBody);
    const shoulder = mesh(new THREE.CylinderGeometry(0.56,0.62,0.32,10), accentMat, 0, 1.38, 0); g.add(shoulder);
    const sash = mesh(new THREE.CylinderGeometry(0.54,0.54,0.16,10), trimMat, 0, 1.02, 0); g.add(sash);
    const sleeveL = new THREE.Group(); sleeveL.position.set(-0.58, 1.22, 0); sleeveL.add(mesh(new THREE.BoxGeometry(0.46,0.7,0.48), robeMat, 0, -0.12, 0.02)); g.add(sleeveL);
    const sleeveR = new THREE.Group(); sleeveR.position.set(0.58, 1.22, 0); sleeveR.add(mesh(new THREE.BoxGeometry(0.46,0.7,0.48), robeMat, 0, -0.12, 0.02)); g.add(sleeveR);
    const head = mesh(new THREE.SphereGeometry(0.32, 10, 8), skin, 0, 1.82, 0); g.add(head);
    v53AddEye(g, -0.1, 1.86, 0.27, 0.034); v53AddEye(g, 0.1, 1.86, 0.27, 0.034);
    v53AddBrow(g, -0.1, 1.95, 0.23, -0.12); v53AddBrow(g, 0.1, 1.95, 0.23, 0.12);
    const mouth = mesh(new THREE.BoxGeometry(0.12,0.02,0.02), mat(0x8b4f41, 1), 0, 1.73, 0.3); g.add(mouth);
    const hat = mesh(new THREE.CylinderGeometry(0.2,0.32,0.92,7), ink, 0, 2.48, 0); g.add(hat);
    const talisman = mesh(new THREE.BoxGeometry(0.26,0.62,0.03), mat(0xfff6df,.98), 0, 2.06, 0.28); talisman.rotation.x = 0.1; g.add(talisman);
    const paperA = mesh(new THREE.BoxGeometry(0.22,0.42,0.03), mat(0xfff6df,.98), -0.42, 1.22, 0.52); paperA.rotation.z = -0.1; g.add(paperA);
    const paperB = mesh(new THREE.BoxGeometry(0.22,0.42,0.03), mat(0xfff6df,.98), 0.42, 1.05, 0.52); paperB.rotation.z = 0.12; g.add(paperB);
    const staffGroup = new THREE.Group();
    staffGroup.position.set(0.68, 1.18, 0.06);
    staffGroup.add(mesh(new THREE.CylinderGeometry(0.05,0.06,2.3,8), wood, 0, 0, 0));
    staffGroup.add(mesh(new THREE.BoxGeometry(0.24,0.08,0.08), trimMat, 0, 0.96, 0));
    const crystalObj = mesh(type==='fire'?new THREE.DodecahedronGeometry(0.26,0):new THREE.OctahedronGeometry(0.26,0), crystal, 0, 1.18, 0);
    staffGroup.add(crystalObj);
    const light = new THREE.PointLight(spirit, 1.1, 4); light.position.set(0,1.18,0); staffGroup.add(light);
    g.add(staffGroup);
    if (level >= 3) {
        const boot = mat(0xe0b84c, .38, .5);
        g.add(mesh(new THREE.BoxGeometry(0.28,0.18,0.48), boot, -0.24, 0.16, 0.06));
        g.add(mesh(new THREE.BoxGeometry(0.28,0.18,0.48), boot, 0.24, 0.16, 0.06));
    }
    if (level >= 4) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 8, 28), new THREE.MeshBasicMaterial({color:0xb669ff, transparent:true, opacity:.76}));
        ring.rotation.x = Math.PI/2; ring.position.y = 0.18; ring.userData.teleRing = true; g.add(ring);
    }
    g.userData.parts = { leftArm: sleeveL, rightArm: sleeveR, staffGroup, crystal: crystalObj, hat, papers:[paperA,paperB,talisman] };
    return g;
};

createSoheiMesh = function(team) {
    const g = new THREE.Group();
    const ally = team === 'player';
    const robeMat = mat(ally ? 0xb8854e : 0x7b5538, .85);
    const trimMat = mat(ally ? 0x305b91 : 0x8c2f3c, .58);
    const straw = mat(0xbe9d62, .95);
    const skin = mat(0xdfa77f, .82);
    const wood = mat(0x5f3923, .9);
    const dark = mat(0x251c18, .9);
    g.add(mesh(new THREE.ConeGeometry(0.82,1.75,12), robeMat, 0, 0.9, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.58,0.58,0.16,10), trimMat, 0, 1.03, 0));
    const head = mesh(new THREE.SphereGeometry(0.3,10,8), skin, 0, 1.82, 0); g.add(head);
    v53AddEye(g, -0.1, 1.86, 0.26, 0.035); v53AddEye(g, 0.1, 1.86, 0.26, 0.035);
    const hat = mesh(new THREE.CylinderGeometry(0.08,0.88,0.42,14), straw, 0, 2.12, 0); g.add(hat);
    const rim = mesh(new THREE.CylinderGeometry(0.95,0.95,0.05,16), straw, 0, 2.0, 0); g.add(rim);
    const beads = new THREE.Mesh(new THREE.TorusGeometry(0.22,0.03,6,18), mat(0x6b3d2e,.9)); beads.rotation.x = Math.PI/2; beads.position.set(0,1.55,0.25); g.add(beads);
    const leftArm = new THREE.Group(); leftArm.position.set(-0.55,1.25,0); leftArm.add(mesh(new THREE.CylinderGeometry(0.12,0.15,0.72,8), robeMat, 0, -0.24, 0)); g.add(leftArm);
    const rightArm = new THREE.Group(); rightArm.position.set(0.55,1.25,0); rightArm.add(mesh(new THREE.CylinderGeometry(0.12,0.15,0.72,8), robeMat, 0, -0.24, 0)); g.add(rightArm);
    const drum = mesh(new THREE.CylinderGeometry(0.58,0.58,0.62,16), mat(0x8b2d20,.7), -0.78, 1.0, 0); drum.rotation.z = Math.PI/2; g.add(drum);
    drum.add(mesh(new THREE.CylinderGeometry(0.42,0.42,0.64,16), mat(0xd9b787,.95), 0, 0, 0));
    const drumstickL = mesh(new THREE.CylinderGeometry(0.03,0.03,0.72,6), wood, -0.08, 1.05, 0.45); drumstickL.rotation.z = -0.85; g.add(drumstickL);
    const drumstickR = mesh(new THREE.CylinderGeometry(0.03,0.03,0.72,6), wood, 0.08, 1.15, 0.3); drumstickR.rotation.z = 0.55; g.add(drumstickR);
    const leftLeg = new THREE.Group(); leftLeg.position.set(-0.22,0.58,0); leftLeg.add(mesh(new THREE.CylinderGeometry(0.12,0.15,0.72,7), dark, 0, -0.16, 0)); g.add(leftLeg);
    const rightLeg = new THREE.Group(); rightLeg.position.set(0.22,0.58,0); rightLeg.add(mesh(new THREE.CylinderGeometry(0.12,0.15,0.72,7), dark, 0, -0.16, 0)); g.add(rightLeg);
    g.userData.parts = { leftArm, rightArm, leftLeg, rightLeg, drum, hat, plume: hat, drumstickL, drumstickR };
    return g;
};

makeTree = function(x, z) {
    const t = new THREE.Group();
    const trunk = mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.8, 8), mat(0x694128, .96), 0, 1.4, 0);
    t.add(trunk);
    for (let i = 0; i < 6; i++) {
        const bloom = mesh(new THREE.SphereGeometry(0.62 + (i%2)*0.09, 8, 6), mat(i%2?0xf1afc6:0xe9c3d8,.82), Math.sin(i*1.1)*0.8, 2.8 + Math.cos(i*1.3)*0.28, Math.cos(i*1.1)*0.8);
        t.add(bloom);
    }
    // Sacred rope hook markers for Shimenawa placement
    const postL = mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), mat(0x5c3321,.95), -0.62, 1.95, 0);
    const postR = mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), mat(0x5c3321,.95), 0.62, 1.95, 0);
    const rope = mesh(new THREE.CylinderGeometry(0.03,0.03,1.16,6), mat(0xecdba8,.92), 0, 2.08, 0); rope.rotation.z = Math.PI/2;
    t.add(postL, postR, rope);
    [-0.35, 0, 0.35].forEach((dx, idx) => {
        const paper = mesh(new THREE.BoxGeometry(0.08,0.18,0.02), mat(0xfff8e9,.98), dx, 1.9 - idx*0.04, 0.08);
        t.add(paper);
    });
    t.position.set(x,0,z);
    scene.add(t);
    sacredTrees.push(t);
    return t;
};
makeSacredTreePairs = function() {
    for (let i = 1; i < pathNodes.length - 1; i += 2) {
        const a = pathNodes[i-1], b = pathNodes[i];
        const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx,dz) || 1, nx = -dz/l, nz = dx/l;
        const midX = b.x, midZ = b.z;
        makeTree(midX + nx * 4.4, midZ + nz * 4.4);
        makeTree(midX - nx * 4.4, midZ - nz * 4.4);
        const marker = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.35, 24), new THREE.MeshBasicMaterial({color:0xf5deb3, side:THREE.DoubleSide, transparent:true, opacity:.35}));
        marker.rotation.x = -Math.PI/2; marker.position.set(midX,0.06,midZ);
        scene.add(marker); sacredTrees.push(marker);
    }
};

refreshSlotMeshes = function() {
    slotMeshes.forEach(m => scene.remove(m.parent || m));
    slotMeshes.length = 0;
    wizardSlots.forEach(s => {
        if (gameActive && CAMPAIGN_LEVELS[currentLevelIndex].role === 'defend' && s.team === 'enemy') return;
        const isPlayerSlot = s.team === 'player' || s.x < 0;
        const primary = isPlayerSlot ? 0x46a8dc : 0xd75b75;
        const secondary = isPlayerSlot ? 0x204f72 : 0x6c2433;
        const group = new THREE.Group();
        const base = mesh(new THREE.CylinderGeometry(1.15, 1.32, 0.18, 20), mat(0x8d9a93,.96), 0, 0.07, 0);
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.98, 28), new THREE.MeshBasicMaterial({ color: primary, side: THREE.DoubleSide, transparent: true, opacity: 0.8 }));
        ring.rotation.x = -Math.PI / 2;
        group.add(base, ring);
        [0, Math.PI/2, Math.PI, Math.PI*1.5].forEach(a => {
            const lantern = mesh(new THREE.BoxGeometry(0.12, 0.32, 0.12), mat(secondary,.8), Math.cos(a)*1.05, 0.22, Math.sin(a)*1.05);
            group.add(lantern);
        });
        const sigil = mesh(new THREE.CircleGeometry(0.28, 12), mat(primary,.55,.15), 0, 0.01, 0);
        sigil.rotation.x = -Math.PI/2;
        group.add(sigil);
        group.position.set(s.x, 0.05, s.z);
        group.userData = { isSlot:true, slotData:s };
        ring.userData = { isSlot:true, slotData:s };
        scene.add(group);
        slotMeshes.push(ring);
    });
};

function buildCastleStage(castle, ally, stage) {
    while (castle.children.length) castle.remove(castle.children[0]);
    const stone = mat(0xc8c2b5,.92), darkStone = mat(0x8d9098,.95), roof = mat(ally?0x234f75:0x7d2f38,.45,.16), wood = mat(0x5f3826,.9), gold = mat(0xdfb850,.3,.7), plaster = mat(0xf3ead8,.88);
    const flagMat = mat(ally?0x4ba8dd:0xd75a74,.58);
    // multi-tier base
    castle.add(mesh(new THREE.CylinderGeometry(4.7,5.2,0.7,16), darkStone, 0,0.35,0));
    castle.add(mesh(new THREE.CylinderGeometry(4.0,4.3,0.42,16), stone, 0,0.88,0));
    const mainW = 3.7 + stage*0.45;
    const keepH = 3.0 + stage*0.45;
    castle.add(mesh(new THREE.BoxGeometry(mainW, keepH, mainW), plaster, 0, 1.1 + keepH/2, 0));
    addBattlements(castle, mainW, mainW, 1.1 + keepH + 0.18, stone);
    // roof tier 1
    const roof1 = mesh(new THREE.CylinderGeometry(mainW*0.58, mainW*0.75, 0.3, 4), roof, 0, 1.4 + keepH, 0); roof1.rotation.y = Math.PI/4; castle.add(roof1);
    if (stage >= 1) {
        const upperW = mainW * 0.72;
        castle.add(mesh(new THREE.BoxGeometry(upperW, 1.55, upperW), plaster, 0, 3.15 + keepH/2, 0));
        const roof2 = mesh(new THREE.CylinderGeometry(upperW*0.6, upperW*0.78, 0.28, 4), roof, 0, 4.1 + keepH/2, 0); roof2.rotation.y = Math.PI/4; castle.add(roof2);
    }
    if (stage >= 2) {
        const topW = mainW * 0.46;
        castle.add(mesh(new THREE.BoxGeometry(topW, 1.15, topW), plaster, 0, 5.0 + keepH/2, 0));
        const roof3 = mesh(new THREE.CylinderGeometry(topW*0.62, topW*0.82, 0.24, 4), roof, 0, 5.72 + keepH/2, 0); roof3.rotation.y = Math.PI/4; castle.add(roof3);
        const finial = mesh(new THREE.CylinderGeometry(0.07,0.07,0.9,6), gold, 0, 6.22 + keepH/2, 0); castle.add(finial);
    }
    const towerPositions = [[-2.6,-2.6],[-2.6,2.6],[2.6,-2.6],[2.6,2.6]];
    const towerHeight = 4.4 + stage*0.35;
    towerPositions.forEach(([x,z]) => {
        castle.add(mesh(new THREE.CylinderGeometry(0.78,0.92,towerHeight,12), stone, x, towerHeight/2, z));
        castle.add(mesh(new THREE.CylinderGeometry(1.0,1.14,0.25,12), stone, x, towerHeight+0.1, z));
        const tRoof = mesh(new THREE.CylinderGeometry(0.95,1.22,0.38,4), roof, x, towerHeight+0.45, z); tRoof.rotation.y = Math.PI/4; castle.add(tRoof);
        if (stage >= 3) castle.add(mesh(new THREE.BoxGeometry(0.24,0.55,0.08), gold, x, towerHeight-0.6, z+0.82));
    });
    const gateFrame = mesh(new THREE.BoxGeometry(1.9,2.4,0.35), wood, 0,1.35, mainW/2+0.1); castle.add(gateFrame);
    const gate = mesh(new THREE.BoxGeometry(1.32,2.0,0.22), darkStone, 0,1.2, mainW/2+0.25); castle.add(gate);
    for (let x=-0.42;x<=0.42;x+=0.28) castle.add(mesh(new THREE.BoxGeometry(0.06,1.84,0.06), gold, x,1.2, mainW/2+0.34));
    // decorations
    if (stage >= 1) {
        castle.add(mesh(new THREE.BoxGeometry(0.4,0.7,0.4), gold, -1.35, 1.2, mainW/2+0.45));
        castle.add(mesh(new THREE.BoxGeometry(0.4,0.7,0.4), gold, 1.35, 1.2, mainW/2+0.45));
    }
    if (stage >= 2) {
        const shachiL = mesh(new THREE.ConeGeometry(0.16,0.6,6), gold, -0.8, 4.35 + keepH/2, 0.0); shachiL.rotation.z = 0.4;
        const shachiR = mesh(new THREE.ConeGeometry(0.16,0.6,6), gold, 0.8, 4.35 + keepH/2, 0.0); shachiR.rotation.z = -0.4;
        castle.add(shachiL, shachiR);
    }
    const pole = mesh(new THREE.CylinderGeometry(0.05,0.05,2.2 + stage*0.2,7), wood, 0, 3.6 + stage, -(mainW/2)-0.3); castle.add(pole);
    const flag = mesh(new THREE.BoxGeometry(1.15, 0.72, 0.05), flagMat, 0.56, 4.3 + stage, -(mainW/2)-0.3); flag.userData.banner = true; castle.add(flag);
    castle.userData.stage = stage;
    castle.userData.flag = flag;
    castle.userData.animate = (time) => { if (flag) flag.rotation.y = Math.sin(time*0.003) * 0.16; };
}
applyCastleVisual = function() {
    buildCastleStage(blueCastle, true, castleVisualLevel);
    buildCastleStage(redCastle, false, Math.max(1, Math.min(castleVisualLevel, 2)));
};
applyCastleVisual();
refreshSlotMeshes();

const _baseKnightUpdate = KnightEntity.prototype.update;
KnightEntity.prototype.update = function(dt) {
    if (this.unitType === 'disruptor' && !this.mesh.userData.shinobiDecor) {
        this.mesh.userData.shinobiDecor = true;
        this.mesh.traverse(o => { if (o.material && o.material.color) o.material.color.setHex(0x2c3141); });
        this.mesh.add(mesh(new THREE.CylinderGeometry(0.22,0.32,0.55,8), mat(0x171a23,.9), 0, 1.86, 0));
        this.mesh.add(mesh(new THREE.BoxGeometry(0.4,0.18,0.22), mat(0x171a23,.95), 0, 1.72, 0.25));
        this.mesh.add(mesh(new THREE.BoxGeometry(0.56,0.1,0.05), mat(0x6f7c9a,.7), 0.45, 1.02, 0.18));
        const scarfA = mesh(new THREE.BoxGeometry(0.1,0.48,0.04), mat(0x5c6ea2,.55), -0.12, 1.32, -0.28);
        const scarfB = mesh(new THREE.BoxGeometry(0.1,0.62,0.04), mat(0x5c6ea2,.55), 0.08, 1.25, -0.3);
        scarfA.userData.banner = true; scarfB.userData.banner = true;
        this.mesh.add(scarfA, scarfB);
        if (this.mesh.userData.parts) this.mesh.userData.parts.banner = scarfB;
    }
    _baseKnightUpdate.call(this, dt);
    const parts = this.mesh.userData.parts;
    if (parts) {
        const t = performance.now() * 0.01;
        if (parts.weaponMain) parts.weaponMain.rotation.z += Math.sin(t + this.pathIdx) * 0.002;
        if (parts.banner && parts.banner.userData.banner) parts.banner.rotation.y = Math.sin(t*0.6 + this.pathIdx) * 0.16;
        if (this.unitType === 'disruptor') {
            this.mesh.rotation.z = Math.sin(t + this.pathIdx) * 0.05;
            this.mesh.position.y += Math.abs(Math.sin(t*1.6)) * 0.01;
        }
    }
};

WizardEntity.prototype.update = function(dt) {
    const base = this.team === 'player' ? playerBasePos : enemyBasePos;
    const parts = this.mesh.userData.parts;
    const nowT = performance.now() * 0.01;
    if (parts) {
        if (parts.leftArm) parts.leftArm.rotation.z = Math.sin(nowT) * 0.08;
        if (parts.rightArm) parts.rightArm.rotation.z = -Math.sin(nowT*1.1) * 0.08;
        if (parts.staffGroup) parts.staffGroup.rotation.z = Math.sin(nowT*0.7) * 0.06;
        if (parts.papers) parts.papers.forEach((p, i) => { p.rotation.z = Math.sin(nowT*0.8 + i) * 0.18; });
        this.mesh.position.y = (this.state === 'ACTIVE' ? 0.02 : 0) + Math.abs(Math.sin(nowT*0.8 + this.homeX*0.05)) * 0.04;
    }
    if (this.state === 'SLEEPING') {
        this.sleepTimer -= dt / 1000;
        if (this.sleepTimer <= 0) {
            this.state = 'ACTIVE';
            this.mesh.traverse(o=>{ if(o.userData && o.userData.disruptionCage) this.mesh.remove(o); if(o.material&&o.material.emissive) o.material.emissive.setHex(0x000000); });
            createFloatingGoldText(this.mesh.position.x,3,this.mesh.position.z,'✨ Awake');
        } else {
            this.mesh.rotation.z = Math.sin(nowT*0.7) * 0.06;
        }
        return;
    }
    const speedMult = (this.level >= 3) ? 2.5 : 1.0;
    const speed = (4.2 * speedMult) * (dt / 1000);
    if (this.state === 'RETREATING') {
        if (this.route.length === 0) this.buildRoute(true);
        const target = this.route[this.routePos];
        if (target && this.moveTo(target.x, target.z, speed)) this.routePos++;
        if (this.routePos >= this.route.length) { this.hp = this.maxHp; this.state = 'RETURNING'; this.buildRoute(false); }
        return;
    } else if (this.state === 'RETURNING') {
        const target = this.route[this.routePos];
        if (target && this.moveTo(target.x, target.z, speed)) this.routePos++;
        if (this.routePos >= this.route.length) this.state = 'ACTIVE';
        return;
    }
    let now = Date.now(), fireInterval = this.type === 'fire' ? 900 : 1300;
    if (now - this.lastShot > fireInterval) {
        let target = knights.find(k => k.team !== this.team && Math.hypot(k.mesh.position.x - this.mesh.position.x, k.mesh.position.z - this.mesh.position.z) < this.range);
        if (target) {
            projectiles.push(new ProjectileEntity(this.mesh.position.x, 1.8, this.mesh.position.z, target, this.team, this.type));
            this.lastShot = now;
            if (parts && parts.staffGroup) parts.staffGroup.rotation.z = -0.3;
        }
    }
};

SoheiEntity = class SoheiEntity extends WizardEntity {
    constructor(x,z,team){
        super(x,z,team);
        scene.remove(this.mesh);
        this.type='sohei'; this.range=10; this.mesh=createSoheiMesh(team); this.mesh.position.set(x,0,z); this.mesh.userData.entity=this; scene.add(this.mesh);
    }
    update(dt){
        const t = performance.now() * 0.012;
        const p = this.mesh.userData.parts;
        if (p) {
            p.leftArm.rotation.z = -0.45 + Math.sin(t) * 0.15;
            p.rightArm.rotation.z = 0.45 - Math.sin(t) * 0.15;
            if (p.drum) p.drum.rotation.x = Math.sin(t*0.5) * 0.08;
            this.mesh.position.y = Math.abs(Math.sin(t)) * 0.03;
        }
        knights.filter(k=>k.team===this.team&&Math.hypot(k.mesh.position.x-this.mesh.position.x,k.mesh.position.z-this.mesh.position.z)<this.range).forEach(k=>k.drumBuff=.25);
    }
};

makeBossMesh = function(type) {
    const g = new THREE.Group();
    if (type === 'gashadokuro') {
        const bone = mat(0xe9e0ca,.88);
        const skull = mesh(new THREE.SphereGeometry(1.34, 12, 10), bone, 0, 5.15, 0); g.add(skull);
        g.add(mesh(new THREE.BoxGeometry(1.1,0.36,0.9), bone, 0, 4.35, 0.56));
        g.add(mesh(new THREE.CylinderGeometry(0.75,0.94,4.3,8), bone, 0, 2.85, 0));
        const ribs = [];
        for (let i = -2; i <= 2; i++) { const rib = mesh(new THREE.TorusGeometry(0.95,0.06,6,16,Math.PI), bone, 0, 3.55 - i*0.33, 0); rib.rotation.z = Math.PI/2; g.add(rib); ribs.push(rib); }
        const limbs=[];
        [[-1.55,3.45,-0.35, 0.45],[1.55,3.45,-0.35,-0.45],[-0.95,1.2,0.1,0.08],[0.95,1.2,0.1,-0.08]].forEach(([x,y,z,rz])=>{const limb=mesh(new THREE.CylinderGeometry(0.2,0.28,4.4,8), bone, x,y,z); limb.rotation.z = rz; g.add(limb); limbs.push(limb);});
        g.userData.parts = { skull, ribs, limbs, type };
    } else if (type === 'namazu') {
        const bodyMat = mat(0x495e68,.75), finMat = mat(0x6f8790,.8), whiskMat = mat(0xe3d6a4,.95);
        const body = mesh(new THREE.SphereGeometry(2.0,16,10), bodyMat, 0,1.9,0); body.scale.z = 2.0; g.add(body);
        const tail = mesh(new THREE.ConeGeometry(0.9,2.5,8), finMat, 0,2.0,-3.3); tail.rotation.x = -0.15; g.add(tail);
        const head = mesh(new THREE.SphereGeometry(1.25,12,10), bodyMat, 0,2.05,2.3); head.scale.set(1.25,0.9,1.45); g.add(head);
        const barbA = mesh(new THREE.CylinderGeometry(0.03,0.03,2.8,5), whiskMat, -0.7,2.0,3.0); barbA.rotation.z = 1.2; barbA.rotation.x = 0.35; g.add(barbA);
        const barbB = mesh(new THREE.CylinderGeometry(0.03,0.03,2.8,5), whiskMat, 0.7,2.0,3.0); barbB.rotation.z = -1.2; barbB.rotation.x = -0.35; g.add(barbB);
        const seal = mesh(new THREE.BoxGeometry(1.2,0.24,0.8), mat(0xd0b56c,.48,.52), 0,3.55,0.1); g.add(seal);
        g.userData.parts = { body, tail, whiskers:[barbA,barbB], type };
    } else {
        const body = mesh(new THREE.SphereGeometry(1.42,12,10), mat(0x356d3f,.65), 0,1.45,0); g.add(body);
        const necks=[], heads=[];
        for (let i=0;i<8;i++){
            const a=(i-3.5)*0.23; const color=[0xb33a2d,0x5f9e47,0x5a8cc8,0x7fcce0][i%4];
            const neck=mesh(new THREE.CylinderGeometry(0.24,0.36,3.3,8), mat(0x2b6b3b,.72), Math.sin(a)*1.9, 2.7, Math.cos(a)*1.2); neck.rotation.z=a; g.add(neck); necks.push(neck);
            const head=mesh(new THREE.SphereGeometry(0.58,10,8), mat(color,.55,.18), Math.sin(a)*2.85, 4.15, Math.cos(a)*1.85); g.add(head); heads.push(head);
            g.add(mesh(new THREE.ConeGeometry(0.1,0.35,5), mat(0xf0e6c7,.95), Math.sin(a)*3.1, 4.35, Math.cos(a)*1.95));
        }
        g.userData.parts = { body, necks, heads, type };
    }
    return g;
};

const _baseBossUpdate = BossEntity.prototype.update;
BossEntity.prototype.update = function(dt) {
    _baseBossUpdate.call(this, dt);
    const parts = this.mesh.userData.parts;
    if (!parts) return;
    const ratio = this.hp / this.maxHp;
    const t = performance.now() * 0.004;
    if (this.bossType === 'gashadokuro') {
        parts.skull.rotation.y = Math.sin(t) * 0.18;
        if (ratio < 0.66 && parts.ribs[0]) parts.ribs[0].visible = false;
        if (ratio < 0.45 && parts.ribs[1]) parts.ribs[1].visible = false;
        if (ratio < 0.3 && parts.limbs[0]) parts.limbs[0].rotation.z = 0.8;
    } else if (this.bossType === 'namazu') {
        parts.body.rotation.z = Math.sin(t*0.9) * 0.05;
        parts.tail.rotation.x = -0.15 + Math.sin(t*2.2) * 0.24;
        if (ratio < 0.5) parts.whiskers.forEach((w,i)=>w.rotation.z += (i? -1:1)*0.002);
    } else if (this.bossType === 'orochi') {
        parts.heads.forEach((h,i)=>{ h.position.y += Math.sin(t*1.2 + i*0.7) * 0.01; });
        const visibleHeads = Math.max(1, Math.ceil(ratio * parts.heads.length));
        parts.heads.forEach((h,i)=> h.visible = i < visibleHeads);
        parts.necks.forEach((n,i)=> n.visible = i < visibleHeads);
    }
};

showBattleText('V5.3 model overhaul loaded — sharper silhouettes, upgraded palaces and animated folklore units!');
