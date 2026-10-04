import type { LocalRecipe } from './initialRecipes'
import { INITIAL_RECIPES } from './initialRecipes'

/**
 * Catálogo masivo de más de 3000 recetas culinarias estructuradas,
 * garantizando compatibilidad total con el motor de matching y la interfaz de la aplicación.
 */

// 1. Recetas maestras artesanales para intenciones directas
const HANDCRAFTED_INTENT_RECIPES: LocalRecipe[] = [
  // --- SUSHI Y COCINA JAPONESA ---
  {
    id: 'cat-sushi-maki-salmon',
    name: 'Maki clásico de salmón y palta',
    description: 'Rollos tradicionales de alga nori rellenos de salmón fresco, palta cremosa y arroz sazonado.',
    difficulty: 'Media',
    prep_time: 25,
    instructions: '1. Extiende arroz avinagrado sobre lámina de nori.\n2. Coloca tiras de salmón y palta en el centro.\n3. Enrolla con makisu presionando suavemente.\n4. Corta en 8 piezas y acompaña con salsa de soja y wasabi.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'arroz' }, { ingredient_name: 'salmon' }, { ingredient_name: 'palta' }, { ingredient_name: 'alga nori' }],
  },
  {
    id: 'cat-sushi-nigiri-atun',
    name: 'Nigiri suave de atún',
    description: 'Bocados artesanales de arroz moldeado a mano coronados con finos cortes de atún.',
    difficulty: 'Media',
    prep_time: 20,
    instructions: '1. Modela porciones ovaladas de arroz tibio.\n2. Unta una pincelada mínima de wasabi sobre cada corte de atún.\n3. Coloca el pescado sobre el arroz y ajusta con los dedos.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'arroz' }, { ingredient_name: 'atun' }],
  },
  {
    id: 'cat-sushi-poke-bowl',
    name: 'Poké bowl de salmón y sésamo',
    description: 'Cuenco hawaiano de inspiración japonesa con base de arroz, dados de pescado, vegetales y soja.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Sirve arroz blanco en un cuenco amplio.\n2. Distribuye cubos de salmón, pepino, zanahoria y palta.\n3. Sazona con salsa de soja, aceite de sésamo y semillas tostadas.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'arroz' }, { ingredient_name: 'salmon' }, { ingredient_name: 'pepino' }, { ingredient_name: 'soja' }],
  },
  {
    id: 'cat-sushi-onigiri-atun',
    name: 'Onigiri japonés relleno de atún',
    description: 'Triángulos de arroz tradicionales envueltos con alga nori y centro de atún sazonado.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Mezcla atún con un toque ligero de mayonesa y sal.\n2. Modela el arroz en forma triangular encerrando el relleno.\n3. Adhiere una tira de alga nori en la base para sostener con la mano.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'arroz' }, { ingredient_name: 'atun' }, { ingredient_name: 'alga nori' }],
  },
  {
    id: 'cat-sushi-temaki-veggie',
    name: 'Temaki vegetariano crocante',
    description: 'Conos crujientes de alga nori rellenos al momento con arroz, pepino, zanahoria y queso crema.',
    difficulty: 'Fácil',
    prep_time: 12,
    instructions: '1. Toma media hoja de nori.\n2. Coloca arroz en ángulo y vegetales en bastones finos.\n3. Enrolla formando un cono y consume de inmediato.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'arroz' }, { ingredient_name: 'pepino' }, { ingredient_name: 'zanahoria' }, { ingredient_name: 'alga nori' }],
  },

  // --- PIZZA, CALZONE, FOCACCIA ---
  {
    id: 'cat-pizza-calzone-napolitano',
    name: 'Calzone napolitano al horno',
    description: 'Masa de pizza doblada rellena de queso mozzarella fundido, jamón, tomate y orégano.',
    difficulty: 'Media',
    prep_time: 25,
    instructions: '1. Estira un disco de masa de pizza fina.\n2. Rellena una mitad con queso mozzarella, jamón y tomate triturado.\n3. Dobla en media luna y sella los bordes firmemente.\n4. Hornea a 220°C durante 15 minutos hasta dorar.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'harina' }, { ingredient_name: 'queso' }, { ingredient_name: 'tomate' }],
  },
  {
    id: 'cat-pizza-focaccia-romero',
    name: 'Focaccia rústica al romero y oliva',
    description: 'Pan plano esponjoso y aromático con hoyuelos de aceite de oliva virgen extra y romero fresco.',
    difficulty: 'Fácil',
    prep_time: 30,
    instructions: '1. Extiende la masa leudada en una placa con aceite de oliva.\n2. Marca hoyuelos con los dedos e introduce romero y sal gruesa.\n3. Hornea 20 minutos hasta que la superficie esté dorada y crujiente.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'harina' }, { ingredient_name: 'aceite de oliva' }],
  },
  {
    id: 'cat-pizza-fugazzeta-rellena',
    name: 'Fugazzeta rellena tradicional',
    description: 'Masa argentina rellena de abundante queso mozzarella y cubierta con cebolla caramelizada.',
    difficulty: 'Media',
    prep_time: 35,
    instructions: '1. Coloca una base de masa, rellena con mozzarella y tapa con otro disco fino.\n2. Cubre la parte superior con abundante cebolla en juliana fina y orégano.\n3. Hornea fuerte hasta gratinar la cebolla y fundir el queso.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'harina' }, { ingredient_name: 'queso' }, { ingredient_name: 'cebolla' }],
  },

  // --- HAMBURGUESAS Y BOCADOS ---
  {
    id: 'cat-burger-smash-doble',
    name: 'Hamburguesa smash doble queso',
    description: 'Medallones finos aplastados en plancha ardiente con bordes crocantes y cheddar fundido.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Aplasta bolas de carne picada contra la plancha muy caliente.\n2. Salpimienta y da vuelta al formar costra dorada.\n3. Coloca fetas de queso para fundir y monta en pan tostado.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'carne' }, { ingredient_name: 'queso' }, { ingredient_name: 'pan' }],
  },
  {
    id: 'cat-burger-pollo-crocante',
    name: 'Hamburguesa de pollo crocante',
    description: 'Pechuga rebozada super crujiente en pan suave con lechuga fresca y mayonesa suave.',
    difficulty: 'Fácil',
    prep_time: 20,
    instructions: '1. Pasa la pechuga por huevo batido y pan rallado o panko.\n2. Cocina hasta dorar y quedar crujiente.\n3. Sirve en pan con lechuga, tomate y aderezo al gusto.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'pollo' }, { ingredient_name: 'pan' }, { ingredient_name: 'lechuga' }],
  },

  // --- MILANESAS ---
  {
    id: 'cat-milanesa-napolitana',
    name: 'Milanesa a la napolitana clásica',
    description: 'Milanesa dorada cubierta con salsa de tomate casera, jamón cocido y queso mozzarella gratinado.',
    difficulty: 'Fácil',
    prep_time: 20,
    instructions: '1. Dora la milanesa en horno fuerte o sartén.\n2. Cubre con salsa de tomate y abundante queso.\n3. Gratina 5 minutos hasta que el queso burbujee con orégano.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'carne' }, { ingredient_name: 'queso' }, { ingredient_name: 'tomate' }, { ingredient_name: 'huevo' }],
  },
  {
    id: 'cat-milanesa-suprema-limon',
    name: 'Suprema de pollo crocante al limón',
    description: 'Pechuga de pollo fileteada, rebozada y dorada a punto, terminada con jugo fresco de limón.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Sazona la pechuga con ajo y perejil picado.\n2. Pasa por huevo batido y pan rallado.\n3. Cocina hasta que quede bien crocante y sirve con gajos de limón.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'pollo' }, { ingredient_name: 'huevo' }, { ingredient_name: 'pan' }, { ingredient_name: 'limon' }],
  },

  // --- PASTAS ---
  {
    id: 'cat-pasta-carbonara-tradicional',
    name: 'Espaguetis a la carbonara tradicional',
    description: 'Pasta clásica emulsionada con huevo fresco, queso curado y pimienta negra sin crema.',
    difficulty: 'Media',
    prep_time: 18,
    instructions: '1. Hierve la pasta al dente reservando media taza de agua de cocción.\n2. Saltea panceta o guanciale hasta dorar.\n3. Bate yemas con queso rallado y pimienta.\n4. Mezcla la pasta caliente fuera del fuego con el huevo para lograr crema sedosa.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'pasta' }, { ingredient_name: 'huevo' }, { ingredient_name: 'queso' }],
  },
  {
    id: 'cat-pasta-ravioli-ricota',
    name: 'Raviolis de ricota y espinaca con manteca',
    description: 'Pasta rellena artesanal salteada en manteca dorada con hojas de salvia o albahaca.',
    difficulty: 'Media',
    prep_time: 20,
    instructions: '1. Cocina los raviolis en agua hirviendo con sal durante 4 minutos.\n2. Derrite manteca a fuego bajo en sartén hasta que desprenda aroma a nuez.\n3. Saltea los raviolis escurridos y corona con queso parmesano.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'pasta' }, { ingredient_name: 'queso' }, { ingredient_name: 'espinaca' }],
  },

  // --- EMPANADAS ---
  {
    id: 'cat-empanadas-saltenas',
    name: 'Empanadas salteñas de carne a cuchillo',
    description: 'Relleno jugoso de carne cortada a cuchillo con cebolla de verdeo, huevo duro y comino.',
    difficulty: 'Media',
    prep_time: 30,
    instructions: '1. Rehoga cebolla con pimentón y comino.\n2. Agrega la carne cortada a cuchillo unos minutos sin sobrecocinar.\n3. Enfría el relleno, añade huevo picado y verdeo fresco.\n4. Arma las empanadas y hornea a 220°C.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'carne' }, { ingredient_name: 'cebolla' }, { ingredient_name: 'huevo' }],
  },
  {
    id: 'cat-empanadas-jamon-queso',
    name: 'Empanadas de jamón y queso cremoso',
    description: 'El clásico infalible para resolver una comida en 15 minutos con masa crocante.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Corta jamón y queso en dados medianos.\n2. Rellena los discos de masa sellando con repulgue firme.\n3. Hornea 12 minutos hasta dorar.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'queso' }],
  },

  // --- ENSALADAS ---
  {
    id: 'cat-ensalada-cesar-pollo',
    name: 'Ensalada César con pollo dorado',
    description: 'Hojas frescas de lechuga romana con tiras de pollo a la plancha, picatostes y aderezo clásico.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Lava y trocea lechuga fresca.\n2. Dora tiras de pollo y tuesta cubos de pan.\n3. Mezcla en ensaladera con queso rallado y aderezo suave.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'lechuga' }, { ingredient_name: 'pollo' }, { ingredient_name: 'queso' }, { ingredient_name: 'pan' }],
  },
  {
    id: 'cat-ensalada-griega-feta',
    name: 'Ensalada griega con queso y tomate',
    description: 'Tomates maduros, pepino crujiente, cebolla morada y queso en dados con aceite de oliva.',
    difficulty: 'Fácil',
    prep_time: 10,
    instructions: '1. Corta tomates y pepinos en trozos generosos.\n2. Suma cebolla en plumas finas y dados de queso.\n3. Aliña con aceite de oliva virgen extra y orégano.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'tomate' }, { ingredient_name: 'pepino' }, { ingredient_name: 'queso' }, { ingredient_name: 'cebolla' }],
  },

  // --- POSTRES ---
  {
    id: 'cat-postre-flan-casero',
    name: 'Flan casero tradicional con caramelo',
    description: 'Postre emblemático de textura sedosa elaborado a base de huevos frescos y leche.',
    difficulty: 'Media',
    prep_time: 40,
    instructions: '1. Prepara caramelo en la base de la flanera con azúcar.\n2. Bate huevos con leche y un toque de esencia.\n3. Cocina a baño maría en el horno 45 minutos hasta cuajar.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'huevo' }, { ingredient_name: 'leche' }],
  },
  {
    id: 'cat-postre-mousse-chocolate',
    name: 'Mousse aireada de chocolate o café',
    description: 'Postre cremoso y ligero elaborado con claras batidas a nieve y base cremosa.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Bate claras a punto de nieve con pizca de sal.\n2. Integra suavemente con yogur o crema y dulce.\n3. Enfría en la nevera al menos 1 hora antes de servir.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'huevo' }, { ingredient_name: 'yogur' }],
  },

  // --- CORTES ARGENTINOS Y CLÁSICOS CRIOLLOS ---
  {
    id: 'cat-asado-de-tira-chimichurri',
    name: 'Asado de tira a la parrilla con chimichurri',
    description: 'El corte rey del asado argentino con hueso, asado a las brasas y bañado en chimichurri aromático.',
    difficulty: 'Media',
    prep_time: 40,
    instructions: '1. Sala el asado con sal parrillera.\n2. Coloca del lado del hueso a fuego medio durante 30 minutos.\n3. Da vuelta 10 minutos para dorar y sirve con chimichurri casero.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'asado de tira' }, { ingredient_name: 'chimichurri' }],
  },
  {
    id: 'cat-vacio-al-horno-papas',
    name: 'Vacío tierno al horno con papas y romero',
    description: 'Vacío vacuno cocido a fuego lento para lograr carne jugosa con cuerito crujiente y papas doradas.',
    difficulty: 'Media',
    prep_time: 50,
    instructions: '1. Sella el vacío en asadera con sal y pimienta.\n2. Rodéalo de rodajas de papa con romero y aceite.\n3. Hornea a 180°C durante 45 minutos hasta que esté bien tierno.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'vacio' }, { ingredient_name: 'papa' }, { ingredient_name: 'romero' }],
  },
  {
    id: 'cat-entrana-jugosa-criolla',
    name: 'Entraña jugosa con salsa criolla fresca',
    description: 'Corte fino de sabor intenso cocinado vuelta y vuelta a la plancha o brasas con tomate, morrón y cebolla.',
    difficulty: 'Fácil',
    prep_time: 15,
    instructions: '1. Cocina la entraña en plancha muy caliente 5 minutos por lado.\n2. Prepara la salsa criolla picando tomate, morrón y cebolla en cubitos con vinagre y aceite.\n3. Corona la carne caliente con la salsa.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'entrana' }, { ingredient_name: 'morron' }, { ingredient_name: 'cebolla' }, { ingredient_name: 'tomate' }],
  },
  {
    id: 'cat-matambre-a-la-pizza',
    name: 'Matambre a la pizza con queso mozzarella',
    description: 'Matambre tierno tiernizado y cubierto con salsa de tomate casera, queso gratinado y orégano.',
    difficulty: 'Media',
    prep_time: 35,
    instructions: '1. Cocina el matambre a la plancha o asadera con sal.\n2. Cubre con salsa de tomate perita y abundante queso cremoso o mozzarella.\n3. Gratina en horno fuerte hasta fundir el queso con orégano y aceitunas.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'matambre' }, { ingredient_name: 'queso' }, { ingredient_name: 'tomate' }, { ingredient_name: 'oregano' }],
  },
  {
    id: 'cat-bife-de-chorizo-papas',
    name: 'Bife de chorizo a caballo con papas fritas',
    description: 'Bife grueso y jugoso a la plancha servido con huevos fritos y papas crocantes.',
    difficulty: 'Fácil',
    prep_time: 20,
    instructions: '1. Sella el bife de chorizo en sartén caliente 4 minutos por lado para punto jugoso.\n2. Fríe huevos y papas hasta dorar.\n3. Monta los huevos sobre el bife recién hecho.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'bife de chorizo' }, { ingredient_name: 'huevo' }, { ingredient_name: 'papa' }],
  },
  {
    id: 'cat-ojo-de-bife-morrones',
    name: 'Ojo de bife grillado con morrones asados',
    description: 'Corte super tierno con veta de grasa central acompañado de tiras de morrón dulce asado.',
    difficulty: 'Fácil',
    prep_time: 18,
    instructions: '1. Dora el ojo de bife a fuego vivo.\n2. Saltea tiras de morrón rojo y verde con ajo y oliva.\n3. Emplata la carne con los morrones encima.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'ojo de bife' }, { ingredient_name: 'morron' }, { ingredient_name: 'ajo' }],
  },
  {
    id: 'cat-colita-cuadril-batatas',
    name: 'Colita de cuadril al horno con batatas glaseadas',
    description: 'Pieza entera tierna asada con batatas dulces y toque de miel o azúcar rubia.',
    difficulty: 'Media',
    prep_time: 45,
    instructions: '1. Sazona la colita de cuadril con mostaza y especias.\n2. Dispón batatas en cubos alrededor.\n3. Hornea 40 minutos hasta lograr corazón rosado y batatas tiernas.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'colita de cuadril' }, { ingredient_name: 'batata' }],
  },
  {
    id: 'cat-osobuco-polenta',
    name: 'Osobuco braseado al vino tinto con polenta cremosa',
    description: 'Carne braseada que se desarma con tenedor servida sobre base de polenta con queso.',
    difficulty: 'Media',
    prep_time: 60,
    instructions: '1. Dora el osobuco en cacerola con cebolla, zanahoria y ajo.\n2. Vierte vino tinto y caldo y cocina a fuego suave 1 hora.\n3. Prepara polenta con leche y manteca, y corona con el osobuco jugoso.',
    servings: 3,
    recipe_ingredients: [{ ingredient_name: 'osobuco' }, { ingredient_name: 'polenta' }, { ingredient_name: 'cebolla' }, { ingredient_name: 'zanahoria' }],
  },
  {
    id: 'cat-mollejas-al-verdeo',
    name: 'Mollejas tiernas al verdeo y vino blanco',
    description: 'Achura selecta dorada y cocida en suave reducción de cebolla de verdeo y crema.',
    difficulty: 'Fácil',
    prep_time: 25,
    instructions: '1. Blanquea y dora las mollejas fileteadas en sartén hasta que queden crocantes.\n2. Añade abundante cebolla de verdeo picada.\n3. Desglasa con vino blanco, agrega toque de crema y sirve con limón.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'molleja' }, { ingredient_name: 'cebolla de verdeo' }, { ingredient_name: 'limon' }],
  },
  {
    id: 'cat-chinchulines-limon',
    name: 'Chinchulines crocantes al limón',
    description: 'Chinchulines bien desgrasados y dorados a fuego lento hasta quedar super crujientes.',
    difficulty: 'Fácil',
    prep_time: 30,
    instructions: '1. Corta chinchulines en aros o trenzas.\n2. Cocina a la plancha o parrilla a fuego moderado hasta dorar intensamente.\n3. Baña con abundante jugo de limón fresco y sal gruesa.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'chinchulin' }, { ingredient_name: 'limon' }],
  },
  {
    id: 'cat-bondiola-cerveza-batatas',
    name: 'Bondiola de cerdo a la cerveza con batatas',
    description: 'Bondiola jugosa y caramelizada con reducción de cerveza y puré de batatas.',
    difficulty: 'Media',
    prep_time: 50,
    instructions: '1. Sella la bondiola en rodajas gruesas.\n2. Cubre con cebolla caramelizada y cerveza.\n3. Cocina tapado hasta reducir y acompaña con batatas al horno.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'bondiola' }, { ingredient_name: 'cebolla' }, { ingredient_name: 'batata' }],
  },
  {
    id: 'cat-pastel-de-papa-criollo',
    name: 'Pastel de papa tradicional con carne picada',
    description: 'Base de carne picada sazonada con cebolla, morrón y huevo, cubierta con puré de papas gratinado.',
    difficulty: 'Media',
    prep_time: 35,
    instructions: '1. Saltea carne picada con cebolla, morrón y condimentos criollos.\n2. Coloca en fuente y tapa con puré de papas con manteca y queso.\n3. Gratina 15 minutos en horno caliente hasta dorar la superficie.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'carne' }, { ingredient_name: 'papa' }, { ingredient_name: 'cebolla' }, { ingredient_name: 'huevo' }],
  },
  {
    id: 'cat-tarta-pascualina-acelga',
    name: 'Tarta pascualina de acelga y queso',
    description: 'Tarta clásica con masa fina rellena de acelga fresca, queso cremoso y huevos enteros.',
    difficulty: 'Fácil',
    prep_time: 30,
    instructions: '1. Saltea acelga cocida y escurrida con cebolla y nuez moscada.\n2. Mezcla con queso y coloca en disco de masa.\n3. Abre huecos para colocar huevos enteros, tapa y hornea 25 minutos.',
    servings: 4,
    recipe_ingredients: [{ ingredient_name: 'acelga' }, { ingredient_name: 'queso' }, { ingredient_name: 'huevo' }, { ingredient_name: 'cebolla' }],
  },
  {
    id: 'cat-tortilla-papas-babe',
    name: 'Tortilla de papas tradicional jugosa',
    description: 'Papas pochadas lentamente con cebolla dulce y huevos frescos a punto jugoso.',
    difficulty: 'Fácil',
    prep_time: 20,
    instructions: '1. Pocha papas en rodajas con cebolla en aceite hasta que estén tiernas.\n2. Escurre y mezcla con huevos batidos con sal.\n3. Cuaja en sartén caliente 2 minutos por lado dejando el centro jugoso.',
    servings: 3,
    recipe_ingredients: [{ ingredient_name: 'papa' }, { ingredient_name: 'huevo' }, { ingredient_name: 'cebolla' }],
  },
  {
    id: 'cat-revuelto-gramajo',
    name: 'Revuelto Gramajo porteño clásico',
    description: 'Papas pay finas y crocantes mezcladas con jamón cocido, arvejas y huevos revueltos al momento.',
    difficulty: 'Fácil',
    prep_time: 12,
    instructions: '1. Saltea tiras de jamón cocido con arvejas tiernas.\n2. Suma papas pay crocantes.\n3. Rompe huevos directo en la sartén y revuelve suavemente hasta cuajar cremoso.',
    servings: 2,
    recipe_ingredients: [{ ingredient_name: 'papa' }, { ingredient_name: 'huevo' }, { ingredient_name: 'arveja' }],
  },
]

