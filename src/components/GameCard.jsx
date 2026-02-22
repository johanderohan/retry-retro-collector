import { useState } from 'react'

const REGION_FLAGS = {
  'Mundial': '🌍', 'USA': '🇺🇸', 'Europa': '🇪🇺', 'Japón': '🇯🇵',
  'Francia': '🇫🇷', 'Alemania': '🇩🇪', 'España': '🇪🇸', 'Brasil': '🇧🇷',
  'Australia': '🇦🇺', 'Corea': '🇰🇷', 'ScreenScraper': '🖥️',
}

function conditionLabel(c) {
  if (c.Nuevo) return 'NEW'
  let label = ''
  if (c.Juego) label += 'C'
  if (c.Manual) label += 'I'
  if (c.Caja)   label += 'B'
  if (c.Otros)  label += '*'
  return label
}

export default function GameCard({ game, onAdd, onRemove, inCollection, onWishlist, inWishlist, onPlayground, inPlayground }) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  const regionLabel = game.esSpanish ? 'España' : game.regionLabel
  const flag = game.esSpanish ? '🇪🇸' : (REGION_FLAGS[game.regionLabel] || '🌐')

  return (
    <article className="relative flex gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-default">

      {/* Add to collection */}
      {onAdd && !inCollection && (
        <button
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onAdd(game)}
          title="Añadir a mi colección"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
          </svg>
        </button>
      )}

      {onAdd && inCollection && (
        <span className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" title="En tu colección">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        </span>
      )}

      {/* Wishlist */}
      {onWishlist && (
        <button
          className={`absolute top-11 right-3 w-6 h-6 flex items-center justify-center rounded-full border transition-colors ${
            inWishlist
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
              : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
          onClick={() => onWishlist(game)}
          title={inWishlist ? 'En tu wishlist' : 'Añadir a wishlist'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Playground (trofeo) */}
      {onPlayground && (
        <button
          className={`absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border transition-colors ${
            inPlayground
              ? 'bg-rose-400 border-rose-400 text-white'
              : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-rose-400 hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
          }`}
          onClick={() => onPlayground(game)}
          title={inPlayground ? 'Quitar del Playground' : 'Añadir al Playground'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      )}

      {/* Remove — baja si hay onAdd o onPlayground encima */}
      {onRemove && (
        <button
          className={`absolute ${(onAdd || onPlayground) ? 'top-11' : 'top-3'} right-3 w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600 hover:border-red-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
          onClick={() => onRemove(game.id)}
          title="Eliminar"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      )}

      {/* Cover */}
      <div className="w-20 min-w-[80px] h-28 rounded overflow-hidden flex-shrink-0">
        {game.coverUrl && !imgError ? (
          <>
            {!imgLoaded && <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300 dark:text-gray-600">🎮</div>}
            <img
              src={game.coverUrl}
              alt={`Portada de ${game.title}`}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
              style={{ display: imgLoaded ? 'block' : 'none' }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-300 dark:text-gray-600">🎮</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-6">
        <h3
          className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >{game.title}</h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            game.isPlatino
              ? 'bg-black text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
          }`}>
            {game.platform}
          </span>
          {game.condition && (
            <span className={`text-xs font-semibold tracking-wide px-2 py-0.5 rounded ${
              game.isPlatino
                ? 'bg-black text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
            }`}>
              {conditionLabel(game.condition)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 w-14">Región</span>
            <span className="text-xs text-gray-600 dark:text-gray-300">{flag} {regionLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-gray-500 w-14">Año</span>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{game.year}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
