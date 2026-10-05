import { motion, useReducedMotion } from 'framer-motion'
import { variants, stagger, viewport } from '../../lib/motion'

// Scroll-reveal wrapper. `variant` is a key of motion.variants; `index` staggers siblings.
// With prefers-reduced-motion the content renders immediately, with no transform or blur.
export default function Reveal({ as = 'div', variant = 'fadeIn', index = 0, className, children, ...rest }) {
  const Tag = motion[as]
  const reduce = useReducedMotion()
  if (reduce) return <Tag className={className} {...rest}>{children}</Tag>
  return (
    <Tag variants={variants[variant]} initial="hidden" whileInView="show" viewport={viewport}
      transition={{ delay: stagger(index) }} className={className} {...rest}>
      {children}
    </Tag>
  )
}
