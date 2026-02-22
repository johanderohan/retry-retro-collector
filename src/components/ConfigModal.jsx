import { useState } from 'react'

const CONDITION_KEYS = ['Juego', 'Manual', 'Caja', 'Otros', 'Nuevo']

function exportCollectionCSV(collection) {
  const headers = ['Título', 'Plataforma', 'Región', 'Año', 'Estado', 'Versión ES', 'Platino', 'Playground']
  const rows = collection.map(g => {
    const cond = g.condition || {}
    const estado = CONDITION_KEYS.filter(k => cond[k]).join(' + ') || '—'
    return [
      g.title        || '',
      g.platform     || '',
      g.regionLabel  || '',
      g.year         || '',
      estado,
      g.esSpanish    ? 'Sí' : 'No',
      g.isPlatino    ? 'Sí' : 'No',
      g.inPlayground ? 'Sí' : 'No',
    ]
  })

  const esc = v => `"${String(v).replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map(r => r.map(esc).join(',')).join('\r\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `retry-collection-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ConfigModal({ onClose, onSave, initialConfig, collection = [] }) {
  const [config, setConfig] = useState({
    devid:      initialConfig.devid      || '',
    devpassword: initialConfig.devpassword || '',
    ssid:       initialConfig.ssid       || '',
    sspassword: initialConfig.sspassword || '',
    softname:   initialConfig.softname   || 'retro-search',
  })

  function handleSave() { onSave(config); onClose() }

  const inputCls = "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 transition-colors w-full"

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Configuración</h2>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">

          {/* ── ScreenScraper ── */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <span className="font-medium">ScreenScraper</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 leading-relaxed">
            Regístrate en <strong className="text-gray-700 dark:text-gray-300">screenscraper.fr</strong> para obtener credenciales.
          </p>

          {[
            { label: 'Dev ID',       key: 'devid',       type: 'text',     required: true, placeholder: 'Tu devid de ScreenScraper' },
            { label: 'Dev Password', key: 'devpassword', type: 'password', required: true, placeholder: 'Tu devpassword de ScreenScraper' },
          ].map(({ label, key, type, required, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              <input type={type} className={inputCls} placeholder={placeholder}
                value={config[key]} onChange={e => setConfig({ ...config, [key]: e.target.value })} />
            </div>
          ))}

          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
            <span>Cuenta de usuario (opcional)</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
          </div>

          {[
            { label: 'SS ID',               key: 'ssid',       type: 'text',     placeholder: 'Tu nombre de usuario' },
            { label: 'SS Password',         key: 'sspassword', type: 'password', placeholder: 'Tu contraseña' },
            { label: 'Nombre de software',  key: 'softname',   type: 'text',     placeholder: 'Nombre de tu app' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</label>
              <input type={type} className={inputCls} placeholder={placeholder}
                value={config[key]} onChange={e => setConfig({ ...config, [key]: e.target.value })} />
            </div>
          ))}

          {/* ── Exportar datos ── */}
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1">
            <span className="font-medium">Exportar datos</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Colección completa</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                {collection.length} juego{collection.length !== 1 ? 's' : ''} · CSV con título, plataforma, región, año y estado
              </p>
            </div>
            <button
              onClick={() => exportCollectionCSV(collection)}
              disabled={collection.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-gray-900 dark:hover:border-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 ml-4"
              title="Descargar CSV"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Exportar CSV
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-6 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={onClose}>
            Cancelar
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            onClick={handleSave} disabled={!config.devid || !config.devpassword}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
