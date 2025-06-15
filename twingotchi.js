// === Constants and State ===
const centerX = g.getWidth() / 2;
const centerY = g.getHeight() / 2;
const faceRadius = 105;
let wobble = 0;
let wobbleDir = 1;
let blinkNow = false;
let currentExpression = "neutral";

// === Load State ===
let state = require("Storage").readJSON("twingotchi.json", true) || {
    hunger: 60,
    fun: 60,
    energy: 80,
    isAlive: true,
    score: 0
};
let previousState = {
    hunger: state.hunger,
    fun: state.fun,
    energy: state.energy,
    isAlive: state.isAlive
};

function saveState() {
    require("Storage").write("twingotchi.json", state);
}

// === Drawing Functions ===
function drawPig() {
    g.clear();
    g.clearRect(0, 24, g.getWidth(), g.getHeight());
    drawFace();
    drawEars();
    drawEyes();
    drawSnout();
    drawMouth();
    drawButtons();
    g.flip();
}

function drawFace() {
    let color = !state.isAlive ? [0.5, 0.5, 0.5] :
        state.hunger < 20 ? [1, 0.9, 0.7] :
            state.fun > 70 ? [1, 0.8, 0.9] :
                [1, 0.75, 0.8];
    g.setColor(color[0], color[1], color[2]);
    let offsetX = Math.sin(wobble) * 3;
    g.fillCircle(centerX + offsetX, centerY, faceRadius);
}

function drawEars() {
    let offsetX = Math.sin(wobble) * 3;
    g.setColor(1, 0.6, 0.7);
    g.fillPoly([
        centerX - 35 + offsetX, centerY - 45,
        centerX - 48 + offsetX, centerY - 70,
        centerX - 20 + offsetX, centerY - 65
    ]);
    g.fillPoly([
        centerX + 35 + offsetX, centerY - 45,
        centerX + 48 + offsetX, centerY - 70,
        centerX + 20 + offsetX, centerY - 65
    ]);
}

function drawEyes() {
    let offsetX = Math.sin(wobble) * 3;
    g.setColor(0, 0, 0);
    if (blinkNow) {
        g.drawLine(centerX - 20 + offsetX, centerY - 15, centerX - 8 + offsetX, centerY - 15);
        g.drawLine(centerX + 8 + offsetX, centerY - 15, centerX + 20 + offsetX, centerY - 15);
        return;
    }

    if (currentExpression === "happy" || state.fun > 70) {
        drawHappyEyes(offsetX);
    } else if (state.hunger < 30 || state.energy < 30) {
        drawTiredEyes(offsetX);
    } else {
        g.fillCircle(centerX - 15 + offsetX, centerY - 15, 4);
        g.fillCircle(centerX + 15 + offsetX, centerY - 15, 4);
    }
}

function drawHappyEyes(offsetX) {
    g.drawLine(centerX - 20 + offsetX, centerY - 10, centerX - 10 + offsetX, centerY - 16);
    g.drawLine(centerX - 10 + offsetX, centerY - 16, centerX - 5 + offsetX, centerY - 12);
    g.drawLine(centerX + 5 + offsetX, centerY - 12, centerX + 10 + offsetX, centerY - 16);
    g.drawLine(centerX + 10 + offsetX, centerY - 16, centerX + 20 + offsetX, centerY - 10);
}

function drawTiredEyes(offsetX) {
    g.drawLine(centerX - 20 + offsetX, centerY - 18, centerX - 10 + offsetX, centerY - 12);
    g.drawLine(centerX - 10 + offsetX, centerY - 12, centerX - 5 + offsetX, centerY - 18);
    g.drawLine(centerX + 5 + offsetX, centerY - 18, centerX + 10 + offsetX, centerY - 12);
    g.drawLine(centerX + 10 + offsetX, centerY - 12, centerX + 20 + offsetX, centerY - 18);
}

function drawSnout() {
    let offsetX = Math.sin(wobble) * 3;
    g.setColor(1, 0.6, 0.7);
    g.fillCircle(centerX + offsetX, centerY + 15, 14);
    g.setColor(0, 0, 0);
    g.fillCircle(centerX - 6 + offsetX, centerY + 15, 2);
    g.fillCircle(centerX + 6 + offsetX, centerY + 15, 2);
}

