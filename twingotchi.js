// === CONFIGURATION ===
Bangle.setLCDTimeout(0);
Bangle.setOptions({ wakeOnBTN1: false });
Bangle.loadWidgets = function() {};
Bangle.drawWidgets = function() {};
g.clear();

// === STATE ===
var mainInterval = null;
var needs = {
  hunger: 0,
  loneliness: 100,
  cleanliness: 100,
  energy: 100
};
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

// === DRAWING ===
function drawFace() {
  if (menuVisible) return;
  g.setColor(0, 0, 0);
  g.fillRect(0, 0, g.getWidth(), g.getHeight());
  var offsetX = Math.sin(wobble) * 3;
  
  // Fixed: Replace spread operator with traditional approach
  var values = [needs.hunger, needs.loneliness, needs.cleanliness, needs.energy];
  var minNeed = Math.min(values[0], values[1], values[2], values[3]);
  var faceHue = 0.9 - (0.6 * (1 - minNeed / 100));
  
  g.setColor(isSad ? 0.8 : faceHue, isSad ? 0.75 : 0.8, isSad ? 0.8 : 1);
  g.fillCircle(centerX + offsetX, centerY, faceRadius);
  
  // Ears
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
  
  // Eyes
  g.setColor(0, 0, 0);
  if (blinkNow) {
    g.drawLine(centerX - 20 + offsetX, centerY - 15, centerX - 10 + offsetX, centerY - 15);
    g.drawLine(centerX + 10 + offsetX, centerY - 15, centerX + 20 + offsetX, centerY - 15);
  } else {
    g.fillCircle(centerX - 15 + offsetX, centerY - 15, 5);
    g.fillCircle(centerX + 15 + offsetX, centerY - 15, 5);
  }
  
  // Snout
  g.setColor(1, 0.6, 0.7);
  g.fillCircle(centerX + offsetX, centerY + 10, 20);
  g.setColor(0, 0, 0);
  g.fillCircle(centerX - 5 + offsetX, centerY + 10, 3);
  g.fillCircle(centerX + 5 + offsetX, centerY + 10, 3);
  
  // Mouth
  g.setColor(0, 0, 0);
  if (isSad) {
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
    var y = 30 + (i % 2) * barSpacing;
    var x = i < 2 ? leftStart : rightStart;
    
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

function drawEmergencyIcon() {
  g.setColor(1, 0, 0);
  g.fillPoly([
    centerX, centerY - 70,
    centerX - 15, centerY - 40,
    centerX + 15, centerY - 40
  ]);
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

// === LOGIC ===
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
  Bluetooth.println("STATUS " + JSON.stringify(needs));
}

function updateNeeds() {
  if (!pigAlive || menuVisible) return;
  
  needs.hunger = Math.max(0, needs.hunger - 1);
  needs.loneliness = Math.max(0, needs.loneliness - 0.7);
  needs.cleanliness = Math.max(0, needs.cleanliness - 0.5);
  needs.energy = Math.max(0, needs.energy - 0.6);
  
  // Fixed: Replace Object.values with manual array creation
  var needsArray = [needs.hunger, needs.loneliness, needs.cleanliness, needs.energy];
  isSad = false;
  for (var i = 0; i < needsArray.length; i++) {
    if (needsArray[i] < 30) {
      isSad = true;
      break;
    }
  }
  
  if (needs.hunger >= 100 && !emergency) {
    startEmergency();
  }
}

function tick() {
  if (!pigAlive) return;
  
  wobble += wobbleDir * 0.2;
  if (Math.abs(wobble) > 2) wobbleDir = -wobbleDir;
  blinkNow = (Math.random() < 0.05);
  
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
  vibrationInterval = setInterval(function() { Bangle.buzz(500); }, 1000);
  
  emergencyTimer = setTimeout(function() {
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
  
  clearInterval(vibrationInterval);
  vibrationInterval = null;
  
  if (!mainInterval) mainInterval = setInterval(tick, 500);
  
  g.clear();
  drawFace();
  Bluetooth.println("STATUS " + JSON.stringify(needs));
}

// === BLUETOOTH ===
Bluetooth.setConsole(1);
Bluetooth.on('data', function(data) {
  data = data.trim().toLowerCase();
  switch(data) {
    case "feed": handleMenuSelection("Feed"); break;
    case "pet": handleMenuSelection("Pet"); break;
    case "clean": handleMenuSelection("Clean"); break;
    case "sleep": handleMenuSelection("Sleep"); break;
    case "status": Bluetooth.println("STATUS " + JSON.stringify(needs)); break;
  }
});

// === BUTTONS ===
setWatch(function() {
  if (!pigAlive) revivePig();
  else if (menuVisible) {
    selectedOption = (selectedOption - 1 + menuOptions.length) % menuOptions.length;
    drawMenu();
  }
}, BTN1, { repeat: true, edge: "rising" });

setWatch(function() {
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

setWatch(function() {
  if (!pigAlive || !menuVisible) return;
  selectedOption = (selectedOption + 1) % menuOptions.length;
  drawMenu();
}, BTN3, { repeat: true, edge: "rising" });

// === INIT ===
mainInterval = setInterval(tick, 500);
drawFace();
Bluetooth.println("STATUS " + JSON.stringify(needs));