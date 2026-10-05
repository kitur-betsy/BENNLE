import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import { ArrowRight, ArrowUp, ChevronLeft, ChevronRight, Play, Leaf, Recycle, ShieldCheck, Truck } from 'lucide-react'
import { useSettings } from '../store/settings'
import { variants } from '../lib/motion'
import { formatDate } from '../lib/format'
import ContactForm from '../components/shop/ContactForm'
import { useAsync } from '../lib/useAsync'
import { contentApi, productsApi } from '../api/services'
import Reveal from '../components/ui/Reveal'
import Stars from '../components/ui/Stars'
import ProductGrid from '../components/shop/ProductGrid'
import { Spinner } from '../components/ui/States'

// Icon names in content data map to components here (keeps the bundle tree-shaken).
const iconMap = { Leaf, Recycle, ShieldCheck, Truck }

function Hero({ data }) {
  const tagline = useSettings((s) => s.tagline)
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  return (
    <section ref={ref} className="relative h-[80vh] overflow-hidden bg-neutral-900">
      <motion.div style={{ y }} className="absolute inset-0">
        <motion.div variants={variants.image} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="absolute inset-0">
          <img src={data.image} alt={data.alt} className="size-full object-cover object-center" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 30%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.2) 100%)' }} />
        </motion.div>
      </motion.div>
      <div className="container-site relative z-10 flex h-full items-center">
        <motion.div variants={variants.hero} initial="hidden" animate="show" className="max-w-xl text-white">
          <motion.p variants={variants.text} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="text-sm/6 uppercase tracking-widest opacity-80">{data.eyebrow || tagline}</motion.p>
          <motion.h1 variants={variants.text} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="mt-3 text-5xl font-semibold tracking-tight md:text-6xl">{data.title}</motion.h1>
          <motion.p variants={variants.text} initial="hidden" animate="show" transition={{ delay: 0.3 }} className="mt-4 text-base/7 opacity-90 md:text-lg/8">{data.text}</motion.p>
          <div className="mt-8 flex items-center gap-3">
            <motion.div variants={variants.scaleIn} initial="hidden" animate="show" transition={{ delay: 0.4 }}>
              <Link to={data.primaryLink || '/shop'} className="group relative isolate z-10 inline-flex max-w-fit items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-neutral-50 bg-neutral-50 py-2 pl-4 pr-4 text-lg text-neutral-900 shadow-lift backdrop-blur-md transition-colors hover:text-neutral-50 lg:font-semibold">
                <span className="absolute -left-full top-0 -z-10 aspect-square w-full rounded-full bg-emerald-500 transition-all duration-700 group-hover:left-0 group-hover:scale-150" />
                {data.primaryLabel || 'Shop Now'}
                <span className="grid size-8 rotate-45 place-items-center rounded-full border border-neutral-700 text-neutral-800 transition-all duration-300 group-hover:rotate-90 group-hover:border-transparent group-hover:bg-neutral-50"><ArrowUp className="size-4" /></span>
              </Link>
            </motion.div>
            <motion.div variants={variants.slideLeft} initial="hidden" animate="show" transition={{ delay: 0.5 }}>
              <Link to={data.secondaryLink || '/#about'}
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 backdrop-blur transition hover:scale-105 hover:bg-white/10">
                {data.secondaryLabel || 'Learn More'} <Play className="size-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Manifesto({ data }) {
  const [a, b, c] = data.lines
  const [i1, i2, i3] = data.images
  const t = 'font-editorial italic font-semibold tracking-tight text-3xl sm:text-4xl md:text-5xl'
  const chip = 'inline-block bg-white object-cover shadow-xl ring-4 ring-white rounded-2xl'
  return (
    <section className="border-t border-line bg-bg transition-colors duration-300">
      <Reveal variant="blurSlide" className="container-site py-16 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Reveal as="span" variant="slideLeft" index={1} className={t}>{a}</Reveal>
          <Reveal as="img" variant="rotateIn" index={2} src={i1} alt="Model applying serum" className={`${chip} size-10 -rotate-6 sm:size-12 md:size-14`} />
          <Reveal as="span" variant="slideRight" index={3} className={t}>{b}</Reveal>
          <Reveal as="img" variant="rotateIn" index={4} src={i2} alt="Spa mask moment" className={`${chip} size-10 rotate-6 sm:size-12 md:size-14`} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Reveal as="img" variant="scaleUp" index={5} src={i3} alt="Leaf detail" className={`${chip} h-0 w-0 -rotate-3 sm:h-12 sm:w-20 md:h-14 md:w-24`} />
          <Reveal as="span" variant="slideUp" index={6} className={t}>{c}</Reveal>
        </div>
      </Reveal>
    </section>
  )
}

