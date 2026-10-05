import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { journalApi } from '../api/services'
import { formatDate, cn } from '../lib/format'
import { useSettings } from '../store/settings'
import Reveal from '../components/ui/Reveal'
import { Spinner, ErrorState, Empty } from '../components/ui/States'

const issue = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

// Column spans (of 12) cycle so rows alternate wide/narrow: 7+5, then 4+4+4.
const spans = ['lg:col-span-7', 'lg:col-span-5', 'lg:col-span-4', 'lg:col-span-4', 'lg:col-span-4']

export default function Journal() {
  const name = useSettings((s) => s.name)
  const { data, loading, error } = useAsync(journalApi.list)
  const [cat, setCat] = useState('')
  const cats = [...new Set((data || []).map((j) => j.category))]
  const list = (data || []).filter((j) => !cat || j.category === cat)
  const [lead, ...rest] = list

  return (
    <div className="bg-surface">
      <header className="container-site pt-12 text-center md:pt-16">
        <div className="flex items-center justify-between border-y border-fg py-2 text-[11px] uppercase tracking-[0.2em]">
          <span>Skin · Science · Routine</span><span>{issue}</span>
        </div>
        <h1 className="serif py-8 text-6xl tracking-tight md:py-12 md:text-8xl">{name} <em className="italic">Journal</em></h1>
        <p className="mx-auto max-w-md pb-8 text-muted">Science, ingredients and routines, explained without the noise.</p>
        {cats.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 border-t border-line py-5" role="group" aria-label="Filter stories by category">
            {['', ...cats].map((c) => (
              <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
                className={cn('rounded-full border px-4 py-1.5 text-sm transition', cat === c ? 'border-fg bg-fg text-bg' : 'border-line text-muted hover:border-fg hover:text-fg')}>
                {c || 'All stories'}
              </button>
            ))}
          </div>
        )}
      </header>

      {loading && <div className="container-site py-20"><Spinner /></div>}
      {error && <div className="container-site py-20"><ErrorState error={error} /></div>}
      {data && !list.length && <div className="container-site py-20"><Empty>No stories yet.</Empty></div>}

      <div className="container-site pb-20 pt-6">
        {lead && (
          <Reveal as="article" variant="blurIn" className="group mb-14 grid items-center gap-8 lg:grid-cols-12">
            <Link to={`/journal/${lead.slug}`} className="overflow-hidden rounded-2xl lg:col-span-7">
              <img src={lead.image} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </Link>
            <div className="lg:col-span-5">
              <p className="eyebrow text-xs text-accent-strong dark:text-accent">Lead story · {lead.category}</p>
              <h2 className="serif mt-4 text-4xl leading-tight md:text-5xl"><Link to={`/journal/${lead.slug}`} className="hover:underline">{lead.title}</Link></h2>
              <p className="mt-4 text-muted">{lead.excerpt}</p>
              <p className="mt-4 text-xs text-muted">{formatDate(lead.date)} · {lead.readTime} min read</p>
              <Link to={`/journal/${lead.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all">Read the story <ArrowRight className="size-4" /></Link>
            </div>
          </Reveal>
        )}

        {rest.length > 0 && (
          <>
            <div className="mb-8 flex items-center gap-4"><span className="text-xs uppercase tracking-[0.2em] text-muted">More stories</span><div className="flex-1 border-t border-line" /></div>
            <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-12">
              {rest.map((j, i) => {
                const wide = spans[i % spans.length] === 'lg:col-span-7'
                return (
                  <Reveal as="article" key={j.id} variant="card" index={i % 3} className={cn('group', spans[i % spans.length])}>
                    <Link to={`/journal/${j.slug}`}>
                      <div className="overflow-hidden rounded-xl"><img src={j.image} alt="" loading="lazy" className={cn('w-full object-cover transition-transform duration-500 group-hover:scale-105', wide ? 'aspect-[16/10]' : 'aspect-[4/3]')} /></div>
                      <p className="mt-4 text-xs text-muted">{j.category} · {formatDate(j.date)}</p>
                      <h2 className="serif mt-2 text-2xl leading-snug">{j.title}</h2>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{j.excerpt}</p>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
