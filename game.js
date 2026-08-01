// --- Spellbound Clash 3D Game Engine ---

// --- 1. GAME STATE ---
let gold = 80;
let playerHp = 100;
let enemyHp = 100;
let mode = 'PLAY'; // 'PLAY', 'BUILD_WIZARD', 'EDIT_SLOTS'
let selectedWizard = null;
let lastTime = Date.now();

// --- 2. 3D PATH & TEAM WIZARD SLOTS DEFINITION ---
// Path coordinates in 3D space (X, Z)
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

// Separate Wizard Slots per Team: Left side (X < 0) for Player Blue Team, Right side (X > 0) for Enemy Red Team
let wizardSlots = [
    // Blue Team Slots (Player - Left Side)
    { x: -20, z: -10, team: 'player' },
    { x: -12, z: -10, team: 'player' },
    { x: -4, z: -10, team: 'player' },
    { x: -16, z: -1, team: 'player' },
    { x: -8, z: -1, team: 'player' },
    { x: -20, z: 9, team: 'player' },
    { x: -12, z: 9, team: 'player' },
    { x: -4, z: 9, team: 'player' },

    // Red Team Slots (Enemy AI - Right Side)
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

// --- 3. THREE.JS SCENE & RESPONSIVE CAMERA SETUP ---
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
container.appendChild(renderer.domElement);

// Dynamic Camera Resizing logic so full battlefield always stays in view!
function updateCameraViewport() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;

    const baseFov = 50;
    const targetAspect = 1.65; // Standard widescreen ratio for full field view

    if (aspect < targetAspect) {
        // Narrow window (mobile/portrait/tablet): Adjust FOV dynamically so full width (X = -32 to +32) stays visible
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
// Ground Plane
const groundGeo = new THREE.PlaneGeometry(70, 45);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2e6f40, roughness: 0.8, metalness: 0.1 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Winding Dirt Path
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

// Castle Builder
function createCastleMesh(teamColor) {
    const castle = new THREE.Group();
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const roofMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.4 });

    // Main Keep
    const keepGeo = new THREE.BoxGeometry(4.5, 4, 4.5);
    const keep = new THREE.Mesh(keepGeo, stoneMat);
    keep.position.y = 2;
    keep.castShadow = true;
    keep.receiveShadow = true;
    castle.add(keep);

    // 4 Corner Towers
    const towerOffsets = [
        [-2, -2], [-2, 2], [2, -2], [2, 2]
    ];
    towerOffsets.forEach(([ox, oz]) => {
        const tGeo = new THREE.CylinderGeometry(0.8, 0.9, 5, 12);
        const tMesh = new THREE.Mesh(tGeo, stoneMat);
        tMesh.position.set(ox, 2.5, oz);
        tMesh.castShadow = true;
        castle.add(tMesh);

        // Tower Roof
        const rGeo = new THREE.ConeGeometry(1.1, 1.8, 12);
        const rMesh = new THREE.Mesh(rGeo, roofMat);
        rMesh.position.set(ox, 5.9, oz);
        rMesh.castShadow = true;
        castle.add(rMesh);
    });

    // Gate / Door
    const gateGeo = new THREE.BoxGeometry(1.4, 2.2, 0.2);
    const gate = new THREE.Mesh(gateGeo, darkMat);
    gate.position.set(0, 1.1, 2.3);
    castle.add(gate);

    // Flag Pole & Banner
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
    const pole = new THREE.Mesh(poleGeo, darkMat);
    pole.position.set(0, 5.5, 0);
    castle.add(pole);

    const flagGeo = new THREE.BoxGeometry(1.2, 0.7, 0.05);
    const flag = new THREE.Mesh(flagGeo, roofMat);
    flag.position.set(0.6, 6.5, 0);
    castle.add(flag);

    return castle;
}

const blueCastle = createCastleMesh(0x38bdf8);
blueCastle.position.set(playerBasePos.x - 2, 0, playerBasePos.z);
scene.add(blueCastle);

const redCastle = createCastleMesh(0xf43f5e);
redCastle.position.set(enemyBasePos.x + 2, 0, enemyBasePos.z);
scene.add(redCastle);

