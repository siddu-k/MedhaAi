import { useEffect, useRef } from 'react';

const PALETTE = [
  { type: 'solid', value: '#22c55e' },
  { type: 'solid', value: '#06b6d4' },
  { type: 'solid', value: '#f97316' },
  { type: 'solid', value: '#ef4444' },
  { type: 'solid', value: '#facc15' },
  { type: 'solid', value: '#ec4899' },
  { type: 'solid', value: '#9ca3af' },
  { type: 'solid', value: '#a78bfa' },
  { type: 'solid', value: '#60a5fa' },
  { type: 'solid', value: '#34d399' },
  { type: 'gradient', stops: ['#6366f1', '#3b82f6'] },
  { type: 'gradient', stops: ['#06b6d4', '#6366f1'] },
  { type: 'gradient', stops: ['#22c55e', '#06b6d4'] },
  { type: 'gradient', stops: ['#f97316', '#ef4444'] },
  { type: 'gradient', stops: ['#8b5cf6', '#06b6d4'] },
  { type: 'gradient', stops: ['#3b82f6', '#8b5cf6'] },
  { type: 'gradient', stops: ['#34d399', '#3b82f6'] },
];

const SHAPE_TYPES = ['circle', 'pill', 'star', 'star'];

function rnd(min, max) { return Math.random() * (max - min) + min; }
function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function smoothstep(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function durationToFactor(seconds) {
  if (seconds <= 0) return 1;
  return 1 - Math.pow(0.05, 1 / (60 * seconds));
}

function drawCircle(ctx, size) {
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
}

function drawPill(ctx, size) {
  const w = size * 0.48;
  const h = size;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-w, -h, w * 2, h * 2, w);
  } else {
    ctx.rect(-w, -h, w * 2, h * 2);
  }
  ctx.fill();
}

function drawStar(ctx, size, points, innerRatio) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * innerRatio;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawShape(ctx, shape) {
  switch (shape.type) {
    case 'circle': return drawCircle(ctx, shape.size / 1.5);
    case 'pill':   return drawPill(ctx, shape.size / 1.4);
    case 'star':   return drawStar(ctx, shape.size, shape.points, shape.innerRatio);
    default: return drawCircle(ctx, shape.size / 1.5);
  }
}

function resolveFill(ctx, colorDef, size) {
  if (colorDef.type === 'solid') return colorDef.value;
  const grad = ctx.createRadialGradient(0, -size * 0.3, 0, 0, size * 0.3, size * 1.5);
  grad.addColorStop(0, colorDef.stops[0]);
  grad.addColorStop(1, colorDef.stops[1]);
  return grad;
}

function randomStarProps() {
  return {
    points: rndInt(4, 10),
    innerRatio: rnd(0.1, 0.5),
  };
}

