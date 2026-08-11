# Retry offline-first

Fecha: 2026-08-11
Estado: aprobado, pendiente de plan de implementación

## Objetivo

Poder consultar la colección de videojuegos desde el móvil en una tienda, sin
VPN y sin cobertura: los 689 juegos con su buscador y filtros, y la wishlist.
Solo lectura.

Es el mismo tratamiento que se aplicó a listadomanga
(`../../../listadomanga/docs/superpowers/specs/2026-08-11-pwa-offline-design.md`),
adaptado a este proyecto.

## El problema actual

La app ya tiene un PWA bastante decente: `manifest.json` con iconos PNG
correctos, `sw.js` que cachea imágenes cache-first y respuestas de API
network-first. Aun así no sirve sin conexión, por tres motivos:

1. **`router.beforeEach` espera a `useConfigStore().fetch()` antes de resolver
   cualquier ruta**, y esa petición va por axios con `timeout: 60000`. Sin
   conexión, la app se queda hasta un minuto en blanco antes de pintar nada.
   Es la causa principal.
2. **El service worker es network-first sin timeout** para API y assets: aunque
   haya copia en caché, primero espera a que la red falle.
3. **El fallback de la API devuelve `[]`** cuando no hay caché, así que la app
   puede acabar mostrándose vacía en lugar de indicar que está sin conexión.

## Alcance

**Funciona sin conexión:**

- Colección (pantalla de inicio): los 689 juegos, con sus filtros, orden y
  buscador
- Wishlist

**Requiere conexión**, y lo indica en vez de fallar:

- Buscar juegos nuevos (consulta ScreenScraper a través del backend)
- Añadir, editar o borrar cualquier cosa
- Estadísticas, Playground, Libros y Plataformas como pantalla propia

No hay escrituras sin conexión: es una decisión explícita. Añadir un juego
requiere buscarlo en ScreenScraper, que es online por naturaleza.

## Datos

Endpoint nuevo, `GET /api/snapshot`:

```json
{
  "generatedAt": "2026-08-11T18:00:00.000Z",
  "collection": [ /* 689 juegos, sin coverUrls */ ],
  "wishlist":   [ /* … */ ],
  "platforms":  [ /* … */ ],
  "config":     { /* … */ }
}
```

Las plataformas entran aunque no sean una pantalla en alcance: la colección
filtra por consola y las necesita. La config entra porque el guard del router la
exige antes de pintar.

### Por qué se quita `coverUrls`

`/api/collection` pesa hoy **4,5 MB**, y **4,1 MB de esos son el campo
`coverUrls`**: el array de portadas alternativas que devuelve ScreenScraper, que
se guarda al añadir un juego.

Ese campo **no se lee nunca de vuelta**. Su único consumidor es
`AddToCollectionModal.vue`, y ahí el juego llega desde los resultados de
búsqueda de ScreenScraper (`utils/screenscraper.js` lo construye), no desde la
colección almacenada. Es decir, la app se descarga 4,1 MB de datos muertos en
cada carga, también en casa.

Quitándolo, el snapshot queda así:

| Parte | Tamaño |
|---|---|
| Colección sin `coverUrls` | ~370 KB |
| Wishlist | 12 KB |
| Plataformas | 12 KB |
| Config | 130 B |
| **Total** | **~400 KB** |

Eso cabe de sobra en `localStorage`, con su límite de unos 5 MB. Se descarta
IndexedDB por el mismo motivo que en listadomanga: no compensa la dependencia ni
la API asíncrona para 400 KB.

Clave de almacenamiento: `retry.snapshot`.

## Carátulas

Aquí está la diferencia importante con listadomanga: las carátulas **no** están
en un CDN público, sino en el propio backend (`/covers/<uuid>.webp`), detrás de
la VPN. Si no se guardan en el móvil, en la tienda no se ve ninguna.

Son 702 ficheros y **28 MB**, con una media de 39 KB. Demasiado para bajarlo
entero, así que se generan miniaturas:

- El backend acepta `GET /covers/<fichero>?w=160` y devuelve una versión
  reducida usando `sharp`, que ya es dependencia del proyecto.
- La miniatura se genera la primera vez que se pide y se guarda en
  `data/covers/thumbs/`, de modo que la segunda vez se sirve directa.
- **El ancho es 160 y no 320.** Las carátulas originales solo miden 400 px de
  ancho, y en pantalla se pintan en una caja de 80 px CSS (36 en la vista de
  lista), así que 160 basta para pantallas 2x. Medido sobre las carátulas
  reales: a 160 px pesan 9,8 KB de media (**6,7 MB las 702**), mientras que a
  320 px pesarían 25,3 KB (17 MB), demasiado para el móvil.

Hoy `/covers` lo sirve `express.static(COVERS_DIR)` en `server.js`, con nginx
haciendo de proxy. El soporte de `?w=` se implementa como un middleware montado
en `/covers` **antes** de ese `express.static`: si la petición no trae `w`, deja
pasar; si lo trae, sirve o genera la miniatura. Así la ruta y el proxy no
cambian, y las URLs guardadas en la base de datos siguen siendo válidas.

