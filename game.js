const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const restartBtn = document.getElementById('restartBtn');
const scoreElement = document.getElementById('score');

// เพิ่มปุ่ม Next Level
let nextBtn = document.getElementById('nextBtn');
if (!nextBtn) {
    nextBtn = document.createElement('button');
    nextBtn.id = 'nextBtn';
    nextBtn.textContent = 'Next Level';
    nextBtn.style.marginLeft = '20px';
    document.querySelector('.controls').appendChild(nextBtn);
}
nextBtn.style.display = 'none';

// เพิ่มปุ่ม Change Level
let changeLevelBtn = document.getElementById('changeLevelBtn');
if (!changeLevelBtn) {
    changeLevelBtn = document.createElement('button');
    changeLevelBtn.id = 'changeLevelBtn';
    changeLevelBtn.textContent = 'Change Level';
    changeLevelBtn.style.marginLeft = '20px';
    document.querySelector('.controls').appendChild(changeLevelBtn);
}
changeLevelBtn.style.display = 'inline-block';

canvas.width = 1200;
canvas.height = 500;

const BIRD_START_X = canvas.width * 0.2;
const BIRD_START_Y = canvas.height * 0.75;

class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isLaunched = false;
        this.isDragging = false;
    }
    draw() {
        // วาดเงา
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y + this.radius + 10, this.radius * 0.9, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.restore();

        // วาด bird เป็น gradient
        let grad = ctx.createRadialGradient(this.x - 8, this.y - 8, this.radius * 0.2, this.x, this.y, this.radius);
        grad.addColorStop(0, '#ffecb3');
        grad.addColorStop(0.5, '#ff5252');
        grad.addColorStop(1, '#b71c1c');
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = "#ff1744";
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.closePath();

        // ตา
        ctx.beginPath();
        ctx.arc(this.x + 7, this.y - 7, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y - 7, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'black';
        ctx.fill();
        // ปาก
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y + 2);
        ctx.lineTo(this.x + 22, this.y + 5);
        ctx.lineTo(this.x + 15, this.y + 7);
        ctx.closePath();
        ctx.fillStyle = '#ffb300';
        ctx.fill();
    }
    update() {
        if (this.isLaunched) {
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.velocityY += 0.5;
        }
    }
}

class Target {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.isHit = false;
    }
    draw() {
        if (!this.isHit) {
            // วาดเงา
            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = "#222";
            ctx.fillRect(this.x + 6, this.y + 10, this.width, this.height * 0.7);
            ctx.restore();

            // วาดกล่องมีขอบและ gradient
            let grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
            grad.addColorStop(0, "#00e676");
            grad.addColorStop(1, "#00695c");
            ctx.save();
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#263238";
            ctx.fillStyle = grad;
            ctx.roundRect(this.x, this.y, this.width, this.height, 8);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // วาดลาย X
            ctx.save();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y + 10);
            ctx.lineTo(this.x + this.width - 10, this.y + this.height - 10);
            ctx.moveTo(this.x + this.width - 10, this.y + 10);
            ctx.lineTo(this.x + 10, this.y + this.height - 10);
            ctx.stroke();
            ctx.restore();
        }
    }
    checkCollision(bird) {
        if (this.isHit) return false;
        return bird.x + bird.radius > this.x &&
               bird.x - bird.radius < this.x + this.width &&
               bird.y + bird.radius > this.y &&
               bird.y - bird.radius < this.y + this.height;
    }
}

// กำหนดข้อมูลแต่ละด่าน
const levels = [
    [
        { x: canvas.width * 0.7, y: canvas.height * 0.7 },
        { x: canvas.width * 0.75, y: canvas.height * 0.6 },
        { x: canvas.width * 0.8, y: canvas.height * 0.7 }
    ],
    [
        { x: canvas.width * 0.6, y: canvas.height * 0.7 },
        { x: canvas.width * 0.65, y: canvas.height * 0.6 },
        { x: canvas.width * 0.7, y: canvas.height * 0.5 },
        { x: canvas.width * 0.75, y: canvas.height * 0.6 },
        { x: canvas.width * 0.8, y: canvas.height * 0.7 }
    ],
    [
        { x: canvas.width * 0.8, y: canvas.height * 0.7 },
        { x: canvas.width * 0.85, y: canvas.height * 0.6 },
        { x: canvas.width * 0.9, y: canvas.height * 0.7 },
        { x: canvas.width * 0.85, y: canvas.height * 0.5 }
    ]
];

