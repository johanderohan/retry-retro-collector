# Retry offline-first — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la colección de 689 juegos y la wishlist se consulten desde el móvil en una tienda, sin VPN y sin cobertura, con sus carátulas.

**Architecture:** Un endpoint nuevo devuelve la colección sin el campo `coverUrls` (4,1 MB de datos que nadie lee), lo que deja el snapshot en ~400 KB y permite guardarlo en `localStorage`. Los stores de Pinia se hidratan de ahí en vez de llamar al API, y el guard del router deja de bloquear. El backend genera miniaturas con `sharp` para que las carátulas quepan offline en 6,7 MB.

**Tech Stack:** Vue 3 + Pinia + Vite (frontend), Express 5 + better-sqlite3 + sharp (backend), `node --test` como runner, sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-08-11-retry-pwa-offline-design.md`

## Global Constraints

- **Sin dependencias nuevas.** `sharp` y `better-sqlite3` ya están en el backend; el runner de tests es `node --test`.
- **Estilo del repositorio: sin punto y coma**, indentación de 2 espacios, comillas simples. Es distinto de otros proyectos de Juan; respétalo.
- **ESM en todo el proyecto** (`"type": "module"` en ambos `package.json`).
- **Nunca esperar a la red para pintar.** La hidratación desde `localStorage` ocurre antes de montar la app y la sincronización va siempre en segundo plano con **timeout de 2 segundos**.
- **Solo lectura sin conexión.** No hay cola de escrituras.
- **Clave de `localStorage`**: `retry.snapshot`.
- **Anchos de miniatura permitidos**: 160, 320 y 640. La rejilla usa **160**: las carátulas originales miden 400 px y se pintan en una caja de 80 px CSS, así que 160 cubre pantallas 2x y deja las 702 en 6,7 MB (a 320 serían 17 MB).
- **Textos en español**; comentarios en español explicando el porqué.
- **Rama de trabajo:** `feat/pwa-offline`.

## Estructura de ficheros

**Se crean:**

| Fichero | Responsabilidad |
|---|---|
| `backend/src/controllers/snapshot.controller.js` | Arma el snapshot completo sin `coverUrls` |
| `backend/src/services/thumbs.service.js` | Genera y sirve miniaturas con `sharp` |
| `backend/test/snapshot.test.js` | Tests del snapshot |
| `backend/test/thumbs.test.js` | Tests de miniaturas |
| `frontend/src/lib/storage.js` | Leer y escribir el snapshot en `localStorage`, tolerando corrupción |
| `frontend/src/services/sync.js` | Descarga con timeout y precarga de miniaturas |
| `frontend/src/stores/syncStore.js` | Estado de sincronización e hidratación de los demás stores |
| `frontend/src/components/SyncIcon.vue` | Nube discreta con el estado |
| `frontend/src/components/NeedsConnection.vue` | Aviso para pantallas que requieren conexión |
| `frontend/test/storage.test.js` | Tests de almacenamiento |
| `frontend/test/collection.test.js` | Tests del filtro y orden, que hacen de buscador offline |

**Se modifican:**

| Fichero | Cambio |
|---|---|
| `backend/src/routes/index.js` | Ruta `GET /api/snapshot` |
| `backend/src/server.js` | Middleware de miniaturas antes de `express.static` |
| `backend/package.json` | Script `test` |
| `frontend/package.json` | Script `test` |
| `frontend/src/main.js` | Hidratar antes de montar y sincronizar en segundo plano |
| `frontend/src/router/index.js` | El guard deja de esperar a la config |
| `frontend/src/stores/collectionStore.js`, `wishlistStore.js`, `platformsStore.js`, `configStore.js` | Hidratarse del snapshot |
| `frontend/src/components/GameCard.vue`, `GameRow.vue` | Pedir la carátula con `?w=160` |
| `frontend/src/components/AppHeader.vue` | Incluir el icono de estado |
| `frontend/src/views/SearchView.vue` | Aviso de que requiere conexión |
| `frontend/public/sw.js` | Dejar de interceptar `/api/`, timeout en navegación |
| `README.md` | Sección de uso sin conexión |

---

### Task 1: Endpoint de snapshot

**Files:**
- Create: `backend/src/controllers/snapshot.controller.js`
- Create: `backend/test/snapshot.test.js`
- Modify: `backend/src/routes/index.js`
- Modify: `backend/package.json`

**Interfaces:**
- Consumes: `getAll(table)` y `getConfig()` de `src/services/store.service.js`.
- Produces: `snapshotController.get(req, res, next)` → responde `{ generatedAt, collection[], wishlist[], platforms[], config }`.

- [ ] **Step 1: Añadir el script de test a `backend/package.json`**

En `"scripts"`:

```json
    "test": "DATA_DIR=./.tmp-test node --test test/*.test.js",