// Build Wizard Slot Markers (Distinct Team Colors)
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

        // Center emblem disk
        const innerGeo = new THREE.CircleGeometry(0.4, 16);
        const innerMat = new THREE.MeshBasicMaterial({ color: isPlayerSlot ? 0x0284c7 : 0xbe123c, transparent: true, opacity: 0.5 });
        const innerMesh = new THREE.Mesh(innerGeo, innerMat);
        innerMesh.rotation.x = -Math.PI / 2;
        group.add(innerMesh);

        group.position.set(s.x, 0.05, s.z);
        group.userData = { isSlot: true, slotData: s };
        scene.add(group);

        // Store reference for raycasting
        mesh.userData = { isSlot: true, slotData: s };
        slotMeshes.push(mesh);
    });
}
refreshSlotMeshes();

// Floating 3D Gold Text / Popup Notification
function createFloatingGoldText(x, y, z, textStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
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

    floatingTexts.push({ sprite, life: 1.0, initialY: y });
}

// --- 5. ENTITY BUILDERS ---
// Knight Mesh Generator
function createKnightMesh(team) {
    const knight = new THREE.Group();
    const isPlayer = team === 'player';

    const armorColor = isPlayer ? 0x94a3b8 : 0x450a0a; // Silver vs Red Flame Armor
    const secondaryColor = isPlayer ? 0x0284c7 : 0xd90429;
    const plumeColor = isPlayer ? 0x38bdf8 : 0xff4d6d;

    const armorMat = new THREE.MeshStandardMaterial({ color: armorColor, metalness: 0.8, roughness: 0.3 });
    const secMat = new THREE.MeshStandardMaterial({ color: secondaryColor, roughness: 0.4 });
    const plumeMat = new THREE.MeshStandardMaterial({ color: plumeColor, roughness: 0.2, emissive: isPlayer ? 0x000000 : 0x990000 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });

    // Body / Torso
    const bodyGeo = new THREE.CylinderGeometry(0.55, 0.45, 1.2, 12);
    const body = new THREE.Mesh(bodyGeo, secMat);
    body.position.y = 0.8;
    body.castShadow = true;
    knight.add(body);

    // Chestplate
    const chestGeo = new THREE.BoxGeometry(0.7, 0.7, 0.6);
    const chest = new THREE.Mesh(chestGeo, armorMat);
    chest.position.y = 0.9;
    chest.castShadow = true;
    knight.add(chest);

    // Head / Helm
    const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.6;
    knight.add(head);

    const helmGeo = new THREE.ConeGeometry(0.42, 0.5, 12);
    const helm = new THREE.Mesh(helmGeo, armorMat);
    helm.position.y = 1.9;
    helm.castShadow = true;
    knight.add(helm);

    // Plume
    const plumeGeo = new THREE.ConeGeometry(0.12, 0.5, 8);
    const plume = new THREE.Mesh(plumeGeo, plumeMat);
    plume.position.set(0, 2.25, -0.1);
    plume.rotation.x = -0.3;
    knight.add(plume);

    // Shield
    const shieldGeo = new THREE.BoxGeometry(0.1, 0.8, 0.5);
    const shield = new THREE.Mesh(shieldGeo, secMat);
    shield.position.set(-0.55, 0.9, 0.1);
    knight.add(shield);

    // Sword
    const swordGeo = new THREE.BoxGeometry(0.08, 1.1, 0.2);
    const sword = new THREE.Mesh(swordGeo, armorMat);
    sword.position.set(0.55, 0.9, 0.2);
    sword.rotation.x = Math.PI / 4;
    knight.add(sword);

    // Flame Ember Aura for Red Elemental Knight
    if (!isPlayer) {
        const fireLight = new THREE.PointLight(0xff4d6d, 1.2, 4);
        fireLight.position.set(0, 1.5, 0);
        knight.add(fireLight);
    }

    knight.scale.set(1.1, 1.1, 1.1);
    return knight;
}

