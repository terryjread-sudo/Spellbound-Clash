const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game State ---
let gold = 80;
let playerHp = 100;
let enemyHp = 100;
let mode = 'PLAY'; // 'PLAY', 'BUILD_WIZARD', 'EDIT_SLOTS'
let lastTime = Date.now();
let selectedWizard = null;

// --- Map & Nodes ---
const pathNodes = [
    {x: 50, y: 250}, {x: 250, y: 250}, {x: 250, y: 120}, 
    {x: 650, y: 120}, {x: 650, y: 380}, {x: 850, y: 380}
];

const playerBase = {x: 50, y: 250};
const enemyBase = {x: 850, y: 380};

let wizardSlots = [
    {x: 250, y: 50}, {x: 450, y: 50}, {x: 650, y: 50},
    {x: 250, y: 190}, {x: 450, y: 190},
    {x: 450, y: 380}, {x: 650, y: 310}
];

// --- Entities ---
let knights = [];
let wizards = [];
let projectiles = [];

// Reading Questions for Age 8+
const questions = [
    { q: "Which word rhymes with 'KNIGHT'?", opts: ["Light", "Kite", "Fright", "All of these"], a: "All of these" },
    { q: "Which word means 'VERY BRAVE'?", opts: ["Timid", "Courageous", "Silent", "Sleepy"], a: "Courageous" },
    { q: "Select the ACTION word (Verb):", opts: ["Shield", "Charge", "Armor", "Castle"], a: "Charge" },
    { q: "Find the synonym for 'SWIFT':", opts: ["Slow", "Fast", "Heavy", "Dark"], a: "Fast" },
    { q: "Which spell prefix means 'AGAIN'?", opts: ["Pre-", "Un-", "Re-", "Dis-"], a: "Re-" },
    { q: "What is the antonym (opposite) of 'DEFEND'?", opts: ["Protect", "Attack", "Guard", "Save"], a: "Attack" },
    { q: "Which is a NOUN?", opts: ["Quickly", "Magical", "Wizard", "Run"], a: "Wizard" }
];

// --- Classes ---

class Wizard {
    constructor(x, y, team) {
        this.homeX = x;
        this.homeY = y;
        this.x = x;
        this.y = y;
        this.team = team;
        this.hp = 50;
        this.maxHp = 50;
        this.range = 140;
        this.level = 1; // 1=Normal, 2=Swift Boots, 3=Teleport
        this.state = 'ACTIVE'; // ACTIVE, RETREATING, RETURNING
        this.lastShot = 0;
        this.radius = 18;
    }

    takeDamage(amount) {
        if (this.state !== 'ACTIVE') return;
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.triggerRecovery();
        }
    }

    triggerRecovery() {
        if (this.level >= 3) {
            // Ultimate: Teleport to base immediately
            let base = this.team === 'player' ? playerBase : enemyBase;
            this.x = base.x;
            this.y = base.y;
            this.hp = this.maxHp;
            this.state = 'RETURNING';
        } else {
            this.state = 'RETREATING';
        }
    }

    update(dt) {
        let base = this.team === 'player' ? playerBase : enemyBase;
        let speed = (this.level >= 2 ? 120 : 60) * (dt / 1000);

        if (this.state === 'RETREATING') {
            if (this.moveTo(base.x, base.y, speed)) {
                this.hp = this.maxHp;
                this.state = 'RETURNING';
            }
        } else if (this.state === 'RETURNING') {
            if (this.moveTo(this.homeX, this.homeY, speed)) {
                this.state = 'ACTIVE';
            }
        } else if (this.state === 'ACTIVE') {
            // Shoot at knights
            let now = Date.now();
            if (now - this.lastShot > 1200) {
                let target = knights.find(k => k.team !== this.team && Math.hypot(k.x - this.x, k.y - this.y) < this.range);
                if (target) {
                    projectiles.push(new Projectile(this.x, this.y, target, this.team, 'magic'));
                    this.lastShot = now;
                }
            }
        }
    }

    moveTo(tx, ty, speed) {
        let dist = Math.hypot(tx - this.x, ty - this.y);
        if (dist <= speed) {
            this.x = tx; this.y = ty;
            return true;
        }
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.x += Math.cos(angle) * speed;
        this.y += Math.sin(angle) * speed;
        return false;
    }
}

class Knight {
    constructor(team) {
        this.team = team;
        this.pathIdx = team === 'player' ? 0 : pathNodes.length - 1;
        this.x = pathNodes[this.pathIdx].x;
        this.y = pathNodes[this.pathIdx].y;
        this.hp = 60;
        this.maxHp = 60;
        this.speed = 40;
        this.range = 80;
        this.lastAttack = 0;
        this.radius = 12;
    }