```

`DATA_DIR` apunta a un directorio desechable: `src/config/db.js` abre la base de
datos al importarse, y sin esto los tests escribirían sobre `data/retry.db`, que
es la colección de verdad.

Añadir también `.tmp-test/` al `.gitignore` de la raíz.

- [ ] **Step 2: Escribir el test que falla `backend/test/snapshot.test.js`**

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getAll, add, remove, saveConfig } from '../src/services/store.service.js'
import snapshotController from '../src/controllers/snapshot.controller.js'

function limpiar() {
  for (const tabla of ['collection', 'wishlist', 'platforms']) {
    for (const item of getAll(tabla)) remove(tabla, item.id)
  }
}

function juego(id, extra = {}) {
  return {
    id,
    gameId: `g-${id}`,
    title: `Juego ${id}`,
    platform: 'Super Nintendo',
    regionLabel: 'Europa',
    year: '1995',
    coverUrl: `/covers/${id}.webp`,
    coverUrls: [
      { url: `/covers/${id}.webp`, label: 'Portada' },
      { url: 'https://screenscraper.fr/otra.png', label: 'Alternativa' },
    ],
    condition: { Juego: true, Caja: true, Manual: false },
    ...extra,
  }
}

function capturar() {
  let body = null
  return { res: { json: b => { body = b } }, get: () => body }
}

test('devuelve las cuatro partes y la marca de tiempo', () => {
  limpiar()
  add('collection', juego('c1'))
  add('wishlist', juego('w1'))
  add('platforms', { id: 'p1', name: 'Super Nintendo' })
  saveConfig({ devid: 'x', devpassword: 'y' })

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const snap = c.get()

  assert.equal(snap.collection.length, 1)
  assert.equal(snap.wishlist.length, 1)
  assert.equal(snap.platforms.length, 1)
  assert.equal(snap.config.devid, 'x')
  assert.ok(snap.generatedAt)
})

test('ningún juego lleva coverUrls', () => {
  limpiar()
  add('collection', juego('c1'))
  add('wishlist', juego('w1'))

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const snap = c.get()

  assert.equal('coverUrls' in snap.collection[0], false)
  assert.equal('coverUrls' in snap.wishlist[0], false)
})

test('conserva el resto de campos, incluido el estado y la carátula usada', () => {
  limpiar()
  add('collection', juego('c1'))

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const g = c.get().collection[0]

  assert.equal(g.title, 'Juego c1')
  assert.equal(g.coverUrl, '/covers/c1.webp')
  assert.deepEqual(g.condition, { Juego: true, Caja: true, Manual: false })
  assert.equal(g.platform, 'Super Nintendo')
})

test('el número de juegos coincide con el del listado normal', () => {
  limpiar()
  for (let i = 0; i < 5; i++) add('collection', juego(`c${i}`))

  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })

  assert.equal(c.get().collection.length, getAll('collection').length)
})

test('con la base vacía devuelve listas vacías, no errores', () => {
  limpiar()
  const c = capturar()
  snapshotController.get({}, c.res, e => { throw e })
  const snap = c.get()

  assert.deepEqual(snap.collection, [])
  assert.deepEqual(snap.wishlist, [])
})
```

- [ ] **Step 3: Ejecutar los tests y verificar que fallan**

Run: `cd backend && npm test`
Expected: FAIL — `Cannot find module .../controllers/snapshot.controller.js`.

- [ ] **Step 4: Crear `backend/src/controllers/snapshot.controller.js`**

```js
import { getAll, getConfig } from '../services/store.service.js'

// coverUrls son las portadas alternativas que devuelve ScreenScraper al añadir
// un juego. Pesan 4,1 MB de los 4,5 que ocupa la colección y no las lee nadie:
// su único consumidor, AddToCollectionModal, recibe el juego desde los
// resultados de búsqueda, no desde la base. Fuera del snapshot.
function sinCoverUrls(juego) {
  const { coverUrls, ...resto } = juego
  return resto
}

export default {
  get(req, res, next) {
    try {
      res.json({
        generatedAt: new Date().toISOString(),
        collection: getAll('collection').map(sinCoverUrls),
        wishlist: getAll('wishlist').map(sinCoverUrls),
        platforms: getAll('platforms'),
        config: getConfig(),
      })
    } catch (e) { next(e) }
  },
}
```

- [ ] **Step 5: Registrar la ruta en `backend/src/routes/index.js`**

Añadir el import junto a los demás controladores:

```js
import snapshotController from '../controllers/snapshot.controller.js'
```

Y la ruta, justo después de la de `/health`:

```js
apiRouter.get('/snapshot', snapshotController.get)
```

- [ ] **Step 6: Ejecutar los tests y verificar que pasan**

Run: `cd backend && npm test`
Expected: PASS — 5 tests.

- [ ] **Step 7: Comprobar el tamaño real contra la colección de verdad**

