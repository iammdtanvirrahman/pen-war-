import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  AiShotPlan,
  CameraTween,
  CameraView,
  DeckConfig,
  DragState,
  GameSettings,
  MatchState,
  PenModelType,
  Piece,
  PlayerCustomization,
  PowerUIState,
} from '../types/game';
import {
  AI_LEVELS,
  clamp,
  DEFAULT_PLAYER_1,
  DEFAULT_PLAYER_2,
  DEFAULT_PLAYERS,
  easeInOut,
  FIXED_STEP,
  lerp,
  MAX_PULL,
  MIN_PULL,
  PEN_MASS,
  PEN_MODELS,
  PEN_URL,
  pullToPower,
  ROLL_DAMP,
  speedOf,
  TABLE_DECEL,
  TABLE_URL,
  TARGET_PEN_LENGTH,
  UP,
  V_MAX,
  V_MIN,
  WOOD_URL,
  YAWS,
} from './constants';
import { sound } from '../audio/sound';

export interface PenEngineCallbacks {
  onStatusChange?: (status: string, ready: boolean) => void;
  onGameStateChange?: (state: MatchState, turn: number, aliveCounts: [number, number]) => void;
  onPowerChange?: (powerState: PowerUIState) => void;
  onToast?: (message: string, duration?: number) => void;
  onMatchFinish?: (winner: number, remainingPens: number) => void;
  onAutoRotateChange?: (autoRotate: boolean) => void;
}

export class PenGameEngine {
  private container: HTMLElement;
  private callbacks: PenEngineCallbacks;

  // Three.js
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private group: THREE.Group;
  private loader: GLTFLoader;

  // Aim visuals
  private marker: THREE.Group;
  private arrow: THREE.ArrowHelper;
  private bandLine: THREE.Line;
  private guideLine: THREE.Line;

  // Physics
  private physicsWorld: CANNON.World;
  private tableMat: CANNON.Material;
  private penMat: CANNON.Material;
  private floorMat: CANNON.Material;
  private deck: DeckConfig;
  private tableSurfaceAdded = false;
  private tableBody: CANNON.Body | null = null;
  private currentOrientationPortrait: boolean | null = null;

  // Assets
  private table: THREE.Object3D | null = null;
  private assetPenTemplate: { template: THREE.Group; length: number; radius: number } | null = null;
  public assetsReady = false;

  // Halo texture
  private haloTexture: THREE.CanvasTexture;
  private haloGeometry: THREE.PlaneGeometry;

  // Game state
  public active = false;
  public state: MatchState = 'idle';
  public turn = 0; // 0: Player 1, 1: Player 2 / AI
  private t = 0;
  private calm = 0;
  private follow: Piece | null = null;
  private ai: AiShotPlan | null = null;
  private aiTimer = 0;
  private hinted = false;
  private currentView: CameraView | null = null;
  private pieces: Piece[] = [];

  public settings: GameSettings = {
    mode: 'friend',
    format: 'single',
    level: 'medium',
    pens: 1,
    playerCount: 2,
    players: DEFAULT_PLAYERS.map((p) => ({ ...p })),
    player1: { ...DEFAULT_PLAYER_1 },
    player2: { ...DEFAULT_PLAYER_2 },
  };
  private cfg: GameSettings = {
    mode: 'friend',
    format: 'single',
    level: 'medium',
    pens: 1,
    playerCount: 2,
    players: DEFAULT_PLAYERS.map((p) => ({ ...p })),
    player1: { ...DEFAULT_PLAYER_1 },
    player2: { ...DEFAULT_PLAYER_2 },
  };

  // Interactions & camera
  private camTween: CameraTween | null = null;
  private userOrbit = false;
  private drag: DragState | null = null;
  private animationFrameId: number | null = null;
  private previousTime = performance.now() / 1000;
  private reduceMotion = false;
  private onPointerDownHandler = (e: PointerEvent) => this.handlePointerDown(e);
  private onPointerMoveHandler = (e: PointerEvent) => this.handlePointerMove(e);
  private onPointerUpHandler = (e: PointerEvent) => this.endDrag(e, false);
  private onPointerCancelHandler = (e: PointerEvent) => this.endDrag(e, true);

  // Scratch vectors for math
  private _q = new THREE.Quaternion();
  private _axA = new THREE.Vector3();
  private _axB = new THREE.Vector3();
  private _axH = new THREE.Vector3();
  private _cp = new THREE.Vector3();
  private _p0 = new THREE.Vector3();
  private _p1 = new THREE.Vector3();
  private _pv = new THREE.Vector3();
  private _pe = new THREE.Vector3();
  private _pa = new THREE.Vector3();
  private _cd = new THREE.Vector3();
  private _ct = new THREE.Vector3();
  private _cw = new THREE.Vector3();
  private sph = new THREE.Spherical();
  private _ray = new THREE.Raycaster();
  private _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private _ndc = new THREE.Vector2();
  private _axisV = new CANNON.Vec3();
  private _ex = new CANNON.Vec3(1, 0, 0);

  constructor(container: HTMLElement, callbacks: PenEngineCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#171719');
    this.scene.fog = new THREE.Fog('#171719', 12, 34);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.05, 100);
    this.camera.position.set(5.4, 5.0, 7.4);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: width > 700,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.touchAction = 'none';
    this.container.appendChild(this.renderer.domElement);

    // 3. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.8, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.6;
    this.controls.minDistance = 2.5;
    this.controls.maxDistance = 24;
    this.controls.minPolarAngle = 0.2;
    this.controls.maxPolarAngle = 1.38;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.6;
    this.controls.addEventListener('start', () => {
      this.camTween = null;
      this.userOrbit = true;
    });

    // 4. Lights
    this.scene.add(new THREE.HemisphereLight(0xe1e9ff, 0x493022, 2.0));
    const key = new THREE.DirectionalLight(0xffedda, 3.2);
    key.position.set(4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 6;
    key.shadow.camera.bottom = -6;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xa7c8ff, 1.25);
    fill.position.set(-5, 4, -3);
    this.scene.add(fill);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: '#252326', roughness: 0.92 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.18;
    floor.receiveShadow = true;
    this.scene.add(floor);

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.loader = new GLTFLoader();

    // 5. Physics World
    this.physicsWorld = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    this.physicsWorld.allowSleep = true;
    (this.physicsWorld.solver as CANNON.GSSolver).iterations = 14;

    this.tableMat = new CANNON.Material('table');
    this.penMat = new CANNON.Material('pen');
    this.floorMat = new CANNON.Material('floor');

    this.physicsWorld.addContactMaterial(
      new CANNON.ContactMaterial(this.tableMat, this.penMat, { friction: 0, restitution: 0.0 })
    );
    this.physicsWorld.addContactMaterial(
      new CANNON.ContactMaterial(this.penMat, this.penMat, { friction: 0.04, restitution: 0.35 })
    );
    this.physicsWorld.addContactMaterial(
      new CANNON.ContactMaterial(this.floorMat, this.penMat, { friction: 0.3, restitution: 0.05 })
    );

    this.deck = {
      cx: 0,
      cz: 0,
      halfX: 2.86,
      halfZ: 1.75,
      y: 1.116,
      halfL: 2.86,
      halfS: 1.75,
      L: new THREE.Vector3(1, 0, 0),
      S: new THREE.Vector3(0, 0, 1),
      baseYaw: 0,
    };

