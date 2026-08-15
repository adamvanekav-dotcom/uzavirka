import * as THREE from 'three';

function makeCanvas(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function makeNeonSign(text = 'ATLANTIS WAVE', size = 1024) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, s, s);
    ctx.font = '700 78px "Arial Narrow", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#3ae8f0';
    ctx.shadowBlur = 36;
    ctx.fillStyle = '#d4ffff';
    ctx.fillText(text, s / 2, s / 2 - 18);
    ctx.font = '600 30px monospace';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#7ad4d4';
    ctx.fillText('CLOSED  ·  NIGHT ACCESS ONLY', s / 2, s / 2 + 58);
  });
}

export function makeWaterNormal(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const s = size;
  ctx.fillStyle = '#8080ff';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * s;
    const y = Math.random() * s;
    const r = 4 + Math.random() * 28;
    const grd = ctx.createRadialGradient(x, y, 1, x, y, r);
    grd.addColorStop(0, 'rgba(220,220,255,0.55)');
    grd.addColorStop(0.45, 'rgba(120,120,220,0.2)');
    grd.addColorStop(1, 'rgba(80,80,180,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function makeKidsDrawings() {
  return makeCanvas(512, (ctx, s) => {
    ctx.fillStyle = '#e8dcc4';
    ctx.fillRect(0, 0, s, s);
    const cols = ['#c04040', '#2a6cb0', '#d0a020', '#2a8a48', '#6a3a8a'];
    for (let i = 0; i < 18; i++) {
      ctx.strokeStyle = cols[i % cols.length];
      ctx.lineWidth = 3 + Math.random() * 4;
      ctx.beginPath();
      let x = 40 + Math.random() * (s - 80);
      let y = 40 + Math.random() * (s - 80);
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (Math.random() - 0.5) * 90;
        y += (Math.random() - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#1a2030';
    ctx.font = '28px Comic Sans MS, cursive';
    ctx.fillText('MATYÁŠ 2019', 40, 60);
  });
}

export function makeMapBoard() {
  return makeCanvas(1024, (ctx, s) => {
    ctx.fillStyle = '#d7e2ea';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#2a5068';
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, s - 48, s - 48);
    ctx.fillStyle = '#6aa8c0';
    ctx.fillRect(180, 280, 660, 420);
    ctx.fillStyle = '#c0d0d8';
    ctx.fillRect(200, 80, 280, 180);
    ctx.fillStyle = '#8a6a48';
    ctx.fillRect(620, 90, 220, 140);
    ctx.fillStyle = '#c04040';
    ctx.beginPath();
    ctx.arc(360, 170, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a3040';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText('ATLANTIS WAVE', 60, 70);
    ctx.font = '28px sans-serif';
    ctx.fillText('hala · šatny · vlny · věž', 60, 980);
  });
}
