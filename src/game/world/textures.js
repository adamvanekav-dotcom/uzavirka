import * as THREE from 'three';

function makeCanvas(size, draw) {
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
  tex.needsUpdate = true;
  return tex;
}

/** Glossy pool deck / lobby floor tiles with grout + wet streaks */
export function makeFloorTile(size = 512) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#0a1c24';
    ctx.fillRect(0, 0, s, s);
    const tile = 64;
    for (let y = 0; y < s; y += tile) {
      for (let x = 0; x < s; x += tile) {
        const n = ((x * 13 + y * 7) % 17) / 17;
        const r = 28 + n * 18;
        const g = 78 + n * 28;
        const b = 92 + n * 30;
        const grd = ctx.createLinearGradient(x, y, x + tile, y + tile);
        grd.addColorStop(0, `rgb(${r + 10},${g + 12},${b + 14})`);
        grd.addColorStop(1, `rgb(${r},${g},${b})`);
        ctx.fillStyle = grd;
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        // micro noise
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.03})`;
          ctx.fillRect(x + 4 + Math.random() * (tile - 8), y + 4 + Math.random() * (tile - 8), 2, 2);
        }
      }
    }
    // grout
    ctx.strokeStyle = 'rgba(4,10,14,0.95)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= s; i += tile) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
    }
    // wet specular streaks
    for (let i = 0; i < 35; i++) {
      ctx.strokeStyle = `rgba(180,240,255,${0.04 + Math.random() * 0.07})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 40, y + 10, x + 80, y - 5);
      ctx.stroke();
    }
  });
}

/** Vertical wall ceramic — cooler, larger tiles */
export function makeWallTile(size = 512) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#102830';
    ctx.fillRect(0, 0, s, s);
    const tw = 96;
    const th = 48;
    for (let y = 0; y < s; y += th) {
      const offset = (Math.floor(y / th) % 2) * (tw / 2);
      for (let x = -tw; x < s; x += tw) {
        const px = x + offset;
        const n = ((px * 3 + y * 11) % 13) / 13;
        ctx.fillStyle = `rgb(${36 + n * 14},${88 + n * 20},${98 + n * 22})`;
        ctx.fillRect(px + 1, y + 1, tw - 2, th - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(px + 3, y + 2, tw - 8, 6);
      }
    }
    ctx.strokeStyle = 'rgba(6,14,18,0.9)';
    ctx.lineWidth = 2;
    for (let y = 0; y <= s; y += th) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
    }
  });
}

export function makeConcrete(size = 512) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#3a4552';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 18000; i++) {
      const g = 40 + Math.floor(Math.random() * 50);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 8},${0.35 + Math.random() * 0.4})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1);
    }
    // cracks
    ctx.strokeStyle = 'rgba(20,24,28,0.35)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let x = Math.random() * s;
      let y = Math.random() * s;
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

export function makeMetal(size = 256) {
  return makeCanvas(size, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#4a5664');
    g.addColorStop(0.5, '#7a8796');
    g.addColorStop(1, '#3a4450');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 3) {
      ctx.fillStyle = `rgba(0,0,0,${0.05 + (x % 7) * 0.01})`;
      ctx.fillRect(x, 0, 1, s);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, s, 8);
  });
}

export function makePlaster(size = 256) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#1a2832';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 8000; i++) {
      const g = 20 + Math.random() * 30;
      ctx.fillStyle = `rgb(${g},${g + 8},${g + 12})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  });
}

export function makeNeonSign(text = 'ATLANTIS WAVE', size = 1024) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#04080c';
    ctx.fillRect(0, 0, s, s);
    ctx.font = 'bold 72px "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#4ff0f0';
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#b8ffff';
    ctx.fillText(text, s / 2, s / 2 - 10);
    ctx.font = '28px monospace';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#7ad0d0';
    ctx.fillText('CLOSED · NIGHT ACCESS ONLY', s / 2, s / 2 + 55);
  });
}

export function makeWaterNormal(size = 256) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 3 + Math.random() * 16;
      const grd = ctx.createRadialGradient(x, y, 1, x, y, r);
      grd.addColorStop(0, 'rgba(200,200,255,0.55)');
      grd.addColorStop(1, 'rgba(80,80,200,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function makeRoughnessMap(size = 256) {
  return makeCanvas(size, (ctx, s) => {
    for (let i = 0; i < s * s * 0.4; i++) {
      const v = Math.floor(80 + Math.random() * 120);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  });
}
