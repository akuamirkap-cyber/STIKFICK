import { Sfx } from './audio';
import type { SoundVersion } from './soundPacks';
import { BASE_ZOOM, LEVELS_PER_ZONE, PLAYER_BAND, PLAYER_COLOR, TILE, TOTAL_LEVELS, VIEW_H, VIEW_W, ZONES, type Palette } from './constants';
import { buildLevelCanvas, drawArenaAmbience, drawHUD, drawShadow, drawStick, drawVignette } from './draw';
import { gaitCadence } from './stick';
import { Shotgun, drawShotgun, drawShells, SG_MAG } from './shotgun';
import { GunStyle, drawPistol, PISTOL_VIS, RIFLE_VIS, type GunTrick, type GunTrickKind } from './guns';
import { BossExchange } from './bossExchange';
import { MirrorSystem } from './mirror';
import { BotPunch } from './botPunch';
import { MuayThai, TkdKick } from './muaythai';
import { MeleeChase } from './meleeChase';
import { PropsPlay, drawStaticProp } from './propsPlay';
import { drawSoftShadows, drawDepthLight } from './depthFx';
import { CarryThrow } from './carryThrow';
import { GuanDao } from './guandao';
import { makeWielder, wielderOnHit, drawWielder, wielderGrips, isWielder } from './enemyWield';
import { STORY, spawnStoryBoss } from './storyBoss';
import { AllyBot } from './allyBot';
import { Brutality } from './brutality';
import { EightGates } from './eightGates';
import { SmoothGL } from './smoothGL';
import { reactFx, reactOpts, reactActive, zoneFromMove, zoneFromHeight, randomZone, startReact, type Zone } from './hitReact';
import { TeamBattle, isTeamUnit } from './teamBattle';
import { smartOnHit, drawSmart, isSmart } from './smartBoss';
import { JACK_ENABLED, spawnJack, isJack, jackOnHit, jackLift, stepJackFx, drawJackAir, drawJackEntrance, drawJackGear, drawJackGround, resetJackFx } from './jack5';
import { CorpseGrab } from './corpseGrab';
import { setDepthMode } from './stick3d';
import { Buster, BUSTER_LEN, MAKO, MAKO2, drawBusterSword, drawBeam, drawLimitHud } from './buster';
import { Bow, BONES, drawBow, drawQuiver, type SkelPts, type Part } from './bow';
import { FireTrail } from './fireTrail';
import { Ragdoll } from './ragdoll';
import { BOX_ORDER, BOX_STANCES, Boxing, drawGlove, IPPO_BARE, type BoxStance } from './boxing';
import { MEADOW_PAL, buildMeadowCanopy, drawMeadowAir, drawMeadowLife, drawArenaDeco, drawCloudShadows, drawGrassWind, drawWaterLine, drawWaterSurface, generateMeadow, pondDepth } from './meadow';
import { MeadowLife } from './wildlife';
import { Clash, DUEL_LADDER, DuelBrain, type ClashKind, type DuelFoe } from './duel';
import { blendSkeleton, solvePose, setTallMode } from './stick';
import { Nunchaku } from './nunchaku';
import { SFNunchaku, SF_HEAVY, SF_CHARGED, SF_SKY, SF_AIRSPIN, SF_METEOR } from './sfnunchaku';
import { PistolStyle } from './pistol';
import { Katana } from './bladeArc';
import { Yoyo } from './yoyo';
import { YoyoV2 } from './yoyoV2';
import { YOYO_SKIN_KEY, YOYO_SKINS, isYoyoSkinId, type YoyoSkinId } from './yoyoSkins';
import { Takamura } from './takamura';
/** Katana, Hayabusa & Dual Sword dihapus dari pilihan senjata pemain. */
const REMOVED_WEAPONS: WeaponKind[] = ['katana', 'hayabusa', 'dual'];
/** Hayabusa sudah dihapus dari game: stub kosong supaya sisa kode tetap aman. */
class Hayabusa { moveMul = 1; bladeA = 0; ext = 0; hop = 0; lockAim: number | null = null; bodyPose: Pose | null = null; bodyT = 0; update(_g: unknown, _dt: number) {} reset() {} draw(..._a: unknown[]) {} }
import { Leviathan } from './leviathan';
import { GunFX } from './gunfx';
import { SILAT, LINK_FLIPS, type SilatScene, type SilatHit } from './silat';
import { Blood, type BloodMode } from './blood';
import { AXE_LEN, BAT_LEN, DUAL_LEN, drawAxe, drawAxeIcon, drawBat, drawDualIcon, drawShortBlade } from './weapons';
import { bossForLevel, makeEnemy, pickKind, updateEnemy } from './enemies';
import { Input, type AttackTap } from './input';
import { flowField, freeAt, generateArena, generateLevel, lineOfSight, moveWithCollision, solidAt, unstick, type Level } from './level';
import {
  OFFICE_THEMES, OT_AIR, OT_FLOOR, OT_GLASS, OT_WALL, buildOfficeCanvas, buildOfficeLevel,
  drawOfficeAmbience, getOfficeMapById, officeSolidAt, getSelectedOfficeMapId, moveSideView,
  officeFindNearbyStairX, officeFloorSupportY, officeOnElev, officeOnStairs, officeStairSpan,
  officeStairZigZagX, officeStairPath, stairPathProject, stairPathAt, officeTileAt, setSelectedOfficeMapId, shatterOfficeGlassTile,
  sideTableSupportY, sideTableSurfaceY,
} from './office';
import { V1OfficeLook, V1HitFx, V1Glow, loadV2HitFx, loadV2Glow, HITFX_KEY_V2, GLOW_KEY_V2 } from '../../../../shared/office/look';
import type { AtmoId } from '../../../../shared/office/atmo';
import { MOVES, type Move, IPPO_PLANS, IPPO_HEAVY, OFFICE_FIST_PLANS, OFFICE_HEAVY_CHAIN, DRUNKEN_PLANS, BAT_PLANS } from './moves';
import { FOOT_SCHOOLS, FOOT_VERSION_COLOR, Footwork, footBeatAt, footContact, footLeg, footMove, footProgress, footStanceColor, type FootCommand, type FootKey, type FootVersion } from './footwork';
import { SCYTHE_COLOR, SCYTHE_LIGHT, ScytheFlow, scytheContact, scytheMove, scytheProgress, type ScytheCommand } from './scythe';
import { isFootPose } from './footPoses';
import { isScythePose } from './scythePoses';

const SCY_LEN = 15;
import { drawScythe, drawScytheRibbon } from './scytheEffects';
import { drawFootImpact, drawFootPivot, drawFootRibbon } from './footEffects';
import { G1_BIOMES } from './constants';
import { MUTATIONS, rollMutations, type Mutation } from './mutations';
import { Particles, Texts } from './particles';
import { pcircle, pfont, pfontO, pline, prect, pring, px, textWidth, setSmoothText } from './pixel';
import { Rng, angleDiff, clamp, dist, lerp, rnd } from './rng';
import { OfficeDoors } from './doors';
import {
  defaultStats, type Afterimage, type Bullet, type BossKind, type Corpse, type Enemy, type EnemyKind, type Fatality, type FatalityKind,
  type GameState, type Hazard, type Pickup, type Player, type PlayerStats, type Pose, type Prop, type Vec, type WeaponKind,
} from './types';

export interface SaveData { level: number; mutations: string[]; score: number; }
export interface UIState {
  state: GameState; level: number; zoneName: string; zoneSub: string; score: number; age: number; deathCounter: number;
  deaths: number; kills: number; bestCombo: number; choices: Mutation[]; save: SaveData | null; best: { level: number; score: number };
  muted: boolean; mutations: string[]; ageGain: number; hp: number; maxHp: number; accent: string;
  mode: GameMode; filters: boolean; duelRound: number; duelName: string; duelTitle: string; duelHp: number; clashOn: boolean; wave: number; survivalTime: number; bestWave: number; bestSurvivalScore: number; blood: BloodMode;
  v2: boolean;
  long: boolean;
  tall: boolean;
  smooth: boolean;
  view2d: boolean;
  weapon: WeaponKind;
  footStance?: 'left' | 'right' | null;
  /** Versi Foot Mode aktif: 1 = V1 (Flow/Flamingo Rush), 2 = V2 (jurus Hwoarang). */
  footVer?: FootVersion;
  yoyoVer: 1 | 2;
  yoyoSkin: YoyoSkinId;
  nunStyle: 'v1' | 'v2' | 'v3';
  boxStance: BoxStance;
  arena: 'city' | 'meadow' | 'office';
  officeMapId: string;
  officeMapName: string;
  tempo: number;
  campaign: boolean;
  botOn: boolean;
  mirrorOn: boolean;
  showHits: boolean;
  hasNunchaku: boolean;
}
export type GameMode = 'story' | 'survival' | 'duel' | 'team';

/** ONE FOR ALL (X), ported from game1: costs 25 to start, burns 8/s (about 12.5s on a full meter),
 *  drops the WORLD to 30% speed while the player runs on real time at 4/3x — so the hero moves
 *  roughly 4.4x faster than everything around him and auto-locks the nearest enemy. */
const OFA_COST = 25, OFA_DRAIN = 8, OFA_WORLD = 0.3, OFA_PLAYER = 4 / 3, OFA_COL = '#57e6ff';

const SAVE_KEY = 'v2_kungfu_drifter_maxkungfu_save_v1';
const SURV_KEY = 'v2_kungfu_drifter_maxkungfu_survival_v1';
const BLOOD_KEY = 'v2_kungfu_drifter_maxkungfu_blood_v1';
const BEST_KEY = 'v2_kungfu_drifter_maxkungfu_best_v1';
const V2_KEY = 'v2_kungfu_drifter_maxkungfu_v2';
const LONG_KEY = 'v2_kungfu_drifter_maxkungfu_long';
const TALL_KEY = 'v2_kungfu_drifter_maxkungfu_tall';
const SMOOTH_KEY = 'v2_kungfu_drifter_maxkungfu_smooth';
const NUN_KEY = 'v2_kungfu_drifter_maxkungfu_nunstyle';
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

function makePlayer(): Player {
  return { faceT: 0,
    x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, r: 5, hp: 5, maxHp: 5, dead: false, flash: 0, facing: 1, aim: 0, walk: 0, moving: false,
    dashT: 0, dashCd: 0, dashDir: { x: 1, y: 0 }, iframes: 0, comboStr: '', comboTimer: 0, attackT: 0, attackPhase: 'none', moveKey: null,
    hitSet: [], buffered: null, parryT: 0, parryCd: 0, parryHit: false, focus: 100, weapon: 'fist', hasRifle: true, ammoP: 30, ammoR: 60,
    fireCd: 0, recoil: 0, lean: { x: 1, y: 0 }, stunT: 0, lastMoveName: '', focusDash: null, shootT: 0, attackElapsed: 0, sinceDash: 9, attackAim: 0,
    brakeT: 0, brakeCd: 0, prevSpd: 0, startT: 0, pivotT: 0, pivotDir: { x: 1, y: 0 }, hadInput: false, surgeT: 0, locoSurge: 0, gearRun: false, locoAnticip: 0, locoBrake: 0,
    z: 0, runT: 0, running: false, bloom: 0, muzzle: 0, muzzleMax: 0.06, muzzleX: 0, muzzleY: 0, muzzleA: 0, fatality: null, holdPose: 'idle', holdPoseT: 0, holdT: 0,
    dustT: 0, stepT: 0, travelHit: false,
    hitTimes: {}, prevLimb: null, hasNunchaku: false, hasKatana: false, hasAxe: false, hasDual: false, bladeA: 0, bladeB: 0, bladePrevA: 0, chain: 0, chainLast: -9, chainSide: 1, rage: 0, rageOn: false, rageT: 0, rageDash: null, rageKills: 0, ofa: 0, ofaActive: false, rhythm: [], style: 'none', styleStreak: 0, styleHeat: 0, flowStep: 0, sheatheT: 0, katanaPlan: 0, iaiVictims: [], strideHalf: 3, gaitRun: 0, bodyAim: 0, vz: 0, jumpT: 0, jumpCd: 0, landT: 0, airborne: false, squash: 1, prevPose: 'idle', prevPoseT: 0, blend: 0, blendPose: 'idle', lastDir: { x: 1, y: 0 }, tkdCd: 0, tkdT: 0, tkdDir: { x: 1, y: 0 },
  };
}

/** tempo serangan pemain (1 = asli, makin kecil makin lambat) */
export const TEMPOS = [1, 0.5, 0.35, 0.25];

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: HTMLCanvasElement;
  wctx: CanvasRenderingContext2D;
  /** V2: screen-space layers (HUD, letterbox, vignette, wipe) get their own 1:1 buffer so that neither the world
   *  nor the UI is ever resampled twice. V1 draws them straight onto the visible canvas, like the old build. */
  hud: HTMLCanvasElement;
  hctx: CanvasRenderingContext2D;
  /** Which build of the look & feel is running.
   *  V1 = exactly the old build (two-stage nearest upscale: scene -> fractional zoom blit -> CSS).
   *  V2 = crisp single-stage pixels + the game1-flavoured ragdoll (wall slam bounce, dizzy stars, kickable bodies).
   *  Toggle with V or the on-screen button; the choice is persisted. */
  v2 = true;
  /** enemy aggression 0..1. 0.5 = half as eager to swing / shoot. */
  mental = 0.5;
  /** LONG-LIMB mode (tombol L): badan/tangan/kaki 2.5x panjang normal — rig diskalakan seragam
   *  dari telapak kaki di solvePose, jadi reach serangan & posisi senjata otomatis ikut. Persisted. */
  longMode = false;
  tallMode = false;
  smoothMode = false;
  input: Input;
  sfx: Sfx;
  particles = new Particles();
  texts = new Texts();
  state: GameState = 'menu';
  level!: Level;
  levelCanvas!: HTMLCanvasElement;
  levelCtx!: CanvasRenderingContext2D;
  levelN = 1;
  pal: Palette = ZONES[0].pal;
  player: Player = makePlayer();
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  pickups: Pickup[] = [];
  props: Prop[] = [];
  corpses: Corpse[] = [];
  hazards: Hazard[] = [];
  afterimages: Afterimage[] = [];
  pendingBooms: { x: number; y: number; t: number; r: number; dmg: number; fromPlayer: boolean }[] = [];
  pools: { x: number; y: number; r: number; max: number; c: string }[] = [];
  fatTargetId = -1;
  flow: Int16Array = new Int16Array(0);
  flowT = 0;
  cam = { x: 0, y: 0 };
  camFaceX = 0;
  camKick = { x: 0, y: 0 };
  camFocus: Vec | null = null;
  zoom = BASE_ZOOM;
  zoomTarget = BASE_ZOOM;
  zoomKick = 0;
  cinematic = false;
  trauma = 0;
  shakeX = 0;
  shakeY = 0;
  /** FIST MODE: penghitung jejak ghost selama frame aktif pukulan/tendangan. */
  fistGhostT = 0;
  hitstop = 0;
  timeScale = 1;
  slowT = 0;
  slowFactor = 1;
  /** ONE FOR ALL: the enemy the player is auto-locked onto, plus the "press X" announcement latch */
  lockTarget: Enemy | null = null;
  ofaReadySaid = false;
  flashA = 0;
  flashC = '#ffffff';
  time = 0;
  rawDt = 0;
  levelTime = 0;
  bannerT = 0;
  spawnQueue: EnemyKind[] = [];
  spawnTimer = 0;
  maxAlive = 4;
  eliteChance = 0;
  exitOpen = false;
  portalT = 0;
  cleared = false;
  wipe: { t: number; dir: 1 | -1; cb: (() => void) | null } | null = null;
  stats: PlayerStats = defaultStats();
  mutations: string[] = [];
  score = 0;
  kills = 0;
  combo = 0;
  comboTimer = 0;
  comboMax = 2.2;
  comboPop = 0;
  bestCombo = 0;
  meleeHits = 0;
  age = 20;
  deathCounter = 1;
  deaths = 0;
  ageGain = 0;
  choices: Mutation[] = [];
  nextLevelN = 1;
  onUI: ((u: UIState) => void) | null = null;
  rng = new Rng(1);
  running = false;
  raf = 0;
  lastT = 0;
  vignette = { cv: null as HTMLCanvasElement | null };
  save: SaveData | null = null;
  best = { level: 0, score: 0 };
  deathT = 0;
  bossBeatenT = 0;
  hitMarkerT = 0;
  hitMarkerKill = false;
  fatalityTextT = 0;
  fatalityIdx = 0;
  finishCd = 0;
  casingSfxCd = 0;
  heldInput = false;
  lastPoseT = 0;
  menuT = 0;
  menuSwing = 1;
  rageReadySaid = false;
  get pendingFlowKeyStore() { return this._pfk; }
  _pfk: string | null = null;
  timeScaleBonus = 1;
  /** tempo serangan pemain: 1 = normal, <1 = lebih pelan & natural */
  tempo = 1;
  menuMove: string | null = null;
  menuMoveT = 0;
  // ---- survival (endless waves)
  mode: GameMode = 'story';
  wave = 0;
  waveT = 0;            // seconds into the current wave
  waveLen = 30;         // seconds per wave
  survivalTime = 0;
  waveBudget = 0;       // enemies still to pour in this wave
  trickle = 0;          // timer between spawns
  bestSurvival = { wave: 0, score: 0 };
  waveBannerT = 0;
  waveKills = 0;
  pendingChoice = false;
  bossWaveActive = false;
  ambushT = 20;
  nunchaku = new Nunchaku();
  nunStyle: 'v1' | 'v2' | 'v3' = 'v3';
  /** Arena outdoor (padang rumput), arena kota, atau gedung kantor side-view. */
  arena: 'city' | 'meadow' | 'office' = 'office';
  officeMapId: string = getSelectedOfficeMapId();
  /** TAMPILAN KANTOR V1 (desain, langit, suasana, hujan) & EFEK HIT V1 untuk mode kantor */
  officeLook = new V1OfficeLook();
  v1hit: V1HitFx | null = null;
  hitFxStyle: 'v1' | 'v2' = loadV2HitFx();
  /** GLOW V1: cahaya aditif saat menghajar + pendar mode N / X (mode kantor) */
  glowFx = new V1Glow();
  glowOn = loadV2Glow();
  private glowXf: { ox: number; oy: number; sw: number; sh: number } | null = null;
  private fxMuteN = 0;
  private muteCache = new WeakMap<object, object>();
  /** Tulisan kecil tiap hantaman. Default mati supaya layar bersih. */
  showHits = false;
  fireTrail = new FireTrail();
  box = new Boxing();
  canopyCanvas: HTMLCanvasElement | null = null;
  life = new MeadowLife();
  brain = new DuelBrain();
  clash: Clash | null = null;
  duelRound = 1;
  duelFoe: DuelFoe = DUEL_LADDER[0];
  duelBoss: Enemy | null = null;
  duelBannerT = 0;
  /** Zoom rapat menu: stickman terkunci di kanan layar sementara dunia tetap berjalan. */
  menuZoom = 3.5;
  /** Filter retro (vignette + garis pindai). Default MATI, bisa dinyalakan. */
  filters = false;
  menuExit: { t: number; dur: number; z0: number } | null = null;
  menuTarget: { x: number; y: number } | null = null;
  menuTargetT = 0;
  menuCombo = 0;
  duelWonT = 0;
  private wadeT = 0;
  private wasWading = 0;
  private canopyMask: HTMLCanvasElement | null = null;
  private nameCd = 0;
  private boxStepT = 0;
  /** key jurus yang boleh membunuh — hanya diisi saat klik kanan */
  private boxHeavyKey: string | null = null;
  /** kapan senjata terakhir diganti (untuk petunjuk sementara) */
  weaponEquipT = -99;
  sfNun = new SFNunchaku();
  sfNunAim = 0;
  // NUNCHAKU klik kanan TAP vs HOLD (ambang 0,2 detik): tap = Basic Heavy, tahan = Charged Heavy (patah tulang)
  nunHoldT = 0; nunCharging = false; nunCharge = 0; nunChargeSaid = false;
  nunPending: 'heavy' | 'charged' | null = null;
  /** rangkaian Kombo Udara nunchaku: 0 mati, 1 sky launch, 2 aerial spin, 3 meteor smash */
  nunAirSeq = 0;
  get sfNunOn() { return this.nunStyle !== 'v1' && this.player.weapon === 'nunchaku'; }
  get fireOn() { return this.nunStyle === 'v3' && this.player.weapon === 'nunchaku'; }
  get boxOn() { return this.player.weapon === 'boxing'; }
  get boxDef() { return this.box.def; }
  /** V2 (game1): idle flourish spin of the chain around the hand. */
  nunFlourish = 0;
  nunFlourishCd = 1;
  /** V2 anti-monoton: tiap flourish di-roll — kadang 2 putaran, kadang 3, arah random */
  nunFlourishTurns = 2;
  nunFlourishDir = 1;
  katana = new Katana();
  yoyo = new Yoyo();
  yoyoV2 = new YoyoV2();
  yoyoVer: 1 | 2 = 2;
  yoyoEchoT = 0;
  yoyoDustT = 0;
  yoyoFeet: { front: Vec; back: Vec } | null = null;
  tak = new Takamura();
  hay = new Hayabusa();
  lev = new Leviathan();
  gunfx = new GunFX();
  silat: { sc: SilatScene; id: number; i: number; t: number; dir: number; from: { f: number; s: number; z: number; r: number }; cur: { f: number; s: number; z: number; r: number }; px: number; py: number; hitDone: boolean; dur: number; id2: number | null; from2: { f: number; s: number; z: number; r: number }; cur2: { f: number; s: number; z: number; r: number } } | null = null;
  silatCd = 0; silatLast = ''; fistHits = 0; fistHitT = -9;
  silatLinkT = 0; silatChainN = 0; silatAcroT = 0; silatParryAlt = 0;
  batLastPower = '';
  batFlow = 0; batLastSpecial = ''; batSpam = 0; batSpamT = 0; batTauntT = 0;
  sg = new Shotgun(); sgDryT = 0; sgBuf = false;
  bossExchange = new BossExchange();
  mirrorSystem = new MirrorSystem();
  botPunch = new BotPunch();
  /** adegan Muay Thai clinch (pegang kepala + dengkul) & finisher back kick Taekwondo */
  muay = new MuayThai();
  tkd = new TkdKick();
  /** cooldown Step Maju (Skip Step) — lompatan kecil pengambil momentum antar-kombo fist */
  skipStepCd = 0;
  /** blend idle<->gerak (0..1, rampa ~0.13 dtk), windup putar badan, dan spring ikat kepala (secondary motion) */
  locoMixV = 0; turnV = 0; lastFacingV = 1;
  bandS = { x: 0, y: 0, vx: 0, vy: 0 };
  meleeChase = new MeleeChase();
  propsPlay = new PropsPlay();
  doors = new OfficeDoors();
  carry = new CarryThrow();
  jackT = 0;
  ally = new AllyBot();
  /** TAMPILAN 2D MULUS (tanpa pixel): penghalus WebGL + bayangan lembut. Bisa dikembalikan ke pixel kapan saja. */
  view2d = false;
  private sgl: SmoothGL | null = null;
  private glOff = false; private glFrames = 0; private pAvg = 16; private lastPresent = 0;
  brut = new Brutality();
  gates = new EightGates();
  revives: { c: any; t: number; kind: EnemyKind; color: string; color2: string }[] = [];
  team = new TeamBattle();
  private gaitPX = 0; private gaitPY = 0;
  // ---- MODE STORY: wave -> bos bersenjata -> senjata baru
  campaign = false;
  campFresh = true;
  campStage = 0;
  campPhase: 'wave' | 'boss' | 'reward' = 'wave';
  campBossId = -1;
  campRewardT = 0;
  campUnlocked = new Set<WeaponKind>(['fist']);
  gd = new GuanDao();
  grab = new CorpseGrab();
  guns = new GunStyle();
  /** PISTOL V2: tempo berirama, recoil ringan, atraksi, kombo putar & kombo udara (lihat pistol.ts) */
  pis = new PistolStyle();
  bu = new Buster(); buHeavyT = 0;
  bow = new Bow(); eSkel = new Map<number, SkelPts>();
  batJuggle = 0; batLastT = -9; batTwirl = 0; batTwirlCd = 1.5; batEquippedAt = -9;
  wallHits: { x: number; y: number; a: number; t: number }[] = [];
  blood = new Blood();
  nSpin = 0;
  enemyMuzzles: { x: number; y: number; a: number; t: number; c: string }[] = [];
  tokenTimer = 0;
  runHeavyToggle = 0;
  prevBlade: { base: Vec; tip: Vec } | null = null;
  /** Ruang (px dunia) yang dipakai tombol DOM di kanan atas, supaya HUD tidak tertutup. */
  hudInset = 0;
  /** Strip pengumuman di atas: SELALU satu tulisan saja, tidak pernah menumpuk / menutupi aksi. */
  announce: { text: string; c: string; t: number; max: number; scale: number }[] = [];
  say(text: string, c: string, scale = 2, life = 1.1) {
    if (this.mode === 'duel') return;   // duel bersih: tanpa tulisan mengganggu
    const cur = this.announce[0];
    // Pengumuman penting (skala besar) tidak langsung ditimpa popup kecil yang baru lewat.
    if (cur && cur.text !== text && scale < cur.scale && cur.t < cur.max * 0.55) return;
    this.announce = [{ text, c, t: 0, max: life, scale }];
  }
  fatalityCd = 0;
  static FATALITY_CD = 7;

  constructor(canvas: HTMLCanvasElement, soundVersion: SoundVersion = 'v2') {
    this.sfx = new Sfx(soundVersion);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.scene = document.createElement('canvas');
    this.scene.width = VIEW_W;
    this.scene.height = VIEW_H;
    this.wctx = this.scene.getContext('2d')!;
    this.hud = document.createElement('canvas');
    this.hud.width = VIEW_W;
    this.hud.height = VIEW_H;
    this.hctx = this.hud.getContext('2d')!;
    this.input = new Input(canvas);
    try {
      // Rollback satu kali: buang checkpoint yang dibuat selama sesi CITY BLOCK / boss clash.
      if (!localStorage.getItem('v2_kf_rollback_cityboss_v1')) {
        localStorage.removeItem(SAVE_KEY);
        localStorage.setItem('v2_kf_rollback_cityboss_v1', '1');
        this.save = null;
      } else this.save = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      this.best = JSON.parse(localStorage.getItem(BEST_KEY) || 'null') || { level: 0, score: 0 };
      this.bestSurvival = JSON.parse(localStorage.getItem(SURV_KEY) || 'null') || { wave: 0, score: 0 };
      const vv = localStorage.getItem(V2_KEY);
      if (vv === '0' || vv === '1') this.v2 = vv === '1';
      const lv = localStorage.getItem(LONG_KEY);
      if (lv === '0' || lv === '1') this.longMode = lv === '1';
      const tv = localStorage.getItem(TALL_KEY);
      if (tv === '0' || tv === '1') this.tallMode = tv === '1';
      this.view2d = localStorage.getItem('v2_kf_view2d') === '1';
      { this.footVer = 3; }
      this.footwork.version = this.footVer;
      this.applySmoothClass();
      const sm = localStorage.getItem(SMOOTH_KEY);
      if (sm === '0' || sm === '1') this.smoothMode = sm === '1';
      setTallMode(this.tallMode);
      setSmoothText(this.smoothMode);
      setDepthMode(this.smoothMode);
      this.applySmoothClass();
      const nun = localStorage.getItem(NUN_KEY);
      if (nun === 'v1' || nun === 'v2' || nun === 'v3') this.nunStyle = nun;
      const tp = parseFloat(localStorage.getItem('v2_kf_tempo2') ?? '');
      if (TEMPOS.includes(tp)) this.tempo = tp;
      const ar = localStorage.getItem('v2_kf_arena2');
      if (ar === 'city' || ar === 'meadow' || ar === 'office') this.arena = ar;
      else if (ar === 'block') { try { localStorage.removeItem('v2_kf_arena'); } catch { /* ignore */ } }
      this.officeMapId = getSelectedOfficeMapId();
      this.showHits = localStorage.getItem('v2_kf_hits') === '1';
      this.filters = localStorage.getItem('v2_kf_fx') === '1';
      const bs = localStorage.getItem('v2_kf_box');
      if (bs === 'ali' || bs === 'tyson' || bs === 'ippo') this.box.stance = bs;
      this.texts.showHits = this.showHits;
      const bm = localStorage.getItem(BLOOD_KEY);
      if (bm === 'normal' || bm === 'gore' || bm === 'combined') this.blood.mode = bm;
      const skin = localStorage.getItem(YOYO_SKIN_KEY);
      if (isYoyoSkinId(skin)) this.yoyoV2.setSkin(skin);
    } catch { /* ignore */ }
    this.particles.onLand = (x, y, c, s) => this.stamp(x, y, c, s);
    this.particles.bloodEnabled = () => this.blood.classic;
    this.particles.onCasing = () => { if (this.casingSfxCd <= 0) { this.sfx.casing(); this.casingSfxCd = 0.05; } };
    this.particles.onGlass = () => { if (this.casingSfxCd <= 0) { this.sfx.glassTink(); this.casingSfxCd = 0.04; } };
    this.loadLevel(1);
    this.toMenu();
  }

  // ------------------------------------------------------------------ lifecycle
  start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const loop = (ts: number) => {
      if (!this.running) return;
      const raw = Math.max(0, Math.min(0.05, (ts - this.lastT) / 1000));
      this.lastT = ts;
      this.frame(raw);
      this.render();
      this.endFrameInput();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    this.pushUI();
  }
  destroy() {
    this.officeLook.stop();
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.destroy();
    this.sfx.dispose();
  }
  /** Taps that land on a hit-stop frame are kept buffered until the next simulated frame (no dropped inputs). */
  endFrameInput() {
    if (this.heldInput) { this.heldInput = false; return; }
    this.input.endFrame();
  }

  pushUI() {
    const z = ZONES[this.level.zone];
    this.onUI?.({
      state: this.state, level: this.levelN, zoneName: z.name, zoneSub: z.sub, score: this.score, age: this.age, deathCounter: this.deathCounter,
      deaths: this.deaths, kills: this.kills, bestCombo: this.bestCombo, choices: this.choices, save: this.save, best: this.best,
      muted: this.sfx.muted, mutations: [...this.mutations], ageGain: this.ageGain, hp: this.player.hp, maxHp: this.maxHp(), accent: this.pal.accent,
      mode: this.mode, filters: this.filters, duelRound: this.duelRound, duelName: this.duelFoe.name, duelTitle: this.duelFoe.title, duelHp: this.duelBoss && !this.duelBoss.dead ? this.duelBoss.hp / this.duelBoss.maxHp : 0, clashOn: !!this.clash, wave: this.wave, survivalTime: this.survivalTime, bestWave: this.bestSurvival.wave, bestSurvivalScore: this.bestSurvival.score, blood: this.blood.mode, v2: this.v2, long: this.longMode, tall: this.tallMode, smooth: this.smoothMode,
      weapon: this.player.weapon, footVer: this.footVer, footStance: this.player.weapon === 'foot' && this.footwork.inFlamingo ? this.footwork.lead === 1 ? 'left' : 'right' : null, yoyoVer: this.yoyoVer, yoyoSkin: this.yoyoV2.skinId,
      nunStyle: this.nunStyle, boxStance: this.box.stance, arena: this.arena, officeMapId: this.officeMapId, officeMapName: this.level.officeMap?.name ?? getOfficeMapById(this.officeMapId).name, tempo: this.tempo, campaign: this.campaign, view2d: this.view2d, botOn: this.mirrorSystem.botOn, mirrorOn: this.mirrorSystem.mirrorOn, showHits: this.showHits, hasNunchaku: this.player.hasNunchaku,
    });
  }

  moveDirOf(vx: number, vy: number): Vec | undefined {
    const l = Math.hypot(vx, vy);
    return l > 3 ? { x: vx / l, y: vy / l } : undefined;
  }
  maxHp() {
    return clamp(5 + this.stats.hpBonus - Math.floor((this.age - 20) / 12), 2, 12);
  }
  ageDmg() {
    return 1 + (this.age - 20) * 0.012;
  }
  comboMult() {
    return 1 + Math.floor(this.combo / 5) * 0.5;
  }

  clearCombatScene() {
    this.brut?.reset(); this.gates?.reset(); this.revives = [];
    this.footwork.reset();
    this.team?.reset();
    const active = this.silat;
    if (active) {
      for (const e of this.enemies) {
        if (e.id !== active.id && e.id !== active.id2) continue;
        e.scenePose = undefined; e.sceneZ = 0; e.sceneRot = 0;
        if (!e.dead && e.stagger > 1) { e.stagger = 0; e.state = 'chase'; e.pose = 'idle'; e.attackCd = Math.max(e.attackCd, 0.5); }
      }
      this.player.holdT = 0; this.player.z = 0;
      this.cinematic = false; this.zoomTarget = BASE_ZOOM; this.camFocus = null;
    }
    this.silat = null; this.silatPending = null; this.silatCd = 0; this.silatLinkT = 0; this.silatChainN = 0;
    this.fistHits = 0; this.fistHitT = -9; this.batFlow = 0; this.batSpam = 0; this.batJuggle = 0; this.batTauntT = 0;
  }

  // ------------------------------------------------------------------ game flow
  newGame(fromSave: SaveData | null, automatic = false) {
    this.clearCombatScene();
    this.mode = 'story';
    if (!automatic) { this.sfx.init(); this.input.focus(); }
    this.stats = defaultStats();
    this.mutations = [];
    this.score = 0; this.kills = 0; this.combo = 0; this.bestCombo = 0; this.deaths = 0; this.meleeHits = 0;
    this.age = 20; this.deathCounter = 1;
    this.player = makePlayer();
    let start = 1;
    if (fromSave) {
      start = fromSave.level;
      this.score = fromSave.score;
      for (const id of fromSave.mutations) {
        const m = MUTATIONS.find((mm) => mm.id === id);
        if (m) { m.apply(this.stats); this.mutations.push(id); }
      }
      if (start >= 5) { this.player.hasRifle = true; this.player.ammoR = 60; }
      if (start >= 3) this.player.hasNunchaku = true;
      if (start >= 7) this.player.hasKatana = true;
      if (start >= 9) this.player.hasAxe = true;
      if (start >= 11) this.player.hasDual = true;
      this.player.hp = this.maxHp();
    }
    this.state = 'playing';
    this.startLevel(start);
    this.wipe = { t: 1, dir: 1, cb: null };
    this.sfx.startMusic(this.level.zone);
  }

  // ================================================================== SURVIVAL (endless waves)
  get duelHpNow() { const b = this.duelBoss; return b && !b.dead ? Math.max(0, b.hp / b.maxHp) : 0; }
  get duelTotal() { return DUEL_LADDER.length; }

  /** START dari menu: langsung mode WAVE di arena kota (Jack-5 turun di wave 1). */
  startSurvivalFromMenu() {
    if (this.state !== 'menu') return;
    this.sfx.init(); this.input.focus();
    this.menuExit = null;
    this.campaign = false;
    this.newSurvival();
  }
  /** MODE TIM 20 vs 20: kamu + 19 sekutu melawan 20 musuh */
  newTeam() {
    this.campaign = false;
    this.newSurvival();
    this.mode = 'team';
    this.jackT = 0; this.waveBudget = 0;
    this.enemies = []; this.bullets = []; this.pickups = [];
    this.team.setup(this);
    this.pushUI();
  }
  startTeamMode() { this.newTeam(); }
  startTeamFromMenu() {
    if (this.state !== 'menu') return;
    this.sfx.init(); this.input.focus();
    this.menuExit = null;
    this.newTeam();
  }
  startCampaignFromMenu() {
    if (this.state !== 'menu') return;
    this.sfx.init(); this.input.focus();
    this.menuExit = null;
    this.campaign = true; this.campFresh = true;
    this.newSurvival();
  }
  /** tombol MODE di bilah bawah */
  startWaveMode() { this.campaign = false; this.newSurvival(); }
  training = false;
  onFootPractice: ((move: FootKey | null, hits: number, beat: number) => void) | null = null;
  footwork = new Footwork();
  /** Mesin rantai sabit Grim Reaper. */
  scythe = new ScytheFlow();
  private scytheGhostAt = 0;
  /** Foot Mode V1 / V2. Diganti dengan scroll mouse saat Foot Mode aktif (tersimpan di perangkat). */
  footVer: FootVersion = 3;
  private footVerAt = -Infinity;
  private footGhostAt = 0;
  private footMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private scytheMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private footStanceVisible = false;
  private practiceFootLandAt = -Infinity;

  startTraining() {
    this.startOfficeMode();
    this.training = true; this.waveBudget = 0; this.jackT = 0;
    this.announce = []; this.props = []; this.hazards = [];
    this.resetTrainingPartner();
    this.cinematic = true; this.zoomTarget = 3.2; this.zoom = 3.2;
    this.pushUI();
  }

  resetTrainingPartner() {
    const p = this.player;
    p.x = this.level.spawn.x; p.y = this.level.spawn.y; p.z = 0;
    p.facing = 1; p.aim = p.bodyAim = 0; p.hp = this.maxHp(); p.stunT = 0;
    p.vx = p.vy = p.kx = p.ky = p.vz = 0;
    p.svVy = 0; p.svGrounded = true; p.airborne = false;
    p.attackPhase = 'none'; p.moveKey = null; p.buffered = null; p.comboStr = '';
    p.dashT = p.stunT = p.landT = p.holdT = p.parryT = p.jumpCd = 0;
    p.jumpAntT = p.svJumpBufT = p.svCoyoteT = p.svDropT = 0;
    p.runT = p.gaitRun = p.startT = p.pivotT = p.brakeT = 0;
    p.running = p.moving = p.gearRun = p.hadInput = false;
    p.squash = 1; p.sinceDash = 1;
    p.svJumpAntT = 0; p.svJumpAntCfg = null; p.airMagnet = null; p.airLockId = -1;
    this.footwork.reset(); this.scythe.reset(); this.hitstop = 0; this.afterimages = [];
    this.practiceFootLandAt = -Infinity;
    this.input.attackTaps = [];
    this.combo = this.comboTimer = 0;
    const e = makeEnemy('fighter', undefined, p.x + 17, p.y, 1, false);
    e.spawnT = 0; e.hp = e.maxHp = 999; e.facing = -1; e.aim = Math.PI;
    e.weapon = 'none'; e.canParry = false; e.color = '#86a9bb'; e.color2 = '#415260';
    this.enemies = [e]; this.muay.reset();
    this.cam.x = p.x + 8 - VIEW_W / 2; this.cam.y = p.y - 15 - VIEW_H / 2;
    this.input.mouse.x = VIEW_W * 0.6; this.input.mouse.y = VIEW_H * 0.5;
  }
  startStoryMode() { this.campaign = true; this.campFresh = true; this.newSurvival(); }
  /** Mulai Side-Scroller Kantor Bertingkat dengan map aktif/pilihan (default memakai Fist Mode) */
  startOfficeMode(mapId?: string) {
    if (mapId) {
      this.officeMapId = mapId;
      setSelectedOfficeMapId(mapId);
    }
    this.arena = 'office';
    try { localStorage.setItem('v2_kf_arena2', 'office'); } catch { /* ignore */ }
    this.campaign = false;
    this.newSurvival();
    this.setWeapon('fist');
  }
  startOfficeFromMenu(mapId?: string) {
    if (this.state !== 'menu') return;
    this.sfx.init(); this.input.focus();
    this.menuExit = null;
    this.startOfficeMode(mapId);
  }

  /** (lama) START dari menu: kamera menarik keluar, pertarungan lanjut di arena yang sama. */
  startDuelFromMenu() {
    if (this.state !== 'menu') return;
    const p = this.player;
    this.sfx.init(); this.input.focus();
    this.menuExit = { t: 0, dur: 1.25, z0: this.menuZoom };
    this.mode = 'duel';
    this.duelRound = 1; this.duelFoe = DUEL_LADDER[0];
    this.stats = defaultStats(); this.mutations = [];
    this.score = 0; this.kills = 0; this.combo = 0; this.bestCombo = 0; this.deaths = 0;
    this.age = 20; this.deathCounter = 1; this.clash = null; this.duelWonT = 0;
    this.enemies = []; this.corpses = []; this.bow.clearAll(); this.bu.clearAll(); this.gd.clearAll(); this.grab.reset(); this.guns.clearAll(); this.eSkel.clear(); this.bullets = []; this.pickups = []; this.pools = [];
    this.particles.list = []; this.texts.list = []; this.announce = [];
    this.state = 'playing';
    this.levelN = 1;
    p.hp = this.maxHp(); p.fatality = null; p.holdT = 0; p.stunT = 0; p.z = 0; p.vz = 0;
    p.attackPhase = 'none'; p.moveKey = null; p.comboStr = ''; p.buffered = null;
    p.hasNunchaku = true; p.hasKatana = true; p.hasDual = true;
    this.setWeapon('nunchaku');
    const spot = this.randomFloorNear(p.x, p.y, 55, 130) ?? { x: p.x + 60, y: p.y };
    const b = this.spawnEnemyAt('duelist', spot.x, spot.y, false);
    if (b) {
      const f = this.duelFoe;
      b.name = f.name; b.color = f.color; b.color2 = f.color2; b.scale = 1;
      b.maxHp = b.hp = f.hp; b.maxStructure = f.hp * 0.8; b.weapon = f.weapon;
      b.speed = 100 + f.skill * 42; b.spawnT = 0.6; b.accessory = 'band'; b.eyeStyle = 'white';
      this.duelBoss = b; this.brain.reset(f, b.x, b.y);
      this.brain.clashCd = 999; this.clash = null; this.bossExchange.reset();
    }
    this.duelBannerT = 2.4;
    this.texts.showHits = false;
    this.sfx.setIntensity(8); this.sfx.startMusic(8);
    this.pushUI();
  }

  /** DUEL 1v1 — hanya kamu dan satu lawan sekelas. Langsung bos di ronde 1. */
  newDuel(round = 1, automatic = false) {
    this.clearCombatScene();
    this.mode = 'duel';
    if (!automatic) { this.sfx.init(); this.input.focus(); }
    this.duelRound = Math.max(1, Math.min(DUEL_LADDER.length, round));
    this.duelFoe = DUEL_LADDER[this.duelRound - 1];
    this.stats = defaultStats();
    this.mutations = [];
    this.score = 0; this.kills = 0; this.combo = 0; this.bestCombo = 0; this.deaths = 0;
    this.age = 20; this.deathCounter = 1;
    this.clash = null; this.duelWonT = 0;
    this.player = makePlayer();
    this.player.hasNunchaku = true; this.player.hasKatana = true; this.player.hasAxe = true; this.player.hasDual = true;
    this.arena = 'meadow';
    this.state = 'playing';
    this.levelN = this.duelRound;
    this.level = generateMeadow(1234 + this.duelRound * 977);
    this.applyPalette(true);
    this.levelCtx = this.levelCanvas.getContext('2d')!;
    this.blood.resetFloor(this.levelCanvas.width, this.levelCanvas.height);
    this.blood.solid = (x, y) => solidAt(this.level, x, y);
    this.flow = flowField(this.level, this.level.spawn.x, this.level.spawn.y);
    const p = this.player;
    this.enemies = []; this.bullets = []; this.pickups = []; this.props = []; this.corpses = []; this.bow.clearAll(); this.bu.clearAll(); this.gd.clearAll(); this.grab.reset(); this.eSkel.clear(); this.hazards = [];
    this.afterimages = []; this.pendingBooms = []; this.pools = []; this.particles.list = []; this.texts.list = []; this.announce = [];
    p.x = this.level.spawn.x - 40; p.y = this.level.spawn.y; p.hp = this.maxHp();
    this.setWeapon(this.duelFoe.weapon === 'dual' ? 'dual' : this.duelFoe.weapon === 'bat' ? 'bat' : this.duelFoe.weapon === 'katana' ? 'katana' : this.duelFoe.weapon === 'boxing' ? 'boxing' : 'nunchaku');
    this.resetCamera();
    this.rng = new Rng(this.level.seed);
    const b = this.spawnEnemyAt('duelist', this.level.spawn.x + 40, this.level.spawn.y, false);
    if (b) {
      const f = this.duelFoe;
      b.name = f.name; b.color = f.color; b.color2 = f.color2; b.scale = 1;
      b.maxHp = b.hp = f.hp; b.maxStructure = f.hp * 0.8; b.weapon = f.weapon;
      b.speed = 100 + f.skill * 42; b.spawnT = 0.5; b.accessory = 'band'; b.eyeStyle = 'white';
      this.duelBoss = b;
      this.brain.reset(f, b.x, b.y);
    }
    this.duelBannerT = 2.2;
    this.texts.showHits = false;
    this.sfx.setIntensity(8);
    this.sfx.startMusic(8);
    this.pushUI();
  }

  private updateDuel(raw: number, dt: number) {
    this.duelBannerT = Math.max(0, this.duelBannerT - raw);
    const b = this.duelBoss;
    if (!b) return;
    if (b.dead && this.duelWonT <= 0) {
      this.duelWonT = 0.001;
      this.slow(1.2, 0.3); this.flash('#ffffff', 0.4); this.shake(0.9);
      this.sfx.levelClear();
    }
    if (this.duelWonT > 0) {
      this.duelWonT += raw;
      if (this.duelWonT > 2.4) {
        if (this.duelRound >= DUEL_LADDER.length) { this.state = 'victory'; this.pushUI(); }
        else this.newDuel(this.duelRound + 1, true);
      }
      return;
    }
    if (b.weapon === 'nunchaku' && !b.dead) {
      const sk = solvePose({ x: b.x, y: b.y, c: b.color, c2: b.color2, scale: 1, facing: b.facing, aim: b.aim,
        walk: b.walk, moving: b.moving, pose: b.pose, t: Math.min(1, b.poseT), acc: b.accessory, weapon: 'none',
        flash: false, alpha: 1, outline: null, eyes: '#000', time: this.time, lean: { x: Math.cos(b.aim), y: Math.sin(b.aim) }, z: b.z });
      this.brain.updateWeapon(this, b, dt, { x: b.x + sk.fhand.x, y: b.y + sk.fhand.y - b.z });
    }
    // lawan menawarkan adu parry saat kamu menyerang di jarak dekat
    const p = this.player;
    if (!this.clash && p.attackPhase === 'active' && b.state === 'attack' && this.brain.clashCd <= 0) {
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < this.duelFoe.reach + 16) this.tryClash(b, false);
    }
    void dt;
  }

  private updateClash(raw: number) {
    const c = this.clash!, b = this.duelBoss;
    if (!b || b.dead) { this.clash = null; this.cinematic = false; this.camFocus = null; this.zoomTarget = BASE_ZOOM; return; }
    const p = this.player;
    // kedua petarung terkunci berhadapan
    const gap = 15;
    const tx = c.cx - Math.cos(c.dir) * gap * 0.5, ty = c.cy - Math.sin(c.dir) * gap * 0.5;
    const bx = c.cx + Math.cos(c.dir) * gap * 0.5, by = c.cy + Math.sin(c.dir) * gap * 0.5;
    const k = Math.min(1, raw * 12);
    p.x += (tx - p.x) * k; p.y += (ty - p.y) * k;
    b.x += (bx - b.x) * k; b.y += (by - b.y) * k;
    p.vx = p.vy = 0; b.vx = b.vy = 0;
    p.aim = c.dir; p.bodyAim = c.dir; p.facing = Math.cos(c.dir) >= 0 ? 1 : -1;
    b.aim = c.dir + Math.PI; b.facing = Math.cos(b.aim) >= 0 ? 1 : -1;
    p.moving = false; b.moving = false;
    if (p.holdT > 0) p.holdT -= raw;
    c.update(raw, this, b, this.duelFoe.skill);
    if (this.input.mouse.pressed || this.input.hit(' ')) c.press(this, b);
    if (c.done) {
      this.clash = null;
      this.cinematic = false; this.camFocus = null; this.zoomTarget = BASE_ZOOM;
      p.holdT = 0; p.attackPhase = 'none';
      this.timeScale = 1;
    }
  }

  /** Mulai adegan adu parry. */
  tryClash(foe: Enemy, byFoe: boolean) {
    if (this.clash || this.mode !== 'duel' || foe.dead) return;
    if (this.brain.clashCd > 0 && byFoe) return;
    const p = this.player;
    const d = Math.hypot(foe.x - p.x, foe.y - p.y);
    if (d > this.duelFoe.reach + 26) return;
    const kinds: ClashKind[] = ['bind', 'rhythm', 'deflect'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const cx = (p.x + foe.x) / 2, cy = (p.y + foe.y) / 2;
    const dir = Math.atan2(foe.y - p.y, foe.x - p.x);
    const c = new Clash();
    c.begin(kind, cx, cy, dir, this.duelFoe.skill, this.duelRound);
    this.clash = c;
    this.brain.clashCd = 3.4;
    p.attackPhase = 'none'; p.buffered = null; p.moveKey = null;
    foe.state = 'chase'; foe.attackCd = 0.6; foe.hitDone = true;
    this.cinematic = true; this.zoomTarget = 1.75 * BASE_ZOOM;
    this.camFocus = { x: cx, y: cy };
    this.slow(0.5, 0.42);
    this.sfx.announce();
    this.particles.ring(cx, cy - 7, 2, 20, '#ffffff', 0.3, 2);
  }

  newSurvival(automatic = false) {
    this.training = false;
    this.clearCombatScene();
    this.mode = 'survival';
    if (!automatic) { this.sfx.init(); this.input.focus(); }
    this.stats = defaultStats();
    this.mutations = [];
    this.score = 0; this.kills = 0; this.combo = 0; this.bestCombo = 0; this.deaths = 0; this.meleeHits = 0;
    this.age = 20; this.deathCounter = 1;
    this.player = makePlayer();
    this.player.hasNunchaku = true; this.player.hasKatana = true; this.player.hasAxe = true; this.player.hasDual = true; this.player.hasRifle = true; this.player.ammoR = 60; this.player.ammoP = 40;
    if (this.campaign) {
      if (this.campFresh) { this.campStage = 0; this.campUnlocked = new Set<WeaponKind>(['fist']); this.campFresh = false; }
      const u = this.campUnlocked, pl = this.player;
      pl.hasNunchaku = u.has('nunchaku'); pl.hasKatana = u.has('katana'); pl.hasAxe = u.has('axe'); pl.hasDual = u.has('dual'); pl.hasRifle = u.has('rifle');
      pl.ammoR = u.has('rifle') ? 60 : 0; pl.ammoP = u.has('pistol') ? 40 : 0;
      this.campPhase = 'wave'; this.campBossId = -1; this.campRewardT = 0;
    }
    resetJackFx(); this.jackT = 0; this.ally.reset();
    this.wave = 0; this.waveT = 0; this.survivalTime = 0; this.waveBudget = 0; this.trickle = 0; this.waveKills = 0; this.pendingChoice = false; this.bossWaveActive = false; this.ambushT = 20;
    this.state = 'playing';
    this.levelN = 1;
    this.level = this.buildArenaLevel(Date.now() % 100000);
    this.applyPalette(true);
    this.levelCtx = this.levelCanvas.getContext('2d')!;
    this.blood.resetFloor(this.levelCanvas.width, this.levelCanvas.height);
    this.blood.solid = (x, y) => solidAt(this.level, x, y);
    this.flow = flowField(this.level, this.level.spawn.x, this.level.spawn.y);
    const p = this.player;
    this.enemies = []; this.bullets = []; this.pickups = []; this.props = []; this.corpses = []; this.bow.clearAll(); this.bu.clearAll(); this.gd.clearAll(); this.grab.reset(); this.eSkel.clear(); this.hazards = []; this.afterimages = []; this.pendingBooms = []; this.pools = [];
    this.particles.list = []; this.texts.list = []; this.announce = [];
    p.x = this.level.spawn.x; p.y = this.level.spawn.y; p.hp = this.maxHp();
    p.svVy = 0; p.svGrounded = true; p.svDropT = 0; p.facing = 1;
    this.resetCamera();
    this.rng = new Rng(this.level.seed);
    if (this.level.sideView && this.level.officeMap) {
      let hasComp = false;
      for (const mp of this.level.officeMap.props) {
        const px0 = mp.tx * TILE + TILE / 2;
        const py0 = mp.ty * TILE;
        const hp = mp.kind === 'table' ? 5 : mp.kind === 'pot' ? 1 : mp.kind === 'computer' ? 2 : 3;
        const r = mp.kind === 'table' ? 9 : mp.kind === 'pot' ? 4 : mp.kind === 'computer' ? 6 : 6;
        if (mp.kind === 'computer') hasComp = true;
        this.props.push({ x: px0, y: py0, kind: mp.kind, hp, r, dead: false, flash: 0 });
      }
      // Jika map kustom lama belum punya prop 'computer', tambahkan unit komputer interaktif di dekat kubikel/resepsionis
      if (!hasComp) {
        for (const d of this.level.officeMap.decor) {
          if (d.kind === 'cubicle' || d.kind === 'reception') {
            const cx = (d.tx + 1) * TILE + TILE / 2;
            const cy = (d.ty + 1) * TILE;
            this.props.push({ x: cx, y: cy, kind: 'computer', hp: 2, r: 6, dead: false, flash: 0 });
          }
        }
      }
    } else {
      // arena lebih berisi: drum & peti berkelompok, jadi ada penutup dan objek yang bisa dihancurkan
      for (let i = 0; i < 15; i++) {
        const pos = this.randomFloorNear(p.x, p.y, 45, 9999, this.rng);
        if (!pos) continue;
        this.props.push({ x: pos.x, y: pos.y, kind: this.rng.chance(0.42) ? 'barrel' : 'crate', hp: 3, r: 6, dead: false, flash: 0 });
        if (this.rng.chance(0.45)) {
          const near = this.randomFloorNear(pos.x, pos.y, 10, 26, this.rng);
          if (near) this.props.push({ x: near.x, y: near.y, kind: this.rng.chance(0.5) ? 'barrel' : 'crate', hp: 3, r: 6, dead: false, flash: 0 });
        }
      }
      this.propsPlay.spawnDecor(this);
    }
    this.spawnQueue = []; this.maxAlive = 999; this.exitOpen = false; this.cleared = true; this.levelTime = 0; this.bannerT = 0; this.flowT = 0;
    this.cam.x = p.x - VIEW_W / 2; this.cam.y = p.y - VIEW_H / 2;
    this.wipe = { t: 1, dir: 1, cb: null };
    this.sfx.startMusic(0);
    this.startWave(this.campaign ? this.campStage + 1 : 1);
    this.pushUI();
  }

  /** difficulty derived from the wave number: never stops growing */
  waveDiff() { return this.wave / 18; }
  /** virtual "level" used by enemy stat scaling and kind unlocks (hp/speed/dmg keep scaling past the story cap) */
  waveLevel() { return Math.floor(this.wave * 9); }

  startWave(n: number) {
    this.wave = n; this.waveT = 0; this.waveKills = 0;
    const d = this.waveDiff();
    this.waveLen = n % 5 === 0 ? 44 : 27 + Math.min(12, n * 0.6);
    // HORDE: anggaran musuh tiap wave jauh lebih besar — arena terasa penuh sesak
    this.waveBudget = n <= 2 ? 12 + n * 5 : Math.floor(16 + n * 6.2 + d * 30);
    this.trickle = 0.16;
    this.bossWaveActive = !this.campaign && n % 5 === 0;
    this.jackT = !JACK_ENABLED || this.campaign ? 0 : n === 1 ? 5 : (n % 3 === 0 && n % 5 !== 0) ? 3.5 : 0;
    this.eliteChance = clamp(0.03 + n * 0.015, 0, 0.6);
    this.levelN = this.waveLevel(); // enemy scaling (hp/speed/dmg) rides on levelN
    this.maxAlive = n <= 2 ? 7 + n * 2 : 12 + Math.floor(n * 1.9) + Math.floor(d * 22);
    const zone = Math.min(ZONES.length - 1, Math.floor((n - 1) / 4));
    this.applyPalette(true);
    this.sfx.setIntensity(Math.min(19, zone + Math.floor(n / 3)));
    this.waveBannerT = 2.4;
    // Nomor wave sudah tampil permanen di HUD kanan atas — jangan ditulis dua kali.
    if (this.bossWaveActive) this.say('BOSS WAVE', '#ff2a2a', 2, 1.8);
    if (n > 1) this.sfx.announce();
    if (this.bossWaveActive) {
      const pos = this.level.sideView
        ? (this.sideViewEdgeSpawnPos() ?? { x: this.level.exit.x, y: this.level.exit.y })
        : (this.randomFloorNear(this.player.x, this.player.y, 150, 320) ?? { x: this.level.exit.x, y: this.level.exit.y });
      const bk = bossForLevel(n * 2);
      this.spawnEnemyAt('boss', pos.x, pos.y, false, bk);
      this.sfx.spawn();
    }
    // HORDE OPENER: begitu wave mulai, rombongan pertama langsung mengepung (dari kiri & kanan untuk kantor side-view)
    {
      const opener = Math.min(this.maxAlive - 2, 6 + n * 2);
      let placed = 0;
      for (let i = 0; i < opener; i++) {
        let x = 0, y = 0;
        if (this.level.sideView) {
          const pos = this.sideViewEdgeSpawnPos(i % 2 === 0 ? 'left' : 'right');
          if (!pos) continue;
          x = pos.x; y = pos.y;
        } else {
          const a = (i / opener) * Math.PI * 2 + rnd(-0.2, 0.2);
          const r = 150 + Math.random() * 110;
          x = this.player.x + Math.cos(a) * r; y = this.player.y + Math.sin(a) * r * 0.78;
          if (x < TILE * 3 || y < TILE * 3 || x > (this.level.w - 3) * TILE || y > (this.level.h - 3) * TILE) continue;
          if (!this.isFree(x, y, 7)) continue;
        }
        // Di Mode Kantor V2: pastikan selalu ada musuh AHLI FIST ('fighter') sejak pembukaan gelombang agar seru untuk adu tanding & parry!
        const forceFighter = !!this.level.sideView && (i === 1 || i === 4);
        const kind = forceFighter ? 'fighter' : this.pickSurvivalKind();
        const e = this.spawnEnemyAt(kind, x, y, Math.random() < (kind === 'fighter' ? Math.max(0.2, this.eliteChance) : this.eliteChance), undefined, true);
        e.spawnT = 0.45 + Math.random() * 0.25;
        if (e.kind !== 'fighter' && n >= 2 && Math.random() < Math.min(0.38, 0.12 + n * 0.02)) makeWielder(this, e, n);
        this.waveBudget = Math.max(0, this.waveBudget - 1);
        this.particles.smoke(x, y, 3, '#8a8a8a', 28, 0.55);
        placed++;
      }
      if (placed) { this.sfx.spawn(); this.shake(0.28); }
    }
    // refill a bit between waves so the fight stays fast; a heart drops nearby when hurt
    const p = this.player;
    if (n > 1 && p.hp < this.maxHp()) { const pos = this.randomFloorNear(p.x, p.y, 20, 60); if (pos) this.spawnPickup(pos.x, pos.y, 'hp'); }
    p.ammoP = Math.min(Math.round(60 * this.stats.maxAmmo), p.ammoP + 10); p.ammoR = Math.min(Math.round(180 * this.stats.maxAmmo), p.ammoR + 20);
    this.pushUI();
  }

  /** survival composition: mixes melee rushers, flankers and shooters; in V2 Office mode includes plenty of Fist Mode masters ('fighter') */
  pickSurvivalKind(): EnemyKind {
    const n = this.wave, L = this.waveLevel();
    const office = !!this.level.sideView;
    const r = Math.random();
    if (n <= 2) {
      if (office) return r < 0.36 ? 'fighter' : r < 0.78 ? 'thug' : 'knife';
      return r < 0.75 ? 'thug' : 'knife';
    }
    const pool: [EnemyKind, number][] = [
      ['thug', 10], ['knife', 7 + n * 0.2], ['gunner', L >= 6 ? 5 + n * 0.2 : 0], ['bomber', L >= 12 ? 3 + n * 0.15 : 0], ['smg', L >= 15 ? 4 + n * 0.2 : 0],
      ['rifleman', L >= 18 ? 4 + n * 0.15 : 0], ['brute', L >= 24 ? 2 + n * 0.25 : 0], ['monk', L >= 30 ? 3 + n * 0.25 : 0], ['shotgun', L >= 34 ? 3 + n * 0.2 : 0],
      ['shield', L >= 40 ? 3 + n * 0.2 : 0], ['sniper', L >= 55 ? 2 + n * 0.15 : 0],
      ['fighter', office ? 8.5 + n * 0.55 : (n >= 3 ? 4 + n * 0.35 : 0)], // AHLI FIST MODE: sering muncul di Kantor V2 untuk adu kombo & parry!
    ];
    let total = 0; for (const [, w] of pool) total += w;
    let x = r * total;
    for (const [k, w] of pool) { x -= w; if (x <= 0) return k; }
    return 'thug';
  }

  /** Side-scroller office spawn: musuh berdatangan dari pintu kiri dan kanan across floors! */
  sideViewEdgeSpawnPos(side?: 'left' | 'right'): Vec | null {
    const p = this.player;
    const pickLeft = side ? side === 'left' : Math.random() < 0.5;
    const gates = pickLeft ? (this.level.leftSpawns ?? []) : (this.level.rightSpawns ?? []);
    const candidates: Vec[] = [];
    for (const gPos of gates) {
      if (Math.abs(gPos.x - p.x) > 85 && this.isFree(gPos.x, gPos.y, 6)) {
        candidates.push({ x: gPos.x + rnd(-10, 10), y: gPos.y });
      }
    }
    const ft = this.level.floorTiles;
    for (let i = 0; i < 24 && ft.length; i++) {
      const f = ft[Math.floor(Math.random() * ft.length)];
      const dx = f.x - p.x;
      if (pickLeft ? (dx < -115 && dx > -340) : (dx > 115 && dx < 340)) {
        if (this.isFree(f.x, f.y, 6)) candidates.push({ x: f.x, y: f.y });
      }
    }
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
    for (const gPos of [...(this.level.leftSpawns ?? []), ...(this.level.rightSpawns ?? [])]) {
      if (this.isFree(gPos.x, gPos.y, 6)) return { x: gPos.x, y: gPos.y };
    }
    return this.randomFloorNear(p.x, p.y, 110, 360);
  }

  /** spawn at the edge of the visible screen (never on top of the player), survivor.io style */
  survivalSpawnPos(): Vec | null {
    if (this.level.sideView) return this.sideViewEdgeSpawnPos();
    const p = this.player;
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 190 + Math.random() * 80;
      const x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * 0.75;
      if (x < TILE * 3 || y < TILE * 3 || x > (this.level.w - 3) * TILE || y > (this.level.h - 3) * TILE) continue;
      if (this.isFree(x, y, 7)) return { x, y };
    }
    return this.randomFloorNear(p.x, p.y, 150, 320);
  }

  updateSurvival(dt: number) {
    this.survivalTime += dt;
    this.waveT += dt;
    const n = this.wave, d = this.waveDiff();
    const alive = this.enemies.filter((e) => !e.dead).length;
    if (this.campaign && this.campPhase !== 'wave') { this.tickCampaignBoss(dt); return; }
    if (this.jackT > 0 && this.state === 'playing') { this.jackT -= dt; if (this.jackT <= 0) spawnJack(this, n); }
    // pour the wave budget in: trickle rate rises with the wave; squads of 2-4 arrive together later on
    if (this.waveBudget > 0 && alive < this.maxAlive) {
      this.trickle -= dt;
      if (this.trickle <= 0) {
        // rombongan datang lebih sering & lebih besar: 2–8 musuh sekaligus
        const squad = n >= 2 && Math.random() < 0.45 + d * 0.5 ? 2 + Math.floor(Math.random() * Math.min(7, 2 + n / 2)) : 1;
        const base = this.survivalSpawnPos();
        for (let i = 0; i < squad && this.waveBudget > 0; i++) {
          let pos = base ? { x: base.x + rnd(-14, 14), y: base.y + rnd(-10, 10) } : null;
          if (!pos || !this.isFree(pos.x, pos.y, 6)) pos = this.survivalSpawnPos();
          if (!pos) break;
          const kind = this.pickSurvivalKind();
          const e = this.spawnEnemyAt(kind, pos.x, pos.y, Math.random() < (kind === 'fighter' ? Math.max(0.22, this.eliteChance) : this.eliteChance));
          e.spawnT = 0.5;
          if (e.kind !== 'fighter' && n >= 2 && Math.random() < Math.min(0.38, 0.12 + n * 0.02)) makeWielder(this, e, n);
          this.waveBudget--;
        }
        this.trickle = (n <= 2 ? 1.15 : Math.max(0.1, 0.68 - n * 0.035 - d * 0.26)) * (squad > 1 ? 1.35 : 1);
      }
    }
    // wave advances when the timer runs out, or earlier once the budget is spent and the field is nearly clear
    const bossAlive = this.enemies.some((e) => (e.boss || isJack(e)) && !e.dead) || this.jackT > 0;
    const done = (this.waveT >= this.waveLen && !bossAlive && this.waveBudget <= 4) || (this.waveBudget <= 0 && alive <= 2 && !bossAlive) || (this.waveT >= this.waveLen * 1.6);
    if (done && !this.pendingChoice) {
      this.score += 100 + n * 25;
      this.say(`WAVE ${n} SURVIVED  +${100 + n * 25}`, '#ffd700', 2, 1.6);
      this.sfx.levelClear();
      this.updateSurvivalBest();
      if (this.campaign) { this.startCampaignBoss(); return; }
      // every 2 waves: pick a mutation (the run grows alongside the brutality)
      if (n % 2 === 0) { this.choices = rollMutations(this.mutations, 3); this.pendingChoice = true; this.state = 'mutation'; this.nextLevelN = -1; this.pushUI(); return; }
      this.startWave(n + 1);
    }
    // AMBUSH events (wave 3+): tiap ~15 detik rombongan menyerbu dari tiga sisi sekaligus
    if (n >= 3) {
      this.ambushT -= dt;
      if (this.ambushT <= 0) {
        this.ambushT = Math.max(7, 17 - n * 0.45);
        const size = 3 + Math.floor(n / 3);
        const flanks: Vec[] = this.level.sideView
          ? [
              this.sideViewEdgeSpawnPos('left') ?? { x: Math.max(TILE * 4, this.player.x - 140), y: this.player.y },
              this.sideViewEdgeSpawnPos('right') ?? { x: Math.min((this.level.w - 4) * TILE, this.player.x + 140), y: this.player.y },
            ]
          : [
              { x: this.player.x - 96, y: this.player.y + rnd(-30, 30) },
              { x: this.player.x + 96, y: this.player.y + rnd(-30, 30) },
              { x: this.player.x + rnd(-40, 40), y: this.player.y + (Math.random() < 0.5 ? -78 : 78) },
            ];
        for (const base of flanks) {
          for (let i = 0; i < size; i++) {
            let pos: Vec | null = this.level.sideView
              ? { x: base.x + rnd(-10, 10), y: base.y }
              : { x: base.x + rnd(-16, 16), y: base.y + rnd(-12, 12) };
            if (!this.isFree(pos.x, pos.y, 6)) {
              const alt = this.level.sideView ? this.sideViewEdgeSpawnPos() : this.randomFloorNear(base.x, base.y, 0, 40);
              if (!alt) continue;
              pos = alt;
            }
            const kind: EnemyKind = this.level.sideView && Math.random() < 0.38 ? 'fighter' : Math.random() < 0.6 ? 'knife' : Math.random() < 0.5 ? 'thug' : 'smg';
            const e = this.spawnEnemyAt(kind, pos.x, pos.y, Math.random() < this.eliteChance, undefined, true);
            e.spawnT = 0.55; e.token = kind !== 'smg';
            this.particles.smoke(pos.x, pos.y, 3, '#7a7a7a', 26, 0.5);
          }
        }
        this.say('AMBUSH!', '#ff2a2a', 2, 1.0);
        this.sfx.announce(); this.shake(0.4);
      }
    }
    // ambient pressure: random supply drops, and late waves rain a few bullets of pressure from off-screen shooters
    // gerombolan lebih besar = pasokan lebih sering supaya pertarungan tetap bisa dimenangkan
    if (Math.random() < dt * 0.22) { const pos = this.randomFloorNear(this.player.x, this.player.y, 40, 120); if (pos) this.spawnPickup(pos.x, pos.y, Math.random() < 0.38 ? 'hp' : Math.random() < 0.5 ? 'ammoP' : Math.random() < 0.5 ? 'ammoR' : 'focus'); }
  }

  // ---------------------------------------------------------------- MODE STORY
  weaponAllowed(w: WeaponKind) { return w === 'foot' || w === 'scythe' || !this.campaign || this.campUnlocked.has(w); }
  startCampaignBoss() {
    const st = STORY[this.campStage];
    if (!st) return;
    for (const e of this.enemies) if (!e.dead) this.killEnemy(e, 0, 120, true);
    this.waveBudget = 0;
    const b = spawnStoryBoss(this, this.campStage);
    this.campPhase = 'boss'; this.campBossId = b ? b.id : -1;
    this.say(`BOS: ${st.boss}`, '#ffd447', 3, 2.2);
    this.sfx.announce(); this.flash('#ffd447', 0.3); this.shake(0.6);
    this.zoomKick = Math.max(this.zoomKick, 0.05);
    this.pushUI();
  }
  tickCampaignBoss(dt: number) {
    if (this.state !== 'playing') return;
    if (this.campPhase === 'reward') { this.campRewardT -= dt; if (this.campRewardT <= 0) this.campNext(); return; }
    const b = this.enemies.find((e) => e.id === this.campBossId);
    if (b && !b.dead) return;
    // bos tumbang -> senjata terbuka
    const st = STORY[this.campStage], p = this.player;
    this.campUnlocked.add(st.weapon);
    const w = st.weapon;
    if (w === 'nunchaku') p.hasNunchaku = true; if (w === 'katana') p.hasKatana = true; if (w === 'axe') p.hasAxe = true; if (w === 'dual') p.hasDual = true;
    if (w === 'rifle') { p.hasRifle = true; p.ammoR = 60; } if (w === 'pistol') p.ammoP = Math.max(p.ammoP, 40);
    p.hp = this.maxHp();
    this.campPhase = 'reward'; this.campRewardT = 2.6;
    this.score += 500;
    this.say(`SENJATA BARU: ${st.label}!`, '#ffd447', 3, 2.4);
    this.sfx.levelClear(); this.flash('#ffd447', 0.4); this.slow(0.8, 0.3);
    this.particles.ring(p.x, p.y - 8, 4, 40, '#ffd447', 0.5, 2);
    this.particles.burst(p.x, p.y - 10, 30, '#ffd447', 260, 0.8, 2, 3);
    this.setWeapon(w);
    this.pushUI();
  }
  campNext() {
    this.campStage++;
    if (this.campStage >= STORY.length) {
      for (const k of ['yoyo', 'takamura', 'hayabusa'] as WeaponKind[]) this.campUnlocked.add(k);
      this.updateSurvivalBest();
      this.state = 'victory'; this.pushUI(); return;
    }
    this.campPhase = 'wave';
    this.startWave(this.campStage + 1);
  }
  updateSurvivalBest() {
    let changed = false;
    if (this.wave > this.bestSurvival.wave) { this.bestSurvival.wave = this.wave; changed = true; }
    if (this.score > this.bestSurvival.score) { this.bestSurvival.score = this.score; changed = true; }
    if (changed) try { localStorage.setItem(SURV_KEY, JSON.stringify(this.bestSurvival)); } catch { /* ignore */ }
  }

  toMenu() {
    this.clearCombatScene();
    this.mirrorSystem.reset(this);
    this.ally.reset();
    this.botPunch.reset(this);
    this.muay.reset(); this.tkd.reset(); this.skipStepCd = 0;
    this.meleeChase.reset();
    this.propsPlay.reset(this);
    this.carry.reset(this);
    this.state = 'menu';
    this.mode = 'story';
    this.sfx.stopMusic();
    this.level = generateMeadow(1234 + 977);
    this.pal = MEADOW_PAL;
    this.menuZoom = 3.5; this.menuExit = null;
    this.levelCanvas = buildLevelCanvas(this.level, this.pal, this.v2);
    this.levelCtx = this.levelCanvas.getContext('2d')!;
    this.blood.resetFloor(this.levelCanvas.width, this.levelCanvas.height);
    this.blood.solid = (x, y) => solidAt(this.level, x, y);
    this.enemies = []; this.bullets = []; this.pickups = []; this.props = []; this.hazards = []; this.corpses = []; this.bow.clearAll(); this.bu.clearAll(); this.gd.clearAll(); this.grab.reset(); this.eSkel.clear(); this.afterimages = []; this.announce = []; this.texts.list = [];
    this.player = makePlayer();
    this.player.x = this.level.spawn.x; this.player.y = this.level.spawn.y;
    this.resetCamera();
    this.cam.x = this.player.x - VIEW_W / 2; this.cam.y = this.player.y - VIEW_H / 2;
    this.pushUI();
  }

  /** Bangun arena sesuai pilihan: padang rumput outdoor, arena kota, atau gedung kantor side-view. */
  buildArenaLevel(seed: number) {
    if (this.arena === 'office') return buildOfficeLevel(getOfficeMapById(this.officeMapId));
    return this.arena === 'meadow' ? generateMeadow(seed) : generateArena(seed, !this.v2);
  }
  toggleBot() { this.mirrorSystem.toggleBot(this); }
  spawnMirror() { this.mirrorSystem.spawnMirror(this); }
  setArena(a: 'city' | 'meadow' | 'office', mapId?: string) {
    if (mapId) {
      this.officeMapId = mapId;
      setSelectedOfficeMapId(mapId);
    }
    if (this.arena === a && !mapId) return;
    this.arena = a;
    try { localStorage.setItem('v2_kf_arena2', a); } catch { /* ignore */ }
    this.sfx.select();
    if (this.state === 'playing') {
      if (this.mode === 'survival' || a === 'office') this.newSurvival(); else this.startLevel(this.levelN);
      this.say(a === 'office' ? 'KANTOR BERTINGKAT' : a === 'meadow' ? 'PADANG ANGIN' : 'ARENA KOTA', a === 'meadow' ? '#8fd46a' : this.pal.accent, 2, 1.3);
    } else this.toMenu();
    this.pushUI();
  }
  setTempo(v: number) {
    if (this.tempo === v) return;
    this.tempo = v;
    try { localStorage.setItem('v2_kf_tempo2', String(v)); } catch { /* ignore */ }
    this.sfx.select();
    this.say(v >= 1 ? 'TEMPO NORMAL' : v >= 0.5 ? 'TEMPO NATURAL' : v >= 0.35 ? 'TEMPO PELAN' : 'TEMPO SANTAI', '#9be7ff', 2, 1.0);
    this.pushUI();
  }
  /** tombol [ dan ] : turun / naik satu tingkat tempo */
  private tempoKeyT = -9;
  stepTempo(dir: number) {
    if (this.time - this.tempoKeyT < 0.15) return;   // updatePlayer berjalan 2x per frame: cegah lompat 2 tingkat
    this.tempoKeyT = this.time;
    const i = TEMPOS.indexOf(this.tempo);
    const n = Math.max(0, Math.min(TEMPOS.length - 1, (i < 0 ? 0 : i) + dir));
    this.setTempo(TEMPOS[n]);
  }
  toggleArena() { this.setArena(this.arena === 'meadow' ? 'office' : this.arena === 'office' ? 'city' : 'meadow'); }
  setFilters(v: boolean) {
    this.filters = v;
    try { localStorage.setItem('v2_kf_fx', v ? '1' : '0'); } catch { /* ignore */ }
    this.sfx.select(); this.pushUI();
  }

  setShowHits(v: boolean) {
    this.showHits = v; this.texts.showHits = v;
    if (!v) this.texts.list = [];
    try { localStorage.setItem('v2_kf_hits', v ? '1' : '0'); } catch { /* ignore */ }
    this.sfx.select(); this.pushUI();
  }

  pause() { if (this.state === 'playing') { this.state = 'paused'; this.pushUI(); } }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.sfx.init(); this.input.focus(); this.pushUI(); } }
  toggleMute() { this.sfx.init(); this.sfx.toggleMute(); this.pushUI(); }
  setBlood(m: BloodMode) {
    this.blood.mode = m;
    try { localStorage.setItem(BLOOD_KEY, m); } catch { /* ignore */ }
    this.sfx.select();
    if (this.state === 'playing') this.say(m === 'normal' ? 'BLOOD: NORMAL' : m === 'gore' ? 'BLOOD: GORE' : 'BLOOD: COMBINED', '#ff4d4d', 1, 0.9);
    this.pushUI();
  }
  cycleBlood() { this.setBlood(this.blood.mode === 'normal' ? 'gore' : this.blood.mode === 'gore' ? 'combined' : 'normal'); }

  private loadLevel(n: number) {
    this.level = this.arena === 'meadow' ? generateMeadow(n * 104729 + 17) : generateLevel(n);
    this.applyPalette(true);
    this.levelCtx = this.levelCanvas.getContext('2d')!;
    this.blood.resetFloor(this.levelCanvas.width, this.levelCanvas.height);
    this.blood.solid = (x, y) => solidAt(this.level, x, y);
    this.flow = flowField(this.level, this.level.spawn.x, this.level.spawn.y);
  }

  resetCamera() {
    this.cinematic = false; this.zoomTarget = BASE_ZOOM; this.zoom = BASE_ZOOM; this.zoomKick = 0; this.camFocus = null; this.camKick.x = this.camKick.y = 0;
    this.camFaceX = this.player.facing * 18;
  }

  startLevel(n: number) {
    this.clearCombatScene();
    this.levelN = n;
    this.loadLevel(n);
    const p = this.player;
    this.enemies = []; this.bullets = []; this.pickups = []; this.props = []; this.corpses = []; this.bow.clearAll(); this.bu.clearAll(); this.gd.clearAll(); this.grab.reset(); this.eSkel.clear(); this.hazards = []; this.afterimages = []; this.pendingBooms = []; this.pools = [];
    this.particles.list = []; this.texts.list = [];
    p.x = this.level.spawn.x; p.y = this.level.spawn.y; p.vx = p.vy = p.kx = p.ky = 0;
    p.dashT = 0; p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.parryT = 0; p.fatality = null; p.focusDash = null; p.stunT = 0; p.iframes = 0.5;
    p.z = 0; p.holdT = 0; p.runT = 0; p.running = false; p.bloom = 0; p.muzzle = 0; p.chain = 0; p.rageDash = null; p.airMagnet = null; p.airLockId = -1; p.svCoyoteT = 0; p.svJumpBufT = 0; p.svJumpAntT = 0; p.svJumpAntCfg = null; p.jumpAntT = 0;
    p.ofaActive = false; this.lockTarget = null; this.ofaReadySaid = p.ofa >= OFA_COST;
    p.hp = Math.min(Math.max(p.hp, 1), this.maxHp());
    this.resetCamera();
    this.fatalityTextT = 0; this.slowT = 0; this.timeScale = 1;
    this.rng = new Rng(this.level.seed * 31 + 7);
    this.combo = 0; this.comboTimer = 0;
    const propCount = this.level.isBoss ? 3 : 5 + this.rng.int(2, 7);
    for (let i = 0; i < propCount; i++) {
      const pos = this.randomFloorNear(p.x, p.y, 70, 9999, this.rng);
      if (pos && dist(pos.x, pos.y, this.level.exit.x, this.level.exit.y) > 24) {
        if (this.level.outdoor && pondDepth(this.level, pos.x, pos.y) > 0.1) continue;
        this.props.push({ x: pos.x, y: pos.y, kind: this.rng.chance(0.42) ? 'barrel' : 'crate', hp: 3, r: 6, dead: false, flash: 0 });
      }
    }
    this.propsPlay.spawnDecor(this);
    this.spawnQueue = [];
    this.eliteChance = clamp((n - 15) / 220, 0, 0.6);
    if (this.level.isBoss) {
      const far = this.farthestFloor();
      this.spawnEnemyAt('boss', far.x, far.y, false, bossForLevel(n));
      const minions = 2 + Math.floor(n / 20);
      for (let i = 0; i < minions; i++) this.spawnQueue.push(pickKind(Math.max(1, n - 5), this.rng));
      this.maxAlive = 3 + Math.floor(n / 35);
      this.spawnTimer = 2.5;
    } else {
      const count = Math.min(30, Math.floor(4 + n * 0.13 + this.rng.int(0, 2)));
      for (let i = 0; i < count; i++) this.spawnQueue.push(pickKind(n, this.rng));
      this.maxAlive = 4 + Math.floor(n / 20);
      this.spawnTimer = 0.4;
    }
    if (n === 5 && !p.hasRifle) this.pickups.push({ x: p.x + 26, y: p.y, kind: 'rifle', t: 0, vx: 0, vy: 0, magnet: false });
    if (n === 3 && !p.hasNunchaku) this.pickups.push({ x: p.x + 26, y: p.y, kind: 'nunchaku', t: 0, vx: 0, vy: 0, magnet: false });
    if (n > 3 && !p.hasNunchaku && n % 2 === 1) this.pickups.push({ x: p.x + 26, y: p.y + 10, kind: 'nunchaku', t: 0, vx: 0, vy: 0, magnet: false });
    if (false && n === 7 && !p.hasKatana) this.pickups.push({ x: p.x + 26, y: p.y - 10, kind: 'katana', t: 0, vx: 0, vy: 0, magnet: false });
    if (false && n > 7 && !p.hasKatana && n % 2 === 0) this.pickups.push({ x: p.x + 26, y: p.y - 10, kind: 'katana', t: 0, vx: 0, vy: 0, magnet: false });
    if (n === 9 && !p.hasAxe) this.pickups.push({ x: p.x + 30, y: p.y + 4, kind: 'axe', t: 0, vx: 0, vy: 0, magnet: false });
    if (n > 9 && !p.hasAxe && n % 3 === 0) this.pickups.push({ x: p.x + 30, y: p.y + 4, kind: 'axe', t: 0, vx: 0, vy: 0, magnet: false });
    if (n === 11 && !p.hasDual) this.pickups.push({ x: p.x + 30, y: p.y - 6, kind: 'dual', t: 0, vx: 0, vy: 0, magnet: false });
    if (n > 11 && !p.hasDual && n % 3 === 1) this.pickups.push({ x: p.x + 30, y: p.y - 6, kind: 'dual', t: 0, vx: 0, vy: 0, magnet: false });
    this.exitOpen = false; this.cleared = false; this.portalT = 0; this.levelTime = 0; this.bannerT = 2.4; this.flowT = 0;
    this.cam.x = p.x - VIEW_W / 2; this.cam.y = p.y - VIEW_H / 2;
    this.sfx.setIntensity(this.level.zone);
    if ((n - 1) % LEVELS_PER_ZONE === 0) this.saveCheckpoint();
    this.updateBest();
    this.pushUI();
  }

  saveCheckpoint() {
    this.save = { level: this.levelN, mutations: [...this.mutations], score: this.score };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.save)); } catch { /* ignore */ }
  }
  updateBest() {
    let changed = false;
    if (this.levelN > this.best.level) { this.best.level = this.levelN; changed = true; }
    if (this.score > this.best.score) { this.best.score = this.score; changed = true; }
    if (changed) try { localStorage.setItem(BEST_KEY, JSON.stringify(this.best)); } catch { /* ignore */ }
  }

  onLevelCleared() {
    this.cleared = true;
    this.exitOpen = true;
    this.sfx.levelClear();
    this.slow(0.5, 0.25);
    this.flash(this.pal.accent, 0.25);
    this.say('LEVEL CLEAR!', this.pal.accent, 3, 1.6);
    this.score += this.levelN * 25;
    const p = this.player;
    const ex = this.level.exit;
    const kind: Pickup['kind'] = p.hp < this.maxHp() ? 'hp' : p.hasRifle && p.ammoR < 40 ? 'ammoR' : p.ammoP < 30 ? 'ammoP' : 'focus';
    this.pickups.push({ x: ex.x + 16, y: ex.y + 4, kind, t: 0, vx: 0, vy: 0, magnet: false });
    this.particles.shockwave(ex.x, ex.y, 40, this.pal.accent, 0.6);
    this.updateBest();
  }

  beginExit() {
    if (this.wipe) return;
    this.sfx.portal();
    this.wipe = { t: 0, dir: -1, cb: () => this.nextLevel() };
  }

  nextLevel() {
    const n = this.levelN;
    if (n >= TOTAL_LEVELS) { this.victory(); return; }
    this.nextLevelN = n + 1;
    if (n % 3 === 0 || this.level.isBoss) {
      this.choices = rollMutations(this.mutations, 3);
      this.state = 'mutation';
      this.pushUI();
    } else {
      this.startLevel(n + 1);
    }
  }

  chooseMutation(i: number) {
    const m = this.choices[i];
    if (!m) return;
    m.apply(this.stats);
    this.mutations.push(m.id);
    const p = this.player;
    if (m.instant === 'heal') p.hp = Math.min(this.maxHp(), p.hp + 1);
    if (m.instant === 'fullheal') { p.hp = this.maxHp(); p.focus = 300; }
    if (m.instant === 'ammo') { p.ammoP = Math.min(60 * this.stats.maxAmmo, p.ammoP + 40); if (p.hasRifle) p.ammoR = Math.min(180 * this.stats.maxAmmo, p.ammoR + 100); }
    if (m.instant === 'youth') { this.age = Math.max(20, this.age - 6); }
    this.sfx.select();
    this.state = 'playing';
    this.choices = [];
    this.input.focus();
    if (this.mode === 'survival') { this.pendingChoice = false; this.startWave(this.wave + 1); return; }
    this.startLevel(this.nextLevelN);
    this.wipe = { t: 1, dir: 1, cb: null };
  }

  die() {
    const p = this.player;
    p.hp = 0;
    p.ofaActive = false; this.lockTarget = null;
    this.state = 'dead';
    this.deathT = 0;
    this.deaths++;
    this.ageGain = this.deathCounter;
    this.sfx.death();
    this.flash('#ff0000', 0.6);
    this.shake(1);
    this.particles.blood(p.x, p.y - 6, 30, p.aim + Math.PI, 160);
    for (let i = 0; i < 4; i++) this.particles.limb(p.x, p.y - 6, rnd(0, 6.3), 140, '#ffffff', 4);
    this.splat(p.x, p.y, 10);
    this.corpses.push({ x: p.x, y: p.y, rot: p.aim, color: '#ffffff', color2: PLAYER_BAND, scale: 1, accessory: 'headband', vx: 0, vy: 0, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
    this.slow(1.5, 0.3);
    this.cinematic = false; this.camFocus = null; this.zoomTarget = 1.3 * BASE_ZOOM;
    this.pushUI();
  }

  respawn() {
    if (this.state !== 'dead') return;
    // duel: kalah berarti mengulang lawan yang sama, bukan kembali ke mode gelombang
    if (this.mode === 'duel') { this.newDuel(this.duelRound); this.wipe = { t: 1, dir: 1, cb: null }; return; }
    if (this.mode === 'team') { this.newTeam(); return; }
    if (this.mode === 'survival') { this.updateSurvivalBest(); this.gameOver(); return; }
    this.age += this.deathCounter;
    this.deathCounter++;
    if (this.age >= 70) { this.gameOver(); return; }
    this.player.hp = this.maxHp();
    this.state = 'playing';
    this.input.focus();
    this.startLevel(this.levelN);
    this.wipe = { t: 1, dir: 1, cb: null };
    this.say('OLDER. STRONGER.', '#ffd700', 2, 1.6);
  }

  gameOver() {
    this.state = 'gameover';
    this.sfx.stopMusic();
    this.updateBest();
    this.pushUI();
  }

  victory() {
    this.state = 'victory';
    this.sfx.stopMusic();
    this.sfx.levelClear();
    this.updateBest();
    try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
    this.save = null;
    this.pushUI();
  }

  restartZone() {
    if (this.mode === 'duel') { this.newDuel(this.duelRound); return; }
    if (this.mode === 'team') { this.newTeam(); return; }
    if (this.mode === 'survival') { this.newSurvival(); return; }
    const zoneStart = Math.floor((this.levelN - 1) / LEVELS_PER_ZONE) * LEVELS_PER_ZONE + 1;
    const keep: SaveData = { level: zoneStart, mutations: [...this.mutations], score: this.score };
    this.newGame(keep);
  }

  // ------------------------------------------------------------------ helpers
  shake(t: number) {
    // Diminishing returns: banyak hit bersamaan tidak boleh menumpuk jadi getaran pusing.
    const cap = 0.62;
    if (t < 0.12 && this.trauma > 0.28) return;
    const room = Math.max(0.08, 1 - this.trauma / cap);
    const amount = Math.min(1.6, Math.max(0, t)) * 0.42 * room;
    this.trauma = Math.min(cap, this.trauma + amount);
  }
  /** Offset kamera yang lebih halus dan jauh lebih kecil dari getaran acak lama. */
  applyShakeOffsets() {
    const s = this.trauma * this.trauma;
    this.shakeX = Math.sin(this.time * 43) * s * 4.4 + rnd(-1, 1) * s * 1.1;
    this.shakeY = Math.cos(this.time * 37) * s * 3.2 + rnd(-1, 1) * s * 0.9;
  }
  slow(dur: number, factor: number) { this.slowT = Math.max(this.slowT, dur); this.slowFactor = factor; }
  flash(c: string, a: number) { this.flashC = c; this.flashA = Math.max(this.flashA, a); }
  isFree(x: number, y: number, r: number) { return freeAt(this.level, x, y, r * 0.8); }
  hasLOS(e: { x: number; y: number }) { return lineOfSight(this.level, e.x, e.y, this.player.x, this.player.y); }
  mouseWorld(): Vec {
    const z = this.zoom;
    return { x: this.cam.x + VIEW_W / 2 + (this.input.mouse.x - VIEW_W / 2) / z, y: this.cam.y + VIEW_H / 2 + (this.input.mouse.y - VIEW_H / 2) / z };
  }
  randomFloorNear(x: number, y: number, minD: number, maxD: number, rng?: Rng): Vec | null {
    const ft = this.level.floorTiles;
    if (!ft.length) return null;
    for (let i = 0; i < 40; i++) {
      const t = rng ? rng.pick(ft) : ft[Math.floor(Math.random() * ft.length)];
      const px0 = this.level.sideView ? t.x : t.x * TILE + TILE / 2;
      const py0 = this.level.sideView ? t.y : t.y * TILE + TILE / 2;
      const d = dist(px0, py0, x, y);
      if (d >= minD && d <= maxD && this.isFree(px0, py0, 6)) return { x: px0, y: py0 };
    }
    return null;
  }
  farthestFloor(): Vec {
    return { x: this.level.exit.x, y: this.level.exit.y };
  }
  stamp(x: number, y: number, c: string, s: number, force = false) {
    if (!force && solidAt(this.level, x, y)) return;
    const ctx = this.blood.gore && this.blood.sctx ? this.blood.sctx : this.levelCtx;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), s, s);
    ctx.globalAlpha = 1;
  }
  splat(x: number, y: number, n: number, c = '#8a0000', force = false) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.3), r = rnd(0, 9);
      const k = Math.random();
      this.stamp(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, k < 0.25 ? '#5e0000' : c, k < 0.15 ? 3 : k < 0.55 ? 2 : 1, force);
    }
    this.stamp(x - 1, y - 1, c, 3, force);
    this.stamp(x - 2, y, '#5e0000', 2, force);
  }
  /** growing blood pool stamped into the floor over ~1s (clipped to floor tiles) */
  addPool(x: number, y: number, max: number, c = '#7a0000') {
    this.pools.push({ x, y, r: 1, max, c });
    if (this.pools.length > 40) this.pools.shift();
  }
  updatePools(dt: number) {
    for (let i = this.pools.length - 1; i >= 0; i--) {
      const q = this.pools[i];
      q.r += (q.max / 0.9) * dt;
      const r = Math.min(q.r, q.max);
      this.stampEllipse(q.x, q.y, r, r * 0.5, q.c, 0.2);
      if (q.r >= q.max) this.pools.splice(i, 1);
    }
  }
  stampEllipse(x: number, y: number, rx: number, ry: number, c: string, alpha: number) {
    const ctx = this.levelCtx;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = c;
    const cx = Math.round(x), cy = Math.round(y);
    const ryi = Math.ceil(ry);
    for (let dy = -ryi; dy <= ryi; dy++) {
      const f = 1 - (dy * dy) / (ry * ry + 0.5);
      if (f < 0) continue;
      const dx = Math.floor(Math.sqrt(f) * rx);
      let start = -1;
      for (let xx = cx - dx; xx <= cx + dx + 1; xx++) {
        const solid = xx > cx + dx || solidAt(this.level, xx, cy + dy);
        if (!solid && start < 0) start = xx;
        if (solid && start >= 0) { ctx.fillRect(start, cy + dy, xx - start, 1); start = -1; }
      }
    }
    ctx.globalAlpha = 1;
  }
  bulletHole(x: number, y: number) {
    this.stamp(x, y, '#050505', 1);
    if (Math.random() < 0.5) this.stamp(x + rnd(-1, 1), y + rnd(-1, 1), 'rgba(0,0,0,0.5)', 1);
  }
  addHazard(h: Partial<Hazard>) {
    const base: Hazard = { x: 0, y: 0, r: 0, maxR: 40, life: 1, max: 1, kind: 'ring', hit: false, dmg: 1, fromPlayer: false };
    const out = Object.assign(base, h);
    out.max = h.max ?? h.life ?? 1;
    this.hazards.push(out);
  }
  addAfterimage(src: { x: number; y: number; facing: number; aim: number; scale?: number; color?: string; pose?: Pose; poseT?: number; dancePhase?: number }, color?: string, lean?: Vec) {
    if (this.afterimages.length > 60) this.afterimages.shift();
    this.afterimages.push({
      x: src.x, y: src.y, life: 0.22, max: 0.22, pose: src.pose ?? 'dash', t: src.poseT ?? 0, facing: src.facing, aim: src.aim,
      color: color ?? src.color ?? this.pal.accent, scale: src.scale ?? 1, lean: lean ?? { x: Math.cos(src.aim), y: Math.sin(src.aim) }, dancePhase: src.dancePhase,
    });
  }
  spawnEnemyAt(kind: EnemyKind, x: number, y: number, elite: boolean, boss?: BossKind, quiet = false) {
    const e = makeEnemy(kind, boss, x, y, this.levelN, elite);
    if (this.level.sideView) { e.svVy = 0; e.svGrounded = true; e.svDropT = 0; }
    this.enemies.push(e);
    if (!quiet) {
      this.sfx.spawn();
      this.particles.ring(x, y - 6, 16, 2, this.pal.accent, 0.6, 1);
    }
    return e;
  }
  spawnNext() {
    const kind = this.spawnQueue.shift();
    if (!kind) return;
    const p = this.player;
    let pos = this.randomFloorNear(p.x, p.y, 110, 320);
    if (!pos) pos = this.randomFloorNear(p.x, p.y, 70, 9999);
    if (!pos) pos = { x: this.level.exit.x, y: this.level.exit.y };
    this.spawnEnemyAt(kind, pos.x, pos.y, Math.random() < this.eliteChance);
  }
  spawnPickup(x: number, y: number, kind: Pickup['kind']) {
    this.pickups.push({ x, y, kind, t: 0, vx: rnd(-50, 50), vy: rnd(-50, 50), magnet: false });
  }
  dropLoot(e: Enemy, melee: boolean) {
    const p = this.player;
    let chance = (0.2 + (melee ? 0.1 : 0)) * this.stats.dropRate * (e.elite ? 2 : 1);
    if (e.boss) chance = 3;
    let n = Math.floor(chance) + (Math.random() < chance % 1 ? 1 : 0);
    while (n-- > 0) {
      const w: [Pickup['kind'], number][] = [
        ['hp', p.hp < this.maxHp() ? 3 : 0.3],
        ['ammoP', 3],
        ['ammoR', p.hasRifle ? 3 : this.levelN >= 8 ? 1.2 : 0],
        ['focus', 1.5],
      ];
      const total = w.reduce((a, b) => a + b[1], 0);
      let r = Math.random() * total;
      let kind: Pickup['kind'] = 'ammoP';
      for (const [k, wt] of w) { r -= wt; if (r <= 0) { kind = k; break; } }
      if (kind === 'ammoR' && !p.hasRifle) kind = 'rifle';
      this.spawnPickup(e.x, e.y, kind);
    }
  }
  nearestEnemy(x: number, y: number, maxD: number, aim?: number, arc?: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = maxD;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = dist(x, y, e.x, e.y) - e.r;
      if (d > bd) continue;
      if (aim !== undefined && arc !== undefined && Math.abs(angleDiff(Math.atan2(e.y - y, e.x - x), aim)) > arc) continue;
      bd = d; best = e;
    }
    return best;
  }
  /** staggered enemy in reach -> "FINISH HIM!" banner (perfect fatality) */
  finishTarget(): Enemy | null {
    const p = this.player;
    let best: Enemy | null = null, bd = 60;
    for (const e of this.enemies) {
      if (e.dead || e.stagger <= 0 || e.spawnT > 0) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  /** ANY enemy can be fatality'd: close ones directly, far ones (in aim direction) via a running/flying finisher */
  fatalityTarget(): { e: Enemy; far: boolean } | null {
    const p = this.player;
    let best: Enemy | null = null, bs = -1e9, far = false;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if (this.level.sideView && Math.abs(e.y - p.y) > 14) continue;
      const d = dist(p.x, p.y, e.x, e.y) - e.r;
      const ang = Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), p.aim));
      let score = -1e9, isFar = false;
      if (d < 60) score = 200 - d * 2 - ang * 8 + (e.stagger > 0 ? 80 : 0);
      else if (d < 150 && ang < 0.75 && lineOfSight(this.level, p.x, p.y, e.x, e.y)) { score = 100 - d * 0.5 - ang * 20 + (e.stagger > 0 ? 80 : 0); isFar = true; }
      if (score > bs) { bs = score; best = e; far = isFar; }
    }
    return best ? { e: best, far } : null;
  }
  addCombo(n = 1) {
    this.combo += n;
    this.comboTimer = this.comboMax;
    this.comboPop = 0.1;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    if ([6, 12, 25, 50, 100].includes(this.combo)) {
      const names: Record<number, string> = { 6: 'GOOD!', 12: 'GREAT!', 25: 'BRUTAL!', 50: 'MASTER!', 100: 'LEGENDARY!' };
      this.say(names[this.combo], this.pal.accent2, 2, 0.9);
      this.sfx.select();
    }
  }

  // ------------------------------------------------------------------ frame
  frame(raw: number) {
    this.time += raw;
    this.rawDt = raw;
    if (this.level?.sideView) { if (this.officeLook.on) this.officeLook.update(raw, this.sfx, this.state === 'playing' || this.state === 'menu', this.wave); if (this.v1hit && this.state !== 'paused') this.v1hit.update(raw);
      if (this.state !== 'paused') { this.glowFx.update(this.hitstop > 0 ? raw * 0.35 : raw); const pp = this.player; if (this.glowOn && pp.ofaActive && this.v1hit && Math.random() < 0.3) this.v1hit.fx.zap(pp.x + rnd(-6, 6), pp.y - pp.z - rnd(2, 16), 1); } }
    const inp = this.input;
    if (inp.hit('m') && this.state === 'playing') this.mirrorSystem.toggleBot(this);
    if (inp.hit(',')) this.toggleMute();
    if (inp.hit('b') && inp.key('shift')) this.cycleBlood();
    if (inp.hit('n') && !inp.key('shift') && this.state === 'playing') this.gates.toggle(this);
    if (inp.hit('n') && inp.key('shift') && this.player.weapon !== 'boxing') this.toggleNunStyle();
    if (inp.hit('v')) this.toggleV2();
    if (inp.hit('l') && !inp.key('shift')) this.toggleLong();
    if (inp.hit('k') && inp.key('shift') && this.player.weapon !== 'foot') this.toggleTall();
    if (inp.hit('h')) this.toggleSmooth();
    this.kickInput(raw);
    if (this.casingSfxCd > 0) this.casingSfxCd -= raw;
    if (this.hitMarkerT > 0) this.hitMarkerT -= raw;
    if (this.fatalityTextT > 0) this.fatalityTextT -= raw;
    if (this.finishCd > 0) this.finishCd -= raw;
    for (let i = this.announce.length - 1; i >= 0; i--) { this.announce[i].t += raw; if (this.announce[i].t >= this.announce[i].max) this.announce.splice(i, 1); }
    if (this.fatalityCd > 0 && this.state === 'playing') this.fatalityCd -= raw;
    this.input.autoFocusOnHover = this.state === 'playing';
    switch (this.state) {
      case 'menu': {
        // ATTRACT MODE: a slow pan over the arena while thugs circle a training dummy of the hero; blood & ragdolls included
        this.menuT += raw;
        this.particles.update(raw);
        this.blood.update(raw);
        this.updateCorpses(raw);
        if (Math.random() < 0.3) this.particles.ember(this.cam.x + rnd(0, VIEW_W), this.cam.y + VIEW_H + 4, 1, this.pal.accent);
        const p = this.player;
        p.aim = Math.atan2(inp.mouse.y + this.cam.y - p.y + 6, inp.mouse.x + this.cam.x - p.x);
        p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
        // MENU: stickman berdiri idle siap bertarung. Tidak ada musuh yang mendekat sebelum START.
        p.vx = 0; p.vy = 0; p.moving = false; p.runT = 0; p.walk = 0; p.strideHalf = 2.4; p.bodyAim = p.aim;
        // KUNCI KAMERA: tokoh tetap di titik layar yang sama walau ia berlari ke mana pun.
        // Pakai jalur kamera sinematik yang sudah terbukti membingkai pemain:
        // camFocus mengunci tokoh, zoom rapat membuatnya besar di layar.
        this.zoomTarget = this.menuZoom;
        this.zoom += (this.menuZoom - this.zoom) * Math.min(1, raw * 6);
        this.camFocus = { x: p.x - 32, y: p.y - 2 };
        // dikekang rapat: beberapa langkah per frame membuat kamera praktis terkunci
        // pada tokoh, jadi ia tetap di tempat yang sama di layar walau berlari kencang.
        for (let i = 0; i < 6; i++) this.updateCamera(raw);
        this.camFocus = null;
        this.trauma = Math.max(0, this.trauma - raw * 3.4); this.applyShakeOffsets();
        const s = this.trauma * this.trauma; this.shakeX = rnd(-1, 1) * s * 8; this.shakeY = rnd(-1, 1) * s * 6;
        if (this.hitstop > 0) this.hitstop -= raw;
        if (inp.hit('enter') || inp.hit(' ')) this.startSurvivalFromMenu();
        return;
      }
      case 'paused':
        if (inp.hit('escape') || inp.hit('p')) this.resume();
        return;
      case 'mutation':
        if (inp.hit('1')) this.chooseMutation(0);
        else if (inp.hit('2')) this.chooseMutation(1);
        else if (inp.hit('3')) this.chooseMutation(2);
        return;
      case 'dead':
        this.deathT += raw;
        this.particles.update(raw * 0.5);
        this.texts.update(raw);
        this.updateCorpses(raw * 0.5);
        this.updateCamera(raw);
        if (this.deathT > 1.0 && (inp.hit('enter') || inp.hit(' ') || inp.mouse.pressed)) this.respawn();
        return;
      case 'gameover': case 'victory':
        this.particles.update(raw);
        return;
      default:
        break;
    }
    if (inp.hit('escape') || inp.hit('p')) { this.pause(); return; }
    this.trauma = Math.max(0, this.trauma - raw * 3.4); this.applyShakeOffsets();
    this.gunfx.update(raw);
    if (this.hitstop > 0) {
      this.hitstop -= raw;
      if (this.player.weapon === 'foot' && this.player.attackPhase !== 'none') {
        if (inp.hit('i') && !inp.key('shift')) { this.queueFootStance(); inp.pressed.delete('i'); }
        this.readFootInputs();
        if (inp.hit('g') && (inp.key('shift') || performance.now() - inp.shiftUpAt < 140)) { this.queueScythe({ input: 'H', airborne: false, momentum: false, rising: false, backKick: false }); inp.pressed.delete('g'); }
        this.readScytheInputs();
      }
      this.updateCamera(raw);
      this.heldInput = true;
      return;
    }
    if (this.slowT > 0) { this.slowT -= raw; this.timeScale = lerp(this.timeScale, this.slowFactor, 0.4); }
    else if (this.player.ofaActive) this.timeScale = lerp(this.timeScale, OFA_WORLD, raw * 9);
    else this.timeScale = lerp(this.timeScale, 1, 0.25);
    const dt = raw * this.timeScale;
    if (this.wipe) {
      if (this.wipe.dir === -1) {
        this.wipe.t += raw * 2.2;
        if (this.wipe.t >= 1) {
          this.wipe.t = 1;
          const cb = this.wipe.cb;
          this.wipe = { t: 1, dir: 1, cb: null };
          cb?.();
          if (this.state !== 'playing') return;
        }
        this.particles.update(dt);
        this.updateCamera(raw);
        return;
      }
      this.wipe.t -= raw * 2.2;
      if (this.wipe.t <= 0) this.wipe = null;
    }
    if (this.menuExit) {
      const e = this.menuExit;
      e.t += raw;
      const u = Math.min(1, e.t / e.dur);
      const k = 1 - Math.pow(1 - u, 3);
      const z = e.z0 + (BASE_ZOOM - e.z0) * k;
      this.zoom = z; this.zoomTarget = z;
      const fx = 0.22 * (1 - k), fy = 0.08 * (1 - k);
      this.cam.x = this.player.x - (VIEW_W * fx) / z;
      this.cam.y = this.player.y - (VIEW_H * fy) / z - (6 * (1 - k)) / z;
      if (u >= 1) { this.menuExit = null; this.zoomTarget = BASE_ZOOM; }
      this.particles.update(dt); this.texts.update(dt);
      this.trauma = Math.max(0, this.trauma - raw * 3.4); this.applyShakeOffsets();
      if (this.mode === 'duel') this.updateDuel(raw, dt);
      return;
    }
    if (this.mode === 'duel') this.updateDuel(raw, dt);
    if (this.clash) { this.updateClash(raw); this.updateCamera(raw); this.particles.update(raw * 0.35); this.texts.update(raw); return; }
    this.levelTime += dt;
    if (this.bannerT > 0) this.bannerT -= raw;
    this.updateWorld(dt);
    if (this.level?.sideView) this.doors.update(this, dt);
    this.updateCamera(raw);
  }

  updateWorld(dt: number) {
    const p = this.player;
    const punching = !!this.botPunch.active || !!this.muay.active || !!this.tkd.active;
    this.grab.update(this, dt);
    stepJackFx(this, dt);
    this.carry.update(this, dt);
    this.propsPlay.update(this, dt);
    const propScene = !!this.propsPlay.scene;
    const cinematic = punching || propScene;
    this.botPunch.update(this, dt);
    this.muay.update(this, dt);
    this.tkd.update(this, dt);
    if (this.skipStepCd > 0) this.skipStepCd -= dt;
    this.updateRunVisuals(this.rawDt || dt);
    // Dunia tetap jalan; hanya input pemain yang dikunci selama adegan.
    if (!cinematic) this.updatePlayer(p.ofaActive ? this.rawDt * OFA_PLAYER : dt);
    else { p.moving = false; p.running = false; p.runT = 0; }
    if (!cinematic) this.meleeChase.update(this, dt);
    if (!cinematic) this.bossExchange.update(this, dt);
    if (!cinematic) this.mirrorSystem.update(this, dt);
    this.ally.update(this, dt);
    this.brut.updateHint(this, dt);
    this.gates.update(this, dt);
    this.updateRevives(dt);
    this.team.update(this, dt);
    this.updateOfa(this.rawDt);
    this.flowT -= dt;
    if (this.flowT <= 0) { this.flow = flowField(this.level, p.x, p.y); this.flowT = 0.25; }
    const alive = this.enemies.filter((e) => !e.dead).length;
    if (this.training) {
      this.survivalTime += dt;
      this.camFocus = { x: p.x + 5, y: p.y - 8 };
    } else if (this.mode === 'survival') this.updateSurvival(dt);
    else if (this.spawnQueue.length && alive < this.maxAlive) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) { this.spawnNext(); this.spawnTimer = this.levelTime < 2 ? 0.18 : 0.5; }
    }
    if (this.state !== 'playing') return;
    this.updateTactics(dt);
    for (const e of this.enemies) if (!e.dead) {
      if (this.muay.active?.e === e && this.muay.active.phase !== 'recover') continue;
      if (this.training) {
        e.hp = e.maxHp; e.moving = false; e.down = Math.max(0, this.practiceFootLandAt - this.time); e.stun = e.stagger = 0;
        e.sqx = e.sqy = 1; e.pose = 'idle'; e.state = 'chase'; e.flash = Math.max(0, e.flash - dt);
        e.facing = p.x < e.x ? -1 : 1; e.aim = e.facing < 0 ? Math.PI : 0;
        e.kx *= Math.exp(-10 * dt); e.ky *= Math.exp(-10 * dt);
        moveWithCollision(this.level, e, e.kx * dt, 0);
        if (p.weapon === 'foot') {
          // The dummy can be juggled, but never starts an attack or wanders off the practice floor.
          const ground = this.level.spawn.y;
          if (e.y < ground || (e.svVy ?? 0) < 0) {
            e.svVy = Math.min(270, (e.svVy ?? 0) + 490 * dt);
            e.y = Math.min(ground, e.y + e.svVy * dt);
            e.svGrounded = e.y >= ground;
            if (!e.svGrounded) e.pose = 'launched'; else e.svVy = 0;
          } else { e.svGrounded = true; e.svVy = 0; }
        } else { e.y = this.level.spawn.y; e.svVy = 0; e.svGrounded = true; }
        continue;
      }
      updateEnemy(this, e, dt);
      if (e.dkFly) this.updateDropkickChain(e, dt);
      // PATAH TULANG permanen: AI tak bisa menggerakkan bagian yang patah secara normal
      const fr = e.fracture;
      if (fr && !e.dead) {
        if (fr.part === 'fleg' || fr.part === 'bleg') {
          // kaki patah: tersandung berkala saat memaksakan diri bergerak
          e.fractureT = (e.fractureT ?? 0) + dt;
          if (e.fractureT > 1.3 && e.z <= 0 && e.down <= 0 && Math.hypot(e.vx + e.kx, e.vy + e.ky) > 20) {
            e.fractureT = 0; e.stun = Math.max(e.stun, 0.32); e.sqx = 1.3; e.sqy = 0.7;
          }
        } else if (fr.part === 'neck') {
          // leher patah: kepala tak bisa menoleh — arah hadap terkunci selamanya
          e.facing = fr.face; e.aim = fr.face >= 0 ? 0 : Math.PI; e.bodyAim = e.aim;
        }
      }
    }
    this.physics(dt);
    this.updateBullets(dt);
    this.bow.update(dt);
    this.updateArrows(dt);
    this.updateBeams(dt);
    this.updatePickups(dt);
    this.updateProps(dt);
    this.updateHazards(dt);
    for (let i = this.afterimages.length - 1; i >= 0; i--) { this.afterimages[i].life -= dt; if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1); }
    this.updateCorpses(dt);
    this.updatePools(dt);
    this.blood.update(dt);
    this.particles.update(dt);
    this.fireTrail.update(dt);
    this.box.update(dt, p.moving, clamp(Math.hypot(p.vx, p.vy) / 150, 0, 1));
    if (this.level.outdoor) {
      this.life.update(dt, p.x, p.y, (x, y) => solidAt(this.level, x, y),
        (x, y) => this.splashAt(x, y, 0.5), (x, y) => pondDepth(this.level, x, y));
      // mengarungi air setinggi lutut: langkah melambat, memercik, riak mengikuti
      const depth = pondDepth(this.level, p.x, p.y);
      if (depth > 0.06) {
        if (this.wasWading <= 0.06) { this.splashAt(p.x, p.y, 1); this.sfx.splash(); }
        this.wadeT -= dt * (p.moving ? 1 : 0.25);
        if (this.wadeT <= 0 && p.moving) {
          this.wadeT = 0.26;
          this.splashAt(p.x, p.y, 0.45);
          this.sfx.wade();
        }
      }
      this.wasWading = depth;
    }
    if (this.boxOn && p.moving && p.z <= 0 && !p.fatality) {
      // jejak langkah: Ali berdecit ringan, Tyson menghentak, Ippo menggaruk
      this.boxStepT -= dt * (this.box.stance === 'ali' ? 1.5 : 1);
      if (this.boxStepT <= 0) {
        this.boxStepT = 0.26;
        this.sfx.shoeStep();
        const d = this.boxDef;
        for (let i = 0; i < (this.box.stance === 'ali' ? 3 : 2); i++) {
          const q = Boxing.shuffleDust();
          this.particles.add({ x: p.x + rnd(-3, 3), y: p.y, vx: q.vx, vy: q.vy, life: q.life, c: this.level.outdoor ? '#6f9a4a' : d.gloveLight, k: 3, s: q.s, fr: 4 });
        }
      }
    }
    if (this.nameCd > 0) this.nameCd -= dt;
    if (p.faceT > 0) p.faceT -= dt;
    this.texts.update(dt);
    if (this.combo > 0) { this.comboTimer -= dt * this.stats.comboDecay; if (this.comboTimer <= 0) this.combo = 0; }
    this.comboPop -= dt;
    this.flashA = Math.max(0, this.flashA - dt * 2.5);
    if (p.recoil > 0) p.recoil = Math.max(0, p.recoil - dt * 8);
    if (this.mode === 'story' && !this.cleared && !p.fatality && this.spawnQueue.length === 0 && this.enemies.every((e) => e.dead)) this.onLevelCleared();
    if (this.exitOpen) {
      this.portalT += dt;
      const ex = this.level.exit;
      if (Math.random() < 0.5) this.particles.add({ x: ex.x + rnd(-10, 10), y: ex.y + rnd(-4, 4), vx: 0, vy: rnd(-40, -15), life: 0.6, c: Math.random() < 0.5 ? this.pal.accent : '#ffffff', k: 7 });
      const d = dist(p.x, p.y, ex.x, ex.y);
      if (d < 40 && d > 0.5 && !p.fatality) { p.kx += ((ex.x - p.x) / d) * 60 * dt * 20; p.ky += ((ex.y - p.y) / d) * 60 * dt * 20; }
      if (d < 10 && !p.fatality) this.beginExit();
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) if (this.enemies[i].dead) this.enemies.splice(i, 1);
  }

  updateCorpses(dt: number) {
    for (let i = this.corpses.length - 1; i >= 0; i--) {
      const c = this.corpses[i];
      c.t += dt;
      if (this.v2 && c.t > (c.rd ? 14 : 2.3) && !this.grab.keeps(c)) { this.corpses.splice(i, 1); continue; }   // ragdoll diberi waktu lebih lama supaya gulingannya terlihat
      if (c.cd) c.cd -= dt;
      c.sqx = (c.sqx ?? 1) + (1 - (c.sqx ?? 1)) * Math.min(1, dt * 9);
      c.sqy = (c.sqy ?? 1) + (1 - (c.sqy ?? 1)) * Math.min(1, dt * 9);
      const sideFloor = this.level.sideView
        ? (wx: number, oy: number, ny: number): number | null => {
            let best: number | null = null;
            const tx = Math.floor(wx / TILE);
            const ty0 = Math.max(1, Math.floor((oy - 2) / TILE));
            const ty1 = Math.min(this.level.h - 1, Math.floor((ny + 2) / TILE));
            for (let ty = ty0; ty <= ty1; ty++) {
              const t = officeTileAt(this.level, tx, ty);
              const above = officeTileAt(this.level, tx, ty - 1);
              if (above === OT_WALL || above === OT_GLASS) continue; // tembok vertikal BUKAN lantai pijakan!
              const surfY = ty * TILE;
              if (t === OT_WALL && oy <= surfY + 10) { best = surfY; break; }
              if (t === OT_FLOOR && oy <= surfY + 7) { best = surfY; break; }
            }
            const tableY = sideTableSurfaceY(this.props, wx, oy, ny, false);
            if (tableY !== null && (best === null || tableY < best)) best = tableY;
            return best;
          }
        : undefined;
      const sideGlassHit = this.level.sideView
        ? (wx: number, wy: number, sp: number): boolean => {
            if (sp < 135) return false;
            const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
            if (officeTileAt(this.level, tx, ty) === OT_GLASS) {
              const posG = shatterOfficeGlassTile(this.level, this.officeLook.on ? null : this.levelCanvas, tx, ty);
              if (posG) {
                this.particles.burst(posG.x, posG.y, 16, '#7ce8ff', 190, 0.55, 2, 2);
                this.sfx.glassTink();
                this.shake(0.22);
                this.texts.hit(posG.x, posG.y - 10, 'SMASH!', '#7ce8ff', 1, 0.55);
                return true;
              }
            }
            return false;
          }
        : undefined;
      if (c.rd) {
        const rd = c.rd;
        this.grab.pre(this, c);
        rd.update(dt, (wx, wy) => solidAt(this.level, wx, wy), sideFloor, sideGlassHit);
        this.grab.post(this, c);
        for (const im of rd.impacts) {
          if (im.kind === 'ground') {
            this.particles.smoke(im.x, im.y, im.speed > 300 ? 4 : 2, '#8a8a8a', 22, 0.32);
            this.splat(im.x, im.y, im.speed > 300 ? 4 : 2);
            if (im.speed > 260) { this.sfx.land(); this.shake(Math.min(0.34, im.speed / 1400)); }
            if (im.speed > 430) { this.particles.ring(im.x, im.y, 2, 9, '#ffffff', 0.13, 1); this.hitstop = Math.max(this.hitstop, 0.018); }
          } else {
            this.splat(im.x, im.y - 4, 8, '#8a0000', true);
            this.blood.spray(im.x, im.y - 4 - im.z, Math.atan2(c.vy, c.vx) + Math.PI, 2.4, true);
            this.sfx.slam(); this.shake(Math.min(0.45, im.speed / 900));
          }
        }
        // darah menetes sepanjang tubuh yang menyeret di lantai
        const sp2 = rd.speed;
        if (sp2 > 90 && Math.random() < 0.4) this.blood.spray(rd.x, rd.y - 3 - rd.z, Math.atan2(c.vy, c.vx) + Math.PI, 0.5, false);
        if (sp2 > 200 && Math.random() < 0.25) this.particles.smoke(rd.x, rd.y, 1, '#9a9a9a', 14, 0.26);
        const hp0 = rd.pts[2];
        c.x = hp0.x; c.y = hp0.y; c.z = Math.max(0, hp0.z);
        c.vx = hp0.vx; c.vy = hp0.vy; c.vz = hp0.vz;
        c.sqx = 1; c.sqy = 1;
        rd.syncVX = c.vx; rd.syncVY = c.vy; rd.syncVZ = c.vz;
        rd.syncX = c.x; rd.syncY = c.y;
      }
      if (!c.rd && !this.level.sideView && (c.z > 0 || c.vz !== 0)) {
        c.vz -= 500 * dt;
        c.z += c.vz * dt;
        if (this.v2) {
          // game1: salto HANYA saat benar-benar di udara; begitu menyentuh lantai badan berhenti
          // berputar dan rotasinya meredah cepat (di-wrap dulu supaya tidak roll tambahan di tanah)
          if (c.z > 0.5) c.rot += c.spin * dt;
          else { c.rot = Math.atan2(Math.sin(c.rot), Math.cos(c.rot)); c.rot *= Math.pow(0.001, dt); c.spin = 0; }
        } else c.rot += c.spin * dt;
        // bleeding while flying (a few drops)
        if (Math.random() < 0.18) this.blood.spray(c.x, c.y - 6 - c.z, Math.atan2(c.vy, c.vx) + Math.PI, 0.3, false);
        if (c.z <= 0) {
          c.z = 0;
          if (c.gib) { this.gibAt(c.x, c.y, c.color, c.scale, Math.atan2(c.vy, c.vx), 1.3); this.corpses.splice(i, 1); continue; }
          // ragdoll bounce: first impact bounces back up a little, then settles
          if (this.v2 ? (c.vz < -55 && c.bounces < 5) : (c.vz < -90 && c.bounces < 2)) {
            c.bounces++;
            c.vz = -c.vz * (this.v2 ? 0.52 : 0.35);           // game1: 0.52 = mayat memantul lebih hidup
            if (this.v2) { c.sqx = 1.4; c.sqy = 0.58; }
            c.vx *= this.v2 ? 0.78 : 0.6; c.vy *= this.v2 ? 0.78 : 0.6; c.spin *= this.v2 ? 0.8 : 0.6;
            this.particles.smoke(c.x, c.y, 3, '#888', 20, 0.3); this.splat(c.x, c.y, 3); this.sfx.land();
            continue;
          }
          c.vz = 0; c.spin = 0;
          if (!this.v2) c.rot = Math.round(c.rot / Math.PI) * Math.PI; // V1: lies flat
          this.particles.smoke(c.x, c.y, 4, '#888', 25, 0.4);
          this.blood.pool(c.x, c.y + 1, 4 + c.scale);
        }
      }
      if (!c.rd && this.level.sideView) {
        if (c.z > 0 || c.vz > 0) { c.vy = Math.min(c.vy, -Math.max(40, c.vz * 0.7)); c.z = 0; c.vz = 0; }
        c.vy += 520 * dt;
      }
      if (!c.rd && this.v2 && c.z <= 0 && c.vz === 0) c.rot *= Math.pow(0.001, dt);  // game1: bodies settle upright
      if (!c.rd && (Math.abs(c.vx) + Math.abs(c.vy) > 1 || this.level.sideView)) {
        const o = { x: c.x, y: c.y, r: 3 };
        const sideM = this.level.sideView
          ? moveSideView(this.level, o, c.vx * dt, c.vy * dt, false, this.props)
          : null;
        const m = sideM ?? moveWithCollision(this.level, o, c.vx * dt, c.vy * dt);
        c.x = o.x; c.y = o.y;
        const sp = Math.hypot(c.vx, c.vy);
        if (sideM && sideM.hitGlass.length > 0 && sp > 130) {
          for (const gt of sideM.hitGlass) {
            const posG = shatterOfficeGlassTile(this.level, this.officeLook.on ? null : this.levelCanvas, gt.tx, gt.ty);
            if (posG) {
              this.particles.burst(posG.x, posG.y, 14, '#7ce8ff', 175, 0.5, 2, 2);
              this.sfx.glassTink();
              this.shake(0.18);
            }
          }
        }
        if ((m.bx || (!this.level.sideView && m.by)) && sp > 160) {
          // body slams the wall: blood splatter on the wall, body drops
          const wx = c.x + (m.bx ? Math.sign(c.vx) * 7 : 0), wy = c.y - 6 + (m.by ? Math.sign(c.vy) * 7 : 0);
          this.splat(wx, wy, 14, '#8a0000', true);
          this.blood.spray(c.x, c.y - 6 - c.z, Math.atan2(-c.vy, -c.vx), 3, true);
          this.shake(Math.min(0.6, sp / 500)); this.sfx.slam();
          if (c.gib) { this.gibAt(c.x, c.y, c.color, c.scale, Math.atan2(-c.vy, -c.vx), 1.4); this.say('SPLAT!', '#ff3b3b', 2, 0.8); this.corpses.splice(i, 1); continue; }
          c.vz = Math.min(c.vz, 20);
        }
        const cb = this.v2 ? -0.55 : -0.3;                    // game1: corpse rebound 0.55
        if (m.bx) c.vx *= cb;
        if (m.by) c.vy = this.level.sideView ? 0 : c.vy * cb;
        if (this.v2 && (m.bx || (!this.level.sideView && m.by)) && sp > 230) {
          c.spin *= 0.85; c.sqx = 1.3; c.sqy = 0.7;
          this.particles.spark(c.x, c.y - 6 - c.z, 5, '#ffffff', Math.atan2(-c.vy, -c.vx), 1.2, 130);
          if (Math.random() < 0.5) this.texts.hit(c.x, c.y - 18 - c.z, 'BONK!', '#ffffff', 1, 0.5);
        }
        const f = Math.max(0, 1 - (c.z > 0 ? 0.4 : this.v2 ? 7.7 : 6) * dt); c.vx *= f; if (!this.level.sideView) c.vy *= f;  // V2: game1's 0.88/frame ground grip
      }
      // V2 (game1): running through a loose body kicks it out of the way instead of gliding over it
      if (this.v2 && c.z < 6 && this.state === 'playing' && !this.grab.isHeld(c)) {
        const pl = this.player;
        if (this.level.sideView) {
          if ((c.cd ?? 0) <= 0 && Math.abs(pl.vx) > 55 && Math.abs(c.x - pl.x) < pl.r + 7 && Math.abs(c.y - (pl.y - 5)) < 12) {
            const sx = c.x >= pl.x ? 1 : -1;
            c.vx = pl.vx * 1.05 + sx * 45;
            c.vy = -55;
            c.vz = 0;
            c.spin += rnd(-5, 5);
            c.cd = 0.25;
            c.sqx = 1.25; c.sqy = 0.75;
            this.particles.smoke(c.x, c.y, 2, '#888', 20, 0.3);
            if (Math.random() < 0.35) this.sfx.land();
          }
        } else {
          const ps = Math.hypot(pl.vx, pl.vy);
          const d = dist(c.x, c.y, pl.x, pl.y);
          if (ps > 55 && d < pl.r + 7 && d > 0.01) {
            const a = Math.atan2(c.y - pl.y, c.x - pl.x);
            c.vx = pl.vx * 1.3 + Math.cos(a) * 55; c.vy = pl.vy * 1.3 + Math.sin(a) * 55;
            c.vz = Math.max(c.vz, 60); c.spin += rnd(-6, 6); c.bounces = 0;
            c.sqx = 1.25; c.sqy = 0.75;
            this.particles.smoke(c.x, c.y, 2, '#888', 20, 0.3);
            if (Math.random() < 0.35) this.sfx.land();
          }
        }
      }
      // V2 (game1): a fast-flying body bowls over live enemies — momentum transfers, so flights
      // stay short and funny instead of rocketing across the arena
      if (this.v2 && c.z < 8 && (c.cd ?? 0) <= 0 && this.state === 'playing' && !this.grab.isHeld(c)) {
        const cspd = Math.hypot(c.vx, c.vy);
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0 || e.boss) continue;
          if (this.level.sideView) {
            if (Math.abs(c.x - e.x) > (e.r ?? 6) + 6 || Math.abs(c.y - (e.y - 5)) > 14) continue;
          } else {
            const d = dist(c.x, c.y, e.x, e.y);
            if (d > (e.r ?? 6) + 6 || d < 0.01) continue;
          }
          const a2 = Math.atan2(e.y - c.y, e.x - c.x);
          if (cspd > 130) {
            e.hp = Math.max(1, e.hp - 8); e.flash = 0.12;
            e.sqx = 1.35; e.sqy = 0.65;
            if (this.level.sideView) {
              const sx = e.x >= c.x ? 1 : -1;
              e.kx = c.vx * 0.5 + sx * 85; e.ky = 0;
              e.svVy = -Math.min(120, 55 + cspd * 0.1);
              e.svGrounded = false;
            } else {
              e.kx = c.vx * 0.62 + Math.cos(a2) * 95; e.ky = c.vy * 0.62 + Math.sin(a2) * 95;
              const ksp = Math.hypot(e.kx, e.ky); if (ksp > 320) { e.kx = e.kx / ksp * 320; e.ky = e.ky / ksp * 320; }
              e.z = Math.max(e.z, 0.1); e.vz = Math.min(120, 55 + cspd * 0.1);
            }
            e.down = 0; e.stun = 0; e.state = 'air'; e.pose = 'launched';
            this.texts.hit(e.x, e.y - 26, 'BODY CHECK!', this.pal.accent, 1, 0.6);
            this.sfx.slam(); this.shake(0.25); this.hitstop = Math.max(this.hitstop, 0.02);
            this.blood.spray(e.x - Math.cos(a2) * (e.r ?? 6), e.y - 5, a2, 4, false);
            c.vx *= 0.4; c.vy *= 0.4; c.spin *= 0.55; c.cd = 0.32;
          } else if (!this.level.sideView) {
            c.vx = Math.cos(a2) * e.speed * 0.9 + e.vx; c.vy = Math.sin(a2) * e.speed * 0.9 + e.vy;
            c.vz = Math.max(c.vz, 26); c.spin += rnd(-4, 4); c.cd = 0.3;
          }
          break;
        }
      }
    }
    // V2 (game1): corpse vs corpse — bouncy pile-ups instead of overlapping planks
    if (this.v2) {
      for (let i = 0; i < this.corpses.length; i++) for (let j = i + 1; j < this.corpses.length; j++) {
        const a = this.corpses[i], b = this.corpses[j];
        if (Math.abs(a.z - b.z) > 16) continue;
        if (this.level.sideView && Math.abs(a.y - b.y) > 12) continue;
        const dx = b.x - a.x, dy = this.level.sideView ? 0 : b.y - a.y, d = Math.hypot(dx, dy) || 0.01, min = 11;
        if (d >= min) continue;
        const nx = dx / d, ny = dy / d, push = (min - d) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) {
          const imp = -rel * 0.72;
          a.vx -= nx * imp; a.vy -= ny * imp; b.vx += nx * imp; b.vy += ny * imp;
          a.spin += rnd(-3.5, 3.5); b.spin += rnd(-3.5, 3.5);
          if (!this.level.sideView && a.z < 1 && b.z < 1) { a.vz = Math.max(a.vz, 18); b.vz = Math.max(b.vz, 18); }
          if (rel < -120) this.particles.smoke((a.x + b.x) / 2, a.y, 2, '#666', 20, 0.3);
        }
      }
    }
    // Teruskan semua dorongan dari interaksi gameplay ke ragdoll supaya tubuhnya
    // benar-benar bereaksi — bukan cuma angka kecepatan yang berubah.
    for (const c of this.corpses) {
      const rd = c.rd;
      if (!rd) continue;
      const dx = c.x - rd.syncX, dy = c.y - rd.syncY;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) rd.translate(dx, dy);
      const dvx = c.vx - rd.syncVX, dvy = c.vy - rd.syncVY, dvz = this.level.sideView ? 0 : (c.vz - rd.syncVZ);
      if (Math.abs(dvx) + Math.abs(dvy) + Math.abs(dvz) > 6) {
        rd.impulse(dvx, dvy, Math.max(0, dvz), c.spin * 0.12);
        rd.bounces = Math.min(rd.bounces, 20);
      }
      const hp0 = rd.pts[2];
      c.x = hp0.x; c.y = hp0.y; c.z = this.level.sideView ? 0 : Math.max(0, hp0.z);
    }
  }

  // ------------------------------------------------------------------ player
  updatePlayer(dt: number) {
    const p = this.player;
    if (REMOVED_WEAPONS.includes(p.weapon)) { p.weapon = 'fist'; this.pushUI(); }
    const inp = this.input;
    const raw = this.rawDt;
    if (p.weapon === 'foot') {
      this.footwork.clock += dt;
      this.updateFootUI();
      if (p.airMagnet) this.readFootInputs();
    }
    if (p.weapon === 'scythe') this.scythe.clock += dt;
    for (const k of ['dashCd', 'parryCd', 'iframes', 'flash', 'stunT', 'shootT', 'holdT'] as const) if (p[k] > 0) p[k] -= dt;
    p.fireCd = Math.max(-1, p.fireCd - dt);
    p.sinceDash += dt;
    if (p.bloom > 0) p.bloom = Math.max(0, p.bloom - dt * 0.25);
    if (p.muzzle > 0) p.muzzle -= raw;
    const mw = this.mouseWorld();
    if (!p.fatality && !p.focusDash && !this.silat) {
      if (p.ofaActive && this.lockTarget && !this.lockTarget.dead) p.aim = Math.atan2(this.lockTarget.y - (p.y - 6), this.lockTarget.x - p.x);
      else p.aim = Math.atan2(mw.y - (p.y - 6), mw.x - p.x);
      if ((p.attackPhase === 'windup' || p.attackPhase === 'active' || (p.weapon === 'foot' && p.attackPhase === 'recover')) && !(p.weapon === 'yoyo' && this.yoyoVer === 2)) p.aim = p.attackAim;
      if (p.weapon === 'yoyo' && this.yoyoVer === 2 && p.attackPhase !== 'none' && p.moveKey && MOVES[p.moveKey].yoyo) {
        const autoAim = inp.mouseMovedAt === 0 || performance.now() - inp.mouseMovedAt > 1500;
        const target = autoAim ? this.nearestEnemy(p.x, p.y, 120) : this.nearestEnemy(p.x, p.y, 110, p.aim, 0.65);
        if (target) {
          const targetAngle = Math.atan2(target.y - p.y, target.x - p.x);
          p.aim += angleDiff(targetAngle, p.aim) * (autoAim ? 1 : 0.35);
        }
      }
    }
    // Facing: while running with fists the body faces the direction of travel (otherwise the run cycle
    // reads as "running backwards" whenever the cursor is behind you). Guns, attacks and finishers face the aim.
    const side = !!this.level.sideView;
    const bodyFacesTravel = (p.weapon === 'fist' || p.weapon === 'foot') && !p.fatality && !p.focusDash && p.attackPhase === 'none' && p.dashT <= 0 && p.moving && (side ? Math.abs(p.vx) > 6 : Math.hypot(p.vx, p.vy) > 30);
    if (bodyFacesTravel) { if (Math.abs(p.vx) > 4) p.facing = p.vx >= 0 ? 1 : -1; }
    else p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
    // the body's pose aims along the travel direction while running (fists); the head/eyes still track the cursor
    p.bodyAim = bodyFacesTravel
      ? (side ? (p.facing >= 0 ? 0 : Math.PI) : Math.atan2(p.vy, p.vx))
      : (side && p.attackPhase === 'none' ? (p.facing >= 0 ? 0 : Math.PI) : p.aim);

    if (p.fatality) { this.updateFatality(raw); return; }
    if (this.silat) { this.updateSilat(dt); return; }
    if (this.silatCd > 0) this.silatCd -= dt;
    if (this.silatLinkT > 0) { this.silatLinkT -= dt; if (this.silatLinkT <= 0) this.silatChainN = 0; }
    if (p.focusDash) {
      const fd = p.focusDash;
      fd.t += raw / 0.14;
      const k = Math.min(1, fd.t);
      const ek = 1 - Math.pow(1 - k, 3);
      p.x = lerp(fd.sx, fd.tx, ek); p.y = lerp(fd.sy, fd.ty, ek);
      this.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: p.aim, scale: 1 }, this.pal.accent, p.lean);
      if (k >= 1) {
        p.focusDash = null;
        const e = this.enemies.find((en) => en.id === fd.id);
        if (e) p.aim = Math.atan2(e.y - p.y, e.x - p.x);
        if (p.weapon === 'foot') this.startFootInput({ input: 'H', airborne: false, momentum: false, backKick: false, rising: true });
        else this.startAttack('FOCUS');
      }
      return;
    }
    if (p.airMagnet) {
      const am = p.airMagnet;
      const target = this.enemies.find((en) => en.id === am.id);
      if (!target || target.dead) {
        p.airMagnet = null;
        p.airLockId = -1;
        this.startAttack(am.key);
      } else {
        am.t += raw / am.dur;
        const k = Math.min(1, am.t);
        const ek = 1 - Math.pow(1 - k, 2.5);
        const mv = MOVES[am.key];
        const gap = Math.max(9, Math.min(15, (mv?.range || 20) * this.stats.meleeRange * 0.62));
        const a = Math.atan2(target.y - p.y, target.x - p.x);
        const hSide = target.x >= am.sx ? 1 : -1;
        const destX = side ? target.x - hSide * gap : target.x - Math.cos(a) * gap;
        const destY = side ? target.y - (footMove(mv) ? 3 : 0) : target.y - Math.sin(a) * gap;
        const nx = lerp(am.sx, destX, ek);
        const ny = lerp(am.sy, destY, ek);
        if (side) {
          moveSideView(this.level, p, nx - p.x, ny - p.y, true, this.props);
          p.svVy = 0; p.svGrounded = false; p.airborne = true;
        } else {
          if (this.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; }
          p.z = lerp(am.sz, Math.max(4, target.z), ek);
          p.vz = 0; p.airborne = true;
        }
        p.aim = side ? (hSide >= 0 ? 0 : Math.PI) : a;
        p.attackAim = p.aim;
        p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
        p.iframes = Math.max(p.iframes, 0.12);
        this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'flying', poseT: 0.4 }, '#7ce7ff', p.lean);
        this.particles.lines(p.x, p.y - 6 - p.z, 1, '#bdeeff', p.aim + Math.PI, 150);
        if (k >= 1) {
          p.airMagnet = null;
          p.airLockId = target.id;
          p.aim = side ? (target.x >= p.x ? 0 : Math.PI) : Math.atan2(target.y - p.y, target.x - p.x);
          p.attackAim = p.aim;
          p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
          if (side) p.svVy = -45;
          else p.vz = 45;
          const queuedFoot = p.weapon === 'foot' ? p.buffered : null;
          this.startAttack(am.key);
          if (queuedFoot) p.buffered = queuedFoot;
        }
        return;
      }
    }

    // ---- movement & running
    const rawIx = (inp.key('d') || inp.key('arrowright') ? 1 : 0) - (inp.key('a') || inp.key('arrowleft') ? 1 : 0);
    const rawIy = (inp.key('s') || inp.key('arrowdown') ? 1 : 0) - (inp.key('w') || inp.key('arrowup') ? 1 : 0);
    let ix = rawIx;
    let iy = side ? 0 : rawIy;
    let il = Math.hypot(ix, iy);
    if (il === 0 && inp.mouse.mdown) {
      ix = side ? Math.sign(Math.cos(p.aim)) : Math.cos(p.aim);
      iy = side ? 0 : Math.sin(p.aim);
      il = Math.hypot(ix, iy);
    }
    if (il > 0) { ix /= il; iy /= il; }
    const attacking = p.attackPhase !== 'none';
    const move = attacking && p.moveKey ? MOVES[p.moveKey] : null;
    const rising = p.weapon === 'foot' && !!footMove(move)?.foot.launcher;
    const waitingForLaunch = rising || (p.weapon === 'foot' && this.footwork.launchPending);
    if (waitingForLaunch && inp.hit(' ')) { this.footwork.bufferJump(this.tempo); this.scythe.bufferJump(this.tempo); }
    const followLaunch = rising && (p.weapon === 'scythe' ? this.scythe.jumpQueued && this.scythe.confirmed : this.footwork.jumpQueued && this.footwork.confirmed);
    const jumpPressed = (!waitingForLaunch && inp.hit(' ')) || followLaunch;
    if (followLaunch && p.attackPhase === 'active') { p.attackPhase = 'recover'; p.attackT = move!.recover * .5; }
    const traveling = !!(move && move.travel && p.attackPhase === 'active');
    const frozen = p.stunT > 0 || p.holdT > 0;
    const sprintBefore = clamp((p.runT - 0.08) / 0.3, 0, 1);

    // ---- Taekwondo flying side kick: RUN + LEFT CLICK (handled in startAttackInput); cooldown ticks here
    if (p.tkdCd > 0) p.tkdCd -= dt;
    if (this.ippoGuardT > 0) this.ippoGuardT -= dt;
    void sprintBefore;
    if (il > 0) p.lean = { x: ix, y: iy };
    // ---- ANCIK / PUTAR BALIK / REM: keputusan diambil SEBELUM kecepatan diterapkan ----
    // Gigi gerak: diam -> ancik -> JALAN (WALK_T) -> pindah gigi (SURGE_T) -> LARI.
    const WALK_T = 0.085, SURGE_T = 0.04, RUN_RAMP = 0.14;
    const WALK_SPD = 98, RUN_SPD = 205;
    const grounded = !p.airborne && p.dashT <= 0 && !frozen && !attacking && p.stunT <= 0;
    const spdNow = Math.hypot(p.vx, p.vy);
    if (il > 0 && grounded) {
      if (!p.hadInput && spdNow < 26 && p.startT <= 0 && p.pivotT <= 0) {
        // mulai dari diam: ancik singkat & responsif
        p.startT = 0.032;
        p.pivotDir = { x: ix, y: iy };
        p.gearRun = false; p.surgeT = 0;
        this.particles.smoke(p.x, p.y, 2, this.level.outdoor ? '#7fae55' : '#8a8378', 12, 0.2);
      } else if (spdNow > 48 && p.pivotT <= 0) {
        const dl = Math.hypot(p.lastDir.x, p.lastDir.y) || 1;
        const dot = (ix * p.lastDir.x + iy * p.lastDir.y) / dl;
        if (dot < -0.35) {
          // balik arah mulus & cepat: bahu berputar tanpa terasa macet
          p.pivotT = 0.085; p.pivotDir = { x: ix, y: iy };
          p.brakeT = 0; p.surgeT = 0;
          const wasRunning = p.gearRun;
          p.gearRun = false;
          p.runT = wasRunning ? WALK_T * 0.82 : 0;
          this.particles.smoke(p.x, p.y, 3, this.level.outdoor ? '#7fae55' : '#9a9184', 22, 0.25);
          this.sfx.footstep(1);
        }
      }
    }
    // lepas tombol saat lari -> REM: tumit menancap dan badan meluncur (skid), bukan berhenti mati
    p.brakeCd -= dt;
    if (il === 0 && p.hadInput && !p.airborne && spdNow > 85 && p.brakeCd <= 0 && p.dashT <= 0 && p.attackPhase === 'none' && !frozen) {
      p.brakeT = 0.32; p.brakeCd = 0.4;
      this.particles.smoke(p.x, p.y, 4, '#9a8f7d', 18, 0.32);
      this.sfx.footstep(1);
    }
    p.hadInput = il > 0;
    if (il > 0 && !frozen && !attacking) p.lastDir = { x: ix, y: iy };
    if (il > 0 && !frozen) { if (!attacking && p.dashT <= 0 && p.startT <= 0 && p.pivotT <= 0) p.runT += dt; }
    else { p.runT = 0; p.gearRun = false; p.surgeT = 0; }
    // pindah gigi jalan -> lari: badan merunduk condong ke depan sesaat, lalu melesat
    if (il > 0 && !p.gearRun && p.runT >= WALK_T && !attacking && !p.airborne && p.dashT <= 0) {
      p.gearRun = true; p.surgeT = SURGE_T;
    }
    let surgePush = false;
    if (p.surgeT > 0) { p.surgeT -= dt; if (p.surgeT <= 0) surgePush = true; }
    const runStart = WALK_T + SURGE_T;
    const sprintRaw = p.gearRun && p.surgeT <= 0 ? clamp((p.runT - runStart) / RUN_RAMP, 0, 1) : 0;
    const sprint = sprintRaw * sprintRaw * (3 - 2 * sprintRaw);
    p.running = p.gearRun && p.surgeT <= 0 && p.runT > runStart + 0.06 && il > 0 && !frozen;
    if (p.running && !attacking && p.comboStr) p.comboStr = '';
    const airMul = p.airborne ? 0.75 : 1;
    const attackMobility = p.weapon === 'yoyo' && this.yoyoVer === 2 ? 0.9 : p.moveKey && MOVES[p.moveKey]?.bat ? 0.6 : p.attackPhase === 'recover' ? 0.55 : 0.25;
    // ancang-ancang menahan kaki sebentar, lalu melepas dengan tolakan
    let locoMul = 1;
    if (p.startT > 0) {
      p.startT -= dt;
      const u = 1 - Math.max(0, p.startT) / 0.045;
      locoMul = 0.45 + 0.55 * u * u;
      if (p.startT <= 0) {
        p.vx += p.pivotDir.x * 16; p.vy += p.pivotDir.y * 16;
        this.particles.smoke(p.x, p.y, 2, this.level.outdoor ? '#8dbd60' : '#9a9184', 18, 0.22);
      }
    }
    if (p.pivotT > 0) {
      p.pivotT -= dt;
      const u = 1 - Math.max(0, p.pivotT) / 0.11;
      locoMul = Math.min(locoMul, 0.42 + 0.58 * u * u);
    }
    if (p.surgeT > 0) locoMul = Math.min(locoMul, 0.94);
    if (surgePush && il > 0) {
      p.vx += ix * 24; p.vy += iy * 24;
      this.particles.smoke(p.x - ix * 3, p.y, 3, this.level.outdoor ? '#8dbd60' : '#9a9184', 26, 0.28);
      this.sfx.footstep(1);
    }
    p.locoAnticip += ((p.startT > 0 ? Math.max(0, p.startT) / 0.08 : 0) - p.locoAnticip) * Math.min(1, dt * 28);
    p.locoBrake += ((p.brakeT > 0 ? Math.min(1, Math.max(0, p.brakeT) / 0.32 * 1.45) : 0) - p.locoBrake) * Math.min(1, dt * 22);
    const surgeTarget = p.surgeT > 0 ? Math.sin((1 - p.surgeT / SURGE_T) * Math.PI * 0.5 + 0.35) : 0;
    p.locoSurge += (surgeTarget - p.locoSurge) * Math.min(1, dt * 28);
    const baseSpd = WALK_SPD + (RUN_SPD - WALK_SPD) * sprint;
    const spd = (attacking ? 158 * (1 + 0.35 * sprint) * attackMobility : baseSpd) * locoMul * this.stats.moveSpeed * (p.parryT > 0 ? 0.45 : 1) * (frozen ? 0 : 1) * this.carry.moveMul * this.grab.moveMul * this.gates.speedMul * this.gd.moveMul(p) * airMul * (p.weapon === 'bow' ? this.bow.moveMul : p.weapon === 'buster' ? this.bu.moveMul : (p.weapon === 'pistol' || p.weapon === 'rifle') ? this.guns.moveMul : 1) * (p.weapon === 'takamura' ? this.tak.moveMul : p.weapon === 'hayabusa' ? this.hay.moveMul : p.weapon === 'boxing' ? this.boxDef.speed : 1) * (this.level.outdoor ? 1 - pondDepth(this.level, p.x, p.y) * 0.32 : 1);
    // percepatan gesit & responsif
    const tvx = ix * spd, tvy = iy * spd;
    const speedingUp = Math.hypot(tvx, tvy) > spdNow;
    const accel = p.airborne ? 11.5 : p.brakeT > 0 ? 10.5 : speedingUp ? 16.5 : 19.0;
    const k = 1 - Math.exp(-accel * dt);
    p.vx = lerp(p.vx, tvx, k);
    p.vy = lerp(p.vy, tvy, k);
    p.moving = il > 0 && !frozen;
    // walk cycle advances with actual ground speed so feet never slide
    const gspd = Math.hypot(p.vx, p.vy);
    // ANIME BRAKE (cadangan): berhenti mendadak dari lari -> pose skid + debu di kaki
    p.brakeT = Math.max(0, p.brakeT - dt);
    if (!p.airborne && p.prevSpd > 115 && gspd < 55 && p.brakeCd <= 0 && p.dashT <= 0 && p.attackPhase === 'none' && il === 0) {
      p.brakeT = 0.25; p.brakeCd = 0.38;
      this.particles.smoke(p.x, p.y, 3, '#9a8f7d', 14, 0.3);
    }
    p.prevSpd = Math.max(gspd, p.prevSpd - 165 * dt);
    // Kadens langkah gesit & natural: kaki memompa sigap sesuai kecepatan jalan & lari
    const onStairGait = side && officeOnStairs(this.level, p.x, p.y) && rawIy !== 0 && !attacking && !frozen && p.dashT <= 0 && !p.airborne;
    const gaitSpd = side ? Math.max(Math.abs(p.vx), onStairGait && !p.svGrounded ? Math.abs(p.svVy ?? rawIy * 132) * 0.85 : 0) : gspd;
    if (!p.airborne && gaitSpd > 5) {
      const gaitRun = clamp((gaitSpd - WALK_SPD) / (RUN_SPD - WALK_SPD), 0, 1);
      p.gaitRun += (gaitRun - p.gaitRun) * Math.min(1, dt * 14);
      const gc = gaitCadence(gaitSpd, p.gaitRun, 1);
      p.strideHalf += (gc.stride - p.strideHalf) * Math.min(1, dt * 14);
      const previousStep = Math.floor(p.walk / Math.PI);   // kontak telapak = kelipatan PI
      const moved = side
        ? Math.min(14, Math.max(Math.abs(p.x - this.gaitPX), onStairGait ? Math.abs(p.y - this.gaitPY) * 0.75 : 0))
        : Math.min(14, Math.hypot(p.x - this.gaitPX, p.y - this.gaitPY));
      const distStep = moved * gc.duty / Math.max(1.5, p.strideHalf) * gc.phaseK;
      const cadStep = gc.stepsPerSec * dt * 1.12;
      p.walk += Math.PI * Math.max(distStep, cadStep);
      const currentStep = Math.floor(p.walk / Math.PI);
      if (p.dashT <= 0 && !inp.hit('shift') && currentStep > previousStep && p.brakeT <= 0) {
        this.sfx.footstep(sprint);
        // debu kecil HANYA saat telapak menapak (lari), tidak berlebihan
        if (p.gaitRun > 0.45 && !attacking) this.particles.smoke(p.x - Math.sign(p.vx || p.facing) * 2, p.y + 1, 1, '#9a9a9a', 8 + 7 * p.gaitRun, 0.2);
      }
    }
    else if (!p.moving && gaitSpd <= 6) { p.strideHalf += (2.4 - p.strideHalf) * Math.min(1, dt * 10); p.gaitRun += (0 - p.gaitRun) * Math.min(1, dt * 8); } // fase kaki dibekukan (bukan di-reset) supaya blend ke idle halus
    this.gaitPX = p.x; this.gaitPY = p.y;
    if (p.moving && !attacking && p.dashT <= 0 && !p.airborne) {
      p.dustT -= dt;
      if (p.dustT <= 0) { p.dustT = 0.16 - 0.07 * sprint; }
      if (sprint >= 1 && Math.random() < 0.35) this.particles.lines(p.x - p.lean.x * 7, p.y - 6 - p.lean.y * 4, 1, 'rgba(255,255,255,0.55)', Math.atan2(-p.lean.y, -p.lean.x), 140);
    }

    // ---- JUMP & PARKOUR (space): zig-zag stair climb, stair leap, desk vault, ledge hop & drop-through in side-view
    if (p.landT > 0) p.landT -= dt;
    if (p.jumpCd > 0) p.jumpCd -= dt;
    // Durasi ancang-ancang (Prinsip Anticipation): ~2 frame (0.036s @ 60fps) membungkuk rendah sebelum menolak lantai
    const JUMP_ANT_DUR = 0.036;
    const antStep = Math.min(this.rawDt || dt, 0.025);
    if (side) {
      if (p.svDropT && p.svDropT > 0) p.svDropT = Math.max(0, p.svDropT - dt);
      if (p.svCoyoteT && p.svCoyoteT > 0) p.svCoyoteT = Math.max(0, p.svCoyoteT - dt);
      if (p.svJumpBufT && p.svJumpBufT > 0) p.svJumpBufT = Math.max(0, p.svJumpBufT - dt);
      const inAcroLift = attacking && (!!move?.jump || move?.pose === 'cartwheelkick') && !move?.air && p.attackPhase === 'active';
      if (p.vz > 0) { p.svVy = -Math.max(p.vz * 0.85, 118); p.svGrounded = false; p.z = 0; p.vz = 0; }
      else if (!inAcroLift) p.z = 0;

      // Selesaikan fase ancang-ancang lompatan (1-2 frame membungkuk rendah -> meledak melompat ke udara!)
      if ((p.svJumpAntT ?? 0) > 0) {
        if (p.stunT > 0 || p.holdT > 0 || p.dashT > 0 || attacking) {
          p.svJumpAntT = 0; p.svJumpAntCfg = null;
        } else {
          p.svJumpAntT = Math.max(0, (p.svJumpAntT ?? 0) - antStep);
          p.squash = 0.74;
          p.svVy = 0;
          if (p.svJumpAntT <= 0 && p.svJumpAntCfg) {
            const cfg = p.svJumpAntCfg;
            p.svJumpAntCfg = null;
            p.svGrounded = false;
            p.svCoyoteT = 0;
            p.svJumpBufT = 0;
            p.airborne = true;
            p.svVy = cfg.vy;
            p.kx += cfg.kx;
            p.jumpT = 0;
            // Stretch vertikal sesaat saat menolak lantai agar lompatan terasa meledak & bertenaga!
            p.squash = 1.22;
            p.blend = 0;
            this.sfx.whoosh();
            this.particles.smoke(p.x, p.y, 5, '#9a9a9a', 26, 0.34);
            this.particles.dirBurst(p.x, p.y, 6, '#dcdcdc', Math.PI / 2, 1.25, 68, 0.3);
            this.particles.ring(p.x, p.y - 2, 2, cfg.ring ? 13 : 9, cfg.ring ? this.pal.accent2 : '#ffffff', 0.16, 1, true);
          }
        }
      }

      const queueSideJump = (vy: number, kx: number, cd: number, ring = false) => {
        p.jumpCd = cd;
        p.svCoyoteT = 0;
        p.svJumpBufT = 0;
        p.svJumpAntMax = JUMP_ANT_DUR;
        p.svJumpAntT = JUMP_ANT_DUR;
        p.svJumpAntCfg = { vy, kx, ring };
        p.squash = 0.74;
        p.blend = 0;
        p.attackPhase = 'none'; p.buffered = null; p.parryT = 0;
        this.particles.smoke(p.x, p.y + 1, 2, '#8f8f8f', 14, 0.22);
      };

      // Gently pull onto a nearby stair entrance when pressing W/S right beside the staircase
      let onStair = officeOnStairs(this.level, p.x, p.y);
      if (!onStair && rawIy !== 0 && !attacking && p.stunT <= 0 && p.holdT <= 0 && p.dashT <= 0 && (p.svJumpAntT ?? 0) <= 0) {
        const nearStairX = officeFindNearbyStairX(this.level, p.x, p.y, rawIy > 0, 22);
        if (nearStairX !== null) {
          p.x += clamp(nearStairX - p.x, -4, 4);
          onStair = officeOnStairs(this.level, p.x, p.y);
        }
      }

      const onElev = officeOnElev(this.level, p.x, p.y);
      const onTable = sideTableSupportY(this.props, p.x, p.y) !== null;
      const wantDrop = rawIy > 0 && jumpPressed && !followLaunch;
      if (p.svGrounded && !wantDrop && (p.svJumpAntT ?? 0) <= 0) p.svCoyoteT = 0.11;
      if (jumpPressed && !wantDrop) p.svJumpBufT = 0.11;
      const onOneWay = officeTileAt(this.level, Math.floor(p.x / TILE), Math.floor(p.y / TILE)) === OT_FLOOR;
      const nearParkourProp = !onTable
        ? this.props.find((pr) => !pr.dead && (pr.kind === 'table' || pr.kind === 'crate') && Math.abs(pr.x - p.x) < 17 && Math.abs(pr.y - p.y) < 12)
        : undefined;

      // Auto parkour vault hop when sprinting or dashing horizontally into an office desk / crate
      if (
        (p.svJumpAntT ?? 0) <= 0 &&
        nearParkourProp &&
        p.svGrounded &&
        p.jumpCd <= 0 &&
        p.stunT <= 0 &&
        p.holdT <= 0 &&
        !attacking &&
        (sprint > 0.65 || p.dashT > 0) &&
        ix * (nearParkourProp.x - p.x) > 0
      ) {
        queueSideJump(-150, Math.sign(ix || p.facing) * 72, 0.28, true);
      } else if (wantDrop && (onOneWay || onTable) && p.svGrounded) {
        p.svJumpAntT = 0; p.svJumpAntCfg = null;
        p.svDropT = 0.26;
        p.svGrounded = false;
        p.svCoyoteT = 0;
        p.svJumpBufT = 0;
        p.airborne = true;
        p.svVy = 50;
        p.jumpCd = 0.16;
      } else if ((p.svJumpAntT ?? 0) <= 0 && onElev && (rawIy < 0 || (p.svJumpBufT ?? 0) > 0) && (p.svGrounded || (p.svVy ?? 0) > -60) && p.jumpCd <= 0 && p.stunT <= 0 && p.holdT <= 0) {
        queueSideJump(-285, 0, 0.28, true);
      } else if ((p.svJumpAntT ?? 0) <= 0 && (p.svJumpBufT ?? 0) > 0 && (p.svGrounded || (p.svCoyoteT ?? 0) > 0 || onStair) && !wantDrop && p.jumpCd <= 0 && p.stunT <= 0 && p.holdT <= 0 && p.dashT <= 0 && !traveling && (!rising || p.attackPhase === 'recover')) {
        // Ancang-ancang membungkuk rendah 1-2 frame sebelum melompat dari lantai, meja, atau tangga!
        const vaultingDesk = !!nearParkourProp && ix * (nearParkourProp.x - p.x) > 0;
        const jVy = onStair ? -252 : vaultingDesk ? -232 : -242;
        const jKx = onStair ? (ix !== 0 ? ix : p.facing) * 145 : vaultingDesk ? ix * 116 : ix * 28;
        queueSideJump(jVy, jKx, 0.24, onStair || vaultingDesk);
        if (followLaunch) { this.footwork.clearJump(); this.scythe.clearJump(); }
      }

      if ((p.svJumpAntT ?? 0) > 0) {
        p.svVy = 0;
      } else if (onStair && rawIy !== 0 && !attacking && p.stunT <= 0 && p.holdT <= 0 && p.dashT <= 0 && !p.airborne) {
        const sp = officeStairSpan(this.level, p.x, p.y);
        const floorSnap = officeFloorSupportY(this.level, p.x, p.y, p.r, false);
        if (rawIy < 0 && sp && p.y <= sp.sy0 * TILE + 1) {
          // Arrived cleanly at top stair landing — hold at floor height so player steps off easily
          p.y = sp.sy0 * TILE;
          p.svVy = 0;
          p.svGrounded = true;
          p.airborne = false;
        } else if (Math.abs(ix) > 0.25 && floorSnap !== null && Math.abs(floorSnap - p.y) <= 5) {
          // Smooth horizontal exit onto floor landing without snagging on stair climb
          p.y = floorSnap;
          p.svVy = 0;
          p.svGrounded = true;
          p.airborne = false;
        } else {
          // Climb/descend: feet follow the drawn treads exactly (no floating in front of the stair glass)
          const path = officeStairPath(this.level, p.x, p.y);
          if (path) {
            const pr = stairPathProject(path, p.x, p.y);
            const ns = clamp(pr.s - rawIy * 92 * dt, 0, pr.total);
            const at = stairPathAt(path, ns);
            p.x = at.x; p.y = at.y + (ns >= pr.total && rawIy < 0 ? -1.5 : ns <= 0 && rawIy > 0 ? 1.5 : 0);
            p.vx = 0; p.kx = 0; p.svVy = 0;
            if (at.dir !== 0) p.facing = (rawIy < 0 ? at.dir : -at.dir) as 1 | -1;
           
          } else p.svVy = rawIy * 132;
          p.svDropT = 0.22;
          p.svGrounded = false;
          p.airborne = false;
          p.moving = true;
          if (!path && Math.abs(ix) < 0.25) {
            const zzX = officeStairZigZagX(this.level, p.x, p.y);
            if (zzX !== null) {
              const diffX = zzX - p.x;
              if (Math.abs(diffX) > 1) p.vx = clamp(diffX * 9, -110, 110);
            }
          }
        }
      } else if (p.dashT > 0) {
        p.svVy = 0;
      } else if (onStair && rawIy === 0 && !p.svGrounded && !p.airborne) {
        p.svVy = 0;
        // Berdiri di anak tangga: kaki ditempelkan ke permukaan anak tangga terdekat
        const path = officeStairPath(this.level, p.x, p.y);
        if (path) {
          const pr = stairPathProject(path, p.x, p.y);
          if (pr.dist < 10) { const at = stairPathAt(path, pr.s); p.x = at.x; p.y = at.y; p.vx = 0; }
        }
      } else if (!p.svGrounded) {
        p.svVy = Math.min(410, (p.svVy ?? 0) + 650 * dt);
      }

      if (p.airborne) {
        p.jumpT += dt;
        if (attacking && !move?.travel && (p.svVy ?? 0) > 18) p.svVy = lerp(p.svVy ?? 0, 18, 1 - Math.exp(-18 * dt));
        if (inp.mouse.pressed && !attacking && p.weapon !== 'fist' && p.weapon !== 'boxing') {
          const w = p.weapon;
          if (w === 'katana') this.launchAirAttack('KDASH');
          else if (w === 'dual') this.launchAirAttack('DDASH');
          else if (w === 'axe' && this.lev.mode === 'leap') { /* leap smash owns the air */ }
          else if (w === 'axe' && !this.lev.held) this.launchAirAttack('AIR');
          else if (w === 'axe') this.launchAirAttack('ADASH');
          else if (w === 'bat') this.launchAirAttack('BDASH');
          else if (w === 'buster') { this.bu.swing(this.time); this.launchAirAttack(this.bu.punisher ? 'PXAIR' : 'XAIR'); }
          else if (w === 'nunchaku') {
            if (this.sfNunOn) { this.sfNunAim = p.aim; this.sfNun.start(); this.sfx.swing(1.1); }
            else this.launchAirAttack('NDASH');
          }
          else if (w === 'yoyo' && this.yoyoVer === 2) this.launchAirAttack('YAIR');
        }
      }
    } else {
      if ((p.jumpAntT ?? 0) > 0) {
        if (p.stunT > 0 || p.holdT > 0 || p.dashT > 0 || attacking) {
          p.jumpAntT = 0;
        } else {
          p.jumpAntT = Math.max(0, (p.jumpAntT ?? 0) - antStep);
          p.squash = 0.74;
          if (p.jumpAntT <= 0) {
            p.airborne = true; p.vz = 166; p.jumpT = 0; p.squash = 1.22; p.blend = 0;
            this.sfx.whoosh();
            this.particles.smoke(p.x, p.y, 5, '#888', 25, 0.35);
            this.particles.dirBurst(p.x, p.y, 5, '#cfcfcf', Math.PI / 2, 1.2, 60, 0.3);
            this.particles.ring(p.x, p.y - 2, 2, 9, '#ffffff', 0.15, 1, true);
          }
        }
      }
      if (jumpPressed && !p.airborne && (p.jumpAntT ?? 0) <= 0 && p.jumpCd <= 0 && p.stunT <= 0 && p.holdT <= 0 && p.dashT <= 0 && !traveling && (!rising || p.attackPhase === 'recover')) {
        p.jumpCd = 0.55;
        if (followLaunch) { this.footwork.clearJump(); this.scythe.clearJump(); }
        p.jumpAntMax = JUMP_ANT_DUR; p.jumpAntT = JUMP_ANT_DUR; p.squash = 0.74; p.blend = 0;
        p.attackPhase = 'none'; p.buffered = null; p.parryT = 0;
        this.particles.smoke(p.x, p.y + 1, 2, '#8f8f8f', 14, 0.22);
      }
      if (p.airborne) {
        p.jumpT += dt;
        p.vz -= 486 * dt;
        if (attacking && !move?.travel && p.vz < -18) p.vz = lerp(p.vz, -18, 1 - Math.exp(-18 * dt));
        p.z += p.vz * dt;
        // air attack: non-fist/boxing weapons keep their air dash / dive specials
        if (inp.mouse.pressed && !attacking && p.z > 6 && p.weapon !== 'fist' && p.weapon !== 'boxing') {
          const w = p.weapon;
          if (w === 'katana') this.launchAirAttack('KDASH');
          else if (w === 'dual') this.launchAirAttack('DDASH');
          else if (w === 'axe' && this.lev.mode === 'leap') { /* leap smash owns the air */ }
          else if (w === 'axe' && !this.lev.held) this.launchAirAttack('AIR');
          else if (w === 'axe') this.launchAirAttack('ADASH');
          else if (w === 'bat') this.launchAirAttack('BDASH');
          else if (w === 'buster') { this.bu.swing(this.time); this.launchAirAttack(this.bu.punisher ? 'PXAIR' : 'XAIR'); }
          else if (w === 'nunchaku') {
            if (this.sfNunOn) { this.sfNunAim = p.aim; this.sfNun.start(); this.sfx.swing(1.1); }
            else this.launchAirAttack('NDASH');
          }
          else if (w === 'yoyo' && this.yoyoVer === 2) this.launchAirAttack('YAIR');
        }
        if (p.z <= 0 && p.vz < 0) {
          p.z = 0; p.vz = 0; p.airborne = false; p.airLockId = -1; p.landT = 0.12; p.squash = 0.72;
          this.sfx.land();
          this.particles.smoke(p.x, p.y, 5, '#888', 26, 0.4);
          this.shake(0.08);
          if (attacking && move?.air && !footMove(move) && (move.travel || move.finisher)) {
            p.attackPhase = 'recover'; p.attackT = move.recover; this.shake(0.3); this.particles.shockwave(p.x, p.y, 18, '#ffffff', 0.25);
            for (const e of this.enemies) { if (e.dead || e.spawnT > 0 || p.hitSet.includes(e.id)) continue; if (dist(p.x, p.y, e.x, e.y) > 18 + e.r) continue; p.hitSet.push(e.id); this.meleeHitEnemy(e, move, Math.atan2(e.y - p.y, e.x - p.x), { x: p.x + Math.cos(p.aim) * 6, y: p.y - 2 }); }
          }
        }
      }
    }
    p.squash = lerp(p.squash, 1, 1 - Math.exp(-16 * dt));

    // ---- SHADOW STEP (shift): fast i-frame dash, perfect-dodge rewards focus
    if (inp.hit('shift') && p.dashCd <= 0 && p.stunT <= 0 && p.holdT <= 0 && !traveling) {
      const dx = il > 0 ? ix : Math.cos(p.aim), dy = side ? 0 : (il > 0 ? iy : Math.sin(p.aim));
      const dl = Math.hypot(dx, dy) || 1;
      p.dashT = 0.15; p.dashCd = 0.55 * this.stats.dashCd; p.dashDir = { x: dx / dl, y: dy / dl }; p.lean = { x: dx / dl, y: dy / dl }; p.sinceDash = 0;
      p.attackPhase = 'none'; p.buffered = null; p.parryT = 0; p.airMagnet = null; p.airLockId = -1; p.iframes = Math.max(p.iframes, 0.22);
      if (p.weapon === 'foot') this.footwork.interrupt();
      p.prevPose = 'dash';
      this.sfx.dash();
      this.particles.smoke(p.x, p.y, 5, '#7a6aa0', 28, 0.4);
      this.particles.dirBurst(p.x, p.y, 7, '#c7b3ff', Math.atan2(-dy, -dx), 0.5, 90, 0.3);
      this.particles.ring(p.x, p.y - 6, 2, 10, '#c7b3ff', 0.18, 1);
      if (this.boxOn) {
        // Langkah masuk khas tinju: Ali menari meninggalkan bayangan, Tyson menyelip rendah,
        // Ippo menerjang lurus. Semua tetap memakai i-frame dash yang sama.
        const d = this.boxDef;
        const st = this.box.stance;
        p.dashT = st === 'ali' ? 0.19 : st === 'tyson' ? 0.17 : 0.15;
        p.iframes = Math.max(p.iframes, st === 'tyson' ? 0.34 : 0.24);
        this.sfx.shoeStep();
        this.particles.ring(p.x, p.y - 6, 2, 12, d.accent, 0.2, 1);
        const pose = st === 'ali' ? 'bx_float' : st === 'tyson' ? 'bx_roll' : 'bx_press';
        const n = st === 'ali' ? 3 : 2;
        for (let i = 1; i <= n; i++) {
          this.addAfterimage({ x: p.x - dx * i * 5, y: p.y - dy * i * 5, facing: p.facing, aim: p.aim, pose, poseT: i * 0.2 }, d.accent, { x: dx, y: dy });
        }
        for (let i = 0; i < 8; i++) {
          const q = Boxing.shuffleDust();
          this.particles.add({ x: p.x, y: p.y, vx: q.vx - dx * 40, vy: q.vy, life: q.life, c: this.level.outdoor ? '#6f9a4a' : d.gloveLight, k: 3, s: q.s, fr: 4 });
        }
        this.box.arc(p.x + dx * 6, p.y - 7, 9, p.aim - 1.0, p.aim + 1.0, d.accent, 0.18);
      }
      // perfect dodge: a bullet or an attack was about to land
      let perfect = false;
      for (const b of this.bullets) if (b.owner === 'enemy' && dist(b.x, b.y, p.x, p.y - 5) < 22) { perfect = true; break; }
      if (!perfect) for (const e of this.enemies) if (!e.dead && (e.state === 'windup' || e.state === 'attack' || e.state === 'lunge') && dist(e.x, e.y, p.x, p.y) < 36) { perfect = true; break; }
      if (perfect) {
        p.focus = Math.min(300, p.focus + 25 * this.stats.focusGain);
        this.say('SHADOW STEP!', '#c7b3ff', 1, 0.6);
        this.slow(0.18, 0.35);
        this.particles.ring(p.x, p.y - 6, 4, 18, '#ffffff', 0.25, 1);
      }
    }
    if (p.dashT > 0) {
      p.dashT -= dt;
      const ds = 420 * this.stats.dashDist;
      p.vx = p.dashDir.x * ds; p.vy = side ? 0 : p.dashDir.y * ds;
      this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, scale: 1 }, '#8f7bdc', p.lean);
      if (Math.random() < 0.6) this.particles.add({ x: p.x + rnd(-4, 4), y: p.y - 6 + rnd(-5, 5), vx: -p.dashDir.x * 40, vy: -p.dashDir.y * 40, life: 0.25, c: '#c7b3ff', k: 0, s: 1 });
    }

    if (inp.hit('[')) this.stepTempo(1);
    if (inp.hit(']')) this.stepTempo(-1);
    if (inp.hit('q')) this.cycleWeapon(1);
    // SCROLL MOUSE: di Foot Mode cukup menukar Foot Mode V1 <-> V2; di senjata lain tetap memutar senjata.
    if (inp.mouse.wheel !== 0) {
      this.cycleWeapon(inp.mouse.wheel > 0 ? 1 : -1);
    }
    if (inp.hit('1')) this.setWeapon('fist');
    if (inp.hit('o')) { if (p.weapon !== 'foot') this.setWeapon('foot'); }
    const shiftHeld = inp.key('shift') || performance.now() - inp.shiftUpAt < 140;
    if (inp.hit('g') && shiftHeld && p.weapon !== 'scythe') this.setWeapon('scythe');
    if (inp.hit('g') && shiftHeld && p.weapon === 'scythe') this.interruptScythe();
    if (inp.hit('2')) this.setWeapon('pistol');
    if (inp.hit('3') && p.hasRifle) this.setWeapon('rifle');
    if (inp.hit('4') && p.hasNunchaku) {
      if (p.weapon !== 'nunchaku') this.setWeapon('nunchaku');
      else if (this.sfNunOn && !this.sfNun.attacking) {
        this.sfNun.startFlourish();
        const flNames: Record<string, string> = {
          wrist: 'ATRAKSI: FIGURE-8 ROLL!',
          back: 'ATRAKSI: OPER PUNGGUNG!',
          toss: 'ATRAKSI: LEMPAR TANGKAP!',
          neck: 'ATRAKSI: KUNCI KETIAK!',
          spin: 'ATRAKSI: PUTARAN NAGA!',
        };
        this.say(flNames[this.sfNun.flourishKind] ?? 'ATRAKSI NUNCHAKU!', '#ffb04a', 1, 0.75);
        this.sfx.whoosh();
        this.particles.ring(p.x, p.y - 7, 2, 12, '#ffb04a', 0.18, 1);
      }
    }
    if (inp.hit('5') && p.hasKatana) this.setWeapon('katana');
    if (inp.hit('6') && p.hasAxe) this.setWeapon('axe');
    if (inp.hit('7') && p.hasDual) this.setWeapon('dual');
    if (inp.hit('8')) {
      if (p.weapon === 'yoyo') this.selectYoyoVersion(this.yoyoVer === 1 ? 2 : 1);
      else this.setWeapon('yoyo');
    }
    if (inp.hit('9')) this.setWeapon('takamura');
    if (inp.hit('0')) this.setWeapon('hayabusa');
    if (inp.hit('z') && !this.carry.carrying && !this.carry.nearProp(this) && !this.carry.shots.some((s) => s.life > 0.7)) { if (p.weapon !== 'guandao') this.setWeapon('guandao'); else this.gd.trick(this); }
    if (inp.hit('t') && p.weapon !== 'bat') this.setWeapon('bat');
    if (inp.hit('y') && p.weapon !== 'shotgun') this.setWeapon('shotgun');
    if (inp.hit('u') && p.weapon !== 'bow') this.setWeapon('bow');
    if (inp.hit('i') && p.weapon === 'foot' && !inp.key('shift')) this.queueFootStance();
    else if (inp.hit('i')) {
      if (p.weapon !== 'buster') this.setWeapon('buster');
      else if (!this.bu.omni) {
        // ganti stance: OPERATOR <-> PUNISHER
        this.bu.punisher = !this.bu.punisher; this.bu.flourish = 0.45; this.bu.flourishMax = 0.45;
        this.say(this.bu.punisher ? 'PUNISHER' : 'OPERATOR', this.bu.punisher ? '#ff9d6a' : MAKO, 2, 0.6);
        this.sfx.axeSwing(); this.sfx.leverClack();
        this.particles.ring(p.x, p.y - 6, 3, 16, this.bu.punisher ? '#ff9d6a' : MAKO, 0.24, 1);
      }
    }
    if (inp.hit('j') && inp.key('shift') && p.weapon !== 'boxing' && p.weapon !== 'foot') this.setWeapon('boxing');
    if (inp.hit('n') && inp.key('shift') && p.weapon === 'boxing') this.cycleBoxStance();

    // parry = C (atau saat cincin hijau C! muncul pada musuh AHLI FIST)
    if (inp.hit('c') && p.parryCd <= 0 && p.dashT <= 0 && p.stunT <= 0 && !traveling && !p.airborne) {
      p.parryT = 0.32 * this.stats.parryWindow; p.parryCd = 0.45; p.parryHit = false;
      p.attackPhase = 'none'; p.buffered = null; p.z = 0;
      if (p.weapon === 'foot') this.footwork.interrupt();
      this.sfx.whoosh();
      this.particles.ring(p.x, p.y - 6, 3, 10, '#9be7ff', 0.15, 1);
      // Bila ada musuh AHLI FIST ('fighter') atau musuh melee di dekat pemain yang sedang dalam jendela parry hijau (<= 0.25s) atau sedang mengayun, langsung tangkis sempurna!
      const side = !!this.level.sideView;
      for (const e of this.enemies) {
        if (e.dead || e.spawnT > 0 || e.boss || (e.kind as string) === 'duelist') continue;
        const sameFl = !side || Math.abs(p.y - e.y) <= 28;
        const d = side ? Math.abs(p.x - e.x) : dist(p.x, p.y, e.x, e.y);
        if (!sameFl || d > e.attackRange + p.r + 18) continue;
        const inGreenWindup = e.state === 'windup' && (e.feint ?? 0) <= 0 && e.stateT <= 0.25;
        const inAttack = e.state === 'attack' && !e.hitDone;
        if (inGreenWindup || inAttack) {
          const a = side ? (p.x >= e.x ? 0 : Math.PI) : Math.atan2(p.y - e.y, p.x - e.x);
          e.hitDone = true;
          this.perfectParry(e, a);
          break;
        }
      }
    }
    if (p.parryT > 0) p.parryT -= dt;
    if (inp.hit('e')) this.tryFocus();
    if (inp.hit('x')) this.tryOfa();
    if (inp.hit('f')) this.tryFatality();
    if (inp.hit('b') && !inp.key('shift') && p.weapon !== 'foot') this.brut.try(this);
    if (inp.hit('g') && this.silatLinkT > 0 && this.trySilatLink()) return;
    if (inp.hit('g') && this.trySilat(null, true)) return;
    if (inp.hit('r')) this.tryRage();
    this.updateRage(dt, raw);
    if (p.rageDash) return;

    if (p.stunT <= 0 && p.holdT <= 0 && !this.carry.carrying) {
      if (p.weapon === 'foot') this.readFootInputs();
    if (p.weapon === 'scythe') this.readScytheInputs();
      else {
        if (inp.mouse.rpressed && this.muay.maybeStart(this)) return;
        if (inp.mouse.rpressed && p.weapon === 'fist' && this.gates.tryLotus(this)) { inp.mouse.rpressed = false; inp.mouse.rdown = false; }
        else if (inp.mouse.rpressed && p.weapon === 'fist' && this.tryFlyKick()) { inp.mouse.rpressed = false; inp.mouse.rdown = false; }
        else if (inp.mouse.rpressed && !p.airborne && p.weapon === 'fist' && this.botPunch.maybeStart(this)) { /* adegan straight punch */ }
        else if (inp.mouse.rpressed && (!p.airborne || p.weapon === 'fist' || p.weapon === 'boxing') && !(p.weapon === 'yoyo' && this.yoyoVer === 1) && p.weapon !== 'takamura' && p.weapon !== 'hayabusa' && p.weapon !== 'axe' && p.weapon !== 'shotgun' && p.weapon !== 'bow' && p.weapon !== 'buster' && p.weapon !== 'guandao' && p.weapon !== 'pistol' && p.weapon !== 'rifle' && !this.sfNunOn) this.queueAttack('H');
        if (p.weapon === 'shotgun') {
          this.shotgunInput();
        } else if (p.weapon === 'bow') {
          this.bowInput(dt);
        } else if (p.weapon === 'guandao') {
          /* guan dao membaca LMB / RMB sendiri (lihat guandao.ts) */
        } else if (p.weapon === 'buster') {
          this.busterInput(dt);
        } else if ((p.weapon === 'yoyo' && this.yoyoVer === 1) || p.weapon === 'takamura' || p.weapon === 'hayabusa') {
          /* yoyo V1 / takamura / hayabusa read LMB / RMB themselves */
        } else if (p.weapon === 'fist' || p.weapon === 'nunchaku' || p.weapon === 'katana' || p.weapon === 'axe' || p.weapon === 'dual' || p.weapon === 'bat' || p.weapon === 'boxing' || (p.weapon === 'yoyo' && this.yoyoVer === 2)) {
          // KOMBO UDARA NUNCHAKU: LMB selagi melayang — ayunan miring ke atas > putaran udara > bantingan ke bawah
          if (this.sfNunOn && inp.mouse.pressed && p.airborne && this.nunAirSeq === 0 && !this.sfNun.attacking) this.startNunAerial();
          if (inp.mouse.pressed && (!p.airborne || p.weapon === 'fist' || p.weapon === 'boxing')) this.queueAttack('L');
          if (this.sfNunOn && inp.mouse.down && !inp.mouse.pressed && !p.airborne && this.nunAirSeq === 0) {
            if (!this.sfNun.attacking) { this.sfNunAim = p.aim; this.sfNun.start(); this.sfx.swing(1.1); }
            else if (this.sfNun.cur && this.sfNun.t / this.sfNun.cur.dur > 0.3) this.sfNun.buffered = true;
          }
          // HELICOPTER: holding RMB keeps the chain spinning as long as you hold it
          if (p.weapon === 'nunchaku' && inp.mouse.rdown && p.attackPhase === 'active' && p.moveKey === 'NH' && p.attackT < 0.1) p.attackT = 0.1;
          if (p.weapon === 'yoyo' && this.yoyoVer === 2 && !p.airborne) {
            if (inp.mouse.rdown && p.attackPhase === 'active' && (p.moveKey === 'YH' || p.moveKey === 'YHH') && p.attackT < 0.1) p.attackT = 0.1;
            if (p.attackPhase === 'none' && inp.mouse.rdown && !inp.mouse.rpressed) this.startAttack('YH');
            else if (p.attackPhase === 'none' && inp.mouse.down && !inp.mouse.pressed) this.queueAttack('L');
          }
          if (p.weapon === 'boxing' && inp.mouse.down && !inp.mouse.pressed && !p.airborne && !p.buffered && (p.attackPhase === 'none' || p.attackPhase === 'recover')) this.queueAttack('L');
          if (p.weapon === 'boxing' && inp.mouse.rdown && !inp.mouse.rpressed && !p.airborne && !p.buffered && (p.attackPhase === 'none' || p.attackPhase === 'recover')) this.queueAttack('H');
          if (p.weapon === 'bat' && inp.mouse.down && !inp.mouse.pressed && !p.airborne && !p.buffered && (p.attackPhase === 'none' || p.attackPhase === 'recover')) this.queueAttack('L');
          if (p.weapon === 'bat' && inp.mouse.rdown && !inp.mouse.rpressed && !p.airborne && !p.buffered && (p.attackPhase === 'none' || p.attackPhase === 'recover')) this.queueAttack('H');
        } else if (!attacking && p.dashT <= 0 && p.weapon === 'rifle') {
          this.gunInput(dt); // rifle tetap freestyle lama; pistol ditangani PistolStyle (pis.update)
        }
      }
    }
    if (this.silat) return;
    this.updateYoyoV2(dt);
    this.updateAttack(dt);
    if (this.sfNunOn) this.updateSFNunchaku(dt); else this.updateNunchaku(dt);
    this.updateKatana(dt);
    this.updateYoyo(dt);
    this.updateBat(dt);
    this.updateShotgun(dt);
    this.updateBowTrick(dt);
    this.updateGunStyle(dt);
    this.pis.update(this, dt);
    this.updateBuster(dt);
    this.gd.update(this, dt);
    this.updateSilatPending(dt);
    this.updateTak(dt);
    this.updateHay(dt);
    this.updateLev(dt);

    // ---- apply movement
    const trav = p.attackPhase === 'active' && p.moveKey && MOVES[p.moveKey].travel;
    if (trav && p.moveKey === 'TKD' && !p.travelHit) {
      // tendangan terbang membuntuti musuh: arah luncuran dibelokkan halus ke sasaran
      const tg = this.nearestEnemy(p.x, p.y, 140, p.attackAim, 1.0);
      if (tg) { const ta = Math.atan2(tg.y - p.y, tg.x - p.x); p.attackAim += angleDiff(ta, p.attackAim) * Math.min(1, dt * 9); p.aim = p.attackAim; }
    }
    if (trav) {
      const m = MOVES[p.moveKey!];
      const sp = m.travel! * (p.travelHit ? 0.2 : 1);
      p.vx = Math.cos(p.aim) * sp; p.vy = side ? 0 : Math.sin(p.aim) * sp;
    }
    if (side) {
      p.vy = 0;
      const dx = (p.vx + p.kx) * dt, dy = ((p.svVy ?? 0) + p.ky) * dt;
      const prevVy = p.svVy ?? 0;
      const wasGrounded = !!p.svGrounded;
      const dropThrough = (p.svDropT ?? 0) > 0;
      const res = moveSideView(this.level, p, dx, dy, dropThrough, this.props);
      if (trav && (res.bx || res.by)) p.travelHit = true;

      // Parkour ledge mantle / wall-kick when jumping against a low ledge or column edge
      if (res.bx && ix !== 0 && p.jumpCd <= 0 && (p.airborne || rawIy < 0) && inp.key(' ')) {
        const txWall = Math.floor((p.x + Math.sign(ix) * (p.r + 6)) / TILE);
        const tyFoot = Math.floor((p.y - 4) / TILE);
        if (officeTileAt(this.level, txWall, tyFoot - 1) === OT_AIR || officeTileAt(this.level, txWall, tyFoot - 2) === OT_AIR) {
          p.svVy = -164;
          p.svGrounded = false;
          p.airborne = true;
          p.jumpCd = 0.25;
          this.particles.smoke(p.x, p.y - 4, 3, '#cfcfcf', 18, 0.25);
          this.sfx.whoosh();
        }
      }

      if (res.hitGlass.length > 0 && (p.dashT > 0 || attacking || Math.abs(p.vx) > 95)) {
        for (const gt of res.hitGlass) {
          const posG = shatterOfficeGlassTile(this.level, this.officeLook.on ? null : this.levelCanvas, gt.tx, gt.ty);
          if (posG) {
            this.particles.burst(posG.x, posG.y, 12, '#7ce8ff', 150, 0.5, 2, 2);
            this.sfx.glassTink();
            this.shake(0.2);
          }
        }
      }
      if (res.by && prevVy > 0) {
        if (!wasGrounded && prevVy > 95) {
          p.landT = 0.12; p.squash = 0.74;
          this.sfx.land();
          this.particles.smoke(p.x, p.y, 5, '#888', 24, 0.35);
          this.shake(0.08);
          if (attacking && move?.air && !footMove(move) && (move.travel || move.finisher)) {
            p.attackPhase = 'recover'; p.attackT = move.recover; this.shake(0.3); this.particles.shockwave(p.x, p.y, 18, '#ffffff', 0.25);
            for (const e of this.enemies) { if (e.dead || e.spawnT > 0 || p.hitSet.includes(e.id)) continue; if (dist(p.x, p.y, e.x, e.y) > 22 + e.r) continue; p.hitSet.push(e.id); this.meleeHitEnemy(e, move, Math.atan2(e.y - p.y, e.x - p.x), { x: p.x + Math.cos(p.aim) * 6, y: p.y - 2 }); }
          }
        }
        p.svVy = 0; p.svGrounded = true; p.airborne = false; p.airLockId = -1;
      } else if (res.by && prevVy < 0) {
        p.svVy = 0;
      } else if (wasGrounded) {
        const tileSup = officeFloorSupportY(this.level, p.x, p.y, p.r, dropThrough);
        const tblSup = dropThrough ? null : sideTableSupportY(this.props, p.x, p.y);
        const sup = tileSup === null ? tblSup : tblSup === null ? tileSup : Math.min(tileSup, tblSup);
        if (sup === null || sup > p.y + 3) {
          p.svGrounded = false;
          if (!officeOnStairs(this.level, p.x, p.y)) p.airborne = true;
        }
      }
    } else {
      const dx = (p.vx + p.kx) * dt, dy = (p.vy + p.ky) * dt;
      const blocked = moveWithCollision(this.level, p, dx, dy);
      if (trav && (blocked.bx || blocked.by)) p.travelHit = true;
    }
    const fr = Math.max(0, 1 - 8 * dt); p.kx *= fr; p.ky *= fr;
    p.x = clamp(p.x, TILE, this.level.w * TILE - TILE); p.y = clamp(p.y, TILE, this.level.h * TILE - TILE);
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.z > 4 || p.z > 8) continue;
      if (side && Math.abs(e.y - p.y) > 12) continue;
      const d = dist(p.x, p.y, e.x, e.y), min = p.r + e.r - 1;
      if (d < min && d > 0.01) {
        const o = (min - d) * 0.5, nx = (p.x - e.x) / d, ny = side ? 0 : (p.y - e.y) / d;
        if (p.dashT <= 0 && !trav && this.isFree(p.x + nx * o, p.y + ny * o, p.r)) { p.x += nx * o; p.y += ny * o; }
        if (this.isFree(e.x - nx * o, e.y - ny * o, e.r)) { e.x -= nx * o; e.y -= ny * o; }
      }
    }
    unstick(this.level, p);
  }

  /** Blade angle follows the move's slash arc during the active frames; trails + iaijutsu bookkeeping. */
  updateKatana(dt: number) {
    const p = this.player;
    this.katana.update(dt);
    if (p.weapon !== 'katana' && p.weapon !== 'axe' && p.weapon !== 'dual' && p.weapon !== 'bat' && p.weapon !== 'shotgun' && p.weapon !== 'buster' && p.weapon !== 'scythe') return;
    if (p.sheatheT > 0) p.sheatheT -= dt;
    const move = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
    p.bladePrevA = p.bladeA;
    if (move && move.slash) {
      const pt = this.attackPoseT();
      const s = move.slash;
      // windup: blade coils smoothly into the start angle; active (0.3-0.6): sweeps from->to; recover: holds follow-through then eases back
      const wU = clamp(pt / 0.3, 0, 1);
      const k = pt < 0.3 ? 0 : pt < 0.6 ? (pt - 0.3) / 0.3 : 1;
      // Untuk Baseball Bat, kurva ayunan lebih halus & natural (smooth ease-in-out di awal lalu snap di kontak)
      const ease = k < 1 ? (move.bat ? k * k * (3 - 2 * k) * 0.35 + (1 - Math.pow(1 - k, 2.1)) * 0.65 : 1 - Math.pow(1 - k, 2.2)) : 1;
      let rel = s.from + (s.to - s.from) * ease;
      if (move.bat && pt < 0.3) {
        if (move.pose === 'b_windmill') rel = s.from - (1 - wU) * Math.PI * 2;
        else if (move.pose === 'b_tosscatch') rel = -Math.PI * 0.5 + wU * Math.PI * 4;
        else rel = s.from * (0.55 + 0.45 * (wU * wU * (3 - 2 * wU)));
      }
      const settle = pt > 0.6 ? Math.pow(clamp((pt - 0.6) / 0.4, 0, 1), move.bat ? 1.6 : 1) : 0;
      p.bladeA = p.aim + rel * p.facing * (1 - settle) + (move.bat ? -2.2 * p.facing * settle : 0);
      p.bladeB = p.aim - rel * p.facing * (1 - settle); // mirrored second blade (dual)
      if (move.id === 'k_heaven' || move.id === 'k_thrust' || move.id === 'k_iaijutsu') p.bladeA = p.aim + (move.id === 'k_heaven' ? (pt < 0.3 ? -1.4 * p.facing * (1 - pt / 0.3) - 0.3 * p.facing : 0.4 * p.facing * settle) : 0);
      // slash arc trail once per swing (and repeatedly for the spin/flurry moves)
      if (pt >= 0.3 && pt < 0.36 && !p.travelHit && s.from !== s.to) {
        const sk = solvePose(this.playerStickOpts(move.pose, pt));
        const hx = p.x + sk.fhand.x, hy = p.y + sk.fhand.y - p.z;
        const sm = scytheMove(move);
        const col = sm ? SCYTHE_COLOR[sm.scythe.school] : move.buster ? this.bu.trailColor() : move.axe || move.bat ? '#ffd27f' : '#bfe8ff';
        if (move.buster) {
          this.bu.addSlash(hx, hy, s.r, p.aim + s.from * p.facing, p.aim + s.to * p.facing, col, 5 + 1.5 * this.bu.momentum, s.lift ?? 0, move.rehit ? 0.32 : 0.24);
          // sapuan kedua lebih kecil, sedikit tertinggal -> kesan goresan kuas ganda
          this.bu.addSlash(hx, hy, s.r * 0.86, p.aim + s.from * p.facing + 0.12, p.aim + s.to * p.facing - 0.1, MAKO2, 2, s.lift ?? 0, 0.18, 0.52);
        } else if (move.bat) {
          this.katana.addArc(hx, hy, s.r, p.aim + s.from * p.facing, p.aim + s.to * p.facing, '#ffd27f', s.lift ?? 0, move.rehit ? 0.36 : 0.30);
          if (move.finisher || move.pose === 'b_windmill' || move.pose === 'b_behind' || move.pose === 'b_tosscatch' || move.pose === 'b_callshot') {
            this.katana.addArc(hx, hy, s.r * 0.82, p.aim + (s.from + 0.2) * p.facing, p.aim + s.to * p.facing, '#ff9d3b', s.lift ?? 0, 0.24);
          }
        } else this.katana.addArc(hx, hy, s.r, p.aim + s.from * p.facing, p.aim + s.to * p.facing, col, s.lift ?? 0, move.rehit ? 0.3 : 0.22);
        if (move.dual) { const bx = p.x + sk.bhand.x, by = p.y + sk.bhand.y - p.z; this.katana.addArc(bx, by, s.r, p.aim - s.from * p.facing, p.aim - s.to * p.facing, col, s.lift ?? 0, 0.22); }
        if (!move.rehit) p.travelHit = true; // used as 'arc emitted' flag for the blade
        if (move.buster) { this.sfx.axeSwing(); this.sfx.whoosh(); if (this.bu.momentum >= 2) this.bu.addSlash(hx, hy, s.r * 1.12, p.aim + s.from * p.facing, p.aim + s.to * p.facing, MAKO2, 3.5, s.lift ?? 0, 0.17); } else if (move.axe || move.bat) this.sfx.axeSwing(); else if (move.dual) this.sfx.dualSwing(); else this.sfx.slash(move.id === 'k_heaven' || move.id === 'k_dragonfang' ? 0.7 : 1);
      }
      if (move.rehit && pt >= 0.3 && Math.random() < 0.5) {
        const sk = solvePose(this.playerStickOpts(move.pose, pt));
        const hx = p.x + sk.fhand.x, hy = p.y + sk.fhand.y - p.z;
        const a0 = p.bladePrevA, a1 = p.bladeA;
        if (Math.abs(a1 - a0) > 0.2) { if (move.buster) this.bu.addSlash(hx, hy, s.r * 0.95, a0, a1, this.bu.trailColor(), 3, 0, 0.14); else this.katana.addArc(hx, hy, s.r * 0.95, a0, a1, '#bfe8ff', 0, 0.12); }
      }
      if ((move.id === 'k_iaijutsu' || (this.v2 && move.id === 'k_dashcut')) && p.attackPhase === 'active') this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: move.id === 'k_dashcut' ? 'k_crescent' : 'k_iaijutsu', poseT: 0.5 }, '#bfe8ff', p.lean);
    } else {
      // idle: blade points along the aim (chudan guard)
      const target = p.aim + (p.sheatheT > 0 ? 0 : 0);
      p.bladeA += angleDiff(target, p.bladeA) * Math.min(1, dt * 18);
    }
  }

  /** iaijutsu: victims are frozen (doomed) while you dash through and sheathe; then they fall apart */
  iaiKill(e: Enemy) {
    if (e.dead) return;
    const a = Math.atan2(e.y - this.player.y, e.x - this.player.x);
    this.particles.blood(e.x, e.y - 6 - e.z, 40, a + Math.PI / 2, 180);
    this.particles.blood(e.x, e.y - 6 - e.z, 40, a - Math.PI / 2, 180);
    this.particles.fountain(e.x, e.y - 6, 14);
    this.sfx.slash(0.6); this.sfx.kill();
    this.hitstop = Math.max(this.hitstop, 0.06); this.shake(0.5);
    this.texts.add(e.x, e.y - 24, 'ONE CUT', '#ffffff', 1, 0.8);
    // split corpse: two halves slide apart
    const corpse = (vx: number, vy: number): Corpse => ({ x: e.x, y: e.y, rot: a, color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle, vx, vy, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
    this.corpses.push(corpse(Math.cos(a + Math.PI / 2) * 40, Math.sin(a + Math.PI / 2) * 40));
    this.corpses.push(corpse(Math.cos(a - Math.PI / 2) * 40, Math.sin(a - Math.PI / 2) * 40));
    this.splat(e.x, e.y, 26);
    this.addPool(e.x, e.y + 1, 9);
    if (e.boss) { e.doom = 0; return; }
    e.dead = true; this.kills++; this.score += Math.round(e.value * 1.5 * this.comboMult()); this.addCombo(2); this.dropLoot(e, true);
  }

  /** Freestyle yoyo: the string is tied to the hand (or the FOOT in floor moves) of the current pose; feet are weapons too. */
  updateYoyo(dt: number) {
    const p = this.player;
    if (p.weapon !== 'yoyo' || this.yoyoVer !== 1) return;
    const yo = this.yoyo;
    const pose: Pose = yo.bodyPose ?? (p.dashT > 0 ? 'dash' : p.moving && p.runT > 0.03 ? 'run' : 'idle');
    const sk = solvePose(this.playerStickOpts(pose, yo.bodyPose ? yo.bodyT : 0));
    const limb = yo.anchorLimb === 'ffoot' ? sk.ffoot : sk.fhand;
    const w = (v: Vec): Vec => ({ x: p.x + v.x, y: p.y + v.y - p.z });
    yo.update(this, dt, w(limb), [w(sk.ffoot), w(sk.bfoot)]);
  }

  /** MAXKUNG's freestyle yo-yo trajectory, trail and dance effects. */
  updateYoyoV2(dt: number) {
    const p = this.player;
    if (p.weapon !== 'yoyo' || this.yoyoVer !== 2) return;
    const move = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
    const yoMove = move?.yoyo ? move : null;
    const pose: Pose = move ? move.pose : p.dashT > 0 ? 'dash' : p.airborne ? 'jump' : p.moving ? 'run' : 'y2_idle';
    const progress = move ? this.attackPoseT() : 0;
    const sk = solvePose(this.playerStickOpts(pose, progress));
    const hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
    const origin = { x: p.x, y: p.y - 6 - p.z };
    const skin = this.yoyoV2.skin;
    this.yoyoV2.update(dt, hand, origin, p.aim, yoMove?.id ?? null, p.attackPhase, progress, (yoMove?.range ?? 78) * this.stats.meleeRange);
    if (yoMove && p.attackPhase === 'active' && Math.random() < 0.16) {
      const tip = this.yoyoV2.position;
      this.particles.add({ x: tip.x, y: tip.y, vx: rnd(-20, 20), vy: rnd(-30, 15), life: 0.18, c: Math.random() < 0.5 ? skin.spark : skin.trailLight, s: 1, k: 0 });
    }
    if (yoMove && p.attackPhase === 'active') {
      const powerMove = pose === 'y2_windmill' || pose === 'y2_spin' || pose === 'y2_freeze' || pose === 'y2_airflip';
      this.yoyoEchoT -= dt;
      if (this.yoyoEchoT <= 0) {
        this.yoyoEchoT = powerMove ? 0.075 : 0.14;
        this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose, poseT: progress, dancePhase: this.yoyoV2.spin }, powerMove ? skin.afterimage : skin.trailLight, p.lean);
      }
      this.yoyoDustT -= dt;
      if (powerMove && !p.airborne && this.yoyoDustT <= 0) {
        this.yoyoDustT = 0.14;
        this.particles.smoke(p.x + rnd(-5, 5), p.y + 1, 2, '#a18d7f', 16, 0.22);
        this.particles.spark(p.x + rnd(-5, 5), p.y, 2, skin.spark, -Math.PI / 2, 1.3, 80);
      }
    } else {
      this.yoyoEchoT = 0;
      this.yoyoDustT = 0;
    }
  }
  /** Hayabusa: ninja-gaiden / raiden blade-mode. */
  updateHay(dt: number) {
    if (this.player.weapon !== 'hayabusa') return;
    this.hay.update(this, dt);
  }
  updateLev(dt: number) {
    if (this.player.weapon !== 'axe') return;
    this.lev.update(this, dt);
  }

  /** Takamura: all inputs, cuts and the NOTO payout live in takamura.ts */
  updateTak(dt: number) {
    if (this.player.weapon !== 'takamura') return;
    this.tak.update(this, dt);
  }

  /** Drive the nunchaku chain from the posed hand every frame; the far stick is pure physics. */
  updateNunchaku(dt: number) {
    const p = this.player;
    if (p.weapon !== 'nunchaku') return;
    const move = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
    let pose: Pose = 'n_idle', t = 0;
    if (move) { pose = move.pose; t = this.attackPoseT(); }
    else if (p.dashT > 0) pose = 'dash';
    else if (p.moving && p.runT > 0.03) pose = 'run';
    const sk = solvePose(this.playerStickOpts(pose, t));
    let hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
    // the held stick points from the neck through the hand (extends the forearm)
    let ndx = sk.fhand.x - sk.neck.x, ndy = sk.fhand.y - sk.neck.y;
    const nl = Math.hypot(ndx, ndy) || 1; ndx /= nl; ndy /= nl;
    let spin = 0;
    let boost: Vec | null = null;
    if (move) {
      const ph = this.attackPoseT();
      switch (move.id) {
        case 'n_helicopter': case 'n_flyspin': spin = 26 * p.facing; break;
        case 'n_lowsweep': spin = -22 * p.facing; break;
        case 'n_tornado': spin = 30 * p.facing; break;
        case 'n_dragonlash': if (ph >= 0.28) { boost = { x: Math.cos(p.aim) * 1500, y: Math.sin(p.aim) * 900 + 300 }; } break;
        case 'n_figure8': spin = (Math.floor(ph * 4) % 2 === 0 ? 1 : -1) * 26; boost = { x: Math.cos(p.aim) * 350, y: Math.sin(p.aim) * 210 }; break;
        case 'n_tri1': case 'n_tri2': case 'n_tri3': case 'n_tri4': {
          if (ph >= 0.28 && ph <= 0.46) {
            const f = p.facing;
            const side = { x: -Math.sin(p.aim), y: Math.cos(p.aim) }; // screen 'left' of the facing direction
            let bx = 0, by = 0;
            if (move.id === 'n_tri1') { bx = Math.cos(p.aim) * 900 - side.x * f * 500; by = Math.sin(p.aim) * 540 + 700; }           // diagonal down-left
            else if (move.id === 'n_tri2') { bx = Math.cos(p.aim) * 1300; by = Math.sin(p.aim) * 500 - 900; }                       // bounce forward+up through the target to the shoulder
            else if (move.id === 'n_tri3') { bx = Math.cos(p.aim) * 1000 + side.x * f * 700; by = Math.sin(p.aim) * 600 + 80; }  // horizontal across the chest
            else { bx = Math.cos(p.aim) * 700 + side.x * f * 200; by = Math.sin(p.aim) * 420 + 900; }                                // catch: short downward smash
            boost = { x: bx, y: by };
          }
          break;
        }
        case 'n_lash': case 'n_cross': case 'n_whipcrack': case 'n_overhead': case 'n_choke': {
          // during the snap, fling the chain forward along the aim so the far stick whips out ahead of the hand
          if (ph >= 0.28 && ph <= 0.45) { const pow = move.id === 'n_whipcrack' ? 1400 : move.id === 'n_overhead' ? 1100 : 900; boost = { x: Math.cos(p.aim) * pow, y: Math.sin(p.aim) * pow * 0.6 + (move.id === 'n_overhead' ? 500 : 0) }; }
          break;
        }
      }
    }
    if (!move && p.weapon === 'nunchaku' && !p.moving && p.dashT <= 0) {
      // underarm tuck: the free stick is held folded back along the forearm (gentle pull toward the armpit)
      boost = { x: -ndx * 260, y: -ndy * 160 - 120 };
    }
    if (this.v2) {
      // V2: grip digerakkan pakai sweep arc ala game1 (wind back -> snap -> follow through),
      // plus flourish spin saat idle dan drape guard — rantai jadi menjutrat kayak di STICK FIST
      const LS = this.longMode ? 2.5 : 1;
      const sh = { x: p.x, y: p.y - 4 * LS - p.z };
      const sweep = (u: number, from: number, to: number, snap = 0.5) => {
        if (u < 0.18) return from - Math.sign(to - from) * 0.5 * (u / 0.18);
        const v = Math.min(1, (u - 0.18) / snap);
        const e = 1 - Math.pow(1 - v, 3);
        return from + (to - from) * e + Math.sin(v * Math.PI) * 0.12 * Math.sign(to - from);
      };
      const fdir = Math.cos(p.aim) >= 0 ? 1 : -1;
      if (move && move.nunchaku) {
        const u = Math.min(1, this.attackPoseT());
        let ang = p.aim, rad = (8 + 5 * u) * LS;
        switch (move.id) {
          case 'n_tri2': case 'n_cross': ang = p.aim + sweep(u, 2.0, -1.0); break;
          case 'n_whipcrack': case 'n_overhead': ang = p.aim + sweep(u, -2.3, 0.8, 0.34); rad = (6 + 8 * Math.min(1, Math.max(0, (u - 0.18) / 0.34))) * LS; break;
          case 'n_choke': ang = p.aim + sweep(u, -1.6, 0.6, 0.3); break;
          case 'n_tri4': ang = p.aim + sweep(u, 1.8, -0.6, 0.3); break;
          case 'n_helicopter': case 'n_flyspin': case 'n_tornado': case 'n_lowsweep': ang = p.aim + u * Math.PI * 3; rad = 12 * LS; break;
          case 'n_dragonlash': ang = p.aim + sweep(u, -2.4, 1.2, 0.3); rad = (9 + 6 * u) * LS; break;
          default: ang = p.aim + sweep(u, -2.0, 1.0); break;
        }
        hand = { x: sh.x + Math.cos(ang) * rad, y: sh.y + Math.sin(ang) * rad };
        void fdir;
      } else if (p.dashT > 0) {
        hand = { x: sh.x - Math.cos(p.aim) * 6 * LS, y: sh.y + 3 * LS };
      } else {
        this.nunFlourishCd -= dt; this.nunFlourish = Math.max(0, this.nunFlourish - dt);
        if (this.nunFlourishCd <= 0 && this.nunFlourish === 0 && !p.moving && p.attackPhase === 'none') {
          this.nunFlourish = 0.55; this.nunFlourishCd = 1.6 + Math.random() * 1.2;
          this.nunFlourishTurns = Math.random() < 0.35 ? 3 : 2;
          this.nunFlourishDir = Math.random() < 0.5 ? 1 : -1;
        }
        if (this.nunFlourish > 0) {
          const fu = 1 - this.nunFlourish / 0.55, ga = p.aim + fu * Math.PI * 2 * this.nunFlourishTurns * this.nunFlourishDir;
          hand = { x: sh.x + Math.cos(ga) * 7.5 * LS, y: sh.y + Math.sin(ga) * 7.5 * LS };
          boost = null;
        } else {
          hand = { x: sh.x + Math.cos(p.aim) * 6.5 * LS, y: sh.y + (2.5 + Math.sin(p.aim) * 3) * LS };
          boost = null;
        }
      }
    }
    if (spin !== 0 && this.nunchaku.spinSpeed === 0) this.nunchaku.spinAng = Math.atan2(ndy, ndx);
    this.nunchaku.spinSpeed = spin;
    this.nunchaku.v2 = this.v2;
    this.nunchaku.update(hand, { x: ndx, y: ndy }, dt, spin, boost, p.attackPhase !== 'none');
    // WHIP CRACK: the moment the chain snaps taut at full reach during the crack move
    if (move && (move.id === 'n_whipcrack' || move.id === 'n_overhead') && !p.travelHit && this.attackPoseT() > 0.33 && this.nunchaku.tautness() > 0.93 && this.nunchaku.tipSpeed > 300) {
      p.travelHit = true; // reused as 'cracked' flag for nunchaku moves
      const tp = this.nunchaku.tip();
      this.sfx.nunchakuHit(true); this.sfx.hit();
      this.particles.impact(tp.x, tp.y, 7, '#ffffff');
      this.particles.ring(tp.x, tp.y, 2, 9, '#ffffff', 0.15, 1);
      this.shake(0.15);
    }
    // chatter / whoosh feedback
    if (this.nunchaku.tipSpeed > 260 && Math.random() < 0.25) this.sfx.chainRattle();
    if (this.nunchaku.tipSpeed > 420 && Math.random() < 0.5) { const tp = this.nunchaku.tip(); this.particles.lines(tp.x, tp.y, 1, 'rgba(255,255,255,0.6)', Math.atan2(tp.y - this.nunchaku.prevTip.y, tp.x - this.nunchaku.prevTip.x) + Math.PI, 120); }
  }

  cycleWeapon(dir: number) {
    const p = this.player;
    const owned: WeaponKind[] = ['fist', 'foot', 'scythe', 'pistol'];
    if (p.hasRifle) owned.push('rifle');
    if (p.hasNunchaku) owned.push('nunchaku');
    if (p.hasAxe) owned.push('axe');
    owned.push('yoyo', 'takamura', 'guandao', 'bat', 'shotgun', 'bow', 'buster', 'boxing');
    for (let k = owned.length - 1; k >= 0; k--) if (!this.weaponAllowed(owned[k])) owned.splice(k, 1);
    const i = (owned.indexOf(p.weapon) + dir + owned.length) % owned.length;
    this.setWeapon(owned[i]);
  }
  setWeapon(w: WeaponKind) {
    const p = this.player;
    if (p.weapon === w) return;
    if (REMOVED_WEAPONS.includes(w)) return;
    if (!this.weaponAllowed(w)) { this.say(`${w.toUpperCase()} TERKUNCI - KALAHKAN BOS`, '#ff6a4a', 1, 0.9); this.sfx.beep?.(); return; }
    if (this.silat) this.clearCombatScene();
    if (w === 'scythe' || p.weapon === 'scythe') {
      this.scythe.reset();
      p.bladeA = p.aim; p.bladeB = p.aim;
      p.airMagnet = null; p.airLockId = -1; p.moveKey = null; p.squash = 1;
      p.styleHeat = 0;
      p.z = this.level.sideView && p.svGrounded ? 0 : p.z;
    }
    if (w === 'foot' || p.weapon === 'foot') {
      this.footwork.reset(); this.scythe.reset(); this._pfk = null; p.kickBuf = p.kickPending = false;
      this.footStanceVisible = false;
      p.airMagnet = null; p.airLockId = -1; p.moveKey = null; p.squash = 1;
      p.styleHeat = 0;
      p.z = this.level.sideView && p.svGrounded ? 0 : p.z;
    }
    p.weapon = w;
    if (w === 'pistol' || w === 'rifle') { this.guns.reset(); this.guns.twirlT = 0.55; this.sfx.casing(); }
    this.sfx.select();
    this.texts.add(p.x, p.y - 22, w === 'fist' ? 'KUNG FU' : w === 'foot' ? `FOOT MODE V${this.footVer}` : w === 'scythe' ? 'SCYTHE MODE' : w.toUpperCase(), w === 'foot' ? FOOT_VERSION_COLOR[this.footVer] : w === 'scythe' ? SCYTHE_COLOR.grim : '#ffffff', 1, 0.5);
    if (w === 'nunchaku') { this.nunchaku.reset(p.x + p.facing * 4, p.y - 8); this.sfNun.reset(p.x, p.y - 8); this.sfNunAim = p.aim; }
    if (w === 'katana') { this.katana.sheen = 0.25; p.sheatheT = 0; }
    if (w === 'axe') { this.lev.reset(); this.sfx.axeSwing(); }
    if (w === 'dual') this.sfx.dualSwing();
    if (w === 'takamura') { this.tak.reset(); this.katana.sheen = 0.3; this.sfx.sheathe(); }
    if (w === 'hayabusa') { this.hay.reset(); this.sfx.whoosh(); }
    if (w === 'boxing') { this.box.reset(); this.sfx.boxing(0.3); this.particles.ring(p.x, p.y - 6, 2, 14, this.boxDef.accent, 0.24, 1); }
    if (w === 'buster') { this.bu.reset(); this.bu.flourishMax = 0.8; this.bu.flourish = 0.8; this.sfx.axeSwing(); window.setTimeout(() => this.sfx.whoosh(), 180); window.setTimeout(() => { this.sfx.leverClack(); this.sfx.slam(); }, 700); this.particles.ring(p.x, p.y - 6, 3, 20, MAKO, 0.3, 1); }
    if (w === 'guandao') this.gd.onEquip(this);
    if (w === 'pistol') { this.pis.reset(); this.pis.startFlourish(); } // atraksi pembuka saat pistol ditarik
    if (w === 'bow') { this.bow.reset(); this.sfx.bowNock(); this.sfx.whoosh(); }
    if (w === 'shotgun') { this.sg.reset(); this.sg.startCock(); this.sg.kick = 0; this.batFlow = 0; this.batJuggle = 0; this.sfx.spinCock(); this.texts.add(p.x, p.y - 30, `${this.sg.shells}/${SG_MAG}`, '#ff6a4a', 1, 0.6); }
    if (w === 'bat') { this.batFlow = 0; this.batJuggle = 0; this.batTwirl = 0.6; this.batEquippedAt = this.time; this.sfx.batCrack(); this.sfx.axeSwing(); }
    if (w === 'yoyo') { if (this.yoyoVer === 1) this.yoyo.reset(p.x + p.facing * 6, p.y + 2); else this.yoyoV2.reset(p.x + p.facing * 6, p.y - 7 - p.z); this.sfx.whoosh(); this.texts.add(p.x, p.y - 22, this.yoyoVer === 1 ? 'YOYO V1' : 'YOYO V2', '#ffb84a', 1, 0.5); }
    p.comboStr = ''; p.attackPhase = 'none'; p.buffered = null;
    this.weaponEquipT = this.time;
    this.pushUI();
  }

  setNunStyle(style: 'v1' | 'v2' | 'v3') {
    if (this.nunStyle === style) return;
    const p = this.player;
    if (this.silat && p.weapon === 'nunchaku') this.clearCombatScene();
    this.nunStyle = style;
    try { localStorage.setItem(NUN_KEY, style); } catch { /* storage can be unavailable */ }
    this.sfNun.reset(p.x, p.y - 8);
    this.sfNunAim = p.aim;
    this.nunchaku.reset(p.x + p.facing * 4, p.y - 8);
    if (p.weapon === 'nunchaku') { p.attackPhase = 'none'; p.moveKey = null; p.comboStr = ''; p.buffered = null; }
    this.fireTrail.reset();
    this.say(style === 'v3' ? 'NUNCHAKU V3 - FIRE TRAIL' : style === 'v2' ? 'NUNCHAKU V2 - STICK FIST STYLE' : 'NUNCHAKU V1 - DRIFTER CLASSIC', style === 'v3' ? '#ff8a3d' : style === 'v2' ? '#ff6a4a' : '#9a9a9a', 2, 1.4);
    this.sfx.select();
    this.pushUI();
  }

  setBoxStance(s: BoxStance) {
    if (this.box.stance === s) return;
    this.box.setStance(s);
    try { localStorage.setItem('v2_kf_box', s); } catch { /* ignore */ }
    const d = BOX_STANCES[s];
    this.sfx.select(); this.sfx.whoosh();
    this.say(d.name, d.accent, 2, 1.2);
    const p = this.player;
    this.particles.ring(p.x, p.y - 6, 3, 16, d.accent, 0.26, 1);
    for (let i = 0; i < 10; i++) this.particles.add({ x: p.x + rnd(-4, 4), y: p.y - rnd(0, 12), vx: rnd(-30, 30), vy: rnd(-40, -8), life: rnd(0.2, 0.45), c: d.gloveLight, k: 0, s: 1, fr: 3 });
    this.pushUI();
  }
  cycleBoxStance() {
    const i = BOX_ORDER.indexOf(this.box.stance);
    this.setBoxStance(BOX_ORDER[(i + 1) % BOX_ORDER.length]);
  }
  selectBoxStance(s: BoxStance) {
    this.setBoxStance(s);
    if (this.player.weapon !== 'boxing') this.setWeapon('boxing'); else this.pushUI();
  }

  toggleNunStyle() { this.setNunStyle(this.nunStyle === 'v1' ? 'v2' : this.nunStyle === 'v2' ? 'v3' : 'v1'); }

  selectNunStyle(style: 'v1' | 'v2' | 'v3') {
    if (!this.player.hasNunchaku) return;
    this.setNunStyle(style);
    if (this.player.weapon !== 'nunchaku') this.setWeapon('nunchaku');
    else this.pushUI();
  }

  /** KOMBO UDARA NUNCHAKU (Diagonal-to-Aerial Spin Smash): dipicu LMB selagi karakter melayang.
   *  Fase 1 ayunan miring ke atas mengangkat musuh, fase 2 karakter melompat berputar di udara,
   *  fase 3 bantingan miring ke bawah menghantam musuh ke lantai. */
  startNunAerial() {
    const p = this.player, nun = this.sfNun;
    if (nun.attacking || p.stunT > 0 || this.nunAirSeq > 0) return;
    this.nunAirSeq = 1;
    this.sfNunAim = p.aim;
    nun.play(SF_SKY);
    this.sfx.swing(0.8);
    this.say('KOMBO UDARA!', '#a6fff0', 2, 0.9);
  }

  /** OPUS V2: a four-hit combo with a Verlet chain and swept-stick collisions. */
  updateSFNunchaku(dt: number) {
    const p = this.player, nun = this.sfNun;
    if (!this.sfNunOn) return;
    if (p.stunT > 0) { nun.cur = null; nun.buffered = false; nun.idx = 0; this.nunAirSeq = 0; this.nunHoldT = 0; this.nunCharging = false; this.nunPending = null; }
    // ---- KLIK KANAN NUNCHAKU: TAP (< 0,2 dtk) = Basic Heavy, HOLD (>= 0,2 dtk) = Charged Heavy ----
    const inp = this.input;
    if (inp.mouse.rpressed && !p.airborne && this.nunAirSeq === 0) { this.nunHoldT = 0.0001; this.nunCharging = false; this.nunCharge = 0; this.nunChargeSaid = false; }
    if (this.nunHoldT > 0) {
      if (inp.mouse.pressed) { this.nunHoldT = 0; this.nunCharging = false; } // klik kiri membatalkan pengumpulan tenaga
      else if (inp.mouse.rdown) {
        this.nunHoldT += dt;
        if (this.nunHoldT >= 0.2) {
          if (!this.nunCharging) { this.nunCharging = true; this.sfx.whoosh(); }
          this.nunCharge = Math.min(1, (this.nunHoldT - 0.2) / 0.5);
          nun.flourishCd = 0; // nunchaku terus berputar di pergelangan selagi tenaga dikumpulkan
          if (this.nunCharge >= 1 && !this.nunChargeSaid) { this.nunChargeSaid = true; this.say('CHARGED!', '#ffc46b', 2, 0.6); this.sfx.leverClack(); }
        }
      } else {
        // tombol dilepas — putuskan TAP vs HOLD dari durasi tahannya
        const kind = this.nunCharging ? 'charged' : 'heavy';
        this.nunHoldT = 0; this.nunCharging = false; this.nunCharge = 0;
        if (!p.airborne && p.stunT <= 0) {
          if (nun.attacking) this.nunPending = kind; // menyusul begitu tangan bebas
          else { nun.play(kind === 'charged' ? SF_CHARGED : SF_HEAVY); this.sfNunAim = p.aim; this.sfx.swing(0.7); if (kind === 'charged') this.say('CHARGED HEAVY!', '#ffc46b', 2, 0.7); }
        }
      }
    }
    if (this.nunAirSeq > 0) nun.buffered = false;
    if (!nun.attacking) this.sfNunAim = p.aim;
    const facing = nun.attacking ? this.sfNunAim : p.aim;
    const nunDt = dt * 1.32 * this.tempo * this.gates.atkMul;
    const event = nun.step(nunDt);
    // ---- rangkaian Kombo Udara berjalan otomatis antar-fase ----
    if (this.nunAirSeq > 0 && !nun.cur) {
      if (this.nunAirSeq === 1) {
        this.nunAirSeq = 2;
        if (this.level.sideView) { p.svGrounded = false; p.svVy = -235; } else { p.vz = 215; }
        p.airborne = true; p.jumpT = 0;
        nun.play(SF_AIRSPIN);
      } else if (this.nunAirSeq === 2) {
        this.nunAirSeq = 3;
        if (this.level.sideView) { p.svGrounded = false; p.svVy = 320; } else { p.vz = -300; }
        nun.play(SF_METEOR);
      } else this.nunAirSeq = 0;
    }
    // heavy tertunda (klik kanan dilepas di tengah kombo) menyusul begitu tangan bebas
    if (!nun.cur && this.nunPending && this.nunAirSeq === 0) {
      nun.play(this.nunPending === 'charged' ? SF_CHARGED : SF_HEAVY);
      this.nunPending = null;
      this.sfNunAim = p.aim; this.sfx.swing(0.7);
    }
    // jeda antar-kombo diisi atraksi kung fu (operan belakang punggung / wrist roll / lempar-tangkap)
    if (!nun.attacking && nun.comboTimer > 0 && nun.flourish === 0 && nun.flourishCd <= 0) nun.startFlourish();
    if (nun.cur) {
      const lunge = nun.lungeK() * nun.cur.lunge;
      p.vx += Math.cos(facing) * lunge; p.vy += Math.sin(facing) * lunge;
    }
    const limbScale = this.longMode ? 2.5 : 1;
    nun.update(nunDt, p.x, p.y - 4 * limbScale - p.z, facing, this.time, p.dashT > 0 ? 'dash' : 'idle', limbScale);
    if (this.fireOn) {
      const tip = nun.pts[5];
      this.fireTrail.emit(tip.x, tip.y, nun.endSpeed, dt, nun.attacking ? 1.3 : 0.7);
    }
    const attack = nun.cur;
    const recordHit = () => {
      if (this.time - this.fistHitT > 2) this.fistHits = 0;
      this.fistHits++; this.fistHitT = this.time;
    };
    if (event === 'hit' && attack) {
      const target = this.nearestEnemy(p.x, p.y, attack.range * limbScale, facing, attack.arc / 2);
      if (target) {
        (target as Enemy & { nunCd?: number }).nunCd = this.time + 0.22;
        if (attack.fracture) this.applyFracture(target, nun.pts[5]); // Charged Heavy: tulang yang kena patah permanen
        const isCrack = attack.name === 'WHIP CRACK' || attack.name === 'WHIP CRACK!';
        this.damageEnemy(target, attack.dmg, attack.posture, facing, attack.kb, { melee: true, knockdown: !!attack.heavy, hitstop: isCrack ? 0.065 : 0.025, shake: attack.heavy ? 0.28 : 0.1, launch: attack.launch });
        if (attack.slam) this.slamEnemyDown(target); // penutup Kombo Udara: banting keras ke lantai
        this.particles.impact(target.x, target.y - 4, 5, '#ffffff');
        if (this.fireOn) this.fireTrail.burst(target.x, target.y - 5, facing, attack.heavy ? 1 : 0.5);
        this.sfx.nunchakuHit(!!attack.heavy); this.sfx.hit(); this.addCombo(1); this.addOfa(attack.dmg * 0.1); recordHit();
        if ((isCrack || attack.spin === 'back' || attack.spin === 'toss') && this.nameCd <= 0) {
          this.nameCd = 0.85;
          this.say(attack.name, this.fireOn ? '#ffb04a' : this.pal.accent2, 2, 0.72);
        }
      }
      if (attack.name === 'WHIP CRACK' || attack.name === 'WHIP CRACK!' || attack.spin === 'toss') {
        this.shake(0.18);
        const tip = nun.pts[5];
        this.particles.ring(tip.x, tip.y, 2, 11, '#ffffff', 0.16, 1, true);
      }
    }
    if (attack && nun.endSpeed > 150) {
      const end = nun.pts[5];
      const hitAngle = Math.atan2(end.y - nun.prevEnd.y, end.x - nun.prevEnd.x);
      for (const enemy of this.enemies) {
        if (enemy.dead || enemy.spawnT > 0) continue;
        const cooldown = enemy as Enemy & { nunCd?: number };
        if ((cooldown.nunCd ?? 0) > this.time) continue;
        if (nun.stickDist(enemy.x, enemy.y - 6 - enemy.z * 0.4) < enemy.r + 4.5) {
          cooldown.nunCd = this.time + 0.18;
          if (attack.fracture) this.applyFracture(enemy, nun.pts[5]);
          this.damageEnemy(enemy, attack.dmg, attack.posture, hitAngle, attack.kb, { melee: true, hitstop: 0.02, shake: 0.08, launch: attack.launch });
          if (attack.slam) this.slamEnemyDown(enemy);
          this.particles.impact(enemy.x, enemy.y - 4, 4, '#ffffff'); this.sfx.nunchakuHit(false); this.addCombo(1); recordHit();
          if (this.fireOn) this.fireTrail.burst(enemy.x, enemy.y - 5, hitAngle, 0.45);
        }
      }
    }
    if (nun.endSpeed > 260 && Math.random() < 0.25) this.sfx.chainRattle();
  }

  selectYoyoVersion(version: 1 | 2) {
    const p = this.player;
    if (p.weapon === 'yoyo' && this.yoyoVer === version) return;
    this.yoyoVer = version;
    if (p.weapon !== 'yoyo') {
      this.setWeapon('yoyo');
      return;
    }
    p.attackPhase = 'none'; p.moveKey = null; p.comboStr = ''; p.buffered = null;
    p.prevLimb = null; this.yoyoFeet = null;
    if (version === 1) this.yoyo.reset(p.x + p.facing * 6, p.y + 2);
    else this.yoyoV2.reset(p.x + p.facing * 6, p.y - 7 - p.z);
    this.sfx.select();
    this.texts.add(p.x, p.y - 22, `YOYO V${version}`, '#ffb84a', 1, 0.6);
    this.pushUI();
  }

  setYoyoSkin(id: YoyoSkinId) {
    if (!isYoyoSkinId(id)) return;
    this.yoyoV2.setSkin(id);
    try { localStorage.setItem(YOYO_SKIN_KEY, id); } catch { /* storage can be unavailable */ }
    this.pushUI();
  }

  cycleYoyoSkin() {
    const index = YOYO_SKINS.findIndex((skin) => skin.id === this.yoyoV2.skinId);
    this.setYoyoSkin(YOYO_SKINS[(index + 1) % YOYO_SKINS.length].id);
    this.selectYoyoVersion(2);
  }

  // ------------------------------------------------------------------ guns
  // ------------------------------------------------------------------ PISTOL / RIFLE FREESTYLE
  gunMuzzle() {
    const p = this.player;
    const q = this.guns.trickPose();
    const sk = solvePose(this.playerStickOpts(q ? q.pose : 'shoot', q ? q.t : 0));
    const hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
    const L = p.weapon === 'pistol' ? 11 * PISTOL_VIS : 19 * RIFLE_VIS;
    return { x: hand.x + Math.cos(p.aim) * L, y: hand.y + Math.sin(p.aim) * L * 0.6, hand };
  }
  gunInput(dt: number) {
    const p = this.player, inp = this.input, gs = this.guns;
    if (gs.trick) return;
    if (inp.mouse.rpressed && gs.cd <= 0 && p.attackPhase === 'none' && p.stunT <= 0) { this.startGunFreestyle(); return; }
    if (inp.mouse.pressed || inp.mouse.rpressed) { gs.twirlT = 0; gs.idleT = 0; }
    // ATRAKSI IDLE: pistol diputar di jari seperti quick-draw
    if (!p.moving && !inp.mouse.down && p.attackPhase === 'none' && !p.airborne && p.stunT <= 0) {
      gs.idleT += dt;
      if (gs.idleT > 2.0 && gs.twirlT <= 0) {
        gs.twirlT = gs.TWIRL_DUR; gs.idleT = 0;
        this.sfx.casing(); this.sfx.whoosh();
        this.particles.ring(p.x, p.y - 9, 2, 8, '#fff3c4', 0.18, 1);
      }
    } else gs.idleT = 0;
    const semi = p.weapon === 'pistol';
    if ((semi ? inp.mouse.pressed || (inp.mouse.down && p.fireCd <= -0.15) : inp.mouse.down) && p.fireCd <= 0) this.fire();
  }
  startGunFreestyle() {
    const p = this.player, gs = this.guns;
    const gun = p.weapon === 'rifle' ? 'rifle' : 'pistol';
    const targets = this.enemies.filter((e) => !e.dead && e.spawnT <= 0 && dist(e.x, e.y, p.x, p.y) < 260)
      .sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y)).map((e) => e.id);
    const near = this.nearestEnemy(p.x, p.y, 46, p.aim, Math.PI) ?? this.nearestEnemy(p.x, p.y, 46);
    const spd = Math.hypot(p.vx, p.vy);
    const dashing = p.dashT > 0 || p.sinceDash < 0.22;
    const lowHp = p.hp <= Math.max(1, p.maxHp * 0.3);
    const fan = (n: number, st: number, gap: number) => Array.from({ length: n }, (_, i) => st + i * gap);
    let kind: GunTrickKind, label: string, times: number[], total: number, cd: number, color: string;
    if (p.airborne) { kind = 'air'; label = 'AERIAL BURST'; times = fan(4, 0.04, 0.09); total = 0.48; cd = 1.0; color = '#9be7ff'; }
    else if (dashing) { kind = 'roll'; label = 'COMBAT ROLL'; times = fan(3, 0.1, 0.1); total = 0.46; cd = 0.95; color = '#ffffff'; }
    else if (near) { kind = 'lean'; label = 'SLIP FIRE'; times = fan(3, 0.05, 0.1); total = 0.4; cd = 0.9; color = '#9ff8ff'; }
    else if (p.moving && spd > 85) { kind = 'flip'; label = 'FLIP SHOT'; times = fan(4, 0.1, 0.1); total = 0.6; cd = 1.1; color = '#ffd27f'; }
    else if (p.moving && spd > 20) { kind = 'slide'; label = 'SLIDE FIRE'; times = fan(4, 0.07, 0.1); total = 0.5; cd = 0.95; color = '#d9e6ff'; }
    else if (lowHp || targets.length === 0) { kind = 'kneel'; label = 'LAST STAND'; times = fan(4, 0.09, 0.11); total = 0.6; cd = 1.0; color = '#fff3c4'; }
    else { kind = 'multi'; label = gun === 'pistol' ? 'FAN FIRE' : 'SUPPRESSIVE FIRE'; const n = clamp(targets.length, 3, 6); times = fan(n, 0.05, gun === 'pistol' ? 0.075 : 0.055); total = times[n - 1] + 0.14; cd = 1.1; color = gun === 'pistol' ? '#ffd27f' : '#9be7ff'; }
    gs.cd = cd; gs.twirlT = 0; gs.idleT = 0;
    gs.trick = { kind, label, t: 0, total, times, fired: 0, targets: targets.slice(0, Math.max(3, times.length)), color, weapon: gun };
    if (kind === 'flip') {
      p.airborne = true; p.vz = 245; p.jumpT = 0; p.jumpCd = 0.7; p.squash = 0.78;
      p.kx += p.lastDir.x * 70; p.ky += p.lastDir.y * 70;
      this.particles.smoke(p.x, p.y, 5, '#888', 26, 0.4); this.slow(0.5, 0.45);
    } else if (kind === 'air') {
      p.vz = Math.max(p.vz, 185); p.jumpT = 0; p.jumpCd = 0.45;
      this.particles.ring(p.x, p.y - 8 - p.z, 3, 18, color, 0.25, 1); this.slow(0.32, 0.45);
    } else if (kind === 'roll') {
      p.kx += p.lastDir.x * 150; p.ky += p.lastDir.y * 150;
      this.particles.smoke(p.x, p.y, 5, '#999', 24, 0.4);
    } else if (kind === 'slide') {
      p.kx += p.lastDir.x * 165; p.ky += p.lastDir.y * 165;
      this.particles.smoke(p.x, p.y, 5, '#999', 28, 0.45);
    } else if (kind === 'lean') {
      p.kx -= Math.cos(p.aim) * 80; p.ky -= Math.sin(p.aim) * 80;
      this.particles.ring(p.x, p.y - 8, 2, 14, color, 0.2, 1); this.slow(0.26, 0.4);
    } else if (kind === 'kneel') {
      this.particles.ring(p.x, p.y - 4, 2, 16, color, 0.24, 1);
    } else {
      this.particles.ring(p.x, p.y - 8, 3, 14, color, 0.22, 1); this.slow(0.36, 0.5);
    }
    if (kind === 'lean' || kind === 'slide' || kind === 'roll') p.iframes = Math.max(p.iframes, kind === 'lean' ? 0.3 : 0.22);
    this.say(label + '!', color, 2, 0.65);
    this.sfx.whoosh();
  }
  updateGunStyle(dt: number) {
    const p = this.player, gs = this.guns;
    if (p.weapon !== 'pistol' && p.weapon !== 'rifle') { gs.reset(); return; }
    gs.update(dt);
    if (!gs.trick) return;
    const tr = gs.trick;
    if (p.stunT > 0 || p.fatality || p.weapon !== tr.weapon) { gs.trick = null; gs.spinA = 0; return; }
    tr.t += dt;
    const u = clamp(tr.t / tr.total, 0, 1);
    const spinning = tr.kind === 'flip' || tr.kind === 'roll' || tr.kind === 'air';
    gs.spinA = spinning && u < 1 ? Math.PI * 2 * (u * u * (3 - 2 * u)) : 0;
    if ((tr.kind === 'slide' || tr.kind === 'roll') && Math.random() < 0.6) {
      this.particles.smoke(p.x - p.lastDir.x * 5, p.y + 1, 1, '#9a9a9a', 12, 0.3);
      this.particles.lines(p.x - p.lastDir.x * 6, p.y - 2, 1, '#ffffff', Math.atan2(-p.lastDir.y, -p.lastDir.x), 90);
    }
    if (spinning && Math.random() < 0.55) {
      const q = gs.trickPose();
      this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: q?.pose ?? 'shoot', poseT: q?.t ?? 0.5 }, tr.color, p.lean);
    }
    const n = tr.times.length;
    const id = tr.targets.length ? tr.targets[Math.min(tr.fired, n - 1) % tr.targets.length] : -1;
    const e = id >= 0 ? this.enemies.find((q) => q.id === id && !q.dead) : undefined;
    if (e) { const a = Math.atan2(e.y - e.z - 6 - (p.y - p.z - 7), e.x - p.x); p.aim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1; }
    while (tr.fired < n && tr.t >= tr.times[tr.fired]) {
      this.gunTrickShot(tr, tr.fired === n - 1);
      tr.fired++;
    }
    if (tr.t >= tr.total) {
      gs.trick = null; gs.spinA = 0;
      if (tr.kind === 'flip' || tr.kind === 'roll') { p.squash = 0.82; this.particles.smoke(p.x, p.y, 3, '#888', 18, 0.3); }
    }
  }
  /** Tembakan freestyle: TANPA mengurangi amunisi, tapi ada cooldown gaya */
  gunTrickShot(tr: GunTrick, last: boolean) {
    const p = this.player, pistol = p.weapon === 'pistol';
    const m = this.gunMuzzle();
    const a = p.aim + rnd(-0.018, 0.018);
    const sp = pistol ? 1150 : 1300;
    this.bullets.push({
      x: m.x, y: m.y, px: m.x, py: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2,
      dmg: (pistol ? 5.5 : 3.6) + this.stats.bulletDmg, owner: 'player', life: 1.1,
      color: pistol ? '#fff6c8' : '#ffe08a', pierce: this.stats.pierce, bounce: 0,
      kind: pistol ? 'pistol' : 'rifle', hitIds: [], structure: pistol ? 14 : 8, kb: pistol ? 120 : 55,
    });
    p.muzzleMax = pistol ? 0.08 : 0.055;
    p.muzzle = p.muzzleMax; p.muzzleX = m.x; p.muzzleY = m.y; p.muzzleA = a;
    const mxp = m.x + Math.cos(a) * 3, myp = m.y + Math.sin(a) * 3;
    this.gunfx.muzzle(mxp, myp, a, pistol, p.y, Math.cos(a) >= 0 ? 1 : -1);
    if (this.level.sideView && this.glowOn) this.glowFx.add(mxp, myp, pistol ? 46 : 52, '#ffd27f', 0.07);
    this.particles.spark(mxp, myp, 5, tr.color, a, 0.8, 200);
    this.guns.addTrail(mxp, myp, last ? 15 : 11, a - 1.15, a + 1.15, tr.color, last ? 4 : 2.5, 0.22);
    this.flash('#ffd27f', pistol ? 0.07 : 0.035);
    this.hitstop = Math.max(this.hitstop, pistol ? 0.012 : 0.006);
    this.sfx.shot(pistol ? 'pistol' : 'rifle', Math.cos(a)); this.sfx.casing();
    this.shake(pistol ? 0.42 : 0.26);
    this.hitstop = Math.max(this.hitstop, pistol ? 0.024 : 0.012);
    p.recoil = 1; p.shootT = 0.12; p.fireCd = 0.06;
    p.kx -= Math.cos(a) * (pistol ? 26 : 14); p.ky -= Math.sin(a) * (pistol ? 26 : 14);
    this.camKick.x -= Math.cos(a) * (pistol ? 6.5 : 3.2); this.camKick.y -= Math.sin(a) * (pistol ? 6.5 : 3.2);
    const q = this.guns.trickPose();
    this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: q?.pose ?? 'shoot', poseT: q?.t ?? 0.5 }, '#ffd27f', p.lean);
    if (last) { this.particles.ring(mxp, myp, 2, 13, tr.color, 0.18, 1); this.slow(0.12, 0.4); }
  }
  // ------------------------------------------------------------------ BUSTER SWORD
  buBeamPending = false;
  buOmniPose: Pose = 'a_chop';
  busterInput(dt: number) {
    const p = this.player, inp = this.input, bu = this.bu;
    if (bu.omni) return;
    if (inp.mouse.rpressed && !p.airborne) {
      if (bu.limit >= 100 && p.attackPhase === 'none') { this.startOmnislash(); return; }
      bu.charging = false; bu.charge = 0;
      this.queueAttack('H');
    }
    if (inp.mouse.pressed && !p.airborne) {
      if (p.attackPhase !== 'none') this.queueAttack('L');     // lanjut combo, tanpa charge
      else { bu.charging = true; bu.holdT = 0; bu.charge = 0; }
    }
    if (bu.charging) {
      if (p.attackPhase !== 'none' || p.airborne || p.stunT > 0) { bu.charging = false; bu.charge = 0; return; }
      if (inp.mouse.down) {
        bu.holdT += dt;
        if (bu.holdT > 0.16) {
          const before = bu.charge;
          bu.charge = Math.min(1, bu.charge + dt / 0.6);
          if (Math.floor(before * 8) !== Math.floor(bu.charge * 8) && bu.charge < 1) this.sfx.busterHum(bu.charge);
          if (Math.random() < 0.5) this.particles.spark(p.x + rnd(-8, 8), p.y - rnd(0, 14), 1, MAKO, -Math.PI / 2, 0.4, 60 + 80 * bu.charge);
          if (before < 1 && bu.charge >= 1) {
            this.sfx.focus(); this.flash(MAKO, 0.08);
            this.particles.ring(p.x, p.y - 8, 3, 18, MAKO2, 0.25, 1);
          }
        }
      } else {
        const full = bu.charge >= 1, tap = bu.holdT <= 0.16;
        bu.charging = false; bu.charge = 0;
        if (full) {
          bu.swing(this.time);
          this.buBeamPending = true;
          this.startAttack(bu.punisher ? 'PXBEAM' : 'XBEAM');
        } else if (tap || bu.holdT > 0.16) this.queueAttack('L');
      }
    }
  }
  updateBuster(dt: number) {
    const p = this.player, bu = this.bu;
    if (p.weapon !== 'buster') { bu.charging = false; bu.omni = null; return; }
    bu.update(dt, this.time);
    // gelombang dilepas tepat di frame tebasan
    if (this.buBeamPending && p.attackPhase === 'active') {
      this.buBeamPending = false;
      const sk = solvePose(this.playerStickOpts('k_heaven', 0.4));
      const hx = p.x + sk.fhand.x + Math.cos(p.aim) * 10, hy = p.y + sk.fhand.y - p.z + Math.sin(p.aim) * 6;
      const sp = 430;
      const big = bu.punisher ? 1.35 : 1;
      bu.beams.push({ x: hx, y: hy, vx: Math.cos(p.aim) * sp, vy: Math.sin(p.aim) * sp, life: 0.75, max: 0.75, hit: [], size: 13 * big, dmg: 14 * big });
      this.sfx.bowRelease(1); this.sfx.slash(0.6); this.shake(0.5);
      this.particles.shockwave(hx, hy, 18, MAKO, 0.25);
      this.say('BLADE BEAM!', MAKO2, 2, 0.6);
    }
    if (p.attackPhase === 'none') this.buBeamPending = false;
    // ATRAKSI: pedang diseret saat lari -> percikan api di tanah
    if (!bu.omni && p.attackPhase === 'none' && !bu.punisher && !p.airborne && Math.hypot(p.vx, p.vy) > 90) {
      bu.sparkT -= dt;
      if (bu.sparkT <= 0) {
        bu.sparkT = 0.05;
        const tx = p.x - Math.cos(p.aim) * 20, ty = p.y + 1;
        this.particles.spark(tx, ty, 2, Math.random() < 0.5 ? '#ffd27f' : '#ffffff', Math.atan2(-0.6, -Math.cos(p.aim)), 0.8, 110);
        if (Math.random() < 0.2) this.particles.smoke(tx, ty, 1, '#8a8378', 8, 0.3);
      }
    }
    if (bu.omni) this.updateOmnislash();
  }
  updateBeams(dt: number) {
    const list = this.bu.beams;
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b.life -= dt;
      const steps = 4;
      let alive = b.life > 0;
      for (let s = 0; s < steps && alive; s++) {
        b.x += (b.vx * dt) / steps; b.y += (b.vy * dt) / steps;
        if (solidAt(this.level, b.x, b.y)) {
          this.particles.shockwave(b.x, b.y, 14, MAKO, 0.2);
          this.particles.burst(b.x, b.y, 6, this.pal.wallTop, 140, 0.4, 2, 3);
          this.sfx.slam(); this.shake(0.3);
          alive = false; break;
        }
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0 || b.hit.includes(e.id)) continue;
          if (dist(b.x, b.y, e.x, e.y - 6 - e.z) > b.size * 0.75 + e.r) continue;
          b.hit.push(e.id);
          const a = Math.atan2(b.vy, b.vx);
          this.damageEnemy(e, b.dmg, 70, a, 420, { knockdown: true, hitstop: 0.08, shake: 0.6, melee: true, launch: 70 });
          this.particles.blood(e.x, e.y - 6, 10, a, 180);
          this.particles.spark(e.x, e.y - 6, 8, MAKO2, a, 1, 260);
          this.sfx.slashHit(true);
          this.bu.addLimit(5);
          this.addCombo();
        }
      }
      if (Math.random() < 0.7) this.particles.spark(b.x, b.y, 1, MAKO, Math.atan2(-b.vy, -b.vx), 0.6, 80);
      if (!alive) list.splice(i, 1);
    }
  }
  /** hantaman berat menyentuh tanah: gelombang kejut + retakan + area damage */
  busterImpact(move: Move) {
    const p = this.player, bu = this.bu;
    const id = move.id.replace(/_p$/, '');
    const big = id === 'x_braver' || id === 'x_plunge' || id === 'x_finish';
    if (!big && id !== 'x_beam') return;
    const gx = p.x + Math.cos(p.aim) * 22, gy = p.y + Math.sin(p.aim) * 12;
    const R = (id === 'x_braver' ? 34 : id === 'x_plunge' ? 30 : 24) * (bu.punisher ? 1.25 : 1);
    this.particles.shockwave(gx, gy, R, MAKO, 0.35);
    this.particles.shockwave(gx, gy, R * 0.6, '#ffffff', 0.22);
    this.particles.smoke(gx, gy, 10, '#8a8a8a', 50, 0.55);
    this.particles.burst(gx, gy, 10, this.pal.wallTop, 170, 0.5, 2, 3);
    this.particles.dirBurst(gx, gy, 10, MAKO2, -Math.PI / 2, 0.9, 200, 0.4);
    this.stamp(gx, gy, '#00000066', 3);
    this.sfx.slam(); this.sfx.explosion();
    this.shake(big ? 1 : 0.5); this.flash(MAKO, 0.1);
    if (big) {
      for (const e of this.enemies) {
        if (e.dead || e.spawnT > 0 || p.hitSet.includes(e.id)) continue;
        if (dist(gx, gy, e.x, e.y) > R + e.r) continue;
        const a = Math.atan2(e.y - gy, e.x - gx);
        this.damageEnemy(e, move.dmg * 0.45, 40, a, 300, { knockdown: true, hitstop: 0.03, shake: 0.2, melee: true, launch: 110 });
      }
      bu.restT = 0.9; bu.flourishMax = 0.55; bu.flourish = 0.55;
      window.setTimeout(() => this.sfx.leverClack(), 520);
    }
  }
  startOmnislash() {
    const p = this.player, bu = this.bu;
    const targets = this.enemies.filter((e) => !e.dead && e.spawnT <= 0 && dist(e.x, e.y, p.x, p.y) < 260)
      .sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y)).slice(0, 6).map((e) => e.id);
    if (!targets.length) { this.texts.add(p.x, p.y - 28, 'NO TARGET', '#9a9a9a', 1, 0.5); return; }
    bu.limit = 0; bu.charging = false;
    bu.omni = { t: 0, step: 0, next: 0.35, targets, phase: 'slash', sx: p.x, sy: p.y, dropTarget: targets[0] };
    this.slow(2.6, 0.3);
    this.flash('#ffffff', 0.4);
    this.say('OMNISLASH', MAKO2, 3, 1.4);
    this.sfx.announce(); this.sfx.focus();
    this.particles.shockwave(p.x, p.y - 6, 40, MAKO, 0.45);
    for (let i = 0; i < 12; i++) this.particles.spark(p.x, p.y - 8, 2, MAKO2, (i / 12) * Math.PI * 2, 0.4, 200);
    bu.flourishMax = 0.35; bu.flourish = 0.35;
  }
  updateOmnislash() {
    const p = this.player, bu = this.bu, o = bu.omni!;
    const raw = this.rawDt;
    o.t += raw;
    p.vx = 0; p.vy = 0; p.kx = 0; p.ky = 0; p.iframes = Math.max(p.iframes, 0.3); p.attackPhase = 'none';
    const STEPS = 14;
    const alive = () => o.targets.map((id) => this.enemies.find((e) => e.id === id && !e.dead)).filter((e): e is Enemy => !!e);
    if (o.phase === 'slash') {
      if (o.t < o.next) return;
      o.next = o.t + 0.075;
      const pool = alive();
      if (!pool.length || o.step >= STEPS) {
        const last = pool[0] ?? this.enemies.find((e) => e.id === o.dropTarget);
        o.dropTarget = last ? last.id : -1;
        o.phase = 'rise'; o.t = 0; o.next = 0;
        this.sfx.launch();
        return;
      }
      const e = pool[o.step % pool.length];
      o.dropTarget = e.id;
      // berpindah kilat ke sisi lain musuh
      const side = o.step * 2.39996 + rnd(-0.4, 0.4);
      const R = e.r + p.r + 9;
      let nx = e.x + Math.cos(side) * R, ny = e.y + Math.sin(side) * R * 0.7;
      if (!this.isFree(nx, ny, p.r)) { nx = e.x - Math.cos(side) * R; ny = e.y - Math.sin(side) * R * 0.7; }
      if (!this.isFree(nx, ny, p.r)) { nx = p.x; ny = p.y; }
      for (let i = 1; i <= 3; i++) {
        const tt = i / 4;
        this.addAfterimage({ x: lerp(p.x, nx, tt), y: lerp(p.y, ny, tt) - p.z, facing: p.facing, aim: p.aim, pose: this.buOmniPose, poseT: 0.5 }, MAKO, p.lean);
      }
      p.x = nx; p.y = ny; p.z = 0;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      p.aim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1;
      const poses: Pose[] = ['a_chop', 'a_backswing', 'k_rising', 'k_dragonfang', 'a_overhead'];
      this.buOmniPose = poses[o.step % poses.length];
      const from = (o.step % 2 ? 2.2 : -2.2), to = -from * 0.5;
      p.bladeA = a + to * p.facing;
      this.bu.addSlash(e.x, e.y - 7 - e.z, 26, a + from * p.facing, a + to * p.facing, o.step % 3 === 2 ? '#ffffff' : MAKO, 4.5, 0, 0.22);
      this.bu.addSlash(e.x, e.y - 7 - e.z, 19, a + from * p.facing + 0.2, a + to * p.facing - 0.3, MAKO2, 2, 0, 0.16, 0.5);
      e.stun = Math.max(e.stun, 0.6);
      this.damageEnemy(e, 3.2, 22, a, 40, { hitstop: 0.015, shake: 0.18, melee: true });
      this.particles.spark(e.x, e.y - 7, 6, MAKO2, a, 1, 260);
      this.particles.blood(e.x, e.y - 7, 4, a, 140);
      if (o.step % 2) this.sfx.slash(0.8 + Math.random() * 0.4); else this.sfx.axeHit(false);
      this.addCombo();
      o.step++;
    } else if (o.phase === 'rise') {
      // melompat tinggi, pedang terangkat di atas kepala
      const u = clamp(o.t / 0.28, 0, 1);
      p.z = 58 * Math.sin(u * Math.PI * 0.5);
      this.buOmniPose = 'a_overhead';
      p.bladeA = p.aim - p.facing * 2.6;
      const tgt = this.enemies.find((e) => e.id === o.dropTarget && !e.dead);
      if (tgt) { const a = Math.atan2(tgt.y - p.y, tgt.x - p.x); p.aim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1; }
      if (Math.random() < 0.6) this.particles.spark(p.x, p.y - p.z - 8, 1, MAKO2, Math.PI / 2, 0.5, 120);
      if (u >= 1) { o.phase = 'drop'; o.t = 0; }
    } else {
      // tusukan meteor ke bawah
      const u = clamp(o.t / 0.1, 0, 1);
      const tgt = this.enemies.find((e) => e.id === o.dropTarget && !e.dead);
      if (tgt && u < 1) { p.x = lerp(p.x, tgt.x - Math.cos(p.aim) * 10, 0.4); p.y = lerp(p.y, tgt.y - Math.sin(p.aim) * 6, 0.4); }
      p.z = 58 * (1 - u);
      p.bladeA = p.aim + p.facing * 1.0;
      this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'a_overhead', poseT: 0.5 }, MAKO2, p.lean);
      if (u >= 1) {
        p.z = 0;
        const gx = p.x + Math.cos(p.aim) * 14, gy = p.y + Math.sin(p.aim) * 8;
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0 || dist(gx, gy, e.x, e.y) > 46 + e.r) continue;
          const a = Math.atan2(e.y - gy, e.x - gx);
          this.damageEnemy(e, e.id === o.dropTarget ? 26 : 12, 160, a, 620, { knockdown: true, hitstop: 0.2, shake: 1.4, melee: true, launch: 200 });
        }
        for (let i = 0; i < 3; i++) this.particles.shockwave(gx, gy, 30 + i * 18, i === 1 ? '#ffffff' : MAKO, 0.35 + i * 0.12);
        this.particles.dirBurst(gx, gy, 18, MAKO2, -Math.PI / 2, 1.2, 260, 0.5);
        this.particles.smoke(gx, gy, 14, '#8a8a8a', 60, 0.6);
        this.stamp(gx, gy, '#00000077', 4);
        this.sfx.explosion(); this.sfx.slam(); this.sfx.fatality();
        this.flash('#ffffff', 0.5); this.shake(1.6); this.hitstop = Math.max(this.hitstop, 0.16);
        this.slowT = 0; this.slow(0.45, 0.25);
        bu.omni = null; bu.restT = 1.2; bu.flourishMax = 0.7; bu.flourish = 0.7;
        window.setTimeout(() => { this.sfx.whoosh(); }, 250);
        window.setTimeout(() => { this.sfx.leverClack(); }, 700);
      }
    }
  }
  // ------------------------------------------------------------------ BUSUR / PANAH
  /** tulang terdekat dari titik layar (x,y) pada skeleton musuh */
  nearestBone(sp: SkelPts, x: number, y: number) {
    let best = { bone: 1, u: 0.5, d: 1e9 };
    for (let i = 0; i < BONES.length; i++) {
      const B = BONES[i], A = sp.pts[B.a], C = sp.pts[B.b];
      if (B.part === 'head') {
        const d = Math.max(0, Math.hypot(x - C.x, y - C.y) - 2.8 * sp.scale);
        if (d < best.d) best = { bone: i, u: 1, d };
        continue;
      }
      const vx = C.x - A.x, vy = C.y - A.y, l2 = vx * vx + vy * vy || 1;
      const u = clamp(((x - A.x) * vx + (y - A.y) * vy) / l2, 0.12, 0.92);
      const d = Math.max(0, Math.hypot(x - (A.x + vx * u), y - (A.y + vy * u)) - (B.part === 'torso' ? 1.6 : 1.1) * sp.scale);
      if (d < best.d) best = { bone: i, u, d };
    }
    return best;
  }
  /** bagian tubuh di bawah kursor saat melepas: panah akan menancap TEPAT di situ */
  pickArrowTarget(x: number, y: number): { id: number; bone: number; u: number } | null {
    let best: { id: number; bone: number; u: number; d: number } | null = null;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const sp = this.eSkel.get(e.id);
      if (!sp) continue;
      const h = this.nearestBone(sp, x, y);
      if (h.d < 3.5 && (!best || h.d < best.d)) best = { id: e.id, bone: h.bone, u: h.u, d: h.d };
    }
    return best ? { id: best.id, bone: best.bone, u: best.u } : null;
  }
  bowInput(dt: number) {
    const p = this.player, inp = this.input, bw = this.bow;
    if (bw.nock > 0) { bw.nock -= dt; if (bw.nock <= 0) { bw.nock = 0; this.sfx.bowNock(); } }
    if (bw.flourishT > 0) bw.flourishT = Math.max(0, bw.flourishT - dt);
    if (inp.mouse.pressed || inp.mouse.rpressed) bw.flourishT = 0;
    if (bw.trick) return;
    // ATRAKSI IDLE: setelah diam beberapa detik, busur diputar di tangan (bukan serangan)
    if (!bw.drawing && !p.moving && p.attackPhase === 'none' && !p.airborne && p.stunT <= 0) {
      bw.idleT += dt;
      if (bw.idleT > 2.2 && bw.flourishT <= 0) {
        bw.flourishT = bw.FLOURISH_DUR; bw.idleT = 0;
        this.sfx.whoosh(); this.sfx.bowNock();
        this.particles.ring(p.x + Math.cos(p.aim) * 5, p.y - 9, 2, 8, '#fff3c4', 0.18, 1);
      }
    } else bw.idleT = 0;
    if (inp.mouse.rpressed && bw.cd <= 0 && p.attackPhase === 'none' && p.stunT <= 0) { this.startBowTrick(); return; }
    if (inp.mouse.pressed && !bw.drawing) { bw.drawing = true; bw.holdT = 0; bw.draw = 0; bw.full = false; bw.creakT = 0.05; }
    if (bw.drawing) {
      if (inp.mouse.down) {
        bw.holdT += dt;
        if (bw.nock <= 0) {
          const before = bw.draw;
          bw.draw = Math.min(1, bw.draw + dt / 0.52);
          bw.creakT -= dt;
          if (bw.creakT <= 0 && bw.draw < 1 && bw.holdT > 0.1) { bw.creakT = 0.07; this.sfx.bowCreak(bw.draw); }
          if (before < 1 && bw.draw >= 1) {
            bw.full = true; bw.glint = 1; this.sfx.bowFull();
            this.particles.ring(p.x + Math.cos(p.aim) * 8, p.y - 8 - p.z, 2, 9, '#fff3c4', 0.18, 1);
          }
        }
      } else {
        const quick = bw.holdT < 0.15;
        bw.drawing = false;
        if (bw.nock > 0) bw.pendingQuick = true;
        else this.releaseArrow(quick ? 0.42 : Math.max(0.3, bw.draw), quick);
      }
    }
    if (bw.pendingQuick && bw.nock <= 0) { bw.pendingQuick = false; this.releaseArrow(0.42, true); }
  }
  bowHand(draw: number) {
    const p = this.player;
    const q = this.bow.trickPose;
    const sk = solvePose(this.playerStickOpts(q ? q.pose : 'bow', q ? q.t : draw));
    return { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
  }
  releaseArrow(power: number, quick: boolean) {
    const p = this.player, bw = this.bow;
    const h = this.bowHand(bw.drawVis);
    const mw = this.mouseWorld();
    const ang = Math.hypot(mw.x - h.x, mw.y - h.y) > 10 ? Math.atan2(mw.y - h.y, mw.x - h.x) : p.aim;
    const target = this.pickArrowTarget(mw.x, mw.y);
    // IRAMA: klik cepat beruntun = ambil panah makin kilat
    const gap = this.time - bw.lastShot;
    bw.streak = gap < 0.42 ? Math.min(6, bw.streak + 1) : 0;
    bw.lastShot = this.time;
    bw.nockMax = Math.max(0.055, 0.2 - bw.streak * 0.03);
    bw.nock = bw.nockMax;
    bw.draw = 0; bw.full = false; bw.vib = 0.6 + 0.6 * power;
    p.recoil = 1; p.shootT = 0.12;
    const spread = quick ? 0.035 : 0.012 * (1 - power);
    this.spawnArrow(h.x, h.y, ang + rnd(-spread, spread), power, target, false);
    this.sfx.bowRelease(power);
    if (power > 0.95) {
      this.shake(0.22); this.hitstop = Math.max(this.hitstop, 0.025);
      this.particles.ring(h.x, h.y, 2, 12, '#fff3c4', 0.15, 1);
      this.camKick.x -= Math.cos(ang) * 4; this.camKick.y -= Math.sin(ang) * 4;
      p.kx -= Math.cos(ang) * 30; p.ky -= Math.sin(ang) * 30;
    }
    if (bw.streak >= 2) this.texts.add(p.x, p.y - 28 - p.z, `RAPID x${bw.streak + 1}`, bw.streak >= 5 ? '#ff9d4a' : '#ffd27f', 1, 0.35);
  }
  spawnArrow(x: number, y: number, ang: number, power: number, target: { id: number; bone: number; u: number } | null, trick: boolean) {
    const sp = 520 + 780 * power;
    this.bow.arrows.push({
      x, y, px: x, py: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      life: 0.42 + 0.5 * power, dmg: 2.6 + 9.4 * power + this.stats.bulletDmg, power, hit: [], target, trick,
    });
  }
  startBowTrick() {
    const p = this.player, bw = this.bow;
    const targets = this.enemies.filter((e) => !e.dead && e.spawnT <= 0 && dist(e.x, e.y, p.x, p.y) < 240)
      .sort((a, b) => dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y)).map((e) => e.id);
    const near = this.nearestEnemy(p.x, p.y, 46, p.aim, Math.PI) ?? this.nearestEnemy(p.x, p.y, 46);
    const spd = Math.hypot(p.vx, p.vy);
    const dashing = p.dashT > 0 || p.sinceDash < 0.22;
    const lowHp = p.hp <= Math.max(1, p.maxHp * 0.3);
    const fan = (n: number, start: number, step: number) => Array.from({ length: n }, (_, i) => start + i * step);
    // KONTEKS menentukan atraksi: bukan tombol yang sama melulu.
    let kind: NonNullable<typeof bw.trick>['kind'], label: string, times: number[], total: number, cd: number, color: string;
    if (p.airborne) { kind = 'air'; label = 'AERIAL SPIRAL'; times = fan(3, 0.05, 0.1); total = 0.46; cd = 1.0; color = '#9be7ff'; }
    else if (dashing) { kind = 'roll'; label = 'ROLL SHOT'; times = fan(3, 0.12, 0.11); total = 0.5; cd = 0.95; color = '#ffffff'; }
    else if (near) { kind = 'lean'; label = 'SLIP SHOT'; times = fan(2, 0.06, 0.13); total = 0.4; cd = 0.9; color = '#9ff8ff'; }
    else if (p.moving && spd > 85) { kind = 'flip'; label = 'ACRO SHOT'; times = fan(3, 0.13, 0.12); total = 0.62; cd = 1.1; color = '#ffd27f'; }
    else if (p.moving && spd > 20) { kind = 'slide'; label = 'SLIDE SHOT'; times = fan(3, 0.08, 0.12); total = 0.5; cd = 0.95; color = '#d9e6ff'; }
    else if (lowHp || targets.length === 0) { kind = 'kneel'; label = 'ANCHOR SHOT'; times = fan(4, 0.1, 0.11); total = 0.62; cd = 1.0; color = '#fff3c4'; }
    else { kind = 'multi'; label = 'MULTI SHOT'; const n = clamp(targets.length, 3, 5); times = fan(n, 0.06, 0.085); total = times[n - 1] + 0.16; cd = 1.05; color = '#ffd27f'; }
    bw.drawing = false; bw.draw = 0; bw.pendingQuick = false; bw.cd = cd; bw.flourishT = 0;
    bw.trick = { kind, label, t: 0, total, times, fired: 0, targets: targets.slice(0, Math.max(3, times.length)) };
    // Efek & fisika per situasi
    if (kind === 'flip') {
      p.airborne = true; p.vz = 255; p.jumpT = 0; p.jumpCd = 0.7; p.squash = 0.78;
      p.kx += p.lastDir.x * 70; p.ky += p.lastDir.y * 70;
      this.particles.smoke(p.x, p.y, 5, '#888', 26, 0.4);
      this.slow(0.55, 0.45);
    } else if (kind === 'air') {
      p.vz = Math.max(p.vz, 190); p.jumpT = 0; p.jumpCd = 0.45;
      this.particles.ring(p.x, p.y - 8 - p.z, 3, 18, color, 0.25, 1);
      this.slow(0.35, 0.45);
    } else if (kind === 'roll') {
      p.kx += p.lastDir.x * 150; p.ky += p.lastDir.y * 150;
      this.particles.smoke(p.x, p.y, 5, '#999', 24, 0.4);
    } else if (kind === 'slide') {
      p.kx += p.lastDir.x * 165; p.ky += p.lastDir.y * 165;
      this.particles.smoke(p.x, p.y, 5, '#999', 28, 0.45);
    } else if (kind === 'lean') {
      p.kx -= Math.cos(p.aim) * 80; p.ky -= Math.sin(p.aim) * 80;
      this.particles.ring(p.x, p.y - 8, 2, 14, color, 0.2, 1);
      this.slow(0.28, 0.4);
    } else if (kind === 'kneel') {
      this.particles.ring(p.x, p.y - 4, 2, 16, color, 0.24, 1);
      bw.glint = 1;
    } else {
      this.particles.ring(p.x, p.y - 8, 3, 14, color, 0.22, 1);
      this.slow(0.4, 0.5);
    }
    // pose menghindar memberi jendela kebal singkat; rasanya seperti memang menghindari serangan
    if (kind === 'lean' || kind === 'slide' || kind === 'roll') p.iframes = Math.max(p.iframes, kind === 'lean' ? 0.3 : 0.22);
    this.say(label + '!', color, 2, 0.65);
    this.sfx.whoosh();
  }
  updateBowTrick(dt: number) {
    const p = this.player, bw = this.bow;
    if (!bw.trick) return;
    if (p.weapon !== 'bow' || p.stunT > 0 || p.fatality) { bw.trick = null; bw.spinA = 0; return; }
    const tr = bw.trick;
    tr.t += dt;
    const u = clamp(tr.t / tr.total, 0, 1);
    // badan berputar penuh hanya pada atraksi yang memang berputar
    const spinning = tr.kind === 'flip' || tr.kind === 'roll' || tr.kind === 'air';
    bw.spinA = spinning && u < 1 ? Math.PI * 2 * (u * u * (3 - 2 * u)) : 0;
    if ((tr.kind === 'slide' || tr.kind === 'roll') && Math.random() < 0.6) {
      this.particles.smoke(p.x - p.lastDir.x * 5, p.y + 1, 1, '#9a9a9a', 12, 0.3);
      this.particles.lines(p.x - p.lastDir.x * 6, p.y - 2, 1, '#ffffff', Math.atan2(-p.lastDir.y, -p.lastDir.x), 90);
    }
    if (spinning && Math.random() < 0.55) this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: bw.trickPose?.pose ?? 'bow', poseT: u }, '#9be7ff', p.lean);
    const n = tr.times.length;
    const id = tr.targets.length ? tr.targets[Math.min(tr.fired, n - 1) % tr.targets.length] : -1;
    const e = id >= 0 ? this.enemies.find((q) => q.id === id && !q.dead) : undefined;
    if (e) { const a = Math.atan2(e.y - e.z - 7 * e.scale - (p.y - p.z - 8), e.x - p.x); p.aim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1; }
    while (tr.fired < n && tr.t >= tr.times[tr.fired]) {
      const h = this.bowHand(1);
      const last = tr.fired === n - 1;
      let ang: number, target: { id: number; bone: number; u: number } | null = null;
      if (e) {
        const sp = this.eSkel.get(e.id);
        const bone = last ? 0 : 1;
        const pt = sp ? (bone === 0 ? sp.pts[0] : { x: (sp.pts[1].x + sp.pts[2].x) / 2, y: (sp.pts[1].y + sp.pts[2].y) / 2 }) : { x: e.x, y: e.y - e.z - 7 };
        ang = Math.atan2(pt.y - h.y, pt.x - h.x);
        target = { id: e.id, bone, u: bone === 0 ? 1 : 0.45 };
      } else ang = p.aim + (tr.fired - (n - 1) / 2) * 0.2;
      this.spawnArrow(h.x, h.y, ang, 0.82, target, true);
      this.sfx.bowRelease(0.8);
      bw.vib = 1; p.recoil = 1;
      const q = bw.trickPose;
      this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: q?.pose ?? 'bow', poseT: q?.t ?? 0.5 }, '#ffd27f', p.lean);
      tr.fired++;
    }
    if (tr.t >= tr.total) {
      bw.trick = null; bw.spinA = 0; bw.nock = 0.08; bw.nockMax = 0.08;
      if (tr.kind === 'flip' || tr.kind === 'roll') { p.squash = 0.82; this.particles.smoke(p.x, p.y, 3, '#888', 18, 0.3); }
    }
  }
  arrowStick(ar: { x: number; y: number; vx: number; vy: number; power: number }, kind: 'wall' | 'ground') {
    const ang = Math.atan2(ar.vy, ar.vx);
    this.bow.addStuck({ kind, id: -1, rd: null, bone: 0, u: 0, rel: 0, face: 1, x: ar.x, y: ar.y, ang, life: 7, depth: kind === 'wall' ? 2.5 + ar.power * 2 : 0, wob: kind === 'wall' ? 1 : 0.5 });
  }
  updateArrows(dt: number) {
    const p = this.player, list = this.bow.arrows;
    for (let i = list.length - 1; i >= 0; i--) {
      const ar = list[i];
      ar.px = ar.x; ar.py = ar.y;
      ar.life -= dt;
      const sp = Math.hypot(ar.vx, ar.vy);
      const steps = Math.max(1, Math.ceil((sp * dt) / 2.5));
      let alive = true;
      for (let s = 0; s < steps && alive; s++) {
        ar.x += (ar.vx * dt) / steps; ar.y += (ar.vy * dt) / steps;
        if (solidAt(this.level, ar.x, ar.y)) {
          ar.x -= (ar.vx * dt) / steps * 0.6; ar.y -= (ar.vy * dt) / steps * 0.6;
          this.arrowStick(ar, 'wall');
          this.sfx.arrowWood();
          this.particles.burst(ar.x, ar.y, 3, this.pal.wallTop, 70, 0.3, 1, 2);
          this.particles.spark(ar.x, ar.y, 3, '#fff3a0', Math.atan2(-ar.vy, -ar.vx), 0.7, 120);
          alive = false; break;
        }
        for (const e of this.enemies) {
          if (e.dead || e.spawnT > 0 || ar.hit.includes(e.id)) continue;
          const s2 = e.scale, top = e.y - e.z;
          if (Math.abs(ar.x - e.x) > 7 * s2 + 2 || ar.y < top - 17 * s2 || ar.y > top + 2) continue;
          const skp = this.eSkel.get(e.id);
          let bone = -1, u = 0.5;
          if (ar.target && ar.target.id === e.id) { bone = ar.target.bone; u = ar.target.u; }
          else if (skp) { const h = this.nearestBone(skp, ar.x, ar.y); if (h.d < 1.2) { bone = h.bone; u = h.u; } }
          else if (dist(ar.x, ar.y, e.x, top - 6) < e.r + 2) { bone = 1; u = 0.45; }
          if (bone < 0) continue;
          ar.hit.push(e.id);
          const a = Math.atan2(ar.vy, ar.vx);
          if (e.kind === 'shield' && e.stagger <= 0 && e.z <= 0 && Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.aim)) < 1.3) {
            // tertahan perisai: panah menancap di perisai
            const B = skp ? BONES[2] : null;
            const rel = skp && B ? a - Math.atan2(skp.pts[B.b].y - skp.pts[B.a].y, skp.pts[B.b].x - skp.pts[B.a].x) : 0;
            this.bow.addStuck({ kind: 'enemy', id: e.id, rd: null, bone: 2, u: 1, rel, face: skp?.face ?? e.facing, x: ar.x, y: ar.y, ang: a, life: 0, depth: 2 });
            this.sfx.arrowWood(); this.particles.spark(ar.x, ar.y, 4, '#ffffff', a + Math.PI, 0.8, 140);
            e.structure += 6;
            alive = false; break;
          }
          this.arrowHitEnemy(ar, e, bone, u, skp);
          alive = false; break;
        }
        if (alive) for (const pr of this.props) {
          if (pr.dead || dist(ar.x, ar.y, pr.x, pr.y - 3) > pr.r + 1) continue;
          this.damageProp(pr, ar.dmg, Math.atan2(ar.vy, ar.vx));
          this.arrowStick(ar, 'wall'); this.sfx.arrowWood();
          alive = false; break;
        }
      }
      if (alive && ar.life <= 0) {
        // kehabisan tenaga: jatuh & menancap di tanah
        this.arrowStick({ ...ar, y: ar.y + 7 }, 'ground');
        this.particles.smoke(ar.x, ar.y + 7, 1, '#8a8378', 8, 0.25);
        alive = false;
      }
      if (!alive) list.splice(i, 1);
    }
  }
  arrowHitEnemy(ar: { x: number; y: number; vx: number; vy: number; power: number; dmg: number }, e: Enemy, bone: number, u: number, skp: SkelPts | undefined) {
    const part: Part = BONES[bone].part;
    const a = Math.atan2(ar.vy, ar.vx);
    let rel = 0;
    if (skp) { const B = BONES[bone]; const A = skp.pts[B.a], C = skp.pts[B.b]; rel = a - Math.atan2(C.y - A.y, C.x - A.x); }
    // tancapkan DULU, supaya bila musuh mati panahnya ikut ke ragdoll
    this.bow.addStuck({ kind: 'enemy', id: e.id, rd: null, bone, u: part === 'head' ? 1 : u, rel, face: skp?.face ?? e.facing, x: ar.x, y: ar.y, ang: a, life: 0, depth: 3 + ar.power * 2.5 });
    const mul = part === 'head' ? 2.4 : part === 'torso' ? 1 : part === 'arm' ? 0.75 : 0.85;
    const dmg = ar.dmg * mul;
    const knock = ar.power > 0.85 || (part === 'head' && ar.power > 0.6);
    this.damageEnemy(e, dmg, 10 + 50 * ar.power, a, 60 + 430 * ar.power * (part === 'head' ? 1.2 : 1), {
      knockdown: knock, hitstop: 0.02 + 0.06 * ar.power + (part === 'head' ? 0.03 : 0), shake: 0.05 + 0.3 * ar.power, melee: false, launch: knock ? 30 + 60 * ar.power : undefined,
      zone: part === 'head' ? 'head' : part === 'leg' ? 'legs' : 'torso',
    });
    this.particles.blood(ar.x, ar.y, 3 + Math.floor(dmg * 0.6), a, 120);
    this.blood.spray(ar.x, ar.y, a, dmg * 0.6, false);
    this.particles.impact(ar.x, ar.y, part === 'head' ? 6 : 4, '#ffffff');
    this.sfx.arrowFlesh(ar.power > 0.85 || part === 'head');
    if (part === 'head') {
      this.sfx.headshot();
      this.texts.add(e.x, e.y - 24 - e.z, 'HEADSHOT!', '#ff5a3a', 1, 0.8);
      if (ar.power > 0.85) { this.slow(0.22, 0.3); this.flash('#ffffff', 0.08); }
    } else if (ar.power > 0.85) this.texts.add(e.x, e.y - 22 - e.z, part === 'torso' ? 'TEMBUS!' : part === 'arm' ? 'LENGAN!' : 'KAKI!', '#ffd27f', 1, 0.5);
    this.addCombo();
    this.hitMarkerT = 0.14; this.hitMarkerKill = e.dead;
  }
  /** SHOTGUN: LMB tembak (atau pentung kalau kosong), RMB isi ulang dengan putaran ala Terminator */
  shotgunInput() {
    const p = this.player, inp = this.input, sg = this.sg;
    const attacking = p.attackPhase !== 'none';
    if (inp.mouse.rpressed && !attacking && !p.airborne) {
      if (sg.startReload()) { this.texts.add(p.x, p.y - 26, 'RELOAD', '#ffd27f', 1, 0.5); this.sfx.leverClick(); }
      else if (!sg.busy) { sg.startCock(); sg.kick = 0; this.sfx.spinCock(); } // sudah penuh: pamer putaran
    }
    if (inp.mouse.pressed && !p.airborne) {
      if (sg.shells > 0 && !attacking && (sg.phase === 'ready' || sg.reloading)) {
        if (sg.reloading) sg.cancel();
        this.fireShotgun();
      } else if (sg.shells > 0 && sg.phase === 'cock' && !attacking) {
        this.sgBuf = true;
      } else if (sg.shells === 0 || attacking) {
        if (sg.shells === 0 && this.time - this.sgDryT > 1.2) { this.sgDryT = this.time; this.sfx.dryFire(); this.say('PENTUNG!', '#ffb347', 1, 0.5); }
        if (sg.reloading) sg.cancel();
        this.queueAttack('L');
      }
    } else if (sg.shells === 0 && inp.mouse.down && !p.airborne && !p.buffered && (p.attackPhase === 'none' || p.attackPhase === 'recover')) {
      if (sg.reloading) sg.cancel();
      this.queueAttack('L');
    }
  }
  updateShotgun(dt: number) {
    const p = this.player;
    if (p.weapon !== 'shotgun') return;
    const casingSide = p.facing;
    if (this.sgBuf && this.sg.phase === 'ready') { this.sgBuf = false; if (this.sg.shells > 0 && p.attackPhase === 'none' && !p.airborne) this.fireShotgun(); }
    if (this.sg.phase !== 'cock') this.sgBuf = this.sgBuf && this.sg.phase === 'ready';
    this.sg.update(dt, {
      click: () => this.sfx.leverClick(),
      clack: () => { this.sfx.leverClack(); this.particles.burst(p.x + Math.cos(p.aim) * 4, p.y - 8, 2, '#ffe9a8', 40, 0.15, 1, 1); },
      shell: () => { this.sfx.shellIn(); this.particles.burst(p.x + Math.cos(p.aim) * 5, p.y - 6, 1, '#d63a2a', 20, 0.2, 1, 1); },
      whoosh: () => {
        this.sfx.whoosh();
        // selongsong merah terlempar keluar saat tuas terbuka
        if (this.sg.phase === 'cock' && this.sg.kick > 0) { this.particles.burst(p.x + casingSide * 3, p.y - 8, 1, '#d63a2a', 70, 0.5, 1, 2); this.sfx.shellDrop(); }
      },
    });
  }
  fireShotgun() {
    const p = this.player, sg = this.sg;
    sg.shells--;
    sg.startCock();
    const hx = p.x + Math.cos(p.aim) * 14, hy = p.y - 7 + Math.sin(p.aim) * 8;
    if (this.level.sideView && this.glowOn) this.glowFx.add(hx, hy - p.z, 70, '#ffd27f', 0.08);
    // 10 butir gotri: sebaran lebar, jarak pendek, tiap butir mendorong keras
    const pellets = 10;
    for (let i = 0; i < pellets; i++) {
      const a = p.aim + rnd(-0.24, 0.24);
      const sp = rnd(820, 1150);
      this.bullets.push({
        x: hx, y: hy, px: hx, py: hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2, dmg: 3 + this.stats.bulletDmg, owner: 'player',
        life: rnd(0.2, 0.3), color: '#ffcf6a', pierce: this.stats.pierce, bounce: 0, kind: 'pistol', hitIds: [],
        structure: 14, kb: 150,
      });
    }
    // LEDAKAN JARAK DEKAT: musuh di depan moncong terpental jauh & terjatuh
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = dist(p.x, p.y, e.x, e.y);
      if (d > 46 + e.r) continue;
      const ang = Math.atan2(e.y - p.y, e.x - p.x);
      if (Math.abs(angleDiff(ang, p.aim)) > 0.6) continue;
      const close = 1 - clamp(d / (46 + e.r), 0, 1);
      this.damageEnemy(e, 6 + 10 * close, 60 + 80 * close, ang, 380 + 520 * close, { knockdown: true, hitstop: 0.06, shake: 0.5, melee: false, launch: 40 + 90 * close });
      this.particles.burst(e.x, e.y - 6, 6, '#b3131b', 160, 0.5, 1, 3);
    }
    p.muzzleMax = 0.1;
    p.muzzle = p.muzzleMax; p.muzzleX = hx; p.muzzleY = hy; p.muzzleA = p.aim;
    const mxp = hx + Math.cos(p.aim) * 3, myp = hy + Math.sin(p.aim) * 3;
    this.gunfx.muzzle(mxp, myp, p.aim, true, p.y, Math.cos(p.aim) >= 0 ? 1 : -1);
    this.gunfx.muzzle(mxp + Math.cos(p.aim) * 4, myp + Math.sin(p.aim) * 4, p.aim + rnd(-0.1, 0.1), true, p.y, Math.cos(p.aim) >= 0 ? 1 : -1);
    this.particles.ring(mxp, myp, 3, 16, '#ffe9a8', 0.14, 1);
    this.particles.smoke(mxp + Math.cos(p.aim) * 6, myp, 8, '#9a9a9a', 46, 0.7);
    this.particles.lines(mxp, myp, 7, '#fff1c0', p.aim, 230);
    this.particles.shockwave(mxp, myp, 26, '#ffd27f', 0.2);
    this.flash('#ffd27f', 0.22);
    // SHOTGUN FEEL: waktu melambat sekejap + hentakan besar
    this.hitstop = Math.max(this.hitstop, 0.075);
    this.slow(0.09, 0.3);
    this.sfx.shotgunBlast(Math.cos(p.aim));
    this.shake(1.05);
    p.recoil = 1; p.shootT = 0.22;
    p.kx -= Math.cos(p.aim) * 150; p.ky -= Math.sin(p.aim) * 150;
    p.squash = Math.min(p.squash, 0.9);
    this.camKick.x -= Math.cos(p.aim) * 20; this.camKick.y -= Math.sin(p.aim) * 20 + 3.5;
    this.zoomKick = Math.max(this.zoomKick, 0.055);
    this.stamp(mxp + Math.cos(p.aim) * 5, myp + Math.sin(p.aim) * 3, '#00000033', 1);
    if (sg.shells === 0) this.texts.add(p.x, p.y - 26, 'EMPTY!', '#ff5a3a', 1, 0.6);
  }
  /** Fist Mode also keeps its legacy kick-chain shortcut. */
  kickInput(dt: number) {
    const p = this.player, inp = this.input;
    if (p.weapon !== 'fist' || this.state !== 'playing' || p.stunT > 0 || p.holdT > 0 || p.fatality ||
        this.botPunch.active || this.propsPlay.scene || this.silat) { p.kickPending = false; return; }
    const hit = inp.hit('l') && inp.key('shift'), held = inp.key('l') && inp.key('shift');
    if (hit) { p.kickPending = true; p.kickHoldT = 0; }
    if (p.kickPending && held) p.kickHoldT = (p.kickHoldT ?? 0) + dt;
    if (p.kickPending && !held) {
      p.kickPending = false;
      this.startKick((p.kickHoldT ?? 0) > 0.22);
    }
  }
  startKick(heavy: boolean) {
    const p = this.player;
    if (p.weapon !== 'fist' || p.fatality || this.botPunch.active || this.propsPlay.scene) return;
    if (p.airborne) {
      if (heavy) this.launchAirAttack('AIR_H');
      else this.launchAirAttack(p.moveKey === 'AIR3' ? 'AIR4' : 'AIR3');
      return;
    }
    if (p.attackPhase === 'windup' || p.attackPhase === 'active') { p.kickBuf = true; return; }
    if (p.attackPhase === 'recover') {
      const cur = p.moveKey ? MOVES[p.moveKey] : null;
      if (cur && !cur.kick && p.attackT > cur.recover * 0.72) { p.kickBuf = true; return; }
    }
    const office = !!this.level.sideView;
    const chain = office
      ? ['KV1', 'FK_AXEKICK', 'FK_CARTWHEEL', 'FK_BUTTERFLY', 'KV2']
      : ['KV1', 'KV2', 'KV3', 'KV4', 'KV5'];
    const fresh = this.time - (p.lastKickAt ?? -9) > 1.15;
    let step = fresh ? 0 : ((p.kickStep ?? 0) + 1) % chain.length;
    if (!fresh && p.comboStr && /^[LH]/.test(p.comboStr)) step = (step + 1) % chain.length;
    p.kickStep = step; p.lastKickAt = this.time;
    const key = heavy ? (office ? 'FK_BUTTERFLY' : 'KVH') : chain[step];
    this.startAttack(key);
    if (key === 'FK_BUTTERFLY') { this.say('BUTTERFLY FLIP!', '#ffb347', 2, 0.8); }
    else if (key === 'FK_AXEKICK') { this.say('AXE KICK!', '#ffd27f', 2, 0.72); this.sfx.whoosh(); }
    else if (key === 'FK_CARTWHEEL') { this.say('CARTWHEEL KICK!', '#ffe680', 2, 0.75); this.sfx.whoosh(); }
    else if (heavy) { this.say('DIABLE JAMBE!', '#ff9d4a', 2, 0.8); this.sfx.launch(); }
    else { this.sfx.kick(); this.sfx.whoosh(); }
  }
  fire() {
    const p = this.player;
    const w = p.weapon;
    if (w === 'fist') return;
    const ammo = w === 'pistol' ? p.ammoP : p.ammoR;
    if (ammo <= 0) {
      this.sfx.empty();
      this.texts.add(p.x, p.y - 22, 'EMPTY! FISTS!', '#ff3b3b', 1, 0.7);
      this.setWeapon('fist');
      return;
    }
    if (w === 'pistol') p.ammoP--; else p.ammoR--;
    const pistol = w === 'pistol';
    p.fireCd = (pistol ? 0.19 : 0.082) / this.stats.fireRate;
    const spread = (pistol ? 0.012 : 0.03) + p.bloom;
    p.bloom = Math.min(pistol ? 0.08 : 0.16, p.bloom + (pistol ? 0.03 : 0.022));
    const a = p.aim + rnd(-spread, spread);
    const sp = pistol ? 1150 : 1300;
    const mz = this.gunMuzzle();
    const hx = mz.x, hy = mz.y;
    this.bullets.push({
      x: hx, y: hy, px: hx, py: hy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 2, dmg: (pistol ? 4 : 2) + this.stats.bulletDmg, owner: 'player',
      life: 1.2, color: pistol ? '#fff6c8' : '#ffe08a', pierce: this.stats.pierce, bounce: this.stats.bounce, kind: pistol ? 'pistol' : 'rifle', hitIds: [],
      structure: pistol ? 10 : 5, kb: pistol ? 90 : 35,
    });
    p.muzzleMax = pistol ? 0.07 : 0.05;
    p.muzzle = p.muzzleMax; p.muzzleX = hx; p.muzzleY = hy; p.muzzleA = a;
    // PUNCHY PIXEL MUZZLE: hot core sparks, side-vent sparks, chunky smoke puffs, light pop
    const mxp = hx + Math.cos(a) * 3, myp = hy + Math.sin(a) * 3;
    // pixelfx muzzle: spiky white-cored flash, sparks + powder, curling smoke, tumbling casing
    this.gunfx.muzzle(mxp, myp, a, pistol, p.y, Math.cos(a) >= 0 ? 1 : -1);
    if (this.level.sideView && this.glowOn) this.glowFx.add(mxp, myp, pistol ? 46 : 52, '#ffd27f', 0.07);
    this.flash('#ffd27f', pistol ? 0.07 : 0.035);
    // GUN FEEL: hitstop singkat membuat tiap letusan terasa "nendang", bukan sekadar sprite
    this.hitstop = Math.max(this.hitstop, pistol ? 0.03 : 0.016);
    this.sfx.shot(pistol ? 'pistol' : 'rifle', Math.cos(a));
    if (pistol) this.sfx.casing();
    this.shake(pistol ? 0.44 : 0.26);
    p.recoil = 1;
    p.shootT = 0.12;
    // moncong terdorong ke belakang + laras naik sedikit, lalu pulih
    p.kx -= Math.cos(p.aim) * (pistol ? 34 : 15); p.ky -= Math.sin(p.aim) * (pistol ? 34 : 15);
    this.camKick.x -= Math.cos(p.aim) * (pistol ? 9 : 4.6);
    this.camKick.y -= Math.sin(p.aim) * (pistol ? 9 : 4.6) + (pistol ? 2.2 : 1.1);
    this.particles.smoke(mxp + Math.cos(a) * 7, myp + Math.sin(a) * 7, pistol ? 3 : 2, '#8f8f8f', pistol ? 26 : 18, 0.5);
    this.particles.lines(mxp, myp, pistol ? 4 : 3, '#ffe6a8', a, pistol ? 190 : 150);
    this.particles.ring(mxp, myp, pistol ? 2 : 1, pistol ? 11 : 8, '#ffd27f', 0.1, 1);
    // selongsong melompat keluar dari ejector
    this.particles.casing(hx, hy - 1, a, Math.cos(a) >= 0 ? -1 : 1);
    if (pistol) this.zoomKick = Math.max(this.zoomKick, 0.018);
  }

  // ------------------------------------------------------------------ kung fu
  queueAttack(k: 'L' | 'H') {
    const p = this.player;
    if (p.stunT > 0 || p.fatality || p.focusDash || p.holdT > 0 || p.rageDash) return;
    if (p.weapon === 'foot') {
      this.queueFoot(this.footCommand(k));
      return;
    }
    if (p.weapon === 'scythe') {
      this.queueScythe(this.scytheCommand(k));
      return;
    }
    // ---- RAGE: every LMB dashes to the nearest enemy and executes it
    const bareFists = p.weapon === 'fist' || (p.weapon === 'axe' && !this.lev.held);
    if (k === 'L' && p.rageOn && bareFists) { this.rageStrike(); return; }
    const silatWeapon = p.weapon === 'fist' || p.weapon === 'nunchaku' || p.weapon === 'bat';
    // Adegan silat/grab TIDAK lagi muncul otomatis saat spam klik: hanya lewat tombol G (grab / sambung) atau F (fatality).
    void silatWeapon;
    if (this.sfNunOn) {
      if (this.nunAirSeq > 0) return; // rangkaian Kombo Udara mengendalikan nunchaku sampai selesai
      if (!this.sfNun.attacking) { this.sfNunAim = p.aim; this.sfNun.start(k === 'H'); this.sfx.swing(this.sfNun.cur?.heavy ? 0.7 : 1.1); }
      else if (this.sfNun.cur && this.sfNun.t / this.sfNun.cur.dur > 0.3) this.sfNun.buffered = true;
      return;
    }
    // ---- FREESTYLE RHYTHM ENGINE (fists): the tempo of your clicks picks the style and the game chains the moves
    if (k === 'L' && bareFists && !p.airborne && !p.running && p.dashT <= 0 && p.sinceDash > 0.2) {
      const gap = this.time - p.chainLast;
      p.chainLast = this.time;
      if (gap <= 1.1) { p.rhythm.push(gap); if (p.rhythm.length > 4) p.rhythm.shift(); } else { p.rhythm = []; p.style = 'none'; p.styleStreak = 0; p.flowStep = 0; p.chain = 0; }
      const style = this.classifyRhythm();
      if (style !== 'none') { this.flowMove(style); return; }
    }
    const cur = p.moveKey ? MOVES[p.moveKey] : null;
    const cancelAt = cur && (cur.bat || p.weapon === 'fist' || p.weapon === 'boxing') ? 0.78 : 0.66;
    if (p.attackPhase === 'none' || (p.attackPhase === 'recover' && cur && p.attackT < cur.recover * cancelAt)) this.startAttackInput(k);
    else p.buffered = k;
  }

  /** Tempo -> style. Needs 2 consistent gaps so a single fast double-click doesn't flip styles. */
  classifyRhythm(): 'none' | 'wingchun' | 'blackleg' | 'kungfu' {
    const p = this.player;
    const r = p.rhythm;
    if (r.length < 2) return 'none';
    const a = r[r.length - 1], b = r[r.length - 2];
    const cls = (x: number) => (x >= 0.06 && x < 0.3 ? 'wingchun' : x >= 0.3 && x < 0.62 ? 'blackleg' : x >= 0.62 && x <= 1.05 ? 'kungfu' : 'none');
    const ca = cls(a), cb = cls(b);
    if (ca === 'none') return 'none';
    // continuing an established style tolerates one off-beat; switching styles needs two beats in the new tempo
    if (ca === p.style) return ca;
    if (ca === cb) return ca;
    return p.style !== 'none' && p.styleStreak > 0 ? p.style : 'none';
  }

  /** Advance the chosen style's auto-combo by one move. Styles have their own flows; transitions get a bridge move. */
  flowMove(style: 'wingchun' | 'blackleg' | 'kungfu') {
    const p = this.player;
    const switching = p.style !== style && p.style !== 'none';
    if (p.style !== style) { p.style = style; p.flowStep = 0; p.styleStreak = 0; p.chain = 0; if (switching) this.say(style === 'wingchun' ? 'WING CHUN' : style === 'blackleg' ? 'BLACK LEG' : 'KUNG FU', this.pal.accent2, 2, 0.6); }
    p.styleStreak++;
    p.styleHeat = Math.min(1, p.styleHeat + 0.08);
    if (p.styleStreak === 2) this.say(style === 'wingchun' ? 'WING CHUN' : style === 'blackleg' ? 'BLACK LEG STYLE' : 'KUNG FU', this.pal.accent2, 1, 0.6);
    // target state decides finishers
    const target = this.nearestEnemy(p.x, p.y, 34, p.aim, 1.5) ?? this.nearestEnemy(p.x, p.y, 22, p.aim, 2.8);
    const nearlyDead = !!target && !target.boss && target.hp <= Math.max(3, target.maxHp * 0.22);
    const bossSoft = !!target && target.boss && target.structure >= target.maxStructure * 0.6;
    const office = !!this.level.sideView && p.weapon === 'fist';
    // GERBANG 6 + FIST MODE = GAYA DRUNKEN MASTER (Zui Quan): rantai jurus mabuk yang diakhiri Finisher Punch Heavy!
    if (p.weapon === 'fist' && this.gates.on && this.gates.gates >= 6 && !this.gates.cine) {
      const dSeq = ['DRK_1', 'DRK_2', 'DRK_3', 'DRK_4', 'DRK_FINISHER'];
      let dKey = dSeq[p.flowStep % dSeq.length];
      if ((nearlyDead || bossSoft) && p.styleStreak >= 2) dKey = 'DRK_FINISHER';
      p.flowStep++;
      const cur = p.moveKey ? MOVES[p.moveKey] : null;
      if (p.attackPhase === 'windup' || (p.attackPhase === 'active' && cur && p.attackT > cur.active * 0.42)) {
        p.buffered = 'L'; this._pfk = dKey; return;
      }
      p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
      this.skipStep(target);
      this.startAttack(dKey);
      if (MOVES[dKey].finisher) this.say(MOVES[dKey].name, this.gates.mid, 2, 0.85);
      return;
    }
    if (style === 'wingchun') {
      // Di Mode Kantor V2: rantai pukulan cepat mengalir ke Axe Kick, Cartwheel Kick & Butterfly Flip ala Liu Kang!
      p.wcCount = (p.wcCount ?? 0) + 1;
      if (office) {
        // Jangan potong jurus akrobatik yang sedang berputar di udara/lantai
        const activeMv = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
        if (activeMv && (activeMv.id === 'fk_butterfly' || activeMv.id === 'fk_cartwheel' || activeMv.id === 'fk_axekick') && p.attackPhase !== 'recover') {
          p.buffered = 'L';
          return;
        }
        if (p.wcCount % 4 === 0 && p.styleStreak >= 3) {
          const trio = ['FK_AXEKICK', 'FK_CARTWHEEL', 'FK_BUTTERFLY'];
          const key = trio[this.officeTrioIdx++ % trio.length];
          p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.chain = 0;
          this.startAttack(key);
          this.say(MOVES[key].name + '!', key === 'FK_BUTTERFLY' ? '#ffb347' : '#ffd27f', 2, 0.72);
          return;
        }
      } else {
        if (p.wcCount % 9 === 0 && p.styleStreak >= 4) { p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.chain = 0; this.ippoGuardT = 1.5; this.startAttack('FP_DEMPSEY'); this.say('DEMPSEY ROLL', '#7ce7ff', 2, 0.7); return; }
        if (p.wcCount % 5 === 0 && p.styleStreak >= 3) {
          const mix = ['KV2', 'HL', 'S1', 'KV3', 'LH', 'S2', 'BX_BODY', 'BX_SHOVEL', 'BX_CHECK', 'BX_UPPER'];
          const key = mix[Math.floor(Math.random() * mix.length)];
          p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.chain = 0;
          this.startAttack(key);
          return;
        }
      }
      this.chainPunch(); return;
    }
    // bridge move when switching styles: a flashy transition that fits the new tempo
    if (switching) { p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; this.startAttack(office ? (style === 'blackleg' ? 'FK_CARTWHEEL' : 'FK_AXEKICK') : (style === 'blackleg' ? 'S4' : 'HH')); return; }
    const flows: Record<'blackleg' | 'kungfu', string[]> = office
      ? {
          blackleg: ['S1', 'FK_AXEKICK', 'LH', 'FK_CARTWHEEL', 'KV2', 'FK_BUTTERFLY', 'S2', 'S3', 'FK_AXEKICK', 'LLL', 'FK_CARTWHEEL', 'S5', 'FK_BUTTERFLY', 'S8'],
          kungfu: ['L', 'LL', 'FK_AXEKICK', 'LH', 'FK_CARTWHEEL', 'FK_BUTTERFLY', 'H', 'KF1', 'KV2', 'FK_AXEKICK', 'BX_CROSS', 'FK_CARTWHEEL', 'LLLH', 'FK_BUTTERFLY'],
        }
      : {
          blackleg: ['S1', 'S2', 'LH', 'S3', 'BX_BODY', 'S4', 'H', 'S5', 'LLL', 'BX_SHOVEL', 'S1', 'HL', 'S6', 'KF2', 'S7', 'S8'],
          kungfu: ['H', 'KF1', 'FX_SHOCKPALM', 'BX_JAB2', 'KV2', 'FX_HOOKS', 'BX_CROSS', 'FX_RISEELBOW', 'FX_CLAW', 'LH', 'KF2', 'BX_OVER', 'HL', 'LLLH', 'KV3', 'BX_UPPER', 'HHL', 'LHH', 'FP_GAZELLE', 'LLLLH', 'HLL', 'S3', 'FP_HEART'],
        };
    const flow = flows[style];
    let key = flow[p.flowStep % flow.length];
    if ((nearlyDead || bossSoft) && p.styleStreak >= 2) {
      if (office) {
        const fin = ['FK_BUTTERFLY', 'FK_AXEKICK', 'FK_CARTWHEEL'];
        key = fin[p.flowStep % fin.length];
      } else {
        key = style === 'blackleg' ? (p.flowStep % 2 ? 'S8' : 'S5') : (p.flowStep % 2 ? 'LLLH' : 'HHL');
      }
    }
    // finisher aliran: musuh sekarat kadang ditamatkan adegan back kick Taekwondo
    if (nearlyDead && this.tkd.maybeFinish(this, target)) return;
    p.flowStep++;
    if (/^(BX|FP)_/.test(key)) this.ippoGuardT = 1.5;
    const cur = p.moveKey ? MOVES[p.moveKey] : null;
    if (p.attackPhase === 'windup' || (p.attackPhase === 'active' && cur && (cur.id === 'fk_butterfly' || cur.id === 'fk_cartwheel' || cur.id === 'fk_axekick' || p.attackT > cur.active * 0.42))) {
      p.buffered = 'L'; this._pfk = key; return;
    }
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
    this.skipStep(target); // lompatan kecil penghubung antar-jurus aliran
    this.startAttack(key);
    if (MOVES[key].finisher || /^FK_/.test(key)) this.say(MOVES[key].name, key === 'FK_BUTTERFLY' ? '#ffb347' : this.pal.accent2, 2, 0.78);
  }

  /** Telegraf AHLI FIST: cincin merah menyempit saat bersiap, berubah HIJAU di 0,24 dtk terakhir = saatnya tekan C (parry).
   *  Cincin kuning = TIPUAN (jangan parry dulu). Busur biru-putih = sedang BLOK. */
  drawFighterTells(ctx: CanvasRenderingContext2D) {
    if (this.state !== 'playing') return;
    for (const e of this.enemies) {
      if (e.dead || e.kind !== 'fighter' || e.spawnT > 0) continue;
      const x = e.x, y = e.y - 8 - e.z;
      if (e.state === 'windup' && (e.fWind ?? 0) > 0) {
        const u = clamp(1 - e.stateT / (e.fWind as number), 0, 1);
        const fake = e.feint > 0, go = !fake && e.stateT <= 0.24;
        const col = fake ? '#ffd27f' : go ? '#7dff9a' : '#ff4d4d';
        ctx.save(); ctx.globalAlpha = 0.75 + 0.25 * Math.sin(this.time * 18);
        pring(ctx, x, y, 7 + (1 - u) * 11, col, 2);
        if (go) pcircle(ctx, x, y, 2.6, col);
        ctx.globalAlpha = 1;
        if (go) pfontO(ctx, 'PARRY [C]!', x, y - 24, col, '#000', 1, 'center');
        ctx.restore();
      } else if (e.state === 'guard') {
        ctx.save(); ctx.globalAlpha = 0.8;
        pring(ctx, x + Math.cos(e.aim) * 6, y, 9, '#cfd8ff', 1, e.aim - 1.1, e.aim + 1.1);
        ctx.restore();
      }
    }
  }

  /** Opsi AURA (bilah bawah): merah (bawaan), hijau, atau biru. Tersimpan; berlaku langsung, termasuk saat gerbang sedang aktif. */
  setAuraColor(c: 'red' | 'green' | 'blue') { this.gates.setTheme(c); this.pushUI(); }

  /** Smoothing visual lari: blend idle<->jalan<->lari, windup berbalik arah, inersia ikat kepala. Hanya visual (aman untuk hitbox). */
  updateRunVisuals(dt: number) {
    const p = this.player, side = !!this.level.sideView;
    dt = Math.min(dt, 0.05);
    // 1) blend lokomosi: rampa linear 0.13 dtk (spesifikasi 0.1-0.15) -> tanpa lompatan pose
    const legMoving = p.moving || (!p.airborne && (side ? Math.abs(p.vx) > 12 : Math.hypot(p.vx, p.vy) > 16));
    const tgt = legMoving ? 1 : 0, step = dt / 0.13;
    this.locoMixV += clamp(tgt - this.locoMixV, -step, step);
    // 2) berbalik arah: badan menyempit & merendah sesaat (bukan flip instan); tidak saat menyerang
    if (p.facing !== this.lastFacingV) {
      if (this.turnV < 0.35 && p.attackPhase === 'none' && !p.fatality && !p.airborne) this.turnV = 1;
      this.lastFacingV = p.facing;
    }
    this.turnV = Math.max(0, this.turnV - dt / 0.13);
    if (p.stunT > 0) this.turnV = 0; // terkena hit: tak ada sisa animasi lari yang menggantung
    // 3) ikat kepala: spring-damper underdamped (overshoot = bergoyang saat berhenti), ekor terseret ke belakang gerakan
    const b = this.bandS;
    const vx = p.vx + p.kx * 0.3, vy = side ? (p.svVy ?? 0) * 0.5 : (p.vy + p.ky * 0.3) * 0.45 - p.vz * 0.4;
    const tx = clamp(-vx * 0.032, -4.4, 4.4), ty = clamp(-vy * 0.018, -2.2, 2.4);
    const K = 170, C = 11;
    b.vx += ((tx - b.x) * K - b.vx * C) * dt; b.vy += ((ty - b.y) * K - b.vy * C) * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
  }

  /**
   * STEP MAJU (SKIP STEP) — langkah lompatan kecil untuk mengambil momentum kecepatan.
   * Dipakai sebagai pengindah penghubung antar-kombo fist: mengejar musuh yang agak jauh
   * dengan hop pendek (bukan teleport), lengkap dengan tolakan squash & debu di kaki.
   */
  skipStep(target?: any, force = false) {
    const p = this.player;
    if (p.weapon !== 'fist' || p.airborne || p.dashT > 0 || this.skipStepCd > 0) return;
    if (this.botPunch.active || this.muay.active || this.tkd.active || p.fatality) return;
    const t = target ?? this.nearestEnemy(p.x, p.y, 115, p.aim, 1.6);
    let a = p.aim;
    if (t) {
      const d = dist(t.x, t.y, p.x, p.y);
      if (!force && (d < 30 || d > 110)) return; // hanya bila jaraknya memang perlu dilompati
      a = Math.atan2(t.y - p.y, t.x - p.x);
    } else if (!force) return;
    if (this.level.sideView) {
      p.kx += Math.cos(a) * 135;
    } else {
      p.vz = Math.max(p.vz, 92); p.z = Math.max(p.z, 0.1);
      p.kx += Math.cos(a) * 235; p.ky += Math.sin(a) * 150;
    }
    p.squash = 0.78; // tolakan: badan memampat lalu memanjang (diurus spring squash yang ada)
    this.skipStepCd = 0.38;
    this.sfx.footstep(1); this.sfx.whoosh();
    this.particles.smoke(p.x, p.y + 1, 2, '#9a9a9a', 14, 0.25);
  }

  /** one link of the Wing Chun chain: instant restart of the punch with the other fist; finish when the target is nearly dead */
  chainPunch() {
    const p = this.player;
    p.chain++;
    p.chainSide *= -1;
    const target = this.nearestEnemy(p.x, p.y, 30, p.aim, 1.4) ?? this.nearestEnemy(p.x, p.y, 20, p.aim, 2.8);
    if (target) {
      // almost dead (or a very long chain): the next click is the FINISH
      const nearlyDead = target.hp <= Math.max(3, target.maxHp * 0.22) && !target.boss;
      const bossSoft = target.boss && target.structure >= target.maxStructure * 0.6;
      if (nearlyDead || bossSoft || p.chain >= 24) {
        p.chain = 0;
        // kadang rantai ditamatkan ADEGAN back kick Taekwondo (bergantian dengan finisher biasa)
        if (this.tkd.maybeFinish(this, target)) return;
        if (this.level.sideView && p.weapon === 'fist') {
          const fin = ['FK_BUTTERFLY', 'FK_AXEKICK', 'FK_CARTWHEEL'][this.officeTrioIdx++ % 3];
          this.startAttack(fin);
          this.say(MOVES[fin].name + '!', fin === 'FK_BUTTERFLY' ? '#ffb347' : this.pal.accent2, 2, 0.82);
          return;
        }
        this.startAttack('CHAINEND');
        this.say('WING CHUN FINISH', this.pal.accent2, 2, 0.8);
        return;
      }
    }
    // hard reset of the attack state so the next fist fires immediately (no recovery wait)
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
    // STEP MAJU: tiap mata rantai ke-3 disambung lompatan kecil pengambil momentum
    if (p.chain % 3 === 0) this.skipStep(target, true); else this.skipStep(target);
    this.startAttack('CHAIN');
    // speed lines + alternating fist flash
    this.particles.lines(p.x + Math.cos(p.aim) * 8, p.y - 6 + Math.sin(p.aim) * 5, 2, '#ffffff', p.aim, 220);
    if (p.chain === 6) this.say('CHAIN PUNCH!', this.pal.accent2, 2, 0.7);
    if (p.chain > 0 && p.chain % 10 === 0) this.say(`${p.chain} CHAIN`, '#ffe66d', 1, 0.5);
  }

  /** RAGE activation (R) when the meter is full */
  tryRage() {
    const p = this.player;
    if (p.rageOn) return;
    if (p.rage < 100) { this.texts.add(p.x, p.y - 22, 'RAGE NOT READY', '#777', 1, 0.5); this.sfx.empty(); return; }
    p.rage = 100; p.rageOn = true; p.rageT = 8; p.rageKills = 0; this.rageReadySaid = false;
    this.setWeapon('fist');
    this.say('RAGE!', '#ff2a2a', 4, 1.2);
    this.sfx.announce(); this.sfx.focus();
    this.flash('#ff2a2a', 0.5); this.shake(0.8); this.slow(0.5, 0.25);
    this.particles.shockwave(p.x, p.y - 4, 60, '#ff2a2a', 0.5);
    for (const e of this.enemies) if (!e.dead && dist(e.x, e.y, p.x, p.y) < 60) { e.stun = Math.max(e.stun, 0.6); e.state = 'stun'; }
  }

  /** RAGE LMB: blur-dash to the nearest enemy, then an execution strike */
  rageStrike() {
    const p = this.player;
    let e = this.nearestEnemy(p.x, p.y, 170, p.aim, 1.3);
    if (!e) e = this.nearestEnemy(p.x, p.y, 170, p.aim, Math.PI);
    if (!e) { this.startAttack('LLLL'); return; } // nobody near: a spinning kick for show
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    const gap = e.r + p.r + 3;
    p.rageDash = { sx: p.x, sy: p.y, tx: e.x - Math.cos(a) * gap, ty: e.y - Math.sin(a) * gap, t: 0, id: e.id };
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.aim = a; p.attackAim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1; p.z = 0;
    e.stun = Math.max(e.stun, 0.5); e.state = 'stun';
    this.sfx.dash(); this.sfx.whoosh();
    this.particles.ring(p.x, p.y - 6, 2, 16, '#ff2a2a', 0.2, 1);
  }

  updateRage(dt: number, raw: number) {
    const p = this.player;
    if (p.rageOn) {
      p.rageT -= dt; p.rage = Math.max(0, 100 * (p.rageT / 8));
      if (Math.random() < 0.6) this.particles.add({ x: p.x + rnd(-5, 5), y: p.y - 6 + rnd(-8, 4), vx: rnd(-10, 10), vy: rnd(-50, -20), life: rnd(0.3, 0.6), c: Math.random() < 0.5 ? '#ff2a2a' : '#ffb347', k: 7 });
      if (p.rageT <= 0) { p.rageOn = false; p.rage = 0; p.rageDash = null; this.say('RAGE OVER', '#9a9a9a', 1, 0.8); }
    }
    if (p.rageDash) {
      const rd = p.rageDash;
      rd.t += raw / 0.1;
      const k = Math.min(1, rd.t), ek = 1 - Math.pow(1 - k, 3);
      const nx = lerp(rd.sx, rd.tx, ek), ny = lerp(rd.sy, rd.ty, ek);
      if (this.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; }
      this.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: p.aim, pose: 'ragedash', poseT: 0 }, '#ff2a2a', { x: Math.cos(p.aim), y: Math.sin(p.aim) });
      if (k >= 1) {
        const e = this.enemies.find((en) => en.id === rd.id);
        p.rageDash = null;
        if (e && !e.dead) { p.aim = Math.atan2(e.y - p.y, e.x - p.x); p.attackAim = p.aim; }
        this.startAttack('RAGEKILL');
        p.iframes = Math.max(p.iframes, 0.35);
      }
    }
    // chain / style decay when the rhythm stops
    if (p.chain > 0 && this.time - p.chainLast > 0.5) p.chain = 0;
    if (this.time - p.chainLast > 1.2) { if (p.style !== 'none') { p.style = 'none'; p.styleStreak = 0; p.flowStep = 0; p.rhythm = []; } p.styleHeat = Math.max(0, p.styleHeat - dt * 0.6); }
    // all style moves build rage a little (chain builds the most); heat makes every style flow faster
    this.timeScaleBonus = 1 + 0.25 * p.styleHeat;
  }
  private readFootInputs() {
    const taps = this.input.attackTaps.splice(0);
    for (const tap of taps) this.queueFoot(this.footCommand(tap.input, tap));
  }

  queueFootLauncher() {
    if (this.player.airborne) return;
    this.queueFoot({ ...this.footCommand('H'), rising: true, backKick: false, autoAim: true });
  }

  /** Tukar Foot Mode V1 <-> V2 (scroll mouse / tombol O / tombol layar). */
  /** Putar Foot Mode V1 > V2 > V3 (scroll turun / O) atau sebaliknya (scroll naik). */
  toggleFootVersion(_dir = 1) { /* Foot Mode selalu V3 */ }

  /** Gaya neon + suara Fist Mode: semua jurus V2, dan seluruh jurus saat Foot Mode V3 aktif. */
  private footNeon(foot: ReturnType<typeof footMove> | null) { return !!foot && (!!foot.foot.v2 || this.footVer === 3); }

  setFootVersion(version: FootVersion) {
    if (version !== 3) return;
    const now = performance.now();
    if (version === this.footVer || now - this.footVerAt < 220) return;
    this.footVerAt = now;
    this.footVer = version;
    this.footwork.setVersion(version);
    try { localStorage.setItem('v2_kf_foot_ver', String(version)); } catch { /* penyimpanan tidak tersedia */ }
    const p = this.player;
    p.buffered = null;
    this.footStanceVisible = false;
    if (p.weapon === 'foot') {
      const color = FOOT_VERSION_COLOR[version];
      this.sfx.select(); this.sfx.footSwitch();
      p.squash = .9;
      this.particles.ring(p.x, p.y - 7 - p.z, 3, 13, color, .2, 1, true);
      this.particles.ring(p.x, p.y - 1, 2, 9, '#ffffff', .14, 1, true);
      this.texts.add(p.x, p.y - 24, `FOOT MODE V${version}`, color, 1, .7);
    }
    this.pushUI();
  }

  queueFootStance() {
    const p = this.player;
    // Foot Mode V2 tidak memakai kuda-kuda Flamingo V1: tombol I langsung Flamingo Sky Lift.
    if (this.footVer === 2) { if (p.weapon === 'foot') this.queueFootLauncher(); return; }
    if (this.state !== 'playing' || p.weapon !== 'foot' || p.airborne || p.stunT > 0 ||
        p.holdT > 0 || p.dashT > 0 || p.fatality || p.focusDash || p.parryT > 0) return;
    this.footwork.requestSwitch(this.tempo);
    if (p.attackPhase === 'none' && this.hitstop <= 0) this.applyFootStance();
  }

  private applyFootStance() {
    const p = this.player;
    if (!this.footwork.switchPending) return false;
    if (p.airborne || p.stunT > 0 || p.holdT > 0 || p.dashT > 0 || (p.svJumpAntT ?? 0) > 0 || (p.jumpAntT ?? 0) > 0) {
      this.footwork.clearSwitch();
      return false;
    }
    if (p.attackPhase !== 'none' && p.attackPhase !== 'recover') return false;
    this.footwork.switchStance();
    p.squash = .88;
    this.sfx.footSwitch();
    this.particles.ring(p.x, p.y - 1, 2, 8, footStanceColor(this.footwork.lead), .16, 1, true);
    this.updateFootUI(true);
    return true;
  }

  private updateFootUI(force = false) {
    const active = this.footwork.inFlamingo;
    if (force || this.footStanceVisible !== active) {
      this.footStanceVisible = active;
      this.pushUI();
    }
  }

  footStancePose(): { pose: Pose; t: number; footLead: 1 | -1 } | null {
    if (this.player.weapon !== 'foot' || !this.footwork.inFlamingo || this.player.airborne) return null;
    const t = this.footwork.stanceTime / .17;
    return { pose: t < 1 ? 'foot_flamingo_switch' : 'foot_flamingo', t: clamp(t, 0, 1), footLead: this.footwork.lead };
  }

  private queueScythe(command: ScytheCommand) {
    const p = this.player;
    if (this.state !== 'playing' || p.weapon !== 'scythe' || p.stunT > 0 || p.holdT > 0 || p.fatality || p.focusDash || p.rageDash) return;
    if (this.hitstop > 0 || p.airMagnet || p.attackPhase !== 'none' || (p.jumpAntT ?? 0) > 0 || (p.svJumpAntT ?? 0) > 0 || this.scythe.pending) {
      this.scythe.buffer(command, this.scythe.clock);
      p.buffered = this.scythe.pending?.command.input ?? null;
    } else this.startScytheInput(command);
  }

  private queueFoot(command: FootCommand) {
    const p = this.player;
    if (this.state !== 'playing' || p.weapon !== 'foot' || p.stunT > 0 || p.holdT > 0 || p.fatality || p.focusDash || p.rageDash) return;
    if (this.hitstop > 0 || p.airMagnet || p.attackPhase !== 'none' || (p.jumpAntT ?? 0) > 0 || (p.svJumpAntT ?? 0) > 0 || this.footwork.pending) {
      this.footwork.buffer(command, this.footwork.clock);
      p.buffered = this.footwork.pending?.command.input ?? null;
    } else this.startFootInput(command);
  }

  private footCommand(k: 'L' | 'H', tap?: AttackTap): FootCommand {
    const p = this.player, inp = this.input;
    const aim = tap ? {
      x: (tap.x - VIEW_W / 2) / this.zoom + VIEW_W / 2 + this.cam.x,
      y: (tap.y - VIEW_H / 2) / this.zoom + VIEW_H / 2 + this.cam.y,
    } : this.mouseWorld();
    return {
      input: k,
      airborne: p.airborne || (p.jumpAntT ?? 0) > 0 || (p.svJumpAntT ?? 0) > 0,
      momentum: p.running || p.dashT > 0 || (p.sinceDash < 0.2 && p.moving),
      rising: k === 'H' && (tap?.down ?? (inp.key('s') || inp.key('arrowdown'))),
      backKick: k === 'H' && (tap?.up ?? (inp.key('w') || inp.key('arrowup'))),
      autoAim: tap?.source !== 'mouse',
      aim: Math.atan2(aim.y - (p.y - 6), aim.x - p.x),
    };
  }

  private findFootTarget(move: Move, autoAim: boolean) {
    const p = this.player;
    const side = !!this.level.sideView;
    const reach = move.travel ? 49 : move.air ? 37 : footMove(move)?.foot.school === 'drop' ? 32 : footMove(move)?.foot.v2 ? 29 : footMove(move)?.foot.school === 'flamingo' ? 27 : 24;
    let target: Enemy | null = null, best = Infinity;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || (side && Math.abs(e.y - p.y) > (move.air ? 33 : 8))) continue;
      const distance = dist(p.x, p.y, e.x, e.y);
      if (distance > reach || (!side && !move.air && e.z > 6)) continue;
      const angle = Math.atan2(side ? 0 : e.y - p.y, e.x - p.x);
      const turn = Math.abs(angleDiff(angle, p.aim));
      if (!autoAim && turn > 1.22 && distance > 8) continue;
      if (!lineOfSight(this.level, p.x, p.y, e.x, e.y)) continue;
      const score = distance + turn * (autoAim ? 2 : 6) - (e.id === this.footwork.target ? 7 : 0);
      if (score < best) { target = e; best = score; }
    }
    return target;
  }

  // ============================== SCYTHE MODE ==============================
  private scytheCommand(k: 'L' | 'H', tap?: AttackTap): ScytheCommand {
    const p = this.player, inp = this.input;
    const aim = tap ? {
      x: (tap.x - VIEW_W / 2) / this.zoom + VIEW_W / 2 + this.cam.x,
      y: (tap.y - VIEW_H / 2) / this.zoom + VIEW_H / 2 + this.cam.y,
    } : this.mouseWorld();
    return {
      input: k,
      airborne: p.airborne || (p.jumpAntT ?? 0) > 0 || (p.svJumpAntT ?? 0) > 0,
      momentum: p.running || p.dashT > 0 || (p.sinceDash < 0.2 && p.moving),
      rising: k === 'H' && (tap?.down ?? (inp.key('s') || inp.key('arrowdown'))),
      backKick: k === 'H' && (tap?.up ?? (inp.key('w') || inp.key('arrowup'))),
      autoAim: tap?.source !== 'mouse',
      aim: Math.atan2(aim.y - (p.y - 6), aim.x - p.x),
    };
  }

  private findScytheTarget(move: Move, autoAim: boolean) {
    const p = this.player;
    const side = !!this.level.sideView;
    const reach = move.travel ? 48 : move.air ? 36 : 25;
    let target: Enemy | null = null, best = Infinity;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || (side && Math.abs(e.y - p.y) > (move.air ? 33 : 8))) continue;
      const distance = dist(p.x, p.y, e.x, e.y);
      if (distance > reach || (!side && !move.air && e.z > 6)) continue;
      const angle = Math.atan2(side ? 0 : e.y - p.y, e.x - p.x);
      const turn = Math.abs(angleDiff(angle, p.aim));
      if (!autoAim && turn > 1.22 && distance > 8) continue;
      if (!lineOfSight(this.level, p.x, p.y, e.x, e.y)) continue;
      const score = distance + turn * (autoAim ? 2 : 6) - (e.id === this.scythe.target ? 7 : 0);
      if (score < best) { target = e; best = score; }
    }
    return target;
  }

  private startScytheInput(command: ScytheCommand, link = false) {
    const p = this.player;
    const previous = p.attackPhase !== 'none' && p.moveKey ? scytheMove(MOVES[p.moveKey]) : null;
    this.scythe.linkFrom = link && !!previous;
    const key = this.scythe.select({ ...command, airborne: p.airborne || command.airborne }, this.scythe.clock, this.tempo);
    const m = scytheMove(MOVES[key])!;
    if (command.aim !== undefined) p.aim = command.aim;
    const target = this.findScytheTarget(m, command.autoAim ?? true);
    this.scythe.target = target?.id ?? null;
    if (target) p.aim = Math.atan2(this.level.sideView ? 0 : target.y - p.y, target.x - p.x);
    p.buffered = this.scythe.pending?.command.input ?? null;
    if (p.airborne && m.air && key !== 'SC_DIVE') {
      const follow = target && this.isEnemyAirborne(target) ? target.id : null;
      this.launchAirAttack(key, follow, true);
    }
    else this.startAttack(key);
  }

  private readScytheInputs() {
    const taps = this.input.attackTaps.splice(0);
    for (const tap of taps) this.queueScythe(this.scytheCommand(tap.input, tap));
  }

  queueScytheLauncher() {
    if (this.player.airborne) return;
    this.queueScythe({ ...this.scytheCommand('H'), rising: true, backKick: false, autoAim: true });
  }

  interruptScythe() { this.scythe.interrupt(); }

  private startFootInput(command: FootCommand, link = false) {
    const p = this.player;
    const previous = p.attackPhase !== 'none' && p.moveKey ? footMove(MOVES[p.moveKey]) : null;
    const stance = !previous ? this.footStancePose() : null;
    this.footwork.linkFrom = link && previous
      ? { pose: previous.pose, t: this.attackPoseT(), facing: p.facing, aim: p.aim, footLead: this.footwork.attackLead, footSwitch: false }
      : stance ? { ...stance, facing: p.facing, aim: p.aim, footSwitch: stance.pose === 'foot_flamingo_switch' } : null;
    const key = this.footwork.select({ ...command, airborne: p.airborne || command.airborne }, this.footwork.clock, this.tempo);
    this.updateFootUI();
    const m = footMove(MOVES[key])!;
    if (command.aim !== undefined) p.aim = command.aim;
    const target = this.findFootTarget(m, command.autoAim ?? true);
    this.footwork.target = target?.id ?? null;
    if (target) p.aim = Math.atan2(this.level.sideView ? 0 : target.y - p.y, target.x - p.x);
    p.buffered = this.footwork.pending?.command.input ?? null;
    if (p.airborne && m.air && key !== 'FT_AIR_COMET') {
      const follow = this.footwork.takeLauncher(this.time) ?? (target && this.isEnemyAirborne(target) ? target.id : null);
      this.launchAirAttack(key, follow, true);
    }
    else this.startAttack(key);
  }

  startAttackInput(k: 'L' | 'H') {
    const p = this.player;
    if (p.weapon === 'foot') { this.startFootInput(this.footCommand(k)); return; }
    if (p.weapon === 'scythe') { this.startScytheInput(this.scytheCommand(k)); return; }
    let key: string;
    let freestyle = false;
    const running = p.running || (p.runT > 0.25 && p.moving);
    if (p.airborne && (p.weapon === 'fist' || p.weapon === 'boxing')) {
      if (k === 'H') {
        const airT = this.findAirMagnetTarget() ?? this.nearestEnemy(p.x, p.y, 52, p.aim, 2.2);
        this.launchAirAttack(airT || p.weapon === 'boxing' ? 'AIR_H' : 'AIR');
      } else {
        const nextAir = p.comboStr === 'AIR1' ? 'AIR2' : p.comboStr === 'AIR2' ? 'AIR3' : p.comboStr === 'AIR3' ? 'AIR4' : 'AIR1';
        this.launchAirAttack(nextAir);
      }
      return;
    }
    if (p.weapon === 'yoyo' && this.yoyoVer === 2) {
      if (k === 'L' && running && p.comboStr === '') key = 'YRUN';
      else if (k === 'L' && p.airborne) key = 'YAIR';
      else { const base = p.comboStr.startsWith('Y') ? p.comboStr : 'Y'; const cand = base + k; key = MOVES[cand] ? cand : 'Y' + k; }
      this.startAttack(key);
      return;
    }
    if (p.weapon === 'nunchaku') {
      // nunchaku tree: N + sequence. RUN + LMB = DRAGON LASH (lethal charge), dash + LMB = flying helicopter.
      if (k === 'L' && running && p.comboStr === '' && p.tkdCd <= 0) { key = 'NRUN'; p.tkdCd = 1.1; this.say('DRAGON LASH!', this.pal.accent2, 2, 0.7); this.sfx.launch(); }
      else if (k === 'L' && (p.dashT > 0 || p.sinceDash < 0.16 || (running && p.comboStr === ''))) key = 'NDASH';
      else {
        const base = p.comboStr.startsWith('N') ? p.comboStr : 'N';
        const cand = base + k;
        key = MOVES[cand] ? cand : 'N' + k;
      }
      this.startAttack(key);
      return;
    }
    if (p.weapon === 'boxing') {
      const st = this.box.stance;
      const dash = p.dashT > 0 || p.sinceDash < 0.18;
      if (k === 'H') {
        // KLIK KANAN: satu-satunya pukulan yang boleh membunuh. Bergilir melewati
        // SEMUA pamungkas gaya ini, dan boleh dispam tanpa jeda panjang.
        key = this.box.nextHeavy();
        this.box.signCd = 0.25;
      } else if (running && p.comboStr === '' && p.tkdCd <= 0) {
        // masuk sambil berlari: tiap gaya punya cara menutup jarak sendiri (tetap non-mematikan)
        key = st === 'ali' ? 'BX_SHUFFLE' : st === 'tyson' ? 'BX_ROLLIN' : 'BX_GAZELLE';
        p.tkdCd = 1.15;
      } else if (dash) {
        key = st === 'ali' ? 'BX_CROSS' : st === 'tyson' ? 'BX_UPPER' : 'BX_GAZELLE';
      } else {
        key = this.box.nextLight();
      }
      this.boxHeavyKey = k === 'H' ? key : null;
      this.startAttack(key);
      return;
    }
    if (p.weapon === 'buster') {
      const P = this.bu.punisher ? 'P' : '';
      this.bu.swing(this.time);
      if (k === 'L' && running && p.comboStr === '' && p.tkdCd <= 0) { key = P + 'XRUN'; p.tkdCd = 1.2; this.sfx.launch(); }
      else if (k === 'H') key = P + 'XH';
      else {
        const prevN = p.comboStr.startsWith(P + 'X') ? parseInt(p.comboStr.slice(P.length + 1), 10) || 0 : 0;
        key = P + 'X' + ((prevN % 5) + 1);
      }
      this.startAttack(key);
      return;
    }
    if (p.weapon === 'bat' || p.weapon === 'shotgun') {
      if (this.time - this.batLastT > 1.35) { this.batFlow = 0; this.batJuggle = 0; this.batPlan = []; this.batPlanI = 0; }
      this.batLastT = this.time; this.batTauntT = 0;
      if (k === 'L' && running && p.comboStr === '' && p.tkdCd <= 0) { key = 'BRUN'; p.tkdCd = 1.3; this.say('GRAND SLAM!', '#ffb347', 2, 0.78); this.sfx.launch(); }
      else if (k === 'L' && (p.dashT > 0 || p.sinceDash < 0.16)) key = 'BDASH';
      else if (k === 'H') key = this.batPowerSwing();
      else {
        const air = this.nearestEnemy(p.x, p.y, 38, p.aim, 1.3);
        const down = this.enemies.find((e) => !e.dead && e.spawnT <= 0 && e.z <= 1 && (e.down > 0 || e.state === 'down') && dist(e.x, e.y, p.x, p.y) < 30 + e.r && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), p.aim)) < 1.4);
        if (air && this.isEnemyAirborne(air)) { this.batJuggle++; if (this.batJuggle >= 3) { key = 'B_SPIKE'; this.batJuggle = 0; } else key = 'B_PEPPER'; }
        else if (down) key = 'SB_POUND';
        else {
          this.batFlow++;
          if (!this.batPlan.length || this.batPlanI >= this.batPlan.length) {
            this.batPlan = BAT_PLANS[this.batPlanIdx++ % BAT_PLANS.length];
            this.batPlanI = 0;
          }
          key = this.batPlan[this.batPlanI++];
          if (MOVES[key]?.showName) this.say(MOVES[key].name, '#ffd27f', 2, 0.72);
        }
      }
      this.startAttack(key);
      return;
    }
    if ((p.weapon === 'axe' && this.lev.held) || p.weapon === 'dual') {
      const R = p.weapon === 'axe' ? 'A' : 'D';
      if (k === 'L' && running && p.comboStr === '' && p.tkdCd <= 0) { key = R + 'RUN'; p.tkdCd = p.weapon === 'axe' ? 1.5 : 1.2; this.say(MOVES[key].name, p.weapon === 'axe' ? '#ffb347' : '#bfe8ff', 2, 0.7); if (p.weapon === 'axe') this.sfx.launch(); else this.sfx.dualSwing(); }
      else if (k === 'L' && (p.dashT > 0 || p.sinceDash < 0.16 || (running && p.comboStr === ''))) key = R + 'DASH';
      else { const base = p.comboStr.startsWith(R) ? p.comboStr : R; const cand = base + k; key = MOVES[cand] ? cand : R + k; }
      this.startAttack(key);
      return;
    }
    if (p.weapon === 'katana') {
      // katana tree: K + sequence. RUN + LMB = IAIJUTSU dash-through, dash + LMB = dash cut.
      if (k === 'L' && running && p.comboStr === '' && p.tkdCd <= 0) { key = 'KRUN'; p.tkdCd = 1.3; this.say('IAIJUTSU', '#ffffff', 2, 0.7); this.sfx.whoosh(); }
      else if (k === 'L' && (p.dashT > 0 || p.sinceDash < 0.16 || (running && p.comboStr === ''))) key = 'KDASH';
      else {
        const base = p.comboStr.startsWith('K') ? p.comboStr : 'K';
        const cand = base + k;
        key = MOVES[cand] ? cand : 'K' + k;
        if (this.v2 && k === 'L') {
          // V2 KATANA CHAIN VARIATIF (Takamura / Hyun's Dojo): tiap chain baru di-roll —
          // kadang 1 tebas + SHEATHE FLASH, kadang 2 tebas + DASH CUT menerobos, kadang 3 + HEAVEN SPLITTER
          if (p.comboStr === '') { const r = Math.random(); p.katanaPlan = r < 0.4 ? 1 : r < 0.7 ? 2 : 3; }
          const nS = p.comboStr === 'KL' ? 1 : p.comboStr === 'KLL' ? 2 : p.comboStr === 'KLLL' ? 3 : 0;
          if (p.katanaPlan === 1 && nS >= 1) key = 'KSHEATH';
          else if (p.katanaPlan === 2 && nS >= 2) key = 'KDASH';
        }
      }
      this.startAttack(key);
      return;
    }
    if (k === 'L' && (p.dashT > 0 || p.sinceDash < 0.16)) key = 'DASH';
    else if (k === 'L' && running && p.comboStr === '') {
      // RUN + LEFT CLICK = Taekwondo flying side kick (falls back to the running straight while on cooldown)
      if (p.tkdCd <= 0) {
        key = 'TKD';
        p.tkdCd = 0.9;
        { const tg = this.nearestEnemy(p.x, p.y, 150, p.aim, 1.1); if (tg) p.aim = Math.atan2(tg.y - p.y, tg.x - p.x); }
        p.tkdDir = { x: Math.cos(p.aim), y: Math.sin(p.aim) };
        this.say('TAEKWONDO!', this.pal.accent2, 2, 0.7);
        this.sfx.launch();
      } else key = 'RUNPUNCH';
    }
    else if (k === 'H' && running && p.comboStr === '' && p.weapon === 'fist') {
      if (this.level.sideView) {
        key = this.runHeavyToggle++ % 2 === 0 ? 'FK_BUTTERFLY' : 'FK_CARTWHEEL';
        this.say(MOVES[key].name + '!', key === 'FK_BUTTERFLY' ? '#ffb347' : '#ffd27f', 2, 0.78);
      } else {
        key = p.tkdCd > 0.45 ? 'DASH' : this.runHeavyToggle++ % 2 === 0 ? 'RUNPUNCH' : 'DASH';
      }
    }
    else if (p.weapon === 'fist' && (p.comboStr.startsWith('KV') || p.comboStr.startsWith('FK_')) && k === 'L') {
      // PUNCH -> KICK -> PUNCH/ACRO: jembatan mulus supaya kombo tidak pernah putus
      const bridges = this.level.sideView ? ['LH', 'FK_CARTWHEEL', 'FK_BUTTERFLY', 'LLL', 'FK_AXEKICK'] : ['LH', 'LLL', 'H', 'LH', 'LLL'];
      key = bridges[(p.kickStep ?? 0) % bridges.length] ?? 'LH';
    }
    else if (p.weapon === 'fist') { key = this.pickFreestyle(k); freestyle = true; }
    else { const cand = p.comboStr + k; key = MOVES[cand] ? cand : k; }
    // STEP MAJU: fist mengejar musuh yang agak jauh dengan lompatan kecil bermomentum
    // Finisher Fist Mode: kadang berubah jadi HEADBUTT atau HEAVY STRAIGHT PUNCH
    if (p.weapon === 'fist' && !p.airborne && MOVES[key]?.finisher && !MOVES[key]?.travel && !MOVES[key]?.air && Math.random() < 0.45) {
      key = Math.random() < 0.5 ? 'F_HEADBUTT' : 'F_HSTRAIGHT';
    }
    if (p.weapon === 'fist' && !p.airborne && !MOVES[key]?.air && !MOVES[key]?.travel) this.skipStep();
    this.startAttack(key);
    if (freestyle) this.player.comboStr = '';
  }

  /** LARI + KLIK KANAN: kadang tendangan terbang taekwondo yang menyambar musuh terdekat */
  tryFlyKick(): boolean {
    const p = this.player;
    const running = p.running || (p.runT > 0.2 && p.moving);
    if (!running || p.airborne || p.tkdCd > 0 || p.stunT > 0 || (p.attackPhase !== 'none' && p.attackPhase !== 'recover')) return false;
    const t = this.nearestEnemy(p.x, p.y, 165, p.aim, 1.2) ?? this.nearestEnemy(p.x, p.y, 110, p.aim, 2.8);
    if (Math.random() > (t ? 0.7 : 0.4)) return false;
    if (t) p.aim = Math.atan2(t.y - p.y, t.x - p.x);
    p.comboStr = ''; p.buffered = null; p.tkdCd = 0.9;
    p.tkdDir = { x: Math.cos(p.aim), y: Math.sin(p.aim) };
    this.say('FLYING KICK!', this.pal.accent2, 2, 0.7);
    this.sfx.launch();
    this.startAttack('TKD');
    return true;
  }
  fistHist: ('h' | 'f')[] = [];
  ippoPlan: string[] = []; ippoI = 0; ippoGuardT = 0; ippoSayT = 0;
  officePlan: string[] = []; officePlanI = 0; officePlanIdx = 0; officeTrioIdx = 0; officeHeavyStep = 0; officeHeavyAt = -9;
  fistLastKey = '';
  fistStep = 0;
  fistLastT = -9;
  /** catat jurus Ippo yang dipakai: pose guard Ippo menyala sebentar setelahnya */
  pickIppo(key: string): string {
    this.fistLastKey = key; this.ippoGuardT = 1.5;
    const mv = MOVES[key];
    if (mv && mv.finisher) { this.fistStep = 0; this.ippoPlan = []; }
    return key;
  }
  /** FREESTYLE: tangan dan kaki berganti-ganti sesuai situasi (jarak, lawan jatuh, lawan sekarat) — tidak lagi rantai kaku */
  pickFreestyle(k: 'L' | 'H'): string {
    const p = this.player;
    const office = !!this.level.sideView;
    if (this.time - this.fistLastT > 1.15) {
      this.fistStep = 0; this.fistHist = []; this.ippoPlan = []; this.ippoI = 0;
      this.officePlan = []; this.officePlanI = 0;
    }
    this.fistLastT = this.time;
    const step = ++this.fistStep;
    const target = this.nearestEnemy(p.x, p.y, 38, p.aim, 1.5) ?? this.nearestEnemy(p.x, p.y, 24, p.aim, 2.8);
    const d = target ? dist(p.x, p.y, target.x, target.y) : 99;
    const down = !!target && (target.down > 0 || target.state === 'down') && target.z <= 1;
    const weak = !!target && !target.boss && target.hp <= Math.max(3, target.maxHp * 0.25);
    // ---- GERBANG 6 + FIST MODE = DRUNKEN MASTER (Zui Quan): basic attack tetap mengalir rapat, finisher punch menghantam heavy mental jauh!
    if (this.gates.on && this.gates.gates >= 6 && !this.gates.cine) {
      if (k === 'H') {
        this.fistLastKey = 'DRK_FINISHER';
        this.fistStep = 0; this.officePlan = []; this.officePlanI = 0;
        this.say('DRUNKEN GOD FIST!', this.gates.mid, 2, 0.85);
        return 'DRK_FINISHER';
      }
      if (this.officePlan.length && this.officePlanI < this.officePlan.length) {
        const dKey = this.officePlan[this.officePlanI++];
        this.fistLastKey = dKey;
        const mv = MOVES[dKey];
        if (mv?.finisher) {
          this.say(mv.name, this.gates.mid, 2, 0.85);
          this.fistStep = 0; this.officePlan = []; this.officePlanI = 0;
        }
        return dKey;
      }
      this.officePlan = DRUNKEN_PLANS[this.officePlanIdx++ % DRUNKEN_PLANS.length];
      this.officePlanI = 1;
      const first = this.officePlan[0];
      this.fistLastKey = first;
      return first;
    }
    // ---- V2 MODE KANTOR (FIST MODE): kombo Shaolin / Liu Kang — Axe Kick, Cartwheel Kick & Butterfly Flip!
    if (office) {
      if (k === 'H') {
        // RMB beruntun merangkai langsung: AXE KICK -> CARTWHEEL KICK -> BUTTERFLY FLIP (ala Liu Kang)!
        if (this.time - this.officeHeavyAt > 1.8) this.officeHeavyStep = 0;
        const hKey = OFFICE_HEAVY_CHAIN[this.officeHeavyStep % OFFICE_HEAVY_CHAIN.length];
        this.officeHeavyStep = (this.officeHeavyStep + 1) % OFFICE_HEAVY_CHAIN.length;
        this.officeHeavyAt = this.time;
        this.fistLastKey = hKey;
        this.officePlan = []; this.officePlanI = 0;
        this.say(MOVES[hKey].name + '!', hKey === 'FK_BUTTERFLY' ? '#ffb347' : '#ffd27f', 2, 0.78);
        if (MOVES[hKey].finisher) this.fistStep = 0;
        return hKey;
      }
      if (down) {
        // Lawan jatuh: hentak dengan Axe Kick (Tendangan Kapak) lurus ke bawah!
        this.fistLastKey = 'FK_AXEKICK';
        this.say('AXE KICK!', '#ffd27f', 2, 0.72);
        return 'FK_AXEKICK';
      }
      if (this.officePlan.length && this.officePlanI < this.officePlan.length && k === 'L') {
        const oKey = this.officePlan[this.officePlanI++];
        this.fistLastKey = oKey;
        const mv = MOVES[oKey];
        if (/^FK_/.test(oKey)) this.say(mv.name + '!', oKey === 'FK_BUTTERFLY' ? '#ffb347' : '#ffd27f', 2, 0.75);
        if (this.officePlanI >= this.officePlan.length || mv?.finisher) { this.fistStep = 0; this.officePlan = []; this.officePlanI = 0; }
        return oKey;
      }
      if (k === 'L' && step === 1 && Math.random() < 0.72) {
        this.officePlan = OFFICE_FIST_PLANS[this.officePlanIdx++ % OFFICE_FIST_PLANS.length];
        this.officePlanI = 1;
        const first = this.officePlan[0];
        this.fistLastKey = first;
        return first;
      }
    }
    // ---- IPPO (tinju tanpa sarung): rangkaian jab-jab-straight-body-... yang berlanjut tiap klik, atau pamungkas Ippo di klik kanan
    if (this.ippoPlan.length && this.ippoI < this.ippoPlan.length && k === 'L') { return this.pickIppo(this.ippoPlan[this.ippoI++]); }
    if (k === 'L' && step === 1 && d < 40 && Math.random() < (office ? 0.25 : 0.42)) {
      this.ippoPlan = IPPO_PLANS[Math.floor(Math.random() * IPPO_PLANS.length)]; this.ippoI = 1;
      if (this.time - this.ippoSayT > 4) { this.ippoSayT = this.time; this.say('IPPO COMBO', '#7ce7ff', 1, 0.6); }
      return this.pickIppo(this.ippoPlan[0]);
    }
    if (k === 'H' && Math.random() < 0.4) { const pool = IPPO_HEAVY.filter((x) => x !== this.fistLastKey); return this.pickIppo(pool[Math.floor(Math.random() * pool.length)]); }
    const HANDS = { light: ['L', 'LL', 'LLL', 'LHL', 'FX_TRIPLE', 'FX_STRAIGHT'], mid: ['H', 'LH', 'LHH', 'KF1', 'KF2', 'FX_SHOCKPALM', 'FX_RISEELBOW', 'FX_HOOKS', 'FX_CLAW'], heavy: ['LLLH', 'LLLLH', 'KF1', 'KF2', 'FX_DROPFIST', 'FX_SHOCKPALM'] };
    const FEET = office
      ? {
          light: ['KV1', 'KV2', 'HL', 'LLLL', 'S1', 'S2'],
          mid: ['FK_AXEKICK', 'FK_CARTWHEEL', 'KV3', 'HLL', 'LLH', 'S4'],
          heavy: ['FK_BUTTERFLY', 'FK_CARTWHEEL', 'FK_AXEKICK', 'HLH', 'HHL', 'S5', 'S6'],
        }
      : {
          light: ['KV1', 'KV2', 'HL', 'LLLL', 'S1', 'S2', 'S3'],
          mid: ['KV3', 'HLL', 'LLH', 'S4', 'KV4', 'FX_KNEES'],
          heavy: ['HHL', 'HLH', 'S5', 'S6', 'S8', 'KVH', 'KV5', 'LLLLL', 'HH'],
        };
    let tier: 'light' | 'mid' | 'heavy' = k === 'H' ? (step >= 3 ? 'heavy' : 'mid') : step <= 2 ? 'light' : step === 3 ? 'mid' : 'heavy';
    if (weak && step >= 2) tier = 'heavy';
    const hist = this.fistHist;
    const l1 = hist[hist.length - 1], l2 = hist[hist.length - 2];
    let foot: boolean;
    if (office && tier !== 'light') foot = Math.random() < 0.8;
    else if (l1 && l1 === l2) foot = l1 === 'h';
    else if (l1) foot = Math.random() < 0.72 ? l1 === 'h' : l1 === 'f';
    else foot = Math.random() < 0.4;
    let pool: string[];
    if (down) { pool = office ? ['FK_AXEKICK', 'HLL', 'KV3', 'KF2'] : ['KV3', 'KF2', 'HLL', 'S6']; foot = pool[0] !== 'KF2'; }
    else pool = (foot ? FEET : HANDS)[tier];
    const reach = pool.filter((x) => MOVES[x] && MOVES[x].range + 8 >= d && x !== this.fistLastKey);
    const use = reach.length ? reach : pool.filter((x) => MOVES[x] && x !== this.fistLastKey);
    const key = (use.length ? use : pool)[Math.floor(Math.random() * (use.length ? use.length : pool.length))];
    hist.push(foot ? 'f' : 'h'); if (hist.length > 4) hist.shift();
    this.fistLastKey = key;
    if (tier === 'heavy' || MOVES[key].finisher || /^FK_/.test(key)) {
      this.say(MOVES[key].name, key === 'FK_BUTTERFLY' ? '#ffb347' : this.pal.accent2, 2, 0.72);
      if (tier === 'heavy' || MOVES[key].finisher) this.fistStep = 0;
    }
    return key;
  }
  /** attack-token system: how many melee enemies may press the attack at once */
  maxTokens() {
    if (this.mode === 'survival') return Math.min(6, 1 + Math.floor(this.wave / 3));
    return this.levelN < 8 ? 1 : this.levelN < 35 ? 2 : this.levelN < 110 ? 3 : 4;
  }
  /** 0..1 how smart/aggressive the AI behaves right now */
  brutality() {
    return this.mode === 'survival' ? clamp(this.wave / 18, 0, 1) : clamp(this.levelN / 160, 0, 1);
  }
  releaseToken(e: Enemy) {
    if (e.token) { e.token = false; e.tokenT = 0; }
  }
  slotCount(role: 'melee' | 'ranged') {
    let n = 0;
    for (const e of this.enemies) if (!e.dead && e.role === role && e.kind !== 'boss' && e.kind !== 'bomber') n++;
    return n;
  }
  /** assign ring slots + attack tokens; called every frame (cheap) */
  updateTactics(dt: number) {
    const p = this.player;
    const melee: Enemy[] = [], ranged: Enemy[] = [];
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.kind === 'boss' || e.kind === 'bomber') continue;
      (e.role === 'melee' ? melee : ranged).push(e);
    }
    // slots: sort by angle around the player so neighbours don't cross paths, assign evenly
    // each enemy's ring angle = its own bearing, relaxed toward the midpoint between its angular neighbours.
    // Nobody is ever sent to the far side of the player, so they spread out without crossing through him.
    const relax = (arr: Enemy[]) => {
      arr.sort((a, b) => Math.atan2(a.y - p.y, a.x - p.x) - Math.atan2(b.y - p.y, b.x - p.x));
      const n = arr.length;
      const angs = arr.map((e) => Math.atan2(e.y - p.y, e.x - p.x));
      for (let i = 0; i < n; i++) {
        arr[i].slot = i;
        if (n === 1) { arr[i].slotAng = angs[i]; continue; }
        const prev = angs[(i - 1 + n) % n] - (i === 0 ? Math.PI * 2 : 0);
        const next = angs[(i + 1) % n] + (i === n - 1 ? Math.PI * 2 : 0);
        const minGap = Math.min(1.1, Math.PI * 2 / n); // keep at least this much arc from the neighbours when possible
        let a = angs[i];
        if (a - prev < minGap) a += (minGap - (a - prev)) * 0.5;
        if (next - a < minGap) a -= (minGap - (next - a)) * 0.5;
        arr[i].slotAng = a;
      }
    };
    relax(melee); relax(ranged);
    // tokens: expire stale ones, hand out to the closest eligible attackers
    const side = !!this.level.sideView;
    let held = 0;
    for (const e of melee) {
      if (e.token) {
        e.tokenT -= dt;
        const offFloor = side && (
          (e.state === 'chase' && Math.abs(e.y - p.y) > 48) ||
          e.stun > 0 ||
          e.waryT > 0 ||
          (!e.svGrounded && !officeOnStairs(this.level, e.x, e.y, 4))
        );
        if (e.tokenT <= 0 || e.stagger > 0 || e.down > 0 || offFloor) this.releaseToken(e);
        else held++;
      }
    }
    const max = side ? Math.max(3, this.maxTokens() + 1) : this.maxTokens();
    this.tokenTimer -= dt;
    if (held < max && this.tokenTimer <= 0) {
      const pool = melee.filter((e) => !e.token && e.stagger <= 0 && e.down <= 0 && e.stun <= 0 && e.attackCd <= 0.35 && e.state === 'chase');
      const floorPool = side ? pool.filter((e) => Math.abs(e.y - p.y) <= 44) : pool;
      const losPool = side ? floorPool.filter((e) => this.hasLOS(e)) : floorPool;
      const cands = (losPool.length ? losPool : floorPool.length ? floorPool : pool).sort((a, b) =>
        side
          ? (Math.abs(a.x - p.x) + Math.abs(a.y - p.y) * 2) - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y) * 2)
          : dist(a.x, a.y, p.x, p.y) - dist(b.x, b.y, p.x, p.y)
      );
      // one attacker at a time with a short gap between hand-offs; sometimes a coordinated pair/trio rushes together
      const coordinated = Math.random() < (side ? 0.45 : 0.2) + this.brutality() * 0.5;
      const want = coordinated ? max : Math.min(max, held + 1);
      const cap = side ? Math.max(1, want) : Math.max(1, Math.round(want * this.mental));
      for (const e of cands) {
        if (held >= cap) break;
        e.token = true; e.tokenT = side ? 1.6 : 2.4; held++;
      }
      this.tokenTimer = side ? 0.16 : (coordinated ? 1.0 - this.brutality() * 0.5 : Math.max(0.1, 0.45 - this.brutality() * 0.3));
    }
    // separation vectors (allies + player) so nobody stacks
    const all = this.enemies;
    for (const e of all) {
      e.sepx = 0; e.sepy = 0;
      if (e.dead || e.spawnT > 0) continue;
      for (const o of all) {
        if (o === e || o.dead || o.spawnT > 0) continue;
        const dx = e.x - o.x, dy = e.y - o.y;
        const d = Math.hypot(dx, dy);
        const want = (e.r + o.r) * 2.2;
        if (d < want && d > 0.01) { const f = (want - d) / want; e.sepx += (dx / d) * f; e.sepy += (dy / d) * f; }
      }
    }
  }
  startAttack(key: string) {
    const p = this.player;
    const move = MOVES[key];
    const foot = footMove(move);
    const scy = scytheMove(move);
    if (scy) {
      this.scythe.beginMove();
      this.scytheGhostAt = this.time;
      this.texts.add(p.x, p.y - 25 - p.z, move.name, SCYTHE_LIGHT[scy.scythe.school], 1, 0.5);
      if (move.finisher) this.say(move.name, SCYTHE_COLOR[scy.scythe.school], 2, 0.6);
    }
    if (foot) {
      this.footwork.beginMove(foot);
      this.footGhostAt = this.time;
      if (this.footNeon(foot)) {
        // Foot Mode V2 / V3: nama jurus selalu tampil; jurus lompat & pamungkas diumumkan besar.
        if (move.finisher || move.jump || move.travel) this.say(move.name, FOOT_SCHOOLS[foot.foot.school].color, 2, 0.6);
        else this.texts.add(p.x, p.y - 25 - p.z, move.name, FOOT_SCHOOLS[foot.foot.school].light, 1, 0.5);
      } else if (move.finisher && foot.foot.school !== 'flamingo') this.say(move.name, FOOT_SCHOOLS[foot.foot.school].color, 2, 0.55);
      else if (foot.foot.school !== 'flamingo') this.texts.add(p.x, p.y - 25 - p.z, move.name, FOOT_SCHOOLS[foot.foot.school].light, 1, 0.5);
    }
    p.comboStr = ['DASH', 'FOCUS', 'RUNPUNCH', 'NDASH', 'NRUN', 'KDASH', 'KRUN', 'ARUN', 'ADASH', 'DRUN', 'DDASH', 'TKD', 'AIR', 'AIR4', 'AIR_H', 'CHAIN', 'CHAINEND', 'RAGEKILL', 'YRUN', 'YAIR', 'BRUN', 'BDASH'].includes(key) || scy ? '' : key;
    if (move.katana || move.axe || move.dual || move.bat || move.buster || scy) { p.iaiVictims = []; p.sheatheT = 0; p.bladeA = p.aim + (move.slash ? move.slash.from * p.facing : 0); p.bladePrevA = p.bladeA; p.bladeB = p.aim - (move.slash ? move.slash.from * p.facing : 0); }
    p.moveKey = key; p.attackPhase = 'windup'; p.attackT = move.windup; p.attackElapsed = 0; p.hitSet = []; p.hitTimes = {}; p.prevLimb = null; p.travelHit = false; this.prevBlade = null; this.yoyoFeet = null;
    p.comboTimer = 0.9;
    // Shotgun Dropkick: lari kencang direm mendadak supaya badan tepat di sasaran saat kedua kaki mengenai.
    if (foot && foot.foot.school === 'drop') { p.vx *= 0.55; if (!this.level.sideView) p.vy *= 0.55; p.kx += Math.cos(p.aim) * 90; if (!this.level.sideView) p.ky += Math.sin(p.aim) * 90; }
    // SERANGAN DARI LARI: momentum maju terbawa ke serangan (karakter tidak berhenti mendadak)
    {
      const runSp = this.level.sideView ? Math.abs(p.vx) : Math.hypot(p.vx, p.vy);
      if (!p.airborne && !move.travel && !move.air && runSp > 70 && p.gaitRun > 0.3) {
        const carry = 0.2 + 0.25 * clamp((runSp - 70) / 60, 0, 1);
        p.kx += p.vx * carry; if (!this.level.sideView) p.ky += p.vy * carry;
      }
    }
    // DRUNKEN MASTER (Gerbang 6): langkah ayun luwes saat basic attack, terjangan eksplosif saat Finisher Punch!
    if (this.gates.drunkK > 0.3 && !move.travel && !move.air && !p.airborne) {
      const dk = this.gates.drunkK;
      const boost = move.finisher ? 42 : 16;
      p.kx += Math.cos(p.aim) * boost * dk; if (!this.level.sideView) p.ky += Math.sin(p.aim) * boost * dk;
    }
    // ONE FOR ALL lock-on: blink to the locked enemy when it is out of reach (game1's behaviour),
    // so a full meter plays as "pick a target, delete it, the lock jumps to the next one".
    if (p.ofaActive && this.lockTarget && !this.lockTarget.dead && key !== 'FOCUS') {
      const lt = this.lockTarget;
      const d = dist(lt.x, lt.y, p.x, p.y);
      const reach = move.range * this.stats.meleeRange + 6;
      if (d > reach && d < 240) {
        const la = Math.atan2(lt.y - p.y, lt.x - p.x);
        for (let i = 1; i <= 5; i++) {
          const tt = i / 6;
          this.addAfterimage({ x: lerp(p.x, lt.x, tt), y: lerp(p.y, lt.y, tt), facing: Math.cos(la) >= 0 ? 1 : -1, aim: la, scale: 1 }, OFA_COL, { x: Math.cos(la), y: Math.sin(la) });
        }
        const nx = lt.x - Math.cos(la) * (lt.r + p.r + 3), ny = lt.y - Math.sin(la) * (lt.r + p.r + 3);
        if (this.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; p.iframes = Math.max(p.iframes, 0.1); p.aim = la; p.attackAim = la; p.facing = Math.cos(la) >= 0 ? 1 : -1; }
        this.sfx.dash();
      }
    }
    if (key !== 'FOCUS') {
      const airLock = p.airborne && p.airLockId && p.airLockId > 0
        ? this.enemies.find((en) => en.id === p.airLockId && !en.dead && en.spawnT <= 0 && dist(en.x, en.y, p.x, p.y) <= 58)
        : undefined;
      if (airLock) {
        const ta = Math.atan2(airLock.y - p.y, airLock.x - p.x);
        p.aim = ta;
      } else if (!foot) {
        // soft aim assist: snap toward the nearest enemy in a generous cone around the cursor direction
        const searchArc = Math.max(1.3, move.arc + 0.7);
        let target = this.nearestEnemy(p.x, p.y, move.range * this.stats.meleeRange * 1.7 + 12 + (move.travel ? 50 : 0), p.aim, searchArc);
        // point-blank: an enemy touching you gets the strike even if the cursor drifted behind you
        if (!target) target = this.nearestEnemy(p.x, p.y, 16, p.aim, 2.6);
        if (foot && target && this.level.sideView && Math.abs(p.y - target.y) > (move.air ? 34 : 14)) target = null;
        if (target) {
          const ta = Math.atan2(target.y - p.y, target.x - p.x);
          p.aim += angleDiff(ta, p.aim) * 0.85;
        }
      }
    }
    const sideMeleeFlat = !!this.level.sideView && !move.travel && !move.air && p.weapon !== 'pistol' && p.weapon !== 'rifle' && p.weapon !== 'shotgun' && p.weapon !== 'bow' && p.weapon !== 'yoyo';
    if (sideMeleeFlat) p.aim = Math.cos(p.aim) >= 0 ? 0 : Math.PI;
    else if (this.level.sideView && move.air && !move.travel) {
      const baseAim = Math.cos(p.aim) >= 0 ? 0 : Math.PI;
      p.aim = baseAim + clamp(angleDiff(p.aim, baseAim), -0.55, 0.55);
      const airT = (p.airLockId && p.airLockId > 0 ? this.enemies.find((en) => en.id === p.airLockId && !en.dead) : null)
        ?? this.nearestEnemy(p.x, p.y, 44, p.aim, 1.8);
      if (airT && Math.abs(airT.x - p.x) > 10) p.kx += Math.sign(airT.x - p.x) * 28;
    }
    p.attackAim = p.aim;
    p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
    if (p.dashT > 0) p.dashT = 0;
    p.parryT = 0;
    p.runT = 0; p.running = false;
    // PRINSIP ANTICIPATION (Ancang-ancang): sebelum melompat/salto (Butterfly Flip, Cartwheel Kick, Monkey Flip, dll.),
    // karakter membungkuk rendah di lantai (squash rendah + tanpa blur blending) agar tolakan terasa meledak & bertenaga!
    const isSalto = move.pose === 'butterflyflip' || move.pose === 'cartwheelkick' || move.pose === 'monkeyflip';
    if ((isSalto || move.jump) && !move.air) {
      p.z = 0;
      p.squash = isSalto ? 0.72 : 0.76;
      p.blend = 0;
      p.kx -= Math.cos(p.aim) * (isSalto ? 22 : 14);
      if (!this.level.sideView) p.ky -= Math.sin(p.aim) * (isSalto ? 22 : 14);
      this.particles.smoke(p.x, p.y + 1, 4, '#9a9a9a', 20, 0.3);
    } else if (move.pose === 'axekick' && !move.air) {
      // Axe Kick: ancang-ancang merendah singkat sebelum mengangkat kaki lurus tinggi ke atas kepala
      p.squash = 0.82;
      p.blend = 0;
      p.kx -= Math.cos(p.aim) * 18;
      this.particles.smoke(p.x, p.y + 1, 3, '#9a9a9a', 16, 0.28);
    }
    if (move.id === 'tkd') {
      p.lean = { x: Math.cos(p.aim), y: sideMeleeFlat ? 0 : Math.sin(p.aim) }; p.tkdDir = { ...p.lean };
      this.particles.dirBurst(p.x, p.y, 8, '#cfcfcf', p.aim + Math.PI, 0.5, 110, 0.35);
      this.particles.ring(p.x, p.y, 3, 12, '#ffffff', 0.18, 1);
    }
    // FIST MODE: ancang-ancang. Badan merunduk & tertarik ke belakang sekejap,
    // lalu meledak maju saat frame aktif — pukulan terbaca punya bobot.
    if ((p.weapon === 'fist' || p.weapon === 'boxing') && !move.travel && !move.jump && !isSalto && move.pose !== 'axekick') {
      const heavy = !!move.finisher || move.dmg >= 9 || !!move.knockdown;
      p.squash = heavy ? 0.85 : 0.93;
      p.kx -= Math.cos(p.aim) * (heavy ? 28 : 13);
      if (!this.level.sideView) p.ky -= Math.sin(p.aim) * (heavy ? 28 : 13);
      this.particles.smoke(p.x, p.y + 1, heavy ? 2 : 1, '#9a9a9a', 13, 0.26);
    }
  }
  attackPoseT() {
    const p = this.player;
    if (!p.moveKey) return 0;
    const m = MOVES[p.moveKey];
    const scyM = scytheMove(m);
    if (scyM) {
      if (p.attackPhase === 'windup') return .3 * scytheProgress(p.attackT, m.windup);
      if (p.attackPhase === 'active') return .3 + .3 * scytheProgress(p.attackT, m.active);
      if (p.attackPhase === 'recover') return .6 + .4 * scytheProgress(p.attackT, m.recover);
      return 0;
    }
    if (footMove(m)) {
      if (p.attackPhase === 'windup') return .3 * footProgress(p.attackT, m.windup);
      if (p.attackPhase === 'active') return .3 + .3 * footProgress(p.attackT, m.active);
      if (p.attackPhase === 'recover') return .6 + .4 * footProgress(p.attackT, m.recover);
      return 0;
    }
    if (p.attackPhase === 'windup') {
      const u = clamp(1 - p.attackT / Math.max(0.001, m.windup), 0, 1);
      return 0.3 * (u * u * (3 - 2 * u));
    }
    if (p.attackPhase === 'active') {
      const u = clamp(1 - p.attackT / Math.max(0.001, m.active), 0, 1);
      return 0.3 + 0.3 * (u * 0.45 + (1 - Math.pow(1 - u, 2)) * 0.55);
    }
    if (p.attackPhase === 'recover') {
      const u = clamp(1 - p.attackT / Math.max(0.001, m.recover), 0, 1);
      return 0.6 + 0.4 * (u * u * (3 - 2 * u));
    }
    return 0;
  }
  /**
   * FIST MODE — perias ayunan.
   * Membaca arah pukulan lalu menebar busur kecepatan di depan kepalan, satu
   * ghost tubuh yang tertinggal, debu di kaki (berat badan pindah ke depan),
   * dan hentakan kamera searah pukulan. Pukulan berat & tendangan dapat porsi
   * lebih besar supaya bedanya terasa.
   */
  fistSwingFx(move: Move, a: number, fx: number, fy: number) {
    const p = this.player;
    const gate6 = this.gates.drunkK > 0.3;
    const heavy = !!move.finisher || move.dmg >= 9 || move.knockdown;
    const kick = !!move.kick;
    const col = gate6 ? this.gates.mid : heavy ? this.pal.accent2 : '#ffffff';
    const arcR = 6 + move.range * 0.55;
    // busur kecepatan: di Gerbang 6 basic attack pun punya jejak chakra yang keren & responsif ("WOW" feel)
    const n = kick ? 4 : heavy ? 5 : gate6 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const ang = a + (t - 0.5) * (kick ? 1.4 : 0.9);
      const rr = arcR * (0.6 + t * 0.4);
      this.particles.lines(
        p.x + Math.cos(ang) * rr, p.y - 6 - p.z + Math.sin(ang) * rr * 0.62,
        1, i % 2 ? col : 'rgba(255,255,255,0.65)', ang, 190 + i * 20,
      );
    }
    this.particles.ring(fx, fy, 1, heavy ? 9 : 6, col, 0.1, 1, true);
    if (heavy) this.shake(0.1);
    // berat badan ikut maju: debu tipis di kaki belakang + badan meregang (stretch)
    this.particles.smoke(p.x - Math.cos(a) * 4, p.y + 1, heavy ? 2 : 1, '#9a9a9a', 14, 0.26);
    p.squash = heavy ? 1.18 : 1.1;
    p.kx += Math.cos(a) * (heavy ? 22 : 11);
    if (!this.level.sideView) p.ky += Math.sin(a) * (heavy ? 22 : 11);
    // ghost pertama, sedikit di belakang tubuh
    this.addAfterimage(
      { x: p.x - Math.cos(a) * 2.6, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: move.pose, poseT: 0.32 },
      heavy ? col : 'rgba(255,255,255,0.7)', p.lean,
    );
    this.camKick.x += Math.cos(a) * (heavy ? 3 : 1.6);
    this.camKick.y += Math.sin(a) * (heavy ? 3 : 1.6) - (kick ? 1.4 : 0.7);
    this.fistGhostT = 0.03;
  }

  updateAttack(dt: number) {
    const p = this.player;
    if (p.attackPhase === 'none') {
      p.airLockId = -1;
      if (p.weapon === 'foot') this.applyFootStance();
      if (p.weapon === 'foot' && this.footwork.pending && p.stunT <= 0 && (p.jumpAntT ?? 0) <= 0 && (p.svJumpAntT ?? 0) <= 0) {
        const command = this.footwork.take(this.footwork.clock, 1.04 / Math.min(1, this.tempo));
        if (command) { this.startFootInput(command); return; }
        p.buffered = null;
      }
      if (p.weapon === 'scythe' && this.scythe.pending && p.stunT <= 0 && (p.jumpAntT ?? 0) <= 0 && (p.svJumpAntT ?? 0) <= 0) {
        const command = this.scythe.take(this.scythe.clock, 1.04 / Math.min(1, this.tempo));
        if (command) { this.startScytheInput(command); return; }
        p.buffered = null;
      }
      if (p.comboStr) { p.comboTimer -= dt; if (p.comboTimer <= 0) { p.comboStr = ''; p.katanaPlan = 0; } }
      return;
    }
    const move = MOVES[p.moveKey!];
    const foot = footMove(move);
    const scy = scytheMove(move);
    if (foot && p.attackPhase === 'recover' && p.attackT < move.recover * (move.finisher ? .55 : .92)) this.applyFootStance();
    const basePace = scy ? 1.44 : foot ? (this.footVer === 3 ? 1.42 : foot.foot.v2 ? 1.46 : 1.27) : move.id === 'chain' ? 1.48 : move.bat ? this.batSpeed() : move.buster ? this.bu.speed * 1.44 : 1.56;
    const linkPace = scy && p.attackPhase === 'windup' && this.scythe.linkFrom ? 1.28 : foot && p.attackPhase === 'windup' && this.footwork.linkFrom ? (this.footNeon(foot) ? 1.3 : 1.18) : 1;
    const spd = (move.id === 'chain' ? 1 : this.timeScaleBonus) * basePace * linkPace * this.tempo * this.gates.atkMul;
    p.attackT -= dt * spd;
    p.attackElapsed += dt * spd;
    const chaseAir = foot && foot.foot.school === 'drop';
    if ((foot || scy) && !move.air && (chaseAir || !p.airborne) && !move.travel && p.attackPhase !== 'recover') {
      const target = this.enemies.find(e => e.id === (foot ? this.footwork.target : this.scythe.target) && !e.dead && e.spawnT <= 0);
      if (target) {
        const side = !!this.level.sideView, distance = dist(p.x, p.y, target.x, target.y);
        const angle = Math.atan2(side ? 0 : target.y - p.y, target.x - p.x);
        const reachChase = foot?.foot.school === 'drop' ? 46 : 27;
        if (distance <= reachChase && (!side || Math.abs(target.y - p.y) <= 8) && Math.abs(angleDiff(angle, p.attackAim)) <= 1.1 && lineOfSight(this.level, p.x, p.y, target.x, target.y)) {
          const stride = Math.max(0, distance - (move.finisher ? 14 : 13));
          const flamingo = foot ? (foot.foot.school === 'flamingo' || this.footNeon(foot)) : true;
          const step = Math.min((flamingo ? 65 : 55) * dt, stride * (1 - Math.exp(-(flamingo ? 12 : 9) * dt)));
          moveWithCollision(this.level, p, Math.cos(angle) * step, side ? 0 : Math.sin(angle) * step);
        }
      }
    }
    if (foot && foot.foot.school === 'drop' && p.attackPhase !== 'recover') {
      // Terbang mengejar target yang dikunci sampai kedua kaki benar-benar mengenai.
      const lock = this.enemies.find(e => e.id === this.footwork.target && !e.dead && e.spawnT <= 0);
      if (lock) {
        const side = !!this.level.sideView;
        const a = Math.atan2(side ? 0 : lock.y - p.y, lock.x - p.x);
        p.aim = a; p.attackAim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1;
        const d = dist(p.x, p.y, lock.x, lock.y);
        if (d > 10) {
          p.kx += Math.cos(a) * 300 * dt;
          if (!side) p.ky += Math.sin(a) * 300 * dt;
        }
        if (side && Math.abs(lock.y - p.y) > 10) p.kx -= Math.cos(a) * 300 * dt;
      }
    }
    if (p.airborne && p.airLockId && p.airLockId > 0 && p.attackPhase !== 'recover') {
      const lock = this.enemies.find((en) => en.id === p.airLockId && !en.dead && en.spawnT <= 0);
      if (lock && dist(p.x, p.y, lock.x, lock.y) <= 56) {
        const pull = 1 - Math.exp(-(foot ? 30 : 22) * dt);
        const side = !!this.level.sideView;
        const hDir = lock.x >= p.x ? 1 : -1;
        const gap = Math.max(9, Math.min(14, (move.range || 20) * this.stats.meleeRange * 0.6));
        if (side) {
          const tx = lock.x - hDir * gap;
          const y = lock.y - (foot ? this.isEnemyAirborne(lock) ? 2 : 5 : 0);
          moveSideView(this.level, p, (tx - p.x) * pull, (y - p.y) * pull, true, this.props);
        } else {
          const a = Math.atan2(lock.y - p.y, lock.x - p.x);
          const tx = lock.x - Math.cos(a) * gap, ty = lock.y - Math.sin(a) * gap;
          if (this.isFree(p.x + (tx - p.x) * pull, p.y + (ty - p.y) * pull, p.r)) {
            p.x += (tx - p.x) * pull; p.y += (ty - p.y) * pull;
          }
          p.z = lerp(p.z, Math.max(foot ? 6 : 4, lock.z), pull);
        }
        p.aim = side ? (hDir >= 0 ? 0 : Math.PI) : Math.atan2(lock.y - p.y, lock.x - p.x);
        p.attackAim = p.aim;
        p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
      }
    }
    if (p.attackPhase === 'windup' && foot && foot.foot.school === 'drop') {
      // Shotgun Dropkick: bidik & hadapi target sejak ancang-ancang.
      const lock = this.enemies.find(e => e.id === this.footwork.target && !e.dead && e.spawnT <= 0);
      if (lock) {
        const a = Math.atan2(this.level.sideView ? 0 : lock.y - p.y, lock.x - p.x);
        p.aim = a; p.attackAim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1;
      }
    }
    if (p.attackPhase === 'windup') {
      const wProg = 1 - p.attackT / Math.max(0.001, move.windup);
      const overflow = Math.max(0, -p.attackT);
      // Tahan karakter membungkuk rendah di lantai selama frame ancang-ancang sebelum melompat/salto
      if (!move.air && (move.pose === 'butterflyflip' || move.pose === 'cartwheelkick' || move.pose === 'monkeyflip' || (move.jump && !move.travel))) {
        p.z = 0;
        if (wProg < 0.72) p.squash = Math.min(p.squash, 0.74);
        else p.squash = lerp(0.74, 1.14, (wProg - 0.72) / 0.28);
      } else if (!move.air && move.pose === 'axekick' && wProg > 0.35) {
        // Stretch tegak saat kaki diangkat lurus tinggi melewati atas kepala
        p.squash = lerp(1, 1.12, clamp((wProg - 0.35) / 0.65, 0, 1));
      }
      if (p.attackT <= 0) {
        p.attackPhase = 'active'; p.attackT = foot ? Math.max(move.active * .32, move.active - overflow) : move.active;
        if (foot) this.footwork.linkFrom = null;
        // SMOOTH FIST: momentum jurus sebelumnya tidak ditumpuk mentah di atas lunge baru —
        // 45% terbawa, sisanya diganti lunge jurus ini. Perpindahan antar-jurus jadi mengalir.
        if ((p.weapon === 'fist' || p.weapon === 'boxing' || foot) && !move.travel) {
          p.kx = p.kx * (foot ? .30 : .45) + Math.cos(p.aim) * move.lunge;
          if (!this.level.sideView || move.air) p.ky = p.ky * 0.45 + Math.sin(p.aim) * move.lunge;
        } else {
          p.kx += Math.cos(p.aim) * move.lunge;
          if (!this.level.sideView || move.travel || move.air) p.ky += Math.sin(p.aim) * move.lunge;
        }
        this.sfx.swing(scy ? .95 : this.footNeon(foot) ? (move.sfx === 'heavy' ? 0.7 : move.sfx === 'kick' ? 0.85 : 1.1) : foot ? move.finisher ? .67 : foot.foot.both ? .83 : 1.06 : this.gates.drunkK > 0.5 ? 0.62 : move.sfx === 'heavy' ? 0.7 : move.sfx === 'kick' ? 0.85 : move.sfx === 'nunchaku' ? 1.4 : 1.1);
        if (scy) {
          const col = SCYTHE_COLOR[scy.scythe.school];
          this.sfx.scytheSwing(move.finisher);
          p.squash = move.finisher ? 1.12 : 1.04;
          if (!move.air && !move.travel) this.particles.smoke(p.x - p.facing * 3, p.y, move.finisher ? 4 : 2, '#b3a08a', 15, .2);
          if (move.jump || move.travel) {
            this.sfx.launch();
            this.particles.ring(p.x, p.y - 2 - p.z, 2, 10, col, .15, 1, true);
            this.particles.dirBurst(p.x, p.y, 5, col, p.aim + Math.PI, 0.5, 95, 0.28);
          }
        }
        if (move.nunchaku) { this.nunchaku.spinSpeed = 0; if (move.id === 'n_whipcrack' || move.id === 'n_overhead') this.sfx.whoosh(); }
        if (move.yoyo) {
          const spin = move.id === 'y_orbit' || move.id === 'y_storm' || move.id === 'y_flare';
          this.sfx.yoyoThrow(spin);
          this.particles.ring(p.x, p.y - 6 - p.z, 3, spin ? 16 : 10, this.yoyoV2.skin.aura, 0.2, 1);
          if (spin || move.finisher) this.say(move.name, this.yoyoV2.skin.accent, 2, 0.7);
        }
        const a = p.aim;
        const fx = p.x + Math.cos(a) * 9, fy = p.y - 6 + Math.sin(a) * 6;
        if (foot) {
          const school = FOOT_SCHOOLS[foot.foot.school];
          p.squash = move.finisher ? 1.12 : 1.04;
          if (!move.air) this.particles.smoke(p.x - p.facing * 3, p.y, move.finisher ? 4 : 2, '#b3a08a', 17, .22);
          if (move.jump || move.finisher) this.particles.ring(p.x, p.y - 2 - p.z, 2, 10, school.color, .15, 1, true);
          if (this.footNeon(foot)) {
            // FOOT MODE V2 / V3: ayunan memakai busur kecepatan + ghost Fist Mode, ditambah kilatan warna jurus.
            if (!move.travel) this.fistSwingFx(move, a, fx, fy);
            this.particles.lines(fx, fy, 2, school.color, a, 230);
            if (move.jump || move.travel) {
              this.sfx.launch(); this.sfx.whoosh(); p.squash = 1.2;
              this.particles.dirBurst(p.x, p.y, 5, school.light, a + Math.PI, 0.5, 95, 0.28);
            }
          }
        }
        // FIST MODE: tiap ayunan tangan/kaki meninggalkan busur kecepatan + ghost
        if ((p.weapon === 'fist' || p.weapon === 'boxing') && !move.buster && !move.bat && !move.travel) {
          this.fistSwingFx(move, a, fx, fy);
        }
        if (move.buster) {
          this.bu.addSlash(p.x, p.y - 7 - p.z, move.range * 0.85, a - 0.8, a + 0.8, this.bu.trailColor(), 3, 0, 0.16, 0.5);
          if (this.bu.momentum >= 2) this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: move.pose, poseT: 0.45 }, MAKO, p.lean); }
        if (move.bat) { this.particles.lines(fx, fy, 1, '#ffffff', a + rnd(-0.3, 0.3), 220); if (this.batSpam >= 8) this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: move.pose, poseT: 0.45 }, '#ffb347', p.lean); }
        switch (move.id) {
          case 'jab': case 'cross': this.particles.lines(fx, fy, 1, '#ffffff', a, 210); break;
          case 'runpunch': this.particles.lines(fx, fy, 3, '#ffffff', a, 280); this.particles.smoke(p.x, p.y, 2, '#888', 24, 0.3); break;
          case 'sweep': this.particles.ring(p.x, p.y, 4, move.range * this.stats.meleeRange * 0.85, '#ffffff', 0.18, 1, true); this.particles.smoke(p.x, p.y, 3, '#777', 22, 0.32); break;
          case 'dragon': case 'focus':
            this.particles.smoke(p.x, p.y, 3, '#888', 26, 0.35);
            this.particles.dirBurst(fx, fy, 4, '#ffffff', -Math.PI / 2, 0.35, 160, 0.24);
            if (move.id === 'focus') this.particles.shockwave(p.x, p.y - 4, 22, this.pal.accent, 0.24);
            break;
          case 'palm': this.particles.ring(fx, fy, 2, 8, '#ffffff', 0.12, 1, true); break;
          case 'flying': this.sfx.launch(); p.squash = 1.2; this.particles.dirBurst(p.x, p.y, 5, '#cfcfcf', a + Math.PI, 0.45, 90, 0.28); break;
          case 'monkeyflip':
            this.sfx.launch(); p.squash = 1.22;
            this.particles.dirBurst(p.x, p.y, 6, '#dcdcdc', Math.PI / 2, 1.1, 75, 0.3);
            this.particles.ring(p.x, p.y - 2, 2, 11, '#ffffff', 0.16, 1, true);
            break;
          case 'fk_butterfly':
            // Liu Kang Butterfly Flip: ledakan tolakan dari ancang-ancang rendah + percikan naga emas-jingga!
            this.sfx.launch(); this.sfx.whoosh();
            p.squash = 1.24;
            this.particles.smoke(p.x, p.y, 6, '#a0a0a0', 30, 0.36);
            this.particles.dirBurst(p.x, p.y, 7, '#ffd27f', a + Math.PI, 0.75, 115, 0.32);
            this.particles.ring(p.x, p.y - 3, 2, 14, '#ff9d3b', 0.2, 1, true);
            if (this.level.sideView && this.glowOn) this.glowFx.add(p.x, p.y - 9, 44, '#ff9d3b', 0.16);
            break;
          case 'fk_cartwheel':
            // Tendangan Roda: tolakan kuat ke putaran roda 360°
            this.sfx.whoosh(); this.sfx.kick();
            p.squash = 1.16;
            this.particles.smoke(p.x + p.facing * 4, p.y, 5, '#9a9a9a', 26, 0.34);
            this.particles.ring(p.x + p.facing * 5, p.y - 6, 2, 12, '#ffe680', 0.18, 1, true);
            break;
          case 'fk_axekick': case 'axekick': case 'kv_axe':
            // Axe Kick: kilatan ayunan kapak lurus dari atas kepala ke bawah!
            this.sfx.whoosh();
            this.particles.lines(p.x + p.facing * 7, p.y - 14 - p.z, 3, '#ffd27f', Math.PI / 2 - p.facing * 0.18, 220);
            break;
        }
      }
    }
    if (p.attackPhase === 'active') {
      const aProg = clamp(1 - p.attackT / Math.max(0.001, move.active), 0, 1);
      if (move.travel) {
        if (!move.air) p.z = (move.jump ?? 0) * Math.sin(Math.PI * aProg);
        if (!foot) {
          this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: move.pose, poseT: move.id === 'tkd' ? 0.5 : 0.45 }, this.pal.accent, p.lean);
          if (Math.random() < 0.8) this.particles.lines(p.x - Math.cos(p.aim) * 6, p.y - 6 - Math.sin(p.aim) * 4, 1, '#ffffff', p.aim + Math.PI, 160);
        }
        if (move.air) { p.vz = Math.min(p.vz, -90); }
      } else if (move.jump && !move.air) {
        // Kurva lompatan balistik tajam untuk jurus salto (Butterfly Flip, Monkey Flip, Concasse, dll.):
        // naik cepat begitu lepas dari ancang-ancang rendah, hang-time mantap di puncak, mendarat tegas di lantai.
        p.z = move.jump * Math.sin(Math.PI * Math.pow(aProg, 0.8));
      }
      if (foot) {
        if (move.id === 'foot_air_comet') {
          if (this.level.sideView && !p.svGrounded) p.svVy = lerp(p.svVy ?? 0, 175, 1 - Math.exp(-22 * dt));
          if (!this.level.sideView && p.airborne) p.vz = lerp(p.vz, -155, 1 - Math.exp(-22 * dt));
        }
        if (!this.footMotion.matches && (foot.foot.both || move.travel || move.finisher || this.footNeon(foot)) && footContact(foot, aProg) && this.time >= this.footGhostAt) {
          this.footGhostAt = this.time + (this.footNeon(foot) ? (move.jump || move.travel || move.air ? .04 : .05) : .056);
          this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: move.pose, poseT: this.attackPoseT() }, FOOT_SCHOOLS[foot.foot.school].color, p.lean);
        }
      }
      // Koreografi gerak & jejak visual khusus 3 jurus andalan Kantor V2
      if (move.pose === 'butterflyflip') {
        // Liu Kang Butterfly Flip: meluncur horizontal bertenaga sambil memutar 2 kaki sabit berapi emas-merah
        p.kx = lerp(p.kx, Math.cos(p.aim) * 148, 1 - Math.exp(-14 * dt));
        if (!this.level.sideView) p.ky = lerp(p.ky, Math.sin(p.aim) * 148, 1 - Math.exp(-14 * dt));
        this.fistGhostT -= dt;
        if (this.fistGhostT <= 0) {
          this.fistGhostT = 0.042;
          const ptNow = this.attackPoseT();
          this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'butterflyflip', poseT: ptNow }, aProg < 0.5 ? '#ffb347' : '#ff5a36', p.lean);
          const sk = solvePose(this.playerStickOpts('butterflyflip', ptNow));
          const foot = aProg < 0.48 ? sk.bfoot : sk.ffoot;
          this.particles.spark(p.x + foot.x, p.y + foot.y - p.z, 2, aProg < 0.5 ? '#ffe08a' : '#ff7b39', p.aim + Math.PI, 0.7, 95);
        }
        // Sabetan kedua berbunyi whoosh agar putaran kupu-kupu 2 kaki terasa hidup
        if (aProg >= 0.48 && aProg - (dt * spd) / move.active < 0.48) this.sfx.whoosh();
      } else if (move.pose === 'cartwheelkick') {
        // Cartwheel Kick (Tendangan Roda): menggelinding maju seperti roda + lompatan kecil saat tangan menolak lantai
        p.kx = lerp(p.kx, Math.cos(p.aim) * 132, 1 - Math.exp(-14 * dt));
        if (!this.level.sideView) p.ky = lerp(p.ky, Math.sin(p.aim) * 132, 1 - Math.exp(-14 * dt));
        p.z = aProg > 0.66 ? 4.2 * Math.sin(((aProg - 0.66) / 0.34) * Math.PI) : 0;
        this.fistGhostT -= dt;
        if (this.fistGhostT <= 0) {
          this.fistGhostT = 0.046;
          const ptNow = this.attackPoseT();
          this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'cartwheelkick', poseT: ptNow }, '#ffd97d', p.lean);
          if (aProg < 0.7) this.particles.smoke(p.x + p.facing * 2, p.y, 1, '#9a9a9a', 15, 0.22);
        }
        if (aProg >= 0.5 && aProg - (dt * spd) / move.active < 0.5) this.sfx.whoosh();
      } else if (move.pose === 'axekick' && !move.air) {
        // Axe Kick (Tendangan Kapak): garis tebasan vertikal mengikuti tumit yang menghantam lurus ke bawah
        this.fistGhostT -= dt;
        if (this.fistGhostT <= 0) {
          this.fistGhostT = 0.032;
          const ptNow = this.attackPoseT();
          const sk = solvePose(this.playerStickOpts('axekick', ptNow));
          this.particles.lines(p.x + sk.ffoot.x, p.y + sk.ffoot.y - p.z, 2, aProg < 0.5 ? '#ffffff' : '#ffd27f', -Math.PI / 2, 165);
          if (aProg > 0.25 && aProg < 0.75) {
            this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'axekick', poseT: ptNow }, '#ffd27f', p.lean);
          }
        }
      } else if ((p.weapon === 'fist' || p.weapon === 'boxing') && !move.travel && (move.finisher || move.dmg >= 9)) {
        // FIST MODE: kepalan menarik garis ringan hanya pada jurus berat/finisher agar target tetap jelas
        this.fistGhostT -= dt;
        if (this.fistGhostT <= 0) {
          this.fistGhostT = 0.045;
          const sk = solvePose(this.playerStickOpts(move.pose, 0.3 + 0.3 * aProg));
          const hx = p.x + sk.fhand.x, hy = p.y + sk.fhand.y - p.z;
          this.particles.lines(hx, hy, 1, aProg < 0.45 ? '#ffffff' : this.pal.accent2, p.aim + Math.PI, 140);
        }
      }
      this.resolveMelee(move);
      if (foot && this.footwork.pending && this.footwork.confirmed && !move.finisher && p.attackPhase === 'active' && aProg >= Math.max(.72, foot.foot.window[1] - .04)) {
        p.attackPhase = 'recover'; p.attackT = move.recover * .91;
      }
      if (scy && this.scythe.pending && this.scythe.confirmed && !move.finisher && p.attackPhase === 'active' && aProg >= Math.max(.7, scy.scythe.window[1] - .04)) {
        p.attackPhase = 'recover'; p.attackT = move.recover * .9;
      }
      if (scy && !this.scytheMotion.matches && (scy.scythe.both || move.travel || move.finisher || move.rehit) && scytheContact(scy, aProg) && this.time >= this.scytheGhostAt) {
        this.scytheGhostAt = this.time + (move.jump || move.travel ? .045 : .06);
        this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: move.pose, poseT: this.attackPoseT() }, SCYTHE_COLOR[scy.scythe.school], p.lean);
      }
      if ((p.weapon === 'fist' || p.weapon === 'boxing') && p.buffered && p.hitSet.length > 0 && p.attackT < move.active * 0.35 && move.pose !== 'butterflyflip' && move.pose !== 'cartwheelkick' && move.pose !== 'axekick') {
        p.attackPhase = 'recover'; p.attackT = Math.min(p.attackT, move.recover * 0.5);
      }
      if (p.attackT <= 0) {
        p.attackPhase = 'recover'; p.attackT = move.recover;
        if (this.gates.drunkK > 0.3 && !move.travel && !move.air) {   // Drunken Master: badan terayun mundur setelah menghantam
          const dk = this.gates.drunkK;
          p.kx -= Math.cos(p.aim) * 20 * dk; if (!this.level.sideView) p.ky -= Math.sin(p.aim) * 20 * dk;
        }
        if (move.buster) this.busterImpact(move);
        if (move.id === 'sb_smash' || move.id === 'sb_pound' || move.id === 'b_spike') {
          const gx = p.x + Math.cos(p.aim) * 15, gy = p.y + Math.sin(p.aim) * 7;
          this.particles.shockwave(gx, gy, move.id === 'sb_pound' ? 14 : 20, '#ffffff', 0.25);
          this.particles.smoke(gx, gy, 6, '#8a8a8a', 40, 0.45);
          this.particles.burst(gx, gy, 6, this.pal.wallTop, 120, 0.4, 2, 3);
          this.stamp(gx, gy, '#00000055', 2); this.shake(0.35); this.sfx.slam();
        }
        if (move.pose === 'axekick' && !move.air) {
          // Tumit Axe Kick menghujam lantai kantor: gelombang kejut + kepulan debu di titik jatuh tumit!
          const gx = p.x + p.facing * 8.5, gy = p.y;
          p.squash = 0.84;
          this.particles.ring(gx, gy, 2, 13, '#ffd27f', 0.18, 1, true);
          this.particles.smoke(gx, gy, 5, '#929292', 28, 0.35);
          this.sfx.land();
          this.shake(0.22);
        }
        if ((move.jump || move.pose === 'cartwheelkick') && !move.air) {
          p.z = 0; p.squash = 0.77;
          this.particles.smoke(p.x, p.y, 6, '#8f8f8f', 30, 0.38);
          this.sfx.land();
          this.shake(0.16);
        }
      }
    } else if (p.attackPhase === 'recover') {
      if (p.kickBuf && (move.kick || p.attackT < move.recover * 0.72)) { p.kickBuf = false; this.startKick(false); return; }
      const recCancel = scy ? (move.finisher ? .5 : this.scythe.confirmed ? .88 : .6) : foot ? (move.finisher ? .50 : this.footwork.confirmed ? .91 : .58) : move.air ? 0.84 : (move.bat || p.weapon === 'fist' || p.weapon === 'boxing' || move.buster || move.kick) ? 0.80 : 0.68;
      if (p.buffered && p.attackT < move.recover * recCancel) {
        const b = p.buffered; p.buffered = null;
        if (foot) {
          const command = this.footwork.take(this.footwork.clock, 1.04 / Math.min(1, this.tempo));
          if (command) { this.startFootInput(command, true); return; }
        } else if (scy) {
          const command = this.scythe.take(this.scythe.clock, 1.04 / Math.min(1, this.tempo));
          if (command) { this.startScytheInput(command, true); return; }
        } else if (this._pfk) { const k2 = this._pfk; this._pfk = null; this.startAttack(k2); return; }
        else { this.startAttackInput(b); return; }
      }
      if (p.attackT <= 0) {
        p.attackPhase = 'none'; p.buffered = null; p.comboTimer = 0.9;
        if (move.finisher || p.moveKey === 'FOCUS' || p.moveKey === 'NH' || p.moveKey === 'NHL' || p.moveKey === 'LLH' || p.moveKey === 'KLLL') { p.comboStr = ''; p.katanaPlan = 0; }
        if (p.moveKey === 'NLLLL' && p.buffered === 'L') { /* allow the 5th hit: keep the chain alive one more input */ p.comboStr = 'NLLLL'; }
        if (move.katana) { p.sheatheT = 0.45; if (move.id === 'k_iaijutsu') { this.sfx.sheathe(); this.slow(0.25, 0.3); }
          if (this.v2 && move.id === 'k_sheatheflash') {
            // CLACK! bilah masuk sarung — sheen maksimal, ring putih, slow-mo sekejap
            this.katana.sheen = 0.35; this.particles.ring(p.x, p.y - 6, 5, 24, '#ffffff', 0.28, 1);
            this.sfx.sheathe(); this.slow(0.12, 0.25); this.shake(0.5);
          } }
      }
    }
  }

  /** World position of the striking limb for the current frame of the current move (from the real animated skeleton). */
  /** current blade segment in world space (hand -> tip) for a katana move */
  bladeSeg(move: Move, second = false): { base: Vec; tip: Vec } {
    const p = this.player;
    const sk = solvePose(this.playerStickOpts(move.pose, this.attackPoseT()));
    const hand = second ? { x: p.x + sk.bhand.x, y: p.y + sk.bhand.y - p.z } : { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
    const len = move.buster ? BUSTER_LEN : move.bat ? BAT_LEN : move.axe ? AXE_LEN : move.dual ? DUAL_LEN : scytheMove(move) ? SCY_LEN : this.katana.len;
    const ang = second ? p.bladeB : p.bladeA;
    const lift = move.slash?.lift ?? 0;
    return { base: hand, tip: { x: hand.x + Math.cos(ang) * len, y: hand.y + Math.sin(ang) * len * 0.6 - lift * 10 } };
  }
  strikePoint(move: Move): { pt: Vec; r: number; seg?: { base: Vec; tip: Vec }; seg2?: { base: Vec; tip: Vec } } | null {
    const p = this.player;
    if (move.limb === 'blade' || move.limb === 'blade2') {
      const b = this.bladeSeg(move);
      return { pt: { x: (b.base.x + b.tip.x * 2) / 3, y: (b.base.y + b.tip.y * 2) / 3 }, r: move.hitR, seg: b, seg2: move.limb === 'blade2' ? this.bladeSeg(move, true) : undefined };
    }
    if (move.limb === 'yoyo') {
      const pt = { ...this.yoyoV2.position };
      const orbit = move.id === 'y_orbit' || move.id === 'y_storm' || move.id === 'y_flare';
      return { pt, r: move.hitR, seg: orbit ? { base: { ...this.yoyoV2.hand }, tip: pt } : undefined };
    }
    if (move.limb === 'nunchaku') {
      const tip = this.nunchaku.tip();
      const mid = this.nunchaku.farMid();
      // hitbox covers the far stick: point between its middle and tip
      return { pt: { x: (tip.x + mid.x) / 2, y: (tip.y + mid.y) / 2 }, r: move.hitR + this.stats.meleeRange * 1.5 - 1.5 };
    }
    const sk = solvePose(this.playerStickOpts(move.pose, this.attackPoseT()));
    const lift = p.z;
    const at = (v: Vec): Vec => ({ x: p.x + v.x, y: p.y + v.y - lift });
    const foot = footMove(move);
    if (foot && (move.limb === 'ffoot' || move.limb === 'bfoot')) {
      const beat = foot.foot.beats?.[this.footwork.contactBeat];
      const leg = footLeg(beat?.leg ?? move.limb, this.footwork.attackLead);
      return { pt: at(sk[leg]), r: move.hitR };
    }
    if (move.id === 'chain') return { pt: at(p.chainSide < 0 ? sk.bhand : sk.fhand), r: move.hitR };
    switch (move.limb) {
      case 'fhand': return { pt: at(sk.fhand), r: move.hitR };
      case 'bhand': return { pt: at(sk.bhand), r: move.hitR };
      case 'ffoot': return { pt: at(sk.ffoot), r: move.hitR };
      case 'bfoot': return { pt: at(sk.bfoot), r: move.hitR };
      case 'both': { const a = at(sk.fhand), b = at(sk.bhand); return { pt: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, r: move.hitR + 1.5 }; }
      case 'sweep': return { pt: at(sk.ffoot), r: move.hitR + 1 };
      default: return { pt: { x: p.x, y: p.y - 6 }, r: move.hitR + 4 };
    }
  }

  /** distance from point c to segment ab */
  segDist(ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
    const dx = bx - ax, dy = by - ay;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((cx - ax) * dx + (cy - ay) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(cx - (ax + dx * t), cy - (ay + dy * t));
  }

  /**
   * Hit resolution that matches what you see: the limb (fist / foot / nunchaku stick) carrying the move is sampled
   * from the animated skeleton every frame; the segment it swept since the previous frame is tested against enemy
   * bodies. No more "hit from 20px away before the arm is extended".
   */
  isEnemyAirborne(e: Enemy): boolean {
    return this.level.sideView
      ? !e.svGrounded && !officeOnStairs(this.level, e.x, e.y, 4) && e.down <= 0
      : e.z > 2;
  }

  /** Cari musuh melayang terdekat di arah hadap pemain untuk ditarik magnet saat menyerang di udara. */
  findAirMagnetTarget(): Enemy | null {
    const p = this.player;
    const side = !!this.level.sideView;
    const faceDir = p.facing >= 0 ? 1 : -1;
    const lookX = Math.cos(p.aim);
    let best: Enemy | null = null;
    let bestScore = 1e9;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if (!this.isEnemyAirborne(e)) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      if (side) {
        const onFacingSide = dx * faceDir >= -14 || dx * lookX >= -14;
        if (!onFacingSide) continue;
        const hd = Math.abs(dx);
        const vd = Math.abs(dy);
        if (hd > 140 || vd > 95) continue;
        if (!lineOfSight(this.level, p.x, p.y - 6, e.x, e.y - 6)) continue;
        const score = hd + vd * 0.85;
        if (score < bestScore) { bestScore = score; best = e; }
      } else {
        const d = Math.hypot(dx, dy);
        if (d > 140) continue;
        const ang = Math.atan2(dy, dx);
        const ad = Math.abs(angleDiff(ang, p.aim));
        const faceDot = d > 1 ? (dx / d) * faceDir : 1;
        if (ad > 1.35 && (d > 38 || faceDot < -0.15)) continue;
        if (!lineOfSight(this.level, p.x, p.y, e.x, e.y)) continue;
        const score = d + ad * 22;
        if (score < bestScore) { bestScore = score; best = e; }
      }
    }
    return best;
  }

  /** Saat melompat + menyerang, tarik magnet mendekat ke musuh melayang di hadapan dulu baru eksekusi serangan. */
  launchAirAttack(key: string, preferred: number | null = null, nearbyOnly = false) {
    const p = this.player;
    if (p.airMagnet) return;
    const preferredTarget = preferred === null ? null : this.enemies.find((e) => e.id === preferred && !e.dead && e.spawnT <= 0 &&
      dist(p.x, p.y, e.x, e.y) <= 35 && lineOfSight(this.level, p.x, p.y, e.x, e.y));
    const target = preferredTarget ?? (nearbyOnly ? null : this.findAirMagnetTarget());
    if (!target) {
      this.startAttack(key);
      return;
    }
    const side = !!this.level.sideView;
    const move = MOVES[key];
    const gap = Math.max(9, Math.min(15, (move?.range || 20) * this.stats.meleeRange * 0.62));
    const d = side
      ? Math.hypot(target.x - p.x, target.y - p.y)
      : Math.hypot(target.x - p.x, target.y - p.y, target.z - p.z);
    if (d <= gap + target.r + 9) {
      p.airLockId = target.id;
      const a = Math.atan2(target.y - p.y, target.x - p.x);
      p.aim = side ? (target.x >= p.x ? 0 : Math.PI) : a;
      p.attackAim = p.aim;
      p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
      if (side) {
        moveSideView(this.level, p, 0, (target.y - p.y - (nearbyOnly ? 3 : 0)) * 0.6, true, this.props);
        p.svVy = preferredTarget && !this.isEnemyAirborne(target) ? 0 : -45;
      } else {
        p.z = lerp(p.z, Math.max(4, target.z), 0.75);
        p.vz = 45;
      }
      this.startAttack(key);
      return;
    }
    p.airMagnet = {
      sx: p.x, sy: p.y, sz: p.z,
      t: 0, dur: clamp(d / 950, 0.045, 0.11),
      id: target.id, key,
    };
    p.attackPhase = 'none'; p.buffered = null; p.dashT = 0;
    p.aim = side ? (target.x >= p.x ? 0 : Math.PI) : Math.atan2(target.y - p.y, target.x - p.x);
    p.attackAim = p.aim;
    p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
    this.sfx.dash();
    this.particles.ring(p.x, p.y - 6 - p.z, 2, 12, '#7ce7ff', 0.16, 1, true);
  }

  resolveMelee(move: Move) {
    const p = this.player;
    const foot = footMove(move);
    const scy = scytheMove(move);
    const beats = foot?.foot.beats;
    const beat = foot && beats ? footBeatAt(foot, footProgress(p.attackT, move.active)) : -1;
    if (beats && beat !== this.footwork.contactBeat) {
      this.footwork.contactBeat = beat;
      p.prevLimb = null;
    }
    if (beats && beat < 0) return;
    const strike = beats?.[beat];
    const attackLeg = foot && (move.limb === 'ffoot' || move.limb === 'bfoot') ? footLeg(strike?.leg ?? move.limb, this.footwork.attackLead) : move.limb;
    const contactMove: Move = strike ? {
      ...move, limb: attackLeg, dmg: move.dmg * (strike.power ?? 1), structure: move.structure * (strike.structure ?? 1),
      kb: move.kb * (strike.push ?? 1), hitstop: strike.stop ?? move.hitstop, shake: move.shake * (beat === 0 ? .55 : 1),
      // Foot Mode V2 (Hunting Hawk): hanya tendangan terakhir yang menjatuhkan & berbunyi berat.
      ...(foot?.foot.v2 && beats && beat < beats.length - 1 ? { knockdown: false, launch: 0, finisher: false, sfx: 'kick' as const, shake: move.shake * .5 } : {}),
    } : attackLeg === move.limb ? move : { ...move, limb: attackLeg };
    const sp = this.strikePoint(move);
    if (!sp) return;
    const cur = sp.pt;
    const prev = p.prevLimb ?? cur;
    p.prevLimb = cur;
    const prevBladeThisFrame = this.prevBlade;
    if (sp.seg) this.prevBlade = { base: { ...sp.seg.base }, tip: { ...sp.seg.tip } };
    // the strike only counts during the impact window of the animation (the snap + settle part)
    const pt = this.attackPoseT();
    const twinLegAcro = foot?.foot.both || move.pose === 'butterflyflip' || move.pose === 'cartwheelkick';
    const wide = twinLegAcro || move.pose === 'axekick' || move.limb === 'nunchaku' || move.limb === 'yoyo' || move.limb === 'blade' || move.kick || move.rehit || move.id === 'spinback' || move.id === 'sweep' || move.id === 'axekick' || move.id === 'dragontail' || move.id === 'monkeyflip';
    const spin360 = twinLegAcro || move.id === 'spinback' || move.id === 'dragontail' || move.id === 'sweep';
    const impactWindow = scy ? scytheContact(scy, scytheProgress(p.attackT, move.active)) : foot ? footContact(foot, footProgress(p.attackT, move.active)) : move.air ? pt >= 0.14 && pt <= 0.85 : move.id === 'chain' ? pt >= 0.08 && pt <= 0.6 : move.id === 'ragekill' ? pt >= 0.2 : spin360 ? pt >= 0.22 && pt <= 0.82 : wide ? pt >= 0.28 && pt <= 0.74 : pt >= 0.33 && pt <= 0.62;
    if (!impactWindow && (foot || !move.travel)) return;
    let footSweep: { from: { front: Vec; back: Vec }; to: { front: Vec; back: Vec } } | null = null;
    if (twinLegAcro || (move.yoyo && (move.pose === 'y2_windmill' || move.pose === 'y2_spin' || move.pose === 'y2_freeze' || move.pose === 'y2_airflip'))) {
      const sk = solvePose(this.playerStickOpts(move.pose, pt));
      const feet = { front: { x: p.x + sk.ffoot.x, y: p.y + sk.ffoot.y - p.z }, back: { x: p.x + sk.bfoot.x, y: p.y + sk.bfoot.y - p.z } };
      footSweep = { from: this.yoyoFeet ?? feet, to: feet };
      this.yoyoFeet = feet;
    }
    // very short moves (elbow / knee / uppercut) also count a tight body-contact zone in front of the chest,
    // because the striking joint stays close to the torso by design
    // travelling strikes (flying kicks, running straight, dive kick) carry the whole body: a contact zone just ahead
    // of the chest counts too, since the character is physically crashing into the target
    const contact = move.id === 'elbow' || move.id === 'knee' || move.id === 'dragon' ? { x: p.x + Math.cos(p.aim) * 7, y: p.y - 5 - p.z + Math.sin(p.aim) * 4, r: 6 }
      : (!foot && move.travel) || move.id === 'k_thrust' ? { x: p.x + Math.cos(p.aim) * 9, y: p.y - 5 - p.z * 0.5 + Math.sin(p.aim) * 5, r: 7 } : null;
    const reach = move.range * this.stats.meleeRange + 6; // sanity cap from the body (prevents long-chain exploits)
    const now = this.time;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if (foot && !lineOfSight(this.level, p.x, p.y, e.x, e.y)) continue;
      if (beats ? !this.footwork.canContact(e.id, beat) : !move.rehit && p.hitSet.includes(e.id)) continue;
      if (move.rehit && now - (p.hitTimes[e.id] ?? -9) < move.rehit) continue;
      const eAir = this.isEnemyAirborne(e);
      const lockedAir = p.airborne && p.airLockId === e.id;
      const ex = e.x, ey = e.y - 5 - e.z; // body centre (chest height)
      const bodyR = e.r + (lockedAir ? 9 : eAir || p.airborne ? 5 : 1.0);
      // body-shaped target: a continuous vertical capsule from the feet to the top of the head
      const top = e.y - 13 * e.scale - e.z - (lockedAir ? 8 : eAir ? 4 : 0), bottom = e.y + 1 - e.z + (lockedAir ? 10 : eAir ? 6 : 0);
      let dmin = 1e9;
      for (let k = 0; k <= 4; k++) { const yy = top + ((bottom - top) * k) / 4; dmin = Math.min(dmin, this.segDist(prev.x, prev.y, cur.x, cur.y, e.x, yy)); }
      let near = dmin <= sp.r + bodyR;
      let impactAt = cur;
      if (!near && !foot && lockedAir && dist(p.x, p.y, e.x, e.y) <= reach + e.r + 12) {
        near = true;
        impactAt = { x: e.x, y: e.y - 5 - e.z };
      }
      if (!near && sp.seg && (this.prevBlade || sp.seg)) {
        const oldBlade = prevBladeThisFrame ?? sp.seg;
        // the blade swept the area between its previous and current segment: sample a few blade points along both
        for (let k = 0; k <= 4 && !near; k++) {
          const f = k / 4;
          const ax = oldBlade.base.x + (oldBlade.tip.x - oldBlade.base.x) * f, ay = oldBlade.base.y + (oldBlade.tip.y - oldBlade.base.y) * f;
          const bx = sp.seg.base.x + (sp.seg.tip.x - sp.seg.base.x) * f, by = sp.seg.base.y + (sp.seg.tip.y - sp.seg.base.y) * f;
          for (let q = 0; q <= 4; q++) { const yy = top + ((bottom - top) * q) / 4; if (this.segDist(ax, ay, bx, by, e.x, yy) <= sp.r + bodyR) { near = true; break; } }
        }
        // also the blade itself as a segment this frame
        if (!near) for (let q = 0; q <= 4; q++) { const yy = top + ((bottom - top) * q) / 4; if (this.segDist(sp.seg.base.x, sp.seg.base.y, sp.seg.tip.x, sp.seg.tip.y, e.x, yy) <= sp.r + bodyR) { near = true; break; } }
      }
      if (!near && sp.seg2) for (let q = 0; q <= 4; q++) { const yy = top + ((bottom - top) * q) / 4; if (this.segDist(sp.seg2.base.x, sp.seg2.base.y, sp.seg2.tip.x, sp.seg2.tip.y, e.x, yy) <= sp.r + bodyR) { near = true; break; } }
      if (!near && footSweep) {
        const sweepPad = twinLegAcro ? sp.r * 0.85 : 3;
        for (const limb of ['front', 'back'] as const) {
          for (let q = 0; q <= 4; q++) {
            const yy = top + ((bottom - top) * q) / 4;
            if (this.segDist(footSweep.from[limb].x, footSweep.from[limb].y, footSweep.to[limb].x, footSweep.to[limb].y, e.x, yy) <= bodyR + sweepPad) {
              near = true; impactAt = footSweep.to[limb]; break;
            }
          }
          if (near) break;
        }
      }
      if (!near && contact && dist(contact.x, contact.y, ex, ey) <= contact.r + bodyR) near = true;
      if (!near) continue;
      if (move.pose === 'axekick' && !move.air) {
        // Fokuskan titik kontak Axe Kick tepat di area kepala & bahu lawan
        impactAt = { x: e.x, y: clamp(cur.y, e.y - 12.2 * e.scale - e.z, e.y - 8.2 * e.scale - e.z) };
      }
      if (dist(p.x, p.y, e.x, e.y) > reach + e.r + (lockedAir ? 14 : eAir || p.airborne ? 10 : 0) + (move.limb === 'nunchaku' ? 10 : move.limb === 'blade' ? 8 : 0)) continue;
      const a = Math.atan2(e.y - p.y, e.x - p.x);
      if (foot && !this.level.sideView && Math.abs(angleDiff(a, p.aim)) > move.arc && dist(p.x, p.y, e.x, e.y) > 8) continue;
      if (beats) this.footwork.spendContact(e.id, beat);
      if ((!move.yoyo && !beats) || !p.hitSet.includes(e.id)) p.hitSet.push(e.id);
      p.hitTimes[e.id] = now;
      this.meleeHitEnemy(e, contactMove, a, impactAt);
      if ((foot || scy) && move.travel) p.travelHit = true;
      if (foot && p.attackPhase !== 'active') break;
    }
    for (const pr of this.props) {
      if (pr.dead) continue;
      const key = -1000 - this.props.indexOf(pr);
      if (p.hitSet.includes(key)) continue;
      if (this.segDist(prev.x, prev.y, cur.x, cur.y, pr.x, pr.y - 4) > sp.r + pr.r) continue;
      p.hitSet.push(key);
      this.damageProp(pr, move.dmg, Math.atan2(pr.y - p.y, pr.x - p.x));
      this.hitstop = Math.max(this.hitstop, 0.02);
    }
    for (const b of this.bullets) {
      if (b.owner !== 'enemy' || b.kind === 'bomb') continue;
      if (this.segDist(prev.x, prev.y, cur.x, cur.y, b.x, b.y) > sp.r + 3) continue;
      this.deflectBullet(b, p.aim);
    }
  }

  /** StickOpts for the player as drawn this frame (shared by the renderer and the hit tester) */
  playerStickOpts(pose: Pose, t: number): import('./stick').StickOpts {
    const p = this.player;
    const side = !!this.level.sideView;
    const runBlend = p.gaitRun;
    const legMoving = p.moving || (!p.airborne && (side ? Math.abs(p.vx) > 12 : Math.hypot(p.vx, p.vy) > 16));
    const moving = legMoving && (pose === 'idle' || pose === 'run' || pose === 'bow' || pose === 'shoot' || pose === 'carry_pot' || pose === 'carry_comp' || pose === 'n_idle' || pose === 'y2_idle' || pose === 'k_idle' || pose === 'a_idle' || pose === 'd_idle' || pose === 'bx_float' || pose === 'bx_weave' || pose === 'bx_press');
    const gunSpin = (p.weapon === 'pistol' || p.weapon === 'rifle') && this.guns.twirlT > 0
      ? (1 - this.guns.twirlT / this.guns.TWIRL_DUR) * Math.PI * 4 * p.facing
      : p.weapon === 'pistol' ? this.pis.gunSpinAngle(this) : 0;
    const so: import('./stick').StickOpts = {
      x: p.x, y: p.y, c: PLAYER_COLOR, c2: p.weapon === 'scythe' ? SCYTHE_COLOR.grim : p.weapon === 'foot' ? FOOT_VERSION_COLOR[this.footVer] : PLAYER_BAND, scale: 1, facing: p.facing, aim: pose === 'run' || pose === 'idle' || pose === 'n_idle' || pose === 'bx_float' || pose === 'bx_weave' || pose === 'bx_press' ? p.bodyAim : p.aim, look: p.aim, walk: p.walk, moving,
      pose, t, acc: 'headband', weapon: p.weapon === 'pistol' || p.weapon === 'rifle' ? p.weapon : 'none', flash: p.flash > 0, alpha: 1, outline: '#000000', eyes: '#111111', time: this.time, lean: side ? { x: p.lean.x, y: 0 } : p.lean,
      z: p.z, recoil: p.recoil, run: runBlend, squash: p.squash, vel: side ? { x: p.vx + p.kx * 0.3, y: 0 } : this.moveDirOf(p.vx + p.kx * 0.3, p.vy + p.ky * 0.3), stride: p.strideHalf, chainSide: p.chainSide,
      anime: this.v2, brake: p.locoBrake, sideView: side,
      locoMix: this.locoMixV, turn: p.attackPhase === 'none' && !p.fatality ? this.turnV : 0, band: { x: this.bandS.x, y: this.bandS.y },
      surge: p.locoSurge, gunSpin, bowDraw: p.weapon === 'bow' ? this.bow.drawVis : 0, bowNock: p.weapon === 'bow' ? this.bow.nockVis : 0,
      anticip: p.locoAnticip, pivot: p.pivotT > 0 ? clamp(p.pivotT / 0.2, 0, 1) : 0, pivotDir: p.pivotDir,
      limbScale: this.longMode ? 2.5 : 1,
      dancePhase: p.weapon === 'yoyo' && this.yoyoVer === 2 ? this.yoyoV2.spin : undefined,
      ysub: this.yoyo.sub, ysign: this.yoyo.sign,
      mood: p.hp <= 0 || this.state === 'dead' ? 'dead' : (p.faceT > 0 || p.stunT > 0) ? 'hurt' : (p.rageOn || p.ofaActive || p.attackPhase === 'active' || p.parryT > 0 || (p.hp <= 1 && this.state === 'playing')) ? 'angry' : 'normal',
      box: p.weapon === 'boxing' ? { stance: this.box.stance, weaveX: this.box.weaveX, weaveY: this.box.weaveY, step: this.box.step, clock: this.box.clock } : (p.weapon === 'fist' && this.ippoGuardT > 0 ? { stance: 'ippo' as const, weaveX: Math.sin(this.time * 3.4) * 1.5, weaveY: Math.abs(Math.sin(this.time * 3.4)) * 0.5, step: (this.time * 4.4) % 1, clock: this.time } : undefined),
      tka: p.weapon === 'hayabusa' ? this.hay.bladeA : this.tak.bladeA, tkp: p.weapon === 'hayabusa' ? this.hay.ext : (this.tak.mode === 'charge' ? this.tak.chargeLevel : this.tak.ext), tkh: p.weapon === 'hayabusa' ? this.hay.hop : this.tak.hop,
    };
    if (p.weapon === 'foot' && isFootPose(pose) && pose !== 'foot_guard' && pose !== 'foot_v2_guard' && this.footwork.linkFrom && t < .24) {
      so.footLink = { ...this.footwork.linkFrom, weight: clamp(t / .24, 0, 1) };
    }
    if (p.weapon === 'foot') {
      const stance = pose === 'foot_flamingo' || pose === 'foot_flamingo_switch';
      if (stance || pose.startsWith('foot_switch_')) {
        so.footLead = stance ? this.footwork.lead : this.footwork.attackLead;
        so.footSwitch = pose === 'foot_flamingo_switch';
        so.c2 = footStanceColor(so.footLead);
      }
    }
    // DRUNKEN MASTER (Gerbang 6): gaya bertarung Fist Mode menjadi Drunken Master (Zui Quan); saat menyerang dikurangi sedikit agar hitbox akurat
    so.drunk = this.gates.drunkK * (p.attackPhase === 'active' ? 0.38 : 1);
    // POSTUR PETARUNG: pinggang, badan, dan kepala yang anatomis & rapi untuk Fist Mode, Nunchaku, Boxing, dan Baseball Bat
    so.posture = p.weapon === 'fist' || p.weapon === 'nunchaku' || p.weapon === 'boxing' || p.weapon === 'bat' ? 1 : 0;
    // takamura locks body + facing to the cut direction while an iai move is running
    if (p.weapon === 'takamura' && this.tak.lockAim !== null) { so.aim = this.tak.lockAim; so.look = this.tak.lockAim; so.facing = Math.cos(this.tak.lockAim) >= 0 ? 1 : -1; }
    if (p.weapon === 'hayabusa' && this.hay.lockAim !== null) { so.aim = this.hay.lockAim; so.look = this.hay.lockAim; so.facing = Math.cos(this.hay.lockAim) >= 0 ? 1 : -1; }
    return so;
  }

  deflectBullet(b: Bullet, dir: number) {
    const sp = Math.hypot(b.vx, b.vy) * 1.5 + 80;
    b.owner = 'player'; b.vx = Math.cos(dir) * sp; b.vy = Math.sin(dir) * sp; b.dmg = Math.max(4, b.dmg * 3); b.color = this.pal.accent; b.kind = 'deflect'; b.life = 1.5; b.hitIds = []; b.pierce = 1; b.kb = 200;
    this.sfx.parry();
    this.particles.spark(b.x, b.y, 6, '#ffffff', dir, 0.6, 200);
    this.particles.impact(b.x, b.y, 5, '#9be7ff');
    this.texts.add(b.x, b.y - 10, 'DEFLECT!', '#35f0ff', 1, 0.5);
    this.hitstop = Math.max(this.hitstop, 0.04);
    this.player.focus = Math.min(300, this.player.focus + 15 * this.stats.focusGain);
    this.addCombo();
  }

  // ---------------- EFEK HIT V1 (mode kantor) ----------------
  setOfficeAtmo(m: 'auto' | AtmoId) { this.officeLook.setMode(m); }
  setHitFx(st: 'v1' | 'v2') { this.hitFxStyle = st; try { localStorage.setItem(HITFX_KEY_V2, st); } catch { /* */ } }
  setGlow(on: boolean) { this.glowOn = on; try { localStorage.setItem(GLOW_KEY_V2, on ? 'on' : 'off'); } catch { /* */ } if (!on) this.glowFx.clear(); }
  private officeFxOn() { return !!this.level.sideView && ((this.hitFxStyle === 'v1' && !!this.v1hit) || this.glowOn); }
  private muted<T extends object>(o: T): T {
    let m = this.muteCache.get(o) as T | undefined;
    if (!m) { m = new Proxy(o, { get: (t, k) => { const v = (t as Record<string | symbol, unknown>)[k]; return typeof v === 'function' ? () => undefined : v; } }) as T; this.muteCache.set(o, m); }
    return m;
  }
  /** logika hit asli V2 + (bila EFEK HIT V1) partikel V1 menggantikan partikel V2 + (bila GLOW) cahaya V1 */
  private withV1Fx<R>(e: Enemy, ang: number, dmg: number, kb: number, heavyHint: boolean, at: Vec | undefined, fn: () => R): R {
    if (this.fxMuteN > 0) return fn();
    const v1fx = this.hitFxStyle === 'v1' && !!this.v1hit;
    const hp0 = e.hp, dead0 = e.dead, st0 = e.structure;
    const pa = this.particles, bl = this.blood;
    this.fxMuteN++;
    if (v1fx) { (this as { particles: unknown }).particles = this.muted(pa); (this as { blood: unknown }).blood = this.muted(bl); }
    let r: R;
    try { r = fn(); } finally { if (v1fx) { (this as { particles: unknown }).particles = pa; (this as { blood: unknown }).blood = bl; } this.fxMuteN--; }
    if (e.hp < hp0 || e.dead !== dead0 || e.structure !== st0) {
      const dir = Math.cos(ang) >= 0 ? 1 : -1, sc = e.scale || 1, feet = e.y - (e.z || 0);
      const pt = at ? { x: at.x, y: at.y } : { x: e.x - dir * 3 * sc, y: feet - 9 * sc };
      const kill = e.dead && !dead0, heavy = heavyHint || dmg >= 5 || kb >= 300 || kill;
      if (v1fx) this.v1hit!.hit(e.x, feet, sc, pt, dir, { heavy, blood: 2 + dmg * 1.2, power: 110 + kb * 0.3, kill });
      if (this.glowOn) {
        // V1 hitFx: pendar di sisi BELAKANG tubuh untuk pukulan keras (putih) & KO (merah)
        const top = feet - 15 * sc, by = Math.max(top + 2, Math.min(feet - 3, pt.y)), bx = e.x + dir * (4.5 * sc + 1);
        if (heavy) this.glowFx.add(bx, by, kill ? 44 : 30, kill ? '#ff5a5a' : '#ffffff', 0.09);
      }
    }
    return r;
  }
  /** GLOW V1 di resolusi layar penuh: dunia sudah diperbesar, HUD belum digambar */
  private glowPass(dst: CanvasRenderingContext2D, bw: number, bh: number) {
    const X = this.glowXf;
    if (!X || !this.level.sideView || !this.glowOn) return;
    const kx = bw / X.sw, ky = bh / X.sh;
    dst.save();
    dst.setTransform(kx, 0, 0, ky, X.ox * kx, X.oy * ky);
    this.drawGlow(dst, Math.max(1, Math.min(4, Math.round(kx))));
    dst.restore();
  }
  private drawGlow(g: CanvasRenderingContext2D, q: number) {
    const p = this.player, py = p.y - p.z, G = this.glowFx;
    g.globalCompositeOperation = 'lighter';
    g.imageSmoothingEnabled = true;
    G.drawLights(g, q);
    // MODE N: pendar biru besar Pembukaan 8 Gerbang (makin tinggi gerbang makin terang)
    if (this.gates.on || this.gates.lotus) G.glow(g, p.x, py - 9, 34 + this.gates.gates * 5, this.gates.glowColor(), 0.16 + 0.03 * this.gates.gates + Math.sin(this.time * 9) * 0.03, q);
    // MODE X: pendar cyan One For All yang bergetar
    if (p.ofaActive) G.glow(g, p.x, py - 9, 34, '#57e6ff', 0.22 + Math.sin(this.time * 20) * 0.05, q);
    if (this.fireOn && this.sfNun.pts.length === 6) { const tp = this.sfNun.pts[5]; G.glow(g, tp.x, tp.y, 20 + Math.min(18, this.sfNun.endSpeed / 30), '#ff8a3d', 0.2, q); }
    for (const bm of this.bu.beams) G.glow(g, bm.x, bm.y, 36, '#7dffc8', 0.3, q);
    for (const b of this.bullets) if (b.kind === 'bomb' && b.life < 0.45 && Math.floor(this.time * 16) % 2) G.glow(g, b.x, b.y - (b.z ?? 0), 18, '#ff3b3b', 0.3, q);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  }
  meleeHitEnemy(e: Enemy, move: Move, a: number, at?: Vec) {
    if (footMove(move) || !this.officeFxOn()) return this.meleeHitEnemyV2(e, move, a, at);
    return this.withV1Fx(e, a, move.dmg, move.kb, !!move.finisher || !!move.knockdown, at, () => this.meleeHitEnemyV2(e, move, a, at));
  }
  meleeHitEnemyV2(e: Enemy, move: Move, a: number, at?: Vec) {
    const p = this.player;
    const foot = footMove(move);
    const scy = scytheMove(move);
    const heavy = foot ? !!move.finisher || move.structure >= 28 : scy ? !!move.finisher || move.structure >= 26 : !['jab', 'cross', 'hook', 'n_lash', 'n_cross', 'n_figure8', 'n_helicopter', 'y_free', 'y_ret'].includes(move.id);
    // impact FX exactly at the limb contact point (clamped onto the body surface)
    let hx = e.x - Math.cos(a) * e.r, hy = e.y - e.z - 6 - Math.sin(a) * e.r;
    if (at) { const ddx = at.x - e.x, ddy = at.y - (e.y - e.z - 5); const dl = Math.hypot(ddx, ddy) || 1; const cl = Math.min(dl, e.r + 1); hx = e.x + (ddx / dl) * cl; hy = e.y - e.z - 5 + (ddy / dl) * cl; }
    if (e.kind === 'shield' && e.stagger <= 0 && e.down <= 0 && e.z <= 0 && !heavy && Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.aim)) < 1.3) {
      this.particles.spark(hx, hy, 8, '#ffffff', a + Math.PI, 0.8, 180);
      this.particles.impact(hx, hy, 4, '#cccccc');
      this.sfx.hit();
      e.structure += move.structure * 0.6 * this.stats.structureDmg;
      e.flash = 0.05;
      this.texts.hit(e.x, e.y - 20, 'BLOCKED', '#cccccc', 1, 0.4);
      this.hitstop = Math.max(this.hitstop, 0.03);
      p.kx -= Math.cos(a) * 70; p.ky -= Math.sin(a) * 70;
      if (e.structure >= e.maxStructure) this.staggerEnemy(e);
      return;
    }
    if (e.canParry && e.parryCd <= 0 && e.stagger <= 0 && e.down <= 0 && e.stun <= 0 && e.z <= 0 && (e.state === 'chase' || e.state === 'recover') && Math.random() < (e.boss ? 0.4 : e.kind === 'fighter' ? 0.38 : 0.28)) {
      e.parryCd = 2.5;
      this.sfx.parry();
      this.particles.ring(e.x, e.y - 6, 3, 14, '#ffd700', 0.2, 1);
      this.particles.spark(hx, hy, 8, '#ffd700', a + Math.PI, 1, 200);
      this.texts.add(e.x, e.y - 22, 'PARRIED!', '#ffd700', 1, 0.6);
      p.stunT = 0.32; p.kx -= Math.cos(a) * 170; p.ky -= Math.sin(a) * 170;
      p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.z = 0;
      if (foot) this.footwork.interrupt();
      this.hitstop = Math.max(this.hitstop, 0.08); this.shake(0.3);
      e.state = 'windup'; e.stateT = 0.14; e.pose = 'windup'; e.poseT = 0; e.poseDur = 0.14; e.hitDone = false; e.burst = 0;
      return;
    }
    if (move.id === 'k_iaijutsu' && !e.boss && e.doom <= 0) {
      // the cut is already fatal: freeze them until the sheathe, then they fall (classic iai)
      e.doom = 0.55 + 0.08 * p.iaiVictims.length; e.state = 'doom'; e.kx = e.ky = 0; e.flash = 0.1; e.token = false;
      p.iaiVictims.push(e.id);
      this.particles.lines(hx, hy, 3, '#ffffff', p.aim + Math.PI / 2, 80); this.particles.lines(hx, hy, 3, '#ffffff', p.aim - Math.PI / 2, 80);
      this.particles.impact(hx, hy, 5, '#bfe8ff');
      this.sfx.slash(1.3);
      this.addCombo();
      return;
    }
    let dmg = move.dmg * (this.boxOn ? this.boxDef.power : 1) * this.stats.meleeDmg * this.ageDmg() * (1 + Math.min(0.6, this.combo * this.stats.berserk)) * (1 + 0.5 * p.styleHeat);
    if (e.stagger > 0) dmg *= 2; else if (e.down > 0) dmg *= 1.5;
    const eAir = this.isEnemyAirborne(e);
    if (eAir) dmg *= 1.25; // juggle bonus
    const kb = move.kb * 0.45 * this.stats.knockback * (heavy ? 1 : 0.6);
    const wasAlive = !e.dead;
    const launch = move.launch ? move.launch * 0.6 * (1 - e.kbRes * 0.6) : 0;
    // SMOOTH FIST: makin panjang rantai kombo, makin tipis hitstop-nya — pukulan awal tetap
    // menghentak, tapi rantai panjang mengalir tanpa tersendat-sendat berhenti.
    const fistHs = foot ? move.hitstop * (move.finisher || foot.foot.beats ? 1 : this.footwork.hits > 1 ? .69 : .85) : (p.weapon === 'fist' || p.weapon === 'boxing')
      ? move.hitstop * (this.combo >= 6 ? 0.5 : this.combo >= 3 ? 0.72 : 1)
      : move.hitstop;
    this.damageEnemy(e, dmg, move.structure * this.stats.structureDmg, a, kb, { knockdown: move.knockdown, hitstop: fistHs, shake: foot && this.footMotion.matches ? move.shake * .28 : move.shake, melee: true, launch, zone: zoneFromMove(move, e, at) });
    if (scy) {
      this.scythe.recordImpact({ x: at?.x ?? hx, y: at?.y ?? hy, at: this.time, direction: a }, scy);
      const school = SCYTHE_COLOR[scy.scythe.school];
      this.particles.spark(hx, hy, move.finisher ? 6 : 3, school, a, .9, 175);
      this.particles.ring(hx, hy, 1, move.finisher ? 12 : 7, school, .13, 1, true);
      // jiwa yang terpetik: partikel ungu naik dari titik potong
      for (let i = 0; i < (move.finisher ? 7 : 3); i++) {
        this.particles.add({ x: hx + rnd(-3, 3), y: hy + rnd(-2, 2), vx: rnd(-24, 24), vy: -rnd(60, 130), life: rnd(.35, .7), c: school, k: 0, s: 1, g: -60, fr: 1 });
      }
      if ((move.finisher || move.id === 'scy_spin' || move.id === 'scy_soul') && !this.scytheMotion.matches) {
        this.slow(move.finisher ? .105 : .065, .5);
        this.zoomKick = Math.max(this.zoomKick, move.finisher ? .05 : .03);
        this.camKick.x += Math.cos(a) * 2.3;
        this.camKick.y += Math.sin(a) * 2.3 - .9;
      }
    } else if (!foot && (p.weapon === 'fist' || p.weapon === 'boxing') && ['headbutt', 'hstraight', 'tkd', 'flying', 'runpunch'].includes(move.id) && !e.boss) {
      // TERPENTAL LURUS HORIZONTAL: tanpa lontaran ke atas, meluncur sejajar lantai
      const side = !!this.level.sideView;
      const hd = side ? (e.x >= p.x ? 0 : Math.PI) : a;
      const K = move.id === 'tkd' ? 620 : move.id === 'hstraight' ? 600 : 540;
      const kr = 1 - e.kbRes * 0.5;
      e.kx = Math.cos(hd) * K * kr; e.ky = side ? 0 : Math.sin(hd) * K * kr;
      if (side) e.svVy = Math.min(e.svVy ?? 0, -40); else e.vz = Math.min(e.vz, 25);
      e.dkFly = { t: .6, dir: hd, hit: [e.id], gen: 0 };
      this.particles.lines(hx, hy, 4, 'rgba(255,255,255,0.8)', hd + Math.PI, 160);
      if (move.id === 'headbutt' || move.id === 'hstraight') { this.slow(.1, .4); this.particles.shockwave(hx, hy, 16, '#ffffff', .2); }
    } else if (foot) {
      if ((move.id === 'foot_rdk' || move.id === 'foot_rjk') && !e.boss) {
        e.dkFly = { t: .7, dir: a, hit: [e.id], gen: 0 };
        this.say(move.id === 'foot_rdk' ? 'RUNNING DROPKICK!' : 'RUNNING JUMP KICK!', '#7dffb8', 2, .6);
      }
      this.footwork.recordImpact({ x: at?.x ?? hx, y: at?.y ?? hy, originY: p.y, originZ: p.z, at: this.time, direction: a }, foot);
      if (this.training) this.onFootPractice?.(this.footwork.activeKey, this.footwork.hits, this.footwork.contactBeat);
      if (this.footNeon(foot)) {
        const school = FOOT_SCHOOLS[foot.foot.school];
        this.particles.spark(hx, hy, move.finisher ? 5 : 3, school.color, a, .85, 165);
        this.particles.ring(hx, hy, 1, move.finisher ? 11 : 7, school.light, .12, 1, true);
        if (this.level.sideView && this.glowOn) this.glowFx.add(hx, hy, move.finisher ? 44 : 26, school.color, move.finisher ? .16 : .09);
        // Hunting Hawk: dua tendangan pertama menahan lawan di tempat supaya tendangan ketiga pasti masuk.
        if (foot.foot.beats && !move.finisher && !e.armor && !e.dead && !e.boss) {
          e.stun = Math.max(.2, e.stun);
          if (e.state !== 'down' && e.state !== 'stagger' && !eAir) e.state = 'stun';
        }
        if ((move.finisher || move.id === 'foot_v2_540' || move.id === 'foot_v2_flying') && !this.footMotion.matches) {
          this.slow(move.finisher ? .11 : .07, .5);
          this.zoomKick = Math.max(this.zoomKick, move.finisher ? .045 : .028);
          this.camKick.x += Math.cos(a) * 2.2;
          this.camKick.y += Math.sin(a) * 2.2 - .8;
        }
        if (move.finisher && this.training) this.practiceFootLandAt = this.time + .34;
      }
      if (foot.foot.school === 'flamingo') {
        if (this.footwork.contactBeat === 1 && !e.armor && !e.dead && !e.boss && !eAir) {
          e.stun = Math.max(.14, e.stun);
          if (e.state !== 'down' && e.state !== 'stagger') e.state = 'stun';
        }
        if (move.finisher) {
          if (this.training) this.practiceFootLandAt = this.time + .34;
          this.say(move.name, FOOT_SCHOOLS.flamingo.light, 2, .64);
          if (!this.footMotion.matches) {
            this.slow(.105, .55);
            this.camKick.x += Math.cos(a) * 1.9;
            this.camKick.y += Math.sin(a) * 1.9 - .7;
          }
        }
      }
      if (foot.foot.launcher && !e.dead && !e.armor) {
        this.footwork.markLauncher(e.id, this.time);
        if (this.isEnemyAirborne(e)) {
          // Foot Mode V2 (Flamingo Sky Lift): lontaran lebih tinggi supaya kombo udara sempat disusul.
          if (this.level.sideView) e.svVy = Math.min(e.svVy ?? 0, foot.foot.v2 ? -238 : -151);
          else e.vz = Math.max(e.vz, foot.foot.v2 ? 218 : 146);
        }
      }
      if (move.finisher) {
        this.particles.ring(hx, hy, 2, 13, FOOT_SCHOOLS[foot.foot.school].color, .16, 1, true);
        if (!this.footMotion.matches) this.zoomKick = Math.max(this.zoomKick, .025);
      }
    }
    this.particles.spark(hx, hy, 2 + (heavy ? 2 : 0), '#ffffff', a, 0.7, 170 + kb * 0.15);
    const bx = hx + Math.cos(a) * 2.5, by = hy + Math.sin(a) * 1.5;
    this.particles.blood(bx, by, 2 + Math.floor(dmg * 0.45), a, 95 + kb * 0.25);
    this.blood.spray(bx, by, a, dmg * 0.65, heavy);
    if (heavy) this.stamp(e.x + rnd(-3, 3), e.y + rnd(-1, 2), '#8a0000', 1);
    this.particles.impact(hx, hy, heavy ? 4.5 : 3, '#ffffff');
    // FIST MODE: efek kontak secukupnya supaya karakter & bagian tubuh yang kena tetap jelas terlihat
    if (p.weapon === 'fist' || p.weapon === 'boxing' || this.boxOn || this.footNeon(foot)) {
      const pw = heavy ? 1 : 0.6;
      const rays = heavy ? 4 : 2;
      for (let i = 0; i < rays; i++) {
        const ang = a + (i / Math.max(1, rays - 1) - 0.5) * 1.1 + rnd(-0.1, 0.1);
        this.particles.lines(hx, hy, 1, i % 2 ? '#ffffff' : this.pal.accent2, ang, (130 + rnd(0, 80)) * pw);
      }
      if (heavy) this.particles.ring(hx, hy, 1, 7 + 4 * pw, '#ffffff', 0.12, 1, true);
      this.hitstop = Math.max(this.hitstop, heavy ? 0.045 : 0.022);
      this.camKick.x += Math.cos(a) * (heavy ? 2.4 : 1.2);
      this.camKick.y += Math.sin(a) * (heavy ? 2.4 : 1.2);
    }
    if (!foot && move.showName && move.finisher && p.hitSet.length === 1 && this.nameCd <= 0) { this.nameCd = 0.9; this.say(move.name, this.pal.accent2, 2, 0.75); }
    if (!foot && eAir && wasAlive) this.say('JUGGLE!', '#ffe66d', 1, 0.5);
    if (p.airborne && !move.travel && !e.dead && move.id !== 'foot_air_comet' && !foot?.foot.spike) {
      if (this.level.sideView) p.svVy = Math.min(p.svVy ?? 0, -90);
      else p.vz = Math.max(p.vz, 80);
    }
    if ((move.id === 'air_slam' || move.id === 'air_spike' || move.id === 'foot_air_comet' || foot?.foot.spike || scy?.scythe.spike) && !e.dead) {
      if (this.level.sideView) { e.svVy = 290; e.svGrounded = false; e.state = 'air'; e.pose = 'launched'; }
      else { e.vz = -290; }
      this.particles.ring(hx, hy, 2, 12, '#ffd27f', 0.18, 1, true);
      this.say(scy || foot ? move.name : move.id === 'air_spike' ? 'METEOR SPIKE!' : 'AIR SLAM!', scy ? SCYTHE_COLOR.soul : '#ff9d4a', 2, 0.7);
    } else if (move.pose === 'axekick' && !move.air) {
      // Hentakan Tendangan Kapak lurus ke bawah di kepala/bahu: pipihkan tubuh korban ke lantai + gelombang kejut!
      e.sqx = 1.35; e.sqy = 0.7;
      if (this.level.sideView && !e.svGrounded && !e.dead) e.svVy = Math.max(e.svVy ?? 0, 260);
      this.particles.lines(e.x, e.y - 11 * e.scale - e.z, 4, '#ffd27f', Math.PI / 2, 195);
      this.particles.ring(e.x, e.y - 9.5 * e.scale - e.z, 2, 13, '#ffd27f', 0.18, 1, true);
      this.particles.shockwave(e.x, e.y, 14, '#ffffff', 0.2);
      this.camKick.y += 3.4;
      this.sfx.slam();
    } else if (move.pose === 'butterflyflip') {
      // Liu Kang Butterfly Flip: kilatan naga emas-merah + cincin sabit berenergi
      this.particles.ring(hx, hy, 2, 13, '#ff9d3b', 0.17, 1, true);
      this.particles.spark(hx, hy, 5, '#ffe08a', a, 0.85, 175);
      if (this.level.sideView && this.glowOn) this.glowFx.add(hx, hy, 42, '#ff8c32', 0.14);
    } else if (move.pose === 'cartwheelkick') {
      // Cartwheel Kick (Tendangan Roda): cincin putaran emas & percikan kinetik
      this.particles.ring(hx, hy, 2, 11, '#ffe680', 0.16, 1, true);
      this.particles.spark(hx, hy, 4, '#fff2b2', a - 0.35, 0.9, 155);
    }
    // FOOT MODE V2: suara hit persis jalur Fist Mode (hit + punch / kick / heavy).
    const fistSound = (!foot || this.footNeon(foot)) && !scy;
    if (fistSound) this.sfx.hit();
    // V3: pamungkas V1 ikut mendapat dentum berat Fist Mode.
    if ((foot && fistSound && !foot.foot.v2 || scy) && move.finisher) this.sfx.heavy();
    const ippoFist = !this.boxOn && /^(bx|fp)_/.test(move.id);
    if (scy) this.sfx.scytheHit(heavy, this.scythe.hits);
    else if (foot && !fistSound) this.sfx.footImpact(foot.foot.school, !!move.finisher, this.footwork.hits, this.footwork.contactBeat);
    else if (this.boxOn || ippoFist) {
      const pw = move.finisher ? 1 : move.id === 'bx_body' ? 0.6 : 0.4;
      if (this.boxOn) this.sfx.boxing(pw); else { this.sfx.punch(); if (move.finisher) this.sfx.heavy(); }
      this.box.pulse = 1;
      const d = this.boxOn ? this.boxDef : IPPO_BARE;
      this.particles.ring(hx, hy, 2, 5 + pw * 6, d.accent, 0.14, 1, true);
      // keringat secukupnya dari kepala korban
      for (let i = 0; i < 2 + Math.round(pw * 2); i++) {
        this.particles.add({ x: e.x + rnd(-3, 3), y: e.y - 12 - e.z, vx: Math.cos(a) * rnd(40, 110) + rnd(-15, 15), vy: -rnd(25, 70), life: rnd(0.2, 0.4), c: '#cfefff', k: 0, s: 1, g: 210, fr: 1 });
      }
      if (move.finisher) { this.zoomKick = Math.max(this.zoomKick, 0.04); }
    } else if (move.sfx === 'punch') this.sfx.punch(); else if (move.sfx === 'kick') this.sfx.kick(); else if (move.sfx === 'nunchaku') { this.sfx.nunchakuHit(heavy); } else if (move.sfx === 'yoyo') { this.sfx.yoyoHit(!!move.finisher); this.yoyoV2.impact(); this.particles.ring(hx, hy, 2, move.finisher ? 11 : 7, this.yoyoV2.skin.aura, 0.14, 1, true); this.particles.spark(hx, hy, 2, this.yoyoV2.skin.spark, a, 0.9, 120); } else if (move.sfx === 'slash') { this.sfx.slashHit(heavy); } else if (move.sfx === 'axe') { this.sfx.axeHit(heavy); this.sfx.batCrack(); if (move.id === 'a_homerun' || move.id === 'a_grandslam' || move.id === 'b_homerun' || move.id === 'b_grandslam') { this.slow(0.25, 0.25); this.flash('#ffffff', 0.1); this.zoomKick = 0.08; this.say(move.id === 'b_grandslam' || move.id === 'a_grandslam' ? 'GRAND SLAM!' : 'HOME RUN!', '#ffe66d', 3, 1.0); } } else if (move.sfx === 'dual') { this.sfx.dualHit(); } else this.sfx.heavy();
    if (move.bleed && !e.dead) { e.bleed = Math.min(6, e.bleed + (heavy ? 3 : 2)); if (e.bleedT <= 0) e.bleedT = 0.3; }
    if (move.bat) {
      this.particles.ring(hx, hy, 2, heavy ? 10 : 7, '#ffffff', 0.12, 1, true);
      this.particles.spark(hx, hy, heavy ? 4 : 2, '#fff3a0', a, 0.7, 220);
      if (move.id === 'b_spike' && !e.dead) {
        if (this.level.sideView) { e.svVy = 300; e.svGrounded = false; e.state = 'air'; e.pose = 'launched'; }
        else e.vz = -320;
        this.particles.shockwave(e.x, e.y, 16, '#ffffff', 0.24); this.say('METEOR SPIKE!', '#ff6a4a', 2, 0.9); this.slow(0.15, 0.3); this.flash('#ffffff', 0.08);
      }
      if (move.id === 'b_behind' || move.id === 'b_heli') this.zoomKick = Math.max(this.zoomKick, 0.04);
      this.batSpamHit();
      if (Math.random() < 0.4 || move.id === 'sb_smash' || move.id === 'sb_pound') {
        const words = ['BONK!', 'WHAM!', 'CRACK!', 'THWACK!', 'POW!', 'SMACK!'];
        this.texts.hit(e.x + rnd(-6, 6), e.y - 24 - e.z, move.id === 'sb_pound' ? 'CURB!' : words[Math.floor(Math.random() * words.length)], Math.random() < 0.5 ? '#ffd27f' : '#ffffff', 1, 0.45);
      }
    }
    if ((move.sfx === 'slash' || move.sfx === 'dual' || move.sfx === 'axe') && !e.dead && !move.bat) {
      // a clean cut line across the body
      const ca = p.bladeA + Math.PI / 2;
      this.particles.lines(hx, hy, 1, '#ffffff', ca, 55); this.particles.lines(hx, hy, 1, '#ffffff', ca + Math.PI, 55);
      this.particles.blood(hx, hy, 3, p.bladeA + Math.PI / 2, 85);
    }
    p.focus = Math.min(300, p.focus + 7 * this.stats.focusGain);
    this.addOfa(dmg * 0.1);
    this.addCombo();
    this.meleeHits++;
    if (p.weapon === 'fist' || p.weapon === 'nunchaku' || p.weapon === 'bat') { if (this.time - this.fistHitT > 2) this.fistHits = 0; this.fistHits++; this.fistHitT = this.time; }
    if ((move.id === 'chain' || p.style !== 'none') && !p.rageOn) { p.rage = Math.min(100, p.rage + (move.id === 'chain' ? 2.2 : move.finisher ? 5 : 3)); if (p.rage >= 100 && !this.rageReadySaid) { this.rageReadySaid = true; this.say('RAGE READY - PRESS R', '#ff2a2a', 2, 1.4); this.sfx.select(); } }
    if (move.id === 'chainend') { p.rage = Math.min(100, p.rage + 10); this.slow(0.2, 0.3); }
    if (move.id === 'ragekill') {
      p.rageKills++;
      this.flash('#ff2a2a', 0.15); this.zoomKick = 0.06;
      if (!e.dead && !e.boss) this.killEnemy(e, a, 700, false, true);
      else if (!e.dead && e.boss) this.damageEnemy(e, e.maxHp * 0.08, 60, a, 300, { knockdown: true, hitstop: 0.08, shake: 0.6, melee: true });
      if (p.rageKills % 3 === 0) this.heal(1);
    }
    if (move.travel) p.travelHit = true;
    if (move.finisher) this.zoomKick = Math.max(this.zoomKick, 0.04);
    if (move.id === 'n_dragonlash' && p.hitSet.length === 1) {
      // detonation: the chain whips around the first target and blasts everyone nearby
      this.particles.shockwave(e.x, e.y - 4, 44, this.pal.accent, 0.35);
      this.particles.impact(hx, hy, 12, '#ffffff');
      this.flash('#ffffff', 0.2); this.slow(0.2, 0.3);
      this.sfx.explosion();
      for (const o of this.enemies) {
        if (o === e || o.dead || o.spawnT > 0 || dist(o.x, o.y, e.x, e.y) > 44 + o.r) continue;
        p.hitSet.push(o.id);
        this.damageEnemy(o, move.dmg * 0.6 * this.stats.meleeDmg, 40, Math.atan2(o.y - e.y, o.x - e.x), 420, { knockdown: true, hitstop: 0.02, shake: 0.2, melee: true, launch: 90 });
      }
    }
    if (this.stats.lifesteal > 0 && this.meleeHits % Math.max(10, 25 - this.stats.lifesteal * 5) === 0) this.heal(1);
    if (this.stats.shockwave > 0 && move.finisher && wasAlive) this.shockwaveHit(e.x, e.y, 34, dmg * 0.6, e.id);
  }

  shockwaveHit(x: number, y: number, r: number, dmg: number, excludeId: number) {
    this.particles.shockwave(x, y - 4, r, this.pal.accent, 0.3);
    this.sfx.heavy();
    for (const e of this.enemies) {
      if (e.dead || e.id === excludeId || e.spawnT > 0) continue;
      const d = dist(x, y, e.x, e.y);
      if (d > r + e.r) continue;
      this.damageEnemy(e, dmg, 20, Math.atan2(e.y - y, e.x - x), 200, { knockdown: true, hitstop: 0.02, shake: 0.1, melee: false });
    }
  }

  heal(n: number) {
    const p = this.player;
    const before = p.hp;
    p.hp = Math.min(this.maxHp(), p.hp + n);
    if (p.hp > before) { this.texts.add(p.x, p.y - 26, `+${p.hp - before} HP`, '#ff6b6b', 1, 0.8); this.particles.burst(p.x, p.y - 8, 8, '#ff6b6b', 50, 0.5); }
  }

  staggerEnemy(e: Enemy) {
    e.stagger = e.boss ? 1.8 : 2.6; e.state = 'stagger'; e.down = 0; e.stun = 0; e.kx *= 0.4; e.ky *= 0.4; e.fuse = -1;
    if (this.v2) { e.sqx = 1.25; e.sqy = 0.75; }
    this.sfx.stagger();
    this.particles.ring(e.x, e.y - 8, 2, 18, '#ffd700', 0.3, 1);
    if (this.finishCd <= 0 && dist(e.x, e.y, this.player.x, this.player.y) < 90) { this.finishCd = 4; this.sfx.announce(); }
  }

  /** Percikan air dangkal: tetesan naik, cincin riak, dan buih sesaat. */
  splashAt(x: number, y: number, power: number) {
    const n = Math.round(4 + power * 9);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), sp = rnd(20, 80) * (0.5 + power);
      this.particles.add({
        x, y: y - 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5,
        z: 1, vz: rnd(50, 130) * (0.6 + power), g: 430,
        life: rnd(0.22, 0.5), c: i % 3 === 0 ? '#ffffff' : '#bdf0f7', s: 1, k: 0, fr: 1.2,
      });
    }
    this.particles.ring(x, y, 2, 7 + power * 9, '#e8fbff', 0.26, 1);
  }

  /** MODE BOXING: hanya pamungkas klik kanan yang boleh membunuh. Semua sumber lain
   *  (spam kiri, bentur tembok, jatuh, mayat terlempar, pendarahan) menyisakan 1 HP. */
  get boxGuard(): boolean {
    if (!this.boxOn) return false;
    const p = this.player;
    return !(p.moveKey && p.moveKey === this.boxHeavyKey && p.attackPhase !== 'none');
  }

  /** Kurangi HP musuh lewat penjaga boxing. Mengembalikan true bila musuh benar-benar mati. */
  chipEnemy(e: Enemy, dmg: number): boolean {
    if (this.boxGuard) { e.hp = Math.max(1, e.hp - dmg); return false; }
    e.hp -= dmg;
    return e.hp <= 0;
  }

  /** Kacamata hitam: retak dulu, lalu terlempar utuh atau pecah berkeping-keping. */
  hitShades(e: Enemy, dir: number, force: number, lethal = false) {
    if (e.accessory !== 'shades' || e.shades >= 2) return;
    const hx = e.x + Math.cos(e.aim) * 1.5, hy = e.y - 11 * e.scale - e.z;
    const heavy = lethal || force >= 6 || e.hp <= 0;
    if (e.shades === 0 && !heavy) {
      e.shades = 1;
      this.sfx.glassCrack();
      this.particles.glassShards(hx, hy, 4, dir, 0.4);
      this.particles.spark(hx, hy, 5, '#dff6ff', dir, 1.1, 150);
      this.particles.ring(hx, hy, 1, 6, '#cfe9ff', 0.14, 1);
      this.texts.hit(e.x, e.y - 22 - e.z, 'CRACK!', '#cfe9ff', 1, 0.5);
      return;
    }
    const wasCracked = e.shades === 1;
    e.shades = 2;
    this.sfx.glassShatter();
    this.particles.shadesFly(hx, hy, dir, Math.min(1.4, 0.6 + force * 0.09), wasCracked);
    this.particles.ring(hx, hy, 2, 14, '#ffffff', 0.2, 2, true);
    this.particles.spark(hx, hy, 10, '#e8f4ff', dir, 1.6, 230);
    this.flash('#dff6ff', 0.08);
    this.hitstop = Math.max(this.hitstop, wasCracked ? 0.09 : 0.06);
    this.shake(0.3);
    this.score += 25;
    this.texts.hit(e.x, e.y - 24 - e.z, wasCracked ? 'SHATTERED!' : 'SHADES OFF!', '#dff6ff', 1, 0.7);
    if (e.eyeStyle !== 'white' && Math.random() < 0.5) e.eyeStyle = 'white';
  }

  /** Running Dropkick: lawan yang terpental menabrak temannya — teman bisa menahan atau ikut jatuh. */
  private updateDropkickChain(e: Enemy, dt: number) {
    const f = e.dkFly!;
    f.t -= dt;
    const sp = Math.hypot(e.kx, e.ky);
    if (f.t <= 0 || sp < 45) { e.dkFly = undefined; return; }
    for (const o of this.enemies) {
      if (o === e || o.dead || o.spawnT > 0 || f.hit.includes(o.id)) continue;
      const d = Math.hypot(o.x - e.x, o.y - e.y);
      if (d > e.r + o.r + 3) continue;
      f.hit.push(o.id);
      const dir = Math.atan2(o.y - e.y, o.x - e.x) * .4 + f.dir * .6;
      const fall = !o.boss && Math.random() < (f.gen === 0 ? .55 : .35);
      if (fall) {
        this.damageEnemy(o, 1.5 + Math.random() * 2.5, 22, dir, sp * .55, { knockdown: true, hitstop: .02, shake: .18 });
        this.texts.hit(o.x, o.y - 22, 'IKUT JATUH!', '#7dffb8', 1, .5);
        if (!o.dead && f.gen < 2) o.dkFly = { t: .45, dir, hit: [...f.hit], gen: f.gen + 1 };
        e.kx *= .7; e.ky *= .7;
      } else {
        // menahan: teman menangkap tubuh yang terpental, terdorong sedikit & sempoyongan
        o.kx += Math.cos(dir) * sp * .22; o.ky += Math.sin(dir) * sp * .22;
        o.stun = Math.max(o.stun, .25); o.sqx = 1.25; o.sqy = .8;
        this.texts.hit(o.x, o.y - 22, 'TAHAN!', '#cfd8ff', 1, .45);
        e.kx *= .35; e.ky *= .35;
      }
      this.particles.impact((o.x + e.x) / 2, (o.y + e.y) / 2 - 6, 4, '#ffffff');
      this.sfx.hit();
    }
  }
  damageEnemy(e: Enemy, dmg: number, structure: number, dir: number, kb: number, o: { knockdown?: boolean; hitstop?: number; shake?: number; melee?: boolean; launch?: number; zone?: Zone }) {
    if (!this.officeFxOn()) return this.damageEnemyV2(e, dmg, structure, dir, kb, o);
    return this.withV1Fx(e, dir, dmg, kb, !!o.knockdown || (o.launch ?? 0) > 100, undefined, () => this.damageEnemyV2(e, dmg, structure, dir, kb, o));
  }
  damageEnemyV2(e: Enemy, dmg: number, structure: number, dir: number, kb: number, o: { knockdown?: boolean; hitstop?: number; shake?: number; melee?: boolean; launch?: number; zone?: Zone }) {
    if (o?.melee && this.gates.on) {
      dmg *= this.gates.dmgMul; kb *= this.gates.kbMul; this.particles.burst(e.x, e.y - 7 * (e.scale ?? 1) - e.z, 3 + this.gates.gates, this.gates.mid, 150, 0.3, 1, 2);
      // GERBANG 6: basic attack tetap seperti biasa dengan feel WOW; Finisher Punch / Heavy Attack membuat musuh mental jauh!
      if (this.gates.gates >= 6 && !this.gates.cine && !this.gates.lotus) {
        const curMv = this.player.moveKey ? MOVES[this.player.moveKey] : null;
        const isFinisher = !!(
          curMv?.finisher ||
          (curMv && curMv.dmg >= 8) ||
          curMv?.id === 'palm' ||
          curMv?.id === 'doublepalm' ||
          curMv?.id === 'dragon' ||
          o.knockdown ||
          (o.launch ?? 0) >= 60
        );
        o = this.gates.heavyHit(this, e, o, dir, isFinisher);
        kb *= (o as { kbBoost?: number }).kbBoost ?? 1;
      }
    }
    // PETARUNG FIST sedang BLOK: serangan dari depan tertahan (damage -70%, dorongan -75%) tapi posturnya tetap tergerus
    if (o?.melee && e.kind === 'fighter' && (e.guardT ?? 0) > 0 && !e.dead && (this.player.x - e.x) * Math.cos(e.aim) > -4) {
      dmg *= 0.3; kb *= 0.25;
      this.sfx.parry(); this.texts.hit(e.x, e.y - 24, 'BLOK', '#cfd8ff', 1, 0.45);
      this.particles.spark(e.x + Math.cos(e.aim) * 5, e.y - 7, 5, '#cfd8ff', dir + Math.PI, 1, 160);
    }
    if (isJack(e) && o?.melee && jackOnHit(this, e, dir, dmg)) return;
    if (isWielder(e) && o?.melee && wielderOnHit(this, e, dir, dmg)) return;
    if (isSmart(e) && o?.melee && smartOnHit(this, e)) return;
    const bx = (e.boss || (e.kind as string) === 'duelist') && o?.melee ? this.bossExchange.onPlayerHit(this, e) : null;
    if (bx === 'block') return;
    if (bx === 'open') dmg *= 1.6;
    if (e.dead || e.spawnT > 0) return;
    e.faceT = 0.55;
    this.hitShades(e, dir, o.knockdown ? Math.max(6, dmg) : dmg);
    // MODE BOXING: pukulan kiri hanya mengikis sampai 1 HP. Yang menghabisi wajib klik kanan.
    const boxLight = this.boxGuard;
    if (boxLight) e.hp = Math.max(1, e.hp - dmg);
    else e.hp -= dmg;
    e.flash = 0.045;
    e.flinch = 0.12;
    if (this.v2) { e.sqx = 1.35; e.sqy = 0.65; }        // juicy impact squeeze, game1 style
    e.structure += structure;
    const eAir = this.isEnemyAirborne(e);
    const kbMul = (1 - e.kbRes) * (1 - e.kbRes * 0.5) * (e.stagger > 0 ? 1.25 : 1) * (eAir ? 0.55 : 1);
    e.kx += Math.cos(dir) * kb * kbMul; e.ky += Math.sin(dir) * kb * kbMul;
    if (o.melee && e.hp > 0) this.meleeChase.onHit(this, e, dir, kb, o);
    this.hitstop = Math.max(this.hitstop, o.hitstop ?? 0.02);
    this.shake(o.shake ?? 0.1);
    if (e.hp <= 0) {
      if (this.boxOn && !boxLight) {
        // K.O. — pamungkas klik kanan mendarat telak
        this.sfx.boxing(1); this.sfx.slam();
        this.flash('#ffffff', 0.12);
        this.slow(0.22, 0.28);
        this.shake(0.75);
        this.zoomKick = Math.max(this.zoomKick, 0.08);
        this.particles.shockwave(e.x, e.y - 6, 26, this.boxDef.accent, 0.28);
        this.particles.ring(e.x, e.y - 6, 3, 18, '#ffffff', 0.22, 1, true);
        this.particles.burst(e.x, e.y - 8, 8, this.boxDef.gloveLight, 190, 0.35, 1, 3);
        this.say('K.O.!', this.boxDef.accent, 3, 0.9);
        this.score += 40;
      }
      startReact(e, o.zone ?? randomZone(), dir, 1);
      this.killEnemy(e, dir, kb + dmg * 20, false, !!o.melee, eAir || (o.launch ?? 0) > 0);
      return;
    }
    reactFx(this, e, o.zone ?? randomZone(), dir, dmg, kb, o);
    if (o.launch && o.launch > 0 && !e.armor) {
      // real launchers (uppercut, taekwondo kick, crane, monkey flip, focus) always lift; small pops need a softened target
      const softened = eAir || e.structure >= e.maxStructure * 0.35 || e.hp <= e.maxHp * 0.55 || e.stagger > 0 || o.launch >= 50;
      if (!softened) { e.stun = Math.max(e.stun, 0.3); e.state = 'stun'; e.kx *= 0.5; e.ky *= 0.5; return; }
      if (this.level.sideView) {
        e.svVy = -Math.max(Math.abs(Math.min(0, e.svVy ?? 0)), Math.max(130, o.launch * 0.82));
        e.svGrounded = false;
      } else {
        e.vz = Math.max(e.vz, o.launch);
        e.z = Math.max(e.z, 0.1);
      }
      e.down = 0; e.stun = 0; e.state = 'air'; e.pose = 'launched'; e.fuse = -1;
      if (this.v2) { e.sqx = 0.8; e.sqy = 1.25; }       // stretch while flying
      this.sfx.launch();
      return;
    }
    if (eAir) {
      if (this.level.sideView) {
        e.svVy = Math.min(e.svVy ?? 0, -120);
        e.svGrounded = false;
        e.state = 'air';
        e.pose = 'launched';
      } else {
        e.vz = Math.max(e.vz + 70, 120);
      }
      return;
    }
    if (e.structure >= e.maxStructure && e.stagger <= 0) { this.staggerEnemy(e); return; }
    if (e.stagger > 0) return;
    if (o.knockdown && !e.armor) {
      if (e.boss && Math.random() < 0.6) { e.stun = Math.max(e.stun, 0.25); e.state = 'stun'; return; }
      // tough enemies only go down once softened up: enough structure damage, low hp, or an elite's luck
      const softened = e.structure >= e.maxStructure * 0.4 || e.hp <= e.maxHp * 0.5 || e.stagger > 0;
      if (!softened && !(o.launch && o.launch > 0)) { e.stun = Math.max(e.stun, 0.3); e.state = 'stun'; return; }
      e.down = e.boss ? 0.7 : 1.0; e.state = 'down'; e.fuse = -1; return;
    }
    if (!e.armor && o.melee && e.down <= 0) {
      const committed = (e.state === 'windup' && e.stateT < 0.12) || e.state === 'attack' || e.state === 'lunge';
      const poise = e.boss ? 0.7 : e.elite ? 0.45 : e.kind === 'fighter' ? 0.4 : e.kind === 'monk' ? 0.25 : 0;
      if (!committed && Math.random() >= poise) { e.stun = Math.max(e.stun, 0.16); e.state = 'stun'; }
    }
  }

  enemyLand(e: Enemy, impact = 0) {
    // V2 (game1 feel): a body that slams into the floor springs back up once before it goes down.
    // Self-limiting: the rebound is only ~34% of the impact, so the next landing is always below the threshold.
    if (this.v2 && impact > 260 && !e.dead) {
      if (this.level.sideView) { e.svVy = -impact * 0.34; e.svGrounded = false; }
      else { e.vz = impact * 0.34; e.z = 0.1; }
      e.sqx = 1.3; e.sqy = 0.7;
      this.particles.smoke(e.x, e.y, 8, '#777', 50, 0.5);
      this.particles.burst(e.x, e.y, 8, this.pal.wallTop, 110, 0.4);
      this.splat(e.x, e.y, 6);
      this.shake(0.4); this.sfx.land();
      this.texts.hit(e.x, e.y - 20, 'THUD!', '#ffffff', 1, 0.45);
      return;
    }
    if (this.v2) {
      e.sqx = 1.45; e.sqy = 0.55;        // hard landing pancake, game1 style
      // V2: ragdoll rebah yang BERVARIASI seperti game1, bukan satu pose papan yang sama terus
      const lat = Math.hypot(e.kx, e.ky);
      const r = Math.random();
      e.fall = lat > 60 ? (r < 0.7 ? 'knock' : 'broken') : r < 0.5 ? 'broken' : r < 0.9 ? 'knock' : 'curled';
      e.fallFlip = Math.random() < 0.4 ? -1 : 1;
    }
    this.particles.smoke(e.x, e.y, 6, '#888', 30, 0.45);
    this.particles.burst(e.x, e.y, 6, this.pal.wallTop, 80, 0.4);
    this.particles.blood(e.x, e.y - 3, 10, rnd(0, 6.3), 90);
    this.splat(e.x, e.y, 8);
    this.sfx.land();
    this.shake(0.2);
    if (e.dead) return;
    if (e.stagger > 0) { e.state = 'stagger'; e.pose = 'stagger'; return; }
    e.down = e.boss ? 0.6 : 1.0; e.state = 'down'; e.pose = 'down';
    if (this.chipEnemy(e, 1)) this.killEnemy(e, Math.atan2(e.ky, e.kx), 150, false, true);
  }

  /** Bantingan penutup Kombo Udara nunchaku: musuh dihempaskan keras ke lantai. */
  slamEnemyDown(e: Enemy) {
    if (e.dead) return;
    if (this.level.sideView) { e.svVy = Math.max(e.svVy ?? 0, 430); e.svGrounded = false; }
    else { e.vz = Math.min(e.vz, -430); e.z = Math.max(e.z, 0.1); }
    this.shake(0.3);
  }

  /**
   * CHARGED HEAVY NUNCHAKU (tahan klik kanan >= 0,2 detik): bagian tubuh yang terkena ujung
   * nunchaku mengalami PATAH TULANG / terkilir parah — batas sudut sendinya berubah PERMANEN.
   * Musuh tak bisa lagi menggerakkan bagian itu secara normal (pincang, pukulan melemah,
   * tak bisa menoleh), tangan/kakinya terlipat bengkok ekstrem saat digambar, dan mayat
   * ragdoll-nya kelak mewarisi anggota yang bengkok & lemas yang sama.
   */
  applyFracture(e: Enemy, tip: { x: number; y: number }) {
    if (e.dead || e.fracture) return;
    const relY = (e.y - tip.y) / Math.max(6, 17 * e.scale); // ~1 = setinggi kepala, ~0 = kaki
    const front = (tip.x - e.x) * e.facing >= 0;
    const part: 'neck' | 'farm' | 'barm' | 'fleg' | 'bleg' = relY > 0.8 ? 'neck' : relY > 0.42 ? (front ? 'farm' : 'barm') : (front ? 'fleg' : 'bleg');
    e.fracture = { part, face: e.facing };
    // AI tak lagi bisa menggerakkan bagian yang patah secara normal — permanen:
    if (part === 'fleg' || part === 'bleg') e.speed *= 0.38;                       // pincang berat
    else if (part === 'neck') { e.speed *= 0.7; e.canParry = false; }              // tak bisa menoleh / menangkis
    else { e.dmg = Math.max(1, Math.round(e.dmg * 0.5)); e.attackCd = Math.max(e.attackCd, 1.1); } // lengan patah: pukulan lemah
    e.stun = Math.max(e.stun, 0.45);
    const label = part === 'neck' ? 'LEHER' : part === 'fleg' || part === 'bleg' ? 'KAKI' : 'LENGAN';
    this.say(`${label} PATAH!`, '#ffc46b', 2, 0.9);
    this.texts.hit(tip.x, tip.y - 8, 'KRAK!', '#ffffff', 1, 0.5);
    this.particles.impact(tip.x, tip.y, 8, '#ffffff');
    this.sfx.nunchakuHit(true); this.sfx.slam();
    this.shake(0.35);
  }

  /**
   * CHARGED HEAVY GUAN DAO (tahan klik kanan >= 0,2 detik): tebasan super kuat yang membelah
   * tubuh stickman musuh menjadi DUA potong ragdoll terpisah — bagian atas (kepala, dada,
   * lengan) terlempar ke satu sisi, bagian bawah (pinggang, kaki) roboh ke sisi lain.
   */
  bisectEnemy(e: Enemy, dir: number, lvl = 1) {
    if (e.dead) return;
    const before = new Set(this.corpses);
    this.damageEnemy(e, 9999, 90, dir, 620, { melee: true, knockdown: true, hitstop: 0.09, shake: 0.7, launch: 70, zone: 'torso' });
    if (!e.dead) return;
    // ganti mayat utuh hasil killEnemy barusan dengan dua potongan tubuh yang terbelah
    const spawned = this.corpses.filter((c) => !before.has(c) && Math.hypot(c.x - e.x, c.y - e.y) < 34);
    if (!spawned.length) return;
    for (const c of spawned) { const i = this.corpses.indexOf(c); if (i >= 0) this.corpses.splice(i, 1); }
    this.revives = this.revives.filter((r) => !spawned.includes(r.c));
    const sv = !!this.level.sideView;
    const skin = { color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle };
    const sa = dir + Math.PI / 2;
    const hDir = Math.cos(dir) >= 0 ? 1 : -1;
    const mkHalf = (part: 'top' | 'bot', along: number, up: number, spin: number) => {
      const rd = new Ragdoll(e.x, e.y, sv ? 0 : Math.max(0, e.z), skin, this.rng.next(), sv);
      rd.part = part;
      // putus tulang penghubung pinggang <-> dada supaya dua potongan benar-benar terpisah
      rd.bones = rd.bones.filter((b) => (part === 'top' ? Math.max(b.a, b.b) <= 4 : Math.min(b.a, b.b) >= 2));
      this.corpses.push({
        x: e.x, y: sv ? e.y - 4 : e.y, rot: dir, color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle,
        vx: 0, vy: 0, spin: 0, t: 0, z: sv ? 0 : Math.max(e.z, 1), vz: 0, gib: false, bounces: 0, face: hDir, rd,
      });
      if (sv) rd.launch(Math.cos(sa) * along, 0, up, spin);
      else rd.launch(Math.cos(sa) * along, Math.sin(sa) * along, up, spin);
    };
    mkHalf('top', 95 + lvl * 40, 175, hDir * 9);
    mkHalf('bot', -75 - lvl * 30, 95, -hDir * 7);
    this.say('TERBELAH!', '#ffc46b', 2, 0.8);
    this.splat(e.x, e.y, 16);
  }

  killEnemy(e: Enemy, dir: number, power: number, silent = false, melee = false, airborne = false) {
    if (e.dead) return;
    if (this.level.sideView && this.glowOn) this.glowFx.add(e.x, e.y - (e.z || 0) - 9 * (e.scale || 1), 42, '#ff5a5a', 0.14);
    if (this.level.outdoor) this.life.alarm(e.x, e.y, 120 + Math.min(140, power * 0.25));
    e.dead = true;
    this.kills++;
    this.addOfa(e.boss ? 15 : 7);
    this.score += Math.round(e.value * this.comboMult());
    const gy = e.y - 6 - e.z;
    // blood: classic particles (normal/combined) + the new gore emitters (gore/combined)
    this.particles.blood(e.x, gy, 8 + Math.min(10, power / 30), dir, 110 + power * 0.4);
    this.blood.spray(e.x, gy, dir, 3 + Math.min(4, power / 100), true);
    this.particles.ring(e.x, gy, 3, 14, '#ffffff', 0.18, 1);
    this.splat(e.x, e.y, 6 + Math.floor(e.scale * 2));
    this.addPool(e.x, e.y + 1, 4 + e.scale);
    // RAGDOLL: the body is flung along the hit direction, tumbling in the air, bouncing when it lands
    if (this.corpses.length > 80) this.corpses.shift();
    // V2 uses game1's launch recipe: inherit fast momentum, else a capped toss + a 125-220 hop,
    // so bodies tumble a funny short arc instead of rocketing across the arena
    // Pastikan titik lahir mayat/ragdoll berjarak aman dari tembok (mencegah tangan/kaki ragdoll menancap di tembok!)
    const spawnPos = { x: e.x, y: e.y, r: Math.max(e.r, 6.5) };
    unstick(this.level, spawnPos);
    const cur = Math.hypot(e.vx, e.vy);
    const useOwn = this.v2 && cur > 70;
    const fling = useOwn ? cur * 1.05 : this.v2 ? Math.min(430, 110 + power * 0.85) : Math.min(520, 120 + power * 0.9);
    let lang = useOwn ? Math.atan2(e.vy, e.vx) : dir;
    const sv = !!this.level.sideView;
    // Jika tepat di depan arah lontaran ada tembok dekat, pantulkan arah lontaran menjauhi tembok!
    const probeX = spawnPos.x + Math.cos(lang) * 9;
    const probeY = sv ? spawnPos.y - 6 : spawnPos.y + Math.sin(lang) * 9;
    if (solidAt(this.level, probeX, probeY) && !solidAt(this.level, spawnPos.x - Math.cos(lang) * 9, probeY)) {
      lang = Math.atan2(Math.sin(lang), -Math.cos(lang));
    }
    const up = this.v2 ? Math.max(e.vz, e.z > 1 ? e.vz : 125 + Math.random() * 95) : airborne ? Math.max(e.vz, 120) : Math.min(260, 60 + power * 0.35);
    const hDir = Math.cos(lang) >= 0 ? 1 : -1;
    const svVx = (Math.abs(Math.cos(lang)) > 0.25 ? Math.cos(lang) : hDir * 0.7) * Math.min(360, fling);
    const svUp = Math.min(235, Math.max(85, up * 0.9 + 30));
    this.corpses.push({
      x: spawnPos.x, y: sv ? spawnPos.y - 4 : spawnPos.y, rot: lang + (Math.random() < 0.5 ? 0.3 : -0.3), color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle,
      vx: sv ? svVx : Math.cos(lang) * fling, vy: sv ? -svUp * 0.65 : Math.sin(lang) * fling * 0.75, spin: this.v2 ? 11 * (Math.cos(lang) >= 0 ? 1 : -1) * (0.7 + Math.random() * 0.6) : rnd(6, 14) * (Math.random() < 0.5 ? 1 : -1), t: 0, z: sv ? 0 : Math.max(e.z, 1), vz: sv ? 0 : up, gib: false, bounces: 0,
      face: hDir,
      sqx: 0.8, sqy: 1.3,
    });
    // RAGDOLL: tubuh lemas sungguhan. Tangan/kaki menyeret, memantul sendiri, lalu terkulai.
    {
      const corpse = this.corpses[this.corpses.length - 1];
      const live = this.corpses.filter((q) => q.rd && !q.rd.settled).length;
      if (live < 18) {
        const rd = new Ragdoll(spawnPos.x, spawnPos.y, sv ? 0 : Math.max(0, e.z), {
          color: e.color, color2: e.color2, scale: e.scale,
          accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle,
        }, this.rng.next(), sv);
        // kematian mengikuti bagian yang terkena: kepala = tubuh terlempar ke belakang, perut = melipat & terseret, bawah = salto tersandung
        const dz = (e as unknown as { react?: { zone: string } }).react?.zone;
        const zSpin = dz === 'legs' ? 1.7 : dz === 'torso' ? 0.55 : dz === 'head' ? 0.85 : 1;
        const zUp = dz === 'legs' ? 0.62 : dz === 'head' ? 1.1 : dz === 'torso' ? 0.9 : 1;
        const zFl = dz === 'torso' ? 1.12 : dz === 'head' ? 1.05 : 1;
        const spin = hDir * (7 + Math.min(16, power * 0.035)) * (0.7 + Math.random() * 0.7) * zSpin;
        if (sv) {
          rd.launch(svVx * zFl, 0, svUp * zUp, spin);
        } else {
          rd.launch(Math.cos(lang) * fling * 1.18 * zFl, Math.sin(lang) * fling * 0.88 * zFl, up * 1.12 * zUp + 45, spin);
        }
        if (dz === 'head' && power > 260 && Math.random() < 0.45) this.particles.head(e.x, e.y - 10, Math.cos(lang) * 40 + rnd(-20, 20), sv ? -120 : Math.sin(lang) * 30, 300, e.color);
        // mayat mewarisi PATAH TULANG: sendi yang sama bengkok ekstrem & tulangnya lemas di ragdoll
        if (e.fracture) {
          rd.bentPart = e.fracture.part;
          const tgt = e.fracture.part === 'farm' ? 3 : e.fracture.part === 'barm' ? 4 : e.fracture.part === 'fleg' ? 5 : e.fracture.part === 'bleg' ? 6 : 1;
          for (const b of rd.bones) if (b.b === tgt || (e.fracture.part === 'neck' && b.a === 0)) b.stiff = Math.min(b.stiff, 0.3);
        }
        corpse.rd = rd;
        this.bow.toRagdoll(e.id, rd);
      }
    }
    // sebagian musuh biasa TIDAK benar-benar mati: beberapa detik kemudian ia bangkit dengan setengah nyawa
    {
      const kinds: EnemyKind[] = ['thug', 'knife', 'batter', 'monk', 'brute', 'shield'];
      const ex = e as unknown as { rose?: boolean; sboss?: number; tb?: unknown; sm?: unknown; ai2?: unknown; jack?: unknown };
      if (!e.boss && !ex.rose && ex.sboss === undefined && !ex.tb && !ex.sm && !ex.ai2 && !ex.jack && kinds.includes(e.kind) && !this.player.fatality && !this.silat
        && this.mode !== 'team' && this.state === 'playing' && Math.random() < (e.kind === 'brute' ? 0.2 : 0.11)) {
        const lc = this.corpses[this.corpses.length - 1];
        if (lc) this.revives.push({ c: lc, t: rnd(1.7, 2.6), kind: e.kind, color: e.color, color2: e.color2 });
      }
    }
    if (!silent) { this.sfx.kill(); this.shake(0.3 + Math.min(0.4, power / 900)); this.hitstop = Math.max(this.hitstop, 0.045); }
    if (e.kind === 'bomber') this.pendingBooms.push({ x: e.x, y: e.y, t: 0.05, r: 30, dmg: 2, fromPlayer: true });
    this.dropLoot(e, melee);
    this.addCombo();
    if (e.boss) {
      this.slow(1.4, 0.2);
      this.flash('#ffffff', 0.6);
      this.shake(1);
      this.say('BOSS DEFEATED!', '#ffd700', 3, 2.2);
      this.deathCounter = 1;
      this.score += 500;
      for (let i = 0; i < 3; i++) this.particles.shockwave(e.x, e.y - 6, 60 + i * 30, this.pal.accent, 0.6 + i * 0.2);
      this.bossBeatenT = 2;
      for (const o of this.enemies) if (!o.dead && o !== e) this.killEnemy(o, Math.atan2(o.y - e.y, o.x - e.x), 200, true);
    } else if (melee && this.combo >= 3) this.slow(0.1, 0.35);
  }

  gibAt(x: number, y: number, color: string, scale: number, dir = 0, power = 1) {
    this.particles.blood(x, y - 6, 30, dir, 170 * power);
    this.particles.blood(x, y - 6, 16, rnd(0, 6.3), 100 * power);
    this.particles.fountain(x, y - 6, 8);
    this.blood.spray(x, y - 6, dir, 5 * power, true); this.blood.arterial(x, y - 6, dir, power * 0.7); this.blood.fountain(x, y - 6, 10); this.blood.gibs(x, y - 6, dir, 200 * power, color, 3);
    for (let i = 0; i < 5; i++) this.particles.limb(x, y - 6, dir + rnd(-1.2, 1.2), 180 * power, color, 3 + scale * 2);
    this.particles.burst(x, y - 6, 12, color, 140, 0.4);
    this.particles.ring(x, y - 6, 3, 20, '#ffffff', 0.2, 1);
    this.particles.impact(x, y - 6, 9, '#ff4040');
    this.splat(x, y, 40);
    this.addPool(x, y + 1, 9 + scale * 3);
    this.sfx.kill(); this.sfx.heavy();
    this.shake(0.6);
  }

  explode(x: number, y: number, r: number, dmg: number, fromPlayer: boolean) {
    if (this.level.sideView && this.glowOn) this.glowFx.add(x, y - 4, 120, '#ffb347', 0.5);
    this.particles.smoke(x, y, 12, '#555555', 60, 0.7);
    this.particles.burst(x, y, 24, '#ffb347', 180, 0.45, 2, 3);
    this.particles.burst(x, y, 14, '#ffffff', 120, 0.25, 1, 3);
    this.particles.shockwave(x, y, r + 10, '#ffd27f', 0.35);
    this.particles.ember(x, y, 10, '#ff6a00');
    this.sfx.explosion();
    this.shake(0.8);
    this.hitstop = Math.max(this.hitstop, 0.05);
    this.flash('#ffb060', 0.25);
    this.splat(x, y, 16, '#111111');
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = dist(x, y, e.x, e.y);
      if (d > r + e.r) continue;
      this.damageEnemy(e, dmg * 3, 60, Math.atan2(e.y - y, e.x - x), 320, { knockdown: true, hitstop: 0.02, shake: 0.1, melee: false, launch: 120 });
    }
    const p = this.player;
    if (!fromPlayer && dist(x, y, p.x, p.y) < r + p.r) this.damagePlayer(dmg, Math.atan2(p.y - y, p.x - x));
    for (const pr of this.props) {
      if (pr.dead) continue;
      if (dist(x, y, pr.x, pr.y) < r + pr.r) this.damageProp(pr, 10, Math.atan2(pr.y - y, pr.x - x));
    }
  }

  damageProp(pr: Prop, dmg: number, dir: number) {
    if (pr.dead || pr.hp <= 0) return;
    pr.hp -= dmg;
    pr.flash = 0.08;
    this.particles.burst(pr.x, pr.y - 4, 5, pr.kind === 'crate' ? '#b07a3c' : pr.kind === 'pot' ? '#e49a63' : pr.kind === 'computer' ? '#46e2ff' : pr.kind === 'table' ? '#8a5a2b' : '#c0392b', 90, 0.4);
    this.sfx.hit();
    if (pr.hp <= 0) {
      pr.dead = true;
      if (pr.kind === 'pot') { this.carry.shatterPotPhysics(this, pr.x, pr.y - 4, pr.y, dir, false); return; }
      if (pr.kind === 'computer') { this.carry.shatterComputerPhysics(this, pr.x, pr.y - 6, pr.y, dir, false); return; }
      if (pr.kind === 'table') { this.carry.splitTable(this, pr.x, pr.y - 5, pr.y, dir, false); return; }
      if (pr.kind === 'crate') {
        this.particles.burst(pr.x, pr.y - 4, 16, '#b07a3c', 140, 0.6, 2, 3);
        for (let i = 0; i < 3; i++) this.particles.limb(pr.x, pr.y - 4, dir, 120, '#8a5a2b', 4);
        const n = 1 + (Math.random() < 0.5 ? 1 : 0);
        for (let i = 0; i < n; i++) {
          const k: Pickup['kind'][] = ['ammoP', 'ammoP', 'hp', 'focus', this.player.hasRifle ? 'ammoR' : 'ammoP'];
          this.spawnPickup(pr.x, pr.y, k[Math.floor(Math.random() * k.length)]);
        }
        this.sfx.kick();
      } else {
        pr.dead = false;
        pr.flash = 0.5;
        this.pendingBooms.push({ x: pr.x, y: pr.y, t: 0.5, r: 38, dmg: 2, fromPlayer: false });
        this.sfx.beep();
      }
    }
  }

  // ============================== STREET BAT & SHOWTIME ATRAKSI ==============================
  batPlan: string[] = []; batPlanI = 0; batPlanIdx = 0;
  batFlourishKind: 'twirl' | 'toss' | 'call' | 'back' = 'twirl';
  batFlourishIdx = 0;
  /** RMB bat: ayunan pamungkas & atraksi berbobot (Bat Flip Smash, Call Your Shot Homer, Corkscrew Tornado, Windmill Line Drive, Behind-the-Back Smash). */
  batPowerSwing(): string {
    const p = this.player;
    const air = this.nearestEnemy(p.x, p.y, 40, p.aim, 1.3);
    const down = this.enemies.find((e) => !e.dead && e.spawnT <= 0 && e.z <= 1 && (e.down > 0 || e.state === 'down') && dist(e.x, e.y, p.x, p.y) < 30 + e.r && Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), p.aim)) < 1.4);
    let key: string;
    if (air && this.isEnemyAirborne(air) && Math.random() < 0.65) key = 'B_SPIKE';
    else if (down && Math.random() < 0.7) key = 'SB_POUND';
    else {
      const pool = ['B_TOSSCATCH', 'BP_HOMER', 'B_CORKSCREW', 'BP_LINE', 'BP_BACK', 'BP_LOFT'].filter((x) => x !== this.batLastPower);
      key = pool[Math.floor(Math.random() * pool.length)];
    }
    this.batLastPower = key;
    if (MOVES[key]?.showName) this.say(MOVES[key].name, '#ffd27f', 2, 0.8);
    return key;
  }
  /** Tempo ayunan Baseball Bat seimbang (1.28x): lebih berbobot dari pukulan tangan kosong, namun tetap gesit & responsif! */
  batSpeed() { return 1.28; }
  batSpamHit() {
    this.batSpam++; this.batSpamT = 1.6;
    const n = this.batSpam;
    if (n === 12 || n === 25 || n === 40) {
      this.say(n === 12 ? 'SLUGGER RHYTHM!' : n === 25 ? 'GRAND SLAMMER!' : 'BASEBALL GOD!', '#ff6a4a', 2, 1.0);
      this.flash('#ffd27f', 0.12); this.shake(0.4); this.slow(0.12, 0.35);
    }
  }
  updateBat(dt: number) {
    const p = this.player;
    if (this.batSpamT > 0) { this.batSpamT -= dt; if (this.batSpamT <= 0) this.batSpam = 0; }
    if (this.batTauntT > 0) this.batTauntT -= dt;
    if (p.weapon !== 'bat') return;
    if (this.input.hit('t') && this.time - this.batEquippedAt > 0.08 && p.attackPhase === 'none' && this.batTauntT <= 0) {
      const kinds = ['twirl', 'toss', 'call', 'back'] as const;
      this.batFlourishKind = kinds[this.batFlourishIdx++ % kinds.length];
      this.batTauntT = 0.85;
      const labels: Record<typeof this.batFlourishKind, string> = {
        twirl: 'ATRAKSI: WINDMILL SPIN!',
        toss: 'ATRAKSI: BAT FLIP!',
        call: 'CALL YOUR SHOT!',
        back: 'ATRAKSI: OPER PUNGGUNG!',
      };
      this.say(labels[this.batFlourishKind], '#ffd27f', 2, 0.82);
      p.focus = Math.min(300, p.focus + 30);
      this.sfx.whoosh();
      this.particles.ring(p.x, p.y - 7, 2, 13, '#ffd27f', 0.2, 1);
    }
  }

  // ============================== SILAT SCENES (The Raid) ==============================
  silatPending: { id: number; t: number; kind?: string } | null = null;
  lastDodgeAt = -9;
  /** best victim in front: auto = needs a softened target (staggered / low hp / 6+ fist hits) */
  silatTarget(forced: boolean): Enemy | null {
    const p = this.player;
    let best: Enemy | null = null, bd = 30;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.boss || e.z > 1 || e.down > 0) continue;
      const d = dist(e.x, e.y, p.x, p.y) - e.r;
      if (d > bd) continue;
      if (Math.abs(angleDiff(Math.atan2(e.y - p.y, e.x - p.x), p.aim)) > 1.2) continue;
      if (!forced && !(e.stagger > 0 || e.hp <= e.maxHp * 0.4 || (this.fistHits >= (this.player.weapon === 'bat' ? 10 : 6) && this.time - this.fistHitT < 2))) continue;
      bd = d; best = e;
    }
    if (!forced && this.silatCd > 0) return null;
    return best;
  }
  trySilat(target: Enemy | null, forced: boolean, kind?: string, link = false): boolean {
    const p = this.player;
    if (this.silat || p.fatality || p.stunT > 0 || p.airborne || (p.weapon !== 'fist' && p.weapon !== 'nunchaku' && p.weapon !== 'bat') || p.rageDash || p.focusDash) return false;
    const W = p.weapon === 'nunchaku' ? 'nunchaku' : p.weapon === 'bat' ? 'bat' : 'fist';
    const e = target ?? this.silatTarget(forced);
    if (!e) { if (forced && !target) { this.texts.add(p.x, p.y - 22, 'NO GRAB', '#777', 1, 0.4); } return false; }
    if (!link && forced && !target && this.silatCd > 0 && e.stagger <= 0) { this.texts.add(p.x, p.y - 22, `GRAB ${this.silatCd.toFixed(1)}S`, '#777', 1, 0.4); return false; }
    // pick the scene: parry -> arm lock, enemy facing away -> back take, else a random one (never the same twice)
    const behind = Math.cos(e.aim - Math.atan2(e.y - p.y, e.x - p.x)) > 0.3;
    // DOUBLE: a second enemy hugging us -> hit both at once (70%)
    let e2: Enemy | null = null;
    if (!kind) {
      let bd2 = 24;
      for (const o of this.enemies) {
        if (o === e || o.dead || o.spawnT > 0 || o.boss || o.z > 1 || o.down > 0) continue;
        const d2 = dist(o.x, o.y, p.x, p.y) - o.r;
        if (d2 < bd2) { bd2 = d2; e2 = o; }
      }
      if (e2 && Math.random() < 0.7) { const dp = SILAT.filter((s) => s.double && (s.weapon ?? 'fist') === W && s.id !== this.silatLast); kind = dp[Math.floor(Math.random() * dp.length)].id; }
      else e2 = null;
    }
    if (W === 'nunchaku' && kind) kind = kind === 'counter' ? 'n_counter' : kind === 'armbar' ? 'n_triangle' : kind;
    if (W === 'bat' && kind) kind = kind === 'counter' ? 'b_counter' : kind === 'armbar' ? 'b_disarm' : kind;
    let id = kind ?? (behind && Math.random() < 0.7 ? (W === 'nunchaku' ? 'n_choke' : W === 'bat' ? 'b_choke' : 'backtake') : '');
    if (!id) { const pool = SILAT.filter((s) => (s.weapon ?? 'fist') === W && s.id !== this.silatLast && s.id !== 'armbar' && s.id !== 'counter' && s.id !== 'n_counter' && s.id !== 'b_counter' && s.id !== 'b_disarm' && !s.double); id = pool[Math.floor(Math.random() * pool.length)].id; }
    let sc = SILAT.find((s) => s.id === id)!;
    const D = dist(e.x, e.y, p.x, p.y);
    if (link) {
      // acrobatic transition into the next sequence: flip across the gap, land in front of the next victim
      const L = LINK_FLIPS[Math.floor(Math.random() * LINK_FLIPS.length)];
      sc = { ...sc, beats: [{ d: 0.26, pp: L.pp, pt: L.pt, ep: 'hurt', f: 9, step: Math.max(0, D - 9), pz: 16, acro: true, spin: W === 'nunchaku' ? 28 : undefined, name: L.name }, ...sc.beats] };
    }
    this.silatLast = id;
    const dir = Math.atan2(e.y - p.y, e.x - p.x);
    const f0 = link ? D : clamp(D, 6, 14);
    // QUICK takes: half duration — always rolled 40%, 70% when a crowd is around (efficient)
    const crowd = this.enemies.filter((o) => !o.dead && o !== e && o !== e2 && dist(o.x, o.y, p.x, p.y) < 70).length;
    const quick = Math.random() < (crowd >= 2 ? 0.7 : 0.4);
    const rel = (o: Enemy) => { const dx = o.x - p.x, dy = o.y - p.y; return { f: dx * Math.cos(dir) + dy * Math.sin(dir), s: -dx * Math.sin(dir) + dy * Math.cos(dir), z: 0, r: 0 }; };
    const r2 = e2 ? rel(e2) : { f: 0, s: 0, z: 0, r: 0 };
    this.silat = { sc, id: e.id, i: -1, t: 0, dir, from: { f: f0, s: 0, z: 0, r: 0 }, cur: { f: f0, s: 0, z: 0, r: 0 }, px: p.x, py: p.y, hitDone: false, dur: quick ? 0.5 : 1, id2: e2 ? e2.id : null, from2: { ...r2 }, cur2: { ...r2 } };
    if (e2) { e2.stagger = 10; e2.state = 'stagger'; e2.kx = e2.ky = e2.vx = e2.vy = 0; e2.stun = 0; e2.fuse = -1; e2.tele = null; this.releaseToken(e2); }
    if (this.sfNunOn) { this.sfNun.cur = null; this.sfNun.buffered = false; this.sfNun.idx = 0; this.sfNun.comboTimer = 0; }
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.dashT = 0; p.vx = p.vy = p.kx = p.ky = 0; p.moving = false; p.running = false; p.runT = 0;
    p.aim = dir; p.facing = Math.cos(dir) >= 0 ? 1 : -1;
    e.stagger = 10; e.state = 'stagger'; e.kx = e.ky = e.vx = e.vy = 0; e.stun = 0; e.fuse = -1; e.tele = null; this.releaseToken(e);
    for (const o of this.enemies) if (o !== e && !o.dead) o.attackCd = Math.max(o.attackCd, 1.2);
    this.cinematic = true; this.zoomTarget = (e2 ? 1.2 : 1.35) * BASE_ZOOM;
    this.fistHits = 0;
    const ttl = (quick ? 'QUICK ' : '') + sc.title;
    this.say(link ? `LINK x${this.silatChainN + 1} - ${ttl}` : ttl, e2 ? '#ff6a4a' : '#ffd27f', 2, quick ? 0.7 : 1.0);
    this.sfx.whoosh();
    this.silatBeat(0);
    return true;
  }
  silatBeat(i: number) {
    const S = this.silat!, p = this.player;
    S.i = i; S.t = 0; S.hitDone = false;
    const b = S.sc.beats[i];
    if (b.turn) { S.dir += Math.PI; S.cur.f = -S.cur.f; S.cur.s = -S.cur.s; S.cur2.f = -S.cur2.f; S.cur2.s = -S.cur2.s; p.aim = S.dir; p.facing = Math.cos(S.dir) >= 0 ? 1 : -1; }
    S.from = b.snap ? { f: b.f, s: b.s ?? 0, z: b.z ?? 0, r: b.r ?? 0 } : { ...S.cur };
    S.from2 = { ...S.cur2 };
    S.px = p.x; S.py = p.y;
    if (b.name) this.texts.add(p.x, p.y - 30, b.name, '#ffffff', 1, 0.6);
  }
  updateSilat(dt: number) {
    const S = this.silat!, p = this.player;
    const e = this.enemies.find((en) => en.id === S.id);
    if (!e || e.dead) { this.endSilat(e ?? null); return; }
    S.t += dt;
    const b = S.sc.beats[S.i];
    const u = clamp(S.t / (b.d * S.dur), 0, 1), k = u * u * (3 - 2 * u);
    // victim offset eased toward the beat target
    const T = { f: b.f, s: b.s ?? 0, z: b.z ?? 0, r: b.r ?? 0 };
    S.cur = { f: lerp(S.from.f, T.f, k), s: lerp(S.from.s, T.s, k), z: lerp(S.from.z, T.z, k), r: lerp(S.from.r, T.r, k) };
    // player step along the fight line
    if (b.step) { const nx = S.px + Math.cos(S.dir) * b.step * k, ny = S.py + Math.sin(S.dir) * b.step * k; if (this.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; } }
    const cd = Math.cos(S.dir), sd = Math.sin(S.dir);
    const ex = p.x + cd * S.cur.f - sd * S.cur.s, ey = p.y + sd * S.cur.f + cd * S.cur.s;
    if (this.isFree(ex, ey, e.r * 0.8)) { e.x = ex; e.y = ey; }
    const towards = Math.atan2(p.y - e.y, p.x - e.x);
    e.aim = b.away ? towards + Math.PI : towards; e.facing = Math.cos(e.aim) >= 0 ? 1 : -1;
    e.stagger = 10; e.down = 0; e.kx = e.ky = e.vx = e.vy = 0;
    e.scenePose = b.ep; e.sceneT = b.et ? lerp(b.et[0], b.et[1], k) : 0.5; e.sceneZ = S.cur.z; e.sceneRot = S.cur.r * e.facing;
    // player pose
    p.holdT = 0.1; p.holdPose = b.pp; p.holdPoseT = lerp(b.pt[0], b.pt[1], k);
    p.vx = p.vy = p.kx = p.ky = 0; p.moving = false; p.iframes = Math.max(p.iframes, 0.3);
    p.z = b.pz ? b.pz * Math.sin(Math.PI * u) : 0;
    if (p.weapon === 'nunchaku') {
      const LS = this.longMode ? 2.5 : 1;
      const sk = solvePose(this.playerStickOpts(b.pp, p.holdPoseT));
      let hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
      if (b.spin) { const ang = this.time * b.spin, sh = { x: p.x, y: p.y - 5 * LS - p.z }; hand = { x: sh.x + Math.cos(ang) * 7 * LS, y: sh.y + Math.sin(ang) * 5 * LS }; }
      if (this.sfNunOn) {
        this.sfNun.update(dt, p.x, p.y - 4 * LS - p.z, S.dir, this.time, 'idle', LS, hand);
        // api tetap hidup selama adegan kuncian — justru ini momen atraksinya
        if (this.fireOn) { const tp = this.sfNun.pts[5]; this.fireTrail.emit(tp.x, tp.y, this.sfNun.endSpeed, dt, 1.35); }
      }
      else this.nunchaku.update(hand, { x: Math.cos(S.dir), y: Math.sin(S.dir) }, dt, b.spin ?? 0, b.hit && !S.hitDone && u > 0.25 ? { x: Math.cos(S.dir) * 900, y: Math.sin(S.dir) * 500 } : null, true);
      if (b.spin && Math.random() < 0.3) this.sfx.chainRattle();
    }
    if (b.acro) {
      this.silatAcroT -= dt;
      if (this.silatAcroT <= 0) { this.silatAcroT = 0.035; this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: b.pp, poseT: p.holdPoseT }, '#9be7ff', p.lean); }
      if (u < 0.12 && Math.random() < 0.5) this.particles.smoke(p.x, p.y, 1, '#8a8a8a', 25, 0.35);
      if (Math.random() < 0.4) this.particles.lines(p.x, p.y - 6 - p.z, 1, '#ffffff', S.dir + Math.PI, 150);
    }
    this.slowT = Math.max(this.slowT, 0.05); this.slowFactor = Math.max(this.slowFactor, 0.8);
    this.camFocus = { x: (p.x + e.x) / 2, y: (p.y + e.y) / 2 - 4 };
    // second victim (DOUBLE scenes)
    let e2: Enemy | undefined;
    if (S.id2 !== null) {
      e2 = this.enemies.find((en) => en.id === S.id2);
      if (!e2 || e2.dead) { if (e2) { e2.scenePose = undefined; e2.sceneZ = 0; e2.sceneRot = 0; } S.id2 = null; e2 = undefined; }
    }
    if (e2) {
      const T2 = { f: b.f2 ?? S.from2.f, s: b.s2 ?? 0, z: b.z2 ?? 0, r: b.r2 ?? 0 };
      S.cur2 = { f: lerp(S.from2.f, T2.f, k), s: lerp(S.from2.s, T2.s, k), z: lerp(S.from2.z, T2.z, k), r: lerp(S.from2.r, T2.r, k) };
      const x2 = p.x + cd * S.cur2.f - sd * S.cur2.s, y2 = p.y + sd * S.cur2.f + cd * S.cur2.s;
      if (this.isFree(x2, y2, e2.r * 0.8)) { e2.x = x2; e2.y = y2; }
      const tw2 = Math.atan2(p.y - e2.y, p.x - e2.x);
      e2.aim = b.away2 ? tw2 + Math.PI : tw2; e2.facing = Math.cos(e2.aim) >= 0 ? 1 : -1;
      e2.stagger = 10; e2.down = 0; e2.kx = e2.ky = e2.vx = e2.vy = 0;
      e2.scenePose = b.ep2 ?? b.ep; e2.sceneT = b.et2 ? lerp(b.et2[0], b.et2[1], k) : 0.5; e2.sceneZ = S.cur2.z; e2.sceneRot = S.cur2.r * e2.facing;
      this.camFocus = { x: (e.x + e2.x) / 2, y: (e.y + e2.y) / 2 - 4 };
    }
    // impact lands at 45% of the beat
    if (!S.hitDone && u >= 0.45 && (b.hit || b.hit2)) {
      S.hitDone = true;
      if (e2 && b.hit2) this.silatHit(e2, b.hit2, S);
      if (b.hit) this.silatHit(e, b.hit, S);
      if (e.dead) { if (e2 && !e2.dead && S.id2 !== null) { e2.scenePose = undefined; e2.sceneZ = 0; e2.sceneRot = 0; if (e2.stagger > 1) e2.stagger = 0; } this.endSilat(e); return; }
    }
    if (u >= 1) {
      if (S.i + 1 < S.sc.beats.length) this.silatBeat(S.i + 1);
      else this.endSilat(e);
    }
  }
  silatHit(e: Enemy, h: SilatHit, S: NonNullable<Game['silat']>) {
    const p = this.player;
    const hx = e.x + Math.sin(e.sceneRot ?? 0) * 4, hy = e.y - 7 - (e.sceneZ ?? 0);
    const a = S.dir;
    if (p.weapon === 'buster' && h.fx !== 'block') {
      const heavyHit = !!h.final || this.bu.punisher;
      this.sfx.axeHit(heavyHit); this.sfx.slashHit(heavyHit);
      if (heavyHit) this.sfx.slam();
      this.particles.ring(hx, hy, 2, heavyHit ? 22 : 13, MAKO, 0.18, 1, true);
      this.particles.spark(hx, hy, 6, MAKO2, Math.atan2(hy - p.y, hx - p.x), 0.9, 240);
      this.particles.burst(hx, hy, 4, '#ffffff', 160, 0.35, 1, 2);
      this.bu.addLimit((heavyHit ? 7 : 4.5) * (1 + 0.15 * this.bu.momentum));
      if (this.bu.momentum >= 3) this.flash(MAKO, 0.05);
    }
    if (p.weapon === 'shotgun' && h.fx !== 'block') { this.sfx.axeHit(!!h.final); this.sfx.leverClack(); this.particles.ring(hx, hy, 2, h.final ? 18 : 11, '#ffffff', 0.16, 1, true); this.particles.burst(hx, hy, 3, '#b8c1cb', 120, 0.4, 1, 3); this.batSpamHit(); }
    if (p.weapon === 'bat' && h.fx !== 'block') { this.sfx.batCrack(); this.sfx.axeHit(!!h.final); this.particles.ring(hx, hy, 2, h.final ? 18 : 11, '#ffffff', 0.16, 1, true); this.particles.burst(hx, hy, 3, '#e6b877', 120, 0.4, 1, 3); this.batSpamHit(); }
    if (p.weapon === 'nunchaku' && h.fx !== 'block') { this.sfx.nunchakuHit(!!h.final); const tp = this.sfNunOn ? this.sfNun.pts[5] : this.nunchaku.tip(); if (tp) this.particles.ring(tp.x, tp.y, 1, 8, '#ffffff', 0.14, 1, true); if (this.fireOn) this.fireTrail.burst(hx, hy, a, h.final ? 1 : 0.5); }
    if (h.fx === 'block') {
      const bx = (p.x + e.x) / 2, by = p.y - 7;
      this.texts.add(bx, by - 18, h.word, '#9be7ff', 1, 0.5);
      this.particles.ring(bx, by, 2, 12, '#9be7ff', 0.18, 1); this.particles.spark(bx, by, 10, '#9be7ff', a + Math.PI, 1.2, 220);
      this.sfx.parry(); this.hitstop = Math.max(this.hitstop, 0.08); this.shake(0.3);
      return;
    }
    // Hantaman terakhir TIDAK memakai teks mengambang: katanya sudah tampil sekali di
    // strip atas (lihat say() di bawah). Dulu keduanya muncul bersamaan -> "TAKEDOWN!" dobel menutupi aksi.
    if (!h.final) this.texts.hit(e.x + rnd(-5, 5), e.y - 26 - (e.sceneZ ?? 0), h.word, '#ffffff', 1, 0.55);
    this.hitstop = Math.max(this.hitstop, (h.stop ?? 0.05) * (S.dur < 1 ? 0.6 : 1));
    this.shake(h.shake ?? 0.25);
    e.flash = 0.05; e.sqx = 1.3; e.sqy = 0.7;
    this.gunfx.hitSpark(hx, hy, a + rnd(-0.4, 0.4), e.y, !!h.final || h.fx === 'slam');
    this.particles.impact(hx, hy, h.final ? 5 : 3, '#ffffff');
    if (h.fx !== 'sweep') { this.particles.blood(hx, hy, h.final ? 6 : 3, a, 110); this.blood.spray(hx, hy, a, h.dmg * 0.45, !!h.final); }
    if (h.fx === 'slam') { this.particles.shockwave(e.x, e.y, 16, '#ffffff', 0.24); this.particles.smoke(e.x, e.y, 5, '#8a8a8a', 32, 0.4); this.particles.burst(e.x, e.y, 4, this.pal.wallTop, 100, 0.35, 2, 3); this.sfx.slam(); }
    if (h.fx === 'snap') { this.particles.ring(hx, hy, 2, 9, '#ffffff', 0.14, 1, true); this.sfx.parry(); this.flash('#ffffff', 0.05); }
    if (h.fx === 'knee' || h.fx === 'head') this.sfx.kick(); else if (h.fx === 'elbow' || h.fx === 'punch') this.sfx.punch(); else if (h.fx === 'sweep') this.sfx.whoosh();
    this.sfx.hit(); if (h.final) this.sfx.heavy();
    this.addCombo(); this.addOfa(h.dmg * 0.15);
    p.focus = Math.min(300, p.focus + 6 * this.stats.focusGain);
    const dmg = h.dmg * this.stats.meleeDmg;
    if (!h.final) { e.hp = Math.max(1, e.hp - dmg); e.structure += 10; return; }
    // the last blow: real damage, may kill (ragdoll) — otherwise the victim is left on the floor
    const second = S.id2 !== null && e.id === S.id2;
    if (!second) this.slow(0.32 * (S.dur < 1 ? 0.6 : 1), 0.25);
    this.zoomKick = Math.max(this.zoomKick, 0.09); this.flash('#ffffff', 0.14);
    this.particles.shockwave(e.x, e.y - 4, 30, '#ffd27f', 0.35); this.particles.ring(hx, hy, 3, 20, '#ffffff', 0.22, 2, true);
    if (!second) this.say(S.id2 !== null ? 'DOUBLE KO!' : this.silatChainN >= 2 ? 'GRAND FINALE!' : h.word, this.silatChainN >= 2 ? '#ff6a4a' : '#ffd27f', 3, 1.0);
    if (S.id2 !== null && !second) this.score += 80;
    if (!second && this.silatChainN >= 2) { this.score += 100; this.slow(0.45, 0.2); }
    e.scenePose = undefined; e.sceneZ = 0; e.sceneRot = 0; e.stagger = 0;
    const R = S.sc.release;
    this.damageEnemy(e, dmg, 80, a, R.kb, { melee: true, knockdown: true, hitstop: h.stop ?? 0.1, shake: h.shake ?? 0.6, launch: R.launch });
    if (!e.dead && R.down && R.kb < 200) { e.down = e.boss ? 0.7 : 1.3; e.state = 'down'; e.pose = 'down'; e.fuse = -1; }
    this.score += 40;
  }
  endSilat(e: Enemy | null) {
    const p = this.player;
    if (e) { e.scenePose = undefined; e.sceneZ = 0; e.sceneRot = 0; if (!e.dead && e.stagger > 1) { e.stagger = 0; e.state = 'chase'; e.pose = 'idle'; e.attackCd = Math.max(e.attackCd, 0.5); } }
    const e2 = this.silat && this.silat.id2 !== null ? this.enemies.find((en) => en.id === this.silat!.id2) : null;
    if (e2) { e2.scenePose = undefined; e2.sceneZ = 0; e2.sceneRot = 0; if (!e2.dead && e2.stagger > 1) { e2.stagger = 0; e2.state = 'chase'; e2.pose = 'idle'; e2.attackCd = Math.max(e2.attackCd, 0.5); } }
    this.silat = null; this.silatCd = 2.0;
    this.silatLinkT = 0.75;
    p.holdT = 0; p.z = 0; p.iframes = Math.max(p.iframes, 0.4);
    this.cinematic = false; this.zoomTarget = BASE_ZOOM; this.camFocus = null;
  }
  /** next victim for a LINK (acrobatic transition) after a sequence */
  silatLinkTarget(): Enemy | null {
    const p = this.player;
    let best: Enemy | null = null, bd = 95;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0 || e.boss || e.z > 1 || e.down > 0) continue;
      const d = dist(e.x, e.y, p.x, p.y);
      if (d < bd && this.hasLOSFrom(p.x, p.y, e.x, e.y)) { bd = d; best = e; }
    }
    return best;
  }
  hasLOSFrom(x0: number, y0: number, x1: number, y1: number) { return lineOfSight(this.level, x0, y0, x1, y1); }
  trySilatLink(): boolean {
    const e = this.silatLinkTarget();
    if (!e) return false;
    const n = this.silatChainN + 1;
    this.silatLinkT = 0;
    const ok = this.trySilat(e, true, undefined, true);
    if (ok) this.silatChainN = n;
    return ok;
  }

  updateSilatPending(dt: number) {
    if (!this.silatPending) return;
    this.silatPending.t -= dt;
    if (this.silatPending.t > 0) return;
    const e = this.enemies.find((en) => en.id === this.silatPending!.id);
    const pk = this.silatPending.kind;
    this.silatPending = null;
    if (e && !e.dead) { this.trySilat(e, true, pk ?? 'armbar'); return; }
  }

  enemyMeleeHit(e: Enemy, dmg: number, range: number, arc: number, knockdown: boolean) {
    const p = this.player;
    const side = !!this.level.sideView;
    const a = side && Math.abs(p.y - e.y) <= 26 ? (p.x >= e.x ? 0 : Math.PI) : Math.atan2(p.y - e.y, p.x - e.x);
    if (side) {
      if (Math.abs(p.y - e.y) > 22) return;
      if (Math.abs(p.x - e.x) > range + p.r + 3) return;
      if (arc < 3 && (p.x - e.x) * Math.cos(e.aim) < -6) return;
    } else {
      const d = dist(e.x, e.y, p.x, p.y);
      if (d > range + p.r) return;
      if (Math.abs(angleDiff(a, e.aim)) > arc) return;
    }
    // fair enemy strikes too: for normal punches/kicks the striking limb (from the enemy's own posed skeleton)
    // must actually reach the player's body; area attacks (brute slam, charges, sweeps with arc >= PI) skip this
    const isLimbStrike = e.pose === 'punch' || e.pose === 'cross' || e.pose === 'jab' || e.pose === 'hook' || e.pose === 'uppercut' || e.pose === 'elbow' || e.pose === 'kick' || e.pose === 'roundhouse' || e.pose === 'sidekick' || e.pose === 'palm';
    if (arc < 3 && isLimbStrike) {
      const sk = solvePose({ x: e.x, y: e.y, c: e.color, c2: e.color2, scale: e.scale, facing: e.facing, aim: e.aim, walk: e.walk, moving: false, pose: e.pose, t: clamp(e.poseT, 0.38, 0.56), acc: 'none', weapon: 'none', flash: false, alpha: 1, outline: null, eyes: '#000', time: this.time, lean: { x: Math.cos(e.aim), y: side ? 0 : Math.sin(e.aim) }, sideView: side });
      const j = (e.pose === 'kick' || e.pose === 'roundhouse' || e.pose === 'sidekick')
        ? sk.ffoot
        : e.pose === 'jab'
          ? sk.fhand
          : e.pose === 'palm'
            ? (Math.hypot(e.x + sk.fhand.x - p.x, e.y + sk.fhand.y - e.z - (p.y - 6)) < Math.hypot(e.x + sk.bhand.x - p.x, e.y + sk.bhand.y - e.z - (p.y - 6)) ? sk.fhand : sk.bhand)
            : sk.bhand;
      const jx = e.x + j.x, jy = e.y + j.y - e.z;
      const hitR = 5.5 * e.scale + 2.5;
      let dmin = 1e9;
      for (let k = 0; k <= 4; k++) { const yy = p.y - 13 + (14 * k) / 4 - p.z; dmin = Math.min(dmin, Math.hypot(jx - p.x, jy - yy)); }
      if (dmin > hitR + p.r + 2) return;
    }
    if (p.parryT > 0 && !(e.boss || (e.kind as string) === 'duelist')) { this.perfectParry(e, a); return; }
    if (p.dashT > 0 && (p.weapon === 'fist' || p.weapon === 'nunchaku' || p.weapon === 'bat') && !e.boss && !this.silat && !p.fatality) { if (this.time - this.lastDodgeAt > 0.45) { this.lastDodgeAt = this.time; this.say('DODGE!', '#9be7ff', 2, 0.6); this.slow(0.15, 0.3); } return; }
    if ((p.z > 12 || (side && p.y < e.y - 16 && !p.svGrounded)) && !e.boss) { this.texts.add(p.x, p.y - 26 - p.z, 'JUMPED!', '#9be7ff', 1, 0.5); return; } // leapt clean over a sweep/strike
    // HEAVY PUNCH: kadang musuh jago menghantam penuh tenaga sampai pemain terpental jauh
    const punchy = e.pose === 'punch' || e.pose === 'cross' || e.pose === 'hook' || e.pose === 'uppercut' || e.pose === 'palm' || e.pose === 'jab' || e.pose === 'elbow';
    const heavyChance = e.boss ? .3 : e.elite || e.kind === 'fighter' || e.kind === 'brute' || e.kind === 'monk' ? .26 : .16;
    if (punchy && Math.random() < heavyChance) {
      const hp0 = p.hp;
      this.damagePlayer(dmg * 1.7, a, true);
      if (p.hp < hp0) {
        p.kx += Math.cos(a) * 430; if (!side) p.ky += Math.sin(a) * 430;
        if (side) { p.svVy = -175; p.svGrounded = false; p.airborne = true; }
        else p.vz = Math.max(p.vz, 120);
        p.stunT = Math.max(p.stunT, .55);
        p.attackPhase = 'none'; p.buffered = null; p.comboStr = '';
        e.kx += Math.cos(e.aim) * 60;
        this.texts.add(e.x, e.y - 26, 'HEAVY PUNCH!', '#ff4a3d', 2, .7);
        this.particles.shockwave(p.x, p.y - 7, 20, '#ff6a4a', .25);
        this.particles.spark(p.x, p.y - 8, 12, '#ffd27f', a, 1, 240);
        this.flash('#ffffff', .08); this.shake(.6); this.slow(.12, .35);
        this.hitstop = Math.max(this.hitstop, .09);
        this.sfx.slam();
      }
      return;
    }
    this.damagePlayer(dmg, a, knockdown);
  }

  perfectParry(e: Enemy, a: number) {
    const p = this.player;
    if (e.boss || (e.kind as string) === 'duelist') { this.bossExchange.onEnemyContact(this, e); return; }
    if (this.mode === 'duel' && e.kind === 'duelist' && !this.clash) { this.brain.clashCd = 0; this.tryClash(e, false); return; }
    p.parryHit = true;
    this.sfx.parry();
    this.hitstop = Math.max(this.hitstop, 0.12);
    this.shake(0.5);
    this.slow(0.25, 0.3);
    this.flash('#ffffff', 0.18);
    this.particles.ring(p.x, p.y - 6, 4, 22, '#ffffff', 0.25, 2);
    this.particles.spark(p.x + Math.cos(a + Math.PI) * 6, p.y - 6, 14, '#9be7ff', a + Math.PI, 1.2, 240);
    this.particles.impact(p.x + Math.cos(a + Math.PI) * 8, p.y - 6, 10, '#9be7ff');
    e.structure += e.maxStructure * (e.boss ? 0.25 : 0.5);
    e.stun = Math.max(e.stun, 0.9); e.state = 'stun'; e.pose = 'hurt';
    e.kx -= Math.cos(a) * 200 * (1 - e.kbRes * 0.5); e.ky -= Math.sin(a) * 200 * (1 - e.kbRes * 0.5);
    e.attackCd = 1.2;
    if (e.structure >= e.maxStructure) this.staggerEnemy(e);
    this.say('PARRY!', '#35f0ff', 2, 0.7);
    p.focus = Math.min(300, p.focus + 45 * this.stats.focusGain);
    this.addOfa(5);
    this.addCombo();
  }

  damagePlayer(dmg: number, dir: number, knockdown = false) {
    const p = this.player;
    if (this.state !== 'playing') return;
    if (p.iframes > 0 || p.dashT > 0 || p.fatality || p.focusDash || this.silat) return;
    if (p.z > 12) { this.texts.add(p.x, p.y - 26 - p.z, 'JUMPED!', '#9be7ff', 1, 0.5); return; }
    if (p.rageOn && Math.random() < 0.5) { this.texts.add(p.x, p.y - 24, 'RAGE', '#ff2a2a', 1, 0.4); return; }
    if (this.boxOn && !p.fatality && p.attackPhase !== 'active' && Math.random() < this.boxDef.slip) {
      // peek-a-boo: kepala already bergerak, serangan lewat di atas sarung
      this.texts.hit(p.x, p.y - 24, 'SLIP!', this.boxDef.accent, 1, 0.5);
      this.particles.ring(p.x, p.y - 8, 3, 11, this.boxDef.accent, 0.18, 1);
      this.sfx.whoosh();
      p.focus = Math.min(300, p.focus + 6 * this.stats.focusGain);
      return;
    }
    if (p.weapon === 'buster' && !p.airborne && p.stunT <= 0 && !this.bu.omni) {
      this.bu.addLimit(Math.min(20, dmg * 6));
      const front = Math.abs(angleDiff(dir + Math.PI, p.aim)) < 1.7;
      if (this.bu.punisher && front && p.attackPhase !== 'active') {
        // PUNISHER: pedang lebar jadi perisai — tangkis lalu COUNTER otomatis
        this.texts.hit(p.x, p.y - 26, 'BLOCK!', '#ff9d6a', 1, 0.5);
        this.sfx.parry(); this.sfx.leverClack();
        this.particles.spark(p.x + Math.cos(p.aim) * 8, p.y - 8, 8, '#ffffff', p.aim, 1, 200);
        this.particles.ring(p.x + Math.cos(p.aim) * 6, p.y - 8, 3, 14, '#ff9d6a', 0.2, 1);
        this.hitstop = Math.max(this.hitstop, 0.08); this.shake(0.3);
        p.kx += Math.cos(dir) * 40; p.ky += Math.sin(dir) * 40;
        p.iframes = Math.max(p.iframes, 0.35);
        this.bu.counterGlow = 1;
        p.aim = dir + Math.PI; p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
        p.attackPhase = 'none'; p.buffered = null;
        this.startAttack('PXCOUNTER');
        this.slow(0.18, 0.35);
        return;
      }
    }
    if (this.stats.dodgeChance > 0 && Math.random() < this.stats.dodgeChance) {
      this.texts.add(p.x, p.y - 24, 'DODGE', '#9be7ff', 1, 0.6);
      this.particles.ring(p.x, p.y - 6, 4, 12, '#9be7ff', 0.2, 1);
      return;
    }
    p.hp -= dmg;
    p.iframes = 1.0; p.flash = 0.15; p.faceT = 0.6;
    p.kx += Math.cos(dir) * (knockdown ? 260 : 170); p.ky += Math.sin(dir) * (knockdown ? 260 : 170);
    p.stunT = Math.max(p.stunT, knockdown ? 0.35 : 0.18);
    p.attackPhase = 'none'; p.buffered = null; p.comboStr = ''; p.z = 0; p.runT = 0; p.chain = 0; p.rageDash = null; p.airMagnet = null; p.airLockId = -1; p.styleHeat = Math.max(0, p.styleHeat - 0.4); p.style = 'none'; p.styleStreak = 0; p.rhythm = [];
    if (p.weapon === 'foot') this.footwork.interrupt();
    this.shake(0.5); this.hitstop = Math.max(this.hitstop, 0.075);
    this.flash('#ff2020', 0.18);
    this.slow(0.2, 0.35);
    this.sfx.hurt();
    this.particles.blood(p.x, p.y - 6, 3, dir, 110);
    this.blood.spray(p.x, p.y - 6, dir, 1 + dmg * 0.6, knockdown || dmg >= 2);
    this.blood.pool(p.x, p.y + 1, 3);
    this.blood.screenSplat(knockdown || dmg >= 2);
    this.combo = 0;
    if (p.hp <= 0) this.die();
  }

  tryFocus() {
    const p = this.player;
    if (p.focus < 100) { this.texts.add(p.x, p.y - 22, 'NO FOCUS', '#5a7a80', 1, 0.5); this.sfx.empty(); return; }
    let e = this.nearestEnemy(p.x, p.y, 130, p.aim, 1.2);
    if (e && !lineOfSight(this.level, p.x, p.y, e.x, e.y)) e = this.nearestEnemy(p.x, p.y, 60, p.aim, 1.6);
    if (!e) { this.texts.add(p.x, p.y - 22, 'NO TARGET', '#5a7a80', 1, 0.5); this.sfx.empty(); return; }
    p.focus -= 100;
    const a = Math.atan2(e.y - p.y, e.x - p.x);
    const gap = e.r + p.r + 4;
    p.focusDash = { sx: p.x, sy: p.y, tx: e.x - Math.cos(a) * gap, ty: e.y - Math.sin(a) * gap, t: 0, id: e.id };
    p.attackPhase = 'none'; p.buffered = null; p.dashT = 0; p.aim = a; p.z = 0;
    e.stun = Math.max(e.stun, 0.6); e.state = 'stun';
    this.slow(0.6, 0.3);
    this.sfx.focus();
    this.flash(this.pal.accent, 0.2);
    this.particles.ring(p.x, p.y - 6, 2, 30, this.pal.accent, 0.3, 2);
  }

  /** V2 paints the terrain with STICK FIST's exact biome hexes (100% match); V1 keeps game2's zone palettes.
   *  Story levels walk the biome list by zone, survival picks one per arena seed — just like game1's endless. */
  applyPalette(rebuild = false) {
    const zone = this.level.zone;
    let pal: Palette;
    if (this.level.sideView && this.level.officeMap) {
      const th = OFFICE_THEMES[this.level.officeMap.theme] ?? OFFICE_THEMES.cyber_night;
      pal = {
        bg: th.skyTop,
        floor: th.roomBg,
        floorAlt: th.roomPanel,
        wall: th.wallShade,
        wallTop: th.wallFill,
        accent: th.accent,
        accent2: th.accent2,
      };
    } else {
      pal = this.level.outdoor ? MEADOW_PAL : this.v2 ? G1_BIOMES[(this.mode === 'survival' ? this.level.seed : zone) % G1_BIOMES.length] : ZONES[zone].pal;
    }
    if (pal === this.pal && !rebuild) return;
    this.pal = pal;
    this.levelCanvas = this.level.sideView ? (this.officeLook.on ? this.officeLook.build(this.level) : buildOfficeCanvas(this.level, this.pal)) : buildLevelCanvas(this.level, this.pal, this.v2);
    this.levelCtx = this.levelCanvas.getContext('2d')!;
    if (this.level.sideView) {
      const lv = this.level, lc = this.levelCtx;
      this.v1hit = new V1HitFx((x, y) => officeSolidAt(lv, x, y), (x, y, c, sz, floor) => {
        lc.fillStyle = c; lc.globalAlpha = floor ? 0.9 : 0.55;
        if (floor) { const w = sz + Math.floor(1 + Math.random() * 3); lc.fillRect(Math.round(x - w / 2), Math.round(y + Math.random() * 2), w, 1); }
        else if (!officeSolidAt(lv, x, y)) lc.fillRect(Math.round(x), Math.round(y), Math.min(2, sz), Math.min(2, sz));
        lc.globalAlpha = 1;
      });
    } else this.v1hit = null;
    this.canopyCanvas = this.level.outdoor ? buildMeadowCanopy(this.level) : null;
    if (this.level.outdoor) this.life.populate(this.level, (x, y) => solidAt(this.level, x, y));
    else { this.life.rabbits.length = 0; this.life.flies.length = 0; this.life.birds.length = 0; }
    this.pools = [];
    this.blood.resetFloor(this.levelCanvas.width, this.levelCanvas.height);
  }

  updateRevives(dt: number) {
    for (let i = this.revives.length - 1; i >= 0; i--) {
      const r = this.revives[i];
      r.t -= dt;
      if (r.t > 0) continue;
      this.revives.splice(i, 1);
      const ci = this.corpses.indexOf(r.c);
      if (ci < 0 || this.state !== 'playing') continue;
      const c = r.c; this.corpses.splice(ci, 1);
      const x = c.rd ? c.rd.x : c.x, y = c.rd ? c.rd.y : c.y;
      const e2 = this.spawnEnemyAt(r.kind, x, y, false);
      unstick(this.level, e2);
      e2.spawnT = 0; e2.color = r.color; e2.color2 = r.color2;
      e2.hp = Math.max(2, Math.round(e2.maxHp * 0.5));
      (e2 as unknown as { rose: boolean }).rose = true;
      e2.stun = 0.55; e2.state = 'stun'; e2.getupT = 0.5; e2.pose = 'getup'; e2.attackCd = 0.9;
      this.texts.hit(e2.x, e2.y - 22, 'BANGKIT LAGI!', '#ffd27f', 1, 0.9);
      this.particles.ring(e2.x, e2.y - 5, 2, 14, '#ffd27f', 0.25, 1);
      this.particles.smoke(e2.x, e2.y, 5, '#8a8a8a', 30, 0.5);
      this.sfx.land?.();
    }
  }
  /** Switches between the classic look (V1) and the crisp/ragdoll update (V2) so both can be compared live. */
  toggleV2() {
    this.v2 = !this.v2;
    this.applyPalette(true);
    try { localStorage.setItem(V2_KEY, this.v2 ? '1' : '0'); } catch { /* private mode */ }
    this.say(this.v2 ? 'V2 - CRISP PIXELS + RAGDOLL' : 'V1 - CLASSIC LOOK', this.v2 ? '#7df9ff' : '#9a9a9a', 2, 1.6);
    this.sfx.select();
    this.pushUI();
  }

  applySmoothClass() {
    try { document.body?.classList.toggle('smooth-mode', this.smoothMode); document.body?.classList.toggle('view-2d', this.view2d); } catch { /* ignore */ }
  }
  /** PROPORSI TINGGI: torso, tangan, kaki memanjang, kepala relatif lebih kecil. */
  toggleTall() {
    this.tallMode = !this.tallMode;
    setTallMode(this.tallMode);
    try { localStorage.setItem(TALL_KEY, this.tallMode ? '1' : '0'); } catch { /* ignore */ }
    this.say(this.tallMode ? 'TALL STICK - PROPORSI PANJANG' : 'NORMAL PROPORTIONS', this.tallMode ? '#9be7ff' : '#9a9a9a', 2, 1.4);
    this.sfx.select(); this.pushUI();
  }
  /** TAMPILAN: false = pixel asli, true = 2D mulus tanpa pixel */
  set2D(v: boolean) {
    if (this.view2d === v) return;
    this.view2d = v; this.glOff = false; this.glFrames = 0; this.pAvg = 16;
    try { localStorage.setItem('v2_kf_view2d', v ? '1' : '0'); } catch { /* ignore */ }
    this.applySmoothClass();
    this.say(v ? 'TAMPILAN 2D HALUS' : 'TAMPILAN PIXEL', v ? '#cfe8ff' : '#ffd27f', 2, 1.2);
    this.sfx.select(); this.pushUI();
  }
  toggle2D() { this.set2D(!this.view2d); }
  /** 3D FEEL: smoothing, font halus, bayangan gradient, cahaya radial. */
  toggleSmooth() {
    this.smoothMode = !this.smoothMode;
    setSmoothText(this.smoothMode);
    setDepthMode(this.smoothMode);
    this.applySmoothClass();
    try { localStorage.setItem(SMOOTH_KEY, this.smoothMode ? '1' : '0'); } catch { /* ignore */ }
    this.say(this.smoothMode ? '3D FEEL - SMOOTH' : 'PIXEL LOOK', this.smoothMode ? '#cfe8ff' : '#9a9a9a', 2, 1.4);
    this.sfx.select(); this.pushUI();
  }

  /** LONG-LIMB mode: badan/tangan/kaki 2.5x panjang normal (tombol L atau tombol HUD). */
  toggleLong() {
    this.longMode = !this.longMode;
    try { localStorage.setItem(LONG_KEY, this.longMode ? '1' : '0'); } catch { /* private mode */ }
    this.say(this.longMode ? 'LONG LIMBS - BADAN/TANGAN/KAKI x2.5' : 'NORMAL LIMBS', this.longMode ? '#ffd27f' : '#9a9a9a', 2, 1.6);
    this.sfx.select();
    this.pushUI();
  }

  /** V2 present: one nearest-neighbour blit per layer straight onto the display-sized backing store. An art pixel
   *  is scaled exactly once, which is what keeps edges hard — V1 scaled twice (zoom blit, then CSS) and that
   *  double resample is what made the image look soft and dirty at BASE_ZOOM 1.4. */
  present(sw: number, sh: number) {
    if (!this.v2) return;
    const dst = this.ctx;
    const bw = this.canvas.width || VIEW_W, bh = this.canvas.height || VIEW_H;
    dst.setTransform(1, 0, 0, 1, 0, 0);
    dst.globalAlpha = 1;
    // pengukur kecepatan: bila penghalus WebGL membuat game di bawah ~20 fps, otomatis pakai penghalus ringan
    const nowMs = performance.now();
    if (this.lastPresent) { const d = Math.min(200, nowMs - this.lastPresent); this.pAvg = this.pAvg * 0.92 + d * 0.08; }
    this.lastPresent = nowMs;
    if (this.view2d && !this.glOff) {
      this.glFrames++;
      if (this.glFrames > 36 && this.pAvg > 55 && !(window as unknown as { __keep2dgl?: boolean }).__keep2dgl) {
        this.glOff = true;
        this.say('2D RINGAN (PERANGKAT LAMBAT)', '#cfe8ff', 1, 1.6);
      }
    }
    if (this.view2d && !this.glOff) {
      if (!this.sgl) this.sgl = new SmoothGL();
      const a = this.sgl.draw(this.scene, sw, sh, bw, bh);
      if (a) {
        dst.imageSmoothingEnabled = true;
        dst.drawImage(a, 0, 0);
        this.glowPass(dst, bw, bh);
        const b = this.sgl.draw(this.hud, VIEW_W, VIEW_H, bw, bh);
        if (b) dst.drawImage(b, 0, 0); else dst.drawImage(this.hud, 0, 0, VIEW_W, VIEW_H, 0, 0, bw, bh);
        return;
      }
    }
    dst.imageSmoothingEnabled = this.smoothMode || this.view2d;
    dst.drawImage(this.scene, 0, 0, sw, sh, 0, 0, bw, bh);
    this.glowPass(dst, bw, bh);
    dst.drawImage(this.hud, 0, 0, VIEW_W, VIEW_H, 0, 0, bw, bh);
  }

  /** ONE FOR ALL (X) — game1's slow-mo super mode. The world drops to 30%, you run on real time,
   *  every strike auto-locks and blinks to the nearest enemy until the meter burns out. */
  tryOfa() {
    const p = this.player;
    if (p.ofaActive || p.fatality || p.focusDash || p.rageDash || p.holdT > 0 || p.stunT > 0) return;
    if (p.ofa < OFA_COST) { this.texts.add(p.x, p.y - 22, 'OFA NOT READY', '#3a6a78', 1, 0.5); this.sfx.empty(); return; }
    p.ofaActive = true;
    this.ofaReadySaid = true;
    this.say('ONE FOR ALL', OFA_COL, 3, 1.2);
    this.sfx.announce(); this.sfx.focus();
    this.flash(OFA_COL, 0.5); this.shake(0.8); this.slow(0.5, 0.25);
    this.particles.shockwave(p.x, p.y - 4, 60, OFA_COL, 0.5);
    this.particles.ring(p.x, p.y - 6, 2, 26, '#ffffff', 0.35, 2);
    p.iframes = Math.max(p.iframes, 0.6);
    if (!this.cinematic) this.zoomTarget = 0.94 * BASE_ZOOM;   // slight zoom-out, same as game1
  }

  /** ONE FOR ALL upkeep: auto-lock the nearest enemy, burn the meter, throw the lightning aura. */
  updateOfa(raw: number) {
    const p = this.player;
    if (!p.ofaActive) { if (this.lockTarget) this.lockTarget = null; return; }
    let best: Enemy | null = null, bd = 340;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const d = dist(e.x, e.y, p.x, p.y);
      if (d < bd) { bd = d; best = e; }
    }
    this.lockTarget = best;                       // recomputed every frame: a kill jumps the lock on
    p.ofa = Math.max(0, p.ofa - raw * OFA_DRAIN);
    if (Math.random() < 0.85) {
      const a = rnd(0, Math.PI * 2);
      this.particles.spark(p.x + Math.cos(a) * 6, p.y - 6 - p.z + Math.sin(a) * 6, 1, Math.random() < 0.6 ? '#7df9ff' : '#ffffff', a, 0.8, 45);
    }
    if (Math.random() < 0.35) this.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: p.aim, scale: 1 }, OFA_COL, { x: Math.cos(p.aim), y: Math.sin(p.aim) });
    if (p.ofa <= 0) {
      p.ofa = 0; p.ofaActive = false; this.lockTarget = null; this.ofaReadySaid = false;
      this.say('ONE FOR ALL END', '#8a8a8a', 1, 0.8);
      this.particles.ring(p.x, p.y - 6, 2, 18, OFA_COL, 0.3, 1);
      if (!this.cinematic) this.zoomTarget = BASE_ZOOM;
    }
  }

  /** Adds ONE FOR ALL charge and announces once when X becomes available. */
  addOfa(n: number) {
    const p = this.player;
    if (p.ofaActive || !(n > 0)) return;
    p.ofa = Math.min(100, p.ofa + n);
    if (p.ofa >= OFA_COST && !this.ofaReadySaid) {
      this.ofaReadySaid = true;
      this.say('ONE FOR ALL READY - PRESS X', OFA_COL, 2, 1.4);
      this.sfx.select();
    }
  }

  // ------------------------------------------------------------------ FATALITY
  tryFatality() {
    const p = this.player;
    if (p.fatality || p.stunT > 0) return;
    const ft = this.fatalityTarget();
    if (!ft) { this.texts.add(p.x, p.y - 22, 'NO TARGET', '#777', 1, 0.5); this.sfx.empty(); return; }
    const best = ft.e;
    const perfect = best.stagger > 0;
    if (!perfect && this.fatalityCd > 0) { this.texts.add(p.x, p.y - 22, `FATALITY IN ${this.fatalityCd.toFixed(1)}S`, '#777', 1, 0.5); this.sfx.empty(); return; }
    if (!perfect) this.fatalityCd = Game.FATALITY_CD;
    const a = this.level.sideView ? (best.x >= p.x ? 0 : Math.PI) : Math.atan2(best.y - p.y, best.x - p.x);
    const idx = this.fatalityIdx++;
    let kind: FatalityKind;
    if (p.weapon === 'nunchaku') { const pool: FatalityKind[] = ['n_garrote', 'n_drum', 'n_decap']; kind = best.boss ? (idx % 2 === 0 ? 'n_drum' : 'n_decap') : pool[idx % pool.length]; }
    else if (p.weapon === 'axe' || p.weapon === 'bat') kind = idx % 2 === 0 ? 'k_bisect' : 'k_behead';
    else if (p.weapon === 'dual') kind = idx % 2 === 0 ? 'k_behead' : 'k_impale';
    else if (p.weapon === 'katana' || p.weapon === 'takamura' || p.weapon === 'hayabusa') { const pool: FatalityKind[] = ['k_bisect', 'k_behead', 'k_impale']; kind = best.boss ? (idx % 2 === 0 ? 'k_impale' : 'k_bisect') : pool[idx % pool.length]; }
    else if (p.weapon === 'foot') kind = ft.far ? 'flykick' : 'spinkick';
    else if (ft.far || p.running || p.sinceDash < 0.25) { const far: FatalityKind[] = ['runpunch', 'flykick', 'kneedrop']; kind = far[idx % far.length]; }
    else if (best.boss) { const bossPool: FatalityKind[] = ['rush', 'uppercut', 'hammer', 'spinkick']; kind = bossPool[idx % bossPool.length]; }
    else if (best.down > 0) kind = 'stomp';
    else { const pool: FatalityKind[] = ['uppercut', 'neckbreak', 'flykick', 'spinkick', 'rush', 'hammer', 'runpunch', 'kneedrop', 'stomp']; kind = pool[idx % pool.length]; }
    const F: Fatality = { kind, id: best.id, t: 0, step: 0, stepT: 0, sx: p.x, sy: p.y, tx: best.x, ty: best.y, dir: a, hit: false, hitT: 0, perfect };
    p.fatality = F;
    p.attackPhase = 'none'; p.buffered = null; p.dashT = 0; p.parryT = 0; p.focusDash = null; p.z = 0; p.runT = 0; p.running = false;
    p.aim = a; p.attackAim = a; p.facing = Math.cos(a) >= 0 ? 1 : -1; p.vx = p.vy = p.kx = p.ky = 0; p.moving = false;
    p.holdPose = 'crouch'; p.holdPoseT = 0;
    if (['uppercut', 'rush', 'neckbreak', 'spinkick', 'hammer', 'stomp', 'n_garrote', 'n_drum', 'n_decap', 'k_bisect', 'k_behead', 'k_impale'].includes(kind)) {
      const gap = kind === 'stomp' ? best.r + 1 : kind === 'spinkick' || kind === 'n_decap' ? best.r + p.r + 9 : kind.startsWith('k_') ? best.r + p.r + 12 : best.r + p.r + 3;
      const nx = best.x - Math.cos(a) * gap, ny = best.y - Math.sin(a) * gap;
      if (this.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; }
      else {
        // tempat pemain terhalang: tarik korban ke depan pemain supaya pukulan benar-benar kena
        const ex = p.x + Math.cos(a) * gap, ey = this.level.sideView ? p.y : p.y + Math.sin(a) * gap;
        if (this.isFree(ex, ey, best.r)) { best.x = ex; best.y = ey; }
      }
      F.sx = p.x; F.sy = p.y;
    }
    if (kind === 'stomp') { best.down = 10; best.state = 'down'; best.pose = 'down'; }
    // grab the victim: freeze whatever they were doing
    best.stagger = 10; best.state = kind === 'stomp' ? 'down' : 'stagger'; best.pose = kind === 'stomp' ? 'down' : 'stagger'; best.kx = best.ky = 0; best.vx = best.vy = 0; best.z = 0; best.vz = 0;
    if (kind !== 'stomp') best.down = 0;
    best.stun = 0; best.fuse = -1; best.flinch = 0; best.tele = null; this.releaseToken(best);
    this.cinematic = true; this.zoomTarget = 1.45 * BASE_ZOOM; this.camFocus = { x: (p.x + best.x) / 2, y: (p.y + best.y) / 2 };
    this.slowFactor = 0.45; this.slowT = 0.2;
    p.iframes = 6;
    for (const o of this.enemies) if (o !== best && !o.dead) o.attackCd = Math.max(o.attackCd, 1.5);
    this.sfx.announce();
    if (perfect) this.say('PERFECT FATALITY', '#ffd700', 2, 1.0);
  }

  updateFatality(raw: number) {
    const p = this.player;
    const F = p.fatality!;
    const e = this.enemies.find((en) => en.id === F.id);
    const target = e && !e.dead ? e : null;
    if ((F.kind as string) === 'brutal') { this.brut.step(this, raw, F, target); return; }
    if ((F.kind as string) === 'lotus') { this.gates.step(this, raw, F, target); return; }
    this.slowT = Math.max(this.slowT, 0.2);
    this.slowFactor = F.hit ? 0.3 : 0.45;
    if (!F.hit && !target) { this.endFatality(); return; }
    F.t += raw;
    if (target && !F.hit) { target.stagger = 10; if (F.kind === 'stomp') { target.down = 10; target.pose = 'down'; } else target.pose = 'stagger'; F.tx = target.x; F.ty = target.y; }
    this.camFocus = { x: (p.x + F.tx) / 2, y: (p.y + F.ty) / 2 };
    const dir = F.dir, cd = Math.cos(dir), sd = Math.sin(dir);
    const since = F.t - F.hitT;
    // V2: fatality sepas game1 (~0,97 dtk total) — aftermath dipangkas, build lama tetap 1,6-1,7 dtk
    const ks = this.v2 ? 0.35 : 1;
    switch (F.kind) {
      case 'uppercut': {
        if (F.step === 0) {
          p.holdPose = 'crouch'; p.holdPoseT = Math.min(1, F.t / 0.4);
          if (F.t > 0.06 && Math.random() < 0.85) {
            const a = rnd(0, 6.3), r = rnd(8, 18);
            this.particles.add({ x: p.x + cd * 4 + Math.cos(a) * r, y: p.y - 5 + Math.sin(a) * r * 0.6, vx: -Math.cos(a) * 110, vy: -Math.sin(a) * 70, life: 0.2, c: Math.random() < 0.5 ? '#ffd700' : '#ffffff', k: 0, s: 1 });
          }
          if (F.t >= 0.42) {
            F.step = 1; F.stepT = 0;
            this.say('DRAGON UPPERCUT', '#ffd700', 2, 0.8);
            this.particles.dirBurst(p.x + cd * 6, p.y - 6, 14, '#ffffff', -Math.PI / 2, 0.45, 240, 0.35);
            this.particles.smoke(p.x, p.y, 8, '#888', 40, 0.5);
            this.particles.shockwave(p.x, p.y - 4, 22, '#ffd700', 0.28);
            this.finishBlow(target, F);
          }
        } else if (F.step === 1) {
          F.stepT += raw;
          p.holdPose = 'uppercut'; p.holdPoseT = clamp(0.32 + F.stepT * 2.2, 0.32, 0.72);
          this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'uppercut', poseT: p.holdPoseT }, '#ffd700', p.lean);
          if (since > 0.55) { F.step = 2; }
        } else { p.holdPose = 'flex'; p.holdPoseT = 0; }
        if (F.hit && since > 1.85 * ks) this.endFatality();
        break;
      }
      case 'runpunch': {
        if (F.step === 0) {
          const q = Math.min(1, F.t / 0.24);
          const bx = F.sx - cd * 18 * easeOut(q), by = F.sy - sd * 18 * easeOut(q);
          if (this.isFree(bx, by, p.r)) { p.x = bx; p.y = by; }
          p.holdPose = 'runpunch'; p.holdPoseT = 0.22 * q;
          if (q > 0.4 && Math.random() < 0.6) this.particles.smoke(p.x - cd * 3, p.y + 1, 1, '#888', 16, 0.3);
          if (F.t >= 0.26) { F.step = 1; this.sfx.dash(); this.say('IRON FIST', '#ffffff', 2, 0.7); this.particles.dirBurst(p.x, p.y, 10, '#cfcfcf', dir + Math.PI, 0.45, 120, 0.32); }
        } else if (F.step === 1) {
          p.holdPose = 'runpunch'; p.holdPoseT = clamp(0.3 + (F.t - 0.26) * 1.6, 0.3, 0.62);
          const o = { x: p.x, y: p.y, r: p.r };
          const m = moveWithCollision(this.level, o, cd * 460 * raw, sd * 460 * raw);
          p.x = o.x; p.y = o.y;
          this.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: p.aim, pose: 'runpunch', poseT: 0.5 }, '#ffffff', p.lean);
          this.particles.lines(p.x - cd * 8, p.y - 6, 2, '#ffffff', dir + Math.PI, 240);
          if (Math.random() < 0.8) this.particles.smoke(p.x - cd * 4, p.y + 1, 1, '#888', 22, 0.32);
          if (target && !F.hit && dist(p.x, p.y, target.x, target.y) < p.r + target.r + 4) this.finishBlow(target, F);
          if (F.hit && since > 0.14) F.step = 2;
          if (m.bx || m.by || F.t > 1.45) { if (!F.hit) { this.endFatality(); return; } F.step = 2; }
        } else {
          p.holdPose = since > 0.7 * ks ? 'flex' : 'runpunch'; p.holdPoseT = 0.55;
          if (since > 1.75 * ks) this.endFatality();
        }
        break;
      }
      case 'flykick': {
        if (F.step === 0) {
          p.holdPose = 'crouch'; p.holdPoseT = Math.min(1, F.t / 0.28);
          const q = Math.min(1, F.t / 0.24);
          const bx = F.sx - cd * 12 * easeOut(q), by = F.sy - sd * 12 * easeOut(q);
          if (this.isFree(bx, by, p.r)) { p.x = bx; p.y = by; }
          if (F.t >= 0.28) { F.step = 1; F.stepT = 0; this.sfx.launch(); this.say('FLYING KICK', '#ffffff', 2, 0.7); this.particles.smoke(p.x, p.y, 8, '#888', 34, 0.42); this.particles.dirBurst(p.x, p.y, 10, '#cfcfcf', dir + Math.PI, 0.45, 120, 0.32); }
        } else if (F.step === 1) {
          F.stepT += raw;
          p.holdPose = 'flying'; p.holdPoseT = 0.55;
          p.z = 16 * Math.sin(Math.min(1, F.stepT / 0.58) * Math.PI);
          const o = { x: p.x, y: p.y, r: p.r };
          const m = moveWithCollision(this.level, o, cd * 420 * raw, sd * 420 * raw);
          p.x = o.x; p.y = o.y;
          this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'flying', poseT: 0.55 }, '#ffffff', p.lean);
          this.particles.lines(p.x - cd * 10, p.y - 8 - p.z, 2, '#ffffff', dir + Math.PI, 220);
          if (target && !F.hit && dist(p.x, p.y, target.x, target.y) < p.r + target.r + 5) this.finishBlow(target, F);
          if ((F.hit && since > 0.14) || m.bx || m.by || F.stepT > 0.7) {
            p.z = 0;
            if (!F.hit) { this.endFatality(); return; }
            F.step = 2;
            this.particles.smoke(p.x, p.y, 8, '#888', 34, 0.42); this.sfx.land(); this.shake(0.28);
          }
        } else {
          p.holdPose = since > 0.75 * ks ? 'flex' : 'crouch';
          if (since > 1.75 * ks) this.endFatality();
        }
        break;
      }
      case 'neckbreak': {
        if (F.step === 0) {
          p.holdPose = 'grab'; p.holdPoseT = F.t / 0.4;
          if (target) { target.pose = 'stagger'; target.x = lerp(target.x, p.x + cd * (p.r + target.r + 2), 0.2); target.y = lerp(target.y, p.y + sd * (p.r + target.r + 2), 0.2); }
          if (F.t >= 0.42) { F.step = 1; this.sfx.whoosh(); this.say('NECK SNAP', '#ff6b6b', 2, 0.7); this.slow(0.18, 0.2); }
        } else if (F.step === 1) {
          p.holdPose = 'grab'; p.holdPoseT = 1;
          if (target) { target.aim += raw * 18 * p.facing; target.facing = Math.cos(target.aim) >= 0 ? 1 : -1; target.flash = 0.08; }
          if (F.t >= 0.62) { F.step = 2; this.finishBlow(target, F); this.particles.spark(p.x + cd * 8, p.y - 10, 10, '#ffffff', dir, 1.1, 200); }
        } else { p.holdPose = since > 0.65 * ks ? 'flex' : 'grab'; p.holdPoseT = 1; if (since > 1.7 * ks) this.endFatality(); }
        break;
      }
      case 'kneedrop': {
        // leap high (0-0.45 travel toward the target), drop with the knee onto them
        if (F.step === 0) {
          p.holdPose = 'crouch';
          if (F.t >= 0.18) { F.step = 1; F.stepT = 0; this.sfx.launch(); this.say('KNEE DROP', '#ffffff', 2, 0.65); this.particles.smoke(p.x, p.y, 6, '#888', 30, 0.4); }
        } else if (F.step === 1) {
          F.stepT += raw;
          const T = 0.5, q = Math.min(1, F.stepT / T);
          p.holdPose = 'kneedrop'; p.holdPoseT = 0.44 * q;
          const gap = (target ? target.r : 5) + 2;
          const tx = F.tx - cd * gap * 0.3, ty = F.ty - sd * gap * 0.3;
          const nx = lerp(F.sx, tx, q), ny = lerp(F.sy, ty, q);
          if (this.isFree(nx, ny, p.r)) { p.x = nx; p.y = ny; }
          p.z = 26 * Math.sin(q * Math.PI);
          this.addAfterimage({ x: p.x, y: p.y - p.z, facing: p.facing, aim: p.aim, pose: 'kneedrop', poseT: 0.3 }, this.pal.accent, p.lean);
          if (q >= 1) { p.z = 0; F.step = 2; p.holdPoseT = 0.6; this.finishBlow(target, F); this.particles.shockwave(p.x, p.y, 34, '#ffffff', 0.3); this.particles.smoke(p.x, p.y, 10, '#777', 40, 0.5); }
        } else { p.holdPose = since > 0.9 * ks ? 'flex' : 'kneedrop'; p.holdPoseT = since > 0.9 * ks ? 0 : 0.6; if (since > 1.7 * ks) this.endFatality(); }
        break;
      }
      case 'spinkick': {
        if (F.step === 0) {
          p.holdPose = 'spin'; p.holdPoseT = 0.08 + 0.2 * Math.min(1, F.t / 0.28);
          if (F.t >= 0.28) { F.step = 1; F.stepT = 0; this.sfx.swing(0.65); this.say('SPIN KICK', '#ffffff', 2, 0.65); }
        } else if (F.step === 1) {
          F.stepT += raw;
          p.holdPose = 'spin'; p.holdPoseT = 0.18 + 0.55 * Math.min(1, F.stepT / 0.34);
          this.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: p.aim + F.stepT * 14, pose: 'spin', poseT: p.holdPoseT }, '#ffffff', p.lean);
          if (F.stepT >= 0.34) { F.step = 2; this.finishBlow(target, F); this.particles.dirBurst(p.x + cd * 8, p.y - 6, 10, '#ffffff', dir, 0.8, 180, 0.3); }
        } else { p.holdPose = since > 0.7 * ks ? 'flex' : 'spin'; p.holdPoseT = since > 0.7 * ks ? 0 : 0.7; if (since > 1.7 * ks) this.endFatality(); }
        break;
      }
      case 'stomp': {
        // victim is on the ground: raise the knee (0-0.4), stomp the head
        if (F.step === 0) {
          p.holdPose = 'stomp'; p.holdPoseT = 0.5 * Math.min(1, F.t / 0.4);
          if (F.t >= 0.42) { F.step = 1; F.stepT = 0; }
        } else if (F.step === 1) {
          F.stepT += raw;
          p.holdPose = 'stomp'; p.holdPoseT = 0.5 + 0.1 * Math.min(1, F.stepT / 0.07);
          if (F.stepT >= 0.07) { F.step = 2; this.finishBlow(target, F); this.particles.shockwave(p.x + cd * 6, p.y, 24, '#ffffff', 0.25); }
        } else { p.holdPose = since > 0.8 * ks ? 'flex' : 'stomp'; p.holdPoseT = since > 0.8 ? 0 : 0.6; if (since > 1.6 * ks) this.endFatality(); }
        break;
      }
      case 'hammer': {
        // both fists overhead (0-0.4), slam down on the skull
        if (F.step === 0) {
          p.holdPose = 'hammer'; p.holdPoseT = 0.45 * Math.min(1, F.t / 0.4);
          if (F.t > 0.1 && Math.random() < 0.6) this.particles.add({ x: p.x + rnd(-6, 6), y: p.y - 16 + rnd(-4, 4), vx: 0, vy: -40, life: 0.2, c: '#ffd700', k: 0, s: 1 });
          if (F.t >= 0.42) { F.step = 1; F.stepT = 0; this.say('HAMMER FIST', '#ffd700', 2, 0.65); }
        } else if (F.step === 1) {
          F.stepT += raw;
          p.holdPose = 'hammer'; p.holdPoseT = 0.45 + 0.15 * Math.min(1, F.stepT / 0.08);
          if (F.stepT >= 0.08) { F.step = 2; this.finishBlow(target, F); this.particles.shockwave(p.x + cd * 8, p.y, 30, '#ffffff', 0.3); }
        } else { p.holdPose = since > 0.8 * ks ? 'flex' : 'hammer'; p.holdPoseT = since > 0.8 ? 0 : 0.6; if (since > 1.6 * ks) this.endFatality(); }
        break;
      }
      case 'n_garrote': {
        // whip the chain around the neck, pull tight (victim thrashes), snap
        if (F.step === 0) {
          p.holdPose = 'n_garrote'; p.holdPoseT = F.t / 0.3;
          if (F.t >= 0.3) { F.step = 1; this.sfx.chainRattle(); }
        } else if (F.step === 1) {
          p.holdPose = 'n_garrote'; p.holdPoseT = 1;
          if (target) { target.x = F.tx + Math.sin(F.t * 40) * 1.5; target.flash = Math.sin(F.t * 30) > 0 ? 0.05 : 0; }
          if (F.t >= 0.95) { F.step = 2; this.finishBlow(target, F); }
        } else { p.holdPose = since > 0.7 * ks ? 'flex' : 'n_garrote'; p.holdPoseT = 1; if (since > 1.6 * ks) this.endFatality(); }
        break;
      }
      case 'n_drum': {
        // skull drum: 10 rapid overhead cracks, then the big one
        p.holdPose = 'n_drum'; p.holdPoseT = F.t;
        if (F.step < 10) {
          if (target && F.t > 0.1 + F.step * 0.07) {
            F.step++; target.flash = 0.05;
            const hx = target.x + rnd(-2, 2), hy = target.y - 12 * target.scale + rnd(-2, 2);
            this.particles.spark(hx, hy, 4, '#ffffff', -Math.PI / 2, 1, 160); this.particles.blood(hx, hy, 4, -Math.PI / 2, 110); this.particles.impact(hx, hy, 3, '#ffffff');
            this.sfx.nunchakuHit(false); this.hitstop = Math.max(this.hitstop, 0.012); this.shake(0.2); this.addCombo();
            target.y += 0.4; // driven into the ground
          }
        } else if (F.step === 10) {
          p.holdPose = 'n_overhead'; p.holdPoseT = 0.2;
          if (F.t > 0.1 + 10 * 0.07 + 0.3) { F.step = 11; p.holdPoseT = 0.45; this.finishBlow(target, F); }
        } else { p.holdPose = since > 0.8 * ks ? 'flex' : 'n_overhead'; p.holdPoseT = 0.5; if (since > 1.6 * ks) this.endFatality(); }
        break;
      }
      case 'n_decap': {
        // helicopter spin-up, then the chain takes the head clean off
        p.holdPose = 'n_helicopter'; p.holdPoseT = F.t;
        if (F.step === 0) { if (F.t >= 0.6) { F.step = 1; this.finishBlow(target, F); } }
        else { p.holdPose = since > 0.8 * ks ? 'flex' : 'n_helicopter'; if (since > 1.6 * ks) this.endFatality(); }
        break;
      }
      case 'k_bisect': {
        // jodan raise (0-0.45), vertical cut; the body splits after a beat
        if (F.step === 0) {
          p.holdPose = 'k_heaven'; p.holdPoseT = 0.3 * Math.min(1, F.t / 0.45);
          p.bladeA = p.aim - 1.5 * p.facing;
          if (F.t >= 0.47) { F.step = 1; F.stepT = 0; this.sfx.slash(0.6); }
        } else if (F.step === 1) {
          F.stepT += raw; p.holdPose = 'k_heaven'; p.holdPoseT = 0.3 + 0.3 * Math.min(1, F.stepT / 0.08); p.bladeA = p.aim + 0.4 * p.facing;
          if (F.stepT >= 0.09) { F.step = 2; this.finishBlow(target, F); }
        } else { p.holdPose = since > 0.9 * ks ? 'k_sheathe' : 'k_heaven'; p.holdPoseT = since > 0.9 * ks ? Math.min(1, (since - 0.9) / 0.5) : 0.62; if (since > 1.7 * ks) this.endFatality(); }
        break;
      }
      case 'k_behead': {
        // horizontal crescent at neck height
        if (F.step === 0) {
          p.holdPose = 'k_crescent'; p.holdPoseT = 0.28 * Math.min(1, F.t / 0.35); p.bladeA = p.aim + 2.2 * p.facing;
          if (F.t >= 0.37) { F.step = 1; F.stepT = 0; this.sfx.slash(1.1); const sk = solvePose(this.playerStickOpts('k_crescent', 0.4)); this.katana.addArc(p.x + sk.fhand.x, p.y + sk.fhand.y, 30, p.aim + 2.2 * p.facing, p.aim - 1.4 * p.facing, '#ffffff', 0.5, 0.3); }
        } else if (F.step === 1) {
          F.stepT += raw; const q = Math.min(1, F.stepT / 0.08); p.holdPose = 'k_crescent'; p.holdPoseT = 0.28 + 0.32 * q; p.bladeA = p.aim + (2.2 - 3.6 * q) * p.facing;
          if (F.stepT >= 0.09) { F.step = 2; this.finishBlow(target, F); }
        } else { p.holdPose = since > 0.9 * ks ? 'k_sheathe' : 'k_crescent'; p.holdPoseT = since > 0.9 * ks ? Math.min(1, (since - 0.9) / 0.5) : 0.6; if (since > 1.7 * ks) this.endFatality(); }
        break;
      }
      case 'k_impale': {
        // thrust through the chest, lift them on the blade, flick them off
        if (F.step === 0) {
          p.holdPose = 'k_thrust'; p.holdPoseT = 0.3 * Math.min(1, F.t / 0.3); p.bladeA = p.aim;
          if (F.t >= 0.32) { F.step = 1; F.stepT = 0; this.sfx.slashHit(true); this.particles.blood(F.tx, F.ty - 6, 20, F.dir, 120); this.hitstop = Math.max(this.hitstop, 0.08); this.shake(0.5); }
        } else if (F.step === 1) {
          F.stepT += raw; const q = Math.min(1, F.stepT / 0.6);
          p.holdPose = 'k_impale'; p.holdPoseT = q; p.bladeA = p.aim - 0.9 * q * p.facing * 0.5 - 0.5 * q;
          if (target) { target.z = 10 * q; target.pose = 'launched'; target.rot = 0.6 * q * p.facing; target.x = p.x + cd * (target.r + p.r + 10); target.y = p.y + sd * (target.r + p.r + 10) + 0.01; if (Math.random() < 0.6) this.particles.blood(target.x, target.y - 6 - target.z, 2, Math.PI / 2, 40); }
          if (F.stepT >= 0.65) { F.step = 2; this.finishBlow(target, F); }
        } else { p.holdPose = since > 0.9 * ks ? 'k_sheathe' : 'k_impale'; p.holdPoseT = since > 0.9 * ks ? Math.min(1, (since - 0.9) / 0.5) : 1; if (since > 1.7 * ks) this.endFatality(); }
        break;
      }
      case 'rush': {
        p.holdPose = F.step < 14 ? 'rush' : 'palm'; p.holdPoseT = F.t;
        if (F.step === 0 && F.t < 0.12) this.say('CHAIN PUNCH', '#ffffff', 2, 0.7);
        if (F.step < 14) {
          if (target && F.t > 0.08 + F.step * 0.048) {
            F.step++;
            target.flash = 0.06;
            const hx = target.x - cd * target.r + rnd(-2, 2), hy = target.y - 6 - sd * target.r + rnd(-3, 3);
            this.particles.spark(hx, hy, 6, '#ffffff', dir, 1, 200);
            this.particles.blood(hx, hy, 3, dir, 110);
            this.particles.impact(hx, hy, 4, '#ffffff');
            this.addAfterimage({ x: p.x, y: p.y, facing: p.facing, aim: p.aim, pose: 'rush', poseT: F.t }, '#ffffff', p.lean);
            if (F.step % 2) this.sfx.punch(); else this.sfx.kick();
            this.sfx.hit();
            this.hitstop = Math.max(this.hitstop, 0.016); this.shake(0.22); this.addCombo();
            target.x += cd * 0.7; target.y += sd * 0.7;
          }
        } else if (F.step === 14) {
          p.holdPose = 'palm'; p.holdPoseT = 0.2;
          if (F.t > 0.08 + 14 * 0.048 + 0.28) {
            F.step = 15; p.holdPoseT = 0.5;
            this.say('TWIN PALM', '#ffd700', 2, 0.7);
            this.finishBlow(target, F);
            this.particles.shockwave(p.x + cd * 10, p.y - 4, 44, '#ffffff', 0.38);
          }
        } else {
          p.holdPose = since > 0.7 * ks ? 'flex' : 'palm'; p.holdPoseT = 0.55;
          if (since > 1.7 * ks) this.endFatality();
        }
        break;
      }
    }
    // pose yang tadinya diam membeku: beri follow-through & napas supaya animasi tetap bergerak
    if (p.fatality === F) {
      if (p.holdPose === 'flex') p.holdPoseT = clamp(since * 1.4, 0, 1);
      else if (F.hit && since < 0.5) p.holdPoseT = clamp(p.holdPoseT + Math.min(0.12, since * 0.25), 0, 0.85);
      if (F.hit && target && !target.dead) target.pose = 'hurt';
    }
  }

  finishBlow(e: Enemy | null, F: Fatality) {
    F.hit = true; F.hitT = F.t;
    const p = this.player;
    const dir = F.dir, cd = Math.cos(dir), sd = Math.sin(dir);
    this.hitstop = Math.max(this.hitstop, 0.14); this.flash('#ffffff', 0.4); this.shake(1); this.zoomKick = 0.1;
    this.sfx.fatality(); this.sfx.heavy(); this.sfx.kill();
    this.fatalityTextT = 1.8;
    if (!e || e.dead) return;
    {
      // jaminan kontak: korban harus berada tepat di depan anggota badan yang memukul
      const gap = e.r + p.r + 4;
      const dd = dist(p.x, p.y, e.x, e.y);
      if (dd > gap + 10 || (this.level.sideView && Math.abs(e.y - p.y) > 10)) {
        const ex = p.x + cd * gap, ey = this.level.sideView ? p.y : p.y + sd * gap;
        e.x = ex; e.y = ey; F.tx = ex; F.ty = ey;
      }
    }
    const hx = e.x - cd * e.r, hy = e.y - 6 - sd * e.r;
    this.particles.impact(hx, hy, 12, '#ffffff');
    this.particles.spark(hx, hy, 16, '#ffffff', dir, 1.2, 260);
    this.blood.arterial(hx, hy, dir, 1.0); this.blood.fountain(e.x, e.y - 6, 16); this.blood.mist(hx, hy, dir, 6);
    p.focus = Math.min(300, p.focus + (F.perfect ? 60 : 30) * this.stats.focusGain);
    this.addOfa(F.perfect ? 10 : 6);
    if (F.perfect) this.heal(1 + this.stats.takedownHeal);
    this.score += F.perfect ? 150 : 75;
    p.iframes = Math.max(p.iframes, 2.5);
    if (e.boss) {
      // bosses survive: perfect (staggered) fatality = 16%, otherwise a decaying chunk so it can't be spammed to death
      const pct = F.perfect ? 0.16 : Math.max(0.04, 0.09 * Math.pow(0.72, e.fatalCount));
      e.fatalCount++;
      const dmg = e.maxHp * pct * this.ageDmg();
      e.stagger = 0; e.structure = 0;
      this.damageEnemy(e, dmg, 0, dir, F.kind === 'runpunch' || F.kind === 'flykick' ? 600 : 250, { knockdown: true, hitstop: 0.1, shake: 0.9, melee: false, launch: F.kind === 'uppercut' ? 280 : 100 });
      this.particles.blood(hx, hy, 48, dir, 220);
      this.particles.fountain(e.x, e.y - 8, 14);
      this.splat(e.x, e.y, 20);
      this.texts.add(e.x, e.y - 30, F.perfect ? 'DEVASTATING!' : `-${Math.round(pct * 100)}%`, '#ffd700', 2, 1.2);
      return;
    }
    e.dead = true; this.kills++; this.score += Math.round(e.value * 2 * this.comboMult()); this.addCombo(3); this.dropLoot(e, true);
    this.addPool(e.x, e.y + 1, 7 + e.scale * 3);
    const corpse = (vx: number, vy: number, vz: number, spin: number): Corpse => ({
      x: e.x, y: e.y, rot: 0, color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle,
      vx, vy: this.level.sideView ? -Math.max(40, vz * 0.65) : vy, spin, t: 0, z: this.level.sideView ? 0 : 1, vz: this.level.sideView ? 0 : vz, gib: true, bounces: 0,
    });
    switch (F.kind) {
      case 'uppercut':
        this.particles.blood(hx, hy, 20, -Math.PI / 2, 200);
        this.particles.fountain(e.x, e.y - 8, 16);
        this.corpses.push(corpse(cd * 40, sd * 40, 340, 16));
        this.particles.head(e.x, e.y - 10, cd * 30 + rnd(-20, 20), sd * 30, 300, e.color);
        this.splat(e.x, e.y, 14);
        break;
      case 'runpunch':
        this.gibAt(e.x, e.y, e.color, e.scale, dir, 1.5);
        for (let i = 0; i < 12; i++) this.stamp(e.x + cd * i * 5 + rnd(-3, 3), e.y + sd * i * 5 + rnd(-3, 3), '#8a0000', 2);
        this.particles.head(e.x, e.y - 10, cd * 260, sd * 260, 160, e.color);
        break;
      case 'flykick':
        this.particles.blood(hx, hy, 20, dir, 220);
        this.corpses.push(corpse(cd * 560, sd * 560, 70, 14));
        this.particles.head(e.x, e.y - 10, cd * 200 + rnd(-40, 40), sd * 200, 200, e.color);
        break;
      case 'rush':
        this.gibAt(e.x, e.y, e.color, e.scale, dir, 1.2);
        this.particles.head(e.x, e.y - 10, cd * 150, sd * 150 - 60, 220, e.color);
        break;
      case 'neckbreak': {
        // snap: body crumples in place, head stays at an impossible angle then rolls off
        this.sfx.stagger(); this.sfx.heavy();
        this.particles.blood(hx, hy, 10, dir, 60);
        this.corpses.push({ x: e.x, y: e.y, rot: dir + Math.PI / 2, color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle, vx: cd * 20, vy: sd * 20, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
        this.particles.head(e.x, e.y - 10, -cd * 40 + rnd(-15, 15), -sd * 40, 90, e.color);
        this.particles.fountain(e.x, e.y - 8, 10);
        this.splat(e.x, e.y, 12);
        break;
      }
      case 'kneedrop':
        this.gibAt(e.x, e.y, e.color, e.scale, -Math.PI / 2, 1.1);
        this.particles.blood(e.x, e.y - 4, 24, rnd(0, 6.3), 150);
        this.particles.head(e.x, e.y - 10, cd * 60 + rnd(-40, 40), sd * 60 + rnd(-40, 40), 260, e.color);
        break;
      case 'spinkick':
        this.particles.blood(hx, hy, 26, dir + 0.4 * p.facing, 240);
        this.particles.head(e.x, e.y - 10, cd * 330, sd * 330, 140, e.color);
        this.corpses.push(corpse(cd * 300, sd * 300, 160, 18));
        this.splat(e.x, e.y, 10);
        break;
      case 'stomp':
        this.particles.blood(e.x + cd * 6, e.y - 2, 30, dir, 170);
        this.particles.blood(e.x + cd * 6, e.y - 2, 20, dir + Math.PI, 110);
        this.splat(e.x + cd * 6, e.y, 30);
        this.addPool(e.x + cd * 4, e.y + 1, 9);
        this.corpses.push({ x: e.x, y: e.y, rot: dir, color: e.color, color2: e.color2, scale: e.scale, accessory: 'none', vx: 0, vy: 0, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
        for (let i = 0; i < 5; i++) this.particles.limb(e.x + cd * 6, e.y - 2, rnd(0, 6.3), 120, '#d40000', 2);
        break;
      case 'n_garrote': {
        this.sfx.stagger(); this.sfx.chainRattle();
        this.particles.blood(e.x, e.y - 10, 14, -Math.PI / 2, 80);
        this.corpses.push({ x: e.x, y: e.y, rot: dir, color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle, vx: cd * 10, vy: sd * 10, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
        this.particles.head(e.x, e.y - 10, cd * 20, sd * 20, 140, e.color);
        this.addPool(e.x, e.y + 1, 7);
        break;
      }
      case 'n_drum':
        this.gibAt(e.x, e.y, e.color, e.scale, -Math.PI / 2, 1.2);
        this.particles.fountain(e.x, e.y - 6, 20);
        this.splat(e.x, e.y, 30); this.addPool(e.x, e.y + 1, 10);
        break;
      case 'n_decap': {
        this.sfx.nunchakuHit(true);
        this.particles.fountain(e.x, e.y - 10, 24);
        this.particles.head(e.x, e.y - 10, cd * 260 + rnd(-30, 30), sd * 260, 220, e.color);
        this.corpses.push({ x: e.x, y: e.y, rot: dir, color: e.color, color2: e.color2, scale: e.scale, accessory: 'none', vx: cd * 30, vy: sd * 30, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
        this.addPool(e.x, e.y + 1, 9);
        break;
      }
      case 'k_bisect': {
        this.sfx.slashHit(true);
        const sa = dir + Math.PI / 2;
        this.particles.blood(e.x, e.y - 8, 30, sa, 170); this.particles.blood(e.x, e.y - 8, 30, sa + Math.PI, 170);
        this.particles.lines(e.x, e.y - 8, 6, '#ffffff', -Math.PI / 2, 120);
        const half = (vx: number, vy: number): Corpse => ({ x: e.x, y: e.y, rot: dir, color: e.color, color2: e.color2, scale: e.scale, accessory: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle, vx, vy, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
        this.corpses.push(half(Math.cos(sa) * 70, Math.sin(sa) * 70)); this.corpses.push(half(Math.cos(sa + Math.PI) * 70, Math.sin(sa + Math.PI) * 70));
        this.splat(e.x, e.y, 28); this.addPool(e.x, e.y + 1, 10);
        break;
      }
      case 'k_behead': {
        this.sfx.slashHit(true);
        this.particles.fountain(e.x, e.y - 10, 26);
        this.particles.head(e.x, e.y - 10, cd * 120 + rnd(-30, 30), sd * 120, 260, e.color);
        // body stands for a moment then drops
        this.corpses.push({ x: e.x, y: e.y, rot: dir, color: e.color, color2: e.color2, scale: e.scale, accessory: 'none', vx: cd * 15, vy: sd * 15, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
        this.addPool(e.x, e.y + 1, 9);
        break;
      }
      case 'k_impale': {
        this.sfx.slashHit(true); this.sfx.whoosh();
        this.particles.blood(e.x, e.y - 10, 24, dir, 160);
        this.corpses.push(corpse(cd * 380, sd * 380, 140, 10));
        this.splat(e.x, e.y, 14);
        break;
      }
      case 'hammer':
        this.particles.blood(hx, hy, 34, -Math.PI / 2 + rnd(-0.5, 0.5), 200);
        this.particles.fountain(e.x, e.y - 6, 18);
        this.splat(e.x, e.y, 24);
        this.addPool(e.x, e.y + 1, 9);
        // body hammered flat into the floor
        this.corpses.push({ x: e.x, y: e.y, rot: dir, color: e.color, color2: e.color2, scale: e.scale, accessory: 'none', vx: 0, vy: 0, spin: 0, t: 0, z: 0, vz: 0, gib: false, bounces: 0 });
        for (let i = 0; i < 6; i++) this.particles.limb(e.x, e.y - 4, rnd(0, 6.3), 140, e.color, 3);
        break;
    }
  }

  brutCamera(k: number) { this.zoomTarget = k * BASE_ZOOM; }
  endFatality() {
    const p = this.player;
    p.fatality = null; p.holdT = 0; p.z = 0; p.iframes = Math.max(0.5, Math.min(p.iframes, 1));
    this.cinematic = false; this.zoomTarget = BASE_ZOOM; this.camFocus = null; this.slowT = 0;
  }

  // ------------------------------------------------------------------ physics
  physics(dt: number) {
    const es = this.enemies;
    const side = !!this.level.sideView;
    for (const e of es) {
      if (e.dead || e.spawnT > 0 || (e as Enemy & { punchLock?: boolean }).punchLock || (e as Enemy & { throwLock?: boolean }).throwLock) continue;
      unstick(this.level, e);
      const kSpeed = Math.hypot(e.kx, e.ky);
      let bx = false, by = false;
      if (side) {
        const onStair = officeOnStairs(this.level, e.x, e.y);
        if (!onStair || e.down > 0 || e.stagger > 0 || e.state === 'air' || kSpeed > 40) {
          const grav = e.state === 'air' && !e.svGrounded ? 460 : 680;
          e.svVy = Math.min(420, (e.svVy ?? 0) + grav * dt);
        }
        const prevVy = e.svVy ?? 0;
        const dropThrough = (e.svDropT ?? 0) > 0;
        const m = moveSideView(this.level, e, (e.vx + e.kx) * dt, ((e.svVy ?? 0) + e.ky) * dt, dropThrough, this.props);
        bx = m.bx;
        by = m.by && Math.abs(e.ky) > 150;
        if (m.by && prevVy > 0) {
          e.svVy = 0; e.svGrounded = true;
          if (e.state === 'air') { e.rot = 0; this.enemyLand(e, prevVy); }
        }
        else if (m.by && prevVy < 0) { e.svVy = 0; }
        // musuh di tangga: kaki menapak anak tangga (tidak melayang di depan kaca tangga)
        if (onStair && !e.svGrounded && e.down <= 0 && e.stagger <= 0 && e.state !== 'air' && kSpeed <= 40) {
          const path = officeStairPath(this.level, e.x, e.y);
          if (path) {
            const pr = stairPathProject(path, e.x, e.y);
            if (pr.dist < 14) { const at = stairPathAt(path, pr.s); e.x += (at.x - e.x) * Math.min(1, dt * 18); e.y = at.y; }
          }
        }
        if (e.svGrounded && !onStair) {
          const tileSup = officeFloorSupportY(this.level, e.x, e.y, e.r, dropThrough);
          const tblSup = dropThrough ? null : sideTableSupportY(this.props, e.x, e.y);
          const sup = tileSup === null ? tblSup : tblSup === null ? tileSup : Math.min(tileSup, tblSup);
          if (sup === null || sup > e.y + 3) e.svGrounded = false;
        }
        if (m.hitGlass.length > 0 && kSpeed > 110) {
          for (const gt of m.hitGlass) {
            const posG = shatterOfficeGlassTile(this.level, this.officeLook.on ? null : this.levelCanvas, gt.tx, gt.ty);
            if (posG) {
              this.particles.burst(posG.x, posG.y, 14, '#7ce8ff', 170, 0.55, 2, 2);
              this.sfx.glassTink();
              this.texts.hit(posG.x, posG.y - 10, 'SMASH!', '#7ce8ff', 1, 0.55);
            }
          }
        }
      } else {
        const m = moveWithCollision(this.level, e, (e.vx + e.kx) * dt, (e.vy + e.ky) * dt);
        bx = m.bx; by = m.by;
      }
      if (bx || by) {
        // Dorong sedikit menjauh dari permukaan tembok agar badan tidak menempel/terjepit di tepi tembok
        if (bx) {
          const pushDir = -Math.sign(e.kx || e.vx || e.facing);
          if (pushDir !== 0 && this.isFree(e.x + pushDir * 2, e.y, e.r)) e.x += pushDir * 2;
          e.vx = 0;
        }
        if (by && !side) {
          const pushDirY = -Math.sign(e.ky || e.vy || 1);
          if (pushDirY !== 0 && this.isFree(e.x, e.y + pushDirY * 2, e.r)) e.y += pushDirY * 2;
          e.vy = 0;
        }
        if (kSpeed > 170) this.wallSlam(e, kSpeed);
        if (!e.dead) {
          if (e.state === 'charge') {
            e.state = 'stun'; e.stun = 1.4; e.structure += 70; e.pose = 'hurt';
            this.shake(1); this.sfx.slam(); this.hitstop = Math.max(this.hitstop, 0.06);
            this.particles.smoke(e.x, e.y, 16, '#888', 60, 0.7);
            this.particles.burst(e.x, e.y - 6, 20, this.pal.wallTop, 160, 0.6, 2, 3);
            this.say('CRASH!', '#ffd700', 2, 0.8);
            if (e.structure >= e.maxStructure) this.staggerEnemy(e);
          }
          const bounce = this.v2 ? -0.38 : -0.28;   // V2: bodies spring off the wall harder (game1 feel)
          if (bx) e.kx *= bounce;
          if (by) e.ky *= bounce;
          unstick(this.level, e);
        }
      }
      if (kSpeed > 150) {
        for (const pr of this.props) {
          if (pr.dead || pr.hp <= 0 || dist(e.x, e.y, pr.x, pr.y) > e.r + pr.r) continue;
          const a = Math.atan2(e.ky, e.kx);
          this.damageProp(pr, 10, a);
          this.damageEnemy(e, 2, 20, a + Math.PI, 40, { knockdown: true, hitstop: 0.03, shake: 0.2, melee: false });
          e.kx *= 0.3; e.ky *= 0.3;
          this.texts.hit(e.x, e.y - 22, 'CRASH!', this.pal.accent2, 1, 0.6);
        }
      }
      // bleeding trail while being knocked around
      if (e.flinch > 0 && kSpeed > 90 && e.z <= 0 && Math.random() < 0.7) this.stamp(e.x + rnd(-3, 3), e.y + rnd(-1, 3), Math.random() < 0.3 ? '#5e0000' : '#8a0000', Math.random() < 0.35 ? 2 : 1);
      const f = Math.max(0, 1 - (e.z > 0 || (side && e.state === 'air' && !e.svGrounded) ? 1.2 : 6) * dt);
      e.kx *= f; e.ky *= f;
      if (Math.abs(e.kx) < 1) e.kx = 0;
      if (Math.abs(e.ky) < 1) e.ky = 0;
    }
    for (let i = 0; i < es.length; i++) {
      const a = es[i];
      if (a.dead || a.spawnT > 0) continue;
      for (let j = i + 1; j < es.length; j++) {
        const b = es[j];
        if (b.dead || b.spawnT > 0) continue;
        if ((a.z > 6) !== (b.z > 6)) continue;
        const d = dist(a.x, a.y, b.x, b.y), min = a.r + b.r;
        if (d >= min || d < 0.01) continue;
        const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d, o = (min - d) * 0.5;
        const wa = b.r / (a.r + b.r), wb = a.r / (a.r + b.r);
        if (this.isFree(a.x - nx * o * wa * 2, a.y - ny * o * wa * 2, a.r)) { a.x -= nx * o * wa * 2; a.y -= ny * o * wa * 2; }
        if (this.isFree(b.x + nx * o * wb * 2, b.y + ny * o * wb * 2, b.r)) { b.x += nx * o * wb * 2; b.y += ny * o * wb * 2; }
        const ka = Math.hypot(a.kx, a.ky), kb = Math.hypot(b.kx, b.ky);
        if (ka > 180 && b.flash <= 0) this.bowl(a, b);
        else if (kb > 180 && a.flash <= 0) this.bowl(b, a);
      }
    }
  }
  bowl(mover: Enemy, hit: Enemy) {
    const a = Math.atan2(hit.y - mover.y, hit.x - mover.x);
    const sp = Math.hypot(mover.kx, mover.ky);
    mover.kx *= 0.4; mover.ky *= 0.4;
    this.damageEnemy(hit, 2 + sp / 80, 25, a, sp * 0.8, { knockdown: true, hitstop: 0.03, shake: 0.2, melee: false });
    this.damageEnemy(mover, 1, 10, a + Math.PI, 20, { knockdown: true, hitstop: 0.0, shake: 0, melee: false });
    this.say('BOWLING!', this.pal.accent2, 1, 0.6);
    this.particles.spark(hit.x, hit.y - 6, 6, '#ffffff', a, 1, 150);
    this.particles.impact(hit.x, hit.y - 6, 6, '#ffffff');
  }
  wallSlam(e: Enemy, speed: number) {
    // V2 borrows game1's wall slam: it hurts much more, breaks posture, and leaves the victim wobbling.
    const dmg = this.v2 ? 7 + speed / 26 : 3 + speed / 70;
    const wallDead = this.chipEnemy(e, dmg);
    e.flash = 0.12;
    e.structure += (this.v2 ? 65 : 35) * this.stats.structureDmg;
    this.sfx.slam();
    this.shake(this.v2 ? 0.9 : 0.5);
    this.hitstop = Math.max(this.hitstop, this.v2 ? 0.09 : 0.05);
    if (this.v2) {
      const dir = Math.atan2(-e.ky, -e.kx);
      this.particles.spark(e.x, e.y - 6 - e.z, 12, '#ffffff', dir, 1.4, 250);
      this.particles.ring(e.x, e.y - 6 - e.z, 2, 16, '#ffffff', 0.2, 1);
    }
    this.particles.smoke(e.x, e.y, 8, '#999', 40, 0.5);
    this.particles.burst(e.x, e.y - 6, 10, this.pal.wallTop, 120, 0.5, 2, 3);
    this.particles.blood(e.x, e.y - 6, 18, Math.atan2(-e.ky, -e.kx), 110);
    this.particles.impact(e.x, e.y - 6 - e.z, 8, '#ffffff');
    // blood splatter on the wall itself
    const kl = Math.hypot(e.kx, e.ky) || 1;
    const wx = e.x + (e.kx / kl) * 8, wy = e.y - 6 + (e.ky / kl) * 8;
    this.splat(wx, wy, 16, '#8a0000', true);
    for (let i = 0; i < 6; i++) this.stamp(wx + rnd(-4, 4), wy + i * 2, '#6e0000', 1, true);
    this.say('WALL SLAM!', this.pal.accent2, this.v2 ? 2 : 1, this.v2 ? 0.9 : 0.7);
    this.score += this.v2 ? 25 : 15;
    this.addCombo();
    if (e.z > 0) e.vz = Math.min(e.vz, 0);
    if (wallDead) { this.killEnemy(e, Math.atan2(-e.ky, -e.kx), 300, false, true); return; }
    if (e.structure >= e.maxStructure && e.stagger <= 0) this.staggerEnemy(e);
    else if (this.v2 && speed > 240 && !e.boss && !this.isEnemyAirborne(e)) {
      // V2 hard slam (game1): peeled off the wall and left standing, swaying, stars round the head.
      // Softer slams keep game2's knockdown — and thanks to updateEnemy they wake up dizzy anyway.
      e.stun = Math.max(e.stun, 0.55 + speed / 800);
      e.state = 'stun'; e.pose = 'hurt'; e.down = 0;
      e.sqx = 1.4; e.sqy = 0.6;
      e.attackCd = Math.max(e.attackCd, e.stun + 0.35);
      e.vx = 0; e.vy = 0;
      if (Math.random() < 0.6) this.texts.hit(e.x, e.y - 24 - e.z, 'BONK!', '#ffffff', 1, 0.5);
    }
    else if (!e.boss && e.stagger <= 0 && e.z <= 0) { e.down = 1.2; e.state = 'down'; }
    else if (e.boss) { e.stun = Math.max(e.stun, 0.5); e.state = 'stun'; }
  }

  // ------------------------------------------------------------------ bullets
  fireEnemyBullet(e: Enemy, angle: number, speed: number, dmg: number, kind: Bullet['kind'], color: string) {
    const hx = e.x + Math.cos(e.aim) * 8 * e.scale, hy = e.y - 7 * e.scale + Math.sin(e.aim) * 6;
    if (this.level.sideView && this.glowOn) this.glowFx.add(hx, hy - (e.z || 0), kind === 'orb' ? 34 : 40, kind === 'orb' ? color : '#ffd27f', 0.06);
    this.bullets.push({ x: hx, y: hy, px: hx, py: hy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: kind === 'orb' ? 3 : 2, dmg, owner: 'enemy', life: 3, color, pierce: 0, bounce: 0, kind, hitIds: [], structure: 0, kb: 0 });
    this.particles.spark(hx, hy, 3, color, angle, 0.4, 120);
    // enemy muzzle flash
    this.enemyMuzzles.push({ x: hx, y: hy, a: angle, t: 0.06, c: color });
    if (this.enemyMuzzles.length > 24) this.enemyMuzzles.shift();
    if (kind !== 'sniper') {
      // suara tembakan musuh mengikuti posisi & jarak: makin jauh makin tumpul
      const dx = e.x - this.player.x, dy = e.y - this.player.y;
      const d = Math.hypot(dx, dy);
      this.sfx.enemyShot(Math.max(-1, Math.min(1, dx / 170)), d > 180);
      if (d < 130) this.shake(Math.max(0, 0.1 - d / 1800));
    }
    if (kind !== 'orb') this.particles.casing(e.x, e.y - 6, e.aim, e.facing);
    if (kind === 'rifle' || kind === 'pistol') this.particles.smoke(hx, hy, 2, '#9a9a9a', 22, 0.45);
  }
  throwBomb(e: Enemy, tx: number, ty: number, dmg: number) {
    const T = 0.9;
    this.bullets.push({ x: e.x, y: e.y - 8, px: e.x, py: e.y, vx: (tx - e.x) / T, vy: (ty - e.y) / T, r: 3, dmg, owner: 'enemy', life: T, color: '#222', pierce: 0, bounce: 0, kind: 'bomb', hitIds: [], structure: 0, kb: 0, z: 0, vz: 180 });
  }
  updateBullets(dt: number) {
    const p = this.player;
    const bs = this.bullets;
    for (let i = bs.length - 1; i >= 0; i--) {
      const b = bs[i];
      b.px = b.x; b.py = b.y;
      b.life -= dt;
      if (b.kind === 'bomb') {
        b.x += b.vx * dt; b.y += b.vy * dt; b.z = (b.z ?? 0) + (b.vz ?? 0) * dt; b.vz = (b.vz ?? 0) - 400 * dt;
        if (b.life <= 0) {
          this.explode(b.x, b.y, 28, b.dmg, false);
          this.addHazard({ x: b.x, y: b.y, r: 20, maxR: 0.3, life: 2.6, kind: 'fire', dmg: 1 });
          bs.splice(i, 1);
        }
        continue;
      }
      const sp = Math.hypot(b.vx, b.vy);
      const steps = Math.max(1, Math.ceil((sp * dt) / 4));
      let alive = true;
      for (let s = 0; s < steps && alive; s++) {
        b.x += (b.vx * dt) / steps; b.y += (b.vy * dt) / steps;
        if (solidAt(this.level, b.x, b.y)) {
          if (this.level.sideView) {
            const gtx = Math.floor(b.x / TILE), gty = Math.floor(b.y / TILE);
            if (officeTileAt(this.level, gtx, gty) === OT_GLASS) {
              const posG = shatterOfficeGlassTile(this.level, this.officeLook.on ? null : this.levelCanvas, gtx, gty);
              if (posG) {
                this.particles.burst(posG.x, posG.y, 12, '#7ce8ff', 150, 0.5, 2, 2);
                this.sfx.glassTink();
              }
              continue;
            }
          }
          if (b.bounce > 0) {
            b.bounce--;
            if (solidAt(this.level, b.x - (b.vx * dt) / steps, b.y)) b.vy *= -1; else b.vx *= -1;
            b.x += (b.vx * dt) / steps * 2; b.y += (b.vy * dt) / steps * 2;
            this.particles.spark(b.x, b.y, 4, b.color, Math.atan2(b.vy, b.vx), 0.8, 120);
            this.sfx.ricochet();
          } else {
            const back = Math.atan2(-b.vy, -b.vx);
            this.particles.spark(b.x, b.y, b.owner === 'player' ? 5 : 3, b.color, back, 1, 120);
            this.particles.smoke(b.x - Math.cos(back) * -2, b.y, 1, '#777', 10, 0.35);
            this.particles.burst(b.x, b.y, 3, this.pal.wallTop, 60, 0.3);
            if (b.owner === 'player') {
              this.bulletHole(b.px, b.py);
              // chunky debris + dust puff + tiny white impact star
              this.particles.burst(b.x, b.y, 4, this.pal.wallTop, 110, 0.45, 2, 3);
              this.particles.spark(b.x, b.y, 4, '#fff3a0', back, 0.6, 260);
              this.particles.smoke(b.x, b.y, 2, '#a0a0a0', 18, 0.5);
              this.particles.impact(b.x, b.y, 4, '#ffffff');
              this.gunfx.hitSpark(b.x, b.y, back, b.y + 6, b.kind === 'pistol');
              this.sfx.bulletWall();
              if (Math.random() < 0.2) this.sfx.ricochet();
            }
            alive = false;
          }
          break;
        }
        if (b.owner === 'player') {
          for (const e of this.enemies) {
            if (e.dead || e.spawnT > 0 || b.hitIds.includes(e.id)) continue;
            if (dist(b.x, b.y, e.x, e.y - 4 - e.z * 0.5) > e.r + b.r + 1) continue;
            b.hitIds.push(e.id);
            const a = Math.atan2(b.vy, b.vx);
            if (e.kind === 'shield' && e.stagger <= 0 && e.z <= 0 && Math.abs(angleDiff(Math.atan2(p.y - e.y, p.x - e.x), e.aim)) < 1.3) {
              this.particles.spark(b.x, b.y, 5, '#ffffff', a + Math.PI, 0.8, 150);
              this.particles.impact(b.x, b.y, 3, '#cccccc');
              this.sfx.hit(); this.sfx.ricochet();
              e.structure += 6;
              alive = false; break;
            }
            const hpBefore = e.hp;
            this.damageEnemy(e, b.dmg, b.structure, a, b.kb, { zone: zoneFromHeight(e, b.y), hitstop: b.kind === 'deflect' ? 0.05 : b.kind === 'pistol' ? 0.02 : 0.01, shake: b.kind === 'pistol' ? 0.08 : 0.05, melee: false });
            this.particles.blood(b.x, b.y, 3 + Math.floor(b.dmg * 0.6), a, 110);
            this.blood.spray(b.x, b.y, a, b.dmg * 0.7, false);
            this.stamp(e.x + rnd(-3, 3), e.y + rnd(0, 2), '#8a0000', 1);
            this.particles.spark(b.x, b.y, 4, '#ffffff', a, 0.5, 220);
            this.particles.impact(b.x, b.y, b.kind === 'pistol' ? 5 : 4, '#ffffff');
            // exit wound: blood mist blown out the far side along the bullet path
            this.particles.blood(e.x + Math.cos(a) * 4, e.y - 6 + Math.sin(a) * 3, 4 + Math.floor(b.dmg * 0.5), a, 220);
            this.gunfx.hitSpark(b.x, b.y, a, e.y, b.kind === 'pistol');
            this.sfx.bulletFlesh();
            this.sfx.hit();
            this.addCombo();
            this.hitMarkerT = 0.14; this.hitMarkerKill = e.dead;
            if (e.dead && b.dmg >= hpBefore * 2 && Math.random() < 0.5) this.gibAt(e.x, e.y, e.color, e.scale, a, 0.8);
            if (b.pierce > 0) b.pierce--; else { alive = false; break; }
          }
          if (alive) for (const pr of this.props) {
            if (pr.dead) continue;
            if (dist(b.x, b.y, pr.x, pr.y - 3) > pr.r + b.r) continue;
            this.damageProp(pr, b.dmg, Math.atan2(b.vy, b.vx));
            alive = false; break;
          }
        } else {
          if (dist(b.x, b.y, p.x, p.y - 5) < p.r + b.r + 1) {
            if (p.parryT > 0) { this.deflectBullet(b, p.aim); this.say('PARRY!', '#35f0ff', 2, 0.6); this.slow(0.15, 0.3); break; }
            if (p.dashT > 0 || p.z > 12) {
              if (!b.hitIds.includes(-1)) {
                b.hitIds.push(-1); p.focus = Math.min(300, p.focus + 8 * this.stats.focusGain);
                if (p.z > 12) this.texts.add(p.x, p.y - 24 - p.z, 'HOP!', '#9be7ff', 1, 0.4);
              }
              continue;
            }
            if (p.iframes > 0) continue;
            this.damagePlayer(b.dmg, Math.atan2(b.vy, b.vx));
            alive = false; break;
          }
        }
      }
      if (!alive || b.life <= 0) bs.splice(i, 1);
    }
    for (let i = this.pendingBooms.length - 1; i >= 0; i--) {
      const pb = this.pendingBooms[i];
      pb.t -= dt;
      if (pb.t <= 0) { this.pendingBooms.splice(i, 1); this.explode(pb.x, pb.y, pb.r, pb.dmg, pb.fromPlayer); }
    }
  }

  updatePickups(dt: number) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const k = this.pickups[i];
      k.t += dt;
      const o = { x: k.x, y: k.y, r: 3 };
      moveWithCollision(this.level, o, k.vx * dt, k.vy * dt);
      k.x = o.x; k.y = o.y;
      const f = Math.max(0, 1 - 5 * dt); k.vx *= f; k.vy *= f;
      const d = dist(p.x, p.y, k.x, k.y);
      if (d < 34 || k.magnet) {
        k.magnet = true;
        const sp = 240;
        k.x += ((p.x - k.x) / d) * sp * dt; k.y += ((p.y - k.y) / d) * sp * dt;
      }
      if (d < 9) {
        this.pickups.splice(i, 1);
        this.sfx.pickup();
        this.particles.burst(k.x, k.y - 4, 8, '#ffffff', 60, 0.4);
        let txt = '';
        let col = '#ffffff';
        switch (k.kind) {
          case 'ammoP': p.ammoP = Math.min(Math.round(60 * this.stats.maxAmmo), p.ammoP + 12); txt = '+12 PISTOL'; col = '#ffd166'; break;
          case 'ammoR': p.ammoR = Math.min(Math.round(180 * this.stats.maxAmmo), p.ammoR + 30); txt = '+30 RIFLE'; col = '#7bed9f'; break;
          case 'hp': this.heal(1); break;
          case 'focus': p.focus = Math.min(300, p.focus + 100); txt = '+FOCUS'; col = '#35f0ff'; break;
          case 'rifle': p.hasRifle = true; p.ammoR = Math.min(Math.round(180 * this.stats.maxAmmo), p.ammoR + 60); txt = 'RIFLE! (3)'; col = '#7bed9f'; this.setWeapon('rifle'); break;
          case 'nunchaku': p.hasNunchaku = true; txt = 'NUNCHAKU! (4)'; col = '#ffd166'; this.setWeapon('nunchaku'); this.slow(0.5, 0.3); this.flash('#ffd166', 0.2); break;
          case 'katana': p.hasKatana = true; txt = 'KATANA! (5)'; col = '#bfe8ff'; this.setWeapon('katana'); this.slow(0.5, 0.3); this.flash('#bfe8ff', 0.25); this.sfx.sheathe(); break;
          case 'axe': p.hasAxe = true; txt = 'AXE! (6)'; col = '#ffb347'; this.setWeapon('axe'); this.slow(0.5, 0.3); this.flash('#ffb347', 0.25); this.sfx.axeHit(true); break;
          case 'dual': p.hasDual = true; txt = 'DUAL BLADES! (7)'; col = '#bfe8ff'; this.setWeapon('dual'); this.slow(0.5, 0.3); this.flash('#bfe8ff', 0.25); this.sfx.dualSwing(); break;
        }
        if (txt) this.texts.add(p.x + 22 * p.facing, p.y + 6, txt, col, 1, 0.7);
      }
    }
  }
  updateProps(dt: number) {
    for (const pr of this.props) {
      if (pr.flash > 0) pr.flash -= dt;
      if (pr.hp <= 0 && !pr.dead && pr.flash <= 0) pr.dead = true;
    }
  }
  updateHazards(dt: number) {
    const p = this.player;
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      if (h.kind === 'ring') {
        h.r += ((h.maxR + 36) / h.max) * dt;
        if (h.r > 0 && !h.hit) {
          const d = dist(h.x, h.y, p.x, p.y);
          if (Math.abs(d - h.r) < 7) { h.hit = true; this.damagePlayer(h.dmg, Math.atan2(p.y - h.y, p.x - h.x)); }
        }
      } else if (h.kind === 'fire') {
        if (Math.random() < 0.6) this.particles.ember(h.x + rnd(-h.r, h.r) * 0.7, h.y + rnd(-h.r, h.r) * 0.5, 1, Math.random() < 0.5 ? '#ff6a00' : '#ffd27f');
        if (dist(h.x, h.y, p.x, p.y) < h.r) this.damagePlayer(h.dmg, Math.atan2(p.y - h.y, p.x - h.x));
        h.maxR -= dt;
        if (h.maxR <= 0) {
          h.maxR = 0.5;
          for (const e of this.enemies) if (!e.dead && dist(h.x, h.y, e.x, e.y) < h.r) this.damageEnemy(e, 1.5, 5, Math.atan2(e.y - h.y, e.x - h.x), 30, { hitstop: 0, shake: 0, melee: false });
        }
      }
      if (h.life <= 0) this.hazards.splice(i, 1);
    }
  }

  // ------------------------------------------------------------------ camera
  updateCamera(raw: number) {
    const p = this.player;
    const look = this.state === 'menu' ? 0 : 0.22;
    let tx: number, ty: number;
    if (this.camFocus) { tx = this.camFocus.x - VIEW_W / 2; ty = this.camFocus.y - 6 - VIEW_H / 2; }
    else if (this.level.sideView) {
      const mw = this.mouseWorld();
      this.camFaceX = lerp(this.camFaceX, p.facing * 18, 1 - Math.exp(-6.5 * raw));
      tx = p.x + this.camFaceX + (mw.x - p.x) * 0.12 - VIEW_W / 2;
      ty = p.y - 18 + (mw.y - p.y) * 0.09 - VIEW_H / 2;
      if (this.state === 'playing') {
        tx += (p.vx + p.kx * 0.4) * 0.26;
      }
    } else {
      const mw = this.mouseWorld();
      tx = p.x + (mw.x - p.x) * look - VIEW_W / 2; ty = p.y - 6 + (mw.y - p.y) * look - VIEW_H / 2;
      if (this.state === 'playing') {
        // Kamera MENDAHULUI arah lari: pelari tetap terbingkai, dunia yang mengalir,
        // bukan tokoh terseret ke pinggir layar saat sprint.
        const lead = 0.3;
        tx += (p.vx + p.kx * 0.4) * lead;
        ty += (p.vy + p.ky * 0.4) * lead * 0.7;
      }
    }
    const k = 1 - Math.exp(-(this.camFocus ? 12 : 10.5) * raw);
    this.cam.x = lerp(this.cam.x, tx, k); this.cam.y = lerp(this.cam.y, ty, k);
    const lw = this.level.w * TILE, lh = this.level.h * TILE;
    // clamp the *visible* (zoomed) region to the level bounds
    const hw = VIEW_W / (2 * this.zoom), hh = VIEW_H / (2 * this.zoom);
    this.cam.x = lw < 2 * hw ? (lw - VIEW_W) / 2 : clamp(this.cam.x, hw - VIEW_W / 2, lw - VIEW_W / 2 - hw);
    this.cam.y = lh < 2 * hh ? (lh - VIEW_H) / 2 : clamp(this.cam.y, hh - VIEW_H / 2, lh - VIEW_H / 2 - hh);
    this.applyShakeOffsets();
    const kd = Math.exp(-16 * raw);
    this.camKick.x *= kd; this.camKick.y *= kd;
    const kickLen = Math.hypot(this.camKick.x, this.camKick.y);
    if (kickLen > 9) { const q = 9 / kickLen; this.camKick.x *= q; this.camKick.y *= q; }
    this.zoomKick = Math.min(0.06, Math.max(0, this.zoomKick - raw * 0.7));
    this.zoom = lerp(this.zoom, this.zoomTarget + this.zoomKick, 1 - Math.exp(-7 * raw));
    if (Math.abs(this.zoom - BASE_ZOOM) < 0.004 && this.zoomTarget === BASE_ZOOM && this.zoomKick === 0) this.zoom = BASE_ZOOM;
  }

  // ------------------------------------------------------------------ render
  render() {
    const v2 = this.v2;
    const ctx = this.wctx;
    const sc = v2 ? this.hctx : this.ctx;
    const p = this.player;
    const pal = this.pal;
    // V2 draws only the slice of the world that is actually visible (VIEW/zoom art pixels) at 1:1, so every
    // primitive lands on whole buffer pixels and nothing gets antialiased by a fractional transform.
    const sw = v2 ? clamp(Math.ceil(VIEW_W / this.zoom), 1, VIEW_W) : VIEW_W;
    const sh = v2 ? clamp(Math.ceil(VIEW_H / this.zoom), 1, VIEW_H) : VIEW_H;
    ctx.imageSmoothingEnabled = this.smoothMode;
    sc.imageSmoothingEnabled = this.smoothMode;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (v2) { sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, VIEW_W, VIEW_H); }
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, sw, sh);
    const half = v2 ? sw / 2 - VIEW_W / 2 : 0, halfY = v2 ? sh / 2 - VIEW_H / 2 : 0;
    const ox = Math.round(half - this.cam.x + this.shakeX + this.camKick.x), oy = Math.round(halfY - this.cam.y + this.shakeY + this.camKick.y);
    this.glowXf = { ox, oy, sw, sh };
    // world -> screen-space (HUD buffer) mapping. Identical to the old formula when v2 is off.
    const sxOf = (wx: number) => (v2 ? (wx + ox - sw / 2) * (VIEW_W / sw) + VIEW_W / 2 : (wx + ox - VIEW_W / 2) * this.zoom + VIEW_W / 2);
    const syOf = (wy: number) => (v2 ? (wy + oy - sh / 2) * (VIEW_H / sh) + VIEW_H / 2 : (wy + oy - VIEW_H / 2) * this.zoom + VIEW_H / 2);
    const lookOn = !!this.level.sideView && this.officeLook.on, view = { ix: -ox, iy: -oy, bw: sw, bh: sh };
    if (lookOn) this.officeLook.drawSky(ctx, sw, sh, -ox, -oy);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.drawImage(this.levelCanvas, 0, 0);
    this.blood.drawStains(ctx);
    if (this.level.sideView) {
      if (lookOn) this.officeLook.drawLive(ctx, this.level, view); else drawOfficeAmbience(ctx, this.level, this.cam.x, this.cam.y, this.time, sw, sh);
      this.doors.drawBack(this, ctx);
    } else if (this.level.outdoor) {
      drawCloudShadows(ctx, this.cam.x, this.cam.y, this.time, sw, sh);
      drawWaterSurface(ctx, this.level, this.cam.x, this.cam.y, this.time, sw, sh);
      drawMeadowLife(ctx, this.level, this.cam.x, this.cam.y, this.time, sw, sh, false);
      this.life.drawBirdShadows(ctx);
      drawGrassWind(ctx, this.level, this.cam.x, this.cam.y, this.time, sw, sh);
      this.life.drawGround(ctx);
    } else {
      // arena dalam ruangan: sorot lampu bergoyang, debu melayang, neon berkedip
      drawArenaAmbience(ctx, this.level, pal, this.cam.x, this.cam.y, this.time, sw, sh);
    }
    for (const h of this.hazards) {
      if (h.kind === 'fire') {
        ctx.globalAlpha = 0.5 * Math.min(1, h.life);
        for (let i = 0; i < 10; i++) px(ctx, h.x + rnd(-h.r, h.r) * 0.8, h.y + rnd(-h.r, h.r) * 0.55, i % 3 ? '#ff6a00' : '#ffd27f');
        pring(ctx, h.x, h.y, h.r, '#ff6a00', 1);
        ctx.globalAlpha = 1;
      } else if (h.kind === 'ring' && h.r > 0) {
        ctx.globalAlpha = clamp(h.life / h.max, 0, 1);
        pring(ctx, h.x, h.y, h.r, '#ffffff', 2);
        pring(ctx, h.x, h.y, Math.max(0, h.r - 3), pal.accent2, 1);
        ctx.globalAlpha = 1;
      }
    }
    if (this.exitOpen) {
      const ex = this.level.exit;
      const t = this.portalT;
      ctx.globalAlpha = 0.18;
      prect(ctx, ex.x - 5, ex.y - 70, 10, 70, pal.accent);
      ctx.globalAlpha = 0.1;
      prect(ctx, ex.x - 9, ex.y - 70, 18, 70, pal.accent);
      ctx.globalAlpha = 0.2;
      pcircle(ctx, ex.x, ex.y, 12 + Math.sin(t * 4) * 2, pal.accent);
      ctx.globalAlpha = 1;
      pring(ctx, ex.x, ex.y, 12 + Math.sin(t * 4) * 2, pal.accent, 2);
      pring(ctx, ex.x, ex.y, 7 + Math.cos(t * 5) * 1.5, '#ffffff', 1);
      for (let i = 0; i < 6; i++) { const a = t * 3 + (i * Math.PI) / 3; px(ctx, ex.x + Math.cos(a) * 10, ex.y + Math.sin(a) * 10 * 0.6, '#ffffff'); }
      pfontO(ctx, 'EXIT', ex.x, ex.y - 26 + Math.sin(t * 3) * 2, '#ffffff', '#000', 1, 'center');
    }
    for (const k of this.pickups) {
      const bob = Math.sin(k.t * 5 + k.x) * 1.5;
      const y = k.y - 4 + bob;
      pellipseShadow(ctx, k.x, k.y + 1);
      const glow = Math.sin(this.time * 6) > 0;
      switch (k.kind) {
        case 'ammoP': prect(ctx, k.x - 2, y - 2, 5, 4, '#1a1200'); prect(ctx, k.x - 1, y - 1, 3, 2, glow ? '#fff2a8' : '#ffd166'); break;
        case 'ammoR': prect(ctx, k.x - 3, y - 2, 7, 4, '#0a1a0e'); prect(ctx, k.x - 2, y - 1, 5, 2, glow ? '#c8ffd4' : '#7bed9f'); break;
        case 'hp': prect(ctx, k.x - 1, y - 3, 3, 7, '#ff3b3b'); prect(ctx, k.x - 3, y - 1, 7, 3, '#ff3b3b'); px(ctx, k.x, y, '#ffffff'); break;
        case 'focus': pline(ctx, k.x, y - 3, k.x + 3, y, '#35f0ff'); pline(ctx, k.x + 3, y, k.x, y + 3, '#35f0ff'); pline(ctx, k.x, y + 3, k.x - 3, y, '#35f0ff'); pline(ctx, k.x - 3, y, k.x, y - 3, '#35f0ff'); px(ctx, k.x, y, '#ffffff'); break;
        case 'rifle': prect(ctx, k.x - 5, y - 1, 10, 2, '#d4d4d4'); prect(ctx, k.x - 5, y + 1, 2, 2, '#8a5a2b'); pfontO(ctx, 'RIFLE', k.x, y - 10, '#7bed9f', '#000', 1, 'center'); break;
        case 'axe': { drawAxeIcon(ctx, k.x, y); ctx.globalAlpha = 0.5 + Math.sin(this.time * 6) * 0.3; pring(ctx, k.x, y, 9, '#ffb347', 1); ctx.globalAlpha = 1; pfontO(ctx, 'AXE', k.x, y - 13, '#ffb347', '#000', 1, 'center'); break; }
        case 'dual': { drawDualIcon(ctx, k.x, y); ctx.globalAlpha = 0.5 + Math.sin(this.time * 6) * 0.3; pring(ctx, k.x, y, 9, '#bfe8ff', 1); ctx.globalAlpha = 1; pfontO(ctx, 'DUAL BLADES', k.x, y - 13, '#bfe8ff', '#000', 1, 'center'); break; }
        case 'katana': {
          pline(ctx, k.x - 8, y + 3, k.x + 7, y - 4, '#000', 3); pline(ctx, k.x - 8, y + 3, k.x + 7, y - 4, '#d9dde3', 1); pline(ctx, k.x - 6, y + 1, k.x - 8, y + 3, '#3b2a6b', 2); px(ctx, k.x - 5, y + 1, '#c9a033');
          ctx.globalAlpha = 0.5 + Math.sin(this.time * 6) * 0.3; pring(ctx, k.x, y, 9, '#bfe8ff', 1); ctx.globalAlpha = 1;
          pfontO(ctx, 'KATANA', k.x, y - 12, '#bfe8ff', '#000', 1, 'center');
          break;
        }
        case 'nunchaku': {
          pline(ctx, k.x - 6, y + 2, k.x - 1, y - 3, '#c9a063', 2); pline(ctx, k.x + 1, y - 3, k.x + 6, y + 2, '#c9a063', 2);
          pline(ctx, k.x - 1, y - 3, k.x + 1, y - 3, '#dcdcdc', 1);
          ctx.globalAlpha = 0.5 + Math.sin(this.time * 6) * 0.3; pring(ctx, k.x, y, 8, '#ffd166', 1); ctx.globalAlpha = 1;
          pfontO(ctx, 'NUNCHAKU', k.x, y - 12, '#ffd166', '#000', 1, 'center');
          break;
        }
      }
    }
    for (const pr of this.props) {
      if (pr.dead) continue;
      pellipseShadow(ctx, pr.x, pr.y + 2, 6);
      const fl = pr.flash > 0 && (pr.hp > 0 || Math.floor(this.time * 18) % 2 === 0);
      if ((lookOn ? this.officeLook.drawV2Prop(ctx, pr, fl, this.time) : drawStaticProp(ctx, pr, fl, this.time, !!this.level.sideView))) {
      } else if (pr.kind === 'crate') {
        prect(ctx, pr.x - 5, pr.y - 9, 11, 11, fl ? '#fff' : '#3a2410');
        prect(ctx, pr.x - 4, pr.y - 8, 9, 9, fl ? '#fff' : '#8a5a2b');
        pline(ctx, pr.x - 4, pr.y - 8, pr.x + 4, pr.y, fl ? '#fff' : '#5a3a1b');
        pline(ctx, pr.x + 4, pr.y - 8, pr.x - 4, pr.y, fl ? '#fff' : '#5a3a1b');
      } else if (this.level.outdoor) {
        // di padang: tong kayu berikat besi, bukan drum minyak kota
        prect(ctx, pr.x - 4, pr.y - 11, 9, 13, fl ? '#fff' : '#3a2612');
        prect(ctx, pr.x - 3, pr.y - 10, 7, 11, fl ? '#fff' : '#8a5f30');
        prect(ctx, pr.x - 1, pr.y - 10, 1, 11, fl ? '#fff' : '#6d4823');
        prect(ctx, pr.x - 3, pr.y - 8, 7, 1, fl ? '#fff' : '#6b6b63');
        prect(ctx, pr.x - 3, pr.y - 3, 7, 1, fl ? '#fff' : '#6b6b63');
        pellipseShadow(ctx, pr.x, pr.y - 10, 3);
      } else {
        prect(ctx, pr.x - 4, pr.y - 11, 9, 13, fl ? '#fff' : '#5a0f0f');
        prect(ctx, pr.x - 3, pr.y - 10, 7, 11, fl ? '#fff' : '#c0392b');
        prect(ctx, pr.x - 3, pr.y - 7, 7, 1, '#2a0a0a');
        prect(ctx, pr.x - 3, pr.y - 3, 7, 1, '#2a0a0a');
        prect(ctx, pr.x - 1, pr.y - 6, 3, 2, fl ? '#fff' : '#ffd166');
      }
    }
    drawJackGround(ctx);
    const sideShadowY = (sx: number, sy: number, r: number, drop = false): number | null => {
      let fy = officeFloorSupportY(this.level, sx, sy, r, drop);
      if (!drop) {
        for (const pr of this.props) {
          if (pr.dead || pr.kind !== 'table') continue;
          const topY = pr.y - 9;
          if (sx >= pr.x - 10 && sx <= pr.x + 10 && sy <= topY + 4 && (fy === null || topY < fy)) fy = topY;
        }
      }
      return fy;
    };
    for (const c of this.corpses) {
      if (this.level.sideView) {
        const fy = sideShadowY(c.x, c.y, 4);
        drawShadow(ctx, c.x, fy ?? c.y, c.scale, Math.max(0, (fy ?? c.y) - c.y));
      } else if (c.z > 0 || this.v2) {
        drawShadow(ctx, c.x, c.y, c.scale, c.z);   // game1: shadow stays under settled bodies
      }
      const fade = c.rd ? (c.t > 13.2 ? Math.max(0, 1 - (c.t - 13.2) / 0.8) : 1) : this.v2 && c.t > 1.8 ? Math.max(0, 1 - (c.t - 1.8) / 0.5) : 1;
      if (c.rd) { c.rd.draw(ctx, fade); this.bow.drawOnRagdoll(ctx, c.rd, fade); continue; }
      drawStick(ctx, { x: c.x, y: c.y, c: c.color, c2: c.color2, scale: c.scale, facing: c.face ?? (Math.cos(c.rot) >= 0 ? 1 : -1), aim: c.rot, walk: 0, moving: false, pose: this.v2 ? (c.z > 2 ? 'fly' : 'knock') : c.z > 0 ? 'launched' : 'down', t: 0, acc: c.accessory, shades: c.shades ?? 0, eyeStyle: c.eyeStyle ?? 'dot', weapon: 'none', flash: false, alpha: (c.z > 0 ? 1 : 0.8) * fade, outline: c.z > 0 ? '#000' : null, eyes: '#000', time: this.v2 ? this.time : 0, lean: { x: 1, y: 0 }, rot: this.v2 ? c.rot : c.z > 0 ? c.rot : 0, z: c.z, mood: 'dead', sqx: this.v2 ? (c.sqx ?? 1) : 1, sqy: this.v2 ? (c.sqy ?? 1) : 1 });
    }
    this.bow.drawWorld(ctx);
    if (this.smoothMode || this.view2d) drawSoftShadows(this, ctx);
    const shadowScale = 1;
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      if (this.level.sideView) {
        const fy = sideShadowY(e.x, e.y, e.r);
        drawShadow(ctx, e.x, fy ?? e.y, e.scale * shadowScale, Math.max(0, (fy ?? e.y) - e.y));
      } else {
        drawShadow(ctx, e.x, e.y, e.scale * shadowScale, e.z);
      }
    }
    if (this.state !== 'dead') {
      if (this.level.sideView) {
        const fy = sideShadowY(p.x, p.y, p.r, (p.svDropT ?? 0) > 0);
        drawShadow(ctx, p.x, fy ?? p.y, shadowScale * (1 + 0.3 * p.gaitRun), Math.max(0, (fy ?? p.y) - p.y));
      } else {
        drawShadow(ctx, p.x, p.y, shadowScale * (1 + 0.3 * p.gaitRun), p.z);
      }
    }
    this.ally.drawShadow(ctx);
    this.team.drawShadows(ctx);
    for (const a of this.afterimages) {
      drawStick(ctx, { x: a.x, y: a.y, c: a.color, c2: a.color, scale: a.scale, facing: a.facing, aim: a.aim, walk: 0, moving: false, pose: a.pose, t: a.t, acc: 'none', weapon: 'none', flash: a.dancePhase === undefined, alpha: (a.life / a.max) * 0.45, outline: null, eyes: a.color, time: 0, lean: a.lean, limbScale: this.longMode ? 2.5 : 1, dancePhase: a.dancePhase, sideView: !!this.level.sideView });
    }
    // Back-view blood & shockwaves behind fighters & punches so attacks stay crisp and clearly readable
    if (lookOn) this.officeLook.drawAmbient(ctx, view);
    if (this.v1hit && this.level.sideView) this.v1hit.back.draw(ctx);
    this.blood.drawDropsBack(ctx);
    this.particles.drawBack(ctx);
    const ftg = this.state === 'playing' && !p.fatality ? this.fatalityTarget() : null;
    this.fatTargetId = ftg && (ftg.e.stagger > 0 || this.fatalityCd <= 0) ? ftg.e.id : -1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ents: any[] = [...this.enemies.filter((e) => !e.dead)];
    if (this.state !== 'dead') ents.push('player');
    if (this.ally.on) ents.push('ally');
    if (this.team.on) for (const u of this.team.allies) if (!u.dead) ents.push(u);
    const yOf = (a: any) => (a === 'player' ? p.y : a === 'ally' ? this.ally.y : a.y);
    ents.sort((a, b) => yOf(a) - yOf(b));
    for (const en of ents) {
      if (en === 'ally') { this.ally.draw(this, ctx); continue; }
      if (en !== 'player' && en.isAlly) { this.team.drawUnit(this, ctx, en); continue; }
      if (en === 'player') {
        const bodySpin = p.weapon === 'bow' ? this.bow.spinA : (p.weapon === 'pistol' || p.weapon === 'rifle') ? this.guns.spinA : 0;
        if (bodySpin !== 0) {
          const cy = p.y - p.z - 7;
          ctx.save(); ctx.translate(p.x, cy); ctx.rotate(-bodySpin * p.facing); ctx.translate(-p.x, -cy);
          this.drawPlayer();
          ctx.restore();
        } else this.drawPlayer();
      }
      else this.drawEnemy(en);
    }
    this.bu.drawSlashes(ctx);
    this.bossExchange.draw(this, ctx);
    this.drawFighterTells(ctx);
    this.mirrorSystem.draw(this, ctx);
    this.botPunch.draw(this, ctx);
    this.muay.draw(this, ctx);
    this.propsPlay.draw(this, ctx);
    if (this.level?.sideView) this.doors.draw(this, ctx);
    this.carry.draw(this, ctx);
    this.team.drawBullets(ctx);
    this.brut.drawWorld(ctx, this);
    this.gates.drawHint(ctx, this);
    this.team.drawOverlay(this, ctx);
    drawJackAir(ctx);
    this.grab.draw(this, ctx);
    this.gd.drawFx(this, ctx);
    this.guns.drawTrails(ctx);
    this.bow.drawFlying(ctx);
    for (const bm of this.bu.beams) drawBeam(ctx, bm, this.time);
    for (const b of this.bullets) {
      if (b.kind === 'bomb') {
        const land = { x: b.x + b.vx * b.life, y: b.y + b.vy * b.life };
        ctx.globalAlpha = 0.5 + Math.sin(this.time * 20) * 0.3;
        pring(ctx, land.x, land.y, 20, '#ff4040', 1);
        ctx.globalAlpha = 1;
        pellipseShadow(ctx, b.x, b.y, 3);
        pcircle(ctx, b.x, b.y - (b.z ?? 0), 2.5, '#1a1a1a');
        px(ctx, b.x, b.y - (b.z ?? 0) - 3, Math.floor(this.time * 20) % 2 ? '#fff' : '#ff9f43');
      } else {
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const nx = b.vx / sp, ny = b.vy / sp;
        if (b.kind === 'orb') {
          ctx.globalAlpha = 0.35; pline(ctx, b.x, b.y, b.x - nx * 6, b.y - ny * 6, b.color, 1); ctx.globalAlpha = 1;
          pcircle(ctx, b.x, b.y, 2.5 + Math.sin(this.time * 20) * 0.5, b.color); px(ctx, b.x, b.y, '#ffffff');
        } else if (b.kind === 'sniper') {
          pline(ctx, b.x, b.y, b.x - b.vx * 0.03, b.y - b.vy * 0.03, '#ffffff', 2);
        } else {
          if (b.owner === 'player') {
            this.gunfx.drawTracer(ctx, b.x, b.y, b.vx, b.vy, b.kind === 'pistol', this.time);
          } else {
            const len = 10;
            ctx.globalAlpha = 0.18; pline(ctx, b.x - nx * len * 0.5, b.y - ny * len * 0.5, b.x - nx * len, b.y - ny * len, b.color, 1);
            ctx.globalAlpha = 0.45; pline(ctx, b.x - nx * len * 0.2, b.y - ny * len * 0.2, b.x - nx * len * 0.5, b.y - ny * len * 0.5, b.color, 1);
            ctx.globalAlpha = 0.9; pline(ctx, b.x, b.y, b.x - nx * len * 0.2, b.y - ny * len * 0.2, '#ffffff', 1);
            ctx.globalAlpha = 1;
            prect(ctx, b.x - 1, b.y - 1, 3, 3, b.color); px(ctx, b.x, b.y, '#ffffff');
          }
        }
      }
    }
    this.gunfx.drawBack(ctx);
    this.particles.draw(ctx);
    if (this.v1hit && this.level.sideView) this.v1hit.fx.draw(ctx);
    if (lookOn) { this.officeLook.drawLights(ctx, view); this.officeLook.drawWeather(ctx, view); }
    this.gunfx.drawFront(ctx);
    this.blood.drawDropsFront(ctx);
    this.katana.drawArcs(ctx);
    // enemy muzzle flashes
    for (let i = this.enemyMuzzles.length - 1; i >= 0; i--) {
      const m = this.enemyMuzzles[i];
      m.t -= this.rawDt;
      if (m.t <= 0) { this.enemyMuzzles.splice(i, 1); continue; }
      const k = m.t / 0.06;
      ctx.globalAlpha = 0.9 * k;
      const len = 5 + rnd(0, 2);
      pline(ctx, m.x, m.y, m.x + Math.cos(m.a) * len, m.y + Math.sin(m.a) * len, m.c, 2);
      pline(ctx, m.x, m.y, m.x + Math.cos(m.a + 0.6) * len * 0.5, m.y + Math.sin(m.a + 0.6) * len * 0.5, m.c, 1);
      pline(ctx, m.x, m.y, m.x + Math.cos(m.a - 0.6) * len * 0.5, m.y + Math.sin(m.a - 0.6) * len * 0.5, m.c, 1);
      pcircle(ctx, m.x, m.y, 1.5, '#ffffff');
      ctx.globalAlpha = 0.12 * k;
      pcircle(ctx, m.x, m.y, 14, m.c);
      ctx.globalAlpha = 1;
    }
    for (const e of this.enemies) {
      if (e.dead || e.spawnT > 0) continue;
      const shooter = e.kind === 'gunner' || e.kind === 'rifleman' || e.kind === 'sniper' || e.kind === 'smg' || e.kind === 'shotgun' || e.boss === 'queen';
      if (e.state === 'windup' && shooter) {
        // aim telegraph: a laser that solidifies as the shot comes; wide cone for shotgun / smg
        const a = clamp(1 - e.stateT / e.poseDur, 0, 1);
        const len = e.kind === 'sniper' ? 320 : e.kind === 'shotgun' ? 70 : 170;
        const hx = e.x + Math.cos(e.aim) * 8 * e.scale, hy = e.y - 7 * e.scale + Math.sin(e.aim) * 6;
        const col = e.kind === 'sniper' ? '#ff2a2a' : e.kind === 'smg' ? '#7fe3ff' : e.kind === 'shotgun' ? '#ffb8b8' : '#ff8080';
        if (e.kind === 'shotgun' || e.kind === 'smg') {
          const spread = e.kind === 'shotgun' ? 0.36 : 0.3;
          ctx.globalAlpha = a * 0.35;
          pline(ctx, hx, hy, hx + Math.cos(e.aim + spread) * len, hy + Math.sin(e.aim + spread) * len, col, 1);
          pline(ctx, hx, hy, hx + Math.cos(e.aim - spread) * len, hy + Math.sin(e.aim - spread) * len, col, 1);
        }
        ctx.globalAlpha = a * (e.kind === 'sniper' ? 0.9 : 0.55);
        const dashLen = a < 0.7 ? 6 : 1000;
        for (let d0 = 0; d0 < len; d0 += dashLen * 2) {
          const d1 = Math.min(len, d0 + dashLen);
          pline(ctx, hx + Math.cos(e.aim) * d0, hy + Math.sin(e.aim) * d0, hx + Math.cos(e.aim) * d1, hy + Math.sin(e.aim) * d1, col, 1);
          if (dashLen > len) break;
        }
        // "!" over the head right before the shot
        if (a > 0.6) pfontO(ctx, '!', e.x, e.y - e.z - 15 * e.scale - 8, Math.floor(this.time * 20) % 2 ? col : '#ffffff', '#000', 1, 'center');
        ctx.globalAlpha = 1;
      }
      if (e.reload > 0 && !e.boss) {
        const def = e.kind !== 'boss' ? (e.reload / 2.2) : 0;
        prect(ctx, e.x - 6, e.y - 15 * e.scale - 6, 12, 2, '#111');
        prect(ctx, e.x - 6, e.y - 15 * e.scale - 6, Math.round(12 * (1 - clamp(def, 0, 1))), 2, '#aaaaaa');
      }
      if (e.state === 'chargewind') {
        ctx.globalAlpha = 0.3 + Math.sin(this.time * 25) * 0.2;
        pline(ctx, e.x, e.y, e.x + Math.cos(e.aim) * 300, e.y + Math.sin(e.aim) * 300, '#ff3030', 3);
        ctx.globalAlpha = 1;
      }
      if (e.state === 'slamwind') {
        ctx.globalAlpha = 0.3 + Math.sin(this.time * 20) * 0.2;
        pring(ctx, e.x, e.y, 34, '#ff3030', 1);
        ctx.globalAlpha = 1;
      }
    }
    if (this.level.outdoor) {
      // garis air digambar SETELAH tokoh supaya lutunya benar-benar terendam
      const pl2 = this.player;
      const pd = pondDepth(this.level, pl2.x, pl2.y);
      if (pd > 0.02 && pl2.z < 4) drawWaterLine(ctx, pl2.x, pl2.y + 1, 6, pd, this.time, 0);
      for (const e of this.enemies) {
        if (e.dead || e.z > 4) continue;
        const ed = pondDepth(this.level, e.x, e.y);
        if (ed > 0.02) drawWaterLine(ctx, e.x, e.y + 1, 6 * e.scale, ed, this.time, e.id * 0.37);
      }
      if (this.clash) this.clash.draw(ctx);
      drawMeadowAir(ctx, this.cam.x, this.cam.y, this.time, sw, sh);
      drawMeadowLife(ctx, this.level, this.cam.x, this.cam.y, this.time, sw, sh, true);
      this.drawCanopy(ctx, ox, oy, sw, sh);
      drawArenaDeco(ctx, this.level, this.cam.x, this.cam.y, this.time, sw, sh);
      this.life.drawSky(ctx);
    }
    if (this.clash && !this.level.outdoor) this.clash.draw(ctx);
    if (!v2 && this.level.sideView && this.glowOn) this.drawGlow(ctx, 1);
    this.texts.draw(ctx);
    ctx.restore();

    // ---- present scene (with cinematic zoom) + screen-space layers
    if (!v2) {
      sc.fillStyle = pal.bg;
      sc.fillRect(0, 0, VIEW_W, VIEW_H);
      if (this.zoom !== 1) {
        sc.save();
        sc.translate(VIEW_W / 2, VIEW_H / 2);
        sc.scale(this.zoom, this.zoom);
        sc.translate(-VIEW_W / 2, -VIEW_H / 2);
        sc.drawImage(this.scene, 0, 0);
        sc.restore();
      } else sc.drawImage(this.scene, 0, 0);
    }
    if (this.wipe) {
      const r = Math.max(0, (1 - this.wipe.t) * 560);
      // the scene is presented zoomed (BASE_ZOOM), so map the wipe centre from scene to screen space
      const wx = sxOf(p.x);
      const wy = syOf(p.y - 6);
      sc.fillStyle = '#000';
      sc.beginPath();
      sc.rect(0, 0, VIEW_W, VIEW_H);
      sc.arc(wx, wy, r, 0, Math.PI * 2, true);
      sc.fill('evenodd');
    }
    if (this.flashA > 0) { sc.globalAlpha = Math.min(0.8, this.flashA); sc.fillStyle = this.flashC; sc.fillRect(0, 0, VIEW_W, VIEW_H); sc.globalAlpha = 1; }
    if (this.filters) drawVignette(sc, this.vignette);
    if (this.blood.gore && this.state !== 'menu') this.blood.drawScreen(sc, this.player.hp / this.maxHp(), this.time);
    if (this.state === 'playing' && p.hp <= 1) { sc.globalAlpha = 0.08 + Math.sin(this.time * 6) * 0.05; sc.fillStyle = '#ff0000'; sc.fillRect(0, 0, VIEW_W, VIEW_H); sc.globalAlpha = 1; }
    if (this.timeScale < 0.75 || this.cinematic) {
      const h = this.cinematic ? 18 : Math.round((0.75 - this.timeScale) * 40);
      prect(sc, 0, 0, VIEW_W, h, '#000'); prect(sc, 0, VIEW_H - h, VIEW_W, h, '#000');
    }
    if (this.state === 'menu') {
      this.present(sw, sh);
      return;
    }
    if (this.smoothMode && !this.view2d) drawDepthLight(this, sc, sxOf, syOf);
    drawHUD(sc, this);
    this.gates.drawHud(sc, this, VIEW_W, VIEW_H);
    this.brut.drawScreen(sc, this);
    if (this.state === 'playing') {
      const alive = this.enemies.filter((e) => !e.dead);
      const targets: { x: number; y: number; c: string; label?: string }[] = [];
      if (this.mode === 'survival') { for (const e of alive) if (e.boss) targets.push({ x: e.x, y: e.y, c: '#ff2a2a', label: 'BOSS' }); }
      else if (alive.length <= 3 && this.spawnQueue.length === 0) for (const e of alive) targets.push({ x: e.x, y: e.y, c: e.color });
      if (this.exitOpen) targets.push({ x: this.level.exit.x, y: this.level.exit.y, c: pal.accent, label: 'EXIT' });
      for (const t of targets) {
        const sx = v2 ? sxOf(t.x) : t.x - this.cam.x, sy = v2 ? syOf(t.y) : t.y - this.cam.y;
        if (sx >= 0 && sx <= VIEW_W && sy >= 0 && sy <= VIEW_H) continue;
        const m = 14;
        const ax = clamp(sx, m, VIEW_W - m), ay = clamp(sy, m, VIEW_H - m);
        const a = Math.atan2(sy - ay, sx - ax);
        const tipx = ax + Math.cos(a) * 6, tipy = ay + Math.sin(a) * 6;
        const b1x = ax + Math.cos(a + 2.5) * 5, b1y = ay + Math.sin(a + 2.5) * 5;
        const b2x = ax + Math.cos(a - 2.5) * 5, b2y = ay + Math.sin(a - 2.5) * 5;
        sc.globalAlpha = 0.6 + Math.sin(this.time * 8) * 0.3;
        pline(sc, tipx, tipy, b1x, b1y, t.c, 1); pline(sc, tipx, tipy, b2x, b2y, t.c, 1); pline(sc, b1x, b1y, b2x, b2y, t.c, 1);
        if (t.label) pfontO(sc, t.label, ax, ay + (sy > ay ? -14 : 9), t.c, '#000', 1, 'center');
        sc.globalAlpha = 1;
      }
    }
    if (this.bannerT > 0 && this.state === 'playing' && this.mode === 'story') {
      // Kartu level: dulu pita lebar di tengah layar yang menutupi pemain.
      // Sekarang ringkas di pita atas, jadi arena tetap terlihat penuh.
      const el = 2.4 - this.bannerT;
      const a = el < 0.25 ? el / 0.25 : this.bannerT < 0.5 ? this.bannerT / 0.5 : 1;
      const z = ZONES[this.level.zone];
      const sub = `LEVEL ${this.levelN}${this.level.isBoss ? ' - BOSS' : ''}   ${z.sub}`;
      const w = Math.min(VIEW_W - 16, Math.max(textWidth(z.name, 2), textWidth(sub, 1)) + 16);
      const bx = VIEW_W / 2 - w / 2, by = 48;
      sc.globalAlpha = a * 0.72;
      prect(sc, bx, by - 4, w, 26, '#000');
      sc.globalAlpha = a;
      prect(sc, bx, by - 5, w, 1, pal.accent);
      prect(sc, bx, by + 22, w, 1, pal.accent);
      pfontO(sc, z.name, VIEW_W / 2, by, pal.accent, '#000', 2, 'center');
      pfont(sc, sub, VIEW_W / 2, by + 13, '#9a9a9a', 1, 'center');
      sc.globalAlpha = 1;
    }
    if (this.state === 'dead') {
      sc.fillStyle = 'rgba(60,0,0,0.35)';
      sc.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    this.present(sw, sh);
  }

  /** Kanopi di atas pemain, dilubangi lembut di sekitarnya supaya aksi tetap terlihat. */
  private drawCanopy(ctx: CanvasRenderingContext2D, ox: number, oy: number, sw: number, sh: number) {
    const cv = this.canopyCanvas;
    if (!cv) return;
    if (!this.canopyMask) this.canopyMask = document.createElement('canvas');
    const m = this.canopyMask;
    // Masker SELALU beresolusi logis 480x270 lalu diperbesar. Kanopinya pixel art,
    // jadi hasilnya identik tapi biaya kompositnya turun berkali lipat di layar besar.
    if (m.width !== VIEW_W || m.height !== VIEW_H) { m.width = VIEW_W; m.height = VIEW_H; }
    const mc = m.getContext('2d')!;
    const k = VIEW_W / sw;
    mc.setTransform(1, 0, 0, 1, 0, 0);
    mc.globalCompositeOperation = 'source-over';
    mc.clearRect(0, 0, VIEW_W, VIEW_H);
    mc.imageSmoothingEnabled = this.smoothMode;
    mc.drawImage(cv, ox * k, oy * k, cv.width * k, cv.height * k);
    const p = this.player;
    const hx = (p.x + ox) * k, hy = (p.y - 8 - p.z + oy) * k;
    const r = 30 * k;
    const grd = mc.createRadialGradient(hx, hy, r * 0.35, hx, hy, r);
    grd.addColorStop(0, 'rgba(0,0,0,1)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    mc.globalCompositeOperation = 'destination-out';
    mc.fillStyle = grd;
    mc.beginPath(); mc.arc(hx, hy, r, 0, Math.PI * 2); mc.fill();
    mc.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.96;
    ctx.imageSmoothingEnabled = this.smoothMode;
    ctx.drawImage(m, -ox, -oy, sw, sh);
    ctx.globalAlpha = 1;
  }

  drawPlayer() {
    const ctx = this.wctx;
    const p = this.player;
    let pose: Pose = 'idle';
    let t = 0;
    let trail: string | null = null;
    if (this.state === 'menu' && this.menuMove) { pose = MOVES[this.menuMove].pose; t = 0.3 + 0.6 * Math.min(1, this.menuMoveT / 0.5); }
    else if (p.fatality || p.holdT > 0) { pose = p.holdPose; t = p.holdPoseT; if (p.fatality) trail = this.pal.accent2; }
    else if (p.rageDash) pose = 'ragedash';
    else if (p.airMagnet) { pose = 'flying'; t = 0.4; trail = '#7ce7ff'; }
    else if (p.dashT > 0 || p.focusDash) pose = p.weapon === 'boxing' && this.box.stance === 'tyson' ? 'bx_roll' : 'dash';
    else if (p.attackPhase !== 'none' && p.moveKey) {
      const m = MOVES[p.moveKey];
      pose = m.pose;
      t = this.attackPoseT();
      if (m.trail) {
        trail = m.pose === 'butterflyflip' ? '#ff9d3b'
          : m.pose === 'cartwheelkick' ? '#ffe07a'
          : m.pose === 'axekick' ? '#ffd27f'
          : m.yoyo ? this.yoyoV2.skin.aura : this.pal.accent2;
      }
    }
    else if ((p.svJumpAntT ?? 0) > 0 || (p.jumpAntT ?? 0) > 0) {
      // Prinsip Anticipation: karakter membungkuk rendah 1-2 frame sebelum melompat agar tolakan terasa bertenaga!
      const rem = this.level.sideView ? (p.svJumpAntT ?? 0) : (p.jumpAntT ?? 0);
      const maxA = this.level.sideView ? (p.svJumpAntMax || 0.036) : (p.jumpAntMax || 0.036);
      pose = 'jump_anticip';
      t = clamp(1 - rem / maxA, 0, 1);
    }
    else if (p.weapon === 'hayabusa' && this.hay.bodyPose && !p.airborne && p.landT <= 0 && p.stunT <= 0 && p.parryT <= 0) { pose = this.hay.bodyPose; t = this.hay.bodyT; }
    else if (p.weapon === 'takamura' && this.tak.bodyPose && !p.airborne && p.landT <= 0 && p.stunT <= 0 && p.parryT <= 0) { pose = this.tak.bodyPose; t = this.tak.bodyT; }
    else if (p.weapon === 'yoyo' && this.yoyoVer === 1 && this.yoyo.bodyPose && !p.airborne && p.landT <= 0 && p.stunT <= 0 && p.parryT <= 0) { pose = this.yoyo.bodyPose; t = this.yoyo.bodyT; if (this.yoyo.trailCol) trail = this.yoyo.trailCol; }
    else if (p.airborne) { const jv = this.level.sideView ? -(p.svVy ?? 0) : p.vz; pose = 'jump'; t = jv > 48 ? 0.15 + 0.22 * clamp(1 - jv / 195, 0, 1) : jv > -48 ? 0.45 : clamp(0.55 + 0.28 * (1 - Math.max(0, p.z) / 30), 0.5, 0.84); }
    else if (p.landT > 0) { pose = 'jump'; t = 0.85 + 0.15 * (1 - p.landT / 0.12); }
    else if (p.parryT > 0 || p.parryCd > 0.3) pose = 'parry';
    else if (p.stunT > 0) pose = 'hurt';
    else if (p.weapon === 'pistol' || p.weapon === 'rifle' || p.weapon === 'shotgun') pose = 'shoot';
    else if (p.weapon === 'boxing') {
      const st = this.box.stance;
      pose = p.moving && (this.level.sideView || p.runT > 0.03)
        ? (st === 'ali' ? 'bx_float' : st === 'tyson' ? 'bx_weave' : 'bx_press')
        : (st === 'ali' ? 'bx_ali' : st === 'tyson' ? 'bx_peek' : 'bx_ippo');
    }
    else if (p.weapon === 'fist' && this.ippoGuardT > 0 && !(p.moving && (this.level.sideView || p.runT > 0.03)) && p.attackPhase === 'none') pose = 'bx_ippo';
    else if (p.moving && (this.level.sideView || p.runT > 0.03)) pose = 'run';
    else if (p.weapon === 'foot') {
      const stance = this.footStancePose();
      pose = stance?.pose ?? (this.footVer === 2 ? 'foot_v2_guard' : 'foot_guard'); t = stance?.t ?? 0;
    }
    else if (p.weapon === 'scythe') { pose = 'scy_guard'; t = (this.time * 1.1) % 1; }
    else if (p.weapon === 'yoyo' && this.yoyoVer === 2) pose = 'y2_idle';
    else if (p.weapon === 'nunchaku') pose = 'n_idle';
    else if (p.weapon === 'katana') pose = p.sheatheT > 0 ? 'k_sheathe' : 'k_idle';
    else if (p.weapon === 'axe' && this.lev.bodyPose) { pose = this.lev.bodyPose; t = this.lev.bodyT; }
    else if (p.weapon === 'axe' && this.lev.held) pose = 'a_idle';
    else if (p.weapon === 'bat') pose = 'a_idle';
    else if (p.weapon === 'dual') pose = 'd_idle';
    else if (p.weapon === 'buster') pose = this.bu.punisher || this.bu.restT > 0 ? 'a_idle' : 'k_idle';
    if (p.weapon === 'buster' && this.bu.omni) { pose = this.buOmniPose; t = 0.5; }
    if (p.weapon === 'buster' && this.bu.charging && p.attackPhase === 'none' && !p.airborne && p.stunT <= 0) { pose = 'k_heaven'; t = 0.05 + 0.2 * this.bu.charge; }
    if ((p.weapon === 'pistol' || p.weapon === 'rifle') && p.attackPhase === 'none' && !p.fatality && !this.silat && p.stunT <= 0) {
      const pq = p.weapon === 'pistol' ? this.pis.poseOverride() : null;
      if (pq) { pose = pq.pose; t = pq.t; }
      else {
        const q = this.guns.trickPose();
        if (q) { pose = q.pose; t = q.t; }
        else if (this.guns.twirlT > 0 && !p.airborne) { pose = 'gun_twirl'; t = 1 - this.guns.twirlT / this.guns.TWIRL_DUR; }
      }
    }
    if (this.sfNunOn && p.attackPhase === 'none' && !p.fatality && !this.silat && p.stunT <= 0 && p.parryT <= 0 && !p.airborne) {
      const np = this.sfNun.bodyPose();
      if (np) {
        pose = np.pose;
        t = np.t;
        if (this.sfNun.attacking) trail = this.fireOn ? '#ffb04a' : this.pal.accent2;
      }
    }
    if (p.weapon === 'bat' && this.batTauntT > 0 && p.attackPhase === 'none' && !p.fatality && !this.silat) {
      const fu = clamp(1 - this.batTauntT / 0.85, 0, 1);
      pose = this.batFlourishKind === 'twirl' ? 'b_windmill'
        : this.batFlourishKind === 'toss' ? 'b_tosscatch'
        : this.batFlourishKind === 'call' ? 'b_callshot'
        : 'b_behind';
      t = this.batFlourishKind === 'call' ? fu * 0.28 : fu;
      trail = '#ffd27f';
    }
    if (p.weapon === 'bow' && p.attackPhase === 'none' && !p.fatality && !this.silat && p.stunT <= 0) {
      const acro = !!this.bow.trick;
      if (acro || (!p.airborne && p.dashT <= 0 && p.parryT <= 0)) {
        const q = this.bow.trickPose;
        if (q) { pose = q.pose; t = q.t; }
        else if (this.bow.flourishT > 0) { pose = 'bow_twirl'; t = 1 - this.bow.flourishT / this.bow.FLOURISH_DUR; }
        else { pose = 'bow'; t = this.bow.drawVis; }
      }
    }
    const bp = this.botPunch.poseOverride();
    if (bp) { pose = bp.pose as Pose; t = bp.t; }
    const mp = this.muay.poseOverride();
    if (mp) { pose = mp.pose as Pose; t = mp.t; }
    const tp = this.tkd.poseOverride();
    if (tp) { pose = tp.pose as Pose; t = tp.t; }
    const cp = this.carry.poseOverride();
    if (cp) {
      pose = cp.pose as Pose;
      t = cp.t;
      if (cp.pose === 'throw_pot') trail = '#ff8da1';
      else if (cp.pose === 'throw_comp') trail = '#46e2ff';
    }
    const gp = p.weapon === 'guandao' ? this.gd.bodyPose(this) : null;
    if (gp && !cp) { pose = gp.pose as Pose; t = gp.t; }
    const gr = this.grab.poseOverride();
    if (gr) { pose = gr.pose as Pose; t = gr.t; }
    if (pose === 'k_sheathe') t = 1 - p.sheatheT / 0.45;
    // pose transition blending: smooth natural transitions, tetapi frame ancang-ancang (jump_anticip / salto / axekick / lempar)
    // tampil TAJAM seketika agar 1-2 frame membungkuk rendah benar-benar terbaca bertenaga!
    const crispAnticip = (isScythePose(pose) && pose !== 'scy_guard') || (isFootPose(pose) && pose !== 'foot_guard' && pose !== 'foot_v2_guard') || pose === 'jump_anticip' || p.prevPose === 'jump_anticip' || pose === 'butterflyflip' || pose === 'cartwheelkick' || pose === 'monkeyflip' || pose === 'axekick' || pose === 'throw_pot' || pose === 'throw_comp';
    if (crispAnticip) {
      p.blend = 0; p.prevPose = pose; p.blendPose = pose;
    } else if (pose !== p.blendPose) {
      // SMOOTH FIST: pose baru selalu memudar dari pose terakhir yang sedang tampil (blendPose),
      // bukan dari pose basi dua jurus lalu — rantai kombo cepat tak lagi menyentak.
      p.prevPose = p.blendPose; p.prevPoseT = this.lastPoseT;
      p.blend = pose === 'dash' || pose === 'hurt' ? 0.5 : 1;
      p.blendPose = pose;
    }
    const blendDur = p.weapon === 'boxing' ? 0.115 : (p.weapon === 'fist' && p.attackPhase !== 'none') ? 0.105 : (p.attackPhase !== 'none' || p.dashT > 0) ? 0.085 : 0.11;
    p.blend = Math.max(0, p.blend - this.rawDt / blendDur);
    const prevPose = p.prevPose;
    if (p.blend <= 0.01) p.prevPose = pose;
    this.lastPoseT = t;
    const blink = p.iframes > 0 && !p.fatality && Math.floor(this.time * 24) % 2 === 0;
    const opts = this.playerStickOpts(pose, t); // SAME skeleton the hit-tester uses
    if (this.mode === 'team') opts.c2 = '#2a8cff';
    if (pose === 'ragedash' || p.rageDash) { opts.pose = 'ragedash'; opts.c = '#ff6a6a'; }
    if (p.rageOn) { opts.c2 = '#ff2a2a'; opts.eyes = '#ff2a2a'; }
    opts.alpha = blink ? 0.45 : 1; opts.trail = trail;
    if (p.weapon === 'guandao' && !p.fatality && !this.grab.holding && !cp && this.state !== 'dead') { const gh = this.gd.grips(this); opts.handOverride = gh.front; opts.bhandOverride = gh.back; }
    if (p.attackPhase !== 'none' && p.moveKey) {
      const m = MOVES[p.moveKey];
      if (m.limb === 'fhand' || m.limb === 'bhand' || m.limb === 'ffoot' || m.limb === 'bfoot' || m.limb === 'both') { opts.strike = m.id === 'chain' && p.chainSide < 0 ? 'bhand' : m.limb; opts.impact = m.id === 'chain' ? (t <= 0.35 ? 1 : 0) : t >= 0.27 && t <= 0.7 ? 1 : 0; }
      if (m.limb === 'sweep') { opts.strike = 'ffoot'; opts.impact = t >= 0.27 && t <= 0.74 ? 1 : 0; }
      const feet = footMove(m);
      if (feet && (m.limb === 'ffoot' || m.limb === 'bfoot')) {
        const beat = feet.foot.beats?.[this.footwork.contactBeat];
        opts.strike = footLeg(beat?.leg ?? m.limb, this.footwork.attackLead);
        if (feet.foot.beats && !beat) opts.impact = 0;
      }
    }
    opts.mood = p.stunT > 0 ? 'hurt' : p.fatality || p.attackPhase !== 'none' ? 'angry' : this.combo >= 6 ? 'happy' : 'normal';
    if (this.silat) {
      const beat = this.silat.sc.beats[Math.min(this.silat.i, this.silat.sc.beats.length - 1)];
      const victim = this.enemies.find((enemy) => enemy.id === this.silat!.id);
      if (beat.head && victim) { const r = victim.sceneRot ?? 0, scale = victim.scale; opts.handOverride = { x: victim.x + Math.sin(r) * 6 * scale, y: victim.y - 5 * scale - Math.cos(r) * 6 * scale - (victim.sceneZ ?? 0) - victim.z }; }
      opts.mood = 'angry';
    }
    if ((p.weapon === 'fist' || p.weapon === 'nunchaku' || p.weapon === 'bat') && !this.silat && this.silatLinkT > 0 && !p.fatality) {
      const next = this.silatLinkTarget();
      if (next) { pline(ctx, p.x, p.y - 6, next.x, next.y - 6, 'rgba(255,210,127,0.35)', 1); pfontO(ctx, 'G: LINK!', next.x, next.y - 26 - next.z, '#9be7ff', '#000', 1, 'center'); }
    }
    if ((p.weapon === 'fist' || p.weapon === 'nunchaku' || p.weapon === 'bat') && !this.silat && !p.fatality && this.state === 'playing') {
      const target = this.silatTarget(false);
      if (target && Math.floor(this.time * 6) % 2 === 0) pfontO(ctx, 'G: GRAB!', target.x, target.y - 26 - target.z, '#ffd27f', '#000', 1, 'center');
    }
    if (!cp && p.weapon === 'yoyo' && this.yoyoVer === 1 && !p.fatality && this.state !== 'dead' && this.yoyo.weldHand) opts.handOverride = { x: this.yoyo.hand.x, y: this.yoyo.hand.y };
    if (!cp && this.sfNunOn && !p.fatality && !p.dead && this.sfNun.pts.length === 6) {
      opts.handOverride = { x: this.sfNun.pts[0].x, y: this.sfNun.pts[0].y };
      if (this.sfNun.attacking) opts.mood = 'angry';
    } else if (!cp && this.v2 && p.weapon === 'nunchaku' && !p.fatality && !p.dead) {
      // V2: telapak tangan DEPAN dilas ke grip rantai (world) — lengan di-IK ulang oleh solvePose,
      // jadi nunchaku benar-benar dipegang, bukan melayang di samping tangan
      opts.handOverride = { x: this.nunchaku.px[0], y: this.nunchaku.py[0] };
    }
    if (!cp && p.weapon === 'pistol' && !p.fatality && !p.dead) {
      const hp = this.pis.handPos(this);
      if (hp) opts.handOverride = hp; // operan belakang punggung: pistol berpindah ke tangan belakang
      if (this.pis.tossAirborne()) opts.weapon = 'none'; // pistol sedang melayang di udara (toss & catch)
    }
    if (this.level.outdoor && p.z < 3) {
      const wd = pondDepth(this.level, p.x, p.y);
      if (wd > 0.02) opts.y += wd * 3.2;      // badan turun selutut ke dalam air
    }
    if (this.gates.visible) this.gates.drawAura(ctx, this, opts, this.rawDt);
    if (this.gates.on || this.gates.lotus) {
      // warna kulit TIDAK berubah; hanya ekspresi mata yang mengikuti fase sinematik (santai > terpejam > melotot)
      const lk = this.gates.look(); opts.mood = lk.mood; opts.eyes = lk.eyes;
    }
    if (this.level.sideView && this.glowOn && p.ofaActive && !p.fatality) this.glowFx.ofaAura(ctx, p.x, p.y - p.z);
    this.muay.bindPose(this, opts);
    if (pose === 'foot_flamingo_switch') drawFootPivot(ctx, p.x, p.y, 1, t, footStanceColor(this.footwork.lead), this.footMotion.matches);
    const kick = p.attackPhase !== 'none' && p.moveKey ? footMove(MOVES[p.moveKey]) : undefined;
    if (kick) drawFootRibbon(ctx, opts, kick, undefined, this.footMotion.matches);
    drawStick(ctx, opts, prevPose !== pose ? { pose: prevPose, t: p.prevPoseT, blend: p.blend } : undefined);
    if (p.weapon === 'foot' && this.footwork.impact) {
      const mark = this.footwork.impact;
      drawFootImpact(ctx, mark.x, mark.y, 1, this.time - mark.at, mark.color, mark.strong, mark.direction, mark.school, this.footMotion.matches);
    }
    if (this.gates.on || this.gates.lotus) this.gates.drawAuraFront(ctx, this, opts);
    if ((p.weapon === 'pistol' || p.weapon === 'rifle') && !p.fatality) {
      const sk = solvePose(opts), oy = p.y - p.z;
      const off = { x: p.x + sk.bhand.x, y: oy + sk.bhand.y };
      if (p.weapon === 'pistol' && this.guns.trick?.kind === 'multi') drawPistol(ctx, off, p.aim + 0.35 * p.facing, 1, { alpha: 0.85, recoil: p.recoil * 0.65, time: this.time });
      if (this.guns.trick) {
        const mz = { x: p.x + sk.fhand.x + Math.cos(p.aim) * 11 * PISTOL_VIS, y: oy + sk.fhand.y + Math.sin(p.aim) * 6.6 * PISTOL_VIS };
        this.particles.spark(mz.x, mz.y, 1, this.guns.trick.color, p.aim, 0.4, 60);
        if (this.state === 'playing') pfontO(ctx, this.guns.trick.label, p.x, p.y - 34 - p.z, this.guns.trick.color, '#000', 1, 'center');
      }
    }
    if (p.weapon === 'pistol' && !p.fatality) this.pis.draw(this, ctx);
    if (p.parryT > 0) pring(ctx, p.x, p.y - 6, 9, '#9be7ff', 1, p.aim - 1, p.aim + 1);
    if (p.weapon === 'yoyo' && !p.fatality && this.state !== 'dead') {
      if (this.yoyoVer === 1) this.yoyo.draw(ctx, this);
      else if (!p.focusDash && !p.dead) {
        const current = solvePose(opts);
        const visible = prevPose !== pose && p.blend > 0.01 ? blendSkeleton(solvePose({ ...opts, pose: prevPose, t: p.prevPoseT }), current, 1 - p.blend) : current;
        const hand = { x: p.x + visible.fhand.x, y: p.y + visible.fhand.y - p.z };
        this.yoyoV2.draw(ctx, p.attackPhase !== 'none' && !!p.moveKey && !!MOVES[p.moveKey].yoyo, hand);
      }
    }
    if (p.weapon === 'boxing' && !p.fatality && this.state !== 'dead') {
      const cur = solvePose(opts);
      const vis = prevPose !== pose && p.blend > 0.01 ? blendSkeleton(solvePose({ ...opts, pose: prevPose, t: p.prevPoseT }), cur, 1 - p.blend) : cur;
      const d = this.boxDef;
      const fx = p.x + vis.fhand.x, fy = p.y + vis.fhand.y - p.z;
      const bx = p.x + vis.bhand.x, by = p.y + vis.bhand.y - p.z;
      const striking = p.attackPhase === 'active' && !!p.moveKey;
      // jejak sarung saat memukul: ghost singkat + busur tekanan udara
      if (striking) {
        const m = MOVES[p.moveKey!];
        const pw = m.finisher ? 1 : 0.5;
        if (m.limb !== 'bhand') this.box.trail(fx, fy, p.aim, true, pw);
        if (m.limb !== 'fhand') this.box.trail(bx, by, p.aim, false, pw);
        if (Math.random() < 0.5) {
          const side = Math.random() < 0.5 ? 1 : -1;
          this.box.arc(p.x + Math.cos(p.aim) * 7, p.y - 7 - p.z + Math.sin(p.aim) * 4, 8 + pw * 4,
            p.aim + side * 1.1, p.aim - side * 0.5, d.accent, 0.14);
        }
      }
      this.box.drawGhosts(ctx);
      this.box.drawArcs(ctx);
      const puls = 1 + this.box.pulse * 0.22;
      drawGlove(ctx, bx, by, p.aim, puls, d, p.flash > 0);
      drawGlove(ctx, fx, fy, p.aim, puls, d, p.flash > 0);
    }
    if (p.weapon === 'fist' && !p.fatality && this.state !== 'dead') {
      // tinju Ippo TANPA sarung: hanya jejak kepalan + busur tekanan udara berwarna biru muda
      const fm = p.attackPhase === 'active' && p.moveKey ? MOVES[p.moveKey] : null;
      if (fm && /^(bx|fp)_/.test(fm.id)) {
        const sk = solvePose(opts);
        const fx = p.x + sk.fhand.x, fy = p.y + sk.fhand.y - p.z, bx = p.x + sk.bhand.x, by = p.y + sk.bhand.y - p.z;
        const pw = fm.finisher ? 1 : 0.5;
        if (fm.limb !== 'bhand') this.box.trail(fx, fy, p.aim, true, pw);
        if (fm.limb !== 'fhand') this.box.trail(bx, by, p.aim, false, pw);
        if (Math.random() < 0.5) { const side = Math.random() < 0.5 ? 1 : -1; this.box.arc(p.x + Math.cos(p.aim) * 7, p.y - 7 - p.z + Math.sin(p.aim) * 4, 8 + pw * 4, p.aim + side * 1.1, p.aim - side * 0.5, IPPO_BARE.accent, 0.14); }
      }
      if (this.box.ghosts.length) this.box.drawGhosts(ctx, IPPO_BARE);
      if (this.box.arcs.length) this.box.drawArcs(ctx);
    }
    if (p.weapon === 'takamura' && !p.fatality && this.state !== 'dead') this.tak.draw(ctx, this, solvePose(opts));
    if (p.weapon === 'hayabusa' && !p.fatality && this.state !== 'dead') this.hay.draw(ctx, this, solvePose(opts));
    if (this.sfNunOn && !p.fatality) {
      if (this.fireOn) { this.fireTrail.drawSmoke(ctx); this.fireTrail.draw(ctx); }
      this.sfNun.draw(ctx, this.fireOn ? '#ffb04a' : this.pal.accent2, !this.fireOn);
    }
    else if (p.weapon === 'nunchaku' && !p.fatality) this.nunchaku.draw(ctx, this.v2 ? '#b3763a' : '#c9a063', this.v2 ? '#aeb8c6' : '#bdbdbd', this.v2 || p.attackPhase !== 'none' ? this.pal.accent2 : null);
    if (p.weapon === 'bat' && !p.fatality) {
      const sk = solvePose(opts);
      const m = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
      const hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
      let angle = p.attackPhase !== 'none' ? p.bladeA : p.aim + Math.PI + 0.9 * p.facing;
      const pt = this.attackPoseT();
      const beat = this.silat ? this.silat.sc.beats[Math.min(this.silat.i, this.silat.sc.beats.length - 1)] : null;
      if (beat) {
        angle = Math.atan2(sk.fhand.y - sk.neck.y, (sk.fhand.x - sk.neck.x) / 0.6);
        if (beat.bat === 'shoulder') angle = p.aim - p.facing * (Math.PI - 0.7);
        if (beat.bat === 'across') angle = p.aim + p.facing * Math.PI / 2;
        if (beat.batSpin) angle += this.time * beat.batSpin * p.facing;
      } else if (m && m.pose === 'b_tosscatch' && pt < 0.36) {
        // Bat Flip Toss: tongkat melayang berputar di udara di atas tangan sebelum ditangkap di puncak!
        const u = pt / 0.36;
        hand.y -= Math.sin(u * Math.PI) * 11;
        angle = p.aim + u * Math.PI * 4 * p.facing;
      } else if (p.attackPhase === 'none' && this.batTauntT > 0) {
        const fu = clamp(1 - this.batTauntT / 0.85, 0, 1);
        if (this.batFlourishKind === 'twirl') angle = p.aim + fu * Math.PI * 6 * p.facing;
        else if (this.batFlourishKind === 'toss') {
          if (fu < 0.65) {
            hand.y -= Math.sin((fu / 0.65) * Math.PI) * 14;
            angle = p.aim + (fu / 0.65) * Math.PI * 4 * p.facing;
          } else {
            angle = p.aim - p.facing * (Math.PI - 0.7);
          }
        } else if (this.batFlourishKind === 'back') angle = p.aim + (-Math.PI + fu * Math.PI * 2.5) * p.facing;
        else angle = p.aim - p.facing * (Math.PI - 0.7);
      } else if (p.attackPhase === 'none') {
        this.batTwirlCd -= this.rawDt; this.batTwirl = Math.max(0, this.batTwirl - this.rawDt);
        if (this.batTwirlCd <= 0 && this.batTwirl === 0 && !p.moving) { this.batTwirl = 0.75; this.batTwirlCd = 4.5 + Math.random() * 3.5; }
        if (this.batTwirl > 0) angle += (1 - this.batTwirl / 0.75) * Math.PI * 4 * p.facing;
      }
      if (this.batSpam >= 3) pfontO(ctx, `${this.batSpam} HIT`, p.x, p.y - 32 - p.z, this.batSpam >= 15 ? '#ff6a4a' : '#ffd27f', '#000', 1, 'center');
      const glowCol = (m && pt > 0.22 && pt < 0.68) || this.batTauntT > 0 ? '#ffd27f' : null;
      drawBat(ctx, hand, angle, m?.slash?.lift ?? 0, glowCol);
    }
    if (p.weapon === 'buster' && !p.fatality) {
      const sk = solvePose(opts);
      const bu = this.bu;
      const m = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
      const hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
      let angle: number;
      if (m || bu.omni) angle = p.bladeA;
      else if (bu.charging) angle = p.aim - p.facing * (Math.PI * 0.5 + 0.9 * bu.charge);
      else if (bu.punisher || bu.restT > 0) angle = p.aim - p.facing * (Math.PI - 0.6);            // dipanggul di bahu
      else if (p.moving && Math.hypot(p.vx, p.vy) > 70) angle = p.aim + p.facing * (Math.PI - 0.55);  // diseret di belakang saat lari
      else angle = p.aim + p.facing * 0.5;                                                        // kuda-kuda: ujung ke depan-bawah
      if (!m && !bu.omni && !bu.charging && p.moving && Math.hypot(p.vx, p.vy) > 70 && !bu.punisher) angle = p.aim + p.facing * (Math.PI - 0.55);
      angle += bu.flourishSpin() * p.facing;
      const glowing = m && this.attackPoseT() > 0.25 && this.attackPoseT() < 0.65 ? bu.trailColor() : bu.counterGlow > 0 ? '#ff9d6a' : bu.limit >= 100 ? MAKO : null;
      drawBusterSword(ctx, hand, angle, m?.slash?.lift ?? 0, glowing, bu.charging ? bu.charge : 0, this.time);
      if (this.state === 'playing') {
        drawLimitHud(ctx, p.x, p.y + 6, bu, this.time);
        if (bu.limit >= 100 && !bu.omni) pfontO(ctx, Math.floor(this.time * 3) % 2 ? 'LIMIT BREAK!' : 'RMB: OMNISLASH', p.x, p.y - 34 - p.z, MAKO2, '#000', 1, 'center');
        else if (bu.charging && bu.charge >= 1) pfontO(ctx, 'BLADE BEAM', p.x, p.y - 34 - p.z, MAKO2, '#000', 1, 'center');
      }
    }
    if (p.weapon === 'shotgun' && !p.fatality) {
      const sk = solvePose(opts);
      const m = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
      let hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
      // genggam di ujung laras: popor jadi kepala pentungan
      if (m) hand = { x: hand.x + Math.cos(p.bladeA) * 10, y: hand.y + Math.sin(p.bladeA) * 6 };
      // dipakai mentung: dipegang di laras, popor jadi kepala pentungan (sudut dibalik)
      const angle = m ? p.bladeA + Math.PI : p.aim + this.sg.spin * p.facing - this.sg.kick * 0.45 * p.facing;
      drawShotgun(ctx, hand, angle, p.facing, m ? 0 : this.sg.kick, m && this.attackPoseT() > 0.25 && this.attackPoseT() < 0.65 ? '#ffd27f' : null, this.sg.clackFlash);
      if (this.batSpam >= 3 && m) pfontO(ctx, `${this.batSpam} HIT`, p.x, p.y - 32 - p.z, '#ffd27f', '#000', 1, 'center');
      if (this.state === 'playing') {
        drawShells(ctx, p.x, p.y + 6, this.sg.shells);
        if (this.sg.reloading) pfontO(ctx, 'RELOAD', p.x, p.y - 34 - p.z, '#ffd27f', '#000', 1, 'center');
        else if (this.sg.shells === 0) pfontO(ctx, Math.floor(this.time * 3) % 2 ? 'EMPTY - RMB' : 'MELEE!', p.x, p.y - 34 - p.z, '#ff5a3a', '#000', 1, 'center');
      }
    }
    if (p.weapon === 'bow' && !p.fatality) {
      const sk = solvePose(opts);
      const oy = p.y - p.z, bw = this.bow;
      const grip = { x: p.x + sk.fhand.x, y: oy + sk.fhand.y }, str = { x: p.x + sk.bhand.x, y: oy + sk.bhand.y };
      drawQuiver(ctx, { x: p.x + sk.neck.x, y: oy + sk.neck.y }, { x: p.x + sk.hip.x, y: oy + sk.hip.y }, p.facing);
      const dv = pose === 'bow' || (!!bw.trick && pose !== 'bow_twirl') ? bw.drawVis : 0;
      let bowAngle = p.aim;
      if (pose === 'bow_twirl') bowAngle += (1 - bw.flourishT / bw.FLOURISH_DUR) * Math.PI * 4 * p.facing;
      drawBow(ctx, grip, str, bowAngle, dv, bw.vib, this.time, bw.nock <= 0 && (pose === 'bow' || !!bw.trick) && bw.flourishT <= 0, bw.glint, bw.streak >= 2 && !bw.drawing ? Math.min(3, bw.streak) : 0);
      if (bw.drawing && bw.nock <= 0 && bw.holdT > 0.12 && this.state === 'playing') {
        const w = 16, bx = Math.round(p.x - w / 2), by = Math.round(p.y + 6);
        prect(ctx, bx - 1, by - 1, w + 2, 4, '#000');
        const full = bw.draw >= 1;
        prect(ctx, bx, by, Math.round(w * bw.draw), 2, full ? (Math.floor(this.time * 12) % 2 ? '#ffffff' : '#ffd27f') : '#c98a3a');
        if (full) pfontO(ctx, 'FULL', p.x, p.y - 34 - p.z, '#fff3c4', '#000', 1, 'center');
      }
    }
    if (p.weapon === 'axe' || p.weapon === 'dual') {
      const sk = solvePose(opts);
      const m = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
      const lift = m?.slash?.lift ?? 0;
      const fh = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z }, bh = { x: p.x + sk.bhand.x, y: p.y + sk.bhand.y - p.z };
      const a1 = p.attackPhase !== 'none' ? p.bladeA : p.weapon === 'axe' ? p.aim + Math.PI + 0.9 * p.facing : p.aim;
      if (p.weapon === 'axe') { if (this.lev.held) drawAxe(ctx, fh, a1, lift); }
      else { drawShortBlade(ctx, fh, a1, lift); drawShortBlade(ctx, bh, p.attackPhase !== 'none' ? p.bladeB : p.aim + Math.PI * 0.85, lift); }
    }
    if (p.weapon === 'axe' && !p.fatality && this.state !== 'dead') this.lev.draw(ctx, this);
    if (p.weapon === 'guandao' && !p.fatality && this.state !== 'dead') this.gd.draw(this, ctx);
    if (p.weapon === 'katana' || (p.weapon === 'takamura' && p.fatality)) {
      const sk = solvePose(opts);
      const hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
      const hip = { x: p.x + sk.hip.x, y: p.y + sk.hip.y - p.z };
      const sheathed = pose === 'k_sheathe' && t > 0.6;
      this.katana.drawScabbard(ctx, hip, p.facing);
      const ba = p.fatality ? p.bladeA : (p.attackPhase !== 'none' ? p.bladeA : p.aim);
      const m = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
      const b = this.katana.blade(hand, ba, m?.slash?.lift ?? 0);
      this.katana.drawBlade(ctx, b.base, b.tip, sheathed);
    }
    if (p.weapon === 'scythe' && !p.fatality && this.state !== 'dead') {
      const sk = solvePose(opts);
      const hand = { x: p.x + sk.fhand.x, y: p.y + sk.fhand.y - p.z };
      const ba = p.attackPhase !== 'none' ? p.bladeA : p.aim - 0.95 * p.facing;
      const m = p.attackPhase !== 'none' && p.moveKey ? MOVES[p.moveKey] : null;
      const glow = m && p.attackPhase === 'active' ? clamp(1 - p.attackT / Math.max(.001, m.active), 0, 1) : 0;
      drawScythe(ctx, hand, ba, glow, 1, this.time);
      const sm = m && scytheMove(m);
      if (sm) drawScytheRibbon(ctx, opts, sm, this.scytheMotion.matches);
    }
    for (let i = this.wallHits.length - 1; i >= 0; i--) {
      const hit = this.wallHits[i];
      hit.t -= this.rawDt;
      if (hit.t <= 0) { this.wallHits.splice(i, 1); continue; }
      const radius = 2 + (1 - hit.t / 0.09) * 4;
      ctx.globalAlpha = Math.min(1, hit.t / 0.05);
      pline(ctx, hit.x - radius, hit.y, hit.x + radius, hit.y, '#ffffff', 1); pline(ctx, hit.x, hit.y - radius, hit.x, hit.y + radius, '#ffffff', 1);
      pline(ctx, hit.x, hit.y, hit.x + Math.cos(hit.a) * radius * 1.6, hit.y + Math.sin(hit.a) * radius * 1.6, '#fff3a0', 2);
      ctx.globalAlpha = 1;
    }

  }

  drawEnemy(e: Enemy) {
    const ctx = this.wctx;
    const pal = this.pal;
    if (isJack(e) && drawJackEntrance(this, ctx, e)) return;
    if (e.spawnT > 0 && !isJack(e)) {
      const max = e.boss ? 1.2 : 0.7;
      const k = 1 - e.spawnT / max;
      pring(ctx, e.x, e.y - 6, (1 - k) * 16 + 3, pal.accent, 1);
      if (k > 0.35) drawStick(ctx, { x: e.x, y: e.y, c: pal.accent, c2: pal.accent, scale: e.scale, facing: e.facing, aim: e.aim, walk: 0, moving: false, pose: 'idle', t: 0, acc: 'none', weapon: 'none', flash: true, alpha: (k - 0.35) / 0.65, outline: null, eyes: '#000', time: this.time, lean: { x: 1, y: 0 }, sideView: !!this.level.sideView });
      if (e.boss && k > 0.5) pfontO(ctx, e.name, e.x, e.y - 30 * e.scale, '#ffffff', '#000', 1, 'center');
      return;
    }
    const flash = e.flash > 0;
    const outline = e.elite ? '#ffffff' : '#000000';
    const eyes = e.elite ? '#ff2a2a' : e.boss ? e.color2 : '#101010';
    let pose: Pose = e.flinch > 0 && e.pose === 'idle' && e.z <= 0 ? 'hurt' : e.pose;
    const eSide = !!this.level.sideView;
    const eFly = e.z > 2 || (eSide && e.state === 'air' && !e.svGrounded);
    if (this.v2 && eFly && pose === 'launched') pose = 'fly';   // game1: badan terbang = anggota badan meronta
    let face = e.facing;
    if (e.scenePose) pose = e.scenePose;
    if (this.v2 && pose === 'down' && e.down > 0) { pose = (e.fall as Pose) || 'broken'; face = e.facing * (e.fallFlip ?? 1); }
    // V2 dizzy sway: a stunned enemy rocks side to side (game1 wobbles its lean the same way)
    // REAKSI PER BAGIAN TUBUH: pose berdiri + lapisan reaksi (kepala / perut / bawah) menggantikan pose "hurt" generik
    const rOpts = reactActive(e) && e.z <= 1 && e.down <= 0 && (pose === 'idle' || pose === 'hurt' || pose === 'stagger') ? reactOpts(e) : undefined;
    if (rOpts && (pose === 'hurt' || pose === 'idle')) pose = 'idle';
    const dizzy = this.v2 && e.stun > 0 && e.z <= 0 && (!rOpts || rOpts.zone === 'head' || e.stun > 0.5);
    const dizzyRot = dizzy && !rOpts ? Math.sin(this.time * 9) * 0.16 : 0;
    // PETARUNG BERSENJATA: selama badan benar-benar bergeser di tanah, kaki WAJIB melangkah (jalan/lari), apa pun pose serangannya —
    // gagang senjata digerakkan mesin ayunan sendiri, jadi pose badan boleh dipakai untuk langkah.
    const fighterAI = isWielder(e) || isSmart(e) || e.kind === 'duelist' || e.kind === 'fighter';
    const gsp = Math.hypot(e.vx + e.kx, e.vy + e.ky);
    const hurtLike = pose === 'hurt' || pose === 'down' || pose === 'stagger' || pose === 'getup' || pose === 'launched' || pose === 'fly' || pose === 'knock' || pose === 'broken' || pose === 'curled' || pose === 'parry';
    if (fighterAI && !hurtLike && e.z <= 2 && e.down <= 0 && e.stun <= 0 && gsp > 24 && pose !== 'shoot' && pose !== 'bow' && pose !== 'idle' && pose !== 'reload' && pose !== 'charge') pose = 'idle';
    const teamU = isTeamUnit(e);
    const moving = !rOpts && (e.moving || (fighterAI && gsp > 24)) && (pose === 'idle' || pose === 'reload' || pose === 'charge' || ((fighterAI || teamU) && (pose === 'shoot' || pose === 'bow')));
    (e as unknown as { legs?: boolean }).legs = moving;
    const eStrike = pose === 'jab' ? 'fhand' : (pose === 'punch' || pose === 'cross' || pose === 'hook' || pose === 'uppercut' || pose === 'elbow') ? 'bhand' : (pose === 'kick' || pose === 'roundhouse' || pose === 'sidekick') ? 'ffoot' : pose === 'palm' ? 'both' : null;
    if (e.kind === 'duelist' && e.weapon === 'nunchaku' && !e.dead && !this.brain.wield) this.brain.drawWeapon(ctx);
    const eWade = this.level.outdoor && e.z < 3 ? pondDepth(this.level, e.x, e.y) * 3.2 * e.scale : 0;
    // Smooth locomotion & pose cross-fade untuk musuh agar gerakan jalan/serang/tangkis musuh juga mengalir natural
    const ev = e as Enemy & { _locoMix?: number; _blendPose?: Pose; _prevPose?: Pose; _prevT?: number; _blend?: number; _lastT?: number };
    const rdt = Math.min(this.rawDt || 1 / 60, 0.05);
    const lStep = rdt / 0.13;
    ev._locoMix = (ev._locoMix ?? (moving ? 1 : 0)) + clamp((moving ? 1 : 0) - (ev._locoMix ?? 0), -lStep, lStep);
    const curET = e.scenePose ? (e.sceneT ?? 0) : Math.min(1, e.poseT);
    if (ev._blendPose === undefined) {
      ev._blendPose = pose; ev._prevPose = pose; ev._prevT = curET; ev._blend = 0;
    } else if (pose !== ev._blendPose) {
      ev._prevPose = ev._blendPose; ev._prevT = ev._lastT ?? 0;
      ev._blend = pose === 'dash' || pose === 'hurt' ? 0.55 : 1;
      ev._blendPose = pose;
    }
    ev._blend = Math.max(0, (ev._blend ?? 0) - rdt / 0.095);
    if ((ev._blend ?? 0) <= 0.01) ev._prevPose = pose;
    ev._lastT = curET;

    const eOpts: import('./stick').StickOpts = { x: e.x, y: e.y + eWade - jackLift(e), c: e.color, c2: e.color2, scale: e.scale, facing: face, aim: moving && (pose === 'idle' || pose === 'reload') ? e.bodyAim : e.aim, look: e.aim, walk: e.walk, moving, pose, strike: eStrike, impact: eStrike && e.poseT >= 0.3 && e.poseT <= 0.7 ? 1 : 0, t: curET, acc: e.accessory, shades: e.shades, eyeStyle: e.eyeStyle, react: rOpts, flail: eFly || e.state === 'air' ? Math.min(1, 0.35 + Math.hypot(e.kx, e.ky) / 420) : e.down > 0 ? 0.18 : 0, weapon: e.weapon, flash, alpha: 1, outline, eyes, time: this.time, lean: eSide ? { x: Math.cos(e.aim) >= 0 ? 1 : -1, y: 0 } : { x: Math.cos(e.aim), y: Math.sin(e.aim) }, z: e.z + (e.sceneZ ?? 0), rot: e.scenePose ? (e.sceneRot ?? 0) : eFly ? e.rot : dizzyRot, sqx: this.v2 ? (e.sqx ?? 1) : 1, sqy: this.v2 ? (e.sqy ?? 1) : 1, vel: eSide ? { x: e.vx + e.kx * 0.3, y: 0 } : this.moveDirOf(e.vx + e.kx * 0.3, e.vy + e.ky * 0.3), stride: e.strideHalf, run: e.runT, locoMix: ev._locoMix, anticip: e.locoAnticip, brake: e.locoBrake, pivotDir: { x: Math.cos(e.aim), y: Math.sin(e.aim) }, anime: this.v2, seed: e.id * 1.7, sideView: eSide, mood: e.stagger > 0 || e.down > 0 || e.flinch > 0 || e.faceT > 0 ? 'hurt' : e.state === 'windup' || e.state === 'attack' || e.state === 'charge' || e.state === 'lunge' ? 'angry' : 'normal' };
    eOpts.posture = e.kind === 'fighter' || e.kind === 'thug' || e.kind === 'monk' ? 1 : 0;   // petarung tangan kosong: kuda-kuda siaga & postur badan/kepala rapi
    if (isWielder(e)) { const wg = wielderGrips(e); if (wg) { eOpts.handOverride = wg.front; eOpts.bhandOverride = wg.back; } }
    const tbw = (e as any).tb?.w; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (tbw) { const wg = tbw.grips(e); eOpts.handOverride = wg.front; eOpts.bhandOverride = wg.back; }
    if (e.kind === 'duelist' && this.brain.wield) { const wg = this.brain.wield.grips(e); eOpts.handOverride = wg.front; eOpts.bhandOverride = wg.back; }
    // LENGAN PATAH: tangan terlipat ke belakang punggung pada sudut yang mustahil — sendinya
    // sudah tak mempan digerakkan AI, IK menggambar siku menekuk ekstrem secara permanen.
    if (e.fracture && e.down <= 0 && e.z <= 1) {
      if (e.fracture.part === 'farm') eOpts.handOverride = { x: e.x - e.facing * 8 * e.scale, y: e.y - 13 * e.scale };
      else if (e.fracture.part === 'barm') eOpts.bhandOverride = { x: e.x + e.facing * 8 * e.scale, y: e.y - 15 * e.scale };
    }
    this.muay.bindPose(this, eOpts, e);
    drawStick(ctx, eOpts, ev._prevPose && ev._prevPose !== pose && (ev._blend ?? 0) > 0.01 ? { pose: ev._prevPose, t: ev._prevT ?? 0, blend: ev._blend! } : undefined);
    if (isWielder(e)) drawWielder(this, ctx, e);
    if (tbw) tbw.draw(this, ctx, e);
    if (isSmart(e)) drawSmart(this, ctx, e, eOpts);
    if (e.kind === 'duelist' && this.brain.wield) this.brain.wield.draw(this, ctx, e);
    if (isJack(e)) drawJackGear(this, ctx, e, eOpts);
    if (e.mirror) this.mirrorSystem.drawEnemyWeapon(this, e, ctx);
    if (this.player.weapon === 'bow' || this.bow.hasOn(e.id)) {
      const esk = solvePose(eOpts), oy = e.y + eWade - e.z;
      const sp: SkelPts = { pts: [esk.head, esk.neck, esk.hip, esk.fhand, esk.bhand, esk.ffoot, esk.bfoot].map((q) => ({ x: e.x + q.x, y: oy + q.y })), scale: e.scale, face: eOpts.facing };
      this.eSkel.set(e.id, sp);
      this.bow.drawOnEnemy(ctx, e.id, sp);
    }
    const top = e.y - e.z - 15 * e.scale;
    if (dizzy) {
      // PUSING: tiga bintang mengitari kepala + tanda tanya yang berkedip
      for (let i = 0; i < 3; i++) {
        const a = this.time * 9 + (i * Math.PI * 2) / 3;
        const stx = e.x + Math.cos(a) * 5, sty = top - 4 + Math.sin(a) * 2;
        px(ctx, stx, sty, i % 2 ? '#9ff8ff' : '#ffffff');
        px(ctx, stx - 1, sty, '#2a6a78'); px(ctx, stx + 1, sty, '#2a6a78');
      }
      if (Math.floor(this.time * 7) % 2 === 0) pfontO(ctx, '?', e.x, top - 13, '#9ff8ff', '#000', 1, 'center');
    } else if (e.stagger > 0) {
      for (let i = 0; i < 3; i++) { const a = this.time * 7 + (i * Math.PI * 2) / 3; px(ctx, e.x + Math.cos(a) * 6, top - 3 + Math.sin(a) * 2, '#ffd700'); }
      if (Math.floor(this.time * 6) % 2 === 0) pfontO(ctx, 'F', e.x, top - 12, '#ffd700', '#000', 1, 'center');
    } else if (e.id === this.fatTargetId) {
      // fatality available on this enemy right now
      const yy = top - 11 + Math.round(Math.sin(this.time * 7) * 1.5);
      prect(ctx, e.x - 3, yy - 1, 7, 7, '#000');
      prect(ctx, e.x - 2, yy, 5, 5, Math.floor(this.time * 8) % 2 ? '#ff1a1a' : '#b30000');
      pfont(ctx, 'F', e.x - 1, yy, '#ffffff', 1);
    }
    // BOXING: lawan yang sudah tinggal 1 HP ditandai — tinggal dihabisi klik kanan
    if (this.boxOn && e.hp <= 1 && e.z <= 2) {
      const pulse = 0.55 + 0.45 * Math.sin(this.time * 9);
      const yy = top - 12 + Math.round(Math.sin(this.time * 5) * 1.2);
      ctx.globalAlpha = 0.35 + pulse * 0.4;
      pring(ctx, e.x, e.y, e.r + 3 + pulse * 1.5, '#ff2a2a', 1);
      ctx.globalAlpha = 1;
      // tanda silang merah: sasaran eksekusi
      prect(ctx, e.x - 4, yy - 1, 9, 7, '#000');
      const c = Math.floor(this.time * 9) % 2 ? '#ff2a2a' : '#ff7a6a';
      pline(ctx, e.x - 2, yy + 1, e.x + 2, yy + 4, c, 1);
      pline(ctx, e.x + 2, yy + 1, e.x - 2, yy + 4, c, 1);
    }
    if (e.state === 'windup' && e.kind !== 'gunner' && e.kind !== 'rifleman' && e.kind !== 'sniper') {
      pfontO(ctx, '!', e.x, top - 8, Math.floor(this.time * 20) % 2 ? '#ff3b3b' : '#ffffff', '#000', 1, 'center');
    }
    if (!e.boss) {
      if (e.structure > 0 && e.stagger <= 0) {
        prect(ctx, e.x - 6, e.y + 3, 12, 1, '#1a1a1a');
        prect(ctx, e.x - 6, e.y + 3, Math.round(12 * clamp(e.structure / e.maxStructure, 0, 1)), 1, '#ffd700');
      }
      if (e.elite || e.hp < e.maxHp) {
        prect(ctx, e.x - 6, e.y + 5, 12, 1, '#1a1a1a');
        prect(ctx, e.x - 6, e.y + 5, Math.round(12 * clamp(e.hp / e.maxHp, 0, 1)), 1, e.elite ? '#ff2a2a' : '#ff6b6b');
      }
    }
  }
}

function pellipseShadow(ctx: CanvasRenderingContext2D, x: number, y: number, r = 4) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(Math.round(x - r), Math.round(y), r * 2, 1);
  ctx.fillRect(Math.round(x - r + 1), Math.round(y - 1), r * 2 - 2, 1);
}
