// === Constants and State ===
const centerX = g.getWidth() / 2;
const centerY = g.getHeight() / 2;
const faceRadius = 70;
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

// Menu and Need Bars
let menuOptions = ["Feed", "Pet", "Clean", "Sleep"];
let menuVisible = false;
let selectedOption = 0;
let needs = {
    hunger: state.hunger,
    loneliness: 50,
    cleanliness: 50,
    energy: state.energy
};

function drawNeedBars() {
    var needLabels = {
        hunger: "Hunger",
        loneliness: "Love",
        cleanliness: "Clean",
        energy: "Energy"
    };

    var colors = [
        [1, 0, 0],
        [1, 0.5, 0],
        [0, 0.5, 1],
        [0.5, 0, 1]
    ];

    var keys = Object.keys(needs);
    var barWidth = 60;
    var barHeight = 15;
    var barSpacing = 30;
    var leftStart = 5;
    var rightStart = g.getWidth() - barWidth - 5;

    for (var i = 0; i < 4; i++) {
        var val = needs[keys[i]];
        var width = Math.max(5, val * barWidth / 100);
        var y = 40 + (i % 2) * barSpacing;
        var isLeft = i < 2;
        var x = isLeft ? leftStart : rightStart;

        g.setColor(0.2, 0.2, 0.2);
        g.fillRect(x, y, x + barWidth, y + barHeight);
        g.setColor(colors[i][0], colors[i][1], colors[i][2]);
        g.fillRect(x, y, x + width, y + barHeight);
        g.setColor(1, 1, 1);
        g.drawRect(x, y, x + barWidth, y + barHeight);
        g.setFont("6x8", 1);
        g.setColor(1, 1, 1);
        var label = needLabels[keys[i]];
        var labelX = x + (barWidth - g.stringWidth(label)) / 2;
        g.drawString(label, labelX, y + 3);
    }
}

function drawMenu() {
    g.setColor(0, 0, 0);
    g.fillRect(60, 100, 180, 180);
    g.setColor(1, 1, 1);
    g.drawRect(60, 100, 180, 180);
    g.setFont("6x8", 1.5);
    for (let i = 0; i < menuOptions.length; i++) {
        let text = menuOptions[i];
        let textX = 120 - g.stringWidth(text) / 2;
        if (i === selectedOption) {
            g.setColor(1, 1, 0);
            g.fillRect(65, 105 + i * 18, 175, 105 + i * 18 + 16);
            g.setColor(0, 0, 0);
        } else {
            g.setColor(1, 1, 1);
        }
        g.drawString(text, textX, 106 + i * 18);
    }
}

function handleMenuSelection(action) {
    if (action === "Feed") {
        needs.hunger = Math.min(100, needs.hunger + 30);
        Bangle.buzz(200);
    } else if (action === "Pet") {
        needs.loneliness = Math.min(100, needs.loneliness + 25);
        Bangle.buzz(100);
    } else if (action === "Clean") {
        needs.cleanliness = Math.min(100, needs.cleanliness + 40);
        Bangle.buzz(50);
    } else if (action === "Sleep") {
        needs.energy = Math.min(100, needs.energy + 35);
        Bangle.buzz(300);
    }
    menuVisible = false;
    drawPig();
}

function saveState() {
    state.hunger = needs.hunger;
    state.energy = needs.energy;
    require("Storage").write("twingotchi.json", state);
}

function drawPig() {
    g.clear();
    g.clearRect(0, 24, g.getWidth(), g.getHeight());
    if (menuVisible) {
        drawMenu();
    } else {
        drawFace();
        drawEars();
        drawEyes();
        drawSnout();
        drawMouth();
        drawNeedBars();
    }
    g.flip();
}

function drawFace() {
    let offsetX = Math.sin(wobble) * 3;
    let values = Object.values(needs);
    let minNeed = values.reduce((a, b) => a < b ? a : b);
    let faceHue = 0.9 - (0.6 * (1 - minNeed / 100));

    g.setColor(state.isAlive ? faceHue : 0.5, 0.75, state.isAlive ? 1 : 0.5);
    g.fillCircle(centerX + offsetX, centerY, faceRadius);
}

function drawEars() {
    let offsetX = Math.sin(wobble) * 3;
    g.setColor(1, 0.6, 0.7);
    g.fillPoly([
        centerX - 30 + offsetX, centerY - 50,
        centerX - 50 + offsetX, centerY - 80,
        centerX - 20 + offsetX, centerY - 70
    ]);
    g.fillPoly([
        centerX + 30 + offsetX, centerY - 50,
        centerX + 50 + offsetX, centerY - 80,
        centerX + 20 + offsetX, centerY - 70
    ]);

    g.setColor(1, 0.8, 0.85);
    g.fillPoly([
        centerX - 25 + offsetX, centerY - 55,
        centerX - 40 + offsetX, centerY - 75,
        centerX - 25 + offsetX, centerY - 65
    ]);
    g.fillPoly([
        centerX + 25 + offsetX, centerY - 55,
        centerX + 40 + offsetX, centerY - 75,
        centerX + 25 + offsetX, centerY - 65
    ]);
}

