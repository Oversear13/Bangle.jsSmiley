// Initialize
g.clear();
Bangle.setLCDTimeout(0); // Keep screen on
Bangle.loadWidgets();
Bangle.drawWidgets();

// State with persistence
let state = require("Storage").readJSON("twingotchi.json", true) || {
  hunger: 50,
  fun: 50,
  energy: 80,
  isAlive: true,
  score: 0
};

function saveState() {
  require("Storage").write("twingotchi.json", state);
}

// Pig Animation Constants - BIGGER PIG
const centerX = g.getWidth()/2;
const centerY = g.getHeight()/2;
const faceRadius = 105; // Increased from 40
let wobble = 0;
let wobbleDir = 1;
let blinkNow = false;
let currentExpression = "neutral";

// Track previous state for vibration
let previousState = {
  hunger: state.hunger,
  fun: state.fun,
  energy: state.energy,
  isAlive: state.isAlive
};

function drawPig() {
  g.clear();
  
  // Clear widget area properly
  g.clearRect(0, 24, g.getWidth(), g.getHeight());

  // Face background color based on state
  if (!state.isAlive) {
    g.setColor(0.5, 0.5, 0.5); // Gray when dead
  } else if (state.hunger < 20) {
    g.setColor(1, 0.9, 0.7); // Pale when hungry
  } else if (state.fun > 70) {
    g.setColor(1, 0.8, 0.9); // Brighter pink when happy
  } else {
    g.setColor(1, 0.75, 0.8); // Normal pink
  }

  let offsetX = Math.sin(wobble) * 3; // Slightly more wobble for bigger pig

  // Face - BIGGER
  g.fillCircle(centerX + offsetX, centerY, faceRadius);

  // Ears - BIGGER
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

  // Eyes - BIGGER with different expressions
  g.setColor(0, 0, 0);
  if (blinkNow) {
    // Blinking animation
    g.drawLine(centerX - 20 + offsetX, centerY - 15, centerX - 8 + offsetX, centerY - 15);
    g.drawLine(centerX + 8 + offsetX, centerY - 15, centerX + 20 + offsetX, centerY - 15);
  } else {
    // Regular eyes with different expressions
    if (currentExpression === "happy" || state.fun > 70) {
      // Happy eyes - curved upward lines
      g.drawLine(centerX - 20 + offsetX, centerY - 12, centerX - 10 + offsetX, centerY - 18);
      g.drawLine(centerX - 10 + offsetX, centerY - 18, centerX - 5 + offsetX, centerY - 12);
      g.drawLine(centerX + 5 + offsetX, centerY - 12, centerX + 10 + offsetX, centerY - 18);
      g.drawLine(centerX + 10 + offsetX, centerY - 18, centerX + 20 + offsetX, centerY - 12);
    } else if (state.hunger < 30 || state.energy < 30) {
      // Tired/sad eyes - droopy
      g.drawLine(centerX - 20 + offsetX, centerY - 18, centerX - 10 + offsetX, centerY - 12);
      g.drawLine(centerX - 10 + offsetX, centerY - 12, centerX - 5 + offsetX, centerY - 18);
      g.drawLine(centerX + 5 + offsetX, centerY - 18, centerX + 10 + offsetX, centerY - 12);
      g.drawLine(centerX + 10 + offsetX, centerY - 12, centerX + 20 + offsetX, centerY - 18);
    } else {
      // Normal eyes - circles
      g.fillCircle(centerX - 15 + offsetX, centerY - 15, 4);
      g.fillCircle(centerX + 15 + offsetX, centerY - 15, 4);
    }
  }

  // Snout - BIGGER
  g.setColor(1, 0.6, 0.7);
  g.fillCircle(centerX + offsetX, centerY + 15, 14);
  g.setColor(0, 0, 0);
  g.fillCircle(centerX - 6 + offsetX, centerY + 15, 2);
  g.fillCircle(centerX + 6 + offsetX, centerY + 15, 2);

  // Mouth - BIGGER with different expressions
  if (!state.isAlive) {
    // Dead - X mouth
    g.drawLine(centerX - 12 + offsetX, centerY + 30, centerX + 12 + offsetX, centerY + 42);
    g.drawLine(centerX + 12 + offsetX, centerY + 30, centerX - 12 + offsetX, centerY + 42);
  } else if (currentExpression === "happy" || state.fun > 70) {
    // Happy - curved smile using multiple lines
    g.drawLine(centerX - 15 + offsetX, centerY + 35, centerX - 10 + offsetX, centerY + 40);
    g.drawLine(centerX - 10 + offsetX, centerY + 40, centerX - 5 + offsetX, centerY + 42);
    g.drawLine(centerX - 5 + offsetX, centerY + 42, centerX + 5 + offsetX, centerY + 42);
    g.drawLine(centerX + 5 + offsetX, centerY + 42, centerX + 10 + offsetX, centerY + 40);
    g.drawLine(centerX + 10 + offsetX, centerY + 40, centerX + 15 + offsetX, centerY + 35);
  } else if (state.hunger < 30 || state.energy < 30) {
    // Hungry/tired - sad mouth using lines
    g.drawLine(centerX - 15 + offsetX, centerY + 42, centerX - 10 + offsetX, centerY + 38);
    g.drawLine(centerX - 10 + offsetX, centerY + 38, centerX - 5 + offsetX, centerY + 36);
    g.drawLine(centerX - 5 + offsetX, centerY + 36, centerX + 5 + offsetX, centerY + 36);
    g.drawLine(centerX + 5 + offsetX, centerY + 36, centerX + 10 + offsetX, centerY + 38);
    g.drawLine(centerX + 10 + offsetX, centerY + 38, centerX + 15 + offsetX, centerY + 42);
  } else {
    // Neutral - straight mouth
    g.drawLine(centerX - 15 + offsetX, centerY + 35, centerX + 15 + offsetX, centerY + 35);
  }

  // Draw stats and SCORE at bottom with BUTTON LABELS
  //g.setFont("6x8");
  //g.setFontAlign(0, -1);
  //g.drawString(`H:${state.hunger} F:${state.fun} E:${state.energy}`, 
              //centerX, g.getHeight() - 30);
  
  // Show SCORE prominently
//g.setFont("Vector", 12);
  //g.drawString(`SCORE: ${state.score}`, centerX, g.getHeight() - 18);
  
  // Button labels - different when dead
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
  
  g.flip();
}