Run:
```bash
cd /home/juan/Documentos/Desarrollo/retry-retro-collector && docker compose up -d --build backend && sleep 8 && \
  echo "colección completa: $(curl -s localhost:9977/api/collection | wc -c) bytes" && \
  echo "snapshot:           $(curl -s localhost:9977/api/snapshot | wc -c) bytes"
```
Expected: la colección ronda los 4,5 MB y el snapshot baja a unos 400-500 KB. Si el snapshot sigue por encima de 1 MB, `coverUrls` no se está quitando bien.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/snapshot.controller.js backend/src/routes/index.js backend/test/ backend/package.json .gitignore
git commit -m "feat(offline): endpoint de snapshot sin coverUrls"
```

---

### Task 2: Miniaturas de carátulas

**Files:**
- Create: `backend/src/services/thumbs.service.js`
- Create: `backend/test/thumbs.test.js`
- Modify: `backend/src/server.js`

**Interfaces:**
- Consumes: `sharp`; `COVERS_DIR` de `src/config/migrations.js`.
- Produces:
  - `ANCHOS_PERMITIDOS: Set<number>` — `{160, 320, 640}`
  - `ensureThumb(coversDir, nombre, ancho): Promise<string|null>` — ruta de la miniatura, o `null` si el original no existe
  - `thumbsMiddleware(coversDir): (req, res, next) => void`

- [ ] **Step 1: Escribir el test que falla `backend/test/thumbs.test.js`**

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { ensureThumb, thumbsMiddleware, ANCHOS_PERMITIDOS } from '../src/services/thumbs.service.js'

// Carátula de prueba: 800x1100, como las reales pero generada al vuelo.
async function crearDirConPortada() {
  const dir = mkdtempSync(join(tmpdir(), 'retry-thumbs-'))
  await sharp({ create: { width: 800, height: 1100, channels: 3, background: '#3355aa' } })
    .webp()
    .toFile(join(dir, 'portada.webp'))
  return dir
}

test('los anchos permitidos son los tres previstos', () => {
  assert.deepEqual([...ANCHOS_PERMITIDOS].sort((a, b) => a - b), [160, 320, 640])
})

test('genera una miniatura más pequeña que el original', async () => {
  const dir = await crearDirConPortada()
  const ruta = await ensureThumb(dir, 'portada.webp', 320)

  assert.ok(ruta && existsSync(ruta))
  const meta = await sharp(ruta).metadata()
  assert.equal(meta.width, 320)
  assert.ok(statSync(ruta).size < statSync(join(dir, 'portada.webp')).size)
})

test('la segunda petición reutiliza el fichero en vez de regenerarlo', async () => {
  const dir = await crearDirConPortada()
  const ruta = await ensureThumb(dir, 'portada.webp', 320)
  const primera = statSync(ruta).mtimeMs

  await new Promise(r => setTimeout(r, 20))
  const otra = await ensureThumb(dir, 'portada.webp', 320)

  assert.equal(otra, ruta)
  assert.equal(statSync(otra).mtimeMs, primera)
})

test('un original inexistente devuelve null sin lanzar', async () => {
  const dir = await crearDirConPortada()
  assert.equal(await ensureThumb(dir, 'no-existe.webp', 320), null)
})

test('no se sale del directorio de portadas', async () => {
  const dir = await crearDirConPortada()
  writeFileSync(join(dir, '..', 'secreto.webp'), 'no soy una imagen')
  assert.equal(await ensureThumb(dir, '../secreto.webp', 320), null)
})

test('sin ancho, el middleware deja pasar a express.static', async () => {
  const dir = await crearDirConPortada()
  let siguiente = false
  const mw = thumbsMiddleware(dir)

  await mw({ query: {}, path: '/portada.webp' }, {}, () => { siguiente = true })
  assert.equal(siguiente, true)
})

test('un ancho no permitido también deja pasar', async () => {
  const dir = await crearDirConPortada()
  let siguiente = false
  const mw = thumbsMiddleware(dir)

  await mw({ query: { w: '999' }, path: '/portada.webp' }, {}, () => { siguiente = true })
  assert.equal(siguiente, true)
})

test('con ancho permitido sirve el fichero de la miniatura', async () => {
  const dir = await crearDirConPortada()
  const mw = thumbsMiddleware(dir)
  let enviado = null
  const res = { type: () => res, sendFile: ruta => { enviado = ruta } }

  await mw({ query: { w: '320' }, path: '/portada.webp' }, res, () => {
    throw new Error('no debería llamar a next')
  })

  assert.ok(enviado && enviado.includes('320-portada.webp'))
})
```

- [ ] **Step 2: Ejecutar los tests y verificar que fallan**

Run: `cd backend && npm test`
Expected: FAIL — `Cannot find module .../services/thumbs.service.js`.

- [ ] **Step 3: Crear `backend/src/services/thumbs.service.js`**

```js
import sharp from 'sharp'
import { existsSync, mkdirSync } from 'node:fs'
import { join, basename } from 'node:path'

// Lista cerrada: sin ella, cualquiera podría llenar el disco pidiendo ?w=1,
// ?w=2, ?w=3… El frontend solo usa 160.
export const ANCHOS_PERMITIDOS = new Set([160, 320, 640])

function dirMiniaturas(coversDir) {
  const dir = join(coversDir, 'thumbs')
  mkdirSync(dir, { recursive: true })
  return dir
}

// Devuelve la ruta de la miniatura, generándola si aún no existe. null si el
// original no está.
export async function ensureThumb(coversDir, nombre, ancho) {
  // basename descarta cualquier '../': el nombre siempre queda dentro de
  // coversDir, aunque la petición intente escaparse.
  const seguro = basename(nombre)
  const original = join(coversDir, seguro)
  if (!existsSync(original)) return null

  const destino = join(dirMiniaturas(coversDir), `${ancho}-${seguro}`)
  if (existsSync(destino)) return destino

  await sharp(original)
    .resize({ width: ancho, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(destino)

  return destino
}

// Se monta en /covers ANTES de express.static: si no piden ancho, deja pasar y
// se sirve la imagen original de siempre.
export function thumbsMiddleware(coversDir) {
  return async function (req, res, next) {
    const ancho = Number(req.query?.w)
    if (!ancho || !ANCHOS_PERMITIDOS.has(ancho)) return next()

    try {
      const ruta = await ensureThumb(coversDir, req.path, ancho)
      if (!ruta) return next()

      res.type('image/webp')
      res.sendFile(ruta)
    } catch (e) {
      next(e)
    }
  }
}
```

- [ ] **Step 4: Montar el middleware en `backend/src/server.js`**

Añadir el import:

```js
import { thumbsMiddleware } from './services/thumbs.service.js'
```

Y sustituir la línea de portadas:

```js
app.use('/covers', express.static(COVERS_DIR))
```

por:

```js
// El middleware de miniaturas va delante: solo actúa si la petición trae ?w,
// y si no, deja que express.static sirva la imagen original.
app.use('/covers', thumbsMiddleware(COVERS_DIR), express.static(COVERS_DIR))
```

- [ ] **Step 5: Ejecutar los tests y verificar que pasan**

Run: `cd backend && npm test`
Expected: PASS — 8 tests de `thumbs.test.js` más los 5 de la tarea anterior.

- [ ] **Step 6: Comprobar contra una carátula real**

