export type WeaponKind = 'fist' | 'foot' | 'scythe' | 'guandao' | 'pistol' | 'rifle' | 'nunchaku' | 'katana' | 'axe' | 'dual' | 'yoyo' | 'takamura' | 'hayabusa' | 'bat' | 'boxing' | 'shotgun' | 'bow' | 'buster';
export type EnemyKind = 'fighter' | 'thug' | 'knife' | 'batter' | 'gunner' | 'bomber' | 'rifleman' | 'brute' | 'monk' | 'shield' | 'sniper' | 'smg' | 'shotgun' | 'boss' | 'duelist';
export type BossKind = 'bull' | 'queen' | 'shadow' | 'priest' | 'dancer';
export type Pose =
  | 'idle' | 'run' | 'jab' | 'cross' | 'hook' | 'elbow' | 'roundhouse' | 'sweep' | 'uppercut' | 'palm' | 'flying' | 'runpunch'
  | 'punch' | 'kick' | 'parry' | 'down' | 'knock' | 'fly' | 'broken' | 'curled' | 'getup' | 'stagger' | 'shoot' | 'windup' | 'dash' | 'hurt' | 'takedown' | 'rush' | 'charge' | 'throw'
  | 'crouch' | 'launched' | 'flex' | 'jump' | 'sidekick' | 'kneedrop' | 'spin' | 'stomp' | 'grab' | 'hammer' | 'reload'
  | 'knee' | 'axekick' | 'butterflyflip' | 'cartwheelkick' | 'jump_anticip' | 'spinback' | 'dragontail' | 'monkeyflip' | 'cranekick' | 'tigerclaw' | 'mantis' | 'chainpunch' | 'chainfinish' | 'ragedash' | 'ragekill'
  | 'foot_guard' | 'foot_rasteira' | 'foot_side' | 'foot_wheel' | 'foot_ember' | 'foot_meia' | 'foot_tornado' | 'foot_comet' | 'foot_lotus' | 'foot_back' | 'foot_scissor' | 'foot_dive' | 'foot_cross' | 'foot_dragon'
  | 'foot_rdk' | 'foot_rjk' | 'headbutt'
  | 'foot_flamingo' | 'foot_flamingo_switch' | 'foot_switch_double' | 'foot_switch_hook' | 'foot_switch_ender'
  | 'foot_au' | 'foot_windmill' | 'foot_v2_senpu' | 'foot_v2_daisenpu'
  | 'scy_guard' | 'scy_reap1' | 'scy_reap2' | 'scy_spin' | 'scy_grave' | 'scy_halo' | 'scy_soul' | 'scy_mill' | 'scy_air' | 'scy_dive'
  | 'foot_v2_guard' | 'foot_v2_yeop' | 'foot_v2_thrust' | 'foot_v2_backlash_l' | 'foot_v2_backlash_r' | 'foot_v2_skylift' | 'foot_v2_hawk' | 'foot_v2_540' | 'foot_v2_flying' | 'foot_v2_skysnap'
  | 's_collier' | 's_epaule' | 's_cotelette' | 's_mouton' | 's_antimanner' | 's_concasse' | 's_diable' | 's_partyTable' | 'k_ironpalm' | 'k_hammerfist'
  | 't_cane' | 't_iai' | 't_slash' | 't_sheath'
  | 'h_idle' | 'h_slash' | 'h_spin' | 'h_blade' | 'h_izuna'
  | 'y_idle' | 'y_trick' | 'y_toprock' | 'y_sixstep' | 'y_windmill' | 'y_headspin' | 'y_flare'
  | 'y2_idle' | 'y2_throw' | 'y2_toprock' | 'y2_crossstep' | 'y2_windmill' | 'y2_freeze' | 'y2_spin' | 'y2_airflip'
  | 'n_idle' | 'n_lash' | 'n_cross' | 'n_figure8' | 'n_overhead' | 'n_helicopter' | 'n_whipcrack' | 'n_choke' | 'n_lowsweep' | 'n_tornado' | 'n_dragonlash' | 'n_garrote' | 'n_drum'
  | 'n_tri1' | 'n_tri2' | 'n_tri3' | 'n_tri4' | 'n_backpass' | 'n_toss' | 'n_neckwrap' | 'n_sidespin'
  | 'k_idle' | 'k_draw' | 'k_return' | 'k_crescent' | 'k_heaven' | 'k_thrust' | 'k_rising' | 'k_whirlwind' | 'k_thousand' | 'k_dragonfang' | 'k_iaijutsu' | 'k_sheathe' | 'k_impale'
  | 'a_idle' | 'a_chop' | 'a_backswing' | 'a_overhead' | 'a_spin' | 'a_leap' | 'a_hook' | 'a_swing1' | 'a_swing2' | 'a_homerun' | 'a_golf' | 'a_bunt'
  | 'b_wild' | 'b_wildback' | 'b_smash' | 'b_knob' | 'b_upper' | 'b_pound' | 'b_taunt'
  | 'b_windmill' | 'b_behind' | 'b_buntspin' | 'b_tosscatch' | 'b_corkscrew' | 'b_kneeslider' | 'b_callshot'
  | 'd_idle' | 'd_cross' | 'd_scissor' | 'd_flurry' | 'd_xslash' | 'd_dance' | 'd_launch' | 'd_dash'
  | 'bx_ali' | 'bx_peek' | 'bx_ippo' | 'bx_float' | 'bx_weave' | 'bx_press' | 'bow'
  | 'bow_flip' | 'bow_slide' | 'bow_lean' | 'bow_kneel' | 'bow_roll' | 'bow_air' | 'bow_multi' | 'bow_twirl'
  | 'gun_twirl' | 'gun_akimbo'
  | 'g_relax' | 'g_focus' | 'g_tense' | 'g_cross' | 'g_burst' | 'g_stance'
  | 'bx_jab' | 'bx_cross' | 'bx_lhook' | 'bx_upper' | 'bx_body' | 'bx_smash'
  | 'bx_gazelle' | 'bx_dempsey' | 'bx_heart' | 'bx_roll'
  | 'bx_rhook' | 'bx_shovel' | 'bx_over'
  | 'drunk_cup' | 'drunk_sway' | 'drunk_stumble' | 'drunk_mule' | 'drunk_cannon'
  | 'carry_pot' | 'throw_pot' | 'carry_comp' | 'throw_comp';

