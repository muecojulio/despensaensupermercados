export const TIENDAS = [
  { id: "3b", nombre: "Tiendas 3B", membresia: false },
  { id: "neto", nombre: "Tiendas Neto", membresia: false },
  { id: "bodega", nombre: "Bodega Aurrerá", membresia: false },
  { id: "chedraui", nombre: "Chedraui", membresia: false },
  { id: "soriana", nombre: "Soriana", membresia: false },
  { id: "mega_soriana", nombre: "Mega Soriana", membresia: false },
  { id: "walmart", nombre: "Walmart", membresia: false },
  { id: "walmart_express", nombre: "Walmart Express", membresia: false },
  { id: "superissste", nombre: "SuperISSSTE", membresia: false },
  { id: "sumesa", nombre: "Sumesa", membresia: false },
  { id: "chedraui_selecto", nombre: "Chedraui Selecto", membresia: false },
  { id: "la_comer", nombre: "La Comer", membresia: false },
  { id: "fresko", nombre: "Fresko", membresia: false },
  { id: "city_market", nombre: "City Market", membresia: false },
  { id: "city_club", nombre: "City Club", membresia: true },
  { id: "sams", nombre: "Sam's Club", membresia: true },
  { id: "costco", nombre: "Costco", membresia: true },
];

function p(row) {
  const ids = TIENDAS.map((t) => t.id);
  const prices = {};
  ids.forEach((id, i) => { prices[id] = row[i]; });
  return prices;
}

function item(id, nombre, unidad, emoji, categoria, aliases, precios) {
  return { id, nombre, unidad, emoji, categoria, imagen: "/productos/" + id + ".svg", aliases, precios: p(precios) };
}

