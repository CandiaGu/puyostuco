class Controller {
  constructor(controls, keys) {
    this.controls = controls;
    this.keys = keys;
    this.timers = {};
    document.addEventListener('keydown', this.onKeyDown, false);
    document.addEventListener('keyup', this.onKeyUp, false);
    window.addEventListener('blur', this.onBlur, false);
    this.active = true;
  }

  release() {
    this.active = false;
    document.removeEventListener('keydown', this.onKeyDown, false);
    document.removeEventListener('keyup', this.onKeyUp, false);
    window.removeEventListener('blur', this.onBlur, false);
    this.onBlur();
  }

  onKeyDown = (event) => {
    const control = this.keys[event.key];
    if (control in this.controls && !(control in this.timers)) {
      const {
        f,
        delay,
        repeat,
        press,
      } = this.controls[control];
      if (press !== undefined) {
        press();
      }
      const func = () => { if (this.active) f(); };
      func();
      if (repeat === undefined) {
        this.timers[control] = null;
      } else {
        const interval = () => {
          this.timers[control] = setInterval(func, repeat);
        };
        if (delay === undefined) {
          interval();
        } else {
          this.timers[control] = setTimeout(interval, delay);
        }
      }
    }
  }

  onKeyUp = (event) => {
    const control = this.keys[event.key];
    if (control in this.timers) {
      clearInterval(this.timers[control]);
      delete this.timers[control];
      const { release } = this.controls[control];
      if (release !== undefined) {
        release();
      }
    }
  }

  onBlur = () => {
    for (const control in this.timers) {
      if (this.timers[control] !== null) {
        clearInterval(this.timers[control]);
      }
    }
    this.timers = {};
  }
}

export default Controller;