// 2. Generador sistemático de más de 5000 recetas que abarca todos los cortes argentinos, verduras y bases
const PROTEIN_POOL = [
  // Cortes vacunos argentinos
  'asado de tira', 'vacio', 'entrana', 'matambre', 'bife de chorizo', 'ojo de bife',
  'bife angosto', 'bife ancho', 'lomo', 'colita de cuadril', 'cuadril', 'tapa de asado',
  'peceto', 'nalga', 'bola de lomo', 'cuadrada', 'tortuguita', 'paleta', 'roast beef',
  'osobuco', 'falda', 'azotillo', 'marucha', 'carne picada',
  // Cerdo y cortes
  'bondiola', 'pechito de cerdo', 'matambrito de cerdo', 'solomillo de cerdo', 'costillita de cerdo',
  'carre de cerdo', 'panceta',
  // Achuras y embutidos argentinos
  'mollejas', 'chinchulines', 'morcilla', 'chorizo criollo',
  // Pollo y aves
  'pechuga de pollo', 'pata muslo', 'suprema de pollo', 'alitas de pollo', 'pollo entero',
  // Pescados y mariscos
  'filet de merluza', 'salmon', 'atun', 'corvina', 'boga', 'pejerrey', 'calamar', 'langostinos',
  // Lácteos y legumbres
  'provoleta', 'queso cremoso', 'huevo', 'lentejas', 'garbanzos', 'porotos'
]

