const cols = 8;
const rows = 8;
const buttonW = 50;
const buttonH = 50;
const buttonGap = 2;
const offset = 50;

let allSounds = {};
let globalChain = 0;

const velocities = [];

const RGBToHSL = (color) => {
  const colors = color.match(/rgba?\( *(\d+) *, *(\d+) *, *(\d+)( *, *(\d+(\.?\d+)) *)?\)/);

  // console.log(color, colors);

  let r = parseInt(colors[1]);
  let g = parseInt(colors[2]);
  let b = parseInt(colors[3]);

  let a = colors.length == 7 ? parseInt(colors[5]) : 1;

  r /= 255;
  g /= 255;
  b /= 255;
  const l = Math.max(r, g, b);
  const s = l - Math.min(r, g, b);
  const h = s
    ? l === r
      ? (g - b) / s
      : l === g
      ? 2 + (b - r) / s
      : 4 + (r - g) / s
    : 0;

  const hsl = [
    60 * h < 0 ? 60 * h + 360 : 60 * h,
    100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
    (100 * (2 * l - s)) / 2,
  ];

  let hsldata = `hsl${a < 1 ? 'a' : ''}(` + `${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%` + (a < 1 ? + `, ${a})` : ")");

  return hsldata;
};

function getVelocities() {
  const velocityColors =
  `0,0,0
37,37,37
143,143,143
253,253,253
255,101,92
255,40,18
110,10,3
34,1,0
255,199,124
255,108,29
110,40,6
48,31,2
255,248,77
255,248,63
108,105,21
32,31,2
148,247,81
83,246,60
30,104,20
25,51,6
69,247,81
9,246,59
2,104,19
0,30,2
67,247,104
9,246,59
2,104,19
0,30,2
64,248,151
4,247,93
1,104,34
0,36,19
57,248,193
0,247,167
0,105,67
0,31,19
63,204,252
0,184,252
0,82,99
0,20,31
73,158,251
0,112,250
0,41,107
0,7,32
79,105,250
0,60,249
0,20,108
0,2,32
146,106,250
91,61,249
23,24,119
8,8,64
255,112,250
255,71,250
109,25,107
33,3,32
255,105,149
255,44,101
110,13,36
44,2,19
255,51,19
173,71,16
142,99,21
80,116,23
1,70,10
0,101,67
0,103,143
0,60,249
0,85,95
10,50,214
143,143,143
43,43,43
255,40,18
200,247,62
186,235,58
107,247,60
3,149,32
0,247,148
0,184,252
0,70,249
56,61,249
134,63,249
194,52,142
83,43,5
255,97,26
151,225,55
122,247,60
9,246,59
9,246,59
87,247,127
0,249,213
92,158,251
40,104,207
145,147,237
218,70,250
255,45,108
255,144,37
199,187,45
158,247,61
150,111,24
74,52,6
16,92,19
0,97,72
23,26,53
13,47,107
126,77,35
188,25,10
233,103,73
229,125,31
255,227,58
171,225,55
116,189,44
35,38,63
229,249,117
136,249,199
164,173,252
154,128,250
81,81,81
135,135,135
228,252,253
181,24,9
69,3,1
6,211,50
1,79,12
199,187,45
79,62,9
195,112,26
93,28,3`.trim().split("\n");
  for (const color of velocityColors) {
    velocities.push(`rgba(${color.replace(/ {2,}/, "")}, 1)`);
  }
}
getVelocities();

function setChain(chain) {
  globalChain = chain - 1;

  console.log("Chain set: " + globalChain);
}

class LedButton {
  constructor(vpad, sequence, x, y, data, repetitions = 1) {
    this.sequence = sequence;
    this.x = x;
    this.y = y;

    this.data = data ?? "";

    /**
     * @type VirtualLaunchpad
     */
    this.virtualPad = vpad;

    this.repetitions = repetitions ?? 1;
    this.playCount = 0;
  }

  reset() {
    this.playCount = 0;
  }