    update(dt) {
        let now = Date.now();
        let attacked = false;

        // 1. Check for opposing knights to fight
        let enemyK = knights.find(k => k.team !== this.team && Math.hypot(k.x - this.x, k.y - this.y) < 30);
        if (enemyK) {
            attacked = true;
            if (now - this.lastAttack > 1000) {
                enemyK.hp -= 10;
                this.lastAttack = now;
            }
        }

        // 2. Check for active wizards to attack (throwing spears)
        if (!attacked) {
            let enemyW = wizards.find(w => w.team !== this.team && w.state === 'ACTIVE' && Math.hypot(w.x - this.x, w.y - this.y) < this.range);
            if (enemyW) {
                // Don't stop walking, just throw spear
                if (now - this.lastAttack > 1500) {
                    projectiles.push(new Projectile(this.x, this.y, enemyW, this.team, 'spear'));
                    this.lastAttack = now;
                }
            }
        }

        // 3. Move along path
        if (!attacked) {
            let targetNode = pathNodes[this.team === 'player' ? this.pathIdx + 1 : this.pathIdx - 1];
            if (targetNode) {
                let dist = Math.hypot(targetNode.x - this.x, targetNode.y - this.y);
                let moveAmt = this.speed * (dt / 1000);
                if (dist <= moveAmt) {
                    this.x = targetNode.x;
                    this.y = targetNode.y;
                    this.pathIdx += (this.team === 'player' ? 1 : -1);
                } else {
                    let angle = Math.atan2(targetNode.y - this.y, targetNode.x - this.x);
                    this.x += Math.cos(angle) * moveAmt;
                    this.y += Math.sin(angle) * moveAmt;
                }
            } else {
                // Reached Base!
                if (this.team === 'player') enemyHp = Math.max(0, enemyHp - 15);
                else playerHp = Math.max(0, playerHp - 15);
                this.hp = 0; // self-destruct on hit
            }
        }
    }
}

class Projectile {
    constructor(x, y, target, team, type) {
        this.x = x; this.y = y;
        this.target = target;
        this.team = team;
        this.type = type; // 'magic' or 'spear'
        this.speed = 150;
    }
    update(dt) {
        let dist = Math.hypot(this.target.x - this.x, this.target.y - this.y);
        let moveAmt = this.speed * (dt / 1000);
        if (dist <= moveAmt) {
            if (this.target instanceof Wizard) this.target.takeDamage(10);
            else this.target.hp -= 15;
            return true; // Hit
        }
        let angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        this.x += Math.cos(angle) * moveAmt;
        this.y += Math.sin(angle) * moveAmt;
        return false;
    }
}

// --- Enemy AI ---
setInterval(() => {
    if (Math.random() < 0.4) knights.push(new Knight('enemy'));
    
    // AI places wizards randomly if it has space and money (simulated)
    if (Math.random() < 0.1) {
        let availableSlots = wizardSlots.filter(s => s.x > 450 && !wizards.find(w => w.homeX === s.x && w.homeY === s.y));
        if (availableSlots.length > 0) {
            let slot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
            wizards.push(new Wizard(slot.x, slot.y, 'enemy'));
        }
    }
}, 4000);


// --- UI Handlers ---
const updateHUD = () => {
    document.getElementById('gold').innerText = gold;
    document.getElementById('playerHp').innerText = playerHp;
    document.getElementById('enemyHp').innerText = enemyHp;
};

// Controls
document.getElementById('btn-knight').onclick = () => {
    if (gold >= 30) { gold -= 30; knights.push(new Knight('player')); updateHUD(); }
    else alert("Not enough gold!");
};

document.getElementById('btn-wizard').onclick = () => {
    mode = mode === 'BUILD_WIZARD' ? 'PLAY' : 'BUILD_WIZARD';
    document.getElementById('btn-wizard').innerText = mode === 'BUILD_WIZARD' ? "Cancel Build" : "🧙 Build Wizard (50g)";
};

document.getElementById('btn-editor').onclick = () => {
    mode = mode === 'EDIT_SLOTS' ? 'PLAY' : 'EDIT_SLOTS';
    document.getElementById('btn-editor').innerText = mode === 'EDIT_SLOTS' ? "Stop Editing" : "🛠️ Toggle Edit Mode";
    if (mode === 'EDIT_SLOTS') alert("Edit Mode: Click anywhere on grass to add/remove wizard placement slots.");
};

// Spellbook Reading Mechanic
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
            if (opt === qObj.a) { gold += 50; updateHUD(); }
            modal.classList.add('hidden');
        };
        optsDiv.appendChild(btn);
    });
    modal.classList.remove('hidden');
};

// Upgrades
document.getElementById('btn-close-upgrade').onclick = () => {
    document.getElementById('upgrade-modal').classList.add('hidden');
    selectedWizard = null;
};

document.getElementById('btn-upgrade').onclick = () => {
    if (!selectedWizard) return;
    let cost = selectedWizard.level === 1 ? 40 : 80; // Level 2: Swift, Level 3: Teleport
    if (gold >= cost && selectedWizard.level < 3) {
        gold -= cost;
        selectedWizard.level++;
        updateHUD();
        openUpgradeModal(selectedWizard);
    } else if (selectedWizard.level >= 3) {
        alert("Wizard is at max level (Teleport Unlocked)!");
    } else {
        alert("Not enough gold!");
    }
};