const VEGGIE_POOL = [
  'tomate', 'papa', 'batata', 'cebolla', 'cebolla de verdeo', 'morron rojo', 'morron verde', 'morron amarillo',
  'zanahoria', 'espinaca', 'acelga', 'zapallo anco', 'zapallo cabutia', 'zapallito verde', 'zucchini',
  'choclo', 'arvejas', 'chauchas', 'berenjena', 'puerro', 'ajo', 'champiñon', 'girgola', 'portobello',
  'lechuga', 'rucula', 'radicheta', 'remolacha', 'pepino', 'repollo blanco', 'repollo colorado',
  'coliflor', 'brocoli', 'alcaucil', 'esparragos', 'apio', 'mandioca', 'palta'
]

const BASE_POOL = [
  'arroz blanco', 'arroz doble carolina', 'pasta', 'fideos cinta', 'tallarines', 'noquis',
  'ravioles', 'polenta', 'tapas de empanada', 'masa de tarta', 'pure de papas', 'pure de calabaza',
  'papas fritas', 'papas rusticas', 'pan casero', 'chimichurri', 'salsa criolla', 'harina',
  'avena', 'aceite de oliva'
]

const COOKING_TECHNIQUES = [
  { verb: 'Asado a la parrilla de', diff: 'Media' as const, time: 45 },
  { verb: 'Braseado tierno al horno de', diff: 'Media' as const, time: 50 },
  { verb: 'Minuta a la plancha de', diff: 'Fácil' as const, time: 15 },
  { verb: 'Guiso criollo de olla con', diff: 'Media' as const, time: 40 },
  { verb: 'Estofado tradicional de', diff: 'Media' as const, time: 45 },
  { verb: 'Milanesa crujiente de', diff: 'Fácil' as const, time: 20 },
  { verb: 'Cazuela campestre de', diff: 'Media' as const, time: 35 },
  { verb: 'Salteado al wok de', diff: 'Fácil' as const, time: 15 },
  { verb: 'Pastel rústico al horno de', diff: 'Media' as const, time: 35 },
  { verb: 'Revuelto jugoso de', diff: 'Fácil' as const, time: 12 },
  { verb: 'Al disco con verduras de', diff: 'Media' as const, time: 40 },
  { verb: 'Torta salada y tarta de', diff: 'Media' as const, time: 30 },
  { verb: 'Empanadas caseras de', diff: 'Media' as const, time: 30 },
  { verb: 'Sopa crema reconfortante de', diff: 'Fácil' as const, time: 20 },
  { verb: 'Gratinado con queso de', diff: 'Media' as const, time: 25 },
  { verb: 'Brochetas grilladas de', diff: 'Fácil' as const, time: 20 },
  { verb: 'Arroz criollo caldoso con', diff: 'Media' as const, time: 25 },
  { verb: 'Salteado provenzal de', diff: 'Fácil' as const, time: 15 },
  { verb: 'Wok agridulce con vegetales de', diff: 'Fácil' as const, time: 18 },
  { verb: 'Escabeche tradicional de', diff: 'Fácil' as const, time: 35 },
  { verb: 'Salteado dorado de', diff: 'Fácil' as const, time: 15 },
  { verb: 'Horneado rústico de', diff: 'Media' as const, time: 30 },
]

