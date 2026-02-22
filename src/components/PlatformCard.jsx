import { useState } from 'react'

export default function PlatformCard({ platform, onAdd, onRemove, inCollection }) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <article className="relative flex gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-default">

      {/* Add */}
      {onAdd && !inCollection && (
        <button
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onAdd(platform)}
          title="Añadir a mis plataformas"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
          </svg>
        </button>
      )}

      {/* Already in collection */}
      {onAdd && inCollection && (
        <span className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" title="En tus plataformas">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1.5,6 4.5,9 10.5,3" />
          </svg>
        </span>
      )}

      {/* Remove */}
      {onRemove && (
        <button
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600 hover:border-red-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          onClick={() => onRemove(platform.id)}
          title="Eliminar"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      )}

      {/* Logo */}
      <div className="w-16 min-w-[64px] h-16 rounded overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
        {platform.logoUrl && !imgError ? (
          <>
            {!imgLoaded && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M6 10h2m2 0h2M12 8v4"/><circle cx="17" cy="12" r="1" fill="currentColor"/>
              </svg>
            )}
            <img
              src={platform.logoUrl}
              alt={platform.name}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
              style={{ display: imgLoaded ? 'block' : 'none' }}
            />
          </>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
            <rect x="2" y="6" width="20" height="12" rx="2"/>
            <path d="M6 10h2m2 0h2M12 8v4"/><circle cx="17" cy="12" r="1" fill="currentColor"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-6">
        <h3
          className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >{platform.name}</h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          {platform.type && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {platform.type}
            </span>
          )}
          {platform.yearStart && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {platform.yearStart}{platform.yearEnd && platform.yearEnd !== platform.yearStart ? `–${platform.yearEnd}` : ''}
            </span>
          )}
        </div>

        {platform.company && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto">{platform.company}</p>
        )}
      </div>
    </article>
  )
}
