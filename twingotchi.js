// === CONFIGURATION ===
Bangle.setLCDTimeout(0);
Bangle.setOptions({ wakeOnBTN1: false });
Bangle.loadWidgets = function() {};
Bangle.drawWidgets = function() {};
g.clear();

// === STATE ===
var mainInterval = null;
var needs = { hunger: 0, loneliness: 100, cleanliness: 100, energy: 100 };
var menuOptions = ["Feed", "Pet", "Clean", "Sleep"];
var menuVisible = false;
var selectedOption = 0;
var wobble = 0;
var wobbleDir = 1;
var blinkNow = false;
var isSad = false;
var centerX = g.getWidth() / 2;
var centerY = g.getHeight() / 2;
var faceRadius = 60;
var emergency = false;
var emergencyTimer = null;
var vibrationInterval = null;
var pigAlive = true;

// === ACCELEROMETER STATE ===
var accelData = { x: 0, y: 0, z: 0 };
var lastMovementTime = Date.now();
var shakeThreshold = 1.3;
var inactivityThreshold = 30000;
var inactivityCheckInterval = null;
var restlessVibrationInterval = null;
var isRestless = false;
var shakeAnimation = 0;
var shakeAnimationTimer = null;

function startAccelerometer() {
  Bangle.setPollInterval(200);
  Bangle.on('accel', handleAccelData);
  inactivityCheckInterval = setInterval(checkInactivity, 5000);
}

function handleAccelData(data) {
  var prevAccel = {x: accelData.x, y: accelData.y, z: accelData.z};
  accelData = data;
  var deltaX = Math.abs(data.x - prevAccel.x);
  var deltaY = Math.abs(data.y - prevAccel.y);
  var deltaZ = Math.abs(data.z - prevAccel.z);
  var magnitude = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
  if (magnitude > 0.3) {
    lastMovementTime = Date.now();
    if (isRestless) stopRestlessBehavior();
  }
  if (magnitude > shakeThreshold && pigAlive && !menuVisible) handleShake();
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
  shakeAnimationTimer = setTimeout(() => { shakeAnimation = 0; }, 2000);
}

function checkInactivity() {
  if (!pigAlive || menuVisible) return;
  var timeSinceMovement = Date.now() - lastMovementTime;
  if (timeSinceMovement > inactivityThreshold && !isRestless) startRestlessBehavior();
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
  var arr = [needs.hunger, needs.loneliness, needs.cleanliness, needs.energy];
  return arr.some(n => n < 30);
}

function drawFace() {
  if (menuVisible) return;
  g.setColor(0, 0, 0);
  g.fillRect(0, 0, g.getWidth(), g.getHeight());
  var baseWobble = Math.sin(wobble) * 3;
  var shakeWobble = shakeAnimation > 0 ? Math.sin(wobble * 3) * 8 : 0;
  var offsetX = baseWobble + shakeWobble;
  var values = [needs.hunger, needs.loneliness, needs.cleanliness, needs.energy];
  var minNeed = Math.min(values[0], values[1], values[2], values[3]);
  var faceHue = 0.9 - (0.6 * (1 - minNeed / 100));
  g.setColor(isRestless ? 0.9 : (isSad ? 0.8 : faceHue), isRestless ? 0.7 : (isSad ? 0.75 : 0.8), isRestless ? 0.3 : (isSad ? 0.8 : 1));
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
  if (isRestless) drawRestlessIcon();
}

function drawRestlessIcon() {
  g.setColor(1, 0.8, 0);
  g.fillPoly([centerX - 20, centerY - 85, centerX - 5, centerY - 95, centerX - 5, centerY - 75]);
  g.fillPoly([centerX + 5, centerY - 85, centerX + 20, centerY - 95, centerX + 20, centerY - 75]);
  g.setColor(0, 0, 0);
  g.setFont("6x8", 1);
  g.drawString("MOVE", centerX - 12, centerY - 88);
}

