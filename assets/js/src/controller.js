class Controller {
  constructor(controls, keys) {
    this.controls = controls;
    this.keys = keys;
    this.timers = {};
    this.locked = true;
    document.addEventListener('keydown', this.onKeyDown.bind(this), false);
    document.addEventListener('keyup', this.onKeyUp.bind(this), false);
    window.addEventListener('blur', this.onBlur.bind(this), false);
  }

  release() {
    document.removeEventListener('keydown', this.onKeyDown.bind(this), false);
    document.removeEventListener('keyup', this.onKeyUp.bind(this), false);
    window.removeEventListener('blur', this.onBlur.bind(this), false);
  }

  onKeyDown(event) {
    if (this.locked) return;
    const control = this.keys[event.key];
    if (control in this.controls && !(control in this.timers)) {
      const { f: func, delay, repeat } = this.controls[control];
      func();
      if (repeat === 0) {
        this.timers[control] = null;
      } else {
        const interval = () => { this.timers[control] = setInterval(func, repeat); };
        if (delay === 0) {
          interval();
        } else {
          this.timers[control] = setTimeout(interval, delay);
        }
      }
    }
  }

  onKeyUp(event) {
    const control = this.keys[event.key];
    if (control in this.timers) {
      if (this.timers[control] !== null) {
        clearInterval(this.timers[control]);
      }
      delete this.timers[control];
    }
  }

  onBlur() {
    for (const control in this.timers) {
      if (this.timers[control] !== null) {
        clearInterval(this.timers[control]);
      }
    }
    this.timers = {};
  }
}

export default Controller;