En el frontend, las carátulas de la colección las pintan `GameCard.vue` (vista
de rejilla) y `GameRow.vue` (vista de lista): son los dos únicos sitios que hay
que cambiar para que pidan `?w=160`. La carátula a tamaño completo se sigue
usando al abrir la ficha de un juego. Tras cada sincronización con éxito, el
móvil descarga en segundo plano las miniaturas que le falten y el service worker
las guarda.

Efecto secundario: la rejilla carga bastante más rápido también en casa.

## Frontend

Lo relevante es lo que **no** cambia: ninguna vista. `CollectionView` ya lee
`collection.items` del store de Pinia y filtra y ordena en cliente con
`filteredSortedGames()` de `utils/collection.js`, así que el buscador funciona
sin conexión en cuanto los datos estén en local. Lo mismo con la wishlist.

Se añade:

```
src/lib/storage.js       Leer y escribir el snapshot en localStorage,
                         tolerando datos corruptos. Puro.

src/services/sync.js     Descargar el snapshot con timeout de 2 s y precargar
                         las miniaturas que falten.

src/stores/syncStore.js  Estado de la sincronización: última vez, en curso,
                         online. Alimenta el icono de la cabecera.

src/components/SyncIcon.vue   Nube discreta con el estado.
```

Y se modifica:

- Los stores `collection`, `wishlist`, `platforms` y `config` se hidratan desde
  el snapshot local en lugar de llamar al API. Sus `load()` / `ensureLoaded()`
  dejan de tocar la red.
- **`router.beforeEach` deja de esperar a nada**: la config se lee de local y
  cualquier petición va en segundo plano. Este cambio, por sí solo, elimina el
  minuto en blanco.
- `GameCard.vue` y `GameRow.vue` piden las carátulas con `?w=160`.

La hidratación ocurre antes de montar la app, igual que en listadomanga: leer y
parsear 400 KB de `localStorage` cuesta milisegundos.

## Service worker

Se ajusta el existente, sin reescribirlo entero:

| Recurso | Antes | Ahora |
|---|---|---|
| `/api/*` | network-first, con fallback a `[]` | **No se intercepta** |
| Imágenes | cache-first | Igual, ya es correcto |
| Navegación y assets | network-first sin timeout | Red con timeout corto y vuelta al caché |

Dejar de interceptar `/api/` es lo que elimina la espera: los datos ya están en
`localStorage` y lo que interesa es que la petición falle rápido. De paso
desaparece el fallback a `[]`, que hacía que la app pareciera vacía en vez de
sin conexión.

## Interfaz

Un icono de nube discreto en la cabecera, con el mismo criterio que en la app de
manga:

| Icono | Significado |
|---|---|
| Nube con ✓, verde suave | Sincronizado hace menos de una hora |
| Nube con **!**, apagada | Sin conexión, o datos de hace más de una hora |

El detalle exacto va en el `title`, y tocarlo fuerza la sincronización. No hay
estado de "cambios sin enviar" porque no hay escrituras offline.

Las pantallas que requieren conexión muestran un aviso claro en lugar de fallar.

## Pruebas

El frontend no tiene infraestructura de tests. Se añade `node --test`, como se
hizo en listadomanga, y se prueban los módulos puros, sin Vue ni navegador:

- `lib/storage.js`: guardar y recuperar el snapshot; un JSON corrupto o
  incompleto se descarta sin romper el arranque.
- `utils/collection.js` (ya existe): los filtros y el orden que ahora hacen de
  buscador offline — por título, por plataforma, por región, y que el orden sea
  estable.

Del backend:

- `/api/snapshot` devuelve las cuatro partes.
- **No** incluye `coverUrls` en ningún juego.
- El número de juegos coincide con `/api/collection`.
- `/covers/<f>?w=160` devuelve una imagen más pequeña que la original, y la
  segunda petición la sirve desde disco sin regenerarla.
- Un fichero inexistente responde 404 en vez de reventar.

**Prueba manual en el móvil**: instalar la PWA desde https://retro.decafes.es
estando en casa, sincronizar, poner el móvil en modo avión, abrir la app y
comprobar que la colección se ve con sus carátulas, que el buscador y los
filtros responden, y que la wishlist está.

## Riesgos

- **Las miniaturas se generan a demanda.** La primera precarga dispara 702
  generaciones seguidas contra el backend. `sharp` es rápido, pero conviene
  lanzarlas con concurrencia limitada para no ahogar al contenedor.
- **`localStorage` puede desaparecer** si el sistema limpia el almacenamiento
  del sitio. No se pierde nada — el NAS es la fuente de verdad — pero la app
  arrancaría vacía y habría que sincronizar en casa.
- **28 MB de carátulas a tamaño completo siguen sin estar offline.** Al abrir la
  ficha de un juego sin conexión se verá la miniatura ampliada o un hueco, según
  lo que haya cacheado. Es una consecuencia asumida de no bajar los 28 MB.

## Fuera de alcance

- Exponer la app a internet o quitar la VPN.
- Escrituras sin conexión de cualquier tipo.
- Estadísticas, Playground, Libros y Plataformas como pantallas offline.
- Tocar el flujo de ScreenScraper.
