import * as THREE from 'three';

function canvasTex(draw, size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function makeTileTexture() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#143848';
    ctx.fillRect(0, 0, s, s);
    const tile = 32;
    for (let y = 0; y < s; y += tile) {
      for (let x = 0; x < s; x += tile) {
        const shade = 40 + ((x * 7 + y * 13) % 18);
        ctx.fillStyle = `rgb(${shade},${shade + 36},${shade + 48})`;
        ctx.fillRect(x + 1, y + 1, tile - 2, tile - 2);
        ctx.strokeStyle = 'rgba(8,20,28,0.75)';
        ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
      }
    }
    ctx.fillStyle = 'rgba(160,230,240,0.08)';
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 8 + Math.random() * 20, 3, Math.random(), 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function makeConcreteTexture() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#2a3340';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 7000; i++) {
      const g = 35 + Math.floor(Math.random() * 45);
      ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1);
    }
  });
}

export function makeMetalTexture() {
  return canvasTex((ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, '#1a222b');
    g.addColorStop(0.5, '#2a343f');
    g.addColorStop(1, '#151b22');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let x = 0; x < s; x += 6) ctx.fillRect(x, 0, 2, s);
  }, 128);
}

export function makeWaterNormal() {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 120; i++) {
      ctx.strokeStyle = `rgba(${100 + Math.random() * 80},${100 + Math.random() * 80},255,0.35)`;
      ctx.beginPath();
      ctx.arc(Math.random() * s, Math.random() * s, 4 + Math.random() * 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

export function makeNeonSignTexture(text = 'ATLANTIS WAVE') {
  return canvasTex((ctx, s) => {
    ctx.fillStyle = '#05080c';
    ctx.fillRect(0, 0, s, s);
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#4fd0d0';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#8ef0f0';
    ctx.fillText(text, s / 2, s / 2);
  }, 512);
}
