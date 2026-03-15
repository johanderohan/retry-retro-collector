import { useState } from 'react'

export default function LibroCard({ libro, onRemove }) {
  const [imgError, setImgError] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <article className="relative flex gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-default">

      {/* Remove */}
      {onRemove && (
        <button
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-300 dark:text-gray-600 hover:border-red-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          onClick={() => onRemove(libro.id)}
          title="Eliminar"
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      )}

      {/* Cover */}
      <div className="w-20 min-w-[80px] h-28 rounded overflow-hidden flex-shrink-0">
        {libro.coverUrl && !imgError ? (
          <>
            {!imgLoaded && (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
            )}
            <img
              src={libro.coverUrl}
              alt={`Portada de ${libro.name}`}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
              style={{ display: imgLoaded ? 'block' : 'none' }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 pr-6">
        <h3
          className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >{libro.name}</h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          {libro.tipo && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {libro.tipo}
            </span>
          )}
          {libro.idioma && (
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {libro.idioma}
            </span>
          )}
        </div>

        {(libro.editorial || libro.year) && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto">
            {[libro.editorial, libro.year].filter(Boolean).join(' - ')}
          </p>
        )}
      </div>
    </article>
  )
}
