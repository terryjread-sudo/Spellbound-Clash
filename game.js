// --- Yokai Siege: Legends of Japan V5.1 ---

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
let goldRewardRate = Number(localStorage.getItem('yokaiGoldRewardRate') || 75) / 100;

// Auto Wave System Variables
let waveCount = 0;
let waveTimer = 0;
let waveInterval = 6.0;

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

// Reading challenges aimed at age 8. Each answer casts a combat spell.
const questions = [
    { q: "Which word means the same as QUICK?", opts: ["Fast", "Late", "Quiet", "Heavy"], a: "Fast", difficulty: 1, effect: "freeze", label: "❄️ Frost Wave" },
    { q: "Which spelling is correct?", opts: ["Because", "Becaus", "Beacause", "Becose"], a: "Because", difficulty: 1, effect: "reinforce", label: "⚔️ Call Reinforcements" },
    { q: "What is the opposite of ANCIENT?", opts: ["Old", "Modern", "Broken", "Huge"], a: "Modern", difficulty: 2, effect: "meteor", label: "☄️ Meteor Strike" },
    { q: "Choose the adjective: The fierce dragon roared.", opts: ["dragon", "roared", "fierce", "the"], a: "fierce", difficulty: 2, effect: "freeze", label: "❄️ Frost Wave" },
    { q: "Which word has a silent letter?", opts: ["Knight", "Table", "River", "Music"], a: "Knight", difficulty: 2, effect: "reinforce", label: "⚔️ Call Reinforcements" },
    { q: "Which sentence uses their correctly?", opts: ["Their going home.", "The knights raised their shields.", "Put it over their.", "Their is a dragon."], a: "The knights raised their shields.", difficulty: 3, effect: "income", label: "💰 Wisdom of Wealth" },
    { q: "Which word contains a suffix meaning ‘full of’?", opts: ["Careful", "Replay", "Unkind", "Preview"], a: "Careful", difficulty: 3, effect: "meteor", label: "☄️ Meteor Strike" }
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
    showBattleText.timer = setTimeout(() => banner.textContent = '📖 Charge the spellbook, answer correctly, and cast battle magic!', 2600);
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
    if (Math.random() < 0.12 + level.difficulty*.05) {
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
    if (waveEl) waveEl.innerText = Math.max(1, waveCount);
    const charge=document.getElementById('spellCharge'); if(charge) charge.innerText=Math.floor(spellCharge);
    const fill=document.getElementById('spellChargeFill'); if(fill) fill.style.width=(spellCharge/maxSpellCharge*100)+'%';
    const streak=document.getElementById('readingStreak'); if(streak) streak.innerText=readingStreak;
    document.getElementById('btn-spellbook').disabled = spellCharge < maxSpellCharge;
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
    const enemies=knights.filter(k=>k.team==='enemy');
    if(qObj.effect==='freeze') enemies.forEach(k=>k.slowTimer=Math.max(k.slowTimer,6));
    if(qObj.effect==='reinforce') for(let i=0;i<3;i++) setTimeout(()=>knights.push(new KnightEntity('player',false)),i*250);
    if(qObj.effect==='meteor') enemies.forEach(k=>{k.hp-=qObj.difficulty===3?70:45;if(k.isMega)k.updateHealthBar();});
    if(qObj.effect==='income') { goldIncome += 1; showBattleText('💰 Permanent gold income increased!'); }
    const reward=Math.max(1,Math.round(10*qObj.difficulty*goldRewardRate)); gold+=reward;
    if(readingStreak>0 && readingStreak%5===0){ enemies.forEach(k=>k.hp-=60); showBattleText('🔥 Five-answer streak: bonus meteor!'); }
    createFloatingGoldText(0,8,0,qObj.label+' +'+reward+'g');
}
document.getElementById('btn-spellbook').onclick = () => {
    if(spellCharge<maxSpellCharge){showBattleText('The spellbook is still recharging.');return;}
    spellCharge=0; {const pool=questions.filter(q=>q.difficulty<=CAMPAIGN_LEVELS[currentLevelIndex].difficulty);currentQuestion=pool[Math.floor(Math.random()*pool.length)];}; updateHUD();
    const modal=document.getElementById('spellbook-modal');
    document.getElementById('spell-question').innerText=currentQuestion.q;
    document.getElementById('spell-reward').innerText=`${currentQuestion.label} • Difficulty ${currentQuestion.difficulty}`;
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
function tone(freq,duration=.08,type='sine',volume=.035,delay=0){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),v=audioCtx.createGain();o.type=type;o.frequency.value=freq;v.gain.setValueAtTime(volume,audioCtx.currentTime+delay);v.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+delay+duration);o.connect(v);v.connect(audioCtx.destination);o.start(audioCtx.currentTime+delay);o.stop(audioCtx.currentTime+delay+duration);}catch(e){}}
function playSound(kind){const m={sword:[180,.06,'square'],impact:[110,.07,'triangle'],magic:[620,.14,'sine'],castle:[70,.24,'sawtooth'],disrupt:[240,.3,'square'],heal:[520,.28,'sine']}[kind];if(m)tone(...m);}
function startMusic(){clearInterval(musicTimer);let i=0;const notes=[196,247,294,247,220,262,330,262];musicTimer=setInterval(()=>{if(gameActive)tone(notes[i++%notes.length],.32,'triangle',.009)},430);}
function victoryMusic(){[523,659,784,1047].forEach((n,i)=>tone(n,.35,'sine',.045,i*.13));}
function createTextSprite(text,color='#fff'){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const x=cv.getContext('2d');x.font='900 46px Segoe UI';x.textAlign='center';x.fillStyle=color;x.strokeStyle='#111827';x.lineWidth=8;x.strokeText(text,256,78);x.fillText(text,256,78);return new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthTest:false}));}
const particles=[];
function burstParticles(pos,color,count=10){for(let i=0;i<count;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.12,5,5),new THREE.MeshBasicMaterial({color}));m.position.copy(pos);m.position.y+=1;scene.add(m);particles.push({mesh:m,v:new THREE.Vector3((Math.random()-.5)*8,Math.random()*7+2,(Math.random()-.5)*8),life:.65});}}
function clearEntities(){[...knights].forEach(x=>x.destroy());[...wizards].forEach(x=>x.destroy());[...projectiles].forEach(x=>scene.remove(x.mesh));knights.length=wizards.length=projectiles.length=0;}
function slotsForLevel(level){const left=level.slots.map(([x,z])=>({x,z,team:'player'}));const right=left.map(s=>({x:-s.x,z:s.z,team:'enemy'}));return [...left,...right];}
function loadLevel(index){currentLevelIndex=index;const L=CAMPAIGN_LEVELS[index];gameActive=true;clearEntities();clearStructures();pathNodes=L.path.map(([x,z])=>({x,z}));playerBasePos=pathNodes[0];enemyBasePos=pathNodes[pathNodes.length-1];wizardSlots=slotsForLevel(L).filter(s=>distanceToPath(s.x,s.z)>2.3);scene.remove(pathMeshGroup);pathMeshGroup=buildPathMesh();scene.add(pathMeshGroup);blueCastle.position.set(playerBasePos.x-3,0,playerBasePos.z);redCastle.position.set(enemyBasePos.x+3,0,enemyBasePos.z);ground.material.color.setHex(L.theme);refreshSlotMeshes();
const defending=L.role==='defend';document.body.classList.toggle('defend-mode',defending);redCastle.visible=!defending;makeSacredTreePairs();playerCastleMaxHp=120;enemyCastleMaxHp=160;playerHp=120;enemyHp=160;gold=85;goldIncome=0;castleArmour=0;playerWizardRangeBonus=0;waveCount=0;waveTimer=0;readingStreak=0;spellCharge=100;levelCorrect=0;levelWrong=0;castleVisualLevel=0;applyCastleVisual();document.getElementById('campaign-modal').classList.add('hidden');document.getElementById('levelName').textContent=L.name;document.getElementById('missionRole').textContent=L.role==='defend'?'🛡 DEFEND':'⛩ ATTACK';document.getElementById('objectiveText').textContent=L.role==='defend'?'Protect Hana Palace':'Destroy the Yokai Palace';document.getElementById('waveGoal').textContent=L.waves;updateHUD();triggerKnightWave();startMusic();}
function renderCampaign(){const grid=document.getElementById('level-grid');grid.innerHTML='';CAMPAIGN_LEVELS.forEach((L,i)=>{const b=document.createElement('button');const unlocked=i<campaignSave.unlocked;b.className='level-card'+(unlocked?'':' locked');const stars=campaignSave.stars[i]||0;b.innerHTML=`<strong>${L.name}</strong><span>${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</span><small>${L.role==='defend'?'🛡 Defend':'⛩ Attack'} · ${L.waves} waves · ${bossDisplayName(L.bossType)}</small>`;b.disabled=!unlocked;b.onclick=()=>loadLevel(i);grid.appendChild(b);});document.getElementById('starsTotal').textContent=Object.values(campaignSave.stars).reduce((a,b)=>a+b,0);}
function finishLevel(won){if(!gameActive)return;gameActive=false;const L=CAMPAIGN_LEVELS[currentLevelIndex];let stars=0;if(won){stars=1+(playerHp>=60?1:0)+(levelWrong===0?1:0);campaignSave.stars[currentLevelIndex]=Math.max(campaignSave.stars[currentLevelIndex]||0,stars);campaignSave.unlocked=Math.max(campaignSave.unlocked,Math.min(CAMPAIGN_LEVELS.length,currentLevelIndex+2));localStorage.setItem('yokaiSiegeCampaignV5',JSON.stringify(campaignSave));victoryMusic();}document.getElementById('result-title').textContent=won?'🏆 Battle Won!':'🏰 Castle Fallen';document.getElementById('result-stars').textContent=won?'⭐'.repeat(stars)+'☆'.repeat(3-stars):'Try again';document.getElementById('result-summary').textContent=`${L.name} · ${levelCorrect} correct answers · Castle ${playerHp}/${playerCastleMaxHp}`;document.getElementById('btn-next-level').style.display=won&&currentLevelIndex<CAMPAIGN_LEVELS.length-1?'flex':'none';document.getElementById('result-modal').classList.remove('hidden');
}

