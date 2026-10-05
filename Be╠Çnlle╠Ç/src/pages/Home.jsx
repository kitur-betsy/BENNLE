import { Link } from 'react-router-dom'
import { useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Leaf, Recycle, ShieldCheck, Truck } from 'lucide-react'
import { useSettings } from '../store/settings'
import { copy as defaultCopy } from '../data/content'
import { formatDate, cn } from '../lib/format'
import ContactForm from '../components/shop/ContactForm'
import { useAsync } from '../lib/useAsync'
import { contentApi, productsApi } from '../api/services'
import Reveal from '../components/ui/Reveal'
import Stars from '../components/ui/Stars'
import Button from '../components/ui/Button'
import ProductCard from '../components/shop/ProductCard'
import { Spinner, Skeleton } from '../components/ui/States'

// Icon names in content data map to components here (keeps the bundle tree-shaken).
const iconMap = { Leaf, Recycle, ShieldCheck, Truck }

const h2 = 'serif text-3xl tracking-tight md:text-5xl'

/* 1 · Hero: split, contained. Serif headline left, tall image right. */
function Hero({ data }) {
  const tagline = useSettings((s) => s.tagline)
  const words = data.title.split(' ')
  const last = words.pop()
  return (
    <section className="container-site grid items-center gap-10 py-10 md:grid-cols-12 md:gap-12 md:py-20">
      <div className="md:col-span-6">
        <Reveal as="p" variant="text" className="eyebrow text-accent-strong">{data.eyebrow || tagline}</Reveal>
        <Reveal as="h1" variant="text" index={1} className="serif mt-4 text-5xl leading-[1.05] tracking-tight md:text-7xl">
          {words.join(' ')} <em className="italic">{last}</em>
        </Reveal>
        <Reveal as="p" variant="text" index={2} className="mt-6 max-w-md text-lg/8 text-muted">{data.text}</Reveal>
        <Reveal variant="text" index={3} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button to={data.primaryLink || '/shop'} size="lg">{data.primaryLabel || 'Shop Now'} <ArrowRight className="size-4" /></Button>
          <Link to={data.secondaryLink || '/#about'} className="text-sm font-medium underline-offset-4 hover:underline">{data.secondaryLabel || 'Learn More'}</Link>
        </Reveal>
      </div>
      <Reveal variant="image" className="md:col-span-6">
        <div className="overflow-hidden rounded-xl2 bg-surface shadow-lift">
          <img src={data.image} alt={data.alt || ''} className="aspect-[4/5] w-full object-cover md:aspect-[5/6]" />
        </div>
      </Reveal>
    </section>
  )
}

/* 2 · Manifesto: centred statement on an inverse band. */
function Manifesto({ data }) {
  const [a, b, c] = data.lines
  const [i1, i2, i3] = data.images
  const t = 'serif italic text-3xl sm:text-4xl md:text-6xl'
  const chip = 'inline-block rounded-2xl object-cover shadow-xl ring-4 ring-inverse-fg/90'
  return (
    <section className="bg-inverse text-inverse-fg">
      <div className="container-site py-20 text-center md:py-28">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <Reveal as="span" variant="slideLeft" index={1} className={t}>{a}</Reveal>
          <Reveal as="img" variant="rotateIn" index={2} src={i1} alt="Model applying serum" className={`${chip} size-10 -rotate-6 sm:size-14 md:size-16`} />
          <Reveal as="span" variant="slideRight" index={3} className={t}>{b}</Reveal>
          <Reveal as="img" variant="rotateIn" index={4} src={i2} alt="Spa mask moment" className={`${chip} size-10 rotate-6 sm:size-14 md:size-16`} />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <Reveal as="img" variant="scaleUp" index={5} src={i3} alt="Leaf detail" className={`${chip} hidden -rotate-3 sm:block sm:h-14 sm:w-24 md:h-16 md:w-28`} />
          <Reveal as="span" variant="slideUp" index={6} className={t}>{c}</Reveal>
        </div>
      </div>
    </section>
  )
}

