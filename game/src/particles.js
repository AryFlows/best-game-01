export class Particles {
  constructor() { this.sparks = []; this.texts = []; this.trauma = 0; this.shakeX = 0; this.shakeY = 0; }
  burst(x, y, color = '#fff0b0', n = 10, speed = 120) {
    for (let i = 0; i < n && this.sparks.length < 400; i++) { const a = i * 2.399963229728653, fraction = ((i * 37) % Math.max(1, n)) / Math.max(1, n), s = speed * (0.25 + fraction * 0.75), life = 0.25 + fraction * 0.45; this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, maxLife: life, size: 2 + fraction * 3, color }); }
  }
  pollenBurst(x, y, n = 8) { this.burst(x, y, '#ffd77a', n, 75); }
  damageNumber(x, y, amount, color = '#fff0b0') { if (this.texts.length >= 24) this.texts.shift(); this.texts.push({ x, y, vy: -34, life: 0.7, text: String(Math.round(amount)), color, size: 14 }); }
  shake(amount) { this.trauma = Math.min(1, this.trauma + amount); }
  offset() { return { x: this.shakeX, y: this.shakeY }; }
  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 2.5); const shake = this.trauma * this.trauma * 9;
    this.shakeX = Math.sin(this.trauma * 91) * shake; this.shakeY = Math.cos(this.trauma * 73) * shake;
    for (const p of this.sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.12, dt); p.vy *= Math.pow(0.12, dt); p.life -= dt; }
    this.sparks = this.sparks.filter((p) => p.life > 0);
    for (const t of this.texts) { t.y += t.vy * dt; t.life -= dt; }
    this.texts = this.texts.filter((t) => t.life > 0);
  }
  draw(ctx) {
    for (const p of this.sparks) { ctx.globalAlpha = Math.max(0, p.life / p.maxLife); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
    for (const t of this.texts) { ctx.globalAlpha = Math.max(0, Math.min(1, t.life * 2)); ctx.fillStyle = t.color; ctx.font = `bold ${t.size}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(t.text, t.x, t.y); }
    ctx.globalAlpha = 1;
  }
}