Run:
```bash
cd /home/juan/Documentos/Desarrollo/retry-retro-collector && docker compose up -d --build backend && sleep 8 && \
  F=$(ls data/covers | head -1) && \
  echo "original: $(curl -s -o /dev/null -w '%{size_download}' localhost:9977/covers/$F) bytes" && \
  echo "w=160:    $(curl -s -o /dev/null -w '%{size_download}' 'localhost:9977/covers/'$F'?w=160') bytes"
```
Expected: la de 160 px ronda los 10 KB frente a los ~42 KB de media del original. Si pesan lo mismo, el middleware no está actuando.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/thumbs.service.js backend/src/server.js backend/test/thumbs.test.js
git commit -m "feat(offline): miniaturas de carátulas con sharp"
```

---

### Task 3: Almacenamiento local y tests del buscador

**Files:**
- Create: `frontend/src/lib/storage.js`
- Create: `frontend/test/storage.test.js`
- Create: `frontend/test/collection.test.js`
- Modify: `frontend/package.json`

**Interfaces:**
- Consumes: `filteredSortedGames`, `applyGameFilters`, `applySortToGames` de `src/utils/collection.js` (ya existen).
- Produces:
  - `SNAPSHOT_KEY: 'retry.snapshot'`
  - `isValidSnapshot(value): boolean`
  - `readSnapshot(store?): object|null`
  - `writeSnapshot(snapshot, store?): boolean`

- [ ] **Step 1: Añadir el script de test a `frontend/package.json`**

En `"scripts"`:

```json
    "test": "node --test test/*.test.js",
```

- [ ] **Step 2: Escribir el test que falla `frontend/test/storage.test.js`**

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SNAPSHOT_KEY, isValidSnapshot, readSnapshot, writeSnapshot } from '../src/lib/storage.js'

// localStorage no existe en Node: los tests inyectan este doble.
function memoryStore(inicial = {}) {
  const m = new Map(Object.entries(inicial))
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
  }
}

const SNAP = {
  generatedAt: '2026-08-11T18:00:00.000Z',
  collection: [], wishlist: [], platforms: [], config: {},
}

test('guardar y recuperar conserva los datos', () => {
  const store = memoryStore()
  assert.equal(writeSnapshot(SNAP, store), true)
  assert.deepEqual(readSnapshot(store), SNAP)
})

test('sin nada guardado devuelve null', () => {
  assert.equal(readSnapshot(memoryStore()), null)
})

test('un JSON corrupto se descarta en vez de reventar', () => {
  assert.equal(readSnapshot(memoryStore({ [SNAPSHOT_KEY]: '{"collection": [1,2' })), null)
})

test('un snapshot al que le falta una parte se rechaza', () => {
  assert.equal(isValidSnapshot({ collection: [], wishlist: [], platforms: [] }), false)
  assert.equal(isValidSnapshot(SNAP), true)
  assert.equal(readSnapshot(memoryStore({ [SNAPSHOT_KEY]: JSON.stringify({ collection: [] }) })), null)
})

test('si el almacenamiento está lleno, escribir devuelve false sin lanzar', () => {
  const store = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') } }
  assert.equal(writeSnapshot(SNAP, store), false)
})
```

- [ ] **Step 3: Escribir el test del buscador offline `frontend/test/collection.test.js`**

Estas funciones ya existen y hoy no tienen pruebas. Al pasar a offline se
convierten en el buscador de la tienda, así que conviene fijarlas.

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyGameFilters, applySortToGames, filteredSortedGames } from '../src/utils/collection.js'

const JUEGOS = [
  { id: '1', title: 'Chrono Trigger', platform: 'Super Nintendo', regionLabel: 'Japón',  year: '1995', addedAt: 300 },
  { id: '2', title: 'Secret of Mana', platform: 'Super Nintendo', regionLabel: 'Europa', year: '1993', addedAt: 100 },
  { id: '3', title: 'Shenmue',        platform: 'Dreamcast',      regionLabel: 'Europa', year: '1999', addedAt: 200 },
]

const SIN_FILTRO = { platform: '', region: '', name: '' }

test('sin filtros salen todos', () => {
  assert.equal(applyGameFilters(JUEGOS, SIN_FILTRO).length, 3)
})

test('filtra por plataforma', () => {
  const out = applyGameFilters(JUEGOS, { ...SIN_FILTRO, platform: 'Dreamcast' })
  assert.deepEqual(out.map(g => g.id), ['3'])
})

test('filtra por región', () => {
  const out = applyGameFilters(JUEGOS, { ...SIN_FILTRO, region: 'Europa' })
  assert.deepEqual(out.map(g => g.id), ['2', '3'])
})

test('busca por título sin distinguir mayúsculas y por trozos', () => {
  assert.deepEqual(applyGameFilters(JUEGOS, { ...SIN_FILTRO, name: 'CHRONO' }).map(g => g.id), ['1'])
  assert.deepEqual(applyGameFilters(JUEGOS, { ...SIN_FILTRO, name: 'mana' }).map(g => g.id), ['2'])
  assert.deepEqual(applyGameFilters(JUEGOS, { ...SIN_FILTRO, name: '  she  '.trim() }).map(g => g.id), ['3'])
})

test('los filtros se combinan', () => {
  const out = applyGameFilters(JUEGOS, { platform: 'Super Nintendo', region: 'Europa', name: '' })
  assert.deepEqual(out.map(g => g.id), ['2'])
})

test('ordena por nombre, año y fecha en ambos sentidos', () => {
  assert.deepEqual(applySortToGames(JUEGOS, 'name-asc').map(g => g.id), ['1', '2', '3'])
  assert.deepEqual(applySortToGames(JUEGOS, 'name-desc').map(g => g.id), ['3', '2', '1'])
  assert.deepEqual(applySortToGames(JUEGOS, 'year-asc').map(g => g.id), ['2', '1', '3'])
  assert.deepEqual(applySortToGames(JUEGOS, 'date-desc').map(g => g.id), ['1', '3', '2'])
})