/* 3 · Collections: contained bento. First tile is large, the rest flow around it. */
function Collections({ items, copy }) {
  return (
    <section id="collections" className="container-site scroll-mt-20 py-16 md:py-24">
      <Reveal className="mb-10 flex items-end justify-between gap-6">
        <div>
          <h2 className={h2}>{copy.collectionsTitle}</h2>
          {copy.collectionsText && <p className="mt-3 text-muted">{copy.collectionsText}</p>}
        </div>
        <Link to="/shop" className="hidden items-center gap-2 text-sm font-medium hover:underline sm:inline-flex">View all <ArrowRight className="size-4" /></Link>
      </Reveal>
      <div className="grid auto-rows-[15rem] gap-4 sm:grid-cols-2 md:auto-rows-[14rem] lg:grid-cols-4">
        {items.map((c, i) => (
          <Reveal key={c.id || c.title} variant="blurIn" index={i % 3}
            className={cn('min-h-0', i === 0 && 'sm:col-span-2 sm:row-span-2 lg:row-span-2')}>
            <Link to={`/shop?category=${c.category}`} className="group relative block size-full overflow-hidden rounded-panel bg-neutral-800">
              <img src={c.image} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-5 text-white">
                <p className="text-[11px] uppercase tracking-widest text-neutral-300">{c.series}</p>
                <h3 className={cn('mt-1 font-medium tracking-tight', i === 0 ? 'text-2xl' : 'text-lg')}>{c.title}</h3>
                <p className="mt-1 text-sm text-neutral-200">{c.blurb}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* 4 · Featured products: full-bleed scroll-snap rail. */
function Featured({ copy }) {
  const rail = useRef(null)
  const all = useAsync(() => productsApi.list({ sort: 'rating' }).then((r) => {
    const inStock = r.filter((p) => p.stock > 0)
    const picked = inStock.filter((p) => p.featured)
    return picked.length ? picked : inStock
  }))
  const scroll = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' })
  const nav = 'grid size-10 place-items-center rounded-full border border-line bg-bg transition hover:bg-hover'
  return (
    <section id="shop" className="scroll-mt-20 border-y border-line bg-surface py-16 md:py-24">
      <div className="container-site mb-10 flex items-end justify-between gap-6">
        <div>
          <h2 className={h2}>{copy.featuredTitle}</h2>
          {copy.featuredText && <p className="mt-3 text-muted">{copy.featuredText}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button className={nav} onClick={() => scroll(-1)} aria-label="Previous products"><ChevronLeft className="size-4" /></button>
          <button className={nav} onClick={() => scroll(1)} aria-label="Next products"><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div ref={rail} tabIndex={0} aria-label="Featured products" className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-pl-6 px-6 pb-2 md:scroll-pl-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] md:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]">
        {all.loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-80 w-64 shrink-0" />)}
        {all.error && <p className="text-sm text-danger">{all.error.message}</p>}
        {all.data?.map((p) => <div key={p.id} className="w-64 shrink-0 snap-start sm:w-72"><ProductCard product={p} dense /></div>)}
      </div>
      <div className="container-site mt-8"><Button to="/shop" variant="outline" size="lg">View all products <ArrowRight className="size-4" /></Button></div>
    </section>
  )
}

/* 5 · About: split, image left, oversized numeric stats. */
function About({ data }) {
  return (
    <section id="about" className="container-site grid scroll-mt-20 items-center gap-10 py-16 md:grid-cols-2 md:gap-20 md:py-24">
      <Reveal variant="image" className="overflow-hidden rounded-panel shadow-lift">
        <img src={data.image} alt="" loading="lazy" className="aspect-[4/5] w-full object-cover" />
      </Reveal>
      <Reveal variant="slideUp">
        <p className="eyebrow text-accent-strong">{data.eyebrow}</p>
        <h2 className={cn(h2, 'mt-3')}>{data.title}</h2>
        {data.text.map((t) => <p key={t} className="mt-5 text-muted">{t}</p>)}
        <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-line pt-8">
          {data.stats.map((s) => (
            <div key={s.label}><dt className="serif text-4xl md:text-5xl">{s.value}</dt><dd className="mt-2 text-xs text-muted">{s.label}</dd></div>
          ))}
        </dl>
        {data.note && <p className="mt-4 text-xs text-muted">{data.note}</p>}
        <Link to="/shop" className="mt-8 inline-flex items-center gap-2 text-sm font-medium hover:underline">Shop the range <ArrowRight className="size-4" /></Link>
      </Reveal>
    </section>
  )
}

/* 6 · Routine: three numbered steps on an accent tint. */
function Routine({ data }) {
  return (
    <section className="bg-accent/10">
      <div className="container-site py-16 md:py-24">
        <Reveal className="mx-auto max-w-xl text-center">
          <p className="eyebrow text-accent-strong dark:text-accent">{data.eyebrow}</p>
          <h2 className={cn(h2, 'mt-3')}>{data.title}</h2>
          <p className="mt-4 text-muted">{data.text}</p>
        </Reveal>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-0">
          {data.steps.map((s, i) => (
            <Reveal as="li" key={s.title} variant="slideUp" index={i} className="md:border-l md:border-fg/15 md:px-8 md:first:border-l-0 md:first:pl-0">
              <span className="serif text-6xl italic text-accent-strong dark:text-accent" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm/6 text-muted">{s.text}</p>
              <Link to={`/shop?category=${s.category}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:underline">{s.cta} <ArrowRight className="size-4" /></Link>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* 7 · Trust: compact 4-up row with hairline dividers. */
function Trust({ items }) {
  return (
    <section className="border-y border-line bg-surface">
      <ul className="container-site grid sm:grid-cols-2 lg:grid-cols-4">
        {items.map((t, i) => {
          const Icon = iconMap[t.icon] || Leaf
          return (
            <Reveal as="li" key={t.title} index={i} variant="fadeIn" className="border-line px-0 py-8 sm:px-6 lg:border-l lg:first:border-l-0 lg:first:pl-0">
              <Icon className="mb-3 size-6 text-accent-strong dark:text-accent" aria-hidden />
              <h3 className="font-medium">{t.title}</h3>
              <p className="mt-1 text-sm text-muted">{t.text}</p>
            </Reveal>
          )
        })}
      </ul>
    </section>
  )
}

/* 8 · Testimonials: one large centred quote, manual dots. */
function Testimonials({ items }) {
  const [i, setI] = useState(0)
  if (!items.length) return null
  const t = items[Math.min(i, items.length - 1)]
  return (
    <section className="container-site py-20 text-center md:py-28" aria-roledescription="carousel" aria-label="Customer reviews">
      <Stars rating={t.rating} className="justify-center" />
      <blockquote key={t.id || i} aria-live="polite" className="serif mx-auto mt-6 max-w-3xl text-3xl italic leading-snug md:text-5xl">“{t.text}”</blockquote>
      <p className="mt-6 text-sm font-medium">{t.name}</p>
      {items.length > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {items.map((x, n) => (
            <button key={x.id || n} onClick={() => setI(n)} aria-label={`Show review ${n + 1} of ${items.length}`} aria-current={n === i}
              className={cn('h-2 rounded-full transition-all', n === i ? 'w-8 bg-fg' : 'w-2 bg-line hover:bg-muted')} />
          ))}
        </div>
      )}
    </section>
  )
}

/* 9 · Journal: asymmetric, one lead story plus two stacked. */
function Journal({ items, copy }) {
  const [lead, ...rest] = items
  if (!lead) return null
  return (
    <section id="journal" className="scroll-mt-20 border-y border-line bg-surface py-16 md:py-24">
      <div className="container-site">
        <Reveal className="mb-10 flex items-end justify-between gap-6">
          <h2 className={h2}>{copy.journalTitle}</h2>
          <Link to="/journal" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">Read all <ArrowRight className="size-4" /></Link>
        </Reveal>
        <div className="grid gap-8 lg:grid-cols-5">
          <Reveal as="article" variant="card" className="group lg:col-span-3">
            <Link to={`/journal/${lead.slug}`}>
              <div className="overflow-hidden rounded-card"><img src={lead.image} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <p className="mt-4 text-xs text-muted">{lead.category} · {formatDate(lead.date)} · {lead.readTime} min read</p>
              <h3 className="serif mt-2 text-2xl md:text-3xl">{lead.title}</h3>
              <p className="mt-2 max-w-xl text-sm text-muted">{lead.excerpt}</p>
            </Link>
          </Reveal>
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {rest.map((j, n) => (
              <Reveal as="article" key={j.id} variant="card" index={n + 1} className="group">
                <Link to={`/journal/${j.slug}`} className="flex gap-4">
                  <img src={j.image} alt="" loading="lazy" className="size-24 shrink-0 rounded-card object-cover" />
                  <div>
                    <p className="text-xs text-muted">{j.category} · {j.readTime} min</p>
                    <h3 className="mt-1 font-medium leading-snug tracking-tight group-hover:underline">{j.title}</h3>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* 10 · Contact: split with form. */
function Contact({ copy }) {
  const contact = useSettings((s) => s.contact)
  return (
    <section id="contact" className="container-site grid scroll-mt-20 gap-10 py-16 md:grid-cols-2 md:gap-20 md:py-24">
      <Reveal variant="slideUp">
        <h2 className={h2}>{copy.contactTitle}</h2>
        {copy.contactText && <p className="mt-4 max-w-sm text-muted">{copy.contactText}</p>}
        <ul className="mt-6 space-y-1 text-sm text-muted"><li>{contact.email}</li><li>{contact.phone}</li></ul>
      </Reveal>
      <Reveal variant="card"><ContactForm /></Reveal>
    </section>
  )
}

export default function Home() {
  const { data, loading } = useAsync(contentApi.home)
  if (loading && !data) return <div className="container-site py-32"><Spinner /></div>
  if (!data) return null
  const copy = { ...defaultCopy, ...data.copy }
  const renderers = {
    hero: () => <Hero data={data.hero} />,
    manifesto: () => <Manifesto data={data.manifesto} />,
    collections: () => <Collections items={data.collections} copy={copy} />,
    featured: () => <Featured copy={copy} />,
    about: () => <About data={data.about} />,
    routine: () => data.routine && <Routine data={data.routine} />,
    trust: () => <Trust items={data.trust} />,
    testimonials: () => <Testimonials items={data.testimonials} />,
    journal: () => <Journal items={data.journal} copy={copy} />,
    contact: () => <Contact copy={copy} />,
  }
  return <div className="overflow-x-clip">{data.sections.filter((s) => s.visible && renderers[s.id]).map((s) => <div key={s.id}>{renderers[s.id]()}</div>)}</div>
}