  play() {
    if (!this.data) return;

    const eventData = this.data.trim().split("\n");
    let line = 0;

    const parse = () => {
      if (line >= eventData.length) return;

      const lineData = eventData[line].trim();
      if (lineData.length == 0) {
        line++;
        parse();
        return;
      }

      const cols = lineData.split(/ +/g);

      const kind = cols[0].trim();

      let delayAmt = 0;

      switch (kind) {
        case "o":
        case "on": {
          const [_, y, x, color, velocity] = cols;
          
          if (y == "l") {
            break;
          }
          
          // Circle
          if (y == "*" || y == "mc") {
            const velColor = velocities[velocity];

            this.virtualPad.funcButtons[x - 1].setColor(velColor);
            break;
          }

          if (color == "a" || color == "auto") {
            this.virtualPad.getButton(parseInt(x), parseInt(y)).setColor(velocities[velocity]);
          } else {
            this.virtualPad.getButton(parseInt(x), parseInt(y)).setColor("#" + color);
          }

          break;
        }

        case "f":
        case "off": {
          const [_, y, x] = cols;

          if (y == "l") {
            break;
          }

          // Circle
          if (y == "*" || y == "mc") {
            this.virtualPad.funcButtons[x - 1].setColor(this.virtualPad.offColor);
            break;
          }

          this.virtualPad.getButton(parseInt(x), parseInt(y)).setColor(this.virtualPad.offColor);

          break;
        }

        case "d":
        case "delay": {
          const [_, delay] = cols;
          
          delayAmt = parseInt(delay);

          break;
        }
      }

      line++;

      if (delayAmt) {
        setTimeout(parse, delayAmt);
      } else {
        parse();
      }
    }
    parse();

    this.playCount++;
    return this.playCount;
  }
}

class SoundButton {
  constructor(vpad, soundName, x, y, repetitions = 1, wormhole = 0) {
    this.soundName = soundName;
    this.repetitions = repetitions;   
    this.wormhole = wormhole;

    this.playCount = 0;

    this.virtualPad = vpad;

    this.x = x;
    this.y = y;
  }

  reset() {
    this.playCount = 0;
  }

  play() {
    const sound = allSounds[this.soundName];

    if (!sound) {
      console.error("Failed to play sound: " + this.soundName);
      return 0;
    }

    if (this.repetitions == 0) {
      if (!sound.playing()) {
        // sound.seek(0)
        sound.play();
        this.playCount++;
      }
    } else {
      // sound.seek(0);
      sound.play();
      this.playCount++;
    }

    return this.playCount;
  }
}

class Button {
  constructor(vpad, x, y, element, offColor = "#808080") {
    this.x = x;
    this.y = y;

    /**
     * @type HTLMDivElement
     */
    this.element = element;
    this.color = offColor;
    this.offColor = offColor;

    this.element.style.backgroundColor = this.color;

    /**
     * @type VirtualLaunchpad
     */
    this.virtualPad = vpad;

    /**
     * Each array is a different chain
     * 
     * @type SoundButton[][]
     */
    this.sounds = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ];