function drawNeedBars() {
  var labels = { hunger: "Hunger", loneliness: "Love", cleanliness: "Clean", energy: "Energy" };
  var colors = [[1,0,0], [1,0.5,0], [0,0.5,1], [0.5,0,1]];
  var keys = Object.keys(needs);
  var barWidth = 60, barHeight = 15, spacing = 30, left = 5, right = g.getWidth() - barWidth - 5;
  for (var i = 0; i < 4; i++) {
    var val = needs[keys[i]];
    var width = Math.max(5, val * barWidth / 100);
    var y = 30 + (i % 2) * spacing;
    var x = i < 2 ? left : right;
    g.setColor(0.2, 0.2, 0.2);
    g.fillRect(x, y, x + barWidth, y + barHeight);
    g.setColor(colors[i][0], colors[i][1], colors[i][2]);
    g.fillRect(x, y, x + width, y + barHeight);
    g.setColor(1, 1, 1);
    g.drawRect(x, y, x + barWidth, y + barHeight);
    g.setFont("6x8", 1);
    g.drawString(labels[keys[i]], x + (barWidth - g.stringWidth(labels[keys[i]])) / 2, y + 3);
  }
}

function drawEmergencyIcon() {
  g.setColor(1, 0, 0);
  g.fillPoly([centerX, centerY - 70, centerX - 15, centerY - 40, centerX + 15, centerY - 40]);
  g.setColor(1, 1, 1);
  g.setFont("6x8", 2);
  g.drawString("!", centerX - 4, centerY - 62);
}

function drawMenu() {
  var yStart = 150;
  var itemHeight = 18;
  g.setColor(0, 0, 0);
  g.fillRect(60, yStart, 180, yStart + 80);
  g.setColor(1, 1, 1);
  g.drawRect(60, yStart, 180, yStart + 80);
  g.setFont("6x8", 1.5);
  for (var i = 0; i < menuOptions.length; i++) {
    var text = menuOptions[i];
    var textX = 120 - g.stringWidth(text) / 2;
    var yItem = yStart + 5 + i * itemHeight;
    if (i === selectedOption) {
      g.setColor(1, 1, 0);
      g.fillRect(65, yItem - 1, 175, yItem + 15);
      g.setColor(0, 0, 0);
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
  Bangle.buzz(200);
  Bluetooth.println("STATUS " + JSON.stringify(needs));
}

function updateNeeds() {
  if (!pigAlive || menuVisible) return;
  needs.hunger -= 1;
  needs.loneliness -= 0.7;
  needs.cleanliness -= 0.5;
  needs.energy -= 0.6;
  if (!isRestless) isSad = isSadFromNeeds();
  if (needs.hunger >= 100 && !emergency) startEmergency();
}

function tick() {
  if (!pigAlive) return;
  wobble += wobbleDir * 0.2;
  if (Math.abs(wobble) > 2) wobbleDir = -wobbleDir;
  blinkNow = (Math.random() < 0.05);
  if (shakeAnimation > 0) shakeAnimation--;
  updateNeeds();
  if (menuVisible) drawMenu();
  else drawFace();
}

function startEmergency() {
  if (emergency) return;
  emergency = true;
  vibrationInterval = setInterval(() => Bangle.buzz(500), 1000);
  emergencyTimer = setTimeout(() => {
    if (emergency) {
      Bangle.buzz(1000);
      g.clear();
      g.setColor(1, 0, 0);
      g.setFont("6x8", 2);
      g.drawString("Your pig died :(", 20, 100);
      g.setFont("6x8", 1);
      g.drawString("Press BTN1 to revive", 30, 140);
      clearInterval(mainInterval);
      clearInterval(vibrationInterval);
      pigAlive = false;
    }
  }, 20000);
}

function revivePig() {
  needs = { hunger: 50, loneliness: 50, cleanliness: 50, energy: 50 };
  pigAlive = true;
  emergency = false;
  menuVisible = false;
  isRestless = false;
  lastMovementTime = Date.now();
  clearInterval(vibrationInterval);
  clearInterval(restlessVibrationInterval);
  vibrationInterval = null;
  restlessVibrationInterval = null;
  if (!mainInterval) mainInterval = setInterval(tick, 500);
  g.clear();
  drawFace();
  Bluetooth.println("STATUS " + JSON.stringify(needs));
}

setWatch(() => {
  if (!pigAlive) revivePig();
  else if (menuVisible) {
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

Bluetooth.on('data', function(data) {
  data = data.trim().toLowerCase();
  if (data === "feed") handleMenuSelection("Feed");
  else if (data === "pet") handleMenuSelection("Pet");
  else if (data === "clean") handleMenuSelection("Clean");
  else if (data === "sleep") handleMenuSelection("Sleep");
  else if (data === "status") Bluetooth.println("STATUS " + JSON.stringify(needs));
});

startAccelerometer();
mainInterval = setInterval(tick, 500);
drawFace();

// NRF.setServices({}, { uart: true });
// E.setConsole(null);
