import * as THREE from 'three';
import { CountryId, BallEmotion } from '../types/game';

/**
 * Draws a single flag motif inside a given sub-rectangle of the canvas.
 * Center is at (offsetX + width / 2, offsetY + height / 2).
 * Rectangular flags are carefully bled to prevent margins/borders on the 3D sphere.
 */
function drawSingleFlag(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  w: number,
  h: number,
  countryId: CountryId,
  isFront: boolean,
  customFrontImage?: HTMLImageElement | null,
  customBackImage?: HTMLImageElement | null
) {
  const cx = offsetX + w / 2;
  const cy = offsetY + h / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(offsetX, offsetY, w, h);
  ctx.clip();

  switch (countryId) {
    case 'poland': {
      // Polandball canonical rule: red top, white bottom
      ctx.fillStyle = '#dc143c';
      ctx.fillRect(offsetX, offsetY, w, h / 2);
      ctx.fillStyle = '#f8f8fa';
      ctx.fillRect(offsetX, offsetY + h / 2, w, h / 2);
      break;
    }

    case 'germany': {
      // Germany: Both sides same (Black, Red, Gold horizontal stripes)
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(offsetX, offsetY, w, h / 3);
      ctx.fillStyle = '#dd0000';
      ctx.fillRect(offsetX, offsetY + h / 3, w, h / 3);
      ctx.fillStyle = '#ffce00';
      ctx.fillRect(offsetX, offsetY + (h * 2) / 3, w, h / 3);
      break;
    }

    case 'russia': {
      // Russia: Both sides same (White, Blue, Red horizontal stripes)
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(offsetX, offsetY, w, h / 3);
      ctx.fillStyle = '#0039a6';
      ctx.fillRect(offsetX, offsetY + h / 3, w, h / 3);
      ctx.fillStyle = '#d52b1e';
      ctx.fillRect(offsetX, offsetY + (h * 2) / 3, w, h / 3);
      break;
    }

    case 'austria': {
      // Austria: Both sides same (Red, White, Red horizontal stripes)
      ctx.fillStyle = '#ed2939';
      ctx.fillRect(offsetX, offsetY, w, h / 3);
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(offsetX, offsetY + h / 3, w, h / 3);
      ctx.fillStyle = '#ed2939';
      ctx.fillRect(offsetX, offsetY + (h * 2) / 3, w, h / 3);
      break;
    }

    case 'sierraleone': {
      // Sierra Leone: Both sides same (Green, White, Light Blue horizontal stripes)
      ctx.fillStyle = '#1eb53a';
      ctx.fillRect(offsetX, offsetY, w, h / 3);
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(offsetX, offsetY + h / 3, w, h / 3);
      ctx.fillStyle = '#0072c6';
      ctx.fillRect(offsetX, offsetY + (h * 2) / 3, w, h / 3);
      break;
    }

    case 'england472x600': {
      // UK / England: Both sides same (Union Jack)
      ctx.fillStyle = '#012169';
      ctx.fillRect(offsetX, offsetY, w, h);

      // White saltire diagonals
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 60;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(offsetX + w, offsetY + h);
      ctx.moveTo(offsetX + w, offsetY);
      ctx.lineTo(offsetX, offsetY + h);
      ctx.stroke();

      // Red saltire diagonals
      ctx.strokeStyle = '#c8102e';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.lineTo(offsetX + w, offsetY + h);
      ctx.moveTo(offsetX + w, offsetY);
      ctx.lineTo(offsetX, offsetY + h);
      ctx.stroke();

      // White cross
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 45, offsetY, 90, h);
      ctx.fillRect(offsetX, cy - 45, w, 90);

      // Red cross
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(cx - 25, offsetY, 50, h);
      ctx.fillRect(offsetX, cy - 25, w, 50);
      break;
    }

    case 'france': {
      // France: Vertical tricolor (Blue, White, Red).
      // Specification: Invert on back face for continuous 3D wrap!
      const col1 = isFront ? '#002654' : '#ed2939'; // Blue on front-left, Red on back-left
      const col2 = '#ffffff';
      const col3 = isFront ? '#ed2939' : '#002654';

      ctx.fillStyle = col1;
      ctx.fillRect(offsetX, offsetY, w / 3, h);
      ctx.fillStyle = col2;
      ctx.fillRect(offsetX + w / 3, offsetY, w / 3, h);
      ctx.fillStyle = col3;
      ctx.fillRect(offsetX + (w * 2) / 3, offsetY, w / 3, h);
      break;
    }

    case 'italy': {
      // Italy: Vertical tricolor (Green, White, Red).
      // Specification: Invert on back face for continuous 3D wrap!
      const col1 = isFront ? '#009246' : '#ce2b37'; // Green on front-left, Red on back-left
      const col2 = '#ffffff';
      const col3 = isFront ? '#ce2b37' : '#009246';

      ctx.fillStyle = col1;
      ctx.fillRect(offsetX, offsetY, w / 3, h);
      ctx.fillStyle = col2;
      ctx.fillRect(offsetX + w / 3, offsetY, w / 3, h);
      ctx.fillStyle = col3;
      ctx.fillRect(offsetX + (w * 2) / 3, offsetY, w / 3, h);
      break;
    }

    case 'japan': {
      // Japan: Front has Hinomaru red sun between eyes.
      // Specification: Back face is solid WHITE!
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(offsetX, offsetY, w, h);
      if (isFront) {
        ctx.fillStyle = '#bc002d';
        ctx.beginPath();
        ctx.arc(cx, cy, h * 0.32, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'korea': {
      // Korea: Front has Taegeuk circle between eyes.
      // Specification: Back face is solid WHITE!
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(offsetX, offsetY, w, h);
      if (isFront) {
        // Red top half, Blue bottom half with yin-yang swirl
        const tr = h * 0.28;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.fillStyle = '#cd2e3a';
        ctx.beginPath();
        ctx.arc(0, 0, tr, Math.PI, 0, false);
        ctx.arc(-tr / 2, 0, tr / 2, 0, Math.PI, false);
        ctx.arc(tr / 2, 0, tr / 2, 0, Math.PI, true);
        ctx.fill();

        ctx.fillStyle = '#0047a0';
        ctx.beginPath();
        ctx.arc(0, 0, tr, 0, Math.PI, false);
        ctx.arc(tr / 2, 0, tr / 2, Math.PI, 0, false);
        ctx.arc(-tr / 2, 0, tr / 2, Math.PI, 0, true);
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case 'china': {
      // China: Front has Gold Stars between eyes.
      // Specification: Back face is solid RED!
      ctx.fillStyle = '#de2910';
      ctx.fillRect(offsetX, offsetY, w, h);
      if (isFront) {
        ctx.fillStyle = '#ffde00';
        // Big main star
        drawStar(ctx, cx - w * 0.12, cy - h * 0.08, 42, 18);
        // 4 smaller surrounding arc stars
        drawStar(ctx, cx + w * 0.08, cy - h * 0.22, 14, 6);
        drawStar(ctx, cx + w * 0.16, cy - h * 0.10, 14, 6);
        drawStar(ctx, cx + w * 0.16, cy + h * 0.06, 14, 6);
        drawStar(ctx, cx + w * 0.08, cy + h * 0.18, 14, 6);
      }
      break;
    }

    case 'usa': {
      // USA: 13 stripes + blue canton with stars
      const stripeH = h / 13;
      for (let i = 0; i < 13; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#b22234' : '#ffffff';
        ctx.fillRect(offsetX, offsetY + i * stripeH, w, stripeH);
      }
      if (isFront) {
        ctx.fillStyle = '#3c3b6e';
        ctx.fillRect(offsetX, offsetY, w * 0.46, stripeH * 7);

        ctx.fillStyle = '#ffffff';
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 6; col++) {
            const starX = offsetX + 25 + (col * (w * 0.46 - 50)) / 5;
            const starY = offsetY + 18 + (row * (stripeH * 7 - 36)) / 4;
            ctx.beginPath();
            ctx.arc(starX, starY, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
    }

    case 'custom': {
      const activeImg = isFront ? customFrontImage : (customBackImage || customFrontImage);
      if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
        // Render rectangular custom image stretched to cover completely without empty margins
        renderFilledRectangularImage(ctx, activeImg, offsetX, offsetY, w, h);
      } else {
        // Clean pleasant placeholder
        ctx.fillStyle = isFront ? '#2563eb' : '#1e40af';
        ctx.fillRect(offsetX, offsetY, w, h);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isFront ? 'CUSTOM FRONT' : 'CUSTOM BACK', cx, cy);
      }
      break;
    }
  }

  ctx.restore();
}

/**
 * Draws a 5-pointed star
 */
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number, innerR: number) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Fits a rectangular flag onto the 512x512 hemisphere canvas with zero margins/borders:
 * Covers the entire area and bleeds edge pixels naturally so no white bars or gaps appear.
 */
function renderFilledRectangularImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  w: number,
  h: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const imgAspect = iw / ih;
  const targetAspect = w / h; // 1.0 for hemisphere

  // Draw scaled to fill without blank margins
  let drawW = w;
  let drawH = h;
  let drawX = offsetX;
  let drawY = offsetY;

  if (imgAspect > targetAspect) {
    // Image is wider than 1:1, scale to fill height and bleed horizontally
    drawW = h * imgAspect;
    drawX = offsetX - (drawW - w) / 2;
  } else {
    // Image is taller than 1:1, scale to fill width and bleed vertically
    drawH = w / imgAspect;
    drawY = offsetY - (drawH - h) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/**
 * Creates Dual-Face Flag Texture:
 * +Z (front face, between eyes) corresponds to UV u = 0.75 (pixel x = 768).
 * -Z (back face) corresponds to UV u = 0.25 (pixel x = 256).
 */
export function createFlagTexture(
  countryId: CountryId,
  customFrontImage?: HTMLImageElement | null,
  customBackImage?: HTMLImageElement | null
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const halfW = 512;
  const h = 512;

  // 1. Back Face Flag (u = 0.0 to 0.5, centered at u = 0.25 / x = 256)
  drawSingleFlag(ctx, 0, 0, halfW, h, countryId, false, customFrontImage, customBackImage);

  // 2. Front Face Flag (u = 0.5 to 1.0, centered at u = 0.75 / x = 768, right between the eyes!)
  drawSingleFlag(ctx, halfW, 0, halfW, h, countryId, true, customFrontImage, customBackImage);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates the Stylized Polandball Geometry (Attached model)
 */
export function createCountryballGeometry(radius: number = 0.8): THREE.BufferGeometry {
  const widthSegments = 48;
  const heightSegments = 36;
  const geo = new THREE.SphereGeometry(radius, widthSegments, heightSegments);

  const posAttr = geo.attributes.position;
  const vertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const u = vertex.y / radius;

    // Height compression (dumpling / mochi proportions)
    vertex.y *= 0.90;

    let horizontalScale = 1.0;
    if (u < 0) {
      const t = -u;
      horizontalScale = 1.0 + 0.10 * Math.sin(t * Math.PI * 0.7);
    } else {
      const t = u;
      horizontalScale = 1.0 - 0.12 * Math.pow(t, 1.4);
    }

    if (u < -0.7) {
      const bottomT = (-u - 0.7) / 0.3;
      vertex.y += bottomT * 0.05 * radius;
    }

    vertex.x *= horizontalScale;
    vertex.z *= horizontalScale;

    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geo.computeVertexNormals();
  return geo;
}

/**
 * Inverted Hull Outline Material
 */
export function createCountryballOutlineMaterial(outlineWidth: number = 0.095): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      outlineWidth: { value: outlineWidth },
      outlineColor: { value: new THREE.Color(0x101014) },
    },
    vertexShader: `
      uniform float outlineWidth;
      void main() {
        vec3 displaced = position + normal * outlineWidth;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 outlineColor;
      void main() {
        gl_FragColor = vec4(outlineColor, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: true,
  });
}

/**
 * Generates the authentic Polandball Eye Texture:
 * - Large, prominent arched dome eye
 * - Soft steel-blue eyelid shadow on top
 * - Pure white lower half
 * - Thick, bold black outline that scales with the body outline
 */
export function createPolandballEyeTexture(
  emotion: BallEmotion,
  isLeft: boolean,
  outlineWidth: number = 0.095
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  ctx.save();
  ctx.translate(cx, cy);

  const outlineFactor = Math.max(0.4, outlineWidth / 0.075);
  const borderThickness = Math.round(54 * outlineFactor);

  if (emotion === 'happy') {
    ctx.lineWidth = Math.round(56 * outlineFactor);
    ctx.strokeStyle = '#101015';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -10, 165, Math.PI * 0.15, Math.PI * 0.85, false);
    ctx.stroke();
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  if (emotion === 'blink') {
    ctx.lineWidth = Math.round(48 * outlineFactor);
    ctx.strokeStyle = '#101015';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-140, 20);
    ctx.lineTo(140, 20);
    ctx.stroke();
    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  if (emotion === 'plot') {
    // Determined / focused cute action eyes (Pure Polandball canon: NO PUPILS! Clean white sclera with soft eyelid shadow)
    ctx.lineWidth = borderThickness;
    ctx.strokeStyle = '#101015';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = '#ffffff';

    ctx.beginPath();
    ctx.ellipse(0, 0, 160, 95, isLeft ? 0.12 : -0.12, 0, Math.PI * 2);
    ctx.fill();

    // Soft subtle upper shadow (NO PUPILS)
    ctx.save();
    ctx.clip();
    const grad = ctx.createLinearGradient(0, -95, 0, 25);
    grad.addColorStop(0.0, '#9cb8d5');
    grad.addColorStop(0.7, '#dbe7f5');
    grad.addColorStop(1.0, '#ffffff');
    ctx.fillStyle = grad;
    ctx.fillRect(-200, -120, 400, 160);
    ctx.restore();

    ctx.stroke();

    ctx.restore();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // Draw eye outline: Large, round-domed Polandball eye
  const slant = isLeft ? 15 : -15;
  const w = emotion === 'worried' ? 195 : 185;
  const hTop = emotion === 'worried' ? -205 : (emotion === 'squint' ? -80 : -175);
  const hBottom = 160;

  ctx.beginPath();
  // Bottom line: slightly bowed
  ctx.moveTo(-w + 12, hBottom);
  ctx.quadraticCurveTo(0, hBottom + 14, w - 12, hBottom);

  // Right side curving upward into top dome
  ctx.bezierCurveTo(w * 1.08, (hTop + hBottom) * 0.5, w * 0.85, hTop + slant, 0, hTop - 8);

  // Left side curving downward from top dome
  ctx.bezierCurveTo(-w * 0.85, hTop - slant, -w * 1.08, (hTop + hBottom) * 0.5, -w + 12, hBottom);
  ctx.closePath();

  // 1. Fill base white
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // 2. Soft Light-Blue Upper Eyelid Shadow
  ctx.save();
  ctx.clip();

  const shadowHeight = (hBottom - hTop) * 0.46;
  const grad = ctx.createLinearGradient(0, hTop - 25, 0, hTop + shadowHeight);
  grad.addColorStop(0.0, '#9cb8d5');
  grad.addColorStop(0.65, '#b8ceea');
  grad.addColorStop(1.0, '#dbe7f5');

  ctx.fillStyle = grad;
  ctx.fillRect(-w * 1.5, hTop - 35, w * 3, shadowHeight + 35);
  ctx.restore();

  // 3. Thick, Bold Black Comic Border
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = '#101014';
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a standalone 3D Eye assembly
 */
export function createEye3DPart(
  isLeft: boolean,
  outlineWidth: number = 0.095
): { group: THREE.Group; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial } {
  const eyeGroup = new THREE.Group();

  // Front Textured Eye Plate (Large size: 0.88 x 0.86)
  const frontGeo = new THREE.PlaneGeometry(0.88, 0.86);
  const tex = createPolandballEyeTexture('normal', isLeft, outlineWidth);
  const frontMat = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    roughness: 0.25,
    metalness: 0.0,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const frontMesh = new THREE.Mesh(frontGeo, frontMat);
  frontMesh.renderOrder = 10;
  eyeGroup.add(frontMesh);

  return { group: eyeGroup, mesh: frontMesh, material: frontMat };
}

/**
 * Composite Countryball 3D Actor
 */
export class CountryballMeshActor {
  public group: THREE.Group;
  public bodyMesh: THREE.Mesh;
  public outlineMesh: THREE.Mesh;
  public eyesGroup: THREE.Group;
  public leftEye: THREE.Group;
  public rightEye: THREE.Group;
  private leftEyePart: { group: THREE.Group; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial };
  private rightEyePart: { group: THREE.Group; mesh: THREE.Mesh; material: THREE.MeshStandardMaterial };
  public accessoryGroup: THREE.Group;

  private flagTexture: THREE.CanvasTexture;
  private currentCountry: CountryId;
  private currentCustomFrontImage: HTMLImageElement | null = null;
  private currentCustomBackImage: HTMLImageElement | null = null;
  private currentEmotion: BallEmotion = 'normal';
  private currentOutlineWidth: number = 0.095;
  private currentEyeScale: number = 0.80;
  private currentEyeSpacing: number = 1.40;
  private outlineMaterial: THREE.ShaderMaterial;
  private bodyMaterial: THREE.MeshStandardMaterial;

  constructor(
    countryId: CountryId = 'japan',
    radius: number = 0.8,
    customFrontImage?: HTMLImageElement | null,
    customBackImage?: HTMLImageElement | null,
    eyeScale: number = 0.80,
    eyeSpacing: number = 1.40,
    outlineThickness: number = 0.095
  ) {
    this.currentCountry = countryId;
    this.currentCustomFrontImage = customFrontImage || null;
    this.currentCustomBackImage = customBackImage || null;
    this.currentEyeScale = eyeScale;
    this.currentEyeSpacing = eyeSpacing;
    this.currentOutlineWidth = outlineThickness;
    this.group = new THREE.Group();

    // 1. Create Base Gumdrop Geometry
    const geo = createCountryballGeometry(radius);

    // 2. Dual-Face Flag Texture & PBR Body Material
    this.flagTexture = createFlagTexture(
      countryId,
      this.currentCustomFrontImage,
      this.currentCustomBackImage
    );
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      map: this.flagTexture,
      roughness: 0.35,
      metalness: 0.05,
    });
    this.bodyMesh = new THREE.Mesh(geo, this.bodyMaterial);
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // 3. Inverted Hull Comic Outline Mesh
    this.outlineMaterial = createCountryballOutlineMaterial(this.currentOutlineWidth);
    this.outlineMesh = new THREE.Mesh(geo.clone(), this.outlineMaterial);
    this.group.add(this.outlineMesh);

    // 4. Standalone 3D Eye Parts (Large & Bold, proud of front surface)
    this.eyesGroup = new THREE.Group();
    this.eyesGroup.position.set(0, 0.055, 0.865);

    this.leftEyePart = createEye3DPart(true, this.currentOutlineWidth);
    this.rightEyePart = createEye3DPart(false, this.currentOutlineWidth);
    this.leftEye = this.leftEyePart.group;
    this.rightEye = this.rightEyePart.group;

    this.leftEye.rotation.x = -0.04;
    this.leftEye.rotation.z = -0.04;
    this.rightEye.rotation.x = -0.04;
    this.rightEye.rotation.z = 0.04;

    this.eyesGroup.add(this.leftEye);
    this.eyesGroup.add(this.rightEye);
    this.group.add(this.eyesGroup);

    this.setEyeSpacing(eyeSpacing);
    this.setEyeScale(eyeScale);

    // 5. Accessories (Silk top hat for UK, sunglasses for USA, headband for Japan, etc.)
    this.accessoryGroup = new THREE.Group();
    this.group.add(this.accessoryGroup);
    this.updateAccessories(countryId, radius);
  }

  public setEyeScale(scale: number) {
    this.currentEyeScale = Math.max(0.4, Math.min(2.5, scale));
    this.eyesGroup.scale.set(this.currentEyeScale, this.currentEyeScale, this.currentEyeScale);
    this.eyesGroup.position.set(0, 0.055, 0.865 + (this.currentEyeScale - 1.0) * 0.025);
  }

  public setEyeSpacing(spacing: number) {
    this.currentEyeSpacing = Math.max(0.3, Math.min(2.5, spacing));
    const baseSpacing = 0.30;
    const actualSpacing = baseSpacing * this.currentEyeSpacing;

    const angleY = Math.min(0.65, actualSpacing * 0.93);
    const zOffset = -Math.max(0, (actualSpacing - 0.30) * 0.16);

    this.leftEye.position.set(-actualSpacing, 0, zOffset);
    this.leftEye.rotation.y = -angleY;

    this.rightEye.position.set(actualSpacing, 0, zOffset);
    this.rightEye.rotation.y = angleY;
  }

  public setCountry(
    countryId: CountryId,
    customFrontImage?: HTMLImageElement | null,
    customBackImage?: HTMLImageElement | null
  ) {
    this.currentCountry = countryId;
    if (customFrontImage !== undefined) this.currentCustomFrontImage = customFrontImage;
    if (customBackImage !== undefined) this.currentCustomBackImage = customBackImage;

    this.flagTexture.dispose();
    this.flagTexture = createFlagTexture(
      countryId,
      this.currentCustomFrontImage,
      this.currentCustomBackImage
    );
    this.bodyMaterial.map = this.flagTexture;
    this.bodyMaterial.needsUpdate = true;
    this.updateAccessories(countryId, 0.8);
  }

  public setEmotion(emotion: BallEmotion) {
    if (this.currentEmotion === emotion) return;
    this.currentEmotion = emotion;

    const oldLeftMap = this.leftEyePart.material.map;
    const oldRightMap = this.rightEyePart.material.map;

    const newLeftMap = createPolandballEyeTexture(emotion, true, this.currentOutlineWidth);
    const newRightMap = createPolandballEyeTexture(emotion, false, this.currentOutlineWidth);

    this.leftEyePart.material.map = newLeftMap;
    this.rightEyePart.material.map = newRightMap;
    this.leftEyePart.material.needsUpdate = true;
    this.rightEyePart.material.needsUpdate = true;

    if (oldLeftMap) oldLeftMap.dispose();
    if (oldRightMap) oldRightMap.dispose();
  }

  public setOutlineThickness(thickness: number) {
    this.currentOutlineWidth = Math.max(0.02, Math.min(0.20, thickness));
    this.outlineMaterial.uniforms.outlineWidth.value = this.currentOutlineWidth;

    const oldLeftMap = this.leftEyePart.material.map;
    const oldRightMap = this.rightEyePart.material.map;

    const newLeftMap = createPolandballEyeTexture(this.currentEmotion, true, this.currentOutlineWidth);
    const newRightMap = createPolandballEyeTexture(this.currentEmotion, false, this.currentOutlineWidth);

    this.leftEyePart.material.map = newLeftMap;
    this.rightEyePart.material.map = newRightMap;
    this.leftEyePart.material.needsUpdate = true;
    this.rightEyePart.material.needsUpdate = true;

    if (oldLeftMap) oldLeftMap.dispose();
    if (oldRightMap) oldRightMap.dispose();
  }

  private updateAccessories(countryId: CountryId, radius: number) {
    while (this.accessoryGroup.children.length > 0) {
      const child = this.accessoryGroup.children[0] as THREE.Mesh;
      this.accessoryGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    if (countryId === 'england472x600') {
      // British Aristocratic Top Hat
      const hatGroup = new THREE.Group();
      const brimGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 32);
      const crownGeo = new THREE.CylinderGeometry(0.36, 0.38, 0.45, 32);
      const bandGeo = new THREE.CylinderGeometry(0.385, 0.385, 0.08, 32);

      const feltMat = new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.9 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.6 });

      const brim = new THREE.Mesh(brimGeo, feltMat);
      brim.position.y = radius * 0.76;
      const crown = new THREE.Mesh(crownGeo, feltMat);
      crown.position.y = radius * 0.76 + 0.23;
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = radius * 0.76 + 0.06;

      hatGroup.add(brim);
      hatGroup.add(crown);
      hatGroup.add(band);
      hatGroup.rotation.z = -0.15;
      hatGroup.rotation.x = -0.05;
      this.accessoryGroup.add(hatGroup);
    } else if (countryId === 'usa') {
      // Cool Sunglasses
      const glassGroup = new THREE.Group();
      const lensGeo = new THREE.BoxGeometry(0.36, 0.25, 0.06);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x111115,
        roughness: 0.1,
        metalness: 0.9,
      });
      const leftLens = new THREE.Mesh(lensGeo, lensMat);
      leftLens.position.set(-0.26, 0.06, radius * 0.96);
      leftLens.rotation.y = -0.15;

      const rightLens = new THREE.Mesh(lensGeo, lensMat);
      rightLens.position.set(0.26, 0.06, radius * 0.96);
      rightLens.rotation.y = 0.15;

      const bridgeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.22);
      const bridgeMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.rotation.z = Math.PI / 2;
      bridge.position.set(0, 0.1, radius * 0.96);

      glassGroup.add(leftLens);
      glassGroup.add(rightLens);
      glassGroup.add(bridge);
      this.accessoryGroup.add(glassGroup);
    } else if (countryId === 'japan') {
      // Hinomaru Hachimaki Headband
      const bandGeo = new THREE.TorusGeometry(radius * 0.88, 0.035, 12, 36);
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.25;

      const dotGeo = new THREE.CircleGeometry(0.08, 24);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xbc002d });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(0, 0.25, radius * 0.9);
      this.accessoryGroup.add(band);
      this.accessoryGroup.add(dot);
    }
  }

  public setSquash(squashY: number, squashXZ: number) {
    this.group.scale.set(squashXZ, squashY, squashXZ);
  }

  public dispose() {
    this.flagTexture.dispose();
    this.bodyMaterial.dispose();
    this.outlineMaterial.dispose();
    this.bodyMesh.geometry.dispose();
    this.outlineMesh.geometry.dispose();
    if (this.leftEyePart.material.map) this.leftEyePart.material.map.dispose();
    if (this.rightEyePart.material.map) this.rightEyePart.material.map.dispose();
    this.leftEyePart.material.dispose();
    this.rightEyePart.material.dispose();
    this.leftEyePart.mesh.geometry.dispose();
    this.rightEyePart.mesh.geometry.dispose();
  }
}
