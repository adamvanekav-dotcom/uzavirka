import * as THREE from 'three';

function makeCanvas(size, draw, { normal = false } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: !!normal });
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  if (!normal) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Convert height canvas → tangent normal map */
function heightToNormal(heightCanvas, strength = 2.5) {
  const s = heightCanvas.width;
  const hctx = heightCanvas.getContext('2d');
  const img = hctx.getImageData(0, 0, s, s);
  const out = document.createElement('canvas');
  out.width = out.height = s;
  const octx = out.getContext('2d');
  const dst = octx.createImageData(s, s);
  const lum = (i) => img.data[i] * 0.3 + img.data[i + 1] * 0.59 + img.data[i + 2] * 0.11;
  const at = (x, y) => {
    x = (x + s) % s;
    y = (y + s) % s;
    return lum((y * s + x) * 4) / 255;
  };
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const nx = -dx;
      const ny = -dy;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      const i = (y * s + x) * 4;
      dst.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      dst.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      dst.data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      dst.data[i + 3] = 255;
    }
  }
  octx.putImageData(dst, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function bakePair(size, drawHeightColor) {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  const ctx = colorCanvas.getContext('2d', { willReadFrequently: true });
  drawHeightColor(ctx, size);
  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 8;
  const normalMap = heightToNormal(colorCanvas, 3.2);
  return { map, normalMap };
}

export function makeFloorTile(size = 512) {
  return bakePair(size, (ctx, s) => {
    ctx.fillStyle = '#071820';
    ctx.fillRect(0, 0, s, s);
    const tile = 64;
    for (let y = 0; y < s; y += tile) {
      for (let x = 0; x < s; x += tile) {
        const n = ((x * 13 + y * 7) % 17) / 17;
        const r = 14 + n * 10;
        const g = 42 + n * 14;
        const b = 52 + n * 16;
        const grd = ctx.createLinearGradient(x, y, x + tile, y + tile);
        grd.addColorStop(0, `rgb(${r + 12},${g + 10},${b + 8})`);
        grd.addColorStop(0.5, `rgb(${r},${g},${b})`);
        grd.addColorStop(1, `rgb(${r - 6},${g - 5},${b - 4})`);
        ctx.fillStyle = grd;
        ctx.fillRect(x + 3, y + 3, tile - 6, tile - 6);
        // bevel highlight (height for normals)
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 3, y + 3, tile - 6, 4);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(x + 3, y + tile - 7, tile - 6, 4);
        for (let i = 0; i < 28; i++) {
          ctx.fillStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.04})`;
          ctx.fillRect(x + 6 + Math.random() * (tile - 12), y + 6 + Math.random() * (tile - 12), 2, 2);
        }
      }
    }
    ctx.strokeStyle = 'rgba(2,8,12,0.98)';
    ctx.lineWidth = 4;
    for (let i = 0; i <= s; i += tile) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
    }
    for (let i = 0; i < 40; i++) {
      ctx.strokeStyle = `rgba(200,245,255,${0.05 + Math.random() * 0.08})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      const x = Math.random() * s;
      const y = Math.random() * s;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 50, y + 12, x + 90, y - 6);
      ctx.stroke();
    }
  });
}

export function makeWallTile(size = 512) {
  return bakePair(size, (ctx, s) => {
    ctx.fillStyle = '#0c2028';
    ctx.fillRect(0, 0, s, s);
    const tw = 96;
    const th = 48;
    for (let y = 0; y < s; y += th) {
      const offset = (Math.floor(y / th) % 2) * (tw / 2);
      for (let x = -tw; x < s + tw; x += tw) {
        const px = x + offset;
        const n = ((px * 3 + y * 11) % 13) / 13;
        const r = 22 + n * 10;
        const g = 48 + n * 12;
        const b = 56 + n * 14;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px + 2, y + 2, tw - 4, th - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(px + 4, y + 3, tw - 10, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(px + 4, y + th - 8, tw - 10, 4);
      }
    }
    ctx.strokeStyle = 'rgba(4,12,16,0.95)';
    ctx.lineWidth = 3;
    for (let y = 0; y <= s; y += th) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
    }
  });
}

export function makeConcrete(size = 512) {
  return bakePair(size, (ctx, s) => {
    ctx.fillStyle = '#4a5562';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 22000; i++) {
      const g = 45 + Math.floor(Math.random() * 55);
      ctx.fillStyle = `rgba(${g},${g + 3},${g + 8},${0.3 + Math.random() * 0.45})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1);
    }
    ctx.strokeStyle = 'rgba(18,22,26,0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      let x = Math.random() * s;
      let y = Math.random() * s;
      ctx.moveTo(x, y);
      for (let j = 0; j < 7; j++) {
        x += (Math.random() - 0.5) * 70;
        y += (Math.random() - 0.5) * 70;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

export function makeMetal(size = 256) {
  const { map, normalMap } = bakePair(size, (ctx, s) => {
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#556270');
    g.addColorStop(0.5, '#8a97a6');
    g.addColorStop(1, '#3e4854');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 2) {
      ctx.fillStyle = `rgba(0,0,0,${0.04 + (x % 5) * 0.01})`;
      ctx.fillRect(x, 0, 1, s);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(0, 0, s, 10);
  });
  return { map, normalMap };
}

export function makePlaster(size = 256) {
  return bakePair(size, (ctx, s) => {
    ctx.fillStyle = '#243440';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 10000; i++) {
      const g = 28 + Math.random() * 36;
      ctx.fillStyle = `rgb(${g},${g + 8},${g + 12})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
    }
  });
}

export function makeNeonSign(text = 'ATLANTIS WAVE', size = 1024) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#03060a';
    ctx.fillRect(0, 0, s, s);
    ctx.font = 'bold 72px "Arial Narrow", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#4ff0f0';
    ctx.shadowBlur = 32;
    ctx.fillStyle = '#c8ffff';
    ctx.fillText(text, s / 2, s / 2 - 10);
    ctx.font = '28px monospace';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#7ad0d0';
    ctx.fillText('CLOSED · NIGHT ACCESS ONLY', s / 2, s / 2 + 55);
  });
}

export function makeWaterNormal(size = 256) {
  return makeCanvas(size, (ctx, s) => {
    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 220; i++) {
      const x = Math.random() * s;
      const y = Math.random() * s;
      const r = 3 + Math.random() * 18;
      const grd = ctx.createRadialGradient(x, y, 1, x, y, r);
      grd.addColorStop(0, 'rgba(210,210,255,0.6)');
      grd.addColorStop(1, 'rgba(80,80,200,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
