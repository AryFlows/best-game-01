export function createButtonList(initial = []) {
  const buttons = [...initial];
  return {
    buttons,
    add(button) {
      buttons.push(button);
      return button;
    },
    hitTest(x, y) {
      return buttons.find((button) =>
        x >= button.x && x <= button.x + button.w &&
        y >= button.y && y <= button.y + button.h
      ) || null;
    },
  };
}

export class Input {
  constructor(canvas, buttons = []) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: 0, y: 0 };
    this.mouseButtons = new Set();
    this.buttons = buttons;
    this.onClick = null;

    this._keydown = (event) => {
      if (!this.keys.has(event.code)) this.pressed.add(event.code);
      this.keys.add(event.code);
    };
    this._keyup = (event) => this.keys.delete(event.code);
    this._pointermove = (event) => this._updatePointer(event);
    this._pointerdown = (event) => {
      this._updatePointer(event);
      this.mouseButtons.add(event.button);
      const button = this.hitTest(this.mouse.x, this.mouse.y);
      if (button) button.onClick?.(event);
      this.onClick?.(this.mouse.x, this.mouse.y, event, button);
    };
    this._pointerup = (event) => this.mouseButtons.delete(event.button);

    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
    canvas.addEventListener('pointermove', this._pointermove);
    canvas.addEventListener('pointerdown', this._pointerdown);
    window.addEventListener('pointerup', this._pointerup);
  }

  _updatePointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    this.mouse.y = (event.clientY - rect.top) * (this.canvas.height / rect.height);
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consumePressed(code) {
    const wasPressed = this.pressed.has(code);
    this.pressed.delete(code);
    return wasPressed;
  }

  aimVector(fromX, fromY) {
    const dx = this.mouse.x - fromX;
    const dy = this.mouse.y - fromY;
    const length = Math.hypot(dx, dy);
    return length ? { x: dx / length, y: dy / length } : { x: 0, y: 0 };
  }

  hitTest(x, y) {
    return this.buttons.find((button) =>
      x >= button.x && x <= button.x + button.w &&
      y >= button.y && y <= button.y + button.h
    ) || null;
  }

  destroy() {
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    this.canvas.removeEventListener('pointermove', this._pointermove);
    this.canvas.removeEventListener('pointerdown', this._pointerdown);
    window.removeEventListener('pointerup', this._pointerup);
  }
}
