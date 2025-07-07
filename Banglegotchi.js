// === CONFIGURATION ===
Bangle.setLCDTimeout(0);
Bangle.setOptions({ wakeOnBTN1: false });
Bangle.loadWidgets = function() {};
Bangle.drawWidgets = function() {};
g.clear();

// === STATE ===
let mainInterval = null;
let needs = { hunger: 100, loneliness: 100, cleanliness: 100, energy: 100 };
let menuOptions = ["Feed", "Pet", "Clean", "Sleep"];
let menuVisible = false;
let selectedOption = 0;
let wobble = 0;
let wobbleDir = 1;
let blinkNow = false;
let isSad = false;
let centerX = g.getWidth() / 2;
let centerY = g.getHeight() / 2;
let faceRadius = 60;
let emergency = false;
let emergencyTimer = null;
let vibrationInterval = null;
let pigAlive = true;

// === ACCELEROMETER STATE ===
let accelData = { x: 0, y: 0, z: 0 };
let lastMovementTime = Date.now();
let shakeThreshold = 1.3;
let inactivityThreshold = 30000;
let inactivityCheckInterval = null;
let restlessVibrationInterval = null;
let isRestless = false;
let shakeAnimation = 0;
let shakeAnimationTimer = null;

// === ACCELEROMETER FUNCTIONS ===
function startAccelerometer() {
  Bangle.setPollInterval(200);
  Bangle.on('accel', handleAccelData);
  inactivityCheckInterval = setInterval(checkInactivity, 5000);
}

function handleAccelData(data) {
  let prev = accelData;
  accelData = data;
  let dx = Math.abs(data.x - prev.x);
  let dy = Math.abs(data.y - prev.y);
  let dz = Math.abs(data.z - prev.z);
  let mag = Math.sqrt(dx*dx + dy*dy + dz*dz);

  if (mag > 0.3) {
    lastMovementTime = Date.now();
    if (isRestless) stopRestlessBehavior();
  }

  if (mag > shakeThreshold && pigAlive && !menuVisible) handleShake();
}

function handleShake() {
  needs.loneliness = Math.min(100, needs.loneliness + 15);
  needs.energy = Math.min(100, needs.energy + 5);
  triggerShakeAnimation();
  Bangle.buzz(150);
  Bluetooth.println("SHAKE_PLAY " + JSON.stringify(needs));
}

function triggerShakeAnimation() {
  shakeAnimation = 10;
  if (shakeAnimationTimer) clearTimeout(shakeAnimationTimer);
  shakeAnimationTimer = setTimeout(() => shakeAnimation = 0, 2000);
}

function checkInactivity() {
  if (!pigAlive || menuVisible) return;
  let timeSince = Date.now() - lastMovementTime;
  if (timeSince > inactivityThreshold && !isRestless) startRestlessBehavior();
}

function startRestlessBehavior() {
  if (isRestless || !pigAlive) return;
  isRestless = true;
  isSad = true;
  restlessVibrationInterval = setInterval(() => {
    if (pigAlive && isRestless) {
      Bangle.buzz(200);
      needs.loneliness = Math.max(0, needs.loneliness - 2);
    }
  }, 3000);
  Bluetooth.println("PIG_RESTLESS needs attention!");
}

function stopRestlessBehavior() {
  if (!isRestless) return;
  isRestless = false;
  if (restlessVibrationInterval) {
    clearInterval(restlessVibrationInterval);
    restlessVibrationInterval = null;
  }
  setTimeout(() => {
    if (!isSadFromNeeds()) isSad = false;
  }, 1000);
  Bluetooth.println("PIG_HAPPY movement detected!");
}

function isSadFromNeeds() {
  var keys = Object.keys(needs);
  for (var i = 0; i < keys.length; i++) {
    if (needs[keys[i]] < 30) return true;
  }
  return false;
}

// === DRAWING FUNCTIONS ===
function drawEmergencyIcon() {
  g.setColor(1, 0, 0);
  g.setFont("6x8", 2);
  g.drawString("!", centerX - 5, centerY + 80);
  g.setFont("6x8", 1);
  g.drawString("EMERGENCY!", centerX - 35, centerY + 100);
}