export const PRODUCTOS = [
  item("leche_1l", "Leche entera 1 L", "pieza", "🥛", "lacteos", ["leche", "leche entera", "leche 1l", "leche lala", "leche alpura"], [22, 23, 24, 25, 26, 26, 27, 28, 25, 29, 31, 32, 33, 36, 23, 22, 21]),
  item("huevo_12", "Huevo blanco 12 pzas", "paquete", "🥚", "lacteos", ["huevo", "huevo 12", "cartón de huevo", "carton de huevo", "huevo blanco"], [38, 39, 41, 42, 43, 43, 46, 47, 44, 48, 52, 54, 55, 62, 40, 39, 38]),
  item("huevo_30", "Huevo blanco 30 pzas", "paquete", "🥚", "lacteos", ["huevo 30", "charola de huevo", "huevo kilo"], [88, 90, 94, 96, 98, 98, 105, 108, 99, 110, 118, 122, 124, 140, 90, 88, 86]),
  item("tortilla_kg", "Tortilla de maíz 1 kg", "kg", "🌮", "despensa", ["tortilla", "tortillas", "tortilla kg"], [22, 22, 23, 24, 24, 24, 25, 26, 23, 26, 28, 29, 30, 34, 22, 22, 21]),
  item("pan_caja", "Pan de caja 680 g", "pieza", "🍞", "despensa", ["pan", "pan de caja", "bimbo", "pan blanco"], [42, 43, 45, 47, 48, 48, 49, 50, 47, 52, 55, 56, 57, 64, 44, 43, 42]),
  item("arroz_kg", "Arroz 1 kg", "kg", "🍚", "despensa", ["arroz", "arroz kg"], [28, 29, 32, 33, 34, 34, 36, 37, 33, 38, 40, 42, 43, 48, 30, 29, 28]),
  item("frijol_kg", "Frijol negro 1 kg", "kg", "🫘", "despensa", ["frijol", "frijoles", "frijol negro"], [36, 37, 40, 42, 43, 43, 45, 46, 41, 48, 50, 52, 53, 60, 38, 37, 36]),
  item("aceite_1l", "Aceite vegetal 1 L", "pieza", "🫢", "despensa", ["aceite", "aceite 1l", "aceite vegetal", "aceite de cocina"], [38, 39, 42, 44, 45, 45, 47, 48, 44, 50, 53, 55, 56, 64, 40, 39, 38]),
  item("azucar_kg", "Azúcar 1 kg", "kg", "🍬", "despensa", ["azucar", "azúcar", "azucar kg"], [28, 29, 32, 33, 34, 34, 35, 36, 33, 37, 39, 40, 41, 46, 30, 29, 28]),
  item("sal", "Sal 1 kg", "kg", "🧂", "despensa", ["sal", "sal de mesa"], [14, 14, 16, 17, 17, 17, 18, 18, 16, 19, 20, 21, 21, 24, 15, 14, 14]),
  item("pasta", "Pasta sopa 200 g", "pieza", "🍝", "despensa", ["pasta", "sopa", "espagueti", "spaghetti", "macarron"], [10, 10, 12, 13, 13, 13, 14, 14, 12, 15, 16, 16, 17, 19, 11, 11, 10]),
  item("atun", "Atún en agua 140 g", "lata", "🐟", "despensa", ["atun", "atún", "lata de atun"], [16, 17, 18, 19, 20, 20, 21, 22, 19, 23, 24, 25, 26, 30, 17, 17, 16]),
  item("jitomate_kg", "Jitomate saladet 1 kg", "kg", "🍅", "fruta", ["jitomate", "tomate", "jitomate saladet"], [28, 29, 32, 34, 35, 36, 38, 40, 34, 42, 44, 46, 48, 58, 30, 29, 28]),
  item("cebolla_kg", "Cebolla blanca 1 kg", "kg", "🧅", "fruta", ["cebolla", "cebolla blanca"], [22, 22, 24, 26, 26, 26, 28, 29, 25, 30, 32, 33, 34, 40, 23, 22, 22]),
  item("papa_kg", "Papa 1 kg", "kg", "🥔", "fruta", ["papa", "papas"], [24, 24, 26, 28, 28, 28, 30, 31, 27, 32, 34, 35, 36, 42, 25, 24, 24]),
  item("platano_kg", "Plátano tabasco 1 kg", "kg", "🍌", "fruta", ["platano", "plátano", "banana"], [18, 18, 20, 22, 22, 22, 24, 25, 21, 26, 28, 29, 30, 36, 19, 18, 18]),
  item("manzana_kg", "Manzana 1 kg", "kg", "🍎", "fruta", ["manzana", "manzanas"], [42, 44, 48, 52, 54, 54, 56, 58, 50, 60, 64, 68, 70, 82, 46, 44, 42]),
  item("limon_kg", "Limón 1 kg", "kg", "🍋", "fruta", ["limon", "limón", "limones"], [32, 33, 36, 38, 39, 39, 42, 44, 38, 46, 48, 50, 52, 62, 34, 33, 32]),
  item("aguacate_kg", "Aguacate hass 1 kg", "kg", "🥑", "fruta", ["aguacate", "aguacate hass"], [58, 60, 68, 72, 74, 74, 78, 82, 70, 86, 90, 96, 98, 120, 64, 62, 60]),
  item("pollo_kg", "Pollo entero 1 kg", "kg", "🍗", "carnes", ["pollo", "pollo entero", "pollo kg"], [48, 49, 52, 54, 55, 55, 58, 60, 53, 62, 66, 68, 70, 82, 50, 49, 48]),
  item("pechuga_kg", "Pechuga de pollo 1 kg", "kg", "🍖", "carnes", ["pechuga", "pechuga de pollo"], [92, 94, 98, 102, 104, 104, 108, 112, 100, 116, 122, 126, 128, 148, 96, 94, 92]),
  item("molida_kg", "Carne molida de res 1 kg", "kg", "🥩", "carnes", ["carne molida", "molida", "carne de res"], [128, 130, 138, 145, 148, 148, 155, 160, 142, 165, 175, 182, 186, 210, 132, 130, 128]),
  item("yogurt", "Yogurt 1 kg", "pieza", "🥣", "lacteos", ["yogurt", "yoghurt", "yogurt lala"], [38, 39, 42, 44, 45, 45, 47, 48, 43, 50, 54, 56, 57, 66, 40, 39, 38]),
  item("queso_oaxaca", "Queso Oaxaca 400 g", "pieza", "🧀", "lacteos", ["queso", "queso oaxaca", "quesillo"], [62, 64, 68, 72, 74, 74, 78, 80, 70, 84, 88, 92, 94, 110, 66, 64, 62]),
  item("crema", "Crema 426 ml", "pieza", "🥛", "lacteos", ["crema", "crema lala"], [32, 33, 36, 38, 39, 39, 41, 42, 37, 44, 46, 48, 49, 56, 34, 33, 32]),
  item("mantequilla", "Mantequilla 90 g", "pieza", "🧈", "lacteos", ["mantequilla"], [22, 23, 25, 26, 27, 27, 28, 29, 26, 30, 32, 33, 34, 38, 24, 23, 22]),
  item("cafe", "Café soluble 180 g", "pieza", "☕", "despensa", ["cafe", "café", "nescafe", "nescafé", "cafe soluble"], [88, 90, 96, 99, 102, 102, 108, 110, 98, 114, 120, 124, 126, 145, 92, 90, 88]),
  item("avena", "Avena 800 g", "pieza", "🌾", "despensa", ["avena"], [36, 37, 40, 42, 43, 43, 45, 46, 41, 48, 50, 52, 53, 60, 38, 37, 36]),
  item("lentejas", "Lenteja 500 g", "pieza", "🫘", "despensa", ["lenteja", "lentejas"], [22, 23, 25, 26, 27, 27, 28, 29, 26, 30, 32, 33, 34, 38, 24, 23, 22]),
  item("agua_15", "Agua embotellada 1.5 L", "pieza", "💧", "bebidas", ["agua", "agua 1.5", "bonafont", "ciel"], [12, 12, 14, 15, 15, 15, 16, 16, 14, 17, 18, 18, 19, 22, 13, 12, 12]),
  item("refresco", "Refresco de cola 3 L", "pieza", "🥤", "bebidas", ["refresco", "coca", "coca cola", "coca-cola", "cocacola", "refresco de cola", "cola", "soda"], [38, 39, 42, 44, 45, 45, 46, 47, 43, 48, 50, 52, 53, 58, 40, 39, 38]),
  item("papel_4", "Papel higiénico 4 rollos", "paquete", "🧻", "hogar", ["papel", "papel higienico", "papel higiénico", "papel de baño"], [32, 33, 36, 38, 39, 39, 42, 43, 37, 45, 48, 50, 52, 60, 34, 33, 32]),
  item("jabon", "Jabón de barra 150 g", "pieza", "🧼", "hogar", ["jabon", "jabón", "jabon de tocador"], [14, 14, 16, 17, 17, 17, 18, 19, 16, 20, 21, 22, 22, 26, 15, 14, 14]),
  item("detergente", "Detergente en polvo 1 kg", "pieza", "🧺", "hogar", ["detergente", "fab", "ariel", "roma"], [38, 39, 42, 45, 46, 46, 48, 50, 44, 52, 55, 58, 59, 68, 40, 39, 38]),
  item("cloro", "Blanqueador 1 L", "pieza", "🧴", "hogar", ["cloro", "blanqueador", "pinol cloro"], [18, 18, 20, 22, 22, 22, 24, 25, 21, 26, 28, 29, 30, 34, 19, 18, 18]),
  item("aceite_oliva", "Aceite de oliva 500 ml", "pieza", "🫒", "despensa", ["aceite de oliva", "oliva"], [78, 80, 88, 92, 95, 95, 99, 105, 90, 110, 118, 125, 128, 148, 82, 80, 78]),
  item("cereal", "Cereal 500 g", "pieza", "🥣", "despensa", ["cereal", "zucaritas", "corn flakes"], [52, 54, 58, 62, 64, 64, 68, 70, 60, 72, 76, 80, 82, 95, 56, 54, 52]),
  item("galletas", "Galletas marías 160 g", "paquete", "🍪", "despensa", ["galletas", "marias", "marías"], [16, 16, 18, 19, 19, 19, 20, 21, 18, 22, 23, 24, 25, 28, 17, 16, 16]),
];