// Wizard Mesh Generator
function createWizardMesh(team, level) {
    const wizard = new THREE.Group();
    const isPlayer = team === 'player';

    const robeColor = isPlayer ? 0x0284c7 : 0xbe123c;
    const hatColor = isPlayer ? 0x0369a1 : 0x9f1239;
    const crystalColor = level === 1 ? 0xfbbf24 : level === 2 ? 0x38bdf8 : 0xa855f7;

    const robeMat = new THREE.MeshStandardMaterial({ color: robeColor, roughness: 0.5 });
    const hatMat = new THREE.MeshStandardMaterial({ color: hatColor, roughness: 0.4 });
    const crystalMat = new THREE.MeshStandardMaterial({ color: crystalColor, emissive: crystalColor, emissiveIntensity: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });

    // Robe (Cone)
    const bodyGeo = new THREE.ConeGeometry(0.7, 1.6, 12);
    const body = new THREE.Mesh(bodyGeo, robeMat);
    body.position.y = 0.8;
    body.castShadow = true;
    wizard.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({ color: 0xffcc99 }));
    head.position.y = 1.7;
    wizard.add(head);

    // Wizard Hat
    const brimGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 12);
    const brim = new THREE.Mesh(brimGeo, hatMat);
    brim.position.y = 1.9;
    wizard.add(brim);

    const hatGeo = new THREE.ConeGeometry(0.45, 0.9, 12);
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 2.35;
    hat.rotation.z = -0.15;
    hat.castShadow = true;
    wizard.add(hat);

    // Staff & Crystal
    const staffGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    const staff = new THREE.Mesh(staffGeo, woodMat);
    staff.position.set(0.6, 1.1, 0.2);
    wizard.add(staff);

    const crystalGeo = new THREE.OctahedronGeometry(0.25, 0);
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0.6, 2.2, 0.2);
    wizard.add(crystal);

    // Level aura ring
    if (level >= 2) {
        const auraGeo = new THREE.RingGeometry(0.9, 1.1, 16);
        const auraMat = new THREE.MeshBasicMaterial({ color: crystalColor, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.05;
        wizard.add(aura);
    }

    wizard.scale.set(1.1, 1.1, 1.1);
    return wizard;
}

// --- 6. GAME CLASSES ---
class WizardEntity {
    constructor(x, z, team) {
        this.homeX = x;
        this.homeZ = z;
        this.team = team;
        this.hp = 50;
        this.maxHp = 50;
        this.range = 16;
        this.level = 1;
        this.state = 'ACTIVE';
        this.lastShot = 0;

        this.mesh = createWizardMesh(team, this.level);
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
                gold += 30; // +30 Gold for defeating enemy wizard
                updateHUD();
                createFloatingGoldText(this.mesh.position.x, 2.5, this.mesh.position.z, "+30g");
            }
            this.triggerRecovery();
        }
    }

    triggerRecovery() {
        if (this.level >= 3) {
            let base = this.team === 'player' ? playerBasePos : enemyBasePos;
            this.mesh.position.set(base.x, 0, base.z);
            this.hp = this.maxHp;
            this.state = 'RETURNING';
        } else {
            this.state = 'RETREATING';
        }
    }

    upgrade() {
        if (this.level < 3) {
            this.level++;
            scene.remove(this.mesh);
            this.mesh = createWizardMesh(this.team, this.level);
            this.mesh.position.set(this.homeX, 0, this.homeZ);
            this.mesh.userData = { entity: this };
            scene.add(this.mesh);
        }
    }

    update(dt) {
        let base = this.team === 'player' ? playerBasePos : enemyBasePos;
        let speed = (this.level >= 2 ? 14 : 7) * (dt / 1000);

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
            if (now - this.lastShot > 1200) {
                let target = knights.find(k => k.team !== this.team && Math.hypot(k.mesh.position.x - this.mesh.position.x, k.mesh.position.z - this.mesh.position.z) < this.range);
                if (target) {
                    projectiles.push(new ProjectileEntity(this.mesh.position.x, 1.8, this.mesh.position.z, target, this.team, 'magic'));
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
    constructor(team) {
        this.team = team;
        this.pathIdx = team === 'player' ? 0 : pathNodes.length - 1;
        this.hp = 60;
        this.maxHp = 60;
        this.speed = 5.5;
        this.range = 8;
        this.lastAttack = 0;

        this.mesh = createKnightMesh(team);
        const startPos = pathNodes[this.pathIdx];
        this.mesh.position.set(startPos.x, 0, startPos.z);
        scene.add(this.mesh);
    }

    update(dt) {
        let now = Date.now();
        let attacked = false;

        let curX = this.mesh.position.x;
        let curZ = this.mesh.position.z;

        // 1. Fight opposing knights
        let enemyK = knights.find(k => k.team !== this.team && Math.hypot(k.mesh.position.x - curX, k.mesh.position.z - curZ) < 3.0);
        if (enemyK) {
            attacked = true;
            if (now - this.lastAttack > 1000) {
                enemyK.hp -= 15;
                this.lastAttack = now;
            }
        }

        // 2. Attack Wizards
        if (!attacked) {
            let enemyW = wizards.find(w => w.team !== this.team && w.state === 'ACTIVE' && Math.hypot(w.mesh.position.x - curX, w.mesh.position.z - curZ) < this.range);
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
                let moveAmt = this.speed * (dt / 1000);

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
                // Reached Base Castle!
                if (this.team === 'player') enemyHp = Math.max(0, enemyHp - 15);
                else playerHp = Math.max(0, playerHp - 15);
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
        this.speed = 22;

        const color = type === 'magic' ? (team === 'player' ? 0x38bdf8 : 0xf43f5e) : 0xfbbf24;
        const pGeo = new THREE.SphereGeometry(type === 'magic' ? 0.35 : 0.2, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: color });

        this.mesh = new THREE.Mesh(pGeo, pMat);
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
            if (this.target instanceof WizardEntity) {
                this.target.takeDamage(12, this.team);
            } else {
                this.target.hp -= 15;
            }
            scene.remove(this.mesh);
            return true; // Hit
        }

        let angle = Math.atan2(tx - this.mesh.position.x, tz - this.mesh.position.z);
        this.mesh.position.x += Math.sin(angle) * moveAmt;
        this.mesh.position.z += Math.cos(angle) * moveAmt;
        return false;
    }
}

// --- 7. ENEMY AI & REGENERATION ---
setInterval(() => {
    if (Math.random() < 0.45) knights.push(new KnightEntity('enemy'));

    if (Math.random() < 0.18) {
        // Enemy AI only builds on Red slots (Right side X > 0)
        let availableSlots = wizardSlots.filter(s => (s.team === 'enemy' || s.x > 0) && !wizards.find(w => w.homeX === s.x && w.homeZ === s.z));
        if (availableSlots.length > 0) {
            let slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
            wizards.push(new WizardEntity(slot.x, slot.z, 'enemy'));
        }
    }
}, 3800);

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
}