// Check for state changes and vibrate
function checkStateChanges() {
  let stateChanged = false;
  
  if (previousState.hunger !== state.hunger ||
      previousState.fun !== state.fun ||
      previousState.energy !== state.energy ||
      previousState.isAlive !== state.isAlive) {
    stateChanged = true;
  }
  
  if (stateChanged) {
    Bangle.buzz(100); // Vibrate when state changes
    
    // Update score based on overall health
    if (state.isAlive) {
      state.score += Math.floor((state.hunger + state.fun + state.energy) / 30);
    }
    
    // Update previous state
    previousState = {
      hunger: state.hunger,
      fun: state.fun,
      energy: state.energy,
      isAlive: state.isAlive
    };
    
    // Force redraw after state change
    drawPig();
  }
}

// Animation loop (wobble)
setInterval(function() {
  if (state.isAlive) {
    wobble += 0.2 * wobbleDir;
    if (Math.abs(wobble) > 2) wobbleDir *= -1;
    drawPig();
  }
}, 200);

// Blinking logic
setInterval(function() {
  if (state.isAlive) {
    blinkNow = true;
    drawPig();
    setTimeout(function() {
      blinkNow = false;
      drawPig();
    }, 200);
  }
}, 4000 + Math.random() * 4000);

// Degradation loop - FASTER for testing (5 seconds instead of 60)
setInterval(() => {
  if (state.isAlive) {
    console.log("Before:", state.hunger, state.fun, state.energy); // Debug
    
    state.hunger = Math.max(0, state.hunger - 8);
    state.fun = Math.max(0, state.fun - 5);
    
    // Check death conditions - only die if stats reach 0
    if (state.hunger <= 0 || state.energy <= 0) {
      state.isAlive = false;
      Bangle.buzz(500); // Long buzz when pet dies
      console.log("PET DIED! Hunger:", state.hunger, "Energy:", state.energy);
    }
    
    console.log("After:", state.hunger, state.fun, state.energy); // Debug
    
    checkStateChanges(); // Check for changes and vibrate
    drawPig(); // Force redraw
    saveState();
  }
}, 5000); // Even faster - 5 seconds for testing

