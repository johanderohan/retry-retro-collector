import { CONDITION_KEYS } from './constants.js'

// Portado byte-fiel de ConfigModal.jsx:5-33
export function exportCollectionCSV(collection) {
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
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `retry-collection-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
