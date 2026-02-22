import { useState } from 'react'

const CONSOLE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-500">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <path d="M6 10h2m2 0h2M12 8v4"/><circle cx="17" cy="12" r="1" fill="currentColor"/>
  </svg>
)

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 dark:text-gray-400">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 transition-colors"

export default function AddPlatformManualModal({ onConfirm, onCancel }) {
  const [form, setForm] = useState({ name: '', company: '', type: '', yearStart: '', yearEnd: '' })

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canSubmit = form.name.trim().length > 0

  function handleSubmit() {
    if (!canSubmit) return
    onConfirm({
      id: `manual-${Date.now()}`,
      name: form.name.trim(),
      company: form.company.trim(),
      type: form.type.trim(),
      yearStart: form.yearStart.trim(),
      yearEnd: form.yearEnd.trim(),
      aliases: '',
      logoUrl: null,
    })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && canSubmit) handleSubmit()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onCancel}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-sm shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Registro manual</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Añade una plataforma sin buscar en ScreenScraper</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">

          <Field label="Nombre" required>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ej. Super Nintendo"
              autoFocus
              className={inputClass}
            />
          </Field>

          <Field label="Fabricante">
            <input
              type="text"
              value={form.company}
              onChange={e => set('company', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ej. Nintendo"
              className={inputClass}
            />
          </Field>

          <Field label="Tipo">
            <input
              type="text"
              value={form.type}
              onChange={e => set('type', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ej. Console, Portable, Arcade…"
              className={inputClass}
            />
          </Field>

          <div className="flex gap-2">
            <Field label="Año lanzamiento">
              <input
                type="text"
                value={form.yearStart}
                onChange={e => set('yearStart', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ej. 1990"
                maxLength={4}
                className={inputClass}
              />
            </Field>
            <Field label="Año fin">
              <input
                type="text"
                value={form.yearEnd}
                onChange={e => set('yearEnd', e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ej. 2003"
                maxLength={4}
                className={inputClass}
              />
            </Field>
          </div>

          {/* Placeholder preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600 mt-1">
            <div className="w-10 h-10 rounded flex items-center justify-center bg-white dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600">
              {CONSOLE_ICON}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              Se usará un icono genérico de consola como imagen
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-6 pb-5">
          <button
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  )
}
