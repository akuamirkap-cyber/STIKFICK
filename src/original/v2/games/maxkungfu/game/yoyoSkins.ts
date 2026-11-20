export type YoyoSkinId = 'ember' | 'glacier' | 'sakura' | 'eclipse';
export type YoyoShape = 'round' | 'butterfly' | 'flower' | 'diamond';
export type YoyoTrailStyle = 'comet' | 'ribbon' | 'petal' | 'stardust';

export interface YoyoSkin {
  id: YoyoSkinId;
  name: string;
  shapeLabel: string;
  description: string;
  shape: YoyoShape;
  trailStyle: YoyoTrailStyle;
  rim: string;
  body: string;
  trim: string;
  core: string;
  highlight: string;
  aura: string;
  string: string;
  trail: string;
  trailLight: string;
  trailGlow: string;
  spark: string;
  accent: string;
  afterimage: string;
}

export const YOYO_SKIN_KEY = 'v2_kungfu_drifter_maxkungfu_yoyo_skin_v1';
export const DEFAULT_YOYO_SKIN: YoyoSkinId = 'ember';

export const YOYO_SKINS: readonly YoyoSkin[] = [
  {
    id: 'ember', name: 'EMBER', shapeLabel: 'ROUND / MERAH EMAS',
    description: 'Cakram klasik dengan jejak bara emas.', shape: 'round', trailStyle: 'comet',
    rim: '#2d1514', body: '#d94835', trim: '#ffb85d', core: '#ffe7a8', highlight: '#fff9ea',
    aura: '#ffab59', string: '#f9d5a8', trail: '#f15d46', trailLight: '#ffe0a1', trailGlow: '#ff8a59',
    spark: '#fff2c8', accent: '#f28a65', afterimage: '#ffa06f',
  },
  {
    id: 'glacier', name: 'GLACIER', shapeLabel: 'BUTTERFLY / BIRU ES',
    description: 'Sayap kristal dan pita biru es.', shape: 'butterfly', trailStyle: 'ribbon',
    rim: '#102e40', body: '#319bb6', trim: '#94ebf1', core: '#e6ffff', highlight: '#ffffff',
    aura: '#70dbe8', string: '#c8f6f8', trail: '#3fbfdf', trailLight: '#c0fbff', trailGlow: '#64dfff',
    spark: '#e8ffff', accent: '#7fd8e8', afterimage: '#a5e7f2',
  },
  {
    id: 'sakura', name: 'SAKURA', shapeLabel: 'BLOOM / PINK',
    description: 'Kelopak lembut dan jejak sakura.', shape: 'flower', trailStyle: 'petal',
    rim: '#532638', body: '#c74d79', trim: '#ffa4bf', core: '#fff0d5', highlight: '#fff8fc',
    aura: '#ffa5ca', string: '#ffdce7', trail: '#e45a91', trailLight: '#ffd0e1', trailGlow: '#f78cba',
    spark: '#fff0f6', accent: '#f398b9', afterimage: '#ffc1d3',
  },
  {
    id: 'eclipse', name: 'ECLIPSE', shapeLabel: 'STAR / UNGU CYAN',
    description: 'Bintang gelap dengan trail neon.', shape: 'diamond', trailStyle: 'stardust',
    rim: '#17142f', body: '#5744ac', trim: '#ad98f7', core: '#70f4dd', highlight: '#eafaff',
    aura: '#a185f4', string: '#d4c8ff', trail: '#8761db', trailLight: '#66e5df', trailGlow: '#9d78ff',
    spark: '#c1fff5', accent: '#b69cf2', afterimage: '#b3a6ff',
  },
];

export function isYoyoSkinId(value: unknown): value is YoyoSkinId {
  return typeof value === 'string' && YOYO_SKINS.some((skin) => skin.id === value);
}

export function getYoyoSkin(id: YoyoSkinId): YoyoSkin {
  return YOYO_SKINS.find((skin) => skin.id === id) ?? YOYO_SKINS[0];
}