let currentLevel = 0;
let bird;
let targets;
let score = 0;
const BALLS_PER_LEVEL = 3;
let ballsLeft = BALLS_PER_LEVEL;
let changingLevel = false;
let isRunning = false;
let gameLoopId = null;

function loadLevel(levelIdx) {
    bird = new Bird(BIRD_START_X, BIRD_START_Y);
    targets = levels[levelIdx].map(pos => new Target(pos.x, pos.y));
    ballsLeft = BALLS_PER_LEVEL;
    changingLevel = false;
    nextBtn.style.display = 'none';
    updateLevelBar(); // อัปเดตแถบ level
    // รีเซ็ตคะแนนที่นี่ถ้าต้องการให้เริ่มใหม่ทุกครั้ง
    // score = 0;
    // scoreElement.textContent = `Score: ${score}`;
}

function init() {
    loadLevel(currentLevel);
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startGameLoop();
}

// ปรับสไตล์ปุ่มให้ดูสวยขึ้น
[nextBtn, changeLevelBtn, restartBtn].forEach(btn => {
    if (btn) {
        btn.style.background = "linear-gradient(90deg, #00e676 0%, #ffd600 100%)";
        btn.style.border = "none";
        btn.style.borderRadius = "8px";
        btn.style.color = "#263238";
        btn.style.fontWeight = "bold";
        btn.style.fontSize = "18px";
        btn.style.padding = "10px 24px";
        btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
        btn.style.cursor = "pointer";
        btn.style.transition = "transform 0.1s";
        btn.onmousedown = () => btn.style.transform = "scale(0.96)";
        btn.onmouseup = () => btn.style.transform = "scale(1)";
        btn.onmouseleave = () => btn.style.transform = "scale(1)";
    }
});

// เพิ่มแถบแสดงเลเวลปัจจุบัน
let levelBar = document.getElementById('levelBar');
if (!levelBar) {
    levelBar = document.createElement('div');
    levelBar.id = 'levelBar';
    levelBar.style.position = 'absolute';
    levelBar.style.top = '10px';
    levelBar.style.right = '40px';
    levelBar.style.padding = '12px 32px';
    levelBar.style.background = 'rgba(0,0,0,0.5)';
    levelBar.style.color = '#ffd600';
    levelBar.style.fontSize = '28px';
    levelBar.style.fontWeight = 'bold';
    levelBar.style.borderRadius = '16px';
    levelBar.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
    levelBar.style.letterSpacing = '2px';
    levelBar.style.zIndex = 10;
    document.body.appendChild(levelBar);
}
function updateLevelBar() {
    levelBar.textContent = `LEVEL ${currentLevel + 1}`;
    levelBar.style.animation = "none";
    // Animation effect
    setTimeout(() => {
        levelBar.style.animation = "pop 0.3s";
    }, 10);
}
const style = document.createElement('style');
style.innerHTML = `
@keyframes pop {
    0% { transform: scale(1.2);}
    100% { transform: scale(1);}
}
`;
document.head.appendChild(style);

