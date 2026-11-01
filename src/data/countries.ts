import { CountryId, CountryInfo, ExpressionId, ExpressionInfo } from '../types/game';

export const BASE_BALL_URL =
  'https://raw.githubusercontent.com/Polandballhub-Operator/pbimagesPublic/refs/heads/main/balls';

export const COUNTRIES: Record<CountryId, CountryInfo> = {
  japan: {
    id: 'japan',
    name: '日本',
    nameEn: 'Japan',
    flagEmoji: '🇯🇵',
    capital: '東京 (Tokyo)',
    continent: 'アジア (Asia)',
    geographyFact: 'ユーラシアプレートと太平洋プレートの境界に位置する島国。国土の約7割が山林で、最高峰は富士山（3,776m）です。豊かな季節風（モンスーン）により四季がはっきりしています。',
    price: 0, // Initial unlocked
    accessoryName: '桜の髪飾り & はちまき',
    primaryColor: '#ffffff',
    secondaryColor: '#bc002d',
  },
  poland: {
    id: 'poland',
    name: 'ポーランド',
    nameEn: 'Poland',
    flagEmoji: '🇵🇱',
    capital: 'ワルシャワ (Warsaw)',
    continent: 'ヨーロッパ (Europe)',
    geographyFact: '中央ヨーロッパに位置し、北部はバルト海に面し、南部にはタトラ山脈がそびえます。国土の大部分が広大な北ヨーロッパ平野に属し、ビスワ川が国土を縦断しています。',
    price: 0, // Initial unlocked
    accessoryName: '赤白のクラウン',
    primaryColor: '#ffffff',
    secondaryColor: '#dc143c',
  },
  usa: {
    id: 'usa',
    name: 'アメリカ合衆国',
    nameEn: 'United States',
    flagEmoji: '🇺🇸',
    capital: 'ワシントンD.C. (Washington, D.C.)',
    continent: '北アメリカ (North America)',
    geographyFact: '太平洋と大西洋に挟まれた広大な国土を持ち、ロッキー山脈やミシシッピ川、大平原（グレートプレーンズ）など多様な地形・気候帯（熱帯〜寒帯）を有します。',
    price: 0, // Initial unlocked
    accessoryName: '星条旗シルクハット',
    primaryColor: '#002868',
    secondaryColor: '#bf0a30',
  },
  germany: {
    id: 'germany',
    name: 'ドイツ',
    nameEn: 'Germany',
    flagEmoji: '🇩🇪',
    capital: 'ベルリン (Berlin)',
    continent: 'ヨーロッパ (Europe)',
    geographyFact: '中欧の交通の要衝。ライン川やドナウ川などの国際河川が流れ、南部にはアルプス山脈北麓のバイエルン高原が広がります。温暖な西岸海洋性気候が特徴です。',
    price: 150,
    accessoryName: '伝統のチロリアンハット',
    primaryColor: '#000000',
    secondaryColor: '#dd0000',
  },
  france: {
    id: 'france',
    name: 'フランス',
    nameEn: 'France',
    flagEmoji: '🇫🇷',
    capital: 'パリ (Paris)',
    continent: 'ヨーロッパ (Europe)',
    geographyFact: '大西洋・地中海・イギリス海峡に面し、ヨーロッパ最大の農業国。セーヌ川流域のパリ盆地は肥沃な農業地帯で、南東部には西欧最高峰モンブラン（4,809m）があります。',
    price: 200,
    accessoryName: 'エレガントなベレー帽',
    primaryColor: '#0055a4',
    secondaryColor: '#ef4135',
  },
  england472x600: {
    id: 'england472x600',
    name: 'イギリス',
    nameEn: 'United Kingdom',
    flagEmoji: '🇬🇧',
    capital: 'ロンドン (London)',
    continent: 'ヨーロッパ (Europe)',
    geographyFact: '北大西洋の本初子午線（経度0度）が通るグリニッジで有名。暖流の北大西洋海流と偏西風の影響で、高緯度ながら年中温暖湿潤な西岸海洋性気候です。',
    price: 220,
    accessoryName: '王立モノクル & トップハット',
    primaryColor: '#012169',
    secondaryColor: '#c8102e',
  },
  italy: {
    id: 'italy',
    name: 'イタリア',
    nameEn: 'Italy',
    flagEmoji: '🇮🇹',
    capital: 'ローマ (Rome)',
    continent: 'ヨーロッパ (Europe)',
    geographyFact: '地中海にブーツ状に突き出た半島国。夏は高温乾燥、冬は温暖湿潤な「地中海性気候（Cs）」の代表例。北部にはポー川流域のロンバルディア平野が広がります。',
    price: 250,
    accessoryName: 'オリーブの月桂冠',
    primaryColor: '#008c45',
    secondaryColor: '#cd212a',
  },
  china: {
    id: 'china',
    name: '中国',
    nameEn: 'China',
    flagEmoji: '🇨🇳',
    capital: '北京 (Beijing)',
    continent: 'アジア (Asia)',
    geographyFact: '西高東低の地形で、西部にヒマラヤ山脈やチベット高原（世界の屋根）、東部に長江・黄海が注ぐ平野部が広がります。長江はアジア最長の国際級河川です。',
    price: 300,
    accessoryName: '黄金の五星バッジ',
    primaryColor: '#de2910',
    secondaryColor: '#ffde00',
  },
  korea: {
    id: 'korea',
    name: '韓国',
    nameEn: 'South Korea',
    flagEmoji: '🇰🇷',
    capital: 'ソウル (Seoul)',
    continent: 'アジア (Asia)',
    geographyFact: '東アジアの朝鮮半島南部に位置し、東に日本海、西に黄海に面します。東高西低の地形で、太白（テベク）山脈が背骨のように連なり、漢江が首都ソウルを流れます。',
    price: 250,
    accessoryName: '伝統のガッ（帽子）',
    primaryColor: '#ffffff',
    secondaryColor: '#cd2e3a',
  },
  russia: {
    id: 'russia',
    name: 'ロシア',
    nameEn: 'Russia',
    flagEmoji: '🇷🇺',
    capital: 'モスクワ (Moscow)',
    continent: 'ユーラシア (Eurasia)',
    geographyFact: '世界最大の面積を誇る国。ウラル山脈を境にヨーロッパ部とアジア部（シベリア）に分かれ、世界最深の淡水湖バイカル湖やタイガと呼ばれる針葉樹林帯が広がります。',
    price: 350,
    accessoryName: 'あたたかいウシャンカ毛皮帽',
    primaryColor: '#ffffff',
    secondaryColor: '#0039a6',
  },
  austria: {
    id: 'austria',
    name: 'オーストリア',
    nameEn: 'Austria',
    flagEmoji: '🇦🇹',
    capital: 'ウィーン (Vienna)',
    continent: 'ヨーロッパ (Europe)',
    geographyFact: '中欧の内陸国。国土の約6割をアルプス山脈が占め、美しく青きドナウ川が国土を東流します。森林と湖が豊かで、永世中立国としても知られます。',
    price: 280,
    accessoryName: 'エーデルワイスのコサージュ',
    primaryColor: '#ed2939',
    secondaryColor: '#ffffff',
  },
  sierraleone: {
    id: 'sierraleone',
    name: 'シエラレオネ',
    nameEn: 'Sierra Leone',
    flagEmoji: '🇸🇱',
    capital: 'フリータウン (Freetown)',
    continent: 'アフリカ (Africa)',
    geographyFact: '西アフリカの大西洋沿岸に位置する国。「ライオンの山」を意味するポルトガル語が国名の由来。首都フリータウンは天然の良港を持ち、熱帯雨林とサバナ気候が広がります。',
    price: 320,
    accessoryName: 'トロピカルなヤシの冠',
    primaryColor: '#1eb53a',
    secondaryColor: '#0072c6',
  },
  custom: {
    id: 'custom',
    name: 'カスタム国旗',
    nameEn: 'Custom Nation',
    flagEmoji: '🎨',
    capital: 'マイキャピタル',
    continent: '自由な新大陸',
    geographyFact: 'あなたが自由に選んだ表面と裏面の画像から構成される、世界に一つだけのオリジナル国ボールです！',
    price: 0,
    accessoryName: '自由のクラウン',
    primaryColor: '#2563eb',
    secondaryColor: '#38bdf8',
  },
};

