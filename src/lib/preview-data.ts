import { locales, type Locale } from './locales'
export type Product = {
  line?: string
  categorySlug?: string
  sections?: { key: string; heading?: string | null; text?: string | null }[]
  relatedGuides?: any[]
  relatedSolutions?: any[]
  source?: string
  id: string | number
  slug: string
  code: string
  title: string
  summary: string
  description: string
  materials: string[]
  category: string
  image?: string
  imageAlt?: string
  illustrative?: boolean
  images?: { url: string; alt: string; illustrative: boolean }[]
  seoTitle?: string
  seoDescription?: string
  specs: { label: string; value: string }[]
}
const names = [
  [
    'Custom molded rubber parts',
    'Pièces moulées en caoutchouc sur mesure',
    'Gummiformteile nach Zeichnung',
    'Piezas moldeadas de caucho a medida',
    'Parti stampate in gomma su misura',
    'カスタム成形ゴム部品',
    '맞춤형 성형 고무 부품',
  ],
  [
    'Solid rubber gaskets & washers',
    'Joints plats et rondelles en caoutchouc plein',
    'Flachdichtungen und Scheiben aus Vollgummi',
    'Juntas planas y arandelas de caucho macizo',
    'Guarnizioni e rondelle in gomma piena',
    'ソリッドゴムガスケット・ワッシャー',
    '솔리드 고무 개스킷 및 와셔',
  ],
  [
    'Custom FKM O-rings',
    'Joints toriques FKM sur mesure',
    'FKM-O-Ringe nach Spezifikation',
    'Juntas tóricas FKM a medida',
    'O-ring FKM su misura',
    'カスタムFKM Oリング',
    '맞춤형 FKM O링',
  ],
  [
    'Standard O-rings',
    'Joints toriques standard',
    'Standard-O-Ringe',
    'Juntas tóricas estándar',
    'O-ring standard',
    '標準Oリング',
    '표준 O링',
  ],
  [
    'O-ring & seal kits',
    'Kits de joints toriques et d’étanchéité',
    'O-Ring- und Dichtungssätze',
    'Kits de juntas tóricas y sellado',
    'Kit di O-ring e tenute',
    'Oリング・シールキット',
    'O링 및 씰 키트',
  ],
]
const summaries = [
  [
    'Plugs, caps and sleeves made around your drawing.',
    'Bouchons, capuchons et manchons selon votre plan.',
    'Stopfen, Kappen und Hülsen nach Ihrer Zeichnung.',
    'Tapones, tapas y manguitos según su plano.',
    'Tappi, cappucci e manicotti secondo il tuo disegno.',
    '図面に合わせたプラグ、キャップ、スリーブ。',
    '도면에 맞춘 플러그, 캡과 슬리브.',
  ],
  [
    'Flat gaskets and washers to your dimensions.',
    'Joints plats et rondelles selon vos dimensions.',
    'Flachdichtungen und Scheiben nach Ihren Maßen.',
    'Juntas planas y arandelas según sus dimensiones.',
    'Guarnizioni piane e rondelle secondo le tue dimensioni.',
    '指定寸法の平型ガスケットとワッシャー。',
    '지정 치수의 평면 개스킷과 와셔.',
  ],
  [
    'Non-standard sizes and specified compounds.',
    'Dimensions non standard et mélanges spécifiés.',
    'Sonderabmessungen und spezifizierte Mischungen.',
    'Dimensiones no estándar y compuestos especificados.',
    'Dimensioni non standard e mescole specificate.',
    '非標準寸法と指定配合に対応するご相談。',
    '비표준 치수 및 지정 배합 상담.',
  ],
  [
    'Defined dimensions. Specified materials.',
    'Dimensions définies. Matériaux spécifiés.',
    'Definierte Maße. Spezifizierte Werkstoffe.',
    'Dimensiones definidas. Materiales especificados.',
    'Dimensioni definite. Materiali specificati.',
    '明確な寸法と指定材質。',
    '정해진 치수, 지정된 소재.',
  ],
  [
    'Assembled to your approved bill of materials.',
    'Assemblés selon votre nomenclature approuvée.',
    'Zusammengestellt nach freigegebener Stückliste.',
    'Montados según su lista de materiales aprobada.',
    'Assemblati secondo la distinta base approvata.',
    '承認済み部品表に基づくキット。',
    '승인된 부품표에 맞춘 키트.',
  ],
]
const details = [
  [
    'Share your drawing or sample requirements, fitting dimensions, material, hardness and quantity. Tooling, sample approval and documentation are agreed before supply.',
    'Indiquez le plan ou les exigences de l’échantillon, les dimensions, le matériau, la dureté et la quantité. Outillage, validation et documents sont convenus avant fourniture.',
    'Teilen Sie Zeichnung oder Musteranforderungen, Einbaumaße, Werkstoff, Härte und Menge mit. Werkzeuge, Musterfreigabe und Dokumentation werden vor der Lieferung vereinbart.',
    'Comparta el plano o los requisitos de muestra, dimensiones, material, dureza y cantidad. Utillaje, aprobación y documentos se acuerdan antes del suministro.',
    'Condividi il disegno o i requisiti del campione, dimensioni, materiale, durezza e quantità. Attrezzature, approvazione e documenti vengono concordati prima della fornitura.',
    '図面またはサンプル要件、取付寸法、材質、硬度、数量をお知らせください。金型、サンプル承認、必要書類は供給前に合意します。',
    '도면 또는 샘플 요건, 장착 치수, 소재, 경도와 수량을 알려주세요. 금형, 샘플 승인 및 문서는 공급 전에 합의합니다.',
  ],
  [
    'Specify inner and outer dimensions, thickness, tolerances and operating conditions. Cutting or molding is evaluated against geometry, material availability and quantity.',
    'Précisez les dimensions intérieures et extérieures, l’épaisseur, les tolérances et les conditions d’utilisation. La découpe ou le moulage est évalué selon la géométrie, le matériau et la quantité.',
    'Geben Sie Innen- und Außenmaße, Dicke, Toleranzen und Betriebsbedingungen an. Schneiden oder Formen wird anhand von Geometrie, Werkstoffverfügbarkeit und Menge bewertet.',
    'Indique dimensiones interiores y exteriores, espesor, tolerancias y condiciones de uso. Se evalúa corte o moldeo según geometría, disponibilidad y cantidad.',
    'Indica dimensioni interne ed esterne, spessore, tolleranze e condizioni d’uso. Taglio o stampaggio vengono valutati secondo geometria, disponibilità e quantità.',
    '内外寸法、厚さ、公差、使用条件をご指定ください。形状、材料の供給状況、数量に応じて切断または成形を検討します。',
    '내외 치수, 두께, 공차와 사용 조건을 지정해 주세요. 형상, 소재 공급 상황과 수량에 따라 절단 또는 성형을 검토합니다.',
  ],
  [
    'Provide inside diameter, cross-section, hardness and the required compound specification. Include medium, normal and peak temperature, pressure and motion.',
    'Indiquez diamètre intérieur, section, dureté et spécification du mélange. Ajoutez le fluide, les températures normale et maximale, la pression et le mouvement.',
    'Nennen Sie Innendurchmesser, Schnurstärke, Härte und Mischungsspezifikation sowie Medium, Normal- und Spitzentemperatur, Druck und Bewegung.',
    'Indique diámetro interior, sección, dureza y especificación del compuesto, además de fluido, temperaturas normal y máxima, presión y movimiento.',
    'Indica diametro interno, sezione, durezza e specifica della mescola, oltre a fluido, temperatura normale e di picco, pressione e movimento.',
    '内径、線径、硬度、配合仕様をご指定ください。媒体、通常・最高温度、圧力、動きもお知らせください。',
    '내경, 단면 지름, 경도와 배합 사양을 알려주세요. 매체, 정상 및 최고 온도, 압력과 움직임도 포함해 주세요.',
  ],
  [
    'Supply is quoted against your size reference or inside diameter and cross-section. Confirm the dimensional standard, material, hardness and quantity for each line.',
    'Le devis est établi selon votre référence dimensionnelle ou le diamètre intérieur et la section. Confirmez norme, matériau, dureté et quantité pour chaque ligne.',
    'Das Angebot basiert auf Ihrer Größenreferenz oder auf Innendurchmesser und Schnurstärke. Bestätigen Sie Maßnorm, Werkstoff, Härte und Menge je Position.',
    'El presupuesto se basa en su referencia de tamaño o diámetro interior y sección. Confirme norma dimensional, material, dureza y cantidad por línea.',
    'Il preventivo si basa sul riferimento dimensionale o su diametro interno e sezione. Conferma norma, materiale, durezza e quantità per voce.',
    'サイズ番号または内径と線径に基づきお見積もりします。各明細の寸法規格、材質、硬度、数量をご確認ください。',
    '규격 번호 또는 내경과 단면 지름을 기준으로 견적을 제공합니다. 항목별 치수 규격, 소재, 경도와 수량을 확인해 주세요.',
  ],
  [
    'Provide a version-controlled BOM with each part number, size, material, hardness and quantity per kit. Components, substitutions, packing and labels are agreed individually.',
    'Fournissez une nomenclature versionnée avec référence, dimensions, matériau, dureté et quantité par kit. Composants, substitutions, emballage et étiquettes sont convenus individuellement.',
    'Übermitteln Sie eine versionierte Stückliste mit Teilenummer, Größe, Werkstoff, Härte und Menge je Satz. Bauteile, Ersatzteile, Verpackung und Etiketten werden einzeln abgestimmt.',
    'Facilite una lista versionada con referencia, tamaño, material, dureza y cantidad por kit. Componentes, sustituciones, embalaje y etiquetas se acuerdan individualmente.',
    'Fornisci una distinta revisionata con codice, dimensioni, materiale, durezza e quantità per kit. Componenti, sostituzioni, imballaggio ed etichette vengono concordati singolarmente.',
    '部品番号、寸法、材質、硬度、キット当たり数量を含む版管理された部品表をご提供ください。部品、代替品、梱包、ラベルは個別に合意します。',
    '부품 번호, 치수, 소재, 경도와 키트당 수량이 포함된 버전 관리 부품표를 제공해 주세요. 부품, 대체품, 포장과 라벨은 개별 합의합니다.',
  ],
]
const slugs = [
  'custom-molded-rubber-parts',
  'solid-rubber-gaskets',
  'custom-fkm-o-rings',
  'standard-o-rings',
  'o-ring-seal-kits',
]
const traditionalChinese = [
  {
    title: '客製化橡膠模壓零件',
    summary: '依您的圖面製作塞頭、端蓋與套筒。',
    description:
      '請提供圖面或樣品要求、安裝尺寸、材料、硬度及數量。模具、樣品核准及文件要求，均於供貨前議定。',
  },
  {
    title: '實心橡膠墊片與墊圈',
    summary: '依指定尺寸製作平面墊片與墊圈。',
    description:
      '請提供內外尺寸、厚度、公差及使用條件。依據幾何形狀、材料供應情況及數量，評估採用裁切或模壓製程。',
  },
  {
    title: '客製化 FKM O 型環',
    summary: '非標準尺寸與指定膠料配方。',
    description:
      '請提供內徑、截面直徑、硬度及所需膠料配方規格，並說明接觸介質、正常與最高溫度、壓力及運動方式。',
  },
  {
    title: '標準 O 型環',
    summary: '明確的尺寸，指定的材料。',
    description: '依據您提供的尺寸型號，或內徑與截面直徑進行報價。請逐項確認尺寸標準、材料、硬度及數量。',
  },
  {
    title: 'O 型環與密封套件',
    summary: '依核准的物料清單組配。',
    description:
      '請提供有版本控管的物料清單，列明每項零件的編號、尺寸、材料、硬度及每套數量。零件、替代方案、包裝與標籤均個別議定。',
  },
]
export function previewProducts(locale: Locale): Product[] {
  const l = locales.indexOf(locale)
  return names.map((n, i) => ({
    id: `preview-${i + 1}`,
    slug: slugs[i],
    code: `RUB-00${i + 1}`,
    title: locale === 'zh-Hant' ? traditionalChinese[i].title : n[l],
    summary: locale === 'zh-Hant' ? traditionalChinese[i].summary : summaries[i][l],
    description: locale === 'zh-Hant' ? traditionalChinese[i].description : details[i][l],
    materials: i === 2 ? ['FKM'] : i === 1 ? ['NBR', 'EPDM', 'FKM'] : ['NBR', 'EPDM', 'FKM', 'Silicone'],
    category: locale === 'zh-Hant' ? traditionalChinese[i].title : n[l],
    illustrative: true,
    specs: [],
  }))
}
export const materialCodes = ['NBR', 'EPDM', 'FKM', 'Silicone']