// Instanciar catálogo en memoria
let _catalogCache: LocalRecipe[] | null = null

export function getFullRecipeCatalog(): LocalRecipe[] {
  if (_catalogCache) return _catalogCache

  const catalog: LocalRecipe[] = []
  const seenIds = new Set<string>()

  // 1. Recetas iniciales base
  INITIAL_RECIPES.forEach(r => {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id)
      catalog.push(r)
    }
  })

  // 2. Recetas artesanales de intenciones
  HANDCRAFTED_INTENT_RECIPES.forEach(r => {
    if (!seenIds.has(r.id)) {
      seenIds.add(r.id)
      catalog.push(r)
    }
  })

  // 3. Generación determinista para alcanzar más de 5200 recetas culinarias
  let genCounter = 1
  const TARGET_COUNT = 5200

  for (let t = 0; t < COOKING_TECHNIQUES.length && catalog.length < TARGET_COUNT; t++) {
    const tech = COOKING_TECHNIQUES[t]
    for (let p = 0; p < PROTEIN_POOL.length && catalog.length < TARGET_COUNT; p++) {
      const prot = PROTEIN_POOL[p]
      for (let v = 0; v < VEGGIE_POOL.length && catalog.length < TARGET_COUNT; v++) {
        const veg = VEGGIE_POOL[v]
        const base = BASE_POOL[(genCounter + v) % BASE_POOL.length]

        const recipeName = `${tech.verb} ${prot} con ${veg}`
        const id = `rec-gen-${genCounter}`

        if (!seenIds.has(id)) {
          seenIds.add(id)
          catalog.push({
            id,
            name: recipeName,
            description: `Preparación de ${recipeName.toLowerCase()}, combinando ${prot} con ${veg} y base de ${base} para un plato nutritivo y equilibrado.`,
            difficulty: tech.diff,
            prep_time: tech.time,
            instructions: `1. Lava y acondiciona los ingredientes frescos.\n2. Cocina ${prot} junto con ${veg} a fuego adecuado.\n3. Incorpora ${base} y condimenta al gusto.\n4. Sirve caliente y disfruta.`,
            servings: (genCounter % 3) + 2,
            recipe_ingredients: [
              { ingredient_name: prot },
              { ingredient_name: veg },
              { ingredient_name: base },
            ],
          })
          genCounter++
        }
      }
    }
  }

  _catalogCache = catalog
  return _catalogCache
}

export function getTotalRecipesCount(): number {
  return getFullRecipeCatalog().length
}

export const TOTAL_RECIPES_COUNT = 5200
