# Retry 🕹️

Gestor de colecciones de videojuegos retro integrado con la API de [ScreenScraper](https://www.screenscraper.fr). Permite buscar juegos y consolas, registrar tu colección física con detalle de estado (cartucho, manual, caja), gestionar una wishlist y llevar el control de lo que estás jugando.

---

## Características

- **Dashboard** — resumen con totales y desglose por plataforma, región y estado (ruta de inicio).
- **Búsqueda de juegos** — resultados separados por versión exacta: plataforma × región × año.
- **Colección** — añade juegos indicando qué incluye cada copia: Juego / Manual / Caja / Otros / Nuevo. Filtros por nombre, plataforma y región, y 6 ordenaciones.
- **Wishlist** — guarda los juegos que quieres conseguir; promover a la colección la retira de la wishlist.
- **Playground** — marca los juegos que estás jugando actualmente (derivado de la colección).
- **Plataformas** — búsqueda y colección de consolas, ordenadores y periféricos retro.
- **Libros** — registro manual de guías, catálogos, libros de arte y revistas.
- **Selector de portada** — elige entre las distintas portadas disponibles (caja 2D, 3D, mix, captura, fan art).
- **Vista galería / lista** — conmutable y persistente entre rutas y recargas.
- **Modo oscuro** — conmutable desde el menú lateral (persistente).
- **PWA / instalable** — instalable en móvil y escritorio, con soporte offline vía Service Worker.
- **Caché Redis** — las búsquedas a ScreenScraper se cachean (1 h juegos, 24 h plataformas).
- **Persistencia local** — base de datos SQLite en `./data/retry.db`.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Vue 3 + Vue Router + Pinia + Vite + Tailwind CSS v3 |
| Backend | Express 5 + Node.js 20 |
| Base de datos | SQLite vía better-sqlite3 |
| Caché | Redis 7 (opcional en dev, activo en Docker) |
| Servidor web | nginx (sirve la SPA y hace proxy al backend) |
| Contenedor | Docker + Docker Compose |

Monorepo: `backend/` (API) y `frontend/` (SPA), independientes.

---

## Requisitos previos

Cuenta gratuita en [ScreenScraper](https://www.screenscraper.fr/membreinscription.php) para obtener `devid` / `devpassword`.

---

## Instalación

### Opción A — Docker (recomendado)

```bash
git clone <repo>
cd retro
docker compose up --build
```

Disponible en **http://localhost:9977**. Los datos se guardan en `./data/` (BD + portadas + logos) y sobreviven a reinicios. El esquema y el contrato de la API son idénticos a versiones anteriores: una BD `data/retry.db` existente sigue funcionando sin migración.

### Opción B — Desarrollo local

**Requisitos:** Node.js 20 (`.nvmrc` incluido; `better-sqlite3` requiere toolchain de compilación).

```bash
# Terminal 1 — backend (http://localhost:3001)
cd backend && npm install && npm run dev

# Terminal 2 — frontend (http://localhost:5173, proxy → backend)
cd frontend && npm install && npm run dev
```

Redis es opcional en dev (define `REDIS_URL` para activar la caché). Configura tus credenciales de ScreenScraper desde el menú lateral → **Configuración**.

---

## Estructura del proyecto

```
retro/
├── backend/
│   └── src/
│       ├── server.js            # App Express + orden de middleware + bootstrap
│       ├── config/              # db (SQLite), redis, migrations
│       ├── services/            # store, images (sharp), screenscraper (proxy+caché)
│       ├── controllers/         # uno por recurso + covers/logos/screenscraper
│       └── routes/              # routers montados bajo /api y /ss-api
├── frontend/
│   └── src/
│       ├── router/ · stores/ (Pinia) · services/api.js (axios)
│       ├── utils/               # constants, screenscraper, csv, validation
│       ├── components/ · views/
│       ├── App.vue · main.js · style.css
│   └── nginx.conf · Dockerfile  # build multi-stage → nginx
├── data/                        # SQLite + covers/ + logos/ (runtime, gitignored)
├── docker-compose.yml           # backend + redis + web(nginx)
└── .nvmrc
```

---

## Variables de entorno (backend)

| Variable | Descripción | Por defecto |
|---|---|---|
| `PORT` | Puerto del backend Express | `3001` |
| `REDIS_URL` | URL de conexión a Redis | — (caché desactivada) |
| `DATA_DIR` | Carpeta de datos (BD + covers + logos) | `<repo>/data` (Docker: `/app/data`) |

En Docker se configuran desde `docker-compose.yml`. Ver `backend/.env.example`.

---

## TTL de la caché Redis

| Endpoint | TTL |
|---|---|
| `systemesListe.php` (plataformas) | 24 horas |
| `jeuRecherche.php` (juegos) | 1 hora |
| Otros endpoints de ScreenScraper | 30 minutos |

Las credenciales se excluyen de la clave de caché para que distintos usuarios compartan resultados.