    /**
     * @type LedButton[][]
     */
    this.ledData = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ];

    this.sequenceCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.soundCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.pressed = false;
    this.hasPickedUp = true;
  }

  reload(vpad) {
    this.virtualPad = vpad;

    this.ledData = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ];

    this.sounds = [
      [],
      [],
      [],
      [],
      [],
      [],
      [],
      []
    ];

    this.sequenceCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.soundCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.pressed = false;
    this.hasPickedUp = true;
    this.color = this.offColor;

    if (this.virtualPad.lightEffect == 1) {
      this.element.style.backgroundColor = this.color;
    } else if (this.virtualPad.lightEffect == 2) {
      this.element.style.borderColor = this.color;
    } else if (this.virtualPad.lightEffect == 3) {
      this.element.style.backgroundColor = this.color;
      this.element.style.borderColor = this.color;
    }
    // this.element.style.backgroundColor = this.color;
  }

  reset() {
    for (const sounds of this.sounds) {
      for (const sound of sounds) {
        sound.reset();
      }
    }

    for (const leds of this.ledData) {
      for (const led of leds) {
        led.reset();
      }
    }

    this.sequenceCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.soundCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.pressed = false;
    this.hasPickedUp = true;
    this.color = this.offColor;

    if (this.virtualPad.lightEffect == 1) {
      this.element.style.backgroundColor = this.color;
    } else if (this.virtualPad.lightEffect == 2) {
      this.element.style.borderColor = this.color;
    } else if (this.virtualPad.lightEffect == 3) {
      this.element.style.backgroundColor = this.color;
      this.element.style.borderColor = this.color;
    }

    this.element.style.color = "";
  }

  resetColors() {
    this.color = this.offColor;

    if (this.virtualPad.lightEffect == 1) {
      this.element.style.backgroundColor = this.color;
    } else if (this.virtualPad.lightEffect == 2) {
      this.element.style.borderColor = this.color;
    } else if (this.virtualPad.lightEffect == 3) {
      this.element.style.backgroundColor = this.color;
      this.element.style.borderColor = this.color;
    }

    this.element.style.color = "";
  }

  resetChain() {
    this.sequenceCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];

    this.soundCounter = [
      0, 0, 0, 0, 0, 0, 0, 0
    ];
  }

  getLedCounter(chain = globalChain) {
    return this.sequenceCounter[chain];
  }

  setLedCounter(num, chain = globalChain) {
    return (this.sequenceCounter[chain] = num);
  }

  getSoundCounter(chain = globalChain) {
    return this.soundCounter[chain];
  }

  setSoundCounter(num, chain = globalChain) {
    return (this.soundCounter[chain] = num);
  }

  addSound(soundName, chain, repetitions = 1, wormhole = 0) {
    this.sounds[chain - 1].push(new SoundButton(this.virtualPad, soundName, this.x, this.y, repetitions, wormhole));
  }
  
  addLedData(sequence, chain, data, repetitions = 1) {
    this.ledData[chain - 1].push(new LedButton(this.virtualPad, sequence, this.x, this.y, data, repetitions));
  }

  playLed() {
    let ledCounter = this.getLedCounter();
    if (ledCounter >= this.ledData[globalChain].length) {
      this.setLedCounter(0, globalChain);
      ledCounter = 0;
    }

    /**
     * @type LedButton
     */
    const led = this.ledData[globalChain][ledCounter];
    let myChain = globalChain;

    // console.log("Play", ledCounter, globalChain, led);
    
    if (!led) {
      this.setLedCounter(0, myChain);
      return;
    };
    
    const stopPlaying = this.pressed && !this.hasPickedUp && led.repetitions > 0;

    if (stopPlaying) {
      return;
    }

    const playCount = led.play();
    const reps = led.repetitions;

    if (playCount >= reps) {
      if (reps == 0 && playCount == 1) {
        this.setLedCounter(ledCounter + 1, myChain);
      } else if (reps > 0) {
        this.setLedCounter(ledCounter + 1, myChain);
      }
      led.playCount = 0;
    }

    if (this.getLedCounter(myChain) >= this.ledData[myChain].length) {
      this.setLedCounter(0, myChain);
    }
  }

  playSound() {
    let soundCounter = this.getSoundCounter();
    if (soundCounter > this.sounds[globalChain].length) {
      soundCounter = 0;
      this.setSoundCounter(0);
    }
    /**
     * @type SoundButton
     */
    const sound = this.sounds[globalChain][soundCounter];
    // console.log(sound, this.sounds, globalChain, soundCounter);

    if (!sound) return;

    const stopPlaying = this.pressed && !this.hasPickedUp && sound.repetitions > 0;
    if (!stopPlaying) {
      this.hasPickedUp = false;
    }

    if (stopPlaying) {
      return;
    }

    const playCount = sound.play();
    const reps = sound.repetitions;
    let myChain = globalChain;

    if (playCount >= reps) {
      if (reps == 0 && playCount == 1) {
        this.setSoundCounter(soundCounter + 1, myChain);

        if (sound.wormhole > 0) {
          this.virtualPad.setChain(sound.wormhole);
        }
      } else if (reps > 0) {
        this.setSoundCounter(soundCounter + 1, myChain);

        if (sound.wormhole > 0) {
          this.virtualPad.setChain(sound.wormhole);
        }
      }
      sound.playCount = 0;
    }

    if (this.getSoundCounter(myChain) >= this.sounds[myChain].length) {
      this.setSoundCounter(0, myChain);
    }
  }

  draw() {
    if (this.pressed) {
      this.update();
    }

    if (this.virtualPad.lightEffect == 1) {
      this.element.style.backgroundColor = this.color;
    } else if (this.virtualPad.lightEffect == 2) {
      this.element.style.borderColor = this.color;
    } else if (this.virtualPad.lightEffect == 3) {
      this.element.style.backgroundColor = this.color;
      this.element.style.borderColor = this.color;
    }
    // this.element.style.backgroundColor = this.color;

    if (this.color == this.offColor || this.color == velocities[0]) {
      this.element.style.color = ``;
    } else {
      if (this.virtualPad.glowEffect)
        this.element.style.color = `${this.color}`;
    }
  }

  update() {
    this.playLed();
    this.playSound();
  }

  setColor(color) {
    this.color = color;
  }

  press() {
    // console.log("Button Pressed: X " + this.x + ", Y " + this.y);
    this.update();
  }

  buttonDown() {
    // console.log("Button Down: X " + this.x + ", Y " + this.y);
    this.pressed = true;
    this.update();
  }

  buttonUp() {
    // console.log("Button Up: X " + this.x + ", Y " + this.y);
    this.pressed = false;
    this.hasPickedUp = true;
  }
}