test('ordenar no muta la lista original', () => {
  const copia = [...JUEGOS]
  applySortToGames(JUEGOS, 'name-desc')
  assert.deepEqual(JUEGOS, copia)
})

test('filtrar y ordenar se aplican en ese orden', () => {
  const out = filteredSortedGames(JUEGOS, { ...SIN_FILTRO, region: 'Europa' }, 'name-asc')
  assert.deepEqual(out.map(g => g.id), ['2', '3'])
})

test('un juego sin título no rompe la búsqueda', () => {
  const con = [...JUEGOS, { id: '4', platform: 'PC', regionLabel: 'Europa', year: '2000' }]
  assert.doesNotThrow(() => applyGameFilters(con, { ...SIN_FILTRO, name: 'chrono' }))
})
```

- [ ] **Step 4: Ejecutar los tests y verificar que fallan**

Run: `cd frontend && npm test`
Expected: FAIL — `Cannot find module .../src/lib/storage.js`. Los de `collection.test.js` deberían pasar ya, porque prueban código existente; si alguno falla, el comportamiento actual no es el que se documenta y hay que revisarlo antes de seguir.

- [ ] **Step 5: Crear `frontend/src/lib/storage.js`**

```js
export const SNAPSHOT_KEY = 'retry.snapshot'

function defaultStore() {
  return typeof globalThis !== 'undefined' ? globalThis.localStorage : null
}

// Sirve solo si trae las cuatro partes. Uno a medias haría fallar las pantallas
// más adelante de formas raras.
export function isValidSnapshot(value) {
  return Boolean(
    value &&
    Array.isArray(value.collection) &&
    Array.isArray(value.wishlist) &&
    Array.isArray(value.platforms) &&
    value.config && typeof value.config === 'object',
  )
}

export function readSnapshot(store) {
  try {
    const raw = (store ?? defaultStore())?.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidSnapshot(parsed) ? parsed : null
  } catch {
    // JSON a medias o almacenamiento inaccesible: se empieza de cero en vez de
    // impedir que la app arranque.
    return null
  }
}

export function writeSnapshot(snapshot, store) {
  try {
    (store ?? defaultStore())?.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    // Cuota llena o modo privado: no es motivo para romper la app.
    return false
  }
}
```

- [ ] **Step 6: Ejecutar los tests y verificar que pasan**

Run: `cd frontend && npm test`
Expected: PASS — 5 tests de `storage.test.js` y 9 de `collection.test.js`.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/storage.js frontend/test/ frontend/package.json
git commit -m "feat(offline): almacenamiento local y tests del buscador"
```

---

### Task 4: Sincronización e hidratación de los stores

**Files:**
- Create: `frontend/src/services/sync.js`
- Create: `frontend/src/stores/syncStore.js`
- Modify: `frontend/src/stores/collectionStore.js`, `wishlistStore.js`, `platformsStore.js`, `configStore.js`
- Modify: `frontend/src/main.js`

**Interfaces:**
- Consumes: `readSnapshot`, `writeSnapshot` (Task 3).
- Produces:
  - `fetchSnapshot({ timeoutMs, fetchImpl }): Promise<snapshot>`
  - `precargarMiniaturas(urls, { concurrencia }): Promise<void>`
  - `useSyncStore()` con `lastSyncAt`, `syncing`, `online`, `hasData`, `hydrate()`, `sync()`
  - En los stores de datos: `setItems(items)` y `ensureLoaded()` que ya no toca la red.

- [ ] **Step 1: Crear `frontend/src/services/sync.js`**

```js
// Timeout corto a propósito: fuera de casa el NAS no responde, y la app no
// debe esperarlo nunca. axios usa 60 s, que es justo lo que hoy deja la
// pantalla en blanco.
const TIMEOUT_MS = 2000

export async function fetchSnapshot({ timeoutMs = TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const ctrl = new AbortController()
  const temporizador = setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    const res = await fetchImpl('/api/snapshot', { signal: ctrl.signal })
    if (!res.ok) throw new Error(`snapshot ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(temporizador)
  }
}

// Descarga las miniaturas que falten para que el service worker las guarde.
// Con concurrencia limitada: son 702 y la primera vez hay que generarlas todas
// en el backend, así que lanzarlas de golpe ahogaría el contenedor.
export async function precargarMiniaturas(urls, { concurrencia = 4 } = {}) {
  const cola = urls.filter(Boolean)
  let i = 0

  async function trabajador() {
    while (i < cola.length) {
      const url = cola[i++]
      await new Promise(resolve => {
        const img = new Image()
        img.onload = img.onerror = () => resolve()
        img.decoding = 'async'
        img.src = url
      })
    }
  }

  await Promise.all(Array.from({ length: concurrencia }, trabajador))
}
```

- [ ] **Step 2: Crear el helper de miniaturas `frontend/src/utils/covers.js`**

Va antes que el store, que lo importa.

```js
// Ancho que usa la rejilla. El backend solo acepta 160, 320 y 640.
// 160 y no 320: la carátula se pinta en una caja de 80 px CSS, el original solo
// mide 400 px de ancho, y a 320 las 702 ocuparían 17 MB en vez de 6,7.
export const ANCHO_MINIATURA = 160

// Las carátulas locales viven en /covers/<uuid>.webp y aceptan ?w=. Las que
// no lo son (URLs remotas de ScreenScraper, aún sin descargar) se dejan tal
// cual.
export function thumbUrl(coverUrl, ancho = ANCHO_MINIATURA) {
  if (!coverUrl || !coverUrl.startsWith('/covers/')) return coverUrl
  return `${coverUrl}?w=${ancho}`
}
```

- [ ] **Step 3: Crear `frontend/src/stores/syncStore.js`**

```js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readSnapshot, writeSnapshot } from '../lib/storage.js'
import { fetchSnapshot, precargarMiniaturas } from '../services/sync.js'
import { useCollectionStore } from './collectionStore.js'
import { useWishlistStore } from './wishlistStore.js'
import { usePlatformsStore } from './platformsStore.js'
import { useConfigStore } from './configStore.js'
import { thumbUrl } from '../utils/covers.js'