function drawEyes() {
    let offsetX = Math.sin(wobble) * 3;
    g.setColor(0, 0, 0);
    if (blinkNow) {
        g.drawLine(centerX - 20 + offsetX, centerY - 15, centerX - 10 + offsetX, centerY - 15);
        g.drawLine(centerX + 10 + offsetX, centerY - 15, centerX + 20 + offsetX, centerY - 15);
    } else {
        g.fillCircle(centerX - 15 + offsetX, centerY - 15, 5);
        g.fillCircle(centerX + 15 + offsetX, centerY - 15, 5);
        g.setColor(1, 1, 1);
        g.fillCircle(centerX - 17 + offsetX, centerY - 17, 2);
        g.fillCircle(centerX + 13 + offsetX, centerY - 17, 2);
    }
}

function drawSnout() {
    let offsetX = Math.sin(wobble) * 3;
    g.setColor(1, 0.6, 0.7);
    g.fillCircle(centerX + offsetX, centerY + 10, 20);
    g.setColor(0, 0, 0);
    g.fillCircle(centerX - 5 + offsetX, centerY + 10, 3);
    g.fillCircle(centerX + 5 + offsetX, centerY + 10, 3);
    g.setColor(0.5, 0.5, 0.5);
    g.fillCircle(centerX - 5 + offsetX, centerY + 8, 1);
    g.fillCircle(centerX + 5 + offsetX, centerY + 8, 1);
}

function drawMouth() {
    let offsetX = Math.sin(wobble) * 3;
    g.setColor(0, 0, 0);
    if (!state.isAlive) {
        g.drawLine(centerX - 12 + offsetX, centerY + 30, centerX + 12 + offsetX, centerY + 42);
        g.drawLine(centerX + 12 + offsetX, centerY + 30, centerX - 12 + offsetX, centerY + 42);
    } else {
        g.drawLine(centerX - 15 + offsetX, centerY + 25, centerX - 5 + offsetX, centerY + 30);
        g.drawLine(centerX - 5 + offsetX, centerY + 30, centerX + 5 + offsetX, centerY + 30);
        g.drawLine(centerX + 5 + offsetX, centerY + 30, centerX + 15 + offsetX, centerY + 25);
    }
}



function startInput() {
    setWatch(() => {
        if (!state.isAlive) return resetPet();
        if (menuVisible) {
            selectedOption = (selectedOption - 1 + menuOptions.length) % menuOptions.length;
        }
        drawPig();
    }, BTN1, { repeat: true, edge: "rising" });

    setWatch(() => {
        if (!state.isAlive) return;
        if (!menuVisible) {
            menuVisible = true;
        } else {
            handleMenuSelection(menuOptions[selectedOption]);
        }
        drawPig();
    }, BTN2, { repeat: true, edge: "rising" });

    setWatch(() => {
        if (!state.isAlive) return;
        if (menuVisible) {
            selectedOption = (selectedOption + 1) % menuOptions.length;
        }
        drawPig();
    }, BTN3, { repeat: true, edge: "rising" });
}

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
        if (state.isAlive && !menuVisible) {
            needs.hunger = Math.max(0, needs.hunger - 0.5);
            needs.loneliness = Math.max(0, needs.loneliness - 0.3);
            needs.cleanliness = Math.max(0, needs.cleanliness - 0.4);
            needs.energy = Math.max(0, needs.energy - 0.3);
            saveState();
        }
    }, 5000);
}

function resetPet() {
    state = { hunger: 60, fun: 60, energy: 80, isAlive: true, score: 0 };
    needs = {
        hunger: 60,
        loneliness: 50,
        cleanliness: 50,
        energy: 80
    };
    previousState = {
        hunger: state.hunger,
        fun: state.fun,
        energy: state.energy,
        isAlive: true
    };
    currentExpression = "happy";
    Bangle.buzz(500);
    drawPig();
    saveState();
    setTimeout(() => {
        currentExpression = "neutral";
        drawPig();
    }, 3000);
}

function initialize() {
    Bangle.setLCDTimeout(0);
    Bangle.loadWidgets();
    Bangle.drawWidgets();
    drawPig();
    startInput();
    startAnimationLoops();
}

initialize();
