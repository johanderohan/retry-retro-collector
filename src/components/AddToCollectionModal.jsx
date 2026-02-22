import { useState } from 'react'

const ITEMS = ['Juego', 'Manual', 'Caja', 'Otros', 'Nuevo']

export default function AddToCollectionModal({ game, onConfirm, onCancel }) {
  const [selected, setSelected] = useState({ Juego: false, Manual: false, Caja: false, Otros: false, Nuevo: false })
  const [esSpanish, setEsSpanish] = useState(false)
  const [isPlatino, setIsPlatino] = useState(false)
  const [selectedCover, setSelectedCover] = useState(game.coverUrl || null)
  const [coverOpen, setCoverOpen] = useState(false)

  function toggleItem(item) {
    setSelected(prev => ({ ...prev, [item]: !prev[item] }))
  }

  const noneSelected = !ITEMS.some(i => selected[i])
  const covers = game.coverUrls || []
  const selectedCoverData = covers.find(c => c.url === selectedCover)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>

        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Añadir a la colección</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{game.title} · {game.platform}</p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">¿Qué incluye este juego?</p>

          <div className="flex gap-1.5">
            {ITEMS.map(item => (
              <button
                key={item}
                onClick={() => toggleItem(item)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                  selected[item]
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button className="flex items-center justify-between w-full mt-1" onClick={() => setEsSpanish(v => !v)}>
            <span className="text-xs text-gray-500 dark:text-gray-400">¿Versión en español?</span>
            <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${esSpanish ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-200 dark:bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${esSpanish ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
          </button>

          <button className="flex items-center justify-between w-full" onClick={() => setIsPlatino(v => !v)}>
            <span className="text-xs text-gray-500 dark:text-gray-400">¿Versión Platino?</span>
            <span className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors ${isPlatino ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-200 dark:bg-gray-600'}`}>
              <span className={`inline-block h-4 w-4 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${isPlatino ? 'translate-x-4' : 'translate-x-0'}`} />
            </span>
          </button>

          {/* Cover accordion — only if there are covers */}
          {covers.length > 0 && (
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden mt-1">
              <button
                className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => setCoverOpen(v => !v)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Portada</span>
                  {selectedCoverData && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{selectedCoverData.label}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedCover && (
                    <img
                      src={selectedCover}
                      alt="portada seleccionada"
                      className="h-8 w-6 object-contain rounded"
                    />
                  )}
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-gray-400 transition-transform ${coverOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="2,4 6,8 10,4" />
                  </svg>
                </div>
              </button>

              {coverOpen && (
                <div className="border-t border-gray-200 dark:border-gray-600 px-3 py-3">
                  <div className="grid grid-cols-4 gap-2">
                    {covers.map((cover) => (
                      <button
                        key={cover.url}
                        onClick={() => { setSelectedCover(cover.url); setCoverOpen(false) }}
                        title={cover.label}
                        className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-colors ${
                          selectedCover === cover.url
                            ? 'border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-700'
                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <img src={cover.url} alt={cover.label} className="h-16 w-full object-contain" />
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight text-center">{cover.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end px-6 pb-5">
          <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            onClick={() => onConfirm(selected, esSpanish, selectedCover, isPlatino)}
            disabled={noneSelected}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  )
}
