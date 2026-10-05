// Animation presets. The signature motion is blur + fade + translate.
export const ease = [0.25, 0.46, 0.45, 0.94]

const base = (hidden) => ({
  hidden: { opacity: 0, ...hidden },
  show: { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, filter: 'blur(0px)', transition: { duration: 1, ease } },
})

export const variants = {
  fadeIn: base({ y: 40, filter: 'blur(4px)' }),
  slideUp: base({ y: 50, filter: 'blur(3px)' }),
  slideDown: base({ y: -50, filter: 'blur(3px)' }),
  slideLeft: base({ x: -60, filter: 'blur(3px)' }),
  slideRight: base({ x: 60, filter: 'blur(3px)' }),
  scaleIn: base({ scale: 0.8, filter: 'blur(5px)' }),
  blurIn: base({ scale: 1.02, filter: 'blur(8px)' }),
  blurSlide: base({ y: 30, scale: 0.95, filter: 'blur(6px)' }),
  rotateIn: base({ rotate: -5, scale: 0.9, filter: 'blur(3px)' }),
  card: base({ y: 60, scale: 0.95, filter: 'blur(4px)' }),
  text: base({ y: 20, filter: 'blur(2px)' }),
  image: { hidden: { opacity: 0, scale: 1.1, filter: 'blur(5px)' }, show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 1.2, ease } } },
  scaleUp: base({ scale: 1.1, filter: 'blur(4px)' }),
  hero: { hidden: { opacity: 0, y: 80, scale: 0.95, filter: 'blur(6px)' }, show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 1.4, ease } } },
}

export const stagger = (i = 0) => i * 0.1
export const viewport = { once: true, margin: '-60px' }

export const dropdown = {
  hidden: { opacity: 0, y: -10, transition: { duration: 0.2, ease } },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
}
export const drawer = {
  left: { hidden: { x: '-100%' }, show: { x: 0 } },
  right: { hidden: { x: '100%' }, show: { x: 0 } },
  transition: { duration: 0.35, ease },
}
export const toast = {
  hidden: { opacity: 0, x: 80 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease } },
  exit: { opacity: 0, x: 80, transition: { duration: 0.2 } },
}
export const pageTransition = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
}