canvas.addEventListener('mousedown', (e) => {
    if (!bird) return; // ป้องกัน error ถ้า bird ยังไม่ถูกสร้าง
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (!bird.isLaunched && Math.hypot(mouseX - bird.x, mouseY - bird.y) < bird.radius) {
        bird.isDragging = true;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (!bird) return;
    if (bird.isDragging && !bird.isLaunched) {
        const rect = canvas.getBoundingClientRect();
        // จำกัดไม่ให้ลากออกนอก canvas
        let newX = e.clientX - rect.left;
        let newY = e.clientY - rect.top;
        // จำกัดขอบเขต
        newX = Math.max(bird.radius, Math.min(canvas.width - bird.radius, newX));
        newY = Math.max(bird.radius, Math.min(canvas.height - bird.radius, newY));
        bird.x = newX;
        bird.y = newY;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (!bird) return;
    if (bird.isDragging && !bird.isLaunched) {
        bird.isDragging = false;
        const dx = BIRD_START_X - bird.x;
        const dy = BIRD_START_Y - bird.y;
        bird.isLaunched = true;
        bird.velocityX = dx * 0.15;
        bird.velocityY = dy * 0.15;
    }
});

restartBtn.addEventListener('click', () => {
    changingLevel = false;
    loadLevel(currentLevel);
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startGameLoop();
});

nextBtn.addEventListener('click', () => {
    changingLevel = false;
    currentLevel++;
    if (currentLevel >= levels.length) currentLevel = 0;
    loadLevel(currentLevel);
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startGameLoop();
});

changeLevelBtn.addEventListener('click', () => {
    changingLevel = false;
    currentLevel++;
    if (currentLevel >= levels.length) currentLevel = 0;
    loadLevel(currentLevel);
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startGameLoop();
});

function resetBirdIfNeeded() {
    // ถ้าลูกบอลออกนอกจอหรือหยุดนิ่ง ให้เปลี่ยนลูกใหม่ถ้ายังเหลือ
    if (
        bird.isLaunched &&
        (bird.x < -bird.radius || bird.x > canvas.width + bird.radius ||
         bird.y > canvas.height + bird.radius || bird.y < -bird.radius ||
         (Math.abs(bird.velocityX) < 0.5 && Math.abs(bird.velocityY) < 0.5 && bird.y > canvas.height * 0.7))
    ) {
        if (ballsLeft > 1) {
            ballsLeft--;
            bird = new Bird(BIRD_START_X, BIRD_START_Y);
        } else {
            ballsLeft = 0;
            // เมื่อยิงหมดแล้ว ให้รีเซ็ตด่านทันที
            setTimeout(() => {
                loadLevel(currentLevel);
                score = 0;
                scoreElement.textContent = `Score: ${score}`;
            }, 1000);
        }
    }
}

function gameLoop() {
    // พื้นหลัง gradient
    let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, "#263238");
    bgGrad.addColorStop(1, "#90caf9");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (bird) {
        bird.update();
        bird.draw();
    }

    let allHit = true;
    if (targets && Array.isArray(targets)) {
        targets.forEach(target => {
            target.draw();
            if (bird && bird.isLaunched && target.checkCollision(bird) && !target.isHit) {
                target.isHit = true;
                score += 100;
                scoreElement.textContent = `Score: ${score}`;
            }
            if (!target.isHit) allHit = false;
        });
    } else {
        allHit = false;
    }

    // วาดหนังสติ๊กแบบ gradient
    let slingGrad = ctx.createLinearGradient(BIRD_START_X, BIRD_START_Y + 50, BIRD_START_X, BIRD_START_Y - 50);
    slingGrad.addColorStop(0, "#8d6e63");
    slingGrad.addColorStop(1, "#ffe082");
    ctx.beginPath();
    ctx.moveTo(BIRD_START_X, BIRD_START_Y + 50);
    ctx.lineTo(BIRD_START_X, BIRD_START_Y - 50);
    ctx.strokeStyle = slingGrad;
    ctx.lineWidth = 8;
    ctx.shadowColor = "#ffb300";
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // แสดงจำนวนลูกบอลที่เหลือและคะแนนแบบเท่
    ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#263238";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#263238";
    ctx.shadowBlur = 8;
    ctx.strokeText("Balls left: " + ballsLeft, 30, 50);
    ctx.strokeText("Score: " + score, 30, 90);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#00e676";
    ctx.fillText("Balls left: " + ballsLeft, 30, 50);
    ctx.fillStyle = "#ffd600";
    ctx.fillText("Score: " + score, 30, 90);

    // ถ้าเป้าหมายโดนหมด ให้แสดงปุ่ม Next Level และหยุด loop
    if (allHit && !changingLevel) {
        changingLevel = true;
        if (bird) {
            bird.isDragging = false;
            bird.isLaunched = true;
        }
        nextBtn.style.display = 'inline-block';
        // ไม่เรียกซ้ำ loop
        gameLoopId = null;
        return;
    }
    nextBtn.style.display = 'none';

    resetBirdIfNeeded();

    gameLoopId = requestAnimationFrame(gameLoop);
}

function startGameLoop() {
    if (gameLoopId !== null) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

init();