function drawFace() {
  if (menuVisible) return;
  g.setColor(0, 0, 0);
  g.fillRect(0, 0, g.getWidth(), g.getHeight());

  let baseWobble = Math.sin(wobble) * 3;
  let shakeWobble = shakeAnimation > 0 ? Math.sin(wobble * 3) * 8 : 0;
  let offsetX = baseWobble + shakeWobble;

  let values = Object.keys(needs).map(key => needs[key]);
  let minNeed = Math.min.apply(null, values);
  let faceHue = 0.9 - (0.6 * (1 - minNeed / 100));

  if (isRestless) g.setColor(0.9, 0.7, 0.3);
  else g.setColor(isSad ? 0.8 : faceHue, isSad ? 0.75 : 0.8, isSad ? 0.8 : 1);
  g.fillCircle(centerX + offsetX, centerY, faceRadius);

  g.setColor(1, 0.6, 0.7);
  g.fillPoly([centerX - 30 + offsetX, centerY - 50, centerX - 50 + offsetX, centerY - 80, centerX - 20 + offsetX, centerY - 70]);
  g.fillPoly([centerX + 30 + offsetX, centerY - 50, centerX + 50 + offsetX, centerY - 80, centerX + 20 + offsetX, centerY - 70]);

  g.setColor(0, 0, 0);
  if (blinkNow) {
    g.drawLine(centerX - 20 + offsetX, centerY - 15, centerX - 10 + offsetX, centerY - 15);
    g.drawLine(centerX + 10 + offsetX, centerY - 15, centerX + 20 + offsetX, centerY - 15);
  } else {
    g.fillCircle(centerX - 15 + offsetX, centerY - 15, 5);
    g.fillCircle(centerX + 15 + offsetX, centerY - 15, 5);
  }

  g.setColor(1, 0.6, 0.7);
  g.fillCircle(centerX + offsetX, centerY + 10, 20);
  g.setColor(0, 0, 0);
  g.fillCircle(centerX - 5 + offsetX, centerY + 10, 3);
  g.fillCircle(centerX + 5 + offsetX, centerY + 10, 3);

  g.setColor(0, 0, 0);
  if (isSad || isRestless) {
    g.drawLine(centerX - 15 + offsetX, centerY + 25, centerX + offsetX, centerY + 20);
    g.drawLine(centerX + offsetX, centerY + 20, centerX + 15 + offsetX, centerY + 25);
  } else {
    g.drawLine(centerX - 15 + offsetX, centerY + 25, centerX - 5 + offsetX, centerY + 30);
    g.drawLine(centerX - 5 + offsetX, centerY + 30, centerX + 5 + offsetX, centerY + 30);
    g.drawLine(centerX + 5 + offsetX, centerY + 30, centerX + 15 + offsetX, centerY + 25);
  }

  drawNeedBars();
  if (emergency) drawEmergencyIcon();
}

function drawNeedBars() {
  const labels = { hunger: "Hunger", loneliness: "Love", cleanliness: "Clean", energy: "Energy" };
  const colors = [[1,0,0], [1,0.5,0], [0,0.5,1], [0.5,0,1]];
  const keys = Object.keys(needs);
  const barWidth = 60, barHeight = 15, spacing = 30, left = 5, right = g.getWidth() - barWidth - 5;

  for (let i = 0; i < 4; i++) {
    let val = needs[keys[i]];
    let width = Math.max(5, val * barWidth / 100);
    let y = 30 + (i % 2) * spacing;
    let x = i < 2 ? left : right;
    g.setColor(0.2, 0.2, 0.2); g.fillRect(x, y, x + barWidth, y + barHeight);
    g.setColor(colors[i][0], colors[i][1], colors[i][2]); g.fillRect(x, y, x + width, y + barHeight);
    g.setColor(1, 1, 1); g.drawRect(x, y, x + barWidth, y + barHeight);
    g.setFont("6x8", 1); g.drawString(labels[keys[i]], x + (barWidth - g.stringWidth(labels[keys[i]])) / 2, y + 3);
  }
}

function drawMenu() {
  const yStart = 150, itemHeight = 18;
  g.setColor(0, 0, 0); g.fillRect(60, yStart, 180, yStart + 80);
  g.setColor(1, 1, 1); g.drawRect(60, yStart, 180, yStart + 80);
  g.setFont("6x8", 1.5);
  for (let i = 0; i < menuOptions.length; i++) {
    let text = menuOptions[i];
    let textX = 120 - g.stringWidth(text) / 2;
    let yItem = yStart + 5 + i * itemHeight;
    if (i === selectedOption) {
      g.setColor(1, 1, 0); g.fillRect(65, yItem - 1, 175, yItem + 15); g.setColor(0, 0, 0);
    } else {
      g.setColor(1, 1, 1);
    }
    g.drawString(text, textX, yItem);
  }
}

function handleMenuSelection(action) {
  if (action === "Feed") needs.hunger = Math.min(100, needs.hunger + 30);
  else if (action === "Pet") needs.loneliness = Math.min(100, needs.loneliness + 25);
  else if (action === "Clean") needs.cleanliness = Math.min(100, needs.cleanliness + 40);
  else if (action === "Sleep") needs.energy = Math.min(100, needs.energy + 35);
  
  // Clear emergency state if needs are met
  var allNeedsOk = true;
  var keys = Object.keys(needs);
  for (var i = 0; i < keys.length; i++) {
    if (needs[keys[i]] <= 30) {
      allNeedsOk = false;
      break;
    }
  }
  if (emergency && allNeedsOk) {
    clearEmergency();
  }
  
  Bangle.buzz(200);
  Bluetooth.println("STATUS " + JSON.stringify(needs));
}

function clearEmergency() {
  emergency = false;
  if (emergencyTimer) {
    clearTimeout(emergencyTimer);
    emergencyTimer = null;
  }
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
}