export const useSyncStore = defineStore('sync', () => {
  const lastSyncAt = ref(null)
  const syncing = ref(false)
  const online = ref(true)
  const hasData = ref(false)

  function repartir(snapshot) {
    useCollectionStore().setItems(snapshot.collection)
    useWishlistStore().setItems(snapshot.wishlist)
    usePlatformsStore().setItems(snapshot.platforms)
    useConfigStore().setConfig(snapshot.config)
    lastSyncAt.value = snapshot.generatedAt ?? null
    hasData.value = true
  }

  // Síncrono y antes de montar: leer 400 KB de localStorage cuesta
  // milisegundos, así que la primera pintura ya lleva datos.
  function hydrate() {
    const snap = readSnapshot()
    if (snap) repartir(snap)
  }

  async function sync() {
    if (syncing.value) return
    syncing.value = true

    try {
      const fresco = await fetchSnapshot()
      repartir(fresco)
      writeSnapshot(fresco)
      online.value = true

      // En segundo plano y sin await: que la app no dependa de esto.
      precargarMiniaturas(
        fresco.collection.map(g => thumbUrl(g.coverUrl)).filter(Boolean),
      )
    } catch {
      // Sin conexión o NAS inalcanzable: se sigue con lo local, sin ruido.
      online.value = false
    } finally {
      syncing.value = false
    }
  }

  return { lastSyncAt, syncing, online, hasData, hydrate, sync }
})
```

- [ ] **Step 4: Hacer que los stores de datos se hidraten**

En `frontend/src/stores/collectionStore.js`, `wishlistStore.js` y
`platformsStore.js`, sustituir `load()` y `ensureLoaded()` por:

```js
  function setItems(nuevos) {
    items.value = nuevos ?? []
    loaded = true
  }

  // Los datos llegan del snapshot local (syncStore), no de la red: la app tiene
  // que pintar sin esperar a nadie.
  async function ensureLoaded() { return loaded }
```

Y añadir `setItems` al objeto que devuelve cada store. La antigua `load()` se
elimina, junto con el import de `dbGetAll` si deja de usarse.

En `frontend/src/stores/configStore.js`, sustituir `fetch()` por:

```js
  function setConfig(nueva) {
    config.value = nueva ?? {}
  }

  // Ya no espera a la red: la config viene del snapshot. Se mantiene el nombre
  // fetch() porque lo llama el guard del router.
  async function fetch() { return config.value }
```

Añadir `setConfig` a lo que devuelve el store y eliminar el uso de `configLoad`
y de `inFlight`. `save()` se queda como está: guardar sigue requiriendo
conexión.

- [ ] **Step 5: Hidratar antes de montar en `frontend/src/main.js`**

```js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import App from './App.vue'
import { useSyncStore } from './stores/syncStore.js'
import './style.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

const app = createApp(App)
const pinia = createPinia()
app.use(pinia).use(router)

// Hidratar ANTES de montar: así la primera pintura ya sale con datos y nunca se
// espera a la red.
const sync = useSyncStore(pinia)
sync.hydrate()

app.mount('#app')

// Y sincronizar en segundo plano, sin bloquear nada.
sync.sync()
```

- [ ] **Step 6: Comprobar que la suite sigue en verde y que compila**

Run: `cd frontend && npm test && npm run build`
Expected: 14 tests en verde y el build de Vite sin errores.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/services/sync.js frontend/src/stores/ frontend/src/utils/covers.js frontend/src/main.js
git commit -m "feat(offline): snapshot local hidratando los stores"
```

---

### Task 5: Desbloquear el router y avisar sin conexión

**Files:**
- Create: `frontend/src/components/NeedsConnection.vue`
- Modify: `frontend/src/router/index.js`
- Modify: `frontend/src/views/SearchView.vue`

**Interfaces:**
- Consumes: `useSyncStore` (Task 4).
- Produces: componente `NeedsConnection` con prop `accion: String`.

- [ ] **Step 1: Quitar la espera del guard en `frontend/src/router/index.js`**

Sustituir:

```js
router.beforeEach(async () => {
  await useConfigStore().fetch()
  return true
})
```

por:

```js
// Antes esto esperaba a configLoad() por axios, con timeout de 60 s: sin
// conexión, la app se quedaba hasta un minuto en blanco antes de pintar la
// primera ruta. La config ya viene del snapshot local, así que aquí no hay nada
// que esperar.
router.beforeEach(() => true)
```

Si `useConfigStore` deja de usarse en el fichero, eliminar también su import.

- [ ] **Step 2: Crear `frontend/src/components/NeedsConnection.vue`**

```vue
<script setup>
defineProps({
  accion: { type: String, default: 'esta pantalla' },
})
</script>

<template>
  <div class="rounded-lg border border-line p-6 text-center">
    <p class="text-sm text-ink-dim">
      Para {{ accion }} hace falta conexión con el NAS. Conéctate a la VPN o a la
      wifi de casa y vuelve a intentarlo.
    </p>
  </div>
</template>
```

- [ ] **Step 3: Avisar en `frontend/src/views/SearchView.vue`**

Añadir al script:

```js
import NeedsConnection from '../components/NeedsConnection.vue'
import { useSyncStore } from '../stores/syncStore.js'

const sync = useSyncStore()
```

Y envolver el contenido de la plantilla:

```vue
    <NeedsConnection v-if="!sync.online" accion="buscar juegos nuevos" />
    <template v-else>
      <!-- contenido existente de la vista -->
    </template>
```

