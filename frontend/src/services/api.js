import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 60000 })

// Normaliza el mensaje de error (extrae { error } del body si existe).
api.interceptors.response.use(
  r => r,
  err => {
    const msg = err.response?.data?.error || err.message || 'Error de red'
    return Promise.reject(new Error(msg))
  },
)

export async function dbGetAll(table) {
  const { data } = await api.get(`/${table}`)
  return data
}

export async function dbAdd(table, item) {
  await api.post(`/${table}`, item)
}

export async function dbRemove(table, id) {
  await api.delete(`/${table}/${encodeURIComponent(id)}`)
}

export async function configLoad() {
  try {
    const { data } = await api.get('/config')
    return data || {}
  } catch {
    return {}
  }
}

export async function configSave(config) {
  await api.put('/config', config)
}

// Uploads: enviar el File crudo con su Content-Type; transformRequest evita
// que axios lo serialice a JSON.
async function uploadFile(path, file) {
  const { data } = await api.post(path, file, {
    headers: { 'Content-Type': file.type },
    transformRequest: [d => d],
  })
  return data.url
}

export const uploadCover = file => uploadFile('/covers', file)
export const uploadLogo  = file => uploadFile('/logos', file)

export async function downloadCover(imageUrl) {
  const { data } = await api.post('/covers/download', { url: imageUrl })
  return data.url
}

export async function downloadLogo(imageUrl) {
  const { data } = await api.post('/logos/download', { url: imageUrl })
  return data.url
}

export default api
