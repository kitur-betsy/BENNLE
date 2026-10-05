import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useAsync } from '../lib/useAsync'
import { journalApi } from '../api/services'
import { formatDate } from '../lib/format'
import ReadingProgress from '../components/ui/ReadingProgress'
import { Spinner, ErrorState } from '../components/ui/States'

const firstSentence = (t = '') => (t.match(/^.*?[.!?](\s|$)/)?.[0] || t).trim()

function Related({ current }) {
  const { data } = useAsync(() => journalApi.list().then((r) => r.filter((x) => x.slug !== current).slice(0, 3)), [current])
  if (!data?.length) return null
  return (
    <section className="border-t border-line bg-surface">
      <div className="container-site py-14">
        <h2 className="serif mb-8 text-2xl md:text-3xl">Keep reading</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {data.map((j) => (
            <article key={j.id} className="group">
              <Link to={`/journal/${j.slug}`}>
                <div className="overflow-hidden rounded-xl"><img src={j.image} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                <p className="mt-3 text-xs text-muted">{j.category} · {j.readTime} min read</p>
                <h3 className="serif mt-1 text-xl leading-snug">{j.title}</h3>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function JournalPost() {
  const { slug } = useParams()
  const { data: j, loading, error } = useAsync(() => journalApi.bySlug(slug), [slug])
  if (loading) return <Spinner />
  if (error) return (
    <div className="container-site py-20">
      <ErrorState error={error} />
      <Link to="/journal" className="mt-4 block text-center text-sm underline">Back to journal</Link>
    </div>
  )
  const pull = firstSentence(j.body[1])

  return (
    <>
      <ReadingProgress />
      <article>
        <header className="container-site max-w-3xl pb-8 pt-10 text-center md:pt-16">
          <Link to="/journal" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg"><ArrowLeft className="size-4" /> Journal</Link>
          <p className="eyebrow mt-8 text-xs text-accent-strong dark:text-accent">{j.category}</p>
          <h1 className="serif mt-4 text-4xl leading-[1.1] tracking-tight md:text-6xl">{j.title}</h1>
          {j.excerpt && <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{j.excerpt}</p>}
          <p className="mt-6 text-xs text-muted">{formatDate(j.date)} · {j.readTime} min read</p>
        </header>

        <div className="container-site max-w-4xl"><img src={j.image} alt="" className="aspect-[16/9] w-full rounded-2xl object-cover" /></div>

        <div className="container-site py-12 md:py-16">
          <div className="mx-auto max-w-[65ch] space-y-6 text-lg/8">
            {j.body.map((p, i) => (
              <div key={i} className="space-y-6">
                <p className={i === 0 ? 'first-letter:serif first-letter:float-left first-letter:mr-3 first-letter:text-7xl first-letter:leading-[0.8]' : ''}>{p}</p>
                {i === 1 && pull && p.length > pull.length && (
                  <aside aria-hidden className="serif -mx-2 border-y border-line py-8 text-center text-3xl italic leading-snug md:-mx-12 md:text-4xl">“{pull}”</aside>
                )}
              </div>
            ))}
          </div>
          <div className="mx-auto mt-14 flex max-w-[65ch] items-center justify-between border-t border-line pt-8 text-sm">
            <Link to="/journal" className="inline-flex items-center gap-2 font-medium hover:underline"><ArrowLeft className="size-4" /> All stories</Link>
            <Link to="/shop" className="inline-flex items-center gap-2 font-medium hover:underline">Shop the range <ArrowRight className="size-4" /></Link>
          </div>
        </div>
      </article>
      <Related current={j.slug} />
    </>
  )
}