- [ ] **Step 4: Comprobar que compila y que la app arranca sin backend**

Run: `cd /home/juan/Documentos/Desarrollo/retry-retro-collector && docker compose up -d --build && sleep 10 && docker compose stop backend && curl -s -o /dev/null -w "%{http_code}\n" localhost:9977`
Expected: `200`. Abrir `http://localhost:9977` con el backend parado: la app debe pintar la colección desde `localStorage` **de inmediato**, sin quedarse en blanco. Antes de este cambio se quedaba hasta 60 segundos.

Volver a levantar el backend: `docker compose start backend`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/router/index.js frontend/src/components/NeedsConnection.vue frontend/src/views/SearchView.vue
git commit -m "feat(offline): el router deja de esperar a la red"
```

---

### Task 6: Miniaturas en las tarjetas

**Files:**
- Modify: `frontend/src/components/GameCard.vue`
- Modify: `frontend/src/components/GameRow.vue`

**Interfaces:**
- Consumes: `thumbUrl` de `src/utils/covers.js` (Task 4).
- Produces: nada nuevo.

- [ ] **Step 1: Usar la miniatura en `GameCard.vue`**

Añadir al script (`computed` ya está importado en este fichero, no hace falta
tocar el import de Vue):

```js
import { thumbUrl } from '../utils/covers.js'

const cover = computed(() => thumbUrl(props.game.coverUrl))
```

Y sustituir los **dos** `:src="game.coverUrl"` del fichero por `:src="cover"`.
Las condiciones `v-if="game.coverUrl && !imgError"` se dejan como están: siguen
comprobando que el juego tenga carátula.

- [ ] **Step 2: Usar la miniatura en `GameRow.vue`**

Mismo cambio: importar `thumbUrl`, añadir el `computed` (aquí también está ya
importado) y sustituir el único `:src="game.coverUrl"` por `:src="cover"`.

- [ ] **Step 3: Comprobar el peso de la rejilla en el navegador**

Run: `cd /home/juan/Documentos/Desarrollo/retry-retro-collector && docker compose up -d --build && sleep 10`

Abrir `http://localhost:9977`, en DevTools → Network filtrar por `covers`:
las peticiones deben llevar `?w=160` y pesar unos 10 KB cada una en vez de ~42 KB.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/GameCard.vue frontend/src/components/GameRow.vue
git commit -m "feat(offline): la rejilla pide miniaturas"
```

---

### Task 7: Service worker

**Files:**
- Modify: `frontend/public/sw.js`

**Interfaces:**
- Consumes: nada.
- Produces: nada.

- [ ] **Step 1: Reescribir las estrategias en `frontend/public/sw.js`**

Subir la versión de las cachés y cambiar el manejador de `fetch`. El fichero
queda así:

```js
const CACHE_IMAGES = 'retry-images-v2'
const CACHE_STATIC = 'retry-static-v2'

// Cuánto se espera a la red antes de tirar de caché. Corto a propósito: fuera
// de casa el NAS no responde y la app no debe quedarse esperando.
const TIMEOUT_MS = 2000

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(['/', '/manifest.json', '/favicon.svg']))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', e => {
  const valid = [CACHE_IMAGES, CACHE_STATIC]
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !valid.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  // Los datos viven en localStorage. Interceptar /api solo servía para hacer
  // esperar a la app a que la red fallase, y el fallback a [] la dejaba
  // pareciendo vacía en vez de sin conexión.
  if (url.pathname.startsWith('/api/')) return

  // Las carátulas (incluidas las miniaturas con ?w=) no cambian nunca.
  if (request.destination === 'image') {
    event.respondWith(cacheFirstImage(request))
    return
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirstConTimeout(request))
  }
})

async function cacheFirstImage(request) {
  const cache = await caches.open(CACHE_IMAGES)
  const cached = await cache.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
    return response
  } catch {
    return Response.error()
  }
}

// Intenta la red con un límite de tiempo; si tarda o falla, tira de caché, y en
// una navegación cae al shell para que la SPA siempre arranque.
async function networkFirstConTimeout(request) {
  const cache = await caches.open(CACHE_STATIC)

  try {
    const ctrl = new AbortController()
    const temporizador = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    const response = await fetch(request, { signal: ctrl.signal }).finally(() => clearTimeout(temporizador))

    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    if (request.mode === 'navigate') return (await cache.match('/')) ?? Response.error()
    return Response.error()
  }
}
```

- [ ] **Step 2: Comprobar el comportamiento sin red**

Run: `cd /home/juan/Documentos/Desarrollo/retry-retro-collector && docker compose up -d --build && sleep 10`

En el navegador, sobre `http://localhost:9977`:

1. DevTools → Application → Service Workers: desregistrar el anterior y recargar
   dos veces, para que el nuevo tome el control.
2. Navegar por la colección para que se cacheen miniaturas.
3. Comprobar en Cache Storage que existen `retry-images-v2` y `retry-static-v2`,
   y que **no** queda ninguna caché `retry-api-v1`.
4. `docker compose stop` y recargar: la colección debe pintarse con sus
   carátulas, y las peticiones a `/api/` deben fallar de inmediato, no quedarse
   pendientes.
5. `docker compose start` al terminar.

- [ ] **Step 3: Commit**

```bash
git add frontend/public/sw.js
git commit -m "feat(offline): service worker sin esperas y sin cachear /api"
```

---

### Task 8: Icono de estado, documentación y prueba en el móvil

**Files:**
- Create: `frontend/src/components/SyncIcon.vue`
- Modify: `frontend/src/components/AppHeader.vue`
- Modify: `README.md`

**Interfaces:**
- Consumes: `useSyncStore` (Task 4).
- Produces: componente `SyncIcon` sin props.

- [ ] **Step 1: Crear `frontend/src/components/SyncIcon.vue`**

