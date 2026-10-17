# Reki - Plan de Proyecto

> App de flashcards open-source para iOS con repeticion espaciada (FSRS), compatible con mazos Anki (.apkg).

## 1. Vision

Reki es una app de flashcards gratuita y open-source para iPhone, diseñada para estudio de certificaciones (AWS, Microsoft), idiomas y cualquier tema que requiera memorizacion a largo plazo. Utiliza el algoritmo FSRS (Free Spaced Repetition Scheduler), compatible con mazos Anki existentes (.apkg), y con una arquitectura preparada para features de IA en el futuro.

## 2. Tech Stack

### Core

| Tecnologia                  | Version | Que resuelve        | Justificacion                                                                       |
| --------------------------- | ------- | ------------------- | ----------------------------------------------------------------------------------- |
| **Expo SDK 58**             | ~58.0   | Framework mobile    | Builds sin config nativa, OTA updates, EAS build. Hot reload para desarrollo rapido |
| **React Native**            | 0.88    | UI nativa           | Componentes nativos reales (no WebView). Ecosistema enorme                          |
| **TypeScript**              | ~6.0    | Tipado estatico     | Menos bugs en runtime, mejor autocompletado, refactoring seguro                     |
| **expo-sqlite**             | SDK 58  | Base de datos local | Offline-first, performante. Los .apkg son SQLite internamente                       |
| **ts-fsrs**                 | latest  | Algoritmo SRS       | FSRS v4, open-source, optimizado con ML. Estandar moderno que reemplaza SM-2        |
| **expo-router**             | ~58.0   | Navegacion          | File-based routing, deep linking, typed routes                                      |
| **Zustand**                 | latest  | Estado global       | Ligero (~1kb), sin boilerplate, perfecto para app mediana                           |
| **React Native Reanimated** | 4.x     | Animaciones         | 60fps en UI thread. Flip de tarjetas, gestos de swipe                               |

### Alternativas consideradas y descartadas

| Opcion               | Por que no                                                                            |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Flutter/Dart**     | Stack diferente al que manejo (JS/TS), ecosistema mas chico para librerias SRS        |
| **Swift/SwiftUI**    | Solo iOS, curva de aprendizaje alta, no cross-platform                                |
| **PWA**              | Sin acceso completo a SQLite, sin notificaciones push reales en iOS, sin offline real |
| **Redux**            | Demasiado boilerplate para el tamaño de la app. Zustand es mas simple y performante   |
| **SM-2 (SuperMemo)** | Algoritmo de los 90s, FSRS lo supera en precision de scheduling con ML                |

### Dev Tooling

| Herramienta             | Proposito                                        |
| ----------------------- | ------------------------------------------------ |
| ESLint 10 (flat config) | Analisis estatico de codigo                      |
| Prettier                | Formato de codigo consistente                    |
| Husky                   | Git hooks automaticos                            |
| lint-staged             | Lint solo en archivos staged (rapido)            |
| commitlint              | Conventional Commits (`feat:`, `fix:`, `chore:`) |
| Node 22 LTS             | Runtime de desarrollo (fijado con .nvmrc)        |

### Futuro (no MVP)

| Tecnologia            | Fase | Proposito                                    |
| --------------------- | ---- | -------------------------------------------- |
| Supabase              | F3   | Sync cloud, auth, backup                     |
| Claude/OpenAI API     | F3   | Generacion de tarjetas con IA, explicaciones |
| expo-notifications    | F2   | Recordatorios de estudio                     |
| expo-speech / expo-av | F3   | TTS para idiomas                             |
| expo-haptics          | F1   | Feedback tactil                              |

## 3. Arquitectura

```
reki/
├── app/                          # Expo Router (screens) - YA EXISTE del template
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Dashboard / home
│   │   ├── explore.tsx           # Placeholder → sera decks
│   │   └── _layout.tsx           # Tab layout config
│   └── _layout.tsx               # Root layout
├── src/                          # Todo el codigo de negocio
│   ├── components/
│   │   ├── ui/                   # Botones, inputs, cards genericos
│   │   └── study/                # CardFlip, AnswerButtons, ProgressBar
│   ├── features/
│   │   ├── decks/                # CRUD mazos, importador .apkg
│   │   ├── cards/                # CRUD tarjetas, tipos de tarjeta
│   │   ├── study/                # Sesion de estudio, FSRS scheduling
│   │   └── stats/                # Calculo de estadisticas
│   ├── lib/
│   │   ├── database/             # Schema SQLite, migrations, queries
│   │   ├── fsrs/                 # Wrapper de ts-fsrs
│   │   └── apkg/                 # Parser de archivos .apkg
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # Custom hooks
│   ├── constants/                # Colores, config, tema
│   └── types/                    # TypeScript types globales
├── assets/                       # Iconos, fonts, imagenes
└── docs/                         # Documentacion del proyecto
```

