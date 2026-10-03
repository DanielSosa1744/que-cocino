-- ========================================================
-- ¿Qué Cocino? — Supabase Schema
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================================
-- TABLA: ingredients (Catálogo maestro de ingredientes)
-- ========================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'despensa',
  shelf_life_days INTEGER NOT NULL DEFAULT 7,
  unit_default TEXT DEFAULT 'unidad',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- TABLA: inventory (Inventario por usuario)
-- ========================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'ud',
  expires_at TIMESTAMPTZ,
  is_consumed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_expires_at ON inventory(expires_at);

-- ========================================================
-- TABLA: recipes (Recetas recomendadas)
-- ========================================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  difficulty TEXT DEFAULT 'Fácil', -- 'Fácil', 'Media', 'Difícil'
  prep_time INTEGER DEFAULT 20,    -- minutos
  instructions TEXT,
  servings INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================================
-- TABLA: recipe_ingredients (Relación receta e ingredientes)
-- ========================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'ud',
  is_optional BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- ========================================================
-- TABLA: cooked_history (Historial de impacto del usuario)
-- ========================================================
CREATE TABLE IF NOT EXISTS cooked_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_name TEXT NOT NULL,
  ingredients_used TEXT[] NOT NULL DEFAULT '{}',
  waste_avoided_kg NUMERIC DEFAULT 0,
  money_saved_eur NUMERIC DEFAULT 0,
  co2_avoided_kg NUMERIC DEFAULT 0,
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cooked_history_user_id ON cooked_history(user_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read ingredients" ON ingredients FOR SELECT USING (true);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read recipes" ON recipes FOR SELECT USING (true);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read recipe_ingredients" ON recipe_ingredients FOR SELECT USING (true);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own inventory"
  ON inventory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE cooked_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own cooked history"
  ON cooked_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- SEED DATA: Catálogo de Ingredientes con vida útil (días)
-- ========================================================
INSERT INTO ingredients (name, category, shelf_life_days, unit_default) VALUES
  ('tomate', 'verdura', 7, 'unidad'),
  ('lechuga', 'verdura', 5, 'unidad'),
  ('cebolla', 'verdura', 30, 'unidad'),
  ('huevo', 'proteína', 21, 'unidad'),
  ('queso', 'lácteo', 14, 'g'),
  ('pasta', 'despensa', 365, 'g'),
  ('arroz', 'despensa', 365, 'g'),
  ('yogur', 'lácteo', 10, 'unidad'),
  ('ajo', 'verdura', 60, 'diente'),
  ('pimiento', 'verdura', 7, 'unidad'),
  ('zanahoria', 'verdura', 14, 'unidad'),
  ('patata', 'verdura', 30, 'unidad'),
  ('pollo', 'proteína', 2, 'g'),
  ('carne', 'proteína', 3, 'g'),
  ('pescado', 'proteína', 2, 'g'),
  ('pan', 'despensa', 5, 'rebanada'),
  ('champiñón', 'verdura', 5, 'g'),
  ('leche', 'lácteo', 7, 'ml')
ON CONFLICT (name) DO NOTHING;

-- ========================================================
-- SEED DATA: Recetas base solicitadas en la especificación
-- 1. Tortilla (huevo, cebolla)
-- 2. Ensalada (tomate, lechuga)
-- 3. Pasta mediterránea (tomate, queso, pasta)
-- ========================================================

-- Insertar Recetas
INSERT INTO recipes (id, name, description, difficulty, prep_time, instructions, servings)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Tortilla',
    'Tortilla casera y jugosa. La mejor forma de aprovechar huevos y cebolla antes de que se echen a perder.',
    'Fácil',
    15,
    '1. Pica la cebolla finamente y póchala en una sartén con un poco de aceite a fuego medio durante 8 minutos hasta que esté tierna.\n2. Bate los huevos en un bol con una pizca de sal.\n3. Incorpora la cebolla pochada al huevo batido.\n4. Cuaja la tortilla en la sartén 2-3 minutos por cada lado hasta que quede dorada por fuera y jugosa por dentro.',
    2
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Ensalada',
    'Ensalada fresca y rápida. Ideal para gastar tomates maduros y lechuga antes de que pierdan frescura.',
    'Fácil',
    10,
    '1. Lava bien las hojas de lechuga y córtalas con las manos en trozos cómodos.\n2. Corta los tomates en gajos o dados medianos.\n3. Junta los ingredientes en una ensaladera.\n4. Aliña con aceite de oliva virgen extra, vinagre y sal justo antes de servir.',
    2
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Pasta mediterránea',
    'Pasta reconfortante al estilo mediterráneo. Aprovecha tomates frescos y queso disponible en tu nevera.',
    'Fácil',
    20,
    '1. Pon a hervir abundante agua con sal y cocina la pasta según las instrucciones del paquete.\n2. En una sartén, saltea los tomates picados en dados con una cucharada de aceite a fuego medio hasta que suelten su jugo.\n3. Escurre la pasta al dente y mézclala directamente en la sartén con el tomate.\n4. Apaga el fuego, añade el queso desmenuzado o rallado por encima y mezcla para que se funda ligeramente.',
    2
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'Revuelto de tomate y huevo',
    'Plato exprés altamente nutritivo para salvar tomates blandos y huevos frescos.',
    'Fácil',
    12,
    '1. Trocea los tomates y saltéalos 3 minutos en una sartén con un hilo de aceite.\n2. Vierte los huevos batidos con sal.\n3. Remueve constantemente a fuego suave hasta obtener una textura cremosa.',
    2
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Arroz con verduras',
    'Arroz de aprovechamiento para usar cualquier verdura que tengas en la nevera.',
    'Media',
    25,
    '1. Sofríe cebolla y tomate picados en una sartén.\n2. Agrega el arroz y remueve durante 2 minutos.\n3. Añade el doble de agua caliente o caldo y cocina a fuego medio 18 minutos.',
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  prep_time = EXCLUDED.prep_time,
  instructions = EXCLUDED.instructions;

-- Ingredientes de las recetas
DELETE FROM recipe_ingredients WHERE recipe_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- 1. Tortilla: huevo, cebolla
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'huevo', 4, 'unidad'),
  ('11111111-1111-1111-1111-111111111111', 'cebolla', 1, 'unidad');

-- 2. Ensalada: tomate, lechuga
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'tomate', 2, 'unidad'),
  ('22222222-2222-2222-2222-222222222222', 'lechuga', 1, 'unidad');

-- 3. Pasta mediterránea: tomate, queso, pasta
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'pasta', 200, 'g'),
  ('33333333-3333-3333-3333-333333333333', 'tomate', 3, 'unidad'),
  ('33333333-3333-3333-3333-333333333333', 'queso', 60, 'g');

-- 4. Revuelto de tomate y huevo
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'tomate', 2, 'unidad'),
  ('44444444-4444-4444-4444-444444444444', 'huevo', 3, 'unidad');

-- 5. Arroz con verduras
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit)
VALUES
  ('55555555-5555-5555-5555-555555555555', 'arroz', 200, 'g'),
  ('55555555-5555-5555-5555-555555555555', 'cebolla', 1, 'unidad'),
  ('55555555-5555-5555-5555-555555555555', 'tomate', 1, 'unidad');