// Bluetooth setup
NRF.setServices({
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e": {
    "6e400002-b5a3-f393-e0a9-e50e24dcca9e": {
      writable: true,
      onWrite: evt => {
        const action = new TextDecoder().decode(evt.data);
        handleAction(action);
      }
    }
  }
});

function handleAction(action) {
  console.log("handleAction called with:", action, "Alive:", state.isAlive);
  
  if (!state.isAlive) {
    console.log("Pet is dead, ignoring action");
    Bangle.buzz(50); // Short buzz to indicate pet is dead
    return;
  }
  
  let oldHunger = state.hunger;
  let oldFun = state.fun;
  let oldEnergy = state.energy;
  
  switch(action) {
    case 'feed':
      state.hunger = Math.min(100, state.hunger + 30);
      currentExpression = "happy";
      Bangle.buzz(200);
      console.log("Fed! Hunger:", oldHunger, "->", state.hunger);
      break;
    case 'play':
      state.fun = Math.min(100, state.fun + 20);
      state.energy = Math.max(0, state.energy - 10);
      currentExpression = "happy";
      Bangle.buzz(200);
      console.log("Played! Fun:", oldFun, "->", state.fun, "Energy:", oldEnergy, "->", state.energy);
      break;
    case 'sleep':
      state.energy = Math.min(100, state.energy + 30);
      currentExpression = "neutral";
      Bangle.buzz(200);
      console.log("Slept! Energy:", oldEnergy, "->", state.energy);
      break;
    default:
      console.log("Unknown action:", action);
      return;
  }
  
  // Force immediate update
  drawPig();
  saveState();
  
  // Reset to neutral expression after 3 seconds
  setTimeout(() => {
    currentExpression = "neutral";
    console.log("Reset expression to neutral");
    drawPig();
  }, 3000);
}

// Button Controls - Add physical button support
setWatch(function() {
  if (state.isAlive) {
    console.log("BTN1 pressed - FEED");
    handleAction('feed');
  } else {
    console.log("BTN1 pressed - RESET PET");
    resetPet();
  }
}, BTN1, {edge:"falling",repeat:true});

setWatch(function() {
  if (state.isAlive) {
    console.log("BTN2 pressed - PLAY");
    handleAction('play');
  } else {
    console.log("BTN2 pressed - RESET PET");
    resetPet();
  }
}, BTN2, {edge:"falling",repeat:true});

setWatch(function() {
  if (state.isAlive) {
    console.log("BTN3 pressed - SLEEP");
    handleAction('sleep');
  } else {
    console.log("BTN3 pressed - RESET PET");
    resetPet();
  }
}, BTN3, {edge:"falling",repeat:true});

// Reset function to revive pet
function resetPet() {
  console.log("RESETTING PET!");
  state = {
    hunger: 60,
    fun: 60,
    energy: 80,
    isAlive: true,
    score: 0
  };
  
  currentExpression = "happy";
  
  // Update previous state for change detection
  previousState = {
    hunger: state.hunger,
    fun: state.fun,
    energy: state.energy,
    isAlive: state.isAlive
  };
  
  Bangle.buzz(500); // Long happy buzz
  console.log("Pet reset! New state:", JSON.stringify(state));
  
  drawPig();
  saveState();
  
  // Show happy expression for 5 seconds
  setTimeout(() => {
    currentExpression = "neutral";
    drawPig();
  }, 5000);
}
// Touch support for touchscreen Bangles
Bangle.on('touch', function(button, xy) {
  if (xy) {
    console.log("Touch at:", xy.x, xy.y);
    if (state.isAlive) {
      // Divide screen into 3 sections
      if (xy.x < g.getWidth()/3) {
        console.log("Touch FEED");
        handleAction('feed');
      } else if (xy.x < 2*g.getWidth()/3) {
        console.log("Touch PLAY");
        handleAction('play');
      } else {
        console.log("Touch SLEEP");
        handleAction('sleep');
      }
    } else {
      console.log("Touch RESET");
      resetPet();
    }
  }
});

// Debug - log current state every few seconds
setInterval(() => {
  console.log("Current state:", JSON.stringify(state));
  console.log("Expression:", currentExpression);
  console.log("Alive:", state.isAlive);
}, 15000);

// Initial draw
drawPig();