    // Pre-step friction hook: continuous smooth sliding deceleration
    this.physicsWorld.addEventListener('preStep', () => {
      const dt = this.physicsWorld.dt;
      for (const pc of this.pieces) {
        if (!pc.alive || pc.gone) continue;
        const b = pc.body;
        if (b.sleepState === CANNON.Body.SLEEPING) continue;

        // Check if on the tabletop deck
        const onDeck =
          Math.abs(b.position.x - this.deck.cx) <= this.deck.halfX + 0.05 &&
          Math.abs(b.position.z - this.deck.cz) <= this.deck.halfZ + 0.05 &&
          b.position.y >= this.deck.y - 0.2;

        if (onDeck) {
          // Smoothly clamp vertical bounce so the pen glides flush along the table
          if (b.position.y < this.deck.y + pc.colR + 0.04) {
            b.velocity.y *= 0.25;
            if (Math.abs(b.velocity.y) < 0.04) b.velocity.y = 0;
          }

          // Silky smooth sliding friction deceleration
          const sp = Math.hypot(b.velocity.x, b.velocity.z);
          if (sp > 1e-4) {
            const decelStep = TABLE_DECEL * dt;
            const k = Math.min(1, decelStep / sp);
            b.velocity.x *= (1 - k);
            b.velocity.z *= (1 - k);
          } else {
            b.velocity.x = 0;
            b.velocity.z = 0;
          }

          // Smooth rotational spin friction deceleration
          const w = b.angularVelocity.y;
          if (Math.abs(w) > 1e-4) {
            const yawStep = pc.yawDecel * dt;
            const kw = Math.min(1, yawStep / Math.abs(w));
            b.angularVelocity.y *= (1 - kw);
          } else {
            b.angularVelocity.y = 0;
          }

          // Damp rolling about the long axis so pen glides flat
          b.quaternion.vmult(this._ex, this._axisV);
          const wa = b.angularVelocity.dot(this._axisV);
          const rk = Math.min(1, ROLL_DAMP * dt);
          b.angularVelocity.x -= this._axisV.x * wa * rk;
          b.angularVelocity.y -= this._axisV.y * wa * rk;
          b.angularVelocity.z -= this._axisV.z * wa * rk;
        }
      }
    });

    // 6. Halo texture & Geometry
    this.haloTexture = this.makeHaloTexture();
    this.haloGeometry = new THREE.PlaneGeometry(1, 1);