export interface Vec {
  x: number;
  y: number;
}

export interface Entity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  kx: number;
  ky: number;
  r: number;
  hp: number;
  maxHp: number;
  dead: boolean;
  flash: number;
  facing: number;
  aim: number;
  walk: number;
  moving: boolean;
}

export interface Enemy extends Entity {
  id: number;
  kind: EnemyKind;
  boss?: BossKind;
  name: string;
  speed: number;
  dmg: number;
  color: string;
  color2: string;
  scale: number;
  structure: number;
  maxStructure: number;
  stagger: number;
  down: number;
  stun: number;
  /** V2 juicy squash & stretch (game1 style). 1 = neutral; >1 sqx = pipih melebar, >1 sqy = melar. */
  sqx?: number;
  sqy?: number;
  /** V2: varian pose rebah biar ragdoll tidak monoton ('broken'/'knock'/'curled'). */
  fall?: string;
  /** V2: arah hadap saat rebah (variasi visual). */
  fallFlip?: number;
  scenePose?: Pose;
  sceneT?: number;
  sceneZ?: number;
  sceneRot?: number;
  /** V2: sisa waktu pose bangkit (getup). */
  getupT?: number;
  state: string;
  stateT: number;
  attackCd: number;
  pose: Pose;
  poseT: number;
  poseDur: number;
  elite: boolean;
  spawnT: number;
  accessory: string;
  /** Kacamata hitam: 0 utuh, 1 retak, 2 terlempar/pecah (mata di baliknya terlihat). */
  shades: number;
  /** Gaya mata: 'dot' biasa, 'white' putih menyala. */
  eyeStyle: string;
  weapon: string;
  kbRes: number;
  armor: boolean;
  canParry: boolean;
  burst: number;
  phase: number;
  value: number;
  hitDone: boolean;
  strafeDir: number;
  strafeT: number;
  summonCd: number;
  fuse: number;
  chargeDir: number;
  tele: { x: number; y: number; t: number; max: number } | null;
  attackRange: number;
  lastDist: number;
  stuckT: number;
  shockR: number[];
  parryCd: number;
  cdMul: number;
  wMul: number;
  z: number;
  vz: number;
  flinch: number;
  /** sisa waktu muka X X setelah kena pukul */
  faceT: number;
  rot: number;
  fatalCount: number;
  role: 'melee' | 'ranged';
  slot: number;
  slotAng: number;
  token: boolean;
  tokenT: number;
  wantDist: number;
  reload: number;
  ammo: number;
  aimLine: number;
  sepx: number;
  sepy: number;
  repos: Vec | null;
  reposT: number;
  pose2: Pose;
  strideHalf: number;
  /** 0..1 — transisi jalan -> lari, menggerakkan animasi langkah cepat */
  runT: number;
  prevSpd2: number;
  locoAnticip: number;
  locoBrake: number;
  /** jeda sebelum boleh menghindar / berpura-pura lagi */
  evadeCd: number;
  /** sudut slot mengepung di sekeliling pemain */
  flank: number;
  /** sisa waktu mundur karena terluka */
  waryT: number;
  /** >0 = sedang berpura-pura menyerang (feint) */
  feint: number;
  bodyAim: number;
  bleed: number;
  bleedT: number;
  doom: number;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  owner: 'player' | 'enemy';
  life: number;
  color: string;
  pierce: number;
  bounce: number;
  kind: 'pistol' | 'rifle' | 'enemy' | 'sniper' | 'orb' | 'bomb' | 'deflect';
  hitIds: number[];
  px: number;
  py: number;
  structure: number;
  kb: number;
  z?: number;
  vz?: number;
}