### Principios de arquitectura

1. **Feature-based**: Cada feature es autocontenida (logica, tipos, hooks propios)
2. **Offline-first**: SQLite es la fuente de verdad. Todo funciona sin internet
3. **Separation of concerns**: UI (app/) → Logica (features/) → Data (lib/database/)
4. **Escalable**: Agregar features nuevas no toca las existentes

## 4. Modelo de Datos (SQLite)

```sql
CREATE TABLE decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  card_count INTEGER DEFAULT 0,
  new_count INTEGER DEFAULT 0,
  due_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  type TEXT DEFAULT 'basic' CHECK (type IN ('basic', 'cloze', 'typing')),
  tags TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  state TEXT DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  due TEXT DEFAULT (datetime('now')),
  stability REAL DEFAULT 0,
  difficulty REAL DEFAULT 0,
  elapsed_days REAL DEFAULT 0,
  scheduled_days REAL DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  last_review TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  started_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE TABLE media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  data BLOB,
  mime_type TEXT
);

-- Indices para performance
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_reviews_card_id ON reviews(card_id);
CREATE INDEX idx_reviews_due ON reviews(due);
CREATE INDEX idx_reviews_state ON reviews(state);
CREATE INDEX idx_study_sessions_deck_id ON study_sessions(deck_id);
```

## 5. Feature Roadmap

### Fase 1 - MVP (Semanas 1-3)

> Objetivo: Poder crear y estudiar tarjetas con repeticion espaciada

| ID   | Feature           | Descripcion                                       | Prioridad |
| ---- | ----------------- | ------------------------------------------------- | --------- |
| F1.1 | Project Setup     | Expo init, estructura, linting, git, CI           | Hecho     |
| F1.2 | Database Layer    | Schema SQLite, migrations, DAOs                   | Hecho     |
| F1.3 | CRUD Mazos        | Crear, editar, eliminar mazos                     | Hecho     |
| F1.4 | CRUD Tarjetas     | Crear, editar, eliminar tarjetas (frente/reverso) | Hecho     |
| F1.5 | Motor FSRS        | Integracion ts-fsrs, scheduling de tarjetas       | Hecho     |
| F1.6 | Sesion de Estudio | Flip card, botones (Again/Hard/Good/Easy), cola   | Hecho     |
| F1.7 | Dashboard         | Resumen: pendientes hoy, streak, mazos            | Hecho     |

### Fase 2 - Importacion + UX (Semanas 4-5)

> Objetivo: Cargar mazos existentes y pulir la experiencia

| ID   | Feature            | Descripcion                             | Prioridad |
| ---- | ------------------ | --------------------------------------- | --------- |
| F2.1 | Importador .apkg   | Parser de archivos Anki con media       | Hecho     |
| F2.2 | Busqueda y Filtros | Buscar tarjetas, filtrar por tags/mazo  | Media     |
| F2.3 | Estadisticas       | Graficas de progreso, accuracy, heatmap | Hecho     |
| F2.4 | Dark/Light Mode    | Temas con toggle automatico del sistema | Hecho     |
| F2.5 | Notificaciones     | Recordatorios diarios de estudio        | Media     |

### Fase 3 - Idiomas + AI (Semanas 6-8)

> Objetivo: Features especializadas para idiomas y asistencia IA

| ID   | Feature            | Descripcion                            | Prioridad |
| ---- | ------------------ | -------------------------------------- | --------- |
| F3.1 | TTS                | Pronunciacion automatica en tarjetas   | Alta      |
| F3.2 | Tarjetas Avanzadas | Cloze deletion, typing answer          | Media     |
| F3.3 | AI: Generacion     | Generar flashcards desde texto/tema    | Alta      |
| F3.4 | AI: Explicaciones  | IA explica conceptos al fallar tarjeta | Media     |
| F3.5 | Sync Cloud         | Supabase para backup y multi-device    | Media     |