```vue
<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useSyncStore } from '../stores/syncStore.js'

const sync = useSyncStore()
const UNA_HORA = 60 * 60 * 1000

// El estado depende del paso del tiempo, no solo de los datos: sin este tic la
// nube seguiría en verde para siempre tras una sincronización.
const ahora = ref(Date.now())
let temporizador = null
onMounted(() => { temporizador = setInterval(() => { ahora.value = Date.now() }, 60_000) })
onUnmounted(() => clearInterval(temporizador))

const antiguedad = computed(() =>
  sync.lastSyncAt ? ahora.value - new Date(sync.lastSyncAt).getTime() : Infinity)

const alDia = computed(() => sync.online && antiguedad.value < UNA_HORA)

function hace(ms) {
  if (!Number.isFinite(ms)) return 'nunca'
  const minutos = Math.round(ms / 60000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`
  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`
  return `hace ${Math.round(horas / 24)} días`
}

const descripcion = computed(() => {
  if (sync.syncing) return 'Sincronizando…'
  const cuando = `Última sincronización ${hace(antiguedad.value)}`
  return sync.online ? cuando : `Sin conexión · ${cuando}`
})
</script>

<template>
  <button
    class="p-1.5 rounded-lg transition-colors hover:bg-black/5 disabled:opacity-50"
    :class="alDia ? 'text-emerald-500/70' : 'text-ink-dim'"
    :title="descripcion"
    :aria-label="descripcion"
    :disabled="sync.syncing"
    @click="sync.sync()"
  >
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      :class="{ 'animate-pulse': sync.syncing }"
    >
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.3 8.8 4.5 4.5 0 0 0 6.5 19h11Z" />
      <polyline v-if="alDia" points="9.5 13.5 11.5 15.5 15 11.5" />
      <template v-else>
        <line x1="12" y1="10.5" x2="12" y2="14" />
        <line x1="12" y1="16" x2="12" y2="16.1" />
      </template>
    </svg>
  </button>
</template>
```

- [ ] **Step 2: Añadir el icono a `frontend/src/components/AppHeader.vue`**

Importar el componente junto a los demás:

```js
import SyncIcon from './SyncIcon.vue'
```

Y colocarlo como primer elemento del contenedor de acciones de la derecha, que
es el `<div class="flex items-center gap-2">` que abre en la línea 94, dentro
del bloque `flex items-center justify-between` de la cabecera:

```vue
        <div class="flex items-center gap-2">
          <SyncIcon />
```

- [ ] **Step 3: Verificar la suite completa y el build**

Run: `cd frontend && npm test && npm run build && cd ../backend && npm test`
Expected: 14 tests del frontend, 13 del backend y el build sin errores.

- [ ] **Step 4: Documentar en el `README.md`**

Añadir al final:

```markdown
## Uso sin conexión (PWA)

La colección y la wishlist se guardan en el móvil, así que se consultan en una
tienda sin VPN y sin cobertura. Es solo lectura: añadir o editar juegos requiere
conexión, porque depende de ScreenScraper.

Instálala desde el navegador ("Añadir a pantalla de inicio") **entrando por
https://retro.decafes.es**, estando en casa. Es importante usar siempre esa
dirección y no la IP: cada origen guarda sus propios datos.

El icono de nube de la cabecera indica si te puedes fiar de lo que ves: verde
con un visto si se sincronizó hace menos de una hora, apagado con una
admiración si no hay conexión o los datos tienen más de una hora. Tocarlo fuerza
la sincronización.

### Detalles técnicos

- `GET /api/snapshot` devuelve colección, wishlist, plataformas y config en una
  sola petición (~400 KB) y vive en `localStorage`.
- El snapshot **omite `coverUrls`**: eran 4,1 MB de los 4,5 que pesaba
  `/api/collection` y no los lee ningún consumidor.
- Las carátulas se sirven reducidas con `GET /covers/<fichero>?w=160`, generadas
  con `sharp` la primera vez y guardadas en `data/covers/thumbs/`. Las 702
  ocupan unos 6,7 MB en el móvil, frente a 28 MB a tamaño completo.
- El service worker no intercepta `/api/`: los datos ya están en local y lo que
  interesa es que la petición falle rápido.
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/SyncIcon.vue frontend/src/components/AppHeader.vue README.md
git commit -m "feat(offline): icono de sincronización y documentación"
```

- [ ] **Step 6: Prueba en el móvil — la que de verdad importa**

Con la rama desplegada en el NAS y el móvil en la wifi de casa:

1. Abrir https://retro.decafes.es y esperar a que el icono de nube se ponga
   verde. La primera sincronización tarda más de lo normal: el backend está
   generando las 702 miniaturas.
2. Instalarla desde el menú del navegador ("Añadir a pantalla de inicio").
3. **Poner el móvil en modo avión.**
4. Abrir la app desde el icono: debe pintar la colección al instante, con sus
   carátulas.
5. Comprobar el buscador por título, el filtro por plataforma y el orden.
6. Comprobar que la wishlist está.
7. Entrar en Buscar: debe salir el aviso de que hace falta conexión, no un
   error.

---

## Verificación final

- [ ] `cd backend && npm test` — 13 tests en verde.
- [ ] `cd frontend && npm test` — 14 tests en verde.
- [ ] `cd frontend && npm run build` — sin errores.
- [ ] `curl -s localhost:9977/api/snapshot | wc -c` — entre 300 KB y 600 KB, frente a los 4,5 MB de `/api/collection`.
- [ ] Una carátula con `?w=160` pesa alrededor de 10 KB, frente a ~42 KB la original.
- [ ] Con los contenedores parados, la app pinta la colección con carátulas y el buscador responde.
- [ ] El móvil en modo avión abre la app, busca y filtra.