export interface Pickup {
  x: number;
  y: number;
  kind: 'ammoP' | 'ammoR' | 'hp' | 'focus' | 'rifle' | 'nunchaku' | 'katana' | 'axe' | 'dual';
  t: number;
  vx: number;
  vy: number;
  magnet: boolean;
}

export interface Prop {
  x: number;
  y: number;
  kind: 'crate' | 'barrel' | 'table' | 'pot' | 'computer';
  hp: number;
  r: number;
  dead: boolean;
  flash: number;
}

export interface Corpse {
  /** ragdoll verlet aktif (tangan/kaki terkulai sendiri) */
  rd?: import('./ragdoll').Ragdoll;
  x: number;
  y: number;
  rot: number;
  color: string;
  color2: string;
  scale: number;
  accessory: string;
  /** kacamata & mata ikut tersimpan supaya mayat tidak "memakai ulang" kacamata yang sudah lepas */
  shades?: number;
  eyeStyle?: string;
  vx: number;
  vy: number;
  spin: number;
  t: number;
  z: number;
  vz: number;
  gib: boolean;
  bounces: number;
  /** V2 squash & stretch, game1 style (optional: older saves/pushes simply stay neutral). */
  sqx?: number;
  sqy?: number;
  /** facing saat tewas (V2: mayat tetap menghadap arah ia dilempar, seperti game1). */
  face?: number;
  /** cooldown tumbukan body-check / desakan (V2). */
  cd?: number;
}

export interface Hazard {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  max: number;
  kind: 'ring' | 'fire' | 'telegraph';
  hit: boolean;
  dmg: number;
  fromPlayer: boolean;
}

export interface Afterimage {
  x: number;
  y: number;
  life: number;
  max: number;
  pose: Pose;
  t: number;
  facing: number;
  aim: number;
  color: string;
  scale: number;
  lean: Vec;
  dancePhase?: number;
}

