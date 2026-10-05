import { motion, useScroll, useSpring } from 'framer-motion'

// Thin progress bar pinned under the header, driven by page scroll.
export default function ReadingProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  return <motion.div aria-hidden style={{ scaleX }} className="fixed inset-x-0 top-16 z-40 h-0.5 origin-left bg-accent" />
}