export const EXPRESSIONS: Record<ExpressionId, ExpressionInfo> = {
  'normal.png': {
    id: 'normal.png',
    name: '通常 (Normal)',
    description: '標準的な落ち着いた国ボールの表情',
    price: 0,
    emoji: '🙂',
  },
  'happy.png': {
    id: 'happy.png',
    name: 'ハッピー (Happy)',
    description: 'にこにこ笑顔で外交や建築を楽しむ表情',
    price: 0,
    emoji: '😊',
  },
  'smile.png': {
    id: 'smile.png',
    name: 'スマイル (Smile)',
    description: '親しみやすいにっこり笑顔',
    price: 50,
    emoji: '😄',
  },
  'surprise.png': {
    id: 'surprise.png',
    name: 'サプライズ (Surprise)',
    description: '新しい大発見をしたときのくりくり目',
    price: 80,
    emoji: '😲',
  },
  'lol.png': {
    id: 'lol.png',
    name: '大笑い (LOL)',
    description: '楽しすぎて目が細くなる満面スマイル',
    price: 100,
    emoji: '😆',
  },
  'itome.png': {
    id: 'itome.png',
    name: '糸目 (Itome)',
    description: '達人のような穏やかな糸目スタイル',
    price: 120,
    emoji: '😌',
  },
  'plot.png': {
    id: 'plot.png',
    name: 'ひらめき (Plot)',
    description: '素晴らしい国家計画を思いついた目',
    price: 150,
    emoji: '💡',
  },
  'dissatisfaction.png': {
    id: 'dissatisfaction.png',
    name: 'むすっと (Pout)',
    description: 'ちょっと拗ねた愛嬌あるお顔',
    price: 90,
    emoji: '😕',
  },
  'anger.png': {
    id: 'anger.png',
    name: 'きりっと (Determined)',
    description: '本気で巨大な山脈を掘削する時の気合顔',
    price: 130,
    emoji: '😠',
  },
};