class VirtualLaunchpad {
  constructor(element, options) {
    /**
     * @type {HTMLDivElement}
     */
    this.element = element;
    this.btnsElement = this.element.querySelector("#launchpad-btns");

    this.info = {
      artist: "Not Loaded",
      song: "Not Loaded",
      producer: "Not Loaded"
    };

    this.autoPlayLearn = [];
    this.learnPos = 0;

    /**
     * @type Button[][]
     */
    this.buttons = [];
    this.funcButtons = [];

    this.gradientEffect = options?.gradient ? true : false;

    this.noOffColor = options?.offColor ? false : true;

    this.offColor = this.noOffColor ? "#808080" : options.offColor;
    velocities[0] = this.offColor;

    this.autoPlay = "";
    this.autoPlayDrums = "";

    this.loaded = false;

    this.theme = options?.theme ?? "colorful";
    this.themeEls = [];

    this.lightEffect = 1;
    this.glowEffect = true;

    requestAnimationFrame(this.updateButtons.bind(this));

    this.loadTheme();

    this.populate();

    this.loadAutoButtons();

    //background: linear-gradient(308deg, rgb(6, 0, 90) 15%, rgb(32, 37, 85) 41%, rgb(0, 29, 71) 84%);
    this.defaultGradients = ["rgb(6, 0, 90)", "rgb(32, 37, 85)", "rgb(0, 29, 71)"];
    this.gradients = ["rgb(6, 0, 90)", "rgb(32, 37, 85)", "rgb(0, 29, 71)"];
  }

  async loadTheme() {
    const name = this.theme.toLowerCase().replace(/ /g, "-");
    const resp = await fetch(`/styles/themes/${name}/${name}-skin.css`);

    if (resp.status != 200) {
      console.error("Failed to get theme:", name, "and", name + "-skin");
      return;
    }

    const data = (await resp.text()).replace(/\r/g, "");
    const finder = /\/\* *Skin Settings *\n( *\* *[a-zA-Z0-9]* *\n )+(\* *(\@[a-zA-Z]+) *([a-zA-Z0-9\-\_]+) *\n )+\*\//g;

    const css = document.createElement("style");
    css.innerHTML = data;

    document.head.appendChild(css);

    const cssMain = document.createElement("link");
    cssMain.rel = "stylesheet";
    cssMain.type = "text/css";
    cssMain.href = `/styles/themes/${name}/${name}.css`;

    document.head.appendChild(cssMain);

    if (this.themeEls.length > 0) {
      for (const el of this.themeEls) {
        el.remove();
      }
    }

    this.themeEls.push(css);
    this.themeEls.push(cssMain);

    for (const funcBtn of this.funcButtons) {
      funcBtn.reset();
    }

    for (const buttons of this.buttons) {
      for (const button of buttons) {
        button.resetColors();
      }
    }

    const match = data.match(finder);
    let applyThemeSettings = false;
    if (match) {
      const matches = match[0].matchAll(/(\* *(\@[a-zA-Z]+) *([a-zA-Z0-9\-\_]+) *\n )/g);

      let setting = null;
      while (!(setting = matches.next()).done) {
        const key = setting.value[2].toLowerCase().trim();
        const value = setting.value[3].trim();
        const valueL = value.toLowerCase().trim();

        switch (key) {
          case "@gradienteffect": {
            this.gradientEffect = valueL === "on" || valueL == "true" ? true : false;
            break;
          }

          case "@lighton": {
            if (valueL == "stroke") {
              this.lightEffect = 2;
            } else if (valueL == "both") {
              this.lightEffect = 3;
            } else if (["background", "back", "button", ""].includes(valueL)) {
              this.lightEffect = 1;
            } else {
              this.lightEffect = 1;
            }
            break;
          }

          case "@glow": {
            if (valueL === "on" || valueL === "true") {
              this.glowEffect = true;
            } else if (valueL === "off" || valueL === "false" || valueL === "") {
              this.glowEffect = false;
            }
          }
        }
      }

      applyThemeSettings = true;
    }

    this.gradients = this.defaultGradients;
    this.updateGradient();

    if (!this.gradientEffect) {
      const root = document.querySelector("#app");

      root.style = "";
    }
  }