function drawMouth() {
    let offsetX = Math.sin(wobble) * 3;
    if (!state.isAlive) {
        g.drawLine(centerX - 12 + offsetX, centerY + 30, centerX + 12 + offsetX, centerY + 42);
        g.drawLine(centerX + 12 + offsetX, centerY + 30, centerX - 12 + offsetX, centerY + 42);
    } else if (currentExpression === "happy" || state.fun > 70) {
        g.drawLine(centerX - 15 + offsetX, centerY + 35, centerX - 5 + offsetX, centerY + 40);
        g.drawLine(centerX - 5 + offsetX, centerY + 40, centerX + 5 + offsetX, centerY + 40);
        g.drawLine(centerX + 5 + offsetX, centerY + 40, centerX + 15 + offsetX, centerY + 35);
    } else if (state.hunger < 30 || state.energy < 30) {
        g.drawLine(centerX - 15 + offsetX, centerY + 42, centerX + 15 + offsetX, centerY + 42);
    } else {
        g.drawLine(centerX - 15 + offsetX, centerY + 35, centerX + 15 + offsetX, centerY + 35);
    }
}

function drawButtons() {
    g.setFont("6x8");
    if (state.isAlive) {
        g.setFontAlign(-1, -1);
        g.drawString("FEED", 5, g.getHeight() - 8);
        g.setFontAlign(0, -1);
        g.drawString("PLAY", centerX, g.getHeight() - 8);
        g.setFontAlign(1, -1);
        g.drawString("SLEEP", g.getWidth() - 5, g.getHeight() - 8);
    } else {
        g.setFontAlign(0, -1);
        g.drawString("PRESS ANY BUTTON TO RESET", centerX, g.getHeight() - 8);
    }
}

// === Input Handling ===
function handleAction(action) {
    if (!state.isAlive) {
        Bangle.buzz(50);
        return;
    }

    switch (action) {
        case "feed":
            state.hunger = Math.min(100, state.hunger + 30);
            break;
        case "play":
            state.fun = Math.min(100, state.fun + 20);
            state.energy = Math.max(0, state.energy - 10);
            break;
        case "sleep":
            state.energy = Math.min(100, state.energy + 30);
            break;
    }

    currentExpression = "happy";
    Bangle.buzz(200);
    drawPig();
    saveState();

    setTimeout(() => {
        currentExpression = "neutral";
        drawPig();
    }, 3000);
}

function resetPet() {
    state = { hunger: 60, fun: 60, energy: 80, isAlive: true, score: 0 };
    previousState = {
        hunger: state.hunger,
        fun: state.fun,
        energy: state.energy,
        isAlive: state.isAlive
    };
    currentExpression = "happy";
    Bangle.buzz(500);
    drawPig();
    saveState();

    setTimeout(() => {
        currentExpression = "neutral";
        drawPig();
    }, 5000);
}

// === Timers and Vitals ===
function startAnimationLoops() {
    setInterval(() => {
        if (state.isAlive) {
            wobble += 0.2 * wobbleDir;
            if (Math.abs(wobble) > 2) wobbleDir *= -1;
            drawPig();
        }
    }, 200);

    setInterval(() => {
        if (state.isAlive) {
            blinkNow = true;
            drawPig();
            setTimeout(() => {
                blinkNow = false;
                drawPig();
            }, 200);
        }
    }, 4000 + Math.random() * 4000);

    setInterval(() => {
        if (state.isAlive) {
            state.hunger = Math.max(0, state.hunger - 8);
            state.fun = Math.max(0, state.fun - 5);
            if (state.hunger <= 0 || state.energy <= 0) {
                state.isAlive = false;
                Bangle.buzz(500);
            }
            drawPig();
            saveState();
        }
    }, 5000);
}

// === Input Setup ===
function startInput() {
    Bangle.on("touch", (_, xy) => {
        if (!xy) return;
        if (!state.isAlive) return resetPet();
        let third = g.getWidth() / 3;
        if (xy.x < third) handleAction("feed");
        else if (xy.x < 2 * third) handleAction("play");
        else handleAction("sleep");
    });

    setWatch(() => state.isAlive ? handleAction("feed") : resetPet(), BTN1, { repeat: true, edge: "falling" });
    setWatch(() => state.isAlive ? handleAction("play") : resetPet(), BTN2, { repeat: true, edge: "falling" });
    setWatch(() => state.isAlive ? handleAction("sleep") : resetPet(), BTN3, { repeat: true, edge: "falling" });
}

// === App Startup ===
function initialize() {
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    Bangle.setLCDTimeout(0);
    drawPig();
    startInput();
    startAnimationLoops();
}

initialize();