export const OFFICIAL_COUNTRY_KEYS: CountryId[] = [
  'germany',
  'japan',
  'china',
  'italy',
  'sierraleone',
  'russia',
  'france',
  'poland',
  'england472x600',
  'usa',
  'korea',
  'austria',
];

export const COUNTRY_KEYS = Object.keys(COUNTRIES) as CountryId[];
export const EXPRESSION_KEYS = Object.keys(EXPRESSIONS) as ExpressionId[];

export function getBallImageUrl(countryId: CountryId, expressionId: ExpressionId): string {
  if (countryId === 'custom') {
    return `${BASE_BALL_URL}/japan/${expressionId}`;
  }
  return `${BASE_BALL_URL}/${countryId}/${expressionId}`;
}

export function getRandomCountry(): CountryId {
  const idx = Math.floor(Math.random() * OFFICIAL_COUNTRY_KEYS.length);
  return OFFICIAL_COUNTRY_KEYS[idx];
}

export function getRandomExpression(): ExpressionId {
  const idx = Math.floor(Math.random() * EXPRESSION_KEYS.length);
  return EXPRESSION_KEYS[idx];
}

export const GEOGRAPHY_QUIZZES = [
  {
    question: '世界で最も長い山脈はどこでしょう？',
    options: ['ヒマラヤ山脈', 'アンデス山脈', 'ロッキー山脈', 'アルプス山脈'],
    correctIndex: 1,
    explanation: 'アンデス山脈は南アメリカ大陸西岸を約7,500kmにわたって縦断する世界最長の陸上山脈です！',
  },
  {
    question: '本初子午線（経度0度）が通る天文台がある都市は？',
    options: ['パリ', 'ロンドン（グリニッジ）', 'ローマ', '東京'],
    correctIndex: 1,
    explanation: 'イギリス・ロンドンのグリニッジ天文台を通る子午線が世界の標準時（GMT/UTC）の基準です。',
  },
  {
    question: '世界最大の流域面積を誇る大河はどれでしょう？',
    options: ['ナイル川', 'アマゾン川', '長江', 'ミシシッピ川'],
    correctIndex: 1,
    explanation: '長さ世界一はナイル川ですが、流域面積と水量では南米のアマゾン川が世界圧倒的第1位です！',
  },
  {
    question: 'ヨーロッパの地中海性気候（Cs）の大きな特徴は？',
    options: ['夏に雨が多く冬に乾燥する', '夏に乾燥し冬に雨が降る', '年中雨が降らない', '年中寒冷で雪が降る'],
    correctIndex: 1,
    explanation: '亜熱帯高圧帯の影響で夏はカラッと晴れて乾燥し、冬は偏西風の影響で雨が降ります。オリーブ栽培に適しています！',
  },
  {
    question: '日本列島の最高峰、富士山の標高は何メートル？',
    options: ['3,190m', '3,776m', '4,809m', '8,848m'],
    correctIndex: 1,
    explanation: '「みななら（3776）富士山」と覚えます！成層火山として世界文化遺産にも登録されています。',
  },
];