function updateNeeds() {
  if (!pigAlive || menuVisible) return;
  needs.hunger = Math.max(0, needs.hunger - 1);
  needs.loneliness = Math.max(0, needs.loneliness - 0.7);
  needs.cleanliness = Math.max(0, needs.cleanliness - 0.5);
  needs.energy = Math.max(0, needs.energy - 0.6);
  
  if (!isRestless) isSad = isSadFromNeeds();
  
  // Check for emergency conditions - any need below 20
  var hasLowNeed = false;
  var keys = Object.keys(needs);
  for (var i = 0; i < keys.length; i++) {
    if (needs[keys[i]] < 20) {
      hasLowNeed = true;
      break;
    }
  }
  if (hasLowNeed && !emergency) {
    startEmergency();
  }
}

function tick() {
  if (!pigAlive) return;
  wobble += wobbleDir * 0.2;
  if (Math.abs(wobble) > 2) wobbleDir = -wobbleDir;
  blinkNow = Math.random() < 0.05;
  if (shakeAnimation > 0) shakeAnimation--;
  updateNeeds();
  if (menuVisible) {
    drawMenu();
  } else {
    drawFace();
  }
}

function startEmergency() {
  if (emergency) return;
  emergency = true;
  vibrationInterval = setInterval(() => {
    if (pigAlive && emergency) Bangle.buzz(500);
  }, 1000);
  emergencyTimer = setTimeout(() => {
    if (emergency) {
      clearEmergency();
      Bangle.buzz(1000);
      g.clear();
      g.setColor(1, 0, 0);
      g.setFont("6x8", 2);
      g.drawString("Your pig died :(", 20, 100);
      g.setFont("6x8", 1);
      g.drawString("Press BTN1 to revive", 30, 140);
      if (mainInterval) {
        clearInterval(mainInterval);
        mainInterval = null;
      }
      pigAlive = false;
      Bluetooth.println("PIG_DIED");
    }
  }, 20000);
  Bluetooth.println("EMERGENCY_STARTED");
}

function revivePig() {
  needs = { hunger: 50, loneliness: 50, cleanliness: 50, energy: 50 };
  pigAlive = true;
  menuVisible = false;
  selectedOption = 0;
  isRestless = false;
  isSad = false;
  lastMovementTime = Date.now();
  
  clearEmergency();
  
  if (restlessVibrationInterval) {
    clearInterval(restlessVibrationInterval);
    restlessVibrationInterval = null;
  }
  
  if (!mainInterval) mainInterval = setInterval(tick, 500);
  g.clear();
  drawFace();
  Bluetooth.println("PIG_REVIVED " + JSON.stringify(needs));
}

// === CLEANUP FUNCTION ===
function cleanup() {
  if (mainInterval) clearInterval(mainInterval);
  if (vibrationInterval) clearInterval(vibrationInterval);
  if (restlessVibrationInterval) clearInterval(restlessVibrationInterval);
  if (inactivityCheckInterval) clearInterval(inactivityCheckInterval);
  if (emergencyTimer) clearTimeout(emergencyTimer);
  if (shakeAnimationTimer) clearTimeout(shakeAnimationTimer);
}

// === BUTTONS ===
setWatch(() => {
  if (!pigAlive) {
    revivePig();
  } else if (menuVisible) {
    selectedOption = (selectedOption - 1 + menuOptions.length) % menuOptions.length;
    drawMenu();
  }
}, BTN1, { repeat: true, edge: "rising" });

setWatch(() => {
  if (!pigAlive) return;
  if (!menuVisible) {
    menuVisible = true;
    selectedOption = 0;
    drawMenu();
  } else {
    handleMenuSelection(menuOptions[selectedOption]);
    menuVisible = false;
    drawFace();
  }
}, BTN2, { repeat: true, edge: "rising" });

setWatch(() => {
  if (!pigAlive || !menuVisible) return;
  selectedOption = (selectedOption + 1) % menuOptions.length;
  drawMenu();
}, BTN3, { repeat: true, edge: "rising" });

// === BLUETOOTH ===
Bluetooth.setConsole(1);
Bluetooth.on('data', function(data) {
  data = data.trim().toLowerCase();
  switch (data) {
    case "feed": handleMenuSelection("Feed"); break;
    case "pet": handleMenuSelection("Pet"); break;
    case "clean": handleMenuSelection("Clean"); break;
    case "sleep": handleMenuSelection("Sleep"); break;
    case "status": Bluetooth.println("STATUS " + JSON.stringify(needs)); break;
    case "revive": if (!pigAlive) revivePig(); break;
  }
});

// === INIT ===
mainInterval = setInterval(tick, 500);
drawFace();
startAccelerometer();

// === Optional periodic status ===
setInterval(() => {
  if (NRF.getSecurityStatus().connected && pigAlive) {
    Bluetooth.println("STATUS " + JSON.stringify(needs));
  }
}, 10000);

// === Cleanup on reset ===
E.on('kill', cleanup);