function Collections({ items }) {
  return (
    <section id="collections" className="container-site py-16">
      <Reveal className="mb-8 flex items-end justify-between">
        <div>
          <Reveal as="h2" variant="text" index={1} className="text-3xl font-semibold tracking-tight md:text-4xl">Explore Collections</Reveal>
          <Reveal as="p" variant="text" index={2} className="mt-2 text-muted">Targeted routines for every skin goal.</Reveal>
        </div>
        <Reveal as="div" variant="slideLeft" index={3} className="hidden sm:block">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm transition hover:text-muted">View all <ArrowRight className="size-4" /></Link>
        </Reveal>
      </Reveal>
      <div className="-mx-6 overflow-x-auto px-6 pb-2 md:mx-0 md:overflow-visible md:px-0 md:pb-0">
        <Reveal variant="scaleIn" className="flex w-max gap-4 snap-x snap-mandatory md:h-[464px] md:w-full md:max-w-[1190px] md:snap-none md:gap-[1.375rem] md:rounded-xl2 md:bg-elevated md:p-6 md:shadow-lift">
          {items.map((c, i) => (
            <Reveal key={c.id} variant="blurIn" index={i + 1} className="h-96 w-64 shrink-0 snap-start transition-[flex] duration-500 md:h-auto md:w-auto md:min-w-0 md:flex-1 md:hover:flex-[4]">
              <Link to={`/shop?category=${c.category}`} className="group relative flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-panel bg-neutral-800">
                <img src={c.image} alt={c.title} className="size-full object-cover transition-all duration-500" loading="lazy" />
                <div className="absolute inset-0 flex flex-col justify-end rounded-panel bg-gradient-to-t from-black/70 via-transparent to-transparent p-6 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
                  <h3 className="mb-1 whitespace-nowrap text-xl font-medium tracking-tight text-white">{c.title}</h3>
                  <p className="whitespace-nowrap text-sm text-neutral-200">{c.blurb}</p>
                  <p className="mt-2 whitespace-nowrap text-xs text-neutral-400">{c.series}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

const PAGE = 3

function Featured() {
  const [start, setStart] = useState(0)
  const all = useAsync(() => productsApi.list({ sort: 'rating' }).then((r) => {
    const inStock = r.filter((p) => p.stock > 0)
    const picked = inStock.filter((p) => p.featured)
    return picked.length ? picked : inStock
  }))
  const list = all.data || []
  const shift = (dir) => setStart((s) => (list.length ? (s + dir * PAGE + list.length) % list.length : 0))
  const visible = { ...all, data: all.data && Array.from({ length: Math.min(PAGE, list.length) }, (_, i) => list[(start + i) % list.length]) }
  const nav = 'inline-flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm shadow-lg transition hover:bg-hover'
  return (
    <section id="shop" className="overflow-hidden border-y border-line bg-surface transition-colors duration-300">
      <div className="container-site py-16">
        <Reveal variant="slideUp" className="mb-8 flex items-end justify-between">
          <div>
            <Reveal as="h2" variant="text" index={1} className="text-3xl font-semibold tracking-tight md:text-4xl">Featured Products</Reveal>
            <Reveal as="p" variant="text" index={2} className="mt-2 text-muted">Thoughtful formulas, consciously packaged.</Reveal>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Reveal as="button" variant="scaleIn" index={3} className={nav} onClick={() => shift(-1)} aria-label="Previous products"><ChevronLeft className="size-4" /></Reveal>
            <Reveal as="button" variant="scaleIn" index={4} className={nav} onClick={() => shift(1)} aria-label="Next products"><ChevronRight className="size-4" /></Reveal>
          </div>
        </Reveal>
        <ProductGrid state={visible} />
      </div>
    </section>
  )
}

function Trust({ items }) {
  return (
    <section className="container-site grid gap-8 py-16 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((t, i) => {
        const Icon = iconMap[t.icon] || Leaf
        return (
          <Reveal key={t.title} index={i} variant="slideUp">
            <Icon className="mb-3 size-6 text-accent" />
            <h3 className="font-medium">{t.title}</h3>
            <p className="mt-1 text-sm text-muted">{t.text}</p>
          </Reveal>
        )
      })}
    </section>
  )
}

function Testimonials({ items }) {
  return (
    <section className="border-y border-line bg-surface">
      <div className="container-site grid gap-6 py-16 md:grid-cols-3">
        {items.map((t, i) => (
          <Reveal key={t.id} variant="card" index={i} className="rounded-card border border-line bg-elevated p-6">
            <Stars rating={t.rating} />
            <p className="mt-4 text-sm/6">“{t.text}”</p>
            <p className="mt-4 text-sm font-medium">{t.name}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Journal({ items }) {
  return (
    <section id="journal" className="container-site py-16">
      <Reveal className="mb-8 flex items-end justify-between">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Journal</h2>
        <Link to="/journal" className="inline-flex items-center gap-2 text-sm transition hover:text-muted">Read all <ArrowRight className="size-4" /></Link>
      </Reveal>
      <div className="grid gap-8 md:grid-cols-3">
        {items.map((j, i) => (
          <Reveal as="article" key={j.id} variant="card" index={i} className="group">
            <Link to={`/journal/${j.slug}`}>
              <div className="overflow-hidden rounded-card"><img src={j.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <p className="mt-4 text-xs text-muted">{formatDate(j.date)} · {j.readTime} min read</p>
              <h3 className="mt-1 text-lg font-medium tracking-tight">{j.title}</h3>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function About({ data }) {
  return (
    <section id="about" className="container-site grid items-center gap-10 py-16 md:grid-cols-2 md:gap-16">
      <Reveal variant="image" className="overflow-hidden rounded-panel shadow-lift">
        <img src={data.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
      </Reveal>
      <Reveal variant="slideUp">
        <p className="eyebrow text-accent-strong">{data.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{data.title}</h2>
        {data.text.map((t) => <p key={t} className="mt-4 text-muted">{t}</p>)}
        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
          {data.stats.map((s) => (
            <div key={s.label}><dt className="text-2xl font-semibold md:text-3xl">{s.value}</dt><dd className="mt-1 text-xs text-muted">{s.label}</dd></div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">{data.note}</p>
        <Link to="/shop" className="mt-8 inline-flex items-center gap-2 text-sm font-medium transition hover:text-muted">Shop the range <ArrowRight className="size-4" /></Link>
      </Reveal>
    </section>
  )
}

function Contact() {
  const contact = useSettings((s) => s.contact)
  return (
    <section id="contact" className="border-t border-line bg-surface">
      <div className="container-site grid gap-10 py-16 md:grid-cols-2 md:gap-16">
        <Reveal variant="slideUp">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Get in touch</h2>
          <p className="mt-3 text-muted">Questions about a product or your routine? Our skin advisors reply within a day.</p>
          <ul className="mt-6 space-y-1 text-sm text-muted"><li>{contact.email}</li><li>{contact.phone}</li></ul>
        </Reveal>
        <Reveal variant="card"><ContactForm /></Reveal>
      </div>
    </section>
  )
}

export default function Home() {
  const { data, loading } = useAsync(contentApi.home)
  if (loading && !data) return <div className="container-site py-32"><Spinner /></div>
  if (!data) return null
  const renderers = {
    hero: () => <Hero data={data.hero} />,
    manifesto: () => <Manifesto data={data.manifesto} />,
    collections: () => <Collections items={data.collections} />,
    featured: () => <Featured />,
    about: () => <About data={data.about} />,
    trust: () => <Trust items={data.trust} />,
    testimonials: () => <Testimonials items={data.testimonials} />,
    journal: () => <Journal items={data.journal} />,
    contact: () => <Contact />,
  }
  return <>{data.sections.filter((s) => s.visible && renderers[s.id]).map((s) => <div key={s.id}>{renderers[s.id]()}</div>)}</>
}
