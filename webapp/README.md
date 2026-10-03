# ¿Qué Cocino? — Webapp

Asistente doméstico para evitar desperdiciar comida.

## Stack

- **React 19 + TypeScript**
- **Vite 8**
- **TailwindCSS v4**
- **Supabase** (Auth + PostgreSQL)
- **React Query v5**
- **React Router v7**
- **Lucide React** (iconos)

## Configuración inicial

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto gratuito
2. En el SQL Editor, ejecuta el contenido de `supabase/schema.sql`
3. Esto crea las tablas, políticas de seguridad (RLS) y datos semilla con 8 recetas

### 2. Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima
```

### 3. Instalar y ejecutar

```bash
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

## Flujo de la aplicación

```
Login / Registro
     ↓
Pantalla principal
     ↓
Voz (Web Speech API) → Transcripción editable
     ↓
Confirmación de ingredientes (nombre, cantidad, caducidad)
     ↓
Inventario (semáforo: 🔴 urgente / 🟡 esta semana / 🟢 bien)
     ↓
Vaciar Nevera (Motor de puntuación por urgencia)
     ↓
Detalle de receta + "¡Lo he cocinado!"
     ↓
Impacto (ahorro en euros, kg CO2 evitado, historial)
```

## Motor Vaciar Nevera

La puntuación de cada receta se calcula así:

```
score = (ingredientes_urgentes_usados x 10) + (ingredientes_totales_usados x 2)
```

- **Crítico** (caduca en 2 días o menos) → +10 por ingrediente
- **Aviso** (caduca en 7 días o menos) → +1 por ingrediente
- **OK** → 0 puntos extra

Las recetas con más puntuación aparecen primero.

## Estructura del proyecto

```
webapp/
├── src/
│   ├── components/        # UrgencyBadge, ProtectedRoute
│   ├── contexts/          # AuthContext (Supabase Auth)
│   ├── hooks/             # useInventory, useRecipes, useSpeechRecognition
│   ├── lib/               # supabase client, ingredientParser
│   ├── pages/
│   │   ├── auth/          # Login, Register, ForgotPassword
│   │   ├── voice/         # VoicePage, ConfirmIngredientsPage
│   │   ├── inventory/     # InventoryPage
│   │   ├── recipes/       # VaciarNeveraPage, RecipeDetailPage
│   │   ├── impact/        # ImpactPage
│   │   └── HomePage.tsx
│   └── types/             # app.types.ts
├── supabase/
│   └── schema.sql         # Schema completo + seed de recetas
└── .env.example
```

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de produccion
npm run preview  # Preview del build
```