  updateGradient() {
    const root = document.querySelector("#app");

    if (!root || !this.gradientEffect) return;

    root.style = `background: linear-gradient(308deg, ${this.gradients[0]} 15%, ${this.gradients[1]} 41%, ${this.gradients[2]} 84%) !important;`;
  }

  loadAutoButtons() {
    const autoplayBtn = document.querySelector("#autoplay");
    const autoplayDrumsBtn = document.querySelector("#autoplay-drums");

    if (autoplayBtn) {
      autoplayBtn.addEventListener("click", () => {
        this.playAuto(false);
      });
    }

    if (autoplayDrumsBtn) {
      autoplayDrumsBtn.addEventListener("click", () => {
        this.playAuto(true);
      });
    }
  }

  reset() {
    this.learnPos = 0;

    for (const buttons of this.buttons) {
      for (const button of buttons) {
        button.reset();
      }
    }

    for (const funcButton of this.funcButtons) {
      funcButton.reset();
    }

    this.gradients = this.defaultGradients;
    this.updateGradient();

    this.setChain(1);
  }

  reload() {
    this.learnPos = 0;

    this.info = {
      artist: "Not Loaded",
      song: "Not Loaded",
      producer: "Not Loaded"
    };

    this.loaded = false;

    this.autoPlay = "";
    this.autoPlayDrums = "";

    allSounds = {};

    this.setChain(1);

    for (const funcButton of this.funcButtons) {
      funcButton.element.remove();
    }

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.buttons[y][x].element.remove();
        delete this.buttons[y][x];
      }
    }

    this.buttons = [];
    this.funcButtons = [];

    this.populate();
  }

  playNext() {
    const type = this.autoPlayLearn[this.learnPos++];

    switch (type.kind) {
      case "press": {
        this.buttonDown(type.pos[0], type.pos[1]);
        this.buttonUp(type.pos[0], type.pos[1]);
        if (!type.delayed) {
          this.playNext();
        }
        break;
      }

      case "chain": {
        this.setChain(type.chain);
        this.playNext();
        break;
      }
    }
  }

  parseLearn(drums = false) {
    if (!this.loaded) {
      console.error("All data not loaded yet!");
      return;
    }

    const data = drums ? this.autoPlayDrums : this.autoPlay;
    const autoPlayData = data.trim().split("\n");
    let line = 0;

    while (line < autoPlayData.length) {
      if (line >= autoPlayData.length) return;

      const lineData = autoPlayData[line].trim();

      if (lineData.length == 0) {
        line++;
        continue;
      }

      const cols = lineData.split(/ +/g);

      const kind = cols[0].trim();

      let delayAmt = 0;

      switch (kind) {
        case "c":
        case "chain": {
          // this.setChain(parseInt(cols[1]));
          this.autoPlayLearn.push({
            kind: "chain",
            chain: parseInt(cols[1]),
            delayed: false
          });

          break;
        }
        case "o":
        case "on": {
          const [_, y, x] = cols;
          
          // this.buttonDown(x, y);

          this.autoPlayLearn.push({
            kind: "press",
            pos: [x, y],
            delayed: false
          });

          break;
        }

        case "f":
        case "off": {
          const [_, y, x] = cols;
          
          // this.buttonUp(x, y);

          break;
        }

        case "t":
        case "touch": {
          const [_, y, x] = cols;
          
          // this.buttonDown(x, y);
          // this.buttonUp(x, y);
          this.autoPlayLearn.push({
            kind: "press",
            pos: [x, y],
            delayed: false
          });

          break;
        }

        case "d":
        case "delay": {
          const [_, delay] = cols;
          
          // delayAmt = delay;
          if (delay > 20)
            this.autoPlayLearn[this.autoPlayLearn.length - 1].delayed = true;
            this.autoPlayLearn[this.autoPlayLearn.length - 1].delay = delay;

          break;
        }
      }

      line++;
    }
  }

  playAuto(drums = false) {
    if (!this.loaded) {
      console.error("All data not loaded yet!");
      return;
    }

    const data = drums ? this.autoPlayDrums : this.autoPlay;
    const autoPlayData = data.trim().split("\n");
    let line = 0;

    const parse = () => {
      if (line >= autoPlayData.length) return;

      const lineData = autoPlayData[line].trim();

      if (lineData.length == 0) {
        line++;
        parse();
        return;
      }

      const cols = lineData.split(/ +/g);

      const kind = cols[0].trim();

      let delayAmt = 0;

      switch (kind) {
        case "c":
        case "chain": {
          this.setChain(parseInt(cols[1]));
          break;
        }
        case "o":
        case "on": {
          const [_, y, x] = cols;
          
          this.buttonDown(x, y);

          break;
        }

        case "f":
        case "off": {
          const [_, y, x] = cols;
          
          this.buttonUp(x, y);

          break;
        }

        case "t":
        case "touch": {
          const [_, y, x] = cols;
          
          this.buttonDown(x, y);
          this.buttonUp(x, y);

          break;
        }

        case "d":
        case "delay": {
          const [_, delay] = cols;
          
          delayAmt = delay;

          break;
        }
      }

      line++;

      if (delayAmt) {
        delayAmt -= 14;
        if (delayAmt < 0)
          delayAmt = 0;

        setTimeout(parse, delayAmt);
      } else {
        parse();
      }
    }
    parse();
  }

  addSound(sound, name) {
    allSounds[name] = sound;
  }

  /**
   * @returns {Button}
   */
  getButton(col, row) {
    return this.buttons[row - 1][col - 1];
  }

  /**
   * @returns {HTMLButtonElement}
   */
  _createButton(x, y) {
    const btn = document.createElement("div");
    btn.className = "lp-btn " + `lp-btn-${x+1}-${y+1}`;

    btn.setAttribute("data-btn-id", `\"${x+1},${y+1}\"`);

    btn.addEventListener("mousedown", (e) => {
      this.buttonDown(x + 1, y + 1);
    });
    btn.addEventListener("mouseup", (e) => {
      this.buttonUp(x + 1, y + 1);
    });

    this.btnsElement.appendChild(btn);

    return btn;
  }

  /**
   * @returns {HTMLButtonElement}
   */
  _createFuncButton(id) {
    const btn = document.createElement("div");
    btn.className = "lp-func-btn";

    btn.setAttribute("data-btn-id", `func,${id}`);
    btn.setAttribute("data-func-id", `${id}`);

    btn.addEventListener("mousedown", (e) => {
      this.funcButtonPress(id);
    });
    
    if (id <= 8) {
      const rightBtns = this.element.querySelector("#circle-btns-top");
      rightBtns.appendChild(btn);
    } else if (id > 8 && id <= 16) {
      const bottomBtns = this.element.querySelector("#circle-btns-right");
      bottomBtns.appendChild(btn);
    } else if (id > 16 && id <= 24) {
      const leftBtns = this.element.querySelector("#circle-btns-bottom");
      if (leftBtns.children.length == 0) {
        leftBtns.appendChild(btn);
      } else {
        leftBtns.firstElementChild.before(btn);
      }
    } else if (id > 24 && id <= 32) {
      const topBtns = this.element.querySelector("#circle-btns-left");
      
      if (topBtns.children.length == 0) {
        topBtns.appendChild(btn);
      } else {
        topBtns.firstElementChild.before(btn);
      }
    }

    if (this.lightEffect == 1) {
      btn.style.backgroundColor = this.offColor;
    } else if (this.lightEffect == 2) {
      btn.style.borderColor = this.offColor;
    } else if (this.lightEffect == 3) {
      btn.style.backgroundColor = this.offColor;
      btn.style.borderColor = this.offColor;
    }
    // btn.style.backgroundColor = this.offColor;

    const funcOffColor = btn.style.getPropertyValue("background-color");

    this.funcButtons.push({
      element: btn,
      reset: () => {
        btn.style.color = ``;

        if (this.lightEffect == 1) {
          btn.style.backgroundColor = this.noOffColor ? funcOffColor : this.offColor;
        } else if (this.lightEffect == 2) {
          btn.style.borderColor = this.noOffColor ? funcOffColor : this.offColor;
        } else if (this.lightEffect == 3) {
          btn.style.backgroundColor = this.noOffColor ? funcOffColor : this.offColor;
          btn.style.borderColor = this.noOffColor ? funcOffColor : this.offColor;
        }
        // btn.style.backgroundColor = this.noOffColor ? funcOffColor : this.offColor;
      },
      setColor: (color) => {
        if (this.lightEffect == 1) {
          btn.style.backgroundColor = color;
        } else if (this.lightEffect == 2) {
          btn.style.borderColor = color;
        } else if (this.lightEffect == 3) {
          btn.style.backgroundColor = color;
          btn.style.borderColor = color;
        }
        // btn.style.backgroundColor = color;

        let btnId = parseInt(btn.getAttribute("data-func-id"));

        if (color == this.offColor || color == velocities[0]) {
          btn.style.color = ``;
          if (btnId > 24 && btnId <= 32) {
            this.gradients[2] = this.defaultGradients[2];
          }

          if (btnId <= 8) {
            this.gradients[1] = this.defaultGradients[1];
          }

          if (btnId > 8 && btnId <= 16) {
            this.gradients[0] = this.defaultGradients[0];
          }
        } else {
          if (this.glowEffect)
            btn.style.color = `${color}`;

          const gradient = color.substring(0, color.length - 2) + "0.35)";

          if (btnId > 24 && btnId <= 32) {
            this.gradients[2] = gradient;
          }

          if (btnId <= 8) {
            this.gradients[1] = gradient;
          }

          if (btnId > 8 && btnId <= 16) {
            this.gradients[0] = gradient;
          }
        }
      }
    });

    return btn;
  }

  populate() {
    let testBtn = this._createButton(0, 0);

    if (testBtn) {
      if (this.noOffColor) {
        this.offColor = testBtn.style.getPropertyValue("background-color");
        velocities[0] = this.offColor;
      }
    }

    testBtn.remove();
    this.buttons = [];

    for (let i = 1; i <= 32; i++) {
      this._createFuncButton(i);
    }

    for (let y = 0; y < 8; y++) {
      this.buttons[y] = new Array(8);
      for (let x = 0; x < 8; x++) {
        const btn = this._createButton(x, y);
        this.buttons[y][x] = new Button(this, x, y, btn, this.offColor);
      }
    }
  }

  updateButtons() {
    this.updateGradient();

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        this.buttons[y][x].draw();
      }
    }

    requestAnimationFrame(this.updateButtons.bind(this));
  }

  setChain(chain = 1) {
    for (const buttons of this.buttons) {
      for (const button of buttons) {
        button.resetChain();
      }
    }

    setChain(chain);
  }

  funcButtonPress(id) {
    if (id > 8 && id <= 16) {
      this.setChain(id - 8);
    }
  }

  buttonDown(col, row) {
    this.buttons[row - 1][col - 1].buttonDown();
  }

  buttonUp(col, row) {
    this.buttons[row - 1][col - 1].buttonUp();
  }

  pressButton(col, row) {
    this.buttons[row - 1][col - 1].press();
  }

  load(file) {
    const zip = new JSZip();
    zip.loadAsync(file).then(async (archive) => {
      console.log(archive.files);

      /**
       * @type {{[x: string]: ZipObject}}
       */
      const files = archive.files;

      this.reload();

      const autoplayBtn = document.querySelector("#autoplay");
      const autoplayDrumsBtn = document.querySelector("#autoplay-drums");

      if (autoplayBtn) {
        autoplayBtn.style = "display: none !important;";
      }

      if (autoplayDrumsBtn) {
        autoplayDrumsBtn.style = "display: none !important;";
      }

      for (const [key, value] of Object.entries(files)) {
        if (key.toLowerCase().includes("sounds/")) {
          if (key.toLowerCase() === "sounds/") continue;
          const soundBlob = await value.async("blob");
          const soundURL = URL.createObjectURL(soundBlob);
          const soundExt = key.substring(key.lastIndexOf(".") + 1);
          const soundName = key.substring(key.lastIndexOf("/") + 1);

          const sound = new Howl({
            src: soundURL,
            format: soundExt,
            preload: true
          });
          sound.load();
          this.addSound(sound, soundName.toLowerCase());
        }

        if (key.toLowerCase().includes("keysound")) {
          const data = await value.async("text");

          this.parseKeySound(data);
        }

        if (key.toLowerCase() == "info") {
          const data = await value.async("text");

          this.parseInfo(data.trim());
        }

        if (key.toLowerCase().includes("keyled/")) {
          if (key.toLowerCase() === "keyled/") continue;
          const ledData = await value.async("text");
          const fileName = key.substring(key.lastIndexOf("/") + 1);

          this.parseKeyLed(ledData, fileName);
        }

        if (key.toLowerCase().startsWith("autoplay")) {
          const drums = key.toLowerCase().includes("(with drums)");

          const data = await value.async("text");

          if (drums) {
            this.autoPlayDrums = data;
            this.autoPlayDrums.replace(/\r\n/g, "\n");
            this.autoPlayDrums.replace(/\n{2,}/g, "\n");
            console.log("Autoplay Drums Parsed!");

            if (autoplayDrumsBtn) {
              autoplayDrumsBtn.style = "display: flex !important;";
            }
          } else {
            this.autoPlay = data;
            this.autoPlay.replace(/\r\n/g, "\n");
            this.autoPlay.replace(/\n{2,}/g, "\n");
            console.log("Autoplay Parsed!");

            if (autoplayBtn) {
              autoplayBtn.style = "display: flex !important;";
            }
          }
        }
      }

      this.loaded = true;
      console.log("All Loaded!");

      this.parseLearn(false);
    });
  }

  updateUIInfo() {
    const lpInfo = document.querySelector("#launchpad-sidebar .lp-info");
    
    if (!lpInfo) return;

    const lpTitle = lpInfo.querySelector(".lp-title");
    const lpArtist = lpInfo.querySelector(".lp-artist");
    const lpAuthor = lpInfo.querySelector(".lp-author");

    lpTitle.textContent = this.info.song;
    lpArtist.textContent = this.info.artist;
    lpAuthor.textContent = "Project By: " + this.info.producer;
  }

  parseKeyLed(ledData, fileName) {
    const eventData = fileName.trim().split(" ");
  
    const chain = eventData[0];
    const y = parseInt(eventData[1]);
    const x = parseInt(eventData[2]);
    let repetitions = parseInt(eventData[3]) ?? 1;
    const sequence = eventData[4] ?? "a";
  
    if (isNaN(repetitions)) {
      repetitions = 1;
    }
  
    this.getButton(x, y).addLedData(sequence, chain, ledData, repetitions);
  }

  parseKeySound(data) {
    data = data.trim();
  
    const lines = data.split("\n");
  
    for (const lineFull of lines) {
      const line = lineFull.trim();
      if (line.length == 0) continue;
  
      const cols = line.split(/ +/g);
      const chain = cols[0];
      const y = parseInt(cols[1]);
      const x = parseInt(cols[2]);
      const file = cols[3];
      let repetitions = parseInt(cols[4]) ?? 1;
      let wormhole = parseInt(cols[5]) ?? 0;
  
      if (isNaN(wormhole)) {
        wormhole = 0;
      }
  
      if (isNaN(repetitions)) {
        repetitions = 1;
      }
  
      this.getButton(x, y).addSound(file.toLowerCase(), chain, repetitions, wormhole);
    }
  
    console.log("keySound Loaded!");
  }

  parseInfo(data) {
    const lines = data.replace(/\r/g, "").split("\n");
    this.info.producer = "Unknown";

    for (const line of lines) {
      const info = line.trim().split(/ *= */);
      const key = info[0].trim().toLowerCase();
      const value = info[1].trim();

      switch (key) {
        case "title": {
          let artist = "Unknown";
          let song = "Unknown";

          if (value.match(/ *\- */)) {
            const valueInfo = value.split(/ *\- */);
            artist = valueInfo[0].trim();
            song = valueInfo[1].trim();
          } else {
            song = value;
          }

          this.info.artist = artist;
          this.info.song = song;
          break;
        }

        case "producername": {
          this.info.producer = value;
          console.log(this.info);

          break;
        }
      }
    }

    this.updateUIInfo();
  }
}