    // 7. Aim visual helpers
    this.marker = new THREE.Group();
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xff7043, depthTest: false, toneMapped: false });
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffc08a,
      depthTest: false,
      toneMapped: false,
      transparent: true,
      opacity: 0.9,
    });
    const dotM = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), dotMat);
    dotM.renderOrder = 20;
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 6, 24), ringMat);
    ringM.rotation.x = Math.PI / 2;
    ringM.renderOrder = 20;
    this.marker.add(dotM, ringM);
    this.marker.visible = false;
    this.scene.add(this.marker);

    this.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 0.5, 0xffffff, 0.13, 0.075);
    this.arrow.visible = false;
    this.arrow.traverse((o: THREE.Object3D) => {
      const mesh = o as THREE.Mesh;
      if (mesh.material) {
        const mat = mesh.material as THREE.Material;
        mat.depthTest = false;
        mat.toneMapped = false;
        mesh.renderOrder = 21;
      }
    });
    this.scene.add(this.arrow);

    this.bandLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthTest: false })
    );
    this.bandLine.visible = false;
    this.bandLine.renderOrder = 19;
    this.bandLine.frustumCulled = false;
    this.scene.add(this.bandLine);

    this.guideLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]),
      new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.08,
        gapSize: 0.07,
        transparent: true,
        opacity: 0.6,
        depthTest: false,
      })
    );
    this.guideLine.visible = false;
    this.guideLine.renderOrder = 19;
    this.guideLine.frustumCulled = false;
    this.scene.add(this.guideLine);

    // 8. Event listeners
    this.bindEvents();

    // 9. Start assets loading & loop
    this.initAssets();
    this.animate();
  }

  private makeHaloTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    if (g) {
      g.clearRect(0, 0, 256, 256);
      const cx = 128, cy = 128;

      // Outer soft radial blue bloom
      const gr = g.createRadialGradient(cx, cy, 10, cx, cy, 126);
      gr.addColorStop(0, 'rgba(56, 189, 248, 0.55)');   // sky-400 vivid blue
      gr.addColorStop(0.35, 'rgba(14, 165, 233, 0.35)'); // sky-500
      gr.addColorStop(0.7, 'rgba(2, 132, 199, 0.12)');   // sky-600
      gr.addColorStop(0.95, 'rgba(3, 105, 161, 0.02)');
      gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 256, 256);

      // Crisp circular neon ring
      g.beginPath();
      g.arc(cx, cy, 84, 0, Math.PI * 2);
      g.lineWidth = 6;
      g.strokeStyle = 'rgba(224, 242, 254, 0.95)'; // bright cyan-white core
      g.stroke();

      // Second soft ring highlight
      g.beginPath();
      g.arc(cx, cy, 84, 0, Math.PI * 2);
      g.lineWidth = 14;
      g.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      g.stroke();

      // Subtle center dot
      g.beginPath();
      g.arc(cx, cy, 12, 0, Math.PI * 2);
      g.fillStyle = 'rgba(224, 242, 254, 0.8)';
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  public isPortraitMode(): boolean {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    return w < h;
  }

  private normalizeTable(obj: THREE.Object3D) {
    const isPortrait = this.isPortraitMode();
    obj.rotation.set(0, 0, 0);
    obj.scale.set(1, 1, 1);
    obj.position.set(0, 0, 0);
    obj.updateMatrixWorld(true);

    const b = new THREE.Box3().setFromObject(obj);
    const size = b.getSize(new THREE.Vector3());
    const scale = 5.8 / Math.max(size.x, size.z);

    const rawLongIsX = size.x >= size.z;
    const targetLongAlongZ = isPortrait;
    const needRotate = rawLongIsX ? targetLongAlongZ : !targetLongAlongZ;

    obj.rotation.y = needRotate ? Math.PI / 2 : 0;
    obj.scale.setScalar(scale);
    obj.updateMatrixWorld(true);

    const bRot = new THREE.Box3().setFromObject(obj);
    const centerRot = bRot.getCenter(new THREE.Vector3());
    obj.position.x = -centerRot.x;
    obj.position.z = -centerRot.z;
    obj.position.y = -bRot.min.y;
    obj.updateMatrixWorld(true);
  }

  private makeFallbackTable(): THREE.Group {
    const isPortrait = this.isPortraitMode();
    const g = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: '#8c5635', roughness: 0.78 });
    const xDim = isPortrait ? 3.5 : 5.6;
    const zDim = isPortrait ? 5.6 : 3.5;
    const top = new THREE.Mesh(new THREE.BoxGeometry(xDim, 0.22, zDim), wood);
    top.position.y = 1;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);
    const legsMat = new THREE.MeshStandardMaterial({ color: '#514039', roughness: 0.82 });
    const halfX = (xDim - 0.7) / 2;
    const halfZ = (zDim - 0.7) / 2;
    for (const x of [-halfX, halfX]) {
      for (const z of [-halfZ, halfZ]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1, 0.16), legsMat);
        leg.position.set(x, 0.48, z);
        leg.castShadow = true;
        g.add(leg);
      }
    }
    return g;
  }

  private measureDeck(obj: THREE.Object3D, topY: number) {
    obj.updateMatrixWorld(true);
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity,
      n = 0;
    const v = new THREE.Vector3();
    obj.traverse((o: THREE.Object3D) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
      const p = mesh.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
        if (v.y > topY - 0.05) {
          n++;
          if (v.x < minX) minX = v.x;
          if (v.x > maxX) maxX = v.x;
          if (v.z < minZ) minZ = v.z;
          if (v.z > maxZ) maxZ = v.z;
        }
      }
    });
    if (n < 8 || maxX - minX < 1 || maxZ - minZ < 1) return null;
    return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, halfX: (maxX - minX) / 2, halfZ: (maxZ - minZ) / 2 };
  }

  private setupPhysicsSurface(topY: number, rect: { cx: number; cz: number; halfX: number; halfZ: number }) {
    const hx = Math.max(0.5, rect.halfX - 0.012);
    const hz = Math.max(0.5, rect.halfZ - 0.012);
    this.deck.cx = rect.cx;
    this.deck.cz = rect.cz;
    this.deck.halfX = hx;
    this.deck.halfZ = hz;
    this.deck.y = topY + 0.006;

    // L is ALWAYS lateral across the player's screen (X axis)
    // S is ALWAYS front-to-back depth towards opponent (Z axis)
    this.deck.L = new THREE.Vector3(1, 0, 0);
    this.deck.S = new THREE.Vector3(0, 0, 1);
    this.deck.halfL = hx;
    this.deck.halfS = hz;
    this.deck.baseYaw = 0;

    const th = 0.16;
    if (this.tableBody) {
      this.physicsWorld.removeBody(this.tableBody);
    }
    this.tableBody = new CANNON.Body({
      mass: 0,
      material: this.tableMat,
      shape: new CANNON.Box(new CANNON.Vec3(hx, th / 2, hz)),
    });
    this.tableBody.position.set(rect.cx, this.deck.y - th / 2, rect.cz);
    this.physicsWorld.addBody(this.tableBody);

    const floorBody = new CANNON.Body({
      mass: 0,
      material: this.floorMat,
      shape: new CANNON.Plane(),
    });
    floorBody.position.set(0, -0.18, 0);
    floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.physicsWorld.addBody(floorBody);

    this.tableSurfaceAdded = true;
  }

  private prepareAssetPen(raw: THREE.Group) {
    raw.updateMatrixWorld(true);
    const b0 = new THREE.Box3().setFromObject(raw);
    const s0 = b0.getSize(new THREE.Vector3());
    const longAxis = s0.x >= s0.y && s0.x >= s0.z ? 'x' : s0.y >= s0.z ? 'y' : 'z';
    const pivot = new THREE.Group();
    pivot.add(raw);
    if (longAxis === 'y') pivot.rotation.z = -Math.PI / 2;
    else if (longAxis === 'z') pivot.rotation.y = Math.PI / 2;
    pivot.scale.setScalar(TARGET_PEN_LENGTH / (Math.max(s0.x, s0.y, s0.z) || 1));
    pivot.updateMatrixWorld(true);

    const xs: number[] = [],
      ys: number[] = [],
      zs: number[] = [];
    const v = new THREE.Vector3();
    pivot.traverse((o: THREE.Object3D) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry || !mesh.geometry.attributes.position) return;
      const pos = mesh.geometry.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 3000));
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        xs.push(v.x);
        ys.push(v.y);
        zs.push(v.z);
      }
    });

    if (xs.length < 8) throw new Error('Pen model has no geometry');
    let minX = Infinity,
      maxX = -Infinity;
    for (const x of xs) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    const sorted = (a: number[]) => Float64Array.from(a).sort();
    const sy = sorted(ys),
      sz = sorted(zs);
    const cx = (minX + maxX) / 2,
      my = sy[sy.length >> 1],
      mz = sz[sz.length >> 1];
    const rad = Float64Array.from(ys, (y, i) => Math.hypot(y - my, zs[i] - mz)).sort();
    const radius = clamp(rad[Math.min(rad.length - 1, Math.floor(rad.length * 0.6))], 0.016, 0.05);
    const length = maxX - minX;
    if (!(length > 0.2)) throw new Error('Pen model has an unexpected size');
    pivot.position.set(-cx, -my, -mz);

    const template = new THREE.Group();
    template.add(pivot);
    return { template, length, radius };
  }

  /**
   * Procedural composite models for custom pen styles
   */
  private createCustomPenMesh(type: PenModelType, playerCustom: PlayerCustomization): {
    mesh: THREE.Group;
    mats: THREE.Material[];
    length: number;
    radius: number;
    weight: number;
  } {
    const mats: THREE.Material[] = [];
    const color = playerCustom.color;
    const modelMeta = PEN_MODELS.find((m) => m.id === type) || PEN_MODELS[0];

    // 1. Official Faber-Castell Asset
    if (type === 'faber_castell' && this.assetPenTemplate) {
      const mesh = this.assetPenTemplate.template.clone(true);
      mesh.traverse((o: THREE.Object3D) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.castShadow = true;
        m.receiveShadow = true;
        const cloneMat = (mat: THREE.Material): THREE.Material => {
          const c = mat.clone() as THREE.MeshStandardMaterial;
          mats.push(c);
          // Realistic PBR setup - NO PEN BODY GLOW
          if ('roughness' in c) c.roughness = Math.max(0.32, c.roughness ?? 0.5);
          if ('metalness' in c) c.metalness = Math.min(0.65, c.metalness ?? 0.1);
          if ('emissive' in c) {
            c.emissive = new THREE.Color(0x000000); // Pen body glow OFF
            c.emissiveIntensity = 0;
          }
          return c;
        };
        m.material = Array.isArray(m.material) ? m.material.map(cloneMat) : cloneMat(m.material);
      });
      return {
        mesh,
        mats,
        length: this.assetPenTemplate.length,
        radius: this.assetPenTemplate.radius,
        weight: modelMeta.weight,
      };
    }

    // 2. Precision Fineliner (Technical drafting pen)
    if (type === 'fineliner') {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.35,
        metalness: 0.3,
      });
      const metalMat = new THREE.MeshStandardMaterial({
        color: '#d1d5db',
        roughness: 0.2,
        metalness: 0.85,
      });
      const knurlMat = new THREE.MeshStandardMaterial({
        color: '#475569',
        roughness: 0.5,
        metalness: 0.6,
      });
      mats.push(bodyMat, metalMat, knurlMat);

      // Main barrel
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.52, 24), bodyMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      g.add(barrel);

      // Knurled grip collar
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.14, 24), knurlMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.x = 0.18;
      grip.castShadow = true;
      g.add(grip);

      // Fine needle tip
      const needleTip = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.027, 0.08, 20), metalMat);
      needleTip.rotation.z = -Math.PI / 2;
      needleTip.position.x = 0.29;
      needleTip.castShadow = true;
      g.add(needleTip);

      // End cap
      const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.026, 0.06, 24), metalMat);
      endCap.rotation.z = Math.PI / 2;
      endCap.position.x = -0.29;
      endCap.castShadow = true;
      g.add(endCap);
      // Visible pocket clip on the capped rear end.
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.008, 0.012), metalMat);
      clip.position.set(-0.22, 0.031, 0);
      clip.rotation.z = -0.06;
      clip.castShadow = true;
      g.add(clip);

      return { mesh: g, mats, length: 0.70, radius: 0.028, weight: modelMeta.weight };
    }

    // 3. Tactical Heavy Pen (Hexagonal machining, high momentum)
    if (type === 'tactical') {
      const g = new THREE.Group();
      const darkMetalMat = new THREE.MeshStandardMaterial({
        color: color === '#ff4d5e' ? '#991b1b' : color === '#4cc9f0' ? '#0e7490' : color,
        roughness: 0.45,
        metalness: 0.75,
      });
      const brassMat = new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        roughness: 0.25,
        metalness: 0.85,
      });
      mats.push(darkMetalMat, brassMat);

      // Hexagonal machined body
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.52, 6), darkMetalMat);
      barrel.rotation.z = Math.PI / 2;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      g.add(barrel);

      // Fluted rings
      for (const offset of [-0.12, 0, 0.12]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.004, 8, 24), brassMat);
        ring.rotation.y = Math.PI / 2;
        ring.position.x = offset;
        g.add(ring);
      }

      // Tungsten attack tip
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.033, 0.11, 8), darkMetalMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.x = 0.31;
      tip.castShadow = true;
      g.add(tip);

      // Crown crown cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.08, 6), brassMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.x = -0.3;
      cap.castShadow = true;
      g.add(cap);
      // Pocket clip makes the rear cap read as a real capped pen.
      const clip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.009, 0.012), brassMat);
      clip.position.set(-0.22, 0.038, 0);
      clip.rotation.z = -0.06;
      clip.castShadow = true;
      g.add(clip);

      return { mesh: g, mats, length: 0.74, radius: 0.034, weight: modelMeta.weight };
    }

    // 4. Rollerball / Gel Pen (Ergonomic street style, high spin)
    const g = new THREE.Group();
    const barrelMat = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.2,
      metalness: 0.15,
    });
    const rubberMat = new THREE.MeshStandardMaterial({
      color: '#18181b',
      roughness: 0.7,
      metalness: 0.05,
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      roughness: 0.15,
      metalness: 0.9,
    });
    mats.push(barrelMat, rubberMat, chromeMat);

    // Contoured barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.031, 0.54, 24), barrelMat);
    barrel.rotation.z = Math.PI / 2;
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    g.add(barrel);

    // Rubber finger grip
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.16, 24), rubberMat);
    grip.rotation.z = Math.PI / 2;
    grip.position.x = 0.16;
    grip.castShadow = true;
    g.add(grip);

    // Chrome cone tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.09, 20), chromeMat);
    tip.rotation.z = -Math.PI / 2;
    tip.position.x = 0.31;
    tip.castShadow = true;
    g.add(tip);

    // Cap with clip
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.033, 0.14, 24), chromeMat);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = -0.3;
    cap.castShadow = true;
    g.add(cap);
    // Chrome pocket clip attached to the rear cap.
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.009, 0.012), chromeMat);
    clip.position.set(-0.22, 0.037, 0);
    clip.rotation.z = -0.06;
    clip.castShadow = true;
    g.add(clip);

    return { mesh: g, mats, length: 0.73, radius: 0.032, weight: modelMeta.weight };
  }

  private getPlayerConfig(player: number) {
    if (this.cfg.players && this.cfg.players[player]) {
      return this.cfg.players[player];
    }
    return player === 0 ? this.cfg.player1 : this.cfg.player2;
  }

  private createPiece(player: number, idx: number, count: number, spacing: number): Piece {
    const playerCustom = this.getPlayerConfig(player);
    const { mesh, mats, length, radius, weight } = this.createCustomPenMesh(playerCustom.model, playerCustom);

    const L = Math.max(0.4, length);
    const r = Math.max(radius, 0.022);
    const mass = weight || PEN_MASS;

    const body = new CANNON.Body({
      mass: mass,
      material: this.penMat,
      allowSleep: true,
      sleepSpeedLimit: 0.06,
      sleepTimeLimit: 0.5,
      linearDamping: 0.01,
      angularDamping: 0.05,
    });
    const half = L / 2 - r;
    const n = clamp(Math.ceil((2 * half) / (r * 1.5)) + 1, 3, 24);
    const step = (2 * half) / (n - 1);
    for (let i = 0; i < n; i++) body.addShape(new CANNON.Sphere(r), new CANNON.Vec3(-half + i * step, 0, 0));

    const Ix = 0.5 * mass * r * r * 8;
    const Iyz = (mass * (3 * r * r + L * L)) / 12 * 1.8;
    body.inertia.set(Ix, Iyz, Iyz);
    body.invInertia.set(1 / Ix, 1 / Iyz, 1 / Iyz);

    const isSingle = this.cfg.format === 'single';
    const numPlayers = isSingle ? (this.cfg.playerCount || 2) : 2;

    if (isSingle && numPlayers >= 3) {
      const angle = (2 * Math.PI * player) / numPlayers - Math.PI / 2;
      const rx = Math.cos(angle) * (this.deck.halfL * 0.72);
      const rz = Math.sin(angle) * (this.deck.halfS * 0.62);
      const pos = new THREE.Vector3(this.deck.cx, 0, this.deck.cz)
        .addScaledVector(this.deck.L, rx)
        .addScaledVector(this.deck.S, rz);
      body.position.set(pos.x, this.deck.y + r + 0.002, pos.z);
      const facingYaw = Math.atan2(-rz, -rx) + (YAWS[player % 4] || 0.1);
      body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), facingYaw);
    } else {
      // Place each team at opposite ends of the long axis, not across the short
      // axis. This creates a much longer opening distance and prevents an
      // immediate close-range knockout from the starting layout.
      const side = player === 0 ? 1 : -1;
      const acrossWidthSpacing = Math.min(
        0.72,
        (this.deck.halfS * 2 - 0.9) / Math.max(1, count - 1)
      );
      const acrossWidth = (idx - (count - 1) / 2) * acrossWidthSpacing;
      const endOffset = Math.max(0, this.deck.halfL - L * 0.5 - 0.48);
      const pos = new THREE.Vector3(this.deck.cx, 0, this.deck.cz)
        .addScaledVector(this.deck.L, side * endOffset)
        .addScaledVector(this.deck.S, acrossWidth);
      body.position.set(pos.x, this.deck.y + r + 0.002, pos.z);
      body.quaternion.setFromAxisAngle(
        new CANNON.Vec3(0, 1, 0),
        this.deck.baseYaw + YAWS[idx % 4] * side
      );
    }
    body.updateInertiaWorld(true);

    body.addEventListener('collide', (e: { contact: { getImpactVelocityAlongNormal: () => number } }) => {
      sound.onCollision(e.contact.getImpactVelocityAlongNormal());
    });

    this.physicsWorld.addBody(body);
    mesh.position.set(body.position.x, body.position.y, body.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
    this.group.add(mesh);

    // Dynamic player colored halo table-surface glow under active pens
    const haloColor = new THREE.Color(playerCustom.color || 0x38bdf8);
    const haloMat = new THREE.MeshBasicMaterial({
      color: haloColor,
      map: this.haloTexture,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    const halo = new THREE.Group();
    const hm = new THREE.Mesh(this.haloGeometry, haloMat);
    hm.rotation.x = -Math.PI / 2;
    hm.scale.set(0.92, 0.92, 1);
    hm.renderOrder = 4;
    halo.add(hm);
    this.scene.add(halo);

    return {
      mesh,
      body,
      player,
      idx,
      mats,
      halo,
      haloMat,
      length: L,
      radius: r,
      colR: r,
      yawDecel: TABLE_DECEL / (0.6 * L),
      alive: true,
      gone: false,
      removeAt: 0,
      haloA: 0.15,
    };
  }

  public spawnPieces() {
    if (this.cfg.format === 'single') {
      const numPlayers = this.cfg.playerCount || 2;
      for (let p = 0; p < numPlayers; p++) {
        this.pieces.push(this.createPiece(p, 0, 1, 1.0));
      }
    } else {
      const n = this.cfg.pens;
      const spacing = Math.min(1.25, (this.deck.halfL * 2 - 1.3) / Math.max(1, n));
      for (let p = 0; p < 2; p++) {
        for (let i = 0; i < n; i++) {
          this.pieces.push(this.createPiece(p, i, n, spacing));
        }
      }
    }
  }

  public clearPieces() {
    for (const pc of this.pieces) {
      if (pc.body.world) this.physicsWorld.removeBody(pc.body);
      this.group.remove(pc.mesh);
      for (const m of pc.mats) m.dispose();
      this.scene.remove(pc.halo);
      pc.haloMat.dispose();
    }
    this.pieces = [];
  }

  public updatePreviewPieces(settings: GameSettings) {
    this.settings = { ...settings };
    this.cfg = { ...settings };
    if (!this.active && this.assetsReady) {
      this.clearPieces();
      this.spawnPieces();
    }
  }

  public viewFor(p: number): CameraView {
    const isSingle = this.cfg.format === 'single';
    const numPlayers = isSingle ? (this.cfg.playerCount || 2) : 2;
    const aspect = (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight);
    const isPortrait = aspect < 1.0;
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const tanH = tanV * aspect;
    const pitch = THREE.MathUtils.degToRad(isPortrait ? 50 : 48);
    const dH = (this.deck.halfL * 1.15 + 0.2) / tanH;
    const dV = (this.deck.halfS * Math.sin(pitch) * 1.25 + 0.4) / tanV;
    const d = clamp(Math.max(dH, dV), 4.0, 22);

    if (isSingle && numPlayers >= 3) {
      const angle = (2 * Math.PI * p) / numPlayers - Math.PI / 2;
      const target = new THREE.Vector3(this.deck.cx, this.deck.y + 0.05, this.deck.cz);
      const camRadius = Math.max(3.8, d * 0.9);
      const pos = new THREE.Vector3(
        this.deck.cx + Math.cos(angle) * camRadius,
        this.deck.y + d * Math.sin(pitch),
        this.deck.cz + Math.sin(angle) * camRadius
      );
      return { pos, target };
    }

    const side = p === 0 ? 1 : -1;
    const target = new THREE.Vector3(this.deck.cx, this.deck.y + 0.05, this.deck.cz).addScaledVector(
      this.deck.S,
      side * this.deck.halfS * (isPortrait ? 0.14 : 0.08)
    );
    const pos = target.clone().addScaledVector(this.deck.S, side * d * Math.cos(pitch));
    pos.y += d * Math.sin(pitch);
    return { pos, target };
  }

  public isTopView = false;

  public topView(): CameraView {
    const aspect = (this.container.clientWidth || window.innerWidth) / (this.container.clientHeight || window.innerHeight);
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const tanH = tanV * aspect;
    const dH = (this.deck.halfL * 1.18 + 0.25) / tanH;
    const dV = (this.deck.halfS * 1.25 + 0.35) / tanV;
    const d = clamp(Math.max(dH, dV), 4.5, 22);
    const target = new THREE.Vector3(this.deck.cx, this.deck.y + 0.05, this.deck.cz);
    // Slight offset on Z to keep spherical coords calculation completely stable
    const pos = new THREE.Vector3(this.deck.cx, this.deck.y + d, this.deck.cz + 0.001);
    return { pos, target };
  }

  public toggleTopView(): boolean {
    this.userOrbit = false;
    this.controls.autoRotate = false;
    this.callbacks.onAutoRotateChange?.(false);
    this.isTopView = !this.isTopView;

    if (this.isTopView) {
      const tv = this.topView();
      this.currentView = tv;
      this.tweenCamera(tv, this.reduceMotion ? 0.2 : 0.7);
    } else {
      this.currentView = this.viewFor(this.active ? this.turn : 0);
      this.tweenCamera(this.currentView, this.reduceMotion ? 0.2 : 0.7);
    }
    return this.isTopView;
  }

  public tweenCamera(view: CameraView, dur: number) {
    if (dur <= 0) {
      this.camera.position.copy(view.pos);
      this.controls.target.copy(view.target);
      this.controls.update();
      this.camTween = null;
      return;
    }
    const fromT = this.controls.target.clone();
    const sFrom = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(fromT));
    const sTo = new THREE.Spherical().setFromVector3(view.pos.clone().sub(view.target));
    let dTheta = sTo.theta - sFrom.theta;
    while (dTheta > Math.PI) dTheta -= 2 * Math.PI;
    while (dTheta <= -Math.PI) dTheta += 2 * Math.PI;
    this.camTween = { t: 0, dur, fromT, toT: view.target.clone(), sFrom, sTo, dTheta };
  }

  private updateCamera(dt: number) {
    if (this.camTween) {
      this.camTween.t += dt;
      const k = easeInOut(Math.min(1, this.camTween.t / this.camTween.dur));
      this.controls.target.lerpVectors(this.camTween.fromT, this.camTween.toT, k);
      this.sph.radius = lerp(this.camTween.sFrom.radius, this.camTween.sTo.radius, k);
      this.sph.phi = lerp(this.camTween.sFrom.phi, this.camTween.sTo.phi, k);
      this.sph.theta = this.camTween.sFrom.theta + this.camTween.dTheta * k;
      this.camera.position.setFromSpherical(this.sph).add(this.controls.target);
      if (k >= 1) this.camTween = null;
    } else if (this.state === 'moving' && this.follow && this.follow.alive && !this.userOrbit && this.currentView) {
      const p = this.follow.body.position;
      // Keep the moving pen comfortably framed without letting the camera lag far behind.
      // A stronger target blend and slightly quicker exponential smoothing make side-to-side
      // movement feel responsive while remaining fluid on mobile.
      this._cw.set(lerp(this.currentView.target.x, p.x, 0.4), this.currentView.target.y, lerp(this.currentView.target.z, p.z, 0.4));
      this._ct.copy(this.controls.target);
      this.controls.target.lerp(this._cw, 1 - Math.exp(-dt * 2.5));
      this.camera.position.add(this._cd.subVectors(this.controls.target, this._ct));
    }
  }

  private penAxis(pc: Piece, out: THREE.Vector3): THREE.Vector3 {
    const q = pc.body.quaternion;
    this._q.set(q.x, q.y, q.z, q.w);
    return out.set(1, 0, 0).applyQuaternion(this._q);
  }

  private contactPoint(pc: Piece, s: number, out: THREE.Vector3): THREE.Vector3 {
    this.penAxis(pc, this._axA);
    const c = pc.body.position;
    return out.set(c.x + this._axA.x * s, c.y, c.z + this._axA.z * s);
  }

  private showAim(pc: Piece, s: number, dir: THREE.Vector3 | null, power: number, speed: number, offset: THREE.Vector3 | null) {
    this.contactPoint(pc, s, this._cp);
    this.marker.position.set(this._cp.x, this._cp.y + pc.colR + 0.012, this._cp.z);
    this.marker.visible = true;
    if (dir && power >= 0) {
      const col = new THREE.Color().setHSL(Math.max(0, (1 - power) * 0.33), 0.85, 0.55);
      this.arrow.visible = true;
      this.arrow.position.set(this._cp.x, this._cp.y + pc.colR * 0.7, this._cp.z);
      this.arrow.setDirection(dir);
      this.arrow.setLength(0.3 + power * 1.1, 0.13, 0.075);
      this.arrow.setColor(col);

      if (offset && offset.lengthSq() > 4e-4) {
        this._p0.set(this._cp.x, this._cp.y + pc.colR * 0.7, this._cp.z);
        this._p1.copy(this._p0).add(offset);
        this.bandLine.geometry.setFromPoints([this._p0, this._p1]);
        this.bandLine.visible = true;
      } else {
        this.bandLine.visible = false;
      }

      const reach = clamp((speed * speed) / (2 * TABLE_DECEL), 0.3, 7);
      this._p0.set(this._cp.x, this._cp.y + pc.colR * 0.7, this._cp.z);
      this._p1.copy(this._p0).addScaledVector(dir, reach);
      this.guideLine.geometry.setFromPoints([this._p0, this._p1]);
      this.guideLine.computeLineDistances();
      this.guideLine.visible = true;
    } else {
      this.arrow.visible = false;
      this.bandLine.visible = false;
      this.guideLine.visible = false;
    }
  }

  public hideAim() {
    this.marker.visible = false;
    this.arrow.visible = false;
    this.bandLine.visible = false;
    this.guideLine.visible = false;
    this.callbacks.onPowerChange?.({ visible: false, power: 0, spinComment: '' });
  }

  private setPowerUI(power: number, s: number, length: number, ready: boolean) {
    const off = Math.abs(s) / (length / 2);
    const comment = ready
      ? `${Math.round(power * 100)}% power · ${off < 0.2 ? 'centre hit, goes straight' : 'off-centre hit, adds spin'}`
      : 'Pull back from the pen to aim';
    this.callbacks.onPowerChange?.({ visible: true, power, spinComment: comment });
  }

  private toScreen(v: THREE.Vector3, rect: DOMRect, out: { x: number; y: number }) {
    this._pv.copy(v).project(this.camera);
    out.x = (this._pv.x * 0.5 + 0.5) * rect.width + rect.left;
    out.y = (-this._pv.y * 0.5 + 0.5) * rect.height + rect.top;
    return out;
  }

  private pickPen(cx: number, cy: number, touch: boolean) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const limit = touch ? 36 : 22;
    const A = { x: 0, y: 0 },
      B = { x: 0, y: 0 };
    let best: { pc: Piece; d: number; t: number } | null = null;

    for (const pc of this.pieces) {
      if (!pc.alive) continue;
      this.penAxis(pc, this._pa);
      const c = pc.body.position;
      const h = pc.length / 2;
      this.toScreen(this._pe.set(c.x - this._pa.x * h, c.y, c.z - this._pa.z * h), rect, A);
      this.toScreen(this._pe.set(c.x + this._pa.x * h, c.y, c.z + this._pa.z * h), rect, B);
      const abx = B.x - A.x,
        aby = B.y - A.y;
      const len2 = abx * abx + aby * aby || 1;
      const t = clamp(((cx - A.x) * abx + (cy - A.y) * aby) / len2, 0, 1);
      let d = Math.hypot(cx - (A.x + abx * t), cy - (A.y + aby * t));
      if (pc.player !== this.turn) d *= 1.25; // Prefer own pen
      if (!best || d < best.d) best = { pc, d, t: clamp(t, 0.04, 0.96) };
    }
    if (!best || best.d > limit) return null;
    return { pc: best.pc, s: (best.t - 0.5) * best.pc.length };
  }

  private rayToPlane(cx: number, cy: number, y: number): THREE.Vector3 | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this._ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this._ray.setFromCamera(this._ndc, this.camera);
    this._plane.constant = -y;
    const out = new THREE.Vector3();
    return this._ray.ray.intersectPlane(this._plane, out) ? out : null;
  }

  private strike(pc: Piece, s: number, dir: THREE.Vector3, speed: number, power: number) {
    sound.ensureAudio();
    const body = pc.body;
    body.wakeUp();
    this.penAxis(pc, this._axB);
    this._axB.y = 0;
    if (this._axB.lengthSq() > 1e-6) this._axB.normalize();

    const rel = new CANNON.Vec3(this._axB.x * s - dir.x * pc.radius, 0, this._axB.z * s - dir.z * pc.radius);
    const J = new CANNON.Vec3(dir.x * speed * PEN_MASS, 0, dir.z * speed * PEN_MASS);
    body.applyImpulse(J, rel);
    body.velocity.y = 0;

    sound.tick(0.3, 380, 0.08);
    this.state = 'moving';
    this.t = 0;
    this.calm = 0;
    this.follow = pc;
    this.hideAim();
    this.notifyGameState();
  }

  private handlePointerDown(e: PointerEvent) {
    if (!this.active || this.state !== 'aim' || this.isAi(this.turn) || this.drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const pick = this.pickPen(e.clientX, e.clientY, e.pointerType !== 'mouse');
    if (!pick) return; // Allow orbit controls

    e.stopPropagation();
    e.preventDefault();
    sound.ensureAudio();

    if (pick.pc.player !== this.turn) {
      const whose = this.possessive(pick.pc.player).replace(/^Your$/, 'yours');
      this.callbacks.onToast?.(`That pen belongs to ${whose}. Flick your own pen!`, 2500);
      return;
    }

    const F0 = this.rayToPlane(e.clientX, e.clientY, pick.pc.body.position.y);
    if (!F0) return;

    this.drag = {
      pc: pick.pc,
      s: pick.s,
      F0,
      pointerId: e.pointerId,
      dir: null,
      power: 0,
      speed: 0,
      offset: new THREE.Vector3(),
    };
    this.showAim(this.drag.pc, this.drag.s, null, 0, 0, null);
    this.setPowerUI(0, this.drag.s, this.drag.pc.length, false);
  }

  private handlePointerMove(e: PointerEvent) {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const F = this.rayToPlane(e.clientX, e.clientY, this.drag.pc.body.position.y);
    if (!F) return;
    const pull = this.drag.F0.clone().sub(F);
    pull.y = 0;
    const dist = pull.length();
    this.drag.offset.copy(F).sub(this.drag.F0);
    this.drag.offset.y = 0;

    if (dist < MIN_PULL) {
      this.drag.dir = null;
      this.drag.power = 0;
      this.showAim(this.drag.pc, this.drag.s, null, 0, 0, null);
      this.setPowerUI(0, this.drag.s, this.drag.pc.length, false);
    } else {
      this.drag.dir = pull.normalize();
      this.drag.power = pullToPower(dist);
      this.drag.speed = speedOf(this.drag.power);
      this.showAim(this.drag.pc, this.drag.s, this.drag.dir, this.drag.power, this.drag.speed, this.drag.offset);
      this.setPowerUI(this.drag.power, this.drag.s, this.drag.pc.length, true);
    }
  }

  private bindEvents() {
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDownHandler, true);
    window.addEventListener('pointermove', this.onPointerMoveHandler);
    window.addEventListener('pointerup', this.onPointerUpHandler);
    window.addEventListener('pointercancel', this.onPointerCancelHandler);
  }

  private endDrag(e: PointerEvent, cancel: boolean) {
    if (!this.drag || e.pointerId !== this.drag.pointerId) return;
    const d = this.drag;
    this.drag = null;
    if (!cancel && d.dir) {
      this.strike(d.pc, d.s, d.dir, d.speed, d.power);
    } else {
      this.hideAim();
      if (!cancel) this.callbacks.onToast?.('Pull back farther to hit', 1400);
    }
  }

  private edgeDistance(p: CANNON.Vec3, dir: THREE.Vector3): number {
    let t = Infinity;
    if (Math.abs(dir.x) > 1e-6) {
      const tx = ((dir.x > 0 ? this.deck.cx + this.deck.halfX : this.deck.cx - this.deck.halfX) - p.x) / dir.x;
      if (tx > 0) t = Math.min(t, tx);
    }
    if (Math.abs(dir.z) > 1e-6) {
      const tz = ((dir.z > 0 ? this.deck.cz + this.deck.halfZ : this.deck.cz - this.deck.halfZ) - p.z) / dir.z;
      if (tz > 0) t = Math.min(t, tz);
    }
    return Number.isFinite(t) ? t : 2;
  }

  private planAi(): AiShotPlan {
    const me = this.pieces.filter((p) => p.alive && p.player === this.turn);
    const foes = this.pieces.filter((p) => p.alive && p.player !== this.turn);
    const lv = AI_LEVELS[this.cfg.level] || AI_LEVELS.medium;
    const candidates: Array<{ pc: Piece; target: Piece; dir: THREE.Vector3; speed: number; score: number; hitOffset: number }> = [];

    // Evaluate several attack lanes instead of blindly shooting at the nearest pen.
    // Hard AI scores target-to-edge pressure, collision alignment, and self-risk.
    const angleSamples = this.cfg.level === 'hard'
      ? [-0.28, -0.18, -0.09, 0, 0.09, 0.18, 0.28]
      : this.cfg.level === 'medium' ? [-0.12, 0, 0.12] : [-0.18, 0, 0.18];

    for (const m of me) {
      for (const f of foes) {
        const dx = f.body.position.x - m.body.position.x;
        const dz = f.body.position.z - m.body.position.z;
        const dist = Math.hypot(dx, dz) || 0.001;
        const baseDir = new THREE.Vector3(dx / dist, 0, dz / dist);
        for (const angle of angleSamples) {
          const dir = baseDir.clone().applyAxisAngle(UP, angle).normalize();
          const tx = f.body.position.x - m.body.position.x;
          const tz = f.body.position.z - m.body.position.z;
          const along = tx * dir.x + tz * dir.z;
          if (along <= 0) continue;
          const miss = Math.abs(tx * dir.z - tz * dir.x);
          const hitTolerance = m.radius + f.radius + (this.cfg.level === 'hard' ? 0.12 : 0.2);
          if (miss > hitTolerance) continue;

          const targetEdge = this.edgeDistance(f.body.position, dir);
          const gap = Math.max(0.05, along - (m.radius + f.radius) * 1.4);
          const targetSpeed = Math.sqrt(Math.max(0.1, 2 * TABLE_DECEL * (targetEdge + 0.22))) / 0.68;
          const speed = clamp(Math.sqrt(targetSpeed * targetSpeed + 2 * TABLE_DECEL * gap), V_MIN, V_MAX);

          // Lower score is better: prioritize near-edge knockouts and clean, efficient hits.
          const ownEdge = this.edgeDistance(m.body.position, dir);
          const edgeThreat = Math.max(0, 1.5 - targetEdge);
          const collisionPenalty = miss / Math.max(0.01, hitTolerance);
          const selfRisk = ownEdge < 1.0 ? (1.0 - ownEdge) * 1.8 : 0;
          const powerPenalty = speed / V_MAX * 0.16;
          const score = targetEdge * 1.1 + collisionPenalty * 2.8 + selfRisk + powerPenalty - edgeThreat * 0.35;
          const axis = new THREE.Vector3();
          this.penAxis(m, axis);
          axis.y = 0;
          if (axis.lengthSq() > 1e-6) axis.normalize();
          // Pick either end or a side-biased contact point to add controlled spin.
          const alignment = axis.dot(dir);
          const hitOffset = Math.abs(alignment) > 0.35
            ? Math.sign(alignment) * m.length * (this.cfg.level === 'hard' ? 0.34 : 0.18)
            : (angle >= 0 ? 1 : -1) * m.length * (this.cfg.level === 'hard' ? 0.22 : 0.1);
          candidates.push({ pc: m, target: f, dir, speed, score, hitOffset });
        }
      }
    }

    if (!candidates.length) {
      // Fallback: aim at the closest opponent if all lanes are obstructed.
      let best: { pc: Piece; target: Piece; dir: THREE.Vector3; dist: number } | null = null;
      for (const m of me) for (const f of foes) {
        const dx = f.body.position.x - m.body.position.x;
        const dz = f.body.position.z - m.body.position.z;
        const dist = Math.hypot(dx, dz);
        if (!best || dist < best.dist) {
          best = { pc: m, target: f, dir: new THREE.Vector3(dx / (dist || 1), 0, dz / (dist || 1)), dist };
        }
      }
      if (!best) {
        return { pc: me[0], s: 0, dir: new THREE.Vector3(1, 0, 0), speed: V_MIN, power: 0, t: 0, dur: 0.8 };
      }
      const speed = clamp(Math.sqrt(2 * TABLE_DECEL * (best.dist + 0.8)), V_MIN, V_MAX);
      candidates.push({ pc: best.pc, target: best.target, dir: best.dir, speed, score: 999, hitOffset: 0 });
    }

    candidates.sort((a, b) => a.score - b.score);
    // Hard consistently takes the best calculated shot; lower levels sometimes choose a less optimal lane.
    const choiceIndex = this.cfg.level === 'hard'
      ? 0
      : Math.floor(Math.random() * Math.min(candidates.length, lv.pool));
    const choice = candidates[choiceIndex] || candidates[0];
    const noise = this.cfg.level === 'hard' ? 0.006 : lv.angle * 0.45;
    const dir = choice.dir.clone().applyAxisAngle(UP, (Math.random() * 2 - 1) * noise).normalize();
    const speed = clamp(choice.speed * (1 + (Math.random() * 2 - 1) * (this.cfg.level === 'hard' ? 0.025 : lv.power)), V_MIN, V_MAX);

    return {
      pc: choice.pc,
      s: clamp(choice.hitOffset, -choice.pc.length * 0.46, choice.pc.length * 0.46),
      dir,
      speed,
      power: (speed - V_MIN) / (V_MAX - V_MIN),
      t: 0,
      dur: this.cfg.level === 'hard' ? 1.15 : 0.95,
    };
  }

  private runAi(dt: number) {
    if (!this.ai) {
      this.aiTimer -= dt;
      if (this.aiTimer <= 0) {
        if (!this.pieces.some((p) => p.alive && p.player !== this.turn) || !this.pieces.some((p) => p.alive && p.player === this.turn))
          return;
        this.ai = this.planAi();
      }
      return;
    }
    const a = this.ai;
    a.t += dt;
    const k = easeInOut(Math.min(1, a.t / a.dur));
    const pull = MIN_PULL + (MAX_PULL - MIN_PULL) * a.power * k;
    this.showAim(a.pc, a.s, a.dir, a.power * k, speedOf(a.power * k), a.dir.clone().multiplyScalar(-pull));
    if (a.t >= a.dur) {
      this.ai = null;
      this.strike(a.pc, a.s, a.dir, a.speed, a.power);
    }
  }

  public counts(): [number, number] {
    return [
      this.pieces.filter((x) => x.alive && x.player === 0).length,
      this.pieces.filter((x) => x.alive && x.player === 1).length,
    ];
  }

  public notifyGameState() {
    this.callbacks.onGameStateChange?.(this.state, this.turn, this.counts());
  }

  public beginTurn(p: number, dur?: number) {
    this.turn = p;
    this.state = 'aim';
    this.t = 0;
    this.calm = 0;
    this.ai = null;
    this.follow = null;
    this.userOrbit = false;
    this.currentView = this.isTopView ? this.topView() : this.viewFor(p);
    this.tweenCamera(this.currentView, dur === undefined ? (this.reduceMotion ? 0.35 : 1.15) : dur);

    if (this.isAi(p)) {
      this.aiTimer = 1.2;
    } else if (!this.hinted) {
      this.hinted = true;
      this.callbacks.onToast?.('Touch pen · pull back · release', 1800);
    }
    this.notifyGameState();
  }

  private pieceOut(pc: Piece, now: number) {
    pc.alive = false;
    pc.removeAt = now + 1.6;
    if (this.follow === pc) this.follow = null;
    this.callbacks.onToast?.(`${this.possessive(pc.player)} pen fell off the table!`, 2000);
    sound.tick(0.35, 210, 0.2);
    this.notifyGameState();
  }

  private endTurn() {
    for (const pc of this.pieces) {
      if (!pc.alive) continue;
      pc.body.velocity.set(0, 0, 0);
      pc.body.angularVelocity.set(0, 0, 0);
      pc.body.sleep();
    }
    const isSingle = this.cfg.format === 'single';
    const numPlayers = isSingle ? (this.cfg.playerCount || 2) : 2;
    const alivePlayers = Array.from(new Set(this.pieces.filter((x) => x.alive).map((x) => x.player)));

    if (alivePlayers.length <= 1) {
      const winner = alivePlayers.length === 1 ? alivePlayers[0] : -1;
      const remaining = alivePlayers.length === 1 ? this.pieces.filter((x) => x.alive && x.player === winner).length : 0;
      this.finishMatch(winner, remaining);
      return;
    }

    let nextTurn = (this.turn + 1) % numPlayers;
    let guard = 0;
    while (!this.pieces.some((pc) => pc.alive && pc.player === nextTurn) && guard < numPlayers) {
      nextTurn = (nextTurn + 1) % numPlayers;
      guard++;
    }
    this.beginTurn(nextTurn);
  }

  private finishMatch(winner: number, remaining: number) {
    this.state = 'over';
    this.hideAim();
    this.notifyGameState();
    setTimeout(() => {
      this.callbacks.onMatchFinish?.(winner, remaining);
    }, 900);
  }

  public startMatch(newSettings?: GameSettings) {
    if (newSettings) {
      this.settings = { ...newSettings };
    }
    this.cfg = { ...this.settings };
    this.clearPieces();
    this.spawnPieces();
    this.active = true;
    this.hinted = false;
    this.drag = null;
    this.hideAim();
    this.controls.autoRotate = false;
    this.callbacks.onAutoRotateChange?.(false);
    this.beginTurn(0, this.reduceMotion ? 0.35 : 0.9);
  }

  public recenterView() {
    this.userOrbit = false;
    this.isTopView = false;
    this.controls.autoRotate = false;
    this.callbacks.onAutoRotateChange?.(false);
    this.currentView = this.viewFor(this.active ? this.turn : 0);
    this.tweenCamera(this.currentView, this.reduceMotion ? 0.2 : 0.7);
  }

  public setAutoRotate(autoRotate: boolean) {
    this.controls.autoRotate = autoRotate;
    this.callbacks.onAutoRotateChange?.(autoRotate);
  }

  public updateGame(dt: number, now: number) {
    for (const pc of this.pieces) {
      if (!pc.alive && !pc.gone && now > pc.removeAt) {
        pc.gone = true;
        if (pc.body.world) this.physicsWorld.removeBody(pc.body);
        pc.mesh.visible = false;
      }
    }

    if (!this.active || this.state === 'over' || this.state === 'idle') return;

    for (const pc of this.pieces) {
      if (!pc.alive) continue;
      const p = pc.body.position;
      if (
        Math.abs(p.x - this.deck.cx) > this.deck.halfX + 0.03 ||
        Math.abs(p.z - this.deck.cz) > this.deck.halfZ + 0.03 ||
        p.y < this.deck.y - 0.3
      ) {
        this.pieceOut(pc, now);
      }
    }

    if (this.state === 'aim' && this.isAi(this.turn)) {
      this.runAi(dt);
    }

    if (this.state === 'moving') {
      this.t += dt;
      let maxV = 0;
      for (const pc of this.pieces) {
        if (!pc.alive) continue;
        const v = pc.body.velocity.length() + pc.body.angularVelocity.length() * pc.radius;
        if (v > maxV) maxV = v;
      }
      this.calm = maxV < 0.06 ? this.calm + dt : 0;
      if ((this.calm > 0.55 && this.t > 0.4) || this.t > 12) {
        this.endTurn();
      }
    }
  }

  private syncMeshes() {
    for (const pc of this.pieces) {
      if (pc.gone) continue;
      const b = pc.body;
      const m = pc.mesh;
      m.position.set(b.position.x, b.position.y, b.position.z);
      m.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      const onTable = pc.alive && b.position.y < this.deck.y + pc.colR + 0.12;
      const isTurn = this.active && this.state === 'aim' && pc.player === this.turn;
      pc.halo.visible = onTable && (isTurn || (!this.active && pc.alive)) && pc.haloA > 0.01;
      if (onTable && pc.halo.visible) {
        this.penAxis(pc, this._axH);
        pc.halo.position.set(b.position.x, this.deck.y + 0.008, b.position.z);
        pc.halo.rotation.y = Math.atan2(-this._axH.z, this._axH.x);
      }
    }
  }

  /**
   * Turn indicator: ground glow aura under active player's pens.
   * Inactive player pens have 0 glow.
   * Pen body emissive glow remains OFF.
   */
  private updateGlow(now: number, dt: number) {
    const pulse = 0.5 + 0.5 * Math.sin(now * 5);
    const turnOn = this.active && this.state === 'aim';
    const k = Math.min(1, dt * 10);
    for (const pc of this.pieces) {
      let h = 0; // ZERO for inactive/non-turn pens!
      if (pc.alive && turnOn && pc.player === this.turn) {
        // Active turn: vibrant pulsing turn aura under the pen
        h = 0.65 + 0.25 * pulse;
        if ((this.drag && this.drag.pc === pc) || (this.ai && this.ai.pc === pc)) {
          h = 0.98; // Actively dragged or aimed pen is super bright!
        }
      } else if (!this.active && pc.alive) {
        h = 0.25;
      }
      pc.haloA += (h - pc.haloA) * k;
      pc.haloMat.opacity = pc.haloA;
      const cScale = (this.drag && this.drag.pc === pc) ? 1.06 : (0.92 + 0.06 * pulse);
      pc.halo.scale.set(cScale, cScale, 1);
    }
    if (this.marker.visible) this.marker.scale.setScalar(1 + 0.14 * Math.sin(now * 8));
  }

  public resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    this.renderer.setSize(w, h);

    const isPortrait = w < h;
    if (this.currentOrientationPortrait !== null && this.currentOrientationPortrait !== isPortrait && this.table) {
      this.currentOrientationPortrait = isPortrait;
      this.normalizeTable(this.table);
      const bb = new THREE.Box3().setFromObject(this.table);
      const topY = bb.max.y;
      const rect = this.measureDeck(this.table, topY) || {
        cx: (bb.min.x + bb.max.x) / 2,
        cz: (bb.min.z + bb.max.z) / 2,
        halfX: (bb.max.x - bb.min.x) / 2,
        halfZ: (bb.max.z - bb.min.z) / 2,
      };
      this.setupPhysicsSurface(topY, rect);
      if (!this.active) {
        this.clearPieces();
        this.spawnPieces();
      }
    }

    if (this.assetsReady && !this.userOrbit && !this.camTween) {
      this.currentView = this.isTopView ? this.topView() : this.viewFor(this.turn);
      this.camera.position.copy(this.currentView.pos);
      this.controls.target.copy(this.currentView.target);
    }
  }

  public async initAssets() {
    this.callbacks.onStatusChange?.('Loading 3D assets…', false);
    try {
      const [gltf, woodTexture] = await Promise.all([
        this.loader.loadAsync(TABLE_URL),
        new THREE.TextureLoader().loadAsync(WOOD_URL).catch((err) => {
          console.warn('Table diffuse texture failed to load:', err);
          return null;
        }),
      ]);

      this.table = gltf.scene;
      if (woodTexture) {
        woodTexture.colorSpace = THREE.SRGBColorSpace;
        woodTexture.flipY = false;
        woodTexture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        woodTexture.needsUpdate = true;
      }
      const applyTableMaterial = (material: THREE.Material) => {
        const m = material.clone() as THREE.MeshStandardMaterial;
        if (woodTexture) {
          m.map = woodTexture;
          m.color.set(0xffffff);
          m.roughness = 0.82;
          m.needsUpdate = true;
        }
        if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        return m;
      };
      this.table.traverse((o: THREE.Object3D) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          if (mesh.material) {
            mesh.material = Array.isArray(mesh.material)
              ? mesh.material.map(applyTableMaterial)
              : applyTableMaterial(mesh.material);
          }
        }
      });
      this.normalizeTable(this.table);
      this.scene.add(this.table);
    } catch (e: unknown) {
      console.warn('Using fallback table:', e);
      this.table = this.makeFallbackTable();
      this.scene.add(this.table);
    }

    const bb = new THREE.Box3().setFromObject(this.table);
    const topY = bb.max.y;
    const rect = this.measureDeck(this.table, topY) || {
      cx: (bb.min.x + bb.max.x) / 2,
      cz: (bb.min.z + bb.max.z) / 2,
      halfX: (bb.max.x - bb.min.x) / 2,
      halfZ: (bb.max.z - bb.min.z) / 2,
    };
    this.setupPhysicsSurface(topY, rect);

    try {
      const penGltf = await this.loader.loadAsync(PEN_URL);
      this.assetPenTemplate = this.prepareAssetPen(penGltf.scene);
    } catch (e: unknown) {
      console.warn('Asset pen failed to load:', e);
      this.assetPenTemplate = null;
    }

    const v = this.viewFor(0);
    this.camera.position.copy(v.pos);
    this.controls.target.copy(v.target);
    this.controls.update();

    this.cfg = { ...this.settings };
    this.spawnPieces();
    this.currentOrientationPortrait = this.isPortraitMode();
    this.assetsReady = true;
    this.callbacks.onStatusChange?.('Ready', true);
  }

  public isAi(p: number): boolean {
    if (this.cfg.players && this.cfg.players[p]) {
      return this.cfg.players[p].isAi;
    }
    return this.cfg.mode === 'ai' && p === 1;
  }

  public playerName(p: number): string {
    if (this.cfg.players && this.cfg.players[p]) {
      return this.cfg.players[p].name || `Player ${p + 1}`;
    }
    if (this.cfg.mode === 'ai') return p === 0 ? this.cfg.player1.name || 'You' : 'AI';
    return p === 0 ? this.cfg.player1.name || 'Player 1' : this.cfg.player2.name || 'Player 2';
  }

  public playerColor(p: number): string {
    if (this.cfg.players && this.cfg.players[p]) {
      return this.cfg.players[p].color;
    }
    return p === 0 ? this.cfg.player1.color : this.cfg.player2.color;
  }

  public possessive(p: number): string {
    return `${this.playerName(p)}'s`;
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now() / 1000;
    const dt = Math.min(0.05, Math.max(0, now - this.previousTime));
    this.previousTime = now;

    if (this.active) {
      if (dt > 0 && this.pieces.length) {
        this.physicsWorld.step(FIXED_STEP, dt, 20);
      }
      this.syncMeshes();
      this.updateGame(dt, now);
    }
    this.updateCamera(dt);
    this.updateGlow(now, dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public setCallbacks(callbacks: PenEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('pointermove', this.onPointerMoveHandler);
    window.removeEventListener('pointerup', this.onPointerUpHandler);
    window.removeEventListener('pointercancel', this.onPointerCancelHandler);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDownHandler, true);
    this.controls.dispose();
    this.clearPieces();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