### Fase 4 - Social + Polish

> Objetivo: Compartir y gamificacion

| ID   | Feature          | Descripcion                     | Prioridad |
| ---- | ---------------- | ------------------------------- | --------- |
| F4.1 | Exportar .apkg   | Exportar mazos para compartir   | Baja      |
| F4.2 | Gamificacion     | XP, niveles, logros, rachas     | Baja      |
| F4.3 | Widgets iOS      | Widget con tarjetas pendientes  | Baja      |
| F4.4 | Mazo Marketplace | Browse/descargar mazos publicos | Baja      |

## 6. Git Workflow

### Branching Strategy

```
main          ← produccion estable, tags de version
└── develop   ← integracion de features
    ├── feat/F1.2-database-layer
    ├── feat/F1.3-deck-crud
    ├── fix/card-flip-animation
    └── chore/update-dependencies
```

### Convenciones

- **Conventional Commits**: `feat: add deck CRUD operations`
- **Branch naming**: `feat/F{fase}.{num}-descripcion-corta`
- **PRs a develop**: Siempre via PR, nunca push directo
- **Tags de version**: `v0.1.0` (MVP), `v0.2.0` (importador), etc.
- **Semver**: MAJOR.MINOR.PATCH

### Commit types

| Tipo        | Uso                                        |
| ----------- | ------------------------------------------ |
| `feat:`     | Nueva funcionalidad                        |
| `fix:`      | Correccion de bug                          |
| `chore:`    | Tareas de mantenimiento                    |
| `docs:`     | Documentacion                              |
| `refactor:` | Reestructuracion sin cambiar funcionalidad |
| `test:`     | Tests                                      |
| `style:`    | Formato, linting                           |
| `perf:`     | Mejoras de rendimiento                     |
| `ci:`       | Configuracion de CI/CD                     |

## 7. Distribucion (iOS)

### Desarrollo (gratis)

- Xcode Free Provisioning: Apple ID gratis + Mac
- Sideload directo al iPhone por cable
- App expira cada 7 dias → rebuild con `npx expo run:ios --device`

### Produccion (cuando este listo)

- Apple Developer Program ($99/año)
- TestFlight para beta testing
- App Store para release publico

## 8. Librerias Open-Source Clave

| Libreria                     | Para que                                  | Licencia |
| ---------------------------- | ----------------------------------------- | -------- |
| ts-fsrs                      | Algoritmo de repeticion espaciada FSRS v4 | MIT      |
| jszip                        | Descomprimir .apkg (son ZIP internamente) | MIT      |
| react-native-reanimated      | Animaciones fluidas (flip card)           | MIT      |
| react-native-gesture-handler | Swipe para responder tarjetas             | MIT      |
| zustand                      | State management ligero                   | MIT      |
| expo-file-system             | Leer archivos del dispositivo             | MIT      |
| expo-haptics                 | Feedback tactil al responder              | MIT      |
| victory-native               | Graficas de estadisticas                  | MIT      |

## 9. Consideraciones Tecnicas

### Performance

- Indices en SQLite para `cards.deck_id`, `reviews.due`, `reviews.state`
- Mazos grandes (10k+ tarjetas) necesitan paginacion en queries
- Media (imagenes/audio) se carga lazy, no toda en memoria

### Migraciones de DB

- Sistema de versiones desde el dia 1
- Cada cambio de schema es una migracion numerada
- Nunca perder data del usuario al actualizar

### Testing

- Unit tests para FSRS scheduling (critico)
- Integration tests para importador .apkg
- Component tests para UI de estudio

### Seguridad

- Data solo local (no se envia a ningun servidor en MVP)
- Sin tracking, sin analytics, sin telemetria
- Los mazos .apkg se validan antes de importar

## 10. Metricas de Exito del MVP

- [ ] Puedo crear un mazo y agregar tarjetas
- [ ] Puedo estudiar tarjetas con el algoritmo FSRS funcionando
- [ ] Las tarjetas se programan correctamente (aparecen cuando deben)
- [ ] La app funciona 100% offline
- [ ] La app corre en mi iPhone via sideload
- [ ] El codigo pasa lint y typecheck sin errores