export interface PlayerStats {
  meleeDmg: number;
  meleeRange: number;
  moveSpeed: number;
  dashCd: number;
  dashDist: number;
  maxAmmo: number;
  fireRate: number;
  bulletDmg: number;
  takedownHeal: number;
  focusGain: number;
  knockback: number;
  structureDmg: number;
  dodgeChance: number;
  dropRate: number;
  pierce: number;
  parryWindow: number;
  berserk: number;
  bounce: number;
  shockwave: number;
  hpBonus: number;
  lifesteal: number;
  comboDecay: number;
  bulletTime: number;
}

export function defaultStats(): PlayerStats {
  return {
    meleeDmg: 1, meleeRange: 1, moveSpeed: 1, dashCd: 1, dashDist: 1, maxAmmo: 1, fireRate: 1, bulletDmg: 0,
    takedownHeal: 0, focusGain: 1, knockback: 1, structureDmg: 1, dodgeChance: 0, dropRate: 1, pierce: 0,
    parryWindow: 1, berserk: 0, bounce: 0, shockwave: 0, hpBonus: 0, lifesteal: 0, comboDecay: 1, bulletTime: 0,
  };
}

export type FatalityKind = 'uppercut' | 'runpunch' | 'flykick' | 'rush' | 'neckbreak' | 'kneedrop' | 'spinkick' | 'stomp' | 'hammer'
  | 'n_garrote' | 'n_drum' | 'n_decap' | 'k_bisect' | 'k_behead' | 'k_impale' | 'brutal';
export interface Fatality {
  kind: FatalityKind;
  id: number;
  t: number;
  step: number;
  stepT: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  dir: number;
  hit: boolean;
  hitT: number;
  perfect: boolean;
}

export interface Player extends Entity {
  /** ancang-ancang sebelum mulai bergerak (detik tersisa) */
  startT: number;
  /** putar balik arah (detik tersisa) */
  pivotT: number;
  /** arah tujuan pivot */
  pivotDir: Vec;
  /** ada input gerak frame sebelumnya */
  hadInput: boolean;
  /** jeda pindah gigi jalan -> lari (detik tersisa) */
  surgeT: number;
  /** 0..1 pose ancang-ancang pindah gigi (render) */
  locoSurge: number;
  /** sudah masuk fase lari (setelah jalan dulu) */
  gearRun: boolean;
  locoAnticip: number;
  locoBrake: number;
  /** 0..1 — campuran gaya jalan -> lari, digerakkan kecepatan nyata */
  gaitRun: number;
  /** anime brake (V2): skid pose timer/cooldown + previous-frame speed for stop detection */
  brakeT: number; brakeCd: number; prevSpd: number;
  /** V2 katana: planned chain length (1/2/3) rolled when a fresh K-chain starts */
  katanaPlan: number;
  dashT: number;
  dashCd: number;
  dashDir: Vec;
  iframes: number;
  comboStr: string;
  comboTimer: number;
  attackT: number;
  attackPhase: 'windup' | 'active' | 'recover' | 'none';
  moveKey: string | null;
  hitSet: number[];
  buffered: 'L' | 'H' | null;
  parryT: number;
  parryCd: number;
  parryHit: boolean;
  focus: number;
  weapon: WeaponKind;
  hasRifle: boolean;
  ammoP: number;
  ammoR: number;
  fireCd: number;
  recoil: number;
  lean: Vec;
  stunT: number;
  /** sisa waktu muka X X setelah kena pukul */
  faceT: number;
  lastMoveName: string;
  focusDash: { sx: number; sy: number; tx: number; ty: number; t: number; id: number } | null;
  shootT: number;
  attackElapsed: number;
  sinceDash: number;
  attackAim: number;
  z: number;
  runT: number;
  running: boolean;
  bloom: number;
  muzzle: number;
  muzzleMax: number;
  muzzleX: number;
  muzzleY: number;
  muzzleA: number;
  fatality: Fatality | null;
  holdPose: Pose;
  holdPoseT: number;
  holdT: number;
  dustT: number;
  stepT: number;
  travelHit: boolean;
  strideHalf: number;
  bodyAim: number;
  vz: number;
  jumpT: number;
  jumpCd: number;
  landT: number;
  airborne: boolean;
  squash: number;
  prevPose: Pose;
  prevPoseT: number;
  blend: number;
  /** pose tujuan blend saat ini — supaya rantai pose cepat selalu memudar dari pose terakhir yang tampil */
  blendPose: Pose;
  lastDir: Vec;
  tkdCd: number;
  tkdT: number;
  tkdDir: Vec;
  // Wing Chun chain punch + RAGE
  chain: number;        // consecutive chain punches landed in rhythm
  chainLast: number;    // game time of the last chain click
  chainSide: number;    // alternating fist
  /** ONE FOR ALL (X) — game1's slow-mo super mode, ported: 0..100 meter, burns while active */
  ofa: number;
  ofaActive: boolean;
  rage: number;         // 0..100 rage meter
  rageOn: boolean;
  rageT: number;        // seconds of rage left
  rageDash: { sx: number; sy: number; tx: number; ty: number; t: number; id: number } | null;
  rageKills: number;
  // rhythm style engine
  rhythm: number[];     // recent LMB gaps (seconds)
  style: 'none' | 'wingchun' | 'blackleg' | 'kungfu';
  styleStreak: number;  // consecutive moves in the current style
  styleHeat: number;    // 0..1 how 'in the zone' the rhythm is
  flowStep: number;     // index inside the style's auto-combo
  hitTimes: Record<number, number>;
  prevLimb: Vec | null;
  hasNunchaku: boolean;
  hasKatana: boolean;
  hasAxe: boolean;
  hasDual: boolean;
  bladeA: number;
  bladeB: number;
  bladePrevA: number;
  sheatheT: number;
  iaiVictims: number[];
}

