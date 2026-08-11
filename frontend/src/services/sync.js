// Timeout corto a propósito: fuera de casa el NAS no responde, y la app no
// debe esperarlo nunca. axios usa 60 s, que es justo lo que hoy deja la
// pantalla en blanco.
const TIMEOUT_MS = 2000

export async function fetchSnapshot({ timeoutMs = TIMEOUT_MS, fetchImpl = fetch } = {}) {
  const ctrl = new AbortController()
  const temporizador = setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    const res = await fetchImpl('/api/snapshot', { signal: ctrl.signal })
    if (!res.ok) throw new Error(`snapshot ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(temporizador)
  }
}

// Descarga las miniaturas que falten para que el service worker las guarde.
// Con concurrencia limitada: son 702 y la primera vez hay que generarlas todas
// en el backend, así que lanzarlas de golpe ahogaría el contenedor.
export async function precargarMiniaturas(urls, { concurrencia = 4 } = {}) {
  const cola = urls.filter(Boolean)
  let i = 0

  async function trabajador() {
    while (i < cola.length) {
      const url = cola[i++]
      await new Promise(resolve => {
        const img = new Image()
        img.onload = img.onerror = () => resolve()
        img.decoding = 'async'
        img.src = url
      })
    }
  }

  await Promise.all(Array.from({ length: concurrencia }, trabajador))
}
