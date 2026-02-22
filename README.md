# Retry 🕹️

Gestor de colecciones de videojuegos retro integrado con la API de [ScreenScraper](https://www.screenscraper.fr). Permite buscar juegos y consolas, registrar tu colección física con detalle de estado (cartucho, manual, caja), gestionar una wishlist y llevar el control de lo que estás jugando.

---

## Características

- **Búsqueda de juegos** — resultados separados por versión exacta: plataforma × región × año. Así puedes registrar exactamente qué edición tienes (p.ej. *Pokémon Versión Roja, España, Game Boy, 1999*).
- **Colección** — añade juegos indicando qué incluye cada copia: Juego / Manual / Caja / Otros / Nuevo. Filtros por nombre, plataforma y región.
- **Wishlist** — guarda los juegos que quieres conseguir.
- **Playground** — marca los juegos que estás jugando actualmente.
- **Plataformas** — búsqueda y colección de consolas, ordenadores y periféricos retro.
- **Selector de portada** — elige entre las distintas portadas disponibles (caja 2D, 3D, mix, captura…) al añadir un juego.
- **Modo oscuro** — conmutable desde el menú lateral.
- **Menú lateral** — muestra el total de juegos de tu colección como badge.
- **PWA / instalable** — se puede instalar en móvil y escritorio. Incluye icono personalizado, apple-touch-icon y favicon SVG adaptados al modo oscuro.
- **Soporte offline** — la colección, wishlist, playground y plataformas siguen accesibles sin conexión gracias al Service Worker (`public/sw.js`). Las peticiones a la API se sirven desde caché cuando no hay red.
- **Caché Redis** — las búsquedas a ScreenScraper se cachean en Redis para evitar peticiones repetidas (1 h para juegos, 24 h para plataformas).
- **Persistencia local** — base de datos SQLite en `./data/retry.db`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Backend | Express 5 + Node.js 20 |
| Base de datos | SQLite vía better-sqlite3 |
| Caché | Redis 7 (opcional en dev, activo en Docker) |
| Contenedor | Docker + Docker Compose |

---

## Requisitos previos

Cuenta gratuita en [ScreenScraper](https://www.screenscraper.fr/membreinscription.php) para obtener las credenciales de la API (`devid` / `devpassword`).

---

## Instalación

### Opción A — Docker (recomendado)

La forma más sencilla. Incluye Redis automáticamente y no requiere tener Node instalado.

```bash
git clone <repo>
cd retro
docker compose up --build
```

La aplicación estará disponible en **http://localhost:9977**.

Los datos se guardan en `./data/retry.db` y sobreviven a reinicios y recreaciones del contenedor.

---

### Opción B — Desarrollo local

**Requisitos:** [Node.js 20](https://nodejs.org) — la versión 20 es obligatoria por compatibilidad con `better-sqlite3`.

Si usas `nvm`, el proyecto incluye `.nvmrc`:

```bash
nvm use
```

**1. Instalar dependencias**

```bash
npm install
```

**2. Arrancar**

```bash
npm run dev
```

Esto lanza simultáneamente:
- **Vite** en `http://localhost:5173` (frontend con HMR)
- **Express** en `http://localhost:3001` (API + proxy hacia ScreenScraper)

**3. Configurar ScreenScraper**

Al abrir la aplicación verás un aviso en amarillo. Pulsa **Configuración** en el menú lateral e introduce tus credenciales:

| Campo | Descripción |
|---|---|
| `devid` | Tu ID de desarrollador de ScreenScraper |
| `devpassword` | Tu contraseña de desarrollador |
| `ssid` *(opcional)* | Tu nombre de usuario (aumenta el límite de peticiones) |
| `sspassword` *(opcional)* | Tu contraseña de usuario |

> En modo dev la caché Redis está desactivada a menos que definas la variable de entorno `REDIS_URL`.

---

## Estructura del proyecto

```
retro/
├── server/
│   ├── index.js      # API Express + proxy ScreenScraper + caché Redis
│   └── db.js         # Capa de acceso a SQLite (better-sqlite3)
├── src/
│   ├── App.jsx        # Componente raíz, lógica de búsqueda y vistas
│   ├── components/
│   │   ├── GameCard.jsx             # Tarjeta de juego (búsqueda y colección)
│   │   ├── PlatformCard.jsx         # Tarjeta de consola/periférico
│   │   ├── AddToCollectionModal.jsx # Modal de condición y portada al añadir
│   │   ├── ConfirmModal.jsx         # Modal de confirmación de borrado
│   │   ├── ConfigModal.jsx          # Modal de credenciales ScreenScraper
│   │   └── SearchBar.jsx            # Barra de búsqueda
│   ├── hooks/
│   │   ├── useCollection.js   # Estado y CRUD de la colección
│   │   ├── useWishlist.js     # Estado y CRUD de la wishlist
│   │   ├── usePlatforms.js    # Estado y CRUD de plataformas
│   │   └── useDarkMode.js     # Persistencia del modo oscuro
│   └── db/
│       └── index.js           # Cliente HTTP hacia la API del backend
├── public/
│   ├── sw.js                  # Service Worker (offline + caché de activos y API)
│   ├── favicon.svg            # Favicon SVG con logo personalizado
│   ├── apple-touch-icon.png   # Icono iOS 180×180 (fondo oscuro, logo centrado)
│   ├── icon-192.png           # Icono PWA 192×192
│   └── icon-512.png           # Icono PWA 512×512
├── data/                      # Base de datos SQLite (generada en runtime)
├── Dockerfile
├── docker-compose.yml
└── .nvmrc                     # Fija Node 20
```

---

## Variables de entorno

| Variable | Descripción | Por defecto |
|---|---|---|
| `SERVER_PORT` | Puerto del servidor Express | `3001` |
| `REDIS_URL` | URL de conexión a Redis | — (caché desactivada) |

En Docker ambas se configuran automáticamente desde `docker-compose.yml`.

---

## TTL de la caché Redis

| Endpoint | TTL |
|---|---|
| `systemesListe.php` (listado de plataformas) | 24 horas |
| `jeuRecherche.php` (búsqueda de juegos) | 1 hora |
| Otros endpoints de ScreenScraper | 30 minutos |

Las credenciales (`devid`, `ssid`…) se excluyen de la clave de caché para que distintos usuarios compartan los mismos resultados cacheados.