document.getElementById('btn-knight').onclick = () => {
    if (gold >= 30) {
        gold -= 30;
        knights.push(new KnightEntity('player'));
        updateHUD();
    } else {
        alert("Not enough gold! Read the spellbook!");
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

document.getElementById('btn-upgrade').onclick = () => {
    if (!selectedWizard) return;
    let cost = selectedWizard.level === 1 ? 40 : 80;
    if (gold >= cost && selectedWizard.level < 3) {
        gold -= cost;
        selectedWizard.upgrade();
        updateHUD();
        openUpgradeModal(selectedWizard);
    } else if (selectedWizard.level >= 3) {
        alert("Wizard is at Max Level!");
    } else {
        alert("Not enough gold!");
    }
};

function openUpgradeModal(wiz) {
    selectedWizard = wiz;
    const lvlText = wiz.level + (wiz.level === 1 ? " (Standard)" : wiz.level === 2 ? " (Swift Boots)" : " (Teleport!)");
    document.getElementById('wiz-level').innerText = lvlText;
    const cost = wiz.level === 1 ? 40 : 80;
    const btn = document.getElementById('btn-upgrade');
    if (wiz.level < 3) {
        btn.innerText = `Upgrade to L${wiz.level + 1} (${cost}g)`;
        btn.style.display = 'inline-block';
    } else {
        btn.style.display = 'none';
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
            // Trace up to parent group if needed
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

    // Update entities
    wizards.forEach(w => w.update(dt));

    for (let i = knights.length - 1; i >= 0; i--) {
        let k = knights[i];
        k.update(dt);
        if (k.hp <= 0) {
            if (k.team === 'enemy') {
                gold += 20; // Defeating enemy knight awards +20 Gold!
                updateHUD();
                createFloatingGoldText(k.mesh.position.x, 2.5, k.mesh.position.z, "+20g");
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

    // Animate floating gold text popups
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

    // Check Win/Loss
    if (playerHp <= 0) {
        alert("Red Team Wins! Refreshing battle...");
        playerHp = 100; enemyHp = 100; gold = 80; updateHUD();
    }
    if (enemyHp <= 0) {
        alert("Blue Team Wins! Victory!");
        playerHp = 100; enemyHp = 100; gold = 80; updateHUD();
    }

    renderer.render(scene, camera);
}

// Initial camera frustum fitting & HUD update
updateCameraViewport();
updateHUD();

// Start Loop
requestAnimationFrame(animate);