// --- V5 JAPANESE FOLKLORE SYSTEMS ---
let structures=[], sacredTrees=[], castleVisualLevel=0;
function bossDisplayName(t){return t==='gashadokuro'?'Gashadokuro':t==='namazu'?'Namazu':'Yamata no Orochi';}
function clearStructures(){structures.forEach(s=>{if(s.mesh)scene.remove(s.mesh);if(s.a)scene.remove(s.a);if(s.b)scene.remove(s.b)});structures=[];sacredTrees.forEach(t=>scene.remove(t));sacredTrees=[];}
function makeToriiMesh(){const q=new THREE.Group(),red=mat(0xd83232,.65),black=mat(0x231815,.8);q.add(mesh(new THREE.BoxGeometry(.45,4,.45),red,-1.4,2,0),mesh(new THREE.BoxGeometry(.45,4,.45),red,1.4,2,0));q.add(mesh(new THREE.BoxGeometry(4,.38,.5),red,0,4,0),mesh(new THREE.BoxGeometry(3.3,.28,.42),black,0,3.45,0));return q;}
function makeTree(x,z){const t=new THREE.Group();t.add(mesh(new THREE.CylinderGeometry(.22,.32,2.6,8),mat(0x684126,.95),0,1.3,0));for(let i=0;i<5;i++)t.add(mesh(new THREE.SphereGeometry(.65,8,6),mat(0xf59bb5,.8),Math.sin(i*1.4)*.7,2.7+Math.cos(i)*.3,Math.cos(i*1.4)*.7));t.position.set(x,0,z);scene.add(t);sacredTrees.push(t);return t;}
function makeSacredTreePairs(){for(let i=1;i<pathNodes.length-1;i+=3){const a=pathNodes[i-1],b=pathNodes[i],dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;makeTree(b.x+nx*4,b.z+nz*4);makeTree(b.x-nx*4,b.z-nz*4);}}
function nearestPathPoint(x,z){let best={x:pathNodes[0].x,z:pathNodes[0].z,d:1e9};for(let i=0;i<pathNodes.length-1;i++){const a=pathNodes[i],b=pathNodes[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),px=a.x+t*dx,pz=a.z+t*dz,d=Math.hypot(x-px,z-pz);if(d<best.d)best={x:px,z:pz,d};}return best;}
function placeTorii(x,z){const p=nearestPathPoint(x,z);if(p.d>3){showBattleText('Place Torii Gates directly on the road.');return}if(gold<40){showBattleText('A Torii Gate costs 40 gold.');return}gold-=40;const m=makeToriiMesh();m.position.set(p.x,0,p.z);scene.add(m);structures.push({type:'torii',mesh:m,x:p.x,z:p.z,life:30});mode='PLAY';updateHUD();}
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
['btn-fortify','btn-armour','btn-treasury','btn-arcane'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{castleVisualLevel=Math.min(4,castleVisualLevel+1);applyCastleVisual();}));
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
      if (waveTimer >= waveInterval && waveCount < goal) { waveTimer = 0; triggerKnightWave(); }
    }

    updateStructures(dt);
    wizards.forEach(w => w.update(dt));

    for (let i = knights.length - 1; i >= 0; i--) {
        let k = knights[i];
        k.update(dt);
        if (k.hp <= 0) {
            if (k.team === 'enemy') {
                let reward = Math.max(1,Math.round((k.isMega ? 24 : (k.unitType==='disruptor'?10:6))*goldRewardRate));
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