function openUpgradeModal(wiz) {
    selectedWizard = wiz;
    document.getElementById('wiz-level').innerText = wiz.level + (wiz.level === 1 ? " (Normal)" : wiz.level === 2 ? " (Swift Boots)" : " (Teleport!)");
    let cost = wiz.level === 1 ? 40 : 80;
    let btn = document.getElementById('btn-upgrade');
    if (wiz.level < 3) {
        btn.innerText = `Upgrade to Level ${wiz.level + 1} (${cost}g)`;
        btn.style.display = 'inline-block';
    } else {
        btn.style.display = 'none';
    }
    document.getElementById('upgrade-modal').classList.remove('hidden');
}

// Canvas Clicks
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (mode === 'EDIT_SLOTS') {
        // Find if clicking existing slot to remove
        let idx = wizardSlots.findIndex(s => Math.hypot(s.x - mx, s.y - my) < 20);
        if (idx !== -1) wizardSlots.splice(idx, 1);
        else wizardSlots.push({x: mx, y: my});
        return;
    }

    if (mode === 'BUILD_WIZARD') {
        if (gold < 50) return alert("Not enough gold!");
        let slot = wizardSlots.find(s => Math.hypot(s.x - mx, s.y - my) < 25);
        if (slot) {
            let occupied = wizards.find(w => w.homeX === slot.x && w.homeY === slot.y);
            if (!occupied) {
                wizards.push(new Wizard(slot.x, slot.y, 'player'));
                gold -= 50;
                updateHUD();
                mode = 'PLAY';
                document.getElementById('btn-wizard').innerText = "🧙 Build Wizard (50g)";
            }
        }
        return;
    }

    // Default Play Mode: Select Wizard to Upgrade
    let wiz = wizards.find(w => w.team === 'player' && Math.hypot(w.x - mx, w.y - my) < 25);
    if (wiz) openUpgradeModal(wiz);
});

// --- Main Loop ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Path
    ctx.strokeStyle = '#d4a373';
    ctx.lineWidth = 45;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pathNodes.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Draw Bases
    ctx.fillStyle = '#0f3460'; ctx.fillRect(playerBase.x - 30, playerBase.y - 40, 60, 80);
    ctx.fillStyle = '#e94560'; ctx.fillRect(enemyBase.x - 30, enemyBase.y - 40, 60, 80);

    // Draw Slots
    wizardSlots.forEach(s => {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(s.x, s.y, 20, 0, Math.PI*2); ctx.stroke();
    });

    // Draw Wizards
    wizards.forEach(w => {
        ctx.fillStyle = w.team === 'player' ? '#4cc9f0' : '#f72585';
        if (w.state === 'RETREATING') ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.radius, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;

        // Level indicator
        ctx.fillStyle = 'white'; ctx.font = '12px Arial';
        ctx.fillText("L" + w.level, w.x - 6, w.y + 4);

        // HP Bar
        if (w.hp < w.maxHp && w.hp > 0) {
            ctx.fillStyle = 'red'; ctx.fillRect(w.x - 15, w.y - 25, 30, 4);
            ctx.fillStyle = 'green'; ctx.fillRect(w.x - 15, w.y - 25, (w.hp/w.maxHp)*30, 4);
        }
    });

    // Draw Knights
    knights.forEach(k => {
        ctx.fillStyle = k.team === 'player' ? '#00f5d4' : '#ff0055';
        ctx.beginPath(); ctx.arc(k.x, k.y, k.radius, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = 'red'; ctx.fillRect(k.x - 10, k.y - 18, 20, 3);
        ctx.fillStyle = 'green'; ctx.fillRect(k.x - 10, k.y - 18, (k.hp/k.maxHp)*20, 3);
    });

    // Draw Projectiles
    projectiles.forEach(p => {
        ctx.fillStyle = p.type === 'magic' ? '#fee440' : '#ffffff';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.type === 'magic' ? 5 : 3, 0, Math.PI*2); ctx.fill();
    });
}

function update(dt) {
    wizards.forEach(w => w.update(dt));
    knights.forEach(k => k.update(dt));
    
    // Filter out dead/hit things
    knights = knights.filter(k => k.hp > 0);
    projectiles = projectiles.filter(p => !p.update(dt));

    // End Game condition
    if (playerHp <= 0) { alert("Red Team Wins! Refresh to restart."); playerHp = 100; }
    if (enemyHp <= 0) { alert("Blue Team Wins! Refresh to restart."); enemyHp = 100; }
}

function loop() {
    let now = Date.now();
    let dt = now - lastTime;
    lastTime = now;

    update(dt);
    draw();
    requestAnimationFrame(loop);
}

// Passive Gold
setInterval(() => { gold += 1; updateHUD(); }, 1000);

requestAnimationFrame(loop);
