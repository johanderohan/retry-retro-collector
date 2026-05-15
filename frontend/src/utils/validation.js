import { MANUAL_REGIONS, LIBRO_TIPOS, LIBRO_IDIOMAS } from './constants.js'

const YEAR_RE = /^\d{4}$/
const MANUAL_REGION_VALUES = MANUAL_REGIONS.map(r => r.value)

// Devuelve { valid, errors } — errors es un objeto campo → mensaje.
// Cambio de comportamiento deliberado (más estricto que el código React):
// el año, si está presente, debe ser de 4 dígitos.

export function validateGameManual(form) {
  const errors = {}
  if (!form.title?.trim()) errors.title = 'El título es obligatorio'
  if (form.year?.trim() && !YEAR_RE.test(form.year.trim())) errors.year = 'Año de 4 dígitos'
  if (form.region && !MANUAL_REGION_VALUES.includes(form.region)) errors.region = 'Región no válida'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validatePlatformManual(form) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'El nombre es obligatorio'
  const ys = form.yearStart?.trim()
  const ye = form.yearEnd?.trim()
  if (ys && !YEAR_RE.test(ys)) errors.yearStart = 'Año de 4 dígitos'
  if (ye && !YEAR_RE.test(ye)) errors.yearEnd = 'Año de 4 dígitos'
  if (ys && ye && YEAR_RE.test(ys) && YEAR_RE.test(ye) && Number(ye) < Number(ys)) {
    errors.yearEnd = 'El año fin no puede ser anterior al de inicio'
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateLibroManual(form) {
  const errors = {}
  if (!form.name?.trim()) errors.name = 'El nombre es obligatorio'
  if (form.year?.trim() && !YEAR_RE.test(form.year.trim())) errors.year = 'Año de 4 dígitos'
  if (form.tipo && !LIBRO_TIPOS.includes(form.tipo)) errors.tipo = 'Tipo no válido'
  if (form.idioma && !LIBRO_IDIOMAS.includes(form.idioma)) errors.idioma = 'Idioma no válido'
  return { valid: Object.keys(errors).length === 0, errors }
}
