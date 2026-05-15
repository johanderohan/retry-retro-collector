import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svgSource = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="#111827"/>

  <!-- Controller body -->
  <rect x="80" y="176" width="352" height="208" rx="96" fill="#374151"/>

  <!-- Left grip -->
  <rect x="80" y="288" width="120" height="120" rx="60" fill="#374151"/>

  <!-- Right grip -->
  <rect x="312" y="288" width="120" height="120" rx="60" fill="#374151"/>

  <!-- D-pad horizontal -->
  <rect x="138" y="254" width="88" height="36" rx="12" fill="#6b7280"/>

  <!-- D-pad vertical -->
  <rect x="164" y="228" width="36" height="88" rx="12" fill="#6b7280"/>

  <!-- A button (red) -->
  <circle cx="340" cy="228" r="26" fill="#ef4444"/>

  <!-- B button (yellow) -->
  <circle cx="286" cy="268" r="26" fill="#f59e0b"/>

  <!-- X button (blue) -->
  <circle cx="340" cy="268" r="26" fill="#3b82f6"/>

  <!-- Y button (green) -->
  <circle cx="286" cy="228" r="26" fill="#22c55e"/>

  <!-- Start button -->
  <rect x="236" y="262" width="40" height="20" rx="10" fill="#6b7280"/>
</svg>
`

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
]

for (const { name, size } of sizes) {
  await sharp(Buffer.from(svgSource))
    .resize(size, size)
    .png()
    .toFile(join(root, 'public', name))
  console.log(`✓ public/${name} (${size}×${size})`)
}
