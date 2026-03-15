import { useState, useRef } from 'react'
import { uploadCover } from '../db'

const BOOK_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-500">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

const TIPO_OPTIONS = ['Guía', 'Catálogo', 'Libro de arte', 'Revista', 'Otros']
const IDIOMA_OPTIONS = ['Español', 'Japonés', 'Inglés']

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

const selectClass = "w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:border-gray-900 dark:focus:border-gray-400 focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-400 transition-colors appearance-none cursor-pointer"

export default function AddLibroManualModal({ onConfirm, onCancel }) {
  const [form, setForm] = useState({ name: '', editorial: '', tipo: '', idioma: '', year: '' })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canSubmit = form.name.trim().length > 0

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(URL.createObjectURL(file))
  }

  function clearCover() {
    setCoverFile(null)
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit() {
    if (!canSubmit || uploading) return

    let coverUrl = null
    if (coverFile) {
      setUploading(true)
      try {
        coverUrl = await uploadCover(coverFile)
      } catch {
        coverUrl = null
      } finally {
        setUploading(false)
      }
    }

    onConfirm({
      id: `manual-${Date.now()}`,
      name: form.name.trim(),
      editorial: form.editorial.trim(),
      tipo: form.tipo,
      idioma: form.idioma,
      year: form.year.trim(),
      coverUrl,
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
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Añadir libro</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Registra un libro de tu colección</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">

          <Field label="Nombre" required>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ej. Zelda: Hyrule Historia"
              autoFocus
              className={inputClass}
            />
          </Field>

          <Field label="Editorial">
            <input
              type="text"
              value={form.editorial}
              onChange={e => set('editorial', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ej. Norma Editorial"
              className={inputClass}
            />
          </Field>

          <div className="flex gap-2">
            <Field label="Tipo">
              <div className="relative">
                <select
                  value={form.tipo}
                  onChange={e => set('tipo', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Seleccionar tipo…</option>
                  {TIPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,4 6,8 10,4" />
                </svg>
              </div>
            </Field>
            <Field label="Idioma">
              <div className="relative">
                <select
                  value={form.idioma}
                  onChange={e => set('idioma', e.target.value)}
                  className={selectClass}
                >
                  <option value="">Seleccionar idioma…</option>
                  {IDIOMA_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,4 6,8 10,4" />
                </svg>
              </div>
            </Field>
          </div>

          <Field label="Año">
            <input
              type="text"
              value={form.year}
              onChange={e => set('year', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ej. 2013"
              maxLength={4}
              className={inputClass}
            />
          </Field>

          {/* Cover upload */}
          <div className="mt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {coverPreview ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                <img
                  src={coverPreview}
                  alt="Vista previa"
                  className="w-10 h-14 rounded object-contain flex-shrink-0 border border-gray-200 dark:border-gray-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{coverFile.name}</p>
                  <button
                    type="button"
                    onClick={clearCover}
                    className="text-xs text-red-400 hover:text-red-500 mt-0.5"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 p-3 w-full bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-400 transition-colors"
              >
                <div className="w-10 h-14 rounded flex items-center justify-center bg-white dark:bg-gray-700 flex-shrink-0 border border-gray-200 dark:border-gray-600">
                  {BOOK_ICON}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed text-left">
                  Pulsa para subir una portada, o continúa sin imagen.
                </p>
              </button>
            )}
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
            disabled={!canSubmit || uploading}
          >
            {uploading ? 'Subiendo...' : 'Añadir'}
          </button>
        </div>
      </div>
    </div>
  )
}
