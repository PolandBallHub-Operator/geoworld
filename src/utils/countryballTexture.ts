import * as THREE from 'three';
import { CountryId, ExpressionId } from '../types/game';
import { COUNTRIES, getBallImageUrl } from '../data/countries';

const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedurally draws a Countryball on a 512x512 Canvas as fallback
 * or to ensure instant 100% reliable rendering
 */
export function drawProceduralCountryball(
  canvas: HTMLCanvasElement,
  countryId: CountryId,
  expressionId: ExpressionId
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Ball boundary circle clip
  ctx.save();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 8, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Flag background rendering based on country
  drawFlag(ctx, countryId, w, h);

  // Gentle spherical shading overlay
  const grad = ctx.createRadialGradient(
    w * 0.35,
    h * 0.35,
    w * 0.05,
    w * 0.5,
    h * 0.5,
    w * 0.48
  );
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();

  // Outer bold black outline (hand-drawn Polandball style)
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w / 2 - 8, 0, Math.PI * 2);
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#1a1a1a';
  ctx.stroke();

  // Draw cute eyes matching the expression
  drawEyes(ctx, expressionId, w, h);
}

function drawFlag(
  ctx: CanvasRenderingContext2D,
  countryId: CountryId,
  w: number,
  h: number
) {
  switch (countryId) {
    case 'japan':
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#bc002d';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'poland':
      // Top white, bottom red
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h / 2);
      ctx.fillStyle = '#dc143c';
      ctx.fillRect(0, h / 2, w, h / 2);
      break;

    case 'germany':
      // Black, Red, Gold
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, 0, w, h / 3);
      ctx.fillStyle = '#dd0000';
      ctx.fillRect(0, h / 3, w, h / 3);
      ctx.fillStyle = '#ffce00';
      ctx.fillRect(0, (h / 3) * 2, w, h / 3);
      break;

    case 'france':
      // Blue, White, Red
      ctx.fillStyle = '#0055a4';
      ctx.fillRect(0, 0, w / 3, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 3, 0, w / 3, h);
      ctx.fillStyle = '#ef4135';
      ctx.fillRect((w / 3) * 2, 0, w / 3, h);
      break;

    case 'italy':
      // Green, White, Red
      ctx.fillStyle = '#008c45';
      ctx.fillRect(0, 0, w / 3, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 3, 0, w / 3, h);
      ctx.fillStyle = '#cd212a';
      ctx.fillRect((w / 3) * 2, 0, w / 3, h);
      break;

    case 'russia':
      // White, Blue, Red
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h / 3);
      ctx.fillStyle = '#0039a6';
      ctx.fillRect(0, h / 3, w, h / 3);
      ctx.fillStyle = '#d52b1e';
      ctx.fillRect(0, (h / 3) * 2, w, h / 3);
      break;

    case 'austria':
      // Red, White, Red
      ctx.fillStyle = '#ed2939';
      ctx.fillRect(0, 0, w, h / 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h / 3, w, h / 3);
      ctx.fillStyle = '#ed2939';
      ctx.fillRect(0, (h / 3) * 2, w, h / 3);
      break;

    case 'china':
      // Red with gold big star
      ctx.fillStyle = '#de2910';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffde00';
      ctx.font = `bold ${w * 0.22}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', w * 0.3, h * 0.35);
      break;

    case 'sierraleone':
      // Green, White, Light Blue
      ctx.fillStyle = '#1eb53a';
      ctx.fillRect(0, 0, w, h / 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h / 3, w, h / 3);
      ctx.fillStyle = '#0072c6';
      ctx.fillRect(0, (h / 3) * 2, w, h / 3);
      break;

    case 'korea':
      // White with Taegeuk center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#cd2e3a';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.22, Math.PI, 0, false);
      ctx.fill();
      ctx.fillStyle = '#0047a0';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.22, 0, Math.PI, false);
      ctx.fill();
      break;

    case 'usa':
      // Stripes + Blue canton
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b22234';
      for (let i = 0; i < 7; i++) {
        ctx.fillRect(0, (h / 7) * i, w, h / 14);
      }
      ctx.fillStyle = '#3c3b6e';
      ctx.fillRect(0, 0, w * 0.5, h * 0.5);
      // Star dots
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px sans-serif';
      ctx.fillText('★', w * 0.2, h * 0.25);
      break;

    case 'custom':
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, w * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${w * 0.16}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎨', w / 2, h / 2);
      break;

    case 'england472x600':
    default:
      // Union Jack style or St George's cross
      ctx.fillStyle = '#012169';
      ctx.fillRect(0, 0, w, h);
      // White diagonal
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 40;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
      // Red diagonal
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, h);
      ctx.moveTo(w, 0);
      ctx.lineTo(0, h);
      ctx.stroke();
      // White cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 2 - 30, 0, 60, h);
      ctx.fillRect(0, h / 2 - 30, w, 60);
      // Red cross
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(w / 2 - 16, 0, 32, h);
      ctx.fillRect(0, h / 2 - 16, w, 32);
      break;
  }
}

function drawEyes(
  ctx: CanvasRenderingContext2D,
  expressionId: ExpressionId,
  w: number,
  h: number
) {
  const eyeLeftX = w * 0.38;
  const eyeRightX = w * 0.62;
  const eyeY = h * 0.44;

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#111111';
  ctx.fillStyle = '#ffffff';

  switch (expressionId) {
    case 'happy.png':
    case 'smile.png':
      // Happy inverted arcs ^ ^
      ctx.beginPath();
      ctx.arc(eyeLeftX, eyeY + 10, 24, Math.PI * 1.15, Math.PI * 1.85);
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(eyeRightX, eyeY + 10, 24, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      break;

    case 'lol.png':
      // Wide joyful closed eyes ><
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(eyeLeftX - 20, eyeY - 14);
      ctx.lineTo(eyeLeftX + 16, eyeY);
      ctx.lineTo(eyeLeftX - 20, eyeY + 14);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(eyeRightX + 20, eyeY - 14);
      ctx.lineTo(eyeRightX - 16, eyeY);
      ctx.lineTo(eyeRightX + 20, eyeY + 14);
      ctx.stroke();
      break;

    case 'surprise.png':
      // Big wide circle eyes
      ctx.beginPath();
      ctx.arc(eyeLeftX, eyeY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(eyeRightX, eyeY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case 'itome.png':
      // Slanted calm zen eyes -- --
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(eyeLeftX - 22, eyeY);
      ctx.lineTo(eyeLeftX + 22, eyeY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(eyeRightX - 22, eyeY);
      ctx.lineTo(eyeRightX + 22, eyeY);
      ctx.stroke();
      break;

    case 'anger.png':
      // Slanted inward determined eyes
      ctx.beginPath();
      ctx.moveTo(eyeLeftX - 20, eyeY - 10);
      ctx.lineTo(eyeLeftX + 20, eyeY + 16);
      ctx.arc(eyeLeftX, eyeY + 10, 18, 0.2, Math.PI * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(eyeRightX + 20, eyeY - 10);
      ctx.lineTo(eyeRightX - 20, eyeY + 16);
      ctx.arc(eyeRightX, eyeY + 10, 18, Math.PI * 0.1, 0.8 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case 'dissatisfaction.png':
      // One squint, one flat
      ctx.beginPath();
      ctx.ellipse(eyeLeftX, eyeY, 18, 26, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(eyeRightX - 18, eyeY);
      ctx.lineTo(eyeRightX + 18, eyeY);
      ctx.stroke();
      break;

    case 'plot.png':
      // Narrow sly eyes
      ctx.beginPath();
      ctx.ellipse(eyeLeftX, eyeY, 22, 14, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(eyeRightX, eyeY, 22, 14, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;

    case 'normal.png':
    default:
      // Classic cute Polandball white ovals with black outlines
      ctx.beginPath();
      ctx.ellipse(eyeLeftX, eyeY, 20, 28, -0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(eyeRightX, eyeY, 20, 28, 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
  }
}

/**
 * Loads or creates a THREE.CanvasTexture for a given Countryball
 */
export function getCountryballThreeTexture(
  countryId: CountryId,
  expressionId: ExpressionId
): THREE.CanvasTexture {
  const key = `${countryId}_${expressionId}`;
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  // Immediately draw procedural version
  drawProceduralCountryball(canvas, countryId, expressionId);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  // Attempt to load the official raw GitHub countryball image on top
  const remoteUrl = getBallImageUrl(countryId, expressionId);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      texture.needsUpdate = true;
    }
  };
  img.onerror = () => {
    // Keep high quality procedural canvas!
  };
  img.src = remoteUrl;

  textureCache.set(key, texture);
  return texture;
}

/**
 * Returns a data URL fallback for UI rendering
 */
export function getCountryballDataUrl(
  countryId: CountryId,
  expressionId: ExpressionId
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  drawProceduralCountryball(canvas, countryId, expressionId);
  return canvas.toDataURL('image/png');
}
