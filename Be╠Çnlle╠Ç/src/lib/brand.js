// Applies the owner's accent colour. Text uses a darker shade so it stays readable (WCAG AA, 4.5:1) on white.
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrastOnWhite = (rgb) => 1.05 / (luminance(rgb) + 0.05)

export function strongShade(hex) {
  let rgb = toRgb(hex)
  for (let i = 0; i < 30 && contrastOnWhite(rgb) < 4.5; i += 1) rgb = rgb.map((v) => v * 0.93)
  return toHex(rgb)
}

export function applyBrand(brand) {
  const hex = brand?.accent
  const root = document.documentElement
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) { root.style.removeProperty('--color-accent'); root.style.removeProperty('--color-accent-strong'); return }
  root.style.setProperty('--color-accent', hex)
  root.style.setProperty('--color-accent-strong', strongShade(hex))
}