export type GameState = 'menu' | 'playing' | 'mutation' | 'dead' | 'gameover' | 'victory' | 'paused';

/** Mirror enemy: memakai senjata pemain secara live. */
export interface Enemy {
  /** Running Dropkick: tubuh yang terpental bisa menabrak & menjatuhkan temannya */
  dkFly?: { t: number; dir: number; hit: number[]; gen: number };
  /** PETARUNG FIST: sisa waktu blok, daftar pose combo & indeksnya, durasi telegraf, dan jendela balas setelah menghindar */
  guardT?: number; fCombo?: Pose[]; fIdx?: number; fWind?: number; fPunishT?: number;
  mirror?: boolean; punchLock?: boolean; throwLock?: boolean; svVy?: number; svGrounded?: boolean; svDropT?: number; jumpCd?: number;
  /** PATAH TULANG permanen dari Charged Heavy nunchaku: bagian yang kena bengkok ekstrem & tak bisa digerakkan normal oleh AI */
  fracture?: { part: 'neck' | 'farm' | 'barm' | 'fleg' | 'bleg'; face: number }; fractureT?: number }

/** State rantai tendangan fist mode, anticipation (ancang-ancang) lompatan/salto & air-magnet tracking. */
export interface Player {
  wcCount?: number;
  kickHoldT?: number;
  kickPending?: boolean;
  kickBuf?: boolean;
  kickStep?: number;
  lastKickAt?: number;
  svVy?: number;
  svGrounded?: boolean;
  svDropT?: number;
  svStairLockT?: number;
  svCoyoteT?: number;
  svJumpBufT?: number;
  /** Prinsip Anticipation: karakter membungkuk rendah 1-2 frame sebelum melompat agar lompatan terasa bertenaga */
  svJumpAntT?: number;
  svJumpAntMax?: number;
  svJumpAntCfg?: { vy: number; kx: number; ring: boolean } | null;
  jumpAntT?: number;
  jumpAntMax?: number;
  airMagnet?: { sx: number; sy: number; sz: number; t: number; dur: number; id: number; key: string } | null;
  airLockId?: number;
}
