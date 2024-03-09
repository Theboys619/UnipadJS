class EventListener {
  constructor() {
      this.listeners = {};
  }

  emit(eventName, ...args) {
      if (this.listeners[eventName]) {
          this.listeners[eventName].forEach(listener => listener(...args));
      }
  }

  on(eventName, callback) {
      if (!this.listeners[eventName]) {
          this.listeners[eventName] = [];
      }

      this.listeners[eventName].push(callback);
  }

  once(eventName, callback) {
      const wrapper = (...args) => {
          callback(...args);
          this.off(eventName, wrapper);
      };

      this.on(eventName, wrapper);
  }

  off(eventName, callback) {
      if (this.listeners[eventName]) {
          const index = this.listeners[eventName].indexOf(callback);
          if (index !== -1) {
              this.listeners[eventName].splice(index, 1);
          }

          if (this.listeners[eventName].length === 0) {
              delete this.listeners[eventName];
          }
      }
  }
}

const ccButtons = [
  91, 92, 93, 94, 95, 96, 97, 98,
  89, 79, 69, 59, 49, 39, 29, 19
];
class LaunchpadX extends EventListener {
  constructor(name = "", options = { sysex: true }) {
      super();

      this.lpNames = ["LPX MIDI", "Launchpad", "Launchpad MK2"];

      this.name = name ?? "";
      this.options = options ?? { sysex: true };

      this.headerBegin = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C];

      this.midiAccess = null;
      this.device = {
          input: null,
          output: null
      };

      this._setup()
  }

  getDevices() {
      if (!this.midiAccess) {
          return [];
      }

      const inputs = Array.from(this.midiAccess.inputs.values());

      return inputs.filter((v) => {
          return this.lpNames.includes(v.name);
      });
  }

  getDevice(name) {
      const inputs = Array.from(this.midiAccess.inputs.values());
      const outputs = Array.from(this.midiAccess.outputs.values());

      for (let i = 0; i < inputs.length; i++) {
          if (inputs[i].name === name) {
              this.device.input = inputs[i];
          }
      }

      for (let i = 0; i < outputs.length; i++) {
          if (outputs[i].name === name) {
              this.device.output = outputs[i];
          }
      }

      if (this.device.input != null && this.device.output != null) {
          this.emit("deviceReady");
      }

      return this.device;
  }

  async _setup() {
      try {
          this.midiAccess = await navigator.requestMIDIAccess({
              sysex: this.options.sysex
          });

          this.emit("midiReady");

          if (this.name.length > 0) {
              this.getDevice(this.name);
          }
      } catch (e) {
          console.error("Failed to get access to midi!");
          console.error(e);

          this.emit("error", e);
      }
  }

  ccLedOn(led, ...colors) {
      if (!this.device.output) return;

      const index = led - 1;

      if (index >= ccButtons.length) {
          return;
      }

      const button = ccButtons[index];

      this.ledOn(button, ...colors);

      if (button == 98)
          this.ledOn(99, ...colors);
  }

  ccLedVelOn(led, velocity) {
    if (!this.device.output) return;

    const index = led - 1;

    if (index >= ccButtons.length) {
        return;
    }

    const button = ccButtons[index];

    this.ledVelOn(button, velocity);

    if (button == 98)
      this.ledVelOn(99, velocity);
  }

  ccLedOff(led) {
      if (!this.device.output) return;

      const index = led - 1;

      if (index >= ccButtons.length) {
          return;
      }

      const button = ccButtons[index];

      this.ledOff(button);

      if (button == 98)
          this.ledOff(99);
  }

  // Header Beginning: 0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C
  ledOn(led, ...colors) {
      if (!this.device.output) return;

      const ledType = colors.length > 1 ? 3 : 0;

      this.device.output.send(
          [...this.headerBegin, 0x03, ledType, led, ...colors, 0xF7]
      );
  }

  ledVelOn(led, velocity) {
    if (!this.device.output) return;

    this.device.output.send(
        [...this.headerBegin, 0x03, 0, led, velocity, 0xF7]
    );
  }

  ledOff(led) {
      if (!this.device.output) return;

      this.device.output.send(
          [...this.headerBegin, 0x03, 0, led, 0, 0xF7]
      );
  }

  clearLeds() {
    if (!this.device.output) return;

    for (let y = 1; y <= 8; y++) {
      for (let x = 1; x <= 8; x++) {
        this.ledOff(y * 10 + x);
      }
    }

    for (let i = 1; i <= 16; i++) {
      this.ccLedOff(i);
    }
  }
}