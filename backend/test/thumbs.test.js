import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { ensureThumb, thumbsMiddleware, ANCHOS_PERMITIDOS } from '../src/services/thumbs.service.js'

// Carátula de prueba: 800x1100, como las reales pero generada al vuelo.
async function crearDirConPortada() {
  const dir = mkdtempSync(join(tmpdir(), 'retry-thumbs-'))
  await sharp({ create: { width: 800, height: 1100, channels: 3, background: '#3355aa' } })
    .webp()
    .toFile(join(dir, 'portada.webp'))
  return dir
}

test('los anchos permitidos son los tres previstos', () => {
  assert.deepEqual([...ANCHOS_PERMITIDOS].sort((a, b) => a - b), [160, 320, 640])
})

test('genera una miniatura más pequeña que el original', async () => {
  const dir = await crearDirConPortada()
  const ruta = await ensureThumb(dir, 'portada.webp', 320)

  assert.ok(ruta && existsSync(ruta))
  const meta = await sharp(ruta).metadata()
  assert.equal(meta.width, 320)
  assert.ok(statSync(ruta).size < statSync(join(dir, 'portada.webp')).size)
})

test('la segunda petición reutiliza el fichero en vez de regenerarlo', async () => {
  const dir = await crearDirConPortada()
  const ruta = await ensureThumb(dir, 'portada.webp', 320)
  const primera = statSync(ruta).mtimeMs

  await new Promise(r => setTimeout(r, 20))
  const otra = await ensureThumb(dir, 'portada.webp', 320)

  assert.equal(otra, ruta)
  assert.equal(statSync(otra).mtimeMs, primera)
})

test('un original inexistente devuelve null sin lanzar', async () => {
  const dir = await crearDirConPortada()
  assert.equal(await ensureThumb(dir, 'no-existe.webp', 320), null)
})

test('no se sale del directorio de portadas', async () => {
  const dir = await crearDirConPortada()
  writeFileSync(join(dir, '..', 'secreto.webp'), 'no soy una imagen')
  assert.equal(await ensureThumb(dir, '../secreto.webp', 320), null)
})

test('sin ancho, el middleware deja pasar a express.static', async () => {
  const dir = await crearDirConPortada()
  let siguiente = false
  const mw = thumbsMiddleware(dir)

  await mw({ query: {}, path: '/portada.webp' }, {}, () => { siguiente = true })
  assert.equal(siguiente, true)
})

test('un ancho no permitido también deja pasar', async () => {
  const dir = await crearDirConPortada()
  let siguiente = false
  const mw = thumbsMiddleware(dir)

  await mw({ query: { w: '999' }, path: '/portada.webp' }, {}, () => { siguiente = true })
  assert.equal(siguiente, true)
})

test('con ancho permitido sirve el fichero de la miniatura', async () => {
  const dir = await crearDirConPortada()
  const mw = thumbsMiddleware(dir)
  let enviado = null
  const res = { type: () => res, sendFile: ruta => { enviado = ruta } }

  await mw({ query: { w: '320' }, path: '/portada.webp' }, res, () => {
    throw new Error('no debería llamar a next')
  })

  assert.ok(enviado && enviado.includes('320-portada.webp'))
})