export default function ShapeWaveAnimation() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const gap = 38;
    const radiusVmin = 28;
    const speedIn = 0.35;
    const speedOut = 0.55;
    
    // Controlled subtle scaling
    const restScale = 0.12;
    const minHoverScale = 0.7;
    const maxHoverScale = 1.35; // Gentle, clean expansion without blowing up in size
    const waveSpeed = 1350;
    const waveWidth = 170;

    let isDestroyed = false;
    let rafId = null;
    let grid = null;
    let pointer = null;
    let activity = 0;
    let waves = [];
    let maskRects = [];
    let frameCount = 0;
    let activeWaveCount = 0;

    function buildGrid() {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || window.innerWidth;
      const H = rect.height || 400;
      const cols = Math.floor(W / gap);
      const rows = Math.floor(H / gap);
      const offsetX = (W - (cols - 1) * gap) / 2;
      const offsetY = (H - (rows - 1) * gap) / 2;
      const shapes = [];

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const type = pick(SHAPE_TYPES);
          const shape = {
            x: offsetX + col * gap,
            y: offsetY + row * gap,
            type: type,
            color: pick(PALETTE),
            angle: rnd(0, Math.PI * 2),
            size: gap * 0.38,
            scale: restScale,
            maxScale: rnd(minHoverScale, maxHoverScale),
            hovered: false,
          };
          if (type === 'star') Object.assign(shape, randomStarProps());
          shapes.push(shape);
        }
      }

      return { shapes, width: W, height: H };
    }

    function init() {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || window.innerWidth;
      const H = rect.height || 400;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      grid = buildGrid();
    }

    function triggerWave(x, y) {
      const rect = canvas.getBoundingClientRect();
      const wx = x !== undefined ? x : rect.width / 2;
      const wy = y !== undefined ? y : rect.height / 2;
      waves.push({ x: wx, y: wy, startTime: performance.now() });
      activeWaveCount++;
      const delay = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / waveSpeed;
      setTimeout(() => {
        activeWaveCount = Math.max(0, activeWaveCount - 1);
      }, delay * 1000);
    }

    function tick() {
      if (isDestroyed) return;
      if (!grid) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const shapes = grid.shapes;
      const width = grid.width;
      const height = grid.height;
      const radius = Math.min(width, height) * (radiusVmin / 100);
      const now = performance.now();

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, width, height);

      activity *= 0.93;

      frameCount++;
      if (frameCount % 10 === 0) {
        const cRect = canvas.getBoundingClientRect();
        maskRects = Array.from(document.querySelectorAll('[data-shape-mask]')).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            left: r.left - cRect.left,
            right: r.right - cRect.left,
            top: r.top - cRect.top,
            bottom: r.bottom - cRect.top
          };
        });
      }

      const maxDist = Math.sqrt(width * width + height * height);
      waves = waves.filter((w) => (now - w.startTime) / 1000 * waveSpeed < maxDist + waveWidth);

      for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const pad = gap / 2;
        const masked = activeWaveCount === 0 && maskRects.some(
          (r) => shape.x >= r.left - pad && shape.x <= r.right + pad &&
                 shape.y >= r.top - pad && shape.y <= r.bottom + pad
        );

        if (masked) {
          shape.scale += (0 - shape.scale) * durationToFactor(speedOut);
          if (shape.scale < 0.005) shape.scale = 0;
          continue;
        }

        let pointerInfluence = 0;
        if (pointer && activity > 0.001) {
          const dx = shape.x - pointer.x;
          const dy = shape.y - pointer.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          pointerInfluence = smoothstep(1 - dist / radius) * activity;

          if (pointerInfluence > 0.05 && !shape.hovered) {
            shape.hovered = true;
            shape.maxScale = rnd(minHoverScale, maxHoverScale);
            shape.angle = rnd(0, Math.PI * 2);
            if (shape.type === 'star') Object.assign(shape, randomStarProps());
          } else if (pointerInfluence <= 0.05) {
            shape.hovered = false;
          }
        } else {
          shape.hovered = false;
        }

        // Parallel Wave Influences with subtle scaling
        let waveInfluence = 0;
        for (let j = 0; j < waves.length; j++) {
          const wave = waves[j];
          const waveRadius = (now - wave.startTime) / 1000 * waveSpeed;
          const wdx = shape.x - wave.x;
          const wdy = shape.y - wave.y;
          const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
          const t = 1 - Math.abs(wdist - waveRadius) / waveWidth;
          if (t > 0) {
            waveInfluence = Math.max(waveInfluence, Math.sin(Math.PI * t));
          }
        }

        const pointerTarget = restScale + pointerInfluence * (shape.maxScale - restScale);
        const waveTarget = restScale + waveInfluence * (shape.maxScale - restScale);
        const target = Math.max(pointerTarget, waveTarget);

        const factor = target > shape.scale ? durationToFactor(speedIn) : durationToFactor(speedOut);
        shape.scale += (target - shape.scale) * factor;

        if (shape.scale < restScale * 0.15) continue;

        ctx.save();
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.angle);
        ctx.scale(shape.scale, shape.scale);
        ctx.fillStyle = resolveFill(ctx, shape.color, shape.size);
        drawShape(ctx, shape);
        ctx.restore();
      }

      rafId = requestAnimationFrame(tick);
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      activity = 1;
    };

    const onClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      triggerWave(e.clientX - rect.left, e.clientY - rect.top);
    };

    const onKeyWave = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.detail?.x !== undefined ? (e.detail.x - rect.left) : rect.width / 2;
      const y = e.detail?.y !== undefined ? (e.detail.y - rect.top) : rect.height / 2;
      triggerWave(x, y);
    };

    init();
    rafId = requestAnimationFrame(tick);
    triggerWave();

    window.addEventListener('resize', init);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('click', onClick);
    window.addEventListener('shape-wave-key', onKeyWave);

    return () => {
      isDestroyed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', init);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('shape-wave-key', onKeyWave);
    };
  }, []);

  return <canvas ref={canvasRef} className="shape-wave-canvas" />;
}
