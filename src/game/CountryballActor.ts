import * as THREE from 'three';
import { CountryId, ExpressionId, ToolType } from '../types/game';
import { COUNTRIES } from '../data/countries';
import { getCountryballThreeTexture } from '../utils/countryballTexture';

export class CountryballActor {
  public group: THREE.Group;
  public bodyMesh: THREE.Mesh;
  public shadowMesh: THREE.Mesh;
  public accessoryGroup: THREE.Group;
  public toolGroup: THREE.Group;
  public leftHand: THREE.Mesh;
  public rightHand: THREE.Mesh;

  public countryId: CountryId;
  public expressionId: ExpressionId;

  // Kinematic state
  public position: THREE.Vector3 = new THREE.Vector3();
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded = true;
  public yaw = 0;
  public isMoving = false;
  public isDashing = false;
  private animTimer = 0;

  constructor(countryId: CountryId, expressionId: ExpressionId) {
    this.countryId = countryId;
    this.expressionId = expressionId;
    this.group = new THREE.Group();

    // 1. Soft radial contact shadow (flush with ground)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.18)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(1.6, 1.6);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeom, shadowMat);
    this.shadowMesh.position.y = 0.02;
    this.group.add(this.shadowMesh);

    // 2. Primary Silhouette: Ball Body Sphere (PBR MeshStandardMaterial with texture)
    const bodyGeom = new THREE.SphereGeometry(0.65, 32, 24);
    bodyGeom.rotateY(-Math.PI / 2); // Orient front face towards +Z
    const bodyTexture = getCountryballThreeTexture(countryId, expressionId);
    const bodyMat = new THREE.MeshStandardMaterial({
      map: bodyTexture,
      roughness: 0.65,
      metalness: 0.05,
    });
    this.bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    this.bodyMesh.position.y = 0.65;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // 3. Hands (cute spherical hands holding tools)
    const handGeom = new THREE.SphereGeometry(0.12, 12, 12);
    const handMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
    });
    this.leftHand = new THREE.Mesh(handGeom, handMat);
    this.leftHand.position.set(-0.62, 0.45, 0.2);
    this.rightHand = new THREE.Mesh(handGeom, handMat);
    this.rightHand.position.set(0.62, 0.45, 0.2);
    this.group.add(this.leftHand);
    this.group.add(this.rightHand);

    // 4. National Accessory Group (composite hat / headwear)
    this.accessoryGroup = new THREE.Group();
    this.accessoryGroup.position.set(0, 1.25, 0);
    this.createAccessory(countryId);
    this.group.add(this.accessoryGroup);

    // 5. Tool Display Group (attached to right hand)
    this.toolGroup = new THREE.Group();
    this.rightHand.add(this.toolGroup);
    this.setEquippedTool('pickaxe');
  }

  /**
   * Updates the texture when changing country or expression
   */
  public updateAppearance(countryId: CountryId, expressionId: ExpressionId) {
    this.countryId = countryId;
    this.expressionId = expressionId;
    const tex = getCountryballThreeTexture(countryId, expressionId);
    (this.bodyMesh.material as THREE.MeshStandardMaterial).map = tex;
    (this.bodyMesh.material as THREE.MeshStandardMaterial).needsUpdate = true;

    // Refresh accessory
    while (this.accessoryGroup.children.length > 0) {
      this.accessoryGroup.remove(this.accessoryGroup.children[0]);
    }
    this.createAccessory(countryId);
  }

  /**
   * Builds composite 3-part cultural/geographical accessory
   */
  private createAccessory(countryId: CountryId) {
    switch (countryId) {
      case 'france': {
        // Beret hat
        const beretGeom = new THREE.CylinderGeometry(0.48, 0.52, 0.12, 16);
        const beretMat = new THREE.MeshStandardMaterial({ color: 0x1a237e, roughness: 0.85 });
        const beret = new THREE.Mesh(beretGeom, beretMat);
        beret.rotation.z = -0.2;
        this.accessoryGroup.add(beret);
        break;
      }
      case 'japan': {
        // White & Red Hachimaki Headband
        const bandGeom = new THREE.TorusGeometry(0.62, 0.05, 8, 24);
        bandGeom.rotateX(Math.PI / 2);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const band = new THREE.Mesh(bandGeom, bandMat);
        band.position.y = -0.4;
        this.accessoryGroup.add(band);
        // Sun knot
        const knotGeom = new THREE.SphereGeometry(0.08, 8, 8);
        const knotMat = new THREE.MeshStandardMaterial({ color: 0xbc002d });
        const knot = new THREE.Mesh(knotGeom, knotMat);
        knot.position.set(0, -0.4, 0.65);
        this.accessoryGroup.add(knot);
        break;
      }
      case 'england472x600': {
        // Aristocratic Top Hat
        const brimGeom = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 16);
        const crownGeom = new THREE.CylinderGeometry(0.35, 0.38, 0.45, 16);
        crownGeom.translate(0, 0.24, 0);
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.3 });
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xb71c1c });
        const ribbonGeom = new THREE.CylinderGeometry(0.385, 0.385, 0.08, 16);
        ribbonGeom.translate(0, 0.06, 0);

        this.accessoryGroup.add(new THREE.Mesh(brimGeom, hatMat));
        this.accessoryGroup.add(new THREE.Mesh(crownGeom, hatMat));
        this.accessoryGroup.add(new THREE.Mesh(ribbonGeom, ribbonMat));
        break;
      }
      case 'usa': {
        // Uncle Sam Hat
        const brimGeom = new THREE.CylinderGeometry(0.52, 0.52, 0.04, 16);
        const crownGeom = new THREE.CylinderGeometry(0.34, 0.36, 0.5, 16);
        crownGeom.translate(0, 0.26, 0);
        const hatMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x002868 });
        const ribbonGeom = new THREE.CylinderGeometry(0.365, 0.365, 0.1, 16);
        ribbonGeom.translate(0, 0.07, 0);

        this.accessoryGroup.add(new THREE.Mesh(brimGeom, hatMat));
        this.accessoryGroup.add(new THREE.Mesh(crownGeom, hatMat));
        this.accessoryGroup.add(new THREE.Mesh(ribbonGeom, ribbonMat));
        break;
      }
      case 'italy': {
        // Golden Olive Laurel Wreath
        const wreathGeom = new THREE.TorusGeometry(0.6, 0.04, 8, 20);
        wreathGeom.rotateX(Math.PI / 2);
        const wreathMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8, roughness: 0.2 });
        const wreath = new THREE.Mesh(wreathGeom, wreathMat);
        wreath.position.y = -0.3;
        this.accessoryGroup.add(wreath);
        break;
      }
      case 'germany': {
        // Alpine Tyrolean Hat with feather
        const baseGeom = new THREE.ConeGeometry(0.5, 0.3, 16);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
        const base = new THREE.Mesh(baseGeom, baseMat);
        this.accessoryGroup.add(base);

        const featherGeom = new THREE.BoxGeometry(0.04, 0.35, 0.02);
        featherGeom.translate(0.2, 0.2, 0);
        const featherMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f });
        this.accessoryGroup.add(new THREE.Mesh(featherGeom, featherMat));
        break;
      }
      case 'poland':
      default: {
        // Cute Little Crown
        const crownGeom = new THREE.CylinderGeometry(0.3, 0.24, 0.2, 5);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xffca28, metalness: 0.7, roughness: 0.25 });
        const crown = new THREE.Mesh(crownGeom, crownMat);
        this.accessoryGroup.add(crown);
        break;
      }
    }
  }

  /**
   * Sets equipped tool model in player's right hand
   */
  public setEquippedTool(tool: ToolType) {
    while (this.toolGroup.children.length > 0) {
      this.toolGroup.remove(this.toolGroup.children[0]);
    }

    if (tool === 'pickaxe') {
      // ⛏️ Procedural Pickaxe
      const handleGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6);
      handleGeom.translate(0, 0.2, 0);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
      const handle = new THREE.Mesh(handleGeom, handleMat);

      const pickHeadGeom = new THREE.ConeGeometry(0.08, 0.38, 4);
      pickHeadGeom.rotateZ(Math.PI / 2);
      pickHeadGeom.translate(0, 0.45, 0);
      const pickHeadMat = new THREE.MeshStandardMaterial({ color: 0xffd54f, metalness: 0.85, roughness: 0.2 });
      const head = new THREE.Mesh(pickHeadGeom, pickHeadMat);

      this.toolGroup.add(handle);
      this.toolGroup.add(head);
    } else if (tool === 'block') {
      // 🧱 Cute mini block
      const cubeGeom = new THREE.BoxGeometry(0.22, 0.22, 0.22);
      cubeGeom.translate(0, 0.15, 0);
      const cubeMat = new THREE.MeshStandardMaterial({ color: 0x81c784, roughness: 0.6 });
      this.toolGroup.add(new THREE.Mesh(cubeGeom, cubeMat));
    } else if (tool === 'terrain_add') {
      // 🏔️ Shovel / Trowel for traditional terrain addition
      const shovelHandle = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
      shovelHandle.translate(0, 0.2, 0);
      const shovelBlade = new THREE.BoxGeometry(0.12, 0.16, 0.02);
      shovelBlade.translate(0, 0.42, 0);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5, metalness: 0.8, roughness: 0.3 });
      this.toolGroup.add(new THREE.Mesh(shovelHandle, handleMat));
      this.toolGroup.add(new THREE.Mesh(shovelBlade, bladeMat));
    } else if (tool === 'water') {
      // 🌊 Watering can
      const canGeom = new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8);
      canGeom.translate(0, 0.1, 0);
      const canMat = new THREE.MeshStandardMaterial({ color: 0x29b6f6, metalness: 0.4, roughness: 0.2 });
      this.toolGroup.add(new THREE.Mesh(canGeom, canMat));
    } else if (tool === 'forest') {
      // 🌲 Seedling sapling
      const saplingGeom = new THREE.ConeGeometry(0.12, 0.3, 5);
      saplingGeom.translate(0, 0.15, 0);
      const saplingMat = new THREE.MeshStandardMaterial({ color: 0x43a047 });
      this.toolGroup.add(new THREE.Mesh(saplingGeom, saplingMat));
    } else if (tool === 'territory') {
      // 🚩 Miniature national flag
      const poleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6);
      poleGeom.translate(0, 0.2, 0);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.7 });
      const flagGeom = new THREE.PlaneGeometry(0.2, 0.14);
      flagGeom.translate(0.1, 0.38, 0);
      const flagMat = new THREE.MeshStandardMaterial({ color: 0xe53935, side: THREE.DoubleSide });
      this.toolGroup.add(new THREE.Mesh(poleGeom, poleMat));
      this.toolGroup.add(new THREE.Mesh(flagGeom, flagMat));
    } else if (tool === 'diplomacy') {
      // 🤝 Peace Olive Branch / Treaty Scroll
      const scrollGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.28, 8);
      scrollGeom.rotateX(Math.PI / 4);
      const scrollMat = new THREE.MeshStandardMaterial({ color: 0xfff9c4, roughness: 0.7 });
      this.toolGroup.add(new THREE.Mesh(scrollGeom, scrollMat));
    } else if (tool === 'scanner') {
      // 🔍 Magnifying Glass / Scanner
      const rimGeom = new THREE.TorusGeometry(0.1, 0.02, 8, 16);
      rimGeom.translate(0, 0.2, 0);
      const rimMat = new THREE.MeshStandardMaterial({ color: 0xffb300, metalness: 0.8, roughness: 0.2 });
      const handleGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6);
      handleGeom.translate(0, 0.05, 0);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
      this.toolGroup.add(new THREE.Mesh(rimGeom, rimMat));
      this.toolGroup.add(new THREE.Mesh(handleGeom, handleMat));
    }
  }

  /**
   * Action swing animation (when digging, placing, planting, claiming)
   */
  public triggerToolAction() {
    this.toolGroup.rotation.x = -Math.PI / 3;
    setTimeout(() => {
      this.toolGroup.rotation.x = 0;
    }, 180);
  }

  /**
   * Animation tick with squash/stretch bouncy physics
   */
  public update(dt: number, groundY: number) {
    this.animTimer += dt * (this.isDashing ? 12 : 8);

    // Apply gravity
    if (!this.isGrounded) {
      this.velocity.y -= 24 * dt;
      this.position.y += this.velocity.y * dt;

      if (this.position.y <= groundY) {
        this.position.y = groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      this.position.y = groundY;
    }

    // Walking / Running bounce animation
    let bounce = 0;
    let squashY = 1.0;
    let squashXZ = 1.0;

    if (this.isMoving && this.isGrounded) {
      bounce = Math.abs(Math.sin(this.animTimer)) * 0.18;
      squashY = 1.0 - Math.abs(Math.sin(this.animTimer)) * 0.08;
      squashXZ = 1.0 + Math.abs(Math.sin(this.animTimer)) * 0.05;

      // Cute hand swinging
      this.leftHand.position.z = Math.sin(this.animTimer) * 0.25;
      this.rightHand.position.z = -Math.sin(this.animTimer) * 0.25;
      this.leftHand.position.y = 0.45 + Math.cos(this.animTimer) * 0.08;
      this.rightHand.position.y = 0.45 - Math.cos(this.animTimer) * 0.08;
    } else {
      // Gentle idle breathing
      bounce = Math.sin(this.animTimer * 0.3) * 0.03;
      this.leftHand.position.set(-0.62, 0.45 + bounce * 0.5, 0.2);
      this.rightHand.position.set(0.62, 0.45 + bounce * 0.5, 0.2);
    }

    // Position root group
    this.group.position.x = this.position.x;
    this.group.position.y = this.position.y;
    this.group.position.z = this.position.z;
    this.group.rotation.y = this.yaw;

    // Apply squash & stretch to body
    this.bodyMesh.position.y = 0.65 + bounce;
    this.bodyMesh.scale.set(squashXZ, squashY, squashXZ);

    // Shadow stays grounded and scales with height
    const heightAboveGround = this.position.y - groundY;
    const shadowScale = Math.max(0.4, 1.0 - heightAboveGround * 0.15);
    this.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
    (this.shadowMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.1, 0.45 - heightAboveGround * 0.08);
  }

  public jump() {
    if (this.isGrounded) {
      this.velocity.y = 8.5;
      this.isGrounded = false;
    }
  }

  public dispose() {
    this.bodyMesh.geometry.dispose();
    this.shadowMesh.geometry.dispose();
  }
}
